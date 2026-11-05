// Contrôles de la méthode écrite pour Claude (skills/a-plat). Ils ne jugent pas si elle marche : ça,
// seul un essai le dit. Ils veillent à ce qu'elle reste chargeable, complète et sans donnée personnelle.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = fileURLToPath(new URL("../skills/a-plat", import.meta.url));
const REFERENCES = ["lire-un-projet", "etat-des-lieux", "ecrans", "format", "corrections-et-notes", "passage-au-code"];

const lire = (...morceaux) => readFileSync(join(SKILL, ...morceaux), "utf8");
const nomRelatif = (chemin) => relative(SKILL, chemin).split("\\").join("/");

function fichiers(dossier) {
  const liste = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) liste.push(...fichiers(chemin));
    else liste.push(chemin);
  }
  return liste;
}

// La méthode elle-même : SKILL.md et ses références, sans le modèle ni le contrôle.
function fichiersDeLaMethode() {
  const dossier = join(SKILL, "references");
  return [join(SKILL, "SKILL.md"), ...(existsSync(dossier) ? fichiers(dossier) : [])];
}

function enTete(texte) {
  const bloc = texte.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(bloc, "SKILL.md doit commencer par un en-tête entre deux lignes ---");
  const champ = (nom) => (bloc[1].match(new RegExp(`^${nom}:\\s*(.+)$`, "m")) || [])[1]?.trim() ?? "";
  return { name: champ("name"), description: champ("description"), fin: bloc[0].length };
}

const texteDuSkill = lire("SKILL.md");
const toutLeTexte = () => fichiersDeLaMethode().map((f) => readFileSync(f, "utf8")).join("\n");

test("le skill s'appelle a-plat", () => {
  assert.equal(enTete(texteDuSkill).name, "a-plat");
});

