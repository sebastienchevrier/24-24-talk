# Socle de la base 24/24 ONE WORLD

Ce dossier corrige le constat **F-30** de l'audit du 3 novembre 2026. Avant lui, plusieurs fonctions de sécurité n'avaient aucune source dans le dépôt, notamment `private.session_active()`, `private.is_suspended()` et `private.is_admin()`. Il était donc impossible de reconstruire la base à partir du dépôt.

| Fichier | Rôle |
|---|---|
| `00-socle-schema.sql` | Schéma complet : 32 tables, 55 fonctions, 61 règles et 6 règles temps réel, 13 déclencheurs, droits. Relevé **en lecture seule** sur la base de TEST le 4 nov. 2026. |
| `bouchons-supabase-local.sql` | Imitation minimale de Supabase (auth, realtime, rôles) pour un PostgreSQL local. |
| `essais-socle.sql` | Inventaire, plus 10 essais de comportement : admin, bienvenue, discussion, session révoquée, compte suspendu. |
| `reconstruire.sh` | Part d'une base **vide**, charge les bouchons, puis le socle, puis les essais. Chaque échec arrête tout. |

Lancer : `bash supabase/base/reconstruire.sh`. Le workflow « Socle base reconstruit » le relance à chaque modification.

**Limites, dites franchement :**
- C'est l'état du **TEST**. La PROD n'a pas pu être relue et peut différer : par exemple les restes d'abonnement B7 ou la liste des origines des statistiques. Une comparaison PROD reste à faire, en lecture seule, avec l'accord de Sébastien.
- Les données de réglage ne sont pas dans le dépôt : `billing_settings`, `stats_origins`, `admins`, et surtout `push_config`, qui contient des clés secrètes et n'y sera jamais.
- La reconstruction est prouvée sur PostgreSQL 16 avec des bouchons. Ce n'est pas une restauration sur un vrai projet Supabase.
