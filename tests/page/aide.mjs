// Aides communes aux tests de la page : assemblage d'un dossier de maquettes jetable
// et ouverture de sa page en file://, dans un navigateur isolé.
import { chromium } from "playwright";
import { cpSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MODELE = fileURLToPath(new URL("../../skills/a-plat/modele", import.meta.url));
const FIXTURES = fileURLToPath(new URL("../fixtures", import.meta.url));

// Copie le modèle de page, puis la fixture par-dessus, dans un dossier temporaire.
// Une fixture ne contient jamais de copie de la page.
// options.retirer : chemins (relatifs au dossier assemblé) à supprimer après la copie.
export function assembler(fixture, options = {}) {
  const dossier = mkdtempSync(join(tmpdir(), "a-plat-test-"));
  cpSync(MODELE, dossier, { recursive: true });
  const source = join(FIXTURES, fixture);
  if (!existsSync(source)) throw new Error(`Fixture introuvable : ${fixture}`);
  cpSync(source, dossier, { recursive: true });
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
