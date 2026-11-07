# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Des personnes francophones qui construisent une appli avec Claude, développeuses ou non, et qui veulent voir où en est leur projet : ce qui existe, ce qui est à moitié fait, ce qui a été oublié. Elles ouvrent la page sur ordinateur, parfois sur téléphone, entre deux séances de travail avec Claude, pour relire un état des lieux, regarder des écrans et préparer des corrections. Elles peuvent n'avoir qu'une idée, un projet en cours ou une appli déjà en ligne.

## Product Purpose

À plat met un projet à plat en maquettes : l'état des lieux page par page, ce qui manque (états oubliés, boutons sans suite, parcours incomplets), et chaque écran dessiné, avec l'actuel et la proposition côte à côte quand une page change. Succès : la personne sait où en est son projet sans relire le code, tranche les points ouverts, et passe au code avec un dossier clair.

## Positioning

À plat part du vrai projet et n'impose rien : il n'ajoute aucune fonction de lui-même, ce qui semble manquer devient une question, et ce qu'il ne sait pas reste entre [crochets]. Chaque constat dit d'où il vient. Il parle français, en phrases simples. Il n'envoie rien vers l'extérieur, et sa page s'ouvre d'un double-clic, sans serveur. Les idées des outils existants sont reprises, pas leur code ; le format du dossier est le sien, documenté dans le dépôt.

## Operating Context

Une page HTML autonome, `a-plat/index.html`, ouverte d'un double-clic à côté de Claude Code, ou servie par n'importe quel serveur web pour un téléphone. Les écrans sont de vrais fichiers HTML, affichés dans des cadres. La conversation avec Claude reste le lieu principal des décisions et des corrections ; la page montre et prépare.

## Capabilities and Constraints

Fonctions à garder : état des lieux avec la barre d'avancement, vue d'ensemble en planche avec zoom, rangée en taille de lecture, écran seul avec l'actuel et la proposition, notes sous les écrans, recherche par code ou par mot, rangées repliables, bouton UX | UI, modes Corriger et Essayer le parcours, copie des corrections pour Claude, colonne du téléphone, clair et sombre. Aucune dépendance pour s'en servir, aucune ressource chargée d'Internet (sauf une police en ligne demandée par la personne). Un écran n'écrit aucune couleur : tout passe par les variables UX et UI. Le dossier `a-plat/` est le seul endroit écrit dans le projet.

## Brand Commitments

Simplicité et honnêteté. On ne cherche jamais une information à plusieurs endroits. On ne dit jamais qu'une page marche sans l'avoir vu. Le résultat est raté s'il invente des pages, s'il est trop chargé, ou s'il fait passer une supposition pour un constat. Dans la conversation, Claude vouvoie la personne sauf si elle le tutoie ; la page vouvoie ; la documentation tutoie.

## Evidence on Hand

Deux projets inventés dans `exemples/` (Prêtoutil, les jardins partagés), leurs manques connus d'avance dans `tests/reponses/`, et les comptes rendus d'essai dans `docs/essais/`. La démo de la page, Prêtoutil, dans `tests/fixtures/demo`. Mesure publiée : 13 manques sur 19 sur un projet jamais vu, en un seul passage. Les ordres de grandeur de coût du README viennent d'un essai de l'auteur sur une vraie appli, non publié parce qu'il décrit un vrai projet. Aucun témoignage, aucun client, aucune autre mesure à inventer.

## Product Principles

- Mettre à plat, ne rien imposer : ce qui manque est une question, pas une page de plus.
- Dire d'où vient chaque constat, et séparer ce qui est lu de ce qui est vu.
- Une information, un seul endroit.
- Les mots avant les couleurs : l'UX regarde ce que dit l'écran, l'UI vient ensuite.
- Le travail de la personne ne se perd jamais : `sources/` n'est jamais écrasé.

## Ce que le dépôt ne connaît pas

À plat ne connaît aucune installation particulière : ni un auteur, ni un ordinateur, ni un serveur, ni un projet réel. Les exemples, la démo et les captures viennent de projets inventés. Ce qui sert à une seule personne reste chez elle et utilise ce que l'outil offre à tous. Une fonction du dépôt marche pour n'importe qui, ou reste invisible sans son réglage. `outils/rien-de-personnel.mjs` le contrôle.

## Accessibility & Inclusion

Utilisable au clavier (recherche à la touche `/`, anneau de focus visible), cibles de 44 px au toucher dans les écrans, état écrit en toutes lettres et pas seulement en couleur, contraste lisible en clair et en sombre, barre d'avancement lue par les lecteurs d'écran.
