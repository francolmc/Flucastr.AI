---
status: done
branch: feature/kit-run-pegado
base: main
repos: [.]
executor: builder
segment: 3
continuity: continuous
type: code
---
# kit run detecta un builder pegado

## Goal
`kit run` corta un builder que no avanza (sin cambios, mismo comando repetido o sondeos en cadena) antes de agotar el tope de 45 min, deja una nota para retomar y devuelve `PAUSED` sin marcar nada como hecho. Se puede apagar con una variable de entorno y parte en modo «observar».

## Exploration
Evidencia leída: `tools/run/process.mjs` (el builder corre con `spawnSyncSeguro` y solo tiene tope total de 45 min), `scripts/kit-run.mjs` (paso del builder en la línea que llama `correr(comando("BUILDER"...), topeMs("BUILDER"))`; `porTope`; `final = {pausa, motivo:"access"}`; `main()` síncrono), `tools/progress/eventos.mjs` (tipos de evento), `tools/progress/estado.mjs` (`calcularEstado`: solo informa, umbral 120 s), `scripts/progress-watch.mjs` (el vigilante escribe `fingerprint_cambió` y `casilla_marcada` cada 60 s; su contrato es no decidir), `tools/run/tree-fingerprint.mjs` (excluye `changes/`), `tools/run/registro.mjs` (`registrar` acepta cualquier objeto) y `docs/kit-run.md`.

Línea base (`changes/done/linea-base-builder/linea-base.md`, no existe `changes/*/linea-base.md` abierta): sin `runs.jsonl` ni `progress.jsonl` en los proyectos, así que **no hay tiempo ocioso ni atascos medidos** (H1 y H5 sin evidencia). Datos útiles: 585 sondeos y 11 488 comandos en 62 sesiones (≈9 sondeos por sesión en total) y 4 250 entradas a procesos en curso (≈68 por sesión: son esperas legítimas de `verify`, no sondeos de atasco). Por eso los umbrales son **provisionales** y se calibran con datos nuevos (ver Evaluation).

Hallazgo de diseño: el builder corre con `spawnSync`, bloqueante; nada dentro de `kit run` puede cortarlo antes del tope. Hace falta una variante asíncrona para ese único paso.

Respuestas del usuario (2026-11-25): motivo del corte = **reusar `access`** (sin cambiar el contrato del builder); modo inicial = **observar primero**.

## Evaluation
- **A. Paso del builder asíncrono con un temporizador en el propio `kit run` (recomendada).** `main()` pasa a `async`; solo el builder usa `spawn` con sondeo cada 30 s de una función pura que lee `progress.jsonl`. Costo: tocar `main`; riesgo bajo si el resto sigue síncrono.
- B. Proceso guardián aparte que busca el pid del builder. Frágil (el pid no se expone con `spawnSync`).
- C. Poner el corte en el vigilante. Rompe su contrato («nunca cambia decisiones»).

Patrones de «pegado» (todos sobre la señal A2b `progress.jsonl`, sin inventar otra; «avance» = `fingerprint_cambió`, `casilla_marcada`, `archivo_editado` o `paso_iniciado`):

| Patrón | Umbral inicial | Justificación |
|---|---|---|
| `sin_avance` | 20 min sin ningún avance | Menos de la mitad del tope de 45 min: ahorra ≥25 min; una pausa de razonamiento entre ediciones es de minutos |
| `comando_repetido` | mismo comando (normalizado) 6 veces seguidas, sin avance entre ellas y ≥5 min sin avance | 6 reintentos idénticos sin cambiar nada es un bucle, no una iteración |
| `sondeos` | 10 sondeos seguidos (`sleep`, `tail`, `watch`, `write_stdin`, `cat` de logs), sin avance entre ellos y ≥5 min sin avance | La línea base promedia ≈9 sondeos por sesión completa; 10 consecutivos sin avance supera eso |

