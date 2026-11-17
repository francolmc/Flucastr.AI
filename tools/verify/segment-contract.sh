# 11. ejecución por tramos: textos nuevos de los cuatro archivos; cada copia sin su texto debe fallar con su mensaje
paso 11 "ejecución por tramos: textos nuevos y copias sin cada uno"
T11=$(mktemp -d) || fallo "11: no pude crear el temporal"
TEXTOS_TRAMOS=(
  'skills/planificar-cambio/SKILL.md|### Tramo N'
  'skills/planificar-cambio/SKILL.md|tramo: 1'
  'skills/planificar-cambio/SKILL.md|cruce'
  'skills/planificar-cambio/SKILL.md|Resuelto:'
  'skills/ejecutar-plan/SKILL.md|Si el plan trae `tramo: <n>` en el frontmatter'
  'skills/ejecutar-plan/SKILL.md|### Tramo N — Historia:'
  'skills/ejecutar-plan/SKILL.md|vuelve a correr el mismo comando'
  'skills/ejecutar-plan/SKILL.md|Resuelto:'
  'agentes/constructor.md|COMPLETADO: plan=<ruta>; tramo=<n>; verify=pasa'
  'agentes/principal.md|Revisión por tramo'
  'agentes/principal.md|tramo: <n>'
  'agentes/constructor.md|tramo: <n>'
  'agentes/constructor.md|tramo=<n>'
  'agentes/principal.md|una sola espera'
  'agentes/principal.md|send_message'
  'agentes/constructor.md|Salidas largas'
  'agentes/constructor.md|tramo-<n>.md'
  'skills/planificar-cambio/SKILL.md|tramo-N.md'
  'skills/planificar-cambio/SKILL.md|/compact'
  'skills/ejecutar-plan/SKILL.md|tramo-<n>.md'
  'skills/ejecutar-plan/SKILL.md|/compact'
  'skills/ejecutar-plan/SKILL.md|Salidas largas'
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
  for f in skills/planificar-cambio/SKILL.md skills/ejecutar-plan/SKILL.md agentes/principal.md agentes/constructor.md; do
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

