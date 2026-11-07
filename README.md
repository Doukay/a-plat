# À plat

À plat est un plugin pour Claude Code (un plugin est un complément qu'on ajoute à Claude Code). Il met votre projet à plat sous forme de maquettes : ce qui existe, ce qui est à compléter, ce qui manque, écran par écran.

## À quoi ça sert

Vous construisez un logiciel avec Claude, que vous soyez développeur ou non. À plat vous montre où en est votre projet, à n'importe quel moment : quand vous n'avez qu'une idée, en plein travail, ou quand l'application est déjà en ligne.

Il vous donne quatre choses :

- l'état des lieux : la liste des pages, avec pour chacune ce qui existe, ce qui est à compléter, ce qui manque ou ce qui est prévu ;
- ce qui manque : les états oubliés d'un écran (vide, erreur, refus), les boutons qui ne mènent nulle part, les parcours incomplets ;
- des maquettes, page par page ;
- pour une page qui existe et qui change, l'écran actuel et la proposition côte à côte ; une page qui ne change pas est dessinée une seule fois, marquée « Inchangé ».

**Le principe : l'outil met à plat ce que vous avez, et n'impose rien.** Il n'ajoute aucune fonction de lui-même. Ce qui semble manquer devient un point à trancher, et il ne dessine une page qui manque que si vous le demandez. Ce qu'il ne sait pas reste entre [crochets]. Chaque affirmation dit d'où elle vient, et ce qu'il a lu sans le voir marcher est marqué « à essayer pour confirmer ».

## Les trois vues, en 30 secondes

Le résultat est une seule page, `maquettes/index.html`, qui s'ouvre d'un double-clic. Elle a trois vues.

1. **État des lieux.** La liste des pages et leur état : Existe, À compléter, Manque ou Prévue, avec une raison courte.
2. **Vue d'ensemble.** Une grande planche : toutes les rangées l'une sous l'autre, chaque écran à sa vraie taille, avec son code (A1, A2, B1…). La molette déplace la planche, Ctrl + molette zoome. Une note s'affiche sous l'écran qu'elle concerne, ou sous le titre de la rangée si elle vaut pour toute la rangée. Toucher le titre d'une rangée l'ouvre en grand : ses écrans à une taille de lecture, et les pages de l'état des lieux qui les citent. Le chevron devant le titre replie la rangée pour gagner de la place ; la page s'en souvient pour ce projet.
3. **Écrans.** Un écran en grand, avec l'actuel à côté s'il existe, et ses notes dessous. Toucher un écran de la vue d'ensemble ou d'une rangée ouvre cette vue.

La barre noire du haut dit où l'on est, avec une flèche pour remonter d'un niveau. Sa recherche trouve un écran par son code ou un mot de son titre (touche `/`). Son bouton **UX | UI** montre tous les écrans soit en maquette grise (UX), soit aux couleurs de votre projet (UI), sans les redessiner. Deux boutons règlent ce que fait un toucher sur un écran : **Corriger** désigne l'élément touché pour une correction, **Essayer le parcours** suit les boutons et les liens comme dans l'application. Sur un téléphone, la vue d'ensemble devient une colonne où chaque rangée glisse de côté. La page marche en clair et en sombre.

## Installation

Il faut Claude Code, l'outil d'Anthropic. Pour l'obtenir, cherchez « Claude Code » sur le site officiel d'Anthropic. Dans Claude Code, tapez ces deux commandes, l'une après l'autre. La première ajoute un catalogue de plugins (une « marketplace »), qui est ici le dépôt d'À plat (le dossier en ligne où est rangé son code) ; la seconde installe le plugin.

```text
/plugin marketplace add Doukay/a-plat
/plugin install a-plat@a-plat
```

Vous pouvez aussi installer depuis un dossier, si vous avez téléchargé le dépôt :

```text
/plugin marketplace add <chemin du dossier>
/plugin install a-plat@a-plat
```

Remplacez `<chemin du dossier>` par le chemin du dossier téléchargé, sans les crochets. Pour copier ce chemin : sous Windows, clic droit sur le dossier en gardant la touche Maj enfoncée, puis « Copier en tant que chemin d'accès » ; sous macOS, clic droit sur le dossier en gardant la touche Option enfoncée, puis « Copier … comme chemin d'accès » (le libellé peut varier selon la version).

### Mettre à jour, désinstaller

Pour passer à une nouvelle version, mettez à jour le catalogue, puis réinstallez le plugin :

```text
/plugin marketplace update a-plat
/plugin install a-plat@a-plat
```

Pour retirer le plugin, puis son catalogue :

```text
/plugin uninstall a-plat@a-plat
/plugin marketplace remove a-plat
```

Vos dossiers `maquettes/` restent dans vos projets : ils sont à vous, et la page continue de s'ouvrir sans le plugin. Une mise à jour ne touche pas non plus aux fichiers déjà copiés dans un dossier de maquettes : la copie n'écrase jamais un fichier qui existe.

## Premier essai

Ouvrez Claude Code dans votre projet. Si vous n'avez qu'une idée, ouvrez-le dans un dossier vide. Puis tapez :

```text
/a-plat
```

Si un autre plugin a déjà une commande `/a-plat`, utilisez le nom complet : `/a-plat:a-plat`.

Ensuite, Claude avance par étapes et s'arrête à chacune pour attendre votre réponse :

1. Il lit votre projet, sans rien modifier. Si vous n'avez qu'une idée, il vous pose quelques questions courtes, une à la fois. Si des maquettes existent déjà, il les reprend et dit ce qui a changé.
2. Il écrit l'état des lieux. Vous corrigez la liste. Rien n'est dessiné avant que vous l'ayez vue.
3. Il propose des réglages d'après votre projet (voir plus bas).
4. Il dessine 1 ou 2 écrans et vous demande si la direction vous convient. Il ne fait le reste qu'après.

Tout est écrit dans un seul dossier, `maquettes/`. Claude doit vous le dire avant de copier la page, et l'application peut vous demander une autorisation pour cette copie. Claude vous donne à chaque fois le fichier à ouvrir : `maquettes/index.html`. Si un dossier `maquettes/` existe déjà avec d'autres fichiers, Claude n'y écrit rien et vous demande un autre nom de dossier. Les captures d'écran que Claude prend pour vérifier le rendu vont dans un dossier temporaire, jamais dans votre projet.

**Faut-il garder `maquettes/` dans Git ?** Oui, c'est conseillé : c'est l'histoire de la conception de votre projet, écrans, décisions et questions comprises. Mais jamais vos secrets : les maquettes n'en contiennent pas, et une capture que vous fournissez ne doit pas montrer de données réelles.

## Corriger

Il y a deux façons, et vous choisissez.

- **Dans la conversation, en citant le code de l'écran.** C'est la façon principale :
  ```text
  B3 : change le titre
  ```
- **Depuis la page.** En mode Corriger, touchez un élément : un champ s'ouvre, déjà situé (« B3 > Bouton Envoyer »). Écrivez ce que vous voulez, puis « Ajouter ». Le bouton **Copier pour Claude** copie toutes vos corrections dans le presse-papiers (la mémoire de votre appareil pour copier-coller). Collez-les dans la conversation. Les corrections copiées restent listées dans la page : une fois appliquées par Claude, videz la liste avec « Tout retirer ». Si votre navigateur refuse la copie, le texte s'affiche dans un champ déjà sélectionné. C'est une aide, pas une obligation.

Pour valider un écran, dites-le de la même façon : « B3 validé ». Claude ne valide jamais à votre place.

Les décisions restent à côté des écrans, jamais dessus, en notes courtes avec un type (décision, à trancher, à vérifier, à coder, source) et une date. Quand une décision change, l'ancienne valeur reste visible, barrée. À la fin, ou quand vous le voulez, Claude prépare le dossier du passage au code : écrans validés, décisions, questions ouvertes, ce qui reste à coder.

## Les réglages

Claude les propose d'après votre projet, avec une raison. Vous les changez à tout moment, en le disant (« passe en ordinateur », « on arrête la relecture »).

| Réglage | Choix |
|---|---|
| Format | téléphone, ordinateur, ou les deux |
| Rangement des écrans | par parcours, par personne, par module, par moment, ou existant et nouveau |
| Finition | `gris` (maquette seule), `gris-puis-charte` (bouton UX \| UI, départ en gris), ou `charte` (bouton, départ aux couleurs du projet), d'après les styles que votre projet a déjà |
| Rythme | écran par écran, par lots, ou tout d'un coup |
| Relecture par Claude avant de montrer | oui ou non |

## Les règles de l'outil

Ce sont des règles données à Claude, pas des verrous techniques. Claude les suit, mais les essais ont montré des écarts (voir « Limites connues ») : relisez ce qu'il dit et ce qu'il écrit. Deux points seulement sont contrôlés par des tests automatiques : rien ne vient d'Internet, et la copie de la page n'écrase jamais un fichier qui existe. Pour le premier, les tests couvrent le moteur de la page et les écrans d'essai ; pour vos propres écrans, le contrôle (`verifier.mjs`, voir « Node ») refuse tout ce qui vient d'Internet.

Les règles :

- Il n'envoie rien : aucune mesure d'usage, aucun compte. La page ne fait aucune requête vers Internet, sauf un service de polices de caractères en ligne (Google Fonts) si vous le demandez pour votre charte.
- Il ne modifie jamais le code de votre projet. Il n'écrit que dans le dossier de maquettes.
- Il ne lance pas votre projet (installation, construction, démarrage) sans votre accord. Avant de le demander, il doit vous dire que cela peut écrire dans le projet et lire sa configuration.
- Il n'ouvre pas vos fichiers de secrets (`.env`, clés). Il peut citer leur nom, jamais leur contenu.
- Il ne met aucune donnée réelle dans les maquettes : ni nom de client, ni adresse, ni secret, ni donnée de départ de votre projet. Les exemples sont inventés, avec un seul jeu d'exemples pour tout le projet.
- Il ne dit pas qu'une page marche, ni comment elle s'affiche, s'il ne l'a pas vue.

## Sur un téléphone ou un autre appareil (serveur web)

Le dossier `maquettes/` est fait de simples fichiers : n'importe quel serveur web peut le servir, y compris un serveur chez vous. L'outil n'en installe aucun et n'en lance aucun.

**Ne servez que le dossier `maquettes/`, jamais le projet entier.** Votre projet peut contenir des secrets (fichiers `.env`, clés), et un serveur les donnerait à qui connaît l'adresse.

Si le dossier arrive sur le serveur par une copie régulière, une correction ne s'y voit qu'à la copie suivante. Le code de chaque écran reste le même partout : vous pouvez lire sur le téléphone et corriger dans la conversation.

## Node (facultatif)

Node, version 18 ou plus, sert à deux petits scripts du plugin :

- `copier.mjs` copie la page dans le dossier de maquettes, sans jamais écraser un fichier qui existe ;
- `verifier.mjs` contrôle les maquettes sans rien afficher : chaque écran du plan a son fichier, et l'inverse ; les liens entre écrans mènent quelque part ; les codes sont uniques ; le HTML est bien fermé ; rien ne vient d'Internet ; il liste aussi les [crochets] restants.

Sans Node, tout marche quand même. Claude écrit alors lui-même les fichiers de la page, fait les mêmes contrôles à la main, et vous le dit. Ouvrir les maquettes ne demande jamais Node : un navigateur suffit.

## Limites connues

À plat est une première version. Voici ce qu'on sait, et ce qu'on ne sait pas.

**Ce que la méthode donne sur un projet qu'elle n'a jamais vu.** Sur un projet inventé dont les manques étaient connus d'avance, Claude en a trouvé **13 sur 19**, soit environ 68 %. Il n'y a eu aucune invention, selon le comptage de l'auteur de l'essai. Les 3 fausses pistes sont tombées. Les 6 manques ratés sont surtout au niveau du routeur (la partie qui choisit la page à montrer selon l'adresse) et du chargement des données (accès refusé sans explication, données illisibles, adresse inconnue, retour à la bonne page après la connexion) et dans des tâches d'un rôle qui n'ont aucun écran. Voir [l'essai sur Jardins](docs/essais/2026-11-06-jardins.md).

Ce chiffre est fragile : un seul passage, un seul projet, le modèle Sonnet, compté par une seule personne. Un autre passage pourrait trouver plus ou moins.

**La méthode a été retouchée après cette mesure**, pour corriger les défauts qu'elle avait montrés. Ces retouches ne sont pas mesurées : ce projet est maintenant connu de la méthode, et une nouvelle mesure demande un autre projet. Le 17 sur 17 du premier projet d'essai ne compte pas non plus : c'est le projet qui a servi à mettre la méthode au point. Voir [l'essai sur Prêtoutil](docs/essais/2026-11-06-pretoutil.md).

