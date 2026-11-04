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

  // Les vues de la vue d'ensemble et de l'écran seul viennent plus tard : en attendant,
  // elles le disent en une phrase.
  function dessinerPasEncore(nomDeLaVue) {
    return function (conteneur) {
      conteneur.appendChild(titreDeVue(nomDeLaVue));
      conteneur.appendChild(creer("p", "consigne", "Cette vue n'affiche rien pour l'instant."));
    };
  }

  // Une vue : son adresse (le mot après #), son nom dans la barre et sa fonction de dessin.
  // dessiner(conteneur, plan, reste) ; `reste` est ce qui suit le mot dans l'adresse
  // (le code d'écran pour #ecran/A2, sinon une chaîne vide).
  var VUES = {
    etat: { nom: "État des lieux", dessiner: dessinerEtatDesLieux },
    ensemble: { nom: "Vue d'ensemble", dessiner: dessinerPasEncore("Vue d'ensemble") },
    ecran: { nom: "Écrans", dessiner: dessinerPasEncore("Écrans") }
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
  }

  window.APlatMoteur = { afficher: afficher, lireStock: lireStock, garderStock: garderStock };

  window.addEventListener("hashchange", function () {
    afficher(window.location.hash);
  });
  afficher(window.location.hash);
})();
