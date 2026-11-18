# 8e. plazos: VERIFY_RAPIDO en reference.md, prohibición de docker system prune en planner.md, timeoutMs en builder.md; una copia sin VERIFY_RAPIDO debe fallar
textos_plazos() { # $1: raíz del kit
  local r=$1
  grep -qF 'VERIFY_RAPIDO' "$r/core/skills/prepare-project/reference.md" || return 1
  grep -qF 'docker system prune' "$r/core/agents/planner.md" || return 1
  grep -qF 'timeoutMs' "$r/core/agents/builder.md" || return 1
}
textos_plazos . || fallo "8e: falta algún texto de plazos"
pneg="$T8/pneg"
mkdir -p "$pneg/core/skills/prepare-project" "$pneg/core/agents"
cp core/agents/planner.md core/agents/builder.md "$pneg/core/agents/"
sed 's/VERIFY_RAPIDO/VERIFY_X/g' core/skills/prepare-project/reference.md > "$pneg/core/skills/prepare-project/reference.md"
if textos_plazos "$pneg"; then fallo "8e: una copia sin VERIFY_RAPIDO pasó la comprobación"; fi
node scripts/resolver.mjs agente-claude core/agents/builder.md | grep -q '^timeoutMs: ' || fallo "8e: el agente de Claude no resuelve con timeoutMs"
echo "ok 8e: VERIFY_RAPIDO, docker system prune prohibido y timeoutMs presentes; el agente de Claude resuelve; copia sin VERIFY_RAPIDO falla"

# 8f. closure ceremony y base limpia: planner, builder y execute-plan; una copia de planner sin «closure ceremony» debe fallar
textos_cierre() { # $1: raíz del kit
  local r=$1
  grep -qF 'closure ceremony' "$r/core/agents/planner.md" || return 1
  grep -qF 'open a PR' "$r/core/agents/planner.md" || return 1
  grep -qF 'git status' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -qF 'base branch' "$r/core/skills/execute-plan/SKILL.md" || return 1
}
textos_cierre . || fallo "8f: falta algún texto de cierre o base limpia"
cierre_neg="$T8/cierre_neg"
mkdir -p "$cierre_neg/core/skills/execute-plan" "$cierre_neg/core/agents"
cp core/agents/builder.md "$cierre_neg/core/agents/"
cp core/skills/execute-plan/SKILL.md "$cierre_neg/core/skills/execute-plan/"
sed 's/closure ceremony/cierre/g' core/agents/planner.md > "$cierre_neg/core/agents/planner.md"
if textos_cierre "$cierre_neg"; then fallo "8f: un planner sin «closure ceremony» pasó la comprobación"; fi
echo "ok 8f: closure ceremony, open a PR y base branch presentes; copia sin «closure ceremony» falla"

# 8g. ejecutor por prueba de ejecutabilidad: plan-change y planner; una copia de plan-change sin «executability test» debe fallar
textos_prueba() { # $1: raíz del kit
  local r=$1
  grep -qF 'executability test' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'Executability Test' "$r/core/agents/planner.md" || return 1
  grep -qF 'load `execute-plan`' "$r/core/agents/planner.md" || return 1
}
textos_prueba . || fallo "8g: falta algún texto de la prueba de ejecutabilidad"
prueba_neg="$T8/prueba_neg"
mkdir -p "$prueba_neg/core/skills/plan-change" "$prueba_neg/core/agents"
cp core/agents/planner.md "$prueba_neg/core/agents/"
sed 's/executability test/Prueba/g' core/skills/plan-change/SKILL.md > "$prueba_neg/core/skills/plan-change/SKILL.md"
if textos_prueba "$prueba_neg"; then fallo "8g: una copia sin «executability test» pasó la comprobación"; fi
echo "ok 8g: executability test en plan-change y planner, y carga de execute-plan presentes; copia sin la prueba falla"

# 8h. base branch: plan-change, planner y skill de ejecución
textos_base() { # $1: raíz del kit
  local r=$1
  grep -qF 'base:' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'targeting `base:`' "$r/core/agents/planner.md" || return 1
  grep -qF 'base:' "$r/core/skills/execute-plan/SKILL.md" || return 1
}
textos_base . || fallo "8h: falta algún texto de base branch"
base_neg="$T8/base_neg"
mkdir -p "$base_neg/core/skills/plan-change" "$base_neg/core/skills/execute-plan" "$base_neg/core/agents"
cp core/skills/plan-change/SKILL.md "$base_neg/core/skills/plan-change/"
cp core/agents/planner.md "$base_neg/core/agents/"
sed '/base:/d' core/skills/execute-plan/SKILL.md > "$base_neg/core/skills/execute-plan/SKILL.md"
if textos_base "$base_neg"; then fallo "8h: una copia sin base branch pasó la comprobación"; fi
echo "ok 8h: base branch documentada; copia sin base falla"

