import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const VERIFIER = fileURLToPath(new URL("../skills/a-plat/verifier.mjs", import.meta.url));
const FIXTURE = fileURLToPath(new URL("./fixtures/complet", import.meta.url));

let racine;
let numero = 0;

before(() => {
  racine = mkdtempSync(join(tmpdir(), "a-plat-verifier-"));
});

after(() => {
  rmSync(racine, { recursive: true, force: true });
});

// Copie la fixture dans un dossier neuf et renvoie son chemin.
function preparer() {
  const dossier = join(racine, `maquettes-${++numero}`);
  cpSync(FIXTURE, dossier, { recursive: true });
  return dossier;
}

function modifier(dossier, relatif, fonction) {
  const chemin = join(dossier, relatif);
  writeFileSync(chemin, fonction(readFileSync(chemin, "utf8")));
}

function lancer(dossier, ...autres) {
  const args = dossier === undefined ? [] : [dossier];
  const resultat = spawnSync(process.execPath, [VERIFIER, ...args, ...autres], { encoding: "utf8", timeout: 20000 });
  return { code: resultat.status, sortie: `${resultat.stdout}${resultat.stderr}` };
}

test("le dossier complet est accepté et la sortie compte les écrans", () => {
  const { code, sortie } = lancer(preparer());
  assert.equal(code, 0, sortie);
  assert.match(sortie, /3 écrans/);
  assert.doesNotMatch(sortie, /crochets/);
});

test("un écran du plan sans fichier : code 1, le fichier est cité", () => {
  const dossier = preparer();
  rmSync(join(dossier, "ecrans/A2-fiche.html"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /A2-fiche\.html/);
});

test("un fichier d'écran hors du plan : code 1, le fichier est cité", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "ecrans/Z9-oublie.html"), "<!doctype html><html></html>");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /Z9-oublie\.html/);
});

test("un lien vers un fichier absent : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A1-accueil.html", (t) => t.replace('href="A2-fiche.html"', 'href="X9.html"'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /X9\.html/);
  assert.match(sortie, /A1-accueil\.html/);
});

test("une balise div non fermée : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/B1-pret.html", (t) => t.replace("<h1>", "<div><h1>"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /div/);
  assert.match(sortie, /B1-pret\.html/);
});

test("une balise fermante sans ouvrante : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/B1-pret.html", (t) => t.replace("<h1>", "</div><h1>"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /<\/div>/);
});

test("un p ou un li sans fermeture ne sont pas des erreurs", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/B1-pret.html", (t) => t.replace("<h1>", "<ul><li>un<li>deux</ul><p>sans fin<h1>"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
});

test("un data-ecran différent du code du plan : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace('data-ecran="A2"', 'data-ecran="A7"'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /A7/);
  assert.match(sortie, /A2/);
});

test("un écran sans data-ecran : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace(' data-ecran="A2"', ""));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /data-ecran/);
});

test("un écran sans relais.js : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace('<script src="../a-plat/relais.js"></script>', ""));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /relais\.js/);
  assert.match(sortie, /A2-fiche\.html/);
});

test("un relais.js seulement cité dans un commentaire ne compte pas", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) =>
    t.replace('<script src="../a-plat/relais.js"></script>', '<!-- <script src="../a-plat/relais.js"></script> -->'));
  const { code } = lancer(dossier);
  assert.equal(code, 1);
});

test("un script venant d'Internet : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</body>", '<script src="https://exemple.test/lib.js"></script></body>'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /exemple\.test/);
});

test("une feuille de style venant d'Internet : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</head>", '<link rel="stylesheet" href="https://exemple.test/style.css"></head>'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /exemple\.test/);
});

test("une adresse sans protocole (//hote/…) compte comme venant d'Internet", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</body>", '<script src="//exemple.test/lib.js"></script></body>'));
  assert.equal(lancer(dossier).code, 1);
});

const POLICE = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora&display=swap">';

test("une police en ligne est refusée par défaut", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</head>", `${POLICE}</head>`));
  assert.equal(lancer(dossier).code, 1);
});

