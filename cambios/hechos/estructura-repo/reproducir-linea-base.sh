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
    text = re.sub(r'(?i)franco', '<PERSON>', text)
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
expected_actual_8i = "ok 8i: planificar-cambio dice «salvo que la persona usuaria» sin «Falla la 2 o la 4»; principal dice «petición expresa»; copia con «Falla la 2 o la 4» falla\n".encode()
expected_baseline_8i = "ok 8i: planificar-cambio dice «salvo que <PERSON>» sin «Falla la 2 o la 4»; principal dice «petición expresa»; copia con «Falla la 2 o la 4» falla\n".encode()

def compare(actual_lines, baseline_lines):
    actual = list(actual_lines)
    baseline = list(baseline_lines)
    actual_delta = [line for line in actual if line == expected_actual]
    baseline_delta = [line for line in baseline if hashlib.sha256(line).hexdigest() == expected_baseline_sha256]
    if len(actual_delta) != 1 or len(baseline_delta) != 1:
        raise ValueError("No coincide exactamente el mensaje único autorizado del escenario 9.")
    actual.remove(actual_delta[0])
    baseline.remove(baseline_delta[0])

    actual_8i = [line for line in actual if line == expected_actual_8i]
    baseline_8i = [line for line in baseline if line == expected_baseline_8i]
    if len(actual_8i) != 1 or len(baseline_8i) != 1:
        raise ValueError("No coincide exactamente la salida única autorizada de 8i.")
    actual.remove(actual_8i[0])
    baseline.remove(baseline_8i[0])
    if actual != baseline:
        raise ValueError("verify difiere de la línea base fuera de las diferencias textuales autorizadas.")

compare(actual, baseline)

# Demuestra que el permiso textual de 8i no acepta cambios adicionales en esa salida.
negative_actual = list(actual)
negative_actual[actual.index(expected_actual_8i)] = expected_actual_8i.replace(b"; principal", b"; texto adicional; principal")
try:
    compare(negative_actual, baseline)
except ValueError:
    pass
else:
    raise SystemExit("La comparación aceptó una modificación adicional en 8i.")
print("control negativo: modificación adicional en 8i rechazada.")
print("verify coincide salvo las sustituciones textuales exactas autorizadas de los escenarios 9 y 8i.")
PY
fi
printf 'Simulaciones repetibles y verify coinciden con linea-base/; aplica solo las excepciones textuales exactas autorizadas de los escenarios 9 y 8i.\n'
