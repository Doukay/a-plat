import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MODELE = fileURLToPath(new URL("../skills/a-plat/modele", import.meta.url));
const VERIFIER = fileURLToPath(new URL("../skills/a-plat/verifier.mjs", import.meta.url));

const css = readFileSync(join(MODELE, "commun.css"), "utf8");
const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, "");

// Les six variables d'origine, puis celles ajoutées pour une UI crédible.
const VARIABLES = [
  "--ecran-fond", "--ecran-texte", "--ecran-accent", "--ecran-trait", "--ecran-police", "--ecran-arrondi",
  "--ecran-page", "--ecran-police-titre", "--ecran-mise-en-avant", "--ecran-sur-accent", "--ecran-arrondi-bouton"
];
const BLOC_UI = ':root[data-finition="ui"]';
const CLASSES = [".bouton", ".champ", ".carte", ".vignette"];

// Les règles du fichier, sans les commentaires : [{ selecteur, corps }]. Pas d'@media ni d'@import ici.
function regles(texte) {
  const trouvees = [];
  const motif = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = motif.exec(texte)) !== null) trouvees.push({ selecteur: m[1].trim(), corps: m[2] });
  return trouvees;
}

// Les noms de couleur courants. Ils servent à repérer une couleur écrite en toutes lettres.
const NOMS_DE_COULEUR = [
  "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown", "cyan", "magenta", "teal", "navy",
  "olive", "maroon", "lime", "aqua", "fuchsia", "indigo", "violet", "gold", "coral", "salmon", "crimson",
  "tomato", "khaki", "turquoise", "beige", "ivory", "lavender", "plum", "orchid", "tan", "skyblue", "steelblue"
];

// Toutes les couleurs écrites dans un texte de CSS, sous forme { texte, grise }.
function couleursDe(texte) {
  const trouvees = [];
  for (const m of texte.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
    const h = m[1];
    let canaux;
    if (h.length === 3 || h.length === 4) canaux = [h[0] + h[0], h[1] + h[1], h[2] + h[2]];
    else if (h.length === 6 || h.length === 8) canaux = [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
    else { trouvees.push({ texte: m[0], grise: false }); continue; }
    trouvees.push({ texte: m[0], grise: canaux[0].toLowerCase() === canaux[1].toLowerCase() && canaux[1].toLowerCase() === canaux[2].toLowerCase() });
  }
  for (const m of texte.matchAll(/\brgba?\(([^)]*)\)/gi)) {
    const nombres = m[1].split(/[\s,\/]+/).filter(Boolean).slice(0, 3);
    trouvees.push({ texte: m[0], grise: nombres.length === 3 && nombres.every((n) => n === nombres[0]) });
  }
  for (const m of texte.matchAll(/\bhsla?\(([^)]*)\)/gi)) {
    const saturation = m[1].split(/[\s,\/]+/).filter(Boolean)[1];
    trouvees.push({ texte: m[0], grise: saturation !== undefined && parseFloat(saturation) === 0 });
  }
  for (const nom of NOMS_DE_COULEUR) {
    if (new RegExp(`(^|[\\s:,(])${nom}($|[\\s;,)])`, "i").test(texte)) trouvees.push({ texte: nom, grise: false });
  }
  return trouvees;
}

test("commun.css est dans le modèle et n'est pas vide", () => {
  assert.ok(css.length > 300);
});

