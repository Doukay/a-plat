import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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

// ---------------------------------------------------------------- finition : UX et UI

const COMMUN_DU_MODELE = fileURLToPath(new URL("../skills/a-plat/modele/commun.css", import.meta.url));

for (const finition of ["charte", "gris-puis-charte"]) {
  test(`finition « ${finition} » sans bloc UI dans commun.css : code 1, le bloc manquant est cité`, () => {
    const dossier = preparer();
    modifier(dossier, "plan.js", (t) => t.replace('finition: "gris"', `finition: "${finition}"`));
    // commun.css absent, puis présent mais sans bloc UI : la même erreur.
    for (const css of [null, ":root { --ecran-accent: #0066cc; }\n"]) {
      if (css !== null) writeFileSync(join(dossier, "commun.css"), css);
      const { code, sortie } = lancer(dossier);
      assert.equal(code, 1, sortie);
      assert.match(sortie, /:root\[data-finition="ui"\]/);
      assert.match(sortie, new RegExp(`finition « ${finition} »`));
    }
  });
}

test("finition avec un bloc UI identique à l'UX (le modèle tel quel) : code 0 et un avertissement", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace('finition: "gris"', 'finition: "gris-puis-charte"'));
  cpSync(COMMUN_DU_MODELE, join(dossier, "commun.css"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /Avertissement : l'UI n'a pas encore les couleurs du projet/);
});

test("finition avec un bloc UI aux couleurs du projet : code 0, sans avertissement", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace('finition: "gris"', 'finition: "charte"'));
  cpSync(COMMUN_DU_MODELE, join(dossier, "commun.css"));
  modifier(dossier, "commun.css", (t) => t.replace(/(:root\[data-finition="ui"\] \{[^}]*--ecran-accent: )#0066cc/, "$1#1f3b63"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.doesNotMatch(sortie, /Avertissement/);
});

test("finition « gris » : pas de bouton, donc ni bloc UI exigé ni avertissement", () => {
  const dossier = preparer();
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.doesNotMatch(sortie, /data-finition|Avertissement/);
});

test("une finition inconnue est refusée, et le message cite les quatre valeurs permises", () => {
  for (const valeur of ['"gris puis charte"', '"couleurs"', '"fidèle"', "true"]) {
    const dossier = preparer();
    modifier(dossier, "plan.js", (t) => t.replace('finition: "gris"', `finition: ${valeur}`));
    const { code, sortie } = lancer(dossier);
    assert.equal(code, 1, sortie);
    assert.match(sortie, /n'est pas permise \(reglages\.finition : gris, gris-puis-charte, charte, fidele\)/);
  }
});

// Un dossier en finition « charte », avec le commun.css du modèle dont on change une partie.
function avecUnCommun(changer) {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace('finition: "gris"', 'finition: "charte"'));
  cpSync(COMMUN_DU_MODELE, join(dossier, "commun.css"));
  modifier(dossier, "commun.css", changer);
  return lancer(dossier);
}
const dansLeBlocUI = (remplacer) => (t) => t.replace(/(:root\[data-finition="ui"\] \{)([^}]*)\}/, (_, debut, corps) => debut + remplacer(corps) + "}");

