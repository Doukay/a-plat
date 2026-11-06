# Réponses : projet d'essai « jardins » (exemples/jardins)

Les Jardins de la Grelinette : site d'une association de jardins partagés. Une page `index.html`, un petit routeur à adresses
en `#`, dix vues en modules JavaScript, un compte rendu d'assemblée générale. Écrit sans connaître la méthode de l'outil.

Ce fichier ne doit jamais se trouver dans `exemples/jardins/`. Rubriques : Page absente, État oublié, Bouton ou lien sans suite,
Parcours incomplet, Annoncé mais pas construit.

## Manques

Chaque bloc : la rubrique, la ligne à comparer avec ce que l'outil rapporte, comment le confirmer dans le code, les fichiers à lire.

### J1
- Rubrique : Page absente
- Manque : Le règlement intérieur n'est pas consultable sur le site, alors que l'assemblée a décidé de le mettre en ligne.
- Pour confirmer : le compte rendu (point 3) décide la mise en ligne ; la table de `src/routes.js` n'a aucune adresse de règlement, aucun fichier de `src/vues/` n'en parle et aucun lien du site n'y mène.
- Fichiers : `docs/compte-rendu-ag.md`, `src/routes.js`

### J2
- Rubrique : Page absente
- Manque : Aucune page de demande d'adhésion en ligne pour un nouveau membre, décidée à l'assemblée.
- Pour confirmer : le compte rendu (point 7) la décide ; `src/routes.js` n'a ni adresse d'adhésion ni d'inscription, et `src/session.js` ne sait que connecter un membre existant.
- Fichiers : `docs/compte-rendu-ag.md`, `src/routes.js`, `src/session.js`

### J3
- Rubrique : Page absente
- Manque : Aucune page de gestion des membres : le bureau ne peut ni ajouter, ni retirer un membre, ni donner ou changer un code.
- Pour confirmer : les membres n'existent que dans la liste de départ de `src/donnees.js`, qui n'a aucune fonction pour en créer ou en retirer ; `src/vues/bureau.js` ne gère que les parcelles et les cotisations.
- Fichiers : `src/donnees.js`, `src/vues/bureau.js`

