---
status: done
branch: feature/kit-run-puerta
base: main
repos: [.]
executor: builder
segment: 3
continuity: continuous
type: code
---
# kit run: puerta mecánica entre verify y revisor

## Goal
`kit run` deja de aceptar el DONE del builder por su palabra: entre `verify` y el revisor corre `kit-check`, `kit-scope` y `kit-close`. Si fallan, relanza al builder con la lista exacta de lo que falta (mismo contador de 2); el revisor (modelo) solo corre si la puerta pasa y recibe su resultado.

## Exploration
- Ciclo actual (`scripts/kit-run.mjs`, bucle `for(;;)`): builder → verify (comando del plan) → revisor de solo lectura. `MAX_RELANZAMIENTOS = 2` compartido entre fallos de verify y devoluciones del revisor. Topes 45/30/15 min y `KIT_RUN_TOPE_MS` (`tools/run/process.mjs`). Salidas 0/1/2. Primera línea `DONE: ...` / `PAUSED: ... motivo=...`.
- Existen `scripts/kit-check.mjs` (salida 0/1/3/2, sin `--json`, `--segment N`), `scripts/kit-scope.mjs` (0/1/3/2, `--json`, usa `process.cwd()`), `scripts/kit-close.mjs` (0/1/3/2, `--json`, `--resultado DONE|PAUSED`; con DONE espera `status: done`). Las filas de scope/close usan niveles `ok|aviso|error|no_verificable` (`tools/check/informe.mjs`). Por tanto C1 y C2 están, y no hay que detenerse.
- Registro A2 existe: `registrar`/`medir` (`tools/run/registro.mjs`) escriben `changes/<nombre>/runs.jsonl`; el test R1 de `tests/kit-run/run.mjs` fija el conjunto exacto de 13 campos (`CAMPOS_REGISTRO`).
- A2b existe: `progress-resumen.md`, pero `cerrarProgreso` solo lo escribe al final de la corrida; para que un relanzamiento lo reciba hay que generarlo antes de relanzar.
- `promptRevisor` tiene un test de paridad con la copia de `tests/luna-reviewer/measure.mjs`: sin datos de puerta su salida debe quedar idéntica.
- El builder real termina con `status: done`; el builder simulado de las pruebas deja `in progress`, así que `kit-close --resultado DONE` fallaría: las pruebas deben adaptarse.
- Motivos PAUSED existentes: `access`, `ambiguous`, `design`, `scope`, `verify`, `alcance`. El contrato DONE/PAUSED no cambia, así que se reutilizan.
- Medido: `node tests/kit-run/run.mjs` ≈ 13 s; `./verify` ≈ 84 s (WSL2, sin Docker).

## Evaluation
- A) Puerta en un módulo nuevo `tools/run/puerta.mjs` que lanza los tres scripts como procesos (misma política de solo lectura que ya tienen) y devuelve un objeto con lista exacta; `kit-run.mjs` solo la invoca. Recomendada: aislada y probable por unidad.
- B) Importar las funciones internas de los scripts: acopla a sus internos y a `process.cwd()`. Descartada.
- C) Inyectar la puerta dentro de `kit-run.mjs`: archivo ya de 248 líneas y mezcla responsabilidades. Descartada.

