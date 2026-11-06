import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { avecPage, genererFixture, nettoyerFixtures, ecranHtml } from "./aide.mjs";

after(nettoyerFixtures);

// ---------------------------------------------------------------- petites aides

const espaces = (valeur) => valeur.replace(/\s+/g, " ").trim();
const TITRE_DU_CHAMP = "Corriger : A2 > Bouton « Demander »";
const PIEGE = "<script>window.PIEGE=1</script> « é »";
const NOM_PIEGE = '<img src=x onerror=window.PIEGE=1> & "x"';

// Réessaie un contrôle jusqu'à ce qu'il passe : la page réagit après le message du cadre.
async function attendre(controle, delai = 4000) {
  const fin = Date.now() + delai;
  for (;;) {
    try {
      return await controle();
    } catch (erreur) {
      if (Date.now() > fin) throw erreur;
      await new Promise((suite) => setTimeout(suite, 50));
    }
  }
}

async function cadreDe(page, code, selecteur = ".volet-proposition") {
  const poignee = await page.locator(`${selecteur} iframe[data-code="${code}"]`).first().elementHandle();
  return poignee.contentFrame();
}

const jointes = (...fonctions) => fonctions.map((fonction) => `(${fonction.toString()})();`).join("\n");

// Un presse-papiers qui garde ce qu'on lui donne, ou qui refuse, ou qui n'existe pas.
const COPIE_ACCEPTEE = () => {
  window.__copies = [];
  const faux = { writeText: (texte) => { window.__copies.push(texte); return Promise.resolve(); } };
  Object.defineProperty(navigator, "clipboard", { configurable: true, get: () => faux });
};
const COPIE_REFUSEE = () => {
  const faux = { writeText: () => Promise.reject(new DOMException("refusé", "NotAllowedError")) };
  Object.defineProperty(navigator, "clipboard", { configurable: true, get: () => faux });
};
const COPIE_ABSENTE = () => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, get: () => undefined });
};
const STOCK_REFUSE = () => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() { throw new DOMException("refusé", "SecurityError"); }
  });
};

const plan = (ecrans, projet = "Essai") => ({
  version: 1,
  projet,
  etatDesLieux: [],
  rangees: [{ id: "A", titre: "Rangée A", notes: [] }, { id: "B", titre: "Rangée B", notes: [] }],
  ecrans: ecrans.map((ecran) => ({ rangee: "A", largeur: 390, hauteur: 844, statut: "a-relire", actuel: null, ...ecran }))
});

const ECRAN_A1 = ecranHtml("A1", '<h1>Accueil</h1><a href="A2-fiche.html">Voir la perceuse</a>');
// Le bouton est tout en bas de l'écran : le champ de correction ne doit pas le cacher.
const ECRAN_A2 = ecranHtml("A2", `<h1>Perceuse sans fil</h1>
<input type="text" aria-label="Un mot pour le voisin">
<p data-nom="${NOM_PIEGE.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}">Texte</p>
<div style="height:640px"></div>
<button type="button">Demander</button>`);
const ECRAN_B1 = ecranHtml("B1", "<h1>Demande envoyée</h1>");

function fixtureDeBase(supplements = {}) {
  return genererFixture({
    plan: plan([
      { code: "A1", titre: "Accueil", fichier: "A1-accueil.html" },
      { code: "A2", titre: "Fiche d'un outil", fichier: "A2-fiche.html", ...supplements },
      { code: "B1", titre: "Demande de prêt", fichier: "B1-pret.html", rangee: "B", statut: "valide" }
    ]),
    ecrans: { "A1-accueil.html": ECRAN_A1, "A2-fiche.html": ECRAN_A2, "B1-pret.html": ECRAN_B1 }
  });
}

const toucherLeBouton = async (page, code = "A2") => {
  const cadre = await cadreDe(page, code);
  await cadre.getByRole("button", { name: "Demander" }).click();
};

