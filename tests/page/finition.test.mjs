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
const CHARTE_DU_MODELE = fileURLToPath(new URL("../../skills/a-plat/modele/charte.css", import.meta.url));
const UX = "#0066cc";
const UI = "#c0392b";

// Le style des écrans d'un dossier a-plat/ : le commun.css du modèle (dans .cache/, l'UX), et une
// charte (sources/charte.css) au bloc UI aux couleurs d'un projet : un autre accent, un autre fond.
// Pour l'essai seulement, une boîte qui grandit en UI (comme le ferait une police du projet).
function styleAvecUneUI() {
  const charte = readFileSync(CHARTE_DU_MODELE, "utf8");
  const motif = /(:root\[data-finition="ui"\] \{)([^}]*)\}/;
  assert.match(charte, motif, "la charte du modèle a son bloc UI");
  return {
    "commun.css": readFileSync(MODELE, "utf8"),
    "charte.css": charte.replace(motif, (_, debut, corps) =>
      debut + corps.replace(`--ecran-accent: ${UX};`, `--ecran-accent: ${UI};`).replace("--ecran-page: #f5f5f7;", "--ecran-page: #fdf6e3;") + "}") +
      "\n.selon-finition { height: 200px; }\n:root[data-finition=\"ui\"] .selon-finition { height: 1600px; }\n"
  };
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
  const corps = (titre, plus = "") => `<main class="page"><h1>${titre}</h1><div class="carte">Une carte</div><a class="bouton" href="#">Agir</a>${plus}</main>`;
  const ecrans = {};
  for (const e of plan.ecrans) ecrans[`${e.code}.html`] = ecranHtml(e.code, corps(e.titre));
  // A1 mène à A2, pour le mode « Essayer le parcours » ; A2 change de hauteur selon la finition.
  ecrans["A1.html"] = ecranHtml("A1", corps("Accueil", '<a class="action" href="A2.html">Voir la fiche</a>'));
  ecrans["A2.html"] = ecranHtml("A2", corps("Fiche", '<div class="selon-finition"></div>'));
  return genererFixture({
    plan, ecrans,
    autres: {
      ...styleAvecUneUI(),
      "actuel/A1.html": ecranHtml("A1", corps("Accueil, existant")),
      // Une page qui n'est pas celle d'À plat et qui tient un écran : pour parler à relais.js
      // seul, sans que la page d'À plat réponde à sa place. Écrite dans sources/, à côté de ecrans/.
      "harnais.html": '<!doctype html><html><body><iframe id="ecran" src="ecrans/A2.html" width="390" height="600"></iframe></body></html>'
    }
  });
}

