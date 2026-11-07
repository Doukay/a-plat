# Questions fréquentes

<details>
<summary><b>Faut-il être développeur ?</b></summary>

Non. À plat est fait pour toute personne qui construit une appli avec Claude, développeuse ou non. Claude te parle en phrases simples, et tu corriges en citant un code d'écran (« B3 : change le titre »). Il faut seulement savoir lancer Claude Code et ouvrir un fichier d'un double-clic.
</details>

<details>
<summary><b>Mon code quitte-t-il mon ordinateur ?</b></summary>

Oui, de la façon dont Claude Code marche toujours : Claude lit les fichiers dont il a besoin, et ils partent chez Anthropic sur ton compte. L'outil lui-même n'envoie rien, et la page ne charge rien d'Internet. Voir [Confidentialité et sécurité](confidentialite-et-securite.md).
</details>

<details>
<summary><b>Va-t-il modifier mon code ?</b></summary>

Non. Il n'écrit que dans le dossier `a-plat/` de ton projet, et ne touche ni à ton code, ni à ton `.gitignore`, ni à `CLAUDE.md`. S'il voit un défaut au passage, il le signale en note « à coder » au lieu de le corriger. Coder, après le passage au code, est un autre travail, que tu décides.
</details>

<details>
<summary><b>Va-t-il lancer mon projet ?</b></summary>

Pas sans ton accord. Il lit le code sans rien installer ni démarrer. Ce qu'il a lu sans le voir marcher reste marqué « à essayer pour confirmer ». S'il a besoin de lancer ton appli (pour voir une page, ou caler la finition fidèle), il te le demande et te dit avant que cela peut écrire dans le projet et lire sa configuration.
</details>

<details>
<summary><b>Il ajoute des pages que je n'ai pas demandées ?</b></summary>

Il ne doit pas. L'outil met à plat ce que tu as, il n'impose rien : une page n'entre dans la liste que si ton projet l'annonce ou si un parcours l'exige. Ce qui semble manquer devient un point à trancher, et une page qui manque ne se dessine que si tu le demandes. Si tu en vois une que rien ne justifie, dis-le : il la retire.
</details>

<details>
<summary><b>Trouve-t-il tout ce qui manque ?</b></summary>

Non. Sur un projet inventé qu'il n'avait jamais vu, il a trouvé 13 manques sur 19, sans en inventer, en un seul passage. Ceux qu'il rate sont surtout dans la façon dont l'appli choisit la page à montrer et charge ses données (accès refusé sans explication, adresse inconnue), et dans les tâches d'un rôle qui n'ont aucun écran. Relis l'état des lieux avec ce que tu sais. Voir [Ce que l'outil ne sait pas encore bien faire](utiliser-a-plat.md#ce-que-loutil-ne-sait-pas-encore-bien-faire).
</details>

<details>
<summary><b>Pourquoi des [crochets] partout ?</b></summary>

Ce que ton projet doit fixer lui-même et que Claude ne connaît pas (un prix de vente, une durée, un texte officiel, une adresse de contact) reste entre [crochets] : il ne l'invente pas. Les montants et les noms d'exemple, eux, sont inventés pour que l'écran se lise. Quand tu tranches un point, Claude retire le crochet.
</details>

<details>
<summary><b>Les maquettes ressembleront-elles à mon appli ?</b></summary>

Ça dépend de la finition. En UX, c'est une maquette en gris, faite pour regarder ce que dit l'écran. En UI, elle prend les couleurs, polices et arrondis de ton projet. La finition fidèle va plus loin, avec ton vrai balisage et ton vrai style, mais une maquette dessinée reste proche, pas identique : seule une capture l'est. Pour une page qui existe, donne une capture : elle sert d'actuel. Voir [Les quatre finitions](utiliser-a-plat.md#les-quatre-finitions).
</details>

<details>
<summary><b>Combien ça coûte ?</b></summary>

Rien de plus que ton abonnement Claude. Ça consomme ton quota comme n'importe quelle tâche : peu pour un petit projet, beaucoup pour un gros, encore plus en finition fidèle. Ouvrir et parcourir la page ne coûte rien. Voir [Ce qui consomme des jetons](comment-ca-marche.md#ce-qui-consomme-des-jetons).
</details>

<details>
<summary><b>Je n'ai qu'une idée, ça sert à quelque chose ?</b></summary>

Oui. Ouvre Claude Code dans un dossier vide et tape `/a-plat`. Claude te pose quatre ou cinq questions, une à la fois, fait la liste des pages prévues, puis dessine le début du parcours principal une fois que tu l'as acceptée.
</details>

<details>
<summary><b>J'ai déjà des maquettes faites avec À plat. Que se passe-t-il si je relance ?</b></summary>

Claude les reprend : il relit le projet, commence par ce qui a changé depuis, et met à jour l'état des lieux. Les codes d'écran, les notes et les écrans validés ne bougent pas. Un ancien dossier `maquettes/` se reprend dans `a-plat/`, sans être touché (voir [Un ancien dossier `maquettes/`](fichiers-du-projet.md#un-ancien-dossier-maquettes)).
</details>

<details>
<summary><b>Faut-il garder `a-plat/` dans Git ?</b></summary>

Garde `a-plat/sources/` : c'est ton travail, l'histoire de la conception de ton projet. Le reste se refait et s'ignore tout seul. Voir [Ce qu'il y a dans ton projet](fichiers-du-projet.md).
</details>

<details>
<summary><b>Puis-je voir les maquettes sur mon téléphone ?</b></summary>

Oui : la page marche à la largeur d'un téléphone. Pour l'y ouvrir, sers le dossier `a-plat/` (et lui seul) avec n'importe quel serveur web. Voir [Le voir sur un téléphone](fichiers-du-projet.md#le-voir-sur-un-téléphone).
</details>

<details>
<summary><b>Pourquoi Claude me vouvoie-t-il, alors que ces pages me tutoient ?</b></summary>

Dans la conversation, Claude vouvoie la personne, sauf si elle le tutoie : il suit ton ton. La page aussi te vouvoie. Ces pages d'explication, elles, tutoient.
</details>
