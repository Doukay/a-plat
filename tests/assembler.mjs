// Le seul endroit où l'on assemble un dossier de maquettes pour les essais :
// le modèle de page (skills/a-plat/modele), puis une fixture par-dessus.
// Une fixture ne contient jamais de copie de la page : seulement plan.js, ecrans/ et actuel/.
// Aucune bibliothèque ici, pour que tests/assembler-demo.mjs marche avec Node seul.
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MODELE = fileURLToPath(new URL("../skills/a-plat/modele", import.meta.url));
export const FIXTURES = fileURLToPath(new URL("./fixtures", import.meta.url));

// Copie le modèle puis la fixture dans `destination` (qui doit déjà exister ou être créable).
// La fixture est donnée par son nom (« demo ») ou par un chemin absolu.
export function copierLeModeleEtLaFixture(destination, fixture) {
  const source = resolve(FIXTURES, fixture);
  if (!existsSync(source)) throw new Error(`Fixture introuvable : ${fixture}`);
  cpSync(MODELE, destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}