test("commun.css ne charge rien depuis Internet : ni url(http, ni @import", () => {
  assert.doesNotMatch(css, /url\(\s*["']?\s*(https?:)?\/\//i);
  assert.doesNotMatch(css, /@import/i);
  assert.doesNotMatch(css, /https?:\/\//i);
});

// Les variables d'un bloc : { "--ecran-accent": "#0066cc", … }.
const variablesDe = (corps) => Object.fromEntries([...corps.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].replace(/\s+/g, " ").trim()]));

test("deux blocs de variables en tête : l'UX sur :root, puis l'UI sur :root[data-finition=\"ui\"], aux mêmes noms", () => {
  const toutes = regles(sansCommentaires);
  assert.equal(toutes[0].selecteur, ":root", "la première règle du fichier est l'UX, sur :root");
  assert.equal(toutes[1].selecteur, BLOC_UI, "la deuxième est l'UI");
  const ux = variablesDe(toutes[0].corps);
  const ui = variablesDe(toutes[1].corps);
  assert.deepEqual(Object.keys(ui).sort(), Object.keys(ux).sort(), "les mêmes noms dans les deux blocs");
  // Le seul contrôle du nombre de variables : les onze attendues, et seulement elles.
  assert.deepEqual(Object.keys(ux).sort(), [...VARIABLES].sort(), "les variables attendues, et seulement elles");
  for (const variable of VARIABLES) {
    const motif = new RegExp(`${variable}\\s*:`, "g");
    assert.equal((sansCommentaires.match(motif) || []).length, 2, `${variable} n'est définie que dans les deux blocs`);
  }
});

test("dans le modèle, le bloc UI reprend les valeurs UX, et dit que Claude y écrit celles du projet", () => {
  const toutes = regles(sansCommentaires);
  assert.deepEqual(variablesDe(toutes[1].corps), variablesDe(toutes[0].corps));
  assert.match(css, /Claude y écrit les valeurs du projet/);
});

test("en UX, les couleurs sont des gris, sauf un seul bleu, l'accent, pour ce qui agit", () => {
  const ux = variablesDe(regles(sansCommentaires)[0].corps);
  for (const [nom, valeur] of Object.entries(ux)) {
    const couleurs = couleursDe(valeur);
    if (couleurs.length === 0) continue;
    if (nom === "--ecran-accent") {
      const [r, g, b] = valeur.match(/[0-9a-f]{2}/gi).slice(0, 3).map((h) => parseInt(h, 16));
      assert.ok(b > r && b > g, `${nom} est un bleu (${valeur})`);
    } else {
      // Les gris de La carte sont à peine froids (#f5f5f7, #1d1d1f) : 6 d'écart au plus entre canaux.
      const [r, g, b] = valeur.match(/[0-9a-f]{2}/gi).slice(0, 3).map((h) => parseInt(h, 16));
      assert.ok(Math.max(r, g, b) - Math.min(r, g, b) <= 6, `${nom} est un gris (${valeur})`);
    }
  }
  assert.equal(ux["--ecran-accent"], "#0066cc", "le bleu de La carte");
});

test("les classes de base existent et lisent les variables", () => {
  const toutes = regles(sansCommentaires);
  for (const classe of CLASSES) {
    const regle = toutes.find((r) => r.selecteur.split(",").map((s) => s.trim()).includes(classe));
    assert.ok(regle, `la classe ${classe} est définie`);
    assert.match(regle.corps, /var\(--ecran-/, `${classe} lit au moins une variable --ecran-`);
  }
});

test("hors des deux blocs, aucune couleur n'est écrite en dur : tout passe par les variables", () => {
  const toutes = regles(sansCommentaires);
  const apres = toutes.slice(2).map((r) => r.corps).join("\n");
  const en_dur = couleursDe(apres).map((c) => c.texte);
  assert.deepEqual(en_dur, []);
});

test("les écrans gardent leurs propres couleurs : le fichier demande le clair, jamais le sombre", () => {
  assert.match(sansCommentaires, /color-scheme\s*:\s*light\b/);
  assert.doesNotMatch(sansCommentaires, /prefers-color-scheme\s*:\s*dark/);
});

test("les cibles tactiles du bouton et du champ font 44 px au moins", () => {
  const toutes = regles(sansCommentaires);
  for (const classe of [".bouton", ".champ"]) {
    const regle = toutes.find((r) => r.selecteur.split(",").map((s) => s.trim()).includes(classe));
    const m = regle && regle.corps.match(/min-height\s*:\s*(\d+)px/);
    assert.ok(m && Number(m[1]) >= 44, `${classe} a un min-height d'au moins 44px`);
  }
});

// ---------------------------------------------------------------- ecran-type.html

const modeleDEcran = readFileSync(join(MODELE, "ecran-type.html"), "utf8");

test("ecran-type.html suit le format d'un écran, avec le code X0", () => {
  assert.match(modeleDEcran, /^<!doctype html>/i);
  assert.match(modeleDEcran, /<html lang="fr" data-ecran="X0">/);
  assert.match(modeleDEcran, /<meta charset="utf-8">/);
  assert.match(modeleDEcran, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
  assert.match(modeleDEcran, /<link rel="stylesheet" href="\.\.\/commun\.css">/);
  assert.match(modeleDEcran, /<script src="\.\.\/a-plat\/relais\.js"><\/script>\s*<\/body>/);
  assert.match(modeleDEcran, /<title>X0 · /);
});

test("ecran-type.html montre une fois chaque classe de base et explique en français comment s'en servir", () => {
  for (const classe of CLASSES) {
    const nom = classe.slice(1);
    assert.match(modeleDEcran, new RegExp(`class="[^"]*\\b${nom}\\b[^"]*"`), `la classe ${nom} est employée`);
  }
  const commentaires = [...modeleDEcran.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]);
  assert.ok(commentaires.length >= 3, "au moins trois commentaires");
  const texte = commentaires.join(" ");
  assert.match(texte, /ecrans\//, "dit où copier le fichier");
  assert.match(texte, /plan\.js/, "dit d'ajouter l'écran au plan");
  assert.match(texte, /crochets/, "dit comment écrire ce qu'on ne sait pas");
  assert.match(texte, /commun\.css/, "dit où changer les couleurs");
});

const dossiers = [];
after(() => { while (dossiers.length) rmSync(dossiers.pop(), { recursive: true, force: true }); });

test("copié dans ecrans/ et ajouté au plan, ecran-type.html passe le contrôle", () => {
  const dossier = mkdtempSync(join(tmpdir(), "a-plat-type-"));
  dossiers.push(dossier);
  mkdirSync(join(dossier, "ecrans"));
  cpSync(join(MODELE, "ecran-type.html"), join(dossier, "ecrans/X0-type.html"));
  writeFileSync(join(dossier, "plan.js"), `window.A_PLAT = { version: 1, projet: "Essai", etatDesLieux: [],
    rangees: [{ id: "X", titre: "Essai", notes: [] }],
    ecrans: [{ code: "X0", titre: "Écran type", rangee: "X", fichier: "X0-type.html", largeur: 390, hauteur: 844, statut: "a-relire", actuel: null }] };`);
  const resultat = spawnSync(process.execPath, [VERIFIER, dossier], { encoding: "utf8", timeout: 20000 });
  assert.equal(resultat.status, 0, resultat.stdout + resultat.stderr);
});
