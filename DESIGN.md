---
name: À plat
description: Un projet mis à plat en maquettes, dans le calme d'une fiche produit grise.
colors:
  fond: "#f5f5f7"
  surface: "#ffffff"
  texte: "#1d1d1f"
  doux: "#66666b"
  trait: "#d2d2d7"
  crayon: "#0066cc"
  crayon-pale: "#e5f0fb"
  ok: "#248a3d"
  attente: "#b25000"
  manque: "#d70015"
  barre: "#000000"
  barre-champ: "#1d1d1f"
  barre-survol: "#272729"
  barre-filet: "#48484a"
  barre-texte: "#f5f5f7"
  barre-texte-2: "#a1a1a6"
  barre-anneau: "#64b0ff"
  fond-sombre: "#111113"
  surface-sombre: "#1d1d1f"
  texte-sombre: "#f5f5f7"
  doux-sombre: "#a1a1a6"
  trait-sombre: "#48484a"
  crayon-sombre: "#2997ff"
  crayon-pale-sombre: "#10263d"
  ok-sombre: "#30d158"
  attente-sombre: "#ffb340"
  manque-sombre: "#ff6961"
  ecran-page: "#f5f5f7"
  ecran-fond: "#ffffff"
  ecran-texte: "#1d1d1f"
  ecran-trait: "#d2d2d7"
  ecran-accent: "#0066cc"
  ecran-sur-accent: "#ffffff"
  ecran-mise-en-avant: "#ececf0"
  ecran-doux: "color-mix(in srgb, #1d1d1f 62%, #ffffff)"
  ecran-filet: "color-mix(in srgb, #d2d2d7 70%, #ffffff)"
  ecran-creux: "color-mix(in srgb, #1d1d1f 4%, #ffffff)"
typography:
  page:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  page-titre-planche:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-.035em"
  page-titre-de-vue:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.25
  page-barre:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
  page-etat:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  page-note:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13.5px"
  ecran-h1:
    fontFamily: "var(--ecran-police-titre)"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-.035em"
  ecran-h2:
    fontFamily: "var(--ecran-police-titre)"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-.02em"
  ecran-texte:
    fontFamily: "var(--ecran-police)"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "-.01em"
  ecran-chiffre:
    fontFamily: "var(--ecran-police-titre)"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-.035em"
  ecran-surtitre:
    fontFamily: "var(--ecran-police)"
    fontSize: "12.5px"
    fontWeight: 500
rounded:
  page-bouton: "8px"
  page-ligne: "10px"
  page-carte: "12px"
  page-panneau: "14px"
  pilule: "999px"
  ecran-arrondi: "12px"
  ecran-arrondi-bouton: "999px"
spacing:
  barre: "52px"
  gouttiere: "16px"
  ecran-page: "16px"
  ecran-ecart: "14px"
  cible-tactile: "44px"
components:
  barre-haut:
    backgroundColor: "{colors.barre}"
    textColor: "{colors.barre-texte}"
    height: "52px"
  barre-recherche:
    backgroundColor: "{colors.barre-champ}"
    textColor: "{colors.barre-texte}"
    rounded: "{rounded.pilule}"
    height: "34px"
  ligne-etat-des-lieux:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.texte}"
    rounded: "{rounded.page-ligne}"
    padding: "12px 14px"
  avancement-trait:
    backgroundColor: "{colors.trait}"
    rounded: "{rounded.pilule}"
    height: "8px"
  avancement-trait-fait:
    backgroundColor: "{colors.crayon}"
  badge-valide:
    textColor: "{colors.ok}"
    rounded: "{rounded.pilule}"
  badge-inchange:
    textColor: "{colors.doux}"
    rounded: "{rounded.pilule}"
  ecran-bouton:
    backgroundColor: "{colors.ecran-accent}"
    textColor: "{colors.ecran-sur-accent}"
    rounded: "{rounded.ecran-arrondi-bouton}"
    padding: "10px 18px"
    height: "44px"
  ecran-carte:
    backgroundColor: "{colors.ecran-fond}"
    textColor: "{colors.ecran-texte}"
    rounded: "{rounded.ecran-arrondi}"
    padding: "16px"
  ecran-carte-forte:
    backgroundColor: "{colors.ecran-mise-en-avant}"
  ecran-champ:
    backgroundColor: "{colors.ecran-fond}"
    rounded: "{rounded.ecran-arrondi}"
    padding: "10px 12px"
    height: "44px"