**Défauts de conduite vus pendant les essais.** Claude peut affirmer un rendu qu'il n'a pas vu (par exemple qu'un tableau déborde, sans avoir lu les styles du projet), reprendre des textes du projet alors qu'il dit n'avoir repris aucune donnée, ou retirer de la liste un manque que vous avez seulement laissé de côté. La méthode a reçu une règle contre chacun, mais ces règles n'ont pas été remesurées. Relisez ce qu'il dit.

**Ce qui a été essayé pour la page.** Elle est contrôlée par des tests automatiques sous Edge et sous Chrome, en l'ouvrant par son adresse de fichier (comme d'un double-clic) et par une adresse web locale (servie par un petit serveur sur l'ordinateur même, comme le ferait un serveur chez vous), à 390 px de large, en clair et en sombre, avec un toucher simulé. Pendant ces tests, le moteur de la page et les écrans d'essai n'ont fait aucune requête hors de leur dossier ; pour vos propres écrans, le contrôle refuse tout ce qui vient d'Internet.

**Ce qui n'a pas été essayé.** Firefox et Safari ; macOS et Linux (tout a été fait sous Windows) ; Node 18 (les scripts ont tourné avec une version plus récente) ; un vrai téléphone, au doigt ; le vrai presse-papiers (il a été remplacé par un faux pendant les tests) ; l'installation par `/plugin marketplace add` de bout en bout (le plugin a seulement été chargé depuis son dossier), la mise à jour et la désinstallation ; un essai par une personne qui n'a pas construit l'outil.

**Pas dans cette version.** Zoom et déplacement libres sur le plan, modification directe dans la page, petit serveur avec écriture directe des corrections, publication privée pour le téléphone, autres assistants que Claude.

## Licence

Licence MIT : voir [LICENSE](LICENSE).

Construit avec Claude Code.
