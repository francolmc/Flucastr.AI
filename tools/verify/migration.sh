# 7. migración a v2: install.sh --migrate sobre proyectos v1 sintéticos, con HOME temporal por escenario
paso 7 "migración a v2 (--migrate, --dry-run, repetición, sin v1)"
T7=$(mktemp -d) || fallo "no pude crear el temporal"
trap '[ -n "${T6:-}" ] && rm -rf "$T6"; [ -n "${T7:-}" ] && rm -rf "$T7"' EXIT

# Proyecto v1 sintético en $1: las tres carpetas, hook de v1, agente distinto, src/x.txt y todo en el índice de git.
crear_v1() {
  local p="$1"
  mkdir -p "$p/definitions" "$p/features/F01-demo" "$p/registro" "$p/src" "$p/.claude"
  echo "# proyecto" > "$p/definitions/PROJECT.md"
  printf '%s\n' '| ID | Feature | Tipo | Valor | Esfuerzo | Por qué | Estado | Siguiente |' '|---|---|---|---|---|---|---|---|' '| F01 | Base | habilitante | alto | bajo | x | hecha | |' '| F02 | Abierta de prueba | producto | alto | medio | x | en curso | |' > "$p/definitions/BACKLOG.md"
  printf '# Tarea A\nrepo: app depende_de: - estado: aprobada\n' > "$p/features/F01-demo/task-01.md"
  printf '# Tarea B\nrepo: app depende_de: - estado: hecha\n' > "$p/features/F01-demo/task-02.md"
  echo '{}' > "$p/registro/eventos.jsonl"
  echo contenido > "$p/src/x.txt"
  cat > "$p/.claude/settings.local.json" <<'EOF'
{"agent":"otro","hooks":{"PostToolUse":[{"matcher":"Write|Edit|MultiEdit","hooks":[{"type":"command","command":"node ~/.flucastr-ai/validar-tarea.mjs --hook"}]}]}}
EOF
  git -C "$p" init -q && git -C "$p" add -A
}

# Huella de un árbol: nombres y contenido de cada archivo.
fingerprint() { { find "$1" -print | sort; find "$1" -type f -exec shasum {} + | sort; }; }

# install.sh --migrate: $1 carpeta del escenario (HOME = $1/home), $2 proyecto, resto (p. ej. --dry-run) tal cual. Salida en $1/log.
k7() {
  local esc="$1" proy="$2"
  shift 2
  ( unset PI_CODING_AGENT_DIR; export HOME="$esc/home"; bash install.sh --migrate "$proy" "$@" ) > "$esc/log" 2>&1
}

# escenario 1: proyecto con definitions/, features/, registro/, hook de v1 y agente distinto
e="$T7/s1"; mkdir -p "$e/home" "$e/proj"; crear_v1 "$e/proj"
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 1: --migrate salió con error"; }
p="$e/proj"
for d in definitions features registro; do
  [ -d "$p/old/v1/$d" ] || fallo "escenario 1: falta old/v1/$d"
  [ ! -e "$p/$d" ] || fallo "escenario 1: $d sigue en la raíz"
done
[ "$(cat "$p/src/x.txt")" = contenido ] || fallo "escenario 1: cambió src/x.txt"
node -e 'const fs = require("fs"); const t = fs.readFileSync(process.argv[1], "utf8"); const a = JSON.parse(t); process.exit(a.agent === "planner" && !t.includes("validar-tarea") ? 0 : 1)' "$p/.claude/settings.local.json" \
  || fallo "escenario 1: el agente no quedó en planner o queda el hook de v1"
node -e 'const fs = require("fs"); const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).permissions.deny; process.exit(JSON.stringify(d) === JSON.stringify(process.argv.slice(2)) ? 0 : 1)' "$p/.claude/settings.json" "${REGLAS_DENY[@]}" \
  || fallo "escenario 1: las reglas deny no son exactamente las 28 del kit"
