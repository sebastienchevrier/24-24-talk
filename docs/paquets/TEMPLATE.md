# OW-WRITE-NNN — <titre court>

> Modèle de paquet. Copier ce texte, remplir chaque rubrique, puis le coller dans le fil Claude des paquets.
> Mode d'emploi complet : [README.md](README.md). Écrire « Aucun » plutôt que laisser une rubrique vide.

Dépôt : sebastienchevrier/24-24-talk
Branche : feature/ow-<nom-court>
Priorité : Haute / Normale / Basse
Type : Documentation / Application / Base de données (TEST seulement) / Autre

## Identifiant

OW-WRITE-NNN (numéro jamais utilisé avant ; `vN` si le texte a été corrigé avant exécution)

## Objectif

Ce que le changement doit apporter, en une ou deux phrases.

## Contexte technique

Ce que Claude doit savoir : écran concerné, comportement actuel, cause supposée, liens utiles.
Distinguer ce qui est vérifié (EXISTANT) de ce qui est supposé.

## Fichiers concernés

- Créer : `chemin/du/fichier`
- Modifier : `chemin/du/fichier`
- Supprimer : `chemin/du/fichier` (seulement si voulu, sinon « Aucun »)

## Modifications attendues

1. …
2. …

## Éléments interdits de modification

- `main` (aucun commit direct, aucune fusion)
- Supabase (test et production) et tous les secrets
- Tout fichier non listé dans « Fichiers concernés »
- Aucun déploiement, aucune dépense
- …

## Dépendances

Paquets qui doivent être fusionnés dans `main` avant celui-ci (exemple : `OW-WRITE-004 fusionné`), ou « Aucune ».

## Tests obligatoires

- Documentation seule : diff limité aux fichiers listés, liens internes valides.
- Application : tests `everywhere/tests/…` à lancer, résultat chiffré attendu.
- À vérifier à l'œil sur Android après fusion : …

## Critères d'acceptation

- [ ] …
- [ ] Seuls les fichiers listés ont changé
- [ ] PR ouverte, non fusionnée

## Résultats

(Rempli par Claude après exécution.)
État : réussi / partiel / échec
Vérifications : …
Tests : …
Problèmes : …
Reste à vérifier sur téléphone : …

## Commit

(Rempli par Claude.)
Message : `OW-WRITE-NNN : …`
SHA : …

## Pull Request

(Rempli par Claude.)
Titre : `OW-WRITE-NNN — …`
Lien : https://github.com/sebastienchevrier/24-24-talk/pull/…
État : ouverte, à fusionner par Sébastien
