# 8. workspaces: la detección de prepare-project y los textos clave de los archivos del cambio
paso 8 "workspaces (detección con find, textos clave de los archivos del cambio)"
command -v git >/dev/null 2>&1 || fallo "falta git en el PATH"
T8=$(mktemp -d) || fallo "no pude crear el temporal"
trap '[ -n "${T6:-}" ] && rm -rf "$T6"; [ -n "${T7:-}" ] && rm -rf "$T7"; [ -n "${T8:-}" ] && rm -rf "$T8"' EXIT

# 8a. workspace con dos hijos con .git y raíz sin .git: el find de prepare-project devuelve exactamente 2
w="$T8/ws"; mkdir -p "$w/api" "$w/web"
git -C "$w/api" init -q && git -C "$w/web" init -q
[ ! -e "$w/.git" ] || fallo "8a: la raíz del temporal tiene .git"
n=$(cd "$w" && find . -maxdepth 2 -name .git -not -path './.git' | grep -c .) || true
[ "$n" = 2 ] || fallo "8a: el find devolvió $n hijos con .git, se esperaban 2"
echo "ok 8a: workspace con dos hijos con .git -> find devuelve 2"

# 8b. los archivos del cambio contienen sus textos clave; una copia sin repos: debe fallar
textos_clave() { # $1: raíz del kit
  local r=$1
  grep -q '^repos:' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -q 'repos:' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -q 'git -C <folder>' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -q -- '-maxdepth 2' "$r/core/skills/prepare-project/SKILL.md" || return 1
  grep -q 'git -C <folder' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -q 'Never decide “single repository or multi-repository workspace”' "$r/core/agents/planner.md" || return 1
  grep -q 'REPOS.md' "$r/core/skills/migrate-project/SKILL.md" || return 1
  grep -q 'Descartado' "$r/core/skills/migrate-project/SKILL.md" || return 1
  grep -q 'repos:' "$r/core/skills/migrate-project/SKILL.md" || return 1
  grep -q 'define-project' "$r/core/agents/planner.md" || return 1
  grep -q 'repo o un workspace' "$r/core/skills/define-project/SKILL.md" || return 1
  grep -q 'docs/proyecto.md' "$r/core/skills/define-project/SKILL.md" || return 1
  grep -q 'Fuera de alcance' "$r/core/skills/define-project/SKILL.md" || return 1
  grep -q 'VERIFY_TARGET' "$r/core/skills/prepare-project/reference.md" || return 1
  grep -q 'VERIFY_PERMITIR_ESCRITURA' "$r/core/skills/prepare-project/reference.md" || return 1
  grep -q 'Despliegue' "$r/core/skills/prepare-project/SKILL.md" || return 1
  grep -q 'Despliegue' "$r/core/skills/define-project/SKILL.md" || return 1
  grep -q 'prepare deployment' "$r/core/agents/planner.md" || return 1
}
textos_clave . || fallo "8b: falta algún texto clave en los archivos del cambio"
fixture_workspace() {
  local dir=$1
  mkdir -p "$dir/core/skills" "$dir/core/agents"
  cp -R core/skills/plan-change core/skills/execute-plan core/skills/prepare-project core/skills/migrate-project core/skills/define-project "$dir/core/skills/"
  cp core/agents/planner.md "$dir/core/agents/"
  textos_clave "$dir" || fallo "8b: baseline positivo de la copia temporal falló"
}
neg="$T8/neg"; fixture_workspace "$neg"
sed '/^repos:/d' core/skills/plan-change/SKILL.md > "$neg/core/skills/plan-change/SKILL.md"
if textos_clave "$neg"; then fallo "8b: una copia sin repos: pasó la comprobación de textos"; fi
neg2="$T8/neg2"; fixture_workspace "$neg2"
sed '/Descartado/d' core/skills/migrate-project/SKILL.md > "$neg2/core/skills/migrate-project/SKILL.md"
if textos_clave "$neg2"; then fallo "8b: una copia sin Descartado pasó la comprobación"; fi
neg3="$T8/neg3"; fixture_workspace "$neg3"
rm "$neg3/core/skills/define-project/SKILL.md"
if textos_clave "$neg3" 2>/dev/null; then fallo "8b: una copia sin define-project pasó la comprobación"; fi
neg4="$T8/neg4"; fixture_workspace "$neg4"
sed '/VERIFY_TARGET/d' core/skills/prepare-project/reference.md > "$neg4/core/skills/prepare-project/reference.md"
if textos_clave "$neg4"; then fallo "8b: una copia sin VERIFY_TARGET pasó la comprobación"; fi
echo "ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin define-project o sin VERIFY_TARGET fallan la comprobación"

