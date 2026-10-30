#!/usr/bin/env bash
# Instala Flucastr.AI sin clon: consulta a GitHub el sha de main (o de --ref), descarga ese sha como tar.gz,
# lo verifica, lo deja en ~/.flucastr-ai/kit/ y corre instalar.sh --copiar. Escribe ~/.flucastr-ai/version al final.
# Uso: bash instalar-remoto.sh [--estado] [--actualizar] [--mostrar-urls] [--ref <rama o sha>]
#   sin opciones : instala si no hay nada; si ya hay una versión, dice «al día» o la actualiza.
#   --actualizar : lo mismo cuando ya hay instalación; sin instalación previa sale con 1.
#   --estado     : compara la versión instalada con la publicada; no descarga ni escribe.
#   --mostrar-urls: imprime las URLs que usa; no se conecta.
#   --ref <valor>: rama o sha que se consulta (por defecto main).
# Variable FLUCASTR_ORIGEN: carpeta local con `sha` y `kit.tar.gz` (para pruebas, sin red). Sin ella, usa GitHub.
if [ -z "${BASH_VERSION:-}" ]; then
  echo "Ejecuta con bash: bash instalar-remoto.sh" >&2
  exit 1
fi
set -euo pipefail

REPO="francolmc/Flucastr.AI"
ESTADO_DIR="$HOME/.flucastr-ai"
MANIFIESTO="$ESTADO_DIR/manifiesto.txt"
ACCION=instalar
REF=main
TMP=""

uso() {
  cat <<'EOF'
Uso: bash instalar-remoto.sh [--estado] [--actualizar] [--mostrar-urls] [--ref <rama o sha>]
  sin opciones    instala la versión publicada; si ya hay una, la actualiza (o dice que está al día)
  --actualizar    igual que sin opciones cuando ya hay instalación; sin instalación previa sale con 1
  --estado        compara la versión instalada con la publicada; no descarga ni escribe
  --mostrar-urls  imprime las URLs que usa; no se conecta
  --ref <valor>   rama o sha que se consulta (por defecto main)
EOF
}

limpiar() {
  if [ -n "$TMP" ]; then rm -rf "$TMP"; fi
  rm -rf "$ESTADO_DIR/kit.nuevo" "$ESTADO_DIR/version.tmp"
  rmdir "$ESTADO_DIR/tmp" 2>/dev/null || true
}
trap limpiar EXIT

while [ $# -gt 0 ]; do
  case "$1" in
    --estado) ACCION=estado ;;
    --actualizar) ACCION=actualizar ;;
    --mostrar-urls) ACCION=urls ;;
    --ref)
      shift
      REF="${1:-}"
      ;;
    -h | --help) uso; exit 0 ;;
    *) echo "Opción desconocida: $1" >&2; uso >&2; exit 1 ;;
  esac
  shift
done

if ! printf '%s' "$REF" | grep -Eq '^[A-Za-z0-9._/-]+$'; then
  echo "--ref no es válido: '$REF'" >&2
  exit 1
fi

if [ "$ACCION" = urls ]; then
  echo "script: https://raw.githubusercontent.com/$REPO/main/instalar-remoto.sh"
  echo "sha: https://api.github.com/repos/$REPO/commits/$REF"
  echo "descarga: https://codeload.github.com/$REPO/tar.gz/<sha>"
  exit 0
fi

# Lo que necesita cada acción. Se comprueba antes de escribir nada.
if [ "$ACCION" = estado ]; then
  if [ -z "${FLUCASTR_ORIGEN:-}" ] && ! command -v curl >/dev/null 2>&1; then
    echo "Falta curl: se necesita para consultar GitHub." >&2
    exit 1
  fi
else
  faltan=""
  for c in node tar curl; do
    if [ "$c" = curl ] && [ -n "${FLUCASTR_ORIGEN:-}" ]; then continue; fi
    command -v "$c" >/dev/null 2>&1 || faltan="$faltan $c"
  done
  if [ -n "$faltan" ]; then
    echo "Faltan herramientas:$faltan. Se necesitan node, tar y curl." >&2
    exit 1
  fi
fi