test("le bloc UX doit rester celui du modèle : les couleurs du projet vont dans le bloc UI", () => {
  const { code, sortie } = avecUnCommun((t) => t.replace("--ecran-accent: #0066cc;", "--ecran-accent: #1f3b63;"));
  assert.equal(code, 1, sortie);
  assert.match(sortie, /Le bloc UX \(:root, en tête de commun\.css\) n'est plus celui du modèle \(--ecran-accent\)/);
  assert.match(sortie, /les couleurs du projet vont dans le bloc UI/i);
});

test("les noms du bloc UI sont exactement ceux de l'UX : un nom inconnu ou absent est une erreur", () => {
  const inconnu = avecUnCommun(dansLeBlocUI((corps) => corps.replace("--ecran-accent: #0066cc;", "--ecran-accent: #1f3b63; --ecran-couleur-du-logo: #c0392b;")));
  assert.equal(inconnu.code, 1, inconnu.sortie);
  assert.match(inconnu.sortie, /une variable --ecran-couleur-du-logo que l'UX n'a pas/);
  const absent = avecUnCommun(dansLeBlocUI((corps) => corps.replace("--ecran-accent: #0066cc;", "").replace("--ecran-page: #f5f5f7;", "--ecran-page: #f4f4f0;")));
  assert.equal(absent.code, 1, absent.sortie);
  assert.match(absent.sortie, /n'a pas la variable --ecran-accent/);
});

test("un bloc UI vide, ou identique à l'UX en majuscules et en espaces, donne l'avertissement", () => {
  const vide = avecUnCommun(dansLeBlocUI(() => "\n"));
  assert.equal(vide.code, 0, vide.sortie);
  assert.match(vide.sortie, /Avertissement : l'UI n'a pas encore les couleurs du projet/);
  const memes = avecUnCommun(dansLeBlocUI((corps) => corps.replace("--ecran-accent: #0066cc;", "--ecran-accent:#0066CC ;").replace(/ui-sans-serif, system-ui/g, "ui-sans-serif,system-ui")));
  assert.equal(memes.code, 0, memes.sortie);
  assert.match(memes.sortie, /Avertissement : l'UI n'a pas encore les couleurs du projet/);
});

test("un dossier dont la page date d'avant le bouton UX | UI n'est pas cassé : un avertissement dit comment passer au nouveau modèle", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace('finition: "gris"', 'finition: "gris-puis-charte"'));
  mkdirSync(join(dossier, "a-plat"), { recursive: true });
  writeFileSync(join(dossier, "a-plat", "moteur.js"), "// moteur d'avant le bouton UX | UI\nwindow.APlatMoteur = {};\n");
  writeFileSync(join(dossier, "commun.css"), ":root { --ecran-fond: #ffffff; --ecran-accent: #3d3d3d; }\n"); // l'ancien commun.css, sans bloc UI
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /Avertissement : la page de ce dossier date d'avant le bouton UX \| UI/);
  assert.match(sortie, /Reprendre des maquettes/);
  assert.doesNotMatch(sortie, /est absent/);
});

// ---------------------------------------------------------------- aucune couleur dans un écran

test("une couleur écrite dans un écran (style=\"\" ou <style>) est une erreur, sous toutes ses formes", () => {
  const formes = ["#c0392b", "#fff", "rgb(10, 20, 30)", "rgba(0,0,0,.5)", "hsl(200 50% 50%)", "hsla(0,0%,0%,.2)", "color(srgb 1 0 0)", "tomato", "Black"];
  for (const forme of formes) {
    for (const ou of ["attribut", "style"]) {
      const dossier = preparer();
      modifier(dossier, "ecrans/A1-accueil.html", (t) => ou === "attribut"
        ? t.replace("<body>", `<body><p style="color: ${forme}">x</p>`)
        : t.replace("</head>", `<style>.x { border: 1px solid ${forme}; }</style></head>`));
      const { code, sortie } = lancer(dossier);
      assert.equal(code, 1, `${forme} en ${ou} : ${sortie}`);
      assert.match(sortie, /ecrans\/A1-accueil\.html : 1 couleur écrite dans l'écran/);
      assert.match(sortie, /Un écran n'écrit jamais de couleur/);
    }
  }
});

test("transparent, inherit, currentColor et var(…) passent, comme un sélecteur #a1 ou une couleur dans un texte", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A1-accueil.html", (t) => t
    .replace("</head>", '<style>#a1 { background: transparent; color: inherit; border-color: currentColor; outline-color: var(--ecran-accent, #c0392b); } .y::after { content: "red #fff"; }</style></head>')
    .replace("<body>", '<body><p style="color: var(--ecran-texte); background: url(fond-red.png)">x</p>'));
  const { code, sortie } = lancer(dossier);
  assert.doesNotMatch(sortie, /couleur écrite/, sortie);
  assert.equal(code, 0, sortie);
});

test("l'existant (actuel/) garde le vrai style du projet : ses couleurs ne sont pas contrôlées", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "actuel", "A1-accueil.html"), '<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>body { background: #f4f4f0; color: navy; }</style></head><body><h1 style="color:#1f3b63">Accueil</h1><script src="../a-plat/relais.js"></script></body></html>');
  modifier(dossier, "plan.js", (t) => t.replace(/(fichier: "A1-accueil\.html",[\s\S]*?)actuel: null/, '$1actuel: { fichier: "actuel/A1-accueil.html", origine: "redessine" }'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.doesNotMatch(sortie, /couleur/);
});

