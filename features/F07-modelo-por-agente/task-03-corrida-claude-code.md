# task-03 — Una corrida real en Claude Code: coordinador y subagentes con el modelo de `modelos.json`
repo: Flucastr.AI   depende_de: task-02   estado: aprobada

## Descripción
`WORKFLOW.md` §7 dejó pendiente comprobar con una corrida real que un subagente de Claude Code usa el `model` de su archivo generado. Esta tarea añade un lanzador mínimo y hace **una sola corrida**: el `coordinador` (agente principal) delega en `planificador` y en `constructor`, y se lee del registro estructurado qué modelo respondió cada uno. El constructor es el que discrimina (bajo: `claude-haiku-5-5`; los otros dos, medio: `claude-sonnet-5-5`).

## Contexto
- Repo único. Leídos: `pruebas/lanzar-claude.sh` y `pruebas/lanzar-constructor-claude.sh` (patrón de `claude -p --agent X --permission-mode dontAsk --permission-prompts none --no-session-persistence --output-format stream-json --verbose --allowedTools …`, registro en `$FLUCASTR_RECORD_FILE`, binario en `${FLUCASTR_CLAUDE_BIN:-claude}`), `pruebas/comprobaciones/registro.mjs` (`claudeEvents` toma `model` del evento `system`/`init` o del primer `assistant`: solo el agente principal), `agentes/coordinador.md` (`tools: Agent(arquitecto, planificador, constructor), …`; el coordinador debe abrirse como agente principal), `modelos.json`. Claude Code instalado: 2.1.308.
- Archivo a crear: `pruebas/lanzar-modelos-claude.sh`. El resultado queda en *Evidencia* (no se crea otro archivo).
- **Inferido, no ejecutado:** en el `stream-json` los eventos `assistant` de un subagente traen `parent_tool_use_id` igual al `id` del `tool_use` de `Agent` y `message.model` con el modelo real. Esta tarea lo confirma o lo corrige; si el formato real difiere, se informa en *Notas* lo observado y no se inventa.

## Decisiones ya tomadas
- Es la única corrida con modelo de esta herramienta: no se repite 3 veces ni se añaden escenarios. Si falla por una causa del lanzador (permisos, prompt), se corrige el lanzador y se repite una vez más como máximo.
- Se ejecuta desde una carpeta temporal vacía (`mktemp -d`), no desde el repo.
- Prompt fijo del lanzador: «Esto es una comprobación de modelos, no un flujo de trabajo: no leas archivos ni escribas nada. Usa la herramienta Agent, sin pasar el parámetro model, para llamar primero al subagente planificador y después al subagente constructor; a cada uno pídele que responda solo la palabra OK sin usar herramientas. Al terminar responde LISTO.»
- Permisos: `--allowedTools 'Agent(planificador)' 'Agent(constructor)'` y nada más.
- Antes de correr: `node pruebas/comprobaciones/modelos-agentes.mjs` debe dar 0 (si no, `bash instalar.sh` es de Franco: el constructor se detiene con `BLOQUEO: rol=Franco; motivo=la instalación en ~/.claude está desactualizada, falta correr bash instalar.sh`). Además `CLAUDE_CODE_SUBAGENT_MODEL` no debe estar definida (esa variable fuerza el modelo de todos los subagentes y invalidaría la prueba): si lo está, se informa en *Notas* y se detiene con `BLOQUEO: rol=Franco; motivo=CLAUDE_CODE_SUBAGENT_MODEL está definida`.
- El criterio es observable y exacto: modelo del principal = `claude-sonnet-5-5`; subagente `constructor` = `claude-haiku-5-5`; subagente `planificador` = `claude-sonnet-5-5` (esos valores salen de `modelos.json`; si Franco los cambió, rige lo que resuelva `node scripts/resolver.mjs modelo <agente> claude-code`).

## Alcance / Fuera de alcance
Alcance: el lanzador, una corrida y su evidencia.
Fuera de alcance: modificar `instalar.sh`, agentes o `modelos.json`; extractor reutilizable (task-05); Pi (task-04); ejercitar el flujo real del coordinador.

## Pasos
1. Crear `pruebas/lanzar-modelos-claude.sh` (bash, `set -euo pipefail`, mismo patrón de los otros lanzadores; escribe el registro en `$FLUCASTR_RECORD_FILE`, que debe estar definido). Resultado: `bash -n pruebas/lanzar-modelos-claude.sh` sin salida.
2. Comprobar las dos precondiciones (instalación vigente, variable no definida).
3. Correr: `d=$(mktemp -d); FLUCASTR_RECORD_FILE=$d/registro.jsonl bash -c 'cd "$0" && bash <ruta-absoluta-del-repo>/pruebas/lanzar-modelos-claude.sh' "$d"`.
4. Extraer del registro `(parent_tool_use_id, subagent_type, message.model)` con `node -e` (sin dependencias) y pegar en *Evidencia* esa tabla y las líneas JSON mínimas que contienen `model` (para task-05), sin credenciales.
5. Dejar en *Notas* si el formato difiere de lo inferido.

## Criterios de aceptación
1. `bash -n pruebas/lanzar-modelos-claude.sh` termina con 0.
2. El registro contiene eventos de dos subagentes distintos (`planificador`, `constructor`). Se comprueba con el paso 4.
3. Los modelos observados coinciden con los resueltos por `resolver.mjs` para cada agente. Se comprueba comparando la tabla con `node scripts/resolver.mjs modelo <agente> claude-code`.
4. La corrida usó el agente instalado (precondición del paso 2 en 0).

## Verificación
```
bash -n pruebas/lanzar-modelos-claude.sh
node pruebas/comprobaciones/modelos-agentes.mjs
for a in coordinador planificador constructor; do node scripts/resolver.mjs modelo $a claude-code; done
```
Esperado: sin salida / `modelos de agentes instalados vigentes` / tres modelos que coinciden con la tabla de *Evidencia*. Todo lo demás (la corrida) «no ejecutado, inferido»: requiere sesión de Claude Code con modelo.

## Evidencia

## Notas
