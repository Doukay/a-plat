#!/usr/bin/env node
// Reprend un ancien dossier de maquettes d'À plat (plan.js à la racine, moteur dans a-plat/)
// dans le dossier a-plat/ d'aujourd'hui (sources/ et .cache/).
// Usage : node reprendre.mjs <ancien dossier> <nouveau dossier a-plat>
//
// - Recopie dans <nouveau>/sources/ : plan.js, passage-au-code.md, ecrans/ et actuel/. Rien n'y
//   est écrasé : un fichier déjà là est gardé, et la liste le dit.
// - Dans les écrans et les actuels HTML recopiés, met à jour les liens de l'outil :
//   ../commun.css → ../../.cache/commun.css (et ../charte.css juste après, pour un écran),
//   ../a-plat/relais.js → ../../.cache/relais.js, ../projet/… → ../../.cache/projet/….
// - Écrit sources/charte.css d'après l'ancien commun.css : son bloc UI, et les règles qu'il avait
//   en plus du modèle d'aujourd'hui, à relire. Rien de cela si charte.css existe déjà.
// - Ne touche jamais l'ancien dossier, et ne supprime rien : c'est à la personne.
// Ensuite : node copier.mjs <nouveau dossier> pour la page, et relancer style-du-projet.mjs pour
// la finition fidèle (son projet/ n'est pas recopié : il se reconstruit).
// Code de sortie : 0 fait, 2 usage, ancien dossier pas reconnu, ou nouveau dossier refusé.
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, writeSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { estDeLOutil, estUnLien } from "./dossier.mjs";

const MODELE = fileURLToPath(new URL("./modele", import.meta.url));

function sortir(code, lignes) {
  writeSync(code === 0 ? 1 : 2, lignes.join("\n") + "\n");
  process.exit(code);
}
// Une erreur du système (droits, fichier qui disparaît) se dit en français, sans trace.
process.on("uncaughtException", (erreur) => sortir(1, [`La reprise s'est arrêtée : ${erreur && erreur.code ? `code ${erreur.code}, ` : ""}${erreur && erreur.message ? erreur.message : erreur}. L'ancien dossier n'a pas été touché.`]));
function lire(chemin) {
  try { return readFileSync(chemin, "utf8"); } catch { return ""; }
}
function estUnDossier(chemin) {
  try { return statSync(chemin).isDirectory(); } catch { return false; }
}

const [ancienArg, nouveauArg] = process.argv.slice(2);
if (!ancienArg || !nouveauArg) sortir(2, ["Usage : node reprendre.mjs <ancien dossier> <nouveau dossier a-plat>"]);
const ancien = resolve(ancienArg);
const nouveau = resolve(nouveauArg);
if (!lire(join(ancien, "plan.js")).includes("window.A_PLAT")) {
  sortir(2, [`« ${ancienArg} » n'est pas un ancien dossier de maquettes d'À plat : il n'a pas de plan.js à sa racine. Rien n'est fait.`]);
}
if (ancien === nouveau) sortir(2, ["L'ancien et le nouveau dossier sont le même : choisir un nouveau dossier, en général <racine du projet>/a-plat."]);
if (existsSync(nouveau) && !estUnDossier(nouveau)) sortir(2, [`« ${nouveauArg} » existe et n'est pas un dossier. Rien n'est fait.`]);
// Le nouveau dossier : absent, vide, ou déjà un dossier d'À plat. Un simple .cache/ ou sources/ ne
// suffit pas : beaucoup de projets en ont un à leur racine.
if (estUnDossier(nouveau) && readdirSync(nouveau).length > 0 && !estDeLOutil(nouveau)) {
  sortir(2, [`« ${nouveauArg} » contient déjà des fichiers et n'est pas un dossier d'À plat (la racine du projet ?). Rien n'est fait : donner <racine du projet>/a-plat.`]);
}
if (["", "sources", "sources/ecrans", "sources/actuel", "sources/charte.css"].some((chemin) => estUnLien(join(nouveau, chemin)))) {
  sortir(2, [`« ${nouveauArg} » contient un lien qui mène ailleurs : rien n'est fait.`]);
}

const sources = join(nouveau, "sources");
mkdirSync(join(sources, "ecrans"), { recursive: true });
mkdirSync(join(sources, "actuel"), { recursive: true });
const recopies = [];
const gardes = [];

