# 8i. el constructor ejecuta siempre: planificar-cambio dice «salvo que la persona usuaria» y no «Falla la 2 o la 4»; principal dice «petición expresa»; una copia de planificar-cambio con «Falla la 2 o la 4» debe fallar
textos_constructor() { # $1: raíz del kit
  local r=$1
  grep -qF 'salvo que la persona usuaria' "$r/skills/planificar-cambio/SKILL.md" || return 1
  ! grep -qF 'Falla la 2 o la 4' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'petición expresa' "$r/agentes/principal.md" || return 1
}
textos_constructor . || fallo "8i: falta algún texto de constructor por defecto"
cons_neg="$T8/cons_neg"
mkdir -p "$cons_neg/skills/planificar-cambio" "$cons_neg/agentes"
cp agentes/principal.md "$cons_neg/agentes/"
{ cat skills/planificar-cambio/SKILL.md; echo 'Falla la 2 o la 4: `ejecutor: principal`.'; } > "$cons_neg/skills/planificar-cambio/SKILL.md"
if textos_constructor "$cons_neg"; then fallo "8i: una copia de planificar-cambio con «Falla la 2 o la 4» pasó la comprobación"; fi
echo "ok 8i: planificar-cambio dice «salvo que la persona usuaria» sin «Falla la 2 o la 4»; principal dice «petición expresa»; copia con «Falla la 2 o la 4» falla"

# 8k. principal sin permisos amplios: agentes/principal.md trae «Solo creas o editas», «APROBADO», «no corriges» y «una sola espera», y no trae «Fuera de eso no tienes límites»; copias sin «Solo creas o editas» o con esa frase deben fallar
textos_principal() { # $1: raíz del kit
  local r=$1
  grep -qF 'Solo creas o editas' "$r/agentes/principal.md" || return 1
  grep -qF 'APROBADO' "$r/agentes/principal.md" || return 1
  grep -qF 'no corriges' "$r/agentes/principal.md" || return 1
  grep -qF 'una sola espera' "$r/agentes/principal.md" || return 1
  ! grep -qF 'Fuera de eso no tienes límites' "$r/agentes/principal.md" || return 1
}
textos_principal . || fallo "8k: falta algún texto de permisos o veredicto del principal"
principal_neg="$T8/principal_neg"
mkdir -p "$principal_neg/agentes"
sed 's/Solo creas o editas/Creas o editas/' agentes/principal.md > "$principal_neg/agentes/principal.md"
if textos_principal "$principal_neg"; then fallo "8k: un principal sin «Solo creas o editas» pasó la comprobación"; fi
{ cat agentes/principal.md; echo 'Fuera de eso no tienes límites.'; } > "$principal_neg/agentes/principal.md"
if textos_principal "$principal_neg"; then fallo "8k: un principal con «Fuera de eso no tienes límites» pasó la comprobación"; fi
echo "ok 8k: principal con «Solo creas o editas», «APROBADO», «no corriges» y «una sola espera»; copias sin la lista o con la frase vieja fallan"

# 8l. principal de Codex: agentes/principal.md trae la receta de espera de verify (yield_time_ms: 300000 y «no cuentan»); una copia sin la primera cadena debe fallar
textos_espera() { # $1: raíz del kit
  local r=$1
  grep -qF 'yield_time_ms: 300000' "$r/agentes/principal.md" || return 1
  grep -qF 'no cuentan' "$r/agentes/principal.md" || return 1
}
textos_espera . || fallo "8l: falta la receta de espera de verify en principal.md"
espera_neg="$T8/espera_neg"
mkdir -p "$espera_neg/agentes"
sed 's/yield_time_ms: 300000/espera larga/' agentes/principal.md > "$espera_neg/agentes/principal.md"
if textos_espera "$espera_neg"; then fallo "8l: un principal sin «yield_time_ms: 300000» pasó la comprobación"; fi
echo "ok 8l: principal con «yield_time_ms: 300000» y «no cuentan»; copia sin la receta falla"

