// Contrôles de skills/a-plat/copier.mjs : la copie du modèle de page dans un dossier de maquettes.
// Elle ne doit jamais écraser un fichier, ni écrire dans un dossier qui n'est pas à l'outil.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const COPIER = fileURLToPath(new URL("../skills/a-plat/copier.mjs", import.meta.url));
const MODELE = fileURLToPath(new URL("../skills/a-plat/modele", import.meta.url));

// Ce que la copie doit poser : la page, son style commun, l'écran type, et tout le moteur.
const ATTENDUS = ["index.html", "commun.css", "ecran-type.html",
  ...readdirSync(join(MODELE, "a-plat")).map((nom) => `a-plat/${nom}`)];

let racine;
let numero = 0;
before(() => { racine = mkdtempSync(join(tmpdir(), "a-plat-copier-")); });
after(() => { rmSync(racine, { recursive: true, force: true }); });

const neuf = (nom = `maquettes-${++numero}`) => join(racine, `${++numero}`, nom);

function lancer(...args) {
  const r = spawnSync(process.execPath, [COPIER, ...args], { encoding: "utf8", timeout: 20000 });
  return { code: r.status, sortie: `${r.stdout}${r.stderr}` };
}

function tout(dossier) {
  const liste = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) liste.push(`${relative(dossier, chemin)}/`, ...tout(chemin).map((f) => `${nom}/${f}`));
    else liste.push(nom);
  }
  return liste.map((f) => f.split("\\").join("/")).sort();
}

test("le modèle n'a plus de plan.js : seulement plan.exemple.js, qui n'est jamais copié", () => {
  assert.ok(!existsSync(join(MODELE, "plan.js")), "modele/plan.js ne doit plus exister");
  assert.ok(existsSync(join(MODELE, "plan.exemple.js")), "modele/plan.exemple.js doit exister");
});

test("un dossier neuf : tout le modèle est copié, avec ecrans/ et actuel/, sans plan.js", () => {
  const dossier = neuf();
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  for (const fichier of ATTENDUS) {
    assert.ok(existsSync(join(dossier, fichier)), `${fichier} manque`);
    assert.deepEqual(readFileSync(join(dossier, fichier)), readFileSync(join(MODELE, fichier)), `${fichier} n'est pas identique au modèle`);
  }
  assert.ok(statSync(join(dossier, "ecrans")).isDirectory());
  assert.ok(statSync(join(dossier, "actuel")).isDirectory());
  assert.ok(!existsSync(join(dossier, "plan.js")), "plan.js ne se copie pas : Claude l'écrit");
  assert.ok(!existsSync(join(dossier, "plan.exemple.js")), "plan.exemple.js ne se copie pas");
  assert.match(sortie, /Copié/);
  assert.match(sortie, /index\.html/);
});

test("une copie interrompue reprend : ce qui est là est gardé et dit, le reste est copié", () => {
  const dossier = neuf();
  mkdirSync(join(dossier, "a-plat"), { recursive: true });
  writeFileSync(join(dossier, "a-plat", "moteur.js"), "// moteur d'une copie interrompue\n");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.equal(readFileSync(join(dossier, "a-plat", "moteur.js"), "utf8"), "// moteur d'une copie interrompue\n");
  assert.match(sortie, /Déjà là[^\n]*\n?[\s\S]*a-plat\/moteur\.js/);
  for (const fichier of ATTENDUS) assert.ok(existsSync(join(dossier, fichier)), `${fichier} manque après la reprise`);
});

test("un plan.js et un index.html déjà là ne sont jamais touchés", () => {
  const dossier = neuf();
  lancer(dossier);
  writeFileSync(join(dossier, "plan.js"), 'window.A_PLAT = { version: 1, projet: "Le mien" };\n');
  writeFileSync(join(dossier, "index.html"), "<!-- index changé à la main -->\n");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.equal(readFileSync(join(dossier, "plan.js"), "utf8"), 'window.A_PLAT = { version: 1, projet: "Le mien" };\n');
  assert.equal(readFileSync(join(dossier, "index.html"), "utf8"), "<!-- index changé à la main -->\n");
  assert.match(sortie, /index\.html/);
  assert.match(sortie, /rien n'a été copié|aucun fichier copié|0 fichier copié/i);
});

test("un dossier qui n'est pas à l'outil est refusé : code 2, message en français, rien d'écrit", () => {
  const dossier = neuf();
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, "photo.png"), "pas une vraie image");
  writeFileSync(join(dossier, "notes.txt"), "mes notes\n");
  const avant = tout(dossier);
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 2, sortie);
  assert.match(sortie, /n'est pas un dossier d'À plat|pas à l'outil/);
  assert.match(sortie, /autre dossier/);
  assert.deepEqual(tout(dossier), avant, "rien ne doit être ajouté");
  assert.equal(readFileSync(join(dossier, "notes.txt"), "utf8"), "mes notes\n");
});

test("un dossier vide est celui de l'outil : la copie s'y fait", () => {
  const dossier = neuf();
  mkdirSync(dossier, { recursive: true });
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.ok(existsSync(join(dossier, "a-plat", "moteur.js")));
});

test("un chemin avec des espaces et des accents marche", () => {
  const dossier = neuf("mes maquettes à moi");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.ok(existsSync(join(dossier, "index.html")));
  assert.ok(existsSync(join(dossier, "a-plat", "relais.js")));
});

test("sans dossier donné, ou si c'est un fichier : code 2 et un message clair", () => {
  const sans = lancer();
  assert.equal(sans.code, 2);
  assert.match(sans.sortie, /Il manque le dossier/);
  const fichier = join(racine, "un-fichier.txt");
  writeFileSync(fichier, "x");
  const surFichier = lancer(fichier);
  assert.equal(surFichier.code, 2);
  assert.match(surFichier.sortie, /n'est pas un dossier/);
});