Falsos positivos (esperas legítimas): un comando **declarado largo** en curso (`comando_iniciado` sin `comando_terminado`) exime los tres patrones hasta su propio tope (el de `VERIFY`, 30 min). Declarados: el comando de `## Verification` del plan, cualquier comando que contenga `verify`, y los de `KIT_RUN_PEGADO_LARGOS` (lista separada por comas). Un comando no declarado, o un `sleep` suelto, no exime. Si la señal no es verificable no se corta: `KIT_PROGRESO=0`, log ilegible, o ningún `comando_iniciado` desde el inicio de la corrida (la herramienta no emite comandos). Primeros 5 min de cada corrida: no se evalúa.

Calibración: con `KIT_RUN_PEGADO=observar` (modo inicial) cada corrida registra en `runs.jsonl` el campo `pegado` («habría cortado» con patrón y minuto) y `bloqueo` «pegado (observado)» en `progress.jsonl`; tras 2–3 corridas reales se comparan con `node scripts/runs-report.mjs` (mediana y p90 de duración y de la brecha sin avance) y se ajusta cada umbral al p90 de las corridas sanas ×1,5; luego se cambia el valor por defecto a `cortar` en un cambio aparte.

## Assumptions
- Tras un corte no se relanza el builder (igual que el tope); si la persona usuaria quiere relanzar con un tramo más estrecho, lo hace a mano. Si prefiere relanzar una vez, cambia un paso del tramo 3.
- El corte envía SIGTERM al grupo de procesos del builder y, a los 10 s, SIGKILL.
- Claude Code solo emite comandos si el hook de progreso está instalado; sin él el detector responde «no verificable» y no corta.

## Decisions already taken
- Motivo: `PAUSED ... motivo=access`, causa en `no_intentado` y en la nota del plan (el usuario eligió no ampliar el contrato; un motivo nuevo `stalled` queda descartado salvo nueva aprobación).
- Modo por defecto: `observar`. `KIT_RUN_PEGADO=0` apaga; `=observar`; `=cortar`.
- Umbrales por variable: `KIT_RUN_PEGADO_SIN_AVANCE_MS`, `KIT_RUN_PEGADO_REPETIDOS`, `KIT_RUN_PEGADO_SONDEOS`, `KIT_RUN_PEGADO_INTERVALO_MS`, `KIT_RUN_PEGADO_LARGOS`. `KIT_RUN_TOPE_MS` sigue igual y gana si llega antes.
- Executor: builder, porque requisitos, contexto y comprobaciones están escritos, no hay credenciales ni despliegue.

## Decisions
- Segmento 3 (menor, dentro de Scope; Scope y Acceptance sin cambios): las variables de prueba `KIT_RUN_PEGADO_ARRANQUE_MS` y `KIT_RUN_PEGADO_MIN_REP_MS` se leen en `configuracionPegado` de `scripts/kit-run.mjs` y no tocan `tools/run/pegado.mjs`, para que D2 y D4 corran en segundos. La nota de corte no lleva el prefijo `kit run:` porque `anotarNotas` ya lo añade. El modo por defecto `observar` se mantiene.

## Validation
Pendiente de la aprobación del usuario (Gate 1). Confirmado hasta ahora: motivo `access` y modo inicial «observar» (2026-11-25).

## Scope
- `tools/run/pegado.mjs` (nuevo), `tools/run/process.mjs`, `scripts/kit-run.mjs`
- Pruebas: `tests/kit-run/pegado.test.mjs` (nuevo), `tests/kit-run/run.mjs`
- Docs y verify: `docs/kit-run.md`, `AGENTS.md`, `tests/README.md`, `verify`
Fuera de alcance: `core/agents/builder.md` (contrato), `scripts/progress-watch.mjs`, `tools/progress/`.

## Verification
`./verify` — corre todo, incluido el paso nuevo 21.

## Stop conditions
Continuar si la comprobación pasa y el siguiente paso sigue dentro de Scope. Detenerse con nota si la misma causa falla dos veces, hay que salir de Scope, falta una decisión del usuario o una comprobación tarda más del doble de lo medido. Duda menor dentro de Scope: anotar en `## Decisions` y seguir.

## Steps

