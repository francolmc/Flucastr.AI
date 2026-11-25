# 8i. el builder ejecuta siempre: plan-change dice «unless the user explicitly asks you to execute» y no «Falla la 2 o la 4»; planner dice «explicit user request»; una copia de plan-change con «Falla la 2 o la 4» debe fallar
textos_builder() { # $1: raíz del kit
  local r=$1
  grep -qF 'unless the user explicitly asks you to execute' "$r/core/skills/plan-change/SKILL.md" || return 1
  ! grep -qF 'Falla la 2 o la 4' "$r/core/skills/plan-change/SKILL.md" || return 1
  grep -qF 'explicit user request' "$r/core/agents/planner.md" || return 1
}
textos_builder . || fallo "8i: falta algún texto de builder por defecto"
cons_neg="$T8/cons_neg"
mkdir -p "$cons_neg/core/skills/plan-change" "$cons_neg/core/agents"
cp core/agents/planner.md "$cons_neg/core/agents/"
{ cat core/skills/plan-change/SKILL.md; echo 'Falla la 2 o la 4: `executor: planner`.'; } > "$cons_neg/core/skills/plan-change/SKILL.md"
if textos_builder "$cons_neg"; then fallo "8i: una copia de plan-change con «Falla la 2 o la 4» pasó la comprobación"; fi
echo "ok 8i: plan-change dice «unless the user explicitly asks you to execute» sin «Falla la 2 o la 4»; planner dice «explicit user request»; copia con «Falla la 2 o la 4» falla"

# 8k. planner sin permisos amplios: core/agents/planner.md trae «You may create or edit only files», «APPROVED», «do not fix it» y «one long wait», y no trae «Fuera de eso no tienes límites»; copias sin «You may create or edit only files» o con esa frase deben fallar
textos_planner() { # $1: raíz del kit
  local r=$1
  grep -qF 'You may create or edit only files' "$r/core/agents/planner.md" || return 1
  grep -qF 'APPROVED' "$r/core/agents/planner.md" || return 1
  grep -qF 'do not fix it' "$r/core/agents/planner.md" || return 1
  grep -qF 'one long wait' "$r/core/agents/planner.md" || return 1
  ! grep -qF 'Fuera de eso no tienes límites' "$r/core/agents/planner.md" || return 1
}
textos_planner . || fallo "8k: falta algún texto de permisos o veredicto del planner"
planner_neg="$T8/planner_neg"
mkdir -p "$planner_neg/core/agents"
sed 's/You may create or edit only files/Creas o editas/' core/agents/planner.md > "$planner_neg/core/agents/planner.md"
if textos_planner "$planner_neg"; then fallo "8k: un planner sin «You may create or edit only files» pasó la comprobación"; fi
{ cat core/agents/planner.md; echo 'Fuera de eso no tienes límites.'; } > "$planner_neg/core/agents/planner.md"
if textos_planner "$planner_neg"; then fallo "8k: un planner con «Fuera de eso no tienes límites» pasó la comprobación"; fi
echo "ok 8k: planner con «You may create or edit only files», «APPROVED», «do not fix it» y «one long wait»; copias sin la lista o con la frase vieja fallan"

# 8l. planner de Codex: core/agents/planner.md trae la receta de espera de verify (yield_time_ms: 300000 y «do not count»); una copia sin la primera cadena debe fallar
textos_espera() { # $1: raíz del kit
  local r=$1
  grep -qF 'yield_time_ms: 300000' "$r/core/agents/planner.md" || return 1
  grep -qF 'do not count' "$r/core/agents/planner.md" || return 1
}
textos_espera . || fallo "8l: falta la receta de espera de verify en planner.md"
espera_neg="$T8/espera_neg"
mkdir -p "$espera_neg/core/agents"
sed 's/yield_time_ms: 300000/espera larga/' core/agents/planner.md > "$espera_neg/core/agents/planner.md"
if textos_espera "$espera_neg"; then fallo "8l: un planner sin «yield_time_ms: 300000» pasó la comprobación"; fi
echo "ok 8l: planner con «yield_time_ms: 300000» y «do not count»; copia sin la receta falla"

