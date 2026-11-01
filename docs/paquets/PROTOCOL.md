# Protocole d'exécution et de transmission des paquets OW-WRITE

> © 2026 Sébastien Chevrier. Tous droits réservés.

Ce protocole détaille, étape par étape, ce que fait Claude quand il reçoit un paquet.
Vue d'ensemble et règles de nommage : [README.md](README.md). Modèle de paquet : [TEMPLATE.md](TEMPLATE.md).
Registre : [STATUS.md](STATUS.md). Modèle de rapport : [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md).

## 1. Recevoir un paquet

1. Sébastien colle le texte du paquet dans **le fil Claude unique des paquets** (« Exécuter les paquets ChatGPT »).
   Il n'existe pas d'autre entrée : Claude n'est réveillé ni par une issue GitHub, ni par un fichier poussé
   dans le dépôt, ni par ChatGPT (voir section 10).
2. Claude répond tout de suite en une phrase (première étape), pour que Sébastien sache que le paquet est pris.
3. Claude ajoute la ligne du paquet dans [STATUS.md](STATUS.md) avec l'état **reçu**, dans la branche du paquet.
4. Le texte du paquet, tel que reçu, est recopié **mot pour mot** dans la description de la Pull Request
   (rubrique « Paquet reçu »). C'est la trace de ce qui a été demandé, lisible par ChatGPT.

## 2. Vérifier l'identifiant

- Format attendu : `OW-WRITE-NNN` (trois chiffres), éventuellement suivi de `vN`.
- Le numéro ne doit pas déjà figurer dans [STATUS.md](STATUS.md) sur `main`, ni dans le titre d'une Pull Request
  du dépôt. Sinon : paquet **bloqué**, Claude demande un nouveau numéro.
