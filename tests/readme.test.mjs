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
    /règles de l'outil/,
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
  assert.match(texte, /une fois appliquées par Claude, videz la liste avec « Tout retirer »\./i);
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

test("le README dit que les règles ne sont pas des verrous et ce que les tests contrôlent", () => {
  const texte = lire();
  assert.match(texte, /règles données à Claude, pas des verrous techniques/);
  assert.match(texte, /Deux points seulement sont contrôlés par des tests automatiques/);
  assert.match(texte, /les tests couvrent le moteur de la page et les écrans d'essai ; pour vos propres écrans, le contrôle/);
  assert.match(texte, /refuse tout ce qui vient d'Internet/);
  assert.doesNotMatch(texte, /aucune requête sur le réseau|Elle ne fait aucune requête hors de son dossier/);
  assert.doesNotMatch(texte, /ne fait jamais/i);
  assert.match(texte, /doit vous le dire avant de copier/);
});

test("le README explique plugin, marketplace, dépôt, routeur, presse-papiers et le chemin du dossier", () => {
  const texte = lire();
  assert.match(texte, /un plugin est un complément/);
  assert.match(texte, /« marketplace »/);
  assert.match(texte, /le dossier en ligne où est rangé son code/);
  assert.match(texte, /routeur \(la partie qui/);
  assert.match(texte, /presse-papiers \(la mémoire/);
  assert.match(texte, /sans les crochets/);
  assert.match(texte, /Windows/);
  assert.match(texte, /macOS/);
});

test("le README dit où trouver Claude Code, sans adresse", () => {
  assert.match(lire(), /site officiel d'Anthropic/);
});

test("le README dit que l'absence d'invention vient du comptage de l'auteur de l'essai", () => {
  assert.match(lire(), /aucune invention, selon le comptage de l'auteur de l'essai/);
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

test("le README dit comment mettre à jour et désinstaller, et que les maquettes restent", () => {
  const texte = lire();
  assert.ok(texte.includes("/plugin marketplace update a-plat"));
  assert.ok(texte.includes("/plugin uninstall a-plat@a-plat"));
  assert.ok(texte.includes("/plugin marketplace remove a-plat"));
  assert.match(texte, /réinstallez/);
  assert.match(texte, /dossiers `maquettes\/` restent dans vos projets/);
});

test("le README précise la police, les deux adresses, les captures, Git et le libellé macOS", () => {
  const texte = lire();
  assert.match(texte, /service de polices de caractères en ligne \(Google Fonts\)/);
  assert.doesNotMatch(texte, /le plus souvent/);
  assert.match(texte, /adresse de fichier \(comme d'un double-clic\)/);
  assert.match(texte, /adresse web locale \(servie par un petit serveur/);
  assert.match(texte, /captures d'écran que Claude prend pour vérifier le rendu vont dans un dossier temporaire/);
  assert.match(texte, /garder `maquettes\/` dans Git \?\*\* Oui/);
  assert.match(texte, /jamais vos secrets/);
  assert.match(texte, /le libellé peut varier/);
  const pasEssaye = texte.split(/\r?\n/).find((l) => l.startsWith("**Ce qui n'a pas été essayé.**")) ?? "";
  for (const motif of [/macOS/, /Linux/, /Node 18/]) assert.match(pasEssaye, motif);
});

test("la note de conception dit qu'elle précède la construction et que le README fait foi", () => {
  const conception = readFileSync(join(RACINE, "docs", "conception.md"), "utf8");
  assert.match(conception.split("\n").slice(0, 4).join("\n"), /écrite avant la construction.*c'est le README qui fait foi/);
  assert.match(conception, /^## Les règles données à Claude$/m);
  assert.doesNotMatch(conception, /^## Ce que l'outil ne fait jamais/m);
  assert.ok(!existsSync(join(RACINE, "docs", "superpowers")), "le plan de construction n'est plus dans le dépôt");
});

test("les comptes rendus d'essai ne nomment aucun outil de la session d'essai", () => {
  const texte = readFileSync(join(RACINE, "docs", "essais", "2026-11-06-pretoutil.md"), "utf8");
  assert.doesNotMatch(texte, /\.impeccable|ma propre session|mon installation/i);
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
