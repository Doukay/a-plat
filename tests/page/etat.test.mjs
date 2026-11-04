import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { avecPage } from "./aide.mjs";

const require = createRequire(import.meta.url);
const { validerPlan } = require("../../skills/a-plat/modele/a-plat/logique.js");

function lirePlan(fixture) {
  const texte = readFileSync(new URL(`../fixtures/${fixture}/plan.js`, import.meta.url), "utf8");
  const fenetre = {};
  vm.runInNewContext(texte, { window: fenetre });
  return fenetre.A_PLAT;
}

const textePrincipal = (page) => page.locator("#vue").innerText();
const lignes = (page) => page.locator("li.ligne");

// ---------------------------------------------------------------- plan.js absent ou cassé

test("sans plan.js, la page dit que plan.js est introuvable et quoi faire", async () => {
  await avecPage("complet", { retirer: ["plan.js"] }, async ({ page }) => {
    const texte = await textePrincipal(page);
    assert.match(texte, /plan\.js est introuvable/);
    assert.match(texte, /Demandez à Claude/);
    assert.equal(await page.locator("nav a").count(), 3, "la barre reste là, la page n'est pas blanche");
  });
});

test("avec un plan.js à la syntaxe cassée, la page dit que plan.js contient une erreur et quoi faire", async () => {
  await avecPage("plans-pieges/casse", {}, async ({ page }) => {
    const texte = await textePrincipal(page);
    assert.match(texte, /plan\.js contient une erreur/);
    assert.match(texte, /Demandez à Claude de le corriger/);
    assert.doesNotMatch(texte, /introuvable/);
  });
});

test("avec un plan refusé par le contrôle, la page montre chaque erreur en français", async () => {
  const erreurs = validerPlan(lirePlan("plans-pieges/refuse"));
  assert.ok(erreurs.length >= 3, "la fixture doit provoquer plusieurs erreurs");
  await avecPage("plans-pieges/refuse", {}, async ({ page }) => {
    const texte = await textePrincipal(page);
    for (const erreur of erreurs) assert.ok(texte.includes(erreur), `erreur absente de la page : ${erreur}`);
    assert.match(texte, /Demandez à Claude/);
    assert.equal(await page.locator("li.ligne").count(), 0, "aucune liste n'est montrée à moitié");
  });
});

// ---------------------------------------------------------------- l'état des lieux

