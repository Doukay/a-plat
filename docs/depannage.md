# Dépannage

### La commande `/a-plat` n'apparaît pas
Les plugins se chargent au démarrage d'une session : ouvre-en une nouvelle après l'installation. Vérifie que le plugin est installé et activé :

```bash
claude plugin list
```

Si un autre plugin a aussi une commande `/a-plat`, tape le nom complet : `/a-plat:a-plat`. Une demande en phrase peut aussi le lancer : « mets ce projet à plat en maquettes ».

### `node` n'est pas reconnu
Installe Node.js 18 ou plus, puis ouvre une nouvelle session pour que Claude Code le trouve. Sans Node, Claude écrit lui-même les fichiers de la page et fait les contrôles à la main, et te le dit ; seule la finition fidèle ne marche pas.

### Claude demande sans cesse l'autorisation de lancer des scripts `node`
Le plugin autorise d'avance ses trois scripts (`copier.mjs`, `verifier.mjs`, `reprendre.mjs`), quand Claude les écrit sous la forme prévue. Claude Code peut quand même demander dans certaines configurations : choisis l'option qui les autorise pour ce projet. Les deux scripts de la finition fidèle, eux, demandent toujours, après ton accord.

### « La copie des fichiers de l'outil a été refusée »
Sans ces fichiers, la page ne peut pas s'afficher. Accepte la copie quand Claude la redemande. Claude ne te propose jamais une autre commande de copie à lancer toi-même.

### La page est vide dans le navigateur d'une application
Certains navigateurs intégrés à une application montrent un fichier local sans lancer ses scripts. La page d'À plat en a besoin : elle reste alors vide. Ouvre `a-plat/index.html` d'un double-clic dans ton navigateur habituel (Edge, Chrome).

Si tu dois quand même la voir dans ce navigateur intégré, sers le dossier `a-plat/`, **et lui seul**, sur ta propre machine. Par exemple, si Python est installé, depuis la racine de ton projet :

```bash
python -m http.server 8000 --bind 127.0.0.1 --directory a-plat
```

puis ouvre l'adresse `http://127.0.0.1:8000`. Ne sers jamais le dossier du projet entier : il peut contenir des secrets.

### La page dit « plan.js est introuvable »
La page lit `a-plat/sources/plan.js`. Soit Claude ne l'a pas encore écrit (la copie de la page vient avant l'état des lieux), soit le dossier ouvert n'est pas le bon. Relance `/a-plat` dans le projet.

### La page dit « plan.js contient une erreur » ou « Le plan contient des erreurs »
Une virgule, une accolade ou un guillemet est mal placé, souvent après une modification à la main. Demande à Claude de le corriger : il relance le contrôle, qui dit où.

### La page dit « Il manque un fichier de la page »
Le dossier `.cache/` est incomplet ou absent, par exemple dans un clone de ton dépôt (seul `sources/` suit Git). Relance `/a-plat` : la page est refaite sans toucher à ton travail.

### Un écran affiche « Écran introuvable »
Le fichier de l'écran manque dans `a-plat/sources/ecrans/`. Demande à Claude de le recréer, ou de retirer l'écran du plan.

### Le contrôle refuse un ancien dossier de maquettes
Ton projet a un dossier écrit par une version d'avant `a-plat/`, souvent `maquettes/`, avec `plan.js` à sa racine. Claude te propose de le reprendre dans `a-plat/` : l'ancien dossier n'est pas touché. Voir [Un ancien dossier `maquettes/`](fichiers-du-projet.md#un-ancien-dossier-maquettes).

Un écran qui garde un lien de l'ancien dossier (`../commun.css`, `../a-plat/relais.js`) est refusé de même : la reprise met ces liens à jour.

### Ton projet a déjà un dossier `a-plat/` à lui
Ton projet a son propre dossier `a-plat/`. L'outil n'y écrit rien et te demande un autre nom de dossier, par exemple `a-plat-maquettes/` : la page et le contrôle marchent avec n'importe quel nom.

### Le contrôle avertit : « la page de ce dossier date d'avant… »
Le moteur de la page de ce dossier est plus ancien que le plugin. Relance `/a-plat` : la page est refaite, `sources/` ne bouge pas.

### Le contrôle avertit : « l'UI n'a pas encore les couleurs du projet »
Le bloc UI de `sources/charte.css` reprend encore les valeurs de la maquette grise. Claude doit y écrire les couleurs lues dans tes styles. S'il ne les trouve pas, il te les demande.

### La finition fidèle s'arrête
- **« Tailwind n'est pas installé »** : le style se construit avec le Tailwind installé dans ton projet. Installer les paquets de ton projet est ta décision. Sinon, choisis la finition « couleurs du projet ».
- **« Tailwind 3 »**, ou une feuille avec `@apply` ou `@theme` que l'outil ne sait pas construire : donne la feuille qui importe Tailwind 4, s'il y en a une, sinon choisis la finition « couleurs du projet ».
- **« écrans ont changé après la construction du style »** : Claude doit relancer `style-du-projet.mjs`, sinon les nouvelles classes n'ont pas de style. Relancer ne coûte rien.

### Le bouton UX | UI n'apparaît pas
Il n'existe qu'avec les finitions « gris puis couleurs », « couleurs du projet » et « fidèle ». Avec « gris », tout reste en UX. Dis à Claude de changer la finition.

### **Copier pour Claude** ne copie rien
Ton navigateur refuse l'accès au presse-papiers. Le texte s'affiche alors dans un champ déjà sélectionné : copie-le toi-même.

### La page a oublié mes rangées repliées ou mon choix UX | UI
Ces choix sont gardés dans ton navigateur, pour ce dossier. Un autre navigateur, une navigation privée ou un dossier renommé repartent des réglages de départ.

### Claude s'arrête au milieu d'un gros lot
Un lancement a ses limites (durée, budget, longueur de la conversation). Claude dit où il en est et ce qui reste : réponds « continue ». Voir [Ce qui consomme des jetons](comment-ca-marche.md#ce-qui-consomme-des-jetons).

### `git status` montre des fichiers sous `a-plat/` hors de `sources/`
Ils ont été enregistrés avant que le dossier ait son `.gitignore`. Voir [Si des fichiers refaits sont déjà dans Git](fichiers-du-projet.md#si-des-fichiers-refaits-sont-déjà-dans-git).

### Toujours bloqué ?
Ouvre un ticket dans l'onglet **Issues** du dépôt. Dis ce que tu avais demandé, ce qui s'est passé et ce qui s'est affiché, avec des mesures plutôt qu'avec ton code (« environ 40 pages, la vue d'ensemble met 6 s à s'afficher »). N'y mets ni capture de ton appli, ni secret.