[ -d "$p/changes" ] || fallo "escenario 1: falta changes/"
grep -qF "tarea aprobada: old/v1/features/F01-demo/task-01.md" "$e/log" || fallo "escenario 1: la lista no trae la tarea aprobada"
grep -q "task-02.md" "$e/log" && fallo "escenario 1: la lista trae una tarea hecha"
grep -qF "feature abierta: F02" "$e/log" || fallo "escenario 1: la lista no trae la feature abierta de BACKLOG"
grep -q "F01 Base" "$e/log" && fallo "escenario 1: la lista trae una feature hecha"
git -C "$p" ls-files | grep -q '^old/v1/features/' || fallo "escenario 1: en un proyecto git el movimiento no quedó como git mv"
echo "ok escenario 1: old/v1 con las tres carpetas, agente planner, sin hook, 28 deny, changes/, lista de trabajo a medias"

# escenario 2: segunda corrida: «old/v1 ya existe» y nada cambia (proyecto y HOME)
antes_p=$(fingerprint "$p"); antes_h=$(fingerprint "$e/home")
k7 "$e" "$p" || { cat "$e/log" >&2; fallo "escenario 2: la segunda corrida salió con error"; }
grep -q "old/v1 ya existe" "$e/log" || fallo "escenario 2: no dijo que old/v1 ya existe"
[ "$(fingerprint "$p")" = "$antes_p" ] || fallo "escenario 2: la segunda corrida cambió el proyecto"
[ "$(fingerprint "$e/home")" = "$antes_h" ] || fallo "escenario 2: la segunda corrida cambió el HOME"
echo "ok escenario 2: repetir dice «old/v1 ya existe» y no cambia el árbol"

# escenario 3: solo definitions/ se mueve y no hay error
e="$T7/s3"; mkdir -p "$e/home" "$e/proj/definitions"; echo "# p" > "$e/proj/definitions/PROJECT.md"
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 3: --migrate salió con error"; }
[ -f "$e/proj/old/v1/definitions/PROJECT.md" ] || fallo "escenario 3: no se movió definitions/"
[ ! -e "$e/proj/definitions" ] || fallo "escenario 3: definitions/ sigue en la raíz"
[ ! -e "$e/proj/old/v1/features" ] || fallo "escenario 3: apareció features/ sin existir"
echo "ok escenario 3: solo definitions/ -> se mueve y no hay error"

# escenario 4: sin v1 no pasa nada (sin changes/, .claude ni manifiesto)
e="$T7/s4"; mkdir -p "$e/home" "$e/proj/src"; echo x > "$e/proj/src/x.txt"
antes_p=$(fingerprint "$e/proj"); antes_h=$(fingerprint "$e/home")
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 4: --migrate salió con error"; }
grep -q "nada que migrar" "$e/log" || fallo "escenario 4: no dijo «nada que migrar»"
[ "$(fingerprint "$e/proj")" = "$antes_p" ] || fallo "escenario 4: cambió el proyecto sin v1"
[ "$(fingerprint "$e/home")" = "$antes_h" ] || fallo "escenario 4: cambió el HOME sin v1"
echo "ok escenario 4: sin v1 -> «nada que migrar», sin cambios"

# escenario 5: --dry-run imprime lo que haría y deja el proyecto y el HOME idénticos
e="$T7/s5"; mkdir -p "$e/home" "$e/proj"; crear_v1 "$e/proj"
antes_p=$(fingerprint "$e/proj"); antes_h=$(fingerprint "$e/home")
k7 "$e" "$e/proj" --dry-run || { cat "$e/log" >&2; fallo "escenario 5: --migrate --dry-run salió con error"; }
[ "$(fingerprint "$e/proj")" = "$antes_p" ] || fallo "escenario 5: --dry-run cambió el proyecto"
[ "$(fingerprint "$e/home")" = "$antes_h" ] || fallo "escenario 5: --dry-run cambió el HOME"
grep -q "movería: features -> old/v1/features" "$e/log" || fallo "escenario 5: no imprimió el movimiento"
grep -q "(simulación) agente predeterminado" "$e/log" || fallo "escenario 5: no imprimió el cambio de agente"
grep -qF "tarea aprobada: features/F01-demo/task-01.md" "$e/log" || fallo "escenario 5: la lista de --dry-run no trae la tarea aprobada"
echo "ok escenario 5: --dry-run imprime el plan y no cambia el árbol"