test("avec le plan complet, chaque page montre son état, sa raison et sa source", async () => {
  const plan = lirePlan("complet");
  await avecPage("complet", {}, async ({ page }) => {
    assert.equal(await lignes(page).count(), plan.etatDesLieux.length);
    const premiere = lignes(page).nth(0);
    const texte = await premiere.innerText();
    assert.match(texte, /Fiche d'un outil/);
    assert.match(texte, /À compléter/);
    assert.match(texte, /Rien n'est prévu quand l'outil est déjà prêté\./);
    assert.match(texte, /src\/fiche\.js/);
    assert.match(texte, /A2/);
    const seconde = await lignes(page).nth(1).innerText();
    assert.match(seconde, /Existe/);
    assert.match(seconde, /src\/pret\.js/);
  });
});

test("les quatre états ont chacun leur mot, et les pages sont rangées par groupe", async () => {
  await avecPage("plans-pieges/quatre-etats", {}, async ({ page }) => {
    const mots = await page.locator("li.ligne .etat").allTextContents();
    assert.deepEqual(mots.map((m) => m.trim()), ["Existe", "À compléter", "Manque", "Existe", "Prévue"]);
    const titres = await page.locator("#vue h3").allTextContents();
    assert.deepEqual(titres.map((t) => t.trim()), ["Trouver un outil", "Compte", "Prêter"]);
    const compte = await page.locator("#vue section", { has: page.locator("h3", { hasText: "Compte" }) }).locator("li.ligne").allInnerTexts();
    assert.equal(compte.length, 2);
    assert.match(compte[0] + compte[1], /Mot de passe oublié/);
    assert.match(compte[0] + compte[1], /Mon profil/);
  });
});

test("le haut de la page compte les pages par état", async () => {
  await avecPage("plans-pieges/quatre-etats", {}, async ({ page }) => {
    const resume = (await page.locator("#resume").innerText()).replace(/\s+/g, " ").trim();
    assert.equal(resume, "2 existent · 1 à compléter · 1 manque · 1 prévue");
  });
  await avecPage("complet", {}, async ({ page }) => {
    const resume = (await page.locator("#resume").innerText()).replace(/\s+/g, " ").trim();
    assert.equal(resume, "1 existe · 1 à compléter");
  });
});

test("aConfirmer: true affiche « à essayer pour confirmer », et seulement pour cette page", async () => {
  await avecPage("complet", {}, async ({ page }) => {
    assert.match(await lignes(page).nth(0).innerText(), /à essayer pour confirmer/);
    assert.doesNotMatch(await lignes(page).nth(1).innerText(), /à essayer pour confirmer/);
  });
});

test("les codes d'écran d'une page sont montrés", async () => {
  await avecPage("plans-pieges/quatre-etats", {}, async ({ page }) => {
    const texte = await lignes(page).nth(1).innerText();
    assert.match(texte, /A2/);
    assert.match(texte, /A3/);
    assert.doesNotMatch(await lignes(page).nth(2).innerText(), /Écrans?\s*:/, "pas d'écran cité, rien à montrer");
  });
});

test("un état des lieux vide montre comment demander la liste à Claude", async () => {
  await avecPage("plans-pieges/etat-vide", {}, async ({ page }) => {
    const texte = await textePrincipal(page);
    assert.match(texte, /Demandez à Claude/);
    assert.match(texte, /état des lieux/i);
    assert.equal(await lignes(page).count(), 0);
  });
});

// ---------------------------------------------------------------- textes piégeux

test("du HTML dans le plan s'affiche comme du texte et ne s'exécute pas", async () => {
  await avecPage("plans-pieges/titre-piege", {}, async ({ page }) => {
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.PIEGE), undefined);
    assert.equal(await page.locator("img").count(), 0, "aucune image ne doit avoir été créée");
    assert.equal(await page.locator("#vue script").count(), 0);
    const texte = await lignes(page).nth(0).innerText();
    assert.ok(texte.includes('<img src=x onerror="window.PIEGE=1">'), "le titre doit apparaître tel quel, en texte");
    assert.ok(texte.includes("<script>window.PIEGE=1</script>"));
    assert.ok(texte.includes("« bonjour » & \"au revoir\""));
    const titreDeGroupe = await page.locator("#vue h3").innerText();
    assert.ok(titreDeGroupe.includes('<b onmouseover="window.PIEGE=1">Groupe</b> "à guillemets"'));
    assert.ok((await page.locator("h1").innerText()).includes('<img src=x onerror="window.PIEGE=1">Projet'));
    assert.ok((await page.title()).includes("Projet"));
  });
});

test("un titre de 300 caractères ne crée pas de défilement horizontal à 390 px", async () => {
  await avecPage("plans-pieges/titre-long", { largeur: 390, hauteur: 844 }, async ({ page }) => {
    const largeurs = await page.evaluate(() => ({
      defilement: document.documentElement.scrollWidth,
      fenetre: document.documentElement.clientWidth
    }));
    assert.ok(largeurs.defilement <= largeurs.fenetre, `la page déborde : ${largeurs.defilement} > ${largeurs.fenetre}`);
    const texte = await lignes(page).nth(0).innerText();
    assert.ok(texte.includes("Mot".repeat(100)), "le titre long reste entier");
  });
});

// ---------------------------------------------------------------- tailles et couleurs

for (const largeur of [390, 1320]) {
  for (const schema of ["light", "dark"]) {
    test(`à ${largeur} px, en ${schema === "light" ? "clair" : "sombre"} : aucun débordement, aucune erreur, aucune requête en ligne`, async () => {
      for (const fixture of ["plans-pieges/quatre-etats", "plans-pieges/titre-long", "complet"]) {
        await avecPage(fixture, { largeur, hauteur: largeur === 390 ? 844 : 900, schema }, async (contexte) => {
          const { page } = contexte;
          const mesures = await page.evaluate(() => ({
            defilement: document.documentElement.scrollWidth,
            fenetre: document.documentElement.clientWidth,
            fond: getComputedStyle(document.body).backgroundColor
          }));
          assert.ok(mesures.defilement <= mesures.fenetre, `${fixture} déborde : ${mesures.defilement} > ${mesures.fenetre}`);
          assert.deepEqual(contexte.console, [], `${fixture} : erreurs de console`);
          assert.deepEqual(contexte.erreurs, [], `${fixture} : erreurs de page`);
          assert.deepEqual(contexte.requetes, [], `${fixture} : requêtes hors file://`);
          const clair = mesures.fond === "rgb(238, 240, 243)";
          assert.equal(clair, schema === "light", `le fond (${mesures.fond}) ne suit pas le mode ${schema}`);
        });
      }
    });
  }
}