### J4
- Rubrique : État oublié
- Manque : La liste des parcelles n'a pas d'état « aucun résultat » : un filtre qui ne trouve rien laisse un tableau vide, sans phrase.
- Pour confirmer : dans `src/vues/parcelles.js`, la fonction `dessiner` remplit le tableau sans cas « zéro ligne ». En vrai : secteur « Le Verger » et état « Libres » (le Verger n'a aucune parcelle libre) donnent un tableau avec ses seuls titres.
- Fichiers : `src/vues/parcelles.js`

### J5
- Rubrique : État oublié
- Manque : Une connexion refusée (mauvais prénom ou mauvais code) n'affiche rien : pas de message, le formulaire reste tel quel.
- Pour confirmer : `connecter` dans `src/session.js` renvoie `false` quand rien ne correspond ; dans `src/vues/connexion.js`, le gestionnaire du formulaire ne fait quelque chose que si le résultat est vrai et n'a pas de cas contraire.
- Fichiers : `src/vues/connexion.js`, `src/session.js`

### J6
- Rubrique : État oublié
- Manque : Un accès refusé (page réservée sans être connecté, ou espace du bureau pour un simple membre) renvoie sans explication vers une autre page.
- Pour confirmer : dans `src/routes.js`, `afficher` change l'adresse vers `#/connexion` ou `#/` quand `accessible` est faux, sans rien afficher ni retenir ; aucun message n'explique la redirection (le seul « connectez-vous » est sur l'accueil, lu au hasard d'un passage, pas à ce moment-là).
- Fichiers : `src/routes.js`

### J7
- Rubrique : État oublié
- Manque : Si les données gardées dans le navigateur sont illisibles, le site ne s'affiche plus et ne dit rien : zone principale vide.
- Pour confirmer : `charger` dans `src/donnees.js` appelle `JSON.parse` sur le contenu du stockage sans `try/catch`, au chargement du module ; `src/session.js` et `src/routes.js` importent ce module, donc tout le site échoue. En vrai : écrire `{pas du json` dans la clé `jardins.etat.v1` du stockage local, recharger : page vide et erreur dans la console.
- Fichiers : `src/donnees.js`, `src/session.js`

### J8
- Rubrique : État oublié
- Manque : Une adresse inconnue (ou mal écrite) n'a pas de page « introuvable » : elle renvoie en silence à l'accueil.
- Pour confirmer : dans `src/routes.js`, quand `trouver` ne renvoie rien, `afficher` met l'adresse à `#/` ; aucune vue ni texte pour ce cas.
- Fichiers : `src/routes.js`

### J9
- Rubrique : Bouton ou lien sans suite
- Manque : Le lien « Code oublié ? » de la page de connexion ne mène nulle part.
- Pour confirmer : `src/vues/connexion.js` pointe vers `#/code-oublie` ; cette adresse n'existe pas dans `src/routes.js`, donc le visiteur retombe sur l'accueil.
- Fichiers : `src/vues/connexion.js`, `src/routes.js`

### J10
- Rubrique : Bouton ou lien sans suite
- Manque : Le bouton « Proposer un échange » de chaque tour d'arrosage ne fait rien.
- Pour confirmer : `src/vues/arrosage.js` dessine le bouton avec `data-action="echanger"`, mais le gestionnaire de clic ne traite que l'action `fait` ; aucun autre fichier ne parle d'échange.
- Fichiers : `src/vues/arrosage.js`

### J11
- Rubrique : Bouton ou lien sans suite
- Manque : Le lien « Voir l'historique de cette parcelle » d'une fiche de parcelle mène à l'accueil.
- Pour confirmer : `src/vues/parcelle.js` pointe vers `#/parcelles/<id>/historique` ; la table de `src/routes.js` ne connaît que `/parcelles` et `/parcelles/:id`, et le motif `:id` s'arrête avant le `/` suivant.
- Fichiers : `src/vues/parcelle.js`, `src/routes.js`

### J12
- Rubrique : Bouton ou lien sans suite
- Manque : Le bouton « Modifier » d'une actualité, visible pour le bureau, ne fait rien.
- Pour confirmer : `src/vues/actualites.js` dessine le bouton avec `data-action="modifier"` ; le seul gestionnaire de la vue est celui du formulaire de publication, rien ne traite ce bouton et `src/donnees.js` n'a pas de fonction de modification.
- Fichiers : `src/vues/actualites.js`, `src/donnees.js`

### J13
- Rubrique : Parcours incomplet
- Manque : Quand le bureau libère une parcelle, rien ne la propose à la première personne de la liste d'attente.
- Pour confirmer : dans `src/vues/bureau.js`, l'action « Libérer » appelle `liberer` (`src/donnees.js`) qui vide le titulaire, puis redessine ; la liste d'attente n'est ni lue ni mise à jour, il n'y a pas de proposition, de délai de réponse ni de retrait de la liste (voir `src/vues/attente.js`, qui n'a aucun lien avec la gestion des parcelles).
- Fichiers : `src/vues/bureau.js`, `src/donnees.js`, `src/vues/attente.js`

### J14
- Rubrique : Parcours incomplet
- Manque : On peut réserver un outil mais jamais annuler : avec deux réservations en cours, on est bloqué jusqu'à leur date.
- Pour confirmer : `reserver` dans `src/donnees.js` refuse au-delà de `reservationsMax` (valeur 2 dans `src/config.js`) ; aucune fonction d'annulation n'existe, et ni `src/vues/cabane.js` ni `src/vues/compte.js` n'ont de bouton d'annulation.
- Fichiers : `src/donnees.js`, `src/vues/cabane.js`, `src/vues/compte.js`, `src/config.js`

### J15
- Rubrique : Parcours incomplet
- Manque : Après s'être connecté, on arrive toujours à l'accueil, jamais sur la page qu'on voulait ouvrir (cabane, arrosage, compte).
- Pour confirmer : `afficher` dans `src/routes.js` renvoie vers `#/connexion` sans garder l'adresse demandée ; `src/vues/connexion.js` envoie toujours vers `#/` après une connexion réussie.
- Fichiers : `src/routes.js`, `src/vues/connexion.js`

### J16
- Rubrique : Parcours incomplet
- Manque : Le bureau ne peut pas composer ni prolonger le tour d'arrosage : il est figé à huit semaines données au départ, et personne ne peut y être ajouté ou retiré.
- Pour confirmer : les tours sont écrits en dur dans `src/donnees.js` (de début avril à fin mai 2027) sans fonction pour en créer ou changer les binômes ; `src/vues/bureau.js` ne propose rien sur l'arrosage ; `src/vues/arrosage.js` ne sait qu'afficher et marquer « fait ».
- Fichiers : `src/donnees.js`, `src/vues/bureau.js`, `src/vues/arrosage.js`

### J17
- Rubrique : Annoncé mais pas construit
- Manque : Le site est annoncé comme utilisable sans réseau et installable sur l'écran d'accueil d'un téléphone : rien ne le permet.
- Pour confirmer : le `README.md` (« Hors connexion ») et le compte rendu (point 8) l'annoncent ; `index.html` n'a aucun lien vers un manifeste, aucun fichier du dossier n'est un manifeste ou un service worker, et aucun script n'appelle `serviceWorker`. En vrai : aucun service worker enregistré.
- Fichiers : `README.md`, `index.html`

### J18
- Rubrique : Annoncé mais pas construit
- Manque : Le rappel par courriel la veille du tour d'arrosage est promis (à l'accueil et à l'assemblée), mais aucun courriel ne part.
- Pour confirmer : `src/vues/accueil.js` écrit « Un rappel vous sera envoyé par courriel » ; le compte rendu (point 4) le décide ; aucun code n'envoie de courriel ni ne planifie quoi que ce soit, et les membres n'ont même pas d'adresse dans `src/donnees.js`.
- Fichiers : `src/vues/accueil.js`, `docs/compte-rendu-ag.md`, `src/donnees.js`

### J19
- Rubrique : Annoncé mais pas construit
- Manque : L'export du tour d'arrosage au format calendrier (`.ics`) est annoncé « à venir » dans le README et n'existe pas.
- Pour confirmer : la section « À venir » du `README.md` le cite ; `src/vues/arrosage.js` n'a aucun bouton d'export et aucun code ne produit de fichier calendrier.
- Fichiers : `README.md`, `src/vues/arrosage.js`

## Fausses pistes

### F1
- Ce qu'on dirait à tort : « `src/vues/parcelle.js` n'est branché nulle part : la vue de détail d'une parcelle est du code mort, la page n'est jamais atteignable. »
- Pourquoi c'est faux : aucune ligne `import` ne la cite, parce que `src/routes.js` charge les vues à la demande avec `import()` à partir du champ `vue` de la table (« parcelle » pour `/parcelles/:id`) ; les listes de parcelles et le compte y mènent par des liens `#/parcelles/<id>` qui fonctionnent.

### F2
- Ce qu'on dirait à tort : « Le bouton « Se déconnecter » de l'en-tête n'a aucune action : pas d'`onclick`, pas de lien. »
- Pourquoi c'est faux : le bouton est dans `index.html` sans gestionnaire écrit sur place, mais `src/main.js` lui en ajoute un (`addEventListener` sur `#deconnexion`) qui vide la session et revient à l'accueil ; le bouton est caché tant que personne n'est connecté.

### F3
- Ce qu'on dirait à tort : « Une adresse de parcelle qui n'existe pas (par exemple `#/parcelles/zz`) n'a pas d'état d'erreur : la fiche reste vide ou plante. »
- Pourquoi c'est faux : `src/vues/parcelle.js` traite le cas : quand `parcelle(id)` ne trouve rien, la vue affiche « Parcelle introuvable » avec un lien de retour. (À ne pas confondre avec J8, qui concerne les adresses que le routeur ne reconnaît pas du tout.)

## Cas tolérés

Un lecteur peut aussi rapporter ceci, sans que cela compte comme un manque trouvé ni comme une invention :

- Lire J9 comme une page absente (« mot de passe ou code oublié ») : c'est le même défaut vu autrement, à compter une seule fois.
- Lire J10 (échanges de tours) ou J14 (annulation d'une réservation) comme « annoncé mais pas construit », puisque le compte rendu les décide aussi : même défaut, rubrique voisine.
- Ranger J19 (export `.ics`) comme une page ou une fonction « Prévue » plutôt que comme un manque : le README la dit à venir.
- Citer la carte du terrain évoquée en questions diverses de l'assemblée (point 8) comme idée « Prévue » ou non construite : le bureau ne l'a décidée sous aucune condition ferme.
- Remarquer que les données ne vivent que dans le navigateur de chacun (pas de serveur, donc pas de partage entre membres) : c'est dit dans le README, c'est une limite assumée.
- Remarques générales sans fichier précis (pas de recherche ni de pagination, accessibilité, pas de photos des parcelles, pas de page de profil modifiable).
- Dire que `.env` existe et n'est lu par rien, ou que `src/config.js` parle d'un service de sauvegarde qui n'existe pas : le `.env` est un témoin et la sauvegarde n'est annoncée à aucun utilisateur.

Clause : autre défaut réel et vérifiable dans le code : compté à part, ni trouvé ni inventé.

## Autres défauts réels

Connus de l'auteur, vérifiables dans le code, comptés à part s'ils sont rapportés :

- Le tour du 17 mai 2027 n'a aucun binôme (`src/donnees.js`) et la ligne s'affiche avec une cellule vide, sans mention (`src/vues/arrosage.js`).
- Les codes personnels sont écrits en clair dans `src/donnees.js` (et dans le README, comme comptes d'essai).
- La liste d'attente accepte la même personne plusieurs fois (aucun contrôle de doublon dans `src/vues/attente.js` ni dans `inscrireAttente`).
- La liste d'attente affiche à tout visiteur, même non connecté, les prénoms et dates d'inscription des personnes en attente.
- `aujourdhui()` dans `src/outils.js` utilise la date en UTC (`toISOString`) : près de minuit, la date du jour peut être celle de la veille.
- `afficher` dans `src/routes.js` n'a aucune protection contre deux navigations rapides : une vue plus lente à charger peut s'afficher après la suivante.
- Les droits (membre, bureau) ne sont contrôlés que dans le navigateur ; sans serveur, n'importe qui peut modifier les données de son propre navigateur.
