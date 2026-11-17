# 8r. observador de Docker: informe del fixture contra LEEME.txt (A1 a A3); ciclo start/status/stop con el docker falso (A4); copia sin oom sin línea OOM
paso 8r "observador de Docker: informe sobre el fixture, ciclo con docker falso y copia sin oom"
FIX=scripts/fixtures-observador
T8R=$(mktemp -d)
mkdir -p "$T8R/home" "$T8R/bin" "$T8R/faltantes"
cat > "$T8R/bin/free" <<'EOF'
#!/usr/bin/env bash
printf '              total        used        free      shared  buff/cache   available\nMem:          1024         256         768           0           0         768\n'
EOF
chmod +x "$T8R/bin/free"
esperado=$(sed -n '/^--- salida esperada ---$/,/^--- fin ---$/p' "$FIX/datos/LEEME.txt" | sed '1d;$d')
[ -n "$esperado" ] || fallo "8r: LEEME.txt no trae la salida esperada"
obtenido=$(node scripts/observar.mjs informe --datos "$FIX/datos") || fallo "8r: el informe del fixture salió con error"
[ "$obtenido" = "$esperado" ] || { diff <(printf '%s\n' "$esperado") <(printf '%s\n' "$obtenido") >&2 || true; fallo "8r: el informe no coincide con LEEME.txt (A1 a A3)"; }
echo "ok 8r A1-A3: el informe del fixture coincide con LEEME.txt (medianas, máximos, caché, OOM, solape y pico)"
mkdir -p "$T8R/sinoom"
grep -v '"Action":"oom"' "$FIX/datos/eventos.jsonl" > "$T8R/sinoom/eventos.jsonl"
cp "$FIX/datos/muestras.jsonl" "$FIX/datos/builds.jsonl" "$T8R/sinoom/"
grep -q '^OOM ' <<<"$obtenido" || fallo "8r: el fixture con oom no muestra la línea OOM (control)"
sin=$(node scripts/observar.mjs informe --datos "$T8R/sinoom") || fallo "8r: el informe de la copia sin oom salió con error"
if grep -q '^OOM ' <<<"$sin"; then fallo "8r: una copia sin oom muestra la línea OOM"; fi
echo "ok 8r negativa: la copia sin oom no muestra OOM"
faltante=$(node scripts/observar.mjs informe --datos "$T8R/faltantes") || fallo "8r negativa: informe sin datos devolvió error"
grep -q '^BUILDS ' <<<"$faltante" && grep -Fq '(sin builds terminadas)' <<<"$faltante" && grep -q '^sin muestras$' <<<"$faltante" || fallo "8r negativa: el informe sin datos no declara sus secciones vacías"
set +e
error=$(node scripts/observar.mjs informe --datos "$T8R/faltantes" --desde invalida 2>&1)
error_codigo=$?
set -e
[ "$error_codigo" -eq 2 ] && [ "$error" = "observar: --desde debe ser AAAA-MM-DD: invalida" ] || fallo "8r negativa: fecha inválida cambió código o error: $error_codigo / $error"
set +e
error=$(node scripts/observar.mjs informe --datos "$T8R/faltantes" --desconocida 2>&1)
error_codigo=$?
set -e
[ "$error_codigo" -eq 2 ] && [ "$error" = "observar: opción desconocida: --desconocida" ] || fallo "8r negativa: opción desconocida cambió código o error: $error_codigo / $error"
(
  export HOME="$T8R/home" FLUCASTR_OBSERVADOR_DIR="$T8R/ciclo" PATH="$T8R/bin:$PWD/$FIX/bin:$PATH"
  export OBSERVER_FIXTURE_PID_LOG="$T8R/docker.pids" OBSERVER_FIXTURE_HOLD_EVENTS=1
  mkdir -p "$HOME"
  trap 'node scripts/observar.mjs stop >/dev/null 2>&1 || true; while IFS= read -r pid; do kill "$pid" 2>/dev/null || true; done < "${OBSERVER_FIXTURE_PID_LOG:-/dev/null}"' EXIT
  parado=$(node scripts/observar.mjs status) || fallo "8r A4: status detenido falló"
  grep -q '^parado; datos en ' <<<"$parado" || fallo "8r A4: status detenido inesperado: $parado"
  sinproceso=$(node scripts/observar.mjs stop) || fallo "8r A4: stop sin proceso falló"
  grep -q '^no corre; datos en ' <<<"$sinproceso" || fallo "8r A4: stop sin proceso inesperado: $sinproceso"
  arranque=$(node scripts/observar.mjs start) || fallo "8r A4: start falló"
  grep -q '^arrancado (pid ' <<<"$arranque" || fallo "8r A4: start no arrancó: $arranque"
  sleep 3
  estado1=$(node scripts/observar.mjs status) || fallo "8r A4: status falló"
  grep -q '^corriendo ' <<<"$estado1" || fallo "8r A4: status no ve el proceso en marcha: $estado1"
  dos=$(node scripts/observar.mjs start) || fallo "8r A4: segundo start falló"
  grep -q '^ya corre ' <<<"$dos" || fallo "8r A4: un segundo start no avisó que ya corre: $dos"
  pid=$(cat "$FLUCASTR_OBSERVADOR_DIR/observador.pid")
  for f in eventos.jsonl muestras.jsonl builds.jsonl; do
    [ -s "$FLUCASTR_OBSERVADOR_DIR/$f" ] || fallo "8r A4: no se creó $f con datos"
  done
  parada=$(node scripts/observar.mjs stop) || fallo "8r A4: stop falló"
  grep -q '^parado ' <<<"$parada" || fallo "8r A4: stop no paró el proceso: $parada"
  if kill -0 "$pid" 2>/dev/null; then fallo "8r A4: el PID $pid sigue vivo tras stop"; fi
  while IFS= read -r child; do
    if kill -0 "$child" 2>/dev/null; then fallo "8r A4: proceso Docker fixture $child sigue vivo tras stop"; fi
  done < "$OBSERVER_FIXTURE_PID_LOG"
  echo "ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe"
)
rm -rf "$T8R"
