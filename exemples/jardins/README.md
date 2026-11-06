# Les Jardins de la Grelinette : le site de l'association

Petit site pour l'association de jardins partagés : les parcelles attribuées aux membres, le tour d'arrosage,
la réservation de la cabane à outils, la liste d'attente pour une parcelle et les nouvelles du bureau.

Tous les noms, prénoms et courriels de ce dossier sont inventés.

## Lancer le site

Il n'y a rien à installer et rien à construire. Le site est fait de pages et de modules JavaScript (ES modules).
Les navigateurs refusent de charger des modules depuis un fichier ouvert directement (`file://`) :
il faut donc le servir avec un serveur de fichiers tout simple, par exemple depuis ce dossier :

```
python -m http.server 8080
```

puis ouvrir `http://localhost:8080/`. N'importe quel autre serveur de fichiers statiques convient.

## Comptes d'essai

On se connecte avec un prénom et un code personnel.

| Prénom | Code | Rôle |
| --- | --- | --- |
| Pervenche | `pervenche-essai` | membre |
| Fenouil | `fenouil-essai` | membre |
| Aubépine | `aubepine-essai` | bureau (présidente) |
| Romarin | `romarin-essai` | bureau (trésorier) |

Les autres membres suivent la même règle : leur prénom, un tiret, `essai`.

## Ce que fait le site

- **Parcelles** : liste filtrable par secteur et par état, fiche de chaque parcelle.
- **Arrosage** : le binôme de chaque semaine, et un bouton pour dire que son tour est fait.
- **Cabane à outils** : réservation d'un outil pour une demi-journée, deux réservations en cours au plus.
- **Liste d'attente** : inscription ouverte à tout le monde, classement par date.
- **Actualités** : les nouvelles du bureau, que le bureau publie lui-même.
- **Espace du bureau** : attribuer ou libérer une parcelle, suivre les cotisations.
- **Hors connexion** : le site fonctionne sans réseau, utile au fond du jardin où la couverture est mauvaise,
  et peut s'installer sur l'écran d'accueil d'un téléphone.

## À venir

- Export du tour d'arrosage au format calendrier (`.ics`) pour l'ajouter à son agenda.

## Où est quoi

```
index.html          la page unique
src/main.js         menu, identité, déconnexion
src/routes.js       adresses du site (#/parcelles, #/cabane…) et chargement des vues
src/vues/           une vue par écran
src/donnees.js      données de départ et opérations dessus
src/session.js      connexion, rôles « membre » et « bureau »
src/config.js       réglages de l'association
docs/               compte rendu de l'assemblée générale
```

## Données

Les données de départ sont dans `src/donnees.js`. Ensuite, chaque navigateur garde ses propres modifications
(stockage local) : il n'y a pas de serveur ni de base de données. Pour repartir de zéro, vider les données du site
dans le navigateur.
