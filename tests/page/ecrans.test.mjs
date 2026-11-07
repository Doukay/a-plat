import { test, after } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { avecPage, genererFixture, nettoyerFixtures, ecranHtml } from "./aide.mjs";

after(nettoyerFixtures);

// ---------------------------------------------------------------- petites aides

const texte = (page, selecteur) => page.locator(selecteur).innerText();
const espaces = (valeur) => valeur.replace(/\s+/g, " ").trim();

// Le cadre (Frame de Playwright) du premier iframe de la page qui porte ce code.
async function cadreDe(page, code, selecteur = "#vue") {
  const poignee = await page.locator(`${selecteur} iframe[data-code="${code}"]`).first().elementHandle();
  return poignee.contentFrame();
}

// Attend que l'écran ait reçu le mode envoyé par la page.
const attendreMode = (cadre, mode) =>
  cadre.waitForFunction((voulu) => document.documentElement.dataset.aPlatMode === voulu, mode);

// Remplace surElementTouche par un enregistreur : window.__touches reçoit [code, nom].
const enregistrerLesTouches = (page) => page.evaluate(() => {
  window.__touches = [];
  window.APlatMoteur.surElementTouche = (code, nom) => window.__touches.push([code, nom]);
});

const touches = (page) => page.evaluate(() => window.__touches);

const passerEnEssayer = async (page, code) => {
  await page.locator(".mode button", { hasText: "Essayer le parcours" }).click();
  await attendreMode(await cadreDe(page, code, ".volet-proposition"), "essayer");
};

// Un vrai toucher au milieu d'un élément, comme le ferait un doigt : Playwright refuse de cliquer
// « à travers » le lien qui couvre la vignette, alors que c'est précisément ce qu'on veut contrôler.
async function toucherLeMilieu(page, selecteur) {
  const boite = await page.locator(selecteur).boundingBox();
  await page.mouse.click(boite.x + boite.width / 2, boite.y + boite.height / 2);
}

