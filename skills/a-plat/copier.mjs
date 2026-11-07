#!/usr/bin/env node
// Met en place la page d'À plat dans le dossier a-plat/ d'un projet, ou la refait.
// Usage : node copier.mjs <dossier>   (en général <racine du projet>/a-plat)
//
// Le dossier a deux parts (voir references/format.md) :
// - sources/ : le travail (plan.js, charte.css, ecrans/, actuel/, passage-au-code.md), à garder
//   dans Git. Ce script n'y écrit que ce qui manque : sources/, ecrans/, actuel/, et charte.css
//   (le bloc UI de départ) s'il n'existe pas. Jamais plan.js : Claude l'écrit. Rien n'y est écrasé.
// - le reste se refait à chaque passage : index.html, .gitignore, et .cache/ (le moteur de la page,
//   commun.css, ecran-type.html). Une mise à jour du plugin atteint ainsi les dossiers déjà faits.
//   Ce que .cache/ contient d'autre (projet/, écrit par style-du-projet.mjs) est laissé.
// Il n'écrit rien hors de ce dossier : ni CLAUDE.md, ni le .gitignore du projet.
// Refuse un dossier qui a déjà des fichiers sans être à l'outil, et un ancien dossier de
// maquettes (plan.js à la racine) : celui-là se reprend avec reprendre.mjs.
// Code de sortie : 0 fait, 1 modèle abîmé ou copie ratée, 2 dossier absent, refusé, pas un
// dossier, ancien format, ou impossible à lire ou à créer.
// Node seul, sans bibliothèque (Node 18 ou plus).
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync, writeSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { estDeLOutil, estUnAncienDossier, estUnLien } from "./dossier.mjs";

const MODELE = fileURLToPath(new URL("./modele", import.meta.url));
const DOSSIERS = ["sources", "sources/ecrans", "sources/actuel", ".cache"];
// Le .gitignore du dossier : seul sources/ suit le projet dans Git.
const GITIGNORE = "# Écrit par À plat : seul sources/ est à garder dans Git, le reste se refait.\n*\n!.gitignore\n!sources/\n!sources/**\n";

// writeSync : le message part en entier avant la sortie, même vers un tuyau sous Windows.
function sortir(code, lignes) {
  writeSync(code === 0 ? 1 : 2, lignes.join("\n") + "\n");
  process.exit(code);
}

// Fait l'action ; si le système la refuse, sort avec ce code et un message en français,
// sans trace d'erreur.
function essayer(action, code, message) {
  try {
    return action();
  } catch (erreur) {
    return sortir(code, [`${message} (${erreur && erreur.code ? `code ${erreur.code}` : "erreur du système"}).`]);
  }
}

// Ce qui se refait : [source dans le modèle, destination dans le dossier].
function aRefaire() {
  return essayer(() => {
    const moteur = readdirSync(join(MODELE, "a-plat")).filter((nom) => statSync(join(MODELE, "a-plat", nom)).isFile()).sort();
    return [
      ["index.html", "index.html"],
      ["commun.css", ".cache/commun.css"],
      ["ecran-type.html", ".cache/ecran-type.html"],
      ...moteur.map((nom) => [`a-plat/${nom}`, `.cache/${nom}`])
    ];
  }, 1, "Le modèle est abîmé : le dossier a-plat du skill ne peut pas être lu. Rien n'a été copié");
}

const argument = process.argv[2];
if (!argument) {
  sortir(2, ["Il manque le dossier où mettre la page. Usage : node copier.mjs <dossier>, en général <racine du projet>/a-plat"]);
}

