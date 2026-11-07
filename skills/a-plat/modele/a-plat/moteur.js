// Moteur de la page d'À plat. Il lit window.A_PLAT (le fichier plan.js) et l'affiche.
// Il ne modifie jamais les fichiers. Tout texte venu du plan passe par textContent.
//
// Organisation, pour y ajouter des vues :
//   1. les petits outils (créer un élément, écrire du texte, pluriel) ;
//   2. le stockage (lireStock, garderStock) ;
//   3. la lecture du plan (absent, cassé, refusé ou bon) ;
//   4. une fonction par vue, et le tableau VUES qui les relie à leur adresse ;
//      les vues des écrans vont du plus large au plus serré : la planche (#ensemble),
//      une rangée (#rangee/A), un écran seul (#ecran/A2) ;
//   5. la barre du haut : le fil, la recherche, les liens des vues ;
//   6. afficher(adresse), qui choisit la vue et met la barre à jour.
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

  function estObjet(valeur) {
    return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
  }

  function aLaCle(objet, cle) {
    return Object.prototype.hasOwnProperty.call(objet, cle);
  }

  // « 1 écran », « 3 écrans ».
  function pluriel(nombre, un, plusieurs) {
    return nombre + " " + (nombre > 1 ? plusieurs : un);
  }

  // Le texte en minuscules et sans accents, pour chercher « ecran » dans « Écran ».
  function sansAccents(texte) {
    var resultat = String(texte);
    if (typeof resultat.normalize === "function") resultat = resultat.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return resultat.toLowerCase();
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
    return aLaCle(memoire, cle) ? memoire[cle] : null;
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

  // La clé d'un réglage de la page pour ce dossier de maquettes et ce projet :
  // « finition:/C:/projets/maquettes/:Prêtoutil ». Le chemin du dossier sépare deux copies
  // des maquettes d'un même projet (le dossier, sans index.html).
  function cleDuDossier(nom, plan) {
    var dossier = String(window.location.pathname || "").replace(/index\.html?$/i, "");
    return nom + ":" + dossier + ":" + (plan && typeof plan.projet === "string" ? plan.projet : "");
  }

  // Lit un réglage sous sa clé ; s'il n'y est pas, sous l'ancienne clé, sans le dossier
  // (« finition:Prêtoutil »), et le range sous la nouvelle : un pliage ou un choix déjà
  // retenu n'est pas perdu.
  function lireAvecLAncienneCle(nom, plan) {
    var cle = cleDuDossier(nom, plan);
    var valeur = lireStock(cle);
    if (valeur !== null) return valeur;
    var ancienne = lireStock(nom + ":" + (plan && typeof plan.projet === "string" ? plan.projet : ""));
    if (ancienne !== null) garderStock(cle, ancienne);
    return ancienne;
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
    var erreurs = window.APlatLogique.validerPlan(window.A_PLAT, { pourLaPage: true });
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

  function lienRetour(carte) {
    carte.appendChild(creer("a", "lien-retour", "Retour à la vue d'ensemble")).setAttribute("href", "#ensemble");
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
      if (!aLaCle(parGroupe, nom)) {
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

  // ------------------------------------------------------------ 4b. les cadres des écrans
  //
  // Chaque écran s'affiche dans un cadre (iframe). La page ne peut pas lire dans un cadre :
  // c'est le petit script relais.js, chargé par l'écran, qui lui écrit (postMessage).
  // Ne sont écoutés que les messages marqués { aPlat: 1 } qui viennent d'un cadre créé ici.

  var DELAI_ECRAN_INTROUVABLE = 3000; // millisecondes sans message pret
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
  var cadres = [];         // un par cadre affiché : { cadre, boite, code, chemin, vignette, lecture, echelle, suit, pret, minuteur, voile }
  var observateur = null;  // il lance le compte à rebours « introuvable » quand un cadre est près de l'écran
  var zoneDuLien = null;   // la ligne où la vue d'un écran seul dit qu'un lien ne mène nulle part

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

  function lienDeLaRangee(id) {
    return "#rangee/" + encodeURIComponent(id);
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
  // Sur la planche, « près de l'écran » tient compte du zoom et du déplacement.
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
  // lecture (affiché pour comparer seulement), et pour une vignette (réduite, paresseuse,
  // intouchable) : vignette, echelle (1 = vraie taille), suit (la hauteur suit le message pret).
  function fabriquerCadre(config) {
    var boite = creer("div", "cadre-boite");
    var cadre = document.createElement("iframe");
    cadre.className = "cadre";
    cadre.setAttribute("data-code", config.code);
    cadre.setAttribute("title", config.code + " · " + config.titre);
    var echelle = typeof config.echelle === "number" && config.echelle > 0 ? config.echelle : 1;

    if (config.vignette) {
      boite.style.width = Math.round(config.largeur * echelle) + "px";
      boite.style.height = Math.round(config.hauteur * echelle) + "px";
      cadre.style.width = config.largeur + "px";
      cadre.style.height = config.hauteur + "px";
      if (echelle !== 1) cadre.style.transform = "scale(" + echelle + ")";
      cadre.setAttribute("tabindex", "-1");
      cadre.setAttribute("loading", "lazy");
    } else {
      cadre.style.height = config.hauteur + "px";
    }
    // La finition voyage dans l'adresse du cadre : relais.js l'applique dès son démarrage.
    // L'actuel n'en reçoit pas : il garde le vrai style du projet.
    cadre.setAttribute("src", config.lecture ? config.chemin : avecLaFinition(config.chemin));
    // relais.js est à la fin de l'écran : le navigateur peut peindre une première image avant
    // lui, donc avant la finition. Le cadre reste caché jusqu'à son message pret, qui ne part
    // qu'une fois la finition posée : on ne voit jamais un écran dans la mauvaise finition.
    cadre.style.visibility = "hidden";
    boite.appendChild(cadre);

    var entree = {
      cadre: cadre, boite: boite, code: config.code, chemin: config.chemin,
      vignette: Boolean(config.vignette), lecture: Boolean(config.lecture),
      echelle: echelle, suit: Boolean(config.vignette && config.suit), hauteur: config.hauteur,
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

  // L'écran du plan en vignette, à l'échelle voulue. suit : sa hauteur suit le message pret,
  // pour le montrer en entier ; sinon il garde la hauteur écrite dans le plan.
  function cadreReduit(ecran, echelle, suit) {
    var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
    var hauteur = dimension(ecran.hauteur, HAUTEUR_PAR_DEFAUT);
    var fichier = fichierSur(ecran.fichier);
    if (!fichier) {
      return boiteRefusee(ecran.fichier, "ecrans", { largeur: Math.round(largeur * echelle), hauteur: Math.round(hauteur * echelle) });
    }
    return fabriquerCadre({
      code: ecran.code, titre: nomCourt(ecran.titre), chemin: "ecrans/" + fichier,
      largeur: largeur, hauteur: hauteur, vignette: true, echelle: echelle, suit: suit
    });
  }

  // ---- ce que dit un écran

  function surPret(entree, donnee) {
    entree.pret = true;
    entree.cadre.style.visibility = ""; // l'écran a sa finition : on peut le montrer
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
    envoyerLaFinition(entree);
    if (typeof donnee.hauteur !== "number" || !isFinite(donnee.hauteur) || donnee.hauteur <= 0) return;
    var hauteur = Math.min(Math.ceil(donnee.hauteur), HAUTEUR_MAXIMALE_D_UN_CADRE);
    if (!entree.vignette) {
      entree.cadre.style.height = hauteur + "px";
    } else if (entree.suit) {
      entree.cadre.style.height = hauteur + "px";
      entree.boite.style.height = Math.round(hauteur * entree.echelle) + "px";
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

  // ---- la finition des écrans : UX (la maquette en gris) ou UI (les couleurs du projet)
  //
  // commun.css porte deux jeux de variables aux mêmes noms ; l'écran prend celui de l'UI quand
  // relais.js pose data-finition="ui" sur sa racine. Le bouton « UX | UI » de la barre n'existe
  // que si reglages.finition vaut "charte" (départ en UI) ou "gris-puis-charte" (départ en UX).
  // Le choix de la personne est gardé par projet. L'actuel (capture ou redessin) n'est jamais
  // touché : il garde le vrai style du projet.

  var DEPART_DE_LA_FINITION = { "charte": "ui", "gris-puis-charte": "ux" };
  var LIBELLES_DE_FINITION = { ux: "UX · maquette en gris", ui: "UI · couleurs du projet" };
  var finition = "ux";

  function cleDeLaFinition(plan) {
    return cleDuDossier("finition", plan);
  }

  // La finition à montrer pour ce plan, ou null si le plan n'a pas de bouton (tout reste en UX).
  function finitionDuPlan(plan) {
    var reglage = plan && estObjet(plan.reglages) ? plan.reglages.finition : undefined;
    if (typeof reglage !== "string" || !aLaCle(DEPART_DE_LA_FINITION, reglage)) return null;
    var gardee = lireAvecLAncienneCle("finition", plan);
    return gardee === "ux" || gardee === "ui" ? gardee : DEPART_DE_LA_FINITION[reglage];
  }

  // L'adresse d'un écran avec la finition de la page : « ecrans/A2.html?finition=ui ».
  function avecLaFinition(chemin) {
    var coupe = chemin.indexOf("#");
    var avant = coupe === -1 ? chemin : chemin.slice(0, coupe);
    var apres = coupe === -1 ? "" : chemin.slice(coupe);
    return avant + (avant.indexOf("?") === -1 ? "?" : "&") + "finition=" + finition + apres;
  }

  function envoyerLaFinition(entree) {
    if (entree.lecture) return;
    try {
      entree.cadre.contentWindow.postMessage({ aPlat: 1, type: "finition", valeur: finition }, "*");
    } catch (erreur) {
      // cadre déjà retiré de la page
    }
  }

  function changerLaFinition(nouvelle, plan) {
    finition = nouvelle;
    garderStock(cleDeLaFinition(plan), nouvelle);
    cadres.forEach(function (entree) {
      if (!entree.pret || entree.lecture) return;
      // Un écran ne se mesure jamais plus bas que son cadre : on rend d'abord au cadre sa
      // hauteur de départ, pour qu'un écran qui raccourcit dans la nouvelle finition puisse
      // le dire. relais.js renvoie alors sa vraie hauteur.
      if (!entree.vignette || entree.suit) {
        entree.cadre.style.height = entree.hauteur + "px";
        if (entree.suit) entree.boite.style.height = Math.round(entree.hauteur * entree.echelle) + "px";
      }
      envoyerLaFinition(entree);
    });
    marquerLaFinition(plan);
  }

  // ------------------------------------------------------------ 4c. rangées, écrans et notes

  // Une note sans ecrans vaut pour toute sa rangée : elle s'affiche sous le titre de la rangée.
  // Une note avec ecrans s'affiche sous chacun des écrans qu'elle cite, où qu'ils soient.

  function rangeeParId(plan, id) {
    for (var i = 0; i < plan.rangees.length; i++) {
      if (estObjet(plan.rangees[i]) && plan.rangees[i].id === id) return plan.rangees[i];
    }
    return null;
  }

  function ecransDeLaRangee(plan, id) {
    return plan.ecrans.filter(function (ecran) {
      return ecran.rangee === id;
    });
  }

  // « A Trouver un outil », ou « A » sans titre.
  function nomDeRangee(rangee) {
    return rangee.id + (estTexte(rangee.titre) ? " " + rangee.titre : "");
  }

  function compteDesEcrans(nombre) {
    return nombre === 0 ? "Aucun écran" : pluriel(nombre, "écran", "écrans");
  }

  function notesDeLaRangee(rangee) {
    return (Array.isArray(rangee.notes) ? rangee.notes : []).filter(estObjet);
  }

  // Les codes qu'une note cite et qui existent dans le plan. Un code d'écran retiré du plan
  // est ignoré : la page tolère cet oubli (le contrôle, lui, le signale), et une note qui ne
  // cite plus aucun écran présent vaut pour toute sa rangée.
  function codesDeLaNote(note, plan) {
    return (Array.isArray(note.ecrans) ? note.ecrans : []).filter(function (code) {
      return estTexte(code) && positionDeLEcran(plan, code) !== -1;
    });
  }

  function notesGenerales(rangee, plan) {
    return notesDeLaRangee(rangee).filter(function (note) {
      return codesDeLaNote(note, plan).length === 0;
    });
  }

  // Les notes du plan rangées par écran cité : { "A2": [note, …] }.
  function notesParEcran(plan) {
    var index = {};
    plan.rangees.forEach(function (rangee) {
      if (!estObjet(rangee)) return;
      notesDeLaRangee(rangee).forEach(function (note) {
        codesDeLaNote(note, plan).forEach(function (code) {
          if (!aLaCle(index, code)) index[code] = [];
          if (index[code].indexOf(note) === -1) index[code].push(note);
        });
      });
    });
    return index;
  }

  function notesDeLEcran(index, code) {
    return aLaCle(index, code) ? index[code] : [];
  }

  // Les rangées qui ont quelque chose à montrer : un écran, ou une note de toute la rangée.
  function rangeesVisibles(plan) {
    return plan.rangees.filter(function (rangee) {
      return estObjet(rangee) && (ecransDeLaRangee(plan, rangee.id).length > 0 || notesGenerales(rangee, plan).length > 0);
    });
  }

  function dessinerNote(note) {
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
    return element;
  }

  // Une liste de notes (type en toutes lettres, date, ancienne valeur barrée), ou null s'il n'y en a pas.
  function dessinerNotes(notes, etiquette, classe) {
    if (notes.length === 0) return null;
    var liste = creer("ul", "notes" + (classe ? " " + classe : ""));
    liste.setAttribute("aria-label", etiquette);
    notes.forEach(function (note) {
      liste.appendChild(dessinerNote(note));
    });
    return liste;
  }

  // La même liste, repliée sous « 2 notes » : pour le téléphone, où la place manque.
  function notesRepliees(notes, etiquette, classe) {
    var liste = dessinerNotes(notes, etiquette);
    if (!liste) return null;
    var repli = creer("details", "notes-repliees" + (classe ? " " + classe : ""));
    repli.appendChild(creer("summary", "", pluriel(notes.length, "note", "notes")));
    repli.appendChild(liste);
    return repli;
  }

  function ajouterLesBadges(conteneur, ecran) {
    if (ecran.statut === "valide") conteneur.appendChild(creer("span", "badge-valide", "Validé"));
    if (ecran.inchange === true) conteneur.appendChild(creer("span", "badge-inchange", "Inchangé"));
  }

  // Le titre d'une rangée, qui mène à sa vue en grand, suivi de son nombre d'écrans.
  function titreDeRangee(rangee, nombre) {
    var titre = creer("h3", "rangee-titre");
    var lien = creer("a", "rangee-lien");
    lien.setAttribute("href", lienDeLaRangee(rangee.id));
    lien.setAttribute("title", nomDeRangee(rangee)); // le titre entier, s'il est coupé sur la planche
    lien.appendChild(creer("span", "rangee-id", rangee.id));
    if (estTexte(rangee.titre)) {
      lien.appendChild(document.createTextNode(" "));
      lien.appendChild(creer("span", "rangee-nom", rangee.titre));
    }
    titre.appendChild(lien);
    titre.appendChild(creer("span", "rangee-compte", compteDesEcrans(nombre)));
    return titre;
  }

  // ---- les rangées repliées de la vue d'ensemble, retenues par projet
  //
  // La liste des rangées repliées est gardée sous « a-plat:rangees-repliees:<dossier>:<projet> »
  // (voir cleDuDossier), la même pour la planche et la colonne du téléphone. lireStock et
  // garderStock passent par un try/catch : sans stockage, tout commence déplié et le pliage dure
  // le temps de la visite.

  function cleDesReplis(plan) {
    return cleDuDossier("rangees-repliees", plan);
  }

  // { "A": true } pour chaque rangée repliée.
  function lireLesReplis(plan) {
    var brut = lireAvecLAncienneCle("rangees-repliees", plan);
    var repliees = {};
    if (Array.isArray(brut)) {
      brut.forEach(function (id) {
        if (estTexte(id)) repliees[id] = true;
      });
    }
    return repliees;
  }

  function garderLesReplis(plan, repliees) {
    var ids = [];
    for (var id in repliees) {
      if (aLaCle(repliees, id) && repliees[id]) ids.push(id);
    }
    garderStock(cleDesReplis(plan), ids);
  }

  // Rend une section de rangée repliable : un bouton à chevron, avant la lettre, cache ou montre
  // son corps (les notes de la rangée et les écrans). Le titre reste un lien vers la rangée.
  // Renvoie { plier(replie) }, pour « Tout replier » et « Tout déplier ».
  var numeroDeCorps = 0;
  function rendrePliable(section, titre, corps, rangee, plan, repliees) {
    numeroDeCorps += 1;
    corps.id = "corps-de-rangee-" + numeroDeCorps;
    var bouton = creer("button", "rangee-plier");
    bouton.setAttribute("type", "button");
    bouton.setAttribute("aria-controls", corps.id);
    var chevron = creer("span", "rangee-chevron");
    chevron.setAttribute("aria-hidden", "true");
    bouton.appendChild(chevron);

    function montrer(replie) {
      if (replie) section.classList.add("repliee");
      else section.classList.remove("repliee");
      bouton.setAttribute("aria-expanded", replie ? "false" : "true");
      bouton.setAttribute("aria-label", (replie ? "Déplier" : "Replier") + " la rangée " + rangee.id);
    }
    function plier(replie) {
      repliees[rangee.id] = replie;
      montrer(replie);
    }
    bouton.addEventListener("click", function () {
      plier(!section.classList.contains("repliee"));
      garderLesReplis(plan, repliees);
    });
    titre.insertBefore(bouton, titre.firstChild);
    montrer(Boolean(repliees[rangee.id]));
    return { plier: plier };
  }

  // Un écran en vignette : son nom au-dessus (code, badges, titre), qui est un lien couvrant
  // aussi l'image, puis ses notes. options : suit (hauteur entière), notes, replier (details,
  // pour le téléphone), bouton (pour la planche : un bouton « 2 notes » que le style ne montre
  // que lorsque l'écran est trop étroit à l'écran pour y lire ses notes ; il les déplie).
  function dessinerVignette(ecran, echelle, options) {
    var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
    var element = creer("div", "vignette");
    element.setAttribute("data-code", ecran.code);
    element.style.width = Math.round(largeur * echelle) + "px";

    // Le lien couvre le nom et l'image (voir .vignette-lien::after dans le style).
    var haut = creer("div", "vignette-haut");
    var lien = creer("a", "vignette-lien");
    lien.setAttribute("href", lienDeLEcran(ecran.code));
    lien.setAttribute("title", ecran.code + " · " + nomCourt(ecran.titre));
    var ligne = creer("span", "vignette-ligne");
    ligne.appendChild(creer("span", "vignette-code", ecran.code));
    ajouterLesBadges(ligne, ecran);
    lien.appendChild(ligne);
    lien.appendChild(creer("span", "vignette-titre", nomCourt(ecran.titre)));
    haut.appendChild(lien);
    haut.appendChild(cadreReduit(ecran, echelle, Boolean(options.suit)));
    element.appendChild(haut);

    var notes = options.notes || [];
    var etiquette = "Notes de l'écran " + ecran.code;
    var bloc = options.replier ? notesRepliees(notes, etiquette) : dessinerNotes(notes, etiquette, "notes-ecran");
    if (bloc && options.bouton) element.appendChild(boutonDesNotes(element, bloc, notes.length));
    if (bloc) element.appendChild(bloc);
    return element;
  }

  // Le bouton « 2 notes » d'un écran de la planche. Il est hors du lien de l'écran : le
  // toucher déplie les notes sans ouvrir l'écran.
  var numeroDeListe = 0;
  function boutonDesNotes(vignette, liste, nombre) {
    numeroDeListe += 1;
    liste.id = "notes-de-vignette-" + numeroDeListe;
    // Le nombre, puis le mot, que le style cache quand l'écran est minuscule : le nom du
    // bouton, lui, reste « 2 notes ».
    var bouton = creer("button", "notes-bouton");
    bouton.appendChild(creer("span", "notes-nombre", String(nombre)));
    bouton.appendChild(creer("span", "notes-mot", nombre > 1 ? " notes" : " note"));
    bouton.setAttribute("aria-label", pluriel(nombre, "note", "notes"));
    bouton.setAttribute("type", "button");
    bouton.setAttribute("aria-expanded", "false");
    bouton.setAttribute("aria-controls", liste.id);
    bouton.addEventListener("click", function () {
      var ouvert = !vignette.classList.contains("notes-ouvertes");
      if (ouvert) vignette.classList.add("notes-ouvertes");
      else vignette.classList.remove("notes-ouvertes");
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
    return bouton;
  }

  // ---- la vue d'ensemble : la planche (ordinateur et tablette), la colonne (téléphone)

  var TELEPHONE = "(max-width: 700px)";
  var LARGEUR_SUR_TELEPHONE = 170;   // largeur d'une vignette à faire glisser
  var ZOOM_DE_DEPART = 0.3;
  var ZOOM_MINIMAL = 0.04;
  var ZOOM_MAXIMAL = 2;
  var PAS_DU_ZOOM = 1.25;
  var ZOOM_TOUT_VOIR_MINIMAL = 0.15; // « Tout voir » ne descend pas plus bas, sauf pour la largeur
  var NOTES_LISIBLES = 220;          // largeur à l'écran (px) sous laquelle les notes d'un écran se replient
  var TITRE_LISIBLE = 40;            // largeur à l'écran (px) sous laquelle le titre d'un écran se cache
  var SEUIL_DU_TIRER = 5;            // pixels à parcourir à la souris avant qu'un appui devienne un déplacement
  var SEUIL_DU_TIRER_AU_DOIGT = 12;  // la même chose au doigt ou au stylet, qui tremblent davantage
  var MARGE_DE_LA_PLANCHE = 24;

  // Le zoom et la position de la planche, gardés d'une vue à l'autre : revenir d'un écran
  // retrouve la planche telle qu'on l'a laissée. Remis à zéro au passage des 700 px, et au
  // rechargement de la page.
  var vueDeLaPlanche = null;

  var largeurEtroite = typeof window.matchMedia === "function" ? window.matchMedia(TELEPHONE) : null;

  function estTelephone() {
    return Boolean(largeurEtroite && largeurEtroite.matches);
  }

  function dessinerEnsemble(conteneur, plan) {
    if (plan.ecrans.length === 0) {
      conteneur.appendChild(titreDeVue("Vue d'ensemble"));
      conteneur.appendChild(message("Aucun écran n'est encore dessiné", [
        "La vue d'ensemble se remplira quand les premiers écrans existeront.",
        "Demandez à Claude de les dessiner : " + DEMANDE_DE_DESSIN + "."
      ]));
      dessinerLesRangeesEnColonne(conteneur, plan);
      return;
    }
    if (estTelephone()) dessinerColonne(conteneur, plan);
    else dessinerPlanche(conteneur, plan);
  }

  // Téléphone : une colonne qui défile ; chaque rangée glisse de côté, écran par écran.
  function dessinerColonne(conteneur, plan) {
    conteneur.appendChild(titreDeVue("Vue d'ensemble"));
    var visibles = rangeesVisibles(plan);
    conteneur.appendChild(creer("p", "consigne",
      pluriel(plan.ecrans.length, "écran", "écrans") + " en " + pluriel(visibles.length, "rangée", "rangées") +
      ". Faites glisser chaque rangée ; touchez son titre pour la voir en grand, un écran pour l'ouvrir."));
    dessinerLesRangeesEnColonne(conteneur, plan);
  }

  function dessinerLesRangeesEnColonne(conteneur, plan) {
    var index = notesParEcran(plan);
    var repliees = lireLesReplis(plan);
    rangeesVisibles(plan).forEach(function (rangee) {
      var ecrans = ecransDeLaRangee(plan, rangee.id);
      var section = creer("section", "rangee rangee-colonne");
      section.setAttribute("data-rangee", rangee.id);
      var titre = titreDeRangee(rangee, ecrans.length);
      section.appendChild(titre);
      // Le corps : ce que le bouton à chevron replie.
      var corps = creer("div", "rangee-corps");
      section.appendChild(corps);
      rendrePliable(section, titre, corps, rangee, plan, repliees);
      var generales = notesRepliees(notesGenerales(rangee, plan), "Notes de toute la rangée " + rangee.id, "notes-generales");
      if (generales) corps.appendChild(generales);
      if (ecrans.length > 0) {
        var glisse = creer("div", "glisse");
        glisse.setAttribute("tabindex", "0");
        glisse.setAttribute("role", "group");
        glisse.setAttribute("aria-label", "Écrans de la rangée " + rangee.id);
        ecrans.forEach(function (ecran) {
          var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
          glisse.appendChild(dessinerVignette(ecran, LARGEUR_SUR_TELEPHONE / largeur, {
            notes: notesDeLEcran(index, ecran.code), replier: true
          }));
        });
        corps.appendChild(glisse);
      }
      conteneur.appendChild(section);
    });
  }

  // Ordinateur et tablette : la planche. Toutes les rangées l'une sous l'autre, chaque écran
  // à sa vraie taille ; la molette déplace, Ctrl + molette (ou le pincement) zoome.
  function dessinerPlanche(conteneur, plan) {
    document.body.setAttribute("data-mise", "plein");
    var index = notesParEcran(plan);
    var visibles = rangeesVisibles(plan);

    var fenetre = creer("div", "planche-fenetre");
    var feuille = creer("div", "planche");
    var repliees = lireLesReplis(plan);
    var pliables = [];
    visibles.forEach(function (rangee) {
      var ecrans = ecransDeLaRangee(plan, rangee.id);
      var section = creer("section", "rangee");
      section.setAttribute("data-rangee", rangee.id);
      var titre = titreDeRangee(rangee, ecrans.length);
      section.appendChild(titre);
      // Le corps : ce que le bouton à chevron replie. Replié, il ne prend plus de place, et les
      // rangées suivantes remontent ; « Tout voir » ne le compte plus.
      var corps = creer("div", "rangee-corps");
      section.appendChild(corps);
      pliables.push(rendrePliable(section, titre, corps, rangee, plan, repliees));
      var generales = dessinerNotes(notesGenerales(rangee, plan), "Notes de toute la rangée " + rangee.id, "notes-generales");
      if (generales) corps.appendChild(generales);
      if (ecrans.length > 0) {
        var ligne = creer("div", "rangee-ecrans");
        ecrans.forEach(function (ecran) {
          ligne.appendChild(dessinerVignette(ecran, 1, { suit: true, notes: notesDeLEcran(index, ecran.code), bouton: true }));
        });
        corps.appendChild(ligne);
      }
      feuille.appendChild(section);
    });
    fenetre.appendChild(feuille);

    // Le titre du projet flotte en haut à gauche, tant que la planche n'a pas bougé.
    var entete = creer("div", "planche-entete");
    entete.appendChild(creer("h2", "planche-titre", estTexte(plan.projet) ? plan.projet : "Vue d'ensemble"));
    entete.appendChild(creer("p", "planche-aide",
      pluriel(plan.ecrans.length, "écran", "écrans") + " en " + pluriel(visibles.length, "rangée", "rangées") +
      ". La molette déplace la planche, Ctrl + molette ou le pincement zooment. Touchez un écran pour l'ouvrir, un titre de rangée pour la voir en grand."));

    // En bas à gauche : les commandes du zoom, puis, juste à droite, celles des rangées.
    var commandes = creer("div", "planche-commandes");
    function groupe(classe, nom) {
      var element = creer("div", classe);
      element.setAttribute("role", "group");
      element.setAttribute("aria-label", nom);
      commandes.appendChild(element);
      return element;
    }
    function bouton(dans, texte, nom) {
      var element = creer("button", "", texte);
      element.setAttribute("type", "button");
      element.setAttribute("aria-label", nom);
      dans.appendChild(element);
      return element;
    }
    var zoom = groupe("planche-zoom", "Zoom de la planche");
    var moins = bouton(zoom, "−", "Réduire le zoom");
    var niveau = creer("span", "planche-niveau");
    niveau.setAttribute("title", "Niveau du zoom");
    niveau.setAttribute("aria-live", "polite");
    zoom.appendChild(niveau);
    var plus = bouton(zoom, "+", "Agrandir le zoom");
    var toutVoir = bouton(zoom, "Tout voir", "Tout voir");
    var reel = bouton(zoom, "100 %", "100 %, taille réelle");
    var plis = groupe("planche-plis", "Rangées");
    var toutReplier = bouton(plis, "Tout replier", "Tout replier");
    var toutDeplier = bouton(plis, "Tout déplier", "Tout déplier");

    // Le titre, puis les commandes, puis la planche : au clavier, on atteint le zoom sans passer
    // d'abord par tous les écrans. À l'écran, chacun garde sa place (voir le style).
    conteneur.appendChild(entete);
    conteneur.appendChild(commandes);
    conteneur.appendChild(fenetre);

    var planche = brancherLaPlanche(fenetre, feuille, entete, niveau);
    moins.addEventListener("click", function () { planche.zoomer(planche.zoom() / PAS_DU_ZOOM); });
    plus.addEventListener("click", function () { planche.zoomer(planche.zoom() * PAS_DU_ZOOM); });
    toutVoir.addEventListener("click", planche.toutVoir);
    reel.addEventListener("click", function () { planche.zoomer(1); });
    function toutPlier(replie) {
      pliables.forEach(function (pliable) {
        pliable.plier(replie);
      });
      garderLesReplis(plan, repliees);
    }
    toutReplier.addEventListener("click", function () { toutPlier(true); });
    toutDeplier.addEventListener("click", function () { toutPlier(false); });
  }

  // Le déplacement et le zoom de la planche. La feuille est posée par une seule transformation
  // (translate puis scale) ; --inv vaut 1 / zoom (au moins 1) et garde les titres lisibles.
  function brancherLaPlanche(fenetre, feuille, entete, niveau) {
    var depart = { x: MARGE_DE_LA_PLANCHE, y: entete.offsetTop + entete.offsetHeight + 28 };
    var z = vueDeLaPlanche ? vueDeLaPlanche.z : ZOOM_DE_DEPART;
    var x = vueDeLaPlanche ? vueDeLaPlanche.x : depart.x;
    var y = vueDeLaPlanche ? vueDeLaPlanche.y : depart.y;

    // Chaque écran, avec sa largeur dans la planche : selon la largeur qu'il a à l'écran, ses
    // notes se replient (bouton « 2 notes ») et son titre se cache.
    var vignettes = [];
    var elements = feuille.querySelectorAll(".vignette");
    for (var i = 0; i < elements.length; i++) {
      // La largeur écrite par dessinerVignette : celle d'une rangée repliée ne se mesure pas.
      var largeur = parseFloat(elements[i].style.width) || LARGEUR_PAR_DEFAUT;
      vignettes.push({ element: elements[i], largeur: largeur, etroite: null, minuscule: null });
    }

    function marquer(element, classe, oui) {
      if (oui) element.classList.add(classe);
      else element.classList.remove(classe);
    }

    // Ce qui suit le zoom dans la feuille : --inv, et l'état de chaque écran.
    function appliquerLeZoom(zoom) {
      feuille.style.setProperty("--inv", String(Math.max(1, 1 / zoom)));
      vignettes.forEach(function (vignette) {
        var aLEcran = vignette.largeur * zoom;
        var etroite = aLEcran < NOTES_LISIBLES;
        var minuscule = aLEcran < TITRE_LISIBLE;
        if (etroite !== vignette.etroite) marquer(vignette.element, "notes-etroites", etroite);
        if (minuscule !== vignette.minuscule) marquer(vignette.element, "sans-titre", minuscule);
        vignette.etroite = etroite;
        vignette.minuscule = minuscule;
      });
    }

    function poser() {
      feuille.style.transform = "translate(" + x + "px," + y + "px) scale(" + z + ")";
      appliquerLeZoom(z);
      niveau.textContent = Math.round(z * 100) + " %";
      var aBouge = Math.abs(x - depart.x) > 2 || Math.abs(y - depart.y) > 2;
      if (aBouge) entete.classList.add("efface");
      else entete.classList.remove("efface");
      vueDeLaPlanche = { z: z, x: x, y: y };
    }

    // Change le zoom en gardant immobile le point (cx, cy) de la fenêtre, le centre par défaut.
    function zoomer(nouveau, cx, cy) {
      nouveau = Math.max(ZOOM_MINIMAL, Math.min(ZOOM_MAXIMAL, nouveau));
      if (typeof cx !== "number") {
        cx = fenetre.clientWidth / 2;
        cy = fenetre.clientHeight / 2;
      }
      x = cx - (cx - x) * nouveau / z;
      y = cy - (cy - y) * nouveau / z;
      z = nouveau;
      poser();
    }

    // Mesure la feuille, dans ses propres pixels, telle qu'elle serait à ce zoom. En largeur, on
    // ne compte que les écrans : un titre de rangée très long ne doit pas faire tout rapetisser
    // (il est coupé par des points de suspension, voir le style).
    function mesurer(zoom) {
      appliquerLeZoom(zoom);
      var largeur = 1;
      var lignes = feuille.querySelectorAll(".rangee-ecrans");
      for (var j = 0; j < lignes.length; j++) largeur = Math.max(largeur, lignes[j].offsetWidth);
      return { largeur: largeur, hauteur: feuille.offsetHeight };
    }

    // Tout voir. Les titres et les noms gardent leur taille à l'écran, donc la taille de la
    // planche dépend du zoom : on cherche, par essais successifs (en coupant l'intervalle en
    // deux), le plus grand zoom auquel elle tient. Si tout ne tient qu'en dessous de 15 %, les
    // écrans ne seraient plus que des taches : on s'arrête à 15 %, ou plus bas s'il le faut pour
    // que toutes les colonnes tiennent en largeur ; la molette descend alors vers le bas.
    function toutVoir() {
      var placeEnLargeur = fenetre.clientWidth - 2 * MARGE_DE_LA_PLANCHE;
      var placeEnHauteur = fenetre.clientHeight - depart.y - MARGE_DE_LA_PLANCHE;
      function tient(zoom, enHauteur) {
        var taille = mesurer(zoom);
        return taille.largeur * zoom <= placeEnLargeur && (!enHauteur || taille.hauteur * zoom <= placeEnHauteur);
      }
      function plusGrandZoom(enHauteur) {
        if (tient(1, enHauteur)) return 1;
        if (!tient(ZOOM_MINIMAL, enHauteur)) return ZOOM_MINIMAL;
        var bas = ZOOM_MINIMAL;
        var haut = 1;
        for (var i = 0; i < 14; i++) {
          var milieu = (bas + haut) / 2;
          if (tient(milieu, enHauteur)) bas = milieu;
          else haut = milieu;
        }
        return bas;
      }
      var toutTient = plusGrandZoom(true);
      z = toutTient >= ZOOM_TOUT_VOIR_MINIMAL ? toutTient : Math.min(ZOOM_TOUT_VOIR_MINIMAL, plusGrandZoom(false));
      x = depart.x;
      y = depart.y;
      poser();
    }

    // La molette déplace ; Maj + molette déplace de côté ; Ctrl + molette, ou le pincement
    // du pavé tactile (que le navigateur envoie comme Ctrl + molette), zoome autour du pointeur.
    fenetre.addEventListener("wheel", function (evenement) {
      evenement.preventDefault();
      var facteur = evenement.deltaMode === 1 ? 16 : (evenement.deltaMode === 2 ? fenetre.clientHeight : 1);
      var dx = evenement.deltaX * facteur;
      var dy = evenement.deltaY * facteur;
      if (evenement.ctrlKey || evenement.metaKey) {
        var boite = fenetre.getBoundingClientRect();
        zoomer(z * Math.exp(-dy * 0.0025), evenement.clientX - boite.left, evenement.clientY - boite.top);
        return;
      }
      if (evenement.shiftKey && dx === 0) {
        dx = dy;
        dy = 0;
      }
      x -= dx;
      y -= dy;
      poser();
    }, { passive: false });

    // Tirer avec la souris ou un doigt déplace ; deux doigts zooment. Un appui qui a déplacé
    // la planche n'ouvre pas l'écran sur lequel il a commencé.
    var pointeurs = {};
    var geste = null;
    var aTire = false;

    // La distance entre deux doigts, jamais nulle.
    function ecart(a, b) {
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      return Math.max(1, Math.sqrt(dx * dx + dy * dy));
    }

    function pointeursActifs() {
      var liste = [];
      for (var id in pointeurs) {
        if (aLaCle(pointeurs, id)) liste.push(pointeurs[id]);
      }
      return liste;
    }

    function commencerLeGeste() {
      var actifs = pointeursActifs();
      if (actifs.length === 1) {
        var auDoigt = actifs[0].type === "touch" || actifs[0].type === "pen";
        geste = {
          deux: false, px: actifs[0].x, py: actifs[0].y, x: x, y: y, bouge: aTire,
          seuil: auDoigt ? SEUIL_DU_TIRER_AU_DOIGT : SEUIL_DU_TIRER
        };
      } else if (actifs.length >= 2) {
        var boite = fenetre.getBoundingClientRect();
        geste = {
          deux: true, z: z, x: x, y: y,
          distance: ecart(actifs[0], actifs[1]),
          mx: (actifs[0].x + actifs[1].x) / 2 - boite.left, my: (actifs[0].y + actifs[1].y) / 2 - boite.top
        };
        aTire = true;
      } else {
        geste = null;
      }
    }

    fenetre.addEventListener("pointerdown", function (evenement) {
      if (evenement.pointerType === "mouse" && evenement.button !== 0) return;
      if (pointeursActifs().length === 0) aTire = false;
      pointeurs[evenement.pointerId] = { x: evenement.clientX, y: evenement.clientY, type: evenement.pointerType };
      commencerLeGeste();
    });

    fenetre.addEventListener("pointermove", function (evenement) {
      if (!aLaCle(pointeurs, evenement.pointerId) || !geste) return;
      pointeurs[evenement.pointerId].x = evenement.clientX;
      pointeurs[evenement.pointerId].y = evenement.clientY;
      if (geste.deux) {
        var actifs = pointeursActifs();
        if (actifs.length < 2) return;
        var boite = fenetre.getBoundingClientRect();
        var distance = ecart(actifs[0], actifs[1]);
        var mx = (actifs[0].x + actifs[1].x) / 2 - boite.left;
        var my = (actifs[0].y + actifs[1].y) / 2 - boite.top;
        var nouveau = Math.max(ZOOM_MINIMAL, Math.min(ZOOM_MAXIMAL, geste.z * distance / geste.distance));
        // Le point de la planche qui était sous les deux doigts reste sous les deux doigts.
        x = mx - (geste.mx - geste.x) * nouveau / geste.z;
        y = my - (geste.my - geste.y) * nouveau / geste.z;
        z = nouveau;
        poser();
        return;
      }
      var dx = evenement.clientX - geste.px;
      var dy = evenement.clientY - geste.py;
      if (!geste.bouge && Math.abs(dx) + Math.abs(dy) > geste.seuil) {
        geste.bouge = true;
        aTire = true;
        fenetre.classList.add("tire");
        try {
          fenetre.setPointerCapture(evenement.pointerId); // la planche suit même hors de la fenêtre
        } catch (erreur) {
          // sans capture, le déplacement s'arrête au bord : sans gravité
        }
      }
      if (geste.bouge) {
        x = geste.x + dx;
        y = geste.y + dy;
        poser();
      }
    });

    function finDuPointeur(evenement) {
      if (!aLaCle(pointeurs, evenement.pointerId)) return;
      delete pointeurs[evenement.pointerId];
      commencerLeGeste();
      if (!geste) fenetre.classList.remove("tire");
    }
    fenetre.addEventListener("pointerup", finDuPointeur);
    fenetre.addEventListener("pointercancel", finDuPointeur);

    fenetre.addEventListener("click", function (evenement) {
      if (!aTire) return;
      aTire = false;
      evenement.preventDefault();
      evenement.stopPropagation();
    }, true);
    // Un lien tiré ne doit pas partir en glisser-déposer.
    fenetre.addEventListener("dragstart", function (evenement) {
      evenement.preventDefault();
    });

    // Au clavier, un lien qui prend le focus hors de la vue y est ramené. Le navigateur, lui,
    // ferait défiler la fenêtre, ce qui décalerait la planche : on remet ce défilement à zéro.
    function sansDefilement() {
      if (fenetre.scrollTop !== 0) fenetre.scrollTop = 0;
      if (fenetre.scrollLeft !== 0) fenetre.scrollLeft = 0;
    }
    fenetre.addEventListener("scroll", sansDefilement);
    fenetre.addEventListener("focusin", function (evenement) {
      sansDefilement();
      // Un lien touché du doigt ou de la souris prend aussi le focus : il est déjà sous les yeux,
      // et le déplacer maintenant ferait manquer le toucher.
      if (pointeursActifs().length > 0) return;
      var cible = evenement.target.getBoundingClientRect();
      var boite = fenetre.getBoundingClientRect();
      var marge = 40;
      if (cible.left < boite.left + marge || cible.right > boite.right - marge) x += boite.left + marge - cible.left;
      if (cible.top < boite.top + marge || cible.bottom > boite.bottom - marge) y += boite.top + depart.y - cible.top;
      poser();
    });

    poser();
    return {
      zoom: function () { return z; },
      zoomer: zoomer,
      toutVoir: toutVoir
    };
  }

  // ---- une rangée en grand

  function dessinerRangee(conteneur, plan, id) {
    var rangee = rangeeParId(plan, id);
    if (!rangee) {
      conteneur.appendChild(lienRetour(message("Cette rangée n'existe pas", [
        id === "" ? "L'adresse ne dit pas quelle rangée ouvrir." : "Le plan ne contient aucune rangée « " + id + " »."
      ])));
      return;
    }
    var telephone = estTelephone();
    if (!telephone) document.body.setAttribute("data-mise", "plein");
    var index = notesParEcran(plan);
    var ecrans = ecransDeLaRangee(plan, rangee.id);

    var vue = creer("div", "vue-rangee");
    vue.setAttribute("data-rangee", rangee.id);
    var tete = creer("div", "vue-rangee-tete");
    var titre = creer("h2", "titre-de-vue vue-rangee-titre");
    titre.appendChild(creer("span", "rangee-id", rangee.id));
    if (estTexte(rangee.titre)) {
      titre.appendChild(document.createTextNode(" "));
      titre.appendChild(creer("span", "rangee-nom", rangee.titre));
    }
    tete.appendChild(titre);
    tete.appendChild(creer("p", "consigne", compteDesEcrans(ecrans.length) +
      (ecrans.length > 0 ? ". Touchez un écran pour l'ouvrir seul, avec l'existant et les corrections." : ".")));
    var generales = dessinerNotes(notesGenerales(rangee, plan), "Notes de toute la rangée " + rangee.id, "notes-generales");
    if (generales) tete.appendChild(generales);
    vue.appendChild(tete);

    var corps = creer("div", "vue-rangee-corps");
    var bande = creer("div", "rangee-bande");
    bande.setAttribute("tabindex", "0");
    bande.setAttribute("role", "group");
    bande.setAttribute("aria-label", "Écrans de la rangée " + rangee.id);
    var liste = creer("div", "rangee-cartes");
    var largeurUtile = Math.max(200, document.documentElement.clientWidth - 32);
    ecrans.forEach(function (ecran) {
      var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
      // Une taille de lecture : 90 % pour un téléphone, 62 % pour un ordinateur ; sur un
      // téléphone, la largeur de l'écran.
      var echelle = telephone ? Math.min(1, largeurUtile / largeur) : (largeur > 600 ? 0.62 : 0.9);
      liste.appendChild(carteDeRangee(ecran, echelle, notesDeLEcran(index, ecran.code)));
    });
    if (ecrans.length === 0) liste.appendChild(creer("p", "rangee-vide", "Aucun écran dans cette rangée."));
    bande.appendChild(liste);
    corps.appendChild(bande);
    corps.appendChild(panneauDesPages(plan, ecrans));
    vue.appendChild(corps);
    conteneur.appendChild(vue);
  }

  // Un écran d'une rangée : son nom, l'écran (qu'on touche pour l'ouvrir), « Ouvrir A2 › », ses notes.
  function carteDeRangee(ecran, echelle, notes) {
    var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
    var carte = creer("div", "rangee-carte");
    carte.setAttribute("data-code", ecran.code);
    carte.style.width = Math.round(largeur * echelle) + "px";
    var nom = creer("p", "rangee-carte-nom");
    nom.appendChild(creer("b", "rangee-carte-code", ecran.code));
    nom.appendChild(document.createTextNode(" "));
    nom.appendChild(creer("span", "rangee-carte-titre", nomCourt(ecran.titre)));
    ajouterLesBadges(nom, ecran);
    carte.appendChild(nom);

    var zone = creer("div", "rangee-carte-cadre");
    zone.appendChild(cadreReduit(ecran, echelle, true));
    // Toucher l'image ouvre l'écran ; au clavier, c'est le lien « Ouvrir » qui sert.
    var couvre = creer("a", "rangee-carte-couvre");
    couvre.setAttribute("href", lienDeLEcran(ecran.code));
    couvre.setAttribute("tabindex", "-1");
    couvre.setAttribute("aria-hidden", "true");
    zone.appendChild(couvre);
    carte.appendChild(zone);

    var ouvrir = creer("a", "rangee-carte-ouvrir", "Ouvrir " + ecran.code + " ›");
    ouvrir.setAttribute("href", lienDeLEcran(ecran.code));
    carte.appendChild(ouvrir);
    var liste = dessinerNotes(notes, "Notes de l'écran " + ecran.code, "notes-ecran");
    if (liste) carte.appendChild(liste);
    return carte;
  }

  // Le panneau de droite : les pages de l'état des lieux qui citent un écran de la rangée.
  function panneauDesPages(plan, ecrans) {
    var panneau = creer("aside", "rangee-panneau");
    panneau.setAttribute("aria-label", "Pages de l'état des lieux");
    panneau.appendChild(creer("h3", "rangee-panneau-titre", "Pages de l'état des lieux"));
    var codes = ecrans.map(function (ecran) {
      return ecran.code;
    });
    var lignes = plan.etatDesLieux.filter(function (ligne) {
      return (Array.isArray(ligne.ecrans) ? ligne.ecrans : []).some(function (code) {
        return codes.indexOf(code) !== -1;
      });
    });
    if (lignes.length === 0) {
      panneau.appendChild(creer("p", "consigne", "Aucune page de l'état des lieux ne cite ces écrans."));
      return panneau;
    }
    var liste = creer("ul", "lignes");
    lignes.forEach(function (ligne) {
      liste.appendChild(dessinerLigne(ligne));
    });
    panneau.appendChild(liste);
    return panneau;
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

  // La place de l'écran de l'adresse dans le plan : « #ecran » sans code donne le premier
  // écran, un code inconnu donne -1.
  function positionDeLEcran(plan, code) {
    if (code === "") return plan.ecrans.length > 0 ? 0 : -1;
    for (var i = 0; i < plan.ecrans.length; i++) {
      if (plan.ecrans[i].code === code) return i;
    }
    return -1;
  }

  function dessinerEcran(conteneur, plan, code) {
    var ecrans = plan.ecrans;
    if (ecrans.length === 0) {
      conteneur.appendChild(lienRetour(message("Aucun écran n'est encore dessiné", [
        "Il n'y a rien à montrer ici pour l'instant.",
        "Demandez à Claude de les dessiner : " + DEMANDE_DE_DESSIN + "."
      ])));
      return;
    }

    var position = positionDeLEcran(plan, code);
    if (position === -1) {
      conteneur.appendChild(lienRetour(message("Cet écran n'existe pas", ["Le plan ne contient aucun écran avec le code « " + code + " »."])));
      return;
    }
    var ecran = ecrans[position];
    var largeur = dimension(ecran.largeur, LARGEUR_PAR_DEFAUT);
    var hauteur = dimension(ecran.hauteur, HAUTEUR_PAR_DEFAUT);

    var entete = creer("div", "ecran-entete");
    entete.appendChild(creer("span", "ecran-code", ecran.code));
    ajouterLesBadges(entete, ecran);
    entete.appendChild(creer("h2", "titre-de-vue", nomCourt(ecran.titre)));
    conteneur.appendChild(entete);
    conteneur.appendChild(creer("p", "consigne",
      "Pour corriger dans la conversation, commencez par le code de l'écran : « " + ecran.code + " : change le titre »."));
    // Valider passe par la conversation, jamais par un bouton de la page.
    conteneur.appendChild(creer("p", "consigne",
      "Pour valider cet écran, écrivez « " + ecran.code + " validé » dans la conversation avec Claude. " +
      "Utilisez le code affiché ici : il ne change jamais, même si les écrans sont réorganisés."));

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

    var titreDuVolet = aUnActuel ? "Proposition" : (ecran.inchange === true ? "Existant, sans changement proposé" : "");
    var proposition = creerVolet("volet-proposition", titreDuVolet, largeur);
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

    // Sous les écrans, les notes qui citent cet écran.
    var principal = creer("div", "ecran-principal");
    principal.appendChild(comparaison);
    var notes = dessinerNotes(notesDeLEcran(notesParEcran(plan), ecran.code), "Notes sur l'écran " + ecran.code, "notes-ecran");
    if (notes) {
      var blocDesNotes = creer("section", "ecran-notes");
      blocDesNotes.appendChild(creer("h3", "volet-titre", "Notes sur cet écran"));
      blocDesNotes.appendChild(notes);
      principal.appendChild(blocDesNotes);
    }

    // Le corps de la vue : les écrans, et à côté d'eux (ou dessous) le panneau des corrections,
    // que corrections.js y ajoute.
    var corps = creer("div", "ecran-corps");
    corps.setAttribute("data-code", ecran.code);
    corps.appendChild(principal);
    conteneur.appendChild(corps);

    // Précédent et suivant, dans l'ordre des écrans du plan.
    var voisins = creer("div", "voisins");
    voisins.setAttribute("role", "navigation");
    voisins.setAttribute("aria-label", "Autres écrans");
    if (position > 0) voisins.appendChild(dessinerVoisin(ecrans[position - 1], "precedent"));
    if (position < ecrans.length - 1) voisins.appendChild(dessinerVoisin(ecrans[position + 1], "suivant"));
    if (voisins.childNodes.length > 0) conteneur.appendChild(voisins);
  }

  // Une vue : son adresse (le mot après #) et sa fonction de dessin.
  // dessiner(conteneur, plan, reste) ; `reste` est ce qui suit le mot dans l'adresse
  // (le code d'écran pour #ecran/A2, la rangée pour #rangee/A, sinon une chaîne vide).
  var VUES = {
    etat: { dessiner: dessinerEtatDesLieux },
    ensemble: { dessiner: dessinerEnsemble },
    rangee: { dessiner: dessinerRangee },
    ecran: { dessiner: dessinerEcran }
  };

  // ------------------------------------------------------------ 5. la barre du haut

  // ---- le fil : où je suis, du plus large au plus serré, et la flèche pour remonter d'un niveau

  function dessinerLeFil(lue, lecture) {
    var liste = document.getElementById("fil");
    var remonter = document.getElementById("remonter");
    if (!liste) return;
    var plan = lecture.statut === "bon" ? lecture.plan : null;
    var projet = nomDuProjet(lecture);
    var pas = [{ texte: projet ? "À plat · " + projet : "À plat", lien: "#ensemble" }];

    // L'état des lieux n'est pas au-dessous de la vue d'ensemble : le fil le nomme, sans flèche.
    if (lue.vue === "etat") {
      // Sur un téléphone, où le fil ne garde qu'un pas, ce pas-là redirait le lien de droite :
      // le fil y montre plutôt le projet (voir .fil-vue dans le style).
      pas.push({ texte: "État des lieux", lien: "#etat", classe: "fil-vue" });
    } else if (plan && lue.vue === "rangee") {
      var rangee = rangeeParId(plan, lue.reste);
      pas.push(rangee ? { texte: nomDeRangee(rangee), lien: lienDeLaRangee(rangee.id) } : { texte: lue.reste || "Rangée", lien: null });
    } else if (plan && lue.vue === "ecran") {
      var position = positionDeLEcran(plan, lue.reste);
      if (position === -1) {
        pas.push({ texte: lue.reste || "Écran", lien: null });
      } else {
        var ecran = plan.ecrans[position];
        var saRangee = rangeeParId(plan, ecran.rangee);
        if (saRangee) pas.push({ texte: nomDeRangee(saRangee), lien: lienDeLaRangee(saRangee.id) });
        pas.push({ texte: ecran.code, lien: lienDeLEcran(ecran.code) });
      }
    }

    // Un seul aria-current dans la barre : sur l'état des lieux et la vue d'ensemble, c'est le
    // lien de droite qui le porte ; sur une rangée ou un écran, le dernier pas du fil.
    var marquerIci = lue.vue === "rangee" || lue.vue === "ecran";
    liste.textContent = "";
    pas.forEach(function (etape, i) {
      var element = creer("li", "fil-pas" + (etape.classe ? " " + etape.classe : ""));
      if (i === pas.length - 1) {
        var ici = creer("span", "fil-ici", etape.texte);
        if (marquerIci) ici.setAttribute("aria-current", "page");
        element.appendChild(ici);
      } else {
        var lien = creer("a", "", etape.texte);
        lien.setAttribute("href", etape.lien);
        element.appendChild(lien);
      }
      liste.appendChild(element);
    });

    if (!remonter) return;
    if (pas.length > 1 && lue.vue !== "etat") {
      var parent = pas[pas.length - 2];
      remonter.hidden = false;
      remonter.setAttribute("href", parent.lien);
      remonter.setAttribute("aria-label", "Remonter : " + parent.texte);
      remonter.setAttribute("title", "Remonter : " + parent.texte);
    } else {
      remonter.hidden = true;
      remonter.removeAttribute("href");
    }
  }

  // ---- la recherche d'un écran, par son code ou un mot de son titre

  var MAXIMUM_DE_RESULTATS = 10;
  var recherche = { champ: null, liste: null, trouves: [], actif: -1 };

  function estUnChamp(element) {
    if (!element) return false;
    var balise = element.tagName;
    return balise === "INPUT" || balise === "TEXTAREA" || balise === "SELECT" || element.isContentEditable === true;
  }

  // Les écrans dont le code et le titre contiennent chaque mot cherché, sans tenir compte des
  // accents ni des majuscules. Le code exact vient d'abord, puis les codes qui commencent ainsi.
  function trouverLesEcrans(plan, texte) {
    var mots = sansAccents(texte).split(/\s+/).filter(estTexte);
    if (mots.length === 0) return [];
    var trouves = [];
    plan.ecrans.forEach(function (ecran, i) {
      if (!estTexte(ecran.code)) return;
      var code = sansAccents(ecran.code);
      var tout = code + " " + sansAccents(estTexte(ecran.titre) ? ecran.titre : "");
      var garde = mots.every(function (mot) {
        return tout.indexOf(mot) !== -1;
      });
      if (!garde) return;
      var rang = code === mots[0] ? 0 : (code.indexOf(mots[0]) === 0 ? 1 : 2);
      trouves.push({ ecran: ecran, rang: rang, ordre: i });
    });
    trouves.sort(function (a, b) {
      return a.rang - b.rang || a.ordre - b.ordre;
    });
    return trouves.slice(0, MAXIMUM_DE_RESULTATS).map(function (trouve) {
      return trouve.ecran;
    });
  }

  function fermerLesResultats() {
    if (!recherche.liste) return;
    recherche.liste.hidden = true;
    recherche.liste.textContent = "";
    recherche.trouves = [];
    recherche.actif = -1;
    recherche.champ.setAttribute("aria-expanded", "false");
    recherche.champ.removeAttribute("aria-activedescendant");
  }

  function marquerLActif() {
    var options = recherche.liste.querySelectorAll("[data-code]");
    for (var i = 0; i < options.length; i++) {
      var actif = i === recherche.actif;
      options[i].setAttribute("aria-selected", actif ? "true" : "false");
      if (actif) {
        options[i].className = "resultat actif";
        recherche.champ.setAttribute("aria-activedescendant", options[i].id);
        if (typeof options[i].scrollIntoView === "function") options[i].scrollIntoView({ block: "nearest" });
      } else {
        options[i].className = "resultat";
      }
    }
  }

  function chercher() {
    var champ = recherche.champ;
    var liste = recherche.liste;
    var texte = champ.value.trim();
    var plan = window.APlatMoteur.planCourant();
    if (!texte || !plan) {
      fermerLesResultats();
      return;
    }
    recherche.trouves = trouverLesEcrans(plan, texte);
    recherche.actif = recherche.trouves.length > 0 ? 0 : -1;
    liste.textContent = "";
    if (recherche.trouves.length === 0) {
      var vide = creer("li", "resultat-vide", "Aucun écran ne correspond.");
      vide.setAttribute("role", "option");
      vide.setAttribute("aria-disabled", "true");
      liste.appendChild(vide);
    }
    recherche.trouves.forEach(function (ecran, i) {
      var option = creer("li", "resultat");
      option.id = "resultat-" + i;
      option.setAttribute("role", "option");
      option.setAttribute("data-code", ecran.code);
      option.appendChild(creer("b", "resultat-code", ecran.code));
      option.appendChild(creer("span", "resultat-titre", nomCourt(ecran.titre)));
      liste.appendChild(option);
    });
    liste.hidden = false;
    champ.setAttribute("aria-expanded", "true");
    marquerLActif();
  }

  function ouvrirLeResultat(code) {
    fermerLesResultats();
    recherche.champ.value = "";
    recherche.champ.blur();
    window.location.hash = lienDeLEcran(code);
  }

  function auClavierDeLaRecherche(evenement) {
    var ouverte = !recherche.liste.hidden;
    var nombre = recherche.trouves.length;
    if (evenement.key === "ArrowDown" || evenement.key === "ArrowUp") {
      evenement.preventDefault();
      if (!ouverte) {
        chercher();
        return;
      }
      if (nombre === 0) return;
      var pas = evenement.key === "ArrowDown" ? 1 : -1;
      recherche.actif = (recherche.actif + pas + nombre) % nombre;
      marquerLActif();
    } else if (evenement.key === "Enter") {
      evenement.preventDefault();
      if (!ouverte) chercher();
      var ecran = recherche.trouves[recherche.actif];
      if (ecran) ouvrirLeResultat(ecran.code);
    } else if (evenement.key === "Escape") {
      // Échap ferme la liste ; un second Échap vide le champ. Il ne va pas plus loin
      // (la saisie d'une correction, ouverte en même temps, reste ouverte).
      evenement.preventDefault();
      evenement.stopPropagation();
      if (ouverte) fermerLesResultats();
      else recherche.champ.value = "";
    }
  }

  function brancherLaRecherche() {
    var champ = document.getElementById("recherche");
    var liste = document.getElementById("resultats");
    if (!champ || !liste) return;
    recherche.champ = champ;
    recherche.liste = liste;
    champ.addEventListener("input", chercher);
    champ.addEventListener("keydown", auClavierDeLaRecherche);
    champ.addEventListener("focus", function () {
      if (champ.value.trim()) chercher();
    });
    champ.addEventListener("blur", function () {
      window.setTimeout(function () {
        if (document.activeElement !== champ) fermerLesResultats();
      }, 150);
    });
    // Appuyer sur un résultat ne retire pas le focus du champ : la liste reste ouverte jusqu'au clic.
    liste.addEventListener("mousedown", function (evenement) {
      evenement.preventDefault();
    });
    liste.addEventListener("click", function (evenement) {
      var element = evenement.target;
      while (element && element !== liste && !(element.getAttribute && element.getAttribute("data-code") !== null)) {
        element = element.parentNode;
      }
      if (element && element !== liste) ouvrirLeResultat(element.getAttribute("data-code"));
    });
    // « / » met le curseur dans la recherche, sauf quand on écrit déjà dans un champ.
    document.addEventListener("keydown", function (evenement) {
      if (evenement.key !== "/" || evenement.ctrlKey || evenement.metaKey || evenement.altKey) return;
      if (estUnChamp(document.activeElement)) return;
      evenement.preventDefault();
      champ.focus();
      champ.select();
    });
  }

  // ---- les liens des vues, à droite

  function marquerLaBarre(vue) {
    var liens = document.querySelectorAll("nav a[data-vue]");
    for (var i = 0; i < liens.length; i++) {
      if (liens[i].getAttribute("data-vue") === vue) liens[i].setAttribute("aria-current", "page");
      else liens[i].removeAttribute("aria-current");
    }
  }

  // ---- le bouton « UX | UI », à droite, devant les liens des vues

  var zoneDeFinition = null; // { racine, boutons: { ux, ui } }, ou null quand le plan n'en a pas

  function dessinerLaFinition(plan) {
    var depart = plan ? finitionDuPlan(plan) : null;
    var droite = document.querySelector(".barre .barre-droite");
    if (depart === null || !droite) {
      if (zoneDeFinition && zoneDeFinition.racine.parentNode) zoneDeFinition.racine.parentNode.removeChild(zoneDeFinition.racine);
      zoneDeFinition = null;
      finition = "ux";
      return;
    }
    finition = depart;
    if (!zoneDeFinition) {
      var racine = creer("div", "barre-finition");
      racine.setAttribute("role", "group");
      racine.setAttribute("aria-label", "Finition des écrans");
      var boutons = {};
      ["ux", "ui"].forEach(function (valeur) {
        var bouton = creer("button", "", valeur.toUpperCase());
        bouton.setAttribute("type", "button");
        bouton.setAttribute("title", LIBELLES_DE_FINITION[valeur]);
        bouton.addEventListener("click", function () {
          var lisible = window.APlatMoteur.planCourant();
          if (lisible) changerLaFinition(valeur, lisible);
        });
        boutons[valeur] = bouton;
        racine.appendChild(bouton);
      });
      zoneDeFinition = { racine: racine, boutons: boutons };
    }
    var vues = droite.querySelector(".barre-vues");
    if (zoneDeFinition.racine.parentNode !== droite) droite.insertBefore(zoneDeFinition.racine, vues);
    marquerLaFinition(plan);
  }

  // Les boutons enfoncés, et le titre de l'onglet qui dit discrètement où l'on est.
  function marquerLaFinition(plan) {
    if (!zoneDeFinition) return;
    zoneDeFinition.boutons.ux.setAttribute("aria-pressed", finition === "ux" ? "true" : "false");
    zoneDeFinition.boutons.ui.setAttribute("aria-pressed", finition === "ui" ? "true" : "false");
    var projet = estTexte(plan.projet) ? plan.projet + " · " : "";
    document.title = projet + LIBELLES_DE_FINITION[finition] + " · À plat";
  }

  // La hauteur de la barre, que la planche et la rangée utilisent pour se poser dessous.
  function mesurerLaBarre() {
    var barre = document.querySelector(".barre");
    if (barre) document.documentElement.style.setProperty("--barre-hauteur", barre.offsetHeight + "px");
  }

  function nomDuProjet(lecture) {
    var plan = lecture.plan || window.A_PLAT;
    return plan && estTexte(plan.projet) ? plan.projet : "";
  }

  // ------------------------------------------------------------ 6. afficher

  // "#ecran/A2" devient { vue: "ecran", reste: "A2" }. Une adresse inconnue donne null.
  function lireAdresse(adresse) {
    var texte = String(adresse || "").replace(/^#/, "");
    var coupe = texte.indexOf("/");
    var vue = coupe === -1 ? texte : texte.slice(0, coupe);
    var reste = coupe === -1 ? "" : texte.slice(coupe + 1);
    if (!aLaCle(VUES, vue)) return null;
    var decode = reste;
    try {
      decode = decodeURIComponent(reste);
    } catch (erreur) {
      // on garde le texte tel quel
    }
    return { vue: vue, reste: decode };
  }

  var largeurDuDessin = 0; // la largeur de la fenêtre au dernier dessin

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
    var titre = document.getElementById("projet");
    if (titre) titre.textContent = projet ? "À plat · " + projet : "À plat";
    document.title = projet ? projet + " · À plat" : "À plat";
    marquerLaBarre(lue.vue);
    dessinerLeFil(lue, lecture);
    dessinerLaFinition(lecture.statut === "bon" ? lecture.plan : null);
    fermerLesResultats();

    conteneur.textContent = "";
    nettoyerLesCadres();
    document.body.setAttribute("data-vue", lue.vue);
    document.body.setAttribute("data-mise", "page"); // la planche et la rangée passent en « plein »
    mesurerLaBarre();
    largeurDuDessin = window.innerWidth;
    try {
      if (lecture.statut !== "bon") conteneur.appendChild(dessinerProblemeDePlan(lecture));
      else VUES[lue.vue].dessiner(conteneur, lecture.plan, lue.reste);
    } catch (erreur) {
      // Jamais de page blanche : on dit ce qui s'est passé.
      conteneur.textContent = "";
      document.body.setAttribute("data-mise", "page");
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
    // corrections.js vient peut-être d'ajouter « Corrections : N » à la barre, qui a pu passer
    // sur deux lignes : on la remesure (voir aussi surveillerLaBarre).
    mesurerLaBarre();
  }

  // La barre change de hauteur sans que la page soit redessinée : une correction ajoutée ou
  // retirée, une fenêtre élargie. Un ResizeObserver la remesure à chaque fois ; sans lui, la
  // mesure suit le redimensionnement de la fenêtre et chaque dessin de la vue.
  function surveillerLaBarre() {
    var barre = document.querySelector(".barre");
    if (!barre || typeof window.ResizeObserver !== "function") return;
    new window.ResizeObserver(mesurerLaBarre).observe(barre);
  }

  // La planche et la rangée se dessinent différemment sur un téléphone : passer d'un côté à
  // l'autre de 700 px les redessine. Sur un téléphone, une rangée suit aussi la largeur.
  function vueQuiSuitLaLargeur() {
    var lue = lireAdresse(window.location.hash);
    return lue && (lue.vue === "ensemble" || lue.vue === "rangee") ? lue : null;
  }

  function surChangementDeFormat() {
    vueDeLaPlanche = null; // la planche repart de son zoom de départ
    if (vueQuiSuitLaLargeur()) afficher(window.location.hash);
  }
  if (largeurEtroite) {
    if (typeof largeurEtroite.addEventListener === "function") largeurEtroite.addEventListener("change", surChangementDeFormat);
    else if (typeof largeurEtroite.addListener === "function") largeurEtroite.addListener(surChangementDeFormat);
  }

  var minuteurDuRedimensionnement = null;
  window.addEventListener("resize", function () {
    if (minuteurDuRedimensionnement) window.clearTimeout(minuteurDuRedimensionnement);
    minuteurDuRedimensionnement = window.setTimeout(function () {
      minuteurDuRedimensionnement = null;
      mesurerLaBarre();
      var lue = vueQuiSuitLaLargeur();
      if (lue && lue.vue === "rangee" && estTelephone() && window.innerWidth !== largeurDuDessin) afficher(window.location.hash);
    }, 200);
  });

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

  brancherLaRecherche();
  surveillerLaBarre();
  window.addEventListener("hashchange", function () {
    afficher(window.location.hash);
  });
  afficher(window.location.hash);
})();
