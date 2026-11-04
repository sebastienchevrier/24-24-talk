#!/usr/bin/env bash
# 24/24 ONE WORLD — preuve de reconstruction : base PostgreSQL 16 locale VIDE → bouchons Supabase → socle du dépôt → essais.
# N'utilise ni TEST ni PROD, aucun secret. Usage : bash supabase/base/reconstruire.sh
set -euo pipefail
ICI="$(cd "$(dirname "$0")" && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)}"
D="$(mktemp -d)"; PORT="${PORT:-55432}"
trap '"$PGBIN/pg_ctl" -D "$D/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
if [ "$(id -u)" = 0 ]; then RUN="runuser -u postgres --"; chown -R postgres "$D"; else RUN=""; fi
$RUN "$PGBIN/initdb" -D "$D/data" -U postgres -A trust >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$D/data" -o "-p $PORT -k $D -c listen_addresses=''" -l "$D/log" start -w >/dev/null
P() { $RUN psql -h "$D" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }
for f in bouchons-supabase-local.sql 00-socle-schema.sql essais-socle.sql; do echo "== $f"; P < "$ICI/$f"; done
# Correctifs posés après le socle (dans l'ordre), chacun suivi de ses essais s'il en a.
for f in 24-stats-anti-triche; do echo "== $f"; P < "$ICI/../$f.sql"; [ -f "$ICI/essais-${f#*-}.sql" ] && P < "$ICI/essais-${f#*-}.sql"; done
# Le retour arrière de chaque correctif doit aussi passer, puis le correctif doit pouvoir être reposé.
for f in 24-stats-anti-triche; do echo "== retour $f"; P < "$ICI/../$f-retour.sql"; P < "$ICI/../$f.sql"; done
echo "RECONSTRUCTION COMPLÈTE : OK"
