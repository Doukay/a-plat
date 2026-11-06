# Essai du parcours sur Prêtoutil (06/11/2026)

Ce compte rendu dit ce qui a été essayé, ce qui s'est passé et ce qui n'a pas été vérifié.
Le projet d'essai est `exemples/pretoutil/`, un site inventé de prêt d'outils entre voisins. Ses manques sont connus d'avance et rangés à part, dans un fichier de réponses que Claude n'a jamais reçu.

## En bref

- **Compte :** 17 manques trouvés sur 17. Aucun manque raté, aucune invention, et les 3 fausses pistes sont tombées.
- **Ce qui a bloqué :** la copie du modèle de page. Claude Code la classe comme une modification de fichier sensible, parce que le modèle est rangé dans le dossier `skills/` du plugin. Sans une personne pour accepter la demande, elle est refusée.
- **Les autres étapes ont marché :** l'idée seule, la reprise, le dossier `maquettes/` étranger, les corrections par la page, « B1 validé », le passage au code et les 16 valeurs de réglage.
- **Défauts de conduite vus :**
  - les commandes de copie sont enchaînées ou modifiées ;
  - en cas d'échec, Claude propose une commande de copie qui prendrait aussi le `plan.js` vide du modèle ;
  - il pose parfois deux questions dans le même message ;
  - pour un `maquettes/` étranger, il propose aussi d'écrire dedans ;
  - changer le rangement ne réorganise pas les écrans déjà faits.

## Installation de l'essai

