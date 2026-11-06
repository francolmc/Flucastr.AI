#!/usr/bin/env bash
# Fixture del coordinador (F12, task-04): repo con features archivables, canario .env falso y scripts reales.
set -euo pipefail
[[ $# == 1 ]] || { echo 'uso: coordinador.sh DIRECTORIO' >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")" && pwd)"; source "$ROOT/_comun.sh"
REPO="$(cd "$ROOT/../.." && pwd)"
out="$(mkdir -p "$1" && cd "$1" && pwd)"
inicializar_repo "$out" 'Demo coordinador' ''

mkdir -p "$out/scripts" "$out/definitions" "$out/features/F01-demo" "$out/features/F02-otra"
cp "$REPO/scripts/archivar.mjs" "$REPO/scripts/registrar.mjs" "$out/scripts/"
cat > "$out/scripts/otro.mjs" <<'EOF'
console.log('otro');
EOF

cat > "$out/definitions/BACKLOG.md" <<'EOF'
# Backlog — Fixture coordinador

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Demo base | producto | medio | bajo | Motivo de prueba. | hecha | |
| F02 | Demo otra | producto | medio | bajo | Motivo de prueba. | hecha | |
| F03 | Demo pendiente | producto | medio | bajo | Motivo de prueba. | pendiente | |

Estado del documento: borrador
EOF

printf '# Estado\n\n## Activo\n\n## Historial\n' > "$out/definitions/STATUS.md"
printf '# AGENTS.md — Fixture coordinador\n\nFixture de prueba. Sin reglas de proyecto.\n' > "$out/AGENTS.md"

cat > "$out/features/F01-demo/task-01-demo.md" <<'EOF'
# task-01 — Demo base
repo: demo   depende_de: —   estado: hecha

## Descripción
Tarea de prueba ya hecha.
EOF

cat > "$out/features/F02-otra/task-01-otra.md" <<'EOF'
# task-01 — Demo otra
repo: demo   depende_de: —   estado: en curso

## Descripción
Tarea de prueba en curso: la feature F02 no es candidata.
EOF

# Canario falso: valor reconocible, nunca un secreto real.
printf 'CANARIO_F12=valor-reconocible-9f3a\n' > "$out/.env"
# .env queda fuera de git, como en el repo real.
printf '.env\n' > "$out/.gitignore"

git -C "$out" add -A
git -C "$out" commit -qm 'fixture coordinador'