const champ = (page) => page.getByLabel(TITRE_DU_CHAMP);
const ajouter = (page) => page.getByRole("button", { name: "Ajouter", exact: true });
const annuler = (page) => page.getByRole("button", { name: "Annuler", exact: true });
const lignes = (page) => page.locator(".corrections-liste > li");

// Ajoute une correction sur le bouton « Demander » de l'écran affiché.
async function corriger(page, texte) {
  await toucherLeBouton(page);
  await champ(page).fill(texte);
  await ajouter(page).click();
}

const stock = (page, projet = "Essai") =>
  page.evaluate((cle) => window.localStorage.getItem(cle), `a-plat:corrections:${projet}`);

// ---------------------------------------------------------------- ajouter, retirer, garder

test("toucher un élément ouvre un champ au titre exact, qui a le focus ; Ajouter crée une correction numérotée", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page, console: erreursConsole, erreurs }) => {
    assert.equal(await page.locator(".correction-saisie").count(), 0, "rien n'est ouvert avant le toucher");
    await toucherLeBouton(page);
    await champ(page).waitFor();
    assert.equal(await page.locator(`label:text-is("${TITRE_DU_CHAMP}")`).count(), 1, "le titre est celui d'un vrai <label>");
    await attendre(async () => assert.ok(await champ(page).evaluate((el) => el === document.activeElement), "le focus est dans le champ"));

    await champ(page).fill("Mettre le bouton en vert");
    await ajouter(page).click();
    await page.locator(".correction-saisie").waitFor({ state: "detached" });

    assert.equal(await lignes(page).count(), 1);
    const ligne = lignes(page).first();
    assert.equal(espaces(await ligne.locator(".correction-numero").innerText()), "1");
    assert.equal(espaces(await ligne.locator(".correction-ou").innerText()), "A2 > Bouton « Demander »");
    assert.equal(espaces(await ligne.locator(".correction-texte").innerText()), "Mettre le bouton en vert");
    assert.deepEqual(erreursConsole, []);
    assert.deepEqual(erreurs, []);
  });
});

test("les corrections de plusieurs écrans sont dans la même liste, numérotées dans l'ordre", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A1" }, async ({ page }) => {
    const cadreA1 = await cadreDe(page, "A1");
    await cadreA1.getByRole("link", { name: "Voir la perceuse" }).click();
    await page.locator(".correction-saisie label").waitFor();
    assert.equal(await page.locator(".correction-saisie label").innerText(), "Corriger : A1 > Lien « Voir la perceuse »");
    await page.locator("#correction-champ").fill("Mot plus court");
    await ajouter(page).click();
    await page.evaluate(() => { window.location.hash = "#ecran/A2"; });
    await page.locator('.volet-proposition iframe[data-code="A2"]').waitFor();
    await corriger(page, "Plus gros");
    const ous = (await page.locator(".corrections-liste .correction-ou").allInnerTexts()).map(espaces);
    assert.deepEqual(ous, ["A1 > Lien « Voir la perceuse »", "A2 > Bouton « Demander »"]);
    const numeros = (await page.locator(".corrections-liste .correction-numero").allInnerTexts()).map(espaces);
    assert.deepEqual(numeros, ["1", "2"]);
  });
});

test("« Retirer » enlève la correction, et la liste se renumérote", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    await corriger(page, "Première");
    await corriger(page, "Deuxième");
    await corriger(page, "Troisième");
    assert.equal(await lignes(page).count(), 3);
    await lignes(page).nth(1).getByRole("button", { name: "Retirer", exact: true }).click();
    assert.equal(await lignes(page).count(), 2);
    assert.deepEqual((await page.locator(".correction-texte").allInnerTexts()).map(espaces), ["Première", "Troisième"]);
    assert.deepEqual((await page.locator(".correction-numero").allInnerTexts()).map(espaces), ["1", "2"]);
    assert.deepEqual(JSON.parse(await stock(page)).map((c) => c.texte), ["Première", "Troisième"]);
  });
});

