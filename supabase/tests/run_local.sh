#!/usr/bin/env bash
# Rejoue toutes les migrations sur une base PostgreSQL locale vide, puis les tests SQL.
# Usage : PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run_local.sh
# Les migrations temp_http* sont ignorées : elles s'annulent deux à deux et l'extension
# « http » n'existe pas sur un PostgreSQL ordinaire.
set -euo pipefail
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
cd "$(dirname "$0")/.."
DB=test_2424_$$
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database $DB"
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/stub_supabase.sql
for f in migrations/*.sql; do
  case "$f" in *temp_http*|*remove_temp_http*) continue ;; esac
  echo "migration  $(basename "$f")"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"
done
for t in tests/test_*.sql; do
  [ -e "$t" ] || continue
  echo "test       $(basename "$t")"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$t"
done
echo "OK"
