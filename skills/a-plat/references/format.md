# Format des maquettes

La référence du dossier de maquettes : à lire avant d'écrire `plan.js` ou un écran.

## Le dossier

```text
maquettes/
  index.html      la page, copiée du modèle, jamais modifiée
  a-plat/         le moteur de la page, copié du modèle, jamais modifié
  plan.js         réglages, état des lieux, rangées, écrans, notes : écrit par Claude
  commun.css      le style commun : deux blocs de variables en tête, UX et UI ; Claude n'écrit que le bloc UI ; une classe qui manque s'ajoute à la fin
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
    finition: "gris-puis-charte",  // gris | charte | gris-puis-charte | fidele : le bouton « UX | UI » (voir « UX et UI »)
    rythme: "ecran",               // ecran | lots | tout
    relecture: true,               // true : Claude relit chaque écran avant de le montrer
    policeEnLigne: false           // true seulement si la personne demande une police en ligne pour sa charte
  },
  etatDesLieux: [{
    page: "Nom de la page",
    groupe: "Nom du groupe",       // les pages sont rangées par groupe, dans l'ordre d'apparition
    etat: "a-completer",           // existe | a-completer | manque | prevue
    raison: "Une phrase courte : ce qui a été constaté.", // laissé de côté par la personne : la ligne reste, la raison finit par « Laissé de côté par la personne le AAAA-MM-JJ. »
    source: "src/page.js",         // d'où vient l'affirmation : fichier, et ligne si elle aide
    aConfirmer: true,              // true tant que ce n'a pas été vu marcher ni dit par la personne
    ecrans: ["A2"]                 // codes des écrans dessinés pour cette page ; [] sinon
  }],
  avancement: {                    // écrit à l'état des lieux ; la page le montre en tête de l'état des lieux
    niveau: "en-cours",            // idee | debut | en-cours | avance
    raison: "parce que trois parcours sur cinq ont leurs pages (src/pages/)." // une phrase, avec ses sources
  },
  rangees: [{
    id: "A",                       // une lettre, que prennent les codes de ses nouveaux écrans
    titre: "Nom de la rangée",
    notes: [{ type: "decision", date: "2026-01-31", texte: "Note courte.", ancien: "Valeur d'avant", ecrans: ["A2"] }]
    // type : decision | a-trancher | a-verifier | a-coder | source
    // ancien : seulement quand une décision change ; la page l'affiche barré
    // ecrans (facultatif) : les codes des écrans que la note concerne ; la page l'affiche
    // sous chacun d'eux. Sans ecrans, ou avec ecrans: [], la note vaut pour toute la rangée,
    // et la page l'affiche sous le titre de la rangée.
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
    // inchange: true (facultatif) : page qui existe, sans changement proposé ; le fichier
    // dessine l'existant, seul, et actuel vaut null. La page l'affiche « Inchangé », ou
    // « Inchangé à l'écran » si sa page est à compléter (ce qui manque ne se voit pas).
  }]
};
```

Règles que le contrôle vérifie :

- `version`, `rangees`, `ecrans` et `etatDesLieux` sont obligatoires, même vides : `[]`.
- Chaque code d'écran est unique. Chaque code cité dans `etatDesLieux[].ecrans` existe dans `ecrans`.
- Le champ `ecrans` d'une note, s'il est là, est une liste de codes, et chacun existe dans `ecrans`. Sinon, l'erreur cite la rangée, le numéro de la note et le code inconnu. La page, elle, s'affiche quand même si une note cite un écran absent : elle range la note sous le titre de sa rangée, mais le contrôle la signale toujours.
- Chaque écran du plan a son fichier dans `ecrans/`, et chaque fichier HTML de `ecrans/` a son écran dans le plan. Le dossier `ecrans/` doit exister dès qu'un écran est écrit ; sans écran dans le plan, il peut manquer.
- Un `fichier` (d'un écran ou d'un `actuel`) ne contient ni `..`, ni adresse complète, ni barre au début, ni barre oblique inverse : la page le refuserait. Deux écrans n'ont jamais le même `fichier`, et deux rangées jamais le même `id`.
- Un `actuel.fichier` se cherche dans `actuel/`, qu'il commence par `actuel/` ou non.
- `inchange`, s'il est là, vaut `true` ou `false`. Un écran `inchange: true` n'a pas d'actuel. S'il appartient à une page `a-completer` et qu'aucune note `a-coder` ou `a-trancher` ne le cite dans `ecrans`, le contrôle avertit : le manque doit se lire sous l'écran.
- `avancement`, s'il est là, a un `niveau` parmi `idee`, `debut`, `en-cours`, `avance`, et une `raison`. Absent alors que l'état des lieux a des pages, le contrôle avertit.
- `reglages.finition`, s'il est là, vaut `gris`, `gris-puis-charte`, `charte` ou `fidele` (contrôles de `fidele` dans `references/fidele.md`). Avec `gris-puis-charte` et `charte`, `commun.css` a son bloc UI, aux noms exacts de l'UX, et son bloc UX reste celui du modèle (voir « UX et UI »).
- Un écran (`ecrans/`) n'écrit aucune couleur : ni code (`#c0392b`), ni `rgb()`, `hsl()`, `color()`, ni nom de couleur, dans un attribut `style` ou un `<style>`. `transparent`, `inherit`, `currentColor` et `var(…)` sont permis. L'existant (`actuel/`) n'est pas concerné.

