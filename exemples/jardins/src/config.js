// Réglages de l'association, lus par les vues.
// Le jeton du service de sauvegarde se trouve dans le fichier .env à la racine du dossier :
// il n'est jamais écrit ici ni lu par ce code.
export const CONFIG = {
  association: "Les Jardins de la Grelinette",
  saison: 2027,
  cotisation: 25,
  reservationsMax: 2,
  sauvegarde: { fournisseur: "à choisir", jeton: "voir le fichier .env" }
};
