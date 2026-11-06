// Petites fonctions partagées par les vues.
export const esc = (texte) =>
  String(texte).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function dateLongue(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function dateCourte(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

export const CRENEAUX = { matin: "matin (8 h – 12 h)", "apres-midi": "après-midi (14 h – 18 h)" };
export const TAILLES = { petite: "petite (moins de 30 m²)", moyenne: "moyenne (30 à 45 m²)", grande: "grande (plus de 45 m²)" };