// Les liens de l'outil, d'un écran (avec la charte) ou d'un actuel (sans).
function nouveauxLiens(html, estUnEcran) {
  return html
    .replace(/(<link\b[^>]*href\s*=\s*["']?)\.\.\/commun\.css(["']?[^>]*>)/gi, (tout, avant, apres) =>
      `${avant}../../.cache/commun.css${apres}` + (estUnEcran ? `\n<link rel="stylesheet" href="../charte.css">` : ""))
    .replace(/(["'])\.\.\/a-plat\/relais\.js\1/gi, "$1../../.cache/relais.js$1")
    .replace(/(["'])\.\.\/projet\//gi, "$1../../.cache/projet/");
}

const enClair = (chemin) => relative(nouveau, chemin).split("\\").join("/");
const ignores = [];

function recopier(source, cible, transformer) {
  if (existsSync(cible)) { gardes.push(enClair(cible)); return; }
  if (estUnLien(source)) { ignores.push(`${relative(ancien, source).split("\\").join("/")} (un lien)`); return; }
  mkdirSync(join(cible, ".."), { recursive: true });
  if (transformer) writeFileSync(cible, transformer(readFileSync(source, "utf8")));
  else copyFileSync(source, cible, constants.COPYFILE_EXCL);
  recopies.push(enClair(cible));
}

// Un dossier, sous-dossiers compris ; les pages HTML ont leurs liens de l'outil mis à jour.
function recopierLeDossier(source, cible, estUnEcran) {
  for (const nom of readdirSync(source).sort()) {
    const chemin = join(source, nom);
    if (estUnLien(chemin)) { ignores.push(`${relative(ancien, chemin).split("\\").join("/")} (un lien)`); continue; }
    if (estUnDossier(chemin)) { recopierLeDossier(chemin, join(cible, nom), estUnEcran); continue; }
    const html = /\.html?$/i.test(nom);
    recopier(chemin, join(cible, nom), html ? (t) => nouveauxLiens(t, estUnEcran) : null);
  }
}

for (const nom of ["plan.js", "passage-au-code.md"]) {
  if (existsSync(join(ancien, nom))) recopier(join(ancien, nom), join(sources, nom));
}
for (const sous of ["ecrans", "actuel"]) {
  if (estUnDossier(join(ancien, sous))) recopierLeDossier(join(ancien, sous), join(sources, sous), sous === "ecrans");
}
// Le reste de l'ancien dossier (des images citées par les écrans, « ../img/logo.png »…) va dans
// sources/, à la même place par rapport aux écrans : leurs liens marchent encore. Les fichiers de
// l'outil d'avant, eux, ne se recopient pas : la page se refait.
const DE_L_OUTIL = new Set(["index.html", "a-plat", "commun.css", "ecran-type.html", "plan.js", "passage-au-code.md", "ecrans", "actuel", "projet", "plan.exemple.js"]);
for (const nom of readdirSync(ancien).sort()) {
  if (DE_L_OUTIL.has(nom)) continue;
  const chemin = join(ancien, nom);
  if (estUnLien(chemin)) { ignores.push(`${nom} (un lien)`); continue; }
  if (estUnDossier(chemin)) recopierLeDossier(chemin, join(sources, nom), false);
  else recopier(chemin, join(sources, nom), null);
}

// Les blocs de premier niveau d'une feuille (sélecteur et corps), commentaires retirés.
function blocs(css) {
  const sans = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const liste = [];
  let profondeur = 0;
  let debut = 0;
  for (let i = 0; i < sans.length; i++) {
    if (sans[i] === "{") profondeur++;
    else if (sans[i] === "}") {
      profondeur--;
      if (profondeur === 0) { liste.push(sans.slice(debut, i + 1).trim()); debut = i + 1; }
    }
  }
  return liste.filter(Boolean);
}
const normaliser = (bloc) => bloc.replace(/\s+/g, " ").trim();

let charte = "gardé tel quel";
const uxChangees = [];
const cheminCharte = join(sources, "charte.css");
if (!existsSync(cheminCharte)) {
  const ancienCommun = lire(join(ancien, "commun.css"));
  const modele = new Set(blocs(lire(join(MODELE, "commun.css"))).map(normaliser));
  const anciens = blocs(ancienCommun);
  const ui = anciens.find((b) => /^:root\[data-finition="ui"\]\s*\{/.test(b));
  const enPlus = anciens.filter((b) => b !== ui && !/^:root\s*\{/.test(b) && !modele.has(normaliser(b)));
  // L'ancien bloc UX (:root) : les variables qui n'ont plus la valeur du modèle sont dites, pas reprises.
  const variables = (bloc) => Object.fromEntries([...(bloc || "").matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].replace(/\s+/g, " ").trim().toLowerCase()]));
  const uxModele = variables(blocs(lire(join(MODELE, "commun.css"))).find((b) => /^:root\s*\{/.test(b)));
  const uxAncien = variables(anciens.find((b) => /^:root\s*\{/.test(b)));
  uxChangees.push(...Object.keys(uxAncien).filter((nom) => nom in uxModele && uxAncien[nom] !== uxModele[nom]));
  let texte = lire(join(MODELE, "charte.css"));
  // Une fonction en remplacement : un « $& » ou « $1 » de l'ancien bloc reste tel quel.
  if (ui) texte = texte.replace(/:root\[data-finition="ui"\]\s*\{[^}]*\}/, () => ui);
  if (enPlus.length) {
    texte += `\n/* Repris de l'ancien commun.css par reprendre.mjs : les règles qu'il avait en plus du modèle.\n   À relire : une règle du modèle d'avant peut s'y trouver aussi. */\n${enPlus.join("\n\n")}\n`;
  }
  writeFileSync(cheminCharte, texte);
  charte = ui ? `écrit, avec le bloc UI de l'ancien commun.css${enPlus.length ? ` et ${enPlus.length} règles en plus à relire` : ""}` : "écrit, bloc UI de départ (l'ancien commun.css n'en avait pas)";
  recopies.push("sources/charte.css");
}

const lignes = [`Repris de ${ancien} dans ${sources} :`];
lignes.push(recopies.length ? `- recopié (${recopies.length}) : ${recopies.join(", ")}` : "- rien de nouveau à recopier");
if (gardes.length) lignes.push(`- déjà là, gardé tel quel (${gardes.length}) : ${gardes.join(", ")}`);
if (ignores.length) lignes.push(`- pas recopié (${ignores.length}) : ${ignores.join(", ")}`);
if (uxChangees.length) lignes.push(`- l'ancien bloc UX (:root) avait été changé (${uxChangees.join(", ")}) : ces valeurs ne sont pas reprises ; si elles venaient du projet, les reporter dans le bloc UI de charte.css.`);
lignes.push(`- charte.css : ${charte}`);
lignes.push("L'ancien dossier n'est pas touché : le retirer, une fois le nouveau vérifié, est à la personne.");
lignes.push(`Ensuite : node copier.mjs "${nouveauArg}", puis le contrôle ; pour la finition fidèle, relancer style-du-projet.mjs.`);
sortir(0, lignes);
