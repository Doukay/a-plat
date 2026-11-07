// Contrôles du README et des pages de docs/ : ils doivent dire ce que l'outil fait et ne fait pas, donner
// l'installation, citer les limites connues des comptes rendus d'essai, et ne contenir aucun chemin de machine.
// Le README reste court : le détail est dans docs/*.md, et chaque contrôle vise la page où la chose est dite.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const CHEMIN = join(RACINE, "README.md");
const DOCS = join(RACINE, "docs");
const PAGES = ["README.md", "bien-demarrer.md", "utiliser-a-plat.md", "fichiers-du-projet.md", "comment-ca-marche.md",
  "confidentialite-et-securite.md", "depannage.md", "questions-frequentes.md", "developpement.md"];

const lire = () => {
  assert.ok(existsSync(CHEMIN), "README.md est absent");
  return readFileSync(CHEMIN, "utf8");
};
const lireDoc = (nom) => {
  const chemin = join(DOCS, nom);
  assert.ok(existsSync(chemin), `docs/${nom} est absent`);
  return readFileSync(chemin, "utf8");
};
const pagesDeDocs = () => readdirSync(DOCS).filter((nom) => nom.endsWith(".md"));
const titres = (texte) => [...texte.matchAll(/^#{1,3} (.+)$/gm)].map((m) => m[1].toLowerCase());
const ligneDe = (texte, debut) => texte.split(/\r?\n/).find((l) => l.startsWith(debut)) ?? "";
// Le texte d'une section, de son titre jusqu'au titre suivant de même niveau ou plus haut.
function section(texte, titre) {
  const lignes = texte.split(/\r?\n/);
  const debut = lignes.findIndex((l) => /^#{1,6} /.test(l) && l.replace(/^#+ /, "") === titre);
  assert.ok(debut >= 0, `aucune section « ${titre} »`);
  const niveau = lignes[debut].match(/^#+/)[0].length;
  const fin = lignes.findIndex((l, i) => i > debut && new RegExp(`^#{1,${niveau}} `).test(l));
  return lignes.slice(debut, fin < 0 ? undefined : fin).join("\n");
}

test("le README commence par le nom de l'outil", () => {
  const tete = lire().split(/\r?\n/).slice(0, 5).join("\n");
  assert.match(tete, /<img src="docs\/images\/partage\.png" alt="À plat : /);
});

test("le README a les sections attendues", () => {
  const liste = titres(lire());
  for (const motif of [/pourquoi à plat/, /installation/, /démarrage rapide/, /jetons/, /ce que ça ajoute/,
    /confidentialité/, /documentation/, /licence/]) {
    assert.ok(liste.some((titre) => motif.test(titre)), `aucun titre du README ne correspond à ${motif}`);
  }
});

test("les pages de docs existent, le README les cite toutes, et elles ont les sections attendues", () => {
  const texte = lire();
  for (const page of PAGES) {
    lireDoc(page);
    if (page !== "README.md") assert.ok(texte.includes(`](docs/${page})`), `le README ne renvoie pas à docs/${page}`);
  }
  const attendues = {
    "bien-demarrer.md": [/ce qu'il te faut/, /installation/, /la première fois/, /mettre le plugin à jour/, /le retirer/],
    "utiliser-a-plat.md": [/le parcours avec claude/, /les réglages/, /les corrections/, /la page/, /l'état des lieux/,
      /la vue d'ensemble/, /une rangée/, /un écran/, /ce que l'outil ne sait pas encore bien faire/],
    "fichiers-du-projet.md": [/le dossier `a-plat\/`/, /un ancien dossier `maquettes\/`/, /le voir sur un téléphone/],
    "comment-ca-marche.md": [/ce qui consomme des jetons/, /le contrôle/, /la finition fidèle/],
    "confidentialite-et-securite.md": [/ce qui est vérifié/, /ce que l'outil lance/],
    "developpement.md": [/tests/, /versions/]
  };
  for (const [page, motifs] of Object.entries(attendues)) {
    const liste = titres(lireDoc(page));
    for (const motif of motifs) assert.ok(liste.some((titre) => motif.test(titre)), `aucun titre de docs/${page} ne correspond à ${motif}`);
  }
});

test("le README donne exactement les deux commandes d'installation, et Pour commencer celle d'un dossier local", () => {
  const texte = lire();
  const bloc = texte.match(/^## Installation[\s\S]*?```bash\r?\n([\s\S]*?)```/m);
  assert.ok(bloc, "la section Installation du README n'a pas de bloc de commandes");
  assert.deepEqual(bloc[1].split(/\r?\n/).filter(Boolean), [
    "claude plugin marketplace add Doukay/a-plat",
    "claude plugin install a-plat@a-plat"
  ]);
  for (const m of texte.matchAll(/marketplace add (\S+)/g)) assert.equal(m[1], "Doukay/a-plat", `autre source d'installation : ${m[1]}`);
  const demarrer = section(lireDoc("bien-demarrer.md"), "Installation");
  assert.ok(demarrer.includes("claude plugin marketplace add Doukay/a-plat"));
  assert.ok(demarrer.includes("claude plugin install a-plat@a-plat"));
  assert.ok(demarrer.includes("claude plugin marketplace add /chemin/vers/a-plat"));
  assert.match(demarrer, /ajoute ce dépôt comme source de plugins/);
});

test("le README dit comment lancer l'outil, et le nom complet de la commande", () => {
  const texte = lire();
  assert.ok(texte.includes("/a-plat"));
  assert.ok(texte.includes("/a-plat:a-plat"));
});

test("le README dit comment corriger, avec les deux façons et la validation", () => {
  const texte = lire();
  assert.match(texte, /B3 : /);
  assert.match(texte, /Copier pour Claude/);
  assert.match(texte, /B3 validé/);
  assert.match(section(lireDoc("utiliser-a-plat.md"), "6. Les corrections"), /Une fois appliquées, vide la liste avec \*\*Tout retirer\*\*\./);
});

test("le README dit que l'outil n'envoie rien et ne fait pas ce qu'il ne doit pas faire", () => {
  const texte = section(lire(), "Confidentialité");
  assert.match(texte, /n'envoie rien/i);
  assert.match(texte, /pas de compte/i);
  assert.match(texte, /ne charge rien d'Internet/i);
  assert.match(texte, /ne modifie jamais ton code/i);
  assert.match(texte, /qu'avec ton accord/i);
  assert.match(texte, /aucune donnée réelle/i);
  assert.match(lireDoc("confidentialite-et-securite.md"), /aucun appel à un serveur/);
});

test("le README et les docs disent que les règles ne sont pas des verrous, et ce que les tests contrôlent", () => {
  assert.match(lire(), /des règles qu'il suit, pas des verrous/);
  assert.match(section(lireDoc("comment-ca-marche.md"), "Les règles données à Claude"), /pas des verrous techniques/);
  const verifie = section(lireDoc("confidentialite-et-securite.md"), "Ce qui est vérifié, et ce qui ne l'est pas");
  assert.match(verifie, /\*\*Vérifié par des tests automatiques\*\*/);
  assert.match(verifie, /`copier\.mjs` ne touche jamais à un fichier de `sources\/`/);
  assert.match(verifie, /le moteur de la page et les écrans d'essai ne font aucune requête hors de leur dossier/);
  assert.match(verifie, /sur tes propres écrans :\*\* le contrôle \(`verifier\.mjs`\) refuse tout ce qui viendrait d'Internet/);
  assert.match(verifie, /\*\*Pas vérifié par un test :\*\* les règles données à Claude/);
  for (const page of [lire(), ...pagesDeDocs().map(lireDoc)]) {
    assert.doesNotMatch(page, /aucune requête sur le réseau|Elle ne fait aucune requête hors de son dossier/);
    assert.doesNotMatch(page, /ne fait jamais/i);
    assert.doesNotMatch(page, /^## Ce que l'outil ne fait jamais/m);
  }
  assert.match(section(lireDoc("bien-demarrer.md"), "La première fois"), /te dit ensuite ce qu'il va créer \(le dossier `a-plat\/`\), puis copie la page/);
});

test("le README dit ce qu'il ajoute au projet : seul a-plat/sources/ dans Git, rien hors de a-plat/", () => {
  const texte = section(lire(), "Ce que ça ajoute à ton projet");
  assert.match(texte, /Un dossier `a-plat\/`, à la racine, et rien d'autre/);
  assert.match(texte, /\*\*Seul `a-plat\/sources\/` est à garder dans Git :\*\*/);
  assert.match(texte, /`\.gitignore`/);
  assert.match(texte, /`CLAUDE\.md`/);
  assert.match(texte, /ne sont jamais touchés/);
  const fichiers = lireDoc("fichiers-du-projet.md");
  assert.match(fichiers, /ni `CLAUDE\.md` ou `CLAUDE\.local\.md`, ni le `\.gitignore` de ton projet/);
  assert.match(fichiers, /\*\*L'outil ne l'enregistre pas à ta place\*\*/);
});

test("les docs expliquent le routeur, et l'essai dit d'où vient l'absence d'invention", () => {
  const limites = section(lireDoc("utiliser-a-plat.md"), "Ce que l'outil ne sait pas encore bien faire");
  assert.match(limites, /routeur \(la partie qui/);
  assert.match(limites, /aucune invention,? selon le comptage de l'auteur de l'essai/);
});

test("les docs donnent la règle : ne servir que le dossier a-plat/", () => {
  const texte = section(lireDoc("fichiers-du-projet.md"), "Le voir sur un téléphone");
  assert.match(texte, /ne sers que le dossier `a-plat\/`/i);
  assert.match(texte, /jamais le projet entier/i);
  assert.match(texte, /\.env/);
  assert.match(lireDoc("depannage.md"), /Ne sers jamais le dossier du projet entier/);
});

test("le README dit qu'il faut Node, et Pour commencer ce qui se passe sans lui", () => {
  assert.match(section(lire(), "Installation"), /Node\.js 18 ou plus/);
  assert.match(section(lireDoc("bien-demarrer.md"), "Ce qu'il te faut"), /Sans Node, tout marche quand même sauf la finition fidèle/);
});

test("les limites connues sont dites, avec les chiffres des essais, et ce qui n'a pas été essayé", () => {
  const texte = lire();
  assert.match(texte, /13 manques sur 19/);
  assert.ok(texte.includes("](docs/utiliser-a-plat.md#ce-que-loutil-ne-sait-pas-encore-bien-faire)"), "le README ne renvoie pas aux limites connues");
  const limites = section(lireDoc("utiliser-a-plat.md"), "Ce que l'outil ne sait pas encore bien faire");
  assert.match(limites, /13 sur 19/);
  assert.match(limites, /aucune invention/i);
  assert.match(limites, /un seul passage/i);
  assert.match(limites, /Sonnet/);
  assert.match(limites, /retouchée après/i);
  assert.match(limites, /pas mesur/i);
  assert.match(limites, /n'a pas été essayé/i);
  assert.ok(limites.includes("](essais/"), "les limites ne renvoient à aucun compte rendu d'essai");
});

test("les liens du README et des docs vers des fichiers du dépôt mènent quelque part", () => {
  const liens = [...lire().matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1]);
  for (const lien of liens) assert.doesNotMatch(lien, /^[a-z]+:/i, `le lien ${lien} du README sort du dépôt`);
  const resultat = spawnSync(process.execPath, [join(RACINE, "outils", "verifier-liens.mjs")], { encoding: "utf8" });
  assert.equal(resultat.status, 0, `liens cassés :\n${resultat.stdout}${resultat.stderr}`);
  assert.match(lireDoc("developpement.md"), /\]\(essais\/2026-11-06-jardins\.md\)/);
});

test("le README dit la licence MIT et finit par « Construit avec Claude Code. »", () => {
  const texte = lire();
  assert.match(texte, /licence MIT/i);
  assert.equal(texte.trimEnd().split("\n").pop(), "Construit avec Claude Code.");
});

test("Pour commencer dit comment mettre à jour et retirer le plugin, et que les dossiers a-plat/ restent", () => {
  const texte = lireDoc("bien-demarrer.md");
  assert.ok(section(texte, "Mettre le plugin à jour").includes("claude plugin marketplace update a-plat"));
  assert.ok(section(texte, "Mettre le plugin à jour").includes("claude plugin update a-plat@a-plat"));
  const retirer = section(texte, "Le retirer");
  assert.ok(retirer.includes("claude plugin uninstall a-plat@a-plat"));
  assert.ok(retirer.includes("claude plugin marketplace remove a-plat"));
  assert.match(retirer, /Les dossiers `a-plat\/` restent dans tes projets/);
  assert.ok(lire().includes("](docs/bien-demarrer.md)"));
});

test("les docs précisent la police, les deux adresses, les captures, Git, et ce qui n'a pas été essayé", () => {
  const confidentialite = lireDoc("confidentialite-et-securite.md");
  const police = confidentialite.split(/\r?\n/).find((l) => l.includes("(Google Fonts)")) ?? "";
  assert.match(police, /une police en ligne \(Google Fonts\) si tu la demandes/);
  assert.doesNotMatch(police, /le plus souvent/);
  const limites = section(lireDoc("utiliser-a-plat.md"), "Ce que l'outil ne sait pas encore bien faire");
  assert.match(limites, /adresse de fichier \(comme d'un double-clic\)/);
  assert.match(limites, /adresse web locale/);
  assert.match(lireDoc("developpement.md"), /servie par un petit serveur local \(`127\.0\.0\.1`, ce seul dossier\)/);
  const fichiers = lireDoc("fichiers-du-projet.md");
  assert.match(fichiers, /captures que Claude prend pour vérifier le rendu vont dans un dossier temporaire/);
  assert.match(confidentialite, /captures qu'il prend pour vérifier le rendu vont dans un dossier temporaire/);
  assert.match(fichiers, /ne contiennent ni ton code ni tes secrets/);
  assert.match(lireDoc("questions-frequentes.md"), /Garde `a-plat\/sources\/`/);
  const pasEssaye = ligneDe(limites, "**Ce qui n'a pas été essayé :**");
  for (const motif of [/macOS/, /Linux/, /Node 18/]) assert.match(pasEssaye, motif);
});

test("le plan de construction n'est plus dans le dépôt", () => {
  assert.ok(!existsSync(join(RACINE, "docs", "superpowers")), "le plan de construction n'est plus dans le dépôt");
});

test("les comptes rendus d'essai ne nomment aucun outil de la session d'essai", () => {
  const texte = readFileSync(join(RACINE, "docs", "essais", "2026-11-06-pretoutil.md"), "utf8");
  assert.doesNotMatch(texte, /\.impeccable|ma propre session|mon installation/i);
});

test("le README et les docs ne citent aucun chemin de machine", () => {
  for (const [nom, texte] of [["README.md", lire()], ...pagesDeDocs().map((p) => [`docs/${p}`, lireDoc(p)])]) {
    assert.doesNotMatch(texte, /C:\\Use[r]s|\/C:\\Use[r]s|[A-Z]:\\|\/home\/|\/Users\//i, `${nom} cite un chemin de machine`);
  }
});

test("le README ne contient aucune adresse mail ni adresse http", () => {
  const texte = lire();
  assert.doesNotMatch(texte, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(texte, /https?:\/\//i);
});

test("le README et les docs ne citent aucun nom de projet privé", (t) => {
  const liste = (process.env.A_PLAT_MOTS_INTERDITS ?? "").split("|").map((m) => m.trim()).filter(Boolean);
  if (liste.length === 0) {
    t.skip("recherche non faite : donnez les mots dans A_PLAT_MOTS_INTERDITS, séparés par |");
    return;
  }
  // Le compte GitHub de la commande d'installation est permis : on le retire avant de chercher.
  const pages = [["README.md", lire()], ...pagesDeDocs().map((p) => [`docs/${p}`, lireDoc(p)])];
  const trouves = [];
  for (const [nom, brut] of pages) {
    const texte = brut.replaceAll("Doukay/a-plat", "COMPTE/a-plat");
    for (const mot of liste) {
      const echappe = mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?<![\\p{L}\\p{N}])${echappe}(?![\\p{L}\\p{N}])`, "iu").test(texte)) trouves.push(`${nom} contient « ${mot} »`);
    }
  }
  assert.deepEqual(trouves, []);
});
