# task-01 — Verificar en Claude Code el archivo de proyecto y la precedencia de `autoCompactWindow`
repo: Flucastr.AI   depende_de: —   estado: borrador

## Descripción
Solo evidencia, sin tocar el repo: comprobar en una sesión corta y aislada de Claude Code 2.1.308 dónde se configura `autoCompactWindow` por proyecto y qué gana cuando hay varias fuentes. Sin esto no se puede documentar un fragmento para Claude Code en el README (task-07). El resultado se deja en *Evidencia* de esta tarea como tabla CONFIRMADO / NO VERIFICADO.

## Contexto
- Leído: `definitions/ARCHITECTURE.md`, sección «Higiene de contexto», fila «Dónde se configura»: están CONFIRMADOS (por cadenas del binario, no por ejecución) la clave `autoCompactWindow`, la variable `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, la opción `--autocompact <auto|tokens>` y el comando `/autocompact`; NO VERIFICADO el archivo exacto de proyecto (`.claude/settings.json`?) y la precedencia. Valor admitido: 100000 a 1000000 o `"auto"`. En un agente, `autoCompactWindow` solo vale para subagentes y no para la sesión principal (binario).
- Leído (ejecutado): `claude --version` → `2.1.308 (Claude Code)`; `claude --help` muestra `--autocompact <auto|tokens>`, `--setting-sources <sources>` (`user, project, local`), `--settings <file-or-json>`, `--max-budget-usd <amount>` (solo con `--print`), `--model`.
- No se escribe en el repo, en `~/.claude` ni en `~/.flucastr-ai`. Todo el trabajo ocurre en un directorio temporal nuevo creado con `mktemp -d` (fuera del repo), con su propio `.claude/settings.json` y `.claude/settings.local.json`.
- Solo la sección *Evidencia* y *Notas* y el campo `estado` de esta tarea se escriben.

## Decisiones ya tomadas
- Costo: usar siempre `--model haiku` y `--max-budget-usd 0.20` por invocación; máximo 8 invocaciones con modelo en toda la tarea. Si hay una forma de observar el valor sin modelo (por ejemplo `claude doctor`, que lee los settings del directorio actual sin prompt de confianza, o `strings` sobre el binario), se prefiere y no cuenta en el tope.
- Preguntas a responder, cada una CONFIRMADO (con el comando y la salida) o NO VERIFICADO (con el motivo): (1) ¿`<proyecto>/.claude/settings.json` acepta `autoCompactWindow`? (2) ¿Y `.claude/settings.local.json`? (3) Precedencia entre archivo de proyecto, archivo de usuario (se simula con `--settings <archivo temporal>`, nunca editando `~/.claude`), variable `CLAUDE_CODE_AUTO_COMPACT_WINDOW` y `--autocompact`. (4) ¿Un valor menor de 100000 se rechaza o se ajusta? (5) ¿`/context` y `/cost` existen y qué muestran en una sesión `-p`? (6) ¿La sesión principal de un agente (`--agent coordinador`) respeta el ajuste de settings?
- Si una pregunta no se puede observar de forma segura con el tope de costo, se marca NO VERIFICADO; no se infiere ni se inventa. No es un bloqueo.
- Prohibido leer `.env`, llaves o credenciales.

## Alcance / Fuera de alcance
Alcance: las seis preguntas, en directorio temporal, con evidencia real.
Fuera de alcance: modificar cualquier archivo del repo (incluidos `README.md` y `definitions/`), editar `~/.claude`, instalar nada, documentar el fragmento (task-07), probar Pi o Codex.

## Pasos
1. `D=$(mktemp -d)`; en `$D` crear `.claude/settings.json` con `{"autoCompactWindow": 150000}` y un archivo `$D/usuario.json` con `{"autoCompactWindow": 200000}`. Resultado: archivos creados (se muestran con `cat`).
2. Responder (1) y (2) con `claude doctor` o con una invocación corta (`claude -p --model haiku --max-budget-usd 0.20 "/autocompact"` desde `$D`, u otra forma que muestre el valor efectivo). Resultado: salida pegada.
3. Responder (3) y (4) combinando `--settings "$D/usuario.json"`, la variable y `--autocompact`. Resultado: tabla de qué valor quedó efectivo en cada combinación.
4. Responder (5) y (6). Resultado: salidas pegadas o NO VERIFICADO con motivo.
5. Escribir en *Evidencia* la tabla final de seis filas (pregunta, estado, comando, salida resumida) y el número de invocaciones con modelo. Borrar `$D` con `rm -r "$D"` solo si está bajo el directorio temporal del sistema.

## Criterios de aceptación
1. *Evidencia* tiene las seis filas, cada una CONFIRMADO con comando y salida real, o NO VERIFICADO con motivo. Se comprueba leyendo la tarea.
2. Invocaciones con modelo ≤ 8, todas con `--max-budget-usd 0.20` y `--model haiku`. Se comprueba en la lista de comandos de *Evidencia*.
3. `git status --short` no muestra archivos nuevos ni cambiados por esta tarea fuera de este archivo de tarea.
4. Ninguna ruta tocada está bajo `~/.claude` (se declara en *Notas* el directorio temporal usado).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
git status --short
```
Esperado: ningún cambio nuevo salvo el archivo de esta tarea (y lo que ya estuviera modificado antes de empezar; anotar la salida inicial en *Evidencia*). Los comandos `claude ...` se ejecutan en `$D`, no en el repo (no ejecutados por el planificador).

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
