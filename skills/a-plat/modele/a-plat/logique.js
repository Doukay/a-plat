// Logique commune d'À plat : le même fichier sert à la page (window.APlatLogique)
// et au contrôle en ligne de commande (module.exports). Aucune interface de Node ici.
(function () {
  "use strict";

  var ETATS = ["existe", "a-completer", "manque", "prevue"];
  var TYPES_DE_NOTE = ["decision", "a-trancher", "a-verifier", "a-coder", "source"];
  var STATUTS = ["a-relire", "valide"];

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

  // Renvoie la liste des erreurs du plan, en français. Liste vide si tout va bien.
  // Ne plante jamais, même sur un plan mal formé.
  function validerPlan(plan) {
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

    var idsDeRangee = [];
    (rangees || []).forEach(function (rangee, i) {
      if (!estObjet(rangee)) {
        erreurs.push("rangees[" + i + "] doit être un objet.");
        return;
      }
      if (estTexte(rangee.id)) idsDeRangee.push(rangee.id);
      else erreurs.push("rangees[" + i + "] n'a pas de champ id.");
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
      });
    });

    var codes = [];
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
      }
      if (idsDeRangee.indexOf(ecran.rangee) === -1) {
        erreurs.push(nom + " a une rangee " + montrer(ecran.rangee) + " qui n'existe pas dans rangees.");
      }
      if (STATUTS.indexOf(ecran.statut) === -1) {
        erreurs.push(nom + " a un statut " + montrer(ecran.statut) +
          " qui n'est pas permis (statut : " + STATUTS.join(", ") + ").");
      }
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

  var logique = {
    validerPlan: validerPlan,
    texteCorrections: texteCorrections,
    ecranParFichier: ecranParFichier
  };

  if (typeof window !== "undefined") window.APlatLogique = logique;
  if (typeof module !== "undefined" && module.exports) module.exports = logique;
})();
