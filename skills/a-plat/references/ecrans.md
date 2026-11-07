# Dessiner les écrans

Le format exact d'un écran est dans `references/format.md`. Ici : quoi dessiner, et comment.

## Codes et rangées

- Une rangée par groupe, selon le réglage `rangement` : parcours, personne, module, moment, ou existant et nouveau. Chaque rangée a une lettre : A, B, C… Elle se crée quand elle reçoit son premier écran ou sa première note, pas avant.
- Chaque écran a un code fait de sa lettre et d'un numéro dans la rangée : A1, A2, B1. Fichier : `A2-fiche.html`.
- Un code ne change jamais et ne resservira pas, même si l'écran est retiré : c'est lui qui sert dans les corrections.
- Remplir `etatDesLieux[].ecrans` avec les codes de chaque page.
- Un état d'une page (vide, erreur, refus) qui mérite d'être vu est un écran à lui, avec son code. Chaque écran de plus se justifie : une vue, un état demandé.
- Avec le format `les-deux`, une vue n'a sa version ordinateur que si sa disposition y change vraiment (colonnes, menu de côté, tableau au lieu de cartes). Sinon un seul écran, au format principal (celui que la personne met en premier, sinon le téléphone), et la raison en une ligne dans le compte rendu.
- Avant d'ajouter un écran que la personne n'a pas demandé (un état, une autre version, la retouche d'un écran qu'elle n'a pas cité), le proposer d'abord en une ligne, et attendre sa réponse.
- Après un changement de rangement, un écran garde son code : sa lettre peut ne plus être celle de sa rangée (voir `references/corrections-et-notes.md`).

## Quoi dessiner, selon l'état de la page

| Page | Ce qui est dessiné |
|---|---|
| Existe, sans changement | Un seul dessin, avec `commun.css` comme les autres écrans : ce que la page montre aujourd'hui, au propre, avec `inchange: true` et `actuel: null`. Pas de redessin de l'existant à côté : deux fois le même contenu n'apprend rien, et coûte le double. |
| Existe, avec un changement demandé ou accepté par la personne | L'`actuel` et la proposition, côte à côte. |
| À compléter | L'`actuel` et la proposition, côte à côte, et seul ce qui change est mis en avant, par un `.bandeau` autour de l'élément et une `.pastille` « Nouveau ». Si rien de ce qui manque ne se voit à l'écran (une redirection, un envoi), un seul dessin `inchange: true`, et le manque en note `a-coder` ou `a-trancher` avec `ecrans` : elle s'affiche sous l'écran, et la page le marque « Inchangé à l'écran ». |
| Manque | Rien, sauf si la personne l'a demandé. |
| Prévue | Rien, sauf si la personne l'a demandé. Pour une idée, toutes les pages sont prévues : l'accord sur la liste vaut demande, en commençant par le début du parcours principal. |

**Un écran inchangé** suit les règles du redessin (plus bas) pour le contenu : la structure et les libellés de la page, mot pour mot, ce que le code contient et rien d'autre, avec le jeu d'exemples. Seul l'habillage change : les classes de `commun.css`, comme les autres écrans. Si la personne veut ensuite que la vraie page change, voir `references/corrections-et-notes.md` : le code de l'écran ne change pas.

**Un comportement n'est pas un écran.** Ce qui ne se voit pas à l'écran (une redirection après la connexion, un envoi, un calcul) n'a pas d'écran à lui, sauf s'il montre quelque chose de nouveau (un message, un état). S'il manque ou reste à décider, il va dans la raison de la page d'où il part, à l'état des lieux, et en note `a-coder` ou `a-trancher` dans la rangée de son écran.

**Ce qui entre dans une proposition :** le contenu de la page, ce que le projet annonce pour elle, et ce que la personne a demandé ou accepté. Le reste ne se résout pas : il reste à l'écran sous la forme `[à décider : …]`, ou passe en note `a-trancher`. Ne pas ajouter de bouton, de champ, d'étape ou de page de soi-même.

Le niveau de détail suit le projet et la demande : un projet à ses débuts, peu de détail ; une appli en ligne, ses vrais libellés.

Dans une proposition, préférer des lignes (`.ligne`, `.liste`) à un tableau plus large que l'écran.

## La coquille commune

Ce qui revient sur presque chaque écran (barre du haut, menu de côté, barre d'onglets du bas, pastilles comme « Pro ») est la coquille. Elle est la même partout, sinon les écrans se contredisent d'un lot à l'autre.

- La coquille de référence vient des premiers écrans (étape 4), acceptés par la personne, un par format dessiné, et le compte rendu dit lesquels. Elle est prise dans le code qui la dessine (le gabarit, le menu), pas dans une page au hasard. Un format pas encore dessiné prend pour référence son premier écran, relu contre ce même code.
- Chaque écran la recopie mot pour mot : mêmes liens, même ordre, mêmes pastilles. Seul change l'élément actif (la page où l'on est).
- Les actuels redessinés ont aussi une seule coquille, la leur, celle du code : la même dans tous les actuels.
- Un écran qui n'a pas la coquille dans le projet (connexion, page publique, fenêtre) ne l'a pas non plus dans la maquette.
- Si la coquille doit changer après coup, la changer dans tous les écrans d'un coup, propositions et actuels, et le dire.

## L'existant : capture ou redessin

Dire une seule fois que des captures des pages qui existent sont les bienvenues, à l'arrêt de l'étape 2 ou de l'étape 3, avant tout dessin, en une phrase et pas comme une question de plus. Elles servent pour les pages qui changent : une page inchangée n'a pas d'actuel. Rappeler qu'une capture peut montrer des données réelles : mieux vaut qu'elle n'en contienne pas.

- **Capture fournie :** la regarder avant de la copier. Si elle montre des données qui semblent réelles (noms, adresses, montants, identifiants), ne pas la copier, le dire à la personne, et lui demander une capture sans elles. Sinon, la mettre dans `actuel/`, avec `origine: "capture"` : demander à la personne d'y poser le fichier elle-même, ou le copier par une seule commande de copie ordinaire qui nomme ce seul fichier, sa source et sa destination, jamais avec un joker (`*`). Claude n'en fait pas lui-même en lançant l'application, sauf accord de la personne (voir « Lancer le projet » dans `SKILL.md`).
- **Pas de capture :** redessiner la page d'après le code, dans `sources/actuel/`, avec `origine: "redessine"`. Lire ses styles avant, puis reprendre sa structure, ses libellés et ses règles de style, avec le même jeu d'exemples. Seul ce que le code et les styles du projet contiennent y entre, et rien n'y est ajouté, hors les exemples inventés : ni largeur, ni règle, ni élément. Ajouter seulement `relais.js`, comme indiqué dans `references/format.md`. Le redessin montre ce que la page fait, défauts compris, y compris un bouton sans effet : c'est ce qui permet la comparaison. Un style qui n'a pas pu être lu se dit dans le compte rendu, et ne se remplace pas.
- **Pas de page existante :** `actuel: null`.

## Les textes

- **Libellés de l'interface :** ceux du projet quand ils existent, mot pour mot. Sinon de vrais textes, simples, jamais de « lorem ipsum ».
- **Ce qui n'est pas connu :** ce que le projet doit fixer lui-même, prix de vente, durée, délai, nom officiel, texte légal, adresse de contact, entre [crochets] : `[durée à choisir]`.
- **Les montants et nombres d'exemple :** une dépense, un solde, un total, un nombre de membres ou de visites viennent du jeu d'exemples, pas des crochets. Les totaux se calculent à partir des montants affichés, pour rester justes. Un écran couvert de crochets ne se lit plus.
- **Ce qui est connu :** un chiffre ou une règle écrite dans le projet garde sa valeur. Si deux sources se contredisent, [crochets] et une note `a-trancher`.

## Un seul jeu d'exemples

Choisir au premier écran un jeu inventé mais crédible, propre au domaine du projet, et le réutiliser partout : mêmes personnes, mêmes objets, mêmes lieux, mêmes montants. Il tient en une ligne : deux ou trois personnes avec des prénoms courants et variés, des prénoms différents à chaque projet (pas ceux d'un autre projet ni toujours les mêmes), un lieu ordinaire, les objets ou services que le projet manipule, des montants et des dates plausibles. L'écrire en commentaire en tête de `plan.js`, pour le retrouver :

```js
// Jeu d'exemples (inventé) : <prénoms>, <lieu>, <objets ou services>, <montants et dates>.
```

Il ne reprend ni les données du projet (base, fichiers d'exemple, captures), ni les noms de vrais clients, ni rien qui ressemble à un secret. Les valeurs saisies ou d'exemple écrites dans les fichiers de données ou de départ du projet (noms, objets, notes, textes) sont remplacées par le jeu inventé, même si elles semblent inventées. Ce qui se reprend du projet : la structure, les noms des champs et les libellés de l'interface. Un libellé fixe de l'interface (un statut, une catégorie) se garde, même écrit dans un fichier de données. Le compte rendu dit ce qui a été pris au projet et ce qui a été inventé, sans jamais écrire que rien n'a été repris si c'est faux.

## Relier les écrans

- Chaque bouton et lien qui mène à un écran dessiné pointe vers son fichier : `<a href="B1-demande.html">`. Le mode « Essayer le parcours » de la page les suit.
- Vers un écran pas encore dessiné : `href="#"`, puis le vrai lien quand l'écran existe.
- Mettre un `data-nom` sur les éléments importants sans texte clair.
- Le bouton retour mène à l'écran d'où l'on vient.

## Finition

Chaque écran est dessiné une seule fois. Deux blocs de variables aux mêmes noms lui donnent deux visages, l'UX dans `.cache/commun.css` et l'UI dans `sources/charte.css` (voir « UX et UI » dans `references/format.md`) : l'UX, la maquette en gris, et l'UI, les couleurs, polices et arrondis du projet. Le bouton « UX | UI » de la page passe de l'un à l'autre pour tous les écrans d'un coup.

- `gris` : pas de bouton, tout reste en UX. L'attention va à ce que dit l'écran, pas aux couleurs.
- `gris-puis-charte` : le bouton, avec un départ en UX. Écrire le bloc UI avant le premier écran ; la personne bascule quand elle veut.
- `charte` : le bouton, avec un départ en UI.
- `fidele` : le bouton, avec un départ en UI, mais les écrans ne passent pas par `commun.css` : ils sont écrits avec le balisage et les classes du projet, et chargent son vrai style. Tout est dans `references/fidele.md` ; le reste de cette section ne vaut que pour les autres finitions.
- Les valeurs UI se lisent dans les styles du projet (fichiers de style, variables, thème, charte), avant le premier écran. Une valeur qui n'y est pas se demande ; ne jamais l'inventer.
- Un écran n'écrit jamais de couleur ni d'attribut `style` : sinon, le bouton ne peut plus rien pour lui. Un bouton à sa largeur, c'est `.bouton.court` ; un lien d'action, `.action`.
- Ce qu'on lit en premier sur un écran (le chiffre clé : un solde, un total, un nombre) est en grand, avec `.chiffre` (ou `.chiffre.moyen`), précédé de son petit libellé gris `.surtitre`. La carte la plus importante peut être mise en avant avec `.carte.forte`.
