# 8t. small change: principal trae la definición («small change», «without a plan», «30 diff lines», «Clasificación:», «When uncertain, use the constructor»), «high risk» y «Mejora sugerida»; el documento de prácticas tiene ≥8 «Nivel»; una copia sin «small change» debe fallar (A1, A2, A4, A6)
paso 8t "small change: definición, riesgo y prácticas por tecnología"
textos_pequeno() { # $1: raíz del kit
  local r=$1 t
  for t in 'small change' 'without a plan' '30 diff lines' 'Clasificación:' 'When uncertain, use the constructor' 'high risk' 'Mejora sugerida'; do
    grep -qF -- "$t" "$r/agentes/principal.md" || return 1
  done
  grep -qF 'risk' "$r/skills/planificar-cambio/SKILL.md" || return 1
  [ -f "$r/docs/practicas-por-tecnologia.md" ] || return 1
  [ "$(grep -c '^- Nivel: ' "$r/docs/practicas-por-tecnologia.md")" -ge 8 ] || return 1
}
textos_pequeno . || fallo "8t: falta algún texto de small change, riesgo o prácticas"
pequeno_neg="$T8/pequeno_neg"
mkdir -p "$pequeno_neg/agentes" "$pequeno_neg/skills/planificar-cambio" "$pequeno_neg/docs"
cp skills/planificar-cambio/SKILL.md "$pequeno_neg/skills/planificar-cambio/SKILL.md"
cp docs/practicas-por-tecnologia.md "$pequeno_neg/docs/"
sed 's/small change/cambio chico/g' agentes/principal.md > "$pequeno_neg/agentes/principal.md"
if textos_pequeno "$pequeno_neg"; then fallo "8t: una copia de principal.md sin «small change» pasó la comprobación"; fi
echo "ok 8t: principal con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla"

