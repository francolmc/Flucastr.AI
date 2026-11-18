# 5. instalar.sh --simular no escribe lo que instala
paso 5 "instalar.sh --simular no escribe lo que instala"
autoprueba_5a || exit 1
echo "-- 5b. instalar.sh --simular sobre el home real"
antes=$(instantanea) || fallo "no pude tomar la instantánea previa"
bash instalar.sh --simular >/dev/null || fallo "instalar.sh --simular salió con error"
despues=$(instantanea) || fallo "no pude tomar la instantánea posterior"
if [ "$antes" != "$despues" ]; then
  diff <(printf '%s\n' "$antes") <(printf '%s\n' "$despues") >&2 || true
  fallo "instalar.sh --simular cambió lo que instala (ver diff arriba)"
fi
echo "ok instantánea sin cambios ($(printf '%s\n' "$despues" | grep -c .) líneas)"

# Compara cada interfaz sobre el mismo entorno aislado, reiniciado antes de cada llamada.
(
  T=$(mktemp -d)
  trap 'rm -rf "$T"' EXIT
  preparar_alias() {
    rm -rf "$T/home" "$T/mi proyecto"
    mkdir -p "$T/home/.pi/agent" "$T/mi proyecto/definitions"
    printf 'ejemplo\n' > "$T/mi proyecto/definitions/ejemplo.md"
  }
  correr_alias() {
    local nombre=$1 script=$2
    shift 2
    preparar_alias
    local antes_alias
    antes_alias=$( ( cd "$T"; find home 'mi proyecto' -print | sort; find home 'mi proyecto' -type f -exec sha256sum {} + | sort; find home 'mi proyecto' -type l -printf '%p -> %l\n' | sort ) )
    local codigo=0
    ( unset PI_CODING_AGENT_DIR CODEX_HOME FLUCASTR_MODELOS; export HOME="$T/home"; bash "$script" "$@" ) >"$T/$nombre.salida" 2>&1 || codigo=$?
    printf '%s\n' "$codigo" > "$T/$nombre.estado"
    ( cd "$T"; find home 'mi proyecto' -print | sort; find home 'mi proyecto' -type f -exec sha256sum {} + | sort; find home 'mi proyecto' -type l -printf '%p -> %l\n' | sort ) > "$T/$nombre.efectos"
    if [[ " $* " == *' --simular '* || " $* " == *' --dry-run '* ]]; then
      [ "$antes_alias" = "$(cat "$T/$nombre.efectos")" ] || fallo "5c: simulación escribió archivos"
    fi
  }
  comparar_alias() {
    local tipo=$1
    shift
    correr_alias es instalar.sh "$@"
    case "$tipo" in
      simulacion) correr_alias en install.sh --dry-run --copy --only pi --project "$T/mi proyecto" --agent constructor --project-skills ;;
      instalacion) correr_alias en install.sh --copy --only pi --project "$T/mi proyecto" --agent constructor --project-skills ;;
      migracion) correr_alias en install.sh --migrate "$T/mi proyecto" ;;
      mezclado) correr_alias en install.sh --dry-run --solo pi --project "$T/mi proyecto" --agente constructor --project-skills ;;
      faltante) correr_alias en install.sh --project ;;
      invalido) correr_alias en install.sh --migrate "$T/mi proyecto" --project "$T/mi proyecto" ;;
    esac
    cmp "$T/es.salida" "$T/en.salida" && cmp "$T/es.estado" "$T/en.estado" && cmp "$T/es.efectos" "$T/en.efectos" || fallo "5c: equivalencia $tipo"
    if [[ "$tipo" = faltante || "$tipo" = invalido ]]; then
      [ "$(cat "$T/en.estado")" != 0 ] || fallo "5c: $tipo debía fallar"
    else
      [ "$(cat "$T/en.estado")" = 0 ] || fallo "5c: $tipo debía funcionar"
    fi
  }
  comparar_alias simulacion --simular --copiar --solo pi --proyecto "$T/mi proyecto" --agente constructor --skills-proyecto
  comparar_alias instalacion --copiar --solo pi --proyecto "$T/mi proyecto" --agente constructor --skills-proyecto
  comparar_alias migracion --migrar "$T/mi proyecto"
  comparar_alias mezclado --simular --solo pi --proyecto "$T/mi proyecto" --agente constructor --skills-proyecto
  comparar_alias faltante --proyecto
  comparar_alias invalido --migrar "$T/mi proyecto" --proyecto "$T/mi proyecto"
  # Mutación en copia: quitar un alias debe romper la comparación, sin tocar el producto.
  sed 's/--simular | --dry-run)/--simular)/' instalar.sh > "$T/instalador-mutado.sh"
  if ( unset PI_CODING_AGENT_DIR CODEX_HOME FLUCASTR_MODELOS; export HOME="$T/home"; bash "$T/instalador-mutado.sh" --dry-run ) >"$T/mutacion" 2>&1; then
    fallo "5c: la mutación del alias pasó"
  fi
  grep -q 'Opción desconocida: --dry-run' "$T/mutacion" || fallo "5c: la mutación no falló por el alias"
  echo 'ok 5c: alias, mezclas, instalación, migración, errores y mutación aislada'
)

