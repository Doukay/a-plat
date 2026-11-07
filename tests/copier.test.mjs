// Contrôles de skills/a-plat/copier.mjs : la mise en place de la page dans le dossier a-plat/ d'un projet.
// La page (index.html, .gitignore, .cache/) se refait à chaque passage ; sources/ n'est jamais écrasé ;
// rien n'est écrit hors du dossier, et un dossier qui n'est pas à l'outil est refusé.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const COPIER = fileURLToPath(new URL("../skills/a-plat/copier.mjs", import.meta.url));
const MODELE = fileURLToPath(new URL("../skills/a-plat/modele", import.meta.url));

// Ce que chaque passage refait : [fichier du modèle, place dans le dossier].
const REFAITS = [
  ["index.html", "index.html"],
  ["commun.css", ".cache/commun.css"],
  ["ecran-type.html", ".cache/ecran-type.html"],
  ...readdirSync(join(MODELE, "a-plat")).filter((nom) => statSync(join(MODELE, "a-plat", nom)).isFile()).map((nom) => [`a-plat/${nom}`, `.cache/${nom}`])
];
const GITIGNORE = ["*", "!.gitignore", "!sources/", "!sources/**"];

let racine;
let numero = 0;
before(() => { racine = mkdtempSync(join(tmpdir(), "a-plat-copier-")); });
after(() => { rmSync(racine, { recursive: true, force: true }); });

const neuf = (nom = "a-plat") => join(racine, `${++numero}`, nom);

function lancer(...args) {
  const r = spawnSync(process.execPath, [COPIER, ...args], { encoding: "utf8", timeout: 20000 });
  return { code: r.status, sortie: `${r.stdout}${r.stderr}` };
}

// L'arborescence d'un dossier : les chemins relatifs, les dossiers finis par « / ».
function tout(dossier) {
  const liste = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) liste.push(`${relative(dossier, chemin)}/`, ...tout(chemin).map((f) => `${nom}/${f}`));
    else liste.push(nom);
  }
  return liste.map((f) => f.split("\\").join("/")).sort();
}

// L'arborescence avec le contenu de chaque fichier : { chemin: Buffer | "dossier" }.
function empreinte(dossier) {
  return Object.fromEntries(tout(dossier).map((f) => [f, f.endsWith("/") ? "dossier" : readFileSync(join(dossier, f))]));
}

// Les lignes utiles d'un .gitignore, sans les commentaires.
const lignesDuGitignore = (texte) => texte.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

test("le modèle n'a plus de plan.js : seulement plan.exemple.js, qui n'est jamais copié", () => {
  assert.ok(!existsSync(join(MODELE, "plan.js")), "modele/plan.js ne doit plus exister");
  assert.ok(existsSync(join(MODELE, "plan.exemple.js")), "modele/plan.exemple.js doit exister");
  assert.ok(existsSync(join(MODELE, "charte.css")), "modele/charte.css, la charte de départ, doit exister");
});

test("un dossier neuf : la page et .cache/ copiées du modèle, sources/ créé avec ecrans/, actuel/ et charte.css, sans plan.js", () => {
  const dossier = neuf();
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  for (const [source, cible] of REFAITS) {
    assert.ok(existsSync(join(dossier, cible)), `${cible} manque`);
    assert.deepEqual(readFileSync(join(dossier, cible)), readFileSync(join(MODELE, source)), `${cible} n'est pas identique au modèle`);
  }
  for (const sous of ["sources", "sources/ecrans", "sources/actuel", ".cache"]) {
    assert.ok(statSync(join(dossier, sous)).isDirectory(), `${sous}/ manque`);
  }
  assert.deepEqual(readFileSync(join(dossier, "sources", "charte.css")), readFileSync(join(MODELE, "charte.css")), "la charte de départ est celle du modèle");
  assert.deepEqual(lignesDuGitignore(readFileSync(join(dossier, ".gitignore"), "utf8")), GITIGNORE);
  // Rien d'autre que ce qui est attendu : ni plan.js, ni plan.exemple.js, ni les places d'un ancien dossier.
  const attendu = [".cache/", ".gitignore", "sources/", "sources/actuel/", "sources/charte.css", "sources/ecrans/",
    ...REFAITS.map(([, cible]) => cible)].sort();
  assert.deepEqual(tout(dossier), attendu);
  assert.match(sortie, /index\.html/);
  assert.match(sortie, /sources\/plan\.js reste à écrire/);
});

