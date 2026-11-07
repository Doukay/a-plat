// La page à trois niveaux : la planche (#ensemble), une rangée (#rangee/A), un écran (#ecran/A2),
// avec la barre noire du haut (le fil, la recherche, les deux vues) et la colonne du téléphone.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { avecPage, genererFixture, nettoyerFixtures, ecranHtml } from "./aide.mjs";

after(nettoyerFixtures);

const espaces = (valeur) => valeur.replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------- une fixture de trois rangées

const ecran = (code, titre, plus = {}) => ({ code, titre, fichier: `${code}.html`, largeur: 390, hauteur: 844, statut: "a-relire", actuel: null, ...plus });

function troisRangees() {
  const plan = {
    version: 1,
    projet: "Essai",
    etatDesLieux: [
      { page: "Accueil", groupe: "Trouver", etat: "existe", raison: "La liste s'affiche.", source: "src/accueil.js", ecrans: ["A1"] },
      { page: "Fiche", groupe: "Trouver", etat: "a-completer", raison: "Rien quand l'objet est prêté.", source: "src/fiche.js", ecrans: ["A2", "A3"] },
      { page: "Demande", groupe: "Demander", etat: "manque", raison: "Aucun formulaire.", source: "src/demande.js", ecrans: ["B1"] },
      { page: "Aide", groupe: "Autres", etat: "prevue", raison: "Pour plus tard.", source: "docs/notes.md", ecrans: [] }
    ],
    rangees: [
      {
        id: "A", titre: "Trouver un outil", notes: [
          { type: "a-trancher", date: "2026-11-05", texte: "Faut-il une carte ?" },
          { type: "decision", date: "2026-11-04", texte: "Caution retirée.", ancien: "Caution de 20 €", ecrans: ["A2"] }
        ]
      },
      { id: "B", titre: "Demander un prêt", notes: [{ type: "a-coder", date: "2026-11-03", texte: "Choix des dates.", ecrans: ["B1"] }] },
      { id: "C", titre: "Suivre mes prêts", notes: [{ type: "source", date: "2026-11-02", texte: "Lu dans src/prets.js." }] },
      { id: "D", titre: "Vide", notes: [] }
    ],
    ecrans: [
      ecran("A1", "Accueil", { rangee: "A", statut: "valide" }),
      ecran("A2", "Fiche d'un outil", { rangee: "A" }),
      ecran("A3", "Réglages", { rangee: "A", inchange: true }),
      ecran("B1", "Demande de prêt", { rangee: "B" }),
      ecran("B2", "Tableau de bord", { rangee: "B", largeur: 1280, hauteur: 800 }),
      ecran("C1", "Écran très long", { rangee: "C" })
    ]
  };
  const ecrans = {};
  for (const e of plan.ecrans) ecrans[`${e.code}.html`] = ecranHtml(e.code, `<h1>${e.titre}</h1><p>Écran ${e.code}.</p>`);
  ecrans["C1.html"] = ecranHtml("C1", '<h1>Écran très long</h1><div style="height:1900px"></div><p>Fin</p>');
  return genererFixture({ plan, ecrans });
}

const FIXTURE = troisRangees();

// La position et le zoom de la planche, lus dans sa transformation.
const posePlanche = (page) => page.locator(".planche").evaluate((el) => {
  const m = new DOMMatrix(getComputedStyle(el).transform);
  return { x: m.e, y: m.f, z: m.a };
});
const niveau = (page) => page.locator(".planche-niveau").innerText();
const pasDeDefilementDeCote = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

// ---------------------------------------------------------------- la barre

test("le fil dit où l'on est à chaque niveau, et la flèche remonte d'un niveau", async () => {
  await avecPage(FIXTURE, { adresse: "ecran/A2" }, async ({ page }) => {
    const fil = () => page.locator(".fil li").allInnerTexts().then((t) => t.map(espaces));
    const ici = () => page.locator('.fil [aria-current="page"]').innerText();
    const remonter = page.locator("#remonter");

    assert.deepEqual(await fil(), ["À plat · Essai", "A Trouver un outil", "A2"]);
    assert.equal(await ici(), "A2");
    assert.deepEqual(await page.locator(".fil a").evaluateAll((els) => els.map((el) => el.getAttribute("href"))), ["#ensemble", "#rangee/A"]);
    assert.equal(await remonter.getAttribute("href"), "#rangee/A");
    assert.match(await remonter.getAttribute("aria-label"), /^Remonter : A Trouver un outil$/);
    assert.equal(await page.locator(".barre-vues a[aria-current]").count(), 0, "un écran n'est aucune des deux vues");

    await remonter.click();
    await page.waitForFunction(() => document.body.dataset.vue === "rangee");
    assert.equal(await page.evaluate(() => location.hash), "#rangee/A");
    assert.deepEqual(await fil(), ["À plat · Essai", "A Trouver un outil"]);
    assert.equal(await ici(), "A Trouver un outil");
    assert.equal(await remonter.getAttribute("href"), "#ensemble");
    assert.equal(await page.locator(".barre-vues a[aria-current]").count(), 0);

    // Un seul aria-current dans toute la page, à chaque niveau.
    const courants = () => page.locator('[aria-current="page"]').allInnerTexts();
    await remonter.click();
    await page.waitForFunction(() => document.body.dataset.vue === "ensemble");
    assert.deepEqual(await fil(), ["À plat · Essai"]);
    assert.equal(await remonter.isVisible(), false, "pas de flèche à la racine");
    assert.deepEqual(await courants(), ["Vue d'ensemble"], "c'est le lien de droite qui marque la vue d'ensemble");

    await page.locator(".barre-vues a", { hasText: "État des lieux" }).click();
    await page.waitForFunction(() => document.body.dataset.vue === "etat");
    assert.deepEqual(await fil(), ["À plat · Essai", "État des lieux"]);
    assert.equal(await page.locator(".fil a").getAttribute("href"), "#ensemble", "la racine du fil est un lien");
    assert.equal(await remonter.isVisible(), false, "l'état des lieux n'est pas sous la vue d'ensemble");
    assert.deepEqual(await courants(), ["État des lieux"]);

    for (const adresse of ["#rangee/A", "#ecran/A2"]) {
      await page.evaluate((a) => { location.hash = a; }, adresse);
      await page.waitForFunction((a) => document.body.dataset.vue === a.slice(1).split("/")[0], adresse);
      assert.equal((await courants()).length, 1, `${adresse} : un seul aria-current`);
    }
  });
});

test("une rangée ou un écran inconnus restent dans le fil, avec la flèche vers la vue d'ensemble", async () => {
  await avecPage(FIXTURE, { adresse: "rangee/Z" }, async ({ page }) => {
    assert.deepEqual((await page.locator(".fil li").allInnerTexts()).map(espaces), ["À plat · Essai", "Z"]);
    assert.equal(await page.locator("#remonter").getAttribute("href"), "#ensemble");
  });
});

test("la barre est noire et lisible, en clair comme en sombre", async () => {
  for (const schema of ["light", "dark"]) {
    for (const adresse of ["etat", "ensemble", "rangee/A", "ecran/A2"]) {
      await avecPage(FIXTURE, { adresse, schema }, async ({ page }) => {
        await page.waitForTimeout(300); // la couleur des liens passe en 0,12 s
        const couleurs = await page.evaluate(() => {
          const style = (selecteur, propriete) => getComputedStyle(document.querySelector(selecteur))[propriete];
          return {
            fond: style(".barre", "backgroundColor"),
            ici: style(".fil-ici", "color"),
            lien: style(".barre-vues a:not([aria-current])", "color"),
            courant: document.querySelector('.barre-vues a[aria-current="page"]')
              ? getComputedStyle(document.querySelector('.barre-vues a[aria-current="page"]')).color : null,
            champ: style("#recherche", "backgroundColor"),
            texteDuChamp: style("#recherche", "color")
          };
        });
        assert.equal(couleurs.fond, "rgb(0, 0, 0)", `${schema} ${adresse} : noir pur`);
        assert.equal(couleurs.ici, "rgb(245, 245, 247)");
        assert.equal(couleurs.lien, "rgb(161, 161, 166)");
        if (couleurs.courant) assert.equal(couleurs.courant, "rgb(245, 245, 247)", "la vue ouverte est en blanc");
        assert.equal(couleurs.champ, "rgb(29, 29, 31)");
        assert.equal(couleurs.texteDuChamp, "rgb(245, 245, 247)");
      });
    }
  }
  // La liste des résultats, elle, suit le thème de la page.
  const fondDesResultats = (schema) => avecPage(FIXTURE, { adresse: "etat", schema }, async ({ page }) => {
    await page.locator("#recherche").fill("a");
    return page.locator("#resultats").evaluate((el) => getComputedStyle(el).backgroundColor);
  });
  assert.equal(await fondDesResultats("light"), "rgb(255, 255, 255)");
  assert.equal(await fondDesResultats("dark"), "rgb(29, 29, 31)");
});

// ---------------------------------------------------------------- la recherche

