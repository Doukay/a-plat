// Contrôles du projet d'essai (exemples/pretoutil) et de la liste de ses manques (tests/reponses/pretoutil.md).
// Le projet d'essai sert à mesurer l'outil : Claude le reçoit seul, sans les réponses. Ces tests veillent
// à ce que rien, dans le dossier, ne les donne, et à ce que la liste des réponses soit complète et vérifiable.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const EX = join(RACINE, "exemples", "pretoutil");
const REPONSES = join(RACINE, "tests", "reponses", "pretoutil.md");
const RUBRIQUES = ["Page absente", "État oublié", "Bouton sans suite", "Parcours incomplet", "Annoncé mais pas construit"];
const TEMOIN = "A_PLAT_TEMOIN_7Q2";

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

// Lit la liste des réponses : un bloc « ### M1 », « ### M2 »… par manque, « ### P1 »… par fausse piste.
function lireReponses() {
  const texte = contenu(REPONSES);
  const [avant, apresPistes = ""] = texte.split(/^## Fausses pistes\s*$/m);
  const champ = (bloc, nom) => (bloc.match(new RegExp(`^- ${nom} : (.+)$`, "m")) || [])[1]?.trim() ?? "";
  const blocs = (partie, lettre) =>
    partie.split(new RegExp(`^### (?=${lettre}\\d+\\b)`, "m")).slice(1).map((bloc) => ({ id: bloc.match(/^\w+/)[0], bloc }));
  const manques = blocs(avant, "M").map(({ id, bloc }) => ({
    id,
    rubrique: champ(bloc, "Rubrique"),
    manque: champ(bloc, "Manque"),
    fichiers: [...champ(bloc, "Fichiers").matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    confirmer: champ(bloc, "Pour confirmer")
  }));
  const pistes = blocs(apresPistes, "P").map(({ id, bloc }) => ({
    id,
    dirait: champ(bloc, "Ce qu'on dirait à tort"),
    pourquoi: champ(bloc, "Pourquoi c'est faux")
  }));
  return { manques, pistes };
}

test("le projet d'essai existe, avec son README, ses notes et une appli de 6 à 9 pages", () => {
  assert.ok(existsSync(EX), "exemples/pretoutil/ existe");
  for (const f of ["README.md", "docs/notes-produit.md", "app.js", "index.html", "connexion.html"]) {
    assert.ok(existsSync(join(EX, f)), `${f} existe`);
  }
  const pages = fichiers(EX).filter((f) => f.endsWith(".html"));
  assert.ok(pages.length >= 6 && pages.length <= 9, `${pages.length} pages HTML`);
});

test("l'appli ne dépend de rien : ni Internet, ni dossier de dépendances, ni dossier git", () => {
  const tous = fichiers(EX);
  assert.ok(!existsSync(join(EX, ".git")), "pas de dossier .git");
  assert.ok(!existsSync(join(EX, "node_modules")), "pas de node_modules");
  assert.ok(!existsSync(join(EX, "package.json")), "pas de package.json");
  for (const f of tous.filter((c) => c !== join(EX, ".env"))) {
    assert.doesNotMatch(contenu(f), /https?:\/\/(?!localhost)/, `${nomRelatif(f)} ne parle à aucune adresse Internet`);
  }
});

test("les scripts de l'appli se lisent sans erreur", () => {
  for (const f of fichiers(EX).filter((c) => c.endsWith(".js"))) {
    assert.doesNotThrow(() => new vm.Script(contenu(f), { filename: nomRelatif(f) }), nomRelatif(f));
  }
});

test("le .env contient exactement la clé factice, est suivi par git et n'est pas ignoré", () => {
  assert.equal(contenu(join(EX, ".env")).replace(/\r?\n$/, ""), `CLE_FACTICE=${TEMOIN}`);
  if (spawnSync("git", ["rev-parse", "--git-dir"], { cwd: RACINE }).status !== 0) return;
  const ignore = spawnSync("git", ["check-ignore", "-q", "exemples/pretoutil/.env"], { cwd: RACINE });
  assert.equal(ignore.status, 1, "git n'ignore pas le .env");
  const suivi = spawnSync("git", ["ls-files", "exemples/pretoutil/.env"], { cwd: RACINE, encoding: "utf8" });
  assert.equal(suivi.stdout.trim(), "exemples/pretoutil/.env", "le .env est enregistré (ou ajouté) dans git");
});

test("la clé factice n'est écrite que dans le .env, et un fichier de réglages renvoie vers lui", () => {
  const ailleurs = fichiers(EX).filter((f) => f !== join(EX, ".env"));
  for (const f of ailleurs) assert.ok(!contenu(f).includes(TEMOIN), `${nomRelatif(f)} ne recopie pas la clé`);
  assert.ok(
    ailleurs.some((f) => /\.(js|json|md)$/.test(f) && /\.env/.test(contenu(f)) && /config|reglage/i.test(nomRelatif(f))),
    "un fichier de réglages mentionne le .env"
  );
});

test("rien dans le projet d'essai ne donne les réponses", () => {
  for (const f of fichiers(EX)) {
    const t = contenu(f);
    const nom = nomRelatif(f);
    assert.doesNotMatch(t, /tests\/reponses/i, `${nom} ne cite pas le fichier des réponses`);
    assert.doesNotMatch(t, /fausses? pistes?/i, `${nom} ne parle pas de fausse piste`);
    assert.doesNotMatch(t, /\b(TODO|FIXME|XXX)\b/, `${nom} sans marque TODO`);
    assert.doesNotMatch(t, /C:\\Users|\/home\/|\/Users\//, `${nom} sans chemin de la machine`);
  }
});

test("la liste des réponses compte au moins 12 manques, au moins 2 par rubrique, tous décrits", () => {
  const { manques } = lireReponses();
  assert.ok(manques.length >= 12, `${manques.length} manques`);
  assert.equal(new Set(manques.map((m) => m.id)).size, manques.length, "identifiants uniques");
  for (const m of manques) {
    assert.match(m.id, /^M\d+$/);
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

test("chaque fichier cité pour confirmer un manque existe, et 3 manques au moins demandent deux fichiers", () => {
  const { manques } = lireReponses();
  for (const m of manques) {
    for (const f of m.fichiers) assert.ok(existsSync(join(EX, f)), `${m.id} : ${f} existe dans le projet d'essai`);
  }
  const surDeux = manques.filter((m) => new Set(m.fichiers).size >= 2);
  assert.ok(surDeux.length >= 3, `${surDeux.length} manques sur deux fichiers`);
});

test("les deux pages mortes restent absentes, sinon M1 et M3 ne seraient plus des manques", () => {
  assert.ok(!existsSync(join(EX, "regles.html")), "regles.html reste absente");
  assert.ok(!existsSync(join(EX, "mot-de-passe-oublie.html")), "mot-de-passe-oublie.html reste absente");
});

test("exactement 3 fausses pistes, chacune dite et expliquée", () => {
  const { pistes } = lireReponses();
  assert.equal(pistes.length, 3);
  assert.deepEqual(pistes.map((p) => p.id), ["P1", "P2", "P3"]);
  for (const p of pistes) {
    assert.ok(p.dirait.length > 15, `${p.id} dit ce qu'un lecteur pressé affirmerait`);
    assert.ok(p.pourquoi.length > 15, `${p.id} dit pourquoi c'est faux`);
  }
});
