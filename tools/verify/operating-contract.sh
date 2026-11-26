# 8c. contrato operativo: skill única, contador canónico y recuperación; revisión de texto es regresión auxiliar
textos_contrato() { # $1: raíz del kit
  local r=$1 f
  grep -qF 'bash pendientes-plan' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -qF 'awk' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -qF 'siguiente=' "$r/core/agents/builder.md" || return 1
  grep -qF 'no_intentado=' "$r/core/agents/builder.md" || return 1
  grep -qF '3 runs' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -qF 'git diff' "$r/core/agents/planner.md" || return 1
  grep -qF 'Read and follow the `execute-plan` skill' "$r/core/agents/builder.md" || return 1
  grep -qF 'status`, `diff`, `branch --show-current`, `rev-parse --verify --quiet`, and `symbolic-ref' "$r/core/agents/builder.md" || return 1
  grep -qF 'rereading relevant material after edits or recovery' "$r/core/skills/execute-plan/SKILL.md" || return 1
  if grep -qF "grep -c '^- \[ \]'" "$r/core/agents/builder.md"; then return 1; fi
  if grep -qF 'no releas lo ya leído' "$r/core/agents/builder.md" || grep -qF 'Git permitido, solo en las carpetas de `repos:`' "$r/core/agents/builder.md"; then return 1; fi
}
textos_contrato . || fallo "8c: falta algún texto del contrato del builder"
cneg="$T8/cneg"
mkdir -p "$cneg/core/agents" "$cneg/core/skills/execute-plan"
restaurar_cneg() {
  cp core/agents/builder.md core/agents/planner.md "$cneg/core/agents/"
  cp core/skills/execute-plan/SKILL.md "$cneg/core/skills/execute-plan/"
}
restaurar_cneg
textos_contrato "$cneg" || fallo "8c: baseline positivo del fixture temporal falló"
sed '/bash pendientes-plan/d' core/skills/execute-plan/SKILL.md > "$cneg/core/skills/execute-plan/SKILL.md"
if textos_contrato "$cneg"; then fallo "8c: skill sin contador canónico pasó la comprobación"; fi
echo "ok 8c negativa 1: skill sin contador rechazado"
restaurar_cneg
textos_contrato "$cneg" || fallo "8c: baseline positivo antes de whitelist Git falló"
printf '\n- Git permitido, solo en las carpetas de `repos:`: branch --show-current y rev-parse.\n' >> "$cneg/core/agents/builder.md"
if textos_contrato "$cneg"; then fallo "8c: whitelist Git obsoleta pasó la comprobación"; fi
echo "ok 8c negativa 2: whitelist Git obsoleta rechazada"
restaurar_cneg
textos_contrato "$cneg" || fallo "8c: baseline positivo antes de prohibición de relectura falló"
printf '\n- no releas lo ya leído.\n' >> "$cneg/core/agents/builder.md"
if textos_contrato "$cneg"; then fallo "8c: prohibición de relectura obsoleta pasó la comprobación"; fi
echo "ok 8c negativa 3: prohibición de relectura obsoleta rechazada"
echo "ok 8c: contador canónico y negativas aisladas de los límites antiguos"

# 8d. executor y pasos atómicos: plan-change, planner y README; una copia de plan-change sin executor: debe fallar
textos_executor() { # $1: raíz del kit
  local r=$1
  grep -qF 'executor:' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF '20 words' "$r/core/skills/plan-change/SKILL.md" || return 1
  if grep -qF '60 words' "$r/core/skills/plan-change/SKILL.md"; then return 1; fi
  grep -qF 'executor: planner' "$r/core/agents/planner.md" || return 1
  grep -qF 'claude-builder' "$r/core/agents/planner.md" || return 1
  grep -qF 'pi-builder' "$r/README.md" || return 1
}
textos_executor . || fallo "8d: falta algún texto de executor o de pasos atómicos"
eneg="$T8/eneg"
mkdir -p "$eneg/core/skills/plan-change" "$eneg/core/agents"
cp core/agents/planner.md "$eneg/core/agents/"
cp README.md "$eneg/"
sed 's/executor:/executor/g' core/skills/plan-change/SKILL.md > "$eneg/core/skills/plan-change/SKILL.md"
if textos_executor "$eneg"; then fallo "8d: una copia de plan-change sin executor: pasó la comprobación"; fi
echo "ok 8d: executor:, 20 words (sin 60 words), ventana propia y pi-builder presentes; copia sin executor: falla"

