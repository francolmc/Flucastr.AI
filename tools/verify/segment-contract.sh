# 11. ejecución por tramos: textos nuevos de los cuatro archivos; cada copia sin su texto debe fallar con su mensaje
paso 11 "ejecución por tramos: textos nuevos y copias sin cada uno"
T11=$(mktemp -d) || fallo "11: no pude crear el temporal"
TEXTOS_TRAMOS=(
  'core/skills/plan-change/SKILL.md|### Segment N'
  'core/skills/plan-change/SKILL.md|segment: 1'
  'core/skills/plan-change/SKILL.md|cross-layer flow'
  'core/skills/plan-change/SKILL.md|Resuelto:'
  'core/skills/execute-plan/SKILL.md|If the plan frontmatter contains `segment: <n>`'
  'core/skills/execute-plan/SKILL.md|### Segment N — Story:'
  'core/skills/execute-plan/SKILL.md|rerun the same command and compare'
  'core/skills/execute-plan/SKILL.md|Resuelto:'
  'core/agents/builder.md|DONE: plan=<path>; segment=<n>; verify=pasa'
  'core/agents/planner.md|Per-segment review'
  'core/agents/planner.md|segment: <n>'
  'core/agents/builder.md|segment: <n>'
  'core/agents/builder.md|segment=<n>'
  'core/agents/planner.md|one long wait'
  'core/references/planner/codex-waits.md|send_message'
  'core/agents/builder.md|Long output'
  'core/agents/builder.md|tramo-<n>.md'
  'core/skills/plan-change/SKILL.md|tramo-N.md'
  'core/skills/plan-change/SKILL.md|/compact'
  'core/skills/execute-plan/SKILL.md|tramo-<n>.md'
  'core/skills/execute-plan/SKILL.md|/compact'
  'core/skills/execute-plan/SKILL.md|For long output'
)
textos_tramos() { # $1: raíz del kit; nombra cada texto que falta y devuelve 1 si falta alguno
  local r=$1 par f t rc=0
  for par in "${TEXTOS_TRAMOS[@]}"; do
    f=${par%%|*}; t=${par#*|}
    grep -qF -- "$t" "$r/$f" || { echo "falta «${t}» en ${f}"; rc=1; }
  done
  return $rc
}
copiar_tramos() { # $1: destino; copia los cuatro archivos con su ruta relativa
  local f
  for f in core/skills/plan-change/SKILL.md core/skills/execute-plan/SKILL.md core/agents/planner.md core/agents/builder.md core/references/planner/codex-waits.md; do
    mkdir -p "$1/$(dirname "$f")"; cp "$f" "$1/$f"
  done
}
copiar_tramos "$T11/base"
textos_tramos "$T11/base" || fallo "11: falta algún texto nuevo de la ejecución por tramos"
echo "ok 11 baseline: los cuatro archivos traen sus textos nuevos"
for par in "${TEXTOS_TRAMOS[@]}"; do
  f=${par%%|*}; t=${par#*|}
  rm -rf "$T11/c"; copiar_tramos "$T11/c"
  grep -vF -- "$t" "$T11/c/$f" > "$T11/c/$f.sin" && mv "$T11/c/$f.sin" "$T11/c/$f"
  if out=$(textos_tramos "$T11/c" 2>&1); then fallo "11: una copia sin «${t}» en ${f} pasó la comprobación"; fi
  grep -qF "falta «${t}» en ${f}" <<<"$out" || fallo "11: una copia sin «${t}» en ${f} no falló con su mensaje"
  echo "ok 11 negativa: copia sin «${t}» en ${f} rechazada con su mensaje"
done
rm -rf "$T11"