# escenario 6: combinaciones no válidas salen con error sin tocar nada
e="$T7/s6"; mkdir -p "$e/home" "$e/proj"; crear_v1 "$e/proj"
antes_p=$(fingerprint "$e/proj")
if ( unset PI_CODING_AGENT_DIR; export HOME="$e/home"; bash install.sh --migrate "$e/proj" --project "$e/proj" ) >/dev/null 2>&1; then
  fallo "escenario 6: --migrate con --project no dio error"
fi
[ "$(fingerprint "$e/proj")" = "$antes_p" ] || fallo "escenario 6: la combinación no válida cambió el proyecto"
echo "ok escenario 6: --migrate con --project da error y no cambia nada"

# Workspace sintético en $1: raíz sin .git; api y web con .git; definitions/ en la raíz y una propia en api.
crear_ws_v1() {
  local p="$1"
  mkdir -p "$p/definitions" "$p/api/definitions" "$p/web"
  echo "# proyecto" > "$p/definitions/PROJECT.md"
  echo "# repos" > "$p/definitions/REPOS.md"
  echo "# api" > "$p/api/definitions/PROJECT.md"
  git -C "$p/api" init -q && git -C "$p/web" init -q
}

# escenario 7: workspace -> old/v1 de la raíz, los hijos intactos, el log lista los hijos y dice que la raíz no es repo
e="$T7/s7"; mkdir -p "$e/home" "$e/proj"; crear_ws_v1 "$e/proj"
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 7: --migrate salió con error"; }
p="$e/proj"
[ -f "$p/old/v1/definitions/REPOS.md" ] || fallo "escenario 7: la definitions/ de la raíz no quedó en old/v1"
[ ! -e "$p/definitions" ] || fallo "escenario 7: definitions/ de la raíz sigue en la raíz"
[ -f "$p/api/definitions/PROJECT.md" ] || fallo "escenario 7: se movió la definitions/ del hijo api"
[ ! -e "$p/.git" ] || fallo "escenario 7: la raíz quedó con .git"
grep -qF "Workspace: repos hijos: api, web" "$e/log" || fallo "escenario 7: el log no lista los dos hijos"
grep -q "La raíz no es repo" "$e/log" || fallo "escenario 7: el log no dice que la raíz no es repo"
echo "ok escenario 7: workspace -> old/v1 de la raíz, hijos intactos, log con hijos y raíz sin repo"

# escenario 7b: --dry-run en workspace con AGENTS.md de v1: el árbol (incluido .gitignore) queda igual y sale el aviso
e="$T7/s7b"; mkdir -p "$e/home" "$e/proj"; crear_ws_v1 "$e/proj"
echo "Lee definitions/PROJECT.md antes de empezar." > "$e/proj/AGENTS.md"
antes_p=$(fingerprint "$e/proj"); antes_h=$(fingerprint "$e/home")
k7 "$e" "$e/proj" --dry-run || { cat "$e/log" >&2; fallo "escenario 7b: --migrate --dry-run salió con error"; }
[ "$(fingerprint "$e/proj")" = "$antes_p" ] || fallo "escenario 7b: --dry-run cambió el workspace (incluido .gitignore)"
[ "$(fingerprint "$e/home")" = "$antes_h" ] || fallo "escenario 7b: --dry-run cambió el HOME"
grep -qF "AVISO: AGENTS.md sigue siendo de v1 y apunta a rutas movidas: ejecuta la skill migrate-project" "$e/log" || fallo "escenario 7b: falta el aviso de AGENTS.md en --dry-run"
grep -qF "(simulación) agregaría .claude/settings.local.json" "$e/log" || fallo "escenario 7b: --dry-run no imprimió la línea de .gitignore"
echo "ok escenario 7b: --dry-run en workspace no cambia el árbol y sale el aviso de AGENTS.md"

