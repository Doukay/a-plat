// La finition « fidele » : le contrôle (verifier.mjs), la construction du style
// (style-du-projet.mjs) et les icônes (icones.mjs), sans Tailwind ni Lucide installés ici.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { copierLeModeleEtLaFixture } from "./assembler.mjs";

const SKILL = fileURLToPath(new URL("../skills/a-plat/", import.meta.url));
const FIXTURE = fileURLToPath(new URL("./fixtures/complet", import.meta.url));

let racine;
let numero = 0;
before(() => { racine = mkdtempSync(join(tmpdir(), "a-plat-fidele-")); });
after(() => { rmSync(racine, { recursive: true, force: true }); });

function lancer(script, ...args) {
  const r = spawnSync(process.execPath, [join(SKILL, script), ...args], { encoding: "utf8", timeout: 30000 });
  return { code: r.status, sortie: `${r.stdout}${r.stderr}` };
}

const TETE_FIDELE = '<link rel="stylesheet" href="../../.cache/projet/polices.css"><link rel="stylesheet" href="../../.cache/projet/projet.css"><link rel="stylesheet" href="../../.cache/projet/gris.css">';
const ecranFidele = (code, corps) => `<!doctype html><html lang="fr" data-ecran="${code}"><head><meta charset="utf-8"><title>${code}</title>${TETE_FIDELE}</head>` +
  `<body><div id="root">${corps}</div><script src="../../.cache/relais.js"></script></body></html>`;

// Un vrai dossier a-plat/ en finition « fidele » : la page rangée comme le fait copier.mjs, la
// fixture complète dans sources/, ses trois écrans réécrits avec des classes du projet, et un
// .cache/projet/ complet.
function preparer() {
  const dossier = join(racine, `${++numero}`, "a-plat");
  mkdirSync(dossier, { recursive: true });
  copierLeModeleEtLaFixture(dossier, FIXTURE);
  const plan = join(dossier, "sources", "plan.js");
  writeFileSync(plan, readFileSync(plan, "utf8").replace('finition: "gris"', 'finition: "fidele"'));
  writeFileSync(join(dossier, "sources", "ecrans", "A1-accueil.html"), ecranFidele("A1", '<h1 class="text-2xl font-semibold">Accueil</h1><a class="bouton" href="A2-fiche.html">Fiche</a>'));
  writeFileSync(join(dossier, "sources", "ecrans", "A2-fiche.html"), ecranFidele("A2", '<h1 class="text-xl">Fiche</h1>'));
  writeFileSync(join(dossier, "sources", "ecrans", "B1-pret.html"), ecranFidele("B1", '<h1 class="text-xl">Prêt</h1>'));
  mkdirSync(join(dossier, ".cache", "projet"));
  writeFileSync(join(dossier, ".cache", "projet", "projet.css"), ".text-xl { font-size: 1.25rem; }\n");
  writeFileSync(join(dossier, ".cache", "projet", "gris.css"), "html:not([data-finition=\"ui\"]) { filter: grayscale(1); }\n");
  // Le style a été construit après les écrans.
  const plusTard = new Date(Date.now() + 60000);
  utimesSync(join(dossier, ".cache", "projet", "projet.css"), plusTard, plusTard);
  return dossier;
}

// ---------------------------------------------------------------- le contrôle

test("un dossier fidèle complet passe, sans avertissement sur le style, et sans exiger le bloc UI", () => {
  const { code, sortie } = lancer("verifier.mjs", preparer());
  assert.equal(code, 0, sortie);
  assert.doesNotMatch(sortie, /vrai style|projet\/|bloc :root/);
});

test("sans projet/projet.css ni gris.css : code 1, le message dit de lancer style-du-projet.mjs", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  const { code, sortie } = lancer("verifier.mjs", dossier);
  assert.equal(code, 1, sortie);
  assert.match(sortie, /\.cache\/projet\/projet\.css : lancer style-du-projet\.mjs/);
  assert.match(sortie, /\.cache\/projet\/gris\.css/);
});