const recouvre =(a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// Un plan généré : des écrans en 390 x 844 dans la rangée A, sauf indication contraire.
const planDe = (ecrans, rangees = [{ id: "A", titre: "Rangée A", notes: [] }]) => ({
  version: 1,
  projet: "Essai",
  etatDesLieux: [],
  rangees,
  ecrans: ecrans.map((ecran) => ({ rangee: "A", largeur: 390, hauteur: 844, statut: "a-relire", actuel: null, ...ecran }))
});

// ---------------------------------------------------------------- la vue d'ensemble
// Sur ordinateur, c'est la planche (zoom et déplacement : voir niveaux.test.mjs) ; sur téléphone,
// une colonne. Les deux montrent les mêmes rangées, dans le même ordre, avec les mêmes liens.

for (const largeur of [390, 1320]) {
  test(`à ${largeur} px, #ensemble montre les rangées qui ont des écrans ou des notes, dans l'ordre, avec les codes et les titres`, async () => {
    await avecPage("ecrans-variantes", { adresse: "ensemble", largeur, hauteur: 900 }, async ({ page }) => {
      const rangees = page.locator("#vue .rangee");
      // C n'a ni écran ni note : elle n'apparaît pas.
      assert.deepEqual(await rangees.evaluateAll((els) => els.map((el) => el.dataset.rangee)), ["A", "B"]);
      const liens = page.locator("#vue .rangee-titre a");
      assert.deepEqual((await liens.allInnerTexts()).map(espaces), ["A Trouver un outil", "B Prêter un outil"]);
      assert.deepEqual(await liens.evaluateAll((els) => els.map((el) => el.getAttribute("href"))), ["#rangee/A", "#rangee/B"]);
      assert.deepEqual((await page.locator("#vue .rangee-compte").allInnerTexts()).map(espaces), ["2 écrans", "1 écran"]);
      const codesA = await rangees.nth(0).locator(".vignette-code").allInnerTexts();
      assert.deepEqual(codesA.map(espaces), ["A1", "A2"]);
      assert.deepEqual((await rangees.nth(0).locator(".vignette-titre").allInnerTexts()).map(espaces), ["Accueil", "Fiche d'un outil"]);
      assert.deepEqual((await rangees.nth(1).locator(".vignette-code").allInnerTexts()).map(espaces), ["B1"]);
      assert.equal(await page.locator('.barre-vues a[aria-current="page"]').innerText(), "Vue d'ensemble");
    });
  });
}

test("les notes de toute la rangée sont sous son titre, avant les écrans ; celles d'un écran sont sous cet écran", async () => {
  for (const largeur of [390, 1320]) {
    await avecPage("ecrans-variantes", { adresse: "ensemble", largeur, hauteur: 900 }, async ({ page }) => {
      const rangee = page.locator('#vue .rangee[data-rangee="A"]');
      const generales = rangee.locator(".notes-generales .note");
      assert.deepEqual((await generales.locator(".note-type").allTextContents()).map(espaces), ["À trancher", "À vérifier", "Source"]);
      const notesDe = (code) => rangee.locator(`.vignette[data-code="${code}"] .note .note-type`).allTextContents();
      assert.deepEqual((await notesDe("A1")).map(espaces), ["À coder"]);
      assert.deepEqual((await notesDe("A2")).map(espaces), ["Décision", "À coder"], "une note qui cite deux écrans est sous chacun d'eux");
      // Rien après les écrans : plus de notes au bout de la rangée.
      const ordre = await rangee.evaluate((el) => {
        const titre = el.querySelector(".rangee-titre");
        const notes = el.querySelector(".notes-generales");
        const premier = el.querySelector(".vignette");
        const suit = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
        return { titrePuisNotes: suit(titre, notes), notesPuisEcrans: suit(notes, premier), dernier: el.lastElementChild.className };
      });
      assert.ok(ordre.titrePuisNotes && ordre.notesPuisEcrans);
      assert.doesNotMatch(ordre.dernier, /notes/);
      if (largeur === 1320) {
        // Sur la planche, à 100 % (assez large pour les lire), les notes de l'écran sont dessous,
        // à sa largeur, sans recouvrir aucun écran. Plus petit, elles se replient (niveaux.test.mjs).
        await page.getByRole("button", { name: "100 %, taille réelle" }).click();
        const ecran = await rangee.locator('.vignette[data-code="A2"] .cadre-boite').boundingBox();
        const notes = await rangee.locator('.vignette[data-code="A2"] .notes-ecran').boundingBox();
        assert.ok(notes.y >= ecran.y + ecran.height - 1, "les notes sont sous l'écran");
        assert.ok(Math.abs(notes.width - ecran.width) < 1, `à la largeur de l'écran : ${notes.width} pour ${ecran.width}`);
        for (const autre of await rangee.locator(".cadre-boite").all()) assert.ok(!recouvre(notes, await autre.boundingBox()));
      } else {
        // Sur téléphone, elles sont repliées sous « n notes ».
        const repli = rangee.locator('.vignette[data-code="A2"] details.notes-repliees');
        assert.equal(espaces(await repli.locator("summary").innerText()), "2 notes");
        assert.equal(await repli.evaluate((el) => el.open), false);
        assert.equal(espaces(await rangee.locator(".notes-generales > summary").innerText()), "3 notes");
      }
    });
  }
});

test("chaque note montre son type en toutes lettres, sa date telle qu'écrite et son ancienne valeur barrée", async () => {
  await avecPage("ecrans-variantes", { adresse: "ensemble" }, async ({ page }) => {
    const rangee = page.locator('#vue .rangee[data-rangee="A"]');
    // 3 notes de la rangée, 1 sous A1, 2 sous A2 (la note qui cite A1 et A2 est montrée deux fois).
    assert.equal(await rangee.locator(".note").count(), 6);
    const types = new Set((await rangee.locator(".note-type").allInnerTexts()).map(espaces));
    assert.deepEqual([...types].sort(), ["Décision", "Source", "À coder", "À trancher", "À vérifier"].sort());
    const premiere = rangee.locator('.vignette[data-code="A2"] .note').nth(0);
    assert.equal(espaces(await premiere.locator(".note-date").innerText()), "2026-11-04");
    assert.equal(espaces(await premiere.locator("s").innerText()), "Caution de 20 €");
    assert.equal(await premiere.locator("s").evaluate((s) => getComputedStyle(s).textDecorationLine), "line-through");
    assert.match(espaces(await premiere.locator(".note-texte").innerText()), /^Caution de 20 € Caution retirée\.$/, "l'ancienne valeur, puis le nouveau texte");
    const generale = rangee.locator(".notes-generales .note").nth(0);
    assert.equal(await generale.locator("s").count(), 0, "pas de barré sans ancienne valeur");
    assert.match(await generale.innerText(), /Durée maximale du prêt à choisir\./);
    assert.equal(espaces(await generale.locator(".note-date").innerText()), "2026-11-03");
  });
});

test("une rangée sans écran ni note n'apparaît pas, une rangée de notes seules oui, et un plan sans écran garde son message", async () => {
  await avecPage("ecrans-variantes", { adresse: "ensemble" }, async ({ page }) => {
    assert.equal(await page.locator('#vue .rangee[data-rangee="C"]').count(), 0);
    assert.doesNotMatch(await texte(page, "#vue"), /Mon compte/);
  });
  const dossier = genererFixture({
    plan: planDe([{ code: "A1", titre: "Accueil", fichier: "A1.html" }], [
      { id: "A", titre: "Rangée A", notes: [] },
      { id: "B", titre: "Des notes seules", notes: [{ type: "a-trancher", date: "2026-11-06", texte: "Faut-il cette rangée ?" }] }
    ]),
    ecrans: { "A1.html": ecranHtml("A1", "<h1>Accueil</h1>") }
  });
  for (const largeur of [390, 1320]) {
    await avecPage(dossier, { adresse: "ensemble", largeur }, async ({ page }) => {
      const rangeeB = page.locator('#vue .rangee[data-rangee="B"]');
      assert.equal(espaces(await rangeeB.locator(".rangee-compte").innerText()), "Aucun écran");
      assert.equal(await rangeeB.locator(".vignette").count(), 0);
      assert.match(await rangeeB.locator(".notes-generales").textContent(), /Faut-il cette rangée \?/);
    });
  }
  for (const largeur of [390, 1320]) {
    await avecPage("plans-pieges/ecrans-vides", { adresse: "ensemble", largeur }, async ({ page }) => {
      const contenu = await texte(page, "#vue");
      assert.match(contenu, /Aucun écran n'est encore dessiné/);
      assert.match(contenu, /Demandez à Claude/);
      assert.equal(await page.locator("#vue .vignette").count(), 0);
      assert.equal(await page.locator(".planche").count(), 0, "pas de planche vide");
    });
  }
});

test("sur la planche, un écran est un vrai lien, à sa vraie taille, sans toucher, paresseux et titré", async () => {
  await avecPage("ecrans-variantes", { adresse: "ensemble", largeur: 1320 }, async ({ page }) => {
    const vignette = page.locator('#vue .vignette[data-code="A2"]');
    const lien = vignette.locator("a.vignette-lien");
    assert.equal(await lien.getAttribute("href"), "#ecran/A2");
    const cadre = vignette.locator("iframe");
    assert.equal(await cadre.getAttribute("loading"), "lazy");
    assert.equal(await cadre.getAttribute("tabindex"), "-1");
    assert.match(await cadre.getAttribute("title"), /A2/);
    assert.match(await cadre.getAttribute("title"), /Fiche d'un outil/);
    assert.equal(await cadre.getAttribute("src"), "sources/ecrans/A2-fiche.html?finition=ux", "la page donne la finition dans l'adresse du cadre");
    assert.equal(await cadre.evaluate((el) => getComputedStyle(el).pointerEvents), "none");
    // Vraie taille dans la planche : 390 de large, au moins 844 de haut ; c'est la planche qui est réduite.
    const taille = await vignette.locator(".cadre-boite").evaluate((el) => ({ l: el.offsetWidth, h: el.offsetHeight }));
    assert.equal(taille.l, 390);
    assert.ok(taille.h >= 844, `hauteur : ${taille.h}`);
    assert.equal(await cadre.evaluate((el) => getComputedStyle(el).transform), "none");
    const vue = await vignette.locator(".cadre-boite").boundingBox();
    assert.ok(Math.abs(vue.width - 390 * 0.3) < 1, `à 30 % : ${vue.width}`);
  });
});

test("à 390 px, une vignette mesure 170 px de large, et elle est un vrai lien d'au moins 44 px", async () => {
  await avecPage("ecrans-variantes", { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const vignette = page.locator('#vue .vignette[data-code="A2"]');
    assert.equal(await vignette.locator("a.vignette-lien").getAttribute("href"), "#ecran/A2");
    const boite = await vignette.locator(".cadre-boite").boundingBox();
    assert.ok(Math.abs(boite.width - 170) < 1, `largeur : ${boite.width}`);
    const echelle = await vignette.locator("iframe").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    assert.ok(Math.abs(echelle - 170 / 390) < 0.001, `échelle : ${echelle}`);
    assert.ok((await vignette.locator("a.vignette-lien").boundingBox()).height >= 44, "cible tactile trop basse");
  });
});

test("toucher un écran de la vue d'ensemble ouvre l'écran seul", async () => {
  for (const largeur of [390, 1320]) {
    await avecPage("ecrans-variantes", { adresse: "ensemble", largeur }, async ({ page }) => {
      // Le toucher tombe au milieu de l'image : il doit quand même ouvrir l'écran.
      await toucherLeMilieu(page, '#vue .vignette[data-code="A2"] .cadre-boite');
      assert.equal(await page.evaluate(() => location.hash), "#ecran/A2");
      // L'adresse change tout de suite, la page se redessine à l'événement qui suit : on l'attend.
      await page.waitForFunction(() => document.body.dataset.vue === "ecran");
      assert.equal(await page.locator('.fil [aria-current="page"]').innerText(), "A2");
      assert.equal(await page.locator("#vue .ecran-code").innerText(), "A2");
    });
  }
});

// ---------------------------------------------------------------- l'écran seul

test("#ecran/A2 avec une capture : l'actuel et la proposition côte à côte à 1320 px, l'un sous l'autre à 390 px", async () => {
  await avecPage("ecrans-variantes", { adresse: "ecran/A2", largeur: 1320 }, async ({ page }) => {
    const actuel = page.locator(".volet-actuel");
    const proposition = page.locator(".volet-proposition");
    assert.equal(espaces(await actuel.locator(".volet-titre").innerText()), "Capture de l'existant");
    assert.equal(espaces(await proposition.locator(".volet-titre").innerText()), "Proposition");
    const image = actuel.locator("img");
    assert.match(await image.getAttribute("src"), /^sources\/actuel\/A2-fiche\.png$/);
    assert.ok((await image.getAttribute("alt")).length > 5, "l'image a un texte alternatif");
    assert.ok(await image.evaluate((el) => el.complete && el.naturalWidth > 0), "la capture est chargée");
    const a = await actuel.boundingBox();
    const p = await proposition.boundingBox();
    assert.ok(a.x + a.width <= p.x + 1, "l'actuel est à gauche de la proposition");
    assert.ok(Math.abs(a.y - p.y) < 4, "ils sont alignés en haut");
    assert.equal(await proposition.locator("iframe").getAttribute("src"), "sources/ecrans/A2-fiche.html?finition=ux");
  });
  await avecPage("ecrans-variantes", { adresse: "ecran/A2", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const a = await page.locator(".volet-actuel").boundingBox();
    const p = await page.locator(".volet-proposition").boundingBox();
    assert.ok(p.y >= a.y + a.height - 1, "la proposition est sous l'actuel");
    const largeurs = await page.evaluate(() => ({ d: document.documentElement.scrollWidth, f: document.documentElement.clientWidth }));
    assert.ok(largeurs.d <= largeurs.f, `la page déborde : ${largeurs.d} > ${largeurs.f}`);
  });
});

test("un actuel « redessine » en HTML est un cadre, étiqueté « Redessiné d'après le code »", async () => {
  await avecPage("ecrans-variantes", { adresse: "ecran/A1", largeur: 1320 }, async ({ page }) => {
    const actuel = page.locator(".volet-actuel");
    assert.equal(espaces(await actuel.locator(".volet-titre").innerText()), "Redessiné d'après le code");
    assert.equal(await actuel.locator("img").count(), 0);
    assert.equal(await actuel.locator("iframe").getAttribute("src"), "sources/actuel/A1-accueil.html");
    const cadre = await cadreDe(page, "A1", ".volet-actuel");
    await attendreMode(cadre, "corriger");
    assert.equal(await page.locator(".cadre-manque").count(), 0, "le cadre de l'actuel répond lui aussi");
    // Basculer en « Essayer » ne rend pas l'actuel cliquable : il ne sert qu'à comparer.
    await page.locator(".mode button", { hasText: "Essayer le parcours" }).click();
    await attendreMode(await cadreDe(page, "A1", ".volet-proposition"), "essayer");
    assert.equal(await cadre.evaluate(() => document.documentElement.dataset.aPlatMode), "corriger");
  });
});

test("sans actuel, la proposition est seule", async () => {
  await avecPage("ecrans-variantes", { adresse: "ecran/B1", largeur: 1320 }, async ({ page }) => {
    assert.equal(await page.locator(".volet").count(), 1);
    assert.equal(await page.locator(".volet-actuel").count(), 0);
    const contenu = await texte(page, "#vue");
    assert.doesNotMatch(contenu, /Capture de l'existant|Redessiné d'après le code/);
    assert.equal(await page.locator(".volet-proposition iframe").getAttribute("src"), "sources/ecrans/B1-pret.html?finition=ux");
  });
});

test("un écran inchange: true est seul, étiqueté « Existant, sans changement proposé », et marqué « Inchangé » partout", async () => {
  const dossier = genererFixture({
    plan: planDe([{ code: "A1", titre: "Réglages", fichier: "A1.html", inchange: true }]),
    ecrans: { "A1.html": ecranHtml("A1", "<h1>Réglages</h1>") }
  });
  await avecPage(dossier, { adresse: "ecran/A1", largeur: 1320 }, async ({ page }) => {
    assert.equal(await page.locator(".volet").count(), 1);
    assert.equal(espaces(await page.locator(".volet-proposition .volet-titre").innerText()), "Existant, sans changement proposé");
    assert.equal(espaces(await page.locator(".ecran-entete .badge-inchange").innerText()), "Inchangé");
  });
  await avecPage(dossier, { adresse: "ensemble", largeur: 1320 }, async ({ page }) => {
    assert.equal(espaces(await page.locator(".vignette .badge-inchange .badge-mot").innerText()), "Inchangé");
  });
});

test("le code de l'écran est du texte visible et sélectionnable, avec son titre", async () => {
  await avecPage("complet", { adresse: "ecran/A2" }, async ({ page }) => {
    const code = page.locator("#vue .ecran-code");
    assert.equal(await code.innerText(), "A2");
    assert.notEqual(await code.evaluate((el) => getComputedStyle(el).userSelect), "none");
    assert.equal(await page.locator("#vue h2").innerText(), "Fiche d'un outil");
  });
});

test("précédent et suivant suivent l'ordre des écrans du plan", async () => {
  await avecPage("complet", { adresse: "ecran/A2", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const precedent = page.locator("#vue .voisin-precedent");
    const suivant = page.locator("#vue .voisin-suivant");
    assert.equal(await precedent.getAttribute("href"), "#ecran/A1");
    assert.equal(await suivant.getAttribute("href"), "#ecran/B1");
    assert.match(await precedent.innerText(), /A1/);
    assert.match(await suivant.innerText(), /B1/);
    assert.ok((await precedent.boundingBox()).height >= 44 && (await suivant.boundingBox()).height >= 44);
    await suivant.click();
    assert.equal(await page.evaluate(() => location.hash), "#ecran/B1");
    await page.waitForFunction(() => document.querySelector("#vue .ecran-code")?.textContent === "B1");
    assert.equal(await page.locator("#vue .voisin-suivant").count(), 0, "le dernier écran n'a pas de suivant");
    assert.equal(await page.locator("#vue .voisin-precedent").getAttribute("href"), "#ecran/A2");
  });
  await avecPage("complet", { adresse: "ecran/A1" }, async ({ page }) => {
    assert.equal(await page.locator("#vue .voisin-precedent").count(), 0, "le premier écran n'a pas de précédent");
  });
});

test("un code inconnu dit que l'écran n'existe pas et renvoie vers la vue d'ensemble", async () => {
  await avecPage("complet", { adresse: "ecran/ZZ" }, async ({ page }) => {
    const contenu = await texte(page, "#vue");
    assert.match(contenu, /n'existe pas/);
    assert.match(contenu, /ZZ/);
    assert.equal(await page.locator("#vue iframe").count(), 0);
    const lien = page.locator("#vue a", { hasText: "vue d'ensemble" });
    assert.equal(await lien.getAttribute("href"), "#ensemble");
    await lien.click();
    assert.equal(await page.evaluate(() => location.hash), "#ensemble");
    await page.waitForFunction(() => document.body.dataset.vue === "ensemble");
    assert.equal(await page.locator("#vue .rangee").count(), 2);
  });
});

test("un écran trop large pour la page est réduit à la largeur disponible, sans défilement de la page", async () => {
  const dossier = genererFixture({
    plan: planDe([{ code: "A1", titre: "Tableau de bord", fichier: "A1.html", largeur: 1280, hauteur: 800 }]),
    ecrans: { "A1.html": ecranHtml("A1", "<h1>Tableau</h1>") }
  });
  await avecPage(dossier, { adresse: "ecran/A1", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const boite = await page.locator(".volet-proposition .cadre-boite").boundingBox();
    assert.ok(boite.width <= 390, `la boîte déborde : ${boite.width}`);
    const largeurs = await page.evaluate(() => ({ d: document.documentElement.scrollWidth, f: document.documentElement.clientWidth }));
    assert.ok(largeurs.d <= largeurs.f);
  });
  await avecPage(dossier, { adresse: "ecran/A1", largeur: 1320, hauteur: 900 }, async ({ page }) => {
    const boite = await page.locator(".volet-proposition .cadre-boite").boundingBox();
    assert.ok(boite.width >= 1000, `à 1320 px l'écran garde sa largeur réelle : ${boite.width}`);
  });
});

test("la hauteur du cadre suit le message pret de l'écran", async () => {
  const dossier = genererFixture({
    plan: planDe([{ code: "A1", titre: "Long", fichier: "A1.html" }]),
    ecrans: { "A1.html": ecranHtml("A1", '<h1>Long</h1><div style="height:2000px"></div>') }
  });
  await avecPage(dossier, { adresse: "ecran/A1", largeur: 1320 }, async ({ page }) => {
    await page.waitForFunction(() => document.querySelector("#vue iframe").getBoundingClientRect().height >= 2000);
    const hauteur = await page.locator("#vue iframe").evaluate((el) => el.getBoundingClientRect().height);
    assert.ok(hauteur >= 2000 && hauteur < 2200, `hauteur du cadre : ${hauteur}`);
  });
});

// ---------------------------------------------------------------- les deux modes

test("le mode commence à « Corriger », et le bouton change le mode de l'écran", async () => {
  await avecPage("complet", { adresse: "ecran/A1" }, async ({ page }) => {
    const corriger = page.locator(".mode button", { hasText: "Corriger" });
    const essayer = page.locator(".mode button", { hasText: "Essayer le parcours" });
    assert.equal(await corriger.getAttribute("aria-pressed"), "true");
    assert.equal(await essayer.getAttribute("aria-pressed"), "false");
    const cadre = await cadreDe(page, "A1");
    await attendreMode(cadre, "corriger");
    await essayer.click();
    await attendreMode(cadre, "essayer");
    assert.equal(await essayer.getAttribute("aria-pressed"), "true");
    assert.equal(await corriger.getAttribute("aria-pressed"), "false");
    await corriger.click();
    await attendreMode(cadre, "corriger");
  });
});

test("en mode « Corriger », toucher un élément ne fait rien dans l'écran et remonte son nom à la page", async () => {
  await avecPage("complet", { adresse: "ecran/A1" }, async ({ page }) => {
    await enregistrerLesTouches(page);
    const cadre = await cadreDe(page, "A1");
    await attendreMode(cadre, "corriger");
    await page.frameLocator("#vue iframe").getByText("Perceuse sans fil").click();
    await page.frameLocator("#vue iframe").getByText("Prêter un outil").click();
    await page.frameLocator("#vue iframe").getByRole("heading", { name: "Prêtoutil" }).click();
    await page.waitForFunction(() => window.__touches.length >= 3);
    assert.deepEqual(await touches(page), [
      ["A1", "Lien perceuse"],
      ["A1", "Lien « Prêter un outil »"],
      ["A1", "Titre"]
    ]);
    assert.equal(await page.evaluate(() => location.hash), "#ecran/A1", "le lien n'a mené nulle part");
    assert.match(cadre.url(), /A1-accueil\.html\?finition=ux$/);
  });
});

test("en mode « Corriger », un formulaire et un bouton de l'écran ne font rien", async () => {
  await avecPage("complet", { adresse: "ecran/A2" }, async ({ page }) => {
    await enregistrerLesTouches(page);
    const cadre = await cadreDe(page, "A2");
    await attendreMode(cadre, "corriger");
    await page.frameLocator("#vue iframe").getByRole("button", { name: "Demander le prêt" }).click();
    await page.frameLocator("#vue iframe").getByPlaceholder("Un mot pour le voisin").fill("Bonjour");
    await page.frameLocator("#vue iframe").getByPlaceholder("Un mot pour le voisin").press("Enter");
    await page.waitForFunction(() => window.__touches.length >= 1);
    assert.deepEqual((await touches(page))[0], ["A2", "Bouton Demander"]);
    assert.match(cadre.url(), /A2-fiche\.html\?finition=ux$/, "l'écran n'a pas été remplacé par la page du formulaire");
    assert.equal(await page.evaluate(() => location.hash), "#ecran/A2");
  });
});

test("en mode « Essayer le parcours », toucher un lien vers A2-fiche.html ouvre #ecran/A2", async () => {
  await avecPage("complet", { adresse: "ecran/A1" }, async ({ page }) => {
    await enregistrerLesTouches(page);
    await passerEnEssayer(page, "A1");
    await page.frameLocator("#vue iframe").getByText("Perceuse sans fil").click();
    await page.waitForFunction(() => location.hash === "#ecran/A2");
    assert.equal(await page.locator("#vue .ecran-code").innerText(), "A2");
    assert.deepEqual(await touches(page), [], "en mode Essayer, rien n'est préparé comme correction");
    // Le mode reste « Essayer » sur l'écran suivant : on peut continuer le parcours.
    await attendreMode(await cadreDe(page, "A2"), "essayer");
    assert.equal(await page.locator(".mode button", { hasText: "Essayer le parcours" }).getAttribute("aria-pressed"), "true");
    await page.frameLocator("#vue iframe").getByRole("button", { name: "Demander le prêt" }).click();
    await page.waitForFunction(() => location.hash === "#ecran/B1");
  });
});

test("en mode « Essayer le parcours », un lien vers l'extérieur ou un écran absent du plan laisse sur place et le dit", async () => {
  await avecPage("complet", { adresse: "ecran/B1" }, async ({ page, requetes }) => {
    await passerEnEssayer(page, "B1");
    await page.frameLocator("#vue iframe").getByText("Aide").click();
    await page.locator(".lien-sans-ecran").filter({ hasText: "example.org/aide" }).waitFor();
    assert.match(await texte(page, ".lien-sans-ecran"), /ne mène à aucun écran/);
    assert.equal(await page.evaluate(() => location.hash), "#ecran/B1");
    await page.frameLocator("#vue iframe").getByText("Écrire").click();
    await page.locator(".lien-sans-ecran").filter({ hasText: "mailto:" }).waitFor();
    // Un lien avec ancre mène quand même à l'écran.
    await page.frameLocator("#vue iframe").getByText("Revenir à l'accueil").click();
    await page.waitForFunction(() => location.hash === "#ecran/A1");
    assert.deepEqual(requetes, []);
  });
});

// ---------------------------------------------------------------- messages venus d'ailleurs

test("un message qui ne vient pas d'un cadre de la page, ou sans aPlat: 1, est ignoré", async () => {
  await avecPage("complet", { adresse: "ecran/A1" }, async ({ page }) => {
    await enregistrerLesTouches(page);
    await passerEnEssayer(page, "A1");
    const cadre = await cadreDe(page, "A1");
    const hauteurAvant = await page.locator("#vue iframe").evaluate((el) => el.getBoundingClientRect().height);

    // 1. la page se parle à elle-même
    await page.evaluate(() => {
      window.postMessage({ aPlat: 1, type: "lien", code: "A1", vers: "B1-pret.html" }, "*");
      window.postMessage({ aPlat: 1, type: "element", code: "A1", nom: "Intrus" }, "*");
      window.postMessage({ aPlat: 1, type: "pret", code: "A1", hauteur: 9000 }, "*");
    });
    // 2. une fenêtre étrangère : un cadre ajouté à la page par un script
    await page.evaluate(() => {
      const etranger = document.createElement("iframe");
      etranger.srcdoc = '<script>parent.postMessage({ aPlat: 1, type: "lien", code: "A1", vers: "B1-pret.html" }, "*");' +
        'parent.postMessage({ aPlat: 1, type: "element", code: "A1", nom: "Intrus" }, "*");' +
        'parent.postMessage({ aPlat: 1, type: "pret", code: "A1", hauteur: 9000 }, "*");<\/script>';
      document.body.appendChild(etranger);
    });
    // 3. un vrai cadre de la page, mais un message sans la marque aPlat
    await cadre.evaluate(() => {
      parent.postMessage({ type: "lien", code: "A1", vers: "B1-pret.html" }, "*");
      parent.postMessage({ aPlat: 2, type: "element", code: "A1", nom: "Intrus" }, "*");
      parent.postMessage({ aPlat: 1, type: "inconnu" }, "*");
      parent.postMessage("A1 B1-pret.html", "*");
    });
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => location.hash), "#ecran/A1");
    assert.deepEqual(await touches(page), []);
    const hauteurApres = await page.locator("#vue iframe").first().evaluate((el) => el.getBoundingClientRect().height);
    assert.equal(hauteurApres, hauteurAvant, "un faux message pret ne change pas la hauteur");
  });
});

// ---------------------------------------------------------------- un écran ouvert seul

test("un écran ouvert seul, hors de la page, s'affiche et ses liens marchent normalement", async () => {
  await avecPage("complet", {}, async ({ page, dossier, erreurs, requetes }) => {
    const base = pathToFileURL(join(dossier, "sources", "ecrans")).href;
    await page.goto(`${base}/A1-accueil.html`);
    assert.equal(await page.locator("h1").innerText(), "Prêtoutil");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.aPlatMode), undefined, "le relais ne fait rien seul");
    assert.equal(await page.evaluate(() => typeof window.APlatRelais), "undefined");
    await page.getByText("Perceuse sans fil").click();
    await page.waitForURL(/A2-fiche\.html$/);
    assert.equal(await page.locator("h1").innerText(), "Perceuse sans fil");
    // Un formulaire se soumet, et un lien « Retour » revient.
    await page.getByRole("button", { name: "Demander le prêt" }).click();
    await page.waitForURL(/B1-pret\.html/);
    await page.getByText("Revenir à l'accueil").click();
    await page.waitForURL(/A1-accueil\.html#haut$/);
    assert.deepEqual(erreurs, []);
    assert.deepEqual(requetes, []);
  });
});

test("le style d'un écran ne change pas celui de la page, et la page ne change pas celui de l'écran", async () => {
  // Sans commun.css ni charte.css (ils font partie de la page et de sources/), l'écran n'a que le style par défaut
  // du navigateur : c'est ce qui prouve que le style de la page ne passe pas dans le cadre.
  await avecPage("complet", { adresse: "ecran/A2", retirer: [".cache/commun.css", "sources/charte.css"] }, async ({ page }) => {
    const cadre = await cadreDe(page, "A2");
    await attendreMode(cadre, "corriger");
    const dansLaPage = await page.evaluate(() => {
      const lien = document.querySelector(".barre-vues a:not([aria-current])");
      return {
        titre: getComputedStyle(document.querySelector("#vue h2.titre-de-vue")).fontSize,
        lien: getComputedStyle(lien).color,
        champ: document.querySelectorAll("#vue input").length
      };
    });
    assert.equal(dansLaPage.titre, "23px");
    assert.equal(dansLaPage.lien, "rgb(161, 161, 166)", "le « a[href] { color: inherit } » de l'écran n'atteint pas la barre");
    assert.equal(dansLaPage.champ, 0, "le champ de l'écran ne sort pas de son cadre");
    const dansLEcran = await cadre.evaluate(() => ({
      h1: getComputedStyle(document.querySelector("h1")).fontSize,
      champ: getComputedStyle(document.querySelector("input")).width
    }));
    assert.equal(dansLEcran.h1, "32px", "l'écran garde le style par défaut du navigateur, pas celui de la page");
    assert.notEqual(dansLEcran.champ, "auto");
  });
});

// ---------------------------------------------------------------- écran introuvable

test("un écran dont le fichier manque affiche « Écran introuvable » et le nom du fichier après 3 secondes, les autres restent utilisables", async () => {
  await avecPage("complet", { adresse: "ensemble", retirer: ["sources/ecrans/B1-pret.html"] }, async ({ page }) => {
    const debut = Date.now();
    await page.waitForTimeout(1500);
    assert.equal(await page.locator(".cadre-manque").count(), 0, "pas de message avant le délai");
    await page.locator(".cadre-manque").first().waitFor({ timeout: 6000 });
    assert.ok(Date.now() - debut >= 2500, `message trop tôt : ${Date.now() - debut} ms`);
    assert.equal(await page.locator(".cadre-manque").count(), 1, "seul l'écran absent est signalé");
    const manque = page.locator('#vue .vignette[data-code="B1"] .cadre-manque');
    assert.match(await manque.innerText(), /Écran introuvable : sources\/ecrans\/B1-pret\.html/);
    assert.match(await manque.innerText(), /Demandez à Claude/);
    // les autres écrans restent là et utilisables
    for (const code of ["A1", "A2"]) assert.equal(await page.locator(`#vue .vignette[data-code="${code}"] .cadre-manque`).count(), 0);
    await toucherLeMilieu(page, '#vue .vignette[data-code="A1"] .cadre-boite');
    assert.equal(await page.evaluate(() => location.hash), "#ecran/A1");
    await attendreMode(await cadreDe(page, "A1"), "corriger");
  });
  // Dans la vue d'un écran seul.
  await avecPage("complet", { adresse: "ecran/B1", retirer: ["sources/ecrans/B1-pret.html"] }, async ({ page }) => {
    await page.locator(".cadre-manque").waitFor({ timeout: 6000 });
    assert.match(await texte(page, ".cadre-manque"), /Écran introuvable : sources\/ecrans\/B1-pret\.html/);
    assert.equal(await page.locator(".mode button").count(), 2, "la page reste utilisable");
  });
});

test("un écran qui répond en retard retrouve son cadre", async () => {
  const dossier = genererFixture({
    plan: planDe([{ code: "A1", titre: "Lent", fichier: "A1-lent.html" }, { code: "A2", titre: "Vif", fichier: "A2-vif.html" }]),
    ecrans: {
      "A1-lent.html": ecranHtml("A1", '<h1>Écran lent</h1><script>setTimeout(function () { var s = document.createElement("script"); s.src = "../../.cache/relais.js"; document.body.appendChild(s); }, 4500);</script>', { relais: false }),
      "A2-vif.html": ecranHtml("A2", "<h1>Écran vif</h1>")
    }
  });
  await avecPage(dossier, { adresse: "ensemble" }, async ({ page }) => {
    const manque = page.locator('#vue .vignette[data-code="A1"] .cadre-manque');
    await manque.waitFor({ timeout: 6000 });
    assert.equal(await page.locator('#vue .vignette[data-code="A2"] .cadre-manque').count(), 0);
    await manque.waitFor({ state: "detached", timeout: 6000 });
    assert.equal(await page.locator(".cadre-manque").count(), 0);
  });
});

test("un écran absent, loin hors de la vue, n'est signalé qu'une fois approché", async () => {
  const codes = Array.from({ length: 40 }, (_, i) => `A${i + 1}`);
  const fichiers = {};
  for (const code of codes.slice(0, -1)) fichiers[`${code}.html`] = ecranHtml(code, `<h1>${code}</h1>`);
  const dossier = genererFixture({
    plan: planDe(codes.map((code) => ({ code, titre: `Écran ${code}`, fichier: `${code}.html` }))),
    ecrans: fichiers // le dernier fichier, A40.html, n'existe pas
  });
  await avecPage(dossier, { adresse: "ensemble", largeur: 1320, hauteur: 900 }, async ({ page }) => {
    await page.waitForFunction(() => document.querySelectorAll("#vue .vignette").length === 40);
    await page.waitForTimeout(3600);
    assert.equal(await page.locator(".cadre-manque").count(), 0, "A40 est loin hors de la vue : pas encore de compte à rebours");
    // On déplace la planche vers la droite à la molette (Maj + molette, de côté), jusqu'à A40.
    await page.mouse.move(660, 500);
    for (let i = 0; i < 10 && (await page.locator('.vignette[data-code="A40"]').boundingBox()).x > 1000; i++) {
      await page.keyboard.down("Shift");
      await page.mouse.wheel(0, 800);
      await page.keyboard.up("Shift");
      await page.waitForTimeout(50);
    }
    const a40 = await page.locator('.vignette[data-code="A40"]').boundingBox();
    assert.ok(a40.x > 0 && a40.x < 1320, `A40 est maintenant dans la fenêtre (x = ${a40.x})`);
    await page.locator('.vignette[data-code="A40"] .cadre-manque').waitFor({ timeout: 7000 });
    assert.match(await texte(page, ".cadre-manque"), /Écran introuvable : sources\/ecrans\/A40\.html/);
    assert.equal(await page.locator(".cadre-manque").count(), 1);
  });
});

// ---------------------------------------------------------------- noms des éléments (relais)

test("le relais nomme les éléments : data-nom, sinon le rôle et un texte court, sinon « Élément »", async () => {
  const corps = `
    <h2>Mes outils</h2>
    <button>Envoyer</button>
    <button><span id="dans">Valider</span></button>
    <a href="x.html">Retour</a>
    <label for="prenom">Prénom</label><input id="prenom" type="text">
    <label>Ville <input id="ville" type="text"></label>
    <input id="sans" type="text">
    <div id="bloc">Texte libre</div>
    <button data-nom="Bouton principal"><b id="gras">Go</b></button>
    <button id="long">Voici un texte de bouton vraiment beaucoup trop long pour tenir dans une correction courte</button>
    <img id="photo" alt="Photo d'une perceuse" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="40" height="40">
    <img id="muette" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="40" height="40">`;
  const dossier = genererFixture({
    plan: planDe([{ code: "N1", titre: "Noms", fichier: "N1.html" }]),
    ecrans: { "N1.html": ecranHtml("N1", corps) }
  });
  await avecPage(dossier, { adresse: "ecran/N1" }, async ({ page }) => {
    await enregistrerLesTouches(page);
    const cadre = await cadreDe(page, "N1");
    await attendreMode(cadre, "corriger");
    const cas = [
      ["h2", "Titre « Mes outils »"],
      ["button >> nth=0", "Bouton « Envoyer »"],
      ["#dans", "Bouton « Valider »"],
      ["a", "Lien « Retour »"],
      ["#prenom", "Champ « Prénom »"],
      ["#ville", "Champ « Ville »"],
      ["#sans", "Élément"],
      ["#bloc", "Élément"],
      ["#gras", "Bouton principal"],
      ["#photo", "Image « Photo d'une perceuse »"],
      ["#muette", "Élément"]
    ];
    for (const [selecteur] of cas) await cadre.locator(selecteur).click();
    await cadre.locator("#long").click();
    await page.waitForFunction((n) => window.__touches.length >= n, cas.length + 1);
    const recus = await touches(page);
    assert.deepEqual(recus.slice(0, cas.length), cas.map(([, nom]) => ["N1", nom]));
    const [code, nomLong] = recus[cas.length];
    assert.equal(code, "N1");
    assert.match(nomLong, /^Bouton « Voici un texte de bouton/);
    assert.match(nomLong, /… »$/);
    assert.ok(nomLong.length <= 60, `nom trop long : ${nomLong.length}`);
  });
});

// ---------------------------------------------------------------- fichiers, textes piégeux

// validerPlan (logique.js) refuse ces fichiers : la page montre la liste des erreurs du plan,
// qui cite chacun d'eux, et ne crée aucun cadre ni aucune image.
test("un fichier qui sort du dossier des écrans fait refuser le plan, sans rien charger", async () => {
  const mauvais = ["../secret.html", "https://example.org/x.html", "/etc/page.html", "%2e%2e/x.html", "sous\\..\\x.html", "//example.org/x.html"];
  const ecrans = mauvais.map((fichier, i) => ({ code: `R${i + 1}`, titre: `Refusé ${i + 1}`, fichier }));
  ecrans.push({ code: "OK", titre: "Bon", fichier: "bon.html", actuel: { fichier: "actuel/../../x.png", origine: "capture" } });
  const dossier = genererFixture({ plan: planDe(ecrans), ecrans: { "bon.html": ecranHtml("OK", "<h1>Bon</h1>") } });
  for (const adresse of ["ensemble", "ecran/OK", "ecran/R1"]) {
    await avecPage(dossier, { adresse }, async ({ page, requetes, erreurs }) => {
      await page.waitForTimeout(500);
      const vue = await texte(page, "#vue");
      assert.match(vue, /Le plan contient des erreurs/);
      for (const fichier of mauvais) assert.ok(vue.includes(`« ${fichier} » refusé`), `${fichier} n'est pas cité`);
      assert.ok(vue.includes("« actuel/../../x.png » refusé"), "la capture hors dossier n'est pas citée");
      assert.equal(await page.locator("#vue iframe").count(), 0);
      assert.equal(await page.locator("#vue img").count(), 0);
      assert.deepEqual(requetes, []);
      assert.deepEqual(erreurs, []);
    });
  }
});

test("des balises dans les titres, codes et notes s'affichent comme du texte, sans rien exécuter", async () => {
  const piege = '<img src=x onerror="window.PIEGE=1">';
  const plan = planDe(
    [{ code: 'A"<1>', titre: piege + " « é » & titre", fichier: "a.html", actuel: { fichier: "actuel/a.png", origine: "capture" } }],
    [{ id: "A", titre: '<script>window.PIEGE=1</script> "Rangée"', notes: [{ type: "decision", date: "<b>demain</b>", texte: piege + " nouveau", ancien: "<s>ancien</s>" }] }]
  );
  const dossier = genererFixture({ plan, ecrans: { "a.html": ecranHtml('A"<1>', "<h1>A</h1>") } });
  for (const adresse of ["ensemble", "ecran/" + encodeURIComponent('A"<1>')]) {
    await avecPage(dossier, { adresse }, async ({ page }) => {
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.PIEGE), undefined);
      assert.equal(await page.locator("#vue script").count(), 0);
      assert.equal(await page.locator("#vue img[src=x]").count(), 0);
      const contenu = await texte(page, "#vue");
      assert.ok(contenu.includes(piege), `le titre piégé doit être lisible tel quel : ${adresse}`);
      assert.ok(contenu.includes('A"<1>'));
      if (adresse === "ensemble") {
        assert.ok(contenu.includes('<script>window.PIEGE=1</script> "Rangée"'));
        assert.ok(contenu.includes("<b>demain</b>"));
        assert.ok(contenu.includes("<s>ancien</s>"));
      }
    });
  }
});

