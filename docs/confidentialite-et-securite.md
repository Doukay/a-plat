# Confidentialité et sécurité

Cette page dit ce qui est vrai pour À plat, y compris ses limites : ce qui quitte ta machine, ce que l'outil lance sur ton ordinateur, et ce qui est vérifié par des tests ou ne l'est pas.

## Ce qui sort de ta machine, en bref

1. **Ton projet part chez Anthropic.** À plat marche parce que Claude lit ton projet pour le mettre à plat. Ce qu'il lit est envoyé à Anthropic sur ton compte, selon ses conditions, comme pour n'importe quelle tâche que tu lui donnes. L'outil ne peut pas l'éviter.
2. **Les captures que tu donnes partent aussi** : Claude les regarde avant de les ranger dans `a-plat/sources/actuel/`.
3. **L'outil lui-même n'envoie rien** : pas de mesure d'usage, pas de compte, pas de suivi, aucun appel à un serveur de qui que ce soit.

## Ce qui tourne où

| Partie | Où elle tourne | Ce qu'elle envoie |
|---|---|---|
| Lire le projet, écrire le plan et les écrans | Claude, dans ta session | les fichiers qu'il lit, comme pour toute autre tâche |
| `copier.mjs`, `verifier.mjs`, `reprendre.mjs` | ton ordinateur (Node.js) | rien |
| `style-du-projet.mjs`, `icones.mjs` (finition fidèle) | ton ordinateur, avec les paquets de ton projet | rien de lui-même |
| La page `a-plat/index.html` | ton navigateur, d'un double-clic | rien. Elle ne charge rien d'Internet, sauf une police en ligne (Google Fonts) si tu la demandes pour ta charte : Claude te dit alors que la page contactera ce service |

Il n'y a aucun serveur dans ce tableau : la page n'en a pas besoin. Ce que Claude Code garde de son côté (historique des conversations, journaux) dépend de lui et de tes réglages, pas d'À plat.

## Les secrets et les données réelles

- **Claude n'ouvre pas tes fichiers de secrets** : `.env` et ses variantes (même `.env.example`), clés et certificats (`*.pem`, `*.key`, `id_rsa`…), dossiers `secrets/`, `.ssh/`, `.aws/`. Il peut citer leur nom, jamais leur contenu, et il les range dans ce qu'il n'a pas lu. Si une valeur qui ressemble à un secret apparaît dans un fichier ouvert, il te dit le nom du fichier, pas la valeur.
- **Aucune donnée réelle dans les maquettes** : ni nom de client, ni adresse, ni chiffre de ton activité, ni les données d'exemple de ton projet, même si elles semblent inventées. Les exemples sont inventés, avec un seul jeu pour tout le projet.
- **Une capture qui montre des données réelles** n'est pas copiée : Claude te le dit et t'en demande une sans elles.

**La limite, honnêtement :** ce sont des règles données à Claude dans la méthode du plugin, pas des verrous. Rien n'empêche techniquement Claude d'ouvrir un `.env`. Un secret écrit dans un fichier au nom banal (`config.js`) ou dans le code peut être lu, et donc envoyé. Si ton code est confidentiel, décide-le avant.

## Ce que l'outil lance sur ton ordinateur

| Quoi | Quand | Avec quel accord |
|---|---|---|
| `node` qui lance `copier.mjs`, `verifier.mjs` ou `reprendre.mjs` | à chaque étape : copie de la page, contrôle, reprise d'un ancien dossier | Autorisés d'avance par le plugin, chacun nommé exactement. Ils ne lancent aucun autre programme et n'écrivent que dans le dossier donné |
| `node` qui lance `style-du-projet.mjs` ou `icones.mjs` | finition fidèle seulement | **Ton accord**, demandé une fois pour les deux, puis l'autorisation de Claude Code selon tes réglages. Ils exécutent des paquets installés de ton projet (Tailwind, React, Lucide) |
| `git log`, en lecture seule | lecture du projet, pour voir ce qui a changé récemment | L'autorisation de Claude Code, selon tes réglages |
| Ton projet lui-même (installation, construction, démarrage) | seulement si c'est utile : voir une page marcher, caler la finition fidèle | **Ton accord**, après t'avoir dit que cela peut écrire dans le projet et lire sa configuration |

Tout le reste que fait Claude passe par tes réglages habituels de Claude Code. Les captures qu'il prend pour vérifier le rendu vont dans un dossier temporaire, jamais dans ton projet.

## Ce que le plugin n'a pas

- **Pas de crochets (hooks)** : rien ne se lance tout seul à chaque événement d'une session.
- **Pas de serveurs MCP.**
- **Pas de dépendances, pas de scripts d'installation.** Le `package.json` du dépôt ne sert qu'aux tests. Playwright n'y est que pour tester la page, sur l'ordinateur de qui développe : il n'est pas installé avec le plugin.
- **Aucun téléchargement**, aucun code venu d'Internet, aucun `eval`.
- **Aucune écriture hors de `a-plat/`** : ni ton code, ni `CLAUDE.md`, ni `CLAUDE.local.md`, ni le `.gitignore` de ton projet.

## Ce qui est vérifié, et ce qui ne l'est pas

**Vérifié par des tests automatiques**, lancés avant chaque version et à chaque proposition de changement sur GitHub :

- `copier.mjs` ne touche jamais à un fichier de `sources/`, et n'écrit rien hors de son dossier, ni `CLAUDE.md`, ni le `.gitignore` du projet ;
- le moteur de la page et les écrans d'essai ne font aucune requête hors de leur dossier, ouverts d'un double-clic comme par une adresse locale ;
- `commun.css` et `charte.css` ne chargent rien d'Internet.

**Vérifié à chaque lot, sur tes propres écrans :** le contrôle (`verifier.mjs`) refuse tout ce qui viendrait d'Internet, sauf la police en ligne que tu aurais demandée.

**Pas vérifié par un test :** les règles données à Claude (secrets, données réelles, accord avant de lancer le projet, rien écrit hors de `a-plat/` par Claude lui-même). Les tests ne prouvent pas non plus l'absence de défauts : ils vérifient une liste précise de choses, et ne remplacent pas une relecture du code.

**Vérifier ta copie installée :** chaque version publie les empreintes de ses fichiers. Voir [Vérifier ton installation](bien-demarrer.md#vérifier-ton-installation).

## Servir le dossier sur le web

La page et les écrans ont alors la même origine. Ne sers que des maquettes de confiance, et seulement le dossier `a-plat/`, jamais le projet entier, qui peut contenir des secrets. Voir [Le voir sur un téléphone](fichiers-du-projet.md#le-voir-sur-un-téléphone).

## Signaler une faille

Signale les problèmes de sécurité en privé, comme décrit dans [SECURITY.md](../SECURITY.md), plutôt que dans un ticket public.
