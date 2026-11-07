# Ce qu'il y a dans ton projet

À plat n'écrit qu'à un seul endroit de ton projet : le dossier `a-plat/`, à sa racine. Rien d'autre n'est touché : ni ton code, ni `CLAUDE.md` ou `CLAUDE.local.md`, ni le `.gitignore` de ton projet. **Aucun fichier `.md` n'est nécessaire dans ton projet** : la méthode que suit Claude reste dans le plugin.

Les captures que Claude prend pour vérifier le rendu vont dans un dossier temporaire, jamais dans ton projet.

## Le dossier `a-plat/`

```text
a-plat/
  index.html    la page, à ouvrir d'un double-clic
  sources/      ton travail : à garder dans Git
  .cache/       ce qui se refait : ignoré par Git
  .gitignore    laisse passer sources/ et ignore le reste
```

### `sources/` : à enregistrer avec ton projet

| Fichier | Ce que c'est |
|---|---|
| `plan.js` | Les réglages, l'avancement, l'état des lieux, les rangées, les écrans et les notes |
| `charte.css` | Les couleurs, polices et arrondis de ton projet pour l'UI, et les quelques styles propres à ton projet |
| `ecrans/` | Un fichier HTML par écran, qui s'ouvre aussi seul : `A2-fiche.html` |
| `actuel/` | L'existant : tes captures, ou les pages redessinées d'après le code |
| `passage-au-code.md` | Le dossier du passage au code, quand tu l'as demandé |

C'est le travail qui a coûté des jetons : l'histoire de la conception de ton projet, écrans, décisions et questions comprises. Enregistré dans Git, il te suit sur un autre ordinateur et n'est pas perdu si le reste est supprimé. **L'outil ne l'enregistre pas à ta place** : ajoute `a-plat/sources/` à ton prochain enregistrement.

Ces fichiers ne contiennent ni ton code ni tes secrets, et les exemples y sont inventés. Mais ils décrivent ton appli écran par écran : si ton dépôt est public, relis-les, et vérifie qu'aucune capture de `actuel/` ne montre de données réelles.

### Le reste : se refait

| Fichier | Ce que c'est |
|---|---|
| `index.html` | La page |
| `.cache/moteur.js`, `logique.js`, `corrections.js`, `relais.js`, `style.css` | Le moteur de la page |
| `.cache/commun.css` | Le style commun des écrans : l'UX et les classes de base |
| `.cache/ecran-type.html` | Le point de départ d'un écran, que Claude recopie |
| `.cache/projet/` | Pour la finition fidèle seulement : le vrai style de ton projet, construit par `style-du-projet.mjs` |
| `.gitignore` | Écrit par l'outil : `*`, puis `!.gitignore`, `!sources/` et `!sources/**` |

La copie de la page refait tout cela à chaque passage de l'outil, sauf `.cache/projet/`, qui se refait avec son propre script. C'est ainsi qu'une mise à jour du plugin atteint les dossiers déjà faits. Ne modifie pas ces fichiers : ta modification serait perdue au passage suivant.

## Un clone sans le plugin

Quelqu'un qui copie ton dépôt n'a que `sources/` : la page n'y est pas, puisqu'elle se refait. Elle revient en lançant `/a-plat` dans le projet, avec le plugin installé : Claude reprend le dossier et refait la page sans toucher à `sources/`.

## Modifier à la main

Le plus simple est de demander à Claude, en citant le code de l'écran. Tu peux aussi modifier `sources/` toi-même : un écran est un fichier HTML ordinaire, et `plan.js` est écrit pour se lire. Demande ensuite à Claude de relancer le contrôle, qui dit ce qui ne va pas. Le format complet est dans [`format.md`](../skills/a-plat/references/format.md).

Un écran n'écrit aucune couleur : tout passe par les classes de `commun.css` et les variables de `charte.css`. Sinon, le bouton UX | UI ne peut plus rien pour lui, et le contrôle le refuse.

## Un ancien dossier `maquettes/`

Avant le dossier `a-plat/`, l'outil écrivait tout dans un seul dossier, souvent `maquettes/`, avec `plan.js` à sa racine. Le contrôle le reconnaît et refuse de s'en servir tel quel. Claude te propose alors de le reprendre :

1. `reprendre.mjs` recopie `plan.js`, `passage-au-code.md`, `ecrans/` et `actuel/` dans `a-plat/sources/`, sans rien écraser. Il met à jour les liens des écrans, et écrit `sources/charte.css` d'après l'ancien style commun.
2. Claude relit `charte.css` pour n'y garder que ce qui est propre à ton projet.
3. La page est copiée, le contrôle relancé, et les écrans regardés en UX puis en UI. Pour la finition fidèle, le style du projet est reconstruit.

Les codes d'écran, les notes et les statuts ne changent pas. **L'ancien dossier n'est jamais touché** : le supprimer, une fois le nouveau vérifié, est à toi.

## Si des fichiers refaits sont déjà dans Git

Le `.gitignore` du dossier ne retire pas du suivi ce qui y est déjà. Pour l'en retirer en gardant les fichiers sur le disque :

```bash
git rm -r --cached a-plat/index.html a-plat/.cache
```

## Le voir sur un téléphone

Le dossier `a-plat/` est fait de simples fichiers : n'importe quel serveur web ordinaire peut le servir, y compris un serveur chez toi. Attention : la page a besoin du dossier `.cache/`, et certains hébergements cachent les dossiers dont le nom commence par un point (GitHub Pages, par exemple) ; préfère un serveur simple qui sert tout le dossier. L'outil n'en installe et n'en lance aucun.

**Ne sers que le dossier `a-plat/`, jamais le projet entier.** Ton projet peut contenir des secrets (fichiers `.env`, clés), et un serveur les donnerait à qui connaît l'adresse. Pareil si ton hébergeur publie tout le dossier du projet : exclus `a-plat/`, sinon n'importe qui verrait tes maquettes.

Si le dossier arrive sur le serveur par une copie régulière, une correction ne s'y voit qu'à la copie suivante. Les codes d'écran restent les mêmes partout : tu peux lire sur le téléphone et corriger dans la conversation.

## Si tu veux que Claude pense aux maquettes

L'outil n'ajoute aucune note pour Claude dans ton projet. Si tu veux que tes sessions Claude Code y pensent, écris toi-même une ligne dans ton `CLAUDE.md`, par exemple : « Les maquettes du projet sont dans `a-plat/sources/` : le plan dans `plan.js`, un écran par fichier dans `ecrans/`. Pour les changer, passe par `/a-plat` en citant le code de l'écran. »
