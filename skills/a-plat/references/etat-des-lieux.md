# État des lieux

La liste des pages, chacune avec un état et une courte raison. La personne la voit et la corrige avant que quoi que ce soit soit dessiné.

## Choisir l'état

| `etat` | Il s'applique quand | Ce que dit la page |
|---|---|---|
| `existe` | La page est dans le projet, rien de ce qu'elle annonce ne lui manque et, si c'est l'espace d'un rôle, chaque tâche que les documents lui donnent y a son écran ou son action. | Existe |
| `a-completer` | La page est là, et il lui manque quelque chose qu'on peut montrer. | À compléter |
| `manque` | Annoncée, attendue par le projet ou nécessaire à un parcours du projet, et absente. | Manque |
| `prevue` | Une décision écrite (ou dite par la personne) la prévoit, et elle n'est pas construite. | Prévue |

## Où va chaque constat

| Constat | Ligne de la liste |
|---|---|
| État oublié d'un écran (vide, erreur, refus, hors ligne) | La page concernée passe en `a-completer`, l'état oublié est dans la raison. |
| Bouton qui ne mène nulle part | La page qui porte le bouton passe en `a-completer` ; si le bouton vise une page absente, une ligne `manque` en plus. |
| Parcours incomplet | Une ligne `manque` pour l'étape absente, ou `a-completer` si l'étape existe sans sa suite. |
| Tâche d'un rôle, donnée par les documents, sans écran ni action | La page de ce rôle passe en `a-completer`, la tâche dans la raison ; une ligne `manque` si le rôle n'a aucune page. |
| Annoncé mais pas construit | Une page ou une vue : une ligne `manque`, la `source` est le document qui l'annonce. Un comportement (un envoi, une redirection, un calcul) : la page d'où il part passe en `a-completer`, le manque dans la raison, sans ligne à lui. |
| Décidé pour plus tard | Une ligne `prevue`. |
| Choix écarté exprès | Aucune ligne. |
| Idée de Claude que rien dans le projet n'annonce ni n'exige | Aucune ligne. |

Une page peut porter plusieurs manques : une seule ligne par page, les manques dans la raison. Si la raison dépasse deux phrases courtes, la page mérite une ligne par sujet ; la phrase « Laissé de côté par la personne le … » ne compte pas dans ces deux phrases.

## Remplir une ligne

- `page` : le nom que le projet lui donne, sinon un nom simple. Une page à onglets, à fiches ouvertes depuis une liste, à fenêtres ou à étapes a une ligne par vue qui montre autre chose, nommée « Page › vue » (« Réglages › Sécurité »). Une vue qui ne fait que répéter la page avec d'autres données n'en a pas.
- Un comportement sans écran à lui (une redirection, un envoi, un calcul) n'est pas une ligne. S'il manque ou reste à décider, il va dans la raison de la page d'où il part.
- `groupe` : un regroupement par parcours ou par usage, dans l'ordre où on s'en sert.
- `raison` : ce qui a été constaté, en phrases simples. Pas de conseil ni de solution : « Le bouton Partager n'a aucun effet », pas « il faudrait ajouter le partage ».
- `source` : le fichier d'où vient l'affirmation, avec la ligne si elle aide ; deux sources si deux fichiers se contredisent. Pour une idée : « dit par la personne ».
- `aConfirmer` : `true` pour tout ce qui a seulement été lu. Une absence constatée dans le code reste `true` tant que la page n'a pas été essayée.
- `ecrans` : `[]` tant que rien n'est dessiné, puis les codes des écrans de cette page.

## Le cas de l'idée

Les pages viennent des réponses de la personne : chacune est `prevue`, avec `source: "dit par la personne"` et `aConfirmer: false`, car elle n'est pas lue dans un code : c'est la personne qui la dit. Une fois la liste acceptée, les 1 ou 2 premiers écrans sont ceux du début du parcours principal (voir `SKILL.md`, étape 4). Ce qu'un parcours exige et que la personne n'a pas cité est une question, pas une ligne.

## Le message à la personne

Le montrer dans la conversation aussi, sans renvoyer seulement à la page, et dans cet ordre :

```markdown
**État des lieux de <projet>** (lu dans le code, rien n'a été lancé)

**Avancement :** <idée, début, en cours ou avancé>, parce que <constat> (<source>) et <constat> (<source>).

<n> pages ou fonctions : <a> existent, <b> à compléter, <c> manquent, <d> prévues.
<e> sont à essayer pour confirmer.

| Page | État | Ce que j'ai constaté | Source |
|---|---|---|---|
| … | … | … | … |

**Pas lu :** <fichiers ou dossiers, et pourquoi>.

**Écarté exprès, donc pas compté :** <une ligne, si les documents en parlent>.

**À trancher plus tard, sans urgence :**
- <manque, en une phrase> : à dessiner, à laisser de côté, ou à garder en suspens.
- …
- Si vous ne dites rien sur ces points, les pages à compléter seront dessinées avec ce qui leur manque, sur la page elle-même, et les manques resteront en suspens.

La liste est aussi dans a-plat/index.html, à ouvrir d'un double-clic.

Cette liste vous convient, ou voulez-vous corriger quelque chose ?
```