test("la page ne demande rien en dehors de file://", async () => {
  await avecPage("complet", {}, async ({ page, requetes }) => {
    await page.waitForTimeout(300);
    assert.deepEqual(requetes, []);
  });
});

test("les liens de la barre font au moins 44 px de haut, à 390 px", async () => {
  await avecPage("complet", { largeur: 390, hauteur: 844 }, async ({ page }) => {
    const hauteurs = await page.locator("nav a").evaluateAll((liens) => liens.map((lien) => lien.getBoundingClientRect().height));
    assert.equal(hauteurs.length, 3);
    for (const hauteur of hauteurs) assert.ok(hauteur >= 44, `lien trop bas : ${hauteur}`);
  });
});

test("la page respecte « réduire les animations »", async () => {
  const duree = (mouvement) => avecPage("complet", { mouvement }, ({ page }) =>
    page.locator("nav a").first().evaluate((lien) => getComputedStyle(lien).transitionDuration));
  assert.equal(await duree("reduce"), "0s");
  assert.notEqual(await duree("no-preference"), "0s", "sans réglage, la barre garde sa transition");
});

// ---------------------------------------------------------------- la barre et les adresses

test("la barre montre les trois vues, avec la vue courante marquée", async () => {
  await avecPage("complet", {}, async ({ page }) => {
    const noms = (await page.locator("nav a").allTextContents()).map((n) => n.trim());
    assert.deepEqual(noms, ["État des lieux", "Vue d'ensemble", "Écrans"]);
    assert.equal(await page.locator('nav a[aria-current="page"]').innerText(), "État des lieux");
  });
});

test("une adresse inconnue ou vide revient à l'état des lieux", async () => {
  await avecPage("complet", { adresse: "n-importe-quoi" }, async ({ page }) => {
    assert.match(await textePrincipal(page), /Fiche d'un outil/);
    assert.equal(await page.evaluate(() => location.hash), "#etat");
  });
  await avecPage("complet", {}, async ({ page }) => {
    assert.match(await textePrincipal(page), /Fiche d'un outil/);
  });
});

test("les vues d'ensemble et d'écran seul sont marquées dans la barre et ne montrent pas l'état des lieux", async () => {
  await avecPage("complet", { adresse: "ensemble" }, async ({ page }) => {
    assert.equal(await page.locator('nav a[aria-current="page"]').innerText(), "Vue d'ensemble");
    assert.equal(await page.locator("#vue .rangee").count(), 2);
    assert.equal(await lignes(page).count(), 0);
  });
  await avecPage("complet", { adresse: "ecran/A2" }, async ({ page }) => {
    assert.equal(await page.locator('nav a[aria-current="page"]').innerText(), "Écrans");
    assert.equal(await page.locator("#vue .ecran-code").innerText(), "A2");
  });
});

test("toucher un lien de la barre change de vue sans recharger la page", async () => {
  await avecPage("complet", {}, async ({ page }) => {
    await page.locator("nav a", { hasText: "Vue d'ensemble" }).click();
    assert.equal(await page.evaluate(() => location.hash), "#ensemble");
    assert.equal(await page.locator("#vue .rangee").count(), 2);
    await page.locator("nav a", { hasText: "Écrans" }).click();
    assert.equal(await page.evaluate(() => location.hash), "#ecran/A1");
    await page.locator("nav a", { hasText: "État des lieux" }).click();
    assert.equal(await lignes(page).count(), 2);
  });
});

// ---------------------------------------------------------------- le stockage

test("le stockage garde et relit une valeur, même quand le navigateur le refuse", async () => {
  await avecPage("complet", {}, async ({ page }) => {
    const relu = await page.evaluate(() => {
      window.APlatMoteur.garderStock("essai", { a: 1 });
      return window.APlatMoteur.lireStock("essai");
    });
    assert.deepEqual(relu, { a: 1 });
    assert.equal(await page.evaluate(() => window.APlatMoteur.lireStock("absent")), null);
  });
  const refus = () => {
    Object.defineProperty(window, "localStorage", {
      get() { throw new Error("stockage refusé"); }
    });
  };
  await avecPage("complet", { avant: refus }, async ({ page, erreurs }) => {
    const relu = await page.evaluate(() => {
      window.APlatMoteur.garderStock("essai", [1, 2]);
      return window.APlatMoteur.lireStock("essai");
    });
    assert.deepEqual(relu, [1, 2], "la valeur reste en mémoire");
    assert.equal(await page.evaluate(() => window.APlatMoteur.lireStock("absent")), null);
    assert.deepEqual(erreurs, []);
  });
});