### Segment 1 — Story: detector puro de builder pegado
As a person running `kit run` I want a pure function that judges whether the builder is stuck from the progress signal so that the cut decision does not rely on a new, invented signal.
Dependencies: Not applicable (usa el esquema de eventos de `tools/progress/eventos.mjs`, ya existente).
Contracts to keep: `tools/progress/*` sin cambios; la función no lee archivos ni toca procesos.
Paths likely to change: `tools/run/pegado.mjs` (nuevo), `tests/kit-run/pegado.test.mjs` (nuevo; sin tests existentes afectados).
Concrete example of the expected result: 12 eventos `comando_iniciado` `sleep 30` sin avance, ahora = +8 min → `{ estado: "pegado", patron: "sondeos" }`.
Scope: `tools/run/pegado.mjs`
Files: tools/run/pegado.mjs
WHEN el log muestra avance reciente THEN el estado es `ok` (A1)
WHEN pasan 20 min sin avance, hay comandos en el log y ninguno declarado largo está abierto THEN `pegado` con `sin_avance` (A2)
WHEN se repite el mismo comando 6 veces o hay 10 sondeos seguidos sin avance y ≥5 min sin avance THEN `pegado` con `comando_repetido` o `sondeos` (A3)
WHEN un comando declarado largo está abierto (como `./verify`) THEN `ok`, hasta su tope (A4)
WHEN no hay eventos de comando, el log está vacío o `PROGRESO` está apagado THEN `no_verificable` (A5)
Acceptance:
- A1: avance dentro del umbral → `ok`; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A1`; expect exit 0.
- A2: 20 min sin avance → `pegado/sin_avance`; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A2`; expect exit 0.
- A3: repetición y sondeos → `pegado` con el patrón correcto, y 5 comandos o 9 sondeos NO cortan; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A3`; expect exit 0.
- A4: `./verify` abierto 25 min sin avance → `ok`; abierto más que el tope de 30 min → `pegado`; un `sleep` suelto no exime; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A4`; expect exit 0.
- A5: casos sin señal → `no_verificable`; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A5`; expect exit 0.
TODO:
- [x] Crear `tools/run/pegado.mjs` con `export function configuracion(env)` que lee `KIT_RUN_PEGADO*` y devuelve umbrales por defecto (20 min, 6, 10, intervalo 30 s, arranque 5 min, modo `observar`) (A1). Check: `node -e "import('./tools/run/pegado.mjs').then(m=>console.log(m.configuracion({}).modo))"`; expect `observar`.
- [x] Agregar `export function evaluarPegado(eventos, { ahora, inicioMs, config, declarados, topeLargoMs })` pura que devuelve `{estado, patron, detalle, sinAvanceMs}` (A1–A5). Check: `node --check tools/run/pegado.mjs`; expect exit 0.
- [x] Crear `tests/kit-run/pegado.test.mjs` con un caso por A1–A5, incluidos los bordes (5 comandos, 9 sondeos) y un caso con lista vacía de eventos que exige `no_verificable` (A1–A5). Check: `node --test tests/kit-run/pegado.test.mjs`; expect exit 0.
- [x] Sensibilidad: en `pegado.mjs` cambiar temporalmente el 6 por 7 y confirmar que A3 falla, luego revertir (A3). Check: `node --test tests/kit-run/pegado.test.mjs` tras revertir; expect exit 0.
Segment verification: `node --test tests/kit-run/pegado.test.mjs` — level 1; exit 0; covers A1–A5.
Handoff: Eventos en `tools/progress/eventos.mjs`: `t` ISO, `tipo`, `cmd`, `id`. Un comando está abierto si hay `comando_iniciado` sin `comando_terminado` con el mismo `id` (ver `calcularEstado`). Sondeo = `cmd` que empieza por `sleep`, `tail`, `watch` o `write_stdin`, o `cat` de un `.log`. Normalizar el comando recortando espacios y números de tiempo. Declarado largo: `declarados` (lista de cadenas) o `cmd` que contiene `verify`.

### Segment 2 — Story: ejecutar el builder con un temporizador de vigilancia
As a person running `kit run` I want to run a process under a watchdog timer that kills it when a callback asks so that a stuck builder can be cut before the total cap, without changing today's `correr`.
Dependencies: Not applicable (`correr` actual queda intacto).
Contracts to keep: `correr(cmd, prompt, cwd, shell, tope)` y `topeMs(rol)` con la misma salida `{status, error, stdout, stderr}`; el mensaje `superó el tope de N ms`; el prompt entra por archivo como stdin (como `tools/spawn/sync-seguro.mjs`).
Paths likely to change: `tools/run/process.mjs`; la prueba se agrega a `tests/kit-run/pegado.test.mjs`.
Concrete example of the expected result: un proceso `node -e "setTimeout(()=>{},60000)"` con un callback que devuelve `{cortar:true}` a los 300 ms termina en menos de 3 s con `error` «cortado: pegado (sin_avance)».
Scope: `tools/run/process.mjs`
Files: tools/run/process.mjs
WHEN el callback no pide cortar y el proceso termina THEN se devuelven `status` y salida iguales a `correr` (A6)
WHEN el callback pide cortar THEN el proceso muere (SIGTERM, luego SIGKILL a los 10 s) y `error` lo dice (A7)
WHEN pasa el tope total THEN el mensaje sigue siendo `superó el tope de N ms` (A8)
Acceptance:
- A6: salida idéntica a `correr` en un proceso corto; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A6`; expect exit 0.
- A7: corte por callback, y el proceso ya no existe; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A7`; expect exit 0.
- A8: tope total sigue funcionando en la variante asíncrona; check with `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A8`; expect exit 0.
TODO:
- [x] En `tools/run/process.mjs` agregar `correrVigilado(cmd, prompt, cwd, { tope, intervaloMs, vigilar })` async con `spawn`, stdin desde archivo temporal y `detached: true` (A6). Check: `node --check tools/run/process.mjs`; expect exit 0.
- [x] Hacer que el temporizador llame a `vigilar()` cada `intervaloMs` y, si devuelve `{cortar, motivo}`, mate el grupo de procesos con SIGTERM y SIGKILL a los 10 s (A7). Check: `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A7`; expect exit 0.
- [x] Aplicar el tope total con el mismo mensaje y limpiar temporizadores y archivo temporal al terminar (A8). Check: `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A8`; expect exit 0.
- [x] Agregar los casos A6–A8 a `tests/kit-run/pegado.test.mjs` con procesos `node -e` cortos y tiempos pequeños (A6–A8). Check: `node --test tests/kit-run/pegado.test.mjs`; expect exit 0.
Segment verification: `node --test tests/kit-run/pegado.test.mjs` — level 1; exit 0; covers A6–A8.
Handoff: No tocar `correr` síncrono: verify y revisor lo siguen usando. Reusar la idea de `prepararStdio` de `tools/spawn/sync-seguro.mjs` (stdin por archivo, por el EPERM del sandbox de Codex). `detached: true` permite matar el grupo con `process.kill(-pid, ...)`; manejar que el proceso ya no exista (ESRCH).

### Segment 3 — Story: kit run corta o registra al builder pegado
As a person launching `kit run` I want a stuck builder to be cut (or recorded in observe mode) with a resume note so that time and credits are not wasted.
Dependencies: Segment 1 — `evaluarPegado`; Segment 2 — `correrVigilado`.
Contracts to keep: línea final `DONE`/`PAUSED` con los motivos existentes (el corte usa `access`); contador de relanzamientos; códigos de salida 0/1/2; el tope `KIT_RUN_TOPE_MS`; ningún `[x]` del plan se toca.
Paths likely to change: `scripts/kit-run.mjs`, `tests/kit-run/run.mjs` (casos nuevos al final; los existentes no cambian), `tests/README.md`.
Concrete example of the expected result: con `KIT_RUN_PEGADO=cortar` y un builder falso que repite `sleep 1` y no avanza, `kit run` imprime `PAUSED: ...; motivo=access; ...; no_intentado=builder pegado (sondeos): ...` y deja `status: partial` con una nota «kit run: builder pegado» (hecho/falta/causa).
Scope: `scripts/kit-run.mjs`
Files: scripts/kit-run.mjs
WHEN el builder avanza con normalidad THEN no se corta y el resultado no cambia (A9)
WHEN el builder entra en bucle sin cambios y el modo es `cortar` THEN se corta antes del tope, sin relanzar, `PAUSED motivo=access`, nota en el plan, casillas intactas (A10)
WHEN el modo es `observar` (por defecto) y hay bucle THEN no se corta; se registra `pegado` en `runs.jsonl` y un `bloqueo` en `progress.jsonl` (A11)
WHEN un comando declarado largo corre más que el umbral sin escribir THEN no se corta (A12)
WHEN `KIT_RUN_PEGADO=0` THEN no se evalúa nada (A13)
Acceptance:
- A9: progreso normal no corta; check with `node tests/kit-run/run.mjs` (casos «D1…»); expect exit 0.
- A10: bucle sin cambios con `cortar` → `PAUSED motivo=access`, `status: partial`, nota presente, `builder` invocado 1 vez; check with el caso «D2» de `tests/kit-run/run.mjs`; expect exit 0.
- A11: modo observar no mata y deja el registro; check con el caso «D3»; expect exit 0.
- A12: build largo declarado sin escrituras no se corta; check con el caso «D4»; expect exit 0.
- A13: apagado por entorno; check con el caso «D5»; expect exit 0.
TODO:
- [x] En `scripts/kit-run.mjs` pasar `main` a `async`, llamarlo con `await` en la última línea y reemplazar el paso del builder por `await correrVigilado(...)` con `vigilar` que lee `leerEventos(rutaProgreso)` y llama `evaluarPegado` (A9). Check: `node --check scripts/kit-run.mjs` y casos existentes de `tests/kit-run/run.mjs`; expect exit 0.
- [x] En `scripts/kit-run.mjs` medir el paso del builder con el mismo `builder_ms` (versión asíncrona de `medir`, definida en ese archivo) (A9). Check: caso existente que lee `runs.jsonl`; expect exit 0.
- [x] En `scripts/kit-run.mjs`, modo `cortar`: al cortar, `final = { pausa: true, motivo: "access", msg: "builder pegado (<patrón>): <detalle>" }`, sin relanzar, y anexar `bloqueo` «pegado: <patrón>» (A10). Check: caso «D2»; expect exit 0.
- [x] En `scripts/kit-run.mjs` anotar en el plan, con la nota existente de kit run, qué se hizo (`hecho=h/t`), qué falta (primera casilla pendiente) y por qué se cortó, sin tocar casillas (A10). Check: caso «D2» lee la nota y compara las casillas antes y después; expect iguales.
- [x] En `scripts/kit-run.mjs`, modo `observar`: registrar una sola vez `pegado: { modo, patron, detalle, minuto }` en el intento de `runs.jsonl` y un `bloqueo` «pegado (observado)» (A11). Check: caso «D3»; expect exit 0.
- [x] En `tests/kit-run/run.mjs` agregar casos D1–D5 con un builder falso que escribe eventos en `progress.jsonl` y umbrales cortos por variable (`KIT_RUN_PEGADO_SIN_AVANCE_MS`, `_INTERVALO_MS`); D4 emite `comando_iniciado ./verify` sin terminar mientras duerme y luego devuelve DONE (A9–A13). Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] Sensibilidad en `scripts/kit-run.mjs` (D2 y D4): quitar la exención de comandos declarados y confirmar que D4 falla; poner el modo en `observar` y confirmar que D2 falla; revertir (A10, A12). Check: `node tests/kit-run/run.mjs` tras revertir; expect exit 0.
- [x] Agregar en `verify` el paso 21 (`node --test tests/kit-run/pegado.test.mjs`) antes de `echo "VERIFY OK"` (A9). Check: `./verify`; expect exit 0.
- [x] Documentar en `docs/kit-run.md` (patrones, umbrales, esperas legítimas, variables, calibración), `AGENTS.md` (una línea) y `tests/README.md` (casos D1–D5) (A9–A13). Check: `git diff --check` y `rg -n "KIT_RUN_PEGADO" docs/kit-run.md AGENTS.md tests/README.md`; expect exit 0 y 3 archivos con coincidencias.
Segment verification: `node tests/kit-run/run.mjs` — level 1; exit 0; covers A9–A13.
Handoff: El vigilante ya escribe `fingerprint_cambió` y `casilla_marcada`; el detector solo lee `progress.jsonl` (`leerEventos`, `PROGRESO` ya existe en `kit-run.mjs`). El builder falso de `tests/kit-run/run.mjs` ya existe (`FAKE_CODEX_CUELGA` para el tope): seguir ese patrón para los casos D. Las variables de entorno nuevas deben vaciarse en el helper que limpia `KIT_RUN_TOPE_MS` (línea ~186 de `tests/kit-run/run.mjs`). Un cambio del contrato (`builder.md`) está fuera de alcance.

## Evidence
Segmento 1 (detector puro, `tools/run/pegado.mjs` y `tests/kit-run/pegado.test.mjs`):

$ node -e "import('./tools/run/pegado.mjs').then(m=>console.log(m.configuracion({}).modo))"
observar
exit 0

$ node --check tools/run/pegado.mjs
exit 0

$ node --test tests/kit-run/pegado.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

Sensibilidad (A3): con `repetidos: 6` cambiado a 7 en `UMBRALES`, `node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A3` dio `ℹ pass 5` y `ℹ fail 2`; revertido, la suite completa vuelve a `pass 7 / fail 0`, exit 0.

Segmento 2 (`correrVigilado` en `tools/run/process.mjs`, casos A6–A8 en `tests/kit-run/pegado.test.mjs`):

$ node --check tools/run/process.mjs
exit 0

$ node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A7
ℹ tests 10
ℹ pass 10
ℹ fail 0
exit 0

$ node --test tests/kit-run/pegado.test.mjs --test-name-pattern=A8
ℹ tests 10
ℹ pass 10
ℹ fail 0
exit 0

$ node --test tests/kit-run/pegado.test.mjs
ℹ tests 10
ℹ suites 3
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 927.879973
exit 0

Segmento 3 (integración en `scripts/kit-run.mjs`, casos D1–D5, documentación y paso 21 de `verify`):

$ node tests/kit-run/run.mjs
ok D4 comando declarado largo: ./verify en curso sin escribir no se corta
ok D5 KIT_RUN_PEGADO=0: no se evalúa nada aunque haya bucle de sondeos
ok M2 mutación sensible: sin la compuerta de la puerta la roja-relanza falla
kit-run: 50 casos pasaron
exit 0

Sensibilidad (corrida anterior, revertida después; el archivo quedó igual al actual):
- Sin exención de comandos declarados (`declarados: []`, `topeLargoMs: 0` en `scripts/kit-run.mjs`): D4 falla.
- Con el modo forzado a `observar` en D2: D2 falla (no hay corte ni `PAUSED motivo=access`).

$ node --test tests/kit-run/pegado.test.mjs
ℹ tests 10
ℹ pass 10
ℹ fail 0
exit 0

$ node --check scripts/kit-run.mjs
exit 0

$ git diff --check
(sin salida)
exit 0

$ rg -n "KIT_RUN_PEGADO" docs/kit-run.md AGENTS.md tests/README.md
docs/kit-run.md: 8 coincidencias (líneas 60, 66, 67, 68, 72, 76, 82, 84)
AGENTS.md: 1 coincidencia (línea 32)
tests/README.md: 1 coincidencia (línea 30)
exit 0 (3 archivos con coincidencias)

$ ./verify   (corrida completa del segmento 3, mismo árbol; su resultado queda registrado en resultado.json)
== 21. builder pegado en kit run: detector y casos D1–D5 (tests/kit-run/pegado.test.mjs) ==
VERIFY OK
exit 0

$ node scripts/kit-verificado.mjs estado --nivel rapida   (re-ejecutado tras los cambios de este plan)
Fingerprint: 6480c8fb962a
ya verificado: nivel=aceptacion fase=21
exit 0

## Notes
Checkpoint segmento 1 (historia «detector puro», completa):
- Archivos nuevos: `tools/run/pegado.mjs` (configuracion, evaluarPegado, normalizarComando, esSondeo), `tests/kit-run/pegado.test.mjs` (7 casos: configuracion y A1–A5). Sin cambios en `tools/progress/`, `tools/run/process.mjs` ni `scripts/kit-run.mjs`.
- Diff: ~190 líneas nuevas, sin líneas modificadas en código existente.
- Check: `node --test tests/kit-run/pegado.test.mjs` pasa 7/7; sensibilidad A3 comprobada (ver Evidence).
- Decisiones menores (en Scope, sin cambiar Scope ni Acceptance): orden de patrones sondeos → comando_repetido → sin_avance; «sondeos» y «repetidos» cuentan la corrida seguida desde el final; `KIT_RUN_PEGADO` con valor no reconocido cuenta como `observar`; `KIT_PROGRESO=0` da `no_verificable`; el tope de exención de `verify` es `topeLargoMs` (30 min) y el arranque es 5 min constantes.
- Corte de historia: las historias 2 y 3 son historias distintas del mismo plan. Según la regla de continuidad del builder, no se avanza a otra historia en esta corrida; el planner revisa en contexto nuevo y reaprueba antes de ejecutar el segmento 2.

Checkpoint segmento 2 (historia «builder con temporizador de vigilancia», completa):
- Archivos cambiados: `tools/run/process.mjs` (imports nuevos y `correrVigilado`; `correr` y `topeMs` sin cambios), `tests/kit-run/pegado.test.mjs` (import de `correr`/`correrVigilado` y casos A6–A8). Sin cambios en `scripts/kit-run.mjs`, `tools/progress/` ni `core/agents/builder.md`.
- Diff: `tools/run/process.mjs` +96 líneas, sin líneas modificadas; pruebas +~50 líneas.
- Check: `node --test tests/kit-run/pegado.test.mjs` pasa 10/10 (ver Evidence).
- Decisiones menores (en Scope, sin cambiar Scope ni Acceptance): `correrVigilado` acepta además `shell` (paridad con `correr`, lo usará el paso del builder con `false`); la firma es `(cmd, prompt, cwd, { shell, tope, intervaloMs, vigilar })`, compatible con el plan. Tras `cortar` el error es `cortado: <motivo>` y el motivo llega tal cual del callback (`pegado (sin_avance)` en el segmento 3). El `maxBuffer` de 256 MB de `correr` no se replica: `spawn` no lo aplica y la salida se acumula sin tope (anotado para revisar si un builder produce salidas enormes).
- Corte de historia: el segmento 3 es otra historia del mismo plan («kit run corta o registra al builder pegado»). Según la regla de continuidad del builder no se avanza a ella en esta corrida; queda para la revisión del planner en contexto nuevo y la reaprobación.

Checkpoint segmento 3 (historia «kit run corta o registra al builder pegado», completa; última historia del plan):
- Archivos cambiados: `scripts/kit-run.mjs` (configuracionPegado, vigilarPegado, `await correrVigilado`, corte a `PAUSED motivo=access` sin relanzar, nota en el plan, registro en modo observar), `tests/kit-run/run.mjs` (falso `builder-pegado.mjs`, casos D1–D5 y helpers), `verify` (paso 21), `docs/kit-run.md` (sección «Builder pegado»), `AGENTS.md` (una línea), `tests/README.md` (casos D1–D5).
- Diff: en `scripts/kit-run.mjs` el paso del builder pasa a `await correrVigilado` y se añade el detector; el contrato de salidas (`DONE`/`PAUSED`, códigos 0/1/2, contador de relanzamientos, `KIT_RUN_TOPE_MS`) no cambia. Ninguna casilla del plan se marcó ni desmarcó por el código.
- Check: `node tests/kit-run/run.mjs` 50 casos exit 0; `node --test tests/kit-run/pegado.test.mjs` 10/10; `./verify` exit 0 («VERIFY OK», Fingerprint `6480c8fb962a`).
- Pendiente fuera de alcance: calibración de umbrales con corridas reales (documentada en `docs/kit-run.md`). No se hizo commit.
