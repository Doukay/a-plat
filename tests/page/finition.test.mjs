// Le bouton « UX | UI » : la page choisit le jeu de variables de commun.css de tous les écrans
// (relais.js pose data-finition sur leur racine), sauf l'actuel, qui garde le vrai style du projet.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { avecPage, genererFixture, nettoyerFixtures, ecranHtml } from "./aide.mjs";

after(nettoyerFixtures);

const MODELE = fileURLToPath(new URL("../../skills/a-plat/modele/commun.css", import.meta.url));
const UX = "#0066cc";
const UI = "#c0392b";

// Le commun.css du modèle, avec un bloc UI aux couleurs d'un projet : un autre accent, un autre fond.
function communAvecUneUI() {
  return readFileSync(MODELE, "utf8").replace(/(:root\[data-finition="ui"\] \{)([^}]*)\}/, (_, debut, corps) =>
    debut + corps.replace(`--ecran-accent: ${UX};`, `--ecran-accent: ${UI};`).replace("--ecran-page: #f5f5f7;", "--ecran-page: #fdf6e3;") + "}");
}

const ecran = (code, titre, plus = {}) => ({ code, titre, fichier: `${code}.html`, largeur: 390, hauteur: 844, statut: "a-relire", actuel: null, ...plus });

// Une fixture dont le réglage de finition est donné (ou absent). A1 a un actuel redessiné qui
// charge lui aussi commun.css : le pire des cas, pour vérifier qu'il n'est jamais touché.
function fixture(finition) {
  const plan = {
    version: 1, projet: "Essai", etatDesLieux: [],
    rangees: [{ id: "A", titre: "Rangée A", notes: [] }, { id: "B", titre: "Rangée B", notes: [] }],
    ecrans: [
      ecran("A1", "Accueil", { rangee: "A", actuel: { fichier: "actuel/A1.html", origine: "redessine" } }),
      ecran("A2", "Fiche", { rangee: "A" }),
      ecran("B1", "Demande", { rangee: "B" })
    ]
  };
  if (finition !== undefined) plan.reglages = { finition };
  const corps = (titre) => `<main class="page"><h1>${titre}</h1><div class="carte">Une carte</div><a class="bouton" href="#">Agir</a></main>`;
  const ecrans = {};
  for (const e of plan.ecrans) ecrans[`${e.code}.html`] = ecranHtml(e.code, corps(e.titre));
  return genererFixture({
    plan, ecrans,
    autres: {
      "commun.css": communAvecUneUI(),
      "actuel/A1.html": ecranHtml("A1", corps("Accueil, existant")),
      // Une page qui n'est pas celle d'À plat et qui tient un écran : pour parler à relais.js
      // seul, sans que la page d'À plat réponde à sa place.
      "harnais.html": '<!doctype html><html><body><iframe id="ecran" src="ecrans/A2.html" width="390" height="600"></iframe></body></html>'
    }
  });
}

const PAR_FINITION = {
  gris: fixture("gris"),
  sansReglage: fixture(undefined),
  charte: fixture("charte"),
  grisPuisCharte: fixture("gris-puis-charte")
};

const groupe = (page) => page.getByRole("group", { name: "Finition des écrans" });
const enfonce = (page) => groupe(page).locator('button[aria-pressed="true"]').innerText();

async function cadre(page, selecteur) {
  const poignee = await page.locator(selecteur).first().elementHandle();
  return poignee.contentFrame();
}

// Attend qu'un cadre ait reçu cette finition, puis renvoie son accent et sa couleur de bouton.
async function finitionDe(cadreDeLEcran, voulue) {
  await cadreDeLEcran.waitForFunction((v) => (document.documentElement.getAttribute("data-finition") || "aucune") === v, voulue);
  return cadreDeLEcran.evaluate(() => ({
    accent: getComputedStyle(document.documentElement).getPropertyValue("--ecran-accent").trim(),
    bouton: getComputedStyle(document.querySelector(".bouton")).backgroundColor
  }));
}

// ---------------------------------------------------------------- le bouton