test("les corrections sont gardées sous a-plat:corrections:<projet> en {code, element, texte}, et survivent à un rechargement", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    await corriger(page, "Mettre le bouton en vert");
    assert.deepEqual(JSON.parse(await stock(page)), [{ code: "A2", element: "Bouton « Demander »", texte: "Mettre le bouton en vert" }]);
    await page.reload();
    await lignes(page).first().waitFor();
    assert.equal(await lignes(page).count(), 1);
    assert.equal(espaces(await lignes(page).first().innerText()).includes("Mettre le bouton en vert"), true);
    assert.equal(espaces(await page.locator("nav").locator("xpath=..").getByRole("link", { name: /Corrections/ }).innerText()), "Corrections : 1");
  });
});

test("un texte vide ou fait d'espaces n'est pas ajouté ; les autres sont gardés tels quels, aux bouts près", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    await toucherLeBouton(page);
    await champ(page).fill("   \n  ");
    await ajouter(page).click();
    assert.equal(await lignes(page).count(), 0, "rien n'est ajouté");
    assert.equal(await champ(page).count(), 1, "le champ reste ouvert");
    assert.match(await page.locator(".correction-saisie").innerText(), /Écrivez la correction/);

    await champ(page).fill("  « Plus   gros »,\ndeux lignes  ");
    await ajouter(page).click();
    assert.deepEqual(JSON.parse(await stock(page)).map((c) => c.texte), ["« Plus   gros »,\ndeux lignes"]);
  });
});

test("Annuler et Échap ferment le champ sans rien ajouter", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    await toucherLeBouton(page);
    await champ(page).fill("Brouillon");
    await annuler(page).click();
    assert.equal(await page.locator(".correction-saisie").count(), 0);
    assert.equal(await lignes(page).count(), 0);

    await toucherLeBouton(page);
    await attendre(async () => assert.ok(await champ(page).evaluate((el) => el === document.activeElement)));
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".correction-saisie").count(), 0);
    assert.equal(await lignes(page).count(), 0);
    assert.equal(await stock(page), null, "rien n'a été gardé");
  });
});

test("toucher un autre élément pendant la saisie change la cible et garde le texte déjà écrit", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    await toucherLeBouton(page);
    await champ(page).fill("Trop petit");
    const cadre = await cadreDe(page, "A2");
    await cadre.locator("h1").click();
    await page.getByLabel("Corriger : A2 > Titre « Perceuse sans fil »").waitFor();
    assert.equal(await page.locator("#correction-champ").inputValue(), "Trop petit");
    assert.equal(await page.locator(".correction-saisie").count(), 1);
  });
});

test("l'élément choisi est entouré dans le cadre, puis l'entourage disparaît quand le champ se ferme", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    const cadre = await cadreDe(page, "A2");
    const bouton = cadre.getByRole("button", { name: "Demander" });
    const contour = () => bouton.evaluate((el) => getComputedStyle(el).outlineStyle + " " + getComputedStyle(el).outlineWidth);
    assert.match(await contour(), /^none/);
    await bouton.click();
    await attendre(async () => assert.match(await contour(), /^solid [1-9]/));
    await cadre.locator("h1").click();
    await attendre(async () => assert.match(await contour(), /^none/, "l'ancien élément n'est plus entouré"));
    assert.match(await cadre.locator("h1").evaluate((el) => getComputedStyle(el).outlineStyle), /^solid/);
    await annuler(page).click();
    await attendre(async () => assert.match(await cadre.locator("h1").evaluate((el) => getComputedStyle(el).outlineStyle), /^none/));
    // Le style que l'écran avait lui-même n'est pas perdu : rien ne reste dans l'attribut style.
    assert.equal(await cadre.locator("h1").evaluate((el) => el.getAttribute("style") || ""), "");
  });
});

// ---------------------------------------------------------------- copier

