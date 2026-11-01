# task-05 — Corrida con modelo en Pi: llamadas en orden y `Read` con `limit: 3` en el `coordinador`
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
`definitions/CONTEXTO.md` §2.4 y §4 (riesgo 5) dejan dos supuestos para F21: (a) Pi ejecuta en el orden indicado varias llamadas de un mismo turno; (b) `Read` con `limit` funciona en el `coordinador`. Segunda corrida (decidida por Franco, 2026-11-01): una sola invocación nueva con modelo, solo para el supuesto (a), con un prompt que fuerza dos `edit` dependientes entre sí. Sea cual sea el resultado, se acepta e informa tal cual. La meta de consumo (≤4 turnos por llamada a subagente, 0 KB de `definitions/`) NO se mide aquí: la corre Franco con `node scripts/consumo.mjs`.

## Contexto
- Primera corrida (informe `pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi.md`, no se toca): supuesto (b) OK (`read` con `{"offset":1,"limit":3}`, sin error). Supuesto (a) no probado: el modelo (`gpt-6.1-sol`, ≈0,0199 USD) hizo un solo `edit` con `orden-1` y `orden-2` juntos.
- Leer `pruebas/lanzar-coordinador-pi.sh` (uso: `FLUCASTR_RECORD_FILE=<archivo> bash pruebas/lanzar-coordinador-pi.sh "<prompt>"`, desde el directorio del fixture; `${FLUCASTR_PI_BIN:-pi-coordinador}` con `--mode json --no-session -p`; tope `FLUCASTR_PI_TOPE`, 300 s por defecto).
- `bash pruebas/fixtures/coordinador.sh DIRECTORIO` crea el repo; su `definitions/STATUS.md` es exactamente `# Estado`, línea vacía, `## Activo`, línea vacía, `## Historial` (confirmado, leído). Incluye un `.env` canario falso `valor-reconocible-9f3a` que no se abre.
- Los eventos de herramienta del registro son líneas JSON `tool_execution_start` / `tool_execution_end` (`toolName`, `args`, `isError`); formato de informe a imitar: el de la primera corrida.
- El lanzador `pi-coordinador` lee `agentes/coordinador.md` en vivo.

## Decisiones ya tomadas
- Precondición sin modelo: `command -v pi-coordinador`. Si falla, `BLOQUEO: rol=arquitecto; motivo=<cuál>` y no se gasta modelo.
- Una sola invocación con modelo (segunda solo por falla de infraestructura), `FLUCASTR_PI_TOPE=240`. Prompt literal: «Sin delegar a subagentes y sin leer ningún archivo: en una sola respuesta, emite dos llamadas edit seguidas sobre definitions/STATUS.md, sin responder entre ellas. Primer edit: oldText `## Activo`, newText `## Activo` + salto de línea + `marca-1`. Segundo edit: oldText `marca-1` + salto de línea + línea vacía + `## Historial`, newText ese mismo texto + salto de línea + `marca-2`. No las unas en un solo edit; el segundo depende de que el primero ya se haya aplicado. Responde solo: listo.»
- Orden observable: el segundo `edit` solo puede aplicarse si el primero ya escribió `marca-1`; si Pi los ejecutara al revés o en paralelo, el segundo falla (`isError=true`) y `marca-2` no queda.
- Veredicto, tres resultados:
  - **PROBADO**: hay exactamente dos `edit` sobre `definitions/STATUS.md` en el registro (inicio del primero antes del inicio del segundo), ambos con `isError=false`, y el archivo final contiene `marca-1` bajo `## Activo` y `marca-2` bajo `## Historial`.
  - **REFUTADO**: hay dos `edit` y el segundo terminó con `isError=true` o `marca-2` no quedó (orden distinto o paralelo). El informe lo declara y recomienda a Franco quitar de `coordinador.md` la regla de agrupación; no se edita aquí.
  - **NO CONCLUYENTE**: el modelo no emitió dos `edit` (uno solo, o en turnos separados, o ninguno). Se informa como tal y NO se repite la corrida.
- Además, en cualquier resultado: el canario aparece 0 veces en el registro y en el informe.
- Informe nuevo: `pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi-2.md` (sin sobrescribir el anterior; prompt, comandos sin secretos, modelo y costo derivado del registro, invocaciones, veredicto con el valor de cada condición, y la limitación: una corrida no prueba el comportamiento general). Tope ≤ 6 KB.
- El registro y el fixture quedan en un directorio temporal (`mktemp -d`) fuera del repo.

## Alcance / Fuera de alcance
Alcance: la segunda corrida, su informe y llenar *Evidencia* y *Notas*.
Fuera de alcance: editar `agentes/`, lanzadores, fixtures, comprobadores o el informe de la primera corrida; correr `consumo.mjs` sobre proyectos reales; Claude Code; yolo; leer el `.env` del fixture; cambiar `definitions/`; repetir la corrida si el resultado es NO CONCLUYENTE o REFUTADO; el supuesto (b).

