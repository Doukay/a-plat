// Logique commune d'À plat : le même fichier sert à la page (window.APlatLogique)
// et au contrôle en ligne de commande (module.exports). Aucune interface de Node ici.
(function () {
  "use strict";

  var ETATS = ["existe", "a-completer", "manque", "prevue"];
  var TYPES_DE_NOTE = ["decision", "a-trancher", "a-verifier", "a-coder", "source"];
  var STATUTS = ["a-relire", "valide"];
  // L'avancement du projet, jugé à l'état des lieux, et son nom en toutes lettres.
  var NIVEAUX = ["idee", "debut", "en-cours", "avance"];
  var NOMS_DES_NIVEAUX = { idee: "idée", debut: "début", "en-cours": "en cours", avance: "avancé" };

  function estObjet(valeur) {
    return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
  }

  function estTexte(valeur) {
    return typeof valeur === "string" && valeur.length > 0;
  }

  function montrer(valeur) {
    if (typeof valeur === "string") return "« " + valeur + " »";
    if (valeur === undefined) return "rien";
    try {
      return JSON.stringify(valeur);
    } catch (erreur) {
      return "une valeur illisible";
    }
  }

  // Un fichier du plan ne sert que dans son dossier (sources/ecrans/ ou sources/actuel/). On refuse tout ce qui
  // peut en sortir : « .. », une adresse complète (https:, file:…), une barre au début, une
  // barre oblique inverse, et les mêmes écrits avec des %. Renvoie le fichier, ou null.
  // La page (moteur.js) et le contrôle s'en servent tous deux.
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

  function regleDuFichier(dossier) {
    return "il doit rester dans le dossier " + dossier + "/, sans « .. », sans adresse complète (https:, file:…), " +
      "sans barre / au début ni barre oblique inverse \\.";
  }

  // Renvoie la liste des erreurs du plan, en français. Liste vide si tout va bien.
  // Ne plante jamais, même sur un plan mal formé.
  // options.pourLaPage : la page tolère qu'une note cite un écran absent du plan (un écran
  // retiré dont on a oublié le code dans la note). Elle range alors la note sous le titre de
  // sa rangée au lieu de refuser tout le plan. Le contrôle (verifier.mjs), lui, appelle
  // validerPlan sans option et signale cette note comme une erreur à corriger.
  function validerPlan(plan, options) {
    var pourLaPage = Boolean(options && options.pourLaPage);
    var erreurs = [];
    if (!estObjet(plan)) {
      return ["Le plan est vide : window.A_PLAT doit être un objet."];
    }

    if (plan.version !== 1) {
      erreurs.push("Le champ version doit valoir 1 (trouvé : " + montrer(plan.version) + ").");
    }

    var rangees = Array.isArray(plan.rangees) ? plan.rangees : null;
    var ecrans = Array.isArray(plan.ecrans) ? plan.ecrans : null;
    var etatDesLieux = Array.isArray(plan.etatDesLieux) ? plan.etatDesLieux : null;
    if (!rangees) erreurs.push("Le champ rangees doit être une liste.");
    if (!ecrans) erreurs.push("Le champ ecrans doit être une liste.");
    if (!etatDesLieux) erreurs.push("Le champ etatDesLieux doit être une liste.");

    // avancement (facultatif) : { niveau, raison }, écrit à l'état des lieux. Il ne fait que
    // s'afficher : la page ne le refuse pas (nomDeLAvancement l'ignore), le contrôle si.
    if (plan.avancement !== undefined && !pourLaPage) {
      if (!estObjet(plan.avancement)) {
        erreurs.push("L'avancement vaut " + montrer(plan.avancement) +
          " : il doit être un objet { niveau, raison }, comme { niveau: \"en-cours\", raison: \"parce que…\" }.");
      } else if (NIVEAUX.indexOf(plan.avancement.niveau) === -1) {
        erreurs.push("L'avancement a un niveau " + montrer(plan.avancement.niveau) + " qui n'est pas permis (avancement.niveau : " +
          NIVEAUX.join(", ") + ", sans accent).");
      } else if (!estTexte(plan.avancement.raison)) {
        erreurs.push("L'avancement n'a pas de raison : avancement.raison dit en une phrase pourquoi ce niveau, avec ses sources.");
      }
    }

    var idsDeRangee = [];
    var notesACiter = []; // { nom, numero, ecrans } : les codes cités se vérifient une fois les écrans lus
    (rangees || []).forEach(function (rangee, i) {
      if (!estObjet(rangee)) {
        erreurs.push("rangees[" + i + "] doit être un objet.");
        return;
      }
      if (!estTexte(rangee.id)) {
        erreurs.push("rangees[" + i + "] n'a pas de champ id.");
      } else if (idsDeRangee.indexOf(rangee.id) !== -1) {
        erreurs.push("La rangée " + rangee.id + " est utilisée deux fois (id " + montrer(rangee.id) +
          ") : chaque rangée a son propre id.");
      } else {
        idsDeRangee.push(rangee.id);
      }
      var nom = estTexte(rangee.id) ? "la rangée " + rangee.id : "rangees[" + i + "]";
      if (rangee.notes === undefined) return;
      if (!Array.isArray(rangee.notes)) {
        erreurs.push("Le champ notes de " + nom + " doit être une liste.");
        return;
      }
      rangee.notes.forEach(function (note, j) {
        if (!estObjet(note) || TYPES_DE_NOTE.indexOf(note.type) === -1) {
          var trouve = estObjet(note) ? montrer(note.type) : montrer(note);
          erreurs.push("La note " + (j + 1) + " de " + nom + " a un type " + trouve +
            " qui n'est pas permis (type : " + TYPES_DE_NOTE.join(", ") + ").");
        }
        // ecrans (facultatif) : les codes des écrans que la note concerne.
        if (!estObjet(note) || note.ecrans === undefined) return;
        if (!Array.isArray(note.ecrans)) {
          erreurs.push("La note " + (j + 1) + " de " + nom + " a un champ ecrans " + montrer(note.ecrans) +
            " : il doit être une liste de codes d'écran, comme [\"A1\", \"A3\"].");
          return;
        }
        notesACiter.push({ nom: nom, numero: j + 1, ecrans: note.ecrans });
      });
    });

    var codes = [];
    var fichiers = {};  // fichier -> nom du premier écran qui l'utilise
    (ecrans || []).forEach(function (ecran, i) {
      if (!estObjet(ecran)) {
        erreurs.push("ecrans[" + i + "] doit être un objet.");
        return;
      }
      var nom = estTexte(ecran.code) ? "L'écran " + ecran.code : "ecrans[" + i + "]";
      if (!estTexte(ecran.code)) {
        erreurs.push("ecrans[" + i + "] n'a pas de champ code.");
      } else if (codes.indexOf(ecran.code) !== -1) {
        erreurs.push("Le code d'écran " + ecran.code + " est utilisé deux fois : chaque code doit être unique.");
      } else {
        codes.push(ecran.code);
      }
      if (!estTexte(ecran.fichier)) {
        erreurs.push(nom + " n'a pas de champ fichier.");
      } else if (!fichierSur(ecran.fichier)) {
        erreurs.push(nom + " a un fichier " + montrer(ecran.fichier) + " refusé : " + regleDuFichier("sources/ecrans"));
      } else if (Object.prototype.hasOwnProperty.call(fichiers, ecran.fichier)) {
        erreurs.push("Le fichier " + montrer(ecran.fichier) + " est utilisé deux fois (" + fichiers[ecran.fichier] +
          " et " + (estTexte(ecran.code) ? ecran.code : "ecrans[" + i + "]") + ") : chaque écran a son propre fichier.");
      } else {
        fichiers[ecran.fichier] = estTexte(ecran.code) ? ecran.code : "ecrans[" + i + "]";
      }
      // inchange: true dit qu'aucun changement n'est proposé : le dessin est l'existant, seul.
      if (ecran.inchange !== undefined && typeof ecran.inchange !== "boolean") {
        erreurs.push(nom + " a un inchange " + montrer(ecran.inchange) + " qui n'est pas permis (inchange : true ou false).");
      } else if (ecran.inchange === true && ecran.actuel !== null && ecran.actuel !== undefined) {
        erreurs.push(nom + " a inchange: true et un actuel : un écran inchangé n'a pas d'actuel à côté (actuel: null).");
      }
      if (estObjet(ecran.actuel) && estTexte(ecran.actuel.fichier) && !fichierSur(ecran.actuel.fichier)) {
        erreurs.push(nom + " a un actuel.fichier " + montrer(ecran.actuel.fichier) + " refusé : " + regleDuFichier("sources/actuel"));
      }
      if (idsDeRangee.indexOf(ecran.rangee) === -1) {
        erreurs.push(nom + " a une rangee " + montrer(ecran.rangee) + " qui n'existe pas dans rangees.");
      }
      if (STATUTS.indexOf(ecran.statut) === -1) {
        erreurs.push(nom + " a un statut " + montrer(ecran.statut) +
          " qui n'est pas permis (statut : " + STATUTS.join(", ") + ").");
      }
    });

    if (!pourLaPage) notesACiter.forEach(function (note) {
      note.ecrans.forEach(function (code) {
        if (!estTexte(code) || codes.indexOf(code) === -1) {
          erreurs.push("La note " + note.numero + " de " + note.nom + " cite l'écran " + montrer(code) +
            ", qui n'existe pas dans ecrans.");
        }
      });
    });

    (etatDesLieux || []).forEach(function (ligne, i) {
      var chemin = "etatDesLieux[" + i + "]";
      if (!estObjet(ligne)) {
        erreurs.push(chemin + " doit être un objet.");
        return;
      }
      if (ETATS.indexOf(ligne.etat) === -1) {
        erreurs.push(chemin + " a un etat " + montrer(ligne.etat) +
          " qui n'est pas permis (etat : " + ETATS.join(", ") + ").");
      }
      if (!Array.isArray(ligne.ecrans)) {
        erreurs.push(chemin + ".ecrans doit être une liste de codes d'écran.");
        return;
      }
      ligne.ecrans.forEach(function (code) {
        if (codes.indexOf(code) === -1) {
          erreurs.push(chemin + ".ecrans cite le code " + montrer(code) + ", qui n'existe pas dans ecrans.");
        }
      });
    });

    return erreurs;
  }

  // Le texte que la personne colle dans la conversation. Vide s'il n'y a rien à corriger.
  function texteCorrections(corrections, projet) {
    if (!Array.isArray(corrections) || corrections.length === 0) return "";
    var lignes = corrections.map(function (correction, i) {
      return (i + 1) + ". " + correction.code + " > " + correction.element + " : " + correction.texte;
    });
    return "Corrections pour " + projet + " :\n\n" + lignes.join("\n");
  }

  // L'écran du plan qui a ce fichier, ou null.
  function ecranParFichier(plan, fichier) {
    if (!estObjet(plan) || !Array.isArray(plan.ecrans)) return null;
    for (var i = 0; i < plan.ecrans.length; i++) {
      if (estObjet(plan.ecrans[i]) && plan.ecrans[i].fichier === fichier) return plan.ecrans[i];
    }
    return null;
  }

  // Le nom de l'avancement en toutes lettres (« en cours »), ou null s'il n'est pas écrit.
  function nomDeLAvancement(plan) {
    if (!estObjet(plan) || !estObjet(plan.avancement) || !estTexte(plan.avancement.raison)) return null;
    if (!Object.prototype.hasOwnProperty.call(NOMS_DES_NIVEAUX, plan.avancement.niveau)) return null;
    return NOMS_DES_NIVEAUX[plan.avancement.niveau];
  }

  // Les codes des écrans inchangés d'une page à compléter : ce qui lui manque ne se voit
  // pas à l'écran (une redirection, un lien), et doit se lire dans une note sous l'écran.
  function inchangesACompleter(plan) {
    var codes = [];
    if (!estObjet(plan) || !Array.isArray(plan.ecrans) || !Array.isArray(plan.etatDesLieux)) return codes;
    var inchanges = [];
    plan.ecrans.forEach(function (ecran) {
      if (estObjet(ecran) && ecran.inchange === true && estTexte(ecran.code)) inchanges.push(ecran.code);
    });
    plan.etatDesLieux.forEach(function (ligne) {
      if (!estObjet(ligne) || ligne.etat !== "a-completer" || !Array.isArray(ligne.ecrans)) return;
      ligne.ecrans.forEach(function (code) {
        if (inchanges.indexOf(code) !== -1 && codes.indexOf(code) === -1) codes.push(code);
      });
    });
    return codes;
  }

  var logique = {
    validerPlan: validerPlan,
    nomDeLAvancement: nomDeLAvancement,
    inchangesACompleter: inchangesACompleter,
    fichierSur: fichierSur,
    texteCorrections: texteCorrections,
    ecranParFichier: ecranParFichier
  };

  if (typeof window !== "undefined") window.APlatLogique = logique;
  if (typeof module !== "undefined" && module.exports) module.exports = logique;
})();
