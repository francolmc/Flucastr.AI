> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

# Aislamiento para la línea base

## Comprobado durante el diagnóstico

En este entorno `bwrap` permite crear un espacio de usuario y una raíz temporal. Se comprobó que `/home/persona` no existe dentro de una raíz mínima y que `/Users` puede estar vacío. Node no está en `/usr`: se ejecutó correctamente la versión 24.22.1 montando solo el ejecutable en `/runtime/node`, con `/usr` de solo lectura y sin montar el HOME. Esto prueba los montajes básicos, no prueba que `verify` completo pueda ejecutarse allí.

## Diseño de ejecución del tramo 1

1. Preparar fuera del HOME real una copia temporal de los archivos necesarios del checkout, sin `.git`, `old/v1/registro/`, `pruebas/.temporales/`, secretos ni credenciales. Excluir también este plan de la huella de producto. No copiar directorios de proyectos externos. Conservar permisos y contenido de todos los archivos necesarios para las pruebas; si no es posible hacerlo sin leer información protegida, detenerse y registrar el archivo afectado.
2. Presentar con Bubblewrap una raíz temporal vacía, `/usr` de solo lectura, sus enlaces habituales `/bin`, `/lib` y `/lib64`, `/proc`, `/dev`, `/tmp` temporal, `/Users` vacío y `/home` temporal. Montar únicamente la copia en `/work`, Node en `/runtime/node`, Codex CLI si está disponible en `/runtime/codex` y el ejecutable real de `awk` en `/runtime/awk`; `HOME` y `CODEX_HOME` apuntan a directorios nuevos dentro del aislamiento y `PATH` es `/runtime:/usr/bin:/bin`. Limpiar el entorno heredado y añadir solo las variables mínimas necesarias; no heredar `PI_CODING_AGENT_DIR` ni rutas de proyectos. No montar el HOME real ni el directorio de trabajo original.
3. Comprobar desde dentro que el HOME real y la ruta absoluta del escenario 9 no existen y que la copia es la única vista del repositorio; comprobar disponibilidad de Bash, Node, Git y demás herramientas requeridas. Ejecutar desde `/work` y usar un directorio temporal aislado para resultados. Usar un espacio de red aislado si todas las pruebas son offline; si ello altera los escenarios, documentar la diferencia y detenerse en vez de dar por equivalente la referencia.
4. Antes de aceptar la línea base, comparar las ramas opcionales de `verify` determinadas por herramientas presentes. En particular, Codex puede activar comprobaciones adicionales; registrar su disponibilidad y no afirmar equivalencia si al aislarlo cambia la cobertura. `awk` es requisito de migración: en este host `/usr/bin/awk` apunta a `/etc/alternatives/awk`, pero `/etc` no se monta. Resolver el enlace en el host y montar solo su destino ejecutable como `/runtime/awk`; comprobar que carga con `/usr`, `/lib` y `/lib64` de solo lectura. No montar `/etc` ni configuraciones del host. No montar otros ejecutables o configuraciones hasta verificar sus dependencias y que no expongan datos privados.
5. Registrar salidas, códigos, tiempos y efectos sanitizados. Ejecutar dos simulaciones idénticas y verificar ausencia de cambios; después ejecutar `verify`. Si faltan dependencias o falla, documentar la causa y parar sin modificar producto ni pruebas.

## Cuestiones que el tramo 1 debe resolver antes de medir

`pruebas/uso/probar.mjs` exige que exista `pruebas/uso/fixtures/codex/auth.json`, aunque el diagnóstico no leyó su contenido. Excluir el archivo original y crear el fixture sintético descrito abajo; registrar explícitamente la adaptación, sin afirmar equivalencia de bytes. Si no conserva el caso probado, detenerse. También debe comprobarse si la copia sin `.git` cambia alguna prueba y si la ausencia de `/etc` u otras herramientas cambia resultados. Resuelto durante el tramo 1: las dos simulaciones coinciden y `verify` pasa con el fixture sintético, la copia sin `.git` y las herramientas declaradas; los resultados están registrados en `plan.md`.

## Fixture de credenciales sintético

La prueba `pruebas/uso/probar.mjs` exige la existencia de `fixtures/codex/auth.json` y comprueba que el marcador literal `SECRETO-NO-LEER` no aparezca en ninguna salida. El código de `scripts/uso.mjs` construye la raíz Codex como `sessions/` y solo recorre archivos `rollout-*.jsonl` allí. En la copia temporal se creó el archivo sintético con ese marcador, sin leer ni copiar el original. Esto conserva el caso de un archivo marcado fuera de `sessions/` y verifica que no se expone; no demuestra identidad de bytes con el fixture original, por lo que queda anotado como adaptación de aislamiento. La rama del CLI Codex se conservó usando el ejecutable disponible y HOME/CODEX_HOME sintéticos; `verify` íntegro pasó.

