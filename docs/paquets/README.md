# Paquets OW-WRITE — mode d'emploi

> © 2026 Sébastien Chevrier. Tous droits réservés.

Ce dossier décrit comment une demande d'écriture dans ce dépôt passe de ChatGPT à Claude,
puis revient à Sébastien pour décision. Un « paquet » est une demande écrite, complète et
numérotée, qui dit exactement quoi changer, quoi ne pas toucher et comment vérifier.

Étiquettes utilisées : **EXISTANT** (vérifié dans le dépôt), **PROPOSITION** (idée, rien n'est fait).

## 1. Le circuit réel (EXISTANT)

```
ChatGPT ──(texte)──▶ Sébastien ──(copier-coller)──▶ Claude ──▶ branche + Pull Request
   ▲                                                              │
   └──────────(compte rendu copié-collé par Sébastien)────────────┘
                     Sébastien relit et fusionne lui-même la PR
```

1. **ChatGPT prépare** le paquet (texte, selon [TEMPLATE.md](TEMPLATE.md)).
   ChatGPT ne peut pas écrire sur GitHub. Il peut seulement lire les Pull Requests publiques en lecture.
2. **Sébastien copie** le paquet et le **colle** dans le fil Claude dédié aux paquets (depuis son téléphone Android).
3. **Claude exécute** : crée la branche, modifie uniquement les fichiers autorisés, vérifie, fait le commit,
   pousse la branche et ouvre une Pull Request **sans la fusionner**.
4. **Claude rend compte** dans le fil, en texte simple que Sébastien peut copier pour ChatGPT.
5. **Sébastien fusionne lui-même** la Pull Request sur GitHub, ou la ferme. Claude ne fusionne jamais.

Il n'existe **aucune liaison automatique** entre ChatGPT, Claude et GitHub : tout passe par le
copier-coller de Sébastien. Aucun paquet ne doit supposer le contraire.

## 2. Numérotation

- Format : `OW-WRITE-NNN`, sur trois chiffres : `OW-WRITE-001`, `OW-WRITE-002`, …
- Un numéro n'est utilisé **qu'une seule fois**, même si le paquet est abandonné ou refusé.
- Une correction d'un paquet déjà exécuté reçoit un **nouveau numéro** (elle cite l'ancien dans « Dépendances »).
- Une simple correction du texte **avant** exécution garde le numéro et ajoute un suffixe de version : `OW-WRITE-007 v2`.
- ChatGPT tient le compteur. Claude vérifie avant d'exécuter que le numéro n'existe pas déjà
  (recherche dans les titres de Pull Requests et dans [registre](#7-registre-des-paquets) ci-dessous).

## 3. Informations obligatoires d'un paquet

Un paquet doit contenir toutes les rubriques de [TEMPLATE.md](TEMPLATE.md). Les rubriques indispensables
pour que Claude commence sont :

| Rubrique | Pourquoi |
|---|---|
| Identifiant | Retrouver le paquet, la branche et la PR |
| Dépôt | Ici `sebastienchevrier/24-24-talk` (production). Tout autre dépôt doit être nommé |
| Objectif | Ce que le changement doit apporter, en une ou deux phrases |
| Fichiers concernés | La liste exacte des fichiers créés ou modifiés |
| Éléments interdits de modification | Ce que Claude ne doit pas toucher |
| Tests obligatoires | Comment prouver que ça marche |
| Critères d'acceptation | Quand le paquet est considéré comme réussi |

Si une rubrique indispensable manque ou est contradictoire, Claude **n'invente pas** : il s'arrête,
explique le manque dans le fil et attend un paquet corrigé.

## 4. Réception et exécution (procédure de Claude)

1. **Lire** tout le paquet. Vérifier l'identifiant, le dépôt et les dépendances.
2. **Vérifier l'accès** en écriture au dépôt depuis le fil. Si l'écriture est impossible, le dire tout de suite.
3. **Partir de `main` à jour** (`origin/main`) et créer la branche demandée.
4. **Modifier uniquement** les fichiers listés. Tout autre fichier touché = paquet en échec.
5. **Lancer les tests** demandés (voir section 6).
6. **Relire le diff** complet (`git diff --stat` puis le détail).
7. **Commit** sur la branche, message qui commence par l'identifiant : `OW-WRITE-NNN : …`.
8. **Pousser** la branche et **ouvrir la Pull Request**, titre `OW-WRITE-NNN — …`. Ne pas fusionner.
9. **Compte rendu** dans le fil (section 8).

Règles permanentes, valables pour tous les paquets sauf mention contraire **écrite par Sébastien** :

- Ne jamais modifier `main` directement, ne jamais fusionner, ne jamais déployer.
- Ne toucher ni à Supabase (base de test ou de production) ni aux secrets.
- Ne supprimer aucun fichier qui n'est pas explicitement listé.
- Aucune dépense, aucun service payant.
- Ne pas inventer de capacité technique : si quelque chose n'a pas pu être fait ou vérifié, le dire.
- Ne pas entreprendre d'autre évolution que celle du paquet.

## 5. Dépendances entre paquets

- La rubrique « Dépendances » liste les paquets qui doivent être **fusionnés dans `main`** avant celui-ci
  (exemple : `OW-WRITE-004 fusionné`). « Aucune » si le paquet est indépendant.
- Avant d'exécuter, Claude vérifie dans `main` que chaque dépendance est bien fusionnée.
  Si ce n'est pas le cas, il s'arrête et le signale : il ne construit pas une branche sur une autre branche non fusionnée.
- Deux paquets qui modifient le même fichier sont exécutés **l'un après l'autre** : le second part de `main`
  après fusion du premier, pour éviter les conflits.
- Le cache hors ligne `everywhere/sw.js` change souvent : un paquet qui le modifie doit le dire dans « Fichiers concernés ».

## 6. Tests et validation

Ce qui existe dans le dépôt (EXISTANT) :

- Le site est fait de fichiers statiques (HTML, CSS, JavaScript), publiés par **GitHub Pages depuis `main`**.
  Une fusion dans `main` met donc le changement **en ligne** sur `https://sebastienchevrier.github.io/24-24-talk/`
  après quelques minutes. C'est pour cela que seule la fusion par Sébastien vaut mise en production.
- Tests automatiques Playwright + Chromium dans `everywhere/tests/` (`e2e.js`, `piliers.js`, `papier.js`,
  `espaces.js`, …). Ils servent le site en local et remplacent Supabase par `tests/fake-supabase.js` :
  ils ne touchent aucune base réelle. Mode d'emploi : `everywhere/README.md`.
- Le seul workflow GitHub Actions est `.github/workflows/robot-veille.yml` (surveillance quotidienne).
  **Il n'y a pas de tests automatiques lancés sur chaque Pull Request** : les tests sont lancés par Claude
  avant de pousser, et leurs résultats sont écrits dans le compte rendu.

Règles :

- Paquet **documentation seule** : vérifier que seuls les fichiers prévus changent, que les liens internes
  pointent vers des fichiers existants, et que le texte correspond au dépôt réel.
- Paquet qui touche **l'application** : lancer au minimum les tests `everywhere/tests/` concernés et donner
  le résultat chiffré (exemple : `e2e 115/115`). Un test qui échouait déjà sur `main` est signalé comme tel.
- Ne jamais désactiver ou supprimer un test pour obtenir un résultat vert.
- Un essai simulé n'est jamais présenté comme un essai réel sur téléphone. Ce qui reste à vérifier à l'œil
  sur Android est listé dans le compte rendu.

## 7. Registre des paquets

| Paquet | Objet | Branche | État |
|---|---|---|---|
| OW-WRITE-001 | Mise en place du système de paquets (ce dossier) | `feature/ow-packet-system` | PR ouverte, à fusionner par Sébastien |

Chaque nouveau paquet ajoute sa ligne à ce tableau dans sa propre Pull Request.

## 8. Compte rendu obligatoire

Après chaque paquet, Claude écrit dans le fil, en texte simple (pas de tableau), à copier pour ChatGPT :

```
OW-WRITE-NNN — COMPTE RENDU
État : réussi / partiel / échec
Branche : …
Fichiers créés : …
Fichiers modifiés : …
Commit : SHA complet
Pull Request : https://github.com/sebastienchevrier/24-24-talk/pull/…
Vérifications : …
Tests : … (résultats chiffrés)
Problèmes : … (ou « aucun »)
Reste à vérifier sur téléphone : … (ou « rien »)
Action de Sébastien : relire puis fusionner (ou fermer) la PR
```

## 9. Branches et Pull Requests

- Branche : celle que le paquet indique. Par défaut : `feature/ow-` suivi d'un nom court en minuscules
  (exemple : `feature/ow-packet-system`). Une branche par paquet.
- La branche part toujours de `origin/main` à jour.
- Titre de PR : `OW-WRITE-NNN — <objet court>`.
- Description de PR : objectif, fichiers, vérifications, tests, et la mention « Ne pas fusionner sans relecture de Sébastien ».
- La PR reste ouverte. **Seul Sébastien la fusionne** (ou la ferme) depuis GitHub.
- Si Sébastien demande une correction, Claude ajoute un commit sur la même branche, tant que la PR n'est pas fusionnée.
  Après fusion, toute suite est un nouveau paquet avec un nouveau numéro.
