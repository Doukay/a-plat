# La finition fidèle : l'UI avec le vrai style du projet

Avec `fidele`, l'UI ressemble à l'appli : chaque écran est écrit avec **le balisage et les classes du projet**, et charge **sa vraie feuille de style**, ses polices et ses icônes. L'UX est le même écran, en gris et dans la police du système. Le bouton « UX | UI » passe de l'un à l'autre ; la page part en UI.

Même ainsi, une maquette dessinée reste proche de l'appli, pas identique : seule une capture de l'appli qui tourne l'est. Le dire à la personne une fois, en le proposant.

## Quand la proposer

- Le projet a un style qui se construit ou se recopie : Tailwind 4 (sa feuille fait `@import "tailwindcss"`), ou une feuille CSS ordinaire et ses `@import`. Pour un autre système (Tailwind 3, CSS dans le JavaScript, modules CSS, feuilles importées une à une par les composants, Sass sans CSS construit), proposer `charte` : le script s'arrête de lui-même sur Tailwind 3 et sur une feuille qu'il ne sait pas construire.
- Tailwind doit être **installé dans le projet** (`node_modules`). Sinon, `fidele` demanderait une installation : c'est la décision de la personne (« Lancer le projet » dans `SKILL.md`), sinon `charte`.
- Il faut Node. Sans Node, `charte`.
- **Le coût :** un écran fidèle demande de lire chaque composant qu'il affiche. C'est nettement plus long que `charte`. Le dire en proposant, avec le nombre d'écrans.

## L'accord, puis la construction du style

Avant de lancer quoi que ce soit, le demander une fois pour les deux scripts (`style-du-projet.mjs` et `icones.mjs`), en disant : ils exécutent des paquets installés du projet (son Tailwind et ses extensions, son React et ses icônes), qui sont du code du projet ; ils n'écrivent que dans `<dossier>/projet/`, ou rien du tout pour les icônes, et ne lisent que dans le projet. Une fois l'accord donné, il vaut pour la suite du travail sur ce dossier.

```
node "<skill>/style-du-projet.mjs" "<dossier>" "<feuille d'entrée du projet>"
```

- La feuille d'entrée : celle qui porte le style de l'appli (souvent `src/index.css` ou `src/app/globals.css`), lue à l'étape 1.
- `--modules "<dossier>"` : seulement si les paquets installés ne sont pas au-dessus de la feuille.
- Le script écrit `projet/projet.css` (pour Tailwind : les seules classes des écrans et des actuels qui le chargent), `projet/gris.css`, `projet/polices.css` et `projet/polices/` (les paquets `@fontsource` que le code importe), `projet/fichiers/` (images et polices citées, sous leur chemin dans le projet). Ce qui viendrait d'Internet est retiré, ce qui est hors du projet n'est pas copié, et il dit les deux.
- **Le relancer** après chaque lot d'écrans, avant le contrôle : avec Tailwind, une classe nouvelle n'a de style qu'après. Le contrôle avertit quand un écran a changé depuis (même pour une retouche de texte : relancer ne coûte rien). Lancé avant le premier écran, il le dit.
- Ces fichiers ne s'écrivent pas à la main.

## Les icônes

Pour Lucide (`lucide-react`), le SVG exact, tel que l'appli le dessine :

```
node "<skill>/icones.mjs" "<dossier du projet>" Bell Trash2 --classe="h-4 w-4" --trait=1.5
```

Le nom est celui que le projet importe de `lucide-react` (avant un éventuel `as`), alias compris (`Home`, `Trash2`) ; `--classe`, `--trait`, `--taille` reprennent `className`, `strokeWidth`, `size` du JSX. Coller le SVG tel quel. Pour une autre bibliothèque, l'icône la plus proche, et le dire dans le compte rendu.

## Écrire un écran fidèle

