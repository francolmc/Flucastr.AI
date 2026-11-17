# 3e. lanzadores y reinstalación con esfuerzo (HOME temporal, modelos.json personal con --copiar)
paso 3e "claude-<agente> y pi-<agente> con esfuerzo; reinstalar refresca; archivo sin marca se respeta"
prueba_lanzadores() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  mkdir -p "$tmp/home/.claude" "$tmp/home/.pi/agent"
  poner_esfuerzo() { node -e 'const f=process.argv[1]; const m=require(require("path").resolve(process.argv[2])); m.agentes.constructor.esfuerzo=process.argv[3]; require("fs").writeFileSync(f, JSON.stringify(m))' "$tmp/m.json" modelos.json "$1"; }
  correr() { ( unset PI_CODING_AGENT_DIR; export HOME="$tmp/home" FLUCASTR_MODELOS="$tmp/m.json"; bash "$@" ) >"$tmp/log" 2>&1 || { cat "$tmp/log" >&2; echo "FALLO: $* falló" >&2; exit 1; }; }
  poner_esfuerzo low
  correr instalar.sh --copiar
  grep -qxF 'effort: low' "$tmp/home/.claude/agents/constructor.md" || { echo "FALLO: falta effort: low" >&2; exit 1; }
  grep -qxF 'thinking: low' "$tmp/home/.pi/agent/agents/constructor.md" || { echo "FALLO: falta thinking: low" >&2; exit 1; }
  grep -qF -- '--effort low' "$tmp/home/.local/bin/claude-constructor" || { echo "FALLO: claude-constructor sin --effort low" >&2; exit 1; }
  poner_esfuerzo max
  correr instalar.sh --copiar
  grep -qxF 'effort: max' "$tmp/home/.claude/agents/constructor.md" || { echo "FALLO: reinstalar no refrescó effort" >&2; exit 1; }
  grep -qxF 'thinking: max' "$tmp/home/.pi/agent/agents/constructor.md" || { echo "FALLO: reinstalar no refrescó thinking" >&2; exit 1; }
  grep -qF -- '--effort max' "$tmp/home/.local/bin/claude-constructor" || { echo "FALLO: reinstalar no refrescó claude-constructor" >&2; exit 1; }
  correr desinstalar.sh
  echo "mio" > "$tmp/home/.local/bin/claude-principal"
  correr instalar.sh --copiar
  [ "$(cat "$tmp/home/.local/bin/claude-principal")" = mio ] || { echo "FALLO: se pisó un archivo sin marca" >&2; exit 1; }
  correr desinstalar.sh
  [ ! -e "$tmp/home/.local/bin/claude-constructor" ] && [ ! -e "$tmp/home/.local/bin/pi-constructor" ] && [ ! -e "$tmp/home/.claude/agents/constructor.md" ] \
    || { echo "FALLO: desinstalar dejó archivos generados" >&2; exit 1; }
  echo "ok 3e: effort y thinking low->max al reinstalar, --effort en claude-constructor, archivo sin marca intacto, desinstalar limpia"
)
prueba_lanzadores || fallo "3e: lanzadores y reinstalación"