# 8m. los agentes siguen el idioma actual de la persona y mantienen sus mensajes de programa en español; copias sin la regla deben fallar
textos_idioma() { # $1: raíz del kit
  local r=$1
  grep -qF 'Always respond in the language the user is currently using.' "$r/core/agents/planner.md" || return 1
  grep -qF 'switch languages whenever they do.' "$r/core/agents/planner.md" || return 1
  grep -qF 'Program output remains Spanish.' "$r/core/agents/planner.md" || return 1
  grep -qF 'Respond in the language the user is currently using.' "$r/core/agents/builder.md" || return 1
  grep -qF 'switch whenever they do.' "$r/core/agents/builder.md" || return 1
  grep -qF 'Messages emitted by commands remain Spanish.' "$r/core/agents/builder.md" || return 1
}
textos_idioma . || fallo "8m: falta la regla de idioma adaptable en los agentes"
idioma_neg="$T8/idioma_neg"
mkdir -p "$idioma_neg/core/agents"
sed '/Always respond in the language the user is currently using\./d' core/agents/planner.md > "$idioma_neg/core/agents/planner.md"
cp core/agents/builder.md "$idioma_neg/core/agents/builder.md"
if textos_idioma "$idioma_neg"; then fallo "8m: un planner sin la regla de idioma adaptable pasó la comprobación"; fi
echo "ok 8m: ambos agentes declaran adaptación al idioma y salida española; copia sin la regla falla"

# 8p. receta de write_stdin en Codex: execute-plan y builder.md traen «1800000» y «session_id», y planner.md trae «session_id»; copias sin «1800000» o sin «session_id» deben fallar
textos_wstdin() { # $1: raíz del kit
  local r=$1
  grep -qF '1800000' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -qF 'session_id' "$r/core/skills/execute-plan/SKILL.md" || return 1
  grep -qF '1800000' "$r/core/agents/builder.md" || return 1
  grep -qF 'session_id' "$r/core/agents/builder.md" || return 1
  grep -qF 'session_id' "$r/core/agents/planner.md" || return 1
}
textos_wstdin . || fallo "8p: falta la receta de write_stdin (session_id y 1800000) en execute-plan, builder o planner"
wstdin_sin_1800000="$T8/wstdin_sin_1800000"
mkdir -p "$wstdin_sin_1800000/core/skills/execute-plan" "$wstdin_sin_1800000/core/agents"
sed 's/1800000/espera larga/g' core/skills/execute-plan/SKILL.md > "$wstdin_sin_1800000/core/skills/execute-plan/SKILL.md"
sed 's/1800000/espera larga/g' core/agents/builder.md > "$wstdin_sin_1800000/core/agents/builder.md"
cp core/agents/planner.md "$wstdin_sin_1800000/core/agents/"
if textos_wstdin "$wstdin_sin_1800000"; then fallo "8p: una receta sin «1800000» pasó la comprobación"; fi
wstdin_sin_session="$T8/wstdin_sin_session"
mkdir -p "$wstdin_sin_session/core/skills/execute-plan" "$wstdin_sin_session/core/agents"
sed 's/session_id/sesion/g' core/skills/execute-plan/SKILL.md > "$wstdin_sin_session/core/skills/execute-plan/SKILL.md"
sed 's/session_id/sesion/g' core/agents/builder.md > "$wstdin_sin_session/core/agents/builder.md"
sed 's/session_id/sesion/g' core/agents/planner.md > "$wstdin_sin_session/core/agents/planner.md"
if textos_wstdin "$wstdin_sin_session"; then fallo "8p: una receta sin «session_id» pasó la comprobación"; fi
echo "ok 8p: receta de write_stdin con «session_id» y «1800000» en execute-plan y builder, «session_id» en planner; copias sin «1800000» o sin «session_id» fallan"

