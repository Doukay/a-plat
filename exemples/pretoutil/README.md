# Prêtoutil

Prêtoutil est un petit site de prêt d'outils entre voisins d'un même quartier. On voit qui a quoi,
on demande à emprunter pour quelques jours, on suit ses prêts.

C'est une version d'essai : pas de serveur, pas de base de données. Tout est gardé dans le navigateur de chacun.
Les voisins, les outils et les noms de rue sont inventés.

## Lancer le site

Deux possibilités, au choix :

- double-cliquer sur `index.html` ;
- ou, depuis ce dossier, lancer un petit serveur (`python -m http.server 8000`) et ouvrir `http://localhost:8000`.

Rien à installer.

## Comptes d'essai

| Qui | Adresse | Rôle |
|---|---|---|
| Camille | camille@exemple.test | voisine, a des prêts en cours |
| Basile | basile@exemple.test | voisin, tout nouveau |
| Ysolde | ysolde@exemple.test | référente du quartier |

Le mot de passe est libre, 4 caractères au moins : dans cette version, il n'est pas vérifié.

## Ce que fait Prêtoutil

- **Les outils du quartier** : la liste, avec une recherche par nom. On voit si l'outil est libre ou prêté.
- **La fiche d'un outil** : description, état, propriétaire, calendrier des dates déjà réservées.
- **Demander à emprunter** : choisir des dates, écrire un mot au voisin.
- **Mes prêts** : ce que j'emprunte et ce que je prête. On peut prolonger un prêt de 3 jours.
- **Proposer un outil** : je décris mon outil, le référent du quartier le valide avant qu'il apparaisse.
- **Noter un voisin** : après un prêt, une note de 1 à 5 étoiles.
- **Les voisins** : l'annuaire du quartier, avec les outils que chacun propose.
- **Mon profil** : mon prénom et ma rue.

## Les rôles

- **Voisin** : cherche, demande, prête, propose des outils.
- **Référent du quartier** : valide les nouveaux outils, retire un outil qui pose problème, répond aux questions.

## Choix écartés exprès

Décidés en équipe, à ne pas rouvrir sans en reparler :

- **Pas de caution, pas de paiement en ligne.** On ne manipule aucun argent : un prêt entre voisins se règle entre voisins.
- **Pas de messagerie intégrée.** Les voisins se parlent dans la rue ou par leurs propres moyens.

## Dans le dossier

| Fichier | Contenu |
|---|---|
| `index.html`, `outil.html`, `demande.html`, `mes-prets.html`, `ajouter.html`, `profil.html`, `quartier.html`, `connexion.html` | les pages |
| `app.js` | les données d'exemple et ce que toutes les pages utilisent (session, prêts, haut et bas de page) |
| `config.js` | les réglages : durée maximale d'un prêt, nom du quartier |
| `style.css` | l'apparence |
| `.env` | les clés des services extérieurs ; jamais dans le code |
| `docs/notes-produit.md` | les notes de l'équipe |