# Las entradas remotas son autónomas e idénticas; toda red queda interceptada.
(
  T=$(mktemp -d)
  trap 'rm -rf "$T"' EXIT
  cmp instalar-remoto.sh install-remote.sh || fallo '5e: entradas remotas desincronizadas'
  mkdir -p "$T/es" "$T/en" "$T/origen" "$T/bin"
  cp instalar-remoto.sh "$T/es/entrada.sh"
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
  comparar_remoto urls --mostrar-urls --show-urls 0
  comparar_remoto estado --estado --status 0
  comparar_remoto actual --actualizar --update 0
  comparar_remoto ausente --actualizar --update 1
  comparar_remoto paquete --actualizar --update 1
  grep -q 'RECHAZADO: el paquete no se puede leer' "$T/en.salida" || fallo '5e: paquete inválido no rechazado'
  sed 's/--estado | --status)/--estado)/' install-remote.sh > "$T/en/mutado.sh"
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
    ( unset PI_CODING_AGENT_DIR CODEX_HOME FLUCASTR_MODELOS; export HOME="$T/home"; bash instalar.sh --copiar --solo pi --proyecto "$T/mi proyecto" --skills-proyecto ) > "$T/preparacion" 2>&1 || fallo '5d: preparación falló'
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
    if [[ " $* " == *' --simular '* || " $* " == *' --dry-run '* ]]; then
      [ "$antes" = "$(cat "$T/$nombre.efectos")" ] || fallo '5d: simulación escribió archivos'
    fi
  }
  comparar_desinstalacion() {
    local tipo=$1
    case "$tipo" in
      simulacion) correr_desinstalacion es desinstalar.sh --simular; correr_desinstalacion en uninstall.sh --dry-run ;;
      proyecto) correr_desinstalacion es desinstalar.sh --proyecto "$T/mi proyecto"; correr_desinstalacion en uninstall.sh --project "$T/mi proyecto" ;;
      silencio) correr_desinstalacion es desinstalar.sh --silencioso; correr_desinstalacion en uninstall.sh --quiet ;;
      todo) correr_desinstalacion es desinstalar.sh --todo; correr_desinstalacion en uninstall.sh --all ;;
      ajustes) correr_desinstalacion es desinstalar.sh --conservar-ajustes; correr_desinstalacion en uninstall.sh --keep-settings ;;
      mezcla) correr_desinstalacion es desinstalar.sh --simular --proyecto "$T/mi proyecto" --silencioso --conservar-ajustes; correr_desinstalacion en uninstall.sh --dry-run --proyecto "$T/mi proyecto" --quiet --conservar-ajustes ;;
      faltante) correr_desinstalacion es desinstalar.sh --proyecto; correr_desinstalacion en uninstall.sh --project ;;
    esac
    cmp "$T/es.salida" "$T/en.salida" && cmp "$T/es.estado" "$T/en.estado" && cmp "$T/es.efectos" "$T/en.efectos" || fallo "5d: equivalencia $tipo"
    if [ "$tipo" = faltante ]; then
      [ "$(cat "$T/en.estado")" != 0 ] || fallo '5d: argumento ausente debía fallar'
    else
      [ "$(cat "$T/en.estado")" = 0 ] || fallo "5d: $tipo debía funcionar"
    fi
  }
  for caso in simulacion proyecto silencio todo ajustes mezcla faltante; do comparar_desinstalacion "$caso"; done
  sed 's/--proyecto | --project)/--proyecto)/' desinstalar.sh > "$T/mutado.sh"
  correr_desinstalacion mutado "$T/mutado.sh" --project
  if cmp -s "$T/es.salida" "$T/mutado.salida"; then fallo '5d: mutación no detectada'; fi
  grep -q 'Opción desconocida: --project' "$T/mutado.salida" || fallo '5d: mutación no falló por el alias'
  echo 'ok 5d: equivalencia de desinstalación, errores y mutación aislada'
)
