#!/usr/bin/env bash
# Fixture de la corrida de rol (F41, task-03): feature F01 con F01 hecha, F02 pendiente y validador real.
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: rol.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
REPO="$(cd "$ROOT/../.." && pwd)"
out="$(mkdir -p "$1" && cd "$1" && pwd)"
inicializar_repo "$out" 'Demo rol' ''
git -C "$out" switch -qc fix/F01-demo

mkdir -p "$out/scripts" "$out/definitions" "$out/features/F01-demo"
cp "$REPO/scripts/validar-tarea.mjs" "$REPO/scripts/formato-tarea.mjs" "$REPO/scripts/formato-evidencia.mjs" \
  "$REPO/scripts/formato-fuente.mjs" "$REPO/scripts/formato-presupuesto.mjs" "$REPO/scripts/formato-bloqueo.mjs" \
  "$REPO/scripts/formato-requiere.mjs" "$REPO/scripts/firma.mjs" "$out/scripts/"

cat > "$out/features/F01-demo/task-01-base.md" <<'EOF'
# task-01 — Demo base
repo: demo   depende_de: —   estado: hecha

## Descripción
Tarea de prueba ya hecha.
EOF

cat > "$out/definitions/BACKLOG.md" <<'EOF'
# Backlog — Fixture rol

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Demo base | producto | medio | bajo | Motivo de prueba. | hecha | → |
| F02 | Demo otra | producto | medio | bajo | Motivo de prueba. | pendiente | |

Estado del documento: borrador
EOF

cat > "$out/definitions/WORKFLOW.md" <<'EOF'
# Flujo
Texto de prueba del flujo de trabajo.
Segunda línea de prueba.
EOF

cat > "$out/definitions/STATUS.md" <<'EOF'
# Estado
Escalación: ninguna
Paso actual: coordinador; F01; Rama: fix/F01-demo; sin tareas abiertas
Presupuesto: F01; rondas arq=0 plan=0; ampliado=0
Espera a Franco: ninguna
Bloqueos abiertos: ninguno
Retomar: F01; nada pendiente; fix/F01-demo; nada
Actualizado: 2026-11-04
EOF

git -C "$out" add -A
git -C "$out" commit -qm 'fixture rol'
