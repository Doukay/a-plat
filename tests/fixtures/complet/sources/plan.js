// Plan d'un projet inventé : une application de prêt d'outils entre voisins.
window.A_PLAT = {
  version: 1,
  projet: "Prêtoutil",
  reglages: {
    format: "telephone",
    rangement: "parcours",
    finition: "gris",
    rythme: "ecran",
    relecture: true,
    policeEnLigne: false
  },
  etatDesLieux: [{
    page: "Fiche d'un outil",
    groupe: "Trouver un outil",
    etat: "a-completer",
    raison: "Rien n'est prévu quand l'outil est déjà prêté.",
    source: "src/fiche.js",
    aConfirmer: true,
    ecrans: ["A2"]
  }, {
    page: "Demande de prêt",
    groupe: "Prêter un outil",
    etat: "existe",
    raison: "Le formulaire envoie la demande au voisin.",
    source: "src/pret.js",
    aConfirmer: false,
    ecrans: ["B1"]
  }],
  avancement: { niveau: "en-cours", raison: "parce que le prêt a ses pages (src/pret.js) et la fiche n'est pas finie (src/fiche.js)." },
  rangees: [{
    id: "A",
    titre: "Trouver un outil",
    notes: [{ type: "decision", date: "2026-11-04", texte: "Caution retirée.", ancien: "Caution de 20 €" }]
  }, {
    id: "B",
    titre: "Prêter un outil",
    notes: [{ type: "a-trancher", date: "2026-11-04", texte: "Durée maximale du prêt à choisir." }]
  }],
  ecrans: [{
    code: "A1",
    titre: "Accueil",
    rangee: "A",
    fichier: "A1-accueil.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: null
  }, {
    code: "A2",
    titre: "Fiche d'un outil",
    rangee: "A",
    fichier: "A2-fiche.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: { fichier: "actuel/A2-fiche.png", origine: "capture" }
  }, {
    code: "B1",
    titre: "Demande de prêt",
    rangee: "B",
    fichier: "B1-pret.html",
    largeur: 390,
    hauteur: 844,
    statut: "valide",
    actuel: null
  }]
};