Pour le format `les-deux`, chaque version, quand elle existe (voir `references/ecrans.md`), est un écran à part, avec son code, sa largeur et sa hauteur.

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
- Un écran n'écrit aucune couleur ni aucun style à lui : tout passe par les classes de `commun.css` (`.entete`, `.retour`, `.page`, `.onglets`, `.bouton`, `.discret`, `.court`, `.action`, `.champ`, `.etiquette`, `.carte`, `.forte`, `.vignette`, `.chiffre`, `.moyen`, `.surtitre`, `.ligne`, `.pile`, `.deux`, `.doux`, `.petit`, `.gras`, `.centre`, `.liste`, `.puces`, `.puce`, `.pastille`, `.bandeau`, `.faits`, `.etapes`, `.vide`, `.segments`). Jamais d'attribut `style` : un bouton à sa largeur, c'est `.bouton.court` ; un lien d'action bleu, `.action`. Si un écran a besoin d'autre chose, ajouter la classe à la fin de `commun.css`, en n'y écrivant que ses variables, jamais une couleur en dur : l'UX et l'UI passent alors aussi par elle.
- Les écrans se relient par des liens ordinaires vers le fichier de l'écran suivant : `<a href="B4-merci.html">`. Un lien doit mener à un fichier qui existe.
- `data-nom="Bouton Envoyer"` donne le nom qui apparaîtra dans la correction. À mettre sur les éléments qu'on voudra citer et qui n'ont pas de texte clair.
- `relais.js` est obligatoire, juste avant `</body>` : sans lui, la page ne sait pas quel élément a été touché.
- Un écran ne charge rien depuis Internet : ni script, ni image, ni cadre, ni vidéo, ni feuille de style, ni `url(…)` ou `@import` dans un style. Le contrôle regarde `src`, `srcset`, `poster`, `data`, `action` et `href` sur toutes les balises (sauf les liens `<a>`), les `<style>` et les attributs `style`.

## L'existant : `actuel`

- **Capture :** un fichier image dans `actuel/`, fourni par la personne. `origine: "capture"`.
- **Redessiné :** une page HTML dans `actuel/`, écrite d'après le code et les styles du projet, et rien d'autre, avec `origine: "redessine"`. La page affiche alors « Redessiné d'après le code ».

Un `actuel` en HTML doit porter `relais.js`, comme un écran (`<script src="../a-plat/relais.js"></script>`), et ne rien charger depuis Internet. Il n'a pas besoin de `data-ecran` et garde le style du projet, pour ressembler à ce qui existe : il reprend dans un `<style>` les règles des styles du projet qui le concernent, sans en ajouter.

## UX et UI

Chaque écran est dessiné une seule fois. Ses couleurs viennent de deux blocs de variables en tête de `commun.css`, aux mêmes noms :

- **UX**, sur `:root` : la maquette en gris, façon fiche produit, avec un seul bleu pour ce qui agit. C'est le point de départ, et ce que montre un écran ouvert seul. Ce bloc ne se change pas.
- **UI**, sur `:root[data-finition="ui"]` : les couleurs, les polices et les arrondis du projet. C'est le seul bloc que Claude écrit. Dans le modèle, il reprend les valeurs UX.