test("le bouton UX | UI n'apparaît qu'avec la finition « charte » ou « gris-puis-charte »", async () => {
  for (const [nom, attendu] of [["gris", 0], ["sansReglage", 0], ["charte", 1], ["grisPuisCharte", 1]]) {
    await avecPage(PAR_FINITION[nom], { adresse: "ensemble" }, async ({ page }) => {
      assert.equal(await groupe(page).count(), attendu, nom);
      if (attendu === 0) {
        // Sans bouton, tout reste en UX.
        const a1 = await cadre(page, '.planche iframe[data-code="A1"]');
        assert.equal((await finitionDe(a1, "ux")).accent, UX, nom);
      }
    });
  }
});

test("la position de départ suit le réglage : « charte » en UI, « gris-puis-charte » en UX ; le titre le dit", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "ensemble" }, async ({ page }) => {
    assert.equal(await enfonce(page), "UI");
    assert.deepEqual(await groupe(page).getByRole("button").evaluateAll((els) => els.map((el) => el.getAttribute("aria-pressed"))), ["false", "true"]);
    assert.match(await page.title(), /UI · couleurs du projet/);
  });
  await avecPage(PAR_FINITION.grisPuisCharte, { adresse: "ensemble" }, async ({ page }) => {
    assert.equal(await enfonce(page), "UX");
    assert.match(await page.title(), /UX · maquette en gris/);
  });
});

test("les deux positions sont de vrais boutons d'au moins 44 px au toucher, dans la barre noire", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const boutons = await groupe(page).getByRole("button").all();
    assert.equal(boutons.length, 2);
    for (const bouton of boutons) {
      const boite = await bouton.boundingBox();
      assert.ok(boite.height >= 44 && boite.width >= 44, `bouton : ${boite.width} x ${boite.height}`);
      assert.ok(boite.x >= 0 && boite.x + boite.width <= 390);
    }
    assert.equal(await groupe(page).evaluate((el) => el.closest(".barre") !== null), true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  });
});

test("le choix est retenu par projet, et se relit sans erreur quand localStorage lève une erreur", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "ensemble" }, async ({ page }) => {
    await groupe(page).getByRole("button", { name: "UX" }).click();
    assert.equal(await enfonce(page), "UX");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("a-plat:finition:Essai"))), "ux");
    await page.reload();
    await groupe(page).waitFor();
    assert.equal(await enfonce(page), "UX", "après un rechargement");
    await page.evaluate(() => { location.hash = "#ecran/A2"; });
    await page.waitForFunction(() => document.body.dataset.vue === "ecran");
    assert.equal(await enfonce(page), "UX", "d'une vue à l'autre");
  });
  const refus = () => {
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("refusé", "SecurityError"); } });
  };
  await avecPage(PAR_FINITION.charte, { adresse: "ensemble", avant: refus }, async ({ page, erreurs, console: messages }) => {
    assert.equal(await enfonce(page), "UI", "sans stockage, le départ du réglage");
    await groupe(page).getByRole("button", { name: "UX" }).click();
    assert.equal(await enfonce(page), "UX");
    await page.evaluate(() => { location.hash = "#rangee/A"; });
    await page.waitForFunction(() => document.body.dataset.vue === "rangee");
    assert.equal(await enfonce(page), "UX", "gardé en mémoire le temps de la visite");
    assert.deepEqual(erreurs, []);
    assert.deepEqual(messages, []);
  });
});

// ---------------------------------------------------------------- les cadres

