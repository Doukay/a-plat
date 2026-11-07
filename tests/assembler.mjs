// Le seul endroit où l'on assemble un dossier a-plat/ pour les essais : la page du modèle
// (skills/a-plat/modele), rangée comme le fait copier.mjs, puis une fixture par-dessus.
// Une fixture est un dossier a-plat/ sans sa page : sources/ (plan.js, ecrans/, actuel/, et
// parfois charte.css quand elle a un bloc UI à elle, comme la démo), et parfois .cache/projet/.
// Aucune bibliothèque ici, pour que tests/assembler-demo.mjs marche avec Node seul.
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MODELE = fileURLToPath(new URL("../skills/a-plat/modele", import.meta.url));
export const FIXTURES = fileURLToPath(new URL("./fixtures", import.meta.url));

// La page du modèle dans `destination`, rangée comme le fait copier.mjs : index.html, .gitignore,
// .cache/ (moteur, commun.css, ecran-type.html) et sources/charte.css de départ.
export function copierLaPage(destination) {
  mkdirSync(join(destination, ".cache"), { recursive: true });
  mkdirSync(join(destination, "sources"), { recursive: true });
  copyFileSync(join(MODELE, "index.html"), join(destination, "index.html"));
  copyFileSync(join(MODELE, "commun.css"), join(destination, ".cache", "commun.css"));
  copyFileSync(join(MODELE, "ecran-type.html"), join(destination, ".cache", "ecran-type.html"));
  for (const nom of readdirSync(join(MODELE, "a-plat"))) {
    if (statSync(join(MODELE, "a-plat", nom)).isFile()) copyFileSync(join(MODELE, "a-plat", nom), join(destination, ".cache", nom));
  }
  copyFileSync(join(MODELE, "charte.css"), join(destination, "sources", "charte.css"));
  writeFileSync(join(destination, ".gitignore"), "*\n!.gitignore\n!sources/\n!sources/**\n");
}

// Copie la page puis la fixture dans `destination` (qui doit déjà exister ou être créable).
// La fixture est donnée par son nom (« demo ») ou par un chemin absolu.
export function copierLeModeleEtLaFixture(destination, fixture) {
  const source = resolve(FIXTURES, fixture);
  if (!existsSync(source)) throw new Error(`Fixture introuvable : ${fixture}`);
  copierLaPage(destination);
  cpSync(source, destination, { recursive: true });
}
