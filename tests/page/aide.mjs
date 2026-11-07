// Aides communes aux tests de la page : assemblage d'un dossier a-plat/ jetable
// et ouverture de sa page en file://, dans un navigateur isolé.
// Avec A_PLAT_HTTP=1, la page est servie par un petit serveur web local (127.0.0.1 seulement,
// ce seul dossier) et ouverte par son adresse http, comme depuis un téléphone sur un serveur.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, extname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { copierLeModeleEtLaFixture } from "../assembler.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8"
};

// Sert un dossier, et lui seul, sur 127.0.0.1 à un port libre. Renvoie { origine, fermer }.
export function servirEnLocal(dossier) {
  const racine = resolve(dossier);
  const serveur = createServer((requete, reponse) => {
    try {
      const chemin = decodeURIComponent(new URL(requete.url, "http://127.0.0.1").pathname);
      const cible = resolve(join(racine, chemin === "/" ? "index.html" : chemin));
      if (cible !== racine && !cible.startsWith(racine + sep)) throw Object.assign(new Error("hors du dossier"), { code: 403 });
      if (!statSync(cible).isFile()) throw Object.assign(new Error("pas un fichier"), { code: 404 });
      reponse.writeHead(200, { "Content-Type": TYPES[extname(cible).toLowerCase()] ?? "application/octet-stream" });
      reponse.end(readFileSync(cible));
    } catch (erreur) {
      reponse.writeHead(erreur.code === 403 ? 403 : 404, { "Content-Type": "text/plain; charset=utf-8" });
      reponse.end("introuvable");
    }
  });
  return new Promise((ok) => {
    serveur.listen(0, "127.0.0.1", () => {
      const { port } = serveur.address();
      ok({ origine: `http://127.0.0.1:${port}`, fermer: () => new Promise((fini) => { serveur.close(fini); serveur.closeAllConnections?.(); }) });
    });
  });
}

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
  const serveur = process.env.A_PLAT_HTTP === "1" ? await servirEnLocal(dossier) : null;
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
      const adresse = requete.url();
      if (!adresse.startsWith("file://") && !(serveur && adresse.startsWith(serveur.origine + "/"))) releve.requetes.push(adresse);
    });
    if (options.avant) await page.addInitScript(options.avant);
    const base = serveur ? serveur.origine + "/index.html" : pathToFileURL(join(dossier, "index.html")).href;
    await page.goto(base + (options.adresse ? "#" + options.adresse : ""));
    return await travail({ page, dossier, ...releve });
  } finally {
    await navigateur.close();
    if (serveur) await serveur.fermer();
    rmSync(dossier, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- fixtures générées à l'exécution

const generees = [];

// Écrit une fixture jetable dans le dossier temporaire et renvoie son chemin, que l'on
// passe à avecPage ou assembler à la place d'un nom de fixture. Rien n'est à valider dans Git.
//   plan    : l'objet du plan (écrit dans sources/plan.js)
//   ecrans  : { "A1-accueil.html": "<html…>" } écrits dans sources/ecrans/
//   autres  : { "actuel/x.png": Buffer ou texte } écrits dans sources/, sauf « commun.css »
//             (.cache/commun.css), « projet/… » (.cache/projet/…) et « .cache/… », tels quels
// Un commun.css réduit est écrit dans .cache/, à la place de celui du modèle : les mesures des
// essais ne dépendent pas du style des écrans.
export function genererFixture({ plan, ecrans = {}, autres = {} }) {
  const dossier = mkdtempSync(join(tmpdir(), "a-plat-fixture-"));
  generees.push(dossier);
  const ecrire = (chemin, contenu) => {
    const cible = join(dossier, chemin);
    mkdirSync(dirname(cible), { recursive: true });
    writeFileSync(cible, contenu);
  };
  const place = (chemin) => chemin === "commun.css" ? ".cache/commun.css"
    : chemin.startsWith("projet/") ? `.cache/${chemin}`
    : chemin.startsWith(".cache/") ? chemin
    : `sources/${chemin}`;
  ecrire("sources/plan.js", `window.A_PLAT = ${JSON.stringify(plan)};\n`);
  ecrire(".cache/commun.css", "body { font-family: sans-serif; }\n");
  for (const [nom, contenu] of Object.entries(ecrans)) ecrire(join("sources", "ecrans", nom), contenu);
  for (const [chemin, contenu] of Object.entries(autres)) ecrire(place(chemin), contenu);
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
<link rel="stylesheet" href="../../.cache/commun.css">
<link rel="stylesheet" href="../charte.css">${tete}</head>
<body>${corps}${relais ? '<script src="../../.cache/relais.js"></script>' : ""}</body>
</html>
`;
}
