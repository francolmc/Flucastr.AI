#!/usr/bin/env bash
# Fixture de «excedido» (F36, task-01): feature F01 con presupuesto arq=3/2 agotado y validador real.
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: excedido.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
REPO="$(cd "$ROOT/../.." && pwd)"
out="$(mkdir -p "$1" && cd "$1" && pwd)"
inicializar_repo "$out" 'Demo excedido' ''
git -C "$out" switch -qc fix/F01-demo

mkdir -p "$out/scripts" "$out/definitions" "$out/features/F01-demo"
cp "$REPO/scripts/validar-tarea.mjs" "$REPO/scripts/formato-tarea.mjs" "$REPO/scripts/formato-evidencia.mjs" \
  "$REPO/scripts/formato-fuente.mjs" "$REPO/scripts/formato-presupuesto.mjs" "$REPO/scripts/formato-bloqueo.mjs" \
  "$REPO/scripts/formato-requiere.mjs" "$out/scripts/"

cat > "$out/features/F01-demo/task-01-base.md" <<'EOF'
# task-01 — Demo base
repo: demo   depende_de: —   estado: hecha

## Descripción
Tarea de prueba ya hecha.
EOF

cat > "$out/features/F01-demo/task-02-segunda.md" <<'EOF'
# task-02 — Demo segunda
repo: demo   depende_de: task-01   estado: bloqueada

## Descripción
Tarea de prueba bloqueada: el coordinador debe escalar a Franco.
EOF

cat > "$out/definitions/BACKLOG.md" <<'EOF'
# Backlog — Fixture excedido

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Demo base | producto | medio | bajo | Motivo de prueba. | pendiente | → |
| F02 | Demo otra | producto | medio | bajo | Motivo de prueba. | pendiente | |

Estado del documento: borrador
EOF

cat > "$out/definitions/STATUS.md" <<'EOF'
# Estado
Escalación: ninguna
Paso actual: coordinador; F01; task-02; Rama: fix/F01-demo; Franco revisa la tarea bloqueada
Presupuesto: F01; rondas arq=3 plan=1; ampliado=0
Espera a Franco: ninguna
Bloqueos abiertos: task-02 bloqueada; rol=arquitecto
Retomar: F01; replantear task-02; fix/F01-demo; nada
Actualizado: 2026-11-03
EOF

git -C "$out" add -A
git -C "$out" commit -qm 'fixture excedido'
