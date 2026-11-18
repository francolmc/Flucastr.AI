# 8. workspaces: la detección de preparar-proyecto y los textos clave de los archivos del cambio
paso 8 "workspaces (detección con find, textos clave de los archivos del cambio)"
command -v git >/dev/null 2>&1 || fallo "falta git en el PATH"
T8=$(mktemp -d) || fallo "no pude crear el temporal"
trap '[ -n "${T6:-}" ] && rm -rf "$T6"; [ -n "${T7:-}" ] && rm -rf "$T7"; [ -n "${T8:-}" ] && rm -rf "$T8"' EXIT

# 8a. workspace con dos hijos con .git y raíz sin .git: el find de preparar-proyecto devuelve exactamente 2
w="$T8/ws"; mkdir -p "$w/api" "$w/web"
git -C "$w/api" init -q && git -C "$w/web" init -q
[ ! -e "$w/.git" ] || fallo "8a: la raíz del temporal tiene .git"
n=$(cd "$w" && find . -maxdepth 2 -name .git -not -path './.git' | grep -c .) || true
[ "$n" = 2 ] || fallo "8a: el find devolvió $n hijos con .git, se esperaban 2"
echo "ok 8a: workspace con dos hijos con .git -> find devuelve 2"

# 8b. los archivos del cambio contienen sus textos clave; una copia sin repos: debe fallar
textos_clave() { # $1: raíz del kit
  local r=$1
  grep -q '^repos:' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -q 'repos:' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -q 'git -C <folder>' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -q -- '-maxdepth 2' "$r/skills/preparar-proyecto/SKILL.md" || return 1
  grep -q 'git -C <folder' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -q 'Never decide “single repository or multi-repository workspace”' "$r/agentes/principal.md" || return 1
  grep -q 'REPOS.md' "$r/skills/migrar-proyecto/SKILL.md" || return 1
  grep -q 'Descartado' "$r/skills/migrar-proyecto/SKILL.md" || return 1
  grep -q 'repos:' "$r/skills/migrar-proyecto/SKILL.md" || return 1
  grep -q 'definir-proyecto' "$r/agentes/principal.md" || return 1
  grep -q 'repo o un workspace' "$r/skills/definir-proyecto/SKILL.md" || return 1
  grep -q 'docs/proyecto.md' "$r/skills/definir-proyecto/SKILL.md" || return 1
  grep -q 'Fuera de alcance' "$r/skills/definir-proyecto/SKILL.md" || return 1
  grep -q 'VERIFY_TARGET' "$r/skills/preparar-proyecto/referencia.md" || return 1
  grep -q 'VERIFY_PERMITIR_ESCRITURA' "$r/skills/preparar-proyecto/referencia.md" || return 1
  grep -q 'Despliegue' "$r/skills/preparar-proyecto/SKILL.md" || return 1
  grep -q 'Despliegue' "$r/skills/definir-proyecto/SKILL.md" || return 1
  grep -q 'prepare deployment' "$r/agentes/principal.md" || return 1
}
textos_clave . || fallo "8b: falta algún texto clave en los archivos del cambio"
fixture_workspace() {
  local dir=$1
  mkdir -p "$dir/skills" "$dir/agentes"
  cp -R skills/planificar-cambio skills/ejecutar-plan skills/preparar-proyecto skills/migrar-proyecto skills/definir-proyecto "$dir/skills/"
  cp agentes/principal.md "$dir/agentes/"
  textos_clave "$dir" || fallo "8b: baseline positivo de la copia temporal falló"
}
neg="$T8/neg"; fixture_workspace "$neg"
sed '/^repos:/d' skills/planificar-cambio/SKILL.md > "$neg/skills/planificar-cambio/SKILL.md"
if textos_clave "$neg"; then fallo "8b: una copia sin repos: pasó la comprobación de textos"; fi
neg2="$T8/neg2"; fixture_workspace "$neg2"
sed '/Descartado/d' skills/migrar-proyecto/SKILL.md > "$neg2/skills/migrar-proyecto/SKILL.md"
if textos_clave "$neg2"; then fallo "8b: una copia sin Descartado pasó la comprobación"; fi
neg3="$T8/neg3"; fixture_workspace "$neg3"
rm "$neg3/skills/definir-proyecto/SKILL.md"
if textos_clave "$neg3" 2>/dev/null; then fallo "8b: una copia sin definir-proyecto pasó la comprobación"; fi
neg4="$T8/neg4"; fixture_workspace "$neg4"
sed '/VERIFY_TARGET/d' skills/preparar-proyecto/referencia.md > "$neg4/skills/preparar-proyecto/referencia.md"
if textos_clave "$neg4"; then fallo "8b: una copia sin VERIFY_TARGET pasó la comprobación"; fi
echo "ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin definir-proyecto o sin VERIFY_TARGET fallan la comprobación"

