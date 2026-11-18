# 5. install.sh --dry-run no escribe lo que instala
paso 5 "install.sh --dry-run no escribe lo que instala"
autoprueba_5a || exit 1
echo "-- 5b. install.sh --dry-run sobre el home real"
antes=$(instantanea) || fallo "no pude tomar la instantánea previa"
bash install.sh --dry-run >/dev/null || fallo "install.sh --dry-run salió con error"
despues=$(instantanea) || fallo "no pude tomar la instantánea posterior"
if [ "$antes" != "$despues" ]; then
  diff <(printf '%s\n' "$antes") <(printf '%s\n' "$despues") >&2 || true
  fallo "install.sh --dry-run cambió lo que instala (ver diff arriba)"
fi
echo "ok instantánea sin cambios ($(printf '%s\n' "$despues" | grep -c .) líneas)"

# Compara cada interfaz sobre el mismo entorno aislado, reiniciado antes de cada llamada.
(
  T=$(mktemp -d)
  trap 'rm -rf "$T"' EXIT
  preparar_entrada() {
    rm -rf "$T/home" "$T/mi proyecto"
    mkdir -p "$T/home/.pi/agent" "$T/mi proyecto/definitions"
    printf 'ejemplo\n' > "$T/mi proyecto/definitions/ejemplo.md"
  }
  correr_entrada() {
    local nombre=$1 script=$2
    shift 2
    preparar_entrada
    local antes_entrada
    antes_entrada=$( ( cd "$T"; find home 'mi proyecto' -print | sort; find home 'mi proyecto' -type f -exec sha256sum {} + | sort; find home 'mi proyecto' -type l -printf '%p -> %l\n' | sort ) )
    local codigo=0
    ( unset PI_CODING_AGENT_DIR CODEX_HOME FLUCASTR_MODELOS; export HOME="$T/home"; bash "$script" "$@" ) >"$T/$nombre.salida" 2>&1 || codigo=$?
    printf '%s\n' "$codigo" > "$T/$nombre.estado"
    ( cd "$T"; find home 'mi proyecto' -print | sort; find home 'mi proyecto' -type f -exec sha256sum {} + | sort; find home 'mi proyecto' -type l -printf '%p -> %l\n' | sort ) > "$T/$nombre.efectos"
    if [[ " $* " == *' --dry-run '* ]]; then
      [ "$antes_entrada" = "$(cat "$T/$nombre.efectos")" ] || fallo "5c: simulación escribió archivos"
    fi
  }
  comparar_entrada() {
    local tipo=$1
    shift
    correr_entrada es install.sh "$@"
    case "$tipo" in
      simulacion) correr_entrada en install.sh --dry-run --copy --only pi --project "$T/mi proyecto" --agent builder --project-skills ;;
      instalacion) correr_entrada en install.sh --copy --only pi --project "$T/mi proyecto" --agent builder --project-skills ;;
      migracion) correr_entrada en install.sh --migrate "$T/mi proyecto" ;;
      mezclado) correr_entrada en install.sh --dry-run --only pi --project "$T/mi proyecto" --agent builder --project-skills ;;
      faltante) correr_entrada en install.sh --project ;;
      invalido) correr_entrada en install.sh --migrate "$T/mi proyecto" --project "$T/mi proyecto" ;;
    esac
    cmp "$T/es.salida" "$T/en.salida" && cmp "$T/es.estado" "$T/en.estado" && cmp "$T/es.efectos" "$T/en.efectos" || fallo "5c: equivalencia $tipo"
    if [[ "$tipo" = faltante || "$tipo" = invalido ]]; then
      [ "$(cat "$T/en.estado")" != 0 ] || fallo "5c: $tipo debía fallar"
    else
      [ "$(cat "$T/en.estado")" = 0 ] || fallo "5c: $tipo debía funcionar"
    fi
  }
  comparar_entrada simulacion --dry-run --copy --only pi --project "$T/mi proyecto" --agent builder --project-skills
  comparar_entrada instalacion --copy --only pi --project "$T/mi proyecto" --agent builder --project-skills
  comparar_entrada migracion --migrate "$T/mi proyecto"
  comparar_entrada mezclado --dry-run --only pi --project "$T/mi proyecto" --agent builder --project-skills
  comparar_entrada faltante --project
  comparar_entrada invalido --migrate "$T/mi proyecto" --project "$T/mi proyecto"
  # Mutación en copia: cambiar una opción debe romper la comparación, sin tocar el producto.
  sed 's/^    --dry-run) /    --dry-run-x) /' install.sh > "$T/instalador-mutado.sh"
  if ( unset PI_CODING_AGENT_DIR CODEX_HOME FLUCASTR_MODELOS; export HOME="$T/home"; bash "$T/instalador-mutado.sh" --dry-run ) >"$T/mutacion" 2>&1; then
    fallo "5c: la mutación de la opción pasó"
  fi
  grep -q 'Opción desconocida: --dry-run' "$T/mutacion" || fallo "5c: la mutación no falló por la opción"
  echo 'ok 5c: opciones, mezclas, instalación, migración, errores y mutación aislada'
)

