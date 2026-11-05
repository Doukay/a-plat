// La démo (Prêtoutil) ouverte dans la page, comme la verra la personne : trois vues, un parcours à essayer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { avecPage } from "./aide.mjs";

const espaces = (valeur) => valeur.replace(/\s+/g, " ").trim();

async function cadreDe(page, code, selecteur = "#vue") {
  const poignee = await page.locator(`${selecteur} iframe[data-code="${code}"]`).first().elementHandle();
  return poignee.contentFrame();
}

const attendreMode = (cadre, mode) =>
  cadre.waitForFunction((voulu) => document.documentElement.dataset.aPlatMode === voulu, mode);

// Fait défiler la page pour que tous les cadres paresseux se chargent.
async function toutCharger(page) {
  await page.evaluate(async () => {
    for (const cadre of document.querySelectorAll("#vue iframe")) {
      cadre.scrollIntoView({ block: "center", inline: "center" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

for (const largeur of [390, 1320]) {
  test(`à ${largeur} px, la démo montre ses 8 écrans en 3 rangées, sans erreur, sans requête, sans défilement de côté`, async () => {
    await avecPage("demo", { adresse: "ensemble", largeur, hauteur: 900 }, async ({ page, console: messages, erreurs, requetes }) => {
      assert.equal(await page.locator("#vue .rangee").count(), 3);
      assert.equal(await page.locator("#vue .vignette").count(), 8);
      assert.equal(await page.locator("#vue .note").count(), 7);
      await toutCharger(page);
      await page.waitForFunction(() => document.querySelectorAll("#vue .cadre-manque").length === 0);
      assert.equal(await page.locator("#vue .cadre-manque").count(), 0, "aucun écran introuvable");
      const defile = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(defile <= 0, `la page défile de côté de ${defile} px`);
      assert.deepEqual(messages, []);
      assert.deepEqual(erreurs, []);
      assert.deepEqual(requetes, [], "aucune requête hors file://");
      assert.deepEqual((await page.locator("#vue .badge-valide").evaluateAll((els) => els.map((el) => el.closest(".vignette").dataset.code))), ["B2"], "seul B2 est validé");
    });
  });
}

test("l'état des lieux de la démo montre neuf pages dans les quatre états", async () => {
  await avecPage("demo", { adresse: "etat" }, async ({ page, erreurs }) => {
    assert.equal(await page.locator("li.ligne").count(), 9);
    const etats = new Set((await page.locator("li.ligne").evaluateAll((els) => els.map((el) => el.dataset.etat))));
    assert.deepEqual([...etats].sort(), ["a-completer", "existe", "manque", "prevue"]);
    assert.match(await page.locator("#vue").innerText(), /à essayer pour confirmer/);
    assert.deepEqual(erreurs, []);
  });
});

test("#ecran/A2 montre la capture de l'existant et la proposition, #ecran/C1 l'existant redessiné", async () => {
  await avecPage("demo", { adresse: "ecran/A2", largeur: 1320 }, async ({ page }) => {
    const image = page.locator(".volet-actuel img");
    await image.waitFor();
    assert.ok(await image.evaluate((el) => el.complete && el.naturalWidth === 390), "la capture est chargée");
    assert.equal(espaces(await page.locator(".volet-actuel .volet-titre").innerText()), "Capture de l'existant");
    await attendreMode(await cadreDe(page, "A2", ".volet-proposition"), "corriger");
  });
  await avecPage("demo", { adresse: "ecran/C1", largeur: 1320 }, async ({ page }) => {
    assert.equal(espaces(await page.locator(".volet-actuel .volet-titre").innerText()), "Redessiné d'après le code");
    await attendreMode(await cadreDe(page, "C1", ".volet-actuel"), "corriger");
    assert.equal(await page.locator(".cadre-manque").count(), 0);
  });
});

test("« Essayer le parcours » : de l'accueil à mes prêts, en touchant les liens et le bouton d'envoi", async () => {
  await avecPage("demo", { adresse: "ecran/A1", largeur: 1320 }, async ({ page, erreurs }) => {
    await page.locator(".mode button", { hasText: "Essayer le parcours" }).click();
    const aller = async (depuis, selecteur, vers) => {
      const cadre = await cadreDe(page, depuis, ".volet-proposition");
      await attendreMode(cadre, "essayer");
      await cadre.locator(selecteur).first().click();
      await page.waitForFunction((hash) => location.hash === hash, `#ecran/${vers}`);
      await page.locator(`.volet-proposition iframe[data-code="${vers}"]`).waitFor();
    };
    await aller("A1", 'a[href="A2-fiche.html"]', "A2");
    await aller("A2", 'a[href="B1-demande.html"]', "B1");
    await aller("B1", 'button[type="submit"]', "B2");
    await aller("B2", 'a[href="C1-mes-prets.html"]', "C1");
    await aller("C1", 'a[href="C3-historique.html"]', "C3");
    assert.deepEqual(erreurs, []);
  });
});

test("à 390 px, chaque écran de la démo tient sans défilement de côté et ses cibles font 44 px au moins", async () => {
  await avecPage("demo", { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page, dossier }) => {
    const { pathToFileURL } = await import("node:url");
    const { join } = await import("node:path");
    const fichiers = await page.evaluate(() => window.A_PLAT.ecrans.map((e) => e.fichier));
    for (const fichier of fichiers) {
      await page.goto(pathToFileURL(join(dossier, "ecrans", fichier)).href);
      const mesures = await page.evaluate(() => ({
        defile: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        haut: document.documentElement.scrollHeight,
        petits: [...document.querySelectorAll("a[href], button, input, textarea")]
          .filter((el) => el.getBoundingClientRect().height < 44)
          .map((el) => el.outerHTML.slice(0, 50))
      }));
      assert.ok(mesures.defile <= 0, `${fichier} défile de côté`);
      assert.ok(mesures.haut <= 844 + 1, `${fichier} dépasse la hauteur de 844 px : ${mesures.haut}`);
      assert.deepEqual(mesures.petits, [], `${fichier} : cibles trop petites`);
    }
  });
});
