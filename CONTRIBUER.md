# Proposer une correction

Tu as essayé À plat sur ton projet et quelque chose ne va pas, ou pourrait aller mieux ? Tu peux proposer une correction. Ce dépôt n'accepte que du code de l'outil : rien de ton projet ne doit y entrer.

## Comment ça se passe

1. Tu copies le dépôt sur ton compte GitHub (**Fork**) et tu y fais ta correction.
2. Tu lances les contrôles sur ton ordinateur (voir plus bas).
3. Tu proposes ta correction (**Pull request**). Un modèle s'affiche : remplis-le.
4. Les contrôles automatiques se lancent sur ta proposition (`.github/workflows/proposition.yml`) : rien de personnel, puis les tests.
5. La personne qui tient ce dépôt relit, demande des changements, accepte ou refuse.

Personne d'autre ne peut modifier ce dépôt. Rien n'est intégré sans relecture, même si tous les contrôles sont verts. Il n'y a pas de délai promis.

## Ce qui ne doit jamais être envoyé

Une proposition est publique dès qu'elle est envoyée. La retirer ou la refuser ne l'efface pas : elle reste visible dans l'historique et elle a pu être copiée.

- mots de passe, clés, jetons, fichiers `.env` ;
- données personnelles : noms, adresses, e-mails, clients, utilisateurs, chiffres d'une activité ;
- le code de ton projet, même un extrait, et son nom s'il est privé ;
- ton dossier `a-plat/` : `index.html`, `sources/` et `.cache/` décrivent ton projet, écran par écran ;
- captures d'écran de ton appli, de ses maquettes ou de ses journaux ;
- chemins de ton ordinateur, adresses de ton réseau ou de ton serveur, noms de tes outils personnels.

**Si un secret est parti quand même :** change-le tout de suite, là où il sert. C'est la seule protection qui marche. Puis préviens la personne qui tient ce dépôt, en privé, comme pour une faille ([SECURITY.md](SECURITY.md)).

**Ton adresse e-mail** figure aussi dans chaque commit. Pour la cacher, active **Keep my email addresses private** dans les réglages de ton compte GitHub (**Emails**), puis signe tes commits avec l'adresse `noreply` que GitHub y donne.

## Montrer un problème sans montrer ton projet

Décris-le avec des mesures, pas avec ton code ni des captures :

> Environ 40 pages et 200 écrans : la vue d'ensemble met 6 s à s'afficher, les notes se chevauchent sous les écrans étroits.

Quand il faut un exemple, invente-le : un petit projet fictif, avec des noms inventés, qui reproduit le même cas. Les deux projets de `exemples/` et ceux de `tests/fixtures/` montrent la forme.

## Une correction doit servir à tous

Chaque projet est plus ou moins gros, plus ou moins avancé. Une correction doit marcher pour tous :

- rien d'écrit en dur pour un projet, un dossier, un serveur ou un outil précis ;
- essaie-la sur un petit projet **et** sur un gros, et donne les chiffres avant et après ;
- ce qui ne sert qu'à certains devient une option, invisible sans son réglage ;
- ce qui ne sert qu'à toi reste chez toi.

## Les règles de l'outil

- **Aucune dépendance**, rien à installer pour s'en servir : Node.js suffit. Playwright ne sert qu'aux tests de la page, sur l'ordinateur de qui développe.
- **Aucun envoi vers Internet** : l'outil ne contacte aucun service, et ne suit personne.
- **Le code de la personne n'est jamais modifié.** À plat n'écrit que dans le dossier `a-plat/` de son projet. Il ne touche ni à `CLAUDE.md` ni au `.gitignore` du projet.
- **Le code du projet ne s'exécute qu'avec l'accord de la personne** : seuls `style-du-projet.mjs` et `icones.mjs` lancent des paquets installés du projet, pour la finition fidèle, et seulement quand elle l'a accepté.
- **L'outil met à plat, il n'impose rien** : il n'ajoute aucune fonction de lui-même, et ce qu'il ne sait pas reste entre [crochets].
- **Les textes visibles sont en français**, en langage simple : les pages d'explication du dépôt tutoient le lecteur ; la page des maquettes et Claude, dans la conversation, vouvoient la personne, sauf si elle tutoie.
- **Toute correction arrive avec son test.**

## Les contrôles à lancer

Depuis le dossier du dépôt :

```bash
node outils/rien-de-personnel.mjs .
```

```bash
npm test
```

Si tu as touché au plugin (`skills/`, `.claude-plugin/` ou `package.json`) :

```bash
node outils/empreintes.mjs
```

Si tu as touché au README ou aux docs :

```bash
node outils/verifier-liens.mjs
```

Si tu as touché à la page (`skills/a-plat/modele/`), les tests de la page demandent Playwright et Edge ou Chrome installé sur l'ordinateur (Edge par défaut ; `A_PLAT_NAVIGATEUR=chrome` pour Chrome) :

```bash
npm install
npm run test:page
```

Le premier contrôle cherche ce qui ne doit pas entrer dans le dépôt : chemins de l'ordinateur, adresses privées, fichiers de suivi. Il ne connaît pas tes secrets ni ton nom : relis quand même ce que tu envoies. `empreintes.mjs` met à jour la liste des fichiers du plugin (`EMPREINTES.txt`), à enregistrer avec ta correction.

Pour que le premier contrôle se lance tout seul avant chaque envoi (`git push`), pose une fois le crochet fourni, depuis le dossier du dépôt : `cp outils/pre-push .git/hooks/pre-push`. Il ne suit pas le dépôt : à reposer sur chaque ordinateur.

## Si tu utilises une IA

C'est permis. Tu restes responsable de ce que tu proposes : relis, teste, et n'envoie pas à l'IA ce que tu n'enverrais pas ici. Pas de mention de l'outil dans les commits, le README le dit déjà.

## Licence

En proposant une correction, tu acceptes qu'elle soit publiée sous la licence [MIT](LICENSE) de ce dépôt. N'y mets que du code que tu as le droit de partager.

## Une faille de sécurité

Ne l'écris pas dans une proposition publique : suis [SECURITY.md](SECURITY.md).