## Assumptions
- Solo el código de salida 1 de una herramienta bloquea y relanza; 3 (no verificable) y 2 (uso/plan sin tabla A#) pasan al revisor como «ítems no automatizables» sin bloquear. Si se quiere bloquear en 3, cambia un `if` en `puerta.mjs` y un caso de prueba.
- Fuera de alcance relanza con la lista exacta de archivos (no pausa de inmediato); al agotar el contador la pausa lleva motivo `scope`. Si se prefiere pausa inmediata, cambia la rama de relanzamiento.
- Las tres herramientas siempre corren las tres (no se corta en la primera falla) para dar la lista completa en un solo relanzamiento.
- Motivo de PAUSED al agotar relanzamientos: `scope` si hay filas de alcance en error; si no, `verify`. Sin motivo nuevo, para no tocar el contrato.
- La puerta no aplica la regla «misma causa repetida» del modo continuo (solo cuenta el tope de 2); si se quiere, se agrega después.
- Las herramientas se resuelven desde el directorio del propio `kit-run.mjs` (`scripts/`), no desde `--root`; se ejecutan con `cwd` = raíz del proyecto.
- El resumen `progress-resumen.md` se adjunta (truncado a 3000 caracteres) a todo relanzamiento, no solo al de la puerta; si `KIT_PROGRESO=0` no se adjunta nada.

## Decisions already taken
- Executor: builder, porque los cuatro puntos del test de ejecutabilidad dan sí (requisitos cubiertos, contexto accesible, comprobaciones con resultado esperado, sin credenciales ni despliegue) y la persona usuaria no pidió otro ejecutor.
- Rama `feature/kit-run-puerta`, base `main`; sin commit ni push.
- Dos campos nuevos en el registro: `puerta` (`pasa` | `falla` | `no_verificable` | `null`) y `puerta_ms`; nuevo `motivo_relanzamiento: "puerta"`.
- Falta una de las tres herramientas → `kit run` sale con 2 y lo dice antes de tocar el plan.

## Decisions
- Resuelto: 2026-11-24 `tests/progress/run.mjs` entra al Scope del segmento 3 (aprobado por la persona usuaria, opción 1): solo se adapta `PLAN_KR` y su builder simulado para cumplir la puerta (Scope, evidencia, `status: done`); la puerta no cambia.
- Resuelto: 2026-11-24 `tools/run/informe.mjs` entra al Scope (aprobado por la persona usuaria, opción 1); solo se añade `puerta` a `MOTIVOS` y a su validación. `scripts/runs-report.mjs` no se toca salvo que falle.
(Resuelto durante la ejecución, una línea por decisión.)
- Extracción de líneas de error: `kit-check` (sin `--json`) imprime la tabla `A# | estado | comando | motivo/cola`; una fila es falla si la columna estado es `falla`, y el detalle es lo que sigue al último ` | `. `kit-scope --json` y `kit-close --json` dan `{codigo, resumen, filas[]}` con `filas[].nivel`, `filas[].elemento` y `filas[].mensaje`; una fila `error` de kit-scope con mensaje «fuera de Scope» se muestra como `fuera de alcance: <ruta>` y marca alcance; las demás `error` se muestran como `<elemento>: <mensaje>`. Filas `no_verificable` van a no automatizables y `aviso` a avisos (no bloquean).

## Validation
Aprobado por la persona usuaria (Gate 1) el 2026-11-24.

## Scope
- `docs/kit-run.md`, `AGENTS.md`, `tests/kit-run/run.mjs`, `tests/progress/run.mjs` (solo `PLAN_KR` y su builder simulado), `tools/run/puerta.mjs` (nuevo), `tools/run/prompts.mjs`, `scripts/kit-run.mjs`, `scripts/runs-report.mjs` (solo si no tolera `puerta`), `tools/run/informe.mjs` (solo `MOTIVOS` y su validación, para admitir `puerta`).
- `tests/kit-run/run.mjs` y `docs/kit-run.md` (no cuentan como producto).
- Fuera de alcance: `scripts/kit-check.mjs`, `scripts/kit-scope.mjs`, `scripts/kit-close.mjs`, `tools/check/`, el contrato DONE/PAUSED, códigos de salida, topes y `KIT_RUN_TOPE_MS`, `tests/luna-reviewer/`.

## Verification
`./verify` — exit 0 (≈84 s medidos). Los tramos usan `node tests/kit-run/run.mjs` (≈13 s).

## Stop conditions
Seguir si la comprobación pasa, el siguiente paso está en Scope y no falta decisión de la persona usuaria. Detenerse con nota (hecho, pendiente, motivo) si la misma causa falla dos veces, hay que salir de Scope, falta una decisión, o una comprobación tarda más del doble de lo medido. Revisión: fin de historia.

## Ciclo nuevo (diagrama)
```
kit run <plan>
 │  preflight: ¿existen kit-check, kit-scope, kit-close? ── no ─▶ salida 2 (avisa cuál falta)
 ▼
┌──▶ builder ─────────── falla / PAUSED / retorno inválido ─────────────▶ PAUSED (access|motivo del builder)
│     │ DONE
│     ▼
│   verify (comando del plan) ── rojo ──┐
│     │ verde                           │
│     ▼                                 │
│   PUERTA MECÁNICA                     │
│    kit-check [--segment N]            │
│    kit-scope --json                   │  falla = alguna herramienta con salida 1
│    kit-close --resultado DONE --json  │  (3 y 2 = «no verificable», no bloquea)
│     │ pasa          └─ falla ─────────┤
│     ▼                                 ▼
│   revisor (modelo, solo lectura)   ¿relanzamientos < 2?
│   recibe el resultado de la puerta    │ sí: relanzamientos++ y el builder recibe
│     │                                 │     lista EXACTA (A# rojos, archivos fuera
│     ├─ APPROVED ─▶ DONE (exit 0)      │     de alcance, casillas sin evidencia,
│     ├─ PAUSED ───▶ PAUSED (design)    │     omisiones) + progress-resumen.md
│     └─ RETURNED ─▶ ¿relanzamientos<2? │
│                    sí ──────────────┐ │
└─────────────────────────────────────┴─┘
                     no / tercer fallo ─▶ PAUSED (exit 1; motivo scope|verify|design)
Contador de relanzamientos: UNO solo, compartido por verify, puerta y revisor.
Cada intento deja una línea en runs.jsonl con puerta y puerta_ms.
```

## Steps

### Segment 1 — Story: la puerta mecánica existe como módulo probado y el revisor recibe su resultado
As a kit run user I want a module that runs the three tools and returns an exact list of what is missing so that I do not rely on the builder's word.
Dependencies: External — `scripts/kit-check.mjs`, `scripts/kit-scope.mjs`, `scripts/kit-close.mjs` ya existen en `main`.
Contracts to keep: salida de `promptRevisor(planRel, diff, esquema)` idéntica cuando no se pasa cuarto argumento (test «prompts productivo y de evaluación coinciden»); `promptBuilder` sin cambios.
Paths likely to change: `tools/run/puerta.mjs` (nuevo), `tools/run/prompts.mjs`, `tests/kit-run/run.mjs` (casos unitarios nuevos; puede crecer, no se mueve ni archiva).
Concrete example of the expected result: con un plan cuyo A2 está rojo y un archivo modificado fuera de `Scope`, `ejecutarPuerta(...)` devuelve `{ estado: "falla", bloquea: true, motivo: "scope", lista: ["A2: ...", "fuera de alcance: x.txt"] }`.
Scope: `tools/run/puerta.mjs`, `tools/run/prompts.mjs`
Files: tools/run/puerta.mjs, tools/run/prompts.mjs
WHEN las tres herramientas salen 0 THEN `ejecutarPuerta` devuelve `estado: "pasa"` sin lista (A1)
WHEN alguna sale 1 THEN devuelve `estado: "falla"`, `bloquea: true` y una lista con una línea por A# rojo, archivo fuera de alcance, casilla sin evidencia u omisión probable, tomadas de la salida de la herramienta (A2)
WHEN solo hay salidas 3 o 2 THEN `estado: "no_verificable"`, `bloquea: false` y las líneas viajan como ítems no automatizables (A3)
WHEN falta alguna herramienta THEN `herramientasFaltantes(dir)` las nombra (A4)
WHEN `promptRevisor` recibe el resultado de la puerta THEN el prompt dice qué ya se comprobó y pide enfocarse en diseño, riesgos y no automatizables; sin él, el texto no cambia (A5)
Acceptance:
- A1: puerta verde sin lista; check with `node tests/kit-run/run.mjs --test-name-pattern=puerta-verde` (o el filtro que use el arnés); expect exit 0.
- A2: puerta roja devuelve lista exacta con A#, archivos y casillas; check with `node tests/kit-run/run.mjs` caso «puerta-roja»; expect exit 0 y la lista literal esperada en la aserción.
- A3: salidas 3/2 no bloquean y se listan como no automatizables; check with caso «puerta-no-verificable»; expect exit 0.
- A4: `herramientasFaltantes` nombra la herramienta ausente en un directorio temporal sin ella; check with caso «puerta-faltante»; expect exit 0.
- A5: `promptRevisor` sin cuarto argumento es idéntico al de antes y con él incluye el resultado de la puerta; check with `node tests/kit-run/run.mjs` (test de paridad existente más caso nuevo); expect exit 0.
TODO:
- [x] Leer en `scripts/kit-check.mjs`, `scripts/kit-scope.mjs` y `scripts/kit-close.mjs` la salida de `kit-check` (tabla), `kit-scope --json` y `kit-close --json` sobre un plan real de `changes/done/` y anotar en `## Decisions` cómo se extrae cada línea de error. Check: nota escrita; expect formato de cada herramienta descrito.
- [x] Crear `tools/run/puerta.mjs` con `herramientasFaltantes(dir)` (A4). Check: caso «puerta-faltante»; expect pasa.
- [x] Agregar en `tools/run/puerta.mjs` `ejecutarPuerta({ planPath, raiz, tramo, dirHerramientas })` que corre las tres con `cwd` = raíz usando `correr` (sin shell) y los topes de `topeMs` (A1, A2, A3). Check: casos «puerta-verde», «puerta-roja», «puerta-no-verificable»; expect pasan.
- [x] Hacer que `tools/run/puerta.mjs` arme `lista` (línea exacta por falla) y `motivo` (`scope` si hay filas de alcance en error; si no, `verify`) (A2). Check: aserción de lista literal; expect igual.
- [x] Agregar `textoParaBuilder(puerta)` y `textoParaRevisor(puerta)` en `tools/run/puerta.mjs` (A2, A5). Check: aserción sobre ambos textos; expect incluyen la lista / el resultado.
- [x] Añadir cuarto argumento opcional `puerta` a `promptRevisor` en `tools/run/prompts.mjs` (A5). Check: test de paridad existente; expect sigue pasando.
- [x] Agregar los casos de prueba de A1–A5 en `tests/kit-run/run.mjs` con fixtures de plan y repositorio temporal. Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] Sensibilidad en `tests/kit-run/run.mjs`: con una herramienta simulada que sale 1 sin filas, la puerta igual bloquea y avisa «sin detalle». Check: caso «puerta-sin-detalle»; expect pasa.
Segment verification: `node tests/kit-run/run.mjs` — level 1; exit 0; covers A1–A5.
Handoff: segmento solo de módulo y prompt, sin tocar `scripts/kit-run.mjs`. Reglas de decisión en `## Assumptions`. Las tres herramientas viven en `scripts/` (usar `new URL("../../scripts/", import.meta.url)` por omisión). Siguiente: integrar en el bucle (segmento 2).

