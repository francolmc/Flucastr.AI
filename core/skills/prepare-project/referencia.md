# Esqueleto de verify (web + API + PostgreSQL + correo)

Punto de partida para adaptar. Nombres, puertos y rutas son de ejemplo. Las URLs de la API de Mailpit se confirman en `http://localhost:8025/api/v1/` con el contenedor corriendo.

## `verify`

```bash
#!/usr/bin/env bash
# Build limpio -> arranque real -> recorrido real. Sale con código != 0 en el primer escalón roto.
# Con VERIFY_RAPIDO=1 el build usa caché (para iterar); la corrida final de aceptación va sin la variable.
# Con VERIFY_TARGET=<url> corre solo el recorrido contra un entorno ya desplegado (sin docker).
set -euo pipefail
cd "$(dirname "$0")"

paso() { printf '\n== %s ==\n' "$1"; }

# Modo remoto: VERIFY_TARGET=https://... ./verify. Solo lectura, salvo VERIFY_PERMITIR_ESCRITURA=1.
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
$C up -d --wait            # espera a running|healthy (la base de datos tiene healthcheck)
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
    ports: ["8025:8025"]          # interfaz y API REST; SMTP en el 1025 interno

  api:
    build: ./api                  # el mismo Dockerfile que va a producción
    env_file: .env.example        # mismas variables que producción; solo cambian los valores
    environment:
      DATABASE_URL: postgresql://app:app@db:5432/app
      SMTP_HOST: mailpit
      SMTP_PORT: "1025"
    depends_on:
      db: { condition: service_healthy }
    ports: ["${API_PORT:-3000}:3000"]

  web:
    build: ./web                  # el mismo Dockerfile que va a producción
    depends_on: [api]
    ports: ["${WEB_PORT:-8080}:80"]
```

## `verify-flujo.sh`

Es lo único que cambia de verdad entre proyectos: el recorrido clave de punta a punta.

```bash
#!/usr/bin/env bash
# VERIFY_ESCRIBE: sí
# Recorrido de ejemplo: pedir acceso -> leer el correo -> entrar. Adaptar a tu flujo.
# «Lectura» corre siempre; «Escritura» se salta con VERIFY_SOLO_LECTURA=1 (modo remoto).
set -euo pipefail

# --- Lectura: no escribe nada ---
comprobar() { curl -fsS "$1" >/dev/null || { echo "Falla: $1" >&2; exit 1; }; }
comprobar "$API_URL/health"
comprobar "$WEB_URL/"
echo "Lectura OK"

if [ "${VERIFY_SOLO_LECTURA:-0}" = 1 ]; then
  echo "Escritura: omitida (solo lectura)"
  exit 0
fi

# --- Escritura: crea datos de prueba marcados (verify-<pid>@example.invalid) ---
MAILPIT_URL="${MAILPIT_URL:?define MAILPIT_URL para el recorrido de escritura}"
EMAIL="verify-$$@example.invalid"

# 1) Pedir acceso al API (ajusta la ruta y el cuerpo).
curl -fsS -X POST "$API_URL/auth/request-access" \
  -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\"}" >/dev/null

# 2) Esperar el correo en Mailpit (ajusta la búsqueda según su API).
for _ in $(seq 1 30); do
  MENSAJE="$(curl -fsS "$MAILPIT_URL/api/v1/search?query=to:$EMAIL" || true)"
  echo "$MENSAJE" | grep -q "$EMAIL" && break
  sleep 1
done
echo "$MENSAJE" | grep -q "$EMAIL" || { echo "No llegó el correo a $EMAIL" >&2; exit 1; }

# 3) Extraer el enlace o código del correo y completar el acceso.
#    (Leer el mensaje por su ID con la API de Mailpit y comprobar la respuesta del API.)
echo "TODO: completar los pasos 3 en adelante con el flujo real del proyecto" >&2
exit 1
```

El `exit 1` final es deliberado: un recorrido a medio escribir **no debe pasar**. Se quita cuando el flujo está completo. Vive dentro de la sección «Escritura».

La primera línea declara si el recorrido escribe: `# VERIFY_ESCRIBE: sí` o `no`. Si falta, se trata como `sí`. Con `VERIFY_TARGET` (modo remoto) y sin `VERIFY_PERMITIR_ESCRITURA=1`, `verify` omite la escritura con un aviso «OMITIDO» y termina bien solo si la lectura pasó («solo lectura»).
