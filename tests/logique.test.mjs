import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const CHEMIN_LOGIQUE = "../skills/a-plat/modele/a-plat/logique.js";
const { validerPlan, texteCorrections, ecranParFichier } = require(CHEMIN_LOGIQUE);

function chargerPlanComplet() {
  const texte = readFileSync(new URL("./fixtures/complet/plan.js", import.meta.url), "utf8");
  const fenetre = {};
  vm.runInNewContext(texte, { window: fenetre });
  // Copie dans le monde de ce test, pour pouvoir la casser sans toucher au reste.
  return JSON.parse(JSON.stringify(fenetre.A_PLAT));
}

function erreursDe(plan) {
  return validerPlan(plan).join("\n");
}

test("validerPlan accepte le plan complet", () => {
  assert.deepEqual(validerPlan(chargerPlanComplet()), []);
});

test("validerPlan refuse un code d'écran en double et le cite", () => {
  const plan = chargerPlanComplet();
  plan.ecrans[2].code = "A1";
  assert.match(erreursDe(plan), /A1/);
  assert.match(erreursDe(plan), /deux fois|double/);
});

test("validerPlan refuse une rangée qui n'existe pas et la cite", () => {
  const plan = chargerPlanComplet();
  plan.ecrans[1].rangee = "Z";
  const texte = erreursDe(plan);
  assert.match(texte, /A2/);
  assert.match(texte, /rangee/);
  assert.match(texte, /Z/);
});

test("validerPlan refuse un état hors liste et cite le champ", () => {
  const plan = chargerPlanComplet();
  plan.etatDesLieux[0].etat = "bizarre";
  const texte = erreursDe(plan);
  assert.match(texte, /etat/);
  assert.match(texte, /bizarre/);
});

test("validerPlan refuse un type de note hors liste et le cite", () => {
  const plan = chargerPlanComplet();
  plan.rangees[0].notes[0].type = "remarque";
  const texte = erreursDe(plan);
  assert.match(texte, /type/);
  assert.match(texte, /remarque/);
});

test("validerPlan refuse une version différente de 1", () => {
  const plan = chargerPlanComplet();
  plan.version = 2;
  assert.match(erreursDe(plan), /version/);
});

test("validerPlan refuse un code inconnu dans etatDesLieux[].ecrans", () => {
  const plan = chargerPlanComplet();
  plan.etatDesLieux[0].ecrans = ["A2", "Q7"];
  const texte = erreursDe(plan);
  assert.match(texte, /Q7/);
  assert.match(texte, /etatDesLieux/);
});

test("validerPlan refuse un statut d'écran hors liste", () => {
  const plan = chargerPlanComplet();
  plan.ecrans[0].statut = "fini";
  assert.match(erreursDe(plan), /statut/);
});

test("validerPlan ne plante pas sur un plan mal formé et renvoie des erreurs", () => {
  const mauvais = [
    undefined,
    null,
    42,
    "plan",
    [],
    {},
    { version: 1 },
    { version: 1, rangees: "A", ecrans: 3, etatDesLieux: {} },
    { version: 1, rangees: [null, 1], ecrans: [null, "A", { code: 5 }], etatDesLieux: [null] },
    { version: 1, rangees: [{ id: "A", notes: "oui" }], ecrans: [], etatDesLieux: [{ ecrans: "A1" }] }
  ];
  for (const plan of mauvais) {
    let resultat;
    assert.doesNotThrow(() => { resultat = validerPlan(plan); }, `plan : ${JSON.stringify(plan)}`);
    assert.ok(Array.isArray(resultat) && resultat.length > 0, `plan : ${JSON.stringify(plan)}`);
    for (const message of resultat) assert.equal(typeof message, "string");
  }
});

test("texteCorrections écrit la liste numérotée", () => {
  assert.equal(
    texteCorrections([{ code: "B3", element: "Bouton Envoyer", texte: "Dire Valider" }], "Prêtoutil"),
    "Corrections pour Prêtoutil :\n\n1. B3 > Bouton Envoyer : Dire Valider"
  );
  assert.equal(
    texteCorrections([
      { code: "B3", element: "Bouton Envoyer", texte: "Dire Valider" },
      { code: "A2", element: "Titre", texte: "Plus court" }
    ], "Prêtoutil"),
    "Corrections pour Prêtoutil :\n\n1. B3 > Bouton Envoyer : Dire Valider\n2. A2 > Titre : Plus court"
  );
});

test("texteCorrections renvoie un texte vide sans correction", () => {
  assert.equal(texteCorrections([], "Prêtoutil"), "");
  assert.equal(texteCorrections(undefined, "Prêtoutil"), "");
});

test("ecranParFichier trouve l'écran du fichier, ou renvoie null", () => {
  const plan = chargerPlanComplet();
  assert.equal(ecranParFichier(plan, "A2-fiche.html").code, "A2");
  assert.equal(ecranParFichier(plan, "inconnu.html"), null);
  assert.equal(ecranParFichier({}, "A2-fiche.html"), null);
  assert.equal(ecranParFichier(null, "A2-fiche.html"), null);
});

test("logique.js s'expose dans window.APlatLogique quand window existe", () => {
  const texte = readFileSync(new URL(CHEMIN_LOGIQUE, import.meta.url), "utf8");
  const fenetre = {};
  vm.runInNewContext(texte, { window: fenetre });
  assert.equal(typeof fenetre.APlatLogique.validerPlan, "function");
  assert.equal(typeof fenetre.APlatLogique.texteCorrections, "function");
  assert.equal(typeof fenetre.APlatLogique.ecranParFichier, "function");
});

test("logique.js se charge sans window ni module sans rien casser", () => {
  const texte = readFileSync(new URL(CHEMIN_LOGIQUE, import.meta.url), "utf8");
  const contexte = {};
  assert.doesNotThrow(() => vm.runInNewContext(texte, contexte));
  assert.deepEqual(Object.keys(contexte), []);
});

test("logique.js n'utilise aucune interface de Node", () => {
  const texte = readFileSync(new URL(CHEMIN_LOGIQUE, import.meta.url), "utf8");
  assert.doesNotMatch(texte, /\brequire\s*\(|\bprocess\b|node:/);
});
