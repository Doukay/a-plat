// Contrôles de skills/a-plat/reprendre.mjs : un ancien dossier de maquettes (plan.js à la racine,
// moteur dans a-plat/) repris dans le dossier a-plat/ d'aujourd'hui, sources/ et la page.
// L'ancien dossier n'est jamais touché, et rien n'est écrasé dans un sources/ qui existe.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = fileURLToPath(new URL("../skills/a-plat/", import.meta.url));
const FIXTURE = fileURLToPath(new URL("./fixtures/complet/sources", import.meta.url));
const COMMUN_DU_MODELE = readFileSync(join(SKILL, "modele", "commun.css"), "utf8");

let racine;
let numero = 0;
before(() => { racine = mkdtempSync(join(tmpdir(), "a-plat-reprendre-")); });
after(() => { rmSync(racine, { recursive: true, force: true }); });

function lancer(script, ...args) {
  const r = spawnSync(process.execPath, [join(SKILL, script), ...args], { encoding: "utf8", timeout: 20000 });
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
// L'arborescence avec le contenu de chaque fichier, pour comparer octet pour octet.
const empreinte = (dossier) => Object.fromEntries(tout(dossier).map((f) => [f, f.endsWith("/") ? "dossier" : readFileSync(join(dossier, f))]));

// Un écran du dossier d'aujourd'hui remis aux liens d'un ancien dossier.
const auxAnciensLiens = (html) => html
  .replace(/<link rel="stylesheet" href="\.\.\/\.\.\/\.cache\/commun\.css">\s*<link rel="stylesheet" href="\.\.\/charte\.css">/, '<link rel="stylesheet" href="../commun.css">')
  .replace(/\.\.\/\.\.\/\.cache\/relais\.js/g, "../a-plat/relais.js");

const BLOC_UI_DU_PROJET = `:root[data-finition="ui"] {
  --ecran-page: #f4f4f0;
  --ecran-fond: #ffffff;
  --ecran-texte: #222222;
  --ecran-trait: #bbbbbb;
  --ecran-accent: #1f3b63;
  --ecran-sur-accent: #ffffff;
  --ecran-mise-en-avant: #e6e6df;
  --ecran-police: Arial, Helvetica, sans-serif;
  --ecran-police-titre: Arial, Helvetica, sans-serif;
  --ecran-arrondi: 4px;
  --ecran-arrondi-bouton: 4px;
}`;
const CLASSE_EN_PLUS = ".etiquette-du-projet { border: 1px solid var(--ecran-accent); padding: 2px 6px; }";

const ACTUEL_HTML = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Accueil actuel</title>
<link rel="stylesheet" href="../commun.css">
<link rel="stylesheet" href="../projet/projet.css"></head>
<body><h1>Accueil d'avant</h1><a href="../ecrans/A2-fiche.html">Perceuse</a>
<script src="../a-plat/relais.js"></script></body>
</html>
`;

// Un ancien dossier de maquettes, comme avant a-plat/ : plan.js, ecrans/ et actuel/ à la racine,
// aux anciens liens, un commun.css avec son bloc UI et une classe en plus, et l'ancienne page.
function ancienDossier() {
  const projet = join(racine, `${++numero}`, "mon-projet");
  const ancien = join(projet, "maquettes");
  mkdirSync(join(ancien, "ecrans"), { recursive: true });
  mkdirSync(join(ancien, "actuel"), { recursive: true });
  mkdirSync(join(ancien, "a-plat"), { recursive: true });
  const plan = readFileSync(join(FIXTURE, "plan.js"), "utf8")
    .replace(/(code: "A1"[\s\S]*?)actuel: null/, '$1actuel: { fichier: "actuel/A1-accueil.html", origine: "redessine" }');
  writeFileSync(join(ancien, "plan.js"), plan);
  for (const nom of readdirSync(join(FIXTURE, "ecrans"))) {
    writeFileSync(join(ancien, "ecrans", nom), auxAnciensLiens(readFileSync(join(FIXTURE, "ecrans", nom), "utf8")));
  }
  cpSync(join(FIXTURE, "actuel", "A2-fiche.png"), join(ancien, "actuel", "A2-fiche.png"));
  writeFileSync(join(ancien, "actuel", "A1-accueil.html"), ACTUEL_HTML);
  writeFileSync(join(ancien, "passage-au-code.md"), "# Passage au code\n\n- A2 : la caution.\n");
  // L'ancien commun.css : celui du modèle, avec le bloc UI du projet juste après l'UX, et une classe en plus.
  const commun = COMMUN_DU_MODELE.replace(/(:root \{[^}]*\})/, `$1\n\n${BLOC_UI_DU_PROJET}`) + `\n${CLASSE_EN_PLUS}\n`;
  writeFileSync(join(ancien, "commun.css"), commun);
  writeFileSync(join(ancien, "index.html"), '<!doctype html><html><body><script src="a-plat/moteur.js"></script></body></html>\n');
  writeFileSync(join(ancien, "a-plat", "moteur.js"), "// l'ancien moteur\n");
  return { projet, ancien, nouveau: join(projet, "a-plat") };
}

test("un ancien dossier donne un sources/ complet : plan, écrans et actuels aux nouveaux liens, charte avec le bloc UI et la classe en plus", () => {
  const { ancien, nouveau } = ancienDossier();
  const { code, sortie } = lancer("reprendre.mjs", ancien, nouveau);
  assert.equal(code, 0, sortie);
  const sources = join(nouveau, "sources");
  assert.deepEqual(tout(sources), ["actuel/", "actuel/A1-accueil.html", "actuel/A2-fiche.png", "charte.css", "ecrans/",
    "ecrans/A1-accueil.html", "ecrans/A2-fiche.html", "ecrans/B1-pret.html", "passage-au-code.md", "plan.js"]);
  // Recopiés tels quels.
  for (const nom of ["plan.js", "passage-au-code.md", "actuel/A2-fiche.png"]) {
    assert.deepEqual(readFileSync(join(sources, nom)), readFileSync(join(ancien, nom)), `${nom} est recopié octet pour octet`);
  }
  // Les écrans : commun.css et la charte de .cache/ et sources/, le relais de .cache/ ; le reste ne bouge pas.
  for (const nom of readdirSync(join(FIXTURE, "ecrans"))) {
    const html = readFileSync(join(sources, "ecrans", nom), "utf8");
    assert.match(html, /<link rel="stylesheet" href="\.\.\/\.\.\/\.cache\/commun\.css">\s*<link rel="stylesheet" href="\.\.\/charte\.css">/, nom);
    assert.match(html, /<script src="\.\.\/\.\.\/\.cache\/relais\.js"><\/script>/, nom);
    assert.doesNotMatch(html, /"\.\.\/commun\.css"|\.\.\/a-plat\/|"\.\.\/projet\//, `${nom} n'a plus de lien d'ancien dossier`);
    assert.equal(html.replace(/\s+/g, " "), readFileSync(join(FIXTURE, "ecrans", nom), "utf8").replace(/\s+/g, " "), `${nom} : seuls les liens ont changé`);
  }
  // L'actuel redessiné : commun.css et le style du projet dans .cache/, jamais la charte.
  const actuel = readFileSync(join(sources, "actuel", "A1-accueil.html"), "utf8");
  assert.match(actuel, /href="\.\.\/\.\.\/\.cache\/commun\.css"/);
  assert.match(actuel, /href="\.\.\/\.\.\/\.cache\/projet\/projet\.css"/);
  assert.match(actuel, /src="\.\.\/\.\.\/\.cache\/relais\.js"/);
  assert.doesNotMatch(actuel, /charte\.css/, "un actuel ne charge pas la charte");
  assert.doesNotMatch(actuel, /"\.\.\/commun\.css"|\.\.\/a-plat\/|"\.\.\/projet\//);
  // La charte : le bloc UI de l'ancien commun.css et sa classe en plus, sans l'UX ni les règles du modèle.
  const charte = readFileSync(join(sources, "charte.css"), "utf8");
  assert.ok(charte.includes(BLOC_UI_DU_PROJET), "le bloc UI de l'ancien commun.css");
  assert.ok(charte.includes(CLASSE_EN_PLUS), "la classe que l'ancien commun.css avait en plus");
  const sansCommentaires = charte.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(sansCommentaires, /(^|[}\s]):root\s*\{/, "pas de bloc UX");
  assert.doesNotMatch(sansCommentaires, /\.bouton\s*[{,]|\.carte\s*[{,]/, "pas les règles du modèle");
  assert.equal((sansCommentaires.match(/:root\[data-finition="ui"\]/g) || []).length, 1, "un seul bloc UI");
  assert.match(sortie, /charte\.css : écrit, avec le bloc UI de l'ancien commun\.css et 1 règles en plus à relire/);
  assert.match(sortie, /L'ancien dossier n'est pas touché/);
  // Rien d'autre n'est écrit : ni la page (copier.mjs la fait), ni l'ancien projet/.
  assert.deepEqual(readdirSync(nouveau), ["sources"]);
});

test("l'ancien dossier est intact, octet pour octet, et rien n'est écrit hors du nouveau dossier", () => {
  const { projet, ancien, nouveau } = ancienDossier();
  mkdirSync(join(ancien, "projet"));
  writeFileSync(join(ancien, "projet", "projet.css"), ".ancien { margin: 0; }\n");
  writeFileSync(join(projet, ".gitignore"), "node_modules/\n");
  const avant = empreinte(join(projet, ".."));
  const { code, sortie } = lancer("reprendre.mjs", ancien, nouveau);
  assert.equal(code, 0, sortie);
  const apres = empreinte(join(projet, ".."));
  const horsDuNouveau = (liste) => Object.fromEntries(Object.entries(liste).filter(([f]) => !f.startsWith("mon-projet/a-plat/")));
  assert.deepEqual(horsDuNouveau(apres), avant, "l'ancien dossier, le .gitignore du projet et le reste ne bougent pas");
  assert.ok(!existsSync(join(nouveau, "sources", "projet")) && !existsSync(join(nouveau, ".cache", "projet")), "projet/ se reconstruit avec style-du-projet.mjs");
});

test("rien n'est écrasé dans un sources/ qui existe : ce qui est là est gardé et dit", () => {
  const { ancien, nouveau } = ancienDossier();
  const sources = join(nouveau, "sources");
  mkdirSync(join(sources, "ecrans"), { recursive: true });
  writeFileSync(join(sources, "plan.js"), 'window.A_PLAT = { version: 1, projet: "Déjà là" };\n');
  writeFileSync(join(sources, "ecrans", "A1-accueil.html"), "<!-- déjà là -->\n");
  writeFileSync(join(sources, "charte.css"), ':root[data-finition="ui"] { --ecran-accent: #c0392b; }\n');
  const avant = empreinte(sources);
  const { code, sortie } = lancer("reprendre.mjs", ancien, nouveau);
  assert.equal(code, 0, sortie);
  const apres = empreinte(sources);
  for (const [chemin, contenu] of Object.entries(avant)) assert.deepEqual(apres[chemin], contenu, `${chemin} n'est pas écrasé`);
  assert.match(sortie, /déjà là, gardé tel quel \(2\) : sources\/ecrans\/A1-accueil\.html, sources\/plan\.js|déjà là, gardé tel quel \(2\) : sources\/plan\.js, sources\/ecrans\/A1-accueil\.html/);
  assert.match(sortie, /charte\.css : gardé tel quel/);
  // Le reste est recopié.
  assert.ok(existsSync(join(sources, "ecrans", "A2-fiche.html")));
  assert.ok(existsSync(join(sources, "actuel", "A2-fiche.png")));
  // Une deuxième reprise ne change plus rien.
  const une = empreinte(sources);
  const encore = lancer("reprendre.mjs", ancien, nouveau);
  assert.equal(encore.code, 0, encore.sortie);
  assert.deepEqual(empreinte(sources), une);
  assert.match(encore.sortie, /rien de nouveau à recopier/);
});

