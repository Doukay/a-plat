import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (chemin) => readFileSync(new URL(`../${chemin}`, import.meta.url), "utf8");

const texteDuPlugin = lire(".claude-plugin/plugin.json");
const texteDuCatalogue = lire(".claude-plugin/marketplace.json");
const plugin = JSON.parse(texteDuPlugin);
const catalogue = JSON.parse(texteDuCatalogue);

test("le plugin s'appelle a-plat", () => {
  assert.equal(plugin.name, "a-plat");
});

test("le catalogue s'appelle a-plat et ne propose que le plugin a-plat", () => {
  assert.equal(catalogue.name, "a-plat");
  assert.equal(catalogue.plugins[0].name, "a-plat");
  assert.equal(catalogue.plugins[0].source, "./");
});

const DEPOT = "https://github.com/Doukay/a-plat";

test("le plugin donne exactement les adresses du dépôt Doukay/a-plat", () => {
  assert.deepEqual(plugin.author, { name: "Doukay", url: "https://github.com/Doukay" });
  assert.equal(plugin.homepage, DEPOT);
  assert.equal(plugin.repository, DEPOT);
  assert.equal(plugin.documentationUrl, `${DEPOT}/blob/main/docs/README.md`);
  assert.equal(plugin.privacyPolicyUrl, `${DEPOT}/blob/main/docs/confidentialite-et-securite.md`);
  assert.equal(plugin.supportUrl, `${DEPOT}/issues`);
  assert.equal(plugin.license, "MIT");
});

test("le plugin a de 5 à 7 mots-clés", () => {
  assert.ok(Array.isArray(plugin.keywords));
  assert.ok(plugin.keywords.length >= 5 && plugin.keywords.length <= 7, `${plugin.keywords.length} mots-clés`);
});

test("le catalogue est tenu par À plat, à l'adresse du dépôt, rangé en productivité", () => {
  assert.deepEqual(catalogue.owner, { name: "À plat", url: DEPOT });
  assert.equal(catalogue.plugins[0].category, "productivity");
});

test("les deux fichiers ne citent aucune autre adresse que celles de Doukay/a-plat", () => {
  const permises = new Set([
    "https://github.com/Doukay",
    DEPOT,
    `${DEPOT}/blob/main/docs/README.md`,
    `${DEPOT}/blob/main/docs/confidentialite-et-securite.md`,
    `${DEPOT}/issues`,
  ]);
  for (const texte of [texteDuPlugin, texteDuCatalogue]) {
    for (const [adresse] of texte.matchAll(/https?:[^"\s]*/gi)) assert.ok(permises.has(adresse), adresse);
    // un compte GitHub n'apparaît que dans ces adresses
    assert.doesNotMatch(texte.replace(/https:\/\/github\.com\/Doukay[^"]*/g, ""), /github/i);
  }
});
