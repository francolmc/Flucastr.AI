# 3. resolver para cada agente y cada herramienta
paso 3 "resolver Claude Code y Pi por agente"
# tiene_skills: la salida generada debe traer la línea exacta 'skills: execute-plan'
tiene_skills() { grep -qxF "skills: execute-plan" <<<"$1"; }

chequear() {
  local nombre="$1" ruta="$2" herr="$3" cmd="$4" etiqueta="$5" modelo salida
  modelo=$(node scripts/resolver.mjs modelo "$nombre" "$herr") || fallo "resolver modelo $nombre $herr falló"
  salida=$(node scripts/resolver.mjs "$cmd" "$ruta") || fallo "resolver $cmd $ruta falló"
  grep -qxF "model: $modelo" <<<"$salida" || fallo "$ruta ($etiqueta): falta la línea 'model: $modelo'"
  grep -qxF "Herramienta: $etiqueta | Modelo: $modelo | Agente: $nombre" <<<"$salida" \
    || fallo "$ruta ($etiqueta): falta la línea de identidad 'Herramienta: $etiqueta | Modelo: $modelo | Agente: $nombre'"
  echo "ok $nombre $etiqueta $modelo"
  # effort: 'effort:' en Claude Code y 'thinking:' en Pi, iguales a lo que imprime `esfuerzo`; sin esfuerzo, ninguna
  local campo esfuerzo
  campo=$([ "$herr" = pi ] && echo thinking || echo effort)
  esfuerzo=$(node scripts/resolver.mjs effort "$nombre") || fallo "resolver effort $nombre falló"
  if [ -n "$esfuerzo" ]; then
    grep -qxF "$campo: $esfuerzo" <<<"$salida" || fallo "$ruta ($etiqueta): falta la línea '$campo: $esfuerzo'"
    echo "ok esfuerzo $nombre $etiqueta $esfuerzo"
  else
    if grep -qE "^(effort|thinking):" <<<"$salida"; then fallo "$ruta ($etiqueta): sale una línea de esfuerzo sin esfuerzo declarado"; fi
    echo "ok esfuerzo $nombre $etiqueta (ninguno)"
  fi
  if [ "$nombre" = builder ]; then
    tiene_skills "$salida" || fallo "$ruta ($etiqueta, agente $nombre): falta la línea 'skills: execute-plan' en la salida generada"
    echo "ok skills builder $etiqueta"
  fi
}
for ruta in core/agents/*.md; do
  nombre=$(basename "$ruta" .md)
  chequear "$nombre" "$ruta" claude-code agente-claude "Claude Code"
  chequear "$nombre" "$ruta" pi agente-pi "Pi"
done
# el lanzador de Pi pasa el esfuerzo como modelo:esfuerzo (modelo-esfuerzo), no solo el modelo
grep -qF 'resolver.mjs" modelo-esfuerzo $nombre pi' adapters/pi/install-launcher.sh || fallo "adapters/pi/install-launcher.sh: el lanzador de Pi no usa modelo-esfuerzo"
echo "ok lanzador Pi usa modelo-esfuerzo"

# 3c. prueba negativa: un builder sin la línea skills debe ser rechazado (temporal que se borra al salir)
prueba_negativa_skills() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  grep -v '^skills:' core/agents/builder.md > "$tmp/builder.md"
  for cmd in agente-claude agente-pi; do
    salida=$(node scripts/resolver.mjs "$cmd" "$tmp/builder.md") || { echo "FALLO: resolver $cmd sobre el temporal falló" >&2; exit 1; }
    if tiene_skills "$salida"; then echo "FALLO: prueba negativa: el chequeo aceptó un builder sin skills ($cmd)" >&2; exit 1; fi
  done
  echo "ok prueba negativa: sin skills, el chequeo rechaza (Claude Code y Pi)"
)
echo "-- 3c. prueba negativa de skills"
prueba_negativa_skills || exit 1

# 3d. pruebas negativas de esfuerzo (temporales que se borran al salir)
prueba_negativa_esfuerzo() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  # (i) un esfuerzo fuera de 'efforts' (turbo) debe hacer fallar `esfuerzo`
  printf '%s\n' '{"levels":["high","medium","low"],"efforts":["low","medium","high","xhigh","max"],"default_level":"medium","fallback":{"high":["medium","low"],"medium":["high","low"],"low":["medium","high"]},"profiles":{"pi-openai":{"tool":"pi","provider":"openai","models":{"high":"a","medium":"b","low":"c"}}},"default_profile":{"pi":"pi-openai","claude-code":"pi-openai"},"agents":{"builder":{"level":"low","effort":"turbo"}}}' > "$tmp/turbo.json"
  if FLUCASTR_MODELOS="$tmp/turbo.json" node scripts/resolver.mjs effort builder >/dev/null 2>"$tmp/err"; then
    echo "FALLO: prueba negativa: esfuerzo aceptó 'turbo'" >&2; exit 1
  fi
  grep -q "no está en 'efforts'" "$tmp/err" || { echo "FALLO: prueba negativa: el rechazo de 'turbo' no dice por qué" >&2; exit 1; }
  echo "ok prueba negativa: esfuerzo 'turbo' rechazado"
  # (ii) un agente fuente con 'effort:' o 'thinking:' en la cabecera debe ser rechazado por ambas órdenes
  for linea in 'effort: high' 'thinking: high'; do
    printf '%s\n' "---" "name: prueba-esfuerzo" "description: prueba" "$linea" "---" "cuerpo" > "$tmp/prueba-esfuerzo.md"
    for cmd in agente-claude agente-pi; do
      if node scripts/resolver.mjs "$cmd" "$tmp/prueba-esfuerzo.md" >/dev/null 2>"$tmp/err"; then
        echo "FALLO: prueba negativa: $cmd aceptó una cabecera con '$linea'" >&2; exit 1
      fi
      grep -q "'effort' ni 'thinking'" "$tmp/err" || { echo "FALLO: prueba negativa: $cmd rechazó '$linea' por otra causa" >&2; exit 1; }
    done
  done
  echo "ok prueba negativa: 'effort:' y 'thinking:' en la cabecera rechazados (Claude Code y Pi)"
)
echo "-- 3d. pruebas negativas de esfuerzo"
prueba_negativa_esfuerzo || exit 1