test("la recherche trouve un écran par son code ou un mot de son titre, sans accents ni majuscules", async () => {
  await avecPage(FIXTURE, { adresse: "etat" }, async ({ page }) => {
    const champ = page.locator("#recherche");
    const trouves = () => page.locator("#resultats [data-code]").evaluateAll((els) => els.map((el) => el.dataset.code));
    await champ.fill("REGLAGES");
    assert.deepEqual(await trouves(), ["A3"]);
    assert.equal(await champ.getAttribute("aria-expanded"), "true");
    await champ.fill("écran TRÈS");
    assert.deepEqual(await trouves(), ["C1"], "deux mots, chacun doit y être");
    await champ.fill("ecran tres");
    assert.deepEqual(await trouves(), ["C1"]);
    await champ.fill("b2");
    assert.deepEqual(await trouves(), ["B2"]);
    await champ.fill("zzz");
    assert.deepEqual(await trouves(), []);
    assert.match(await page.locator("#resultats").innerText(), /Aucun écran ne correspond/);
    await champ.fill("");
    assert.equal(await page.locator("#resultats").isVisible(), false);
  });
});

test("la recherche montre 10 résultats au plus, le code exact d'abord, et Entrée ouvre le premier", async () => {
  const plan = {
    version: 1, projet: "Beaucoup", etatDesLieux: [], rangees: [{ id: "P", titre: "Pages", notes: [] }],
    ecrans: Array.from({ length: 15 }, (_, i) => ecran(`P${i + 1}`, `Page numéro ${i + 1}`, { rangee: "P" }))
  };
  const ecrans = {};
  for (const e of plan.ecrans) ecrans[`${e.code}.html`] = ecranHtml(e.code, `<h1>${e.titre}</h1>`);
  // P12 en premier dans le plan : « p1 » doit quand même donner P1 en tête.
  plan.ecrans.unshift(plan.ecrans.splice(11, 1)[0]);
  const dossier = genererFixture({ plan, ecrans });
  await avecPage(dossier, { adresse: "etat" }, async ({ page }) => {
    const champ = page.locator("#recherche");
    await champ.fill("page");
    assert.equal(await page.locator("#resultats [data-code]").count(), 10);
    await champ.fill("p1");
    const codes = await page.locator("#resultats [data-code]").evaluateAll((els) => els.map((el) => el.dataset.code));
    assert.equal(codes[0], "P1", "le code exact vient d'abord");
    assert.ok(codes.includes("P12"));
    await champ.press("Enter");
    await page.waitForFunction(() => location.hash === "#ecran/P1");
    assert.equal(await page.locator("#vue .ecran-code").innerText(), "P1");
    assert.equal(await champ.inputValue(), "", "le champ est vidé");
    assert.equal(await page.locator("#resultats").isVisible(), false);
  });
});

test("dans la recherche, les flèches parcourent la liste, Entrée ouvre l'écran choisi, Échap ferme la liste", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble" }, async ({ page }) => {
    const champ = page.locator("#recherche");
    const actif = () => page.locator('#resultats [aria-selected="true"]').getAttribute("data-code");
    await champ.fill("a");  // A1, A2, A3 viennent d'abord
    assert.equal(await actif(), "A1");
    assert.equal(await champ.getAttribute("aria-activedescendant"), await page.locator('#resultats [aria-selected="true"]').getAttribute("id"));
    await champ.press("ArrowDown");
    assert.equal(await actif(), "A2");
    await champ.press("ArrowUp");
    await champ.press("ArrowUp");
    const tous = await page.locator("#resultats [data-code]").count();
    assert.equal(await actif(), await page.locator("#resultats [data-code]").nth(tous - 1).getAttribute("data-code"), "vers le haut depuis le premier : le dernier");
    await champ.press("Escape");
    assert.equal(await page.locator("#resultats").isVisible(), false, "Échap ferme la liste");
    assert.equal(await champ.inputValue(), "a", "le texte reste");
    assert.equal(await page.evaluate(() => document.activeElement.id), "recherche");
    await champ.press("ArrowDown"); // rouvre
    await champ.press("ArrowDown");
    assert.equal(await actif(), "A2");
    await champ.press("Enter");
    await page.waitForFunction(() => location.hash === "#ecran/A2");
    // Un clic sur un résultat ouvre aussi l'écran.
    await champ.fill("b1");
    await page.locator('#resultats [data-code="B1"]').click();
    await page.waitForFunction(() => location.hash === "#ecran/B1");
  });
});

test("la touche / met le curseur dans la recherche, sauf quand on écrit déjà dans un champ", async () => {
  await avecPage(FIXTURE, { adresse: "ecran/A2" }, async ({ page }) => {
    await page.locator("#vue .ecran-code").click();
    await page.keyboard.press("/");
    assert.equal(await page.evaluate(() => document.activeElement.id), "recherche");
    assert.equal(await page.locator("#recherche").inputValue(), "", "le / n'est pas écrit dans le champ");
    await page.keyboard.type("a/b");
    assert.equal(await page.locator("#recherche").inputValue(), "a/b", "dans le champ, / s'écrit");
    await page.locator("#recherche").press("Escape");
    await page.locator("#recherche").press("Escape");
    // Dans le champ d'une correction, / s'écrit aussi.
    await page.evaluate(() => window.APlatMoteur.surElementTouche("A2", "Titre", {}));
    await page.locator("#correction-champ").waitFor();
    await page.keyboard.type("1/2");
    assert.equal(await page.locator("#correction-champ").inputValue(), "1/2");
    assert.equal(await page.evaluate(() => document.activeElement.id), "correction-champ");
  });
});

// ---------------------------------------------------------------- la planche (niveau 1)

test("la planche pose les rangées dans l'ordre, avec leurs titres-liens, les noms, les badges et les notes", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page, erreurs, requetes }) => {
    assert.equal(await page.evaluate(() => document.body.dataset.mise), "plein");
    const rangees = page.locator(".planche .rangee");
    assert.deepEqual(await rangees.evaluateAll((els) => els.map((el) => el.dataset.rangee)), ["A", "B", "C"], "D, vide, n'apparaît pas");
    // L'une sous l'autre.
    const hauts = [];
    for (const rangee of await rangees.all()) hauts.push((await rangee.boundingBox()).y);
    assert.ok(hauts[0] < hauts[1] && hauts[1] < hauts[2]);
    const liens = page.locator(".planche .rangee-titre a");
    assert.deepEqual(await liens.evaluateAll((els) => els.map((el) => el.getAttribute("href"))), ["#rangee/A", "#rangee/B", "#rangee/C"]);
    assert.deepEqual((await page.locator(".planche .rangee-compte").allInnerTexts()).map(espaces), ["3 écrans", "2 écrans", "1 écran"]);
    // Le nom au-dessus de chaque écran : code, badges, titre.
    const nomA1 = page.locator('.planche .vignette[data-code="A1"] .vignette-lien');
    assert.equal(espaces(await nomA1.locator(".vignette-code").innerText()), "A1");
    // Le mot reste dans la page pour les lecteurs d'écran ; à 30 %, la planche montre la marque courte.
    assert.equal(espaces(await nomA1.locator(".badge-valide .badge-mot").innerText()), "Validé");
    assert.equal(await nomA1.locator(".badge-valide .badge-court").isVisible(), true);
    // A3 est inchangé et sa page est à compléter : ce qui manque ne se voit pas à l'écran.
    assert.equal(espaces(await page.locator('.planche .vignette[data-code="A3"] .badge-inchange .badge-mot').innerText()), "Inchangé à l'écran");
    const nom = await nomA1.boundingBox();
    const image = await page.locator('.planche .vignette[data-code="A1"] .cadre-boite').boundingBox();
    assert.ok(nom.y + nom.height <= image.y + 1, "le nom est au-dessus de l'écran");
    // Les notes : celles de la rangée sous son titre, celles d'un écran sous cet écran.
    const rangeeA = rangees.nth(0);
    assert.match(await rangeeA.locator(".notes-generales").innerText(), /Faut-il une carte \?/);
    assert.match(await rangeeA.locator('.vignette[data-code="A2"] .notes-ecran').innerText(), /Caution retirée\./);
    assert.equal(await rangeeA.locator('.vignette[data-code="A1"] .note').count(), 0);
    const titre = await rangeeA.locator(".rangee-titre").boundingBox();
    const generales = await rangeeA.locator(".notes-generales").boundingBox();
    assert.ok(titre.y < generales.y && generales.y + generales.height <= image.y, "titre, puis notes de la rangée, puis écrans");
    assert.ok(await pasDeDefilementDeCote(page));
    assert.deepEqual(erreurs, []);
    assert.deepEqual(requetes, []);
  });
});

