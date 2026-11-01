# task-05 — Corrida con modelo en Pi: llamadas en orden y `Read` con `limit: 3` en el `coordinador`
repo: Flucastr.AI   depende_de: task-03   estado: aprobada

## Descripción
`definitions/CONTEXTO.md` §2.4 y §4 (riesgo 5) dejan dos supuestos para F21: (a) Pi ejecuta en el orden indicado varias llamadas de un mismo turno; (b) `Read` con `limit` funciona en el `coordinador`. Se comprueban con una corrida corta en Pi sobre el fixture del `coordinador` y se deja un informe. La corrida con modelo y su costo solo valen si Franco aprueba esta tarea en la puerta 3. La meta de consumo en un proyecto real (≤4 turnos por llamada a subagente, 0 KB de `definitions/`) NO se mide aquí: la corre Franco con `node scripts/consumo.mjs`.

## Contexto
- Leer `pruebas/lanzar-coordinador-pi.sh` (uso: `FLUCASTR_RECORD_FILE=<archivo> bash pruebas/lanzar-coordinador-pi.sh "<prompt>"`, desde el directorio del fixture; usa `${FLUCASTR_PI_BIN:-pi-coordinador}` con `--mode json --no-session -p`; tope `FLUCASTR_PI_TOPE`, 300 s por defecto).
- Leer `pruebas/fixtures/coordinador.sh` (`bash pruebas/fixtures/coordinador.sh DIRECTORIO` crea un repo con `definitions/STATUS.md`, `features/F02-otra/task-01-otra.md` en `en curso` y un `.env` canario falso `valor-reconocible-9f3a`; el constructor NO abre ese `.env`).
- Los eventos de herramienta del registro son líneas JSON con `type: "tool_execution_start"`, `toolName` y `args` (`pruebas/comprobaciones/registro.mjs`, líneas 56-60). Formato de informe a imitar: `pruebas/resultados/2026-10-30-coordinador-pi.md`.
- El lanzador `pi-coordinador` lee el cuerpo del agente en vivo desde `agentes/coordinador.md`: rige task-01 a 03 sin reinstalar. No ejecutado, inferido: la forma exacta de `args` de `read` en el registro (`path`, `limit`).

## Decisiones ya tomadas
- Precondición sin modelo: `command -v pi-coordinador` y `grep -c 'limit: 3' agentes/coordinador.md` ≥ 1. Si falla, `BLOQUEO: rol=arquitecto; motivo=<cuál>` y no se gasta modelo.
- Una sola invocación con modelo (segunda solo por falla de infraestructura), `FLUCASTR_PI_TOPE=240`. Prompt literal: «Sin delegar a subagentes: en una sola respuesta, (1) lee las 3 primeras líneas de features/F02-otra/task-01-otra.md; (2) con edit, añade bajo `## Activo` de definitions/STATUS.md la línea `orden-1`; (3) en la misma respuesta, con otro edit, añade debajo de `orden-1` la línea `orden-2`. Responde solo: listo.»
- Veredicto. **OK** si: (1) hay un `read` de `task-01-otra.md` con `limit` igual a 3 sin error; (2) `definitions/STATUS.md` del fixture contiene `orden-1` y, en la línea siguiente, `orden-2`; (3) ninguna llamada `edit` terminó en error; (4) el canario aparece 0 veces en el registro y en el informe. **FALLA** si (2) o (3) no se cumplen con `orden-1` presente (indica que el segundo `edit` se ejecutó antes que el primero o en paralelo). **NO CONCLUYENTE** si el modelo hizo las llamadas en turnos separados (no prueba el supuesto): se informa y no se reintenta.
- Si el veredicto es FALLA, el informe lo declara y recomienda a Franco quitar de `coordinador.md` la regla de agrupación; no se edita `coordinador.md` aquí.
- Informe: `pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi.md` (prompt, comandos sin secretos, modelo reportado por el registro, número de invocaciones, condiciones, veredicto, y la limitación: una corrida no prueba el comportamiento general).
- El registro y el fixture quedan en un directorio temporal (`mktemp -d`) fuera del repo.

## Alcance / Fuera de alcance
Alcance: la corrida, el informe y llenar *Evidencia* y *Notas*.
Fuera de alcance: editar `agentes/`, lanzadores, fixtures o comprobadores; correr `consumo.mjs` sobre proyectos reales; Claude Code; yolo; leer el `.env` del fixture; cambiar `definitions/`; la meta de consumo de F21.

## Pasos
1. Precondiciones sin modelo.
2. `T=$(mktemp -d)`; `bash pruebas/fixtures/coordinador.sh "$T/fx"`.
3. Desde `$T/fx`, correr el lanzador con el prompt literal y `FLUCASTR_RECORD_FILE="$T/reg.jsonl"`.
4. Calcular las condiciones con los comandos de Verificación.
5. Escribir el informe y pegar en *Evidencia* los comandos y salidas (cola relevante, ≤ 1,5 KB).
6. Correr `bash pruebas/rapida.sh` una vez.

## Criterios de aceptación
1. El informe existe y declara OK, FALLA o NO CONCLUYENTE con el valor de cada condición.
2. Invocaciones con modelo ≤ 1 (2 solo por infraestructura), declaradas.
3. El canario `valor-reconocible-9f3a` aparece 0 veces en el registro y en el informe.
4. `bash pruebas/rapida.sh` pasa.

## Verificación
- `grep -c 'orden-1' "$T/fx/definitions/STATUS.md"` → ≥ 1; `grep -A1 'orden-1' "$T/fx/definitions/STATUS.md"` → segunda línea `orden-2`.
- `node -e "const l=require('fs').readFileSync(process.argv[1],'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(e=>e.type==='tool_execution_start');console.log(l.map(e=>e.toolName+' '+JSON.stringify(e.args)).join('\n'))" "$T/reg.jsonl"` → lista con `read` (`limit` 3) y dos `edit` en ese orden. (No ejecutado, inferido.)
- `grep -c 'valor-reconocible-9f3a' "$T/reg.jsonl" pruebas/resultados/2026-11-01-coordinador-menos-turnos-pi.md` → `0` en ambos.
- `bash pruebas/rapida.sh` → código 0.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