- Le compte se fait sur les lignes du tableau montré, les mêmes que dans `sources/plan.js` : recompter avant d'envoyer, en reprise aussi, et chaque nombre du message doit tomber juste sur ce tableau.
- Toutes les lignes sont dans le tableau, sans « etc. ».
- Un point à trancher par manque, ou par groupe de manques qui se décident ensemble, écrit comme une phrase, pas comme une question. Le message ne pose qu'une question, la dernière : la personne répond aux points qu'elle veut, quand elle veut.
- Ce que couvre « si vous ne dites rien » : seulement l'élément qui manque, dessiné sur la page elle-même. Un écran de plus (un état vide, une erreur) se propose toujours d'abord en une ligne (voir `references/ecrans.md`).

## Reprendre des maquettes

Comparer la nouvelle lecture avec `etatDesLieux` et les écrans, puis commencer le message par :

```markdown
**Ce qui a changé depuis les maquettes :**
- <page> : <ancien état> → <nouvel état>, parce que <constat> (<source>).
- Nouveau dans le projet : …
- N'existe plus : …
- Écrans déjà validés, ou marqués « Inchangé », touchés par ces changements : <codes>. Ils ne sont pas modifiés : à vous de dire.
```

S'il n'y a rien de changé, le dire. Ne pas renuméroter, et garder notes et statuts. Une ligne dont l'état change garde sa place, et l'ancien état se note dans une note de type `source` de sa rangée, si la page a déjà une rangée. Une ligne dont la `raison` finit par « Laissé de côté par la personne le … » garde cette phrase et sa date : ne pas reposer la question, ne pas la retirer.

**Une page d'un ancien modèle dans `a-plat/`.** Le contrôle le signale par un avertissement (`.cache/moteur.js` ne connaît pas une nouveauté) : relancer `copier.mjs` sur le dossier, qui refait la page sans toucher à `sources/`.

**Un ancien dossier de maquettes.** Avant le dossier `a-plat/`, l'outil écrivait tout dans un seul dossier, souvent `maquettes/` : `plan.js` à sa racine, le moteur dans son `a-plat/`, le bloc UI dans son `commun.css`. Le contrôle le refuse (code 2) en le disant. Le proposer d'abord à la personne, puis :

1. `node <skill>/reprendre.mjs <ancien dossier> a-plat` : recopie `plan.js`, `passage-au-code.md`, `ecrans/` et `actuel/` dans `a-plat/sources/` sans rien écraser, met à jour les liens de l'outil dans les écrans et les actuels, et écrit `sources/charte.css` avec le bloc UI de l'ancien `commun.css` et les règles qu'il avait en plus du modèle d'aujourd'hui.
2. Relire `sources/charte.css` : garder ce qui est propre au projet, retirer ce qui n'est qu'une ancienne règle du modèle. Si l'ancien bloc UX (`:root`) avait été changé d'après le projet, en reporter les valeurs dans le bloc UI.
3. `node <skill>/copier.mjs a-plat`, puis le contrôle, et regarder les écrans en UX puis en UI. Pour la finition `fidele`, relancer `style-du-projet.mjs` (l'ancien `projet/` n'est pas recopié).
4. Dire à la personne que l'ancien dossier n'a pas été touché, et que le retirer, une fois le nouveau vérifié, est à elle.

Les codes d'écran, les notes et les statuts ne changent pas.

## Corrections de la liste

- La personne dit qu'un manque n'en est pas un : retirer la ligne, et noter la décision si des rangées existent déjà.
- La personne dit de laisser un manque de côté : la ligne reste, jamais retirée, avec son état et dans le compte, et sa raison finit par « Laissé de côté par la personne le AAAA-MM-JJ. » (la date du jour). Elle ne se dessine pas tant que la personne ne le demande pas. Si des rangées existent, une note `decision` aussi. Dans le doute entre les deux cas, demander.
- La personne dit qu'une page marche : `aConfirmer: false`, avec « confirmé par la personne » dans la `source`.
- La personne ajoute une page : une ligne de plus, avec `source: "dit par la personne"`.

Mettre `sources/plan.js` à jour, relancer le contrôle, et redonner le compte.
