#!/usr/bin/env node
// Construit le vrai style du projet pour la finition « fidele » : les écrans sont écrits avec le
// balisage et les classes du projet, et chargent ce style (voir references/fidele.md).
// Usage : node style-du-projet.mjs <dossier a-plat> <feuille d'entrée du projet> [--modules <dossier>]
//
// - Écrit seulement dans <dossier>/.cache/projet/ : projet.css, gris.css, polices.css et polices/,
//   fichiers/ (images et polices citées par la feuille, rangées selon leur chemin dans le projet).
// - Ne lit que dans le projet (le dossier de son package.json, au-dessus de la feuille) et dans
//   ses paquets installés : un fichier cité hors du projet n'est pas copié, et il le dit.
// - Tailwind 4 (la feuille fait @import "tailwindcss") : compilé avec le Tailwind installé dans le
//   projet, pour les seules classes des écrans et des actuels qui chargent ../../.cache/projet/projet.css.
//   Ses extensions (@plugin, @config) sont du code du projet : elles s'exécutent aussi.
//   Sans Tailwind installé, ou avec un style que l'outil ne sait pas construire (Tailwind 3,
//   @apply hors Tailwind 4), il s'arrête (code 2) : proposer alors la finition charte.
// - Une feuille ordinaire : recopiée, avec ses @import locaux mis bout à bout.
// - Les polices des paquets @fontsource importés par le projet sont copiées.
// - Rien ne vient d'Internet : un @import, une url() ou une adresse en ligne est retiré et cité.
// - --modules <dossier> (ou --modules=<dossier>) : d'où lire les paquets installés, s'ils ne sont
//   pas au-dessus de la feuille.
// Ce script exécute des paquets installés du projet : il se lance avec l'accord de la personne.
// Code de sortie : 0 fait, 1 feuille illisible ou construction ratée, 2 usage, dossier refusé,
// ou style que l'outil ne sait pas construire.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const GRIS = `/* L'UX de la finition fidèle : le même écran, en gris et dans la police du système.
   Le bouton UX | UI de la page pose data-finition="ui" sur <html> pour l'UI ; sans lui, c'est l'UX.
   Le filtre est sur <html> : il ne déplace pas les éléments fixes (une barre du bas).
   Les polices d'icônes (Material, Font Awesome) gardent la leur, sinon elles deviendraient des mots.
   Écrit par style-du-projet.mjs : un actuel ne charge jamais ce fichier. */
html:not([data-finition="ui"]) { filter: grayscale(1); }
html:not([data-finition="ui"]) body,
html:not([data-finition="ui"]) body *:not([class*="material-icons"]):not([class*="material-symbols"]):not(.fa):not([class^="fa-"]):not([class*=" fa-"]) {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
}
`;

function sortir(code, lignes) {
  process.stdout.write(lignes.join("\n") + "\n");
  process.exit(code);
}

function estUnDossier(chemin) {
  try { return statSync(chemin).isDirectory(); } catch { return false; }
}
function estUnFichier(chemin) {
  try { return statSync(chemin).isFile(); } catch { return false; }
}
function lire(chemin) {
  try { return readFileSync(chemin, "utf8"); } catch { return ""; }
}
function lireJson(chemin) {
  try { return JSON.parse(readFileSync(chemin, "utf8")); } catch { return null; }
}
// Vrai si chemin est dans dossier (ou est dossier).
function dans(dossier, chemin) {
  const r = relative(dossier, chemin);
  return r === "" || (!r.startsWith("..") && !isAbsolute(r));
}

const enLigne = (adresse) => /^\s*(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(adresse) && !/^\s*file:/i.test(adresse);
const sansGuillemets = (texte) => texte.trim().replace(/^["']|["']$/g, "");

// ---------------------------------------------------------------- arguments

const args = process.argv.slice(2);
const positionnels = [];
let modulesDonnes = null;
let modulesManquant = false;
for (let i = 0; i < args.length; i++) {
  const egal = /^--modules=(.*)$/.exec(args[i]);
  if (egal) {
    modulesDonnes = egal[1] || null;
    modulesManquant = !modulesDonnes;
  } else if (args[i] === "--modules") {
    modulesDonnes = args[i + 1] || null;
    modulesManquant = !modulesDonnes;
    i++;
  } else {
    positionnels.push(args[i]);
  }
}
if (positionnels.length !== 2 || modulesManquant) {
  sortir(2, ["Usage : node style-du-projet.mjs <dossier des maquettes> <feuille d'entrée du projet> [--modules <dossier>]"]);
}
const dossier = resolve(positionnels[0]);
const feuille = resolve(positionnels[1]);

if (!estUnDossier(dossier) || !(estUnFichier(join(dossier, ".cache", "moteur.js")) || lire(join(dossier, "sources", "plan.js")).includes("window.A_PLAT"))) {
  sortir(2, [`Le dossier « ${positionnels[0]} » n'est pas un dossier a-plat d'À plat (ni .cache/moteur.js, ni sources/plan.js) : rien n'est écrit.`]);
}
if (!estUnFichier(feuille)) sortir(1, [`La feuille « ${positionnels[1]} » est introuvable.`]);
if (dans(dossier, feuille)) sortir(2, ["La feuille d'entrée est dans le dossier des maquettes : il faut celle du projet."]);