test("le .gitignore écrit garde sources/ dans Git et ignore le reste du dossier ; il est refait s'il a changé", () => {
  const dossier = neuf();
  assert.equal(lancer(dossier).code, 0);
  assert.deepEqual(lignesDuGitignore(readFileSync(join(dossier, ".gitignore"), "utf8")), GITIGNORE, "exactement : *, !.gitignore, !sources/, !sources/**");
  writeFileSync(join(dossier, ".gitignore"), "# à moi\nnode_modules/\n");
  assert.equal(lancer(dossier).code, 0);
  assert.deepEqual(lignesDuGitignore(readFileSync(join(dossier, ".gitignore"), "utf8")), GITIGNORE);
});

test("index.html, .gitignore et .cache/ sont refaits à chaque passage, même s'ils existent ; .cache/projet/ est laissé", () => {
  const dossier = neuf();
  assert.equal(lancer(dossier).code, 0);
  for (const [, cible] of REFAITS) writeFileSync(join(dossier, cible), `/* ${cible} changé à la main */\n`);
  mkdirSync(join(dossier, ".cache", "projet"), { recursive: true });
  writeFileSync(join(dossier, ".cache", "projet", "projet.css"), "/* construit par style-du-projet.mjs */\n");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  for (const [source, cible] of REFAITS) {
    assert.deepEqual(readFileSync(join(dossier, cible)), readFileSync(join(MODELE, source)), `${cible} n'a pas été refait`);
  }
  assert.equal(readFileSync(join(dossier, ".cache", "projet", "projet.css"), "utf8"), "/* construit par style-du-projet.mjs */\n", ".cache/projet/ est à style-du-projet.mjs");
  assert.match(sortie, /refaite/);
});

test("une copie interrompue (index.html seul, qui charge .cache/moteur.js) reprend, et la page est refaite", () => {
  const dossier = neuf();
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, "index.html"), '<!doctype html><html><body><script src=".cache/moteur.js"></script></body></html>\n');
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  for (const [source, cible] of REFAITS) {
    assert.deepEqual(readFileSync(join(dossier, cible)), readFileSync(join(MODELE, source)), `${cible} manque ou diffère après la reprise`);
  }
});

test("aucun fichier de sources/ n'est jamais touché : plan.js, charte.css, écrans, actuels, passage-au-code.md, et le reste", () => {
  const dossier = neuf();
  assert.equal(lancer(dossier).code, 0);
  const sources = join(dossier, "sources");
  writeFileSync(join(sources, "plan.js"), 'window.A_PLAT = { version: 1, projet: "Le mien" };\n');
  writeFileSync(join(sources, "charte.css"), ':root[data-finition="ui"] { --ecran-accent: #c0392b; }\n.a-moi { color: var(--ecran-accent); }\n');
  writeFileSync(join(sources, "passage-au-code.md"), "# À coder\n");
  writeFileSync(join(sources, "ecrans", "A1-accueil.html"), "<!-- mon écran -->\n");
  writeFileSync(join(sources, "ecrans", "index.html"), "<!-- un écran qui s'appelle index.html -->\n");
  writeFileSync(join(sources, "actuel", "A1-accueil.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3]));
  writeFileSync(join(sources, "actuel", "commun.css"), "/* pas celui de l'outil */\n");
  mkdirSync(join(sources, "a-moi"));
  writeFileSync(join(sources, "a-moi", "note.txt"), "à garder\n");
  const avant = empreinte(sources);
  for (let passage = 1; passage <= 2; passage++) {
    const { code, sortie } = lancer(dossier);
    assert.equal(code, 0, sortie);
    assert.deepEqual(empreinte(sources), avant, `sources/ a changé au passage ${passage}`);
    assert.match(sortie, /charte\.css : gardé tel quel/);
    assert.doesNotMatch(sortie, /plan\.js reste à écrire/, "plan.js est là");
  }
});

test("sources/charte.css n'est créé que s'il manque", () => {
  const dossier = neuf();
  assert.equal(lancer(dossier).code, 0);
  rmSync(join(dossier, "sources", "charte.css"));
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.deepEqual(readFileSync(join(dossier, "sources", "charte.css")), readFileSync(join(MODELE, "charte.css")));
  assert.match(sortie, /charte\.css : créé/);
});

test("rien n'est écrit hors du dossier : ni à côté, ni CLAUDE.md, ni le .gitignore du projet", () => {
  const parent = join(racine, `${++numero}`);
  const projet = join(parent, "mon-projet");
  mkdirSync(join(projet, "src"), { recursive: true });
  writeFileSync(join(projet, "package.json"), '{ "name": "mon-projet" }\n');
  writeFileSync(join(projet, ".gitignore"), "node_modules/\n");
  writeFileSync(join(projet, "src", "app.js"), "console.log(1);\n");
  writeFileSync(join(parent, "voisin.txt"), "à côté du projet\n");
  const horsDuDossier = (liste) => Object.fromEntries(Object.entries(liste).filter(([f]) => !f.startsWith("mon-projet/a-plat/")));
  const avant = horsDuDossier(empreinte(parent));
  for (let passage = 1; passage <= 2; passage++) {
    const { code, sortie } = lancer(join(projet, "a-plat"));
    assert.equal(code, 0, sortie);
    assert.deepEqual(horsDuDossier(empreinte(parent)), avant, `quelque chose a été écrit hors de a-plat/ au passage ${passage}`);
  }
  assert.ok(!existsSync(join(projet, "CLAUDE.md")), "pas de CLAUDE.md");
  assert.equal(readFileSync(join(projet, ".gitignore"), "utf8"), "node_modules/\n", "le .gitignore du projet n'est pas touché");
  assert.ok(existsSync(join(projet, "a-plat", ".cache", "moteur.js")), "la page est bien dans a-plat/");
});

test("un dossier qui n'est pas à l'outil est refusé : code 2, message en français, rien d'écrit", () => {
  const dossier = neuf();
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, "photo.png"), "pas une vraie image");
  writeFileSync(join(dossier, "notes.txt"), "mes notes\n");
  const avant = empreinte(dossier);
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 2, sortie);
  assert.match(sortie, /n'est pas un dossier d'À plat/);
  assert.match(sortie, /autre dossier/);
  assert.doesNotMatch(sortie, /reprendre\.mjs/, "un dossier étranger n'est pas un ancien dossier");
  assert.deepEqual(empreinte(dossier), avant, "rien ne doit être ajouté ni changé");
});