test("la planche commence à 30 %, et ses titres et ses noms restent à la même taille à l'écran, à tout zoom", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    assert.equal(await niveau(page), "30 %");
    const tailles = () => page.evaluate(() => {
      const z = new DOMMatrix(getComputedStyle(document.querySelector(".planche")).transform).a;
      const vu = (selecteur) => parseFloat(getComputedStyle(document.querySelector(selecteur)).fontSize) * z;
      return { z, titre: vu(".planche .rangee-titre"), nom: vu(".planche .vignette-lien"), note: vu(".planche .note") };
    });
    const depart = await tailles();
    assert.ok(Math.abs(depart.z - 0.3) < 0.001);
    assert.ok(Math.abs(depart.titre - 20) < 0.5, `titre de rangée : ${depart.titre}`);
    assert.ok(Math.abs(depart.nom - 12.5) < 0.5, `nom d'écran : ${depart.nom}`);
    assert.ok(Math.abs(depart.note - 13) < 0.5, `note : ${depart.note}`);
    await page.getByRole("button", { name: "Réduire le zoom" }).click();
    await page.getByRole("button", { name: "Réduire le zoom" }).click();
    const loin = await tailles();
    assert.ok(loin.z < 0.2);
    assert.ok(Math.abs(loin.titre - 20) < 0.5 && Math.abs(loin.nom - 12.5) < 0.5, "toujours lisibles");
    await page.getByRole("button", { name: "100 %, taille réelle" }).click();
    const reel = await tailles();
    assert.equal(reel.z, 1);
    assert.ok(Math.abs(reel.titre - 20) < 0.5);
  });
});

test("les boutons du zoom changent le niveau affiché, et « Tout voir » montre toute la planche", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const commandes = page.getByRole("group", { name: "Zoom de la planche" });
    for (const nom of ["Réduire le zoom", "Agrandir le zoom", "Tout voir", "100 %, taille réelle"]) {
      const bouton = commandes.getByRole("button", { name: nom });
      assert.equal(await bouton.count(), 1, `bouton « ${nom} »`);
      const boite = await bouton.boundingBox();
      assert.ok(boite.height >= 44, `${nom} : ${boite.height} px de haut`);
    }
    const zone = await commandes.boundingBox();
    assert.ok(zone.x < 40 && zone.y + zone.height > 900 - 40, "en bas à gauche");
    await commandes.getByRole("button", { name: "Agrandir le zoom" }).click();
    assert.equal(await niveau(page), "38 %");
    await commandes.getByRole("button", { name: "Réduire le zoom" }).click();
    assert.equal(await niveau(page), "30 %");
    await commandes.getByRole("button", { name: "100 %, taille réelle" }).click();
    assert.equal(await niveau(page), "100 %");
    // Trois rangées et leurs titres ne tiennent en hauteur qu'à moins de 15 % : « Tout voir »
    // s'arrête à 15 %, toutes les colonnes dans la largeur, le haut à gauche à sa place.
    await commandes.getByRole("button", { name: "Tout voir" }).click();
    assert.equal(await niveau(page), "15 %");
    const fenetre = await page.locator(".planche-fenetre").boundingBox();
    const planche = await page.locator(".planche").boundingBox();
    assert.ok(planche.x >= fenetre.x && planche.y >= fenetre.y, "le haut à gauche est dans la fenêtre");
    assert.ok(planche.x + planche.width <= fenetre.x + fenetre.width + 1, "toutes les colonnes tiennent en largeur");
    assert.equal(await page.locator(".planche-entete").evaluate((el) => el.classList.contains("efface")), false, "le titre revient");
  });
});

test("« Tout voir » montre toute la planche quand elle tient au-dessus de 15 %", async () => {
  const plan = {
    version: 1, projet: "Petit", etatDesLieux: [], rangees: [{ id: "A", titre: "Seule rangée", notes: [] }],
    ecrans: ["A1", "A2", "A3", "A4", "A5"].map((code) => ecran(code, `Écran ${code}`, { rangee: "A" }))
  };
  const ecrans = {};
  for (const e of plan.ecrans) ecrans[`${e.code}.html`] = ecranHtml(e.code, `<h1>${e.titre}</h1>`);
  await avecPage(genererFixture({ plan, ecrans }), { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await page.getByRole("button", { name: "Tout voir" }).click();
    const fenetre = await page.locator(".planche-fenetre").boundingBox();
    const planche = await page.locator(".planche").boundingBox();
    assert.ok(planche.x >= fenetre.x && planche.y >= fenetre.y);
    assert.ok(planche.x + planche.width <= fenetre.x + fenetre.width + 1 && planche.y + planche.height <= fenetre.y + fenetre.height + 1,
      `toute la planche tient : ${JSON.stringify(planche)} dans ${JSON.stringify(fenetre)}`);
    const z = (await posePlanche(page)).z;
    assert.ok(z >= 0.15 && z <= 1, `zoom : ${z}`);
    // Le plus grand zoom qui tient : un cran au-dessus, ça ne tient plus.
    assert.ok(planche.x + planche.width > fenetre.x + fenetre.width - 60 || planche.y + planche.height > fenetre.y + fenetre.height - 60,
      "la planche remplit la fenêtre dans un sens au moins");
  });
});

test("dans la planche, les notes d'un écran trop étroit se replient en un bouton qui les déplie sans ouvrir l'écran", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const vignette = page.locator('.planche .vignette[data-code="A2"]');
    const bouton = vignette.getByRole("button", { name: "1 note" });
    const liste = vignette.locator(".notes-ecran");
    // À 30 %, l'écran fait 117 px de large à l'écran : ses notes n'y tiendraient qu'en colonne.
    assert.equal(await bouton.isVisible(), true);
    assert.equal(await bouton.getAttribute("aria-expanded"), "false");
    assert.equal(await liste.isVisible(), false);
    await bouton.click();
    assert.equal(await page.evaluate(() => location.hash), "#ensemble", "le bouton n'ouvre pas l'écran");
    assert.equal(await bouton.getAttribute("aria-expanded"), "true");
    assert.equal(await liste.isVisible(), true);
    const ouverte = await liste.boundingBox();
    assert.ok(Math.abs(ouverte.width - 300) < 2, `dépliées sur 300 px à l'écran : ${ouverte.width}`);
    assert.match(await liste.innerText(), /Décision[\s\S]*Caution retirée\./);
    const taille = await liste.locator(".note-texte").evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize) * new DOMMatrix(getComputedStyle(document.querySelector(".planche")).transform).a);
    assert.ok(Math.abs(taille - 13) < 0.5, `texte lisible : ${taille}`);
    await bouton.click();
    assert.equal(await liste.isVisible(), false, "un second toucher les replie");
    // Les notes de toute la rangée, elles, restent lisibles sous le titre.
    assert.equal(await page.locator('.planche .rangee[data-rangee="A"] .notes-generales .note').isVisible(), true);
    // À 59 %, l'écran fait 230 px à l'écran : les notes se montrent en entier, sans bouton.
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Agrandir le zoom" }).click();
    assert.equal(await niveau(page), "59 %");
    assert.equal(await bouton.isVisible(), false);
    assert.equal(await liste.isVisible(), true);
    const ecran = await vignette.locator(".cadre-boite").boundingBox();
    const entiere = await liste.boundingBox();
    assert.ok(Math.abs(entiere.width - ecran.width) < 1 && entiere.y >= ecran.y + ecran.height, "à la largeur de l'écran, dessous");
  });
});

test("tirer la planche à la souris la déplace sans ouvrir d'écran, et le titre du projet s'efface", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const entete = page.locator(".planche-entete");
    assert.equal(espaces(await entete.locator(".planche-titre").innerText()), "Essai");
    assert.equal(await entete.evaluate((el) => el.classList.contains("efface")), false, "visible au départ");
    const avant = await posePlanche(page);
    const image = await page.locator('.planche .vignette[data-code="A2"] .cadre-boite').boundingBox();
    const depart = { x: image.x + image.width / 2, y: image.y + image.height / 2 };
    await page.mouse.move(depart.x, depart.y);
    await page.mouse.down();
    await page.mouse.move(depart.x + 100, depart.y + 40, { steps: 5 });
    await page.mouse.move(depart.x + 200, depart.y + 80, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => location.hash), "#ensemble", "aucun écran ouvert");
    const apres = await posePlanche(page);
    assert.ok(Math.abs(apres.x - avant.x - 200) < 1 && Math.abs(apres.y - avant.y - 80) < 1, `déplacée de ${apres.x - avant.x}, ${apres.y - avant.y}`);
    assert.equal(apres.z, avant.z);
    assert.equal(await entete.evaluate((el) => el.classList.contains("efface")), true, "le titre s'efface");
    // Un toucher simple, juste après, ouvre bien l'écran.
    const a1 = await page.locator('.planche .vignette[data-code="A1"] .cadre-boite').boundingBox();
    await page.mouse.click(a1.x + a1.width / 2, a1.y + a1.height / 2);
    await page.waitForFunction(() => location.hash === "#ecran/A1");
  });
});

