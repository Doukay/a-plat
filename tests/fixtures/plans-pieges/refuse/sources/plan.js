// Plan lisible par le navigateur, mais refusé par le contrôle : deux écrans au même code,
// une rangée qui n'existe pas, un état inconnu.
window.A_PLAT = {
  version: 1,
  projet: "Prêtoutil",
  etatDesLieux: [{
    page: "Accueil",
    groupe: "Trouver un outil",
    etat: "presque",
    raison: "Un état qui n'existe pas.",
    source: "src/accueil.js",
    aConfirmer: false,
    ecrans: ["A1"]
  }],
  rangees: [{ id: "A", titre: "Trouver un outil", notes: [] }],
  ecrans: [{
    code: "A1", titre: "Accueil", rangee: "A", fichier: "A1-accueil.html",
    largeur: 390, hauteur: 844, statut: "a-relire", actuel: null
  }, {
    code: "A1", titre: "Fiche", rangee: "Z", fichier: "A2-fiche.html",
    largeur: 390, hauteur: 844, statut: "a-relire", actuel: null
  }]
};
