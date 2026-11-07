# Pour commencer

À plat est un plugin de **Claude Code**. Cette page dit comment l'installer, le lancer la première fois, le garder à jour et le retirer.

## Ce qu'il te faut

- **Claude Code** : la ligne de commande dans un terminal, ou l'onglet Code de l'application de bureau Claude. Ton abonnement habituel suffit, sans clé d'API.
- **Node.js 18 ou plus.** Les petits scripts du plugin tournent dessus : la copie de la page, le contrôle, la reprise d'un ancien dossier. Vérifie avec `node --version`. Sans Node, tout marche quand même sauf la finition fidèle et la reprise d'un ancien dossier `maquettes/` : Claude écrit alors lui-même les fichiers de la page, fait les contrôles à la main, et te le dit.
- **Un navigateur** pour ouvrir la page. Rien d'autre : la page s'ouvre d'un double-clic, sans serveur.

## Installation

Le plugin ne passe par aucune boutique. Tu l'installes depuis son dépôt GitHub, `Doukay/a-plat`, ou depuis une copie du dépôt sur ta machine. Le plugin et la source s'appellent tous deux `a-plat`.

Lance ces deux commandes une fois, dans n'importe quel terminal :

```bash
claude plugin marketplace add Doukay/a-plat
claude plugin install a-plat@a-plat
```

La première ajoute ce dépôt comme source de plugins. La seconde installe À plat pour tous tes projets. Depuis une copie du dépôt sur ta machine, la première devient `claude plugin marketplace add /chemin/vers/a-plat`.

**Ouvre ensuite une nouvelle session.** Les plugins se chargent au démarrage d'une session.

## La première fois

1. **Ouvre ton projet** dans Claude Code : dans un terminal, lance `claude` depuis le dossier du projet ; dans l'application de bureau, choisis le dossier avant d'envoyer ton premier message. Si tu n'as qu'une idée, ouvre un dossier vide.
2. **Tape `/a-plat`.** Si un autre plugin a déjà une commande de ce nom, tape `/a-plat:a-plat`. Tu peux ajouter une phrase : « /a-plat Je voudrais voir où en est ce projet et ce qu'il manque. »
3. **Laisse Claude lire.** Il ne modifie rien et ne lance pas ton projet. Il te dit ensuite ce qu'il va créer (le dossier `a-plat/`), puis copie la page.
4. **Accepte la copie si l'application te la demande.** Les trois scripts de l'outil (`copier.mjs`, `verifier.mjs`, `reprendre.mjs`) sont autorisés d'avance, mais l'application peut quand même demander dans certaines configurations. Sans la copie, la page ne peut pas s'afficher.
5. **Lis l'état des lieux** dans la conversation, corrige-le, puis suis Claude étape par étape. Le parcours complet est dans [Utiliser À plat](utiliser-a-plat.md).
6. **Ouvre `a-plat/index.html`** d'un double-clic. Claude te donne aussi l'adresse de l'écran à regarder, par exemple `#ecran/A2`.

## Mettre le plugin à jour

```bash
claude plugin marketplace update a-plat
claude plugin update a-plat@a-plat
```

La première commande relit le dépôt, la seconde installe la nouvelle version. Elle s'applique à ta session suivante. Le [journal des changements](../CHANGELOG.md) dit ce qui a changé.

Tes dossiers `a-plat/` profitent de la mise à jour au prochain passage de l'outil : la page (`index.html` et `.cache/`) est refaite, et ton travail, dans `sources/`, ne bouge pas. Voir [Ce qu'il y a dans ton projet](fichiers-du-projet.md).

Si tu as installé le plugin depuis un dossier local, il n'y a rien à mettre à jour : il tourne directement depuis ce dossier.

## Vérifier ton installation

Chaque version enregistre dans `EMPREINTES.txt` l'empreinte (SHA-256) de chaque fichier d'où le plugin tourne : `skills/`, `.claude-plugin/` et `package.json`. Tu peux comparer ta copie installée avec elle, pour savoir si elle est exactement la version publiée :

1. Copie le dépôt à part et place-toi sur la version installée (son numéro est le nom du dossier installé, voir plus bas) :
   ```bash
   git clone https://github.com/Doukay/a-plat a-plat-verif
   cd a-plat-verif
   git checkout v0.1.0
   ```
2. Compare ta copie installée avec ces empreintes :
   ```bash
   node outils/empreintes.mjs --check <dossier du plugin installé>
   ```
   Le plugin installé est en général dans `~/.claude/plugins/cache/a-plat/a-plat/<version>/`, où `~` est ton dossier personnel.

Le script dit « correspond » si tous les fichiers sont identiques. Sinon, il liste les fichiers modifiés, en trop ou manquants. Fais la comparaison avec les empreintes d'un dépôt que tu viens de copier, pas avec celles de la copie installée : une copie modifiée pourrait avoir modifié ses empreintes aussi.

## Revenir en arrière

Chaque version est une marque Git, `v0.1.0` par exemple. Depuis une copie du dépôt sur ta machine :

```bash
git tag --list
git checkout v0.1.0
```

Puis installe depuis ce dossier (voir [Installation](#installation)) et ouvre une nouvelle session. Pour revenir à la dernière version : `git checkout main`. Si tu as installé depuis GitHub, regarde `claude plugin marketplace add --help` pour indiquer une marque.

Tes dossiers `a-plat/` ne bougent pas : revenir en arrière n'efface rien. Au prochain passage, la page se refait avec la version retrouvée.

## Le retirer

```bash
claude plugin uninstall a-plat@a-plat
claude plugin marketplace remove a-plat
```

Les dossiers `a-plat/` restent dans tes projets : ils sont à toi, et la page s'ouvre toujours d'un double-clic. Supprime-les toi-même si tu n'en veux plus. Pense que `a-plat/sources/` est ton travail : le plan, les écrans, les décisions.