test("une note qui cite un écran absent du plan : code 1, la note et le code sont cités", () => {
  // La page, elle, l'affiche sous le titre de la rangée (voir validerPlan, option pourLaPage).
  const dossier = preparer();
  modifier(dossier, "plan.js", (texte) => texte.replace('texte: "Caution retirée."', 'texte: "Caution retirée.", ecrans: ["A1", "Z9"]'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1, sortie);
  assert.match(sortie, /La note 1 de la rangée A cite l'écran « Z9 », qui n'existe pas/);
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

// Claude ne crée aucun dossier vide : sans écran dans le plan, ecrans/ peut manquer.
function preparerSansEcran(avecDossier) {
  const dossier = join(racine, `maquettes-${++numero}`);
  mkdirSync(dossier, { recursive: true });
  if (avecDossier) mkdirSync(join(dossier, "ecrans"));
  writeFileSync(join(dossier, "plan.js"), "window.A_PLAT = { version: 1, projet: \"Essai\", etatDesLieux: [], rangees: [], ecrans: [] };\n");
  return dossier;
}

test("sans écran dans le plan, le dossier ecrans/ absent est accepté", () => {
  const { code, sortie } = lancer(preparerSansEcran(false));
  assert.equal(code, 0, sortie);
  assert.match(sortie, /0 écran vérifié/);
});

test("sans écran dans le plan, un fichier oublié dans ecrans/ reste une erreur", () => {
  const dossier = preparerSansEcran(true);
  writeFileSync(join(dossier, "ecrans/Z9-oublie.html"), "<!doctype html><html></html>");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /Z9-oublie\.html/);
});

test("des écrans dans le plan et pas de dossier ecrans/ : code 1, le dossier est cité", () => {
  const dossier = preparer();
  rmSync(join(dossier, "ecrans"), { recursive: true });
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /dossier ecrans/);
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

test("les deux balises preconnect de Google Fonts sont acceptées avec policeEnLigne", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace("policeEnLigne: false", "policeEnLigne: true"));
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</head>",
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' + `${POLICE}</head>`));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
});

test("une adresse qui ressemble à Google Fonts sans l'être reste refusée", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace("policeEnLigne: false", "policeEnLigne: true"));
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</head>",
    '<link rel="preconnect" href="https://fonts.googleapis.com.exemple.test"></head>'));
  assert.equal(lancer(dossier).code, 1);
});

// Copie skills/a-plat sous un projet qui a ce package.json et renvoie le dossier copié.
function installerSousUnProjet(contenuDuPackageJson) {
  const projet = join(racine, `projet-${++numero}`);
  mkdirSync(join(projet, "outils"), { recursive: true });
  writeFileSync(join(projet, "package.json"), contenuDuPackageJson);
  cpSync(dirname(VERIFIER), join(projet, "outils", "a-plat"), { recursive: true });
  return join(projet, "outils", "a-plat");
}

function lancerCopie(copie, dossier) {
  const resultat = spawnSync(process.execPath, [join(copie, "verifier.mjs"), dossier], { encoding: "utf8", timeout: 20000 });
  return { code: resultat.status, sortie: `${resultat.stdout}${resultat.stderr}` };
}

test("le contrôle marche sous un projet dont package.json dit type module", () => {
  const copie = installerSousUnProjet('{"type":"module"}');
  const { code, sortie } = lancerCopie(copie, preparer());
  assert.equal(code, 0, sortie);
  assert.match(sortie, /3 écrans/);
});

test("le contrôle marche sous un projet dont package.json dit type commonjs", () => {
  const copie = installerSousUnProjet('{"type":"commonjs"}');
  assert.equal(lancerCopie(copie, preparer()).code, 0);
});

test("logique.js absent : code 2 et un message clair, sans trace d'erreur", () => {
  const copie = installerSousUnProjet("{}");
  rmSync(join(copie, "modele/a-plat/logique.js"));
  const { code, sortie } = lancerCopie(copie, preparer());
  assert.equal(code, 2);
  assert.match(sortie, /logique\.js/);
  assert.doesNotMatch(sortie, /\bat .*\(.*:\d+:\d+\)/);
});