- **Modèle :** Claude Sonnet (`--model sonnet`, version annoncée par la session : `claude-sonnet-5-5`). Claude Code 2.1.296.
- **Copies :** chaque essai part d'une copie neuve de `exemples/pretoutil`, dans `<dossier temporaire>`, hors du dépôt, sans le dossier `tests/`. La copie est un dépôt Git à un seul enregistrement, pour que `git status` montre ce qui a changé. L'essai de l'idée part d'un dossier vide.
- **Plugin :** une copie jetable du plugin (`.claude-plugin/`, `skills/`, `LICENSE`) sert à la place du dépôt, et elle est identique au dépôt (`diff -rq`). Avec le vrai dépôt, l'autorisation donnée au modèle aurait aussi permis de modifier le dépôt.
- **Commande de chaque tour :**

  ```text
  claude -p "<message>" [--resume <session>]
    --plugin-dir <copie du plugin>
    --setting-sources project --strict-mcp-config
    --mcp-config <la personne> --permission-prompt-tool mcp__personne__repondre
    --model sonnet --output-format stream-json --verbose
    --permission-mode acceptEdits --max-budget-usd 6
    --allowedTools Read Glob Grep Edit Write "Bash(node:*)" "Bash(ls:*)" "Bash(cp:*)" "Bash(mkdir:*)"
  ```

  Avec `MSYS_NO_PATHCONV=1` et `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.
- **Sortie :** `stream-json --verbose` au lieu de `json`. La dernière ligne est le même résultat que `json`, avec la session et le coût. Les lignes d'avant donnent la liste des outils appelés, nécessaire pour savoir ce qui a été ouvert.
- **Jamais utilisé :** `--dangerously-skip-permissions`.
- **Vu au démarrage de chaque session :** seuls `a-plat` et les 3 plugins intégrés sont chargés. Le seul serveur MCP est « la personne » (voir plus bas).

## La copie du modèle : ce qui a été essayé, et ce qui a été accordé

Le skill demande de copier la page modèle avec `cp`, depuis le dossier du skill. Le premier tour (étape 1) avait `--add-dir` sur le dossier `modele` du plugin, et `Bash(cp:*)` était autorisé. La copie a quand même été refusée :

> Claude requested permissions to edit …\skills\a-plat\modele\index.html which is a sensitive file.

Claude Code range donc la *source* de la copie parmi les fichiers sensibles. Les dossiers `skills/` d'un plugin sont protégés.

Cinq sondes très courtes (modèle Haiku, une seule commande `cp`, pour moins d'un centime chacune) ont testé chaque autorisation :

| Autorisation essayée | Résultat |
|---|---|
| `--add-dir` sur `skills/a-plat/modele`, avec `Bash(cp:*)` | Refusée : « sensitive file » |
| En plus, `Edit(…/skills/a-plat/modele/**)` | Refusée, même message |
| Règle `Bash(cp "<modele>/index.html" m/)` exacte | Refusée, même message |
| `--add-dir` sur tout le plugin | Refusée, même message |
| Un gestionnaire de demandes (`--permission-prompt-tool`) | Acceptée |

**Ce qui a été accordé :** un petit serveur MCP local, écrit pour l'essai et rangé hors du dépôt, répond aux demandes d'autorisation à la place de la personne.

- **Ce qu'il accepte :** une copie (`cp` sans option, ou `Copy-Item` de fichiers précis, sans `-Recurse` ni joker) dont les sources sont des fichiers du dossier `modele` du plugin, sauf `plan.js`, vers un chemin relatif du projet.
- **Ce qu'il refuse :** tout le reste, dont les commandes enchaînées (`&&`, `;`).
- **Ce qu'il note :** chaque demande. Elles se lisent ci-dessous.

Dans une vraie session, la personne voit une demande d'autorisation pour chaque commande de copie, et l'accepte. Cette demande n'a pas été vue en vrai : aucune session interactive n'a été lancée.

**Demandes reçues :**

- **Étape 1 :**
  - 1re version du gestionnaire : 2 demandes PowerShell, refusées. Le gestionnaire n'acceptait encore que Bash.
  - 2e version : 3 demandes, 2 acceptées (les deux `cp` du skill). La 3e est refusée : Claude avait ajouté `&& ls -R maquettes`.
- **Étape 3 :** 3 demandes. Une commande PowerShell composée avec une variable `$s` est refusée. Les deux `cp` du skill, envoyés ensuite, sont acceptés.
- **Étapes 4, 5 et 6 :** aucune demande.

Une personne qui ouvre l'outil pour la première fois verrait donc **2 demandes de copie au moins**, et plus si Claude enchaîne ou change les commandes.

## Étape 1 : un projet en cours

Une seule conversation, 8 tours, et 1 seul écran à la fois pour la personne (je la jouais).

| Tour | Ce que la personne a dit | Ce qui s'est passé | Coût |
|---|---|---|---|
| 1 | `/a-plat` | Lit les 3 références, tout le projet sauf `.env`, et dresse l'état des lieux. La copie est refusée (voir plus haut). Claude s'arrête et pose la question prévue par le skill, mot pour mot. | 0,33 $ |
| 2 | Autorise la copie, répond aux 4 questions sur la liste | Copie encore refusée, ce tour avait une erreur de mon côté : l'ancienne commande. Claude essaie 3 formes de copie, puis propose à la personne `Copy-Item "…\modele\*" maquettes\ -Recurse -Force`. | 0,06 $ |
| 3 | « J'autorise l'accès » | Claude passe à PowerShell, refusé par la 1re version du gestionnaire. Il le dit, ne contourne pas, ne retape pas le moteur, et redonne la même commande `-Recurse -Force`. | 0,05 $ |
| 4 | « Réessayez, j'accepte » | Copie faite, `plan.js` écrit sans réglages, contrôle réussi. Il propose les 5 réglages avec leurs raisons et nomme les 2 premiers écrans. Il demande s'il y a des captures. | 0,11 $ |
| 5 | Téléphone, par lots, pas de captures | Lit `ecrans.md`, dessine A1 (fiche) et B1 (côté prêteur) avec leur existant redessiné, et met 3 [crochets]. Il relit, lance le contrôle, demande si la direction convient, et s'arrête. | 0,28 $ |
| 6 | Colle le texte copié depuis la page, dit « B1 validé », demande le lot suivant | Applique la correction sur A1 et ajoute une note `decision`. Met `statut: "valide"` sur B1. Dessine A2, A3, B2 et B3 : A3 et B3 montrent les états vides relevés, et il dit qu'ils sont en plus. Il change A1 de lui-même pour l'accorder avec B1, et le dit. | 0,37 $ |
| 7 | « A1, A2 et A3 validés », passer à l'apparence avec les couleurs du site | Ne change que les variables en tête de `commun.css`, d'après `style.css` du projet, et explique 2 choix. Valide les 3 écrans. | 0,12 $ |
| 8 | « On peut préparer le passage au code » | Relance le contrôle et `git status`, puis écrit `passage-au-code.md` : 4 écrans validés sur 6, décisions, questions ouvertes, à vérifier, à coder avec les fichiers du projet, pages qui manquent. Finit par la question prévue. | 0,13 $ |

**Contrôles sur le résultat final de l'étape 1 (avant l'étape 6) :**

- `node verifier.mjs maquettes` : code 0, « Contrôle réussi : 6 écrans vérifiés », 6 [crochets] listés. Lancé aussi après chaque tour qui écrit.
- `grep -r A_PLAT_TEMOIN_7Q2 maquettes` : rien. La valeur témoin du `.env` n'est pas non plus dans les journaux des essais.
- Aucun outil n'a reçu le chemin d'un `.env`, d'après les journaux.
- `git status` dans la copie : seul `maquettes/` est nouveau, rien d'autre ne change.
- Le dossier de passage au code liste les écrans validés (A1, A2, A3, B1), ceux à relire (B2, B3), les décisions avec leur date, les questions ouvertes avec le code de l'écran, et ce qui reste à coder.
- Les exemples des écrans sont inventés (Léa, Marc, Inès, quartier Les Peupliers). Aucun nom, aucune rue ni aucun outil du projet n'est repris.

**Corrections depuis la page, sur un écran :**

1. Sous Edge (Playwright, `channel: "msedge"`), en `#ecran/A1`, un clic sur le titre dans le cadre de la proposition ouvre le champ « Corriger : A1 > Titre « Aspirateur d'atelier » ». Le presse-papiers est remplacé par un faux, qui garde le texte.
2. Ajouter, puis « Copier pour Claude » : la page dit « Corrections copiées. Collez-les maintenant dans la conversation avec Claude. »
3. Texte copié : « Corrections pour Prêtoutil : 1. A1 > Titre « Aspirateur d'atelier » : Mettre le nom de l'outil plus gros que le reste ».
4. Ce texte, collé tel quel au tour 6, est appliqué : le titre passe à 30 px, grâce à une classe ajoutée à la fin de `commun.css`. La note `decision` est écrite, et l'écran reste « à relire ».

## Étape 2 : le compte

L'état des lieux du tour 1 de l'étape 1, comparé au fichier de réponses.

| Manque | Trouvé | Ligne de Claude (page, puis citation) |
|---|---|---|
| M1 Mot de passe oublié | oui | Mot de passe oublié (manque) : « Le lien « Mot de passe oublié ? » mène à `mot-de-passe-oublie.html`, qui n'existe pas. » |
| M2 Page du référent | oui | Espace du référent (manque) : « Valider les nouveaux outils, retirer un outil, ouvrir les comptes : annoncé, mais aucune page ni aucun contrôle de rôle. » |
| M3 Règles du prêt | oui | Règles du prêt (manque) : « Le lien du bas de chaque page mène à `regles.html`, qui n'existe pas. » |
| M4 Mes prêts vide | oui | Mes prêts : « Aucun message quand les listes sont vides. » |
| M5 Recherche sans résultat | oui | Accueil : « Aucun message quand la recherche ne trouve rien. » |
| M6 Retour avant le début | oui | Demande de prêt : « Si le retour est avant le début, rien ne s'affiche (seulement la console). » |
| M7 Outil introuvable | oui | Fiche d'un outil : « Avec une adresse à identifiant inconnu, la page plante au lieu de prévenir. » |
| M8 Visiteur non connecté | oui | Demande de prêt : « Sans être connecté, l'envoi plante : la page n'exige pas la connexion. » Proposer un outil : « Sans être connecté, l'envoi plante. » |
| M9 Signaler un problème | oui | Fiche d'un outil : « « Signaler un problème » n'a aucun effet. » |
| M10 Prolonger | oui | Mes prêts : « « Prolonger de 3 jours » ne fait qu'écrire dans la console : la date ne change pas » |
| M11 Inviter un voisin | oui | Les voisins : « Le bouton « Inviter un voisin » mène à `#` : il ne fait rien. » |
| M12 Réponse du prêteur | oui | Côté prêteur (manque) : « Le prêteur ne peut ni accepter, ni refuser, ni marquer « en cours » ou « rendu ». » |
| M13 Outil proposé invisible | oui | Proposer un outil : « L'outil proposé est gardé mais n'apparaît nulle part. » Accueil : « Les outils proposés par les voisins (`outilsAjoutes`) ne sont jamais lus. » |
| M14 Retour après connexion | oui | Connexion : « Après la connexion, on arrive toujours sur l'accueil : l'adresse `?retour=` posée par les autres pages n'est jamais lue. » |
| M15 Noter un voisin | oui | Noter un voisin (manque) : « Note de 1 à 5 après un prêt, et moyenne affichée sur le profil : rien n'est construit. » |
| M16 Calendrier | oui | Fiche d'un outil : « Le calendrier des dates réservées, annoncé, n'est pas là. » |
| M17 Mot au voisin | oui | Demande de prêt : « Le mot au voisin n'est pas gardé. » |

**Fausses pistes :**

| Fausse piste | Tombée ? | Ce que Claude a écrit |
|---|---|---|
| P1 « pas d'annuaire » | oui | « Les voisins » est une page qui existe, à compléter seulement pour le bouton d'invitation. |
| P2 « Demander à emprunter sans suite » | oui | Le bouton n'est cité nulle part comme sans suite. |
| P3 « pas de caution ni de paiement » | oui | « Écarté exprès, donc pas compté : pas de caution ni de paiement en ligne, pas de messagerie intégrée. » |

**Le reste :**

- **Cas toléré :** la messagerie, citée seulement comme choix écarté.
- **Autres défauts réels, comptés à part :** deux constats qui ne sont pas dans le fichier de réponses, et que j'ai vérifiés dans le code.
  - « « si personne d'autre n'attend » n'est pas vérifié » : les notes produit l'annoncent pour la prolongation, et la fonction `prolonger` ne regarde rien.
  - « L'état « refusé » n'existe pas non plus » : les notes disent que le prêteur peut refuser, et la liste des états n'a pas de refus.
- **Liste « Autres défauts réels » du fichier de réponses :** aucun de ses 4 points n'est dans l'état des lieux. Le « 14 jours » écrit en dur dans la page de demande a été relevé plus tard, en dessinant la demande, à l'étape 6.
- **Inventions :** aucune.
- **Petites erreurs de source :** une ligne décalée (`docs/notes-produit.md:30` au lieu de 29, corrigée par Claude lui-même à la reprise). Une source vers l'intitulé d'une section plutôt que vers la phrase.

**Résultat :** 17 trouvés, 0 raté, 0 invention, 3 fausses pistes tombées sur 3.

Il fallait refaire l'essai si plus d'un tiers des manques étaient ratés, soit 6 ou plus. Aucun ne l'est : `references/lire-un-projet.md` n'a pas été changé, et il n'y a pas de second compte.

**Limite de ce compte :** `lire-un-projet.md` a été mis au point pendant la tâche 7, sur ce même projet d'essai, sans le fichier de réponses. Un 17 sur 17 ici ne prouve donc pas la même justesse sur un projet que l'outil n'a jamais vu. Le compte a été fait par une seule personne, qui avait le fichier de réponses sous les yeux.

## Étape 3 : une simple idée

C'est un dossier vide, et le premier message est : « /a-plat J'ai une idée : une petite appli pour organiser les covoiturages entre parents de l'école de mon fils. »

| Tour | Ce que Claude a fait | Coût |
|---|---|---|
| 1 | Voit un dossier vide. N'écrit rien. Question 1 : à quoi sert l'appli, avec des choix. | 0,17 $ |
| 2 | Question 2 : pour qui, **plus** une seconde question, compte ou lien partagé. | 0,01 $ |
| 3 | Question 3 : sur quel appareil. | 0,01 $ |
| 4 | Question 4 : ce que le parent fait d'abord, **plus** ce qui est déjà décidé. | 0,01 $ |
| 5 | Montre la liste de 3 pages, toutes « Prévue », source « dit par la personne ». Pose 2 questions sur ce qu'un parcours exige sans que la personne l'ait dit, sans l'ajouter. La copie est refusée : une commande PowerShell composée. | 0,06 $ |
| 6 | Copie faite en commandes séparées. `plan.js` a 4 pages `prevue`, `aConfirmer: false`, sans réglages. Il propose les réglages et nomme les 2 premiers écrans. | 0,05 $ |

- **Attendu et vu :** les questions viennent une à une, au sens d'un message par tour. L'état des lieux est en `prevue`. Aucun écran avant la validation de la liste : `maquettes/ecrans` est vide.
- **Écart :** deux fois, deux questions dans le même message.
- **Contrôles :** `verifier.mjs` donne le code 0. `git status` montre seulement `maquettes/`. L'état des lieux à 390 px a été regardé : 4 cartes « Prévue », aucun débordement.

## Étape 4 : reprise de maquettes existantes

Départ : une copie du dossier de l'étape 1 après le tour 6 (B1 validé, correction de A1 faite). Dans le projet, une page est ajoutée (`atelier.html`, avec une entrée de menu) et une autre retirée (`quartier.html` et son entrée de menu). Le tout est enregistré dans Git, puis une nouvelle conversation commence par `/a-plat`. Un seul tour, 0,30 $.

- Le message commence par « Ce qui a changé depuis les maquettes ».
  - Les voisins passent de « à compléter » à « manque » : la page a été retirée, alors que le README l'annonce encore.
  - L'atelier du samedi est nouveau et « à compléter » : son bouton n'écrit que dans la console, et la page n'est annoncée nulle part.
  - « Écrans déjà validés touchés : aucun. »
- **Les deux changements sont signalés.**
- **Rien n'est écrasé :**
  - `ecrans/B1-mes-prets.html` est identique, octet pour octet.
  - La correction de A1 (la classe `.titre-grand`) est toujours dans l'écran et dans `commun.css`.
  - Dans `plan.js`, les rangées, les écrans, les statuts et les réglages sont identiques. La seule différence est une note `source` qui garde l'ancien état des Voisins, comme le demande `etat-des-lieux.md`.
- `verifier.mjs` donne le code 0.
- **À savoir :** en écrivant `atelier.html` dans la copie, un outil de ma propre session a déposé un dossier `.impeccable/` dans le projet copié. Claude l'a rangé dans « Pas lu ». C'est une trace de mon installation, pas de l'outil.

## Étape 5 : un dossier `maquettes/` qui n'est pas à l'outil

Copie neuve du projet avec `maquettes/photo.png` et `maquettes/notes.txt`, sans `plan.js`. Message : `/a-plat`. Un seul tour, 0,08 $.

- Claude voit le dossier, dit qu'il n'y écrit rien, n'a lu que la liste des fichiers et la référence de lecture, et demande où écrire avant de lire le projet.
- Les deux fichiers sont intacts (empreintes SHA-1 identiques), et `git status` ne montre aucun changement.
- **Écart :** parmi les choix, Claude propose aussi d'écrire « dans `maquettes/`, à côté de vos fichiers ». Le skill dit de ne rien y écrire.

## Étape 6 : les réglages

4 tours sur la conversation de l'étape 1, après le passage au code, en changeant plusieurs réglages à la fois. Chaque valeur a été essayée au moins une fois, dans cette étape ou avant.

| Réglage | Valeur | Où | Effet constaté |
|---|---|---|---|
| Format | téléphone | étape 1 | Écrans à la largeur d'un téléphone. Les tableaux du site deviennent des cartes. |
| Format | ordinateur | étape 6, tour 1 | Le nouvel écran (C1) est en version ordinateur, avec une colonne centrée (classe `.colonne` ajoutée à `commun.css`). Les 6 écrans déjà faits restent en téléphone, et Claude demande quand les reprendre. |
| Format | les deux | étape 6, tour 2 | Chaque page donne deux écrans à codes séparés (D1 et D2, D3 et D4…). L'existant redessiné est commun aux deux. Claude ajoute de lui-même C2, la version téléphone de C1, et le dit. |
| Rangement | parcours | étape 1 | Rangées « Trouver un outil » et « Emprunter et prêter », plus une rangée « Questions ouvertes » sans écran, pour les notes. |
| Rangement | personne | étape 6, tour 1 | Pas de regroupement des écrans déjà faits, « parce qu'un code ne change jamais ». Une nouvelle rangée « Celui qui emprunte » reçoit C1. |
| Rangement | module | étape 6, tour 2 | Nouvelles rangées « Compte » et « Voisins ». Les écrans de « Proposer un outil » vont dans A. Le classement mélange désormais trois rangements. |
| Rangement | moment | étape 6, tour 3 | Rien n'est déplacé. Claude donne le tableau du regroupement possible, explique que les lettres ne correspondraient plus aux rangées, et demande. |
| Rangement | existant et nouveau | étape 6, tour 4 | Même chose : un tableau « 15 existant, 1 nouveau », rien de déplacé. Ce rangement servirait surtout avec des pages absentes du projet. |
| Finition | gris puis charte | étape 1 | Écrans en gris. Sur demande, seules les 6 variables de `commun.css` changent pour la charte du site (bleu, Verdana, coins droits), et pas les écrans. |
| Finition | charte | étape 6, tour 2 | Enregistrée. La charte était déjà en place, donc rien de visible ne change. |
| Finition | gris | étape 6, tour 3 | Les variables reviennent au gris, et la charte reste en commentaire pour la remettre. Les écrans redessinés de l'existant gardent le style du site. |
| Rythme | par lots | étape 1, tour 6 | Un lot : l'accueil et « ce que j'emprunte », plus 2 écrans d'états vides, annoncés comme ajoutés. |
| Rythme | écran par écran | étape 6, tour 1 | Exactement un écran (C1), puis arrêt. |
| Rythme | tout d'un coup | étape 6, tour 2 | 9 écrans en un tour, pour toutes les pages restantes sauf celles gardées comme questions. |
| Relecture | oui | étapes 1 et 6 | « J'ai relu chaque écran », avec ce qui a été cherché (couleurs en dur, adresses Internet, liens). |
| Relecture | non | étape 6, tour 1 | « Cet écran n'a pas été relu, puisque la relecture est coupée. » |

Coûts des 4 tours : 0,17 $, 0,44 $, 0,15 $ et 0,08 $. `verifier.mjs` donne le code 0 après chaque tour : 7, puis 16 écrans.

**Ce que ça montre :** changer le rangement une fois des écrans dessinés ne réorganise rien. La page range un écran d'après la lettre de son code, et un code ne change jamais. Claude le gère bien, puisqu'il le dit et demande, mais la valeur n'a d'effet que sur les écrans à venir. C'est une question de conception, ouverte : le skill n'a pas été changé.

## Ce qui a été regardé à l'écran

Toujours sous Edge, avec Playwright, en ouvrant `index.html` directement depuis le dossier (adresse `file://`).

- **Fin de l'étape 1 :**
  - les vues `#etat`, `#ensemble` et `#ecran/A1`, à 390 et à 1320 px, plus `#ecran/A1` en sombre à 390 px ;
  - captures regardées : `#ecran/A1` à 1320 px avant et après la charte, `#etat` à 390 px, `#ensemble` à 1320 et 390 px, `#ecran/A1` à 390 px en clair et en sombre, et le cadre B1 à 390 px.
- **Après l'étape 6 :** les mêmes trois vues avec `#ecran/C1`, dont la capture à 1320 px et le cadre C1 à 390 px.
- **Étape 3 :** `#etat` à 390 px.
- **Mesures sur toutes ces vues :** aucun défilement de côté, aucune erreur de console, aucune requête hors du dossier.
- **Ce qu'on voit :**
  - l'existant et la proposition côte à côte ;
  - la marque « Validé » ;
  - les notes à côté des écrans ;
  - les [crochets] ;
  - le compte « 1 existe · 7 à compléter · 5 manquent » ;
  - une ligne de l'état des lieux par page, avec sa source.
- **Piège des captures :** une capture de toute la page montre blancs les cadres d'écran situés plus bas que la fenêtre (proposition à 390 px, vignettes de la rangée B). Une fois le cadre amené dans la fenêtre, il est bien rempli : j'ai vérifié son texte et sa capture pour A1, B1 et C1. Je n'ai pas vérifié si une personne qui fait défiler la page voit un blanc avant le remplissage.

## Coût total

Environ 2,99 $ :

- étapes 1 et 6, une seule conversation : 2,29 $ ;
- étape 3 : 0,31 $ ;
- étape 4 : 0,30 $ ;
- étape 5 : 0,08 $ ;
- sondes d'autorisation : 0,02 $.

Il y a eu 20 tours en Sonnet et 5 sondes en Haiku.

## Pas vérifié

- **La demande d'autorisation en vrai :** son texte, le nombre de demandes et ce qui se passe quand on l'accepte, dans le terminal ou dans l'application de bureau. Le gestionnaire de l'essai remplace la personne.
- **Le cas où l'outil est installé** avec `/plugin install`, son modèle rangé dans le dossier de configuration de Claude Code : seule une copie chargée par `--plugin-dir` a été essayée.
- **Le vrai presse-papiers :** il a été remplacé par un faux pendant l'essai de « Copier pour Claude ».
- **Le rendu vu par Claude lui-même :** l'essai n'avait pas de navigateur à lui donner, et il a écrit chaque fois « je n'ai pas vu le rendu ».
- **D'autres navigateurs :** Chrome, Firefox et un vrai téléphone n'ont pas été essayés.
- **Les écrans en détail :** les 16 écrans n'ont pas tous été regardés un par un. Les captures listées plus haut sont les seules.
- **Un projet que le skill n'a jamais vu :** voir la limite du compte.
- **Les journaux de session :** ils restent dans le dossier de configuration de Claude Code de la machine d'essai.
