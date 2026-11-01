# Registre des paquets OW-WRITE

> © 2026 Sébastien Chevrier. Tous droits réservés.

Une ligne par paquet. États possibles : **reçu**, **en cours**, **terminé**, **bloqué**, **validé**
(définitions : [PROTOCOL.md](PROTOCOL.md), section 9).

Un paquet n'est **validé** que lorsque Sébastien a fusionné sa Pull Request **et** que la vérification après fusion
est faite. Un paquet simplement exécuté reste **terminé**.

Chaque paquet met à jour sa propre ligne dans sa Pull Request. Les dates sont en UTC.

| Identifiant | Objectif | Date | Branche | État | Commit | Pull Request | Tests |
|---|---|---|---|---|---|---|---|
| OW-WRITE-001 | Mise en place du système de paquets (`README.md`, `TEMPLATE.md`) | 2026-11-01 | `feature/ow-packet-system` | validé (PR fusionnée le 2026-11-01 05:04 ; fichiers vérifiés dans `main` f766b73) | `0b3240b` | [#77](https://github.com/sebastienchevrier/24-24-talk/pull/77) | Contrôles documentaires : diff limité à 2 fichiers, liens internes valides |
| OW-WRITE-002 | Protocole d'exécution et de transmission (`PROTOCOL.md`, `STATUS.md`, `REPORT-TEMPLATE.md`) | 2026-11-01 | `feature/ow-packet-protocol` | validé (PR fusionnée le 2026-11-01 05:18 ; fichiers vérifiés dans `main` 3179a2e) | `e39a729` | [#78](https://github.com/sebastienchevrier/24-24-talk/pull/78) | Contrôles documentaires : diff limité aux fichiers prévus, liens internes valides |
| OW-WRITE-003 | Première expérience : écran d'accueil et inscription (possibilités réelles, bouton orange, lisibilité, 2 colonnes sur grand écran) | 2026-11-01 | `feature/ow-first-experience` | terminé (PR fusionnée le 2026-11-01 05:35 dans `main` 35a6d02 ; vérification sur téléphone Android pas encore faite) | `8aed1e1` | [#79](https://github.com/sebastienchevrier/24-24-talk/pull/79) | e2e 115/115, piliers 57/57, toucher 18/18, papier 9/9, terre 24/24, parcours 13/13 |
| OW-WRITE-004 | Identité visuelle d'après la capture Android (bleu nuit, cartes, icônes vertes, barre du bas) puis accueil façon capture (en-tête, Bonjour Prénom, tuiles 2 colonnes, sans affiche Terre) | 2026-11-01 | `feature/ow-global-visual-identity` | terminé (PR fusionnée le 2026-11-01 06:26 dans `main` 942a6e8 ; vérification sur téléphone Android pas encore faite) | `ade179f`, `c678da6` | [#80](https://github.com/sebastienchevrier/24-24-talk/pull/80) | e2e 113/115 (2 tests figeaient l'ancien rendu, repris par OW-WRITE-005), piliers 57/57, toucher 18/18, espaces 22/22, visio 16/16, terre 24/24, papier 9/9, profil-voyage 43/43 |
| OW-WRITE-005 | Finition de l'identité : 2 tests e2e sur le nouveau rendu, puces Community/Business, registre | 2026-11-01 | `feature/ow-visual-polish-005` | terminé (PR ouverte, à fusionner par Sébastien) | voir rapport de la PR | voir rapport de la PR | voir rapport de la PR |
