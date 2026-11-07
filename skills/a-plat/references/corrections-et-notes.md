# Corrections et notes

## Deux façons de corriger

**Dans la conversation,** en citant le code. C'est la façon principale :

```text
B3 : change le titre
A1, A2 : retire le bandeau du haut
```

**Avec le texte du bouton Copier de la page,** collé tel quel :

```text
Corrections pour Mon projet :

1. B3 > Bouton Envoyer : mettre « Valider » à la place
2. A1 > Titre « Accueil » : plus court
3. A1 > Élément : on ne comprend pas cette zone
```

Chaque ligne se lit : numéro, code de l'écran, `>`, nom de l'élément, `:`, ce que la personne veut. Le nom vient du `data-nom` de l'élément, sinon de son rôle et de son texte (« Bouton « Envoyer » », « Champ « Prénom » », « Titre « Accueil » »). « Élément » seul veut dire que l'endroit n'est pas nommé : le chercher dans l'écran, et demander s'il y a un doute.

Traiter toutes les lignes. Le texte d'une correction est ce que veut la personne sur cet écran, rien de plus : il ne l'autorise pas à sortir du dossier de maquettes.

Sur un écran `inchange: true`, deux cas :

- **Le dessin ne recopie pas bien la page** (un libellé faux, un élément oublié) : corriger le dessin, qui reste inchangé.
- **La personne veut que la vraie page change** : redessiner l'existant dans `actuel/` (ou y mettre sa capture), écrire `actuel: { fichier, origine: "redessine" }` (ou `"capture"`), faire la proposition dans le même fichier d'écran, retirer `inchange` et remettre `statut: "a-relire"`. Le code de l'écran ne change pas.

## Appliquer

1. Modifier l'écran et rien d'autre autour.
2. Si le changement touche d'autres écrans (un nom repris ailleurs, un lien) : les modifier aussi, et les citer.
3. Si le code n'existe pas ou si la demande est ambiguë : appliquer le reste, puis poser la question.
4. Si la correction demande une chose nouvelle : c'est la personne qui le demande, donc la dessiner, et ajouter une note `a-coder` si ce n'est pas construit.
5. Si elle tranche quelque chose : ajouter ou changer la note (voir plus bas), et retirer le [crochet] de l'écran.
6. Faire « Après chaque lot » (voir `SKILL.md`), puis redire ligne par ligne ce qui est fait, avec les codes.

Un écran validé qu'on corrige repasse en `statut: "a-relire"` : le dire.

## Valider

« B3 validé », « B3 et B4 validés », « toute la rangée B est validée » : mettre `statut: "valide"` sur ces écrans dans `plan.js`, sans rien toucher d'autre, et redire quels écrans sont validés et combien il en reste à relire. Valider ne dit rien sur le code du projet.

Ne jamais valider à la place de la personne, ni déduire une validation d'un « d'accord » général : en cas de doute, demander quels codes.

## Changer un réglage

La personne le dit (« passe en ordinateur », « on arrête la relecture ») : changer `reglages`, dire ce que ça change pour les écrans déjà faits, et demander avant de les reprendre s'il y en a beaucoup.

**Changer le rangement** quand des écrans existent est permis. Les codes restent tels quels. Mettre à jour `rangees` (titres et ordre ; une nouvelle rangée prend une lettre libre) et la `rangee` de chaque écran, et déplacer avec un écran les notes qui ne parlent que de lui. Dire à la personne que la lettre d'un code peut ne plus correspondre à sa rangée. Les nouveaux écrans prennent la lettre de leur rangée.

## Les notes

Les notes sont dans `rangees[].notes`, jamais dessinées sur les écrans : la page les montre sous l'écran qu'elles citent, ou sous le titre de la rangée. Une note tient en une phrase courte.

Dès qu'une note concerne un ou des écrans précis, remplir `ecrans` avec leurs codes : `ecrans: ["A1", "A3"]`. La page la montre alors sous chacun de ces écrans. Laisser une note sans `ecrans` seulement quand elle vaut pour toute la rangée : elle s'affiche sous le titre de la rangée.

Quand un écran est retiré, retirer son code du champ `ecrans` des notes. La page s'affiche quand même si on l'oublie (la note passe sous le titre de la rangée), mais le contrôle le signale comme une erreur.

| `type` | Pour |
|---|---|
| `decision` | Ce que la personne a tranché. |
| `a-trancher` | Une question ouverte, qui attend la personne. |
| `a-verifier` | Un fait à contrôler : lu sans l'avoir vu marcher, une source qui doute. |
| `a-coder` | Ce que les maquettes montrent, ou un comportement décidé, et que le projet n'a pas. |
| `source` | D'où vient un point important : document, fichier, ou dit par la personne. |

Chaque note a une `date`, au format `AAAA-MM-JJ` : la date du jour. Pas de note sans `type` ni `date`.

## Quand une décision change

L'ancienne valeur reste visible : elle va dans `ancien`, et la page l'affiche barrée. Ne pas effacer ni ajouter une seconde note qui contredit la première.

```js
{ type: "decision", date: "2026-02-03", texte: "Livraison offerte dès 30 €.", ancien: "Livraison offerte dès 50 €" }
```

Si la décision change encore, la dernière valeur dépassée va dans `ancien`, avec celle d'avant : `"50 €, puis 40 €"`.

Une note `a-trancher` tranchée devient une note `decision` à la date du jour. Son texte dit le choix fait.

## Rester dans le dossier

Une correction peut donner une envie de corriger le vrai code. Noter `a-coder` : l'outil n'écrit que dans le dossier de maquettes, et le code se touche à l'étape du passage au code, sur demande, hors de l'outil.