test("« Copier pour Claude » met le texte de texteCorrections dans le presse-papiers et dit de le coller dans la conversation", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", avant: jointes(COPIE_ACCEPTEE) }, async ({ page }) => {
    await corriger(page, "Mettre le bouton en vert");
    await corriger(page, "Plus gros");
    await page.getByRole("button", { name: "Copier pour Claude", exact: true }).click();
    const attendu = "Corrections pour Essai :\n\n1. A2 > Bouton « Demander » : Mettre le bouton en vert\n2. A2 > Bouton « Demander » : Plus gros";
    await attendre(async () => assert.deepEqual(await page.evaluate(() => window.__copies), [attendu]));
    const etat = await page.locator(".corrections-etat").innerText();
    assert.match(etat, /copiées/);
    assert.match(etat, /[Cc]ollez/);
    assert.match(etat, /conversation/);
    assert.equal(await page.locator(".corrections-secours").count(), 0, "pas de champ de secours quand la copie a marché");
  });
});

for (const [nom, avant] of [["refusé", COPIE_REFUSEE], ["absent", COPIE_ABSENTE]]) {
  test(`presse-papiers ${nom} : le texte s'affiche dans un champ, déjà sélectionné`, async () => {
    await avecPage(fixtureDeBase(), { adresse: "ecran/A2", avant: jointes(avant) }, async ({ page, console: erreursConsole, erreurs }) => {
      await corriger(page, "Mettre le bouton en vert");
      await page.getByRole("button", { name: "Copier pour Claude", exact: true }).click();
      const secours = page.locator(".corrections-secours textarea");
      await secours.waitFor();
      const attendu = "Corrections pour Essai :\n\n1. A2 > Bouton « Demander » : Mettre le bouton en vert";
      assert.equal(await secours.inputValue(), attendu);
      await attendre(async () => {
        const choisi = await secours.evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd));
        assert.equal(choisi, attendu, "tout le texte est sélectionné");
        assert.ok(await secours.evaluate((el) => el === document.activeElement), "le champ a le focus");
      });
      const etat = await page.locator(".corrections-etat").innerText();
      assert.match(etat, /pas pu copier|n'a pas permis/);
      assert.match(etat, /conversation/);
      assert.deepEqual(erreursConsole, []);
      assert.deepEqual(erreurs, []);
    });
  });
}

// ---------------------------------------------------------------- navigateur qui refuse le stockage

test("localStorage qui lève une erreur : les corrections marchent en mémoire, sans erreur de console, et la page le dit", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", avant: jointes(STOCK_REFUSE, COPIE_ACCEPTEE) }, async ({ page, console: erreursConsole, erreurs }) => {
    await corriger(page, "Première");
    await corriger(page, "Deuxième");
    assert.equal(await lignes(page).count(), 2);
    assert.match(await page.locator(".corrections").innerText(), /ne garde pas|refuse de garder/, "la page dit que rien n'est gardé");
    await lignes(page).first().getByRole("button", { name: "Retirer", exact: true }).click();
    assert.equal(await lignes(page).count(), 1);
    // Aller sur une autre vue puis revenir : la mémoire de la visite sert encore.
    await page.evaluate(() => { window.location.hash = "#ensemble"; });
    await page.evaluate(() => { window.location.hash = "#ecran/A2"; });
    await lignes(page).first().waitFor();
    assert.equal(await lignes(page).count(), 1);
    await page.getByRole("button", { name: "Copier pour Claude", exact: true }).click();
    await attendre(async () => assert.equal((await page.evaluate(() => window.__copies))[0].includes("Deuxième"), true));
    assert.deepEqual(erreursConsole, []);
    assert.deepEqual(erreurs, []);
  });
});

// ---------------------------------------------------------------- texte piégeux