# Las entradas remotas son autónomas e idénticas; toda red queda interceptada.
(
  T=$(mktemp -d)
  trap 'rm -rf "$T"' EXIT
  cmp install-remote.sh install-remote.sh || fallo '5e: entradas remotas desincronizadas'
  mkdir -p "$T/es" "$T/en" "$T/origen" "$T/bin"
  cp install-remote.sh "$T/es/entrada.sh"
  cp install-remote.sh "$T/en/entrada.sh"
  printf '#!/usr/bin/env bash\nprintf red > "$REMOTE_TEST_RED"\nexit 99\n' > "$T/bin/curl"
  chmod +x "$T/bin/curl"
  printf '%040d\n' 1 > "$T/origen/sha"
  printf 'paquete inválido\n' > "$T/origen/kit.tar.gz"
  correr_remoto() {
    local nombre=$1 escenario=$2 opcion=$3 script=$4 codigo=0
    rm -rf "$T/home" "$T/red"
    mkdir -p "$T/home"
    case "$escenario" in
      actual|paquete) mkdir -p "$T/home/.flucastr-ai/kit"; printf 'sha=%040d\n' 1 > "$T/home/.flucastr-ai/version" ;;
    esac
    if [ "$escenario" = paquete ]; then printf 'sha=%040d\n' 2 > "$T/home/.flucastr-ai/version"; fi
    ( unset CODEX_HOME PI_CODING_AGENT_DIR FLUCASTR_MODELOS; export HOME="$T/home" FLUCASTR_ORIGEN="$T/origen" REMOTE_TEST_RED="$T/red" PATH="$T/bin:$PATH"; cd "$T/$nombre"; bash "$script" "$opcion" ) > "$T/$nombre.salida" 2>&1 || codigo=$?
    printf '%s\n' "$codigo" > "$T/$nombre.estado"
    ( cd "$T"; find home -print | sort; find home -type f -exec sha256sum {} + | sort; find home -type l -printf '%p -> %l\n' | sort ) > "$T/$nombre.efectos"
    [ ! -e "$T/red" ] || fallo '5e: se intentó usar la red'
  }
  comparar_remoto() {
    local escenario=$1 es=$2 en=$3 esperado=$4
    correr_remoto es "$escenario" "$es" entrada.sh
    correr_remoto en "$escenario" "$en" entrada.sh
    cmp "$T/es.salida" "$T/en.salida" && cmp "$T/es.estado" "$T/en.estado" && cmp "$T/es.efectos" "$T/en.efectos" || fallo "5e: equivalencia $escenario"
    [ "$(cat "$T/en.estado")" = "$esperado" ] || fallo "5e: estado inesperado en $escenario"
  }
  comparar_remoto urls --show-urls --show-urls 0
  comparar_remoto estado --status --status 0
  comparar_remoto actual --update --update 0
  comparar_remoto ausente --update --update 1
  comparar_remoto paquete --update --update 1
  grep -q 'RECHAZADO: el paquete no se puede leer' "$T/en.salida" || fallo '5e: paquete inválido no rechazado'
  sed 's/^    --status) /    --status-x) /' install-remote.sh > "$T/en/mutado.sh"
  correr_remoto en estado --status mutado.sh
  grep -q 'Opción desconocida: --status' "$T/en.salida" || fallo '5e: mutación no detectada'
  echo 'ok 5e: entradas remotas aisladas, equivalencia, errores y sincronización sin red'
)

