# 9a. migración: la skill migrar-proyecto muestra «Reglas de v1 que descarté», prohíbe copiar las reglas de flujo y no trae Fxx como regla; una copia sin la lista debe fallar
paso 9a "migrar-proyecto: lista de reglas descartadas y prohibición de copiarlas"
T9=$(mktemp -d) || fallo "9a: no pude crear el temporal"
trap '[ -n "${T6:-}" ] && rm -rf "$T6"; [ -n "${T7:-}" ] && rm -rf "$T7"; [ -n "${T8:-}" ] && rm -rf "$T8"; [ -n "${T9:-}" ] && rm -rf "$T9"' EXIT
textos_migracion() { # $1: archivo SKILL.md de migrar-proyecto
  local f=$1
  grep -qF 'Reglas de v1 que descarté' "$f" || return 1
  grep -qF 'no las copies' "$f" || return 1
  grep -qF 'Fxx' "$f" || return 1
}
textos_migracion skills/migrar-proyecto/SKILL.md || fallo "9a: falta algún texto clave en migrar-proyecto"
sed '/Reglas de v1 que descarté/d' skills/migrar-proyecto/SKILL.md > "$T9/SKILL.md"
if textos_migracion "$T9/SKILL.md"; then fallo "9a: una copia de migrar-proyecto sin «Reglas de v1 que descarté» pasó la comprobación"; fi
echo "ok 9a: migrar-proyecto trae «Reglas de v1 que descarté», «no las copies» y Fxx; una copia sin la lista falla"

