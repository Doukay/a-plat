// Une seule numérotation : la version du plugin est la même dans plugin.json, package.json, la dernière entrée
// du journal des changements et l'en-tête d'EMPREINTES.txt, pour qu'une publication ne parte jamais à moitié mise à jour.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const chemin = (f) => new URL(`../${f}`, import.meta.url);
const lire = (f) => readFileSync(chemin(f), "utf8");
const plugin = JSON.parse(lire(".claude-plugin/plugin.json"));
const paquet = JSON.parse(lire("package.json"));
const echappee = plugin.version.replaceAll(".", "\\.");

test("la version du plugin est une version sémantique simple (0.1.0)", () => {
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
});

test("package.json porte la même version que le plugin", () => {
  assert.equal(paquet.version, plugin.version);
});

// La date se pose au moment de la publication : d'ici là, l'entrée dit qu'elle est à mettre.
test("la dernière entrée du journal des changements est celle de cette version", () => {
  const entree = /^## (\S+) \((\d{4}-\d{2}-\d{2}|date à mettre au moment de la publication)\)$/m.exec(lire("CHANGELOG.md"));
  assert.ok(entree, "CHANGELOG.md a une entrée « ## <version> (<date>) »");
  assert.equal(entree[1], plugin.version, "version de la dernière entrée de CHANGELOG.md");
});

test("EMPREINTES.txt est pour cette version", () => {
  assert.ok(existsSync(chemin("EMPREINTES.txt")), "EMPREINTES.txt est absent : lance node outils/empreintes.mjs");
  assert.match(lire("EMPREINTES.txt"), new RegExp(`^# a-plat ${echappee} :`), "EMPREINTES.txt d'une autre version : lance node outils/empreintes.mjs");
});

// Les empreintes elles-mêmes : le dépôt doit être celui qu'elles décrivent, sinon une copie
// installée ne pourrait plus se vérifier contre elles.
test("EMPREINTES.txt décrit les fichiers d'aujourd'hui du plugin", () => {
  const r = spawnSync(process.execPath, [fileURLToPath(chemin("outils/empreintes.mjs")), "--check", fileURLToPath(chemin(""))], { encoding: "utf8", timeout: 20000 });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}\nRelancer node outils/empreintes.mjs après le changement.`);
});