test("la molette déplace la planche, Maj + molette de côté, Ctrl + molette zoome autour du pointeur", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await page.mouse.move(700, 500);
    const a = await posePlanche(page);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);
    const b = await posePlanche(page);
    assert.ok(Math.abs(b.y - (a.y - 300)) < 1 && Math.abs(b.x - a.x) < 1, `molette : ${b.x - a.x}, ${b.y - a.y}`);
    await page.keyboard.down("Shift");
    await page.mouse.wheel(0, 200);
    await page.keyboard.up("Shift");
    await page.waitForTimeout(100);
    const c = await posePlanche(page);
    assert.ok(Math.abs(c.x - (b.x - 200)) < 1 && Math.abs(c.y - b.y) < 1, `Maj + molette : ${c.x - b.x}, ${c.y - b.y}`);
    // Le point de la planche sous le pointeur reste sous le pointeur.
    const sous = { x: (700 - c.x) / c.z, y: (500 - 52 - c.y) / c.z };
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -200);
    await page.keyboard.up("Control");
    await page.waitForTimeout(100);
    const d = await posePlanche(page);
    assert.ok(d.z > c.z, "Ctrl + molette vers le haut agrandit");
    assert.ok(Math.abs(d.x + sous.x * d.z - 700) < 1 && Math.abs(d.y + sous.y * d.z - (500 - 52)) < 1, "zoom autour du pointeur");
    assert.ok(await pasDeDefilementDeCote(page));
  });
});

test("sur la planche, la hauteur d'un écran suit son message pret, et un lien pris au clavier est ramené en vue", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await page.getByRole("button", { name: "Tout voir" }).click();
    const boite = page.locator('.planche .vignette[data-code="C1"] .cadre-boite');
    await page.waitForFunction(() => document.querySelector('.planche .vignette[data-code="C1"] .cadre-boite').offsetHeight >= 2000);
    const hauteur = await boite.evaluate((el) => el.offsetHeight);
    assert.ok(hauteur >= 2000 && hauteur < 2300, `hauteur : ${hauteur}`);
    // À 100 %, la planche poussée loin vers le bas et la droite : C1 sort de la fenêtre.
    await page.getByRole("button", { name: "100 %, taille réelle" }).click();
    await page.mouse.move(700, 500);
    await page.mouse.wheel(-20000, -20000);
    const lien = page.locator('.planche .vignette[data-code="C1"] a.vignette-lien');
    await page.waitForFunction(() => document.querySelector('.planche .vignette[data-code="C1"] a').getBoundingClientRect().y > 900);
    await lien.focus();
    const vu = await lien.boundingBox();
    assert.ok(vu.y >= 52 && vu.y + vu.height <= 900 && vu.x >= 0 && vu.x < 1440, `ramené : ${JSON.stringify(vu)}`);
    assert.equal(await page.locator(".planche-fenetre").evaluate((el) => el.scrollTop + el.scrollLeft), 0);
  });
});

// ---------------------------------------------------------------- une rangée (niveau 2)

test("#rangee/A montre son titre en grand, ses écrans côte à côte à une taille de lecture, chacun avec son lien « Ouvrir »", async () => {
  await avecPage(FIXTURE, { adresse: "rangee/A", largeur: 1440, hauteur: 900 }, async ({ page, erreurs }) => {
    assert.equal(espaces(await page.locator("#vue h2").first().innerText()), "A Trouver un outil");
    assert.equal(await page.locator("#vue h2").first().evaluate((el) => getComputedStyle(el).fontSize), "34px");
    const cartes = page.locator(".rangee-carte");
    assert.deepEqual(await cartes.evaluateAll((els) => els.map((el) => el.dataset.code)), ["A1", "A2", "A3"]);
    const boites = [];
    for (const carte of await cartes.all()) boites.push(await carte.locator(".cadre-boite").boundingBox());
    assert.ok(boites[0].x < boites[1].x && boites[1].x < boites[2].x && Math.abs(boites[0].y - boites[1].y) < 1, "côte à côte");
    assert.ok(Math.abs(boites[0].width - 351) < 1, `téléphone à 90 % : ${boites[0].width}`);
    const a2 = cartes.nth(1);
    assert.equal(espaces(await a2.locator(".rangee-carte-code").innerText()), "A2");
    assert.equal(await a2.getByRole("link", { name: "Ouvrir A2 ›" }).getAttribute("href"), "#ecran/A2");
    assert.equal(espaces(await cartes.nth(0).locator(".badge-valide").innerText()), "Validé");
    assert.equal(espaces(await cartes.nth(2).locator(".badge-inchange").innerText()), "Inchangé à l'écran");
    // Les notes : sous la carte de l'écran, et celles de la rangée sous son titre.
    assert.match(await a2.locator(".notes-ecran").innerText(), /Décision[\s\S]*2026-11-04[\s\S]*Caution retirée\./);
    assert.equal(await a2.locator(".notes-ecran s").innerText(), "Caution de 20 €");
    const titre = await page.locator("#vue h2").first().boundingBox();
    const generales = await page.locator(".vue-rangee-tete .notes-generales").boundingBox();
    assert.ok(generales.y > titre.y && generales.y + generales.height <= boites[0].y);
    assert.match(await page.locator(".vue-rangee-tete .notes-generales").innerText(), /À trancher[\s\S]*Faut-il une carte \?/);
    // Toucher l'image ouvre l'écran.
    await page.mouse.click(boites[1].x + boites[1].width / 2, boites[1].y + 200);
    await page.waitForFunction(() => location.hash === "#ecran/A2");
    assert.deepEqual(erreurs, []);
  });
});

test("dans une rangée, un écran d'ordinateur est à 62 %, la hauteur suit l'écran, et la bande défile de côté sans la page", async () => {
  await avecPage(FIXTURE, { adresse: "rangee/B", largeur: 1100, hauteur: 800 }, async ({ page }) => {
    const b2 = await page.locator('.rangee-carte[data-code="B2"] .cadre-boite').boundingBox();
    assert.ok(Math.abs(b2.width - 1280 * 0.62) < 1, `ordinateur à 62 % : ${b2.width}`);
    const bande = await page.locator(".rangee-bande").evaluate((el) => ({ contenu: el.scrollWidth, boite: el.clientWidth, x: getComputedStyle(el).overflowX }));
    assert.ok(bande.contenu > bande.boite, "la bande est plus large que sa place");
    assert.equal(bande.x, "auto");
    assert.ok(await pasDeDefilementDeCote(page));
  });
  await avecPage(FIXTURE, { adresse: "rangee/C", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await page.waitForFunction(() => document.querySelector('.rangee-carte[data-code="C1"] .cadre-boite').offsetHeight >= 1800);
    const hauteur = await page.locator('.rangee-carte[data-code="C1"] .cadre-boite').evaluate((el) => el.offsetHeight);
    assert.ok(hauteur >= 2000 * 0.9 && hauteur < 2300 * 0.9, `écran entier à 90 % : ${hauteur}`);
  });
});