# escenario 8: .gitignore con otras líneas: la de settings.local.json queda una sola vez, no aparece settings.json y no se pierde nada
e="$T7/s8"; mkdir -p "$e/home" "$e/proj"; crear_v1 "$e/proj"
printf 'node_modules\n.claude/settings.local.json\n' > "$e/proj/.gitignore"
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 8: --migrate salió con error"; }
[ "$(grep -cxF '.claude/settings.local.json' "$e/proj/.gitignore")" = 1 ] || fallo "escenario 8: la línea de settings.local.json no quedó una sola vez"
grep -qxF 'node_modules' "$e/proj/.gitignore" || fallo "escenario 8: se perdió node_modules del .gitignore"
grep -qxF '.claude/settings.json' "$e/proj/.gitignore" && fallo "escenario 8: .gitignore ignora .claude/settings.json (es compartido)"
echo "ok escenario 8: .gitignore con línea repetida no duplica y conserva las demás"

# escenario 8b: .gitignore sin salto final, y proyecto sin .gitignore: en ambos queda la línea una vez
e="$T7/s8b"; mkdir -p "$e/home" "$e/proj"; crear_v1 "$e/proj"
printf 'node_modules' > "$e/proj/.gitignore"
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 8b: --migrate salió con error"; }
grep -qxF 'node_modules' "$e/proj/.gitignore" || fallo "escenario 8b: se perdió node_modules al añadir la línea"
[ "$(grep -cxF '.claude/settings.local.json' "$e/proj/.gitignore")" = 1 ] || fallo "escenario 8b: falta o se duplica la línea (.gitignore sin salto final)"
e="$T7/s8c"; mkdir -p "$e/home" "$e/proj"; crear_v1 "$e/proj"
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 8c: --migrate salió con error"; }
[ "$(grep -cxF '.claude/settings.local.json' "$e/proj/.gitignore")" = 1 ] || fallo "escenario 8c: sin .gitignore no se creó con la línea"
grep -q "AVISO: AGENTS.md" "$e/log" && fallo "escenario 8c: salió aviso de AGENTS.md sin AGENTS.md"
echo "ok escenario 8b y 8c: .gitignore sin salto final y sin .gitignore quedan con la línea una vez; sin AGENTS.md no hay aviso"

# escenario 9: fixture anónimo con AGENTS.md v1; sin texto de workspace, con aviso, git mv de definitions/ y features/, .gitignore en git status
e="$T7/s9"; mkdir -p "$e/home"
crear_v1 "$e/source"
echo "Lee definitions/PROJECT.md antes de empezar." > "$e/source/AGENTS.md"
git -C "$e/source" add AGENTS.md
git -C "$e/source" ls-files | grep -q '^definitions/' || fallo "escenario 9: definitions/ no está en el índice del fixture"
git -C "$e/source" ls-files | grep -q '^features/' || fallo "escenario 9: features/ no está en el índice del fixture"
grep -qF 'definitions/PROJECT.md' "$e/source/AGENTS.md" || fallo "escenario 9: AGENTS.md no contiene la referencia v1"
cp -R "$e/source" "$e/proj"
antes_c=$(git -C "$e/source" status --porcelain | shasum)
k7 "$e" "$e/proj" || { cat "$e/log" >&2; fallo "escenario 9: --migrate sobre el fixture salió con error"; }
grep -q "Workspace:" "$e/log" && fallo "escenario 9: el fixture imprimió texto de workspace"
grep -qF "AVISO: AGENTS.md sigue siendo de v1" "$e/log" || fallo "escenario 9: falta el aviso de AGENTS.md"
git -C "$e/proj" ls-files | grep -q '^old/v1/definitions/' || fallo "escenario 9: git mv no movió definitions/"
git -C "$e/proj" ls-files | grep -q '^old/v1/features/' || fallo "escenario 9: git mv no movió features/"
git -C "$e/proj" status --short -- .gitignore | grep -q . || fallo "escenario 9: git status no muestra .gitignore"
[ "$(git -C "$e/source" status --porcelain | shasum)" = "$antes_c" ] || fallo "escenario 9: el fixture fuente cambió"
echo "ok escenario 9: fixture anónimo -> sin texto de workspace, aviso, git mv de definitions/ y features/, .gitignore en git status"

