#!/usr/bin/env bash
# Fixture de «planificador» (F42, task-05): repo con una feature F01 que toca cinco módulos de src/, sin tareas aún.
# Lo usa la corrida real del planificador (task-06 y task-07) y su comprobador planificador-resultado.mjs.
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: planificador.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
REPO="$(cd "$ROOT/../.." && pwd)"
out="$(mkdir -p "$1" && cd "$1" && pwd)"
inicializar_repo "$out" 'Demo planificador' ''
git -C "$out" switch -qc feature/F01-demo

mkdir -p "$out/scripts" "$out/src" "$out/pruebas" "$out/definitions"
cp "$REPO"/scripts/formato-*.mjs "$REPO/scripts/firma.mjs" "$REPO/scripts/validar-tarea.mjs" "$out/scripts/"

# Cinco módulos de código inventado, 45 líneas cada uno.
for modulo in a b c d e; do
  for i in $(seq 1 45); do
    printf 'export const %s_%s = %s;\n' "$modulo" "$i" "$i"
  done > "$out/src/$modulo.js"
done

printf '# Demo planificador\n\nFixture de prueba: cinco módulos en `src/`.\n' > "$out/README.md"
cat > "$out/AGENTS.md" <<'EOF'
Proyecto de prueba del planificador; no tiene código real. Estado: aprobado (2026-11-05).

- Definición y backlog en `definitions/PROJECT.md` y `definitions/BACKLOG.md`.
- Plantilla y topes de tarea en `definitions/WORKFLOW.md` §6.
- Antes de entregar cada tarea, corre `node scripts/validar-tarea.mjs <ruta>` y corrige lo que rechace.
EOF

cat > "$out/definitions/PROJECT.md" <<'EOF'
# Proyecto demo

> Estado: **aprobado** (2026-11-05).

## Qué es
Repo de prueba para el planificador: cinco módulos en `src/`.

## Cómo se prueba
Con `node --test` en `pruebas/`.

## Decisiones de alcance
- Un «comando» es cada módulo `src/a.js` … `src/e.js` (cinco).
- `--tiempos` es una opción de un único punto de entrada nuevo `src/cli.js`, que ejecuta el módulo pedido y escribe `<módulo>: <ms> ms` en la salida estándar.
- Las pruebas van con `node --test` en `pruebas/`.
- No hay más alcance (sin persistencia ni otros formatos).
EOF

cat > "$out/definitions/BACKLOG.md" <<'EOF'
# Backlog — Fixture planificador

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Medir el tiempo de cada comando en los cinco módulos de `src/` y mostrarlo con `--tiempos` | producto | medio | medio | Rama `feature/`. Motivo de prueba. Alcance resuelto en PROJECT.md (Decisiones de alcance). | pendiente | → |

Estado del documento: aprobado
EOF

{
  printf '# Flujo de trabajo (extracto)\n\n'
  awk '/^## 6\. /{p=1} p&&/^## 7\. /{exit} p' "$REPO/definitions/WORKFLOW.md"
} > "$out/definitions/WORKFLOW.md"

git -C "$out" add -A
git -C "$out" commit -qm 'fixture planificador'
