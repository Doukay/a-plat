// Aides communes aux tests de la page : assemblage d'un dossier de maquettes jetable
// et ouverture de sa page en file://, dans un navigateur isolé.
import { chromium } from "playwright";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { copierLeModeleEtLaFixture } from "../assembler.mjs";

// Copie le modèle de page, puis la fixture par-dessus, dans un dossier temporaire.
// Une fixture ne contient jamais de copie de la page. Une fixture donnée par un chemin absolu
// (voir genererFixture) est prise telle quelle. La copie est celle de tests/assembler.mjs,
// la même que pour la démo (tests/assembler-demo.mjs).
// options.retirer : chemins (relatifs au dossier assemblé) à supprimer après la copie.
export function assembler(fixture, options = {}) {
  const dossier = mkdtempSync(join(tmpdir(), "a-plat-test-"));
  copierLeModeleEtLaFixture(dossier, fixture);
  for (const chemin of options.retirer ?? []) rmSync(join(dossier, chemin), { recursive: true, force: true });
  return dossier;
}

function reglagesDuNavigateur() {
  const demande = (process.env.A_PLAT_NAVIGATEUR || "msedge").toLowerCase();
  if (demande === "chrome") return { channel: "chrome" };
  if (demande === "msedge" || demande === "edge") return { channel: "msedge" };
  throw new Error(`A_PLAT_NAVIGATEUR vaut « ${demande} » : valeurs permises, chrome ou msedge.`);
}

// Ouvre index.html de la fixture en file://, appelle `travail`, puis ferme tout
// et supprime le dossier temporaire.
// options : largeur, hauteur, schema ("light" | "dark"), mouvement ("no-preference" | "reduce"),
// adresse (partie après #), retirer (voir assembler), avant (script exécuté avant la page).
// `travail` reçoit { page, dossier, console, erreurs, requetes } :
//   console  : messages d'erreur de la console
//   erreurs  : erreurs non attrapées de la page
//   requetes : adresses demandées qui ne sont pas en file://
export async function avecPage(fixture, options, travail) {
  const dossier = assembler(fixture, { retirer: options.retirer });
  const navigateur = await chromium.launch(reglagesDuNavigateur());
  try {
    const contexte = await navigateur.newContext({
      viewport: { width: options.largeur ?? 1320, height: options.hauteur ?? 900 },
      colorScheme: options.schema ?? "light",
      reducedMotion: options.mouvement ?? "no-preference"
    });
    const page = await contexte.newPage();
    // Un test qui échoue doit échouer vite : 8 secondes d'attente au plus par action.
    page.setDefaultTimeout(8000);
    const releve = { console: [], erreurs: [], requetes: [] };
    page.on("console", (message) => {
      if (message.type() === "error") releve.console.push(message.text());
    });
    page.on("pageerror", (erreur) => releve.erreurs.push(String(erreur.message || erreur)));
    page.on("request", (requete) => {
      if (!requete.url().startsWith("file://")) releve.requetes.push(requete.url());
    });
    if (options.avant) await page.addInitScript(options.avant);
    const adresse = pathToFileURL(join(dossier, "index.html")).href + (options.adresse ? "#" + options.adresse : "");
    await page.goto(adresse);
    return await travail({ page, dossier, ...releve });
  } finally {
    await navigateur.close();
    rmSync(dossier, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- fixtures générées à l'exécution

const generees = [];

// Écrit une fixture jetable dans le dossier temporaire et renvoie son chemin, que l'on
// passe à avecPage ou assembler à la place d'un nom de fixture. Rien n'est à valider dans Git.
//   plan    : l'objet du plan (écrit dans plan.js)
//   ecrans  : { "A1-accueil.html": "<html…>" } écrits dans ecrans/
//   autres  : { "actuel/x.png": Buffer ou texte } écrits tels quels
// commun.css est écrit aussi, comme dans un vrai dossier de maquettes.
export function genererFixture({ plan, ecrans = {}, autres = {} }) {
  const dossier = mkdtempSync(join(tmpdir(), "a-plat-fixture-"));
  generees.push(dossier);
  const ecrire = (chemin, contenu) => {
    const cible = join(dossier, chemin);
    mkdirSync(dirname(cible), { recursive: true });
    writeFileSync(cible, contenu);
  };
  ecrire("plan.js", `window.A_PLAT = ${JSON.stringify(plan)};\n`);
  ecrire("commun.css", "body { font-family: sans-serif; }\n");
  for (const [nom, contenu] of Object.entries(ecrans)) ecrire(join("ecrans", nom), contenu);
  for (const [chemin, contenu] of Object.entries(autres)) ecrire(chemin, contenu);
  return dossier;
}

// Supprime toutes les fixtures générées ; à appeler dans after().
export function nettoyerFixtures() {
  while (generees.length > 0) rmSync(generees.pop(), { recursive: true, force: true });
}

// Un écran à la forme du format commun, avec le relais.
export function ecranHtml(code, corps, { tete = "", relais = true } = {}) {
  return `<!doctype html>
<html lang="fr" data-ecran="${code}">
<head><meta charset="utf-8"><title>${code}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="../commun.css">${tete}</head>
<body>${corps}${relais ? '<script src="../a-plat/relais.js"></script>' : ""}</body>
</html>
`;
}