test("un index.html qui ne charge pas .cache/moteur.js ne rend pas le dossier à l'outil", () => {
  const dossier = neuf();
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, "index.html"), '<!doctype html><html><body><script src="app.js"></script></body></html>\n');
  const avant = empreinte(dossier);
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 2, sortie);
  assert.deepEqual(empreinte(dossier), avant);
});

test("un ancien dossier de maquettes (plan.js à la racine) est refusé : code 2, le message cite reprendre.mjs, rien d'écrit", () => {
  const dossier = neuf("maquettes");
  mkdirSync(join(dossier, "ecrans"), { recursive: true });
  writeFileSync(join(dossier, "plan.js"), 'window.A_PLAT = { version: 1, projet: "Ancien" };\n');
  writeFileSync(join(dossier, "index.html"), '<!doctype html><html><body><script src="a-plat/moteur.js"></script></body></html>\n');
  writeFileSync(join(dossier, "ecrans", "A1-accueil.html"), "<!-- ancien écran -->\n");
  const avant = empreinte(dossier);
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 2, sortie);
  assert.match(sortie, /ancien dossier/);
  assert.match(sortie, /reprendre\.mjs/);
  assert.deepEqual(empreinte(dossier), avant, "l'ancien dossier n'est pas touché");
});

test("un ancien dossier reconnu à son moteur dans a-plat/ (sans plan.js) est refusé de même", () => {
  const dossier = neuf("maquettes");
  mkdirSync(join(dossier, "a-plat"), { recursive: true });
  writeFileSync(join(dossier, "a-plat", "moteur.js"), "// ancien moteur\n");
  const avant = empreinte(dossier);
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 2, sortie);
  assert.match(sortie, /reprendre\.mjs/);
  assert.deepEqual(empreinte(dossier), avant);
});

test("un dossier vide est celui de l'outil : la copie s'y fait", () => {
  const dossier = neuf();
  mkdirSync(dossier, { recursive: true });
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.ok(existsSync(join(dossier, ".cache", "moteur.js")));
  assert.ok(existsSync(join(dossier, "sources", "charte.css")));
});

test("un chemin avec des espaces et des accents marche", () => {
  const dossier = neuf("mes maquettes à moi");
  const { code, sortie } = lancer(dossier);
  assert.equal(code, 0, sortie);
  assert.ok(existsSync(join(dossier, "index.html")));
  assert.ok(existsSync(join(dossier, ".cache", "relais.js")));
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
  assert.equal(readFileSync(fichier, "utf8"), "x");
});

const TRACE_D_ERREUR = /\bat .*\(.*:\d+:\d+\)|\n\s+at /;

test("un dossier impossible à créer : code 2, un message en français, sans trace d'erreur", () => {
  const fichier = join(racine, `bloque-${++numero}.txt`);
  writeFileSync(fichier, "x");
  const { code, sortie } = lancer(join(fichier, "a-plat"));
  assert.equal(code, 2, sortie);
  assert.match(sortie, /ne peut pas être créé|n'a pas pu être créé/);
  assert.match(sortie, /rien n'a été copié|Rien n'a été copié/i);
  assert.doesNotMatch(sortie, TRACE_D_ERREUR);
});