# Desinstalar pares sobre una instalación real reproducida en cada entorno temporal.
(
  T=$(mktemp -d)
  trap 'rm -rf "$T"' EXIT
  preparar_desinstalacion() {
    rm -rf "$T/home" "$T/mi proyecto"
    mkdir -p "$T/home/.pi/agent" "$T/mi proyecto"
    ( unset PI_CODING_AGENT_DIR CODEX_HOME FLUCASTR_MODELOS; export HOME="$T/home"; bash install.sh --copy --only pi --project "$T/mi proyecto" --project-skills ) > "$T/preparacion" 2>&1 || fallo '5d: preparación falló'
  }
  arbol_desinstalacion() {
    ( cd "$T"; find home 'mi proyecto' -print | sort; find home 'mi proyecto' -type f -exec sha256sum {} + | sort; find home 'mi proyecto' -type l -printf '%p -> %l\n' | sort )
  }
  correr_desinstalacion() {
    local nombre=$1 script=$2
    shift 2
    preparar_desinstalacion
    local antes codigo=0
    antes=$(arbol_desinstalacion)
    ( unset PI_CODING_AGENT_DIR CODEX_HOME FLUCASTR_MODELOS; export HOME="$T/home"; bash "$script" "$@" ) > "$T/$nombre.salida" 2>&1 || codigo=$?
    printf '%s\n' "$codigo" > "$T/$nombre.estado"
    arbol_desinstalacion > "$T/$nombre.efectos"
    if [[ " $* " == *' --dry-run '* ]]; then
      [ "$antes" = "$(cat "$T/$nombre.efectos")" ] || fallo '5d: simulación escribió archivos'
    fi
  }
  comparar_desinstalacion() {
    local tipo=$1
    case "$tipo" in
      simulacion) correr_desinstalacion es uninstall.sh --dry-run; correr_desinstalacion en uninstall.sh --dry-run ;;
      proyecto) correr_desinstalacion es uninstall.sh --project "$T/mi proyecto"; correr_desinstalacion en uninstall.sh --project "$T/mi proyecto" ;;
      silencio) correr_desinstalacion es uninstall.sh --quiet; correr_desinstalacion en uninstall.sh --quiet ;;
      todo) correr_desinstalacion es uninstall.sh --all; correr_desinstalacion en uninstall.sh --all ;;
      ajustes) correr_desinstalacion es uninstall.sh --keep-settings; correr_desinstalacion en uninstall.sh --keep-settings ;;
      mezcla) correr_desinstalacion es uninstall.sh --dry-run --project "$T/mi proyecto" --quiet --keep-settings; correr_desinstalacion en uninstall.sh --dry-run --project "$T/mi proyecto" --quiet --keep-settings ;;
      faltante) correr_desinstalacion es uninstall.sh --project; correr_desinstalacion en uninstall.sh --project ;;
    esac
    cmp "$T/es.salida" "$T/en.salida" && cmp "$T/es.estado" "$T/en.estado" && cmp "$T/es.efectos" "$T/en.efectos" || fallo "5d: equivalencia $tipo"
    if [ "$tipo" = faltante ]; then
      [ "$(cat "$T/en.estado")" != 0 ] || fallo '5d: argumento ausente debía fallar'
    else
      [ "$(cat "$T/en.estado")" = 0 ] || fallo "5d: $tipo debía funcionar"
    fi
  }
  for caso in simulacion proyecto silencio todo ajustes mezcla faltante; do comparar_desinstalacion "$caso"; done
  sed 's/^    --project)/    --project-x)/' uninstall.sh > "$T/mutado.sh"
  correr_desinstalacion mutado "$T/mutado.sh" --project
  if cmp -s "$T/es.salida" "$T/mutado.salida"; then fallo '5d: mutación no detectada'; fi
  grep -q 'Opción desconocida: --project' "$T/mutado.salida" || fallo '5d: mutación no falló por la opción'
  echo 'ok 5d: equivalencia de desinstalación, errores y mutación aislada'
)