# Solo lee el manifiesto: una instalación en modo repo no se cambia a descarga sin desinstalar antes.
if [ "$ACCION" != estado ] && [ -f "$MANIFIESTO" ]; then
  IFS=$'\t' read -r p_tipo p_valor _ < "$MANIFIESTO" || true
  MODO_ANTERIOR=repo
  if [ "${p_tipo:-}" = modo ]; then MODO_ANTERIOR="${p_valor:-repo}"; fi
  if [ "$MODO_ANTERIOR" != descarga ]; then
    echo "Hay una instalación en modo $MODO_ANTERIOR; ejecuta desinstalar.sh antes de cambiar de modo." >&2
    exit 1
  fi
fi

if [ "$ACCION" = actualizar ] && [ ! -f "$ESTADO_DIR/version" ]; then
  echo "No hay instalación; corre el comando sin --actualizar." >&2
  exit 1
fi

obtener_sha() {
  local sha
  if [ -n "${FLUCASTR_ORIGEN:-}" ]; then
    [ -f "$FLUCASTR_ORIGEN/sha" ] || { echo "No encuentro $FLUCASTR_ORIGEN/sha" >&2; exit 1; }
    sha="$(head -n 1 "$FLUCASTR_ORIGEN/sha" | tr -d '\r')"
  else
    sha="$(curl --fail --silent --show-error --proto '=https' --max-time 120 \
      -H 'Accept: application/vnd.github.sha' \
      "https://api.github.com/repos/$REPO/commits/$REF")" \
      || { echo "No pude consultar GitHub para el commit de '$REF'." >&2; exit 1; }
  fi
  if ! printf '%s' "$sha" | grep -Eq '^[0-9a-f]{40}$'; then
    echo "El sha recibido no es válido: '$sha'" >&2
    exit 1
  fi
  printf '%s' "$sha"
}

version_instalada() { # imprime el sha instalado, o nada
  [ -f "$ESTADO_DIR/version" ] || return 0
  sed -n 's/^sha=//p' "$ESTADO_DIR/version" | head -n 1
}

descargar() { # destino sha
  if [ -n "${FLUCASTR_ORIGEN:-}" ]; then
    [ -f "$FLUCASTR_ORIGEN/kit.tar.gz" ] || { echo "No encuentro $FLUCASTR_ORIGEN/kit.tar.gz" >&2; exit 1; }
    cp "$FLUCASTR_ORIGEN/kit.tar.gz" "$1"
  else
    curl --fail --silent --show-error --proto '=https' --max-time 120 --max-filesize 20971520 \
      -o "$1" "https://codeload.github.com/$REPO/tar.gz/$2" \
      || { echo "No pude descargar el paquete $2." >&2; exit 1; }
  fi
}

# Antes de extraer: solo archivos y carpetas, sin rutas absolutas ni componentes «..».
verificar_tar() { # archivo
  local archivo="$1" nombre linea
  if ! tar -tzf "$archivo" > "$TMP/lista.txt" 2>/dev/null || ! tar -tvzf "$archivo" > "$TMP/detalle.txt" 2>/dev/null; then
    echo "RECHAZADO: el paquete no se puede leer como tar.gz." >&2
    return 1
  fi
  while IFS= read -r nombre; do
    case "$nombre" in
      /*) echo "RECHAZADO: ruta absoluta: $nombre" >&2; return 1 ;;
    esac
    case "/$nombre/" in
      */../*) echo "RECHAZADO: ruta con '..': $nombre" >&2; return 1 ;;
    esac
  done < "$TMP/lista.txt"
  while IFS= read -r linea; do
    case "${linea:0:1}" in
      - | d) ;;
      *) echo "RECHAZADO: entrada que no es archivo ni carpeta: $linea" >&2; return 1 ;;
    esac
  done < "$TMP/detalle.txt"
  return 0
}

comprobar_contenido() { # carpeta extraída
  local d="$1" r f hay_agente=0 hay_skill=0
  for r in instalar.sh desinstalar.sh modelos.json scripts/resolver.mjs; do
    [ -f "$d/$r" ] || { echo "RECHAZADO: falta $r" >&2; exit 1; }
  done
  for f in "$d"/agentes/*.md; do [ -f "$f" ] && hay_agente=1; done
  [ "$hay_agente" = 1 ] || { echo "RECHAZADO: falta agentes/*.md" >&2; exit 1; }
  for f in "$d"/skills/*/SKILL.md; do [ -f "$f" ] && hay_skill=1; done
  [ "$hay_skill" = 1 ] || { echo "RECHAZADO: falta skills/*/SKILL.md" >&2; exit 1; }
}

