# 3e. lanzadores y reinstalación con esfuerzo (HOME temporal, models.json personal con --copy)
paso 3e "claude-<agente> y pi-<agente> con esfuerzo; reinstalar refresca; archivo sin marca se respeta"
prueba_lanzadores() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  mkdir -p "$tmp/home/.claude" "$tmp/home/.pi/agent"
  poner_esfuerzo() { node -e 'const f=process.argv[1]; const m=require(require("path").resolve(process.argv[2])); m.agents.builder.effort=process.argv[3]; require("fs").writeFileSync(f, JSON.stringify(m))' "$tmp/m.json" models.json "$1"; }
  correr() { ( unset PI_CODING_AGENT_DIR; export HOME="$tmp/home" FLUCASTR_MODELOS="$tmp/m.json"; bash "$@" ) >"$tmp/log" 2>&1 || { cat "$tmp/log" >&2; echo "FALLO: $* falló" >&2; exit 1; }; }
  poner_esfuerzo low
  correr install.sh --copy
  grep -qxF 'effort: low' "$tmp/home/.claude/agents/builder.md" || { echo "FALLO: falta effort: low" >&2; exit 1; }
  grep -qxF 'thinking: low' "$tmp/home/.pi/agent/agents/builder.md" || { echo "FALLO: falta thinking: low" >&2; exit 1; }
  grep -qF -- '--effort low' "$tmp/home/.local/bin/claude-builder" || { echo "FALLO: claude-builder sin --effort low" >&2; exit 1; }
  poner_esfuerzo max
  correr install.sh --copy
  grep -qxF 'effort: max' "$tmp/home/.claude/agents/builder.md" || { echo "FALLO: reinstalar no refrescó effort" >&2; exit 1; }
  grep -qxF 'thinking: max' "$tmp/home/.pi/agent/agents/builder.md" || { echo "FALLO: reinstalar no refrescó thinking" >&2; exit 1; }
  grep -qF -- '--effort max' "$tmp/home/.local/bin/claude-builder" || { echo "FALLO: reinstalar no refrescó claude-builder" >&2; exit 1; }
  correr uninstall.sh
  echo "mio" > "$tmp/home/.local/bin/claude-planner"
  correr install.sh --copy
  [ "$(cat "$tmp/home/.local/bin/claude-planner")" = mio ] || { echo "FALLO: se pisó un archivo sin marca" >&2; exit 1; }
  correr uninstall.sh
  [ ! -e "$tmp/home/.local/bin/claude-builder" ] && [ ! -e "$tmp/home/.local/bin/pi-builder" ] && [ ! -e "$tmp/home/.claude/agents/builder.md" ] \
    || { echo "FALLO: desinstalar dejó archivos generados" >&2; exit 1; }
  echo "ok 3e: effort y thinking low->max al reinstalar, --effort en claude-builder, archivo sin marca intacto, desinstalar limpia"
)
prueba_lanzadores || fallo "3e: lanzadores y reinstalación"

