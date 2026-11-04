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

test("aucun des deux fichiers ne contient de compte GitHub ni d'adresse http", () => {
  for (const texte of [texteDuPlugin, texteDuCatalogue]) {
    assert.doesNotMatch(texte, /http/i);
    assert.doesNotMatch(texte, /github/i);
  }
});