# Solo las rutas de la lista permitida; pruebas/, definitions/, features/ y README.md no se copian.
copiar_permitidas() { # origen destino
  local o="$1" d="$2" f
  for f in agentes skills scripts; do
    if [ -d "$o/$f" ]; then cp -R "$o/$f" "$d/$f"; fi
  done
  for f in instalar.sh desinstalar.sh instalar-remoto.sh modelos.json; do
    if [ -f "$o/$f" ]; then cp "$o/$f" "$d/$f"; fi
  done
  return 0
}

nuevo_tmp() {
  mkdir -p "$ESTADO_DIR/tmp"
  TMP="$(mktemp -d "$ESTADO_DIR/tmp/inst.XXXXXX")"
}

# Descarga el sha, lo verifica, lo extrae y deja el kit armado en kit.nuevo/. No toca kit/.
preparar_kit_nuevo() { # sha
  echo "Descargando $1..."
  descargar "$TMP/kit.tar.gz" "$1"
  verificar_tar "$TMP/kit.tar.gz" || exit 1
  mkdir "$TMP/extraido"
  tar -xzf "$TMP/kit.tar.gz" -C "$TMP/extraido" --strip-components=1
  comprobar_contenido "$TMP/extraido"
  rm -rf "$ESTADO_DIR/kit.nuevo"
  mkdir "$ESTADO_DIR/kit.nuevo"
  copiar_permitidas "$TMP/extraido" "$ESTADO_DIR/kit.nuevo"
}