---

# Design System: À plat

Ce fichier décrit l'apparence d'À plat telle qu'elle est construite aujourd'hui. Il y a deux surfaces, à ne pas confondre : **la page** (`skills/a-plat/modele/a-plat/style.css`), qui montre l'état des lieux, la planche et les écrans, et **les écrans** eux-mêmes (`skills/a-plat/modele/commun.css`, plus `charte.css` pour l'UI), dessinés par Claude dans chaque projet. Les titres des grandes parties restent en anglais parce que les outils les reconnaissent à ce nom. Le bloc de valeurs en tête de fichier fait foi. Les noms viennent du code : `crayon` est le bleu des corrections, `ecran-` préfixe les variables des écrans, `-sombre` la version du thème sombre.

## Overview

**Creative North Star : « La table à dessin calme »**

La page se lit comme une table où l'on étale ses écrans : un fond gris froid, une barre noire en haut, des cartes blanches posées à plat, beaucoup d'air. La barre noire et les gris reprennent ceux de La carte, l'autre outil de la même famille. Les écrans, eux, sont des maquettes en gris façon fiche produit, avec un seul bleu pour ce qui agit.

La couleur ne décore pas, elle dit l'état. Le vert dit ce qui existe, l'ambre ce qui est à compléter, le rouge ce qui manque, le bleu crayon ce qu'on peut faire. Le reste est du gris et du blanc. Un état s'écrit toujours en toutes lettres : la couleur et la forme ne font que l'appuyer.

**Key Characteristics :**
- Une barre noire de 52px, la même en clair et en sombre.
- Un fond gris froid, des cartes blanches à filet d'un pixel.
- Les écrans dans des cadres, qui gardent leurs propres couleurs quel que soit le thème de la page.
- Deux visages pour chaque écran, UX et UI, par deux jeux de variables aux mêmes noms.
- Les polices du système, aucune ressource chargée d'Internet.

## Colors

### Primary

