import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { avecPage } from "./aide.mjs";

const MODELE = fileURLToPath(new URL("../../skills/a-plat/modele", import.meta.url));

// Prépare un dossier de maquettes jetable : ecran-type.html copié dans ecrans/, puis ouvert seul
// (sans la page d'À plat), comme on ouvre un écran d'un double-clic.
async function avecEcranType(travail, { avant } = {}) {
  await avecPage("complet", { avant }, async ({ page, dossier }) => {
    cpSync(join(MODELE, "ecran-type.html"), join(dossier, "ecrans/X0-type.html"));
    const ouvrir = async () => page.goto(pathToFileURL(join(dossier, "ecrans/X0-type.html")).href);
    await ouvrir();
    await travail({ page, dossier, ouvrir });
  });
}

// Change la valeur d'une variable dans la tête de commun.css, sans toucher au reste.
function changer(dossier, variable, valeur) {
  const chemin = join(dossier, "commun.css");
  const avant = readFileSync(chemin, "utf8");
  const motif = new RegExp(`(${variable}\\s*:\\s*)[^;]+;`);
  assert.match(avant, motif, `${variable} est dans commun.css`);
  writeFileSync(chemin, avant.replace(motif, `$1${valeur};`));
}

const style = (page, selecteur, propriete) =>
  page.locator(selecteur).first().evaluate((el, p) => getComputedStyle(el)[p], propriete);

