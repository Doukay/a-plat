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

    await remonter.click();
    await page.waitForFunction(() => document.body.dataset.vue === "ensemble");
    assert.deepEqual(await fil(), ["À plat · Essai"]);
    assert.equal(await ici(), "À plat · Essai");
    assert.equal(await remonter.isVisible(), false, "pas de flèche à la racine");
    assert.equal(await page.locator('.barre-vues a[aria-current="page"]').innerText(), "Vue d'ensemble");

    await page.locator(".barre-vues a", { hasText: "État des lieux" }).click();
    await page.waitForFunction(() => document.body.dataset.vue === "etat");
    assert.deepEqual(await fil(), ["À plat · Essai"]);
    assert.equal(await remonter.isVisible(), false);
    assert.equal(await page.locator('.barre-vues a[aria-current="page"]').innerText(), "État des lieux");
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
  assert.equal(await fondDesResultats("dark"), "rgb(29, 33, 40)");
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
    assert.equal(espaces(await nomA1.locator(".badge-valide").innerText()), "Validé");
    assert.equal(espaces(await page.locator('.planche .vignette[data-code="A3"] .badge-inchange').innerText()), "Inchangé");
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

test("sous 25 %, les notes de la planche se replient en « n notes », lisible lui aussi", async () => {
  await avecPage(FIXTURE, { adresse: "ensemble", largeur: 1440, hauteur: 900 }, async ({ page }) => {
    const liste = page.locator('.planche .vignette[data-code="A2"] .notes-ecran');
    assert.equal(await liste.locator(".note").isVisible(), true, "à 30 %, le texte se lit");
    await page.getByRole("button", { name: "Réduire le zoom" }).click(); // 24 %
    assert.equal(await liste.locator(".note").isVisible(), false);
    const resume = await liste.evaluate((el) => {
      const avant = getComputedStyle(el, "::before");
      const z = new DOMMatrix(getComputedStyle(document.querySelector(".planche")).transform).a;
      return { texte: avant.content, vu: parseFloat(avant.fontSize) * z };
    });
    assert.equal(resume.texte, '"1 note"');
    assert.ok(Math.abs(resume.vu - 12.5) < 0.5, `taille à l'écran : ${resume.vu}`);
    await page.getByRole("button", { name: "Agrandir le zoom" }).click(); // 30 %
    assert.equal(await liste.locator(".note").isVisible(), true);
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
    assert.equal(await page.evaluate(() => [window.scrollX, window.scrollY].join()), "0,0", "la page, elle, ne défile pas");
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
    assert.equal(espaces(await cartes.nth(2).locator(".badge-inchange").innerText()), "Inchangé");
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
