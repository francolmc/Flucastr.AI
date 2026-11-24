# Exploración y evaluación — progreso-en-vivo

## Exploration
**Qué existe y se reutiliza**
- `tools/usage/jsonl.mjs`: `listarJsonl`, `reciente`, `leerJsonl` (salta líneas malas). Sirve para ubicar sesiones y leer con tolerancia. `tools/usage/{claude,pi,codex}.mjs` ya conocen la forma de las llamadas a herramientas, pero son agregadores por lotes: no emiten eventos ni leen incrementalmente.
- `tools/run/registro.mjs` (`registrar`: append que nunca lanza) es el patrón del escritor. `tools/run/plan.mjs` (`frontmatter`, `progreso`) da segmento y casillas. `tools/run/tree-fingerprint.mjs` da la huella.
- `scripts/permissions-hook.mjs` + `adapters/claude-code/install-permission-hook.sh`: instalación idempotente de hooks en `.claude/settings.local.json` (hoy solo `PreToolUse`/`Bash`).
- `scripts/observe.mjs` y `tools/observe/*` son un observador de Docker (eventos, `docker stats`), no de progreso del builder. De ahí solo se copia el patrón de proceso en segundo plano si hace falta.
- `kit run` (`scripts/kit-run.mjs`) ya registra duración por fase en `runs.jsonl`, pero solo al final de cada intento.

**Qué falta**
- Ninguna señal intermedia: `kit run` usa `spawnSync` (`tools/run/process.mjs`), que bloquea el bucle de eventos; un resumen periódico exige un proceso hijo aparte.
- El builder por `kit run` hoy solo está implementado para Codex (`tools/run/commands.mjs`); Claude y Pi dependen de `KIT_RUN_BUILDER`.
- Hallazgo: el contrato (`core/contracts/verification.md`) excluye `changes/` de la huella, pero `tools/run/tree-fingerprint.mjs` no. Escribir `progress.jsonl`/`progress-resumen.md` cambiaría las huellas y podría disparar «el revisor modificó el árbol». Se corrige en el tramo 5.
- Un corte por tope hoy se convierte en `PAUSED ... motivo=access` con mensaje «superó el tope de N ms»; el contrato no se toca, así que el resumen es lo que lo distingue de un PAUSED de producto.
- No se investigó si Pi o Codex ofrecen un mecanismo de eventos más fiable que sus logs de sesión. Codex expone `notify` (fin de turno) y Pi extensiones, pero ninguno está probado en este repo. Se parte de los logs (único mecanismo demostrado) y el tramo 4 anota con evidencia si hay algo mejor.

## Evaluation
- **Captura**: A) hooks en todas las herramientas; B) lector incremental de logs en todas; C) hook en Claude Code + lector en Pi y Codex. Recomendada **C**: el hook de Claude da `comando_iniciado`/`comando_terminado` en tiempo real y con exit real; Pi y Codex solo se pueden leer de sus logs (las líneas llegan con la latencia con que cada herramienta las escribe). No hay paridad probada; ver matriz.
- **Escritor del builder**: `node scripts/kit-nota.mjs` (un comando corto, valida y trunca) frente a que el builder anexe JSON a mano (frágil con modelos de nivel bajo). Recomendado el comando.
- **Dónde vive el log**: `changes/<nombre>/` (junto al plan, patrón de `runs.jsonl`) pero **ignorado por git** (`changes/*/progress.jsonl`, `changes/*/progress-resumen.md`): es volátil y crece por cada llamada. Costo: no viaja a `changes/done/`.
- **Resumen periódico en `kit run`**: proceso hijo asíncrono (`spawn`) que lee el log y escribe a stderr cada N segundos. No toca la lógica de decisión.
- **Capa del builder (costo en tokens)**: ver «Costo de la capa del builder». Recomendación: incluir solo `Blocked:`; `Doing:` queda fuera por defecto.


## Matriz de captura por herramienta
| | Claude Code | Codex | Pi |
|---|---|---|---|
| Mecanismo | hooks `PreToolUse`/`PostToolUse` (proyecto) | lectura incremental de `rollout-*.jsonl` | lectura incremental de la sesión `.jsonl` |
| `archivo_editado` | sí (tiempo real) | sí (`apply_patch`, vía log) | sí (`edit`/`write`, vía log) |
| `comando_iniciado` | sí | sí | sí |
| `comando_terminado` + exit | sí (`tool_response`) | exit por texto de salida; si no se puede, `null` | exit si el resultado lo trae; si no, `null` |
| Latencia | ~0 | la del volcado del log (a medir) | la del volcado del log (a medir) |
| No capturable | comandos que corren fuera del hook (p. ej. subagentes sin hook) | exit exacto si el formato cambia | idem |
| Estado de la prueba | fixtures + stdin simulado; sin sesión real aún | fixtures copiados de un rollout real; sin sesión real aún | fixtures copiados de una sesión real; sin sesión real aún |
No se promete paridad: lo que no esté en una fila probada con fixtures se declara «no probado».

## Costo de la capa del builder
Regla propuesta (inglés, una línea en `execute-plan`): `Run `node scripts/kit-nota.mjs <plan> doing "<step>"` before each step and `... blocked "<cause>"` when you stop on a blocker.`
- Prompt: ~45 tokens por sesión (se cachea; marginal casi 0 tras el primer turno).
- Por llamada: ~60 tokens de salida + ~15 de resultado + un viaje extra (latencia, contexto +~100). Un tramo de 6 pasos con `doing` en cada uno: ~0,6–0,9 k tokens; solo `blocked`: 0 en corridas sin bloqueo.
- Referencia: un tramo típico mueve cientos de miles de tokens (a medir en el tramo 7 con `node scripts/usage.mjs --sessions` sobre sesiones reales del builder: tokens totales y pasos por tramo).
- **Recomendación**: la captura automática más `casilla_marcada` e inferencia de `paso_iniciado` cubre «paso actual» con ~1 casilla de retraso. Incluir solo `Blocked:` (no se puede capturar automático y cuesta casi 0). `Doing:` solo si la medición del tramo 7 muestra que el ahorro de diagnóstico supera el 2 % del costo del tramo; la decisión queda para la persona usuaria con ese número.