const PAR_FINITION = {
  gris: fixture("gris"),
  sansReglage: fixture(undefined),
  charte: fixture("charte"),
  grisPuisCharte: fixture("gris-puis-charte"),
  fidele: fixture("fidele")
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

// Le gris.css qu'écrit style-du-projet.mjs, lu dans le script lui-même pour rester le même.
const GRIS = /const GRIS = `([\s\S]*?)`;/.exec(readFileSync(fileURLToPath(new URL("../../skills/a-plat/style-du-projet.mjs", import.meta.url)), "utf8"))[1];

test("fidèle : en UX l'écran est en gris et en police du système, en UI en couleurs ; l'actuel garde toujours ses couleurs", async () => {
  const tete = '<link rel="stylesheet" href="../../.cache/projet/projet.css"><link rel="stylesheet" href="../../.cache/projet/gris.css">';
  const plan = {
    version: 1, projet: "Fidèle", etatDesLieux: [], reglages: { finition: "fidele" },
    rangees: [{ id: "A", titre: "Rangée A", notes: [] }],
    ecrans: [ecran("A1", "Accueil", { rangee: "A", actuel: { fichier: "actuel/A1.html", origine: "redessine" } })]
  };
  const actuel = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><link rel="stylesheet" href="../../.cache/projet/projet.css"></head>' +
    '<body><p class="soleil">Avant</p><script src="../../.cache/relais.js"></script></body></html>';
  const dossier = genererFixture({
    plan,
    ecrans: { "A1.html": ecranHtml("A1", '<p class="soleil">Après</p>', { tete }) },
    autres: {
      "projet/projet.css": "body { font-family: 'Projet', serif; } .soleil { background: #ffd27a; }\n",
      "projet/gris.css": GRIS,
      "actuel/A1.html": actuel
    }
  });
  await avecPage(dossier, { adresse: "ecran/A1", largeur: 1320 }, async ({ page, erreurs }) => {
    const mesurer = (c) => c.evaluate(() => ({
      filtre: getComputedStyle(document.documentElement).filter,
      police: getComputedStyle(document.querySelector(".soleil")).fontFamily
    }));
    const proposition = await cadre(page, ".volet-proposition iframe");
    await proposition.waitForFunction(() => document.documentElement.getAttribute("data-finition") === "ui");
    assert.deepEqual(await mesurer(proposition), { filtre: "none", police: "Projet, serif" }, "UI : le vrai style");
    const existant = await cadre(page, ".volet-actuel iframe");
    assert.equal((await mesurer(existant)).filtre, "none");
    await groupe(page).getByRole("button", { name: "UX", exact: true }).click();
    await proposition.waitForFunction(() => document.documentElement.getAttribute("data-finition") === "ux");
    const ux = await mesurer(proposition);
    assert.equal(ux.filtre, "grayscale(1)", "UX : en gris");
    assert.match(ux.police, /system-ui/, "UX : la police du système");
    assert.deepEqual(await mesurer(existant), { filtre: "none", police: "Projet, serif" }, "l'actuel ne change pas");
    assert.deepEqual(erreurs, []);
  });
});

test("la finition « fidele » a le bouton, part en UI, et l'UX se choisit comme ailleurs", async () => {
  await avecPage(PAR_FINITION.fidele, { adresse: "ensemble" }, async ({ page, erreurs }) => {
    assert.equal(await groupe(page).count(), 1);
    assert.equal(await enfonce(page), "UI");
    const a1 = await cadre(page, '.planche iframe[data-code="A1"]');
    assert.equal((await finitionDe(a1, "ui")).accent, UI);
    await groupe(page).getByRole("button", { name: "UX", exact: true }).click();
    assert.equal(await enfonce(page), "UX");
    assert.equal((await finitionDe(a1, "ux")).accent, UX);
    assert.deepEqual(erreurs, []);
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
    // La clé dit le dossier des maquettes (le chemin de la page, sans index.html) et le projet.
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("a-plat:finition:" + location.pathname.replace(/index\.html$/, "") + ":Essai"))), "ux");
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
    await page.goto(pathToFileURL(join(dossier, "sources", "harnais.html")).href);
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
    await page.goto(pathToFileURL(join(dossier, "sources", "ecrans", "A2.html")).href);
    assert.equal(await page.evaluate(() => document.documentElement.getAttribute("data-finition")), null);
    assert.equal(await page.locator(".bouton").evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(0, 102, 204)");
  });
});

// ---------------------------------------------------------------- série de corrections

// Dans chaque cadre d'écran, note à chacune des premières images (requestAnimationFrame passe
// juste avant de peindre) la finition, et si relais.js a déjà démarré. La page ne note rien.
const NOTER_LES_PREMIERES_IMAGES = () => {
  if (window.parent === window) return;
  window.__images = [];
  const noter = () => {
    window.__images.push((window.APlatRelais ? "relais:" : "avant:") + (document.documentElement.getAttribute("data-finition") || "aucune"));
    if (window.__images.length < 8) requestAnimationFrame(noter);
  };
  requestAnimationFrame(noter);
};

// Dès que relais.js a démarré, chaque image est dans la finition voulue. Avant lui, le navigateur
// a pu peindre une image sans finition : le cadre est alors encore caché (voir le test du cadre lent).
async function imagesDe(page, selecteur, voulue) {
  const ecranDeLaVue = await cadre(page, selecteur);
  await ecranDeLaVue.waitForFunction(() => window.__images && window.__images.length >= 8);
  const images = await ecranDeLaVue.evaluate(() => window.__images);
  assert.ok(images.some((i) => i.startsWith("relais:")), `relais.js a démarré : ${images.join(" ")}`);
  assert.deepEqual(images.filter((i) => i.startsWith("relais:") && i !== `relais:${voulue}`), [], images.join(" "));
  assert.equal(await page.locator(selecteur).evaluate((el) => getComputedStyle(el).visibility), "visible", "montré après son message pret");
  return images;
}

test("un écran ne se montre jamais dans la mauvaise finition : elle voyage dans l'adresse du cadre", async () => {
  for (const [adresse, selecteur] of [["ecran/A2", ".volet-proposition iframe"], ["rangee/A", '.rangee-carte iframe[data-code="A2"]'], ["ensemble", '.planche iframe[data-code="A2"]']]) {
    await avecPage(PAR_FINITION.charte, { adresse, largeur: 1440, hauteur: 900, avant: NOTER_LES_PREMIERES_IMAGES }, async ({ page }) => {
      assert.match(await page.locator(selecteur).getAttribute("src"), /\?finition=ui$/);
      await imagesDe(page, selecteur, "ui");
    });
  }
  // L'actuel, lui, ne reçoit rien dans son adresse.
  await avecPage(PAR_FINITION.charte, { adresse: "ecran/A1" }, async ({ page }) => {
    assert.equal(await page.locator(".volet-actuel iframe").getAttribute("src"), "sources/actuel/A1.html");
  });
});

