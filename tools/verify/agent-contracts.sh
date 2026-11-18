# 8i. el constructor ejecuta siempre: planificar-cambio dice «unless the user explicitly asks you to execute» y no «Falla la 2 o la 4»; principal dice «explicit user request»; una copia de planificar-cambio con «Falla la 2 o la 4» debe fallar
textos_constructor() { # $1: raíz del kit
  local r=$1
  grep -qF 'unless the user explicitly asks you to execute' "$r/skills/planificar-cambio/SKILL.md" || return 1
  ! grep -qF 'Falla la 2 o la 4' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'explicit user request' "$r/agentes/principal.md" || return 1
}
textos_constructor . || fallo "8i: falta algún texto de constructor por defecto"
cons_neg="$T8/cons_neg"
mkdir -p "$cons_neg/skills/planificar-cambio" "$cons_neg/agentes"
cp agentes/principal.md "$cons_neg/agentes/"
{ cat skills/planificar-cambio/SKILL.md; echo 'Falla la 2 o la 4: `ejecutor: principal`.'; } > "$cons_neg/skills/planificar-cambio/SKILL.md"
if textos_constructor "$cons_neg"; then fallo "8i: una copia de planificar-cambio con «Falla la 2 o la 4» pasó la comprobación"; fi
echo "ok 8i: planificar-cambio dice «unless the user explicitly asks you to execute» sin «Falla la 2 o la 4»; principal dice «explicit user request»; copia con «Falla la 2 o la 4» falla"

# 8k. principal sin permisos amplios: agentes/principal.md trae «You may create or edit only files», «APROBADO», «do not fix it» y «one long wait», y no trae «Fuera de eso no tienes límites»; copias sin «You may create or edit only files» o con esa frase deben fallar
textos_principal() { # $1: raíz del kit
  local r=$1
  grep -qF 'You may create or edit only files' "$r/agentes/principal.md" || return 1
  grep -qF 'APROBADO' "$r/agentes/principal.md" || return 1
  grep -qF 'do not fix it' "$r/agentes/principal.md" || return 1
  grep -qF 'one long wait' "$r/agentes/principal.md" || return 1
  ! grep -qF 'Fuera de eso no tienes límites' "$r/agentes/principal.md" || return 1
}
textos_principal . || fallo "8k: falta algún texto de permisos o veredicto del principal"
principal_neg="$T8/principal_neg"
mkdir -p "$principal_neg/agentes"
sed 's/You may create or edit only files/Creas o editas/' agentes/principal.md > "$principal_neg/agentes/principal.md"
if textos_principal "$principal_neg"; then fallo "8k: un principal sin «You may create or edit only files» pasó la comprobación"; fi
{ cat agentes/principal.md; echo 'Fuera de eso no tienes límites.'; } > "$principal_neg/agentes/principal.md"
if textos_principal "$principal_neg"; then fallo "8k: un principal con «Fuera de eso no tienes límites» pasó la comprobación"; fi
echo "ok 8k: principal con «You may create or edit only files», «APROBADO», «do not fix it» y «one long wait»; copias sin la lista o con la frase vieja fallan"

# 8l. principal de Codex: agentes/principal.md trae la receta de espera de verify (yield_time_ms: 300000 y «do not count»); una copia sin la primera cadena debe fallar
textos_espera() { # $1: raíz del kit
  local r=$1
  grep -qF 'yield_time_ms: 300000' "$r/agentes/principal.md" || return 1
  grep -qF 'do not count' "$r/agentes/principal.md" || return 1
}
textos_espera . || fallo "8l: falta la receta de espera de verify en principal.md"
espera_neg="$T8/espera_neg"
mkdir -p "$espera_neg/agentes"
sed 's/yield_time_ms: 300000/espera larga/' agentes/principal.md > "$espera_neg/agentes/principal.md"
if textos_espera "$espera_neg"; then fallo "8l: un principal sin «yield_time_ms: 300000» pasó la comprobación"; fi
echo "ok 8l: principal con «yield_time_ms: 300000» y «do not count»; copia sin la receta falla"

# 8m. los agentes siguen el idioma actual de la persona y mantienen sus mensajes de programa en español; copias sin la regla deben fallar
textos_idioma() { # $1: raíz del kit
  local r=$1
  grep -qF 'Always respond in the language the user is currently using.' "$r/core/agents/principal.md" || return 1
  grep -qF 'switch languages whenever they do.' "$r/core/agents/principal.md" || return 1
  grep -qF 'Program output remains Spanish.' "$r/core/agents/principal.md" || return 1
  grep -qF 'Respond in the language the user is currently using.' "$r/core/agents/constructor.md" || return 1
  grep -qF 'switch whenever they do.' "$r/core/agents/constructor.md" || return 1
  grep -qF 'Messages emitted by commands remain Spanish.' "$r/core/agents/constructor.md" || return 1
}
textos_idioma . || fallo "8m: falta la regla de idioma adaptable en los agentes"
idioma_neg="$T8/idioma_neg"
mkdir -p "$idioma_neg/core/agents"
sed '/Always respond in the language the user is currently using\./d' core/agents/principal.md > "$idioma_neg/core/agents/principal.md"
cp core/agents/constructor.md "$idioma_neg/core/agents/constructor.md"
if textos_idioma "$idioma_neg"; then fallo "8m: un principal sin la regla de idioma adaptable pasó la comprobación"; fi
echo "ok 8m: ambos agentes declaran adaptación al idioma y salida española; copia sin la regla falla"

