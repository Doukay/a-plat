// Réglages de Prêtoutil, lus par toutes les pages.
// Les clés des services extérieurs (courrier du quartier) sont rangées dans le fichier .env,
// jamais ici : ce fichier-ci est servi tel quel avec le reste du site.
window.REGLAGES = {
  nomAppli: "Prêtoutil",
  quartier: "Les Tilleuls",
  dureeMaxJours: 14,
  courrier: {
    expediteur: "pretoutil@exemple.test",
    cleDansEnv: "CLE_FACTICE"
  }
};
