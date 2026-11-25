# 8r. observador de Docker: informe del fixture contra README.txt (A1 a A3); ciclo start/status/stop con el docker falso (A4); copia sin oom sin línea OOM
paso 8r "observador de Docker: informe sobre el fixture, ciclo con docker falso y copia sin oom"
FIX=scripts/fixtures-observer
T8R=$(mktemp -d)
mkdir -p "$T8R/home" "$T8R/bin" "$T8R/faltantes"
cat > "$T8R/bin/free" <<'EOF'
#!/usr/bin/env bash
printf '              total        used        free      shared  buff/cache   available\nMem:          1024         256         768           0           0         768\n'
EOF
chmod +x "$T8R/bin/free"
esperado=$(sed -n '/^--- salida esperada ---$/,/^--- fin ---$/p' "$FIX/datos/README.txt" | sed '1d;$d')
[ -n "$esperado" ] || fallo "8r: README.txt no trae la salida esperada"
obtenido=$(node scripts/observe.mjs report --data "$FIX/datos") || fallo "8r: el informe del fixture salió con error"
[ "$obtenido" = "$esperado" ] || { diff <(printf '%s\n' "$esperado") <(printf '%s\n' "$obtenido") >&2 || true; fallo "8r: el informe no coincide con README.txt (A1 a A3)"; }
echo "ok 8r A1-A3: el informe del fixture coincide con README.txt (medianas, máximos, caché, OOM, solape y pico)"
mkdir -p "$T8R/kit con espacios/scripts" "$T8R/kit con espacios/tools"
cp scripts/observe.mjs "$T8R/kit con espacios/scripts/"
cp -R tools/observe "$T8R/kit con espacios/tools/"
cp -R tools/spawn "$T8R/kit con espacios/tools/"
cp -R "$FIX/datos" "$T8R/datos con espacios"
comparar_observador() {
  local codigo_es codigo_en
  set +e
  node "$T8R/kit con espacios/scripts/observe.mjs" "$@" > "$T8R/es.out" 2> "$T8R/es.err"
  codigo_es=$?
  node "$T8R/kit con espacios/scripts/observe.mjs" "${ingles[@]}" > "$T8R/en.out" 2> "$T8R/en.err"
  codigo_en=$?
  set -e
  [ "$codigo_es" -eq "$codigo_en" ] && cmp -s "$T8R/es.out" "$T8R/en.out" && cmp -s "$T8R/es.err" "$T8R/en.err" || fallo "8r: interfaces del observador difieren"
}
ingles=(report --data "$T8R/datos con espacios" --since 2026-01-01)
comparar_observador report --data "$T8R/datos con espacios" --since 2026-01-01
grep -q '^BUILDS ' "$T8R/es.out" && ! grep -Fq '(sin builds terminadas)' "$T8R/es.out" || fallo "8r: informe filtrado sin builds del fixture"
ingles=(report --data "$T8R/datos con espacios" --since 2026-01-01)
comparar_observador report --data "$T8R/datos con espacios" --since 2026-01-01
for es in --datos --desde; do
  set +e
  node "$T8R/kit con espacios/scripts/observe.mjs" report "$es" x > "$T8R/es.out" 2> "$T8R/es.err"
  codigo=$?
  set -e
  [ "$codigo" -eq 2 ] && grep -Fq 'opción desconocida' "$T8R/es.err" || fallo "8r: $es ya no debe aceptarse"
