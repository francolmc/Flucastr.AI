# 8t. small change: planner trae la definición («small change», «without a plan», «120 diff lines», «Clasificación:», «When uncertain, use the builder»), «high risk» y «Mejora sugerida»; el documento de prácticas tiene ≥8 «Nivel»; una copia sin «small change» debe fallar (A1, A2, A4, A6)
paso 8t "small change: definición, riesgo y prácticas por tecnología"
textos_pequeno() { # $1: raíz del kit
  local r=$1 t
  for t in 'small change' 'without a plan' '120 diff lines' 'Clasificación:' 'When uncertain, use the builder' 'high risk' 'Mejora sugerida'; do
    grep -qF -- "$t" "$r/core/agents/planner.md" || return 1
  done
  grep -qF 'risk' "$r/core/skills/plan-change/SKILL.md" || return 1
  [ -f "$r/docs/practicas-por-tecnologia.md" ] || return 1
  [ "$(grep -c '^- Nivel: ' "$r/docs/practicas-por-tecnologia.md")" -ge 8 ] || return 1
}
textos_pequeno . || fallo "8t: falta algún texto de small change, riesgo o prácticas"
pequeno_neg="$T8/pequeno_neg"
mkdir -p "$pequeno_neg/core/agents" "$pequeno_neg/core/skills/plan-change" "$pequeno_neg/docs"
cp core/skills/plan-change/SKILL.md "$pequeno_neg/core/skills/plan-change/SKILL.md"
cp docs/practicas-por-tecnologia.md "$pequeno_neg/docs/"
sed 's/small change/cambio chico/g' core/agents/planner.md > "$pequeno_neg/core/agents/planner.md"
if textos_pequeno "$pequeno_neg"; then fallo "8t: una copia de planner.md sin «small change» pasó la comprobación"; fi
echo "ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla"

