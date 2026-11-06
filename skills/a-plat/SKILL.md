---
name: a-plat
description: À utiliser quand la personne tape /a-plat, ou demande de mettre son projet « à plat » en maquettes : l'état des lieux page par page, les écrans, ce qui manque, l'écran actuel et la proposition côte à côte quand une page change. Vaut à n'importe quel moment d'un projet, même s'il n'y a encore qu'une idée ou si des maquettes existent déjà.
---

# À plat

**L'outil met à plat ce que la personne a ; il n'impose rien.**
Il montre, en maquettes, ce qui existe, ce qui est à compléter et ce qui manque. Il n'ajoute aucune fonction de lui-même : c'est la personne qui décide.

## Où sont les fichiers de l'outil

Au chargement de ce skill, Claude reçoit une ligne « Base directory for this skill: … ». Ce dossier s'appelle ici `<skill>`. Les fichiers de l'outil y sont, et pas dans le projet :

- `<skill>/modele/` : la page à copier ;
- `<skill>/copier.mjs` : la copie de la page dans le dossier de maquettes ;
- `<skill>/verifier.mjs` : le contrôle ;
- `<skill>/references/` : le détail de chaque étape.

Sous Windows, garder ce chemin entre guillemets, avec des `/` dans Bash. Les citations `references/…` ci-dessous sont à lire dans `<skill>`, au moment indiqué.

## Ce qui vaut à chaque étape

- **Le résultat tient dans le dossier de maquettes.** Le plan, les écrans et la page s'écrivent là, et nulle part ailleurs : ni dans le code, ni dans les réglages du projet, ni dans un dossier temporaire. Rien ne se publie en ligne, et aucun autre outil de page ou de maquette ne le remplace.
- **Lancer le projet.** Ne jamais installer, construire, démarrer ou lancer le projet sans l'accord de la personne. Avant de le demander, lui dire que cela peut écrire dans le projet et lire sa configuration. Sans cet accord, tout reste `aConfirmer: true`.
- **Secrets.** Ne jamais ouvrir `.env`, clés ni dossiers de secrets. Seul leur nom peut être cité, jamais leur contenu.
- **Données réelles.** Aucun nom de client, adresse, chiffre réel ou secret du projet ne passe dans les maquettes. Les exemples sont inventés, avec un seul jeu d'exemples pour tout le projet. Les valeurs saisies ou d'exemple écrites dans les fichiers de données ou de départ du projet (noms, objets, notes, textes) sont remplacées, même si elles semblent inventées.
- **Inconnu.** Ce qui n'est pas connu (prix, durée, texte officiel, fait) s'écrit entre [crochets]. Ne jamais l'inventer.
- **Sources.** Chaque affirmation sur le projet dit d'où elle vient (`source`). `aConfirmer` vaut `true` pour tout ce qui a été lu sans être vu marcher, et `false` seulement pour ce qui a été vu marcher ou ce que la personne dit elle-même (son idée, une confirmation).
- **Manques.** Ce qui manque devient une question. Une page qui manque ne se dessine que si la personne le demande. Un manque qu'elle laisse de côté reste dans la liste, marqué comme tel avec la date.
- **Ce qui est vu.** Ne jamais dire qu'une page marche, ni comment elle s'affiche (débordement, mise en page), sans l'avoir vu ; si c'est vu, dire comment (outil, largeur). Sinon, écrire « lu dans le code, à essayer pour confirmer ».
- **Commandes.** Une commande par appel, jamais enchaînée avec `;`, `&&` ou `|`, ni en boucle : une commande composée peut être refusée et fait perdre un tour. Ce que Claude écrit dans le dossier de maquettes (`plan.js`, écrans, pages redessinées, `passage-au-code.md`) s'écrit avec les outils de fichiers, jamais par une commande ou un script. Seules la copie du modèle (`copier.mjs`) et celle d'une capture fournie passent par une commande.
- **Fichiers de l'outil.** Les fichiers copiés du modèle (`index.html`, `a-plat/`, `ecran-type.html`) ne se modifient pas. Dans `commun.css`, seules changent les variables du haut (finition `charte`), et une classe qui manque s'ajoute à la fin, écrite avec ces variables seulement (voir `references/format.md`).
- **Aides.** Un gros lot peut se partager entre des aides (sous-agents). Chacun reçoit dans son appel ce fichier et les références de son étape, en entier, et le même jeu d'exemples, sans fichier de consignes à part. Un aide n'écrit que ses fichiers d'écran et d'actuel, et ne parle pas à la personne : seul Claude principal écrit `plan.js` et lui parle. Ce que les aides écrivent est relu comme le reste, avant d'être montré.