// ---------------------------------------------------------------- tailles, couleurs, mouvement

for (const largeur of [390, 1320]) {
  for (const schema of ["light", "dark"]) {
    test(`à ${largeur} px, en ${schema === "light" ? "clair" : "sombre"} : les vues des écrans n'ont ni débordement de la page, ni erreur, ni requête en ligne`, async () => {
      for (const adresse of ["ensemble", "rangee/A", "ecran/A2"]) {
        await avecPage("ecrans-variantes", { adresse, largeur, hauteur: largeur === 390 ? 844 : 900, schema }, async (contexte) => {
          const { page } = contexte;
          await page.waitForTimeout(400);
          const mesures = await page.evaluate(() => ({
            defilement: document.documentElement.scrollWidth,
            fenetre: document.documentElement.clientWidth,
            fond: getComputedStyle(document.body).backgroundColor
          }));
          assert.ok(mesures.defilement <= mesures.fenetre, `${adresse} déborde : ${mesures.defilement} > ${mesures.fenetre}`);
          assert.deepEqual(contexte.erreurs, [], `${adresse} : erreurs de page`);
          assert.deepEqual(contexte.console.filter((m) => !/Failed to load resource/.test(m)), [], `${adresse} : erreurs de console`);
          assert.deepEqual(contexte.requetes, [], `${adresse} : requêtes hors file://`);
          assert.equal(mesures.fond === "rgb(245, 245, 247)", schema === "light");
          const fondNote = await page.evaluate(() => {
            const note = document.querySelector(".note");
            return note ? getComputedStyle(note).backgroundColor : null;
          });
          assert.notEqual(fondNote, null, `${adresse} : A2 a des notes, elles sont affichées`);
        });
      }
    });
  }
}

