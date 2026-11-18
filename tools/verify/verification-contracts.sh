# 8m. niveles de verificación: plan-change (reglas 11 y 13), prepare-project y execute-plan; una copia de plan-change sin «Verification levels» debe fallar
textos_niveles() { # $1: raíz del kit
  local r=$1
  grep -qF 'Verification levels' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'Comprobación rápida' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'Level 2' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'Sin esa línea' "$r/core/skills/prepare-project/SKILL.md" || return 1
  grep -qF 'Comprobación rápida' "$r/core/skills/execute-plan/SKILL.md" || return 1
}
textos_niveles . || fallo "8m: falta algún texto de los niveles de verificación"
niveles_neg="$T8/niveles_neg"
mkdir -p "$niveles_neg/core/skills/plan-change" "$niveles_neg/core/skills/prepare-project" "$niveles_neg/core/skills/execute-plan"
cp core/skills/plan-change/SKILL.md "$niveles_neg/core/skills/plan-change/SKILL.md"
cp core/skills/prepare-project/SKILL.md "$niveles_neg/core/skills/prepare-project/SKILL.md"
cp core/skills/execute-plan/SKILL.md "$niveles_neg/core/skills/execute-plan/SKILL.md"
textos_niveles "$niveles_neg" || fallo "8m: baseline positivo de la copia temporal falló"
sed '/Verification levels/d' core/skills/plan-change/SKILL.md > "$niveles_neg/core/skills/plan-change/SKILL.md"
if textos_niveles "$niveles_neg"; then fallo "8m: una copia de plan-change sin «Verification levels» pasó la comprobación"; fi
echo "ok 8m: niveles de verificación en plan-change, «Sin esa línea» en prepare-project y Comprobación rápida en execute-plan; copia sin «Verification levels» falla"

# 8n. planner reanuda la espera: core/agents/planner.md trae «resume waiting in the same turn» en el paso 4; una copia sin esa frase debe fallar
textos_reanuda() { # $1: raíz del kit
  local r=$1
  grep -qF 'resume waiting in the same turn' "$r/core/agents/planner.md" || return 1
}
textos_reanuda . || fallo "8n: falta «resume waiting in the same turn» en planner.md"
reanuda_neg="$T8/reanuda_neg"
mkdir -p "$reanuda_neg/core/agents"
sed 's/resume waiting in the same turn/termina el turno/' core/agents/planner.md > "$reanuda_neg/core/agents/planner.md"
if textos_reanuda "$reanuda_neg"; then fallo "8n: un planner sin «resume waiting in the same turn» pasó la comprobación"; fi
echo "ok 8n: planner con «resume waiting in the same turn» en el paso 4; copia sin la frase falla"

# 8o. experiencia antes del plan: design-experience trae sus cadenas (A1); plan-change enlaza pantallas.md (A2); define-project y planner la nombran (A3); una copia sin «40 columns» debe fallar (A4)
textos_experiencia() { # $1: raíz del kit
  local r=$1 t
  for t in 'docs/experiencia.md' 'pantallas.md' 'ASCII' '40 columns' 'empty' 'error'; do
    grep -qF -- "$t" "$r/core/skills/design-experience/SKILL.md" || return 1
  done
  grep -qF 'design-experience' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'pantallas.md' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'design-experience' "$r/core/skills/define-project/SKILL.md" || return 1
  grep -qF 'design-experience' "$r/core/agents/planner.md" || return 1
}
textos_experiencia . || fallo "8o: falta algún texto de design-experience o de su enlace"
exp_neg="$T8/exp_neg"
mkdir -p "$exp_neg/core/skills/design-experience" "$exp_neg/core/skills/plan-change" "$exp_neg/core/skills/define-project" "$exp_neg/core/agents"
cp core/skills/design-experience/SKILL.md "$exp_neg/core/skills/design-experience/"
cp core/skills/plan-change/SKILL.md "$exp_neg/core/skills/plan-change/"
cp core/skills/define-project/SKILL.md "$exp_neg/core/skills/define-project/"
cp core/agents/planner.md "$exp_neg/core/agents/"
textos_experiencia "$exp_neg" || fallo "8o: baseline positivo de la copia temporal falló"
sed '/40 columns/d' core/skills/design-experience/SKILL.md > "$exp_neg/core/skills/design-experience/SKILL.md"
if textos_experiencia "$exp_neg"; then fallo "8o: una copia de design-experience sin «40 columns» pasó la comprobación"; fi
echo "ok 8o: design-experience con sus cadenas, enlazada en plan-change, define-project y planner; copia sin «40 columns» falla"