```html
<!doctype html>
<html lang="fr" data-ecran="A2">
<head><meta charset="utf-8"><title>A2 · Titre de l'écran</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- Transcrit de <fichiers source> ; état montré : <lequel>. -->
<link rel="stylesheet" href="../projet/polices.css">
<link rel="stylesheet" href="../projet/projet.css">
<link rel="stylesheet" href="../projet/gris.css"></head>
<body>
<div id="root"> … </div>
<script src="../a-plat/relais.js"></script></body>
</html>
```

1. Lire le composant de la page et tout ce qu'il rend, coquille comprise (gabarit, barre du haut, menu, barre du bas), et les composants d'interface qu'il utilise (boutons, cartes) jusqu'à leurs classes.
2. Écrire l'arbre HTML que l'appli produit pour l'état montré : mêmes balises, même ordre, **mêmes classes, mot pour mot**, préfixes compris (`sm:`, `md:`, `dark:` : la feuille s'en charge). Les conditions et les fusions de classes (`cn(…)`, `clsx`, variantes) se résolvent pour l'état montré.
3. Les textes de l'interface, mot pour mot ; les valeurs, celles du jeu d'exemples (`references/ecrans.md`), écrites comme l'appli les met en forme (espaces, signes, devise).
4. Un attribut `style` seulement pour une dimension calculée (une largeur en %), jamais une couleur : le contrôle la refuse. Pas de `<style>` de couleur, pas de script, rien d'Internet. Une couleur que l'appli calcule depuis ses données (la pastille d'une catégorie) : la classe que le projet donne à cette valeur s'il en a une (une table de teintes), sinon la classe du projet la plus proche, et le dire en commentaire.
5. Ce qui ne se voit pas à la largeur de l'écran (un menu `hidden lg:flex` au téléphone), les fenêtres fermées et les animations ne se transcrivent pas : le dire en commentaire.
6. Un lien qui mène à un écran dessiné pointe vers son fichier, comme pour les autres écrans. Un bouton de l'appli reste un `<button>`, sauf s'il ouvre un écran dessiné : alors un `<a>`, et le dire.

**La coquille** se transcrit une fois, dans le premier écran de chaque format, puis se recopie mot pour mot (« La coquille commune » dans `references/ecrans.md`) : c'est aussi ce qui allège le travail des écrans suivants. Il en va de même pour un bloc qui revient (une ligne de liste, une carte de chiffre) : le transcrire une fois, le recopier ensuite.

**La proposition** part de l'actuel transcrit, et ne change que ce qui est proposé. Ce qui est nouveau se construit avec les composants et les classes que le projet a déjà pour ce rôle (un message d'erreur, une pastille) : chercher comment le projet le fait ailleurs, et le dire. Le marquer « Nouveau » avec la pastille du projet.

## L'actuel fidèle

L'actuel redessiné s'écrit de la même façon, dans `actuel/`, mais ne charge **jamais** `projet/gris.css` : il garde toujours le vrai style. Il charge `../projet/polices.css` et `../projet/projet.css`, et `relais.js`. Une capture fournie par la personne reste meilleure que tout redessin.

## La hauteur

La hauteur de l'écran dans `plan.js` est celle de la page entière en UI, polices chargées : la mesurer si un moyen de regarder est là, sinon l'estimer large et le dire.

## Caler sur l'appli (facultatif)

Si la personne accepte qu'on lance l'appli (« Lancer le projet »), comparer un actuel fidèle à la vraie page, à la même largeur, et corriger les écarts dans la transcription, jamais dans `projet.css`. Sans cet accord, écrire « pas comparé à l'appli lancée ».

## Le contrôle

Avec `fidele`, le contrôle exige `projet/projet.css` et `projet/gris.css`, refuse une feuille qui charge depuis Internet et un actuel qui charge `gris.css`, et avertit pour un écran qui ne charge pas le vrai style, ou qui a changé après la construction. Le bloc UI de `commun.css` ne sert pas.