test("les notes et les boutons suivent le mode sombre par les variables de la page", async () => {
  const fond = (schema) => avecPage("ecrans-variantes", { adresse: "ensemble", schema }, ({ page }) =>
    page.locator(".note").first().evaluate((el) => getComputedStyle(el).backgroundColor));
  const clair = await fond("light");
  const sombre = await fond("dark");
  assert.notEqual(clair, sombre);
});

test("les boutons de mode font au moins 44 px de haut, à 390 px", async () => {
  await avecPage("complet", { adresse: "ecran/A1", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const hauteurs = await page.locator(".mode button").evaluateAll((boutons) => boutons.map((b) => b.getBoundingClientRect().height));
    assert.equal(hauteurs.length, 2);
    for (const hauteur of hauteurs) assert.ok(hauteur >= 44, `bouton trop bas : ${hauteur}`);
  });
});

test("les nouvelles vues respectent « réduire les animations »", async () => {
  const duree = (mouvement) => avecPage("complet", { adresse: "ecran/A1", mouvement }, ({ page }) =>
    page.locator(".mode button").first().evaluate((el) => getComputedStyle(el).transitionDuration));
  assert.equal(await duree("reduce"), "0s");
  assert.notEqual(await duree("no-preference"), "0s", "sans réglage, le bouton garde sa transition");
});

