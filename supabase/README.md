# Base de données et fonctions serveur de 24/24 Talk

Ce dossier décrit le serveur Supabase (projet `wsgcumnaltdinchsdovs`, Paris).
Il sert à relire, comparer et reconstruire la base. **Rien ici ne s'applique tout seul** :
aucune migration n'est envoyée en production sans l'accord écrit de Sébastien.

## Contenu

| Dossier | Ce qu'il contient |
|---|---|
| `migrations/` | Les 14 migrations appliquées en production, à l'identique (empreintes vérifiées le 3 octobre 2026), plus `20261003000000_etat_reel_hors_migrations.sql`, qui rattrape ce qui avait été changé en production sans migration. |
| `functions/call-push/` | Le code de la fonction serveur des notifications d'appel, tel que déployé (version 3). |
| `config.toml` | Le réglage `verify_jwt = false` de `call-push`, identique à la production. |
| `tests/` | Une imitation minimale de Supabase et des tests des règles d'accès, à lancer sur un PostgreSQL local. |

## Vérifier sans toucher à la production

```sh
# PostgreSQL local vide, puis :
PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run_local.sh
```

Le script crée une base temporaire, rejoue toutes les migrations, lance `tests/test_*.sql`
puis supprime la base. Il vérifie notamment qu'un tiers ne lit pas une discussion privée,
que le blocage cache les messages et empêche d'écrire, et que les statistiques restent
réservées à l'administrateur.

## Règle pour la suite

Tout changement de la base passe par un nouveau fichier dans `migrations/`, relu en pull
request, testé avec `run_local.sh`, puis appliqué en production seulement après accord.
Ne jamais désactiver RLS.
