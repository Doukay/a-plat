# Développer À plat

Cette page décrit le dépôt tel qu'il est, pour qui veut le comprendre, le modifier ou proposer une correction. Pour proposer : [CONTRIBUER.md](../CONTRIBUER.md).

## Organisation du dépôt

```text
.claude-plugin/
  plugin.json            le plugin : nom, version, auteur, adresses
  marketplace.json       ce dépôt comme sa propre source d'un seul plugin
skills/a-plat/
  SKILL.md               la méthode que suit Claude, étape par étape
  references/            le détail de chaque étape, lu au moment indiqué
    lire-un-projet.md         lire le code et trouver ce qui manque
    etat-des-lieux.md         les états, le message, la reprise
    ecrans.md                 quoi dessiner, la coquille commune, le jeu d'exemples
    format.md                 le dossier a-plat/, plan.js, un écran, UX et UI, le contrôle
    fidele.md                 la finition fidèle
    corrections-et-notes.md   corriger, valider, les notes
    passage-au-code.md        le dossier de fin
  modele/                la page, copiée dans chaque projet
    index.html, commun.css, charte.css, ecran-type.html, plan.exemple.js
    a-plat/                   le moteur : moteur.js, logique.js, corrections.js, relais.js, style.css
  copier.mjs             met la page en place dans a-plat/, ou la refait
  verifier.mjs           le contrôle
  reprendre.mjs          reprend un ancien dossier maquettes/
  style-du-projet.mjs    finition fidèle : construit le style du projet
  icones.mjs             finition fidèle : le dessin exact des icônes Lucide
exemples/                deux projets inventés, pour les essais (jardins, pretoutil)
tests/                   les tests, leurs dossiers d'essai (fixtures/) et les réponses des essais (reponses/)
  page/                  les tests de la page, dans un vrai navigateur
outils/                  rien-de-personnel.mjs, empreintes.mjs, verifier-liens.mjs, pre-push
docs/                    ces pages, les captures (images/) et les comptes rendus d'essai (essais/)
.github/                 le modèle de proposition et les deux contrôles sur GitHub
EMPREINTES.txt           SHA-256 de chaque fichier d'où le plugin tourne
```

## Essayer ta copie de travail

Installe depuis ton dossier local :

```bash
claude plugin marketplace add /chemin/vers/a-plat
claude plugin install a-plat@a-plat
```

Un plugin installé depuis un dossier local tourne directement depuis lui : tes modifications s'appliquent à la session suivante.

Les scripts se lancent aussi seuls, ce qui est le plus rapide pour y travailler :

```bash
node skills/a-plat/copier.mjs /chemin/vers/un/projet/a-plat
node skills/a-plat/verifier.mjs /chemin/vers/un/projet/a-plat
```

Pour voir la page sans projet, assemble la démo, Prêtoutil, dans un dossier vide ou qui n'existe pas encore, puis ouvre le `index.html` qu'elle affiche :

```bash
node tests/assembler-demo.mjs /chemin/vers/un/dossier-vide
```

## Tests

```bash
npm test
```

Les tests sans navigateur utilisent le lanceur intégré à Node : rien à installer. Ils regardent les scripts, la méthode, le modèle de page et les manifestes.

Les tests de la page ouvrent de vrais dossiers `a-plat/` dans un navigateur, avec Playwright (la seule dépendance du dépôt, pour le développement seulement). Il faut Edge ou Chrome installé sur l'ordinateur :

```bash
npm install
npm run test:page
```

Edge par défaut ; `A_PLAT_NAVIGATEUR=chrome` pour Chrome. Avec `A_PLAT_HTTP=1`, la page est servie par un petit serveur local (`127.0.0.1`, ce seul dossier) au lieu d'être ouverte comme un fichier, comme depuis un téléphone.

