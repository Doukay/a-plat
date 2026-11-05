// Contrôles de la démo (tests/fixtures/demo) : un projet inventé, Prêtoutil, pour montrer la page
// et servir d'exemple. Ces tests ne regardent que les fichiers ; tests/page/demo.test.mjs l'ouvre dans la page.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DEMO = fileURLToPath(new URL("./fixtures/demo", import.meta.url));
const VERIFIER = fileURLToPath(new URL("../skills/a-plat/verifier.mjs", import.meta.url));
const ASSEMBLER = fileURLToPath(new URL("./assembler-demo.mjs", import.meta.url));

const fenetre = {};
vm.runInNewContext(readFileSync(join(DEMO, "plan.js"), "utf8"), { window: fenetre });
const plan = fenetre.A_PLAT;
const html = (ecran) => readFileSync(join(DEMO, "ecrans", ecran.fichier), "utf8");

test("la démo passe le contrôle, avec ses 8 écrans, et signale ses textes entre crochets", () => {
  const r = spawnSync(process.execPath, [VERIFIER, DEMO], { encoding: "utf8", timeout: 20000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /8 écrans vérifiés/);
  assert.match(r.stdout, /texte(s)? entre crochets/);
});

test("le dossier de la démo ne contient que plan.js, ecrans/ et actuel/ : jamais une copie du modèle", () => {
  assert.deepEqual(readdirSync(DEMO).sort(), ["actuel", "ecrans", "plan.js"]);
});

test("huit écrans de 390 de large, en trois rangées, dont un seul validé", () => {
  assert.equal(plan.projet, "Prêtoutil");
  assert.equal(plan.ecrans.length, 8);
  assert.equal(plan.rangees.length, 3);
  assert.ok(plan.ecrans.every((e) => e.largeur === 390 && e.hauteur === 844));
  assert.equal(plan.ecrans.filter((e) => e.statut === "valide").length, 1);
  assert.ok(plan.ecrans.filter((e) => e.statut === "a-relire").length >= 6);
  for (const rangee of plan.rangees) assert.ok(plan.ecrans.some((e) => e.rangee === rangee.id), `la rangée ${rangee.id} a des écrans`);
});

test("un existant redessiné en HTML et un existant en vraie capture PNG de moins de 60 Ko", () => {
  const avecActuel = plan.ecrans.filter((e) => e.actuel);
  const redessines = avecActuel.filter((e) => e.actuel.origine === "redessine");
  const captures = avecActuel.filter((e) => e.actuel.origine === "capture");
  assert.equal(redessines.length, 1);
  assert.equal(captures.length, 1);
  assert.match(redessines[0].actuel.fichier, /^actuel\/.+\.html$/);
  assert.match(captures[0].actuel.fichier, /^actuel\/.+\.png$/);
  const octets = readFileSync(join(DEMO, captures[0].actuel.fichier));
  assert.deepEqual([...octets.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "c'est un vrai PNG");
  assert.ok(octets.length < 60 * 1024, `la capture pèse ${octets.length} octets`);
  assert.ok(octets.readUInt32BE(16) >= 300 && octets.readUInt32BE(20) >= 600, "la capture a la taille d'un écran de téléphone");
  assert.match(readFileSync(join(DEMO, redessines[0].actuel.fichier), "utf8"), /relais\.js/);
});

test("les notes ont les cinq types, une date, et une ancienne valeur", () => {
  const notes = plan.rangees.flatMap((r) => r.notes);
  assert.deepEqual([...new Set(notes.map((n) => n.type))].sort(), ["a-coder", "a-trancher", "a-verifier", "decision", "source"]);
  assert.ok(notes.every((n) => /^\d{4}-\d{2}-\d{2}$/.test(n.date) && n.texte.length > 0 && n.texte.length <= 90));
  assert.equal(notes.filter((n) => n.ancien).length, 1);
});

test("l'état des lieux a les quatre états, des sources qui sont des chemins, et des lignes à confirmer", () => {
  const lignes = plan.etatDesLieux;
  assert.deepEqual([...new Set(lignes.map((l) => l.etat))].sort(), ["a-completer", "existe", "manque", "prevue"]);
  for (const l of lignes) {
    assert.match(l.source, /^[\w.\-]+(\/[\w.\-]+)+$/, `source en forme de chemin : ${l.source}`);
    assert.ok(l.raison.length > 0 && l.raison.length <= 140);
  }
  assert.ok(lignes.some((l) => l.aConfirmer === true) && lignes.some((l) => l.aConfirmer === false));
  assert.ok(new Set(lignes.map((l) => l.groupe)).size >= 3);
});

test("les écrans sont liés : de l'accueil, on atteint les huit écrans, dont la demande envoyée et mes prêts", () => {
  const parFichier = new Map(plan.ecrans.map((e) => [e.fichier, e]));
  const voisins = (ecran) => [...html(ecran).replace(/<!--[\s\S]*?-->/g, "").matchAll(/<(?:a|form)\b[^>]*\b(?:href|action)="([^"#]+\.html)"/g)]
    .map((m) => parFichier.get(m[1])).filter(Boolean);
  const vus = new Set(["A1"]);
  const file = [plan.ecrans.find((e) => e.code === "A1")];
  while (file.length) for (const v of voisins(file.shift())) if (!vus.has(v.code)) { vus.add(v.code); file.push(v); }
  assert.deepEqual([...vus].sort(), [...plan.ecrans.map((e) => e.code)].sort());
  // Le chemin principal, touche par touche.
  const chemin = ["A1", "A2", "B1", "B2", "C1"];
  for (let i = 0; i + 1 < chemin.length; i++) {
    const de = plan.ecrans.find((e) => e.code === chemin[i]);
    assert.ok(voisins(de).some((v) => v.code === chemin[i + 1]), `${chemin[i]} mène à ${chemin[i + 1]}`);
  }
});

test("les écrans emploient commun.css, sans style propre, avec de vrais textes, au moins un texte entre crochets", () => {
  let crochets = 0;
  for (const ecran of plan.ecrans) {
    const texte = html(ecran);
    assert.match(texte, /<html lang="fr" data-ecran="/);
    assert.match(texte, /<link rel="stylesheet" href="\.\.\/commun\.css">/, `${ecran.code} charge commun.css`);
    assert.doesNotMatch(texte, /<style|style="/i, `${ecran.code} n'a pas de style à lui : il passe par commun.css`);
    assert.doesNotMatch(texte, /lorem|ipsum/i);
    assert.match(texte, /<h1\b/, `${ecran.code} a un titre`);
    crochets += (texte.replace(/<!--[\s\S]*?-->/g, "").match(/\[[^\[\]<>\n]+\]/g) || []).length;
  }
  assert.ok(crochets >= 1);
});

test("aucune donnée réelle : ni adresse, ni chemin de machine, ni nom de domaine, ni numéro", () => {
  const tout = [readFileSync(join(DEMO, "plan.js"), "utf8"), ...plan.ecrans.map(html),
    readFileSync(join(DEMO, plan.ecrans.find((e) => e.actuel && e.actuel.origine === "redessine").actuel.fichier), "utf8")].join("\n");
  assert.doesNotMatch(tout, /https?:|www\.|@[a-z]+\.[a-z]|[A-Z]:\\|\/Users\/|\/home\//i);
  assert.doesNotMatch(tout, /\b0\d([ .]?\d\d){4}\b/, "pas de numéro de téléphone");
});

// ---------------------------------------------------------------- l'assemblage de la démo

const dossiers = [];
after(() => { while (dossiers.length) rmSync(dossiers.pop(), { recursive: true, force: true }); });

test("assembler-demo copie le modèle puis la démo, et affiche le chemin de index.html", () => {
  const destination = join(mkdtempSync(join(tmpdir(), "a-plat-demo-")), "demo");
  dossiers.push(join(destination, ".."));
  const r = spawnSync(process.execPath, [ASSEMBLER, destination], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(r.stdout.trim(), join(destination, "index.html"));
  for (const chemin of ["index.html", "commun.css", "ecran-type.html", "plan.js", "a-plat/moteur.js", "ecrans/A1-accueil.html", "actuel"]) {
    assert.ok(existsSync(join(destination, chemin)), `${chemin} est dans la démo assemblée`);
  }
  assert.ok(statSync(join(destination, "plan.js")).size > 2000, "plan.js est celui de la démo, pas celui du modèle vide");
  const encore = spawnSync(process.execPath, [VERIFIER, destination], { encoding: "utf8" });
  assert.equal(encore.status, 0, encore.stdout + encore.stderr);
});

test("assembler-demo refuse une destination qui n'est pas vide, et ne touche à rien", () => {
  const destination = mkdtempSync(join(tmpdir(), "a-plat-demo-"));
  dossiers.push(destination);
  const marque = join(destination, "mon-fichier.txt");
  // Un fichier de test est écrit par la commande suivante, pas par un outil du dépôt.
  spawnSync(process.execPath, ["-e", `require("fs").writeFileSync(${JSON.stringify(marque)}, "à garder")`]);
  const r = spawnSync(process.execPath, [ASSEMBLER, destination], { encoding: "utf8" });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /vide/);
  assert.deepEqual(readdirSync(destination), ["mon-fichier.txt"]);
  assert.equal(readFileSync(marque, "utf8"), "à garder");
});

test("assembler-demo sans argument donne le mode d'emploi", () => {
  const r = spawnSync(process.execPath, [ASSEMBLER], { encoding: "utf8" });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /assembler-demo\.mjs/);
});