test("en UX, l'écran type est en gris, avec un seul bleu pour ce qui agit", async () => {
  await avecEcranType(async ({ page }) => {
    // Un lien du modèle reçoit le focus au clavier : son contour (:focus-visible) compte aussi.
    await page.keyboard.press("Tab");
    const releve = await page.evaluate(() => {
      const hors = [];
      const bleus = new Set();
      // « rgb(0, 102, 204) », « rgba(0, 0, 0, 0) » ou, pour un color-mix, « color(srgb 0.9 0.94 0.98) » :
      // ramenés sur 0–255, avec l'opacité à part.
      const lire = (c) => {
        const nombres = (c.match(/[\d.]+/g) || []).map(Number);
        if (/^color\(srgb/.test(c)) return [nombres[0] * 255, nombres[1] * 255, nombres[2] * 255, nombres.length > 3 ? nombres[3] : 1];
        return [nombres[0], nombres[1], nombres[2], nombres.length > 3 ? nombres[3] : 1];
      };
      // Ce qui agit : un bouton, un lien d'action, le retour, l'onglet ouvert, le contour du focus.
      const agit = (el, p) => el.matches(".bouton, .action, .retour, .onglets a[aria-current]") || (p === "outlineColor" && el.matches(":focus-visible"));
      for (const el of document.querySelectorAll("body, body *")) {
        const s = getComputedStyle(el);
        for (const p of ["color", "backgroundColor", "borderTopColor", "borderBottomColor", "outlineColor", "boxShadow"]) {
          if (p.startsWith("border") && s[p.replace("Color", "Style")] === "none") continue;
          if (p === "outlineColor" && s.outlineStyle === "none") continue;
          if (p === "boxShadow" && s.boxShadow === "none") continue;
          const [r, g, b, a] = lire(s[p]);
          if (a === 0) continue; // transparent
          // Un gris de La carte, à peine froid.
          if (Math.max(r, g, b) - Math.min(r, g, b) <= 8) continue;
          if (b > r && b > g && agit(el, p)) { bleus.add(`${el.className || el.tagName.toLowerCase()}`); continue; }
          hors.push(`${el.tagName.toLowerCase()}.${el.className} ${p} ${s[p]}`);
        }
      }
      return { hors, bleus: [...bleus] };
    });
    assert.deepEqual(releve.hors, [], "aucune autre couleur : le bleu n'est que sur ce qui agit");
    assert.ok(releve.bleus.some((c) => /\bbouton\b/.test(c)), "le bouton est bleu");
    assert.ok(releve.bleus.some((c) => /\baction\b/.test(c)), "le lien d'action est bleu");
  });
});

test("changer --ecran-accent dans le bloc UX de commun.css change la couleur du bouton, sans toucher à l'écran", async () => {
  await avecEcranType(async ({ page, dossier, ouvrir }) => {
    assert.equal(await style(page, ".bouton", "backgroundColor"), "rgb(0, 102, 204)", "le bouton est du bleu de La carte par défaut");
    changer(dossier, "--ecran-accent", "#c0392b");
    await ouvrir();
    assert.equal(await style(page, ".bouton", "backgroundColor"), "rgb(192, 57, 43)");
  });
});

test("chacune des variables a un effet visible sur les classes de base", async () => {
  const essais = [
    { variable: "--ecran-page", valeur: "#fdf6e3", selecteur: "body", propriete: "backgroundColor", attendu: "rgb(253, 246, 227)" },
    { variable: "--ecran-fond", valeur: "#fdf6e3", selecteur: ".carte:not(.forte)", propriete: "backgroundColor", attendu: "rgb(253, 246, 227)" },
    { variable: "--ecran-texte", valeur: "#1d3557", selecteur: "body", propriete: "color", attendu: "rgb(29, 53, 87)" },
    { variable: "--ecran-accent", valeur: "#2a9d8f", selecteur: ".bouton", propriete: "backgroundColor", attendu: "rgb(42, 157, 143)" },
    { variable: "--ecran-accent", valeur: "#2a9d8f", selecteur: ".action", propriete: "color", attendu: "rgb(42, 157, 143)" },
    { variable: "--ecran-sur-accent", valeur: "#111111", selecteur: ".bouton", propriete: "color", attendu: "rgb(17, 17, 17)" },
    { variable: "--ecran-trait", valeur: "#e76f51", selecteur: ".champ", propriete: "borderTopColor", attendu: "rgb(231, 111, 81)" },
    { variable: "--ecran-trait", valeur: "#e76f51", selecteur: ".carte", propriete: "boxShadow", pasGris: true },
    { variable: "--ecran-mise-en-avant", valeur: "#fdf6e3", selecteur: ".carte.forte", propriete: "backgroundColor", attendu: "rgb(253, 246, 227)" },
    { variable: "--ecran-arrondi", valeur: "3px", selecteur: ".carte", propriete: "borderTopLeftRadius", attendu: "3px" },
    { variable: "--ecran-arrondi", valeur: "3px", selecteur: ".champ", propriete: "borderTopLeftRadius", attendu: "3px" },
    { variable: "--ecran-arrondi-bouton", valeur: "3px", selecteur: ".bouton", propriete: "borderTopLeftRadius", attendu: "3px" },
    { variable: "--ecran-police", valeur: "Georgia, serif", selecteur: "body", propriete: "fontFamily", attendu: "Georgia, serif" },
    { variable: "--ecran-police", valeur: "Georgia, serif", selecteur: ".bouton", propriete: "fontFamily", attendu: "Georgia, serif" },
    { variable: "--ecran-police", valeur: "Georgia, serif", selecteur: ".champ", propriete: "fontFamily", attendu: "Georgia, serif" },
    { variable: "--ecran-police-titre", valeur: "Georgia, serif", selecteur: "h1", propriete: "fontFamily", attendu: "Georgia, serif" },
    { variable: "--ecran-police-titre", valeur: "Georgia, serif", selecteur: ".chiffre", propriete: "fontFamily", attendu: "Georgia, serif" }
  ];
  await avecEcranType(async ({ page, dossier, ouvrir }) => {
    for (const essai of essais) {
      // Un seul changement à la fois : on repart du modèle livré.
      cpSync(join(MODELE, "commun.css"), join(dossier, "commun.css"));
      await ouvrir();
      const avant = await style(page, essai.selecteur, essai.propriete);
      changer(dossier, essai.variable, essai.valeur);
      await ouvrir();
      const apres = await style(page, essai.selecteur, essai.propriete);
      assert.notEqual(apres, avant, `${essai.variable} change ${essai.selecteur} ${essai.propriete}`);
      if (essai.attendu) assert.equal(apres, essai.attendu, `${essai.variable} sur ${essai.selecteur}`);
      if (essai.pasGris) {
        const [r, g, b] = apres.match(/[\d.]+/g).map(Number);
        assert.ok(!(r === g && g === b), `${essai.selecteur} prend la couleur de ${essai.variable} (${apres})`);
      }
    }
  });
});

test("le bloc UI s'applique quand l'écran porte data-finition=\"ui\", et seulement alors", async () => {
  await avecEcranType(async ({ page, dossier, ouvrir }) => {
    const chemin = join(dossier, "commun.css");
    writeFileSync(chemin, readFileSync(chemin, "utf8").replace(/(:root\[data-finition="ui"\] \{[^}]*--ecran-accent: )#0066cc/, "$1#c0392b"));
    await ouvrir();
    assert.equal(await style(page, ".bouton", "backgroundColor"), "rgb(0, 102, 204)", "ouvert seul : l'UX");
    await page.evaluate(() => document.documentElement.setAttribute("data-finition", "ui"));
    assert.equal(await style(page, ".bouton", "backgroundColor"), "rgb(192, 57, 43)", "en UI : l'accent du projet");
  });
});

test("dans l'en-tête, un titre trop long est coupé, mais un menu passe à la ligne au lieu d'être coupé", async () => {
  await avecEcranType(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const entete = document.querySelector(".entete");
      entete.querySelector("h1").textContent = "Un titre d'écran beaucoup trop long pour tenir sur la ligne du haut";
      const menu = document.createElement("nav");
      menu.className = "puces";
      menu.innerHTML = '<a class="puce" href="#">Accueil</a><a class="puce" href="#">Mes prêts</a><a class="puce" href="#">Mon compte</a><a class="puce" href="#">Aide</a>';
      entete.appendChild(menu);
    });
    const mesures = await page.evaluate(() => {
      const entete = document.querySelector(".entete");
      const h1 = entete.querySelector("h1");
      const liens = [...entete.querySelectorAll(".puce")].map((a) => a.getBoundingClientRect());
      return {
        titreCoupe: h1.scrollWidth > h1.clientWidth && getComputedStyle(h1).textOverflow === "ellipsis",
        menuEntier: liens.every((r) => r.right <= entete.getBoundingClientRect().right + 0.5 && r.width > 0),
        menuDessous: liens[0].top >= h1.getBoundingClientRect().bottom - 1,
        coupeLEntete: getComputedStyle(entete).overflow,
        deborde: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    assert.ok(mesures.titreCoupe, "le titre est coupé par des points de suspension");
    assert.ok(mesures.menuEntier && mesures.menuDessous, "le menu est entier, sur la ligne suivante");
    assert.equal(mesures.coupeLEntete, "visible", "l'en-tête lui-même ne coupe rien");
    assert.equal(mesures.deborde, false);
  });
});

test("l'écran type ne déborde pas à 390 px et ses cibles tactiles font 44 px au moins", async () => {
  await avecEcranType(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const mesures = await page.evaluate(() => ({
      defile: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      petits: [...document.querySelectorAll("a[href], button, input, select, textarea")]
        .filter((el) => el.getBoundingClientRect().height < 44)
        .map((el) => el.outerHTML.slice(0, 60))
    }));
    assert.ok(mesures.defile <= 0, `défilement horizontal de ${mesures.defile} px`);
    assert.deepEqual(mesures.petits, []);
  });
});