test("logique.js qui n'est pas du JavaScript : code 2 et un message clair", () => {
  const copie = installerSousUnProjet("{}");
  writeFileSync(join(copie, "modele/a-plat/logique.js"), "ceci n'est pas ,, du JavaScript");
  const { code, sortie } = lancerCopie(copie, preparer());
  assert.equal(code, 2);
  assert.match(sortie, /logique\.js/);
  assert.doesNotMatch(sortie, /\bat .*\(.*:\d+:\d+\)/);
});

test("logique.js qui n'offre pas validerPlan : code 2", () => {
  const copie = installerSousUnProjet("{}");
  writeFileSync(join(copie, "modele/a-plat/logique.js"), "module.exports = {};");
  const { code, sortie } = lancerCopie(copie, preparer());
  assert.equal(code, 2);
  assert.match(sortie, /logique\.js/);
});

test("le contrôle ne dépend pas du dossier courant", () => {
  const dossier = preparer();
  const resultat = spawnSync(process.execPath, [VERIFIER, dossier], { encoding: "utf8", cwd: racine });
  assert.equal(resultat.status, 0, resultat.stdout + resultat.stderr);
});

// ---------------------------------------------------------------- un existant redessiné en HTML

const ACTUEL_HTML = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Accueil actuel, redessiné d'après le code</title>
<link rel="stylesheet" href="../commun.css"></head>
<body>
<h1>Prêtoutil</h1>
<p>Liste des outils proches.</p>
<a href="../ecrans/A2-fiche.html">Perceuse sans fil</a>
<script src="../a-plat/relais.js"></script></body>
</html>
`;

// Le dossier complet, dont l'accueil A1 a un existant redessiné : actuel/A1-accueil.html.
function preparerAvecActuelHtml(contenu = ACTUEL_HTML) {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace(
    /(code: "A1"[\s\S]*?)actuel: null/,
    '$1actuel: { fichier: "actuel/A1-accueil.html", origine: "redessine" }'));
  writeFileSync(join(dossier, "actuel/A1-accueil.html"), contenu);
  return dossier;
}

test("un existant redessiné en HTML, avec relais.js, est accepté", () => {
  const { code, sortie } = lancer(preparerAvecActuelHtml());
  assert.equal(code, 0, sortie);
  assert.match(sortie, /3 écrans/);
});

test("un existant en HTML sans relais.js : code 1, le fichier et relais.js sont cités", () => {
  const { code, sortie } = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace('<script src="../a-plat/relais.js"></script>', "")));
  assert.equal(code, 1);
  assert.match(sortie, /actuel\/A1-accueil\.html/);
  assert.match(sortie, /relais\.js/);
});

test("un relais.js seulement cité dans un commentaire de l'existant ne compte pas", () => {
  const { code } = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace('<script src="../a-plat/relais.js"></script>', '<!-- <script src="../a-plat/relais.js"></script> -->')));
  assert.equal(code, 1);
});

test("un existant en HTML dont une balise n'est pas fermée : code 1, le fichier est cité", () => {
  const { code, sortie } = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace("<h1>", "<div><h1>")));
  assert.equal(code, 1);
  assert.match(sortie, /actuel\/A1-accueil\.html/);
  assert.match(sortie, /div/);
});

test("un existant en HTML qui charge un script ou une feuille d'Internet : code 1", () => {
  const script = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace("</body>", '<script src="https://exemple.test/lib.js"></script></body>')));
  assert.equal(script.code, 1);
  assert.match(script.sortie, /exemple\.test/);
  assert.match(script.sortie, /actuel\/A1-accueil\.html/);
  const style = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace("</head>", '<link rel="stylesheet" href="//exemple.test/s.css"></head>')));
  assert.equal(style.code, 1);
});

test("un existant en HTML avec un lien vers un fichier absent : code 1", () => {
  const { code, sortie } = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace("../ecrans/A2-fiche.html", "../ecrans/X9.html")));
  assert.equal(code, 1);
  assert.match(sortie, /X9\.html/);
});

test("un existant en HTML n'a pas besoin de data-ecran, et ses crochets ne sont pas signalés", () => {
  const { code, sortie } = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace("<p>Liste des outils proches.</p>", "<p>[Texte du code]</p>")));
  assert.equal(code, 0, sortie);
  assert.doesNotMatch(sortie, /crochets/);
});

test("un existant en HTML qui sort du dossier des maquettes : code 1, rien n'est lu hors du dossier", () => {
  const dossier = preparerAvecActuelHtml();
  writeFileSync(join(racine, "autre.html"), ACTUEL_HTML);
  modifier(dossier, "plan.js", (t) => t.replace("actuel/A1-accueil.html", "../autre.html"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1);
  assert.match(sortie, /autre\.html/);
  assert.match(sortie, /dossier/);
});

test("un fichier d'écran qui sort de ecrans/ : code 1, la règle est dite et le fichier n'est pas lu", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, "secret.html"), "<!doctype html><html><div></html>");
  modifier(dossier, "plan.js", (t) => t.replace('fichier: "B1-pret.html"', 'fichier: "../secret.html"'));
  rmSync(join(dossier, "ecrans/B1-pret.html"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1, sortie);
  assert.match(sortie, /B1 a un fichier « \.\.\/secret\.html » refusé/);
  assert.match(sortie, /dossier ecrans\//);
  assert.doesNotMatch(sortie, /<div>|n'est pas fermée/, "le fichier hors du dossier n'est pas lu");
});

// ---------------------------------------------------------------- rien ne vient d'Internet, quelle que soit la balise

const AJOUTS_D_INTERNET = [
  ["une image (img src)", '<img src="https://exemple.test/photo.png" alt="">'],
  ["un candidat de srcset",'<img src="../actuel/A2-fiche.png" srcset="petit.png 1x, https://exemple.test/grand.png 2x" alt="">'],
  ["un cadre (iframe src)", '<iframe src="//exemple.test/page.html" title="x"></iframe>'],
  ["une vidéo (poster)", '<video poster="https://exemple.test/affiche.png"></video>'],
  ["une source de vidéo", '<video><source src="https://exemple.test/film.mp4"></video>'],
  ["un objet (data)", '<object data="https://exemple.test/doc.pdf"></object>'],
  ["un formulaire (action)", '<form action="https://exemple.test/envoi"><button>Envoyer</button></form>'],
  ["une adresse de base (base href)", '<base href="https://exemple.test/">'],
  ["un @import dans un <style>", '<style>@import url("https://exemple.test/style.css");</style>'],
  ["un @import en texte dans un <style>", "<style>@import '//exemple.test/style.css';</style>"],
  ["un url() dans un <style>", "<style>.carte { background: url(https://exemple.test/fond.png); }</style>"],
  ["un url() dans un attribut style", '<div style="background-image: url(\'https://exemple.test/fond.png\')">x</div>']
];

for (const [nom, ajout] of AJOUTS_D_INTERNET) {
  test(`${nom} venant d'Internet : code 1, l'adresse est citée`, () => {
    const dossier = preparer();
    modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("<h1>Perceuse sans fil</h1>", `<h1>Perceuse sans fil</h1>${ajout}`));
    const { code, sortie } = lancer(dossier);
    assert.equal(code, 1, sortie);
    assert.match(sortie, /exemple\.test/);
    assert.match(sortie, /A2-fiche\.html/);
  });
}

test("des adresses locales dans src, srcset, style et url() restent acceptées", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("<h1>Perceuse sans fil</h1>",
    '<h1>Perceuse sans fil</h1><img src="../actuel/A2-fiche.png" srcset="../actuel/A2-fiche.png 1x, data:image/png;base64,AAAA 2x" alt="">' +
    '<style>/* https://exemple.test/ en commentaire */ .x { background: url("../actuel/A2-fiche.png"); content: "//"; }</style>' +
    '<div style="background: url(data:image/png;base64,AAAA)">x</div>'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
});

test("un existant en HTML avec une image d'Internet : code 1", () => {
  const { code, sortie } = lancer(preparerAvecActuelHtml(ACTUEL_HTML.replace("<h1>", '<img src="https://exemple.test/logo.png" alt=""><h1>')));
  assert.equal(code, 1);
  assert.match(sortie, /exemple\.test/);
  assert.match(sortie, /actuel\/A1-accueil\.html/);
});

const IMPORT_DE_POLICE = '<style>@import url("https://fonts.googleapis.com/css2?family=Lora&display=swap");</style>';

test("une police importée dans un <style> est refusée par défaut", () => {
  const dossier = preparer();
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</head>", `${IMPORT_DE_POLICE}</head>`));
  assert.equal(lancer(dossier).code, 1);
});

test("avec policeEnLigne, une police importée dans un <style> ou chargée par url() est acceptée", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace("policeEnLigne: false", "policeEnLigne: true"));
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("</head>",
    `${IMPORT_DE_POLICE}<style>@font-face { font-family: Lora; src: url(https://fonts.gstatic.com/s/lora/v1/a.woff2); }</style></head>`));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
});