## Preparación reproducible y puertas

La receta ejecutable está en [reproducir-linea-base.sh](reproducir-linea-base.sh). Correrla desde la raíz del checkout copia el estado de trabajo versionado y no ignorado, sin `.git`, `old/v1/registro/`, `pruebas/.temporales/`, `cambios/estructura-repo/`, fixtures de credenciales ni archivos de secretos. No sigue enlaces simbólicos: los conserva solo si apuntan dentro del checkout. El fixture requerido por la prueba de uso se crea con un marcador sintético. Ejecuta la simulación dos veces y luego `verify` en la misma copia y el mismo aislamiento. Se puede usar tras cada tramo para comparar contra [la línea base sanitizada](linea-base/). El bloque de abajo documenta el orden y es idéntico al script ejecutable.

```bash
set -euo pipefail
ROOT=$(pwd -P)
STAGE=$(mktemp -d)
WORK=$STAGE/work
mkdir -p "$WORK"
while IFS= read -r -d '' rel; do
  case "/$rel/" in
    */.git/*|*/old/v1/registro/*|*/pruebas/.temporales/*|*/cambios/estructura-repo/*|*/secrets/*|*/credentials/*) continue ;;
  esac
  name=${rel##*/}
  case "$name" in
    .env|.env.*|auth.json|id_rsa|id_ed25519|*.pem|*.key|*.p12|*.pfx) [ "$name" = .env.example ] || continue ;;
  esac
  src=$ROOT/$rel
  if [ -L "$src" ]; then
    target=$(realpath -m "$src")
    case "$target" in "$ROOT"/*) ;; *) continue ;; esac
    mkdir -p "$WORK/$(dirname "$rel")"
    cp -a -- "$src" "$WORK/$rel"
  elif [ -f "$src" ]; then
    mkdir -p "$WORK/$(dirname "$rel")"
    cp -p -- "$src" "$WORK/$rel"
  fi
done < <(git ls-files -z --cached --others --exclude-standard)
mkdir -p "$WORK/pruebas/uso/fixtures/codex"
printf 'SECRETO-NO-LEER\n' > "$WORK/pruebas/uso/fixtures/codex/auth.json"

NODE_BIN=$(realpath "$(command -v node)")
AWK_BIN=$(realpath "$(command -v awk)")
CODEX_BIN=$(command -v codex || true)
MOUNTS=(--ro-bind "$NODE_BIN" /runtime/node --ro-bind "$AWK_BIN" /runtime/awk)
if [ -n "$CODEX_BIN" ]; then MOUNTS+=(--ro-bind "$(realpath "$CODEX_BIN")" /runtime/codex); fi
for dir in /bin /lib /lib64; do
  if [ -e "$dir" ]; then MOUNTS+=(--ro-bind "$dir" "$dir"); fi
done
run_isolated() {
  printf 'set -euo pipefail\n%s\n' "$1" | bwrap --unshare-all --die-with-parent --ro-bind /usr /usr \
    --proc /proc --dev /dev --tmpfs /tmp \
    --dir /home --dir /home/test --dir /home/test/codex --dir /Users --dir /runtime \
    "${MOUNTS[@]}" \
    --bind "$WORK" /work --chdir /work --clearenv \
    --setenv HOME /home/test --setenv CODEX_HOME /home/test/codex \
    --setenv PATH /runtime:/usr/bin:/bin --setenv LANG C.UTF-8 --setenv TZ UTC \
    /usr/bin/bash
}
run_isolated 'for command in bash node git tar awk; do command -v "$command" >/dev/null || exit 127; done'
run_isolated 'node --version'
if [ -n "$CODEX_BIN" ]; then run_isolated '/runtime/codex --version'; fi
run_isolated 'awk --version | head -n 1'
run_isolated 'bash ./instalar.sh --simular' > "$STAGE/sim-1.raw" 2>&1
run_isolated 'bash ./instalar.sh --simular' > "$STAGE/sim-2.raw" 2>&1
set +e
run_isolated './verify' > "$STAGE/verify.raw" 2>&1
VERIFY_EXIT=$?
set -e
python3 - "$STAGE" "$VERIFY_EXIT" <<'PY'
import pathlib, re, sys
stage = pathlib.Path(sys.argv[1])
for source, target in [('sim-1.raw','sim-1.txt'), ('sim-2.raw','sim-2.txt'), ('verify.raw','verify.txt')]:
    text = (stage/source).read_text(errors='replace').replace('/home/test', '<SANDBOX_HOME>')
    text = re.sub(r"/Users/[^\s\"',;()]+", '<PROJECT_PATH>', text)
    text = re.sub(r"/tmp/[^\s\"',;()]+", '<SANDBOX_TMP>', text)
    text = re.sub(r'(?i)persona', '<PERSON>', text)
    text = re.sub(r'\(\d+(?:\.\d+)?ms\)', '(<DURATION>ms)', text)
    text = re.sub(r'(duration_ms )\d+(?:\.\d+)?', r'\1<DURATION>', text)
    (stage/target).write_text(text)
if (stage/'sim-1.txt').read_bytes() != (stage/'sim-2.txt').read_bytes():
    raise SystemExit('Las simulaciones difieren después de sanitizar.')
if sys.argv[2] != '0':
    raise SystemExit('verify falló; conservar verify.raw para diagnóstico local.')
PY
BASELINE=cambios/estructura-repo/linea-base
if [ "${SAVE_BASELINE:-0}" = 1 ]; then
  mkdir -p "$BASELINE"
  cp "$STAGE/sim-1.txt" "$BASELINE/instalar-simular-1.txt"
  cp "$STAGE/sim-2.txt" "$BASELINE/instalar-simular-2.txt"
  cp "$STAGE/verify.txt" "$BASELINE/verify.txt"
else
  cmp "$STAGE/sim-1.txt" "$BASELINE/instalar-simular-1.txt"
  cmp "$STAGE/sim-2.txt" "$BASELINE/instalar-simular-2.txt"
  python3 - "$STAGE/verify.txt" "$BASELINE/verify.txt" <<'PY'
import hashlib
import pathlib
import sys

actual_path, baseline_path = map(pathlib.Path, sys.argv[1:])
actual = actual_path.read_bytes().splitlines(keepends=True)
baseline = baseline_path.read_bytes().splitlines(keepends=True)
expected_actual = "ok escenario 9: fixture anónimo -> sin texto de workspace, aviso, git mv de definitions/ y features/, .gitignore en git status\n".encode()
expected_baseline_sha256 = "7a4adb2ac3710cdb65741335c1260dd4c2614bb2989e4f81013d0c85e8012946"
actual_delta = [line for line in actual if line == expected_actual]
baseline_delta = [line for line in baseline if hashlib.sha256(line).hexdigest() == expected_baseline_sha256]
if len(actual_delta) != 1 or len(baseline_delta) != 1:
    raise SystemExit("No coincide exactamente el mensaje único autorizado del escenario 9.")
actual.remove(actual_delta[0])
baseline.remove(baseline_delta[0])
if actual != baseline:
    raise SystemExit("verify difiere de la línea base fuera del mensaje autorizado.")
print("verify coincide salvo el mensaje exacto autorizado del escenario 9.")
PY
fi
printf 'Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.\n'
```

