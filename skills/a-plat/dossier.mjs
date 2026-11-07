// Reconnaître un dossier d'À plat, la même règle pour copier.mjs, reprendre.mjs et style-du-projet.mjs.
// Node seul, sans bibliothèque.
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";

function lireSiPossible(chemin) {
  try {
    return readFileSync(chemin, "utf8");
  } catch {
    return "";
  }
}

// Un dossier a-plat/ : son moteur dans .cache/, une page index.html qui le charge (copie
// interrompue avant .cache/), ou un sources/plan.js d'À plat. Un simple .cache/ ou sources/
// (que beaucoup de projets ont à leur racine) ne suffit pas.
export function estDeLOutil(dossier) {
  if (existsSync(join(dossier, ".cache", "moteur.js"))) return true;
  const index = lireSiPossible(join(dossier, "index.html"));
  if (/<script\b[^>]*\bsrc\s*=\s*["']?(?:\.\/)?\.cache\/moteur\.js/i.test(index)) return true;
  return lireSiPossible(join(dossier, "sources", "plan.js")).includes("window.A_PLAT");
}

// Un ancien dossier de maquettes : plan.js d'À plat à la racine, ou le moteur dans a-plat/.
export function estUnAncienDossier(dossier) {
  return existsSync(join(dossier, "a-plat", "moteur.js")) || lireSiPossible(join(dossier, "plan.js")).includes("window.A_PLAT");
}

// Vrai si le chemin existe et est un lien symbolique ou une jonction : l'outil n'écrit jamais
// à travers, pour ne rien écrire hors du dossier.
export function estUnLien(chemin) {
  try {
    return lstatSync(chemin).isSymbolicLink();
  } catch {
    return false;
  }
}