test("avec policeEnLigne, une image venant de l'adresse des polices reste refusée", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace("policeEnLigne: false", "policeEnLigne: true"));
  modifier(dossier, "ecrans/A2-fiche.html", (t) => t.replace("<h1>", '<img src="https://fonts.gstatic.com/x.png" alt=""><h1>'));
  assert.equal(lancer(dossier).code, 1);
});

// ---------------------------------------------------------------- l'existant se cherche dans actuel/, comme la page

test("un existant écrit sans actuel/ se cherche dans actuel/, comme le fait la page", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace('fichier: "actuel/A2-fiche.png"', 'fichier: "A2-fiche.png"'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
});

test("un existant écrit sans actuel/ et posé à la racine du dossier est absent pour la page : code 1", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace('fichier: "actuel/A2-fiche.png"', 'fichier: "A2-fiche.png"'));
  cpSync(join(dossier, "actuel/A2-fiche.png"), join(dossier, "A2-fiche.png"));
  rmSync(join(dossier, "actuel/A2-fiche.png"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1, sortie);
  assert.match(sortie, /actuel\/A2-fiche\.png/);
});

test("un existant en HTML écrit sans actuel/ est contrôlé dans actuel/", () => {
  const dossier = preparerAvecActuelHtml(ACTUEL_HTML.replace('<script src="../a-plat/relais.js"></script>', ""));
  modifier(dossier, "plan.js", (t) => t.replace('fichier: "actuel/A1-accueil.html"', 'fichier: "A1-accueil.html"'));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 1, sortie);
  assert.match(sortie, /actuel\/A1-accueil\.html/);
  assert.match(sortie, /relais\.js/);
});