test("un cadre reste caché tant que son écran n'a pas dit pret, c'est-à-dire tant qu'il n'a pas sa finition", async () => {
  // Un écran dont relais.js arrive en retard : pendant plus d'une seconde, il est peint sans finition.
  const plan = {
    version: 1, projet: "Lent", etatDesLieux: [], reglages: { finition: "charte" }, rangees: [{ id: "A", titre: "A", notes: [] }],
    ecrans: [ecran("A1", "Lent", { rangee: "A" })]
  };
  const lent = ecranHtml("A1", '<main class="page"><a class="bouton" href="#">Agir</a></main><script>setTimeout(function () { var s = document.createElement("script"); s.src = "../../.cache/relais.js"; document.body.appendChild(s); }, 1200);</script>', { relais: false });
  const dossier = genererFixture({ plan, ecrans: { "A1.html": lent }, autres: styleAvecUneUI() });
  await avecPage(dossier, { adresse: "ecran/A1", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const iframe = page.locator(".volet-proposition iframe");
    const ecranLent = await cadre(page, ".volet-proposition iframe");
    await ecranLent.waitForFunction(() => document.querySelector(".bouton") !== null);
    assert.equal(await ecranLent.evaluate(() => document.documentElement.getAttribute("data-finition")), null, "peint sans finition…");
    assert.equal(await iframe.evaluate((el) => getComputedStyle(el).visibility), "hidden", "… mais caché");
    await page.waitForFunction(() => getComputedStyle(document.querySelector(".volet-proposition iframe")).visibility === "visible");
    assert.equal(await ecranLent.evaluate(() => document.documentElement.getAttribute("data-finition")), "ui", "montré seulement en UI");
  });
});

test("en « Essayer le parcours », l'écran suivant naît lui aussi dans la finition de la page, sans clignement", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "ecran/A1", largeur: 1440, hauteur: 900, avant: NOTER_LES_PREMIERES_IMAGES }, async ({ page }) => {
    await page.locator(".mode button", { hasText: "Essayer le parcours" }).click();
    const a1 = await cadre(page, ".volet-proposition iframe");
    await a1.waitForFunction(() => document.documentElement.dataset.aPlatMode === "essayer");
    await a1.locator("a.action").click();
    await page.waitForFunction(() => location.hash === "#ecran/A2");
    await page.locator('.volet-proposition iframe[data-code="A2"]').waitFor();
    // Le lien de l'écran ne fait pas naviguer le cadre : la page dessine un nouveau cadre, avec
    // la finition dans son adresse, et la lui redit à son message pret.
    assert.match(await page.locator(".volet-proposition iframe").getAttribute("src"), /A2\.html\?finition=ui$/);
    await imagesDe(page, ".volet-proposition iframe", "ui");
    assert.equal((await finitionDe(await cadre(page, ".volet-proposition iframe"), "ui")).accent, UI);
  });
});

test("après un changement de finition, l'écran redit sa hauteur, et son cadre la suit, en grandissant comme en raccourcissant", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "rangee/A", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const hauteur = () => page.locator('.rangee-carte[data-code="A2"] .cadre-boite').evaluate((el) => el.offsetHeight);
    const attendre = (test) => page.waitForFunction(test, null, { timeout: 4000 });
    // En UI, la boîte de 1600 px rend l'écran plus long que ses 844 px : le cadre suit (à 90 %).
    await attendre(() => document.querySelector('.rangee-carte[data-code="A2"] .cadre-boite').offsetHeight > 1600 * 0.9);
    const enUI = await hauteur();
    // En UX, l'écran est plus court que 844 px : le cadre revient à sa hauteur de départ, et non
    // à la plus grande hauteur qu'il a connue.
    await groupe(page).getByRole("button", { name: "UX" }).click();
    await attendre(() => document.querySelector('.rangee-carte[data-code="A2"] .cadre-boite').offsetHeight < 800);
    assert.equal(await hauteur(), Math.round(844 * 0.9), `en UX : ${await hauteur()} (en UI : ${enUI})`);
    await groupe(page).getByRole("button", { name: "UI" }).click();
    await attendre(() => document.querySelector('.rangee-carte[data-code="A2"] .cadre-boite').offsetHeight > 1600 * 0.9);
    assert.equal(await hauteur(), enUI, "de nouveau en UI, la même hauteur qu'au départ");
  });
});

