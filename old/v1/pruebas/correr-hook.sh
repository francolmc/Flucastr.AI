#!/usr/bin/env bash
# Corrida del hook del validador en Claude Code (F38, task-07). Solo MIDE: cada escenario es una invocación aparte
# (danada|valida|subagente|sin-hook) y `informe` reúne los cuatro. La corrida con modelo real es task-08; las pruebas
# usan un claude simulado (FLUCASTR_CLAUDE_BIN), como hizo F41 con pruebas/correr-rol.sh.
# Uso: bash pruebas/correr-hook.sh claude-code <danada|valida|subagente|sin-hook|informe>
# Escribe <res>/<fecha>-hook-claude-code-<k>.md; al final imprime «informe: <ruta>» y «Veredicto: OK|FALLA».
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
uso='uso: correr-hook.sh claude-code <danada|valida|subagente|sin-hook|informe>'
[[ $# -eq 2 ]] || { echo "$uso" >&2; exit 2; }
herramienta="$1"
escenario="$2"
[[ "$herramienta" == claude-code ]] || { echo "$uso" >&2; exit 2; }
case "$escenario" in
  danada|valida|subagente|sin-hook|informe) ;;
  *) echo "$uso" >&2; exit 2 ;;
esac

if [[ "${FLUCASTR_SIN_PRECONDICION:-0}" != "1" ]]; then
  if ! node "$HOME/.flucastr-ai/validar-tarea.mjs" --hook < /dev/null; then
    echo 'correr-hook.sh: precondición del hook falla (validar-tarea.mjs --hook); no se lanza la corrida' >&2
    exit 2
  fi
  raiz_kit="$(cat "$HOME/.flucastr-ai/raiz" 2>/dev/null || true)"
  if [[ "$raiz_kit" != "$RAIZ" ]]; then
    echo "correr-hook.sh: ~/.flucastr-ai/raiz no apunta a este repo ($RAIZ); no se lanza la corrida" >&2
    exit 2
  fi
fi

res="${FLUCASTR_RESULTADOS:-$RAIZ/pruebas/resultados}"
trabajo="$RAIZ/pruebas/.temporales/hook-claude-code"
mkdir -p "$res"

if [[ "$escenario" == informe ]]; then
  k=1
  while [[ -e "$res/$(date +%F)-hook-claude-code-$k.md" ]]; do k=$((k + 1)); done
  destino="$res/$(date +%F)-hook-claude-code-$k.md"
  if veredicto="$(HOOK_DIR="$trabajo" HOOK_DEST="$destino" HOOK_MOD="$RAIZ/pruebas/comprobaciones/hook-resultado.mjs" node --input-type=module -e "
    import fs from 'node:fs';
    import { pathToFileURL } from 'node:url';
    const { ok, informe } = (await import(pathToFileURL(process.env.HOOK_MOD).href)).informeHook({ dir: process.env.HOOK_DIR });
    fs.writeFileSync(process.env.HOOK_DEST, informe, { flag: 'wx' });
    process.stdout.write(ok ? 'OK' : 'FALLA');")"; then
    echo "informe: $destino"
    echo "Veredicto: $veredicto"
    exit 0
  fi
  echo 'correr-hook.sh: no se pudo escribir el informe' >&2
  exit 2
fi

if [[ -n "${CLAUDE_CODE_SUBAGENT_MODEL:-}" ]]; then
  echo 'correr-hook.sh: CLAUDE_CODE_SUBAGENT_MODEL definida; la prueba queda invalidada' >&2
  exit 2
fi

dir="$trabajo/$escenario"
rm -rf "$dir"
mkdir -p "$dir"
git -C "$dir" init -q
mkdir -p "$dir/.claude/agents"
cat > "$dir/.claude/agents/escritor.md" <<'EOF'
---
name: escritor
description: Escribe el único archivo que se le pida, con el contenido que se le pida.
---
Eres el escritor. Solo escribes el archivo que se te pida, con el contenido exacto que se te pida. No tocas otros archivos.
EOF
if [[ "$escenario" != sin-hook ]]; then
  node "$RAIZ/scripts/resolver.mjs" fijar-hook claude "$dir/.claude/settings.local.json"
fi

mkdir -p "$trabajo"
cat > "$trabajo/contenido-danada.md" <<'EOF'
# task-01 — Demo con bloque sin cerrar
repo: demo   depende_de: —   estado: en curso

## Descripción
Tarea de prueba del hook.

## Contexto
- Repo: demo.

## Decisiones ya tomadas
- Ninguna.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: un archivo.
Fuera de alcance: nada más.

## Pasos
1. Nada.

## Criterios de aceptación
1. Nada.

## Verificación
```
node --test
```

## Evidencia
```sh
$ node --test
salida de prueba

## Notas
EOF

cat > "$trabajo/contenido-valida.md" <<'EOF'
# task-01 — Ejemplo de tarea válida
repo: Flucastr.AI   depende_de: —   estado: aprobada

## Descripción
Texto que describe el objetivo de la tarea.

## Contexto
- Repo: este.
- Tocar: `archivo.mjs`

## Decisiones ya tomadas
- Se usa `node:test`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: un archivo nuevo.
Fuera de alcance: hacer commit.

## Pasos
1. Crear el archivo.

## Criterios de aceptación
1. El archivo existe.

## Verificación
```
node --test
```

## Evidencia

## Notas
EOF

case "$escenario" in
  danada|sin-hook)
    prompt="Escribe con la herramienta Write el archivo features/F99-demo/task-01-x.md con exactamente este contenido, sin cambios, y después termina:

$(cat "$trabajo/contenido-danada.md")" ;;
  valida)
    prompt="Escribe con la herramienta Write el archivo features/F99-demo/task-01-x.md con exactamente este contenido, sin cambios, y después termina:

$(cat "$trabajo/contenido-valida.md")" ;;
  subagente)
    prompt="Usa el subagente escritor (herramienta Agent, subagent_type escritor) para escribir el archivo features/F99-demo/task-01-x.md con exactamente este contenido, sin cambios. No lo escribas tú mismo:

$(cat "$trabajo/contenido-danada.md")" ;;
esac

claude_bin="${FLUCASTR_CLAUDE_BIN:-claude}"
rm -f "$trabajo/$escenario.jsonl"
(cd "$dir" && "$claude_bin" -p --permission-mode dontAsk --output-format stream-json --verbose \
  --no-session-persistence \
  --allowedTools 'Write(./features/**)' 'Edit(./features/**)' 'Read(./**)' 'Agent' 'Task' \
  -- "$prompt" > "$trabajo/$escenario.jsonl") \
  || echo "aviso: el escenario $escenario terminó con error; se mide igual" >&2
echo "escenario: $escenario; salida: $trabajo/$escenario.jsonl"