test("un état des lieux sans avancement : code 0, avec un avertissement qui dit quoi écrire", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace(/\n  avancement: [^\n]*/, ""));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /Avertissement : l'avancement n'est pas écrit dans plan\.js \(avancement: \{ niveau, raison \}\)/);
});

test("sans page à l'état des lieux, l'avancement absent n'est pas signalé", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace(/\n  avancement: [^\n]*/, "").replace(/etatDesLieux: \[[\s\S]*?\n  \}\],/, "etatDesLieux: [],"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.doesNotMatch(sortie, /avancement/);
});

test("un dossier dont la page date d'avant l'avancement : avertissement qui dit comment la mettre à jour", () => {
  const dossier = preparer();
  mkdirSync(join(dossier, "a-plat"), { recursive: true });
  writeFileSync(join(dossier, "a-plat", "moteur.js"), "// ancienne page\n");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /Avertissement : la page de ce dossier date d'avant l'avancement/);
  assert.match(sortie, /Reprendre des maquettes/);
  writeFileSync(join(dossier, "a-plat", "moteur.js"), "// window.APlatLogique.nomDeLAvancement(plan)\n");
  assert.doesNotMatch(lancer(dossier).sortie, /date d'avant l'avancement/);
});

test("un écran inchangé d'une page à compléter sans note qui le cite : code 0, avertissement qui cite l'écran", () => {
  const dossier = preparer();
  modifier(dossier, "plan.js", (t) => t.replace('actuel: { fichier: "actuel/A2-fiche.png", origine: "capture" }', "actuel: null, inchange: true"));
  const sans = lancer(dossier);
  assert.equal(sans.code, 0, sans.sortie);
  assert.match(sans.sortie, /Avertissement : l'écran A2 est inchangé, mais sa page est à compléter/);
  // Une décision qui cite A2 ne compte pas ; une note a-coder, si.
  modifier(dossier, "plan.js", (t) => t.replace('ancien: "Caution de 20 €" }', 'ancien: "Caution de 20 €", ecrans: ["A2"] }'));
  assert.match(lancer(dossier).sortie, /l'écran A2 est inchangé/);
  modifier(dossier, "plan.js", (t) => t.replace('{ type: "decision", date: "2026-11-04"', '{ type: "a-coder", date: "2026-11-04"'));
  const avec = lancer(dossier);
  assert.equal(avec.code, 0, avec.sortie);
  assert.doesNotMatch(avec.sortie, /Avertissement/);
});