**Parler à la personne :** en français, en phrases simples, sans jargon, en la vouvoyant sauf si elle tutoie. Chaque message ne pose qu'une question, la dernière, écrite en toutes lettres avec ses choix. Le reste (points à trancher, choix proposés) s'écrit en phrases, sans point d'interrogation : la personne y répond quand elle veut.

## Départ : regarder ce qu'il y a

Chercher un `plan.js` contenant `window.A_PLAT`, dans `maquettes/` puis ailleurs dans le projet.

| Ce qui est trouvé | Ce qu'il faut faire |
|---|---|
| Un `plan.js` d'À plat | Reprendre : ne rien recopier, lire le plan et les écrans, relire le projet (étape 1), puis signaler ce qui a changé (étape 2). |
| Un dossier qui contient `a-plat/moteur.js` (ou un `index.html` qui le charge) sans `plan.js` d'À plat, ou un `maquettes/` vide | C'est le dossier de l'outil, copie interrompue ou pas commencée : reprendre la copie (étape 2) dans ce dossier, sans rien retirer. |
| Un dossier `maquettes/` d'autres fichiers, sans `plan.js` d'À plat | Ne rien y écrire, ne rien écraser. Demander d'abord dans quel nouveau dossier écrire, par exemple `maquettes-a-plat/` (la page et le contrôle marchent avec n'importe quel nom de dossier). Ne jamais proposer d'écrire dans ce dossier, même à côté de ses fichiers. Attendre la réponse avant de lire le projet. |
| Ni l'un ni l'autre, et un projet avec du code ou des documents | Étape 1, en écrivant ensuite dans `maquettes/`. |
| Ni l'un ni l'autre, et presque rien dans le dossier | Étape 1, cas de l'idée. |

Si le message de la personne cite déjà un code d'écran (« B3 : … », « B3 validé ») ou commence par « Corrections pour », et qu'un `plan.js` d'À plat existe, aller à l'étape 6. S'il n'en existe pas, dire qu'il n'y a pas encore de maquettes, puis partir du départ.

## Le parcours

Les huit étapes se font dans l'ordre. **Arrêt** veut dire : finir le message par la question, et attendre la réponse avant de continuer.

### 1. Lire

**S'il y a un projet :** lire `references/lire-un-projet.md` en entier avant d'ouvrir le projet, puis le suivre. Rien n'est modifié à cette étape.

**S'il n'y a qu'une idée :** poser des questions courtes, une à la fois, et attendre chaque réponse : dans chaque message, une seule question, un seul point d'interrogation. Quatre ou cinq suffisent : à quoi ça sert, pour qui, ce que la personne y fait d'abord, sur quel appareil, ce qui est déjà décidé. S'arrêter dès que la liste des pages peut être faite. Rien n'est dessiné avant que la personne ait vu la liste.

**S'il y a déjà des maquettes :** relire aussi le projet comme ci-dessus, et comparer avec `etatDesLieux`. Seul `etatDesLieux` se met à jour : ne jamais réécrire `rangees`, `ecrans` ni `reglages` en reprise. Ils ne changent que sur une demande de la personne (étape 6). Les codes d'écran, les notes et les écrans validés ne bougent pas. Après l'état des lieux de reprise et son arrêt : si `reglages` existe, le rappeler en une ligne et continuer à l'étape 5, ou à l'étape 4 s'il n'y a encore aucun écran (sans `reglages`, étape 3) ; ajouter des notes ou de nouveaux écrans est permis, réécrire ne l'est pas.

### 2. État des lieux

Lire `references/etat-des-lieux.md`, puis :

