// Plan d'un projet inventé (prêt d'outils entre voisins) qui montre les variantes des écrans :
// un actuel redessiné, un actuel en capture, pas d'actuel, une rangée sans écran, les cinq types de note.
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
  etatDesLieux: [],
  rangees: [{
    id: "A",
    titre: "Trouver un outil",
    notes: [
      { type: "decision", date: "2026-11-04", texte: "Caution retirée.", ancien: "Caution de 20 €" },
      { type: "a-trancher", date: "2026-11-03", texte: "Durée maximale du prêt à choisir." },
      { type: "a-verifier", date: "2026-11-02", texte: "La distance s'affiche-t-elle en mètres ?" },
      { type: "a-coder", date: "2026-11-01", texte: "Filtre par quartier." },
      { type: "source", date: "2026-10-30", texte: "Vu dans src/fiche.js." }
    ]
  }, {
    id: "B",
    titre: "Prêter un outil",
    notes: [{ type: "a-trancher", date: "2026-11-04", texte: "Faut-il un message d'accueil ?" }]
  }, {
    id: "C",
    titre: "Mon compte",
    notes: []
  }],
  ecrans: [{
    code: "A1",
    titre: "Accueil",
    rangee: "A",
    fichier: "A1-accueil.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: { fichier: "actuel/A1-accueil.html", origine: "redessine" }
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
