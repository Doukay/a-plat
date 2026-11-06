// Connexion : un prénom et un code personnel remis par le bureau. Deux rôles : « membre » et « bureau ».
import { membres, membre } from "./donnees.js";

const CLE = "jardins.session";

const simple = (texte) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function courant() {
  const id = sessionStorage.getItem(CLE);
  return id ? membre(id) ?? null : null;
}

export function connecter(prenom, code) {
  const trouve = membres().find((m) => simple(m.prenom) === simple(prenom) && m.code === code.trim());
  if (!trouve) return false;
  sessionStorage.setItem(CLE, trouve.id);
  return trouve;
}

export function deconnecter() {
  sessionStorage.removeItem(CLE);
}

export const estBureau = () => courant()?.role === "bureau";
