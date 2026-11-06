# Dessiner les écrans

Le format exact d'un écran est dans `references/format.md`. Ici : quoi dessiner, et comment.

## Codes et rangées

- Une rangée par groupe, selon le réglage `rangement` : parcours, personne, module, moment, ou existant et nouveau. Chaque rangée a une lettre : A, B, C… Elle se crée quand elle reçoit son premier écran ou sa première note, pas avant.
- Chaque écran a un code fait de sa lettre et d'un numéro dans la rangée : A1, A2, B1. Fichier : `A2-fiche.html`.
- Un code ne change jamais et ne resservira pas, même si l'écran est retiré : c'est lui qui sert dans les corrections.
- Remplir `etatDesLieux[].ecrans` avec les codes de chaque page.
- Un état d'une page (vide, erreur, refus) qui mérite d'être vu est un écran à lui, avec son code. Chaque écran de plus se justifie : une page, un état demandé.
- Avant d'ajouter un écran que la personne n'a pas demandé (un état, une autre version, la retouche d'un écran qu'elle n'a pas cité), le proposer d'abord en une ligne, et attendre sa réponse.
- Après un changement de rangement, un écran garde son code : sa lettre peut ne plus être celle de sa rangée (voir `references/corrections-et-notes.md`).

## Quoi dessiner, selon l'état de la page

| Page | Ce qui est dessiné |
|---|---|
| Existe | L'`actuel` et la proposition, côte à côte. Sans demande de changement, la proposition reprend le même contenu et le met au propre. |
| À compléter | Pareil, et seul ce qui change est mis en avant, par un `.bandeau` autour de l'élément et une `.pastille` « Nouveau ». |
| Manque | Rien, sauf si la personne l'a demandé. |
| Prévue | Rien, sauf si la personne l'a demandé. Pour une idée, toutes les pages sont prévues : l'accord sur la liste vaut demande, en commençant par le début du parcours principal. |

**Ce qui entre dans une proposition :** le contenu de la page, ce que le projet annonce pour elle, et ce que la personne a demandé ou accepté. Le reste ne se résout pas : il reste à l'écran sous la forme `[à décider : …]`, ou passe en note `a-trancher`. Ne pas ajouter de bouton, de champ, d'étape ou de page de soi-même.

Le niveau de détail suit le projet et la demande : un projet à ses débuts, peu de détail ; une appli en ligne, ses vrais libellés.

## L'existant : capture ou redessin

Demander une seule fois si la personne a des captures des pages qui existent, à l'arrêt de l'étape 2 ou de l'étape 3, avant tout dessin, avec les autres questions, à la fin du message. Rappeler qu'une capture peut montrer des données réelles : mieux vaut qu'elle n'en contienne pas.

- **Capture fournie :** la regarder avant de la copier. Si elle montre des données qui semblent réelles (noms, adresses, montants, identifiants), ne pas la copier, le dire à la personne, et lui demander une capture sans elles. Sinon, la copier dans `actuel/`, avec `origine: "capture"`. Claude n'en fait pas lui-même en lançant l'application, sauf accord de la personne (voir « Lancer le projet » dans `SKILL.md`).
- **Pas de capture :** redessiner la page d'après le code, dans `actuel/`, avec `origine: "redessine"`. Lire ses styles avant, puis reprendre sa structure, ses libellés et ses règles de style, avec le même jeu d'exemples. Seul ce que le code et les styles du projet contiennent y entre, et rien n'y est ajouté : ni largeur, ni règle, ni élément. Ajouter seulement `relais.js`, comme indiqué dans `references/format.md`. Le redessin montre ce que la page fait, défauts compris, y compris un bouton sans effet : c'est ce qui permet la comparaison. Un style qui n'a pas pu être lu se dit dans le compte rendu, et ne se remplace pas.
- **Pas de page existante :** `actuel: null`.

## Les textes

- **Libellés de l'interface :** ceux du projet quand ils existent, mot pour mot. Sinon de vrais textes, simples, jamais de « lorem ipsum ».
- **Ce qui n'est pas connu :** prix, durée, délai, nom officiel, texte légal, adresse de contact, entre [crochets] : `[durée à choisir]`.
- **Ce qui est connu :** un chiffre ou une règle écrite dans le projet garde sa valeur. Si deux sources se contredisent, [crochets] et une note `a-trancher`.

## Un seul jeu d'exemples

Choisir au premier écran un jeu inventé mais crédible, propre au domaine du projet, et le réutiliser partout : mêmes personnes, mêmes objets, mêmes lieux, mêmes montants. Il tient en une ligne : deux ou trois personnes avec des prénoms courants et variés, des prénoms différents à chaque projet (pas ceux d'un autre projet ni toujours les mêmes), un lieu ordinaire, les objets ou services que le projet manipule, des montants et des dates plausibles. L'écrire en commentaire en tête de `plan.js`, pour le retrouver :

```js
// Jeu d'exemples (inventé) : <prénoms>, <lieu>, <objets ou services>, <montants et dates>.
```

Il ne reprend ni les données du projet (base, fichiers d'exemple, captures), ni les noms de vrais clients, ni rien qui ressemble à un secret. Les noms, objets, notes et textes écrits dans les fichiers de données ou de départ du projet sont remplacés par le jeu inventé, même s'ils semblent inventés. Ce qui se reprend du projet : la structure, les noms des champs et les libellés de l'interface. Le compte rendu dit ce qui a été pris au projet et ce qui a été inventé, sans jamais écrire que rien n'a été repris si c'est faux.

## Relier les écrans

- Chaque bouton et lien qui mène à un écran dessiné pointe vers son fichier : `<a href="B1-demande.html">`. Le mode « Essayer le parcours » de la page les suit.
- Vers un écran pas encore dessiné : `href="#"`, puis le vrai lien quand l'écran existe.
- Mettre un `data-nom` sur les éléments importants sans texte clair.
- Le bouton retour mène à l'écran d'où l'on vient.

## Finition

- `gris` et le début de `gris-puis-charte` : `commun.css` tel quel. L'attention va à ce que dit l'écran, pas aux couleurs.
- `charte` : régler les variables de `commun.css` d'après le projet avant le premier écran (voir `references/format.md`).
- `gris-puis-charte` : passer à la charte quand la personne le dit, en ne changeant que `commun.css`, puis regarder de nouveau les écrans.
