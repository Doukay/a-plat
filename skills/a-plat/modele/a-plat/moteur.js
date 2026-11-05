// Moteur de la page d'À plat. Il lit window.A_PLAT (le fichier plan.js) et l'affiche.
// Il ne modifie jamais les fichiers. Tout texte venu du plan passe par textContent.
//
// Organisation, pour y ajouter des vues :
//   1. les petits outils (créer un élément, écrire du texte, pluriel) ;
//   2. le stockage (lireStock, garderStock) ;
//   3. la lecture du plan (absent, cassé, refusé ou bon) ;
//   4. une fonction par vue, et le tableau VUES qui les relie à leur adresse ;
//   5. afficher(adresse), qui choisit la vue et marque la barre.
(function () {
  "use strict";

  // ------------------------------------------------------------ 1. petits outils

  // Crée un élément avec une classe et un texte. Le texte passe par textContent.
  function creer(balise, classe, texte) {
    var element = document.createElement(balise);
    if (classe) element.className = classe;
    if (texte !== undefined && texte !== null) element.textContent = texte;
    return element;
  }

  function estTexte(valeur) {
    return typeof valeur === "string" && valeur.length > 0;
  }

  // ------------------------------------------------------------ 2. stockage

  // Le navigateur peut refuser le stockage (fenêtre privée, réglage, ouverture de fichier).
  // Dans ce cas, les valeurs restent en mémoire pour la durée de la visite.
  var PREFIXE_DU_STOCK = "a-plat:";
  var memoire = {};

  // Renvoie la valeur gardée sous cette clé, ou null s'il n'y en a pas.
  function lireStock(cle) {
    try {
      var brut = window.localStorage.getItem(PREFIXE_DU_STOCK + cle);
      if (brut !== null) return JSON.parse(brut);
    } catch (erreur) {
      // refusé ou illisible : on se rabat sur la mémoire
    }
    return Object.prototype.hasOwnProperty.call(memoire, cle) ? memoire[cle] : null;
  }

  // Garde une valeur. Renvoie true si le navigateur l'a rangée, false s'il l'a refusée
  // (la valeur reste alors en mémoire).
  function garderStock(cle, valeur) {
    memoire[cle] = valeur;
    try {
      window.localStorage.setItem(PREFIXE_DU_STOCK + cle, JSON.stringify(valeur));
      return true;
    } catch (erreur) {
      return false;
    }
  }

  // ------------------------------------------------------------ 3. lecture du plan

  // Renvoie { statut, plan, erreurs } avec statut "absent", "casse", "refuse" ou "bon".
  function lirePlan() {
    if (!window.APlatLogique) return { statut: "moteur" };
    // Une erreur de syntaxe dans plan.js ne laisse aucun détail sur file:// : on la
    // reconnaît à l'absence de window.A_PLAT alors que le fichier a bien été trouvé.
    if (window.A_PLAT === undefined) {
      return { statut: window.APlatPlanAbsent ? "absent" : "casse" };
    }
    var erreurs = window.APlatLogique.validerPlan(window.A_PLAT);
    if (erreurs.length > 0) return { statut: "refuse", erreurs: erreurs };
    return { statut: "bon", plan: window.A_PLAT };
  }

  // ------------------------------------------------------------ 4. les vues

  var ETATS = {
    "existe": { libelle: "Existe", pluriel: "existent", singulier: "existe" },
    "a-completer": { libelle: "À compléter", pluriel: "à compléter", singulier: "à compléter" },
    "manque": { libelle: "Manque", pluriel: "manquent", singulier: "manque" },
    "prevue": { libelle: "Prévue", pluriel: "prévues", singulier: "prévue" }
  };
  var ORDRE_DES_ETATS = ["existe", "a-completer", "manque", "prevue"];

  var DEMANDE_DE_LISTE = "« dresse l'état des lieux des pages de ce projet »";

  function titreDeVue(texte) {
    return creer("h2", "titre-de-vue", texte);
  }

  function message(titre, paragraphes) {
    var carte = creer("section", "message");
    carte.appendChild(titreDeVue(titre));
    paragraphes.forEach(function (texte) {
      carte.appendChild(creer("p", "", texte));
    });
    return carte;
  }

  function dessinerProblemeDePlan(lecture) {
    if (lecture.statut === "absent") {
      return message("plan.js est introuvable", [
        "La page lit le fichier plan.js, qui doit se trouver à côté de index.html, dans le dossier des maquettes. Il n'y est pas.",
        "Demandez à Claude de le créer en lançant /a-plat, ou remettez le fichier à sa place, puis rechargez la page."
      ]);
    }
    if (lecture.statut === "casse") {
      return message("plan.js contient une erreur", [
        "La page n'arrive pas à lire ce fichier : une virgule, une accolade ou un guillemet est sans doute mal placé.",
        "Demandez à Claude de le corriger, ou lancez le contrôle d'À plat (verifier.mjs) sur ce dossier pour trouver l'endroit. Puis rechargez la page."
      ]);
    }
    if (lecture.statut === "moteur") {
      return message("Il manque un fichier de la page", [
        "Le fichier a-plat/logique.js n'a pas été chargé.",
        "Demandez à Claude de remettre le dossier a-plat en place, puis rechargez la page."
      ]);
    }
    var carte = message("Le plan contient des erreurs", [
      "La page lit plan.js, mais son contenu ne peut pas être affiché tel quel. Voici ce qu'il faut corriger :"
    ]);
    var liste = creer("ul", "erreurs");
    lecture.erreurs.forEach(function (erreur) {
      liste.appendChild(creer("li", "", erreur));
    });
    carte.appendChild(liste);
    carte.appendChild(creer("p", "", "Demandez à Claude de corriger ces points (collez-lui cette liste), puis rechargez la page."));
    return carte;
  }

  // « 2 existent · 1 à compléter · 1 manque » : les états à zéro ne sont pas écrits.
  function resumeDesEtats(lignes) {
    var comptes = {};
    lignes.forEach(function (ligne) {
      comptes[ligne.etat] = (comptes[ligne.etat] || 0) + 1;
    });
    return ORDRE_DES_ETATS.filter(function (etat) {
      return comptes[etat] > 0;
    }).map(function (etat) {
      var nombre = comptes[etat];
      return nombre + " " + (nombre > 1 ? ETATS[etat].pluriel : ETATS[etat].singulier);
    }).join(" · ");
  }

  function dessinerLigne(ligne) {
    var element = creer("li", "ligne");
    element.setAttribute("data-etat", ligne.etat);

    var tete = creer("div", "tete");
    tete.appendChild(creer("h4", "page", estTexte(ligne.page) ? ligne.page : "Page sans nom"));
    tete.appendChild(creer("span", "etat", ETATS[ligne.etat].libelle));
    element.appendChild(tete);

    if (estTexte(ligne.raison)) element.appendChild(creer("p", "raison", ligne.raison));

    var infos = creer("p", "infos");
    if (estTexte(ligne.source)) infos.appendChild(creer("span", "", "Source : " + ligne.source));
    var codes = (Array.isArray(ligne.ecrans) ? ligne.ecrans : []).filter(estTexte);
    if (codes.length > 0) {
      infos.appendChild(creer("span", "", (codes.length > 1 ? "Écrans : " : "Écran : ") + codes.join(", ")));
    }
    if (ligne.aConfirmer === true) infos.appendChild(creer("span", "a-confirmer", "à essayer pour confirmer"));
    if (infos.childNodes.length > 0) element.appendChild(infos);
    return element;
  }

  function dessinerEtatDesLieux(conteneur, plan) {
    conteneur.appendChild(titreDeVue("État des lieux"));
    var lignes = plan.etatDesLieux;

    if (lignes.length === 0) {
      conteneur.appendChild(message("Aucune page n'est encore listée", [
        "L'état des lieux est vide pour l'instant.",
        "Demandez à Claude de le dresser : " + DEMANDE_DE_LISTE + "."
      ]));
      return;
    }

    conteneur.appendChild(creer("p", "consigne",
      "Voici les pages du projet et l'état de chacune. Si une ligne est fausse, ou si une page manque à la liste, dites-le à Claude dans la conversation."));
    var resume = creer("p", "resume", resumeDesEtats(lignes));
    resume.id = "resume";
    conteneur.appendChild(resume);

    // Les pages sont rangées par groupe, dans l'ordre où les groupes apparaissent.
    var noms = [];
    var parGroupe = {};
    lignes.forEach(function (ligne) {
      var nom = estTexte(ligne.groupe) ? ligne.groupe : "Autres pages";
      if (!Object.prototype.hasOwnProperty.call(parGroupe, nom)) {
        parGroupe[nom] = [];
        noms.push(nom);
      }
      parGroupe[nom].push(ligne);
    });
    noms.forEach(function (nom) {
      var groupe = creer("section", "groupe");
      groupe.appendChild(creer("h3", "", nom));
      var liste = creer("ul", "lignes");
      parGroupe[nom].forEach(function (ligne) {
        liste.appendChild(dessinerLigne(ligne));
      });
      groupe.appendChild(liste);
      conteneur.appendChild(groupe);
    });
  }

  // ------------------------------------------------------------ 4b. les écrans
  //
  // Chaque écran s'affiche dans un cadre (iframe). La page ne peut pas lire dans un cadre :
  // c'est le petit script relais.js, chargé par l'écran, qui lui écrit (postMessage).
  // Ne sont écoutés que les messages marqués { aPlat: 1 } qui viennent d'un cadre créé ici.

  var DELAI_ECRAN_INTROUVABLE = 3000; // millisecondes sans message pret
  var HAUTEUR_DE_VIGNETTE = 400;      // hauteur visée d'une vignette, pour garder une rangée lisible
  var LARGEUR_DE_VIGNETTE = 480;      // largeur la plus grande d'une vignette
  var LARGEUR_PAR_DEFAUT = 390;
  var HAUTEUR_PAR_DEFAUT = 844;
  var HAUTEUR_MAXIMALE_D_UN_CADRE = 20000;

  var TYPES_DE_NOTE = {
    "decision": "Décision",
    "a-trancher": "À trancher",
    "a-verifier": "À vérifier",
    "a-coder": "À coder",
    "source": "Source"
  };

  var MODES = [
    { valeur: "corriger", libelle: "Corriger", aide: "Toucher un élément de l'écran ne l'active pas : cela le désigne pour une correction." },
    { valeur: "essayer", libelle: "Essayer le parcours", aide: "Les liens et les boutons de l'écran mènent à l'écran suivant, comme dans l'application." }
  ];

  var DEMANDE_DE_DESSIN = "« dessine les premiers écrans »";

  // L'état de la visite : le mode choisi vaut pour tous les écrans, d'une vue à l'autre.
  var mode = "corriger";
  var cadres = [];         // un par cadre affiché : { cadre, boite, code, chemin, vignette, lecture, pret, minuteur, voile }
  var observateur = null;  // il lance le compte à rebours « introuvable » quand un cadre est près de l'écran
  var zoneDuLien = null;   // la ligne où la vue d'un écran seul dit qu'un lien ne mène nulle part

  function estObjet(valeur) {
    return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
  }

  // Un fichier du plan ne sert que dans son dossier (ecrans/ ou actuel/). On refuse tout ce qui
  // peut en sortir : « .. », une adresse complète (https:, file:…), une barre au début, une
  // barre oblique inverse, et les mêmes écrits avec des %. Renvoie le fichier, ou null.
  function fichierSur(valeur) {
    if (!estTexte(valeur)) return null;
    var versions = [valeur];
    try {
      versions.push(decodeURIComponent(valeur));
    } catch (erreur) {
      return null;
    }
    for (var i = 0; i < versions.length; i++) {
      var version = versions[i];
      if (version.indexOf("..") !== -1) return null;
      if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(version)) return null;
      if (/^[\/\\]/.test(version) || version.indexOf("\\") !== -1) return null;
      if (/[\u0000-\u001f]/.test(version)) return null;
    }
    return valeur;
  }

  function dimension(valeur, parDefaut) {
    return typeof valeur === "number" && isFinite(valeur) && valeur >= 100 && valeur <= 5000 ? Math.round(valeur) : parDefaut;
  }

  function nomCourt(valeur) {
    return estTexte(valeur) ? valeur : "Sans titre";
  }

  function lienDeLEcran(code) {
    return "#ecran/" + encodeURIComponent(code);
  }

  function nettoyerLesCadres() {
    cadres.forEach(function (entree) {
      if (entree.minuteur) window.clearTimeout(entree.minuteur);
    });
    cadres = [];
    if (observateur) observateur.disconnect();
    observateur = null;
    zoneDuLien = null;
  }

  // ---- le cadre d'un écran

  function entreeDeLaSource(source) {
    if (!source) return null;
    for (var i = 0; i < cadres.length; i++) {
      if (cadres[i].cadre.contentWindow === source) return cadres[i];
    }
    return null;
  }

  function envoyerLeMode(entree) {
    // Les vignettes et l'actuel ne servent qu'à regarder : leurs touchers ne font rien.
    var valeur = entree.vignette || entree.lecture ? "corriger" : mode;
    try {
      entree.cadre.contentWindow.postMessage({ aPlat: 1, type: "mode", mode: valeur }, "*");
    } catch (erreur) {
      // cadre déjà retiré de la page
    }
  }

  function montrerEcranIntrouvable(entree) {
    if (entree.pret || entree.voile) return;
    var voile = creer("div", "cadre-manque");
    voile.appendChild(creer("p", "cadre-manque-titre", "Écran introuvable : " + entree.chemin));
    voile.appendChild(creer("p", "", "Demandez à Claude de recréer ce fichier, ou de retirer cet écran du plan."));
    entree.voile = voile;
    entree.boite.classList.add("introuvable");
    entree.boite.appendChild(voile);
  }

  function lancerLeDelai(entree) {
    if (entree.pret || entree.minuteur) return;
    entree.minuteur = window.setTimeout(function () {
      entree.minuteur = null;
      montrerEcranIntrouvable(entree);
    }, DELAI_ECRAN_INTROUVABLE);
  }

  // Le délai ne commence que quand le cadre est près de l'écran : un cadre paresseux, hors
  // de la vue, n'est pas encore chargé et ne doit pas être pris pour un fichier absent.
  function surveiller(entree) {
    if (typeof window.IntersectionObserver !== "function") {
      lancerLeDelai(entree);
      return;
    }
    if (!observateur) {
      observateur = new window.IntersectionObserver(function (observations) {
        observations.forEach(function (observation) {
          if (!observation.isIntersecting) return;
          observateur.unobserve(observation.target);
          for (var i = 0; i < cadres.length; i++) {
            if (cadres[i].boite === observation.target) lancerLeDelai(cadres[i]);
          }
        });
      }, { rootMargin: "200px" });
    }
    observateur.observe(entree.boite);
  }

  // Construit la boîte d'un cadre. config : code, titre, chemin (déjà vérifié), largeur, hauteur,
  // vignette (réduit, paresseux, intouchable), lecture (affiché pour comparer seulement).
  function fabriquerCadre(config) {
    var boite = creer("div", "cadre-boite");
    var cadre = document.createElement("iframe");
    cadre.className = "cadre";
    cadre.setAttribute("data-code", config.code);
    cadre.setAttribute("title", config.code + " · " + config.titre);

    if (config.vignette) {
      var echelle = Math.min(1, HAUTEUR_DE_VIGNETTE / config.hauteur, LARGEUR_DE_VIGNETTE / config.largeur);
      boite.style.width = Math.round(config.largeur * echelle) + "px";
      boite.style.height = Math.round(config.hauteur * echelle) + "px";
      cadre.style.width = config.largeur + "px";
      cadre.style.height = config.hauteur + "px";
      cadre.style.transform = "scale(" + echelle + ")";
      cadre.setAttribute("tabindex", "-1");
      cadre.setAttribute("loading", "lazy");
    } else {
      cadre.style.height = config.hauteur + "px";
    }
    cadre.setAttribute("src", config.chemin);
    boite.appendChild(cadre);

    var entree = {
      cadre: cadre, boite: boite, code: config.code, chemin: config.chemin,
      vignette: Boolean(config.vignette), lecture: Boolean(config.lecture),
      pret: false, minuteur: null, voile: null
    };
    cadres.push(entree);
    surveiller(entree);
    return boite;
  }

  // La place d'un fichier refusé : une phrase à la place du cadre.
  function boiteRefusee(fichier, dossier, taille) {
    var boite = creer("div", "cadre-boite");
    if (taille) {
      boite.style.width = taille.largeur + "px";
      boite.style.height = taille.hauteur + "px";
    }
    var montre = String(fichier).length > 80 ? String(fichier).slice(0, 79) + "…" : String(fichier);
    boite.appendChild(creer("p", "cadre-refuse",
      "Fichier refusé : « " + montre + " » doit se trouver dans le dossier " + dossier + "/, sans « .. » ni adresse complète."));
    return boite;
  }

  // ---- ce que dit un écran

  function surPret(entree, donnee) {
    entree.pret = true;
    if (entree.minuteur) {
      window.clearTimeout(entree.minuteur);
      entree.minuteur = null;
    }
    if (entree.voile) {
      if (entree.voile.parentNode) entree.voile.parentNode.removeChild(entree.voile);
      entree.voile = null;
      entree.boite.classList.remove("introuvable");
    }
    envoyerLeMode(entree);
    if (!entree.vignette && typeof donnee.hauteur === "number" && isFinite(donnee.hauteur) && donnee.hauteur > 0) {
      entree.cadre.style.height = Math.min(Math.ceil(donnee.hauteur), HAUTEUR_MAXIMALE_D_UN_CADRE) + "px";
    }
  }

  // L'écran du plan vers lequel mène un lien (« A2-fiche.html », « ./A2-fiche.html#haut »…), ou null.
  function ecranDuLien(plan, vers) {
    var chemin = vers.split("#")[0].split("?")[0];
    if (!chemin || /^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(chemin)) return null;
    try {
      chemin = decodeURIComponent(chemin);
    } catch (erreur) {
      // on garde le texte tel quel
    }
    var sansPoint = chemin.replace(/^(\.\/)+/, "");
    var nom = chemin.slice(chemin.lastIndexOf("/") + 1);
    return window.APlatLogique.ecranParFichier(plan, sansPoint) || window.APlatLogique.ecranParFichier(plan, nom);
  }

  function surLien(vers) {
    var ecran = ecranDuLien(window.A_PLAT, vers);
    if (ecran && estTexte(ecran.code)) {
      window.location.hash = lienDeLEcran(ecran.code);
      return;
    }
    if (zoneDuLien) {
      var montre = vers.length > 80 ? vers.slice(0, 79) + "…" : vers;
      zoneDuLien.textContent = "Le lien « " + montre + " » ne mène à aucun écran du plan : on reste ici.";
    }
  }

  window.addEventListener("message", function (evenement) {
    var donnee = evenement.data;
    if (!donnee || typeof donnee !== "object" || donnee.aPlat !== 1 || typeof donnee.type !== "string") return;
    var entree = entreeDeLaSource(evenement.source); // un message qui ne vient pas d'un de nos cadres est ignoré
    if (!entree) return;

    if (donnee.type === "pret") {
      surPret(entree, donnee);
    } else if (donnee.type === "element") {
      if (entree.vignette || entree.lecture || typeof donnee.nom !== "string") return;
      // Où l'élément se trouve dans le cadre (facultatif) : la page s'en sert pour le garder en vue.
      var position = {};
      if (typeof donnee.haut === "number" && isFinite(donnee.haut)) position.haut = donnee.haut;
      if (typeof donnee.bas === "number" && isFinite(donnee.bas)) position.bas = donnee.bas;
      window.APlatMoteur.surElementTouche(entree.code, donnee.nom.slice(0, 200), position);
    } else if (donnee.type === "lien") {
      if (entree.vignette || entree.lecture || mode !== "essayer" || typeof donnee.vers !== "string") return;
      surLien(donnee.vers);
    }
  });

  // Appelée quand la personne touche un élément en mode « Corriger » : (code de l'écran, nom
  // de l'élément, position { haut, bas } dans le cadre si l'écran l'a dite). Elle ne fait rien
  // ici : corrections.js la remplace.
  function surElementTouche() {}

  function changerLeMode(nouveau) {
    mode = nouveau;
    cadres.forEach(function (entree) {
      if (entree.pret) envoyerLeMode(entree);
    });
  }

  // ---- les notes d'une rangée

  function dessinerNotes(rangee) {
    var notes = (Array.isArray(rangee.notes) ? rangee.notes : []).filter(estObjet);
    if (notes.length === 0) return null;
    var liste = creer("ul", "notes");
    liste.setAttribute("aria-label", "Notes de la rangée " + rangee.id);
    notes.forEach(function (note) {
      var element = creer("li", "note");
      element.setAttribute("data-type", String(note.type));
      var tete = creer("div", "note-tete");
      tete.appendChild(creer("span", "note-type", TYPES_DE_NOTE[note.type] || "Note"));
      if (estTexte(note.date)) tete.appendChild(creer("span", "note-date", note.date));
      element.appendChild(tete);
      var corps = creer("p", "note-texte");
      if (estTexte(note.ancien)) {
        corps.appendChild(creer("s", "note-ancien", note.ancien));
        corps.appendChild(document.createTextNode(" "));
      }
      if (estTexte(note.texte)) corps.appendChild(document.createTextNode(note.texte));
      element.appendChild(corps);
      liste.appendChild(element);
    });
    return liste;
  }

  // ---- la vue d'ensemble

  function dessinerVignette(ecran) {
    var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
    var hauteur = dimension(ecran.hauteur, HAUTEUR_PAR_DEFAUT);
    var echelle = Math.min(1, HAUTEUR_DE_VIGNETTE / hauteur, LARGEUR_DE_VIGNETTE / largeur);
    var taille = { largeur: Math.round(largeur * echelle), hauteur: Math.round(hauteur * echelle) };

    var element = creer("div", "vignette");
    element.setAttribute("data-code", ecran.code);
    element.style.width = taille.largeur + "px";

    var fichier = fichierSur(ecran.fichier);
    if (fichier) {
      element.appendChild(fabriquerCadre({
        code: ecran.code, titre: nomCourt(ecran.titre), chemin: "ecrans/" + fichier,
        largeur: largeur, hauteur: hauteur, vignette: true
      }));
    } else {
      element.appendChild(boiteRefusee(ecran.fichier, "ecrans", taille));
    }

    // Un vrai lien, qui couvre toute la vignette (voir .vignette-lien::after dans le style).
    var lien = creer("a", "vignette-lien");
    lien.setAttribute("href", lienDeLEcran(ecran.code));
    var ligneDuCode = creer("span", "vignette-ligne");
    ligneDuCode.appendChild(creer("span", "vignette-code", ecran.code));
    if (ecran.statut === "valide") ligneDuCode.appendChild(creer("span", "badge-valide", "Validé"));
    lien.appendChild(ligneDuCode);
    lien.appendChild(creer("span", "vignette-titre", nomCourt(ecran.titre)));
    element.appendChild(lien);
    return element;
  }

  function dessinerEnsemble(conteneur, plan) {
    conteneur.appendChild(titreDeVue("Vue d'ensemble"));
    if (plan.ecrans.length === 0) {
      conteneur.appendChild(message("Aucun écran n'est encore dessiné", [
        "La vue d'ensemble se remplira quand les premiers écrans existeront.",
        "Demandez à Claude de les dessiner : " + DEMANDE_DE_DESSIN + "."
      ]));
    } else {
      conteneur.appendChild(creer("p", "consigne",
        "Chaque rangée montre ses écrans, puis ses notes. Touchez un écran pour l'ouvrir en grand."));
    }

    plan.rangees.forEach(function (rangee) {
      var section = creer("section", "rangee");
      section.setAttribute("data-rangee", rangee.id);

      var titre = creer("h3", "rangee-titre");
      titre.appendChild(creer("span", "rangee-id", rangee.id));
      if (estTexte(rangee.titre)) {
        titre.appendChild(document.createTextNode(" "));
        titre.appendChild(creer("span", "rangee-nom", rangee.titre));
      }
      section.appendChild(titre);

      var corps = creer("div", "rangee-corps");
      var ecrans = plan.ecrans.filter(function (ecran) {
        return ecran.rangee === rangee.id;
      });
      if (ecrans.length === 0) {
        corps.appendChild(creer("p", "rangee-vide", "Aucun écran dans cette rangée."));
      } else {
        var ligne = creer("div", "ecrans-ligne");
        ligne.setAttribute("tabindex", "0");
        ligne.setAttribute("role", "group");
        ligne.setAttribute("aria-label", "Écrans de la rangée " + rangee.id);
        ecrans.forEach(function (ecran) {
          ligne.appendChild(dessinerVignette(ecran));
        });
        corps.appendChild(ligne);
      }
      var notes = dessinerNotes(rangee);
      if (notes) corps.appendChild(notes);
      section.appendChild(corps);
      conteneur.appendChild(section);
    });
  }

  // ---- l'écran seul

  function creerVolet(classe, titre, largeur) {
    var volet = creer("section", "volet " + classe);
    volet.style.width = largeur + "px";
    if (titre) volet.appendChild(creer("h3", "volet-titre", titre));
    return volet;
  }

  // L'existant : une image, ou une page redessinée affichée comme un écran. On choisit d'après
  // l'extension du fichier ; à défaut, d'après l'origine.
  function dessinerActuel(ecran, largeur, hauteur) {
    var actuel = ecran.actuel;
    var redessine = actuel.origine === "redessine";
    var volet = creerVolet("volet-actuel", redessine ? "Redessiné d'après le code" : "Capture de l'existant", largeur);

    var fichier = fichierSur(actuel.fichier);
    if (!fichier) {
      volet.appendChild(boiteRefusee(actuel.fichier, "actuel", null));
      return volet;
    }
    var chemin = fichier.indexOf("actuel/") === 0 ? fichier : "actuel/" + fichier;
    var nom = chemin.toLowerCase().split(/[?#]/)[0];
    var estUnePage = /\.html?$/.test(nom) || (!/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/.test(nom) && redessine);

    if (estUnePage) {
      volet.appendChild(fabriquerCadre({
        code: ecran.code, titre: nomCourt(ecran.titre) + " (existant)", chemin: chemin,
        largeur: largeur, hauteur: hauteur, lecture: true
      }));
    } else {
      var image = document.createElement("img");
      image.className = "actuel-image";
      image.setAttribute("src", chemin);
      image.setAttribute("alt", "Capture de l'existant pour l'écran " + ecran.code + " : " + nomCourt(ecran.titre));
      // Une image absente ou illisible : une phrase à sa place, qui dit le fichier et quoi faire.
      image.addEventListener("error", function () {
        var manque = creer("div", "actuel-manque");
        manque.appendChild(creer("p", "actuel-manque-titre", "Capture introuvable : " + chemin));
        manque.appendChild(creer("p", "", "Demandez à Claude de refaire cette capture, ou de retirer l'existant de cet écran dans le plan."));
        if (image.parentNode) image.parentNode.replaceChild(manque, image);
      });
      volet.appendChild(image);
    }
    return volet;
  }

  function dessinerVoisin(ecran, sens) {
    var lien = creer("a", "voisin voisin-" + (sens === "precedent" ? "precedent" : "suivant"));
    lien.setAttribute("href", lienDeLEcran(ecran.code));
    lien.appendChild(creer("span", "voisin-sens", sens === "precedent" ? "Écran précédent" : "Écran suivant"));
    lien.appendChild(creer("span", "voisin-nom", ecran.code + " · " + nomCourt(ecran.titre)));
    return lien;
  }

  function dessinerEcran(conteneur, plan, code) {
    var ecrans = plan.ecrans;
    if (ecrans.length === 0) {
      var vide = message("Aucun écran n'est encore dessiné", [
        "Il n'y a rien à montrer ici pour l'instant.",
        "Demandez à Claude de les dessiner : " + DEMANDE_DE_DESSIN + "."
      ]);
      vide.appendChild(creer("a", "lien-retour", "Retour à la vue d'ensemble")).setAttribute("href", "#ensemble");
      conteneur.appendChild(vide);
      return;
    }

    // « #ecran » sans code : le premier écran du plan.
    var position = 0;
    if (code !== "") {
      position = -1;
      for (var i = 0; i < ecrans.length; i++) {
        if (ecrans[i].code === code) position = i;
      }
    }
    if (position === -1) {
      var inconnu = message("Cet écran n'existe pas", ["Le plan ne contient aucun écran avec le code « " + code + " »."]);
      inconnu.appendChild(creer("a", "lien-retour", "Retour à la vue d'ensemble")).setAttribute("href", "#ensemble");
      conteneur.appendChild(inconnu);
      return;
    }
    var ecran = ecrans[position];
    var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
    var hauteur = dimension(ecran.hauteur, HAUTEUR_PAR_DEFAUT);

    var entete = creer("div", "ecran-entete");
    entete.appendChild(creer("span", "ecran-code", ecran.code));
    if (ecran.statut === "valide") entete.appendChild(creer("span", "badge-valide", "Validé"));
    entete.appendChild(creer("h2", "titre-de-vue", nomCourt(ecran.titre)));
    conteneur.appendChild(entete);
    conteneur.appendChild(creer("p", "consigne",
      "Pour corriger dans la conversation, commencez par le code de l'écran : « " + ecran.code + " : change le titre »."));
    // Valider passe par la conversation, jamais par un bouton de la page.
    conteneur.appendChild(creer("p", "consigne",
      "Pour valider cet écran, écrivez « " + ecran.code + " validé » dans la conversation avec Claude. " +
      "Utilisez le code affiché ici : il peut changer si les écrans sont réorganisés."));

    // Le mode : ce que fait un toucher dans l'écran.
    var choix = creer("div", "mode");
    choix.setAttribute("role", "group");
    choix.setAttribute("aria-label", "Ce que fait un toucher dans l'écran");
    var aide = creer("p", "consigne mode-aide");
    var boutons = [];
    function montrerLeMode() {
      boutons.forEach(function (bouton) {
        bouton.element.setAttribute("aria-pressed", bouton.valeur === mode ? "true" : "false");
      });
      MODES.forEach(function (possible) {
        if (possible.valeur === mode) aide.textContent = possible.aide;
      });
    }
    MODES.forEach(function (possible) {
      var bouton = creer("button", "", possible.libelle);
      bouton.setAttribute("type", "button");
      bouton.addEventListener("click", function () {
        changerLeMode(possible.valeur);
        montrerLeMode();
      });
      boutons.push({ valeur: possible.valeur, element: bouton });
      choix.appendChild(bouton);
    });
    montrerLeMode();
    conteneur.appendChild(choix);
    conteneur.appendChild(aide);

    zoneDuLien = creer("p", "lien-sans-ecran");
    zoneDuLien.setAttribute("role", "status");
    conteneur.appendChild(zoneDuLien);

    // L'actuel (s'il y en a un) et la proposition : côte à côte quand la place le permet.
    var comparaison = creer("div", "comparaison");
    var aUnActuel = estObjet(ecran.actuel) && estTexte(ecran.actuel.fichier);
    if (aUnActuel) comparaison.appendChild(dessinerActuel(ecran, largeur, hauteur));

    var proposition = creerVolet("volet-proposition", aUnActuel ? "Proposition" : "", largeur);
    var fichier = fichierSur(ecran.fichier);
    if (fichier) {
      proposition.appendChild(fabriquerCadre({
        code: ecran.code, titre: nomCourt(ecran.titre), chemin: "ecrans/" + fichier,
        largeur: largeur, hauteur: hauteur
      }));
    } else {
      proposition.appendChild(boiteRefusee(ecran.fichier, "ecrans", null));
    }
    comparaison.appendChild(proposition);
    // Le corps de la vue : les écrans, et à côté d'eux (ou dessous) le panneau des corrections,
    // que corrections.js y ajoute.
    var corps = creer("div", "ecran-corps");
    corps.setAttribute("data-code", ecran.code);
    corps.appendChild(comparaison);
    conteneur.appendChild(corps);

    // Précédent et suivant, dans l'ordre des écrans du plan.
    var voisins = creer("div", "voisins");
    voisins.setAttribute("role", "navigation");
    voisins.setAttribute("aria-label", "Autres écrans");
    if (position > 0) voisins.appendChild(dessinerVoisin(ecrans[position - 1], "precedent"));
    if (position < ecrans.length - 1) voisins.appendChild(dessinerVoisin(ecrans[position + 1], "suivant"));
    if (voisins.childNodes.length > 0) conteneur.appendChild(voisins);
  }

  // Une vue : son adresse (le mot après #), son nom dans la barre et sa fonction de dessin.
  // dessiner(conteneur, plan, reste) ; `reste` est ce qui suit le mot dans l'adresse
  // (le code d'écran pour #ecran/A2, sinon une chaîne vide).
  var VUES = {
    etat: { nom: "État des lieux", dessiner: dessinerEtatDesLieux },
    ensemble: { nom: "Vue d'ensemble", dessiner: dessinerEnsemble },
    ecran: { nom: "Écrans", dessiner: dessinerEcran }
  };

  // ------------------------------------------------------------ 5. afficher

  // "#ecran/A2" devient { vue: "ecran", reste: "A2" }. Une adresse inconnue donne null.
  function lireAdresse(adresse) {
    var texte = String(adresse || "").replace(/^#/, "");
    var coupe = texte.indexOf("/");
    var vue = coupe === -1 ? texte : texte.slice(0, coupe);
    var reste = coupe === -1 ? "" : texte.slice(coupe + 1);
    if (!Object.prototype.hasOwnProperty.call(VUES, vue)) return null;
    var decode = reste;
    try {
      decode = decodeURIComponent(reste);
    } catch (erreur) {
      // on garde le texte tel quel
    }
    return { vue: vue, reste: decode };
  }

  function marquerLaBarre(vue, plan) {
    var liens = document.querySelectorAll("nav a[data-vue]");
    for (var i = 0; i < liens.length; i++) {
      var lien = liens[i];
      if (lien.getAttribute("data-vue") === vue) lien.setAttribute("aria-current", "page");
      else lien.removeAttribute("aria-current");
      // « Écrans » mène au premier écran du plan, quand il y en a un.
      if (lien.getAttribute("data-vue") === "ecran") {
        var premier = plan && plan.ecrans && plan.ecrans[0];
        lien.setAttribute("href", premier && estTexte(premier.code) ? "#ecran/" + encodeURIComponent(premier.code) : "#ecran");
      }
    }
  }

  function nomDuProjet(lecture) {
    var plan = lecture.plan || window.A_PLAT;
    return plan && estTexte(plan.projet) ? plan.projet : "";
  }

  function afficher(adresse) {
    var lue = lireAdresse(adresse);
    if (!lue) {
      lue = { vue: "etat", reste: "" };
      // Adresse inconnue : on la remplace par #etat sans ajouter de pas dans l'historique.
      try {
        window.history.replaceState(null, "", "#etat");
      } catch (erreur) {
        // sans importance
      }
    }

    var conteneur = document.getElementById("vue");
    var lecture = lirePlan();
    var projet = nomDuProjet(lecture);
    document.getElementById("projet").textContent = projet;
    document.title = projet ? projet + " · À plat" : "À plat";
    marquerLaBarre(lue.vue, lecture.plan);

    conteneur.textContent = "";
    nettoyerLesCadres();
    document.body.setAttribute("data-vue", lue.vue);
    try {
      if (lecture.statut !== "bon") conteneur.appendChild(dessinerProblemeDePlan(lecture));
      else VUES[lue.vue].dessiner(conteneur, lecture.plan, lue.reste);
    } catch (erreur) {
      // Jamais de page blanche : on dit ce qui s'est passé.
      conteneur.textContent = "";
      var carte = message("La page n'a pas réussi à afficher ce plan", [
        "Demandez à Claude de relire plan.js. Détail pour lui : " + (erreur && erreur.message ? erreur.message : "erreur inconnue") + "."
      ]);
      conteneur.appendChild(carte);
    }
    // Dit aux autres fichiers de la page (corrections.js) que la vue vient d'être redessinée.
    try {
      document.dispatchEvent(new CustomEvent("a-plat:vue"));
    } catch (erreur) {
      // un navigateur sans CustomEvent : la vue reste affichée, sans corrections
    }
  }

  // surElementTouche est appelée par la page à travers cet objet, pour qu'on puisse la remplacer.
  // planCourant : le plan quand il est lisible, sinon null. creer : le petit outil du moteur.
  window.APlatMoteur = {
    afficher: afficher,
    lireStock: lireStock,
    garderStock: garderStock,
    surElementTouche: surElementTouche,
    modeCourant: function () { return mode; },
    planCourant: function () {
      var lecture = lirePlan();
      return lecture.statut === "bon" ? lecture.plan : null;
    },
    creer: creer
  };

  window.addEventListener("hashchange", function () {
    afficher(window.location.hash);
  });
  afficher(window.location.hash);
})();
