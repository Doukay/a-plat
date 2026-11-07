import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const CHEMIN_LOGIQUE = "../skills/a-plat/modele/a-plat/logique.js";
const { validerPlan, texteCorrections, ecranParFichier, fichierSur, nomDeLAvancement, inchangesACompleter } = require(CHEMIN_LOGIQUE);

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

test("validerPlan accepte une note qui cite des écrans par leur code, ou une liste vide", () => {
  const plan = chargerPlanComplet();
  plan.rangees[0].notes[0].ecrans = ["A1", "A2"];
  plan.rangees[0].notes.push({ type: "source", date: "2026-11-06", texte: "Pour toute la rangée.", ecrans: [] });
  assert.deepEqual(validerPlan(plan), []);
});

test("validerPlan refuse un champ ecrans de note qui n'est pas une liste, et cite la rangée et la note", () => {
  for (const valeur of ["A1", 3, { A1: true }, null]) {
    const plan = chargerPlanComplet();
    plan.rangees[0].notes[0].ecrans = valeur;
    const erreurs = validerPlan(plan);
    assert.equal(erreurs.length, 1, `ecrans: ${JSON.stringify(valeur)}`);
    assert.match(erreurs[0], /La note 1 de la rangée A/);
    assert.match(erreurs[0], /ecrans/);
    assert.match(erreurs[0], /liste de codes/);
  }
});

test("validerPlan refuse un code inconnu dans les écrans d'une note, et cite la rangée, la note et le code", () => {
  const plan = chargerPlanComplet();
  plan.rangees[0].notes.push({ type: "decision", date: "2026-11-06", texte: "Deuxième.", ecrans: ["A1", "Q7", 4] });
  const erreurs = validerPlan(plan);
  const numero = plan.rangees[0].notes.length;
  assert.equal(erreurs.length, 2);
  assert.match(erreurs[0], new RegExp(`La note ${numero} de la rangée A cite l'écran « Q7 », qui n'existe pas dans ecrans`));
  assert.match(erreurs[1], new RegExp(`La note ${numero} de la rangée A cite l'écran 4`));
});

