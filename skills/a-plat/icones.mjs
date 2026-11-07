#!/usr/bin/env node
// Écrit le SVG exact des icônes Lucide du projet, rendues par son propre lucide-react, pour les
// écrans de la finition « fidele » (voir references/fidele.md).
// Usage : node icones.mjs <dossier du projet> Nom1 Nom2 … [--classe="h-4 w-4"] [--trait=1.5] [--taille=20]
//
// - Nom : celui de l'import du projet (Home, Trash2, AlertTriangle…), alias compris.
// - --classe, --trait, --taille : la className, le strokeWidth et la size du JSX.
// - Lit react, react-dom et lucide-react installés dans le projet, sans rien écrire.
// Une icône introuvable sort un commentaire HTML qui le dit. Code de sortie : 0 fait, 2 usage
// ou bibliothèques absentes.
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const options = {};
const noms = [];
for (const arg of args) {
  const option = /^--(classe|trait|taille)=(.*)$/.exec(arg);
  if (option) options[option[1]] = option[2];
  else noms.push(arg);
}
const projet = noms.shift();
if (!projet || noms.length === 0) {
  process.stdout.write('Usage : node icones.mjs <dossier du projet> Nom1 Nom2 … [--classe="h-4 w-4"] [--trait=1.5] [--taille=20]\n');
  process.exit(2);
}

const requis = createRequire(join(resolve(projet), "noop.js"));
let React, serveur, lucide;
try {
  React = requis("react");
  serveur = requis("react-dom/server");
  lucide = requis("lucide-react");
} catch {
  process.stdout.write(`react, react-dom et lucide-react ne sont pas installés à partir de « ${projet} » : les icônes ne peuvent pas être rendues comme dans l'appli.\n`);
  process.exit(2);
}

// Une icône de lucide-react est un composant React (forwardRef) ; icons, createLucideIcon ou
// default n'en sont pas.
const estUneIcone = (valeur) => Boolean(valeur) && typeof valeur === "object" && typeof valeur.render === "function";

for (const nom of noms) {
  const Composant = Object.prototype.hasOwnProperty.call(lucide, nom) ? lucide[nom] : undefined;
  if (!estUneIcone(Composant)) {
    process.stdout.write(`<!-- icône ${nom} introuvable dans lucide-react -->\n`);
    continue;
  }
  const proprietes = {};
  if (options.classe) proprietes.className = options.classe;
  if (options.trait) proprietes.strokeWidth = Number(options.trait);
  if (options.taille) proprietes.size = Number(options.taille);
  try {
    process.stdout.write(serveur.renderToStaticMarkup(React.createElement(Composant, proprietes)) + "\n");
  } catch (erreur) {
    process.stdout.write(`<!-- icône ${nom} : le rendu a échoué (${erreur && erreur.message ? erreur.message : erreur}) -->\n`);
  }
}
