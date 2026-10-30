# Lot 4 — PR 69 / Android : relecture et essais (30 octobre 2026)

Branche `claude/audit-lot4-android`, posée sur la PR 69 (`claude/inscription-anim` e560c48). Essais sur Chromium
avec caméra et micro factices et faux serveur. **Aucun vrai téléphone.**

## Correctif : changer de caméra (avant ↔ arrière) sur les téléphones à une seule caméra ouverte

- **Fichier et fonction** : `index.html`, `toggleCamFacing()`.
- **Cause** : la nouvelle caméra était demandée pendant que l'ancienne restait ouverte. Beaucoup de téléphones Android
  refusent d'ouvrir deux caméras à la fois (`NotReadableError`). L'appli affichait alors « caméra prise » et le bouton
  « Retourner » ne marchait jamais sur ces téléphones.
- **Changement** : si la demande échoue avec `NotReadableError` ou `AbortError`, l'ancienne caméra est libérée et la
  demande refaite. Si elle échoue encore, l'ancienne caméra est rouverte (l'autre personne garde une image) et le
  message d'erreur s'affiche. Les vérifications « appel toujours en cours » restent après chaque attente.
- **Essai ajouté** (`everywhere/tests/visio.js`, mode « single » : refuse une 2e caméra tant qu'une autre est ouverte) :
  - avant : ÉCHEC (15/16) ;
  - après : OK, avec l'aperçu mis à jour, l'ancienne image arrêtée, aucun message et la vidéo qui continue chez l'autre (16/16).
- **Risque restant** : pendant le changement, l'autre personne voit l'image figée une fraction de seconde. Certains
  téléphones peuvent mettre plus longtemps. À voir sur un vrai Android.

## Correctif : nouvel essai rapide après une erreur à l'inscription

- **Fichier et fonction** : `index.html`, `owEtat()` (bouton « Créer mon compte »).
- **Cause** : après une erreur, l'effacement de l'état était programmé 1,6 s plus tard sans pouvoir être annulé. Un
  nouvel appui dans ce délai voyait son « chargement » effacé en cours de route : la roue disparaissait alors que la
  demande tournait encore.
- **Changement** : chaque nouvel état annule l'effacement prévu (un minuteur par bouton).
- **Essai ajouté** (`everywhere/tests/toucher.js`, qui reprend `owEtat` tel qu'il est écrit dans `index.html`) :
  - avant : ÉCHEC, l'état passe à `null` (17/18) ;
  - après : OK, l'état reste `loading` (18/18).

## Relecture d'OWMotion (`everywhere/toucher.js`) : courses possibles

- Doigts multiples, relâchement, défilement, page cachée, réglage « réduire les animations » : gérés, et essayés
  (toucher 17/17).
- P2 : si l'appli change elle-même `disabled` pendant un chargement, la fin du chargement remet l'ancienne valeur.
  Ce cas n'arrive pas aujourd'hui : le seul usage (`owEtat`, « Créer mon compte ») appelle `loading` avec
  `disable: false` et gère `disabled` lui-même.
- P2 : l'état « réussite » (lueur orange) reste posé sur le bouton jusqu'à la prochaine action. C'est voulu, mais à
  confirmer à l'œil.
- P2 : deux chargements en même temps sur le même bouton : le premier fini réactive le bouton. Ce n'est pas possible
  aujourd'hui, car le bouton est désactivé pendant le chargement.

## Essais relancés sur la branche

| Essai | Résultat |
|---|---|
| toucher (boutons) | 18/18 |
| terre (globe, hors ligne, service worker) | 21/21 |
| visio (caméra, coupures, délais, changement) | 16/16 |
| espaces | 20/20 |
| e2e (inscription, traductions, cache, TALK) | 115/115 |

## Ce qui demande un vrai téléphone

- Le toucher réel du globe (glisser, pincer) et la fluidité sur un Android d'entrée de gamme.
- Le changement de caméra avant/arrière sur 2 ou 3 Android différents, puis sur un iPhone.
- Les coupures réelles : appel téléphonique entrant pendant une visio, appli mise en arrière-plan, écran verrouillé.
- La vibration courte au toucher (Android seulement).
