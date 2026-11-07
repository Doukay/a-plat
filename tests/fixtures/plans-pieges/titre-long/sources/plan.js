// Titres très longs, sans espace pour certains : rien ne doit déborder à 390 px.
window.A_PLAT = {
  version: 1,
  projet: "Projet".repeat(50),
  etatDesLieux: [{
    page: "Mot".repeat(100),
    groupe: "G".repeat(300),
    etat: "a-completer",
    raison: "Une raison très longue qui se répète. ".repeat(12),
    source: "src/" + "dossier/".repeat(40) + "fichier.js",
    aConfirmer: true,
    ecrans: ["A1"]
  }, {
    page: "Une page dont le titre est très long mais fait de plusieurs mots, comme un vrai titre qui irait trop loin dans une liste " + "de mots ".repeat(20),
    groupe: "G".repeat(300),
    etat: "existe",
    raison: "Courte.",
    source: "src/court.js",
    aConfirmer: false,
    ecrans: []
  }],
  rangees: [{ id: "A", titre: "Rangée", notes: [] }],
  ecrans: [{
    code: "A1", titre: "Accueil", rangee: "A", fichier: "A1-accueil.html",
    largeur: 390, hauteur: 844, statut: "a-relire", actuel: null
  }]
};