1. Dire ce qui va être créé et où (dossier, fichiers), et prévenir que l'application peut demander une autorisation pour lancer la copie.
2. Dossier neuf, vide ou copie interrompue : y copier la page par une seule commande, `node "<skill>/copier.mjs" "<dossier>"` (par exemple `maquettes`), telle quelle, sans jamais retaper le moteur à la main. Le script crée le dossier, ne remplace jamais un fichier qui existe, refuse un dossier qui n'est pas à l'outil (code 2) et dit ce qu'il a copié. Si la commande est refusée, l'écrire ainsi : « La copie des fichiers de l'outil a été refusée. Sans eux, la page ne peut pas s'afficher. Voulez-vous l'autoriser ? »
   - Sans Node : lire chaque fichier du modèle (`index.html`, `commun.css`, `ecran-type.html`, et chaque fichier de `a-plat/`), puis l'écrire dans le dossier avec les outils de fichiers, sans jamais écraser un fichier qui existe, jamais `plan.exemple.js`, et le dire à la personne. Ne créer aucun dossier vide ni `.gitkeep` : `ecrans/` et `actuel/` naissent avec leur premier fichier.
   - Ne jamais donner à la personne une autre commande de copie, et ne jamais copier les fichiers du modèle avec un joker (`*`), `-Recurse`, `-Force`, `&&` ou `;`.
3. Écrire `plan.js` après la copie : `etatDesLieux`, avec `rangees: []` et `ecrans: []` tant que rien n'est dessiné, et sans `reglages` tant qu'ils ne sont pas acceptés. Le format est dans `references/format.md`.
4. Lancer le contrôle.
5. Montrer l'état des lieux dans la conversation aussi : le compte clair par état, toutes les pages, ce qui n'a pas été lu, puis les points à trancher.

En cas de reprise, commencer ce message par ce qui a changé depuis les maquettes.

**Arrêt.** La personne corrige la liste. Rien n'est dessiné avant sa réponse.

### 3. Réglages

Proposer les cinq réglages d'après ce que le projet contient, chacun avec sa raison en quelques mots, et les écrire dans `reglages` une fois acceptés. La personne peut les changer à tout moment, en le disant. Dans le même message, nommer les 1 ou 2 premiers écrans prévus (étape 4), et, s'il y a des pages qui existent, dire que des captures sont les bienvenues (voir `references/ecrans.md`).

| Réglage | Choix | Comment proposer |
|---|---|---|
| Format | téléphone, ordinateur, les deux | D'après les styles, les documents et ce que dit la personne. Avec les deux, une vue n'a sa version ordinateur que si sa disposition y change vraiment. |
| Rangement | parcours, personne, module, moment, existant et nouveau | Parcours par défaut. Personne si plusieurs rôles ont des pages à eux. Existant et nouveau si l'essentiel est déjà construit. |
| Finition | gris, charte, gris puis charte | Pas de charte dans le projet : gris puis charte. Une charte : s'en servir tout de suite. |
| Rythme | écran par écran, par lots, tout d'un coup | Écran par écran si la personne découvre l'outil. |
| Relecture | oui, non | Oui par défaut. |

**Arrêt.**

### 4. Premiers écrans

Lire `references/ecrans.md`. Dessiner 1 ou 2 écrans seulement, ceux nommés à l'étape 3, quel que soit le rythme choisi : pour un projet, parmi les pages les plus importantes du parcours principal, en préférant une page dont le changement se voit à l'écran, pour que la direction se juge. Pour une idée, l'accord sur la liste vaut demande de dessiner : ce sont les 1 ou 2 écrans du début du parcours principal. Faire ce qui est dit dans « Après chaque lot ». Demander si la direction et le niveau de détail conviennent.

**Arrêt.** Le reste ne se dessine qu'après sa réponse.

### 5. Les écrans

Continuer selon le rythme choisi : un écran, une rangée, ou tout, puis « Après chaque lot » et **arrêt**.

- **Page qui existe, sans changement :** un seul dessin de ce qu'elle montre, avec `commun.css` comme les autres écrans, marqué `inchange: true`. Pas d'actuel à côté.
- **Page qui existe, avec un changement demandé :** l'écran actuel et la proposition, côte à côte. L'`actuel` vient d'une capture fournie par la personne, sinon il est redessiné d'après le code et marqué `redessine`.
- **Page à compléter :** l'actuel et la proposition, et seul ce qui change est mis en avant. Si rien de ce qui lui manque ne se voit à l'écran (une redirection, un envoi), un seul dessin `inchange: true`, et le manque en note.
- **Page qui manque :** dessinée seulement si la personne le demande.
- **Page prévue :** dessinée seulement si la personne le demande. Pour une idée, toutes les pages sont prévues, et l'accord sur la liste vaut cette demande.