# Antes de mover nada: el modelos.json que usaría la instalación (el personal, o el del paquete si aún no hay)
# debe servir para todos los agentes del kit nuevo.
validar_modelos_kit() { # carpeta del kit nuevo
  local d="$1" modelos f a h
  modelos="$ESTADO_DIR/modelos.json"
  if [ ! -f "$modelos" ]; then modelos="$d/modelos.json"; fi
  for f in "$d"/agentes/*.md; do
    [ -f "$f" ] || continue
    a="$(basename "$f" .md)"
    for h in claude-code pi; do
      if ! FLUCASTR_MODELOS="$modelos" node "$d/scripts/resolver.mjs" modelo "$a" "$h" > /dev/null; then
        echo "El modelos.json que usaría la instalación ($modelos) no sirve para el agente '$a' con $h. No se cambió nada; corrígelo o bórralo para que se regenere." >&2
        return 1
      fi
    done
  done
}

# Ensayo de instalar.sh --simular del kit nuevo: no escribe nada y detecta antes de tocar lo que instalar.sh detecta
# (por ejemplo, un agente que declara `model`). Así una falla no deja el manifiesto vacío a mitad de la actualización.
simular_kit() { # carpeta del kit nuevo
  if ! bash "$1/instalar.sh" --copiar --simular < /dev/null > "$TMP/simulacion.txt" 2>&1; then
    cat "$TMP/simulacion.txt" >&2
    echo "El instalar.sh del kit nuevo no pasa su validación; no se cambió nada." >&2
    return 1
  fi
}

escribir_version() { # sha
  local fecha
  fecha="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf 'sha=%s\nfecha=%s\nref=%s\n' "$1" "$fecha" "$REF" > "$ESTADO_DIR/version.tmp"
  mv "$ESTADO_DIR/version.tmp" "$ESTADO_DIR/version"
}

# Diferencias entre el modelos.json personal y el publicado (kit.nuevo/). Una línea por diferencia; nada si no hay. No cambia nada.
diferencias_modelos() {
  local personal="$ESTADO_DIR/modelos.json"
  if [ ! -f "$personal" ]; then return 0; fi
  node "$ESTADO_DIR/kit.nuevo/scripts/resolver.mjs" comparar-modelos "$personal" "$ESTADO_DIR/kit.nuevo/modelos.json"
}

if [ "$ACCION" = estado ]; then
  SHA="$(obtener_sha)"
  INSTALADA="$(version_instalada)"
  echo "instalada: ${INSTALADA:-ninguna}"
  echo "publicada: $SHA"
  if [ -z "$INSTALADA" ]; then
    echo "no instalado"
  elif [ "$INSTALADA" = "$SHA" ]; then
    echo "al día"
  else
    echo "hay versión nueva"
  fi
  exit 0
fi

SHA="$(obtener_sha)"
INSTALADA="$(version_instalada)"
if [ -n "$INSTALADA" ]; then
  if [ "$INSTALADA" = "$SHA" ]; then
    echo "al día ($SHA)"
    exit 0
  fi

  # Actualización atómica: kit/ -> kit.anterior/ y kit.nuevo/ -> kit/; si algo falla, vuelve la versión anterior.
  if [ -e "$ESTADO_DIR/kit.anterior" ]; then
    echo "Hay una carpeta $ESTADO_DIR/kit.anterior de una actualización interrumpida; revísala y bórrala antes de actualizar." >&2
    exit 1
  fi
  nuevo_tmp
  preparar_kit_nuevo "$SHA"
  validar_modelos_kit "$ESTADO_DIR/kit.nuevo" || exit 1
  simular_kit "$ESTADO_DIR/kit.nuevo" || exit 1
  DIFERENCIAS="$(diferencias_modelos)" || exit 1

  mv "$ESTADO_DIR/kit" "$ESTADO_DIR/kit.anterior"
  mv "$ESTADO_DIR/kit.nuevo" "$ESTADO_DIR/kit"
  if ! bash "$ESTADO_DIR/kit/instalar.sh" --copiar < /dev/null; then
    rm -rf "$ESTADO_DIR/kit"
    cp -R "$ESTADO_DIR/kit.anterior" "$ESTADO_DIR/kit"
    if bash "$ESTADO_DIR/kit/instalar.sh" --copiar < /dev/null; then
      rm -rf "$ESTADO_DIR/kit.anterior"
      echo "FALLÓ la actualización; se restauró la versión anterior ($INSTALADA)." >&2
    else
      echo "FALLÓ la actualización y tampoco se pudo reinstalar la versión anterior ($INSTALADA). Su copia está en $ESTADO_DIR/kit.anterior" >&2
    fi
    exit 1
  fi
  escribir_version "$SHA"
  rm -rf "$ESTADO_DIR/kit.anterior"
  echo "Actualizado: $INSTALADA -> $SHA"
  if [ -n "$DIFERENCIAS" ]; then
    echo "AVISO: el modelos.json publicado trae cambios; compáralo con el tuyo:"
    printf '%s\n' "$DIFERENCIAS" | while IFS= read -r linea; do echo "  $linea"; done
    echo "  diff ~/.flucastr-ai/modelos.json ~/.flucastr-ai/kit/modelos.json"
  fi
  exit 0
fi

if [ -e "$ESTADO_DIR/kit" ]; then
  echo "Hay una carpeta $ESTADO_DIR/kit sin version (instalación incompleta). Ejecuta desinstalar.sh o bórrala." >&2
  exit 1
fi

nuevo_tmp
preparar_kit_nuevo "$SHA"
validar_modelos_kit "$ESTADO_DIR/kit.nuevo" || exit 1
mv "$ESTADO_DIR/kit.nuevo" "$ESTADO_DIR/kit"

if ! bash "$ESTADO_DIR/kit/instalar.sh" --copiar < /dev/null; then
  echo "La instalación falló; no se escribió version." >&2
  if [ -f "$ESTADO_DIR/kit/desinstalar.sh" ]; then
    bash "$ESTADO_DIR/kit/desinstalar.sh" --silencioso < /dev/null || true
  fi
  rm -rf "$ESTADO_DIR/kit"
  exit 1
fi

escribir_version "$SHA"
echo "Instalado: $SHA"