test("une feuille du projet qui charge depuis Internet est refusée ; une image locale ou en data: non", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, ".cache", "projet", "projet.css"), '.a { background: url("fichiers/fond.png"); }\n.b { background: url(data:image/png;base64,AA); }\n');
  assert.equal(lancer("verifier.mjs", dossier).code, 0);
  writeFileSync(join(dossier, ".cache", "projet", "projet.css"), '@import "https://exemple.com/police.css";\n');
  const { code, sortie } = lancer("verifier.mjs", dossier);
  assert.equal(code, 1, sortie);
  assert.match(sortie, /\.cache\/projet\/projet\.css charge depuis Internet : https:\/\/exemple\.com\/police\.css/);
});

test("un actuel qui charge gris.css est refusé : l'actuel garde le vrai style", () => {
  const dossier = preparer();
  const actuel = ecranFidele("A2", "<p>Avant</p>").replace(' data-ecran="A2"', "");
  writeFileSync(join(dossier, "sources", "actuel", "A2-fiche.html"), actuel);
  writeFileSync(join(dossier, "sources", "plan.js"), readFileSync(join(dossier, "sources", "plan.js"), "utf8").replace('"actuel/A2-fiche.png", origine: "capture"', '"actuel/A2-fiche.html", origine: "redessine"'));
  const { code, sortie } = lancer("verifier.mjs", dossier);
  assert.equal(code, 1, sortie);
  assert.match(sortie, /L'existant de A2 charge \.cache\/projet\/gris\.css/);
  writeFileSync(join(dossier, "sources", "actuel", "A2-fiche.html"), actuel.replace('<link rel="stylesheet" href="../../.cache/projet/gris.css">', ""));
  assert.equal(lancer("verifier.mjs", dossier).code, 0);
});

test("un écran encore en commun.css est signalé en une seule ligne, avec son code", () => {
  const dossier = preparer();
  cpSync(join(FIXTURE, "sources", "ecrans", "B1-pret.html"), join(dossier, "sources", "ecrans", "B1-pret.html"));
  const { code, sortie } = lancer("verifier.mjs", dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /Avertissement : 1 écran n'a pas le vrai style du projet \(B1\)/);
});

test("un écran changé après la construction par Tailwind : avertissement qui dit de relancer ; pas pour une feuille recopiée", () => {
  const dossier = preparer();
  const tot = new Date(Date.now() - 3600000);
  writeFileSync(join(dossier, ".cache", "projet", "projet.css"), "/* Construit par style-du-projet.mjs depuis index.css (Tailwind 4.3.3), pour les classes de 3 écrans. */\n.text-xl { font-size: 1.25rem; }\n");
  utimesSync(join(dossier, ".cache", "projet", "projet.css"), tot, tot);
  const { code, sortie } = lancer("verifier.mjs", dossier);
  assert.equal(code, 0, sortie);
  assert.match(sortie, /3 écrans ont changé après la construction du style \(A1, A2, B1\) : relancer style-du-projet\.mjs/);
  writeFileSync(join(dossier, ".cache", "projet", "projet.css"), "/* Recopié par style-du-projet.mjs depuis index.css, @import locaux compris. */\n.a { color: red; }\n");
  utimesSync(join(dossier, ".cache", "projet", "projet.css"), tot, tot);
  assert.doesNotMatch(lancer("verifier.mjs", dossier).sortie, /ont changé après/);
});

test("un SVG intégré en data:, avec son xmlns, n'est pas pris pour une adresse en ligne", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, ".cache", "projet", "projet.css"),
    ".fleche { background-image: url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3c/svg%3e\"); }\n");
  const { code, sortie } = lancer("verifier.mjs", dossier);
  assert.equal(code, 0, sortie);
});

test("une page d'avant la finition fidèle est signalée", () => {
  const dossier = preparer();
  writeFileSync(join(dossier, ".cache", "moteur.js"), '// ancienne page\nvar D = { "charte": "ui" }; nomDeLAvancement;\n');
  const { sortie } = lancer("verifier.mjs", dossier);
  assert.match(sortie, /ne connaît pas la finition fidèle/);
});