Las rutas de los ejecutables del host se resuelven en `NODE_BIN`, `AWK_BIN` y `CODEX_BIN`; el único comando que se monta es el ejecutable individual. La forma efectiva de Bubblewrap es el cuerpo de `run_isolated`: `--unshare-all --die-with-parent`, `/usr`, `/bin`, `/lib`, `/lib64` de solo lectura, `/proc`, `/dev`, `/tmp` aislado, `/home` y `/Users` sintéticos, la copia escribible en `/work`, y los ejecutables en `/runtime`; `--clearenv` establece HOME/CODEX_HOME sintéticos, PATH fijo, locale y zona horaria. No monta el checkout original, HOME real, `/etc` ni proyectos externos. El aislamiento de red está incluido en `--unshare-all`.

La sanitización del script también normaliza únicamente duraciones volátiles de Node como `<DURATION>`; el texto funcional, el orden, los códigos, los conteos y los avisos quedan comparables. Rutas privadas y de sandbox se reemplazan antes de persistir. Los tres archivos de `linea-base/` son las salidas completas de stdout+stderr con esta normalización. La variable opcional `SAVE_BASELINE=1` captura una nueva línea base aprobada; sin ella, la receta compara y falla si cualquier salida difiere. El script conserva los archivos versionados/no ignorados del estado de trabajo vigente; reconstruir la copia para cada versión que se compare.

Registrar fuera de la salida sanitizada si `codex` está disponible en el PATH original, sin ejecutarlo con configuración real. Si está disponible, para conservar la rama `execpolicy` montar solo el ejecutable y dependencias estrictamente necesarios de forma verificable, con HOME y CODEX_HOME sintéticos; si no es posible aislarlo o cambia el resultado de la rama, detenerse. Si no está disponible, registrar esa ausencia y conservarla en todas las comparaciones. Análogamente, detenerse si falta un archivo excluido que alguna prueba necesite o si la ausencia de `.git` cambia su cobertura: no copiar secretos ni suplantar el resultado. La primera corrida completa reveló que `awk` no se resolvía porque su enlace del host apunta a `/etc/alternatives/awk`, ausente del aislamiento. La repetición montó solo el ejecutable resuelto de `gawk` como `/runtime/awk`; `/usr`, `/lib` y `/lib64` aportaron sus dependencias en modo de solo lectura y `verify` pasó. No se expuso `/etc`. Guardar versiones y resultados de las comprobaciones sin imprimir rutas privadas.