```css
:root[data-finition="ui"] {
  --ecran-page: #f4f4f0;           /* le fond derrière les cartes */
  --ecran-fond: #ffffff;           /* les cartes, l'en-tête, les champs */
  --ecran-texte: #222222;          /* l'encre ; les gris de lecture en sont tirés */
  --ecran-trait: #bbbbbb;          /* les filets et les bords */
  --ecran-accent: #1f3b63;         /* ce qui agit : boutons, liens d'action */
  --ecran-sur-accent: #ffffff;     /* le texte posé sur l'accent */
  --ecran-mise-en-avant: #e6e6df;  /* l'aplat d'une carte mise en avant (.carte.forte) */
  --ecran-police: Arial, Helvetica, sans-serif;
  --ecran-police-titre: Arial, Helvetica, sans-serif;
  --ecran-arrondi: 4px;            /* les cartes et les champs */
  --ecran-arrondi-bouton: 4px;     /* les boutons et les choix (des pilules en UX) */
}
```

- **D'où viennent les valeurs UI :** des styles du projet (ses fichiers de style, ses variables, sa charte), lus avant le premier écran. Une valeur qui n'y est pas se demande : ne jamais inventer une charte.
- **Accent clair :** si le texte posé sur l'accent devient illisible (boutons, pastilles), mettre `--ecran-sur-accent` à une couleur foncée.
- **Un écran n'écrit jamais de couleur.** Sinon, le bouton « UX | UI » ne peut plus rien pour lui.

`reglages.finition` règle le bouton « UX | UI » de la barre de la page :

| `finition` | Le bouton | Au départ |
|---|---|---|
| `gris` (ou rien) | absent : tout reste en UX | UX |
| `gris-puis-charte` | présent | UX |
| `charte` | présent | UI |
| `fidele` | présent | UI, avec le vrai style du projet (`projet/`, voir `references/fidele.md`) |

Ensuite, la page retient le choix de la personne pour ce projet. L'actuel (capture ou redessin) garde toujours le vrai style du projet. Avec `fidele`, les écrans ne passent pas par `commun.css` : le contrôle exige `projet/projet.css` et `projet/gris.css` à la place du bloc UI (règles dans `references/fidele.md`). Avec `charte` ou `gris-puis-charte`, le contrôle exige le bloc UI. S'il reprend encore les valeurs UX, le contrôle avertit : « l'UI n'a pas encore les couleurs du projet ».

## `policeEnLigne`

Par défaut, rien ne vient d'Internet. Si la personne demande une police en ligne pour sa charte, et seulement alors :

1. `reglages.policeEnLigne: true` dans `plan.js`.
2. Dans chaque écran concerné, un `<link>` (ou un `@import` dans un `<style>`) vers `https://fonts.googleapis.com` ou `https://fonts.gstatic.com` : ce sont les seules adresses que le contrôle accepte, et seulement pour une feuille de style ou une police, jamais pour un script ou une image.
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

Adresses de la page : `#etat` (l'état des lieux), `#ensemble` (la planche de toutes les rangées), `#rangee/A` (une rangée en grand), `#ecran/A2` (un écran seul). Adresse vide : `#etat`.

## Le contrôle

`node <skill>/verifier.mjs <dossier>` : voir `SKILL.md`. Code de sortie 0 : tout va bien. 1 : au moins une erreur. 2 : dossier ou `plan.js` absent. Il liste aussi les [crochets] restants, pour information.

Si Node est absent, faire ces contrôles soi-même, le dire, et lister ceux qui n'ont pas pu l'être : chaque écran du plan a son fichier et l'inverse, codes uniques, liens qui mènent à un fichier, HTML bien fermé, `relais.js` présent, rien qui vient d'Internet, [crochets] restants.

## Servir sur le web

Les fichiers s'ouvrent d'un double-clic, sans serveur. Pour les voir depuis un autre appareil, n'importe quel serveur web convient. Les écrans et la page ont alors la même origine : ne servir que des maquettes de confiance, et seulement le dossier `maquettes/`, jamais le projet entier, qui peut contenir des secrets.