// ---------------------------------------------------------------- style-du-projet.mjs

// Un faux projet : une feuille ordinaire qui importe une autre feuille, une image et une police
// locales, une adresse en ligne, et un paquet @fontsource installé.
function fauxProjet() {
  const projet = join(racine, `projet-${++numero}`);
  mkdirSync(join(projet, "src", "styles"), { recursive: true });
  mkdirSync(join(projet, "src", "images"), { recursive: true });
  writeFileSync(join(projet, "src", "images", "fond.png"), "png");
  writeFileSync(join(projet, "src", "styles", "base.css"), '.carte { background: url("../images/fond.png"); }\n');
  writeFileSync(join(projet, "src", "index.css"), '@import "./styles/base.css";\n@import url("https://fonts.exemple.com/x.css");\n.titre { color: #123456; background-image: url(https://exemple.com/a.png); }\n');
  writeFileSync(join(projet, "package.json"), JSON.stringify({ dependencies: { "@fontsource/essai": "1.0.0" } }));
  const paquet = join(projet, "node_modules", "@fontsource", "essai");
  mkdirSync(join(paquet, "files"), { recursive: true });
  writeFileSync(join(paquet, "package.json"), JSON.stringify({ name: "@fontsource/essai", version: "1.0.0" }));
  writeFileSync(join(paquet, "index.css"),
    "@font-face { font-family: 'Essai'; src: url(./files/essai-latin-400-normal.woff2) format('woff2'); }\n" +
    "@font-face { font-family: 'Essai'; src: url(./files/essai-cyrillic-400-normal.woff2) format('woff2'); }\n");
  writeFileSync(join(paquet, "files", "essai-latin-400-normal.woff2"), "w2");
  writeFileSync(join(paquet, "files", "essai-cyrillic-400-normal.woff2"), "w2");
  return projet;
}

