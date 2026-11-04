# À plat : description de l'outil

Version de travail du 04/11/2026. Ce document dit ce que l'outil fera, avant de le construire.

## En une phrase

À plat est un plugin pour Claude Code qui met à plat un projet sous forme de maquettes : ce qui existe, ce qui est à compléter, ce qui manque, écran par écran, à n'importe quel moment du projet.

## À qui ça sert

À une personne qui construit un logiciel avec Claude, développeuse ou non, et qui veut voir où en est son projet. Elle peut n'avoir qu'une idée, un projet en cours ou une appli déjà en ligne. L'outil parle français, en phrases simples.

## Le principe

**L'outil met à plat ce que la personne a. Il n'impose rien.**

- Il n'ajoute aucune fonction de lui-même. Ce qui semble manquer devient une question, et il ne le dessine que si on le lui demande.
- Ce qu'il ne sait pas reste entre [crochets]. Il n'invente ni texte officiel, ni prix, ni fait.
- Le niveau de détail suit ce que le projet contient et ce que la personne demande.
- Il dit d'où vient chaque affirmation. Ce qu'il a lu sans le voir marcher est marqué « à essayer pour confirmer ».

## Le parcours

La personne tape `/a-plat` dans son projet.

### 1. Lire

- **Il y a un projet :** Claude lit le code, les documents et les notes. Il ne modifie rien.
- **Il n'y a qu'une idée :** Claude pose quelques questions courtes, une à la fois.
- **Des maquettes existent déjà :** Claude les reprend, relit le projet et signale ce qui a changé depuis.

### 2. État des lieux

Claude dresse la liste des pages. Chacune reçoit un état et une courte raison :

| État | Sens |
|---|---|
| Existe | La page est là |
| À compléter | La page est là, il lui manque quelque chose |
| Manque | Annoncée, attendue ou nécessaire à un parcours, mais absente |
| Prévue | Décidée, pas encore construite |

« Ce qui manque » couvre aussi :

- les états oubliés d'un écran (vide, erreur, refus, hors ligne) ;
- les boutons qui ne mènent nulle part ;
- les parcours incomplets ;
- ce qui est annoncé mais pas construit.

La personne corrige cette liste. Rien n'est dessiné avant qu'elle l'ait vue.

### 3. Réglages

Claude propose des réglages d'après le projet. La personne les change à tout moment, en le disant.

| Réglage | Choix |
|---|---|
| Format | téléphone, ordinateur, ou les deux |
| Rangement des écrans | par parcours, par personne, par module, par moment, ou existant et nouveau |
| Finition | gris, charte, ou gris puis charte |
| Rythme | écran par écran, par lots, ou tout d'un coup |
| Relecture par Claude avant de montrer | oui ou non |

Si le projet n'a pas de charte, Claude propose gris puis charte. S'il en a une, il propose de s'en servir tout de suite.

### 4. Premiers écrans

Claude dessine 1 ou 2 écrans et demande si la direction et le niveau de détail conviennent. Il ne fait le reste qu'après.

### 5. Les écrans

- **Page qui existe :** l'écran actuel et la proposition, côte à côte. L'actuel est une capture si la personne en a une, sinon il est redessiné d'après le code et marqué comme tel.
- **Page à compléter :** seul ce qui change est mis en avant.
- **Page qui manque :** dessinée seulement si la personne le demande.

Les textes sont de vrais textes et les exemples sont inventés mais crédibles, avec un seul jeu d'exemples pour tout le projet. Aucune donnée réelle du projet ne passe dans les maquettes (noms de clients, adresses, secrets).

Les écrans sont reliés entre eux : on peut essayer le parcours en touchant les boutons.

### 6. Corrections

La personne corrige dans la conversation, en citant le code de l'écran : « B3 : change le titre ». C'est la façon principale.

Dans la page, toucher un élément prépare une correction déjà située (« B3 > Bouton Envoyer »). Un bouton copie ces corrections pour les coller dans la conversation. C'est une aide, pas une obligation.

Valider un écran passe par le même chemin : « B3 validé ».

### 7. Notes

Les décisions restent à côté des écrans, jamais dessus, et restent courtes. Chaque note a un type et une date :

- décision ;
- à trancher ;
- à vérifier ;
- à coder ;
- source.

Quand une décision change, l'ancienne valeur reste visible, barrée.

### 8. Passage au code

À la fin, ou quand elle le veut, la personne obtient un dossier clair : les écrans validés, les décisions, les questions encore ouvertes, ce qui reste à coder. Les maquettes étant du vrai HTML, elles servent directement de référence.

## Ce que la personne voit

Une page, `maquettes/index.html`, avec trois vues :