### Segment 2 — Story: kit run usa la puerta, relanza con la lista exacta y registra el resultado
As a kit run user I want kit run to skip the reviewer when the gate fails and relaunch with what is missing so that I save model reviews and vague returns.
Dependencies: Segment 1 — `ejecutarPuerta`, `herramientasFaltantes`, `textoParaBuilder`, `textoParaRevisor` y el cuarto argumento de `promptRevisor`.
Contracts to keep: primera línea `DONE: plan=...` / `PAUSED: plan=...; motivo=...`; códigos 0/1/2; `MAX_RELANZAMIENTOS = 2` compartido; topes y `KIT_RUN_TOPE_MS`; el plan queda `done` o `partial`.
Paths likely to change: `scripts/kit-run.mjs`, `scripts/runs-report.mjs` (solo si rechaza o ignora mal `puerta`), `tests/kit-run/run.mjs` (fixtures: builder simulado pone `status: done`; `CAMPOS_REGISTRO` pasa a 15 campos).
Concrete example of the expected result: el builder simulado devuelve DONE con A2 rojo; `kit run` no invoca al revisor, relanza con un prompt que contiene «A2» y, tras 2 relanzamientos fallidos, imprime `PAUSED: ...; motivo=verify` y sale con 1.
Scope: `scripts/kit-run.mjs`, `tools/run/informe.mjs`
Files: scripts/kit-run.mjs, tools/run/informe.mjs
WHEN falta una herramienta THEN `kit run` sale 2 antes de tocar el plan y nombra la que falta (A6)
WHEN verify pasa y la puerta pasa THEN corre el revisor y su prompt incluye el resultado de la puerta (A7)
WHEN la puerta falla con un A# rojo THEN no hay llamada al revisor y el builder se relanza con la lista exacta y el resumen de progreso (A8)
WHEN la puerta falla por archivo fuera de `Scope` THEN no hay llamada al revisor, el relanzamiento nombra el archivo y, agotado el contador, `PAUSED motivo=scope` (A9)
WHEN la puerta falla tres veces seguidas (o se mezclan con verify/revisor hasta agotar 2 relanzamientos) THEN `PAUSED` con motivo y exit 1 (A10)
WHEN termina cada intento THEN `runs.jsonl` registra `puerta`, `puerta_ms` y, si relanzó por la puerta, `motivo_relanzamiento: "puerta"` (A11)
Acceptance:
- A6: falta de herramienta → exit 2 con el nombre; check with caso «puerta-preflight» en `tests/kit-run/run.mjs`; expect exit 0.
- A7: puerta verde → el revisor se llama y su prompt contiene el resultado de la puerta; check with caso «puerta-verde-revisor»; expect exit 0.
- A8: A# rojo → sin revisor y prompt de relanzamiento con la lista exacta y `Progress summary`; check with caso «puerta-roja-relanza»; expect exit 0.
- A9: archivo fuera de alcance bloquea (sin revisor) y agotado el contador pausa con `motivo=scope`; check with caso «puerta-fuera-de-alcance»; expect exit 0.
- A10: tercer fallo termina PAUSED exit 1 con el mismo contador de 2; check with caso «puerta-tercer-fallo»; expect exit 0.
- A11: el registro incluye `puerta` y `puerta_ms`; check with test R1 actualizado a 15 campos; expect exit 0. Además `node scripts/runs-report.mjs --raiz <temp>` sobre un registro con `puerta` sale 0; check with caso «runs-report-puerta»; expect exit 0.
TODO:
- [x] En `scripts/kit-run.mjs`, antes de tocar el plan, llamar `herramientasFaltantes` y salir con `uso(...)` (exit 2) si falta alguna (A6). Check: caso «puerta-preflight»; expect pasa.
- [x] Añadir en `scripts/kit-run.mjs` a `intento` los campos `puerta: null` y `puerta_ms: null` (A11). Check: R1 con 15 campos; expect pasa.
- [x] Insertar en `scripts/kit-run.mjs` la puerta entre el bloque de verify y el de revisión, midiendo con `medir` (A7–A10). Check: casos «puerta-verde-revisor» y «puerta-roja-relanza»; expect pasan.
- [x] En `scripts/kit-run.mjs`, si la puerta bloquea: `intento.resultado = "devuelto"`, `motivo_relanzamiento = "puerta"`, mismo contador: relanzar con `promptBuilder(planRel, tramo, textoParaBuilder(puerta))` (A8, A10). Check: caso «puerta-tercer-fallo»; expect pasa.
- [x] En `scripts/kit-run.mjs`, agotado el contador: `final = { pausa: true, motivo: puerta.motivo, msg: ... }` (A9, A10). Check: caso «puerta-fuera-de-alcance»; expect `motivo=scope`.
- [x] En `scripts/kit-run.mjs`, pasar `textoParaRevisor(puerta)` como cuarto argumento de `promptRevisor` (A7). Check: caso «puerta-verde-revisor»; expect el prompt lo contiene.
- [x] En `scripts/kit-run.mjs`, antes de cada relanzamiento (verify, puerta, revisor), escribir el resumen de progreso y adjuntar su contenido truncado a 3000 caracteres (si `PROGRESO`) (A8). Check: caso «puerta-roja-relanza»; expect el prompt contiene `Progress summary`.
- [x] Revisar si `scripts/runs-report.mjs` tolera el campo `puerta` y el motivo `puerta`; ajustar solo si falla (A11). Check: caso «runs-report-puerta»; expect exit 0.
- [x] Adaptar fixtures de `tests/kit-run/run.mjs`: builder simulado pone `status: done` y los planes llevan tabla A# y `Scope`; los casos existentes siguen verdes. Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] Agregar los casos A6–A11 en `tests/kit-run/run.mjs` (revisor simulado registra si fue llamado). Check: `node tests/kit-run/run.mjs`; expect exit 0.
- [x] Sensibilidad en `tests/kit-run/run.mjs`: si se desactiva la puerta, el caso «puerta-roja-relanza» falla (el revisor sí se llama). Check: mutación temporal y revertir; expect el caso falla y luego pasa.
Segment verification: `node tests/kit-run/run.mjs` — level 1; exit 0; covers A6–A11.
Handoff: la puerta va justo antes de `console.error("kit-run: revisión (solo lectura)")`. Reutilizar `MAX_RELANZAMIENTOS` y `relanzamientos`; no crear un segundo contador. El revisor simulado de las pruebas debe registrar su llamada (`KR_LOG`). Si `scripts/runs-report.mjs` ya tolera todo, no se toca.