test("style-du-projet.mjs recopie une feuille ordinaire dans projet/, sans rien d'Internet, avec ses fichiers et ses polices", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  const projet = fauxProjet();
  const avant = readdirSync(projet, { recursive: true }).sort();
  const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(projet, "src", "index.css"));
  assert.equal(code, 0, sortie);
  const css = readFileSync(join(dossier, ".cache", "projet", "projet.css"), "utf8");
  assert.match(css, /\.carte \{ background: url\("fichiers\/src\/images\/fond\.png"\); \}/, "l'@import local est mis bout à bout, l'image copiée sous son chemin");
  assert.ok(existsSync(join(dossier, ".cache", "projet", "fichiers", "src", "images", "fond.png")));
  assert.doesNotMatch(css, /url\(\s*["']?https?:|@import\s+url\(/, "plus rien ne se charge depuis Internet");
  assert.match(sortie, /Retiré, car en ligne : https:\/\/fonts\.exemple\.com\/x\.css, https:\/\/exemple\.com\/a\.png/);
  assert.match(css, /#123456/, "le style du projet garde ses couleurs");
  const polices = readFileSync(join(dossier, ".cache", "projet", "polices.css"), "utf8");
  assert.match(polices, /url\(polices\/essai-latin-400-normal\.woff2\)/);
  assert.doesNotMatch(polices, /cyrillic/);
  assert.deepEqual(readdirSync(join(dossier, ".cache", "projet", "polices")), ["essai-latin-400-normal.woff2"]);
  assert.match(readFileSync(join(dossier, ".cache", "projet", "gris.css"), "utf8"), /grayscale\(1\)/);
  assert.deepEqual(readdirSync(projet, { recursive: true }).sort(), avant, "rien n'est écrit dans le projet");
  // Le dossier passe ensuite le contrôle.
  assert.equal(lancer("verifier.mjs", dossier).code, 0);
});

// Un projet ordinaire, avec des fichiers ailleurs sur le disque, pour les cas limites.
function projetPiege() {
  const base = join(racine, `piege-${++numero}`);
  const projet = join(base, "projet");
  mkdirSync(join(projet, "src", "a"), { recursive: true });
  mkdirSync(join(projet, "src", "b"), { recursive: true });
  mkdirSync(join(projet, "public"), { recursive: true });
  mkdirSync(join(base, "dehors"), { recursive: true });
  writeFileSync(join(projet, "package.json"), "{}");
  writeFileSync(join(base, "dehors", "secret.txt"), "SECRET");
  writeFileSync(join(base, "dehors", "secret.css"), ".secret { content: 'SECRET'; }");
  writeFileSync(join(projet, "src", "a", "logo.png"), "logo a");
  writeFileSync(join(projet, "src", "b", "logo.png"), "logo b");
  writeFileSync(join(projet, "public", "marque.svg"), "<svg/>");
  writeFileSync(join(projet, "src", "a", "a.css"), '.a { background: url("logo.png"); }');
  writeFileSync(join(projet, "src", "b", "b.css"), '.b { background: url("logo.png"); }');
  writeFileSync(join(projet, "src", "couche.css"), ".dans-la-couche { margin: 0; }");
  writeFileSync(join(projet, "src", "index.css"), [
    '@import "./a/a.css";',
    '@import "./b/b.css";',
    '@import "./couche.css" layer(base);',
    '@import "./couche.css" supports(display: grid) screen;',
    '@import "../../dehors/secret.css";',
    '@import "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap";',
    `.loin { background: url("${join(base, "dehors", "secret.txt").split("\\").join("/")}"); }`,
    '.haut { background: url("../../dehors/secret.txt"); }',
    '.public { background: url(/marque.svg); }',
    '.ecran { background-image: image-set("https://exemple.com/a.png" 1x); }',
    ".svg { background: url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3c/svg%3e\"); }"
  ].join("\n"));
  return projet;
}

test("style-du-projet.mjs : rien d'Internet, rien d'hors du projet, pas d'écrasement, couches et supports gardés", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  const projet = projetPiege();
  const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(projet, "src", "index.css"));
  assert.equal(code, 0, sortie);
  const css = readFileSync(join(dossier, ".cache", "projet", "projet.css"), "utf8");
  // Internet : le @import avec un « ; » dans l'adresse, image-set ; le SVG intégré reste intact.
  assert.doesNotMatch(css, /fonts\.googleapis\.com\/css2[^*]*;\s*$|@import\s+"https/m);
  assert.doesNotMatch(css, /"https:\/\/exemple\.com/);
  assert.match(css, /xmlns='http:\/\/www\.w3\.org\/2000\/svg'/);
  assert.match(sortie, /Retiré, car en ligne : .*fonts\.googleapis\.com.*exemple\.com\/a\.png/);
  // Hors du projet : ni copié, ni mis bout à bout.
  assert.doesNotMatch(css, /SECRET/);
  assert.equal(readdirSync(join(dossier, ".cache", "projet", "fichiers"), { recursive: true }).some((n) => /secret/.test(n)), false);
  assert.match(sortie, /Pas recopiés, car hors du projet : .*secret/);
  // Deux logo.png gardent chacun le leur ; /marque.svg vient de public/.
  assert.match(css, /\.a \{ background: url\("fichiers\/src\/a\/logo\.png"\); \}/);
  assert.match(css, /\.b \{ background: url\("fichiers\/src\/b\/logo\.png"\); \}/);
  assert.equal(readFileSync(join(dossier, ".cache", "projet", "fichiers", "src", "b", "logo.png"), "utf8"), "logo b");
  assert.match(css, /url\("fichiers\/public\/marque\.svg"\)/);
  // Couches et supports : de vrais blocs, pas un @media invalide.
  assert.match(css, /@layer base \{\n\.dans-la-couche/);
  assert.match(css, /@supports \(display: grid\) \{\n@media screen \{\n\.dans-la-couche/);
  assert.doesNotMatch(css, /@media layer|@media supports/);
  // Chaque fichier n'est traité qu'une fois : pas de faux « introuvable ».
  assert.doesNotMatch(sortie, /introuvables/);
  assert.equal(lancer("verifier.mjs", dossier).code, 0);
});

test("style-du-projet.mjs : Tailwind 3, ou des règles à construire hors de Tailwind 4, s'arrêtent avec un code 2", () => {
  for (const [contenu, attendu] of [
    ["@tailwind base;\n@tailwind utilities;\n", /Tailwind 3/],
    [".a { @apply p-4; }\n", /règles à construire/]
  ]) {
    const dossier = preparer();
    rmSync(join(dossier, ".cache", "projet", "projet.css"));
    const projet = join(racine, `projet-${++numero}`);
    mkdirSync(projet);
    writeFileSync(join(projet, "index.css"), contenu);
    const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(projet, "index.css"));
    assert.equal(code, 2, sortie);
    assert.match(sortie, attendu);
    assert.match(sortie, /charte/);
    assert.equal(existsSync(join(dossier, ".cache", "projet", "projet.css")), false);
  }
});

// Un faux Tailwind 4 installé : compile() rend ce que ses résolveurs trouvent et les classes
// qu'il reçoit, le Scanner lit les attributs class. Pour tester le script sans le vrai Tailwind.
function fauxTailwind(projet) {
  const nm = join(projet, "node_modules");
  const ecrirePaquet = (nom, fichiers) => {
    for (const [chemin, contenu] of Object.entries(fichiers)) {
      mkdirSync(join(nm, nom, dirname(chemin)), { recursive: true });
      writeFileSync(join(nm, nom, chemin), contenu);
    }
  };
  ecrirePaquet("tailwindcss", { "package.json": JSON.stringify({ name: "tailwindcss", version: "4.0.0-essai", style: "index.css", exports: { ".": { style: "./index.css" }, "./theme": { style: "./theme.css" } } }), "index.css": "", "theme.css": "" });
  ecrirePaquet("@tailwindcss/node", {
    "package.json": JSON.stringify({ name: "@tailwindcss/node", exports: { ".": { import: "./index.mjs", default: "./index.mjs" } } }),
    "index.mjs": "export async function compile(css, o) {\n" +
      "  const r = [await o.customCssResolver('tailwindcss', o.base), await o.customCssResolver('tailwindcss/theme', o.base), await o.customCssResolver('tailwindcss/absent', o.base), await o.customJsResolver('./local.js', o.base)];\n" +
      "  return { build: (c) => '/* ' + r.map((x) => String(x).split(String.fromCharCode(92)).join('/')).join(' | ') + ' */\\n.classes { --c: \"' + [...c].sort().join(' ') + '\"; }\\n' };\n}\n"
  });
  ecrirePaquet("@tailwindcss/oxide", {
    "package.json": JSON.stringify({ name: "@tailwindcss/oxide", main: "index.js" }),
    "index.js": "class Scanner { scanFiles(f) { return f.flatMap((x) => [...x.content.matchAll(/class=\"([^\"]*)\"/g)].flatMap((m) => m[1].split(/\\s+/)).filter(Boolean)); } }\nmodule.exports = { Scanner };\n"
  });
}

test("style-du-projet.mjs avec Tailwind 4 : paquets résolus, classes des seuls écrans fidèles, rien quand aucun écran", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  // B1 reste en commun.css : ses classes ne comptent pas.
  cpSync(join(FIXTURE, "sources", "ecrans", "B1-pret.html"), join(dossier, "sources", "ecrans", "B1-pret.html"));
  const projet = join(racine, `tw-${++numero}`);
  mkdirSync(join(projet, "src"), { recursive: true });
  writeFileSync(join(projet, "package.json"), "{}");
  writeFileSync(join(projet, "src", "index.css"), '@import "tailwindcss";\n');
  fauxTailwind(projet);
  const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(projet, "src", "index.css"));
  assert.equal(code, 0, sortie);
  assert.match(sortie, /Tailwind 4\.0\.0-essai/);
  const css = readFileSync(join(dossier, ".cache", "projet", "projet.css"), "utf8");
  assert.match(css, /^\/\* Construit par style-du-projet\.mjs depuis index\.css \(Tailwind 4\.0\.0-essai\), pour les classes de 2 écrans/);
  assert.match(css, /node_modules\/tailwindcss\/index\.css \| [^|]*node_modules\/tailwindcss\/theme\.css \| undefined \| undefined/);
  assert.match(css, /--c: "bouton font-semibold text-2xl text-xl"/, "les classes des écrans fidèles A1 et A2, pas celles de B1 (page, carte…)");
  // Aucun écran fidèle encore : le script le dit.
  for (const nom of ["A1-accueil.html", "A2-fiche.html"]) cpSync(join(FIXTURE, "sources", "ecrans", nom), join(dossier, "sources", "ecrans", nom));
  const vide = lancer("style-du-projet.mjs", dossier, join(projet, "src", "index.css"));
  assert.equal(vide.code, 0, vide.sortie);
  assert.match(vide.sortie, /Aucun écran ne charge encore ce style : relancer le script après les premiers écrans/);
});

test("style-du-projet.mjs avec Tailwind 4 : les actuels de sources/actuel/ qui chargent ../../.cache/projet/projet.css comptent aussi", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  // Un actuel fidèle (projet.css seulement), et un actuel qui ne charge pas le style du projet.
  writeFileSync(join(dossier, "sources", "actuel", "A2-fiche.html"),
    '<!doctype html><html lang="fr"><head><link rel="stylesheet" href="../../.cache/projet/projet.css"></head><body><p class="classe-de-l-actuel">Avant</p><script src="../../.cache/relais.js"></script></body></html>');
  writeFileSync(join(dossier, "sources", "actuel", "B1-pret.html"),
    '<!doctype html><html lang="fr"><head><link rel="stylesheet" href="../../.cache/commun.css"></head><body><p class="pas-fidele">Avant</p></body></html>');
  // Un écran d'ancien dossier, au mauvais endroit : il n'est pas lu.
  mkdirSync(join(dossier, "ecrans"));
  writeFileSync(join(dossier, "ecrans", "Z9.html"), '<link rel="stylesheet" href="../projet/projet.css"><p class="ancien-dossier">x</p>');
  const projet = join(racine, `tw-${++numero}`);
  mkdirSync(join(projet, "src"), { recursive: true });
  writeFileSync(join(projet, "package.json"), "{}");
  writeFileSync(join(projet, "src", "index.css"), '@import "tailwindcss";\n');
  fauxTailwind(projet);
  const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(projet, "src", "index.css"));
  assert.equal(code, 0, sortie);
  const css = readFileSync(join(dossier, ".cache", "projet", "projet.css"), "utf8");
  assert.match(css, /--c: "[^"]*\bclasse-de-l-actuel\b/, "les classes de l'actuel fidèle");
  assert.doesNotMatch(css, /pas-fidele|ancien-dossier/, "ni l'actuel qui ne charge pas projet.css, ni un fichier hors de sources/");
  assert.ok(!existsSync(join(dossier, "projet")), "rien n'est écrit à l'ancienne place");
});

