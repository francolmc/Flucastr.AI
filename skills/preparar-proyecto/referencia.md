# Verify skeleton (web + API + PostgreSQL + email)

Starting point for adaptation. Names, ports, and paths are examples. Confirm Mailpit API URLs at `http://localhost:8025/api/v1/` while the container is running.

## `verify`

```bash
#!/usr/bin/env bash
# Clean build -> real startup -> real journey. Exits with a nonzero code at the first broken stage.
# With VERIFY_RAPIDO=1, the build uses cache (for iteration); omit the variable for final acceptance.
# With VERIFY_TARGET=<url>, run only the journey against an already deployed environment (without Docker).
set -euo pipefail
cd "$(dirname "$0")"

paso() { printf '\n== %s ==\n' "$1"; }

# Remote mode: VERIFY_TARGET=https://... ./verify. Read-only unless VERIFY_PERMITIR_ESCRITURA=1.
if [ -n "${VERIFY_TARGET:-}" ]; then
  case "$VERIFY_TARGET" in
    http://*|https://*) ;;
    *) echo "VERIFY_TARGET debe empezar por http:// o https://: $VERIFY_TARGET" >&2; exit 1 ;;
  esac
  API_URL="${API_URL:-$VERIFY_TARGET}"
  WEB_URL="${WEB_URL:-$VERIFY_TARGET}"
  SOLO_LECTURA=1
  if [ "${VERIFY_PERMITIR_ESCRITURA:-0}" = 1 ]; then SOLO_LECTURA=0; fi
  ESCRIBE=sí
  if grep -q '^# VERIFY_ESCRIBE: no' verify-flujo.sh; then ESCRIBE=no; fi
  echo "MODO REMOTO: $VERIFY_TARGET"
  if [ "$SOLO_LECTURA" = 1 ] && [ "$ESCRIBE" = sí ]; then
    echo "OMITIDO: el recorrido escribe (# VERIFY_ESCRIBE: sí); para permitirlo: VERIFY_PERMITIR_ESCRITURA=1"
  fi
  paso "Recorrido real (remoto)"
  API_URL="$API_URL" WEB_URL="$WEB_URL" MAILPIT_URL="${MAILPIT_URL:-}" VERIFY_SOLO_LECTURA="$SOLO_LECTURA" ./verify-flujo.sh
  if [ "$SOLO_LECTURA" = 1 ]; then echo "VERIFY OK (solo lectura)"; else echo "VERIFY OK"; fi
  exit 0
fi

PROYECTO="verify_$$"
C="docker compose -p $PROYECTO -f docker-compose.verify.yml"
API_URL="http://localhost:${API_PORT:-3000}"
WEB_URL="http://localhost:${WEB_PORT:-8080}"

limpiar() { $C down -v --remove-orphans >/dev/null 2>&1 || true; }
trap limpiar EXIT

esperar() { # url
  for _ in $(seq 1 60); do
    curl -fsS "$1" >/dev/null 2>&1 && return 0
    sleep 2
  done
  echo "No responde: $1" >&2
  $C logs --tail=50 >&2 || true
  return 1
}

paso "1/4 Build limpio"
if [ "${VERIFY_RAPIDO:-0}" = 1 ]; then $C build; else $C build --no-cache; fi

paso "2/4 Arranque"
$C up -d --wait            # waits for running|healthy (the database has a health check)
esperar "$API_URL/health"
esperar "$WEB_URL/"

paso "3/4 Recorrido real"
API_URL="$API_URL" WEB_URL="$WEB_URL" MAILPIT_URL="http://localhost:8025" ./verify-flujo.sh

paso "4/4 Listo"
echo "VERIFY OK"
```

## `docker-compose.verify.yml`

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 3s
      timeout: 3s
      retries: 20

  mailpit:
    image: axllent/mailpit
    ports: ["8025:8025"]          # UI and REST API; SMTP on internal port 1025

  api:
    build: ./api                  # the same Dockerfile used in production
    env_file: .env.example        # same variables as production; only the values change
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/app
      SMTP_HOST: mailpit
      SMTP_PORT: "1025"
    depends_on:
      db: { condition: service_healthy }
    ports: ["${API_PORT:-3000}:3000"]

  web:
    build: ./web                  # the same Dockerfile used in production
    depends_on: [api]
    ports: ["${WEB_PORT:-8080}:80"]
```

## `verify-flujo.sh`

This is the only part that really changes between projects: the key end-to-end journey.

```bash
#!/usr/bin/env bash
# VERIFY_ESCRIBE: sí
# Example journey: request access -> read the email -> sign in. Adapt it to your workflow.
# "Lectura" always runs; "Escritura" is skipped with VERIFY_SOLO_LECTURA=1 (remote mode).
set -euo pipefail

# --- Read-only: writes nothing ---
comprobar() { curl -fsS "$1" >/dev/null || { echo "Falla: $1" >&2; exit 1; }; }
comprobar "$API_URL/health"
comprobar "$WEB_URL/"
echo "Lectura OK"

if [ "${VERIFY_SOLO_LECTURA:-0}" = 1 ]; then
  echo "Escritura: omitida (solo lectura)"
  exit 0
fi

# --- Write: creates marked test data (verify-<pid>@example.invalid) ---
MAILPIT_URL="${MAILPIT_URL:?define MAILPIT_URL para el recorrido de escritura}"
EMAIL="verify-$$@example.invalid"

# 1) Request access from the API (adjust the route and body).
curl -fsS -X POST "$API_URL/auth/request-access" \
  -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\"}" >/dev/null

# 2) Wait for the email in Mailpit (adjust the search to its API).
for _ in $(seq 1 30); do
  MENSAJE="$(curl -fsS "$MAILPIT_URL/api/v1/search?query=to:$EMAIL" || true)"
  echo "$MENSAJE" | grep -q "$EMAIL" && break
  sleep 1
done
echo "$MENSAJE" | grep -q "$EMAIL" || { echo "No llegó el correo a $EMAIL" >&2; exit 1; }

# 3) Extract the link or code from the email and complete sign-in.
#    (Read the message by ID through the Mailpit API and check the API response.)
echo "TODO: completar los pasos 3 en adelante con el flujo real del proyecto" >&2
exit 1
```

The final `exit 1` is intentional: an unfinished journey **must not pass**. Remove it when the workflow is complete. It belongs inside the "Escritura" section.

The first line declares whether the journey writes: `# VERIFY_ESCRIBE: sí` or `no`. If absent, treat it as `sí`. With `VERIFY_TARGET` (remote mode) and without `VERIFY_PERMITIR_ESCRITURA=1`, `verify` skips writes with an "OMITIDO" notice and succeeds only if the read-only journey passed ("solo lectura").
