// Du HTML dans tous les textes du plan : la page doit l'afficher comme du texte.
window.A_PLAT = {
  version: 1,
  projet: '<img src=x onerror="window.PIEGE=1">Projet',
  etatDesLieux: [{
    page: '<img src=x onerror="window.PIEGE=1">',
    groupe: '<b onmouseover="window.PIEGE=1">Groupe</b> "à guillemets"',
    etat: "manque",
    raison: '<script>window.PIEGE=1<\/script> L\'écran dit « bonjour » & "au revoir".',
    source: '<img src=x onerror="window.PIEGE=1">src/accueil.js',
    aConfirmer: true,
    ecrans: ["A1"]
  }],
  rangees: [{ id: "A", titre: "Rangée", notes: [] }],
  ecrans: [{
    code: "A1", titre: "Accueil", rangee: "A", fichier: "A1-accueil.html",
    largeur: 390, hauteur: 844, statut: "a-relire", actuel: null
  }]
};
