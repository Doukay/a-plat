# À plat : plan de construction de la première version

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**But :** construire le plugin `a-plat` décrit dans `docs/conception.md`, l'essayer sur un projet inventé, puis le publier avec l'accord du propriétaire du dépôt.

**Architecture :** un skill écrit pour Claude (la méthode) et une page sans serveur copiée dans le projet de la personne. Claude écrit `maquettes/plan.js` et un fichier HTML par écran ; la page les affiche dans des cadres et ne les modifie jamais. Un script Node, optionnel, contrôle le dossier sans rien afficher.

**Technique :** HTML, CSS et JavaScript sans bibliothèque ni étape de compilation. Node 18 ou plus pour `verifier.mjs` et les tests (`node --test`). Playwright pour les tests de page, seulement chez qui développe l'outil.

**Description :** `docs/conception.md`. Toute tâche la lit en entier avant de commencer.

## Contraintes générales

- Tout le texte visible, les messages d'erreur, le README et le skill sont en français, en phrases simples.
- Rien chez l'utilisateur ne dépend d'une bibliothèque ni d'une installation, Node excepté pour `verifier.mjs`, qui reste optionnel.
- La page n'envoie rien et ne charge rien depuis Internet : aucune mesure d'usage, aucun compte.
- L'outil n'écrit que dans le dossier de maquettes et ne modifie jamais le code du projet.
- Exemples inventés seulement. Le dépôt ne contient aucun nom, chiffre, charte, écran, chemin ou mail venant d'un projet réel, ni aucun chemin de la machine de développement.
- Aucun fichier d'un type d'Artifact de claude.ai n'est copié ou imité. Aucun code d'un autre dépôt n'est repris.
- Licence MIT, titulaire « Les contributeurs d'À plat ».
- Page utilisable à 390 px de large, sans défilement horizontal de la page, en clair et en sombre. Cibles tactiles de 44 px au moins.
- Vérifier après chaque changement : refaire les contrôles touchés sur la version finale, et dire ce qui n'a pas été vérifié.
- Travail sur la branche `premiere-version`. Aucun envoi sur GitHub avant la tâche 12.

## Points à surveiller

Chacun a son test dans la tâche indiquée.

1. **`plan.js` absent ou cassé** : la page affiche ce qui ne va pas et quoi faire, jamais une page blanche (tâche 3).
2. **Écran listé mais fichier absent** : le cadre affiche « Écran introuvable » et le nom du fichier, les autres écrans restent utilisables (tâche 4).
3. **Stockage ou copie refusés par le navigateur** : les corrections marchent en mémoire, et le texte à copier s'affiche sélectionné (tâche 5).
4. **Texte piégeux dans le plan ou une correction** (balises HTML, guillemets, accents, très long titre) : affiché comme du texte, sans exécution ni débordement à 390 px (tâches 3 et 5).
5. **Dossier `maquettes/` qui existe déjà sans être à l'outil, et secrets du projet** : Claude n'écrase rien, demande où écrire, ne lit pas les `.env` et clés, et aucun secret n'arrive dans les maquettes (tâches 7 et 9).

## Fichiers

```text
.claude-plugin/plugin.json        identité du plugin
.claude-plugin/marketplace.json   permet l'installation depuis le dépôt
skills/a-plat/SKILL.md            la méthode, courte
skills/a-plat/references/         lire-un-projet, etat-des-lieux, ecrans, format, corrections-et-notes, passage-au-code
skills/a-plat/modele/             tout ce qui est copié dans maquettes/
  index.html
  commun.css                      gris par défaut ; charte par variables
  plan.js                         plan vide d'exemple
  ecran-type.html                 écran de départ
  a-plat/logique.js               fonctions pures, sans navigateur
  a-plat/moteur.js                les vues de la page
  a-plat/relais.js                chargé par chaque écran
  a-plat/style.css                style de la page
skills/a-plat/verifier.mjs        contrôle en ligne de commande
exemples/pretoutil/               projet inventé, avec des manques connus
tests/*.test.mjs                  tests sans navigateur
tests/page/*.test.mjs             tests de page (Playwright)
tests/fixtures/                   plans et écrans d'essai
tests/reponses/pretoutil.md       les manques attendus, hors de la vue de Claude pendant l'essai
docs/essais/                      comptes rendus d'essai
README.md, LICENSE, .gitignore, package.json
```