1. **État des lieux :** la liste des pages et leur état.
2. **Vue d'ensemble :** tous les écrans en rangées, côte à côte, chacun avec son code. Les notes sont au bout de chaque rangée.
3. **Écran seul :** l'écran en grand, avec l'actuel à côté s'il existe.

La page fonctionne à la largeur d'un téléphone et en mode sombre. Les écrans gardent leurs propres couleurs.

## Comment c'est construit

### Le plugin

```text
a-plat/
  .claude-plugin/        description du plugin, pour l'installer
  skills/a-plat/
    SKILL.md             la méthode, écrite pour Claude
    references/          le détail, lu seulement quand il sert
    modele/              la page à copier dans le projet
    verifier.mjs         le contrôle automatique
  exemples/              un projet inventé, pour l'essai et les tests
  README.md              présentation et installation, en français
  LICENSE
```

### Ce que l'outil écrit dans le projet de la personne

Tout tient dans un seul dossier. L'outil n'écrit nulle part ailleurs.

```text
maquettes/
  index.html             la page
  a-plat/                le moteur de la page
  plan.js                réglages, état des lieux, rangées, écrans, notes
  commun.css             le style commun (gris ou charte)
  ecrans/B3-commande.html   un fichier par écran, qui s'ouvre aussi seul
  actuel/B3-commande.png    les captures de l'existant, s'il y en a
```

- `plan.js` est un fichier de script, pas du JSON : une page ouverte d'un double-clic n'a pas le droit de lire un fichier JSON voisin.
- Chaque écran est un fichier HTML ordinaire, lisible sans l'outil.
- Claude écrit `plan.js` et les écrans. La page les affiche et ne les modifie jamais.

### Pas de serveur

La page s'ouvre d'un double-clic. Il n'y a rien à installer ni à lancer.

Les corrections passant par la conversation, un serveur n'apporterait que l'écriture directe des corrections du bouton Copier. Cela ne justifie pas une installation de plus.

Le dossier `maquettes/` étant fait de simples fichiers, il peut aussi être posé sur n'importe quel serveur web pour l'ouvrir depuis un téléphone. L'outil n'a pas à le savoir.

### Le contrôle automatique

`verifier.mjs` contrôle, sans rien afficher à l'écran :

- que chaque écran du plan a son fichier, et l'inverse ;
- que les liens entre écrans mènent quelque part ;
- que les codes d'écran sont uniques ;
- que le HTML est bien fermé ;
- la liste des [crochets] restants, pour information.

Il demande Node. Si Node est absent, Claude fait ces contrôles lui-même et le dit.

## Ce que l'outil ne fait jamais

- Il ne modifie pas le code du projet.
- Il n'envoie rien : pas de mesure d'usage, pas de compte, pas d'appel réseau depuis la page.
- Il ne charge rien depuis Internet par défaut. Une police en ligne n'est utilisée que si la personne la demande pour sa charte.
- Il ne recopie pas de secret ni de donnée réelle dans les maquettes.
- Il n'annonce pas qu'une page marche s'il ne l'a pas vue marcher.

## Pas dans la première version

- Zoom et déplacement libres sur le plan.
- Modification directe dans la page.
- Petit serveur et écriture directe des corrections.
- Publication privée pour le téléphone.
- Autres assistants que Claude.

## Réutilisation et licence

Le code est écrit pour ce dépôt, sous licence MIT. Les idées des outils existants sont reprises, pas leur code. Aucun fichier d'un type d'Artifact de claude.ai n'est copié ni imité dans son format : l'outil a son propre format, documenté ici.

## Comment on saura que c'est bon

Sur un projet inventé dont les manques sont connus d'avance :

1. Installation propre du plugin, en suivant seulement le README.
2. Parcours complet vu à l'écran : lecture, état des lieux, UX, corrections, UI.
3. Claude retrouve les manques prévus. Ceux qu'il rate et ceux qu'il invente sont comptés et publiés dans le compte rendu d'essai.
4. Parcours refait en partant d'une simple idée, puis en reprenant des maquettes existantes.
5. Chaque réglage essayé et son effet constaté.
6. Page contrôlée à la largeur d'un téléphone, en mode sombre, et sur une centaine d'écrans pour la vitesse.
7. Ouverture d'un double-clic vérifiée sous Chrome, Edge et Firefox.
8. Aucune requête réseau depuis la page, vérifiée pendant l'essai.
9. Essai et validation par une vraie personne.

## À essayer en premier

Deux points techniques peuvent changer la construction. Ils sont essayés avant le reste :

1. **Les écrans dans la page.** Chaque écran s'affiche dans un cadre (`iframe`), ce qui isole ses couleurs et lui permet de s'ouvrir seul. Il faut vérifier, en double-clic, que toucher un élément remonte bien à la page, et qu'une centaine de cadres reste fluide.
2. **L'installation.** Il faut vérifier la commande réelle du plugin, dans le terminal et dans l'application de bureau.
