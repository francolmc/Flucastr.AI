# 8m. niveles de verificación: planificar-cambio (reglas 11 y 13), preparar-proyecto y ejecutar-plan; una copia de planificar-cambio sin «Niveles de verificación» debe fallar
textos_niveles() { # $1: raíz del kit
  local r=$1
  grep -qF 'Niveles de verificación' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'Comprobación rápida' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'Nivel 2' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'Sin esa línea' "$r/skills/preparar-proyecto/SKILL.md" || return 1
  grep -qF 'Comprobación rápida' "$r/skills/ejecutar-plan/SKILL.md" || return 1
}
textos_niveles . || fallo "8m: falta algún texto de los niveles de verificación"
niveles_neg="$T8/niveles_neg"
mkdir -p "$niveles_neg/skills/planificar-cambio" "$niveles_neg/skills/preparar-proyecto" "$niveles_neg/skills/ejecutar-plan"
cp skills/planificar-cambio/SKILL.md "$niveles_neg/skills/planificar-cambio/SKILL.md"
cp skills/preparar-proyecto/SKILL.md "$niveles_neg/skills/preparar-proyecto/SKILL.md"
cp skills/ejecutar-plan/SKILL.md "$niveles_neg/skills/ejecutar-plan/SKILL.md"
textos_niveles "$niveles_neg" || fallo "8m: baseline positivo de la copia temporal falló"
sed '/Niveles de verificación/d' skills/planificar-cambio/SKILL.md > "$niveles_neg/skills/planificar-cambio/SKILL.md"
if textos_niveles "$niveles_neg"; then fallo "8m: una copia de planificar-cambio sin «Niveles de verificación» pasó la comprobación"; fi
echo "ok 8m: niveles de verificación en planificar-cambio, «Sin esa línea» en preparar-proyecto y Comprobación rápida en ejecutar-plan; copia sin «Niveles de verificación» falla"

# 8n. principal reanuda la espera: agentes/principal.md trae «vuelve a esperar en el mismo turno» en el paso 4; una copia sin esa frase debe fallar
textos_reanuda() { # $1: raíz del kit
  local r=$1
  grep -qF 'vuelve a esperar en el mismo turno' "$r/agentes/principal.md" || return 1
}
textos_reanuda . || fallo "8n: falta «vuelve a esperar en el mismo turno» en principal.md"
reanuda_neg="$T8/reanuda_neg"
mkdir -p "$reanuda_neg/agentes"
sed 's/vuelve a esperar en el mismo turno/termina el turno/' agentes/principal.md > "$reanuda_neg/agentes/principal.md"
if textos_reanuda "$reanuda_neg"; then fallo "8n: un principal sin «vuelve a esperar en el mismo turno» pasó la comprobación"; fi
echo "ok 8n: principal con «vuelve a esperar en el mismo turno» en el paso 4; copia sin la frase falla"

# 8o. experiencia antes del plan: disenar-experiencia trae sus cadenas (A1); planificar-cambio enlaza pantallas.md (A2); definir-proyecto y principal la nombran (A3); una copia sin «40 columnas» debe fallar (A4)
textos_experiencia() { # $1: raíz del kit
  local r=$1 t
  for t in 'docs/experiencia.md' 'pantallas.md' 'ASCII' '40 columnas' 'vacío' 'error'; do
    grep -qF -- "$t" "$r/skills/disenar-experiencia/SKILL.md" || return 1
  done
  grep -qF 'disenar-experiencia' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'pantallas.md' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'disenar-experiencia' "$r/skills/definir-proyecto/SKILL.md" || return 1
  grep -qF 'disenar-experiencia' "$r/agentes/principal.md" || return 1
}
textos_experiencia . || fallo "8o: falta algún texto de disenar-experiencia o de su enlace"
exp_neg="$T8/exp_neg"
mkdir -p "$exp_neg/skills/disenar-experiencia" "$exp_neg/skills/planificar-cambio" "$exp_neg/skills/definir-proyecto" "$exp_neg/agentes"
cp skills/disenar-experiencia/SKILL.md "$exp_neg/skills/disenar-experiencia/"
cp skills/planificar-cambio/SKILL.md "$exp_neg/skills/planificar-cambio/"
cp skills/definir-proyecto/SKILL.md "$exp_neg/skills/definir-proyecto/"
cp agentes/principal.md "$exp_neg/agentes/"
textos_experiencia "$exp_neg" || fallo "8o: baseline positivo de la copia temporal falló"
sed '/40 columnas/d' skills/disenar-experiencia/SKILL.md > "$exp_neg/skills/disenar-experiencia/SKILL.md"
if textos_experiencia "$exp_neg"; then fallo "8o: una copia de disenar-experiencia sin «40 columnas» pasó la comprobación"; fi
echo "ok 8o: disenar-experiencia con sus cadenas, enlazada en planificar-cambio, definir-proyecto y principal; copia sin «40 columnas» falla"