## Format commun

Ce format sert à toutes les tâches. Il est documenté pour Claude dans `references/format.md`.

```js
// maquettes/plan.js
window.A_PLAT = {
  version: 1,
  projet: "Prêtoutil",
  reglages: {
    format: "telephone",        // telephone | ordinateur | les-deux
    rangement: "parcours",      // parcours | personne | module | moment | existant-nouveau
    finition: "gris-puis-charte", // gris | charte | gris-puis-charte
    rythme: "ecran",            // ecran | lots | tout
    relecture: true,
    policeEnLigne: false        // true seulement si la personne demande une police en ligne pour sa charte
  },
  etatDesLieux: [{
    page: "Fiche d'un outil",
    groupe: "Trouver un outil",
    etat: "a-completer",        // existe | a-completer | manque | prevue
    raison: "Rien n'est prévu quand l'outil est déjà prêté.",
    source: "src/fiche.js",     // d'où vient l'affirmation
    aConfirmer: true,           // lu sans l'avoir vu marcher
    ecrans: ["A2"]
  }],
  rangees: [{
    id: "A",
    titre: "Trouver un outil",
    notes: [{ type: "decision", date: "2026-11-04", texte: "Caution retirée.", ancien: "Caution de 20 €" }]
    // type : decision | a-trancher | a-verifier | a-coder | source
  }],
  ecrans: [{
    code: "A2",                 // unique, sert dans les corrections
    titre: "Fiche d'un outil",
    rangee: "A",
    fichier: "A2-fiche.html",   // dans ecrans/
    largeur: 390,
    hauteur: 844,
    statut: "a-relire",         // a-relire | valide
    actuel: { fichier: "actuel/A2-fiche.png", origine: "capture" } // ou origine "redessine" ; null si pas d'existant
  }]
};
```

Un écran est un fichier HTML ordinaire :

```html
<!doctype html>
<html lang="fr" data-ecran="A2">
<head><meta charset="utf-8"><title>A2 · Fiche d'un outil</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="../commun.css"></head>
<body><!-- l'écran, data-nom="…" facultatif sur un élément --><script src="../a-plat/relais.js"></script></body>
</html>
```

Messages entre l'écran et la page, tous avec `aPlat: 1`, envoyés en `postMessage(…, "*")` car une page en double-clic n'a pas d'origine stable. La page ne retient que les messages dont `event.source` est un de ses cadres.

- écran vers page : `{aPlat:1, type:"pret", code, hauteur}`, `{aPlat:1, type:"element", code, nom, haut?, bas?}` (`haut` et `bas`, facultatifs : où l'élément est dans le cadre, en pixels, pour que la page le garde en vue pendant la saisie d'une correction), `{aPlat:1, type:"lien", code, vers}`
- page vers écran : `{aPlat:1, type:"mode", mode:"corriger"|"essayer"}`, `{aPlat:1, type:"choisi", actif:true|false}` (l'écran entoure le dernier élément touché quand `actif` vaut `true`, et ne l'entoure plus quand il vaut `false`)

Adresses de la page : `#etat`, `#ensemble`, `#ecran/A2`. Adresse vide : `#etat`.

---

### Tâche 1 : socle du plugin et commande réelle

