// Plan d'un projet inventé : Prêtoutil, une application de prêt d'outils entre voisins.
// Les noms, les textes et les chemins sont inventés ; rien ne vient d'un vrai projet.
window.A_PLAT = {
  version: 1,
  projet: "Prêtoutil",
  reglages: {
    format: "telephone",
    rangement: "parcours",
    finition: "gris-puis-charte",
    rythme: "ecran",
    relecture: true,
    policeEnLigne: false
  },
  etatDesLieux: [{
    page: "Accueil",
    groupe: "Trouver un outil",
    etat: "existe",
    raison: "La liste des outils proches s'affiche, avec la distance.",
    source: "src/ecrans/accueil.js",
    aConfirmer: false,
    ecrans: ["A1"]
  }, {
    page: "Fiche d'un outil",
    groupe: "Trouver un outil",
    etat: "a-completer",
    raison: "Rien n'est prévu quand l'outil est déjà prêté.",
    source: "src/ecrans/fiche.js",
    aConfirmer: true,
    ecrans: ["A2", "A3"]
  }, {
    page: "Recherche par catégorie",
    groupe: "Trouver un outil",
    etat: "prevue",
    raison: "Décidée pour la version 2 : les catégories sont dessinées sur l'accueil, pas encore construites.",
    source: "docs/notes-produit.md",
    aConfirmer: false,
    ecrans: ["A1"]
  }, {
    page: "Demande de prêt",
    groupe: "Demander un prêt",
    etat: "existe",
    raison: "Le formulaire envoie la demande au voisin.",
    source: "src/ecrans/demande.js",
    aConfirmer: false,
    ecrans: ["B1"]
  }, {
    page: "Confirmation d'envoi",
    groupe: "Demander un prêt",
    etat: "a-completer",
    raison: "Elle ne dit pas ce qui se passe si le voisin ne répond pas.",
    source: "src/ecrans/demande.js",
    aConfirmer: true,
    ecrans: ["B2"]
  }, {
    page: "Liste de mes prêts",
    groupe: "Suivre mes prêts",
    etat: "existe",
    raison: "Les prêts en cours et les demandes en attente sont listés.",
    source: "src/ecrans/mes-prets.js",
    aConfirmer: false,
    ecrans: ["C1"]
  }, {
    page: "Détail d'un prêt",
    groupe: "Suivre mes prêts",
    etat: "a-completer",
    raison: "Les étapes du prêt sont affichées ; le bouton pour annuler ne fait rien.",
    source: "src/ecrans/detail-pret.js",
    aConfirmer: true,
    ecrans: ["C2"]
  }, {
    page: "Historique des prêts",
    groupe: "Suivre mes prêts",
    etat: "manque",
    raison: "Le bouton Historique ne mène nulle part : aucun écran, pas même celui du cas vide.",
    source: "src/ecrans/mes-prets.js",
    aConfirmer: true,
    ecrans: ["C3"]
  }, {
    page: "Rappel avant le retour",
    groupe: "Suivre mes prêts",
    etat: "manque",
    raison: "L'aide annonce un rappel avant la date de retour ; rien dans le code.",
    source: "docs/aide.md",
    aConfirmer: false,
    ecrans: []
  }],
  rangees: [{
    id: "A",
    titre: "Trouver un outil",
    notes: [
      { type: "decision", date: "2026-11-04", texte: "Caution retirée.", ancien: "Caution de 20 €" },
      { type: "a-trancher", date: "2026-11-03", texte: "Durée maximale du prêt à choisir." },
      { type: "source", date: "2026-10-30", texte: "Fiche lue dans src/ecrans/fiche.js." }
    ]
  }, {
    id: "B",
    titre: "Demander un prêt",
    notes: [
      { type: "a-verifier", date: "2026-11-02", texte: "Le voisin reçoit-il bien un message à l'envoi ?" },
      { type: "a-coder", date: "2026-11-04", texte: "Choix des dates dans un calendrier." }
    ]
  }, {
    id: "C",
    titre: "Suivre mes prêts",
    notes: [
      { type: "a-coder", date: "2026-11-04", texte: "Annuler une demande en attente." },
      { type: "a-trancher", date: "2026-11-03", texte: "Combien de temps garder l'historique ?" }
    ]
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
    code: "A3",
    titre: "Outil déjà prêté",
    rangee: "A",
    fichier: "A3-fiche-pretee.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: null
  }, {
    code: "B1",
    titre: "Demande de prêt",
    rangee: "B",
    fichier: "B1-demande.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: null
  }, {
    code: "B2",
    titre: "Demande envoyée",
    rangee: "B",
    fichier: "B2-envoyee.html",
    largeur: 390,
    hauteur: 844,
    statut: "valide",
    actuel: null
  }, {
    code: "C1",
    titre: "Mes prêts",
    rangee: "C",
    fichier: "C1-mes-prets.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: { fichier: "actuel/C1-mes-prets.html", origine: "redessine" }
  }, {
    code: "C2",
    titre: "Détail d'un prêt",
    rangee: "C",
    fichier: "C2-detail-pret.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: null
  }, {
    code: "C3",
    titre: "Historique vide",
    rangee: "C",
    fichier: "C3-historique.html",
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",
    actuel: null
  }]
};
