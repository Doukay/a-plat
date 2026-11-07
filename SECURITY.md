# Politique de sécurité

## Signaler une faille

Signale-la en privé à la personne qui tient ce dépôt, sans l'écrire dans un ticket public : sur GitHub, onglet **Security**, puis **Report a vulnerability**.

Dis ce qu'est le problème et ce qu'on pourrait en faire, comment le reproduire, et la version concernée (`.claude-plugin/plugin.json`, et la marque Git si tu en as une).

## Ce que le plugin fait sur ton ordinateur

À plat n'a pas de serveur. Il lit ton projet, écrit dans un seul dossier, `a-plat/`, à la racine du projet, et ne contacte aucun service sur Internet. La page qu'il écrit s'ouvre d'un double-clic, sans rien charger d'ailleurs, sauf une police en ligne (Google Fonts) si tu la demandes pour ta charte.

Deux scripts exécutent du code de ton projet, et seulement avec ton accord, pour la finition fidèle :

- `style-du-projet.mjs` construit le vrai style de ton projet avec ses paquets installés (Tailwind et ses extensions, qui sont du code de ton projet) ;
- `icones.mjs` rend les icônes avec les bibliothèques installées dans ton projet (React et lucide-react).

Le détail est dans [Confidentialité et sécurité](docs/confidentialite-et-securite.md).

## Dans le périmètre

- tout ce qui pourrait faire fuir des secrets, des données ou du code source du projet ;
- tout ce qui écrirait en dehors du dossier `a-plat/` du projet ;
- tout ce qui enverrait quelque chose sur Internet, ou ferait charger à la page quelque chose d'Internet ;
- `style-du-projet.mjs` ou `icones.mjs` qui exécuteraient autre chose que les paquets installés du projet, ou sans l'accord de la personne.

Hors périmètre : les défauts de Claude Code lui-même, à signaler à [Anthropic](https://www.anthropic.com/responsible-disclosure-policy), et ceux des paquets de ton projet, à signaler à leurs auteurs.

## Versions concernées

Seule la dernière version publiée reçoit des corrections.