// La racine du projet : le dossier de son package.json, au-dessus de la feuille ; sinon le dossier
// de la feuille. On ne lit rien au-dessus.
function racineDuProjet() {
  for (let ici = dirname(feuille); ; ici = dirname(ici)) {
    if (estUnFichier(join(ici, "package.json"))) return ici;
    if (dirname(ici) === ici) return dirname(feuille);
  }
}
const racine = racineDuProjet();
const modules = resolve(modulesDonnes || racine);
const requis = createRequire(join(modules, "noop.js"));

const sortie = join(dossier, ".cache", "projet");
if (!estUnDossier(sortie)) {
  try { mkdirSync(sortie, { recursive: true }); } catch {
    sortir(1, [`Le dossier ${join(positionnels[0], ".cache", "projet")} ne peut pas être créé (un fichier porte-t-il ce nom ?).`]);
  }
}
const retires = [];   // ce qui venait d'Internet
const absents = [];   // fichiers cités introuvables
const dehors = [];    // fichiers cités hors du projet, pas copiés

// ---------------------------------------------------------------- les écrans qui chargent le style

const CHARGE_LE_PROJET = /<link\b[^>]*href\s*=\s*["']?\.\.\/\.\.\/\.cache\/projet\/projet\.css/i;

function ecransFideles() {
  const liste = [];
  for (const sous of ["ecrans", "actuel"]) {
    const chemin = join(dossier, "sources", sous);
    if (!estUnDossier(chemin)) continue;
    for (const nom of readdirSync(chemin).sort()) {
      if (!/\.html?$/i.test(nom)) continue;
      const texte = lire(join(chemin, nom));
      if (CHARGE_LE_PROJET.test(texte)) liste.push({ nom: `sources/${sous}/${nom}`, texte });
    }
  }
  return liste;
}

// ---------------------------------------------------------------- ce qui vient d'Internet

// Le dernier passage sur la feuille finale : tout @import, url() ou texte entre guillemets qui
// vise une adresse en ligne est retiré. Les data: et les commentaires sont laissés.
// Les url(data:…) se mettent de côté le temps du passage : un SVG intégré contient des adresses
// (xmlns='http://www.w3.org/2000/svg') qui ne se chargent pas.
const DONNEES = /url\(\s*"data:[^"]*"\s*\)|url\(\s*'data:[^']*'\s*\)|url\(\s*data:[^)]*\)/gi;

function retirerLEnLigne(css) {
  const gardees = [];
  let resultat = css.replace(DONNEES, (tout) => { gardees.push(tout); return `\u0000DONNEE${gardees.length - 1}\u0000`; });
  resultat = resultat.replace(/@import\s+(?:url\(\s*(["']?)([^"')]*)\1\s*\)|(["'])((?:(?!\3).)*)\3)[^;]*;/gi, (tout, g1, cibleUrl, g3, cibleTexte) => {
    const cible = (cibleUrl !== undefined ? cibleUrl : cibleTexte) || "";
    if (!enLigne(cible)) return tout;
    retires.push(cible.trim());
    return `/* retiré (en ligne) : ${cible.trim().replace(/\*\//g, "* /")} */`;
  });
  resultat = resultat.replace(/url\(\s*(["']?)([^"')]*)\1\s*\)/gi, (tout, g, adresse) => {
    if (!enLigne(adresse)) return tout;
    retires.push(adresse.trim());
    return "none";
  });
  resultat = resultat.replace(/(["'])((?:[a-z][a-z0-9+.-]*:)?\/\/[^"']*)\1/gi, (tout, g, adresse) => {
    if (!enLigne(adresse)) return tout;
    retires.push(adresse.trim());
    return '""';
  });
  return resultat.replace(/\u0000DONNEE(\d+)\u0000/g, (t, i) => gardees[Number(i)]);
}

// ---------------------------------------------------------------- les fichiers cités par url()

// Le fichier qu'une url() cite, ou null. Une adresse qui commence par / vise le dossier public/
// du projet (Vite, Next) ; tout ce qui sort du projet est refusé.
function fichierCite(adresse, dossierDeLaFeuille) {
  const propre = adresse.split(/[?#]/)[0];
  let source;
  if (/^\/(?!\/)/.test(propre)) source = join(racine, "public", propre);
  else if (isAbsolute(propre)) source = resolve(propre);
  else source = resolve(dossierDeLaFeuille, propre);
  if (!dans(racine, source) && !dans(modules, source)) { dehors.push(adresse); return null; }
  if (!estUnFichier(source)) { absents.push(adresse); return null; }
  return source;
}

// Copie dans .cache/projet/fichiers/, sous son chemin dans le projet (deux logo.png ne s'écrasent pas),
// chaque fichier local cité par url(), et réécrit l'adresse.
function recopierLesFichiers(css, dossierDeLaFeuille) {
  const gardees = [];
  const sansDonnees = css.replace(DONNEES, (tout) => { gardees.push(tout); return `\u0000DONNEE${gardees.length - 1}\u0000`; });
  return sansDonnees.replace(/url\(\s*(["']?)([^"')]*)\1\s*\)/gi, (tout, g, brut) => {
    const adresse = sansGuillemets(brut);
    if (!adresse || /^(data:|#)/i.test(adresse) || enLigne(adresse)) return tout;
    const source = fichierCite(adresse, dossierDeLaFeuille);
    if (!source) return tout;
    const base = dans(racine, source) ? racine : modules;
    const rangement = relative(base, source).split(sep).join("/");
    const cible = join(sortie, "fichiers", ...rangement.split("/"));
    mkdirSync(dirname(cible), { recursive: true });
    copyFileSync(source, cible);
    return `url("fichiers/${rangement}")`;
  }).replace(/\u0000DONNEE(\d+)\u0000/g, (t, i) => gardees[Number(i)]);
}

// ---------------------------------------------------------------- feuille ordinaire

// La condition d'un @import (« layer(base) », « supports(display: grid) », « screen and … ») en
// bloc qui l'entoure.
function entourer(contenu, condition) {
  let reste = condition.trim();
  let avant = "";
  let apres = "";
  const couche = /^layer(?:\(([^)]*)\))?\s*/i.exec(reste);
  if (couche) {
    avant += `@layer${couche[1] ? " " + couche[1].trim() : ""} {\n`;
    apres = "\n}" + apres;
    reste = reste.slice(couche[0].length);
  }
  const support = /^supports\(((?:[^()]|\([^()]*\))*)\)\s*/i.exec(reste);
  if (support) {
    avant += `@supports (${support[1].trim()}) {\n`;
    apres = "\n}" + apres;
    reste = reste.slice(support[0].length);
  }
  if (reste.trim()) {
    avant += `@media ${reste.trim()} {\n`;
    apres = "\n}" + apres;
  }
  return avant + contenu + apres;
}

// Met bout à bout les @import locaux. Les url() de chaque feuille se recopient par rapport à elle,
// avant d'y mettre ses @import : chaque fichier n'est traité qu'une fois.
function aplatir(chemin, vus) {
  const texte = lire(chemin);
  const ici = dirname(chemin);
  const morceaux = [];
  const marque = (i) => `\u0000IMPORT${i}\u0000`;
  const sansImports = texte.replace(/@import\s+(?:url\(\s*(["']?)([^"')]*)\1\s*\)|(["'])((?:(?!\3).)*)\3)([^;]*);/gi, (tout, g1, cibleUrl, g3, cibleTexte, suite) => {
    const cible = ((cibleUrl !== undefined ? cibleUrl : cibleTexte) || "").trim();
    if (enLigne(cible)) { morceaux.push(tout); return marque(morceaux.length - 1); }
    if (/^tailwindcss(\/|$)/.test(cible)) { morceaux.push(tout); return marque(morceaux.length - 1); }
    const fichier = resolve(ici, cible);
    if (!dans(racine, fichier)) { dehors.push(cible); morceaux.push(`/* pas recopié (hors du projet) : ${cible} */`); return marque(morceaux.length - 1); }
    if (!estUnFichier(fichier)) { absents.push(cible); morceaux.push(tout); return marque(morceaux.length - 1); }
    // Un fichier déjà mis sans condition ne se remet pas ; avec une condition, il se remet dedans.
    if (!suite.trim() && vus.has(fichier)) { morceaux.push(""); return marque(morceaux.length - 1); }
    if (!suite.trim()) vus.add(fichier);
    morceaux.push(entourer(aplatir(fichier, vus), suite));
    return marque(morceaux.length - 1);
  });
  return recopierLesFichiers(sansImports, ici).replace(/\u0000IMPORT(\d+)\u0000/g, (t, i) => morceaux[Number(i)]);
}

// ---------------------------------------------------------------- Tailwind 4

async function construireTailwind(css) {
  let noeud, oxyde;
  try {
    noeud = await import(pathToFileURL(requis.resolve("@tailwindcss/node")).href);
    oxyde = requis("@tailwindcss/oxide");
  } catch {
    sortir(2, [
      `La feuille utilise Tailwind, mais Tailwind n'est pas installé à partir de « ${modules} » (@tailwindcss/node, @tailwindcss/oxide).`,
      "Sans lui, le vrai style ne peut pas être construit : la finition fidèle demande que le projet soit installé. C'est la décision de la personne ; sinon, proposer la finition charte."
    ]);
  }
  // Les paquets (tailwindcss, ses extensions) se lisent dans --modules ; les fichiers relatifs,
  // à côté de la feuille. Un chemin introuvable rend undefined : Tailwind cherche alors lui-même.
  const paquet = (id) => !id.startsWith(".") && !isAbsolute(id);
  const resoudreCss = async (id) => {
    if (!paquet(id)) return undefined;
    try {
      const parties = id.split("/");
      const nom = parties.slice(0, id.startsWith("@") ? 2 : 1).join("/");
      const reste = parties.slice(id.startsWith("@") ? 2 : 1).join("/");
      const dossierDuPaquet = dossierDe(nom);
      const description = lireJson(join(dossierDuPaquet, "package.json")) || {};
      const sortiePour = (cle) => {
        const valeur = description.exports && typeof description.exports === "object" ? description.exports[cle] : undefined;
        if (typeof valeur === "string") return valeur;
        if (valeur && typeof valeur === "object") return valeur.style || valeur.default || valeur.import;
        return undefined;
      };
      let cible;
      if (reste) cible = sortiePour(`./${reste}`) || (reste.endsWith(".css") ? reste : `${reste}.css`);
      else cible = description.style || sortiePour(".") || "index.css";
      const chemin = join(dossierDuPaquet, cible);
      return estUnFichier(chemin) ? chemin : undefined;
    } catch { return undefined; }
  };
  const resoudreJs = async (id) => {
    if (!paquet(id)) return undefined;
    try { return requis.resolve(id); } catch { return undefined; }
  };
  const compilateur = await noeud.compile(css, {
    base: dirname(feuille),
    from: feuille,
    onDependency: () => {},
    shouldRewriteUrls: true,
    customCssResolver: resoudreCss,
    customJsResolver: resoudreJs
  });
  const candidats = new Set();
  const scanner = new oxyde.Scanner({});
  const ecrans = ecransFideles();
  for (const ecran of ecrans) {
    for (const c of scanner.scanFiles([{ content: ecran.texte, extension: "html" }])) candidats.add(c);
  }
  return { css: compilateur.build([...candidats]), ecrans: ecrans.length, classes: candidats.size, version: versionDe("tailwindcss") };
}

function versionDe(nom) {
  const description = lireJson(join(dossierDe(nom), "package.json"));
  return description && description.version ? description.version : "?";
}

// Le dossier d'un paquet installé, cherché dans les node_modules comme le fait Node, sans passer
// par ses « exports » (qui ne donnent pas toujours package.json). Lève une erreur s'il manque.
function dossierDe(nom) {
  for (const lieu of requis.resolve.paths(nom) || []) {
    if (estUnFichier(join(lieu, nom, "package.json"))) return join(lieu, nom);
  }
  throw new Error(`paquet ${nom} introuvable`);
}

// ---------------------------------------------------------------- polices @fontsource

// Les feuilles @fontsource que le code du projet importe (« @fontsource/inter/600.css ») ; à
// défaut, l'index de chaque paquet @fontsource de son package.json.
function feuillesDesPolices() {
  const trouvees = new Set();
  const lireDossier = (ici, profondeur) => {
    if (profondeur > 6) return;
    let noms;
    try { noms = readdirSync(ici, { withFileTypes: true }); } catch { return; }
    for (const entree of noms) {
      if (entree.name.startsWith(".") || entree.name === "node_modules" || entree.name === "dist" || entree.name === "build") continue;
      const chemin = join(ici, entree.name);
      if (entree.isDirectory()) lireDossier(chemin, profondeur + 1);
      else if (/\.(m?[jt]sx?|css)$/i.test(entree.name)) {
        for (const m of lire(chemin).matchAll(/["'](@fontsource(?:-variable)?\/[a-z0-9-]+)(\/[^"']+)?["']/gi)) {
          trouvees.add(`${m[1]}${m[2] || ""}`);
        }
      }
    }
  };
  lireDossier(join(racine, "src"), 0);
  if (trouvees.size === 0) {
    const description = lireJson(join(racine, "package.json")) || {};
    const deps = { ...(description.dependencies || {}), ...(description.devDependencies || {}) };
    for (const nom of Object.keys(deps)) if (/^@fontsource(-variable)?\//.test(nom)) trouvees.add(nom);
  }
  return [...trouvees].sort();
}

function copierLesPolices() {
  let feuilleDesPolices = "/* Polices du projet (paquets @fontsource, licence de chaque paquet), copiées depuis ses modules installés. */\n";
  const copiees = new Set();
  for (const id of feuillesDesPolices()) {
    const parties = id.split("/");
    const nom = parties.slice(0, 2).join("/");
    const reste = parties.slice(2).join("/");
    let dossierDuPaquet;
    try { dossierDuPaquet = dossierDe(nom); } catch { absents.push(nom); continue; }
    const chemin = join(dossierDuPaquet, reste ? (reste.endsWith(".css") ? reste : `${reste}.css`) : "index.css");
    const css = lire(chemin);
    if (!css) { absents.push(id); continue; }
    for (const bloc of css.match(/@font-face\s*\{[^}]*\}/g) || []) {
      const adresses = [...bloc.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]);
      // Le latin et le latin étendu suffisent au français.
      if (!adresses.some((a) => /-latin(-ext)?-/.test(a))) continue;
      let blocRecopie = bloc;
      for (const adresse of adresses) {
        const source = resolve(dirname(chemin), adresse);
        if (!estUnFichier(source)) { blocRecopie = blocRecopie.replace(adresse, ""); continue; }
        mkdirSync(join(sortie, "polices"), { recursive: true });
        copyFileSync(source, join(sortie, "polices", basename(source)));
        copiees.add(basename(source));
        blocRecopie = blocRecopie.replace(adresse, `polices/${basename(source)}`);
      }
      feuilleDesPolices += blocRecopie + "\n";
    }
  }
  writeFileSync(join(sortie, "polices.css"), feuilleDesPolices);
  return [...copiees];
}

// ---------------------------------------------------------------- la construction

const A_CONSTRUIRE = /@tailwind\s|@apply\s|@theme\b|@plugin\s|@config\s|@import\s+(?:url\()?\s*["']tailwindcss/;
const source = lire(feuille);
let resultat;
let entete;
try {
  if (/@import\s+(?:url\()?\s*["']tailwindcss(?:\/[^"']*)?["']/.test(source)) {
    const construit = await construireTailwind(source);
    resultat = recopierLesFichiers(construit.css, dirname(feuille));
    entete = `Construit par style-du-projet.mjs depuis ${basename(feuille)} (Tailwind ${construit.version}), pour les classes de ${construit.ecrans} écrans et actuels (${construit.classes} classes).`;
    if (construit.ecrans === 0) entete += " Aucun écran ne charge encore ce style : relancer le script après les premiers écrans.";
  } else if (/@tailwind\s/.test(source)) {
    sortir(2, ["La feuille utilise Tailwind 3 (@tailwind) : l'outil ne sait pas le construire. Proposer la finition charte."]);
  } else {
    resultat = aplatir(feuille, new Set());
    if (A_CONSTRUIRE.test(resultat)) {
      sortir(2, ["La feuille, une fois mise bout à bout, contient encore des règles à construire (@tailwind, @apply, @theme, @plugin ou un import de Tailwind) : l'outil ne sait pas la construire depuis cette feuille.",
        "Si Tailwind 4 est importé dans une autre feuille, donner celle-là ; sinon, proposer la finition charte."]);
    }
    entete = `Recopié par style-du-projet.mjs depuis ${basename(feuille)}, @import locaux compris.`;
  }
} catch (erreur) {
  sortir(1, [`La construction du style a échoué : ${erreur && erreur.message ? erreur.message : erreur}`]);
}

resultat = retirerLEnLigne(resultat);
writeFileSync(join(sortie, "projet.css"), `/* ${entete} Ne pas modifier : relancer le script. */\n${resultat}`);
writeFileSync(join(sortie, "gris.css"), GRIS);
const polices = copierLesPolices();

const lignes = [
  `Style écrit dans ${join(positionnels[0], ".cache", "projet")} : projet.css, gris.css, polices.css (${polices.length} ${polices.length > 1 ? "polices" : "police"}).`,
  entete
];
if (retires.length) lignes.push(`Retiré, car en ligne : ${[...new Set(retires)].join(", ")}.`);
if (dehors.length) lignes.push(`Pas recopiés, car hors du projet : ${[...new Set(dehors)].join(", ")}.`);
if (absents.length) lignes.push(`Cités mais introuvables, laissés tels quels : ${[...new Set(absents)].join(", ")}.`);
sortir(0, lignes);