Codes par rangée (A1, A2, B1…), de vrais textes, un seul jeu d'exemples, des écrans reliés entre eux.

### 6. Corrections

Lire `references/corrections-et-notes.md`. Une correction arrive de deux façons : « B3 : change le titre » dans la conversation, ou le texte du bouton Copier de la page, qui commence par « Corrections pour ». « B3 validé » met `statut: "valide"` sur cet écran.

### 7. Notes

Les décisions restent à côté des écrans, jamais dessus : notes courtes, avec un type et une date, dans la rangée. Quand une décision change, l'ancienne valeur reste dans `ancien`. Détail dans `references/corrections-et-notes.md`.

### 8. Passage au code

À la fin, ou quand la personne le veut : lire `references/passage-au-code.md` et écrire le dossier qu'il décrit. Le code du projet reste intact.

## Après chaque lot

1. **Relecture** (si `relecture: true`) : relire chaque écran du lot, en entier, contre le code de sa page (sans code, contre ce que la personne a dit ou demandé), avant de le montrer, jamais un échantillon. Rien d'ajouté sans demande, rien d'inventé (élément, ligne, montant), chaque chiffre affiché cohérent avec les autres, aucune donnée réelle, inconnu entre [crochets], liens justes. Un lot trop gros pour être relu en entier se montre en plus petits lots. Si `relecture: false`, dire que ce n'est pas relu.
2. **Contrôle :** lancer `node "<skill>/verifier.mjs" <dossier>` et corriger jusqu'à ce qu'il réussisse. Si Node est absent, faire les contrôles soi-même et le dire (liste dans `references/format.md`).
3. **Rendu :** avec un moyen déjà disponible (navigateur piloté, Playwright), ouvrir la page et l'écran, et regarder ; ne rien installer ni télécharger pour cela. Les captures prises pour vérifier vont dans un dossier temporaire, jamais dans le projet. Sans moyen de regarder, écrire « je n'ai pas vu le rendu ».
4. **Compte rendu**, dans le message : ce qui a été vérifié et comment, ce qui ne l'a pas été, ce qui vient du projet (structure, noms des champs, libellés) et ce qui est inventé, sans jamais dire que rien n'a été repris si c'est faux, les [crochets] restants, le fichier à ouvrir d'un double-clic (`<dossier>/index.html`) et l'adresse de l'écran (`#ecran/A2`).

## Quand Claude est tenté de faire autrement

| Pensée | Ce qu'il faut faire |
|---|---|
| « Cette page serait utile, je l'ajoute à la liste ou je la dessine. » | Si rien dans le projet ne l'annonce ou ne l'exige, elle n'est pas un manque. Si c'est un vrai manque, c'est une question. |
| « Je dessine tout de suite, ce sera plus parlant. » | L'état des lieux d'abord, puis 1 ou 2 écrans, avec un arrêt à chaque fois. |
| « Je vais faire une page de synthèse, ou la publier. » | Le résultat, c'est `plan.js` et les écrans dans le dossier de maquettes, affichés par la page copiée du modèle. |
| « Le code le fait, donc ça marche. » | C'est « lu », pas « vu marcher » : `aConfirmer: true`. |
| « Je mets un chiffre plausible. » | [crochets]. |
| « Je reprends les données d'exemple du projet, c'est plus réaliste. » | Exemples inventés, un seul jeu, même si celles du projet semblent inventées. |
| « Je peux corriger ce bug dans le code au passage. » | Le signaler. L'outil n'écrit que dans le dossier de maquettes. |
| « Je redessine l'actuel, puis la même chose en gris comme proposition. » | Sans changement, un seul dessin, `inchange: true`. |
| « Je pose toutes mes questions d'un coup, ce sera plus rapide. » | Une seule question par message ; le reste en points à trancher, sans point d'interrogation. |
| « Je relis quelques écrans, le reste suivra. » | Chaque écran du lot, en entier, ou un lot plus petit. |
| « Je change une couleur ou une règle de `commun.css` pour cet écran. » | Seule la charte change ses variables ; une classe qui manque s'ajoute à la fin, avec ces variables. |
| « Je lis le `.env` pour comprendre la configuration. » | Son nom suffit. Il va dans ce qui n'a pas été lu. |
