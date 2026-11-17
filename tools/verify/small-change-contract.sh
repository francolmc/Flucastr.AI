# 8t. cambio pequeño: principal trae la definición («cambio pequeño», «sin plan», «30 líneas», «Clasificación:», «Ante la duda, constructor»), «riesgo alto» y «Mejora sugerida»; el documento de prácticas tiene ≥8 «Nivel»; una copia sin «cambio pequeño» debe fallar (A1, A2, A4, A6)
paso 8t "cambio pequeño: definición, riesgo y prácticas por tecnología"
textos_pequeno() { # $1: raíz del kit
  local r=$1 t
  for t in 'cambio pequeño' 'sin plan' '30 líneas' 'Clasificación:' 'Ante la duda, constructor' 'riesgo alto' 'Mejora sugerida'; do
    grep -qF -- "$t" "$r/agentes/principal.md" || return 1
  done
  grep -qF 'riesgo' "$r/skills/planificar-cambio/SKILL.md" || return 1
  [ -f "$r/docs/practicas-por-tecnologia.md" ] || return 1
  [ "$(grep -c '^- Nivel: ' "$r/docs/practicas-por-tecnologia.md")" -ge 8 ] || return 1
}
textos_pequeno . || fallo "8t: falta algún texto de cambio pequeño, riesgo o prácticas"
pequeno_neg="$T8/pequeno_neg"
mkdir -p "$pequeno_neg/agentes" "$pequeno_neg/skills/planificar-cambio" "$pequeno_neg/docs"
cp skills/planificar-cambio/SKILL.md "$pequeno_neg/skills/planificar-cambio/SKILL.md"
cp docs/practicas-por-tecnologia.md "$pequeno_neg/docs/"
sed 's/cambio pequeño/cambio chico/g' agentes/principal.md > "$pequeno_neg/agentes/principal.md"
if textos_pequeno "$pequeno_neg"; then fallo "8t: una copia de principal.md sin «cambio pequeño» pasó la comprobación"; fi
echo "ok 8t: principal con la definición de cambio pequeño, riesgo alto y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «cambio pequeño» falla"