test("refus : un dossier sans plan.js d'À plat, l'ancien égal au nouveau, un nouveau dossier étranger, un usage incomplet", () => {
  const { projet, ancien, nouveau } = ancienDossier();
  // Sans plan.js.
  const sansPlan = join(projet, "pas-un-ancien");
  mkdirSync(join(sansPlan, "ecrans"), { recursive: true });
  writeFileSync(join(sansPlan, "commun.css"), ":root {}\n");
  const avant = empreinte(sansPlan);
  const refus = lancer("reprendre.mjs", sansPlan, nouveau);
  assert.equal(refus.code, 2, refus.sortie);
  assert.match(refus.sortie, /n'est pas un ancien dossier de maquettes d'À plat : il n'a pas de plan\.js/);
  assert.deepEqual(empreinte(sansPlan), avant);
  assert.ok(!existsSync(nouveau), "rien n'est créé");
  // Un plan.js qui n'est pas d'À plat.
  writeFileSync(join(sansPlan, "plan.js"), "const plan = 1;\n");
  assert.equal(lancer("reprendre.mjs", sansPlan, nouveau).code, 2);
  assert.ok(!existsSync(nouveau));
  // L'ancien égal au nouveau.
  const avantAncien = empreinte(ancien);
  const meme = lancer("reprendre.mjs", ancien, ancien);
  assert.equal(meme.code, 2, meme.sortie);
  assert.match(meme.sortie, /sont le même/);
  assert.deepEqual(empreinte(ancien), avantAncien, "l'ancien dossier n'est pas touché");
  // Un nouveau dossier qui a déjà des fichiers sans être à l'outil.
  const etranger = join(projet, "src");
  mkdirSync(etranger);
  writeFileSync(join(etranger, "app.js"), "console.log(1);\n");
  const refusEtranger = lancer("reprendre.mjs", ancien, etranger);
  assert.equal(refusEtranger.code, 2, refusEtranger.sortie);
  assert.deepEqual(readdirSync(etranger), ["app.js"]);
  // Usage incomplet.
  assert.equal(lancer("reprendre.mjs").code, 2);
  assert.equal(lancer("reprendre.mjs", ancien).code, 2);
});

test("après la reprise, copier.mjs met la page en place et le contrôle réussit, sans lien d'ancien dossier", () => {
  const { ancien, nouveau } = ancienDossier();
  assert.equal(lancer("reprendre.mjs", ancien, nouveau).code, 0);
  const copie = lancer("copier.mjs", nouveau);
  assert.equal(copie.code, 0, copie.sortie);
  assert.match(copie.sortie, /charte\.css : gardé tel quel/);
  const controle = lancer("verifier.mjs", nouveau);
  assert.equal(controle.code, 0, controle.sortie);
  assert.match(controle.sortie, /3 écrans vérifiés/);
  assert.doesNotMatch(controle.sortie, /ancien dossier|la page n'est pas en place/);
  // La charte reprise sert aussi pour une finition avec le bouton UX | UI : pas d'avertissement.
  const plan = join(nouveau, "sources", "plan.js");
  writeFileSync(plan, readFileSync(plan, "utf8").replace('finition: "gris"', 'finition: "charte"'));
  const charte = lancer("verifier.mjs", nouveau);
  assert.equal(charte.code, 0, charte.sortie);
  assert.doesNotMatch(charte.sortie, /l'UI n'a pas encore les couleurs du projet/);
  // L'ancien dossier, lui, reste refusé par le contrôle, qui renvoie à reprendre.mjs.
  const surLAncien = lancer("verifier.mjs", ancien);
  assert.equal(surLAncien.code, 2);
  assert.match(surLAncien.sortie, /reprendre\.mjs/);
});

test("la racine du projet donnée par erreur comme nouveau dossier est refusée, même avec un .cache/ ou un sources/ à elle", () => {
  const { projet, ancien } = ancienDossier();
  mkdirSync(join(projet, ".cache"));
  mkdirSync(join(projet, "sources"));
  writeFileSync(join(projet, "package.json"), "{}");
  const avant = empreinte(projet);
  const { code, sortie } = lancer("reprendre.mjs", ancien, projet);
  assert.equal(code, 2, sortie);
  assert.match(sortie, /n'est pas un dossier d'À plat/);
  assert.deepEqual(empreinte(projet), avant, "rien n'est écrit dans le projet");
});

test("sous-dossiers et images de l'ancien dossier suivent, liens intacts ; un « $& » du bloc UI reste tel quel ; un UX changé est dit", () => {
  const { ancien, nouveau } = ancienDossier();
  mkdirSync(join(ancien, "ecrans", "parties"));
  writeFileSync(join(ancien, "ecrans", "parties", "pied.html"), '<footer><link rel="stylesheet" href="../commun.css"></footer>');
  mkdirSync(join(ancien, "img"));
  writeFileSync(join(ancien, "img", "logo.png"), "png");
  const commun = readFileSync(join(ancien, "commun.css"), "utf8")
    .replace("--ecran-accent: #1f3b63;", () => "--ecran-accent: #1f3b63; --ecran-note: \"$& et $1\";")
    .replace("--ecran-page: #f5f5f7;", "--ecran-page: #fafafa;");
  writeFileSync(join(ancien, "commun.css"), commun);
  const { code, sortie } = lancer("reprendre.mjs", ancien, nouveau);
  assert.equal(code, 0, sortie);
  assert.ok(existsSync(join(nouveau, "sources", "ecrans", "parties", "pied.html")), "les sous-dossiers d'ecrans/ suivent");
  assert.equal(readFileSync(join(nouveau, "sources", "img", "logo.png"), "utf8"), "png", "img/ suit, à la même place par rapport aux écrans");
  assert.ok(!existsSync(join(nouveau, "sources", "a-plat")) && !existsSync(join(nouveau, "sources", "index.html")), "pas la page d'avant");
  assert.match(readFileSync(join(nouveau, "sources", "charte.css"), "utf8"), /--ecran-note: "\$& et \$1";/);
  assert.match(sortie, /l'ancien bloc UX \(:root\) avait été changé \(--ecran-page\)/);
});