**Fichiers :**
- Créer : `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `skills/a-plat/SKILL.md` (provisoire), `LICENSE`, `.gitignore`, `package.json`
- Test : `tests/plugin.test.mjs`
- Modifier : `docs/conception.md` si la commande réelle diffère

**Produit :** la commande exacte à taper, reprise par les tâches 7 et 10.

- [ ] **Étape 1 : vérifier la branche**

Run: `git branch --show-current`
Attendu : `premiere-version`.

- [ ] **Étape 2 : écrire le test qui échoue**

`tests/plugin.test.mjs` lit les deux JSON et vérifie : `plugin.name === "a-plat"`, `marketplace.name === "a-plat"`, `marketplace.plugins[0].name === "a-plat"`, `marketplace.plugins[0].source === "./"`, et qu'aucun des deux fichiers ne contient d'identifiant de compte GitHub ni de `http`.

- [ ] **Étape 3 : lancer le test**

Run: `node --test tests/plugin.test.mjs`
Attendu : ÉCHEC, fichier introuvable.

- [ ] **Étape 4 : créer les fichiers**

`marketplace.owner.name` vaut `"Les contributeurs d'À plat"`. `package.json` : `"private": true`, `"type": "module"`, scripts `test` (`node --test tests/*.test.mjs`) et `test:page` (`node --test tests/page/*.test.mjs`), `playwright` en `devDependencies`. `.gitignore` : `node_modules/`, `SUIVI.md`. `SKILL.md` provisoire : `name: a-plat`, une description, une phrase.

- [ ] **Étape 5 : lancer le test**

Run: `node --test tests/plugin.test.mjs`
Attendu : RÉUSSI.

- [ ] **Étape 6 : valider et essayer le plugin**

Run: `claude plugin validate .`
Attendu : aucune erreur. Puis, sans toucher à l'installation de la machine : `claude --plugin-dir . -p "Quels skills du plugin a-plat vois-tu, et par quelle commande se lancent-ils ?"`.

Noter la commande réelle. Les plugins préfixent leurs skills : si `/a-plat` ne marche pas et qu'il faut `/a-plat:a-plat`, corriger `docs/conception.md`, et le dire au propriétaire du dépôt avant la tâche suivante.

- [ ] **Étape 7 : enregistrer**

```bash
git add .claude-plugin skills LICENSE .gitignore package.json tests docs
git commit -m "Poser le socle du plugin"
```

### Tâche 2 : le format et le contrôle

**Fichiers :**
- Créer : `skills/a-plat/modele/a-plat/logique.js`, `skills/a-plat/verifier.mjs`, `tests/fixtures/complet/` (plan et 3 écrans valides)
- Test : `tests/logique.test.mjs`, `tests/verifier.test.mjs`

**Produit :**
- `validerPlan(plan) -> string[]` : les erreurs en français, liste vide si tout va bien
- `texteCorrections(corrections, projet) -> string`, où `corrections` est un tableau de `{code, element, texte}`
- `ecranParFichier(plan, fichier) -> ecran | null`
- `logique.js` s'expose à la fois dans `window.APlatLogique` et dans `module.exports`, sans rien casser dans le navigateur ni dans Node
- `node verifier.mjs <dossier>` : code 0 si tout va bien, 1 s'il y a une erreur, 2 si le dossier ou `plan.js` manque

- [ ] **Étape 1 : écrire les tests qui échouent**

`tests/logique.test.mjs` :
- `validerPlan` refuse, avec un message qui cite le code ou le champ : un code d'écran en double, un écran dont la `rangee` n'existe pas, un `etat` hors liste, un type de note hors liste, un `version` différent de 1, un `etatDesLieux[].ecrans` qui cite un code inconnu.
- `validerPlan(planComplet)` renvoie `[]`.
- `texteCorrections([{code:"B3",element:"Bouton Envoyer",texte:"Dire Valider"}], "Prêtoutil")` renvoie exactement `"Corrections pour Prêtoutil :\n\n1. B3 > Bouton Envoyer : Dire Valider"`.
- `texteCorrections([], "Prêtoutil")` renvoie `""`.

`tests/verifier.test.mjs`, qui lance le script sur des copies de la fixture dans un dossier temporaire et lit code de sortie et sortie :
- `complet` : code 0.
- écran du plan sans fichier : code 1, le message cite le fichier.
- fichier d'écran hors du plan : code 1, le message cite le fichier.
- lien `href="X9.html"` vers un fichier absent : code 1.
- HTML avec une balise `<div>` non fermée : code 1.
- `data-ecran` différent du code du plan : code 1.
- écran sans `relais.js` : code 1.
- écran avec `<script src="https://…">` ou `<link href="https://…">` : code 1, sauf les polices quand `reglages.policeEnLigne === true`.
- trois `[Prix à confirmer]` dans un écran : code 0, et la sortie dit « 3 textes entre crochets ».
- dossier sans `plan.js` : code 2.
- `plan.js` à la syntaxe cassée : code 1, et le message le dit.
- `plan.js` n'est pas exécuté avec des droits : il tourne dans `node:vm`, avec un `window` vide, sans `require` ni `process`. Un plan qui appelle `process.exit()` donne le code 1.

- [ ] **Étape 2 : lancer les tests**

Run: `npm test`
Attendu : ÉCHEC, modules absents.

- [ ] **Étape 3 : écrire `logique.js` puis `verifier.mjs`**

Le contrôle des balises non fermées reste simple : une pile sur les balises ouvrantes et fermantes, hors éléments vides, commentaires, `<script>` et `<style>`. Pas de bibliothèque.

- [ ] **Étape 4 : lancer les tests**

Run: `npm test`
Attendu : tout RÉUSSI.

- [ ] **Étape 5 : enregistrer**

```bash
git add skills tests
git commit -m "Définir le format et le contrôle des maquettes"
```

### Tâche 3 : la page et l'état des lieux

**Fichiers :**
- Créer : `skills/a-plat/modele/index.html`, `modele/a-plat/moteur.js`, `modele/a-plat/style.css`, `modele/plan.js`, `tests/fixtures/plans-pieges/`
- Test : `tests/page/etat.test.mjs`, `tests/page/aide.mjs`

**Utilise :** `validerPlan` (tâche 2).

**Produit :** dans `moteur.js`, `afficher(adresse)`, la barre avec les trois vues et le stockage `lireStock(cle)` / `garderStock(cle, valeur)`, tous deux protégés par `try/catch`. Tout texte venant du plan passe par `textContent`, jamais `innerHTML`.

- [ ] **Étape 1 : écrire les tests qui échouent**

`tests/page/aide.mjs` ouvre une fixture en `file://`, avec le navigateur `process.env.A_PLAT_NAVIGATEUR` (par défaut Edge, `channel: "msedge"`), et récolte les erreurs de la console et les requêtes réseau.

`tests/page/etat.test.mjs` :
- la page sans `plan.js` montre « plan.js est introuvable » et ce qu'il faut faire ;
- avec un `plan.js` à la syntaxe cassée, elle montre « plan.js contient une erreur » ;
- avec un plan refusé par `validerPlan`, elle montre chaque erreur en français ;
- avec le plan complet, chaque page de `etatDesLieux` apparaît avec son libellé d'état (`Existe`, `À compléter`, `Manque`, `Prévue`), sa raison et sa source ;
- `aConfirmer: true` affiche « à essayer pour confirmer » ;
- un `etatDesLieux` vide montre comment demander la liste à Claude ;
- un titre `<img src=x onerror="window.PIEGE=1">` s'affiche en texte, et `window.PIEGE` reste `undefined` ;
- un titre de 300 caractères ne crée pas de défilement horizontal à 390 px ;
- à 390 px et 1320 px, en clair et en sombre : aucun débordement et aucune erreur de console ;
- aucune requête en dehors de `file://`.

- [ ] **Étape 2 : lancer les tests**

Run: `npm install && npm run test:page`
Attendu : ÉCHEC.

- [ ] **Étape 3 : écrire la page**

Reprendre la direction validée dans l'aperçu : papier froid, un seul bleu pour tout ce qui touche aux corrections, polices du système, couleurs par variables, sans ombres ni décoration inutiles. L'état ne repose jamais sur la seule couleur : le mot est écrit.

Pour détecter l'absence de `plan.js`, `index.html` le charge par une balise `<script>` munie d'un `onerror` ; une erreur de syntaxe se détecte par `window.onerror` et l'absence de `window.A_PLAT`.

- [ ] **Étape 4 : lancer les tests**

Run: `npm run test:page`
Attendu : tout RÉUSSI.

- [ ] **Étape 5 : regarder le rendu**

Capturer la vue à 390 et 1320 px, clair et sombre, et les regarder. Se demander si une personne non développeuse comprend la page sans explication.

- [ ] **Étape 6 : enregistrer**

```bash
git add skills tests package-lock.json
git commit -m "Afficher le plan et l'état des lieux"
```

### Tâche 4 : les écrans, en vue d'ensemble et seuls

**Fichiers :**
- Créer : `skills/a-plat/modele/a-plat/relais.js`
- Modifier : `modele/a-plat/moteur.js`, `modele/a-plat/style.css`
- Test : `tests/page/ecrans.test.mjs`

**Utilise :** les messages et les adresses du format commun, `ecranParFichier` (tâche 2).

**Produit :** `relais.js` calcule `nomElement(el)` : `data-nom` s'il existe, sinon le rôle en français et le texte court (`Bouton « Envoyer »`, `Lien « Retour »`, `Titre « … »`, `Champ « … »` d'après son libellé, sinon `Élément`).

- [ ] **Étape 1 : écrire les tests qui échouent**

`tests/page/ecrans.test.mjs` :
- `#ensemble` montre une rangée par `rangees[]`, dans l'ordre, chaque écran avec son code et son titre, et les notes au bout de la rangée, séparées des écrans ;
- chaque note montre son type en toutes lettres, sa date, et son `ancien` barré ;
- toucher une vignette ouvre `#ecran/<code>` ;
- `#ecran/A2` sur un écran avec `actuel` montre l'actuel et la proposition côte à côte (l'un sous l'autre à 390 px), avec « Capture de l'existant » ou « Redessiné d'après le code » selon `origine` ;
- sans `actuel`, la proposition seule ;
- un écran dont le fichier manque affiche « Écran introuvable » et le nom du fichier après 3 secondes sans message `pret`, et les autres écrans restent utilisables ;
- en mode « Essayer le parcours », toucher un lien dans l'écran A1 vers `A2-fiche.html` ouvre `#ecran/A2` ;
- un message venu d'une autre fenêtre que les cadres de la page est ignoré ;
- un écran ouvert seul, hors de la page, s'affiche et ses liens marchent normalement ;
- le style d'un écran ne change pas celui de la page ;
- `#ecran/ZZ` (code inconnu) dit que l'écran n'existe pas et renvoie vers `#ensemble` ;
- un plan de 124 écrans générés s'affiche en moins de 3 secondes sur ordinateur, sans erreur.

- [ ] **Étape 2 : lancer les tests**

Run: `npm run test:page`
Attendu : ÉCHEC sur les nouveaux tests.

- [ ] **Étape 3 : écrire `relais.js` et les deux vues**

Les vignettes sont des cadres réduits (`transform: scale`) avec `pointer-events: none` et `loading="lazy"`. Le zoom libre n'est pas dans cette version.

- [ ] **Étape 4 : lancer les tests**

Run: `npm run test:page`
Attendu : tout RÉUSSI.

- [ ] **Étape 5 : enregistrer**

```bash
git add skills tests
git commit -m "Afficher les écrans en vue d'ensemble et seuls"
```

### Tâche 5 : les corrections

**Fichiers :**
- Modifier : `modele/a-plat/moteur.js`, `modele/a-plat/style.css`, `modele/a-plat/relais.js`
- Test : `tests/page/corrections.test.mjs`

**Utilise :** `texteCorrections`, `nomElement`, `lireStock`, `garderStock`.

**Produit :** clé de stockage `a-plat:corrections:<projet>`, valeur tableau de `{code, element, texte}`.

- [ ] **Étape 1 : écrire les tests qui échouent**

- en mode « Corriger », toucher un élément ouvre un champ intitulé `Corriger : A2 > Bouton « Demander »` ; « Ajouter » crée la correction et un repère numéroté dans la liste ;
- « Retirer » l'enlève ;
- les corrections survivent à un rechargement ;
- « Copier pour Claude » met dans le presse-papiers le texte de `texteCorrections`, et dit qu'il faut le coller dans la conversation ;
- `localStorage` qui lève une erreur : les corrections marchent en mémoire, et aucune erreur de console ;
- `navigator.clipboard.writeText` refusé : le texte s'affiche dans un champ, déjà sélectionné ;
- une correction `<script>window.PIEGE=1</script> « é »` s'affiche et se copie telle quelle, sans exécution ;
- le code de l'écran est visible et sélectionnable dans la vue d'un écran seul, pour pouvoir écrire « B3 : … » ;
- à 390 px, le champ de correction ne cache ni son bouton ni l'élément choisi ;
- la page n'a aucun bouton « Valider » qui modifierait le plan : l'aide dit d'écrire « B3 validé » dans la conversation.

- [ ] **Étape 2 : lancer les tests**

Run: `npm run test:page`
Attendu : ÉCHEC sur les nouveaux tests.

- [ ] **Étape 3 : écrire le code**

- [ ] **Étape 4 : lancer les tests**

Run: `npm run test:page`
Attendu : tout RÉUSSI.

- [ ] **Étape 5 : enregistrer**

```bash
git add skills tests
git commit -m "Préparer et copier les corrections"
```

### Tâche 6 : modèle d'écran, finitions, et premier point d'étape

**Fichiers :**
- Créer : `skills/a-plat/modele/commun.css`, `modele/ecran-type.html`, `tests/fixtures/demo/` (copie du modèle avec 8 écrans inventés, dont un actuel et un proposé, et des notes de chaque type)
- Test : `tests/commun.test.mjs`

**Produit :** `commun.css` définit `--ecran-fond`, `--ecran-texte`, `--ecran-accent`, `--ecran-trait`, `--ecran-police`, `--ecran-arrondi`, et des classes de base (`.bouton`, `.champ`, `.carte`, `.vignette`). Passer du gris à une charte revient à changer ces variables en tête du fichier, sans toucher aux écrans.

- [ ] **Étape 1 : écrire le test qui échoue**

Par défaut, toutes les valeurs de couleur de `commun.css` sont grises (rouge = vert = bleu), et le fichier ne contient ni `url(http` ni `@import`.

- [ ] **Étape 2 : lancer le test, écrire le fichier, relancer**

Run: `npm test`
Attendu : ÉCHEC, puis RÉUSSI.

- [ ] **Étape 3 : assembler la démo et la contrôler**

Run: `node skills/a-plat/verifier.mjs tests/fixtures/demo`
Attendu : code 0.

- [ ] **Étape 4 : passer le design en revue**

Utiliser le skill `impeccable` sur la page assemblée. Corriger ce qui est un vrai défaut. Refaire `npm run test:page`.

- [ ] **Étape 5 : enregistrer**

```bash
git add skills tests
git commit -m "Ajouter le modèle d'écran et les finitions"
```

- [ ] **Étape 6 : POINT D'ÉTAPE, attendre le propriétaire du dépôt**

Publier la démo en privé et lui montrer les trois vues, surtout la vue d'ensemble, qu'il n'a pas encore vue. Lui demander si la direction et le niveau de complexité conviennent. Ne pas écrire la méthode avant sa réponse.

### Tâche 7 : la méthode, écrite pour Claude

**Fichiers :**
- Modifier : `skills/a-plat/SKILL.md`
- Créer : `skills/a-plat/references/lire-un-projet.md`, `etat-des-lieux.md`, `ecrans.md`, `format.md`, `corrections-et-notes.md`, `passage-au-code.md`
- Test : `tests/skill.test.mjs`

**Utilise :** le format commun, `verifier.mjs`, le modèle.

**Produit :** les 8 étapes du parcours de la description. `SKILL.md` tient en 150 lignes au plus et renvoie aux références.

- [ ] **Étape 1 : charger le skill `superpowers:writing-skills` et suivre sa méthode**

Avant d'écrire, lancer un essai de référence sans le skill, sur le projet de la tâche 8 si déjà prêt, sinon sur un mini-projet : noter ce que Claude fait de travers.

- [ ] **Étape 2 : écrire le test qui échoue**

`tests/skill.test.mjs` : le `name` vaut `a-plat`, la description existe et dit quand se servir de l'outil, `SKILL.md` fait 150 lignes au plus, toute référence citée existe, et les fichiers du skill ne contiennent aucun des noms de la recherche de données personnelles (liste lue dans une variable d'environnement, pour que la liste elle-même n'entre pas dans le dépôt).

- [ ] **Étape 3 : écrire le skill**

Il doit obliger, en termes vérifiables :
- **Lire :** ne jamais ouvrir `.env`, clés ni dossiers de secrets ; ne rien modifier hors du dossier de maquettes ; dire d'où vient chaque affirmation ; `aConfirmer` à `true` pour tout ce qui n'a pas été vu marcher.
- **Dossier :** si `maquettes/` existe avec un `plan.js` d'À plat, reprendre et signaler ce qui a changé ; s'il existe sans, ne rien écraser et demander où écrire ; sinon, copier le modèle.
- **Mise à plat :** ne rien ajouter de soi-même ; ce qui manque devient une question ; [crochets] pour l'inconnu ; un seul jeu d'exemples inventés ; aucune donnée réelle dans les maquettes.
- **Ordre :** montrer l'état des lieux avant de dessiner, puis 1 ou 2 écrans avant le reste.
- **Corrections :** comprendre « B3 : … » et le texte du bouton Copier ; garder l'ancienne valeur barrée dans la note ; « B3 validé » met `statut: "valide"`.
- **Après chaque lot :** lancer `verifier.mjs` si Node est là, sinon faire les contrôles soi-même et le dire. Regarder le rendu si un moyen existe, et dire sinon que ce n'est pas vu.
- **Question :** toujours écrite en toutes lettres à la fin du message.

- [ ] **Étape 4 : lancer le test**

Run: `npm test`
Attendu : tout RÉUSSI.

- [ ] **Étape 5 : enregistrer**

```bash
git add skills tests
git commit -m "Écrire la méthode pour Claude"
```

### Tâche 8 : le projet d'essai

**Fichiers :**
- Créer : `exemples/pretoutil/` (petite appli HTML et JS, un README, un `.env` factice), `tests/reponses/pretoutil.md`
- Test : `tests/exemple.test.mjs`

**Produit :** un projet inventé de prêt d'outils entre voisins, avec au moins 12 manques connus et une liste de pièges.

- [ ] **Étape 1 : écrire le test qui échoue**

Le `.env` contient `CLE_FACTICE=A_PLAT_TEMOIN_7Q2`. `tests/reponses/pretoutil.md` liste au moins 12 manques, et chacun a une rubrique : page absente, état oublié, bouton sans suite, parcours incomplet, annoncé mais pas construit. Les réponses ne sont nulle part dans `exemples/pretoutil/`.

- [ ] **Étape 2 : lancer le test, écrire le projet, relancer**

Run: `npm test`
Attendu : ÉCHEC, puis RÉUSSI.

Mettre aussi 3 fausses pistes : une page qui semble absente mais existe sous un autre nom, un bouton qui mène bien quelque part par du code indirect, une fonction écartée exprès, écrit dans le README.

- [ ] **Étape 3 : enregistrer**

```bash
git add exemples tests
git commit -m "Ajouter le projet d'essai"
```

### Tâche 9 : essais réels du parcours

**Fichiers :**
- Créer : `docs/essais/2026-MM-JJ-pretoutil.md`
- Modifier : `skills/a-plat/` selon ce que les essais montrent

Chaque essai part d'une copie de `exemples/pretoutil` dans un dossier temporaire, sans `tests/reponses/`, avec `claude --plugin-dir <dépôt> -p`. Pour un parcours à plusieurs tours, reprendre la même conversation avec `--resume`.

- [ ] **Étape 1 : projet en cours**

Mener lecture, état des lieux, réglages, 2 écrans, corrections, reste de l'UX, UI, passage au code. Attendu :
- le dossier de passage au code liste les écrans validés, les décisions, les questions ouvertes et ce qui reste à coder ;
- `node verifier.mjs maquettes` donne le code 0 ;
- `grep -r A_PLAT_TEMOIN_7Q2 maquettes` ne trouve rien ;
- `git status` dans la copie ne montre de changement que dans `maquettes/` ;
- le rendu de chaque vue est regardé à l'écran.

- [ ] **Étape 2 : compter**

Comparer l'état des lieux à `tests/reponses/pretoutil.md`. Écrire dans le compte rendu : manques trouvés, manques ratés, inventions, fausses pistes tombées. Pas de seuil caché : le compte est publié tel quel. Si plus d'un tiers des manques sont ratés, améliorer `references/lire-un-projet.md` et refaire l'essai.

- [ ] **Étape 3 : simple idée**

Dossier vide, une phrase d'idée. Attendu : questions une à une, état des lieux en `prevue`, aucun écran avant la validation de la liste.

- [ ] **Étape 4 : reprise**

Sur les maquettes de l'étape 1, changer le projet (ajouter une page, en retirer une), puis relancer. Attendu : l'outil signale les deux changements, et n'écrase pas une correction déjà validée.

- [ ] **Étape 5 : dossier `maquettes/` étranger**

Créer `maquettes/photo.png` et `maquettes/notes.txt` sans `plan.js`, puis relancer. Attendu : Claude demande où écrire, les deux fichiers restent intacts.

- [ ] **Étape 6 : réglages**

Essayer chaque valeur de `format`, `rangement`, `finition`, `rythme` et `relecture`, au moins une fois, sur peu d'écrans. Noter l'effet constaté pour chacune.

- [ ] **Étape 7 : enregistrer**

```bash
git add docs skills
git commit -m "Essayer le parcours sur le projet inventé"
```

### Tâche 10 : README et navigateurs

**Fichiers :**
- Créer : `README.md`
- Test : `tests/readme.test.mjs`

**Utilise :** la commande réelle de la tâche 1.

- [ ] **Étape 1 : écrire le test qui échoue**

Le README contient : à quoi ça sert, l'installation, un premier essai, ce que l'outil envoie (rien), ce qu'il ne fait pas, la règle « ne servir que le dossier `maquettes/` », les limites connues tirées de `docs/essais/`, et la licence. Il ne cite aucun chemin de machine.

- [ ] **Étape 2 : écrire le README, en phrases simples, et relancer**

Run: `npm test`
Attendu : RÉUSSI.

- [ ] **Étape 3 : autres navigateurs**

Run: `A_PLAT_NAVIGATEUR=chrome npm run test:page`
Attendu : RÉUSSI. Pour Firefox et Safari, sans téléchargement décidé seul : demander au propriétaire du dépôt d'ouvrir `tests/fixtures/demo/index.html`, ou son accord pour installer le navigateur de test. Écrire dans le README ce qui a été vu et ce qui ne l'a pas été.

- [ ] **Étape 4 : par un serveur web et sur un téléphone**

Servir `tests/fixtures/demo` par un serveur statique local, relancer les tests de page sur cette adresse, puis faire ouvrir la page sur un vrai téléphone par le propriétaire du dépôt. Attendu : mêmes résultats ; toucher un élément marche au doigt.

- [ ] **Étape 5 : aucune requête réseau**

Run: `npm run test:page`
Attendu : le relevé de `aide.mjs` ne montre aucune requête vers Internet, y compris sur `demo`.

- [ ] **Étape 6 : installation propre**

Dans un dossier neuf, en suivant seulement le README et depuis le dépôt local : installer, lancer, désinstaller. Le faire dans le terminal, et faire confirmer l'application de bureau par le propriétaire du dépôt. Corriger le README si un geste manque.

- [ ] **Étape 7 : enregistrer**

```bash
git add README.md tests
git commit -m "Écrire le README et contrôler les navigateurs"
```

### Tâche 11 : essai et validation par le propriétaire du dépôt

- [ ] **Étape 1 : lui donner le mode d'emploi du README**

Il installe l'outil et le lance sur un projet de son choix, à lui, hors du dépôt. Les maquettes produites restent dans son projet et n'entrent jamais ici.

- [ ] **Étape 2 : corriger ce qu'il trouve**

Refaire les tests touchés après chaque correction, puis enregistrer par petits commits.

- [ ] **Étape 3 : ATTENDRE sa validation écrite**

Ne pas passer à la tâche 12 sans elle.

### Tâche 12 : recherche de données personnelles et publication

**Fichiers :**
- Hors dépôt : la fiche `SUIVI.md`, la ligne du tableau, et l'inventaire des skills

- [ ] **Étape 1 : chercher dans les fichiers ET tout l'historique**

```bash
git grep -n -i -E "$MOTS" $(git rev-list --all)
git log --all --format='%an %ae %cn %ce %s%n%b' | grep -n -i -E "$MOTS"
```

`$MOTS` couvre les prénom, nom, identifiants, mail, projets et chemins privés listés dans la consigne du propriétaire, en variable hors dépôt. Chercher aussi dans les images (métadonnées) et les noms de fichiers. Attendu : le seul résultat admis est son identifiant GitHub public, dans l'adresse noreply et la commande d'installation.

- [ ] **Étape 2 : lui montrer le résultat complet**

- [ ] **Étape 3 : créer le dépôt en privé et y envoyer le travail**

Fusionner `premiere-version` dans `main`, puis, avec son accord :

Run: `gh repo create a-plat --private --source . --push`
Attendu : dépôt privé créé. Refaire l'installation depuis GitHub avec la commande du README.

- [ ] **Étape 4 : ATTENDRE son accord explicite pour le passage en public**

Accord au moment de le faire, après qu'il a vu l'étape 2. Sans accord, le dépôt reste privé.

Run: `gh repo edit a-plat --visibility public --accept-visibility-change-consequences`
Attendu : dépôt public ; ouvrir l'adresse sans être connecté et lire le README.

- [ ] **Étape 5 : mettre à jour le suivi**

Fiche `SUIVI.md`, tableau par `_outils/tableau.py`, et ajout de l'outil à l'inventaire des skills. Dire ce qui a été vu et ce qui reste non vérifié.