| Fichier | Ce qu'il vérifie |
|---|---|
| `copier.test.mjs` | la copie de la page : `sources/` jamais touché, la page et `.cache/` refaits, rien hors du dossier (ni `CLAUDE.md`, ni le `.gitignore` du projet), les dossiers refusés |
| `verifier.test.mjs` | le contrôle : fichiers, codes, liens, HTML, rien d'Internet, couleurs, anciens dossiers, codes de sortie |
| `fidele.test.mjs` | la finition fidèle : le contrôle, `style-du-projet.mjs` et `icones.mjs`, avec un faux Tailwind et un faux Lucide |
| `logique.test.mjs` | la lecture du plan par la page : ce qu'elle accepte, ce qu'elle refuse et comment elle le dit |
| `commun.test.mjs` | le style commun des écrans : les deux blocs UX et UI, rien d'Internet, les classes de base, les cibles tactiles |
| `skill.test.mjs` | la méthode écrite pour Claude : chargeable, complète, sans donnée personnelle (elle ne dit pas si elle marche : seul un essai le dit) |
| `demo.test.mjs` | la démo Prêtoutil, fichier par fichier |
| `exemple.test.mjs`, `jardins.test.mjs` | les deux projets d'essai : rien dans le dossier ne donne les réponses, et la liste des réponses est complète |
| `plugin.test.mjs` | les manifestes du plugin et du catalogue |
| `version.test.mjs` | la même version partout (voir plus bas) |
| `rien-de-personnel.test.mjs` | le contrôle « rien de personnel », sur des dépôts jetables, et le dépôt lui-même |
| `readme.test.mjs` | ce que le README doit dire |
| `page/etat.test.mjs` | l'état des lieux dans la page, et ses messages d'erreur |
| `page/niveaux.test.mjs` | les trois niveaux (vue d'ensemble, rangée, écran), la barre, la recherche, la colonne du téléphone |
| `page/ecrans.test.mjs` | les écrans et leurs notes, sans débordement ni requête en ligne, en clair et en sombre |
| `page/corrections.test.mjs` | Corriger, Copier pour Claude, Tout retirer, et aucune requête hors du dossier |
| `page/finition.test.mjs` | le bouton UX \| UI, et l'actuel qui garde son vrai style |
| `page/commun.test.mjs` | l'effet visible de chaque variable du style commun |
| `page/demo.test.mjs` | la démo ouverte comme la verra la personne |

Quand tu corriges un défaut, ajoute un test qui le montre, et vérifie qu'il échoue sans ta correction.

### Sur GitHub

- **À chaque proposition** (`.github/workflows/proposition.yml`) : le contrôle « rien de personnel », puis `npm test`, sous Linux avec Node 22, sans aucun droit d'écriture ni secret. Les tests de la page n'y sont pas : ils demandent Playwright et un navigateur.
- **À la demande** (`.github/workflows/test.yml`, Actions → Tests → Run workflow) : `npm test` sous Linux et Windows, avec Node 18, 20 et 22.

Une proposition affiche aussi un modèle à remplir (`.github/pull_request_template.md`) : ce que ça corrige, comment c'est vérifié, et les cases à cocher avant d'envoyer.

## Les outils

- **`outils/rien-de-personnel.mjs`** cherche dans chaque fichier suivi ce qui ne doit pas entrer dans le dépôt : chemins d'un ordinateur, adresses de réseau privé, fichiers de suivi. Avec une liste de mots privés, il cherche aussi dans les noms de fichiers, tout l'historique et les signatures. Cette liste vit hors du dépôt, dans `.claude/mots-interdits.txt` (ignoré par Git), un mot par ligne. Le résultat ne répète jamais un mot privé.
- **`outils/pre-push`** lance ce contrôle avant chaque envoi. Il ne suit pas le dépôt : pose-le une fois sur ton ordinateur, `cp outils/pre-push .git/hooks/pre-push`.
- **`outils/empreintes.mjs`** écrit `EMPREINTES.txt`, et `--check <dossier>` compare une copie installée avec lui (voir [Vérifier ton installation](bien-demarrer.md#vérifier-ton-installation)).
- **`outils/verifier-liens.mjs`** vérifie que chaque lien du README, de `CONTRIBUER.md`, de `SECURITY.md` et de ces pages mène à un fichier et à un titre qui existent.

## Versions

**Une seule numérotation**, la même partout : `0.1.0` dans `.claude-plugin/plugin.json`, `package.json`, le titre de la dernière entrée du [journal des changements](../CHANGELOG.md) (`## 0.1.0 (date)`) et l'en-tête d'`EMPREINTES.txt`, et la marque Git `v0.1.0`. `version.test.mjs` échoue si les quatre fichiers ne disent pas la même chose. La marque, elle, se pose à la main.

Pour marquer une version :

1. Change le numéro dans `plugin.json` et `package.json`, et ajoute son entrée en tête du journal, en langage simple.
2. Régénère les empreintes : `node outils/empreintes.mjs`.
3. Lance `node outils/rien-de-personnel.mjs .`, `npm test`, `npm run test:page` et `node outils/verifier-liens.mjs`. Tout doit passer.
4. Enregistre, puis marque : `git tag -a v0.1.0 -m "résumé en une ligne"`.

## Les comptes rendus d'essai

`docs/essais/` garde les comptes rendus des essais de la méthode sur les deux projets inventés de `exemples/`, dont les manques sont connus d'avance et rangés à part dans `tests/reponses/`, que Claude ne reçoit jamais :

- [l'essai sur Prêtoutil](essais/2026-11-06-pretoutil.md), le projet qui a servi à mettre la méthode au point ;
- [l'essai sur Jardins](essais/2026-11-06-jardins.md), la première mesure sur un projet que la méthode n'avait jamais vu.

Ils datent d'avant le dossier `a-plat/` : ils parlent encore d'un dossier `maquettes/`. Ils sont gardés tels quels.

## Ce qu'il reste à essayer

Avant de dire que l'outil est bon, il reste à faire, et à publier dans un compte rendu :

- l'installation depuis GitHub, en suivant seulement le README, puis la mise à jour et le retrait ;
- une nouvelle mesure sur un projet inventé que la méthode n'a jamais vu, depuis ses retouches ;
- la page sous Firefox et Safari, sous macOS et Linux, avec Node 18, et depuis un vrai téléphone, au doigt ;
- un essai complet par une personne qui n'a pas construit l'outil.

## Règles

- **Aucune dépendance pour s'en servir** : Node suffit. Playwright ne sert qu'aux tests de la page.
- **Rien vers l'extérieur, rien hors de `a-plat/`** dans le projet de la personne. Les tests de `copier.mjs` et de la page vérifient une partie de cela ; le reste, c'est à toi de le tenir.
- **Le code du projet ne s'exécute qu'avec l'accord de la personne** : seuls `style-du-projet.mjs` et `icones.mjs` lancent ses paquets.
- **Garde les exemples inventés** : ni nom de personne, ni adresse, ni chemin d'ordinateur, ni projet réel, dans le code, les tests ou les docs.
- **Tout en français**, en langage simple : le code, les commentaires, les messages. Ces pages tutoient ; Claude, dans la conversation, vouvoie la personne sauf si elle le tutoie.