done
ingles=(report --data "$T8R/datos con espacios" --since invalida)
comparar_observador report --data "$T8R/datos con espacios" --since invalida
grep -Fq 'observar: --since debe ser AAAA-MM-DD' "$T8R/es.err" || fallo "8r: falta error de fecha inválida"
ingles=(report --desconocida)
comparar_observador report --desconocida
sed -i 's/\["--data", "--since"\]/["--data", "--removed"]/' "$T8R/kit con espacios/scripts/observe.mjs"
grep -q '"--removed"' "$T8R/kit con espacios/scripts/observe.mjs" || fallo "8r: la mutación no cambió observe.mjs"
if node "$T8R/kit con espacios/scripts/observe.mjs" report --data "$T8R/datos con espacios" --since 2026-01-01 > /dev/null 2>&1; then fallo "8r: cambiar una opción no fue detectado"; fi
echo "ok 8r idioma: informes, mezcla, errores y mutación de opción equivalentes con datos aislados"
mkdir -p "$T8R/sinoom"
grep -v '"Action":"oom"' "$FIX/datos/eventos.jsonl" > "$T8R/sinoom/eventos.jsonl"
cp "$FIX/datos/muestras.jsonl" "$FIX/datos/builds.jsonl" "$T8R/sinoom/"
grep -q '^OOM ' <<<"$obtenido" || fallo "8r: el fixture con oom no muestra la línea OOM (control)"
sin=$(node scripts/observe.mjs report --data "$T8R/sinoom") || fallo "8r: el informe de la copia sin oom salió con error"
if grep -q '^OOM ' <<<"$sin"; then fallo "8r: una copia sin oom muestra la línea OOM"; fi
echo "ok 8r negativa: la copia sin oom no muestra OOM"
faltante=$(node scripts/observe.mjs report --data "$T8R/faltantes") || fallo "8r negativa: informe sin datos devolvió error"
grep -q '^BUILDS ' <<<"$faltante" && grep -Fq '(sin builds terminadas)' <<<"$faltante" && grep -q '^sin muestras$' <<<"$faltante" || fallo "8r negativa: el informe sin datos no declara sus secciones vacías"
set +e
error=$(node scripts/observe.mjs report --data "$T8R/faltantes" --since invalida 2>&1)
error_codigo=$?
set -e
[ "$error_codigo" -eq 2 ] && [ "$error" = "observar: --since debe ser AAAA-MM-DD: invalida" ] || fallo "8r negativa: fecha inválida cambió código o error: $error_codigo / $error"
set +e
error=$(node scripts/observe.mjs report --data "$T8R/faltantes" --desconocida 2>&1)
error_codigo=$?
set -e
[ "$error_codigo" -eq 2 ] && [ "$error" = "observar: opción desconocida: --desconocida" ] || fallo "8r negativa: opción desconocida cambió código o error: $error_codigo / $error"
(
  export HOME="$T8R/home" FLUCASTR_OBSERVADOR_DIR="$T8R/ciclo" PATH="$T8R/bin:$PWD/$FIX/bin:$PATH"
  export OBSERVER_FIXTURE_PID_LOG="$T8R/docker.pids" OBSERVER_FIXTURE_HOLD_EVENTS=1
  mkdir -p "$HOME"
  trap 'node scripts/observe.mjs stop >/dev/null 2>&1 || true; while IFS= read -r pid; do kill "$pid" 2>/dev/null || true; done < "${OBSERVER_FIXTURE_PID_LOG:-/dev/null}"' EXIT
  parado=$(node scripts/observe.mjs status) || fallo "8r A4: status detenido falló"
  grep -q '^parado; datos en ' <<<"$parado" || fallo "8r A4: status detenido inesperado: $parado"
  sinproceso=$(node scripts/observe.mjs stop) || fallo "8r A4: stop sin proceso falló"
  grep -q '^no corre; datos en ' <<<"$sinproceso" || fallo "8r A4: stop sin proceso inesperado: $sinproceso"
  arranque=$(node scripts/observe.mjs start) || fallo "8r A4: start falló"
  grep -q '^arrancado (pid ' <<<"$arranque" || fallo "8r A4: start no arrancó: $arranque"
  sleep 3
  estado1=$(node scripts/observe.mjs status) || fallo "8r A4: status falló"
  grep -q '^corriendo ' <<<"$estado1" || fallo "8r A4: status no ve el proceso en marcha: $estado1"
  dos=$(node scripts/observe.mjs start) || fallo "8r A4: segundo start falló"
  grep -q '^ya corre ' <<<"$dos" || fallo "8r A4: un segundo start no avisó que ya corre: $dos"
  pid=$(cat "$FLUCASTR_OBSERVADOR_DIR/observador.pid")
  for f in eventos.jsonl muestras.jsonl builds.jsonl; do
    [ -s "$FLUCASTR_OBSERVADOR_DIR/$f" ] || fallo "8r A4: no se creó $f con datos"
  done
  parada=$(node scripts/observe.mjs stop) || fallo "8r A4: stop falló"
  grep -q '^parado ' <<<"$parada" || fallo "8r A4: stop no paró el proceso: $parada"
  if kill -0 "$pid" 2>/dev/null; then fallo "8r A4: el PID $pid sigue vivo tras stop"; fi
  while IFS= read -r child; do
    if kill -0 "$child" 2>/dev/null; then fallo "8r A4: proceso Docker fixture $child sigue vivo tras stop"; fi
  done < "$OBSERVER_FIXTURE_PID_LOG"
  echo "ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe"
)
rm -rf "$T8R"
