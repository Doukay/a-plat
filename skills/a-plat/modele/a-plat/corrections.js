// Corrections de la page d'À plat : préparer des corrections situées (« A2 > Bouton « Demander » »),
// les garder, les copier pour les coller dans la conversation avec Claude.
//
// Ce fichier se branche sur le moteur (moteur.js) :
//   - il remplace APlatMoteur.surElementTouche, appelée quand la personne touche un élément
//     d'un vrai écran en mode « Corriger » (jamais depuis une vignette ni depuis l'existant) ;
//   - il ajoute le panneau des corrections à la vue d'un écran seul, et le compte à la barre,
//     chaque fois que le moteur redessine la vue (événement « a-plat:vue »).
// Il ne modifie jamais les fichiers, n'envoie rien et ne charge rien. Tout texte (celui de la
// personne comme le nom d'un élément) passe par textContent, jamais par du HTML.
(function () {
  "use strict";

  var Moteur = window.APlatMoteur;
  var Logique = window.APlatLogique;
  if (!Moteur || !Logique) return;

  var creer = Moteur.creer;
  var DUREE_DU_MESSAGE = 6000; // millisecondes, pour le petit message « Correction ajoutée »
  var MARGE_AU_BORD = 12;      // pixels gardés entre l'élément choisi et la saisie

  // ------------------------------------------------------------ l'état

  var projet = "";
  var liste = [];             // les corrections : { code, element, texte }
  var stockRefuse = false;    // le navigateur n'a pas voulu garder la liste
  var panneau = null;         // le panneau de la vue d'un écran seul, ou null
  var saisie = null;          // le champ ouvert en bas de la fenêtre, ou null
  var message = null;         // le petit message qui suit une correction ajoutée
  var minuteurDuMessage = null;
  var versLePanneau = false;  // la personne a suivi le lien de la barre : on montre le panneau

  function cle() {
    return "corrections:" + projet;
  }

  function estCorrection(valeur) {
    return typeof valeur === "object" && valeur !== null &&
      typeof valeur.code === "string" && typeof valeur.element === "string" &&
      typeof valeur.texte === "string" && valeur.texte.trim() !== "";
  }

  // Relit la liste gardée. Une entrée mal formée est ignorée, pas fatale.
  function charger() {
    var brut = Moteur.lireStock(cle());
    liste = Array.isArray(brut)
      ? brut.filter(estCorrection).map(function (c) { return { code: c.code, element: c.element, texte: c.texte }; })
      : [];
  }

  function enregistrer() {
    stockRefuse = !Moteur.garderStock(cle(), liste.map(function (c) {
      return { code: c.code, element: c.element, texte: c.texte };
    }));
  }

  function pluriel(n, un, plusieurs) {
    return n + " " + (n > 1 ? plusieurs : un);
  }

  // ------------------------------------------------------------ la barre

  var lienDeLaBarre = null;

  // L'écran vers lequel mène le compte : l'écran affiché, sinon le premier du plan.
  function codeDuLien(plan) {
    var corps = document.querySelector(".ecran-corps");
    if (corps) return corps.getAttribute("data-code");
    var premier = plan && plan.ecrans && plan.ecrans[0];
    return premier && typeof premier.code === "string" && premier.code !== "" ? premier.code : null;
  }

  function mettreLaBarreAJour(plan) {
    var code = plan && liste.length > 0 ? codeDuLien(plan) : null;
    if (!code) {
      if (lienDeLaBarre && lienDeLaBarre.parentNode) lienDeLaBarre.parentNode.removeChild(lienDeLaBarre);
      return;
    }
    if (!lienDeLaBarre) {
      lienDeLaBarre = creer("a", "barre-corrections");
      lienDeLaBarre.addEventListener("click", function (evenement) {
        var cible = lienDeLaBarre.getAttribute("href");
        if (panneau && cible === "#ecran/" + encodeURIComponent(panneau.code)) {
          // Déjà sur cet écran : l'adresse ne change pas, on va seulement au panneau.
          evenement.preventDefault();
          allerAuPanneau();
        } else {
          versLePanneau = true;
        }
      });
    }
    lienDeLaBarre.textContent = "Corrections : " + liste.length;
    lienDeLaBarre.setAttribute("href", "#ecran/" + encodeURIComponent(code));
    var titre = document.querySelector(".barre .titre");
    if (titre && lienDeLaBarre.parentNode !== titre) titre.appendChild(lienDeLaBarre);
  }

  function allerAuPanneau() {
    if (!panneau) return;
    panneau.racine.scrollIntoView();
    panneau.titre.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------ le panneau de la vue d'un écran

  function construirePanneau(code) {
    var racine = creer("section", "corrections");
    racine.setAttribute("aria-labelledby", "corrections-titre");
    var titre = creer("h3", "corrections-titre");
    titre.id = "corrections-titre";
    titre.setAttribute("tabindex", "-1");
    racine.appendChild(titre);
    racine.appendChild(creer("p", "consigne",
      "En mode « Corriger », touchez un élément de l'écran : une correction se prépare, déjà située. " +
      "Les corrections de tous les écrans sont réunies ici."));
    var etat = creer("p", "corrections-etat");
    etat.setAttribute("role", "status");
    racine.appendChild(etat);
    var contenu = creer("div", "corrections-contenu");
    racine.appendChild(contenu);
    return { racine: racine, titre: titre, etat: etat, contenu: contenu, code: code, confirme: false };
  }

  function bouton(libelle, classe, action) {
    var element = creer("button", "bouton " + classe, libelle);
    element.setAttribute("type", "button");
    element.addEventListener("click", action);
    return element;
  }

  function direDansLePanneau(texte) {
    if (panneau) panneau.etat.textContent = texte || "";
  }

  // Redessine tout le contenu du panneau d'après la liste.
  function redessinerLePanneau() {
    if (!panneau) return;
    var contenu = panneau.contenu;
    contenu.textContent = "";
    var n = liste.length;
    panneau.titre.textContent = n > 0 ? "Corrections (" + n + ")" : "Corrections";

    if (stockRefuse) {
      contenu.appendChild(creer("p", "corrections-note",
        "Le navigateur refuse de garder les corrections : elles restent seulement tant que cette page est ouverte. " +
        "Copiez-les avant de la fermer."));
    }

    if (n === 0) {
      contenu.appendChild(creer("p", "corrections-vide", "Aucune correction pour l'instant."));
      return;
    }

    var ol = creer("ol", "corrections-liste");
    liste.forEach(function (correction, i) {
      var li = creer("li", "correction");
      var numero = creer("span", "correction-numero", String(i + 1));
      numero.setAttribute("aria-hidden", "true");
      li.appendChild(numero);
      var corps = creer("div", "correction-corps");
      corps.appendChild(creer("p", "correction-ou", correction.code + " > " + correction.element));
      var texte = creer("p", "correction-texte", correction.texte);
      texte.id = "correction-texte-" + (i + 1);
      corps.appendChild(texte);
      var retirer = bouton("Retirer", "bouton-simple", function () {
        retirerUne(i);
      });
      retirer.setAttribute("aria-describedby", texte.id);
      corps.appendChild(retirer);
      li.appendChild(corps);
      ol.appendChild(li);
    });
    contenu.appendChild(ol);

    if (panneau.confirme) {
      var demande = creer("div", "corrections-confirmation");
      demande.setAttribute("role", "group");
      demande.setAttribute("aria-label", "Confirmer le vidage de la liste");
      demande.appendChild(creer("p", "", n === 1
        ? "Retirer la seule correction de la liste ?"
        : "Retirer les " + n + " corrections de la liste ?"));
      var choix = creer("div", "corrections-actions");
      var non = bouton("Non, les garder", "bouton-simple", function () {
        panneau.confirme = false;
        redessinerLePanneau();
        direDansLePanneau("");
      });
      choix.appendChild(bouton("Oui, tout retirer", "bouton-principal", toutRetirer));
      choix.appendChild(non);
      demande.appendChild(choix);
      contenu.appendChild(demande);
      non.focus({ preventScroll: true });
      return;
    }

    var actions = creer("div", "corrections-actions");
    actions.appendChild(bouton("Copier pour Claude", "bouton-principal", copier));
    actions.appendChild(bouton("Tout retirer", "bouton-simple", function () {
      panneau.confirme = true;
      direDansLePanneau("");
      redessinerLePanneau();
    }));
    contenu.appendChild(actions);
  }

  function toutMettreAJour(texteDEtat) {
    redessinerLePanneau();
    direDansLePanneau(texteDEtat);
    mettreLaBarreAJour(Moteur.planCourant());
  }

  function retirerUne(i) {
    liste.splice(i, 1);
    enregistrer();
    if (panneau) panneau.confirme = false;
    toutMettreAJour("Correction retirée.");
    if (panneau) panneau.titre.focus({ preventScroll: true });
  }

  function toutRetirer() {
    liste = [];
    enregistrer();
    if (panneau) panneau.confirme = false;
    toutMettreAJour("La liste est vide. Vous pouvez préparer le prochain lot de corrections.");
    if (panneau) panneau.titre.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------ copier

  // Si le navigateur refuse la copie, le texte s'affiche dans un champ, déjà sélectionné.
  function montrerLeTexteACopier(depuis, texte) {
    if (depuis !== panneau) return;
    var secours = creer("div", "corrections-secours");
    var champ = document.createElement("textarea");
    champ.className = "corrections-texte-a-copier";
    champ.setAttribute("readonly", "readonly");
    champ.setAttribute("aria-label", "Texte des corrections à copier");
    champ.setAttribute("rows", String(Math.min(10, texte.split("\n").length + 1)));
    champ.value = texte;
    secours.appendChild(champ);
    panneau.contenu.appendChild(secours);
    direDansLePanneau("Le navigateur n'a pas permis la copie. Le texte est sélectionné ci-dessous : " +
      "copiez-le (Ctrl+C, ou « Copier » dans le menu), puis collez-le dans la conversation avec Claude.");
    champ.focus();
    champ.select();
    try {
      champ.setSelectionRange(0, champ.value.length);
    } catch (erreur) {
      // select() a déjà fait le nécessaire
    }
  }

  function copier() {
    var depuis = panneau;
    var texte = Logique.texteCorrections(liste, projet);
    var ancien = depuis.contenu.querySelector(".corrections-secours");
    if (ancien) ancien.parentNode.removeChild(ancien);

    function reussi() {
      if (depuis === panneau) {
        direDansLePanneau("Corrections copiées. Collez-les maintenant dans la conversation avec Claude. " +
          "Une fois appliquées par Claude, videz la liste avec « Tout retirer ».");
      }
    }
    function refuse() {
      montrerLeTexteACopier(depuis, texte);
    }
    try {
      var presse = navigator.clipboard;
      if (presse && typeof presse.writeText === "function") {
        Promise.resolve(presse.writeText(texte)).then(reussi, refuse);
      } else {
        refuse();
      }
    } catch (erreur) {
      refuse();
    }
  }

  // ------------------------------------------------------------ la saisie, en bas de la fenêtre

  function cadreDeLEcran(code) {
    var cadres = document.querySelectorAll(".ecran-corps .volet-proposition iframe.cadre");
    for (var i = 0; i < cadres.length; i++) {
      if (cadres[i].getAttribute("data-code") === code) return cadres[i];
    }
    return null;
  }

  // Dit à l'écran d'entourer (ou de ne plus entourer) le dernier élément touché.
  function envoyerLeChoix(code, actif) {
    var cadre = cadreDeLEcran(code);
    if (!cadre || !cadre.contentWindow) return;
    try {
      cadre.contentWindow.postMessage({ aPlat: 1, type: "choisi", actif: actif }, "*");
    } catch (erreur) {
      // cadre déjà retiré de la page
    }
  }

  function mesurerLaSaisie() {
    if (!saisie) return;
    document.documentElement.style.setProperty("--saisie-hauteur", saisie.racine.offsetHeight + "px");
  }

  // Fait défiler la page pour que l'élément choisi reste visible au-dessus de la saisie.
  function garderEnVue() {
    if (!saisie) return;
    var cadre = cadreDeLEcran(saisie.code);
    if (!cadre) return;
    var boite = cadre.getBoundingClientRect();
    var position = saisie.position || {};
    var haut = boite.top + (typeof position.haut === "number" ? position.haut : 0);
    var bas = boite.top + (typeof position.bas === "number" ? position.bas : Math.min(boite.height, 120));
    var limite = window.innerHeight - saisie.racine.offsetHeight - MARGE_AU_BORD;
    var decalage = 0;
    if (bas > limite) decalage = bas - limite;
    else if (haut < MARGE_AU_BORD) decalage = haut - MARGE_AU_BORD;
    // Un élément plus haut que la place libre : on garde son haut visible.
    if (decalage > 0 && haut - decalage < MARGE_AU_BORD) decalage = haut - MARGE_AU_BORD;
    if (decalage !== 0) window.scrollBy(0, decalage);
  }

  function auClavier(evenement) {
    if (evenement.key === "Escape") {
      evenement.preventDefault();
      fermerLaSaisie();
    }
  }

  function sAuRedimensionnement() {
    mesurerLaSaisie();
    garderEnVue();
  }

  function construireLaSaisie() {
    var racine = creer("form", "correction-saisie");
    racine.setAttribute("novalidate", "novalidate");
    var dedans = creer("div", "correction-saisie-dedans");
    var etiquette = creer("label", "correction-etiquette");
    etiquette.setAttribute("for", "correction-champ");
    var champ = document.createElement("textarea");
    champ.id = "correction-champ";
    champ.className = "correction-champ";
    champ.setAttribute("rows", "2");
    champ.setAttribute("placeholder", "Ce qui doit changer, en une ou deux phrases");
    var alerte = creer("p", "correction-erreur");
    alerte.setAttribute("role", "alert");
    var actions = creer("div", "correction-actions");
    var ajouter = creer("button", "bouton bouton-principal", "Ajouter");
    ajouter.setAttribute("type", "submit");
    var annuler = bouton("Annuler", "bouton-simple", function () {
      fermerLaSaisie();
    });
    actions.appendChild(ajouter);
    actions.appendChild(annuler);
    dedans.appendChild(etiquette);
    dedans.appendChild(champ);
    dedans.appendChild(alerte);
    dedans.appendChild(actions);
    racine.appendChild(dedans);

    racine.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      ajouterLaCorrection();
    });
    // Entrée passe à la ligne ; Ctrl+Entrée (ou Cmd+Entrée) ajoute.
    champ.addEventListener("keydown", function (evenement) {
      if (evenement.key === "Enter" && (evenement.ctrlKey || evenement.metaKey)) {
        evenement.preventDefault();
        ajouterLaCorrection();
      }
    });
    return { racine: racine, etiquette: etiquette, champ: champ, alerte: alerte, code: "", nom: "", position: null };
  }

  function ouvrirLaSaisie(code, nom, position) {
    if (!panneau || panneau.code !== code) return; // seuls les vrais écrans de la vue courante comptent
    retirerLeMessage();
    var nouvelle = !saisie;
    if (nouvelle) saisie = construireLaSaisie();
    saisie.code = code;
    saisie.nom = nom || "Élément";
    saisie.position = position || null;
    saisie.etiquette.textContent = "Corriger : " + saisie.code + " > " + saisie.nom;
    saisie.alerte.textContent = "";
    if (nouvelle) {
      direDansLePanneau("");
      document.body.appendChild(saisie.racine);
      document.body.classList.add("correction-ouverte");
      document.addEventListener("keydown", auClavier);
      window.addEventListener("resize", sAuRedimensionnement);
    }
    mesurerLaSaisie();
    saisie.champ.focus({ preventScroll: true });
    envoyerLeChoix(code, true);
    garderEnVue();
  }

  function fermerLaSaisie() {
    if (!saisie) return;
    var code = saisie.code;
    if (saisie.racine.parentNode) saisie.racine.parentNode.removeChild(saisie.racine);
    saisie = null;
    document.body.classList.remove("correction-ouverte");
    document.documentElement.style.removeProperty("--saisie-hauteur");
    document.removeEventListener("keydown", auClavier);
    window.removeEventListener("resize", sAuRedimensionnement);
    envoyerLeChoix(code, false);
  }

  function ajouterLaCorrection() {
    if (!saisie) return;
    var texte = saisie.champ.value.trim(); // seuls les bouts sont nettoyés
    if (texte === "") {
      saisie.alerte.textContent = "Écrivez la correction avant de l'ajouter.";
      saisie.champ.focus({ preventScroll: true });
      return;
    }
    liste.push({ code: saisie.code, element: saisie.nom, texte: texte });
    enregistrer();
    fermerLaSaisie();
    if (panneau) panneau.confirme = false;
    var numero = liste.length;
    toutMettreAJour("Correction n° " + numero + " ajoutée.");
    montrerLeMessage(numero);
  }

  // ------------------------------------------------------------ le petit message

  function retirerLeMessage() {
    if (minuteurDuMessage) window.clearTimeout(minuteurDuMessage);
    minuteurDuMessage = null;
    if (message && message.parentNode) message.parentNode.removeChild(message);
    message = null;
  }

  // Sur un téléphone, le panneau est sous l'écran : on confirme l'ajout en bas de la fenêtre,
  // sauf si le panneau est déjà sous les yeux.
  function montrerLeMessage(numero) {
    if (!panneau) return;
    var boite = panneau.racine.getBoundingClientRect();
    if (boite.top < window.innerHeight - 80 && boite.bottom > 80) return;
    retirerLeMessage();
    message = creer("div", "correction-message");
    message.setAttribute("role", "status");
    message.appendChild(creer("span", "", "Correction n° " + numero + " ajoutée."));
    var voir = creer("button", "bouton bouton-simple", "Voir la liste");
    voir.setAttribute("type", "button");
    voir.addEventListener("click", function () {
      retirerLeMessage();
      allerAuPanneau();
    });
    message.appendChild(voir);
    document.body.appendChild(message);
    minuteurDuMessage = window.setTimeout(retirerLeMessage, DUREE_DU_MESSAGE);
  }

  // ------------------------------------------------------------ branchement sur le moteur

  // Appelée par le moteur à chaque fois que la vue est redessinée.
  function decorer() {
    try {
      fermerLaSaisie();
      retirerLeMessage();
      panneau = null;
      var plan = Moteur.planCourant();
      if (!plan) {
        liste = [];
        mettreLaBarreAJour(null);
        return;
      }
      projet = typeof plan.projet === "string" ? plan.projet : "";
      charger();
      var corps = document.querySelector(".ecran-corps");
      if (corps) {
        panneau = construirePanneau(corps.getAttribute("data-code"));
        corps.appendChild(panneau.racine);
        redessinerLePanneau();
      }
      mettreLaBarreAJour(plan);
      if (versLePanneau && panneau) allerAuPanneau();
      versLePanneau = false;
    } catch (erreur) {
      // Les corrections sont une aide : si elles échouent, la page reste utilisable.
    }
  }

  Moteur.surElementTouche = function (code, nom, position) {
    try {
      ouvrirLaSaisie(code, nom, position);
    } catch (erreur) {
      // idem : jamais de page cassée à cause d'un toucher
    }
  };

  document.addEventListener("a-plat:vue", decorer);
  decorer(); // le moteur a déjà dessiné la première vue avant que ce fichier soit chargé
})();
