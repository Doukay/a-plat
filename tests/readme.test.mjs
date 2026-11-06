// Contrôles du README : il doit dire ce que l'outil fait et ne fait pas, donner l'installation,
// citer les limites connues des comptes rendus d'essai, et ne contenir aucun chemin de machine.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const CHEMIN = join(RACINE, "README.md");

const lire = () => {
  assert.ok(existsSync(CHEMIN), "README.md est absent");
  return readFileSync(CHEMIN, "utf8");
};
const titres = (texte) => [...texte.matchAll(/^#{1,3} (.+)$/gm)].map((m) => m[1].toLowerCase());

test("le README existe et commence par le nom de l'outil", () => {
  assert.match(lire(), /^# À plat/);
});

test("le README a les sections attendues", () => {
  const liste = titres(lire());
  const attendues = [
    /à quoi ça sert/,
    /trois vues/,
    /installation/,
    /premier essai/,
    /corriger/,
    /réglages/,
    /ne fait jamais/,
    /serveur web|téléphone/,
    /node/,
    /limites/,
    /licence/
  ];
  for (const motif of attendues) {
    assert.ok(liste.some((titre) => motif.test(titre)), `aucun titre ne correspond à ${motif}`);
  }
});

test("le README donne les deux commandes d'installation et celle d'un dossier local", () => {
  const texte = lire();
  assert.ok(texte.includes("/plugin marketplace add Doukay/a-plat"));
  assert.ok(texte.includes("/plugin install a-plat@a-plat"));
  assert.ok(texte.includes("/plugin marketplace add <chemin du dossier>"));
});

test("le README dit comment lancer l'outil, et le nom complet de la commande", () => {
  const texte = lire();
  assert.ok(texte.includes("/a-plat"));
  assert.ok(texte.includes("/a-plat:a-plat"));
});

test("le README dit comment corriger, avec les deux façons et la validation", () => {
  const texte = lire();
  assert.match(texte, /B3 : /);
  assert.match(texte, /Copier pour Claude/);
  assert.match(texte, /B3 validé/);
});

test("le README dit que l'outil n'envoie rien et ne fait pas ce qu'il ne doit pas faire", () => {
  const texte = lire();
  assert.match(texte, /n'envoie rien/i);
  assert.match(texte, /aucun compte|pas de compte/i);
  assert.match(texte, /aucune requête|aucun appel/i);
  assert.match(texte, /ne modifie jamais le code|ne modifie pas le code/i);
  assert.match(texte, /sans votre accord|sans accord/i);
  assert.match(texte, /donnée réelle|données réelles/i);
});

test("le README donne la règle : ne servir que le dossier maquettes/", () => {
  const texte = lire();
  assert.match(texte, /ne servez que le dossier `maquettes\/`/i);
  assert.match(texte, /jamais le projet entier/i);
  assert.match(texte, /\.env/);
});

test("le README dit à quoi sert Node et ce qui se passe sans lui", () => {
  const texte = lire();
  assert.match(texte, /Node/);
  assert.match(texte, /sans Node/i);
});

test("le README donne les limites connues, avec les chiffres des essais, et ce qui n'a pas été essayé", () => {
  const texte = lire();
  assert.match(texte, /13 sur 19/);
  assert.match(texte, /aucune invention/i);
  assert.match(texte, /un seul passage/i);
  assert.match(texte, /Sonnet/);
  assert.match(texte, /retouchée après|retouchée depuis/i);
  assert.match(texte, /pas mesur/i);
  assert.match(texte, /pas essayé|n'ont pas été essayés|pas été essayé/i);
});

test("les liens du README vers des fichiers du dépôt mènent quelque part", () => {
  const texte = lire();
  const liens = [...texte.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1]);
  assert.ok(liens.some((lien) => lien.startsWith("docs/essais/")), "le README ne renvoie à aucun compte rendu d'essai");
  for (const lien of liens) {
    assert.doesNotMatch(lien, /^[a-z]+:/i, `le lien ${lien} sort du dépôt`);
    assert.ok(existsSync(join(RACINE, dirname(lien), lien.split("/").pop())), `le lien ${lien} ne mène nulle part`);
  }
});

test("le README dit la licence MIT et finit par « Construit avec Claude Code. »", () => {
  const texte = lire();
  assert.match(texte, /licence MIT/i);
  assert.equal(texte.trimEnd().split("\n").pop(), "Construit avec Claude Code.");
});

test("le README ne cite aucun chemin de machine", () => {
  assert.doesNotMatch(lire(), /C:\\Users|\/C:\\Users|[A-Z]:\\|\/home\/|\/Users\//i);
});

test("le README ne contient aucune adresse mail ni adresse http", () => {
  const texte = lire();
  assert.doesNotMatch(texte, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(texte, /https?:\/\//i);
});

test("le README ne cite aucun nom de projet privé", (t) => {
  const liste = (process.env.A_PLAT_MOTS_INTERDITS ?? "").split("|").map((m) => m.trim()).filter(Boolean);
  if (liste.length === 0) {
    t.skip("recherche non faite : donnez les mots dans A_PLAT_MOTS_INTERDITS, séparés par |");
    return;
  }
  // Le compte GitHub de la commande d'installation est permis : on le retire avant de chercher.
  const texte = lire().replaceAll("/plugin marketplace add Doukay/a-plat", "/plugin marketplace add COMPTE/a-plat");
  const trouves = [];
  for (const mot of liste) {
    const echappe = mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?<![\\p{L}\\p{N}])${echappe}(?![\\p{L}\\p{N}])`, "iu").test(texte)) trouves.push(`README.md contient « ${mot} »`);
  }
  assert.deepEqual(trouves, []);
});
