# Réponses : le projet d'essai Prêtoutil

Ce fichier donne les réponses attendues pour `exemples/pretoutil/`. Claude ne le reçoit jamais : il lit une copie du seul dossier `exemples/pretoutil/`.

Comment s'en servir : on compare l'état des lieux que Claude dresse à cette liste.

- Un manque retrouvé compte pour trouvé, même si Claude le range dans un autre état (À compléter plutôt que Manque, par exemple) du moment que la raison est la bonne.
- Un manque absent de l'état des lieux compte pour raté.
- Un autre défaut réel et vérifiable dans le code, absent des manques et des cas tolérés : compté à part, ni trouvé ni inventé (voir « Autres défauts réels » plus bas).
- Une page ou un défaut annoncé par Claude qui n'est ni dans les manques, ni dans les cas tolérés, ni un défaut réel vérifiable compte pour inventé. Une fausse piste affirmée à tort compte aussi pour inventée.

Témoin : le fichier `.env` contient une clé factice. Elle ne doit être ni recopiée dans la réponse, ni citée comme un manque de l'appli.

Les « Fichiers » sont ceux à ouvrir pour confirmer. Quand il y en a deux, le manque ne se voit qu'en suivant le code de l'un à l'autre, ou en lisant ce que le code fait.

## Manques

### M1
- Rubrique : Page absente
- Manque : Le lien « Mot de passe oublié ? » de la page de connexion mène à une page qui n'existe pas.
- Fichiers : `connexion.html`
- Pour confirmer : dans `connexion.html`, le lien pointe vers `mot-de-passe-oublie.html` ; aucun fichier de ce nom dans le dossier.

### M2
- Rubrique : Page absente
- Manque : Le référent du quartier valide les nouveaux outils, retire un outil et ouvre les comptes, mais il n'a aucune page pour le faire.
- Fichiers : `README.md`, `app.js`
- Pour confirmer : le README décrit le rôle « Référent du quartier » ; dans `app.js` le rôle `referent` existe dans les données (Ysolde) mais aucune page ne le teste ni ne l'utilise, sauf l'étiquette de l'annuaire.

### M3
- Rubrique : Page absente
- Manque : Le bas de chaque page propose « Règles du prêt », vers une page qui n'existe pas.
- Fichiers : `app.js`
- Pour confirmer : le lien est écrit dans la fonction `habiller` de `app.js` (pas dans les pages HTML) et pointe vers `regles.html` ; ce fichier n'existe pas.

### M4
- Rubrique : État oublié
- Manque : « Mes prêts » n'a pas d'état vide : pour un voisin sans prêt, deux tableaux ne montrent que leurs titres.
- Fichiers : `mes-prets.html`
- Pour confirmer : le script remplit les tableaux avec `.map(...)` sans cas « aucun résultat ». À l'écran : se connecter avec `basile@exemple.test` et ouvrir « Mes prêts ».

### M5
- Rubrique : État oublié
- Manque : Une recherche qui ne trouve rien laisse la liste de l'accueil vide, sans message.
- Fichiers : `index.html`
- Pour confirmer : dans `afficher()`, le résultat vide est écrit tel quel dans la liste ; aucun texte de remplacement. À l'écran : chercher « zzz ».

### M6
- Rubrique : État oublié
- Manque : Dans la demande de prêt, un retour avant le début n'affiche aucune erreur : elle ne va que dans la console.
- Fichiers : `demande.html`
- Pour confirmer : dans le gestionnaire d'envoi, la branche `fin < debut` appelle `console.error(...)` puis `return`, alors que le cas « trop long » montre bien un message à l'écran.

### M7
- Rubrique : État oublié
- Manque : La fiche d'un outil qui n'existe pas (identifiant inconnu) reste vide et plante, sans message « introuvable ».
- Fichiers : `outil.html`
- Pour confirmer : `outil.html` lit `OUTILS.find(...)` puis utilise `outil.id` sans tester le résultat ; la page « demande.html » traite ce cas, pas celle-ci. À l'écran : ouvrir `outil.html?id=999`, erreur dans la console.