test("style-du-projet.mjs : les polices importées par le code, tous leurs fichiers ; --modules=… accepté", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  const projet = fauxProjet();
  const paquet = join(projet, "node_modules", "@fontsource", "essai");
  writeFileSync(join(paquet, "600.css"), "@font-face { font-family: 'Essai'; font-weight: 600; src: url(./files/essai-latin-600-normal.woff2) format('woff2'), url(./files/essai-latin-600-normal.woff) format('woff'); }\n");
  writeFileSync(join(paquet, "files", "essai-latin-600-normal.woff2"), "w2");
  writeFileSync(join(paquet, "files", "essai-latin-600-normal.woff"), "w1");
  writeFileSync(join(projet, "src", "main.jsx"), 'import "@fontsource/essai/600.css";\n');
  const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(projet, "src", "index.css"), `--modules=${projet}`);
  assert.equal(code, 0, sortie);
  const polices = readFileSync(join(dossier, ".cache", "projet", "polices.css"), "utf8");
  assert.match(polices, /url\(polices\/essai-latin-600-normal\.woff2\).*url\(polices\/essai-latin-600-normal\.woff\)/);
  assert.doesNotMatch(polices, /400/, "seules les feuilles importées par le code");
  assert.deepEqual(readdirSync(join(dossier, ".cache", "projet", "polices")).sort(), ["essai-latin-600-normal.woff", "essai-latin-600-normal.woff2"]);
});