- Un numéro qui saute (exemple : 005 alors que 004 n'existe pas) est signalé dans le compte rendu,
  mais n'empêche pas l'exécution.

## 3. Vérifier les fichiers et les dépendances

1. Partir de `origin/main` à jour (`git fetch origin main`).
2. Pour chaque fichier « à modifier » : vérifier qu'il existe. Pour chaque fichier « à créer » : vérifier
   qu'il n'existe pas déjà (sinon, ne pas l'écraser : signaler).
3. Pour chaque dépendance (`OW-WRITE-NNN fusionné`) : vérifier dans `main` que son commit est présent
   et que sa ligne de [STATUS.md](STATUS.md) n'est pas **bloqué**. Sinon : arrêt, paquet **bloqué**.
4. Vérifier qu'aucune Pull Request ouverte ne modifie déjà les mêmes fichiers. Si oui : le signaler
   et attendre la décision (fusionner l'autre d'abord, ou continuer quand même).

## 4. Examiner le code existant avant toute modification

- Lire en entier chaque fichier qui sera modifié, et les fichiers qui l'appellent ou qu'il appelle
  (recherche du nom de la fonction ou de l'identifiant dans tout le dépôt).
- Repérer les tests existants qui couvrent cette partie (`everywhere/tests/`).
- Si le comportement réel du code ne correspond pas à ce que le paquet décrit dans « Contexte technique »,
  Claude ne corrige pas le paquet de lui-même : il le signale (section 8).
- On ne refait pas un audit complet à chaque paquet : on lit seulement ce que le changement touche.

## 5. Exécuter les instructions

- Une branche par paquet (ou par ensemble cohérent de paquets, si le paquet le dit), créée depuis `origin/main`.
  Nom : celui du paquet, sinon `feature/ow-<nom-court>`.
- Modifier **uniquement** les fichiers listés, et seulement ce qui est demandé.
- Respecter strictement « Éléments interdits de modification ».
- Passer l'état à **en cours** dans [STATUS.md](STATUS.md).
- Si une instruction ne peut pas être appliquée telle quelle : ne pas improviser une variante, appliquer
  la section 8.

Interdits permanents, sauf autorisation **écrite par Sébastien** dans le fil :

- modifier `main` directement, fusionner une Pull Request, déployer ;
- modifier Supabase (test ou production), les secrets, ou une configuration de production ;
- supprimer un fichier non listé ;
- créer une automatisation externe, un jeton ou un secret ;
- engager une dépense.

## 6. Lancer les tests

| Type de paquet | Contrôles |
|---|---|
| Documentation seule | `git diff --name-status origin/main` limité aux fichiers listés ; liens relatifs vérifiés (chaque fichier cité existe) ; texte confronté au dépôt réel |
| Application | Tests Playwright concernés dans `everywhere/tests/` (mode d'emploi : `everywhere/README.md`, section « Lancer les tests ») ; ils tournent en local avec un faux Supabase (`tests/fake-supabase.js`) et ne touchent aucune base |
| SQL | Uniquement sur une copie locale ou sur la base de TEST, et seulement si le paquet l'autorise. Jamais sur la production |

Règles :

- Avant de modifier l'application, lancer les mêmes tests sur `main` pour connaître l'état de départ.
  Un échec déjà présent sur `main` est noté comme tel, pas attribué au paquet.
- Écrire les résultats **réels et chiffrés** (exemple : `e2e 115/115`). Un test non lancé est écrit
  « non lancé » avec la raison. Jamais « réussi » sans exécution.
- Ne jamais désactiver, supprimer ou contourner un test pour obtenir un résultat vert.
- Le dépôt n'a **pas** de tests automatiques lancés sur les Pull Requests (le seul workflow est
  `.github/workflows/robot-veille.yml`) : les résultats sont ceux lancés par Claude dans son environnement.
- Ce qui ne peut être vu que sur un vrai téléphone Android est listé dans « Reste à vérifier sur téléphone ».

## 7. Produire le compte rendu

1. Commit sur la branche, message `OW-WRITE-NNN : <objet>`.
2. Pousser la branche, ouvrir la Pull Request `OW-WRITE-NNN — <objet>`, **sans la fusionner**.
3. Remplir [REPORT-TEMPLATE.md](REPORT-TEMPLATE.md) et le mettre :
   - dans la description de la Pull Request (lisible par ChatGPT) ;
   - dans le fil, en texte simple, pour Sébastien.
4. Passer l'état à **terminé** dans [STATUS.md](STATUS.md), avec commit, PR et résultat des tests.
   Comme STATUS.md est modifié dans la branche du paquet, le SHA du commit final ne peut pas y figurer
   (il change en l'écrivant) : on y met le SHA du commit de travail, et le SHA définitif est dans le rapport.

## 8. Signaler un paquet incomplet ou contradictoire

Cas d'arrêt :

- rubrique indispensable absente (identifiant, dépôt, objectif, fichiers concernés, interdits, tests, critères) ;
- instruction qui contredit une autre instruction, un interdit du paquet ou un interdit permanent ;
- fichier ou fonction cités qui n'existent pas, ou code réel différent du contexte décrit ;
- dépendance non fusionnée, conflit avec une autre branche ou une autre PR ouverte ;
- action qui demanderait une autorisation non donnée (production, Supabase, secret, dépense).

Conduite :

1. Ne rien pousser de partiel sans le dire. Passer l'état à **bloqué** (dans le fil ; dans STATUS.md à la prochaine PR).
2. Écrire dans le fil, en texte simple : ce qui bloque, ce qui a été vérifié, et une question fermée
   avec une option recommandée (exemple : « Option A : … ; option B : … ; je recommande A »).
3. Attendre la réponse de Sébastien (ou un paquet corrigé `vN`). Ne pas choisir à sa place.

## 9. États d'un paquet

| État | Sens | Qui le décide |
|---|---|---|
| reçu | Texte collé dans le fil, identifiant vérifié | Claude |
| en cours | Branche créée, travail commencé | Claude |
| bloqué | Arrêt, décision attendue (section 8) | Claude, levé par Sébastien |
| terminé | PR ouverte, tests réellement lancés, rapport fourni | Claude |
| validé | Sébastien a **fusionné** la PR **et** la vérification après fusion est faite (fichiers présents dans `main`, ou site vérifié en ligne pour un changement visible) | Sébastien (fusion), constaté par Claude |

Un paquet exécuté n'est **jamais** déclaré validé par Claude seul. Une PR fermée sans fusion repasse à **bloqué**
ou est marquée « abandonné » dans la colonne Résultat.

## 10. Transmission entre ChatGPT et Claude

### Ce qui existe vraiment

- ChatGPT et Claude ne sont **reliés par rien d'automatique**. Tout passe par Sébastien.
- Claude écrit dans ce dépôt : branches, commits, Pull Requests (vérifié avec OW-WRITE-001, PR 77).
- Claude n'est réveillé que par un message dans son fil, ou par l'activité d'une PR qu'il suit.
  Il n'est **pas** réveillé par une nouvelle issue ni par un fichier ajouté au dépôt.
- ChatGPT : d'après les consignes de Sébastien, il ne peut pas écrire sur GitHub et lit les Pull Requests
  en lecture seule. Le dépôt est public, donc `main` et les PR sont lisibles sans compte.
  (Note : le 5 oct. 2026, ChatGPT avait déclaré que son connecteur GitHub pouvait écrire dans le dépôt de test ;
  à revérifier côté ChatGPT si l'on veut un jour s'en servir. Ce protocole ne compte pas dessus.)

### Comparaison des moyens

| Moyen | Aller (ChatGPT → Claude) | Retour (Claude → ChatGPT) | Sur Android | Verdict |
|---|---|---|---|---|
| Coller le paquet dans le fil Claude | 1 collage | — | Simple, déjà rodé | **Retenu pour l'aller** |
| Issue GitHub | Sébastien doit créer l'issue dans l'appli ou le site GitHub, puis prévenir Claude quand même dans le fil | Commentaire possible | 2 étapes au lieu d'1 | Non retenu |
| Fichier Markdown dans `docs/paquets/` | ChatGPT ne peut pas écrire ; Sébastien devrait éditer un fichier sur GitHub depuis le téléphone | Lecture possible | Pénible | Non retenu pour l'aller |
| Pull Request dédiée | Ne sert pas à l'aller | Description de PR lisible par ChatGPT | Un lien à envoyer | **Retenu pour le retour** |
| Action GitHub « @claude » | Possible en théorie | Possible | — | **Exclu** : demande une clé API payante stockée en secret |

### Mécanisme recommandé

1. **Aller** : Sébastien colle le paquet dans le fil Claude (un seul collage, comme aujourd'hui).
2. **Retour** : Claude met le paquet reçu et le rapport complet dans la **description de la PR**, et tient
   [STATUS.md](STATUS.md) à jour. Sébastien n'envoie à ChatGPT **que le lien de la PR** (une ligne),
   au lieu de recopier tout le rapport. ChatGPT lit la PR, puis STATUS.md sur `main` après fusion.
3. Si ChatGPT n'arrive pas à lire une PR, Sébastien recopie le rapport texte que Claude met aussi dans le fil (solution de secours).

Résultat : un collage long à l'aller, un lien court au retour, aucune automatisation, aucun jeton, aucun secret.