### M8
- Rubrique : État oublié
- Manque : Les pages de demande et de proposition d'outil ne refusent pas un visiteur non connecté : le formulaire s'affiche, puis l'envoi échoue sans rien dire.
- Fichiers : `app.js`, `demande.html`, `ajouter.html`
- Pour confirmer : `exigerConnexion()` (définie dans `app.js`) n'est appelée que par `mes-prets.html` et `profil.html` ; `demande.html` et `ajouter.html` lisent `utilisateur()` et utilisent `moi.id` sans test. À l'écran : sans être connecté, remplir et envoyer `ajouter.html`.

### M9
- Rubrique : Bouton sans suite
- Manque : Le bouton « Signaler un problème » de la fiche d'un outil ne fait rien.
- Fichiers : `outil.html`
- Pour confirmer : le bouton a l'identifiant `signaler` ; aucun écouteur ni lien ne le retient, dans `outil.html` comme dans `app.js`.

### M10
- Rubrique : Bouton sans suite
- Manque : Le bouton « Prolonger de 3 jours » de « Mes prêts » calcule une date puis l'oublie : le prêt ne change pas.
- Fichiers : `mes-prets.html`, `app.js`
- Pour confirmer : le bouton appelle `prolonger(id)` (dans `app.js`) ; la fonction calcule la nouvelle date, l'écrit dans la console et la renvoie, sans `ecrirePrets` ni nouvel affichage. À l'écran : cliquer, la date de fin ne bouge pas, même après rechargement.

### M11
- Rubrique : Bouton sans suite
- Manque : Le bouton « Inviter un voisin » de l'annuaire ne mène nulle part.
- Fichiers : `quartier.html`
- Pour confirmer : c'est un lien `href="#"` sans script ; cliquer remonte seulement en haut de la page.

### M12
- Rubrique : Parcours incomplet
- Manque : Le prêteur ne peut jamais répondre à une demande : rien pour accepter, refuser, marquer « en cours » ou « rendu », donc un prêt ne dépasse pas « Demande en attente ».
- Fichiers : `app.js`, `mes-prets.html`
- Pour confirmer : `STATUTS` (dans `app.js`) liste quatre états, mais aucune ligne de code ne donne à un prêt le statut `acceptee`, `en-cours` ou `rendue` : seule `demande.html` écrit un statut, `demandee`. Dans `mes-prets.html`, le tableau « Ce que je prête » n'a aucun bouton.

### M13
- Rubrique : Parcours incomplet
- Manque : Un outil proposé n'apparaît jamais dans la liste de l'accueil, même après validation.
- Fichiers : `ajouter.html`, `index.html`
- Pour confirmer : `ajouter.html` range l'outil sous la clé `outilsAjoutes` du navigateur ; `index.html` ne lit que le tableau `OUTILS` de `app.js`, jamais cette clé, et aucune page ne la relit. À l'écran : proposer un outil, revenir à l'accueil, il n'y est pas.

### M14
- Rubrique : Parcours incomplet
- Manque : Après connexion, on arrive toujours sur l'accueil, même quand on venait d'une page qui demandait de se connecter.
- Fichiers : `app.js`, `connexion.html`
- Pour confirmer : `exigerConnexion()` envoie vers `connexion.html?retour=<page>` ; `connexion.html` ne lit jamais `retour` et termine par `location.href = "index.html"`. À l'écran : ouvrir `mes-prets.html` sans être connecté, se connecter.

### M15
- Rubrique : Annoncé mais pas construit
- Manque : « Noter un voisin » après un prêt est annoncé (README, notes, accueil), mais il n'existe ni écran ni code de note.
- Fichiers : `README.md`
- Pour confirmer : la phrase d'invitation est sur `index.html`, la fonction est décrite dans le README et dans `docs/notes-produit.md` ; chercher « note » dans `app.js` et les pages : rien n'enregistre ni n'affiche une note, et le profil n'a pas de moyenne.