const destination = resolve(argument);
if (basename(destination) === "sources" && estDeLOutil(dirname(destination))) {
  sortir(2, [`« ${argument} » est le sous-dossier sources/ d'un dossier d'À plat : rien n'a été copié. Donner le dossier qui le contient (en général <racine du projet>/a-plat).`]);
}
// Rien ne s'écrit à travers un lien symbolique ou une jonction : il mènerait hors du dossier.
const liens = ["", "index.html", ".gitignore", ".cache", "sources", "sources/charte.css"].filter((chemin) => estUnLien(join(destination, chemin)));
if (liens.length > 0) {
  sortir(2, [`Le dossier « ${argument} » contient un lien qui mène ailleurs (${liens.map((l) => l || "le dossier lui-même").join(", ")}) : rien n'a été copié.`]);
}
if (existsSync(destination)) {
  const infos = essayer(() => statSync(destination), 2, `« ${argument} » ne peut pas être lu : rien n'a été copié`);
  if (!infos.isDirectory()) {
    sortir(2, [`« ${argument} » existe et n'est pas un dossier : rien n'a été copié.`]);
  }
  const contenu = essayer(() => readdirSync(destination), 2, `Le dossier « ${argument} » ne peut pas être lu : rien n'a été copié`);
  if (contenu.length > 0 && !estDeLOutil(destination)) {
    if (estUnAncienDossier(destination)) {
      sortir(2, [
        `Le dossier « ${argument} » est un ancien dossier de maquettes d'À plat (plan.js à la racine) : rien n'a été copié.`,
        "Pour le passer au dossier a-plat/ : node reprendre.mjs <ce dossier> <racine du projet>/a-plat (voir references/etat-des-lieux.md)."
      ]);
    }
    sortir(2, [
      `Le dossier « ${argument} » contient déjà des fichiers et n'est pas un dossier d'À plat : rien n'a été copié.`,
      "Choisissez un autre dossier, par exemple un nouveau dossier à côté de celui-ci."
    ]);
  }
}

const fichiers = aRefaire();
for (const [source] of fichiers) {
  if (!existsSync(join(MODELE, source))) sortir(1, [`Le modèle est abîmé : ${source} manque dans le dossier du skill. Rien n'a été copié.`]);
}
if (!existsSync(join(MODELE, "charte.css"))) sortir(1, ["Le modèle est abîmé : charte.css manque dans le dossier du skill. Rien n'a été copié."]);

const crees = [];
for (const sous of ["", ...DOSSIERS]) {
  const chemin = join(destination, sous);
  if (!existsSync(chemin)) {
    essayer(() => mkdirSync(chemin, { recursive: true }), 2,
      `Le dossier « ${sous ? `${argument}/${sous}` : argument} » ne peut pas être créé : rien n'a été copié`);
    if (sous) crees.push(`${sous}/`);
  }
}

const refaits = [];
const ciblesLiees = fichiers.map(([, cible]) => cible).filter((cible) => estUnLien(join(destination, cible)));
if (ciblesLiees.length > 0) {
  sortir(2, [`Ces fichiers du dossier sont des liens qui mènent ailleurs : ${ciblesLiees.join(", ")}. Rien n'a été copié.`]);
}
for (const [source, cible] of fichiers) {
  try {
    copyFileSync(join(MODELE, source), join(destination, cible));
    refaits.push(cible);
  } catch (erreur) {
    sortir(1, [`La copie de ${cible} a échoué : ${erreur.message}`, `Déjà refait : ${refaits.join(", ") || "rien"}.`]);
  }
}
essayer(() => writeFileSync(join(destination, ".gitignore"), GITIGNORE), 1, "Le fichier .gitignore du dossier ne peut pas être écrit");
refaits.push(".gitignore");

// sources/charte.css : seulement s'il manque. COPYFILE_EXCL : la copie échoue plutôt que d'écraser.
let charte = "gardé tel quel";
try {
  copyFileSync(join(MODELE, "charte.css"), join(destination, "sources", "charte.css"), constants.COPYFILE_EXCL);
  crees.push("sources/charte.css");
  charte = "créé";
} catch (erreur) {
  if (erreur.code !== "EEXIST") sortir(1, [`La copie de sources/charte.css a échoué : ${erreur.message}`]);
}

const lignes = [`Dossier d'À plat : ${destination}`];
lignes.push(`Page refaite (${refaits.length} fichiers) : index.html, .gitignore et .cache/.`);
if (crees.length) lignes.push(`Créé : ${crees.join(", ")}.`);
lignes.push(`sources/ n'est jamais écrasé (charte.css : ${charte}).${existsSync(join(destination, "sources", "plan.js")) ? "" : " sources/plan.js reste à écrire."}`);
lignes.push("À garder dans Git : sources/ seulement ; le .gitignore du dossier ignore le reste. Rien n'est écrit hors de ce dossier.");
sortir(0, lignes);