### Segment 3 — Story: la documentación describe el ciclo nuevo y todo `verify` pasa
As a kit run user I want to read the real cycle in `docs/kit-run.md` so that I know why kit run relaunches or pauses.
Dependencies: Segment 2 — comportamiento final de la puerta.
Contracts to keep: textos de uso, topes y `KIT_RUN_TOPE_MS`, códigos 0/1/2.
Paths likely to change: `docs/kit-run.md`, `AGENTS.md` (una línea en «Cómo funciona»; es documento).
Concrete example of the expected result: `docs/kit-run.md` muestra el diagrama de texto con la puerta y dice que el contador de 2 es único.
Scope: `docs/kit-run.md`, `AGENTS.md`, `tests/progress/run.mjs`
Files: docs/kit-run.md, AGENTS.md, tests/progress/run.mjs
WHEN se lee `docs/kit-run.md` THEN describe builder → verify → puerta → revisor, la lista exacta, el contador único, qué bloquea (salida 1) y qué pasa al revisor (3 y 2), los campos nuevos del registro y que faltar una herramienta da exit 2 (A12)
WHEN se corre `./verify` THEN pasa completo (A13)
Acceptance:
- A12: el documento cubre el ciclo nuevo; check with `rg -n "kit-check|kit-scope|kit-close|puerta" docs/kit-run.md`; expect al menos 4 coincidencias y el diagrama.
- A13: verificación completa en verde; check with `./verify`; expect exit 0.
TODO:
- [x] Reescribir la sección «Ciclo» de `docs/kit-run.md` con el diagrama del plan y las reglas de la puerta (A12). Check: `rg -n "puerta" docs/kit-run.md`; expect coincidencias.
- [x] Documentar en `docs/kit-run.md` el registro (`puerta`, `puerta_ms`, motivo `puerta`) y el exit 2 por herramienta faltante (A12). Check: `rg -n "puerta_ms|faltante|falta" docs/kit-run.md`; expect coincidencias.
- [x] Añadir en `AGENTS.md` una línea sobre la puerta mecánica en «Cómo funciona» (A12). Check: `rg -n "puerta mec" AGENTS.md`; expect una coincidencia.
- [x] Ejecutar el verify completo de la raíz `./verify` (≈84 s) (A13). Check: `./verify`; expect exit 0.
Segment verification: `./verify` — level 3; exit 0; covers A12–A13.
Handoff: solo documentación; no cambiar código. Si `./verify` falla por algo del segmento 2, anotarlo en Notes y devolver PAUSED.

