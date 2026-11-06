#!/usr/bin/env node
// Copie la page d'À plat (le dossier modele/) dans un dossier de maquettes.
// Usage : node copier.mjs <dossier>
//
// - Crée le dossier s'il n'existe pas, avec ecrans/ et actuel/.
// - Copie index.html, commun.css, ecran-type.html et tout a-plat/. Jamais plan.js : Claude l'écrit.
// - N'écrase jamais un fichier qui existe : il est gardé tel quel, et la liste le dit.
// - Refuse un dossier qui a déjà des fichiers sans être à l'outil (ni a-plat/moteur.js,
//   ni plan.js d'À plat) : rien n'y est écrit.
// Code de sortie : 0 copie faite ou déjà complète, 1 modèle abîmé, 2 dossier absent, refusé ou pas un dossier.
// Node seul, sans bibliothèque (Node 18 ou plus).
import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MODELE = fileURLToPath(new URL("./modele", import.meta.url));
const DOSSIERS = ["a-plat", "ecrans", "actuel"];

function aCopier() {
  const moteur = readdirSync(join(MODELE, "a-plat")).filter((nom) => statSync(join(MODELE, "a-plat", nom)).isFile());
  return ["index.html", "commun.css", "ecran-type.html", ...moteur.sort().map((nom) => `a-plat/${nom}`)];
}

function estDeLOutil(dossier) {
  if (existsSync(join(dossier, "a-plat", "moteur.js"))) return true;
  const plan = join(dossier, "plan.js");
  if (!existsSync(plan)) return false;
  try {
    return readFileSync(plan, "utf8").includes("window.A_PLAT");
  } catch {
    return false;
  }
}

// writeSync : le message part en entier avant la sortie, même vers un tuyau sous Windows.
function sortir(code, lignes) {
  writeSync(code === 0 ? 1 : 2, lignes.join("\n") + "\n");
  process.exit(code);
}

const argument = process.argv[2];
if (!argument) {
  sortir(2, ["Il manque le dossier où copier la page. Usage : node copier.mjs <dossier>"]);
}

const destination = resolve(argument);
if (existsSync(destination)) {
  if (!statSync(destination).isDirectory()) {
    sortir(2, [`« ${argument} » existe et n'est pas un dossier : rien n'a été copié.`]);
  }
  if (readdirSync(destination).length > 0 && !estDeLOutil(destination)) {
    sortir(2, [
      `Le dossier « ${argument} » contient déjà des fichiers et n'est pas un dossier d'À plat : rien n'a été copié.`,
      "Choisissez un autre dossier, par exemple un nouveau dossier à côté de celui-ci."
    ]);
  }
}

const fichiers = aCopier();
for (const fichier of fichiers) {
  if (!existsSync(join(MODELE, fichier))) sortir(1, [`Le modèle est abîmé : ${fichier} manque dans le dossier du skill. Rien n'a été copié.`]);
}

const crees = [];
const dejaLa = [];
for (const sous of ["", ...DOSSIERS]) {
  const chemin = join(destination, sous);
  if (!existsSync(chemin)) {
    mkdirSync(chemin, { recursive: true });
    if (sous) crees.push(`${sous}/`);
  }
}
for (const fichier of fichiers) {
  try {
    // COPYFILE_EXCL : la copie échoue plutôt que d'écraser un fichier déjà là.
    copyFileSync(join(MODELE, fichier), join(destination, fichier), constants.COPYFILE_EXCL);
    crees.push(fichier);
  } catch (erreur) {
    if (erreur.code === "EEXIST") dejaLa.push(fichier);
    else sortir(1, [`La copie de ${fichier} a échoué : ${erreur.message}`, `Déjà copié : ${crees.join(", ") || "rien"}.`]);
  }
}

const copies = crees.filter((f) => !f.endsWith("/"));
const lignes = [`Dossier de maquettes : ${destination}`];
if (crees.length) lignes.push(`Copié ou créé (${crees.length}) : ${crees.join(", ")}`);
if (dejaLa.length) lignes.push(`Déjà là, gardé tel quel (${dejaLa.length}) : ${dejaLa.join(", ")}`);
lignes.push(copies.length
  ? `Copie terminée : ${copies.length} fichier${copies.length > 1 ? "s" : ""} copié${copies.length > 1 ? "s" : ""}. plan.js n'est pas copié : il reste à écrire.`
  : "Rien n'a été copié : tous les fichiers de la page étaient déjà là.");
sortir(0, lignes);