test("le panneau d'une rangée liste les pages de l'état des lieux qui citent ses écrans, et pas les notes", async () => {
  await avecPage(FIXTURE, { adresse: "rangee/A", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const panneau = page.locator(".rangee-panneau");
    const boite = await panneau.boundingBox();
    assert.ok(Math.abs(boite.width - 360) < 1, `360 px : ${boite.width}`);
    assert.ok(boite.x > (await page.locator(".rangee-bande").boundingBox()).x, "à droite");
    assert.deepEqual((await panneau.locator(".ligne .page").allInnerTexts()).map(espaces), ["Accueil", "Fiche"]);
    assert.deepEqual((await panneau.locator(".ligne .etat").allInnerTexts()).map(espaces), ["Existe", "À compléter"]);
    assert.match(await panneau.innerText(), /Rien quand l'objet est prêté\./);
    assert.equal(await panneau.locator(".note").count(), 0, "les notes ne sont pas montrées deux fois");
  });
  await avecPage(FIXTURE, { adresse: "rangee/C", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    assert.match(await page.locator(".rangee-panneau").innerText(), /Aucune page de l'état des lieux ne cite ces écrans/);
  });
});

test("une rangée inconnue dit qu'elle n'existe pas et renvoie vers la vue d'ensemble", async () => {
  for (const largeur of [390, 1440]) {
    await avecPage(FIXTURE, { adresse: "rangee/Z", largeur }, async ({ page }) => {
      assert.match(await page.locator("#vue").innerText(), /Cette rangée n'existe pas[\s\S]*« Z »/);
      assert.equal(await page.locator("#vue iframe").count(), 0);
      const lien = page.locator("#vue a", { hasText: "vue d'ensemble" });
      assert.equal(await lien.getAttribute("href"), "#ensemble");
      await lien.click();
      await page.waitForFunction(() => document.body.dataset.vue === "ensemble");
    });
  }
});

// ---------------------------------------------------------------- l'écran (niveau 3)

test("#ecran/A2 montre sous l'écran les notes qui le citent, et garde le panneau des corrections", async () => {
  await avecPage(FIXTURE, { adresse: "ecran/A2", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const notes = page.locator(".ecran-notes");
    assert.match(await notes.innerText(), /Notes sur cet écran[\s\S]*Décision[\s\S]*Caution retirée\./);
    assert.equal(await notes.locator(".note").count(), 1, "la note de toute la rangée n'est pas là");
    const comparaison = await page.locator(".comparaison").boundingBox();
    const bloc = await notes.boundingBox();
    assert.ok(bloc.y >= comparaison.y + comparaison.height, "sous l'écran");
    assert.equal(await page.locator(".corrections").count(), 1);
    const panneau = await page.locator(".corrections").boundingBox();
    assert.ok(panneau.x >= comparaison.x + comparaison.width - 1, "les corrections restent à droite");
  });
  await avecPage(FIXTURE, { adresse: "ecran/A1" }, async ({ page }) => {
    assert.equal(await page.locator(".ecran-notes").count(), 0, "pas de bloc vide");
  });
});

// ---------------------------------------------------------------- le téléphone

test("à 390 px, un code long avec « Validé » et « Inchangé à l'écran » tient sur sa ligne : les badges deviennent ✓ et =", async () => {
  const plan = {
    version: 1, projet: "Long",
    etatDesLieux: [{ page: "Fiche", groupe: "G", etat: "a-completer", raison: "Un lien mène au mauvais onglet.", source: "src/fiche.js", ecrans: ["A123"] }],
    rangees: [{ id: "A", titre: "Rangée", notes: [{ type: "a-coder", date: "2026-11-07", texte: "Le lien ouvre l'onglet Tous.", ecrans: ["A123"] }] }],
    ecrans: [ecran("A123", "Fiche d'un outil", { rangee: "A", statut: "valide", inchange: true })]
  };
  const dossier = genererFixture({ plan, ecrans: { "A123.html": ecranHtml("A123", "<h1>Fiche</h1>") } });
  await avecPage(dossier, { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page, erreurs }) => {
    const ligne = page.locator('.glisse .vignette[data-code="A123"] .vignette-ligne');
    assert.ok(await ligne.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), "rien n'est coupé");
    assert.deepEqual(await ligne.locator(".badge-court").allInnerTexts(), ["✓", "="]);
    assert.match(await ligne.evaluate((el) => el.textContent), /Validé.*Inchangé à l'écran/);
    assert.deepEqual(erreurs, []);
  });
  // L'écran seul dit pourquoi il est inchangé, et ses notes sont là.
  await avecPage(dossier, { adresse: "ecran/A123", largeur: 1320 }, async ({ page }) => {
    assert.equal((await page.locator(".volet-proposition .volet-titre").innerText()).trim(),
      "Existant ; le changement ne se voit pas à l'écran, voir les notes");
    assert.equal((await page.locator(".ecran-entete .badge-inchange").innerText()).trim(), "Inchangé à l'écran");
  });
});

test("à 390 px, la vue d'ensemble est une colonne : chaque rangée glisse de côté, écran par écran, sans faire déborder la page", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page, erreurs }) => {
    assert.equal(await page.locator(".planche").count(), 0, "pas de planche sur téléphone");
    assert.equal(await page.getByRole("button", { name: "Tout voir" }).count(), 0, "ni zoom");
    assert.equal(await page.evaluate(() => document.body.dataset.mise), "page");
    const rangees = page.locator("#vue .rangee");
    assert.deepEqual(await rangees.evaluateAll((els) => els.map((el) => el.dataset.rangee)), ["A", "B", "C"]);
    const glisse = rangees.nth(0).locator(".glisse");
    const style = await glisse.evaluate((el) => ({
      x: getComputedStyle(el).overflowX, accroche: getComputedStyle(el).scrollSnapType, marge: getComputedStyle(el).scrollPaddingLeft,
      carte: getComputedStyle(el.querySelector(".vignette")).scrollSnapAlign, contenu: el.scrollWidth, boite: el.clientWidth
    }));
    assert.equal(style.x, "auto");
    assert.match(style.accroche, /^x mandatory/);
    assert.equal(style.marge, "16px");
    assert.equal(style.carte, "start");
    assert.ok(style.contenu > style.boite, "les écrans dépassent : on les fait glisser");
    for (const boite of await rangees.nth(0).locator(".vignette .cadre-boite").all()) {
      assert.ok(Math.abs((await boite.boundingBox()).width - 170) < 1);
    }
    // Glisser montre l'écran suivant, et la page ne bouge pas de côté.
    await glisse.evaluate((el) => el.scrollBy({ left: 182 }));
    await page.waitForTimeout(300);
    assert.ok(await glisse.evaluate((el) => el.scrollLeft) > 0);
    assert.ok(await pasDeDefilementDeCote(page));
    for (const lien of await page.locator("#vue .rangee-titre a").all()) assert.ok((await lien.boundingBox()).height >= 44, "titre de rangée de 44 px");
    assert.deepEqual(erreurs, []);
  });
});

test("à 390 px, les notes sont dans des « details » : sous le titre pour la rangée, sous chaque carte pour un écran", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const rangeeA = page.locator('#vue .rangee[data-rangee="A"]');
    const generales = rangeeA.locator("details.notes-generales");
    assert.equal(espaces(await generales.locator("summary").innerText()), "1 note");
    const titre = await rangeeA.locator(".rangee-titre").boundingBox();
    const glisse = await rangeeA.locator(".glisse").boundingBox();
    const repli = await generales.boundingBox();
    assert.ok(repli.y >= titre.y + titre.height - 1 && repli.y + repli.height <= glisse.y + 1, "entre le titre et les écrans");
    assert.ok((await generales.locator("summary").boundingBox()).height >= 44);
    const deA2 = rangeeA.locator('.vignette[data-code="A2"] details.notes-repliees');
    assert.equal(espaces(await deA2.locator("summary").innerText()), "1 note");
    assert.equal(await rangeeA.locator('.vignette[data-code="A1"] details').count(), 0, "rien sous un écran sans note");
    assert.equal(await deA2.locator(".note").isVisible(), false, "replié au départ");
    await deA2.locator("summary").click();
    assert.equal(await deA2.locator(".note").isVisible(), true);
    assert.match(await deA2.locator(".note").innerText(), /Décision[\s\S]*Caution retirée\./);
    assert.ok(await pasDeDefilementDeCote(page));
  });
});

test("à 390 px, une rangée montre ses écrans l'un sous l'autre à la largeur de l'écran, avec leurs notes, puis les pages", async () => {
  await avecPage(FIXTURE, { adresse: "rangee/A", largeur: 390, hauteur: 844 }, async ({ page }) => {
    assert.equal(await page.evaluate(() => document.body.dataset.mise), "page");
    const cartes = page.locator(".rangee-carte");
    const boites = [];
    for (const carte of await cartes.all()) boites.push(await carte.locator(".cadre-boite").boundingBox());
    assert.equal(boites.length, 3);
    assert.ok(boites[0].y + boites[0].height < boites[1].y && boites[1].y + boites[1].height < boites[2].y, "l'un sous l'autre");
    const utile = await page.evaluate(() => document.documentElement.clientWidth - 32);
    for (const boite of boites) assert.ok(Math.abs(boite.width - utile) < 1 && boite.x >= 15, `largeur de l'écran : ${boite.width} pour ${utile}`);
    assert.match(await cartes.nth(1).locator(".notes-ecran").innerText(), /Caution retirée\./);
    const pages = await page.locator(".rangee-panneau").boundingBox();
    assert.ok(pages.y > boites[2].y + boites[2].height, "les pages viennent après les écrans");
    for (const lien of await page.getByRole("link", { name: /^Ouvrir / }).all()) assert.ok((await lien.boundingBox()).height >= 44);
    assert.ok(await pasDeDefilementDeCote(page));
  });
  // Un écran d'ordinateur se réduit à la largeur du téléphone.
  await avecPage(FIXTURE, { adresse: "rangee/B", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const b2 = await page.locator('.rangee-carte[data-code="B2"] .cadre-boite').boundingBox();
    const utile = await page.evaluate(() => document.documentElement.clientWidth - 32);
    assert.ok(Math.abs(b2.width - utile) < 1, `B2 : ${b2.width} pour ${utile}`);
    assert.ok(await pasDeDefilementDeCote(page));
  });
});

test("à 390 px, la barre tient en deux lignes, avec des commandes de 44 px et le seul niveau courant", async () => {
  for (const schema of ["light", "dark"]) {
    await avecPage(FIXTURE, { adresse: "ecran/A2", largeur: 390, hauteur: 844, schema }, async ({ page }) => {
      const barre = await page.locator(".barre").boundingBox();
      assert.ok(barre.width <= 390 && barre.height <= 120, `barre : ${barre.width} x ${barre.height}`);
      assert.equal(await page.locator(".fil-ici").innerText(), "A2");
      assert.equal(await page.locator(".fil a").first().isVisible(), false, "les niveaux du dessus sont cachés");
      for (const cible of [page.locator("#remonter"), page.locator("#recherche"), ...(await page.locator(".barre-vues a").all())]) {
        const boite = await cible.boundingBox();
        assert.ok(boite.height >= 44 && boite.x >= 0 && boite.x + boite.width <= 390, `cible : ${JSON.stringify(boite)}`);
      }
      assert.ok(await pasDeDefilementDeCote(page));
    });
  }
});

test("passer d'un ordinateur à un téléphone redessine la vue d'ensemble", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    assert.equal(await page.locator(".planche").count(), 1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector(".glisse") !== null);
    assert.equal(await page.locator(".planche").count(), 0);
    assert.ok(await pasDeDefilementDeCote(page));
  });
});