## Evidence
- Segmento 1, `node tests/kit-run/run.mjs`: exit 0, «kit-run: 38 casos pasaron» (29 previos + 9 de puerta/A5, incluido el test de paridad de `promptRevisor`). Casos nuevos: puerta-faltante, puerta-verde, puerta-roja, puerta-roja-verify, puerta-no-verificable, puerta-sin-detalle, puerta-salida-2, A5, filasCheck.
- Línea base medida antes del segmento: `node tests/kit-run/run.mjs` ≈ 13 s; el segmento 1 no cambió el tiempo de forma visible.
- Segmento 2, corrida parcial (`node tests/kit-run/run.mjs`): exit 1, «kit-run: 1 caso(s) fallaron»; 44 casos ok. Casos verdes que cubren las casillas marcadas: puerta-preflight, R1 (15 campos), puerta-verde-revisor, puerta-roja-relanza, puerta-fuera-de-alcance, puerta-tercer-fallo, M2. Falla: `runs-report-puerta` («FALLO runs-report-puerta: el informe acepta el motivo puerta y los campos nuevos»); `tools/run/informe.mjs` línea 8 (`MOTIVOS = ["verify", "revisor"]`) y 35 rechazan `motivo_relanzamiento: "puerta"`. Ese archivo está fuera de Scope.
- Segmento 2, tras la decisión «Resuelto» de `tools/run/informe.mjs` (2026-11-24): `tools/run/informe.mjs` cambia solo `MOTIVOS` (añade `puerta`) y el mensaje de `validarRegistro`; `scripts/runs-report.mjs` no cambia. Cubre A1–A11: la misma suite incluye los casos de A1–A5 (segmento 1) y los de A6–A11 (puerta-preflight, R1, puerta-verde-revisor, puerta-roja-relanza, puerta-fuera-de-alcance, puerta-tercer-fallo, runs-report-puerta).
$ node tests/kit-run/run.mjs
  ok puerta-tercer-fallo: la tercera corrida con la puerta en rojo pausa con exit 1 y sin revisor
  ok runs-report-puerta: el informe acepta el motivo puerta y los campos nuevos
  ok M2 mutación sensible: sin la compuerta de la puerta la roja-relanza falla
  kit-run: 45 casos pasaron
