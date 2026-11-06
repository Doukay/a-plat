# Format des maquettes

La référence du dossier de maquettes : à lire avant d'écrire `plan.js` ou un écran.

## Le dossier

```text
maquettes/
  index.html      la page, copiée du modèle, jamais modifiée
  a-plat/         le moteur de la page, copié du modèle, jamais modifié
  plan.js         réglages, état des lieux, rangées, écrans, notes : écrit par Claude
  commun.css      le style commun : ses variables du haut font la charte ; une classe qui manque s'ajoute à la fin
  ecran-type.html le point de départ d'un écran, à copier dans ecrans/
  ecrans/         un fichier HTML par écran
  actuel/         l'existant : captures, ou pages redessinées
```

La page se copie avec `<skill>/copier.mjs` (voir `SKILL.md`), qui ne remplace jamais un fichier déjà là. Le modèle contient aussi `modele/plan.exemple.js`, un plan vide qui montre le format : il n'est jamais copié, car `plan.js` s'écrit pour chaque projet.

La page et le contrôle marchent quel que soit le nom du dossier. `plan.js` est un script et pas du JSON : une page ouverte d'un double-clic n'a pas le droit de lire un fichier JSON voisin.

## Le plan

```js
// maquettes/plan.js
window.A_PLAT = {
  version: 1,                      // obligatoire, vaut 1
  projet: "Mon projet",
  reglages: {
    format: "telephone",           // telephone | ordinateur | les-deux
    rangement: "parcours",         // parcours | personne | module | moment | existant-nouveau
    finition: "gris-puis-charte",  // gris | charte | gris-puis-charte
    rythme: "ecran",               // ecran | lots | tout
    relecture: true,               // true : Claude relit chaque écran avant de le montrer
    policeEnLigne: false           // true seulement si la personne demande une police en ligne pour sa charte
  },
  etatDesLieux: [{
    page: "Nom de la page",
    groupe: "Nom du groupe",       // les pages sont rangées par groupe, dans l'ordre d'apparition
    etat: "a-completer",           // existe | a-completer | manque | prevue
    raison: "Une phrase courte : ce qui a été constaté.", // laissé de côté par la personne : la ligne reste, la raison le dit avec la date
    source: "src/page.js",         // d'où vient l'affirmation : fichier, et ligne si elle aide
    aConfirmer: true,              // true tant que ce n'a pas été vu marcher
    ecrans: ["A2"]                 // codes des écrans dessinés pour cette page ; [] sinon
  }],
  rangees: [{
    id: "A",                       // une lettre, que prennent les codes de ses nouveaux écrans
    titre: "Nom de la rangée",
    notes: [{ type: "decision", date: "2026-01-31", texte: "Note courte.", ancien: "Valeur d'avant" }]
    // type : decision | a-trancher | a-verifier | a-coder | source
    // ancien : seulement quand une décision change ; la page l'affiche barré
  }],
  ecrans: [{
    code: "A2",                    // unique, sert dans les corrections
    titre: "Titre de l'écran",
    rangee: "A",                   // id d'une rangée qui existe
    fichier: "A2-fiche.html",      // dans ecrans/, sans chemin
    largeur: 390,                  // 390 × 844 pour un téléphone ; 1280 × 800 pour un ordinateur
    hauteur: 844,
    statut: "a-relire",            // a-relire | valide
    actuel: { fichier: "actuel/A2-fiche.png", origine: "capture" }
    // origine : capture | redessine ; actuel: null quand il n'y a pas d'existant
  }]
};
```

Règles que le contrôle vérifie :

- `version`, `rangees`, `ecrans` et `etatDesLieux` sont obligatoires, même vides : `[]`.
- Chaque code d'écran est unique. Chaque code cité dans `etatDesLieux[].ecrans` existe dans `ecrans`.
- Chaque écran du plan a son fichier dans `ecrans/`, et chaque fichier HTML de `ecrans/` a son écran dans le plan. Le dossier `ecrans/` doit exister, même vide.
- Un `fichier` ne contient ni `..`, ni adresse complète, ni barre oblique inverse : la page le refuserait.

Pour le format `les-deux`, chaque version est un écran à part, avec son code, sa largeur et sa hauteur.

## Un écran

Un écran est un fichier HTML ordinaire, qui s'ouvre aussi seul :

```html
<!doctype html>
<html lang="fr" data-ecran="A2">
<head><meta charset="utf-8"><title>A2 · Titre de l'écran</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="../commun.css"></head>
<body>
<!-- l'écran ; data-nom="Bouton Envoyer" facultatif sur un élément -->
<script src="../a-plat/relais.js"></script></body>
</html>
```