test("après un changement de vue, et sans stockage, les cadres de la nouvelle vue ont la finition choisie", async () => {
  const refus = () => {
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("refusé", "SecurityError"); } });
  };
  for (const avant of [undefined, refus]) {
    await avecPage(PAR_FINITION.charte, { adresse: "ensemble", largeur: 1440, hauteur: 900, avant }, async ({ page, erreurs }) => {
      await groupe(page).getByRole("button", { name: "UX" }).click();
      for (const [adresse, selecteur] of [["#rangee/A", '.rangee-carte iframe[data-code="A2"]'], ["#ecran/B1", ".volet-proposition iframe"], ["#ensemble", '.planche iframe[data-code="A1"]']]) {
        await page.evaluate((a) => { location.hash = a; }, adresse);
        await page.waitForFunction((a) => location.hash === a && document.body.dataset.vue === a.slice(1).split("/")[0], adresse);
        assert.match(await page.locator(selecteur).getAttribute("src"), /\?finition=ux$/, `${adresse} : adresse du cadre`);
        assert.equal((await finitionDe(await cadre(page, selecteur), "ux")).accent, UX, `${adresse}${avant ? ", sans stockage" : ""}`);
      }
      assert.deepEqual(erreurs, []);
    });
  }
});

// Le contraste entre deux couleurs « rgb(…) », d'après leur luminance relative.
function contraste(a, b) {
  const luminance = (texte) => {
    const [r, g, bl] = texte.match(/[\d.]+/g).slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}

test("le bouton enfoncé est en négatif, et ses deux états se distinguent à plus de 3:1", async () => {
  await avecPage(PAR_FINITION.charte, { adresse: "ensemble" }, async ({ page }) => {
    const couleurs = await groupe(page).evaluate((el) => {
      const enfonce = el.querySelector('[aria-pressed="true"]');
      const relache = el.querySelector('[aria-pressed="false"]');
      return {
        pilule: getComputedStyle(el).backgroundColor,
        fondEnfonce: getComputedStyle(enfonce).backgroundColor,
        texteEnfonce: getComputedStyle(enfonce).color,
        fondRelache: getComputedStyle(relache).backgroundColor,
        texteRelache: getComputedStyle(relache).color
      };
    });
    assert.equal(couleurs.fondEnfonce, "rgb(245, 245, 247)");
    assert.equal(couleurs.texteEnfonce, "rgb(0, 0, 0)");
    assert.equal(couleurs.fondRelache, "rgba(0, 0, 0, 0)", "relâché, le bouton laisse voir la pilule");
    assert.ok(contraste(couleurs.fondEnfonce, couleurs.pilule) >= 3, "entre les deux états");
    assert.ok(contraste(couleurs.texteEnfonce, couleurs.fondEnfonce) >= 4.5, "le texte enfoncé se lit");
    assert.ok(contraste(couleurs.texteRelache, couleurs.pilule) >= 4.5, "le texte relâché se lit");
  });
});

test("au téléphone, la barre garde la même hauteur avec le bouton UX | UI qu'en finition « gris »", async () => {
  for (const largeur of [390, 360]) {
    for (const adresse of ["etat", "ensemble", "ecran/A2"]) {
      const mesure = (fixtureDeLaFinition) => avecPage(fixtureDeLaFinition, { adresse, largeur, hauteur: 844 }, async ({ page }) => {
        await page.waitForTimeout(150);
        if (adresse === "etat") {
          // Le fil ne redit pas le lien de droite : il montre le projet.
          assert.equal(await page.locator(".fil a").innerText(), "À plat · Essai");
          assert.equal(await page.locator(".fil-vue").isVisible(), false);
        }
        return page.evaluate(() => ({
          hauteur: document.querySelector(".barre").getBoundingClientRect().height,
          deborde: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          bouton: Boolean(document.querySelector(".barre-finition"))
        }));
      });
      const gris = await mesure(PAR_FINITION.gris);
      const avecBouton = await mesure(PAR_FINITION.charte);
      assert.equal(gris.bouton, false);
      assert.equal(avecBouton.bouton, true);
      assert.ok(Math.abs(avecBouton.hauteur - gris.hauteur) < 1, `${largeur} px, #${adresse} : ${avecBouton.hauteur} avec le bouton, ${gris.hauteur} en gris`);
      assert.equal(avecBouton.deborde, false);
    }
  }
});