test("style-du-projet.mjs : un fichier nommé projet à la place du dossier, code 1 sans trace d'erreur", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  writeFileSync(join(dossier, ".cache", "projet"), "");
  const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(fauxProjet(), "src", "index.css"));
  assert.equal(code, 1, sortie);
  assert.match(sortie, /ne peut pas être créé/);
  assert.doesNotMatch(sortie, /at .*\.mjs:\d+/);
});

test("style-du-projet.mjs : Tailwind demandé mais pas installé, code 2 et rien de construit", () => {
  const dossier = preparer();
  rmSync(join(dossier, ".cache", "projet"), { recursive: true });
  const projet = join(racine, `projet-${++numero}`);
  mkdirSync(projet);
  writeFileSync(join(projet, "index.css"), '@import "tailwindcss";\n');
  const { code, sortie } = lancer("style-du-projet.mjs", dossier, join(projet, "index.css"));
  assert.equal(code, 2, sortie);
  assert.match(sortie, /Tailwind n'est pas installé/);
  assert.match(sortie, /proposer la finition charte/);
  assert.equal(existsSync(join(dossier, ".cache", "projet", "projet.css")), false);
});

test("style-du-projet.mjs refuse un dossier qui n'est pas à l'outil, une feuille absente, et un usage incomplet", () => {
  const projet = fauxProjet();
  const vide = join(racine, `vide-${++numero}`);
  mkdirSync(vide);
  const refus = lancer("style-du-projet.mjs", vide, join(projet, "src", "index.css"));
  assert.equal(refus.code, 2);
  assert.match(refus.sortie, /n'est pas un dossier a-plat d'À plat \(ni \.cache\/moteur\.js, ni sources\/plan\.js\)/);
  assert.equal(existsSync(join(vide, ".cache")), false);
  // Un ancien dossier de maquettes (plan.js à la racine, moteur dans a-plat/) n'est pas reconnu non plus.
  const ancien = join(racine, `ancien-${++numero}`);
  cpSync(join(FIXTURE, "sources"), ancien, { recursive: true });
  cpSync(join(SKILL, "modele", "a-plat"), join(ancien, "a-plat"), { recursive: true });
  const avant = readdirSync(ancien, { recursive: true }).sort();
  assert.equal(lancer("style-du-projet.mjs", ancien, join(projet, "src", "index.css")).code, 2);
  assert.deepEqual(readdirSync(ancien, { recursive: true }).sort(), avant, "rien n'est écrit dans l'ancien dossier");
  // Un dossier a-plat/ sans sa page (sources/plan.js seul) est reconnu : le style va dans .cache/projet/.
  const sansPage = join(racine, `sans-page-${++numero}`, "a-plat");
  cpSync(FIXTURE, sansPage, { recursive: true });
  const ok = lancer("style-du-projet.mjs", sansPage, join(projet, "src", "index.css"));
  assert.equal(ok.code, 0, ok.sortie);
  assert.ok(existsSync(join(sansPage, ".cache", "projet", "projet.css")));
  assert.equal(lancer("style-du-projet.mjs", preparer(), join(projet, "absente.css")).code, 1);
  assert.equal(lancer("style-du-projet.mjs", preparer()).code, 2);
  assert.equal(lancer("style-du-projet.mjs", preparer(), join(projet, "src", "index.css"), "--modules").code, 2);
});

// ---------------------------------------------------------------- icones.mjs

test("icones.mjs : sans projet ni nom, l'usage ; sans lucide-react installé, code 2 et un message clair", () => {
  assert.equal(lancer("icones.mjs").code, 2);
  const projet = join(racine, `projet-${++numero}`);
  mkdirSync(projet);
  const { code, sortie } = lancer("icones.mjs", projet, "Bell");
  assert.equal(code, 2);
  assert.match(sortie, /lucide-react ne sont pas installés/);
});