- `modele/ecran-type.html` montre toutes les classes de base. Il se copie dans `ecrans/` sous le nom de l'écran, car ses liens relatifs (`../commun.css`, `../a-plat/relais.js`) ne marchent que de là. Remplacer `X0` par le code dans `data-ecran` et dans `<title>`, retirer le grand commentaire du haut.
- `data-ecran` vaut exactement le code du plan.
- Un écran n'écrit aucune couleur ni aucun style à lui : tout passe par les classes de `commun.css` (`.entete`, `.retour`, `.page`, `.onglets`, `.bouton`, `.discret`, `.champ`, `.etiquette`, `.carte`, `.vignette`, `.ligne`, `.pile`, `.deux`, `.doux`, `.petit`, `.gras`, `.centre`, `.liste`, `.puces`, `.puce`, `.pastille`, `.bandeau`, `.faits`, `.etapes`, `.vide`, `.segments`). Si un écran a besoin d'autre chose, ajouter la classe à la fin de `commun.css`, en n'y écrivant que ses variables, jamais une couleur en dur : la charte passe alors aussi par elle.
- Les écrans se relient par des liens ordinaires vers le fichier de l'écran suivant : `<a href="B4-merci.html">`. Un lien doit mener à un fichier qui existe.
- `data-nom="Bouton Envoyer"` donne le nom qui apparaîtra dans la correction. À mettre sur les éléments qu'on voudra citer et qui n'ont pas de texte clair.
- `relais.js` est obligatoire, juste avant `</body>` : sans lui, la page ne sait pas quel élément a été touché.
- Un écran ne charge rien depuis Internet : ni script, ni image, ni feuille de style.

## L'existant : `actuel`

- **Capture :** un fichier image dans `actuel/`, fourni par la personne. `origine: "capture"`.
- **Redessiné :** une page HTML dans `actuel/`, écrite d'après le code et les styles du projet, et rien d'autre, avec `origine: "redessine"`. La page affiche alors « Redessiné d'après le code ».

Un `actuel` en HTML doit porter `relais.js`, comme un écran (`<script src="../a-plat/relais.js"></script>`), et ne rien charger depuis Internet. Il n'a pas besoin de `data-ecran` et garde le style du projet, pour ressembler à ce qui existe : il reprend dans un `<style>` les règles des styles du projet qui le concernent, sans en ajouter.

## De gris à la charte

Le gris est le point de départ. Pour passer à la charte, on change seulement les six variables en tête de `commun.css`, jamais les écrans :

```css
--ecran-fond: #ffffff;
--ecran-texte: #1f1f1f;
--ecran-accent: #3d3d3d;
--ecran-trait: #8c8c8c;
--ecran-police: ui-sans-serif, system-ui, sans-serif;
--ecran-arrondi: 8px;
```

- **Accent clair :** si le texte posé sur l'accent devient illisible (boutons, pastilles), changer aussi `--ecran-sur-accent` pour une couleur foncée. Elle vaut par défaut la couleur du fond.
- **Valeurs :** elles viennent de ce que le projet utilise déjà (ses fichiers de style, sa charte). Ce qui n'y est pas se demande : ne pas inventer une charte.

## `policeEnLigne`

Par défaut, rien ne vient d'Internet. Si la personne demande une police en ligne pour sa charte, et seulement alors :

1. `reglages.policeEnLigne: true` dans `plan.js`.
2. Dans chaque écran concerné, un `<link>` vers `https://fonts.googleapis.com` ou `https://fonts.gstatic.com` : ce sont les seules adresses que le contrôle accepte.
3. Dire à la personne que la page contactera ce service pour charger la police.

## Les messages entre l'écran et la page

`relais.js` s'en charge : il n'y a rien à écrire dans un écran. Pour comprendre une panne, tous portent `aPlat: 1` et partent en `postMessage(…, "*")`, car une page en double-clic n'a pas d'origine stable. La page ne retient que les messages dont `event.source` est un de ses cadres.

- Écran vers page :
  - `{aPlat:1, type:"pret", code, hauteur}`
  - `{aPlat:1, type:"element", code, nom, haut, bas}` : `haut` et `bas` sont facultatifs et disent où l'élément touché est dans le cadre, en pixels, pour que la page le garde en vue pendant la saisie
  - `{aPlat:1, type:"lien", code, vers}`
- Page vers écran :
  - `{aPlat:1, type:"mode", mode:"corriger"|"essayer"}`
  - `{aPlat:1, type:"choisi", actif:true|false}` : `choisi` entoure le dernier élément touché, ou ne l'entoure plus

Adresses de la page : `#etat`, `#ensemble`, `#ecran/A2`. Adresse vide : `#etat`.

## Le contrôle

`node <skill>/verifier.mjs <dossier>` : voir `SKILL.md`. Code de sortie 0 : tout va bien. 1 : au moins une erreur. 2 : dossier ou `plan.js` absent. Il liste aussi les [crochets] restants, pour information.

Si Node est absent, faire ces contrôles soi-même, le dire, et lister ceux qui n'ont pas pu l'être : chaque écran du plan a son fichier et l'inverse, codes uniques, liens qui mènent à un fichier, HTML bien fermé, `relais.js` présent, rien qui vient d'Internet, [crochets] restants.

## Servir sur le web

Les fichiers s'ouvrent d'un double-clic, sans serveur. Pour les voir depuis un autre appareil, n'importe quel serveur web convient. Les écrans et la page ont alors la même origine : ne servir que des maquettes de confiance, et seulement le dossier `maquettes/`, jamais le projet entier, qui peut contenir des secrets.
