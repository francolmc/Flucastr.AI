#!/usr/bin/env bash
# Fixture de «repetido» (F39, task-04): feature F01 con una tarea rota ya rechazada una vez, cuya firma queda en STATUS.md.
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: repetido.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
REPO="$(cd "$ROOT/../.." && pwd)"
out="$(mkdir -p "$1" && cd "$1" && pwd)"
inicializar_repo "$out" 'Demo repetido' ''
git -C "$out" switch -qc fix/F01-demo

mkdir -p "$out/scripts" "$out/definitions" "$out/features/F01-demo"
cp "$REPO/scripts/validar-tarea.mjs" "$REPO/scripts/formato-tarea.mjs" "$REPO/scripts/formato-evidencia.mjs" \
  "$REPO/scripts/formato-fuente.mjs" "$REPO/scripts/formato-presupuesto.mjs" "$REPO/scripts/formato-bloqueo.mjs" \
  "$REPO/scripts/formato-requiere.mjs" "$REPO/scripts/firma.mjs" "$out/scripts/"

# Tarea rota: el bloque de código queda abierto, así que el validador la rechaza.
cat > "$out/features/F01-demo/task-01-rota.md" <<'EOF'
# task-01 — Demo rota
repo: demo   depende_de: —   estado: borrador

## Descripción
Tarea de prueba rota: el bloque de código no se cierra.

```
bloque sin cerrar
EOF

cat > "$out/features/F01-demo/task-02-segunda.md" <<'EOF'
# task-02 — Demo segunda
repo: demo   depende_de: task-01   estado: bloqueada

## Descripción
Tarea de prueba bloqueada: el coordinador debe escalar a Franco.
EOF

cat > "$out/definitions/BACKLOG.md" <<'EOF'
# Backlog — Fixture repetido

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Demo base | producto | medio | bajo | Motivo de prueba. | pendiente | → |
| F02 | Demo otra | producto | medio | bajo | Motivo de prueba. | pendiente | |

Estado del documento: borrador
EOF

# Primer rechazo real del validador: su última línea «Firma: X» se guarda como digest en STATUS.md.
salida="$(cd "$out" && node scripts/validar-tarea.mjs features/F01-demo/task-01-rota.md 2>/dev/null || true)"
ultima="$(printf '%s\n' "$salida" | tail -n 1)"
[[ "$ultima" == "Firma: "* ]] || { echo 'repetido.sh: el validador no dio la línea Firma:' >&2; exit 1; }
firma_x="${ultima#Firma: }"
digest="$(cd "$out" && node --input-type=module -e 'import { digestFirma } from "./scripts/firma.mjs"; process.stdout.write(digestFirma(process.argv[1]));' "$firma_x")"

cat > "$out/definitions/STATUS.md" <<EOF
# Estado
Escalación: ninguna
Paso actual: coordinador; F01; task-01; Rama: fix/F01-demo; revisa la tarea rota
Presupuesto: F01; rondas arq=0 plan=1; ampliado=0; firma=$digest
Espera a Franco: ninguna
Bloqueos abiertos: ninguno
Retomar: F01; revisar task-01; fix/F01-demo; nada
Actualizado: 2026-11-05
EOF

git -C "$out" add -A
git -C "$out" commit -qm 'fixture repetido'