exit 0
$ node tests/runs-report/run.mjs
  ok sin changes/ sale con 2
  7 casos ok
exit 0

- Segmento 3 (documentación), 2026-11-24. Cubre A12:
$ rg -n "puerta" docs/kit-run.md  (cola)
  40:Contador de relanzamientos: UNO solo, compartido por verify, puerta y revisor.
  48:4. Con la verificación aprobada, corre la **puerta mecánica** (`tools/run/puerta.mjs`), que ejecuta en este orden ...
  54:Hay un **solo contador de relanzamientos** (máximo dos en total), compartido por fallos de verificación, bloqueos de la puerta y devoluciones del revisor. ...
  60:Cada intento agrega una línea a `changes/<nombre>/runs.jsonl`. Dos campos describen la puerta:
  65:Un relanzamiento causado por la puerta deja `motivo_relanzamiento: "puerta"`. ...
exit 0
$ rg -n "puerta_ms|faltante|falta" docs/kit-run.md  (cola)
  63:- `puerta_ms`: duración de la puerta en milisegundos.
  71:Si el ciclo no puede terminar, informa `PAUSED`; ... o falta una de las herramientas de la puerta.
exit 0
$ rg -n "puerta mec" AGENTS.md
  22:- Revisión previa al revisor: la puerta mecánica de `kit run` corre entre `verify` y el revisor `kit-check`, `kit-scope` y `kit-close`; ...