// ---------------------------------------------------------------- 124 écrans

function grandPlan() {
  const rangees = [];
  const ecrans = [];
  const fichiers = {};
  let numero = 0;
  for (let r = 0; r < 8; r++) {
    const id = String.fromCharCode(65 + r);
    rangees.push({ id, titre: `Parcours ${id}`, notes: [{ type: "a-trancher", date: "2026-11-04", texte: `Question de la rangée ${id}.` }] });
    const combien = r < 4 ? 16 : 15;
    for (let i = 1; i <= combien; i++) {
      numero++;
      const code = `${id}${i}`;
      const fichier = `${code}.html`;
      ecrans.push({ code, titre: `Écran ${numero}`, rangee: id, fichier, largeur: 390, hauteur: 844, statut: "a-relire", actuel: null });
      fichiers[fichier] = ecranHtml(code, `<h1>Écran ${numero}</h1><p>Un texte pour l'écran ${code}.</p><a href="${id}${i + 1}.html">Suivant</a>`);
    }
  }
  assert.equal(ecrans.length, 124);
  return { plan: { version: 1, projet: "Grand projet", etatDesLieux: [], rangees, ecrans }, ecrans: fichiers };
}

test("un plan de 124 écrans s'affiche en moins de 3 secondes, sans erreur, sans faux « introuvable »", async () => {
  const dossier = genererFixture(grandPlan());
  await avecPage(dossier, { adresse: "ensemble", largeur: 1320, hauteur: 900 }, async ({ page, erreurs, console, requetes }) => {
    await page.waitForFunction(() => document.querySelectorAll("#vue .vignette").length === 124);
    const ms = await page.evaluate(() => performance.now());
    assert.ok(ms < 3000, `affichage en ${Math.round(ms)} ms`);
    assert.equal(await page.locator("#vue .rangee").count(), 8);
    // Les écrans hors de la vue n'ont pas encore de compte à rebours : aucun faux « introuvable ».
    await page.waitForTimeout(3600);
    assert.equal(await page.locator(".cadre-manque").count(), 0);
    // « Tout voir » met toutes les colonnes dans la largeur ; huit rangées et leurs titres ne
    // tiennent pas en hauteur, on descend donc à la molette jusqu'en bas. Tout répond, rien n'est
    // faussement signalé.
    await page.getByRole("button", { name: "Tout voir" }).click();
    for (const boite of await page.locator("#vue .vignette .cadre-boite").all()) {
      const b = await boite.boundingBox();
      assert.ok(b.x >= 0 && b.x + b.width <= 1320, "chaque écran tient dans la largeur");
    }
    await page.mouse.move(660, 500);
    const derniere = page.locator("#vue .rangee").last();
    for (let i = 0; i < 40 && (await derniere.boundingBox()).y + (await derniere.boundingBox()).height > 900; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(120);
    }
    const bas = await derniere.boundingBox();
    assert.ok(bas.y + bas.height <= 900, "la dernière rangée est arrivée dans la fenêtre");
    await page.waitForTimeout(3600);
    assert.equal(await page.locator(".cadre-manque").count(), 0);
    assert.deepEqual(erreurs, []);
    assert.deepEqual(console, []);
    assert.deepEqual(requetes, []);
  });
});

test("à 390 px, 124 écrans ne font pas défiler la page de côté", async () => {
  const dossier = genererFixture(grandPlan());
  await avecPage(dossier, { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page }) => {
    await page.waitForFunction(() => document.querySelectorAll("#vue .vignette").length === 124);
    const mesures = await page.evaluate(() => ({
      d: document.documentElement.scrollWidth,
      f: document.documentElement.clientWidth,
      ligne: (() => { const l = document.querySelector(".glisse"); return { contenu: l.scrollWidth, boite: l.clientWidth, defilement: getComputedStyle(l).overflowX }; })()
    }));
    assert.ok(mesures.d <= mesures.f, `la page déborde : ${mesures.d} > ${mesures.f}`);
    assert.ok(mesures.ligne.contenu > mesures.ligne.boite, "la rangée défile dans sa propre boîte");
    assert.ok(["auto", "scroll"].includes(mesures.ligne.defilement));
  });
});