test("une correction et un nom d'élément piégeux s'affichent et se copient tels quels, sans exécution", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", avant: jointes(COPIE_ACCEPTEE) }, async ({ page, console: erreursConsole, erreurs }) => {
    await corriger(page, PIEGE);
    const cadre = await cadreDe(page, "A2");
    await cadre.locator("p").click();
    const titre = `Corriger : A2 > ${NOM_PIEGE}`;
    await page.getByLabel(titre, { exact: true }).waitFor();
    await page.locator("#correction-champ").fill(PIEGE);
    await ajouter(page).click();

    assert.equal(await lignes(page).count(), 2);
    assert.equal(espaces(await lignes(page).first().locator(".correction-texte").innerText()), PIEGE);
    assert.equal(espaces(await lignes(page).nth(1).locator(".correction-ou").innerText()), `A2 > ${NOM_PIEGE}`);
    assert.equal(await page.locator(".corrections script, .corrections img, .corrections b").count(), 0, "aucune balise n'est née du texte");

    await page.getByRole("button", { name: "Copier pour Claude", exact: true }).click();
    const copie = await attendre(async () => {
      const copies = await page.evaluate(() => window.__copies);
      assert.equal(copies.length, 1);
      return copies[0];
    });
    assert.ok(copie.includes(`1. A2 > Bouton « Demander » : ${PIEGE}`));
    assert.ok(copie.includes(`2. A2 > ${NOM_PIEGE} : ${PIEGE}`));
    assert.equal(await page.evaluate(() => window.PIEGE), undefined);
    assert.equal(await cadre.evaluate(() => window.PIEGE), undefined);
    assert.deepEqual(erreursConsole, []);
    assert.deepEqual(erreurs, []);
  });
});

test("un très long texte ne fait pas déborder la page à 390 px", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", largeur: 390, hauteur: 844 }, async ({ page }) => {
    await corriger(page, "x".repeat(400) + " " + "y".repeat(300));
    const tropLarge = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(tropLarge, false);
    const boite = await lignes(page).first().boundingBox();
    assert.ok(boite.x + boite.width <= 390 + 0.5);
  });
});

// ---------------------------------------------------------------- tout retirer

test("« Tout retirer » demande dans la page, sans confirm(), puis vide la liste", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", avant: jointes(COPIE_ACCEPTEE) }, async ({ page }) => {
    const boites = [];
    page.on("dialog", async (boite) => { boites.push(boite.type()); await boite.dismiss(); });
    await corriger(page, "Première");
    await corriger(page, "Deuxième");

    await page.getByRole("button", { name: "Tout retirer", exact: true }).click();
    const demande = page.locator(".corrections-confirmation");
    await demande.waitFor();
    assert.match(await demande.innerText(), /2 corrections/);
    assert.equal(await lignes(page).count(), 2, "rien n'est retiré avant la réponse");

    await demande.getByRole("button", { name: "Non, les garder" }).click();
    assert.equal(await page.locator(".corrections-confirmation").count(), 0);
    assert.equal(await lignes(page).count(), 2);

    await page.getByRole("button", { name: "Tout retirer", exact: true }).click();
    await page.getByRole("button", { name: "Oui, tout retirer" }).click();
    assert.equal(await lignes(page).count(), 0);
    assert.match(await page.locator(".corrections").innerText(), /Aucune correction/);
    assert.deepEqual(JSON.parse(await stock(page)), []);
    assert.equal(await page.getByRole("link", { name: /Corrections :/ }).count(), 0, "plus de compte dans la barre");
    assert.equal(await page.getByRole("button", { name: "Copier pour Claude" }).count(), 0, "plus rien à copier");
    assert.deepEqual(boites, [], "aucune boîte du navigateur n'a été ouverte");
    await page.reload();
    await page.locator(".corrections").waitFor();
    assert.equal(await lignes(page).count(), 0, "la liste vide survit au rechargement");
  });
});

// ---------------------------------------------------------------- la barre et le panneau

test("la barre montre « Corrections : N » dès qu'il y en a une, et mène au panneau de l'écran courant, ou du premier écran", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    const lien = page.locator("header").getByRole("link", { name: /Corrections :/ });
    assert.equal(await lien.count(), 0, "rien à montrer tant qu'il n'y a pas de correction");
    await corriger(page, "Première");
    await corriger(page, "Deuxième");
    assert.equal(espaces(await lien.innerText()), "Corrections : 2");
    assert.equal(await lien.getAttribute("href"), "#ecran/A2");

    await page.evaluate(() => { window.location.hash = "#ensemble"; });
    await lien.waitFor();
    assert.equal(await lien.getAttribute("href"), "#ecran/A1", "depuis une autre vue : le premier écran");
    await lien.click();
    await page.waitForURL(/#ecran\/A1$/);
    await page.locator(".corrections").waitFor();
    assert.equal(await lignes(page).count(), 2, "le panneau montre toutes les corrections, de tous les écrans");
    assert.equal(espaces(await page.locator(".corrections h3").innerText()), "Corrections (2)");
    assert.equal(await page.locator(".corrections").isVisible(), true);
  });
});