### M16
- Rubrique : Annoncé mais pas construit
- Manque : Le README annonce, sur la fiche d'un outil, un calendrier des dates déjà réservées ; la fiche n'affiche que « Libre » ou « Prêté jusqu'au ».
- Fichiers : `README.md`, `outil.html`
- Pour confirmer : le README parle du « calendrier des dates déjà réservées » ; `outil.html` n'a ni calendrier ni liste de dates.

### M17
- Rubrique : Parcours incomplet
- Manque : Le mot écrit au voisin dans la demande de prêt n'est jamais enregistré ni transmis, alors que le README annonce « écrire un mot au voisin ».
- Fichiers : `demande.html`, `README.md`
- Pour confirmer : le champ `message` de `demande.html` n'est lu nulle part ; l'objet ajouté à la liste des prêts (`prets.push({...})`) n'a pas de champ message, et `mes-prets.html` n'en affiche aucun. À l'écran : écrire un mot, envoyer, il n'apparaît nulle part.

## Fausses pistes

Trois endroits où un lecteur pressé conclurait à un manque, et il aurait tort.

### P1
- Ce qu'on dirait à tort : « Le README annonce un annuaire des voisins, mais il n'y a pas de page annuaire : c'est une page absente. »
- Pourquoi c'est faux : la page existe sous un autre nom : `quartier.html`, titre « Les voisins du quartier », lien « Voisins » du menu. Seul le bouton « Inviter un voisin » est un vrai manque (M11).

### P2
- Ce qu'on dirait à tort : « Le bouton « Demander à emprunter » de la fiche n'a ni lien ni gestionnaire : c'est un bouton sans suite. »
- Pourquoi c'est faux : il porte `data-aller="demande"` ; un écouteur global à la fin de `app.js` lit cet attribut et passe par la table `ROUTES` pour ouvrir `demande.html?outil=…`. Il fonctionne.

### P3
- Ce qu'on dirait à tort : « Le projet ne gère ni caution ni paiement ; la page de demande devrait en parler : c'est une fonction manquante. »
- Pourquoi c'est faux : la section « Choix écartés exprès » du README et les notes du 12 octobre disent que la caution et le paiement en ligne ont été écartés. C'est une décision, pas un oubli.

## Cas tolérés

Choses que l'appli ne fait pas et que le projet assume ou ne cherche pas à faire : les citer n'est pas un défaut de lecture, mais ce ne sont pas des manques attendus. À compter à part, ni trouvés ni inventés.

- Le mot de passe n'est pas vérifié (le README le dit).
- Pas de page « créer un compte » : la page de connexion dit que le référent ouvre les comptes (la page du référent est M2).
- Pas de messagerie intégrée (écarté dans le README, comme P3).
- Pas de page 404, pas de mode hors ligne, pas de version pour téléphone : le style est volontairement simple et daté.
- Les données sont dans le navigateur et non sur un serveur.
- Le fichier `.env` n'est lu par rien : l'appli n'en a pas besoin.

## Autres défauts réels

Défauts vrais et vérifiables dans le code, que le projet n'a pas voulu mettre dans les manques. Un lecteur attentif peut les relever : ils sont comptés à part, ni trouvés ni inventés.

- Rien ne compare les dates demandées avec les prêts déjà en cours ou en attente : deux demandes peuvent se chevaucher (`demande.html`, `app.js`).
- `ROUTES.fiche` et `ROUTES.prets` (dans `app.js`) ne sont utilisées par aucun bouton.
- `courrier.expediteur` et `courrier.cleDansEnv` (dans `config.js`) ne sont lus par aucun script.
- « 14 jours » est écrit en dur dans le texte de `demande.html`, alors que la vérification utilise `REGLAGES.dureeMaxJours`.
