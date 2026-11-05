# Passage au code

À faire à la fin, ou dès que la personne le veut, même si tout n'est pas validé. Le but : un document clair, qui permet de coder sans relire la conversation. L'outil ne modifie pas le code.

## Avant d'écrire

Relire `plan.js` et relancer le contrôle. Si le contrôle échoue, le dire et corriger. Si le projet a changé depuis la dernière lecture, signaler ce qui ne colle plus.

## Écrire le dossier

Dans le dossier de maquettes, un seul fichier : `passage-au-code.md`. S'il existe déjà, le remplacer après avoir dit ce qui change. Il suit ce plan, tiré de `plan.js`, sans rien inventer :

```markdown
# Passage au code : <projet>

Date : <AAAA-MM-JJ>. <n> écrans validés sur <m>.
Les maquettes s'ouvrent avec index.html. Chaque écran est un vrai fichier HTML, à prendre comme référence.

## Écrans validés
| Code | Écran | Fichier | Page du projet concernée |

## Écrans encore à relire
| Code | Écran | Fichier |

## Décisions
- <rangée> : <décision> (<date>). Avant : <ancien, s'il existe>.

## Questions encore ouvertes
- <notes a-trancher, et [crochets] restants donnés par le contrôle, avec le code de l'écran>

## À vérifier
- <notes a-verifier, et lignes de l'état des lieux où aConfirmer vaut true>

## À coder
- <notes a-coder et différences entre l'actuel et la proposition>, avec le code de l'écran et le fichier du projet à toucher (`source`).

## Pages qui manquent encore
- <lignes manque ou prevue, sans écran, avec leur source>
```

Ce qui ne figure pas dans le plan ne s'y ajoute pas : si une section est vide, écrire « Rien ».

## Le message à la personne

Dire où est le fichier, combien d'écrans sont validés, ce qui reste ouvert, et ce qui n'a pas été vérifié. Rappeler que rien dans le code du projet n'a été changé.

La suite est sa décision, et c'est un autre travail que celui de l'outil. Finir par la question : « Voulez-vous garder ce dossier pour plus tard, ou que l'on commence à coder, en repartant de lui ? »