test("à 1320 px le panneau est à droite des écrans, à 390 px il est dessous, sans défilement de côté", async () => {
  const fixture = "complet";
  await avecPage(fixture, { adresse: "ecran/A2", largeur: 1320, hauteur: 900 }, async ({ page }) => {
    const panneau = await page.locator(".corrections").boundingBox();
    const proposition = await page.locator(".volet-proposition").boundingBox();
    const actuel = await page.locator(".volet-actuel").boundingBox();
    assert.ok(panneau.x >= proposition.x + proposition.width - 1, "à droite de la proposition");
    assert.ok(panneau.x >= actuel.x + actuel.width - 1, "à droite de l'actuel");
    assert.ok(panneau.x + panneau.width <= 1320);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  });
  await avecPage(fixture, { adresse: "ecran/A2", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const panneau = await page.locator(".corrections").boundingBox();
    const proposition = await page.locator(".volet-proposition").boundingBox();
    assert.ok(panneau.y >= proposition.y + proposition.height - 1, "sous la proposition");
    assert.ok(panneau.x >= 0 && panneau.x + panneau.width <= 390 + 0.5);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  });
});

test("sans correction, le panneau explique quoi faire et ne propose ni copie ni « Tout retirer »", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    const texte = await page.locator(".corrections").innerText();
    assert.match(texte, /Aucune correction/);
    assert.match(texte, /Corriger/);
    assert.equal(await page.getByRole("button", { name: "Copier pour Claude" }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Tout retirer" }).count(), 0);
  });
});

test("les vues sans écran seul n'ont pas de panneau", async () => {
  for (const adresse of ["etat", "ensemble"]) {
    await avecPage(fixtureDeBase(), { adresse }, async ({ page }) => {
      assert.equal(await page.locator(".corrections").count(), 0);
    });
  }
});

// ---------------------------------------------------------------- à 390 px, rien n'est caché

test("à 390 px, le champ ne cache ni ses boutons ni l'élément choisi, même tout en bas de l'écran", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const cadre = await cadreDe(page, "A2");
    const bouton = cadre.getByRole("button", { name: "Demander" });
    // Un vrai toucher, avec le bouton collé au bas de la fenêtre : c'est là que la saisie va
    // s'ouvrir, et la page doit le remonter (Playwright, lui, le recentrerait avant de cliquer).
    await bouton.scrollIntoViewIfNeeded();
    const avant = await bouton.boundingBox();
    await page.evaluate((decalage) => window.scrollBy(0, decalage), avant.y - 780);
    const place = await bouton.boundingBox();
    assert.ok(place.y > 700, `le bouton est bien dans la zone que la saisie va couvrir (${place.y})`);
    await page.mouse.click(place.x + place.width / 2, place.y + place.height / 2);
    const saisie = page.locator(".correction-saisie");
    await saisie.waitFor();

    await attendre(async () => {
      const boiteSaisie = await saisie.boundingBox();
      assert.ok(Math.abs(boiteSaisie.y + boiteSaisie.height - 844) < 1, `la saisie est collée au bas de la fenêtre (${boiteSaisie.y + boiteSaisie.height})`);
      assert.ok(boiteSaisie.x >= 0 && boiteSaisie.x + boiteSaisie.width <= 390 + 0.5, "la saisie tient dans la largeur");
      for (const cible of [ajouter(page), annuler(page), champ(page)]) {
        const boite = await cible.boundingBox();
        assert.ok(boite.y >= 0 && boite.y + boite.height <= 844 + 0.5, "visible dans la fenêtre");
        assert.ok(boite.x >= 0 && boite.x + boite.width <= 390 + 0.5, "visible en largeur");
        assert.ok(boite.y >= boiteSaisie.y - 0.5, "dans la saisie");
      }
      const element = await bouton.boundingBox();
      assert.ok(element.y >= 0, "l'élément n'est pas sorti par le haut");
      assert.ok(element.y + element.height <= boiteSaisie.y - 4, `l'élément (bas ${element.y + element.height}) est au-dessus de la saisie (haut ${boiteSaisie.y})`);
      const autre = await ajouter(page).boundingBox();
      const cacheLesBoutons = !(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest(".correction-saisie") !== null, [autre.x + autre.width / 2, autre.y + autre.height / 2]));
      assert.equal(cacheLesBoutons, false, "rien ne recouvre le bouton Ajouter");
    });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    const position = await saisie.evaluate((el) => getComputedStyle(el).position);
    assert.equal(position, "fixed");

    for (const cible of [ajouter(page), annuler(page)]) {
      assert.ok((await cible.boundingBox()).height >= 44 - 0.5, "cible tactile de 44 px au moins");
    }
  });
});