## Pasos
1. Precondición sin modelo.
2. `T=$(mktemp -d)`; `bash pruebas/fixtures/coordinador.sh "$T/fx"`.
3. Desde `$T/fx`, correr el lanzador con el prompt literal y `FLUCASTR_RECORD_FILE="$T/reg.jsonl"`.
4. Calcular las condiciones con los comandos de Verificación.
5. Escribir el informe nuevo y pegar en *Evidencia* comandos y salidas (cola relevante, ≤ 1,5 KB).
6. Correr `bash pruebas/rapida.sh` una vez e imprimir su cola y código.

## Criterios de aceptación
1. El informe nuevo existe y declara PROBADO, REFUTADO o NO CONCLUYENTE con el valor de cada condición.
2. Invocaciones con modelo ≤ 1 (2 solo por infraestructura), declaradas; sin reintento por resultado.
3. El canario aparece 0 veces en el registro y en el informe.
4. `bash pruebas/rapida.sh` pasa y el informe de la primera corrida queda intacto.

## Verificación
- `cat "$T/fx/definitions/STATUS.md"` → PROBADO esperado: `marca-1` bajo `## Activo` y `marca-2` bajo `## Historial`.
- `node -e "const l=require('fs').readFileSync(process.argv[1],'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(e=>e.type==='tool_execution_start'||e.type==='tool_execution_end');console.log(l.map(e=>e.type+' '+e.toolName+' '+(e.isError??'')+' '+JSON.stringify(e.args??'')).join('\n'))" "$T/reg.jsonl"` → secuencia con dos `edit` (inicio y fin de cada uno, con `isError`). (No ejecutado, inferido.)
- `grep -c 'valor-reconocible-9f3a' "$T/reg.jsonl" pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi-2.md` → `0` en ambos.
- `git status --short pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi.md` → sin cambios nuevos hechos por esta tarea.
- `bash pruebas/rapida.sh` → código 0.

## Evidencia
```
$ command -v pi-coordinador; echo EXIT=$?
/Users/franco/.local/bin/pi-coordinador
EXIT=0
$ bash pruebas/fixtures/coordinador.sh "$T/fx"   (T=/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.bkoOkLowhd)
STATUS inicial: "# Estado" / "## Activo" / "## Historial"
$ cd "$T/fx" && FLUCASTR_RECORD_FILE="$T/reg.jsonl" FLUCASTR_PI_TOPE=240 bash .../lanzar-coordinador-pi.sh '<prompt literal>'; echo exit=$?
exit=0   (1 invocación con modelo: gpt-6.1-sol)
$ cat "$T/fx/definitions/STATUS.md"
# Estado
## Activo
marca-1
## Historial
marca-2
$ node -e '...' "$T/reg.jsonl"   (eventos de herramienta)
tool_execution_start edit  {"path":"definitions/STATUS.md","edits":[{"oldText":"## Activo","newText":"## Activo\nmarca-1"}]}
tool_execution_end edit false
tool_execution_start edit  {"path":"definitions/STATUS.md","edits":[{"oldText":"marca-1\n\n## Historial","newText":"marca-1\n\n## Historial\nmarca-2"}]}
tool_execution_end edit false
mensajes del asistente: turno 1 toolCall edit (stopReason=toolUse); turno 2 toolCall edit (stopReason=toolUse); turno 3 texto
$ grep -c <canario> "$T/reg.jsonl" ; grep -c <canario> pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi-2.md
0
0
$ bash pruebas/rapida.sh; echo codigo=$?
ℹ tests 335 / ℹ pass 335 / ℹ fail 0
rapida: 29 archivos en 16 s (tope 30 s)
codigo=0
$ git status --short pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi.md
?? pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi.md   (informe 1 no tocado)
```
Informe nuevo: `pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi-2.md`. Veredicto: **NO CONCLUYENTE** (ver Notas).

## Notas
- Veredicto NO CONCLUYENTE, no PROBADO: el archivo final y el orden de los dos `edit` son correctos, pero cada `edit` salió en un mensaje del asistente distinto (turnos 1 y 2). La tarea clasifica «en turnos separados» como NO CONCLUYENTE, así que se aplicó esa regla. Decisión de Franco si quiere leerlo de otra forma. No se repitió la corrida.
- Costo derivado del registro: ≈ 0,0328 USD (suma de `usage.cost.total` de 3 mensajes), orientativo.
- Huecos menores: la verificación `node` estaba marcada como «no ejecutado, inferido»; se ejecutó tal cual y funcionó. El canario se escribió por error en el informe y se quitó antes de cerrar (queda 0 en informe y registro).
- Huecos menores anotados: 2 (los dos de arriba: nota de `node` y canario escrito por error en el informe).
Registro: n=1; herramienta=pi; modo=normal; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