// ---------------------------------------------------------------- rien ne vient d'Internet

test("les trois niveaux, la recherche et le zoom ne demandent rien hors du dossier", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page, requetes, erreurs, console: messages }) => {
    await page.getByRole("button", { name: "Tout voir" }).click();
    await page.waitForTimeout(1500);
    await page.locator("#recherche").fill("fiche");
    await page.locator("#recherche").press("Enter");
    await page.waitForFunction(() => location.hash === "#ecran/A2");
    await page.evaluate(() => { location.hash = "#rangee/B"; });
    await page.waitForTimeout(1000);
    assert.deepEqual(requetes, []);
    assert.deepEqual(erreurs, []);
    assert.deepEqual(messages, []);
  });
});

// ---------------------------------------------------------------- série de corrections

const UNE_CORRECTION = `try { localStorage.setItem("a-plat:corrections:Essai", JSON.stringify([{ code: "A1", element: "Titre", texte: "Plus court" }])); } catch (e) {}`;

// La barre et le haut de la vue, avec la hauteur gardée pour la planche et la rangée.
const mesureDeLaBarre = (page) => page.evaluate(() => ({
  barre: document.querySelector(".barre").getBoundingClientRect().bottom,
  hauteur: document.querySelector(".barre").offsetHeight,
  vue: document.querySelector("#vue").getBoundingClientRect().top,
  variable: getComputedStyle(document.documentElement).getPropertyValue("--barre-hauteur").trim()
}));

test("à 1024 px, avec une correction enregistrée, le bas de la barre touche le haut de la vue, sur chaque niveau", async () => {
  for (const adresse of ["ensemble", "rangee/A", "ecran/A2"]) {
    await avecPage(FIXTURE, { adresse, largeur: 1024, hauteur: 800, avant: UNE_CORRECTION }, async ({ page }) => {
      await page.locator(".barre .barre-corrections").waitFor();
      await page.waitForTimeout(150);
      const m = await mesureDeLaBarre(page);
      assert.ok(Math.abs(m.barre - m.vue) < 1, `${adresse} : barre en bas à ${m.barre}, vue en haut à ${m.vue}`);
      assert.equal(m.variable, `${m.hauteur}px`, `${adresse} : la hauteur gardée suit la barre`);
    });
  }
});

test("la barre se remesure quand une correction y ajoute son compte, et le panneau collé de l'écran reste dessous", async () => {
  await avecPage(FIXTURE, { adresse: "ecran/A2", largeur: 1024, hauteur: 800 }, async ({ page }) => {
    assert.equal(await page.locator(".barre-corrections").count(), 0);
    await page.evaluate(() => window.APlatMoteur.surElementTouche("A2", "Titre", {}));
    await page.locator("#correction-champ").fill("Plus court");
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await page.locator(".barre .barre-corrections").waitFor();
    await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue("--barre-hauteur").trim() ===
      document.querySelector(".barre").offsetHeight + "px");
    const m = await mesureDeLaBarre(page);
    const marge = await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop);
    assert.equal(marge, `${m.hauteur + 12}px`, "le défilement vers un élément le pose sous la barre");
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(100);
    const apres = await page.evaluate(() => ({
      barre: document.querySelector(".barre").getBoundingClientRect().bottom,
      panneau: document.querySelector(".corrections").getBoundingClientRect().top
    }));
    assert.ok(apres.panneau >= apres.barre, `le panneau (${apres.panneau}) n'est pas sous la barre (${apres.barre})`);
  });
});

test("un titre de rangée très long est coupé par des points de suspension et ne fait pas rapetisser « Tout voir »", async () => {
  const long = "Un titre de rangée vraiment très long qui décrit tout le parcours de la personne depuis le début jusqu'à la fin avec toutes ses étapes";
  const plan = {
    version: 1, projet: "Long", etatDesLieux: [],
    rangees: [{ id: "A", titre: long, notes: [] }, { id: "B", titre: "Court", notes: [] }],
    ecrans: [ecran("A1", "Un", { rangee: "A" }), ecran("A2", "Deux", { rangee: "A" }), ecran("B1", "Trois", { rangee: "B" })]
  };
  const ecrans = {};
  for (const e of plan.ecrans) ecrans[`${e.code}.html`] = ecranHtml(e.code, `<h1>${e.titre}</h1>`);
  const dossier = genererFixture({ plan, ecrans });
  for (const largeur of [1024, 1440]) {
    await avecPage(dossier, { adresse: "ensemble", largeur, hauteur: 800 }, async ({ page }) => {
      const lien = page.locator('.planche .rangee[data-rangee="A"] .rangee-lien');
      const coupe = await lien.evaluate((el) => ({ coupe: el.scrollWidth > el.clientWidth, points: getComputedStyle(el).textOverflow, titre: el.getAttribute("title") }));
      assert.ok(coupe.coupe && coupe.points === "ellipsis", "le titre est coupé par des points de suspension");
      assert.equal(coupe.titre, `A ${long}`, "le titre entier reste lisible au survol");
      assert.ok((await lien.boundingBox()).width <= 721, "720 px au plus à l'écran");
      await page.getByRole("button", { name: "Tout voir" }).click();
      assert.ok(parseInt(await niveau(page), 10) >= 15, `Tout voir : ${await niveau(page)}`);
      assert.ok((await lien.boundingBox()).width <= 721);
    });
  }
  // Dans la barre, le fil coupe aussi le titre, sans passer sous la recherche.
  await avecPage(dossier, { adresse: "rangee/A", largeur: 1440, hauteur: 800 }, async ({ page }) => {
    const fil = await page.locator(".fil-ici").boundingBox();
    const champ = await page.locator("#recherche").boundingBox();
    assert.ok(fil.x + fil.width <= champ.x, `le fil (${fil.x + fil.width}) s'arrête avant la recherche (${champ.x})`);
  });
});

test("la planche garde son zoom et sa position quand on ouvre un écran et qu'on revient ; elle repart de zéro au passage des 700 px", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await page.getByRole("button", { name: "Agrandir le zoom" }).click();
    await page.mouse.move(700, 500);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(100);
    const avant = await posePlanche(page);
    await page.evaluate(() => { location.hash = "#ecran/A2"; });
    await page.waitForFunction(() => document.body.dataset.vue === "ecran");
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.vue === "ensemble");
    const apres = await posePlanche(page);
    assert.ok(Math.abs(apres.x - avant.x) < 0.5 && Math.abs(apres.y - avant.y) < 0.5 && Math.abs(apres.z - avant.z) < 0.001,
      `retrouvée : ${JSON.stringify(avant)} puis ${JSON.stringify(apres)}`);
    assert.equal(await niveau(page), "38 %");
    assert.equal(await page.locator(".planche-entete").evaluate((el) => el.classList.contains("efface")), true);
    // Passer sur un téléphone, puis revenir : la planche repart de 30 %, à sa place de départ.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector(".glisse") !== null);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector(".planche") !== null);
    assert.equal(await niveau(page), "30 %");
    assert.equal(await page.locator(".planche-entete").evaluate((el) => el.classList.contains("efface")), false);
  });
  // Le rechargement aussi.
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await page.getByRole("button", { name: "Agrandir le zoom" }).click();
    await page.reload();
    await page.waitForFunction(() => document.querySelector(".planche-niveau") !== null);
    assert.equal(await niveau(page), "30 %");
  });
});

test("dans la planche, le contour du focus garde la même épaisseur à l'écran, quel que soit le zoom", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    for (const reduire of [0, 2]) {
      for (let i = 0; i < reduire; i++) await page.getByRole("button", { name: "Réduire le zoom" }).click();
      await page.locator("#recherche").focus();
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        if (await page.evaluate(() => document.activeElement.classList.contains("vignette-lien"))) break;
      }
      const contour = await page.evaluate(() => {
        const z = new DOMMatrix(getComputedStyle(document.querySelector(".planche")).transform).a;
        const style = getComputedStyle(document.activeElement, "::after");
        return { classe: document.activeElement.className, epaisseur: parseFloat(style.outlineWidth) * z, decalage: parseFloat(style.outlineOffset) * z, z };
      });
      assert.equal(contour.classe, "vignette-lien");
      // Le navigateur arrondit l'épaisseur et le décalage au pixel entier dans la planche
      // (6,67 px y devient 6) : à l'écran, un peu moins que 2 et 3 px. Sans la correction,
      // l'épaisseur tombait à 0,6 px à 30 %.
      assert.ok(contour.epaisseur > 1.65 && contour.epaisseur <= 2.05, `épaisseur à ${contour.z} : ${JSON.stringify(contour)}`);
      assert.ok(contour.decalage > 2.6 && contour.decalage <= 3.05, `décalage à ${contour.z} : ${JSON.stringify(contour)}`);
    }
  });
});