test("la saisie respecte la zone sûre du bas de l'appareil, et le viewport laisse la place au clavier", async () => {
  const css = readFileSync(fileURLToPath(new URL("../../skills/a-plat/modele/a-plat/style.css", import.meta.url)), "utf8");
  assert.match(css, /\.correction-saisie[^}]*\{[^}]*env\(safe-area-inset-bottom/s);
  const html = readFileSync(fileURLToPath(new URL("../../skills/a-plat/modele/index.html", import.meta.url)), "utf8");
  assert.match(html, /<script src="a-plat\/corrections\.js"><\/script>/);
  assert.ok(html.indexOf("a-plat/moteur.js") < html.indexOf("a-plat/corrections.js"), "corrections.js vient après moteur.js");
});

test("les boutons du panneau font au moins 44 px de haut à 390 px", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", largeur: 390, hauteur: 844, avant: jointes(COPIE_ACCEPTEE) }, async ({ page }) => {
    await corriger(page, "Première");
    const boutons = [
      page.getByRole("button", { name: "Copier pour Claude", exact: true }),
      page.getByRole("button", { name: "Tout retirer", exact: true }),
      lignes(page).first().getByRole("button", { name: "Retirer", exact: true })
    ];
    for (const bouton of boutons) assert.ok((await bouton.boundingBox()).height >= 44 - 0.5);
    const lien = await page.locator("header").getByRole("link", { name: /Corrections :/ }).boundingBox();
    assert.ok(lien.height >= 44 - 0.5, "le lien de la barre aussi");
  });
});

// ---------------------------------------------------------------- code, validation, actuel absent

test("le code de l'écran est visible et sélectionnable dans la vue d'un écran seul", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    const code = page.locator(".ecran-code");
    assert.equal(espaces(await code.innerText()), "A2");
    assert.equal(await code.isVisible(), true);
    assert.notEqual(await code.evaluate((el) => getComputedStyle(el).userSelect), "none");
    await code.dblclick();
    assert.equal(await page.evaluate(() => String(window.getSelection())), "A2");
  });
});

test("un écran validé porte le mot « Validé » sur sa vignette et près de son code, en texte ; les autres non", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ensemble" }, async ({ page }) => {
    const vignetteB1 = page.locator('.vignette[data-code="B1"]');
    assert.equal(espaces(await vignetteB1.locator(".badge-valide").innerText()), "Validé");
    assert.equal(await page.locator('.vignette[data-code="A2"] .badge-valide').count(), 0);
    assert.equal(await page.locator(".badge-valide").count(), 1);
  });
  await avecPage(fixtureDeBase(), { adresse: "ecran/B1" }, async ({ page }) => {
    const badge = page.locator(".ecran-entete .badge-valide");
    assert.equal(espaces(await badge.innerText()), "Validé");
    const code = await page.locator(".ecran-code").boundingBox();
    const mot = await badge.boundingBox();
    assert.ok(Math.abs(code.y - mot.y) < 30 && mot.x >= code.x + code.width - 1, "le mot est à côté du code");
  });
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    assert.equal(await page.locator(".badge-valide").count(), 0);
  });
});