test("pour la page, une note qui cite un écran absent ne bloque pas le plan ; pour le contrôle, si", () => {
  const plan = chargerPlanComplet();
  plan.rangees[0].notes[0].ecrans = ["A1", "Z9"];
  assert.deepEqual(validerPlan(plan, { pourLaPage: true }), [], "la page affiche quand même le plan");
  assert.match(validerPlan(plan).join("\n"), /cite l'écran « Z9 », qui n'existe pas/, "le contrôle le signale");
  // Un champ ecrans qui n'est pas une liste reste une erreur, même pour la page : le plan est mal écrit.
  plan.rangees[0].notes[0].ecrans = "A1";
  assert.equal(validerPlan(plan, { pourLaPage: true }).length, 1);
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

// ---------------------------------------------------------------- fichiers sûrs et doublons

const FICHIERS_REFUSES = ["../secret.html", "https://exemple.test/x.html", "/etc/page.html", "%2e%2e/x.html", "sous\\x.html", "//exemple.test/x.html", "file:x.html", "a%ZZ.html"];

for (const fichier of FICHIERS_REFUSES) {
  test(`validerPlan refuse le fichier d'écran ${fichier} et cite l'écran`, () => {
    const plan = chargerPlanComplet();
    plan.ecrans[1].fichier = fichier;
    const texte = erreursDe(plan);
    assert.match(texte, /A2/);
    assert.match(texte, /fichier/);
    assert.match(texte, /dossier ecrans\//);
  });
}

test("validerPlan refuse un actuel.fichier qui sort du dossier actuel/ et cite l'écran", () => {
  for (const fichier of ["actuel/../../x.png", "https://exemple.test/x.png", "actuel\\x.png", "/x.png"]) {
    const plan = chargerPlanComplet();
    plan.ecrans[1].actuel.fichier = fichier;
    const texte = erreursDe(plan);
    assert.match(texte, /A2/, fichier);
    assert.match(texte, /actuel/, fichier);
    assert.match(texte, /dossier actuel\//, fichier);
  }
});

test("validerPlan accepte un actuel.fichier avec ou sans actuel/ devant", () => {
  const plan = chargerPlanComplet();
  plan.ecrans[1].actuel.fichier = "A2-fiche.png";
  assert.deepEqual(validerPlan(plan), []);
});

test("validerPlan refuse deux écrans qui ont le même fichier et cite le fichier", () => {
  const plan = chargerPlanComplet();
  plan.ecrans[2].fichier = "A1-accueil.html";
  const texte = erreursDe(plan);
  assert.match(texte, /A1-accueil\.html/);
  assert.match(texte, /B1/);
  assert.match(texte, /deux fois|double/);
});

test("validerPlan refuse deux rangées qui ont le même id et cite l'id", () => {
  const plan = chargerPlanComplet();
  plan.rangees[1].id = "A";
  const texte = erreursDe(plan);
  assert.match(texte, /rangée A|id « A »/);
  assert.match(texte, /deux fois|double/);
});

test("le fichierSur de logique.js est le même que celui de la page (moteur.js)", () => {
  const corps = (chemin) => {
    const texte = readFileSync(new URL(chemin, import.meta.url), "utf8");
    const m = texte.match(/function fichierSur\(valeur\) \{[\s\S]*?\n {4}return valeur;\n {2}\}/);
    assert.ok(m, `fichierSur introuvable dans ${chemin}`);
    return m[0];
  };
  assert.equal(corps(CHEMIN_LOGIQUE), corps("../skills/a-plat/modele/a-plat/moteur.js"));
});

test("fichierSur garde un bon fichier et refuse les autres", () => {
  assert.equal(fichierSur("A2-fiche.html"), "A2-fiche.html");
  assert.equal(fichierSur("actuel/A2-fiche.png"), "actuel/A2-fiche.png");
  for (const fichier of [...FICHIERS_REFUSES, "", undefined, 3, "a\u0001.html"]) assert.equal(fichierSur(fichier), null, String(fichier));
});

test("validerPlan accepte un écran inchange: true sans actuel", () => {
  const plan = chargerPlanComplet();
  plan.ecrans.find((e) => !e.actuel).inchange = true;
  assert.deepEqual(validerPlan(plan), []);
});

test("validerPlan refuse un inchange qui n'est pas true ou false, et le cite", () => {
  const plan = chargerPlanComplet();
  plan.ecrans[0].inchange = "oui";
  const texte = erreursDe(plan);
  assert.match(texte, new RegExp(plan.ecrans[0].code));
  assert.match(texte, /inchange/);
});

test("validerPlan accepte inchange: false, avec ou sans actuel", () => {
  const plan = chargerPlanComplet();
  for (const ecran of plan.ecrans) ecran.inchange = false;
  assert.deepEqual(validerPlan(plan), []);
});

test("validerPlan refuse inchange: true avec un actuel incomplet ({} ou sans fichier)", () => {
  for (const actuel of [{}, { origine: "capture" }]) {
    const plan = chargerPlanComplet();
    const ecran = plan.ecrans.find((e) => !e.actuel);
    ecran.inchange = true;
    ecran.actuel = actuel;
    assert.match(erreursDe(plan), /inchange/, JSON.stringify(actuel));
  }
});

test("validerPlan refuse un écran inchange: true qui a aussi un actuel", () => {
  const plan = chargerPlanComplet();
  const ecran = plan.ecrans.find((e) => e.actuel && e.actuel.fichier);
  ecran.inchange = true;
  const texte = erreursDe(plan);
  assert.match(texte, new RegExp(ecran.code));
  assert.match(texte, /inchange/);
  assert.match(texte, /actuel/);
});

test("validerPlan accepte un plan sans avancement, et chacun des quatre niveaux", () => {
  const plan = chargerPlanComplet();
  delete plan.avancement;
  assert.deepEqual(validerPlan(plan), []);
  for (const niveau of ["idee", "debut", "en-cours", "avance"]) {
    plan.avancement = { niveau, raison: "parce que les pages sont là (src/)." };
    assert.deepEqual(validerPlan(plan), [], niveau);
  }
});

test("validerPlan refuse un niveau d'avancement inconnu, et cite les quatre permis", () => {
  for (const avancement of [{ niveau: "avancé", raison: "x" }, { raison: "x" }]) {
    const plan = chargerPlanComplet();
    plan.avancement = avancement;
    assert.match(erreursDe(plan), /avancement\.niveau : idee, debut, en-cours, avance, sans accent/, JSON.stringify(avancement));
  }
  for (const avancement of ["avance", null, ["avance"]]) {
    const plan = chargerPlanComplet();
    plan.avancement = avancement;
    assert.match(erreursDe(plan), /doit être un objet \{ niveau, raison \}/, JSON.stringify(avancement));
  }
});

test("pour la page, un avancement mal écrit ne refuse pas le plan : il ne s'affiche pas, c'est tout", () => {
  for (const avancement of [{ niveau: "avancé", raison: "x" }, "avance", null, { niveau: "avance", raison: "" }]) {
    const plan = chargerPlanComplet();
    plan.avancement = avancement;
    assert.deepEqual(validerPlan(plan, { pourLaPage: true }), [], JSON.stringify(avancement));
    assert.equal(nomDeLAvancement(plan), null, JSON.stringify(avancement));
  }
  const plan = chargerPlanComplet();
  plan.avancement = { niveau: "constructor", raison: "x" };
  assert.equal(nomDeLAvancement(plan), null, "un nom hérité d'Object n'est pas un niveau");
});

test("validerPlan refuse un avancement sans raison", () => {
  const plan = chargerPlanComplet();
  plan.avancement = { niveau: "avance", raison: "" };
  assert.match(erreursDe(plan), /avancement\.raison/);
});

test("nomDeLAvancement donne le niveau en toutes lettres, ou null", () => {
  const plan = chargerPlanComplet();
  plan.avancement = { niveau: "en-cours", raison: "x" };
  assert.equal(nomDeLAvancement(plan), "en cours");
  plan.avancement.niveau = "avance";
  assert.equal(nomDeLAvancement(plan), "avancé");
  delete plan.avancement;
  assert.equal(nomDeLAvancement(plan), null);
  assert.equal(nomDeLAvancement(null), null);
});

test("inchangesACompleter rend les écrans inchangés des pages à compléter, et seulement eux", () => {
  const plan = chargerPlanComplet();
  // A2 : page à compléter ; B1 : page qui existe. Les deux deviennent inchangés.
  for (const code of ["A2", "B1"]) {
    const ecran = plan.ecrans.find((e) => e.code === code);
    ecran.inchange = true;
    ecran.actuel = null;
  }
  assert.deepEqual(inchangesACompleter(plan), ["A2"]);
  // Deux pages à compléter qui citent le même écran : il ne compte qu'une fois.
  plan.etatDesLieux.push({ ...plan.etatDesLieux[0], page: "Autre page" });
  assert.deepEqual(inchangesACompleter(plan), ["A2"]);
  plan.etatDesLieux.pop();
  plan.etatDesLieux[0].etat = "existe";
  assert.deepEqual(inchangesACompleter(plan), []);
  assert.deepEqual(inchangesACompleter({}), []);
});
