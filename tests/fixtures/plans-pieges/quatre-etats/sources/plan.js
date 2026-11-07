// Plan valide qui montre les quatre états, avec des groupes et des écrans cités.
window.A_PLAT = {
  version: 1,
  projet: "Prêtoutil",
  etatDesLieux: [{
    page: "Accueil",
    groupe: "Trouver un outil",
    etat: "existe",
    raison: "La liste des outils proches s'affiche.",
    source: "src/accueil.js",
    aConfirmer: false,
    ecrans: ["A1"]
  }, {
    page: "Fiche d'un outil",
    groupe: "Trouver un outil",
    etat: "a-completer",
    raison: "Rien n'est prévu quand l'outil est déjà prêté.",
    source: "src/fiche.js",
    aConfirmer: true,
    ecrans: ["A2", "A3"]
  }, {
    page: "Mot de passe oublié",
    groupe: "Compte",
    etat: "manque",
    raison: "Il y a une connexion, mais pas ce parcours.",
    source: "src/connexion.js",
    aConfirmer: false,
    ecrans: []
  }, {
    page: "Prêter un outil",
    groupe: "Prêter",
    etat: "prevue",
    raison: "Décidée pour la prochaine version.",
    source: "notes/decisions.md",
    aConfirmer: false,
    ecrans: []
  }, {
    page: "Mon profil",
    groupe: "Compte",
    etat: "existe",
    raison: "Nom et quartier modifiables.",
    source: "src/profil.js",
    aConfirmer: true,
    ecrans: []
  }],
  rangees: [{ id: "A", titre: "Trouver un outil", notes: [] }],
  ecrans: [{
    code: "A1", titre: "Accueil", rangee: "A", fichier: "A1-accueil.html",
    largeur: 390, hauteur: 844, statut: "a-relire", actuel: null
  }, {
    code: "A2", titre: "Fiche d'un outil", rangee: "A", fichier: "A2-fiche.html",
    largeur: 390, hauteur: 844, statut: "a-relire", actuel: null
  }, {
    code: "A3", titre: "Fiche d'un outil prêté", rangee: "A", fichier: "A3-fiche-prete.html",
    largeur: 390, hauteur: 844, statut: "a-relire", actuel: null
  }]
};