test("les commandes du zoom viennent avant la planche au clavier, et le niveau est annoncé", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const ordre = await page.evaluate(() => Boolean(document.querySelector(".planche-zoom").compareDocumentPosition(document.querySelector(".planche-fenetre")) & Node.DOCUMENT_POSITION_FOLLOWING));
    assert.ok(ordre, "les commandes sont avant la fenêtre dans la page");
    await page.locator("#recherche").focus();
    let appuis = 0;
    for (; appuis < 10; appuis++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement.getAttribute("aria-label") === "Réduire le zoom")) break;
    }
    assert.ok(appuis < 4, `zoom atteint en ${appuis + 1} appuis sur Tab`);
    assert.equal(await page.locator(".planche-niveau").getAttribute("aria-live"), "polite");
    const zone = await page.locator(".planche-zoom").boundingBox();
    assert.ok(zone.x < 40 && zone.y + zone.height > 900 - 40, "toujours en bas à gauche");
  });
});

test("un code d'écran n'est jamais coupé, et le titre se cache quand l'écran devient minuscule à l'écran", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const vignette = page.locator('.planche .vignette[data-code="A1"]');
    const etat = () => vignette.evaluate((el) => {
      const code = el.querySelector(".vignette-code");
      return {
        cache: getComputedStyle(el.querySelector(".vignette-titre")).visibility === "hidden",
        retrait: getComputedStyle(code).flexShrink,
        entier: code.scrollWidth <= code.clientWidth + 1
      };
    });
    const depart = await etat();
    assert.equal(depart.cache, false, "à 30 %, 117 px : le titre se lit");
    assert.equal(depart.retrait, "0");
    for (let i = 0; i < 6; i++) await page.getByRole("button", { name: "Réduire le zoom" }).click();
    assert.equal(await niveau(page), "8 %"); // 390 × 0,08 = 31 px à l'écran
    const loin = await etat();
    assert.equal(loin.cache, true, "le titre se cache");
    assert.equal(loin.entier, true, "le code reste entier");
    assert.equal(espaces(await vignette.locator(".vignette-code").innerText()), "A1");
    // Rien ne déborde sur l'écran voisin : le badge se cache, le bouton des notes ne garde que le nombre.
    assert.equal(await vignette.locator(".badge-valide").isVisible(), false);
    const a2 = page.locator('.planche .vignette[data-code="A2"]');
    const bouton = a2.getByRole("button", { name: "1 note" });
    assert.equal(espaces(await bouton.innerText()), "1");
    assert.ok((await bouton.boundingBox()).width <= (await a2.boundingBox()).width + 0.5, "le bouton tient dans la largeur de l'écran");
  });
});

test("à 100 %, les badges de la planche gardent leur mot ; la marque courte ne sert qu'aux écrans étroits", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const badge = page.locator('.planche .vignette[data-code="A1"] .badge-valide');
    assert.equal(await badge.locator(".badge-court").isVisible(), true, "à 30 %, ✓");
    assert.ok((await badge.locator(".badge-mot").boundingBox()).width <= 1, "à 30 %, le mot est caché à l'œil");
    // Le mot reste dans le nom du lien (lecteurs d'écran), et revient au survol ; la marque non.
    const lienA3 = page.locator('.planche .vignette[data-code="A3"] .vignette-lien');
    assert.match(await lienA3.evaluate((el) => el.textContent), /Inchangé à l'écran/);
    assert.equal(await lienA3.locator(".badge-court").getAttribute("aria-hidden"), "true");
    assert.match(await lienA3.getAttribute("title"), /^A3 · Inchangé à l'écran · /);
    const ligneA3 = page.locator('.planche .vignette[data-code="A3"] .vignette-ligne');
    assert.ok(await ligneA3.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), "rien n'est coupé à 30 %");
    await page.getByRole("button", { name: "100 %, taille réelle" }).click();
    assert.equal(espaces(await badge.innerText()), "Validé");
    assert.equal(await badge.locator(".badge-court").isVisible(), false);
    // Le mot, la marque et le code tiennent sur la ligne, sans rien couper.
    const ligne = page.locator('.planche .vignette[data-code="A3"] .vignette-ligne');
    assert.ok(await ligne.evaluate((el) => el.scrollWidth <= el.clientWidth + 1), "rien n'est coupé à 100 %");
  });
});

test("une note qui cite un écran absent ne bloque pas la page : elle passe sous le titre de sa rangée", async () => {
  const plan = {
    version: 1, projet: "Oubli", etatDesLieux: [],
    rangees: [{
      id: "A", titre: "Rangée", notes: [
        { type: "a-trancher", date: "2026-11-07", texte: "Pour un écran retiré.", ecrans: ["Z9"] },
        { type: "decision", date: "2026-11-07", texte: "Pour A1 et un écran retiré.", ecrans: ["A1", "Z9"] }
      ]
    }],
    ecrans: [ecran("A1", "Accueil", { rangee: "A" })]
  };
  const dossier = genererFixture({ plan, ecrans: { "A1.html": ecranHtml("A1", "<h1>Accueil</h1>") } });
  for (const adresse of ["ensemble", "rangee/A", "ecran/A1"]) {
    await avecPage(dossier, { adresse, largeur: 1440, hauteur: 900 }, async ({ page, erreurs }) => {
      const vue = await page.locator("#vue").textContent();
      assert.doesNotMatch(vue, /Le plan contient des erreurs/, adresse);
      if (adresse !== "ecran/A1") {
        assert.match(await page.locator("#vue .notes-generales").textContent(), /Pour un écran retiré\./);
        assert.doesNotMatch(await page.locator("#vue .notes-generales").textContent(), /Pour A1/);
      }
      if (adresse !== "rangee/A") assert.match(await page.locator('#vue [data-code="A1"] .notes-ecran, #vue .ecran-notes').first().textContent(), /Pour A1 et un écran retiré\./);
      assert.deepEqual(erreurs, []);
    });
  }
});

test("au doigt ou au stylet, il faut glisser de 12 px pour déplacer la planche ; à la souris, 5 px suffisent", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    // Un appui, un déplacement, un relâchement, envoyés comme d'un doigt, d'un stylet ou d'une souris.
    const tirer = (type, distance) => page.evaluate(([genre, d]) => {
      const fenetre = document.querySelector(".planche-fenetre");
      const b = document.querySelector('.planche .vignette[data-code="A2"] .cadre-boite').getBoundingClientRect();
      const x = b.x + b.width / 2;
      const y = b.y + b.height / 2;
      const reglage = (cx) => ({ pointerId: 7, pointerType: genre, isPrimary: true, clientX: cx, clientY: y, button: 0, buttons: 1, bubbles: true });
      const avant = new DOMMatrix(getComputedStyle(document.querySelector(".planche")).transform).e;
      fenetre.dispatchEvent(new PointerEvent("pointerdown", reglage(x)));
      fenetre.dispatchEvent(new PointerEvent("pointermove", reglage(x + d)));
      fenetre.dispatchEvent(new PointerEvent("pointerup", reglage(x + d)));
      return new DOMMatrix(getComputedStyle(document.querySelector(".planche")).transform).e - avant;
    }, [type, distance]);
    assert.equal(await tirer("touch", 8), 0, "8 px au doigt : un toucher, pas un déplacement");
    assert.equal(await tirer("pen", 8), 0, "8 px au stylet : pareil");
    assert.equal(await tirer("mouse", 8), 8, "8 px à la souris : la planche bouge");
    assert.equal(await tirer("touch", 20), 20, "20 px au doigt : la planche bouge");
  });
});

test("le résultat choisi dans la recherche se voit nettement, en clair comme en sombre", async () => {
  const attendu = { light: { fond: "rgb(229, 240, 251)", filet: "rgb(0, 102, 204)" }, dark: { fond: "rgb(16, 38, 61)", filet: "rgb(41, 151, 255)" } };
  for (const schema of ["light", "dark"]) {
    await avecPage(FIXTURE, { adresse: "etat", schema }, async ({ page }) => {
      await page.locator("#recherche").fill("a");
      const style = await page.locator('#resultats [aria-selected="true"]').evaluate((el) => ({ fond: getComputedStyle(el).backgroundColor, filet: getComputedStyle(el).boxShadow }));
      const autre = await page.locator('#resultats [aria-selected="false"]').first().evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(style.fond, attendu[schema].fond, schema);
      assert.ok(style.filet.includes(attendu[schema].filet) && style.filet.includes("inset"), `${schema} : filet ${style.filet}`);
      assert.notEqual(autre, style.fond, "les autres résultats n'ont pas ce fond");
    });
  }
});

// ---------------------------------------------------------------- rangées repliables

const plier = (page, id) => page.locator(`#vue .rangee[data-rangee="${id}"] .rangee-plier`);
// La clé dit le dossier des maquettes (le chemin de la page, sans index.html) et le projet.
const repliesGardees = (page) => page.evaluate(() =>
  JSON.parse(localStorage.getItem("a-plat:rangees-repliees:" + location.pathname.replace(/index\.html$/, "") + ":Essai") || "null"));