test("chaque cadre reçoit la finition : vignettes de la planche, rangée, écran seul, et à chaque changement", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    for (const code of ["A1", "A2", "B1"]) {
      const vignette = await cadre(page, `.planche iframe[data-code="${code}"]`);
      const avant = await finitionDe(vignette, "ui");
      assert.equal(avant.accent, UI, `${code} en UI`);
      assert.equal(avant.bouton, "rgb(192, 57, 43)");
    }
    await groupe(page).getByRole("button", { name: "UX" }).click();
    for (const code of ["A1", "A2", "B1"]) {
      const vignette = await cadre(page, `.planche iframe[data-code="${code}"]`);
      assert.equal((await finitionDe(vignette, "ux")).bouton, "rgb(0, 102, 204)", `${code} repasse en UX`);
    }
  });
  await avecPage(PAR_FINITION.charte, { adresse: "rangee/A", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    assert.equal((await finitionDe(await cadre(page, '.rangee-carte iframe[data-code="A2"]'), "ui")).accent, UI);
  });
  await avecPage(PAR_FINITION.charte, { adresse: "ecran/A2", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const proposition = await cadre(page, ".volet-proposition iframe");
    assert.equal((await finitionDe(proposition, "ui")).accent, UI);
    await groupe(page).getByRole("button", { name: "UX" }).click();
    assert.equal((await finitionDe(proposition, "ux")).accent, UX);
  });
});

test("l'actuel n'est jamais touché : il garde le vrai style du projet, en UX comme en UI", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "ecran/A1", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const proposition = await cadre(page, ".volet-proposition iframe");
    const actuel = await cadre(page, ".volet-actuel iframe");
    await finitionDe(proposition, "ui");
    await actuel.waitForFunction(() => document.documentElement.dataset.aPlatMode === "corriger");
    const lire = () => actuel.evaluate(() => ({ attribut: document.documentElement.getAttribute("data-finition"), bouton: getComputedStyle(document.querySelector(".bouton")).backgroundColor }));
    assert.deepEqual(await lire(), { attribut: null, bouton: "rgb(0, 102, 204)" });
    await groupe(page).getByRole("button", { name: "UX" }).click();
    await finitionDe(proposition, "ux");
    await groupe(page).getByRole("button", { name: "UI" }).click();
    await finitionDe(proposition, "ui");
    assert.deepEqual(await lire(), { attribut: null, bouton: "rgb(0, 102, 204)" });
  });
});

// ---------------------------------------------------------------- relais.js

test("relais.js : le message finition pose l'attribut ; une valeur inconnue ou une autre source sont ignorées", async () => {
  await avecPage(PAR_FINITION.charte, {}, async ({ page, dossier }) => {
    await page.goto(pathToFileURL(join(dossier, "harnais.html")).href);
    const ecranDuHarnais = await cadre(page, "#ecran");
    await ecranDuHarnais.waitForFunction(() => document.querySelector(".bouton") !== null);
    const attribut = () => ecranDuHarnais.evaluate(() => document.documentElement.getAttribute("data-finition"));
    assert.equal(await attribut(), null, "rien tant que la page n'a rien dit : l'UX");
    const envoyer = (message) => page.evaluate((m) => document.querySelector("#ecran").contentWindow.postMessage(m, "*"), message);
    await envoyer({ aPlat: 1, type: "finition", valeur: "ui" });
    assert.equal((await finitionDe(ecranDuHarnais, "ui")).accent, UI, "la page parle : l'écran passe en UI");
    for (const message of [
      { aPlat: 1, type: "finition", valeur: "rouge" },
      { aPlat: 1, type: "finition", valeur: "UX" },
      { aPlat: 1, type: "finition" },
      { type: "finition", valeur: "ux" },
      { aPlat: 2, type: "finition", valeur: "ux" }
    ]) await envoyer(message);
    // Une autre source : l'écran se parle à lui-même.
    await ecranDuHarnais.evaluate(() => window.postMessage({ aPlat: 1, type: "finition", valeur: "ux" }, "*"));
    await page.waitForTimeout(300);
    assert.equal(await attribut(), "ui", "rien n'a changé");
    await envoyer({ aPlat: 1, type: "finition", valeur: "ux" });
    assert.equal((await finitionDe(ecranDuHarnais, "ux")).accent, UX, "et la page peut le ramener en UX");
  });
});

test("un écran ouvert seul, hors de la page, s'affiche en UX", async () => {
  await avecPage(PAR_FINITION.charte, {}, async ({ page, dossier }) => {
    await page.goto(pathToFileURL(join(dossier, "ecrans", "A2.html")).href);
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-finition")), null);
    assert.equal(await page.locator(".bouton").evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(0, 102, 204)");
  });
});