test("la description dit quand s'en servir, avec les mots d'une personne qui ne code pas", () => {
  const { description } = enTete(texteDuSkill);
  assert.ok(description.length > 80, "la description est trop courte pour dire quand s'en servir");
  assert.ok(description.length <= 1000, `la description est trop longue : ${description.length} caractères`);
  for (const mots of [/\/a-plat/, /où en est/i, /maquette/i, /manque/i, /page par page|écran par écran/i, /n'importe quel moment/i, /idée/i]) {
    assert.match(description, mots);
  }
});

test("SKILL.md tient en 150 lignes au plus", () => {
  const lignes = texteDuSkill.trimEnd().split(/\r?\n/).length;
  assert.ok(lignes <= 150, `SKILL.md fait ${lignes} lignes`);
});

test("le principe est dit dès les premières lignes", () => {
  const debut = texteDuSkill.slice(enTete(texteDuSkill).fin).trimStart().split(/\r?\n/).slice(0, 5).join("\n");
  assert.match(debut, /met à plat ce que la personne a/i);
  assert.match(debut, /n'impose rien/i);
});

test("les six références existent et SKILL.md les cite toutes", () => {
  for (const nom of REFERENCES) {
    assert.ok(existsSync(join(SKILL, "references", `${nom}.md`)), `references/${nom}.md est absente`);
    assert.ok(texteDuSkill.includes(`references/${nom}.md`), `SKILL.md ne cite pas references/${nom}.md`);
  }
});

test("tout fichier cité par la méthode existe dans le skill", () => {
  const cites = /(?:<skill>\/)?((?:references|modele)\/[\p{L}\p{N}_./-]*[\p{L}\p{N}_-]|verifier\.mjs)/gu;
  for (const fichier of fichiersDeLaMethode()) {
    for (const [, cible] of readFileSync(fichier, "utf8").matchAll(cites)) {
      assert.ok(existsSync(join(SKILL, cible)), `${nomRelatif(fichier)} cite ${cible}, qui n'existe pas`);
    }
  }
});

// plan.js n'y est pas : Claude l'écrit. Le copier après coup écraserait l'état des lieux.
test("les commandes de copie citent tous les fichiers du modèle, sauf plan.js", () => {
  const modele = join(SKILL, "modele");
  for (const fichier of fichiers(modele)) {
    const nom = relative(modele, fichier).split("\\").join("/");
    const cite = texteDuSkill.includes(`"<skill>/modele/${nom}"`);
    if (nom === "plan.js") assert.ok(!cite, "SKILL.md ne doit pas copier modele/plan.js");
    else assert.ok(cite, `SKILL.md ne copie pas modele/${nom}`);
  }
});

test("la méthode dit où trouver ses propres fichiers, relativement au dossier du skill", () => {
  assert.match(texteDuSkill, /Base directory for this skill/);
  assert.match(texteDuSkill, /<skill>\/modele\//);
  assert.match(texteDuSkill, /<skill>\/verifier\.mjs/);
});

test("les obligations de la méthode sont écrites", () => {
  const texte = toutLeTexte();
  const obligations = [
    [/\.env/, "ne jamais ouvrir les .env"],
    [/aConfirmer/, "aConfirmer"],
    [/source/, "dire d'où vient chaque affirmation"],
    [/\[crochets\]/, "[crochets] pour l'inconnu"],
    [/un seul jeu d'exemples/i, "un seul jeu d'exemples inventés"],
    [/statut\s*:\s*"valide"/, "« B3 validé » met statut: \"valide\""],
    [/« ?B3 ?: /, "comprendre « B3 : … »"],
    [/Corrections pour/, "comprendre le texte du bouton Copier"],
    [/ancien/, "garder l'ancienne valeur"],
    [/redessine/, "l'actuel redessiné d'après le code"],
    [/verifier\.mjs/, "lancer le contrôle après chaque lot"],
    [/policeEnLigne/, "police en ligne"],
    [/--ecran-sur-accent/, "accent clair de la charte"],
    [/relais\.js/, "un actuel en HTML appelle relais.js"],
    [/jamais le projet entier/i, "ne servir que le dossier de maquettes"]
  ];
  for (const [motif, sens] of obligations) assert.match(texte, motif, `il manque : ${sens}`);
});

test("la méthode reste générale : aucun trait du projet d'essai", () => {
  for (const fichier of fichiersDeLaMethode()) {
    assert.doesNotMatch(readFileSync(fichier, "utf8"), /pr[êe]toutil/i, `${nomRelatif(fichier)} parle du projet d'essai`);
  }
});

test("aucun chemin de machine ni mail dans le skill", () => {
  const motifs = [/[A-Z]:[\\/](?:Users|Dev|Windows|Program)/i, /\/home\/[a-z]/i, /\/Users\/[a-z]/i, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i];
  for (const fichier of fichiers(SKILL)) {
    const texte = readFileSync(fichier, "utf8");
    for (const motif of motifs) assert.doesNotMatch(texte, motif, `${nomRelatif(fichier)} contient ${motif}`);
  }
});

// La liste des noms à chercher vient de l'environnement : la mettre dans un fichier du dépôt
// publierait justement ce qu'elle protège.
test("aucun des mots interdits dans les fichiers du skill", (t) => {
  const liste = (process.env.A_PLAT_MOTS_INTERDITS ?? "").split("|").map((m) => m.trim()).filter(Boolean);
  if (liste.length === 0) {
    t.skip("recherche non faite : donnez les mots dans A_PLAT_MOTS_INTERDITS, séparés par |");
    return;
  }
  const trouves = [];
  for (const fichier of fichiers(SKILL)) {
    const texte = readFileSync(fichier, "utf8");
    for (const mot of liste) {
      const echappe = mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?<![\\p{L}\\p{N}])${echappe}(?![\\p{L}\\p{N}])`, "iu").test(texte)) {
        trouves.push(`${nomRelatif(fichier)} contient « ${mot} »`);
      }
    }
  }
  assert.deepEqual(trouves, []);
});