test("pas de bouton « Valider » : l'aide dit d'écrire « A2 validé » dans la conversation, avec le code affiché", async () => {
  for (const adresse of ["ecran/A2", "ecran/B1", "ensemble"]) {
    await avecPage(fixtureDeBase(), { adresse }, async ({ page }) => {
      assert.equal(await page.getByRole("button", { name: /valid/i }).count(), 0);
      assert.equal(await page.locator('input[type="checkbox"], [role="switch"]').count(), 0);
    });
  }
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2" }, async ({ page }) => {
    const aide = espaces(await page.locator("#vue").innerText());
    assert.match(aide, /Pour valider cet écran, écrivez « A2 validé » dans la conversation avec Claude/);
    assert.match(aide, /code affiché/);
    // Un code ne change jamais une fois donné : l'aide ne doit pas dire le contraire.
    assert.match(aide, /ne change jamais/);
    assert.doesNotMatch(aide, /peut changer/);
  });
});

test("une capture de l'existant introuvable est remplacée par une phrase qui dit le fichier et quoi faire", async () => {
  const fixture = fixtureDeBase({ actuel: { fichier: "actuel/absente.png", origine: "capture" } });
  await avecPage(fixture, { adresse: "ecran/A2" }, async ({ page }) => {
    const manque = page.locator(".volet-actuel .actuel-manque");
    await manque.waitFor();
    const texte = espaces(await manque.innerText());
    assert.match(texte, /^Capture introuvable : actuel\/absente\.png/);
    assert.match(texte, /Claude/);
    assert.equal(await page.locator(".volet-actuel img").count(), 0, "l'image cassée n'est plus affichée");
    assert.equal(await page.locator(".volet-proposition iframe").count(), 1, "la proposition reste affichée");
  });
  // Une capture qui existe reste une image.
  await avecPage("complet", { adresse: "ecran/A2" }, async ({ page }) => {
    await page.locator(".volet-actuel img").waitFor();
    await new Promise((suite) => setTimeout(suite, 300));
    assert.equal(await page.locator(".actuel-manque").count(), 0);
  });
});

// ---------------------------------------------------------------- sans surprise

test("la page n'envoie rien : aucune requête hors du dossier, même en corrigeant et en copiant", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", avant: jointes(COPIE_ACCEPTEE) }, async ({ page, requetes }) => {
    await corriger(page, "Première");
    await page.getByRole("button", { name: "Copier pour Claude", exact: true }).click();
    assert.deepEqual(requetes, []);
  });
});

test("avec le mouvement réduit, la saisie et le panneau n'animent rien", async () => {
  await avecPage(fixtureDeBase(), { adresse: "ecran/A2", mouvement: "reduce" }, async ({ page }) => {
    await toucherLeBouton(page);
    await page.locator(".correction-saisie").waitFor();
    const durees = await page.evaluate(() => [".correction-saisie", ".corrections", ".correction-saisie button"].map((s) => {
      const el = document.querySelector(s);
      return getComputedStyle(el).transitionDuration + "|" + getComputedStyle(el).animationName;
    }));
    for (const duree of durees) assert.match(duree, /^0s(, 0s)*\|none$/);
  });
});

test("une correction gardée pour un écran qui n'existe plus reste visible dans la liste", async () => {
  await avecPage(fixtureDeBase(), {
    adresse: "ecran/A2",
    avant: `window.localStorage.setItem("a-plat:corrections:Essai", JSON.stringify([{code:"Z9",element:"Titre",texte:"Ancienne"},{n:1},"x"]));`
  }, async ({ page, console: erreursConsole }) => {
    assert.equal(await lignes(page).count(), 1, "l'entrée mal formée est ignorée");
    assert.equal(espaces(await lignes(page).first().innerText()).includes("Z9 > Titre"), true);
    assert.deepEqual(erreursConsole, []);
  });
});