exit 0
$ ./verify  (ejecución 1 de 3; cola)
  ok A4 si el vigilante no arranca, kit run deja la salida y el código y avisa por stderr
  FALLO A5 stdout y código de salida son idénticos con y sin vigilante en DONE, PAUSED por verify, PAUSED por tope y exit 2
  ...
  ok A6 un corte por tope anexa bloqueo con origen kitrun y texto corte por tope; un DONE no lo anexa
  progress: 3 caso(s) fallaron
  FALLO: 15: pruebas del progreso en vivo (tools/progress, scripts/kit-status.mjs, scripts/kit-nota.mjs) no pasaron
exit 1
$ node tests/progress/run.mjs  (cola de la corrida aislada)
  FALLO A1 kit run lanza el vigilante ...: kit run relanza 3 veces y termina sin DONE (corrida 3: «kit-run: puerta mecánica», luego «1 !== 0»)
  FALLO A3 kit run escribe progress-resumen.md ...
  FALLO A5 stdout y código de salida son idénticos ...
exit 1

- Segmento 3, reanudación 2026-11-24 (paso de `tests/progress/run.mjs` aprobado en Scope): `PLAN_KR` lleva `## Scope`, la casilla tiene `Check:`, hay sección Evidence y `status: done`; el builder simulado deja `status: done`. La puerta no cambió. Check: `node tests/progress/run.mjs`.
$ node tests/progress/run.mjs
  progress: 44 casos pasaron
exit 0

- Segmento 3, verificación final (ejecución 2 de 3; la 1 falló por `tests/progress/run.mjs`, sin otros cambios de producto). Cubre A13:
$ ./verify
  ok 18: pruebas de kit-close pasaron sobre los fixtures
  ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
  ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
  VERIFY OK
exit 0

