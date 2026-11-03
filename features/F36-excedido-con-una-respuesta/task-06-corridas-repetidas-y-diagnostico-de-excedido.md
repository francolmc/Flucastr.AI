# task-06 — Corridas repetidas y diagnóstico en la prueba de «excedido»
repo: Flucastr.AI   depende_de: task-05   estado: hecha

## Descripción
Medición real de Franco (2026-11-03): Pi 3 de 3 OK; Claude Code 0 de 3, con tres causas distintas (no escaló; «el sistema me negó Bash»; ítem de Escalación de 183 caracteres rechazado por su validador). Los informes cortan el texto a 300 letras. Esta tarea hace la prueba repetible y diagnóstica, sin tocar reglas: `correr-excedido.sh <herramienta> [N]` hace N corridas, un informe por corrida con el texto final completo, las llamadas a Bash (denegadas marcadas) y una causa probable; al final imprime `Corridas: k/N OK`.

## Contexto
- Tocar: `pruebas/correr-excedido.sh`, `pruebas/comprobaciones/excedido-resultado.mjs`, `pruebas/correr-excedido.test.mjs`
- De `depende_de:` (task-05, regresión) no hay nada que leer.
- `excedido-resultado.mjs` exporta `RECHAZO`, `letrasDeEscalacion`, `ampArq`, `evaluar`, `informe({ dir, herramienta })`; `informe` recorta el texto a 300 letras (líneas 56-57) y solo lee `etapa2.jsonl`. `analyzeRecord(source, tool)` de `pruebas/comprobaciones/registro.mjs` devuelve `{ model, denied, finalText }`; `denied` solo recoge eventos `system`/`permission_denied`.
- Hallazgo en `pruebas/.temporales/excedido-claude-code-6064/etapa1.jsonl`: el chequeo `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/F01-demo` sale 1 con `excedido`; Claude Code lo entrega como `tool_result` con `is_error: true` y contenido `Exit code 1\nPresupuesto F01: ...`; NO es una denegación. El `result` final trae `permission_denials` (vacío ahí). En Pi las llamadas son eventos `tool_execution_start`.
- Hoy: `correr-excedido.test.mjs` 4 pruebas; rápida `ℹ tests 728`, `ℹ fail 6` (ajenos).
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Uso: `correr-excedido.sh {claude-code|pi} [N]`, N entero ≥1 (por defecto 1). N inválido o un tercer argumento: uso en stderr y salida 2, antes de la precondición y de lanzar nada.
- Cada corrida i (1..N) repite el flujo actual con su base `pruebas/.temporales/excedido-<herramienta>-<PID>-<i>`. Informe en `<resultados>/<fecha>-excedido-<herramienta>-<k>.md`, `k` = primer entero libre (no sobrescribe; Franco ya tiene `-1` a `-3` de hoy).
- Imprime `informe: <ruta>` por corrida y al final `Corridas: <ok>/<N> OK`. Sale 0 si escribió todos los informes (aunque haya FALLA), 2 si no.
- Nueva exportación `analizarCorrida({ dir, herramienta })`: devuelve `{ ok, informe }`; `informe(...)` la envuelve con su firma actual. El script la llama con `node --input-type=module -e`, escribe el archivo e imprime `OK` o `FALLA`; el shell cuenta eso.
- El informe conserva `Modelo:`, `Letras en la Escalación:`, `amp_arq tras «A»:`, `Estado de --presupuesto tras «A»:` y `Veredicto: OK|FALLA`, y añade `Causa probable: <texto>`, `Llamadas a Bash:` (por línea: comando, `denegada` o `exit N`, extracto de 100 letras; ambas etapas) y `Texto final etapa 1:` / `Texto final etapa 2:` COMPLETOS, cada uno en un bloque ``` (sin recorte ni «…»).
- Denegada = evento `permission_denied`, o entrada de `permission_denials` del `result`, o `tool_result` con `is_error` cuyo contenido NO empieza con `Exit code`. En Pi se listan los comandos sin juzgar denegación.
- `Causa probable`, la primera que aplique: (1) hay denegada: `herramienta denegada: <comando>`; (2) `Estado de --presupuesto` empieza con `definitions/STATUS.md:`: `STATUS.md rechazado por el validador`; (3) etapa 1 sin letras: `la etapa 1 no escribió la Escalación con letras`; (4) hay letras y `amp_arq` 0: `la etapa 2 no aplicó A`; (5) `ninguna`.
- Etapa 1: se mantiene el prompt literal `Continúa con el flujo.`; sin modelo no se mide qué prompt escala mejor. Si tras task-07 la etapa 1 sigue sin escalar, Franco decide el prompt con los informes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: los tres archivos de *Contexto*.
Fuera de alcance: `skills/`, `agentes/`, `definitions/`, `scripts/`, lanzadores, `pruebas/README.md`, fixture y lanzar modelos reales (los corre Franco).

## Pasos
1. En `excedido-resultado.mjs`: añade `llamadasBash`, `causaProbable` y `analizarCorrida`; el informe usa texto completo y lee también `etapa1.jsonl`.
2. En `correr-excedido.sh`: valida N primero; bucle de corridas; índice libre `k`; resumen final.
3. En `correr-excedido.test.mjs`: pasa las 4 pruebas a `...-excedido-<herramienta>-1.md` y añade 2 (`claude-code 2` con simulado que siempre amplía: salida 0, informes `-1` y `-2`, última línea `Corridas: 2/2 OK`; N `0` y `x` salen 2 sin informes) y 4 con registros sintéticos (texto de más de 300 letras íntegro y sin «…»; `permission_denied` figura `denegada` y `Exit code 1` no; causa de etapa 1 sin letras; causa de STATUS rechazado).
4. Corre la *Verificación*.

## Criterios de aceptación
1. `correr-excedido.test.mjs` da `ℹ tests 10` y `ℹ fail 0`; `excedido-resultado.test.mjs` sigue en `ℹ tests 9`.
2. `bash pruebas/correr-excedido.sh pi 0` y `bash pruebas/correr-excedido.sh pi 1 2` salen 2 sin crear nada.
3. `bash pruebas/rapida.sh` da `ℹ tests 734` y `ℹ fail 6` (ajenos).
4. `ls pruebas/resultados | wc -l` es igual antes y después.

## Verificación
```
ls pruebas/resultados | wc -l | tr -d ' '
node --test pruebas/correr-excedido.test.mjs pruebas/comprobaciones/excedido-resultado.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
bash -n pruebas/correr-excedido.sh; echo "exit $?"; bash pruebas/correr-excedido.sh pi 0 2>/dev/null; echo "exit $?"; bash pruebas/correr-excedido.sh pi 1 2 2>/dev/null; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
ls pruebas/resultados | wc -l | tr -d ' '
```
Esperado: un número N0; `ℹ tests 19` (10 + 9) y `ℹ fail 0`; `exit 0`, `exit 2`, `exit 2`; `ℹ tests 734` y `ℹ fail 6`; el mismo N0.
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia

```
$ ls pruebas/resultados | wc -l | tr -d ' '
30
exit 0
$ node --test pruebas/correr-excedido.test.mjs pruebas/comprobaciones/excedido-resultado.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 19
ℹ fail 0
exit 0
$ bash -n pruebas/correr-excedido.sh; echo "exit $?"; bash pruebas/correr-excedido.sh pi 0 2>/dev/null; echo "exit $?"; bash pruebas/correr-excedido.sh pi 1 2 2>/dev/null; echo "exit $?"
exit 0
exit 2
exit 2
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 734
ℹ fail 6
exit 0
$ ls pruebas/resultados | wc -l | tr -d ' '
30
exit 0
```

## Notas
- Hueco menor 1: en Pi, cada llamada a Bash se lista como «sin juzgar» (su registro no trae denegación), como indica la tarea; la causa 1 solo aplica a Claude Code.
- Hueco menor 2: el extracto de comando corta a 100 letras con «…»; el texto final va completo (lo cubre la prueba sintética de 400 letras).
- Hueco menor 3: `analizarCorrida` tolera la falta de `etapa1.jsonl` (la prueba (i) de `excedido-resultado.test.mjs` no lo crea). El `exit N` de las líneas con `grep` o `wc` en *Evidencia* es el código del pipeline, 0 con salida.
- Hueco menor 4: los informes de «correr-excedido» se escriben con `flag: 'wx'` y un número libre; `pruebas/resultados/` queda en 30 archivos antes y después.
- No se lanzó ninguna corrida con modelo real; las pruebas usan el modelo simulado. Modo yolo: sin rama, sin commit.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