- **Bleu crayon** (`crayon`, #0066cc ; sombre #2997ff, ceux de La carte) : tout ce qui touche aux corrections et à l'action dans la page : anneau de focus, mode actif, traits faits de la barre d'avancement, survol d'un écran. `crayon-pale` en fait l'aplat léger.

### Secondary

Les couleurs d'état de l'état des lieux, toujours accompagnées du mot :

- **Vert** (`ok`, #248a3d ; sombre #30d158) : Existe, et le badge Validé.
- **Ambre** (`attente`, #b25000 ; sombre #ffb340) : À compléter, et les notes à trancher.
- **Rouge** (`manque`, #d70015 ; sombre #ff6961) : Manque, et les écrans introuvables ou refusés.
- **Prévue** garde le gris de lecture, avec un rond en pointillés.

### Neutral

- **Perle** (`fond`, #f5f5f7 ; sombre #111113, comme La carte) : le fond de la page.
- **Blanc** (`surface`, #ffffff ; sombre #1d1d1f) : les lignes de l'état des lieux, les notes, les panneaux.
- **Encre** (`texte`) et **gris de lecture** (`doux`) : le texte principal, puis les sources, dates et consignes.
- **Filet** (`trait`) : les bords d'un pixel.
- **Noir de barre** (`barre`, #000000) : la barre du haut, identique dans les deux thèmes, avec son champ de recherche (`barre-champ`), son survol, ses textes et son anneau de focus bleu clair (`barre-anneau`).

### Les écrans : UX et UI

Les écrans ont leurs propres variables, toutes préfixées `--ecran-`, en deux blocs aux mêmes noms :

- **UX** (sur `:root`, en tête de `commun.css`) : perle `#f5f5f7` derrière, cartes blanches, encre `#1d1d1f`, filets `#d2d2d7`, un seul accent bleu `#0066cc` pour ce qui agit, aplat `#ececf0` pour une carte mise en avant. Toujours en clair (`color-scheme: light`).
- **UI** (sur `:root[data-finition="ui"]`, dans `sources/charte.css` du projet) : les mêmes noms, avec les valeurs lues dans les styles du projet. Au départ, il reprend l'UX.
- `ecran-doux`, `ecran-filet` et `ecran-creux` se calculent à partir des autres (`color-mix`), pour l'UX comme pour l'UI.

### Named Rules

**La règle du mot d'abord.** Un état se lit en toutes lettres. La couleur l'appuie, elle ne le remplace jamais.

**La règle de l'écran sans couleur.** Un écran n'écrit aucune couleur : ni code, ni `rgb()`, ni nom. Tout passe par les variables, sinon le bouton UX | UI ne peut plus rien pour lui. Le contrôle le refuse.

**La règle de la barre noire.** La barre du haut est la seule grande surface en noir pur, dans les deux thèmes.

## Typography

**Police :** celle du système (`ui-sans-serif, system-ui`…) pour la page et pour les écrans en UX. Aucune police n'est chargée d'Internet. En UI, les écrans prennent `--ecran-police` et `--ecran-police-titre` du projet.

### Hierarchy

- **Titre de la planche** (34px, demi-gras, serré à -.035em) : le nom du projet en tête de la vue d'ensemble, et le titre d'une rangée ouverte.
- **Titre de vue** (21px, gras) : « État des lieux », le code et le titre d'un écran.
- **Texte de la page** (15px, 1.45) : les raisons, les consignes.
- **Barre** (14px) : le fil, la recherche, les boutons.
- **État et infos** (13px) : l'état en gras, la source, les écrans, « à essayer pour confirmer » en italique.
- **Note** (13.5px), avec son type en 12.5px gras et sa date en chiffres alignés.

Dans les écrans : titre d'écran 28px serré à -.035em, sous-titres 17px et 15px à -.02em, texte 15px à -.01em, chiffre clé 32px (22px en moyen), surtitre et étiquette 12.5px en gris.

### Named Rules

**La règle du titre serré.** Plus un titre d'écran est grand, plus ses lettres se rapprochent : -.035em, puis -.02em, et -.01em pour le texte.

**La règle du chiffre clé.** Ce qu'on lit en premier sur un écran (un solde, un total) est en grand avec `.chiffre`, précédé de son petit libellé gris `.surtitre`.

## Layout

**La barre** (52px) porte tout : le fil à gauche avec la flèche pour remonter, la recherche au centre, le bouton UX | UI et les deux vues à droite. Sur un téléphone, elle passe sur deux lignes.

**L'état des lieux** tient dans une colonne de lecture : l'avancement (560px au plus), le compte, puis les lignes par groupe.

**La vue d'ensemble** est une planche qui occupe tout l'écran sous la barre : les rangées l'une sous l'autre, chaque écran à sa vraie taille, mise à l'échelle par le zoom. Les commandes de zoom et de repli flottent en bas à gauche.

**Une rangée** montre ses écrans à une taille de lecture, avec à droite le panneau des pages de l'état des lieux. **Un écran** montre l'actuel et la proposition côte à côte, et le panneau des corrections à droite.

**Téléphone (700px et moins).** La planche devient une colonne : chaque rangée est une bande d'écrans qui glisse de côté. Les badges deviennent ✓ et = quand un écran est étroit.

Dans les écrans : un en-tête de 52px au moins, une page à 16px de marge et 14px entre les blocs, des cibles de 44px.

## Elevation & Depth

À plat. La profondeur vient du contraste entre le fond gris, le blanc des cartes et le noir de la barre. Les cartes et les cadres d'écran sont détachés par un filet d'un pixel (`box-shadow: 0 0 0 1px var(--trait)`). Le survol d'un écran épaissit le filet à 2px, en bleu crayon. Seuls les éléments qui flottent par-dessus la planche (le menu de recherche, les notes ouvertes d'un écran étroit) ont une ombre douce.

### Named Rules

**La règle de la carte posée.** Une carte ne se soulève pas au survol : son filet change, c'est tout.

## Shapes

Des formes douces, sans angle vif. Dans la page : 8px pour les petits boutons et les cadres, 10px pour les lignes de l'état des lieux, 12px pour les messages et les commandes de la planche, 14px pour le panneau d'une rangée. Tout ce qui se touche du doigt ou se lit comme une étiquette est une pilule : la recherche, les modes, les badges, la barre d'avancement. Dans les écrans en UX, cartes et champs à 12px, boutons et choix en pilules ; en UI, les arrondis du projet.

## Components

### La barre d'avancement

Quatre traits de 8px de haut, en pilule : Idée, Début, En cours, Avancé. Les étapes faites sont en bleu crayon, les autres en filet. Le mot de l'étape actuelle est en gras. La raison suit, en gris de lecture.

### La ligne de l'état des lieux

Une carte blanche à filet : le nom de la page à gauche, l'état à droite (un rond plein, à moitié plein, vide ou en pointillés, et le mot), la raison, puis les infos en petit : source, écrans, « à essayer pour confirmer ».

### Le bouton UX | UI

Une bascule en pilule dans la barre noire. Le côté choisi est blanc, l'autre en gris de barre.

### Les badges

**Validé** : pilule à filet plein vert. **Inchangé** : pilule à filet en tirets gris, pour ne pas la confondre avec Validé. Sous un écran étroit, ✓ et =.

### Les notes

Une carte blanche par note : le type en toutes lettres (Décision, À trancher, À vérifier, À coder, Source), la date, le texte, et l'ancienne valeur barrée quand une décision a changé. Sous un écran étroit, elles se replient en une pilule « 2 notes ».

### Les écrans

Construits avec les classes de `commun.css` seulement : `.entete`, `.page`, `.onglets`, `.bouton` (plein, `.discret`, `.court`), `.action`, `.champ`, `.carte` (`.forte`), `.chiffre`, `.surtitre`, `.ligne`, `.liste`, `.puce`, `.pastille`, `.bandeau`, `.etapes`, `.vide`, `.segments`… Une classe qui manque au projet s'ajoute dans `sources/charte.css`, avec les variables seulement.

## Do's and Don'ts

### Do:

- **À faire :** écrire chaque état en toutes lettres, et laisser la couleur l'appuyer.
- **À faire :** ajouter chaque nouvelle couleur de la page en clair et en sombre, sous le même nom de variable.
- **À faire :** faire passer toute couleur d'un écran par une variable `--ecran-`.
- **À faire :** détacher une carte par un filet d'un pixel plutôt que par une ombre.
- **À faire :** chercher si une information est déjà affichée avant de l'ajouter ailleurs.
- **À faire :** garder 44px pour toute commande d'écran utilisée au toucher.

### Don't:

- **À éviter :** une couleur écrite en dur dans un écran.
- **À éviter :** une police, une image ou un script chargés d'Internet (sauf la police en ligne demandée par la personne pour sa charte).
- **À éviter :** un état montré par la couleur seule.
- **À éviter :** modifier `commun.css` pour un projet : l'UI de ce projet va dans `sources/charte.css`.
- **À éviter :** une ombre floue ou un soulèvement sur une carte.