test("une police en ligne est acceptée quand reglages.policeEnLigne vaut true", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace("policeEnLigne: false", "policeEnLigne: true"));
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</head>", `${POLICE}</head>`));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
});

test("avec policeEnLigne, tout le reste venant d'Internet reste refusé", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace("policeEnLigne: false", "policeEnLigne: true"));
  modifier(dossier, "ecrans/A2-fiche.html", (t) =>
    t.replace("</head>", `${POLICE}<link rel="stylesheet" href="https://exemple.test/style.css"></head>`));
  assert.equal(lancer(dossier).code, 1);
  modifier(dossier, "ecrans/A2-fiche.html", (t) =>
    t.replace('<link rel="stylesheet" href="https://exemple.test/style.css">', '<script src="https://fonts.googleapis.com/x.js"></script>'));
  assert.equal(lancer(dossier).code, 1);
});

test("trois textes entre crochets : code 0 et la sortie les compte", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) =>
    t.replace("<h1>Perceuse sans fil</h1>", "<h1>Perceuse sans fil</h1><p>[Prix à confirmer]</p><p>[Prix à confirmer]</p><p>[Prix à confirmer]</p>"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /3 textes entre crochets/);
  assert.match(sortie, /A2-fiche\.html/);
});

test("un seul texte entre crochets s'écrit au singulier", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("<h1>Perceuse sans fil</h1>", "<h1>[Titre à trouver]</h1>"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /1 texte entre crochets/);
});

test("un dossier sans plan.js : code 2", () => {
  const dossier = preparer();
  rmSync(join(dossier, "plan.js"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 2);
  assert.match(sortie, /plan\.js/);
});

test("un dossier absent : code 2", () => {
  const { code, sortie } = lancer(join(racine, "nexiste-pas"));
  assert.equal(code, 2);
  assert.match(sortie, /dossier/);
});

test("sans argument : code 2 et le mode d'emploi", () => {
  const { code, sortie } = lancer(undefined);
  assert.equal(code, 2);
  assert.match(sortie, /verifier\.mjs/);
});

test("un plan.js à la syntaxe cassée : code 1, et le message le dit", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "plan.js"), "window.A_PLAT = { version: 1,, };");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /syntaxe/);
});

test("un plan.js qui appelle process.exit() : code 1, sans droits sur Node", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "plan.js"), "process.exit(0);");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /plan\.js/);
});

test("un plan.js ne peut pas lire de fichier avec require", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "plan.js"), 'window.A_PLAT = require("node:fs").readdirSync(".");');
  assert.equal(lancer(dossier).code, 1);
});

test("un plan.js qui ne définit pas window.A_PLAT : code 1", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "plan.js"), "var autreChose = 1;");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /A_PLAT/);
});

test("un plan.js qui boucle sans fin : code 1 avec un message clair", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "plan.js"), "while (true) {}");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /ne se termine pas/);
});

test("un plan invalide (version 2) : code 1 et le champ est cité", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace("version: 1", "version: 2"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /version/);
});

test("une capture de l'existant absente : code 1, le fichier est cité", () => {
  const dossier = preparer();
  rmSync(join(dossier, "actuel/A2-fiche.png"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /actuel\/A2-fiche\.png/);
});

test("le dossier ecrans/ absent ne plante pas : code 1", () => {
  const dossier = preparer();
  rmSync(join(dossier, "ecrans"), { recursive: true });
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /A1-accueil\.html/);
});

test("les erreurs de plusieurs écrans sont toutes listées", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A1-accueil.html", (t) => t.replace('data-ecran="A1"', 'data-ecran="A9"'));
  modifier(dossier, "ecrans/B1-pret.html", (t) => t.replace('<script src="../a-plat/relais.js"></script>', ""));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /A1-accueil\.html/);
  assert.match(sortie, /B1-pret\.html/);
});

test("le contrôle ne dépend pas du dossier courant", () => {
  const dossier = preparer();
  const resultat = spawnSync(process.execPath, [VERIFIER, dossier], { encoding: "utf8", cwd: racine });
  assert.equal(resultat.status, 0, resultat.stdout + resultat.stderr);
});
