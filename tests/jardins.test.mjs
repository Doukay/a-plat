// Contrôles du second projet d'essai (exemples/jardins) et de la liste de ses manques (tests/reponses/jardins.md).
// Le projet sert à mesurer l'outil : Claude le reçoit seul, sans les réponses. Ces tests veillent à ce que rien,
// dans le dossier, ne les donne, et à ce que la liste des réponses soit complète et vérifiable.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const EX = join(RACINE, "exemples", "jardins");
const REPONSES = join(RACINE, "tests", "reponses", "jardins.md");
const RUBRIQUES = [
  "Page absente",
  "État oublié",
  "Bouton ou lien sans suite",
  "Parcours incomplet",
  "Annoncé mais pas construit"
];
const JETON = "A_PLAT_TEMOIN_J4R";

function fichiers(dossier) {
  const liste = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) liste.push(...fichiers(chemin));
    else liste.push(chemin);
  }
  return liste;
}
const nomRelatif = (chemin) => relative(EX, chemin).split("\\").join("/");
const contenu = (chemin) => readFileSync(chemin, "utf8");

// Lit la liste des réponses : un bloc « ### J1 »… par manque, « ### F1 »… par fausse piste.
function lireReponses() {
  const texte = contenu(REPONSES);
  const [avant, apresPistes = ""] = texte.split(/^## Fausses pistes\s*$/m);
  const champ = (bloc, nom) => (bloc.match(new RegExp(`^- ${nom} : (.+)$`, "m")) || [])[1]?.trim() ?? "";
  const blocs = (partie, lettre) =>
    partie
      .split(new RegExp(`^### (?=${lettre}\\d+\\b)`, "m"))
      .slice(1)
      .map((bloc) => ({ id: bloc.match(/^\w+/)[0], bloc }));
  const manques = blocs(avant, "J").map(({ id, bloc }) => ({
    id,
    rubrique: champ(bloc, "Rubrique"),
    manque: champ(bloc, "Manque"),
    fichiers: [...champ(bloc, "Fichiers").matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    confirmer: champ(bloc, "Pour confirmer")
  }));
  const pistes = blocs(apresPistes.split(/^## Cas tolérés\s*$/m)[0], "F").map(({ id, bloc }) => ({
    id,
    dirait: champ(bloc, "Ce qu'on dirait à tort"),
    pourquoi: champ(bloc, "Pourquoi c'est faux")
  }));
  return { texte, manques, pistes };
}

test("le projet d'essai existe, avec son README, le compte rendu et une appli de 7 à 10 vues", () => {
  assert.ok(existsSync(EX), "exemples/jardins/ existe");
  for (const f of [
    "README.md",
    "docs/compte-rendu-ag.md",
    "index.html",
    "src/routes.js",
    "src/donnees.js",
    "src/session.js"
  ]) {
    assert.ok(existsSync(join(EX, f)), `${f} existe`);
  }
  const vues = readdirSync(join(EX, "src", "vues")).filter((f) => f.endsWith(".js"));
  assert.ok(vues.length >= 7 && vues.length <= 10, `${vues.length} vues`);
  assert.equal(fichiers(EX).filter((f) => f.endsWith(".html")).length, 1, "une seule page HTML");
});

test("l'appli ne dépend de rien : ni Internet, ni dossier de dépendances, ni étape de construction", () => {
  assert.ok(!existsSync(join(EX, ".git")), "pas de dossier .git");
  assert.ok(!existsSync(join(EX, "node_modules")), "pas de node_modules");
  assert.ok(!existsSync(join(EX, "package.json")), "pas de package.json");
  for (const f of fichiers(EX).filter((c) => c !== join(EX, ".env"))) {
    assert.doesNotMatch(contenu(f), /https?:\/\/(?!localhost)/, `${nomRelatif(f)} ne parle à aucune adresse Internet`);
  }
});

test("le README dit que les modules ne se chargent pas depuis file://", () => {
  assert.match(contenu(join(EX, "README.md")), /file:\/\//);
});

test("le .env contient exactement le jeton factice, est suivi par git et n'est pas ignoré", () => {
  assert.equal(contenu(join(EX, ".env")).replace(/\r?\n$/, ""), `JETON_FACTICE=${JETON}`);
  if (spawnSync("git", ["rev-parse", "--git-dir"], { cwd: RACINE }).status !== 0) return;
  const ignore = spawnSync("git", ["check-ignore", "-q", "exemples/jardins/.env"], { cwd: RACINE });
  assert.equal(ignore.status, 1, "git n'ignore pas le .env");
  const suivi = spawnSync("git", ["ls-files", "exemples/jardins/.env"], { cwd: RACINE, encoding: "utf8" });
  assert.equal(suivi.stdout.trim(), "exemples/jardins/.env", "le .env est enregistré (ou ajouté) dans git");
});

test("le jeton n'est écrit que dans le .env, et un fichier de réglages renvoie vers lui", () => {
  const ailleurs = fichiers(EX).filter((f) => f !== join(EX, ".env"));
  for (const f of ailleurs) assert.ok(!contenu(f).includes(JETON), `${nomRelatif(f)} ne recopie pas le jeton`);
  assert.ok(
    ailleurs.some((f) => /config/i.test(nomRelatif(f)) && /\.env/.test(contenu(f))),
    "un fichier de réglages mentionne le .env"
  );
});

test("rien dans le projet d'essai ne donne les réponses ni ne révèle une machine", () => {
  for (const f of fichiers(EX)) {
    const t = contenu(f);
    const nom = nomRelatif(f);
    assert.doesNotMatch(t, /tests\/reponses/i, `${nom} ne cite pas le fichier des réponses`);
    assert.doesNotMatch(t, /fausses? pistes?/i, `${nom} ne parle pas de fausse piste`);
    assert.doesNotMatch(t, /\b(TODO|FIXME|XXX)\b/, `${nom} sans marque TODO`);
    assert.doesNotMatch(t, /\bmanqu/i, `${nom} n'écrit pas « manque »`);
    assert.doesNotMatch(t, /C:\\Use[r]s|\/home\/|\/Users\//i, `${nom} sans chemin de la machine`);
  }
  assert.ok(!fichiers(EX).some((f) => /(^|[/_.-])J\d+([/_.-]|$)/.test(nomRelatif(f))), "aucun fichier nommé comme un manque");
});

test("la liste des réponses compte de 15 à 20 manques, au moins 2 par rubrique, tous décrits", () => {
  const { manques } = lireReponses();
  assert.ok(manques.length >= 15 && manques.length <= 20, `${manques.length} manques`);
  assert.equal(new Set(manques.map((m) => m.id)).size, manques.length, "identifiants uniques");
  for (const m of manques) {
    assert.match(m.id, /^J\d+$/);
    assert.ok(RUBRIQUES.includes(m.rubrique), `${m.id} : rubrique « ${m.rubrique} » connue`);
    assert.ok(m.manque.length > 15, `${m.id} a une ligne de comparaison`);
    assert.ok(m.confirmer.length > 15, `${m.id} dit comment le confirmer`);
    assert.ok(m.fichiers.length >= 1, `${m.id} cite un fichier`);
  }
  for (const r of RUBRIQUES) {
    const n = manques.filter((m) => m.rubrique === r).length;
    assert.ok(n >= 2, `la rubrique « ${r} » a ${n} manque(s), il en faut 2`);
  }
});

test("chaque fichier cité pour confirmer un manque existe, et 5 manques au moins demandent deux fichiers", () => {
  const { manques } = lireReponses();
  for (const m of manques) {
    for (const f of m.fichiers) assert.ok(existsSync(join(EX, f)), `${m.id} : ${f} existe dans le projet d'essai`);
  }
  const surDeux = manques.filter((m) => new Set(m.fichiers).size >= 2);
  assert.ok(surDeux.length >= 5, `${surDeux.length} manques sur deux fichiers`);
});

test("les pages décidées mais jamais construites restent absentes, sinon J1 à J3 ne seraient plus des manques", () => {
  const routes = contenu(join(EX, "src", "routes.js"));
  assert.doesNotMatch(routes, /reglement|adhesion|inscription|membres\b/i, "aucune adresse de règlement, d'adhésion ou de membres");
  assert.doesNotMatch(routes, /code-oublie|historique/i, "les adresses des liens sans suite restent absentes");
  const vues = readdirSync(join(EX, "src", "vues"));
  assert.ok(!vues.some((v) => /reglement|adhesion|membres/i.test(v)), "aucune vue de règlement, d'adhésion ou de membres");
});

test("exactement 3 fausses pistes, chacune dite et expliquée", () => {
  const { pistes } = lireReponses();
  assert.equal(pistes.length, 3);
  assert.deepEqual(pistes.map((p) => p.id), ["F1", "F2", "F3"]);
  for (const p of pistes) {
    assert.ok(p.dirait.length > 15, `${p.id} dit ce qu'un lecteur pressé affirmerait`);
    assert.ok(p.pourquoi.length > 15, `${p.id} dit pourquoi c'est faux`);
  }
});

test("la liste des réponses a ses cas tolérés, sa clause et ses autres défauts réels", () => {
  const { texte } = lireReponses();
  assert.match(texte, /^## Cas tolérés\s*$/m);
  assert.match(texte, /^## Autres défauts réels\s*$/m);
  assert.ok(
    texte.includes("autre défaut réel et vérifiable dans le code : compté à part, ni trouvé ni inventé"),
    "la clause est écrite"
  );
});