## Notes
- Segmento 3, diagnóstico del fallo de `./verify` (paso 15, `tests/progress/run.mjs`): causa en el segmento 2. La puerta mecánica bloquea el plan de prueba `PLAN_KR` de `tests/progress/run.mjs` (sin `## Scope`, con casilla `[x]` sin evidencia y `status: in progress`; el builder simulado no pone `status: done`). El registro muestra tres relanzamientos por la puerta y luego «1 !== 0». Es el comportamiento esperado de la puerta, pero el segmento 2 solo corrió `tests/kit-run/run.mjs` y no detectó que `tests/progress/run.mjs` depende del ciclo anterior. El arreglo (fixture y builder simulado) está en `tests/progress/run.mjs`, fuera de *Scope*. No se modificó. El diagnóstico se anotó con `kit-nota blocked`.
- Estado: `status: partial`, `segment: 3`. Casillas del segmento 3: las tres de documentación marcadas con evidencia; «Ejecutar el verify completo» queda pendiente. `./verify` lleva 1 de 3 corridas finales; no se repitió sin cambio.
- Motivo `scope` (el handoff del segmento 3 exige PAUSED si `./verify` falla por algo del segmento 2). Dónde retomar: `tests/progress/run.mjs`, fixture `PLAN_KR` y el builder simulado; luego `./verify` en la raíz.
- Opciones para la persona usuaria o el planner:
  1. (recommended) Ampliar Scope con `tests/progress/run.mjs` solo para el fixture `PLAN_KR` (agregar `## Scope`, tabla de A#, evidencia y que el builder simulado deje `status: done`); reaprobar el plan con `segment: 3` y repetir `./verify`.
  2. Hacer que la puerta no aplique a planes sin `## Scope`; cambia el contrato acordado en `## Assumptions` y debe reabrir la historia 2.
  3. Cerrar el segmento 3 sin `./verify` verde y registrar el fallo como regresión conocida; contradice A13 y la política de verificación, no recomendado.
- Checkpoint segmento 1 (story 1): archivos `tools/run/puerta.mjs` (nuevo, ~140 líneas: `herramientasFaltantes`, `filasCheck`, `ejecutarPuerta`, `textoParaBuilder`, `textoParaRevisor`), `tools/run/prompts.mjs` (cuarto argumento opcional `puertaTexto` en `promptRevisor`; sin él la salida no cambia), `tests/kit-run/run.mjs` (import y 9 casos nuevos). Diff: sin cambios en `scripts/kit-run.mjs`. Check: `node tests/kit-run/run.mjs` exit 0 (38 casos). Checkboxes 1–8 del segmento 1 marcadas tras su check.
- Fin de la historia 1 («la puerta mecánica existe como módulo probado…»): el segmento 2 es otra historia (`### Segment 2 — Story: kit run usa la puerta…`), así que no se continúa en esta corrida. Se detiene para la revisión del planner en contexto nuevo. `status` queda `in progress` porque los segmentos 2 y 3 siguen pendientes; `segment:` se queda en 1. Cerrar o marcar `done` lo decide el planner.
- Observación: `filasCheck` corta en el último « | », así que un detalle que contenga « | » se muestra solo tras el último separador (efecto solo textual).
- Checkpoint segmento 2 (story 2), pausa por alcance: archivos cambiados `scripts/kit-run.mjs` (47 líneas en `git diff --stat`, preflight, intento con `puerta`, puerta entre verify y revisor, relanzamiento con `motivo_relanzamiento: "puerta"`, resumen de progreso en relanzamientos), `tools/run/prompts.mjs` (cuarto argumento de `promptRevisor`), `tests/kit-run/run.mjs` (fixtures y casos A6–A10 y M2), `tools/run/puerta.mjs` sin cambios desde el segmento 1. `scripts/runs-report.mjs` y `tools/run/informe.mjs` sin cambios. Check de la historia: `node tests/kit-run/run.mjs` exit 1 por `runs-report-puerta`.
- Pendiente de la historia 2: casilla de `scripts/runs-report.mjs` (A11), «Adaptar fixtures» y «Agregar los casos A6–A11» quedan sin marcar porque su check global (`node tests/kit-run/run.mjs` exit 0) no pasa.
- PAUSED motivo=scope: el arreglo de A11 requiere cambiar `tools/run/informe.mjs`, que no está en Scope. No se amplió Scope (lo decide la persona usuaria o el planner). Opciones: (1) (recommended) añadir `tools/run/informe.mjs` al Scope y permitir `puerta` en `MOTIVOS` y su validación, luego repetir `node tests/kit-run/run.mjs`; (2) dejar `motivo_relanzamiento: null` para la puerta y registrar solo `puerta: falla`, lo que cambia el contrato de registro acordado; (3) aplazar A11 a un cambio aparte y cerrar el segmento 2 sin esa comprobación, con decisión explícita de la persona usuaria.
- `status` queda `partial` con `segment: 2`: la historia 2 no pasa su verificación y la 3 no se inició.
- Reanudación del segmento 2 (2026-11-24, con Scope ampliado a `tools/run/informe.mjs` por la decisión «Resuelto»): checkpoint de la historia 2. Archivos cambiados en esta reanudación: `tools/run/informe.mjs` (2 líneas). Archivos de la historia 2 en total (`git diff --stat`): `scripts/kit-run.mjs` 47 líneas, `tests/kit-run/run.mjs` 269, `tools/run/prompts.mjs` 4, `tools/run/informe.mjs` 4. Check: `node tests/kit-run/run.mjs` exit 0 (45 casos pasaron); `node tests/runs-report/run.mjs` exit 0 (7 casos). Casillas A11 (informe), fixtures y casos A6–A11 cerradas con esa evidencia; `scripts/runs-report.mjs` no necesitó cambio.
- Fin de la historia 2 («kit run usa la puerta…»): el segmento 3 es otra historia (`### Segment 3 — Story: la documentación…`), así que no se ejecutó en esta corrida, por la regla de no cambiar de historia y por la revisión del planner en contexto nuevo. `status` queda `done` por la instrucción de la persona que lanzó la corrida, que pide `done` al pasar la verificación del segmento; `segment:` sigue en 2 porque el segmento 3 no se avanzó. Antes de ejecutar el segmento 3, el planner debe revisar la historia 2 y reaprobar el plan (poner `status: approved`, `segment: 3`).
- Conteo de casillas pendientes del plan tras esta corrida: 4 (todas del segmento 3, sin iniciar).
- Reanudación del segmento 3 (2026-11-24): checkpoint. Archivo cambiado: `tests/progress/run.mjs` (fixture `PLAN_KR`: `## Scope`, `Check:`, Evidence y Notes; builder simulado `status: done`; unas 12 líneas netas). Fuera de Scope: nada; la puerta y `scripts/kit-*.mjs` no cambiaron. Checks: `node tests/progress/run.mjs` exit 0 (44 casos); `./verify` exit 0 (ejecución 2 de 3). Casilla de verify marcada con evidencia. `status: done`, `segment: 3`.
- Residuales de `kit-close --resultado DONE` (exit 1, 2 errores, revisados por el builder; no se cambió el gate ni el Scope): (a) el paso «agotado el contador» tiene como Check el texto `motivo=scope`, que es una aserción y no un comando, así que el gate no encuentra evidencia; (b) el paso «antes de cada relanzamiento» tiene como Check `Progress summary`, mismo caso. Ambos casos pasan en `node tests/kit-run/run.mjs` (puerta-fuera-de-alcance y puerta-roja-relanza). El planner decide si reescribe esas casillas con un comando en `Check:` o acepta el residual.
