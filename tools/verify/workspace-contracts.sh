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
  grep -q 'git -C <carpeta>' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -q -- '-maxdepth 2' "$r/skills/preparar-proyecto/SKILL.md" || return 1
  grep -q 'git -C <carpeta' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -q 'Nunca decides tú' "$r/agentes/principal.md" || return 1
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
  grep -q 'prepárame el despliegue' "$r/agentes/principal.md" || return 1
}
textos_clave . || fallo "8b: falta algún texto clave en los archivos del cambio"
neg="$T8/neg"
mkdir -p "$neg/skills/planificar-cambio" "$neg/skills/ejecutar-plan" "$neg/skills/preparar-proyecto" "$neg/agentes"
cp skills/ejecutar-plan/SKILL.md "$neg/skills/ejecutar-plan/"
cp skills/preparar-proyecto/SKILL.md "$neg/skills/preparar-proyecto/"
cp agentes/constructor.md agentes/principal.md "$neg/agentes/"
sed '/^repos:/d' skills/planificar-cambio/SKILL.md > "$neg/skills/planificar-cambio/SKILL.md"
if textos_clave "$neg"; then fallo "8b: una copia sin repos: pasó la comprobación de textos"; fi
# copia de la skill de migración sin «Descartado» (el resto completo): también debe fallar
neg2="$T8/neg2"
mkdir -p "$neg2/skills/planificar-cambio" "$neg2/skills/ejecutar-plan" "$neg2/skills/preparar-proyecto" "$neg2/skills/migrar-proyecto" "$neg2/agentes"
cp skills/planificar-cambio/SKILL.md "$neg2/skills/planificar-cambio/"
cp skills/ejecutar-plan/SKILL.md "$neg2/skills/ejecutar-plan/"
cp skills/preparar-proyecto/SKILL.md "$neg2/skills/preparar-proyecto/"
cp agentes/constructor.md agentes/principal.md "$neg2/agentes/"
sed '/Descartado/d' skills/migrar-proyecto/SKILL.md > "$neg2/skills/migrar-proyecto/SKILL.md"
if textos_clave "$neg2"; then fallo "8b: una copia de migrar-proyecto sin «Descartado» pasó la comprobación de textos"; fi
# copia completa pero sin la skill definir-proyecto: también debe fallar
neg3="$T8/neg3"
mkdir -p "$neg3/skills/planificar-cambio" "$neg3/skills/ejecutar-plan" "$neg3/skills/preparar-proyecto" "$neg3/skills/migrar-proyecto" "$neg3/agentes"
cp skills/planificar-cambio/SKILL.md "$neg3/skills/planificar-cambio/"
cp skills/ejecutar-plan/SKILL.md "$neg3/skills/ejecutar-plan/"
cp skills/preparar-proyecto/SKILL.md "$neg3/skills/preparar-proyecto/"
cp skills/migrar-proyecto/SKILL.md "$neg3/skills/migrar-proyecto/"
cp agentes/constructor.md agentes/principal.md "$neg3/agentes/"
if textos_clave "$neg3"; then fallo "8b: una copia sin la skill definir-proyecto pasó la comprobación de textos"; fi
# copia completa pero sin VERIFY_TARGET en referencia.md (modo remoto): también debe fallar
neg4="$T8/neg4"
mkdir -p "$neg4/skills/planificar-cambio" "$neg4/skills/ejecutar-plan" "$neg4/skills/preparar-proyecto" "$neg4/skills/migrar-proyecto" "$neg4/skills/definir-proyecto" "$neg4/agentes"
cp skills/planificar-cambio/SKILL.md "$neg4/skills/planificar-cambio/"
cp skills/ejecutar-plan/SKILL.md "$neg4/skills/ejecutar-plan/"
cp skills/preparar-proyecto/SKILL.md "$neg4/skills/preparar-proyecto/"
cp skills/migrar-proyecto/SKILL.md "$neg4/skills/migrar-proyecto/"
cp skills/definir-proyecto/SKILL.md "$neg4/skills/definir-proyecto/"
cp agentes/constructor.md agentes/principal.md "$neg4/agentes/"
sed '/VERIFY_TARGET/d' skills/preparar-proyecto/referencia.md > "$neg4/skills/preparar-proyecto/referencia.md"
if textos_clave "$neg4"; then fallo "8b: una copia sin VERIFY_TARGET en referencia.md pasó la comprobación de textos"; fi
echo "ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin definir-proyecto o sin VERIFY_TARGET fallan la comprobación"

