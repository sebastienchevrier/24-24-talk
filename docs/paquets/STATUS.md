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
| OW-WRITE-002 | Protocole d'exécution et de transmission (`PROTOCOL.md`, `STATUS.md`, `REPORT-TEMPLATE.md`) | 2026-11-01 | `feature/ow-packet-protocol` | terminé (PR ouverte, à fusionner par Sébastien) | voir rapport de la PR | voir rapport de la PR | Contrôles documentaires : diff limité aux fichiers prévus, liens internes valides |
