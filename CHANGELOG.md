# Journal des changements

Chaque version d'À plat, de la plus récente à la plus ancienne. Le numéro est le même partout : dans `.claude-plugin/plugin.json`, ici, en tête d'`EMPREINTES.txt` et dans la marque Git (`v0.1.0`).

## 0.1.0 (date à mettre au moment de la publication)

Première version.

- **L'état des lieux** : la liste des pages de ton projet, chacune avec son état (Existe, À compléter, Manque ou Prévue) et une raison courte, plus l'avancement du projet en une barre à quatre étapes.
- **Ce qui manque** : les états oubliés d'un écran (vide, erreur, refus), les boutons qui ne mènent nulle part, les parcours incomplets. Ce qui semble manquer devient un point à trancher : l'outil n'ajoute rien de lui-même.
- **Des maquettes, page par page.** Pour une page qui existe et qui change, l'écran actuel et la proposition côte à côte. Une page qui ne change pas est dessinée une seule fois, marquée « Inchangé ». Ce que l'outil ne sait pas reste entre [crochets].
- **Une seule page à ouvrir**, en trois niveaux : la vue d'ensemble (tous les écrans sur une planche, avec zoom), une rangée en taille de lecture, un écran en grand. Recherche par code ou par mot, rangées qui se replient, notes affichées sous l'écran qu'elles concernent. Sur un téléphone, la vue d'ensemble devient une colonne. Clair et sombre.
- **Le bouton UX | UI** montre les écrans en maquette grise ou aux couleurs de ton projet, sans les redessiner. Quatre finitions : gris seul, gris puis couleurs du projet, couleurs du projet, ou **fidèle**, écrite avec le vrai balisage et le vrai style du projet, construit depuis son code avec ton accord (Tailwind 4 ou feuille de style simple, ses polices, ses icônes Lucide).
- **Corriger et Essayer le parcours** : désigner un élément pour une correction, ou suivre les boutons et les liens comme dans l'application.
- **Le passage au code** : à la fin, la liste des changements à faire dans le code, des questions qui restent et des points à voir à l'écran.
- **Un contrôle** (`verifier.mjs`) qui relit le dossier avant de te le montrer.
- **Ton code n'est jamais modifié** : tout ce qu'écrit À plat va dans un seul dossier, `a-plat/`, à la racine de ton projet. Rien ne part sur Internet.
- Deux projets d'exemple inventés, dans `exemples/`.