test("un pliage retenu sous l'ancienne clé, sans le dossier, est relu une fois puis rangé sous la nouvelle", async () => {
  const ancienne = `try { if (!sessionStorage.getItem("deja")) { localStorage.setItem("a-plat:rangees-repliees:Essai", JSON.stringify(["B"])); sessionStorage.setItem("deja", "1"); } } catch (e) {}`;
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900, avant: ancienne }, async ({ page }) => {
    assert.equal(await plier(page, "B").getAttribute("aria-expanded"), "false", "l'ancien pliage n'est pas perdu");
    assert.deepEqual(await repliesGardees(page), ["B"], "il est rangé sous la nouvelle clé");
  });
});

test("sur la planche, replier une rangée cache ses écrans, fait remonter la suivante, et aria-expanded suit", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page, erreurs }) => {
    const bouton = plier(page, "A");
    assert.equal(await bouton.getAttribute("aria-expanded"), "true");
    assert.equal(await bouton.getAttribute("aria-label"), "Replier la rangée A");
    const corps = await bouton.getAttribute("aria-controls");
    assert.equal(await page.locator(`#${corps}`).count(), 1, "aria-controls désigne le corps de la rangée");
    // Le bouton est avant la lettre, et garde 44 px à l'écran.
    const avantLaLettre = await page.locator('.planche .rangee[data-rangee="A"] .rangee-titre').evaluate((titre) =>
      titre.firstElementChild.classList.contains("rangee-plier") && titre.querySelector(".rangee-id") !== null);
    assert.ok(avantLaLettre);
    const taille = await bouton.boundingBox();
    assert.ok(Math.abs(taille.width - 44) < 1 && Math.abs(taille.height - 44) < 1, `à 30 % : ${taille.width} x ${taille.height}`);
    const yB = (await page.locator('.planche .rangee[data-rangee="B"]').boundingBox()).y;
    await bouton.click();
    assert.equal(await page.evaluate(() => location.hash), "#ensemble", "replier n'ouvre pas la rangée");
    assert.equal(await bouton.getAttribute("aria-expanded"), "false");
    assert.equal(await bouton.getAttribute("aria-label"), "Déplier la rangée A");
    assert.equal(await page.locator('.planche .vignette[data-code="A1"]').isVisible(), false, "les écrans sont cachés");
    assert.equal(await page.locator('.planche .rangee[data-rangee="A"] .notes-generales').isVisible(), false);
    const lien = page.locator('.planche .rangee[data-rangee="A"] .rangee-titre a');
    assert.equal(await lien.isVisible(), true, "le titre reste là");
    assert.equal(await lien.getAttribute("href"), "#rangee/A");
    assert.equal(espaces(await page.locator('.planche .rangee[data-rangee="A"] .rangee-compte').innerText()), "3 écrans");
    assert.ok((await page.locator('.planche .rangee[data-rangee="B"]').boundingBox()).y < yB - 100, "la rangée B remonte");
    await bouton.click();
    assert.equal(await bouton.getAttribute("aria-expanded"), "true");
    assert.equal(await page.locator('.planche .vignette[data-code="A1"]').isVisible(), true);
    // À un autre zoom, le bouton garde sa taille à l'écran.
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Réduire le zoom" }).click();
    const loin = await bouton.boundingBox();
    assert.ok(Math.abs(loin.width - 44) < 1, `à ${await niveau(page)} : ${loin.width}`);
    assert.deepEqual(erreurs, []);
  });
});

test("« Tout replier » et « Tout déplier » sont en bas à gauche, à droite du zoom, et plient toute la planche", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const groupe = page.getByRole("group", { name: "Rangées" });
    const zoom = await page.getByRole("group", { name: "Zoom de la planche" }).boundingBox();
    const plis = await groupe.boundingBox();
    assert.ok(plis.x >= zoom.x + zoom.width && Math.abs(plis.y + plis.height - (zoom.y + zoom.height)) < 1, "juste à droite du zoom");
    for (const nom of ["Tout replier", "Tout déplier"]) assert.ok((await groupe.getByRole("button", { name: nom }).boundingBox()).height >= 44);
    const etats = () => page.locator(".planche .rangee-plier").evaluateAll((els) => els.map((el) => el.getAttribute("aria-expanded")));
    await groupe.getByRole("button", { name: "Tout replier" }).click();
    assert.deepEqual(await etats(), ["false", "false", "false"]);
    assert.equal(await page.locator(".planche .vignette").evaluateAll((els) => els.filter((el) => el.offsetParent !== null).length), 0);
    assert.deepEqual(await repliesGardees(page), ["A", "B", "C"]);
    await groupe.getByRole("button", { name: "Tout déplier" }).click();
    assert.deepEqual(await etats(), ["true", "true", "true"]);
    assert.deepEqual(await repliesGardees(page), []);
  });
});

test("le pliage est retenu par projet : au retour d'un écran, après une recherche, et après un rechargement", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await plier(page, "A").click();
    assert.deepEqual(await repliesGardees(page), ["A"], "gardé sous une clé qui contient le nom du projet");
    // Ouvrir un écran de la rangée repliée par la recherche : l'écran s'affiche comme d'habitude.
    await page.locator("#recherche").fill("a2");
    await page.locator("#recherche").press("Enter");
    await page.waitForFunction(() => document.body.dataset.vue === "ecran");
    assert.equal(await page.locator("#vue .ecran-code").innerText(), "A2");
    await page.goBack();
    await page.waitForFunction(() => document.body.dataset.vue === "ensemble");
    assert.equal(await plier(page, "A").getAttribute("aria-expanded"), "false", "au retour, la rangée est toujours repliée");
    assert.equal(await plier(page, "B").getAttribute("aria-expanded"), "true");
    assert.deepEqual(await repliesGardees(page), ["A"], "la recherche n'a rien changé au pliage");
    await page.reload();
    await page.waitForFunction(() => document.querySelector(".planche .rangee-plier") !== null);
    assert.equal(await plier(page, "A").getAttribute("aria-expanded"), "false", "après un rechargement aussi");
    assert.equal(await page.locator('.planche .vignette[data-code="A1"]').isVisible(), false);
  });
});

test("sans stockage (localStorage lève une erreur), tout commence déplié et le pliage marche sans erreur", async () => {
  const refus = () => {
    Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("refusé", "SecurityError"); } });
  };
  for (const largeur of [1440, 390]) {
    await avecPage(FIXTURE, { adresse: "ensemble", largeur, hauteur: 900, avant: refus }, async ({ page, erreurs, console: messages }) => {
      assert.deepEqual(await page.locator("#vue .rangee-plier").evaluateAll((els) => els.map((el) => el.getAttribute("aria-expanded"))), ["true", "true", "true"]);
      await plier(page, "B").click();
      assert.equal(await plier(page, "B").getAttribute("aria-expanded"), "false");
      assert.equal(await page.locator('#vue .vignette[data-code="B1"]').isVisible(), false);
      assert.deepEqual(erreurs, []);
      assert.deepEqual(messages, []);
    });
  }
});

test("au téléphone, une section se replie par un bouton de 44 px, et la planche retrouve le même pliage", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 390, hauteur: 844 }, async ({ page }) => {
    const bouton = plier(page, "A");
    const taille = await bouton.boundingBox();
    assert.ok(taille.width >= 44 && taille.height >= 44, `bouton : ${taille.width} x ${taille.height}`);
    assert.equal(await bouton.getAttribute("aria-label"), "Replier la rangée A");
    const yB = (await page.locator('#vue .rangee[data-rangee="B"]').boundingBox()).y;
    await bouton.click();
    assert.equal(await bouton.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator('#vue .rangee[data-rangee="A"] .glisse').isVisible(), false);
    assert.equal(await page.locator('#vue .rangee[data-rangee="A"] details.notes-generales').isVisible(), false);
    assert.ok((await page.locator('#vue .rangee[data-rangee="B"]').boundingBox()).y < yB - 100, "la section B remonte");
    assert.equal(await page.locator('#vue .rangee[data-rangee="A"] .rangee-titre a').isVisible(), true);
    assert.ok(await pasDeDefilementDeCote(page));
    // La même mémoire sert sur la planche.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector(".planche") !== null);
    assert.equal(await plier(page, "A").getAttribute("aria-expanded"), "false");
  });
});

test("« Tout voir » ne tient compte que des rangées dépliées", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    await page.getByRole("button", { name: "Tout voir" }).click();
    const toutDeplie = (await posePlanche(page)).z;
    await plier(page, "B").click();
    await plier(page, "C").click();
    await page.getByRole("button", { name: "Tout voir" }).click();
    const unSeule = (await posePlanche(page)).z;
    assert.ok(unSeule > toutDeplie, `avec une seule rangée dépliée, le zoom grandit : ${toutDeplie} puis ${unSeule}`);
    const fenetre = await page.locator(".planche-fenetre").boundingBox();
    const planche = await page.locator(".planche").boundingBox();
    assert.ok(planche.y + planche.height <= fenetre.y + fenetre.height + 1 && planche.x + planche.width <= fenetre.x + fenetre.width + 1,
      "la rangée dépliée et les titres repliés tiennent dans la fenêtre");
    // Les écrans de B, repliée, ne comptent pas : seule la largeur de A compte.
    assert.equal(await page.locator('.planche .vignette[data-code="B2"]').isVisible(), false);
  });
});
