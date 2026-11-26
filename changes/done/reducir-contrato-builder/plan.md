---
status: done
branch: feature/reducir-contrato-builder
base: main
repos: [.]
executor: builder
segment: 5
type: code
---
# Contrato único y corto del builder

## Goal
El builder recibe cada regla una sola vez, sin contradicciones, en 13 500 bytes o menos, también bajo `kit run`, y escribe pruebas proporcionales.

## Exploration
- [inventario.md](inventario.md): 82 reglas, 51 duplicadas, 12 contradicciones o tensiones, ninguna cubierta por completo por herramientas.
- Partida: `builder.md` 5470 B, `execute-plan/SKILL.md` 10397 B, total 15867 B (≈3970 tokens a 4 B/token; ≈5290 a 3).
- `kit run` (solo Codex, `tools/run/commands.mjs`) lanza `codex exec` con el prompt de `tools/run/prompts.mjs` («using the execute-plan skill»): no carga `builder.md`. Hoy ahí no llegan los límites de commit y `.env` ni la sección *Return*.
- `scripts/kit-run.mjs` ejecuta *Verification* tras el builder y después la puerta mecánica.
- `tests/permissions-contract/structure.test.mjs` exige la advertencia de `git -C` en la skill; `tests/kit-run/run.mjs` (caso A1) exige el prompt exacto del builder.
- Pruebas frente a producto (`node changes/reducir-contrato-builder/medir-razon.mjs`, 10 cambios): 9 con producto, mediana 1,15, máximo 4,17.

### Preguntas de comportamiento (respondidas 2026-11-26)
- ¿Quién corre la suite completa? El builder corre las relacionadas mientras construye; los comandos declarados en el plan se ejecutan como hoy.
- ¿Cómo llegan los límites a `kit run`? Se antepone `builder.md` al prompt y la skill manda leerlo si falta.
- ¿Presupuesto? 13 500 bytes en total.

## Evaluation
- Elegida: una ubicación por regla. `builder.md`: identidad, límites y retorno. Skill: procedimiento y pruebas.
- Descartada: duplicar límites en la skill (rompe la ubicación única). Descartada: fundir todo en un archivo (depende de cómo carga cada herramienta).
- Riesgo principal: perder o debilitar una regla al reescribir; se controla con [reglas.md](reglas.md) y las aserciones movidas.

## Assumptions
- «P8» es la etiqueta de la persona para el A/B ([ab-p8.md](ab-p8.md)); no está definida en el repo. Si es otra cosa, cambia ese documento.
- C1: `git -C` y `git -c` prohibidos siempre. Si se quiere lectura con `-C`, cambian las reglas de Codex y dos pruebas.
- C4: leer una vez; releer solo tras editar o recuperarse.
- C2: sin motivo nuevo. Dependencia incumplida → `ambiguous`; duración sin medir o vencida → `verify`. Si deben ser otros, cambia una línea de la skill.
- C5, C7-C12: se corrige solo la redacción, sin cambiar comportamiento.
- C13 (`.env.example` alcanzado por hook y deny) queda fuera.
- La skill no nombra la opción `--findRelatedTests`: es de un stack y `AGENTS.md` lo prohíbe; dice «the runner's related-tests option».
- Aviso de proporción en `kit-scope` (ya compara la rama con la base); umbral calibrado solo con este repo.
- Los archivos sin seguimiento de la raíz que aparecen en el sandbox (`.bash_profile`, `.gitconfig`, `.idea`, etc.) no son cambios del plan: no se tocan ni detienen el trabajo.

## Decisions already taken
- Una sola ubicación por regla; motivos de pausa actuales (`ambiguous|design|scope|access|verify`).
- 2 fallas por la misma causa en modo continuo; 3 corridas finales en el resto; cada límite en su ámbito.
- Ante aviso de corte queda `in progress`, como excepción a terminar con `DONE`/`PAUSED`.
- Cobertura parcial de una herramienta no autoriza a quitar texto. Ante la duda se conserva.
- Presupuesto 13 500 bytes; suite y `kit run` según las respuestas de Exploration.
- Executor: builder, porque requisitos, contexto y comprobaciones están definidos y no usa credenciales ni despliegue.

## Decisions

## Validation
Respuestas de Exploration confirmadas y plan aprobado (Gate 1) el 2026-11-26.
Avisos de `review-plan` aceptados: pesa más de 8192 bytes porque lleva el texto exacto de contratos y movimientos de pruebas; sin `continuity` porque son historias distintas y las de seguridad se revisan una por una.

## Scope
Producto:
- `tools/run/prompts.mjs`
- `core/skills/execute-plan/SKILL.md`
- `core/agents/builder.md`
- `tools/check/proporcion.mjs` (nuevo)
- `tools/check/cambios.mjs`
- `scripts/kit-scope.mjs`

Pruebas y documentos:
- `tests/kit-run/run.mjs`, `tests/kit-scope/run.mjs`, `tests/context-size/sizes.test.mjs`, `tests/builder-contract.mjs`
- `tests/permissions-contract/structure.test.mjs`
- `tools/verify/agent-contracts.sh`, `tools/verify/segment-contract.sh`, `tools/verify/operating-contract.sh`, `tools/verify/workspace-contracts.sh`
- `docs/como-funciona.md`, `tests/README.md`

Fuera: `core/agents/planner.md`, adaptadores, reglas deny, hook, `puerta.mjs`.

## Verification
`./verify`

Línea base en `main` (2026-11-26, este sandbox): `VERIFY OK`, 35 pasos, exit 0, 183 s, `Fingerprint: b406b5d57f81`.

## Stop conditions
- Si el contrato no cabe en 13 500 bytes sin quitar o debilitar una regla: `PAUSED motivo=design` con el tamaño logrado. Nunca borrar reglas para caber.
- Una aserción existente solo cambia de archivo o de objetivo según este plan; si hay que quitarla o relajarla: `PAUSED motivo=design`.

## Steps

### Segment 1 — Story: los límites llegan al builder de kit run
As persona usuaria I want que `kit run` entregue `builder.md` so that sus límites y retorno rijan también ahí.
Dependencies: none ("Not applicable").
Contracts to keep: `promptBuilder(planRel, tramo, ajuste)`; la línea base y el bloque «Fix before continuing:» no cambian.
Paths likely to change: `tools/run/prompts.mjs`; `tests/kit-run/run.mjs` A1 exige el prompt exacto y se actualiza.
Concrete example of the expected result: el stdin del builder es `Builder contract:`, el cuerpo de `builder.md` sin cabecera, `---` y `Execute plan <plan> (segment: 1) using the execute-plan skill. Respond with the return line.`
Scope: `tools/run/prompts.mjs`
Files: tools/run/prompts.mjs
WHEN `kit run` lanza o relanza al builder THEN el prompt incluye el contrato completo (A1)
Acceptance:
- A1: el prompt exacto es el del ejemplo, también al relanzar; si falta `builder.md`, falla con error; check con `node tests/kit-run/run.mjs`; expect exit 0.
TODO:
- [x] En `tests/kit-run/run.mjs`, exigir en A1 el prompt compuesto (A1). Check: `node tests/kit-run/run.mjs`; expect falla solo A1.
- [x] En `tools/run/prompts.mjs`, anteponer el cuerpo de `builder.md` leído desde la raíz del kit (A1). Check: `node tests/kit-run/run.mjs`; expect exit 0.
Segment verification: `node tests/kit-run/run.mjs` — level 1; exit 0; covers A1.
Handoff: resolver la ruta con `import.meta.url`, no con el directorio de trabajo. Cabecera: bloque inicial entre `---`. No tocar `promptRevisor`.

### Segment 2 — Story: pruebas proporcionales
As persona usuaria I want que el builder pruebe solo lo que cambia so that no escriba pruebas extensas ni sintéticas.
Dependencies: none ("Not applicable").
Contracts to keep: `Check`, `Segment verification:` y *Verification* se ejecutan exactamente como están escritos.
Paths likely to change: `core/skills/execute-plan/SKILL.md`, `tests/builder-contract.mjs`.
Concrete example of the expected result: un bug corregido en un módulo añade como máximo una prueba de regresión y corre las pruebas que lo importan.
Scope: `core/skills/execute-plan/SKILL.md`
Files: core/skills/execute-plan/SKILL.md
WHEN el builder prueba THEN aplica los límites y no recorta comandos declarados (A2)
Acceptance:
- A2: la skill tiene la sección `## Proportional tests` con las cinco reglas del Handoff y la prueba falla si falta una; check con `node tests/builder-contract.mjs`; expect exit 0.
TODO:
- [x] En `tests/builder-contract.mjs`, exigir las cinco frases y una mutación negativa (A2). Check: `node tests/builder-contract.mjs`; expect falla por sección ausente.
- [x] En `core/skills/execute-plan/SKILL.md`, añadir la sección con ese texto (A2). Check: `node tests/builder-contract.mjs`; expect exit 0.
Segment verification: `node tests/builder-contract.mjs` — level 1; exit 0; covers A2.
Handoff: texto de la sección, sin nombrar herramientas de un stack:
1. `Test only what you created or modified and its direct dependents: for each A#, the happy path and that criterion's edges.`
2. `At most one regression test per bug.`
3. `Every test exercises the real product; a fixture may feed it but never replaces or rewrites what is under test.`
4. `While building, run only the tests related to the diff (import graph or the runner's related-tests option; otherwise the test files covering the changed paths). The final gate runs the full suite.`
5. `This never narrows a declared command: Check, Segment verification:, and Verification run exactly as written.`

### Segment 3 — Story: una sola ubicación por regla y presupuesto
As builder I want cada regla una vez so that sobreviva entera a la compactación.
Dependencies: Segment 1 — `kit run` debe entregar `builder.md` antes de sacar límites o retorno de la skill. Segment 2 — la sección nueva cuenta en el presupuesto.
Contracts to keep: primera línea `DONE:`/`PAUSED:` y sus campos; `motivo=` actuales; frontmatter de ambos archivos (`skills: execute-plan`, `timeoutMs`); marcadores que lee `tools/check/cierre.mjs`.
Paths likely to change: los dos archivos del contrato; las pruebas de *Scope* que exigen frases literales cambian de archivo objetivo junto con la frase.
Concrete example of the expected result: «no commit» aparece solo en `builder.md`; la regla de marcar casillas, solo en la skill.
Scope: `core/agents/builder.md`, `core/skills/execute-plan/SKILL.md`
Files: core/agents/builder.md, core/skills/execute-plan/SKILL.md
WHEN se cargan los dos archivos THEN están las 82 reglas una vez y los límites van arriba (A3, A4)
Acceptance:
- A3: `wc -c` de ambos suma 13500 o menos y la prueba falla con 13501; check con `node --test tests/context-size/sizes.test.mjs`; expect exit 0.
- A4: cada ID de `reglas.md` está en su destino y una sola vez; orden de `builder.md`: identidad, `## Non-negotiable limits`, `## Return`; check con revisión contra `reglas.md` y `./verify`; expect sin faltantes y exit 0.
- A5: *Return* define el retorno estructurado del Handoff; `DONE` usa 5 líneas o menos; check con `node tests/builder-contract.mjs`; expect exit 0.
TODO:
- [x] En `tests/context-size/sizes.test.mjs`, añadir el límite 13500 de la suma, con caso 13501 (A3). Check: `node --test tests/context-size/sizes.test.mjs`; expect falla con 15867 o más.
- [x] Reescribir `core/agents/builder.md`: identidad, límites y retorno (A4, A5). Check: `rg -n '^## ' core/agents/builder.md`; expect límites antes que retorno.
- [x] Reescribir `core/skills/execute-plan/SKILL.md`: puntero al contrato y procedimiento sin repeticiones (A4). Check: `node --test tests/context-size/sizes.test.mjs`; expect exit 0.
- [x] En `tests/builder-contract.mjs`, mover frases de continuidad a la skill y exigir etiquetas de retorno (A4, A5). Check: `node tests/builder-contract.mjs`; expect exit 0.
- [x] En `tools/verify/agent-contracts.sh`, exigir la receta de espera solo en skill y referencia (A4). Check: `bash -n tools/verify/agent-contracts.sh`; expect exit 0.
- [x] En `tools/verify/segment-contract.sh`, apuntar `Long output`, `tramo-<n>.md` y `segment: <n>` a la skill (A4). Check: `bash -n tools/verify/segment-contract.sh`; expect exit 0.
- [x] En `tools/verify/operating-contract.sh`, apuntar la relectura a la skill (A4). Check: `bash -n tools/verify/operating-contract.sh`; expect exit 0.
- [x] En `tests/permissions-contract/structure.test.mjs`, exigir la advertencia `git -C` en `builder.md` (A4). Check: `node --test tests/permissions-contract/structure.test.mjs`; expect exit 0.
- [x] En `tools/verify/workspace-contracts.sh`, extender a `builder.md` la prohibición de `git -C <` (A4). Check: `bash -n tools/verify/workspace-contracts.sh`; expect exit 0.
- [x] Ejecutar la verificación completa (A4). Check: `./verify`; expect exit 0 (≈3 min).
Segment verification: `node --test tests/context-size/sizes.test.mjs` — level 1; exit 0; covers A3, A4, A5.
Handoff: seguir [reglas.md](reglas.md). Instrucciones en inglés; conservar literalmente las frases de `inventario.md` §1 en el archivo destino. La skill empieza con: `The limits and return format are in the builder contract (core/agents/builder.md in the kit root, path in ~/.flucastr-ai/raiz); if it is not in your context, read it before any change.` Retorno:
`DONE: plan=<path>; segment=<n>; verify=pasa` + `cambios:` · `evidencia:` (comando, `exit N`, `Fingerprint`) · `decisiones:` · `revisar:`.
`PAUSED: …` (campos actuales) + `problema:` · `opciones:` (2 o 3, una «(recommended)») · `cambios:` · `retomar:`.
Sin `segment=<n>` si el plan no tiene tramo. Toda mutación negativa existente se conserva apuntando al archivo nuevo.

### Segment 4 — Story: aviso de proporción de pruebas
As revisor I want ver la razón pruebas/producto so that detecte pruebas desmedidas sin bloquear.
Dependencies: none ("Not applicable").
Contracts to keep: códigos de salida y filas actuales de `kit-scope`; solo lectura; un `aviso` no cambia el código.
Paths likely to change: los tres de Scope; `tests/kit-scope/run.mjs`.
Concrete example of the expected result: 130 líneas de prueba y 40 de producto dan `aviso` «pruebas/producto 3.25 (130 líneas de prueba, 40 de producto): supera 3.0; revisa que sean proporcionales», exit 0.
Scope: `tools/check/proporcion.mjs`, `tools/check/cambios.mjs`, `scripts/kit-scope.mjs`
Files: tools/check/proporcion.mjs, tools/check/cambios.mjs, scripts/kit-scope.mjs
WHEN la razón supera 3.0 con 100 líneas de prueba o más THEN `kit-scope` avisa (A6)
Acceptance:
- A6: avisa en el ejemplo; no avisa con razón 3.0 exacta, con 99 líneas de prueba ni sin líneas de producto; cuenta archivos sin seguimiento sin abrir secretos ni enlaces; check con `node tests/kit-scope/run.mjs`; expect exit 0.
TODO:
- [x] En `tests/kit-scope/run.mjs`, añadir esos casos sobre repos temporales que se limpian (A6). Check: `node tests/kit-scope/run.mjs`; expect fallan los casos nuevos.
- [x] Crear `tools/check/proporcion.mjs` con clasificación y umbrales puros (A6). Check: `node --check tools/check/proporcion.mjs`; expect exit 0.
- [x] En `tools/check/cambios.mjs`, contar líneas con `diff --numstat` contra el merge-base (A6). Check: `node --check tools/check/cambios.mjs`; expect exit 0.
- [x] En `scripts/kit-scope.mjs`, emitir la fila `aviso` (A6). Check: `node tests/kit-scope/run.mjs`; expect exit 0.
Segment verification: `node tests/kit-scope/run.mjs` — level 1; exit 0; covers A6.
Handoff: clasificación igual a `medir-razon.mjs` (regex `T` = prueba, `X` = ignorado; además se ignoran `changes/` y `docs/`). Producto = añadidas + borradas; prueba = añadidas. Binarios no cuentan. Sin seguimiento: leer solo rutas que `clasificarRuta` da como `dentro`, archivo regular (`lstat`).

### Segment 5 — Story: documentación y cifras finales
As persona usuaria I want las cifras reales documentadas so that apruebe la evidencia.
Dependencies: Segment 3 — tamaños finales. Segment 4 — comportamiento del aviso.
Contracts to keep: `AGENTS.md` no se edita aquí.
Paths likely to change: `docs/como-funciona.md`, `tests/README.md`, `changes/reducir-contrato-builder/reglas.md`.
Concrete example of the expected result: la tabla de `reglas.md` gana la columna «real» con `wc -c`.
Scope: documentos (no cuentan como producto).
Files: docs/como-funciona.md, tests/README.md, changes/reducir-contrato-builder/reglas.md
WHEN termina el cambio THEN los documentos describen lo construido (A7)
Acceptance:
- A7: documentan contrato, presupuesto, pruebas proporcionales y aviso; las cifras coinciden con `wc -c`; check con `./verify`; expect exit 0.
TODO:
- [x] En `docs/como-funciona.md`, describir contrato, presupuesto, pruebas y aviso (A7). Check: `rg -n '13 500|proporci' docs/como-funciona.md`; expect coincidencias.
- [x] En `tests/README.md`, actualizar las filas de tamaño y `kit-scope` (A7). Check: `rg -n 'proporci' tests/README.md`; expect coincidencias.
- [x] En `changes/reducir-contrato-builder/reglas.md`, anotar bytes reales y tokens a 3 y 4 B/token (A7). Check: `wc -c core/agents/builder.md core/skills/execute-plan/SKILL.md`; expect las mismas cifras.
- [x] Ejecutar la verificación final (A7). Check: `./verify`; expect exit 0 (≈3 min).
Segment verification: `git diff --check` — level 1; exit 0; covers A7.
Handoff: no ejecutar el A/B de `ab-p8.md`.

## Evidence

Paso 1 (exigir el prompt compuesto en A1):
$ node tests/kit-run/run.mjs
FALLO A1 ciclo completo: done, builder una vez, revisor en solo lectura
Expected values to be strictly equal: (+ actual - expected; el prompt aún no antepone el contrato)
kit-run: 1 caso(s) fallaron
exit 1

Paso 2 (anteponer el contrato en `tools/run/prompts.mjs`):
$ node tests/kit-run/run.mjs
ok A1 ciclo completo: done, builder una vez, revisor en solo lectura
ok A2 verify que siempre falla: 2 corridas del builder, la segunda falla pide consejo y partial
ok D5 KIT_RUN_PEGADO=0: no se evalúa nada aunque haya bucle de sondeos
ok M2 mutación sensible: sin la compuerta de la puerta la roja-relanza falla
kit-run: 50 casos pasaron
exit 0

Segment verification (segmento 1): `node tests/kit-run/run.mjs`, exit 0, cubre A1. Es la corrida del paso 2 sobre el árbol final: no hubo cambios después.
$ git diff --check
exit 0

Paso 3 (segmento 2, exigir las cinco reglas y sus mutaciones en `tests/builder-contract.mjs`):
$ node tests/builder-contract.mjs
AssertionError [ERR_ASSERTION]: A2: la skill debe tener la sección ## Proportional tests
    at validarPruebasProporcionales (file:///home/franco/Codes/flucastr/Flucastr.AI/tests/builder-contract.mjs:96:10)
exit 1

Paso 4 (segmento 2, añadir `## Proportional tests` en `core/skills/execute-plan/SKILL.md`):
$ node tests/builder-contract.mjs
ok A2 pruebas proporcionales: 5 reglas y 5 mutaciones negativas detectadas
ok A5: plantilla y revisión exigen dependencias externas, contratos, rutas y ejemplo; 12 mutaciones negativas detectadas
registro real A2 interrumpido: mutación de casilla rechazada
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

Segment verification (segmento 2): `node tests/builder-contract.mjs`, exit 0, cubre A2. Corrida del paso 4 sobre el árbol final; no hubo cambios después. Comprobación adicional: `node --test tests/context-size/sizes.test.mjs`, exit 0 (5 pruebas pasan).
$ git diff --check
exit 0

Segmento 3 (una sola ubicación por regla y presupuesto):

Paso 1 (sizes.test.mjs, límite de suma 13500 y caso 13501):
$ node --test tests/context-size/sizes.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

Paso 2 (reescribir builder.md): `wc -c core/agents/builder.md` = 2672; `rg -n '^## ' core/agents/builder.md` muestra `## Non-negotiable limits` antes de `## Return`.

Paso 3 (reescribir SKILL.md): `wc -c core/skills/execute-plan/SKILL.md` = 10074; suma con builder.md = 12746 (≤ 13500).
$ node --test tests/context-size/sizes.test.mjs
ℹ fail 0
exit 0

Paso 4 (builder-contract.mjs, movimientos y etiquetas de retorno A5):
$ node tests/builder-contract.mjs
ok A5: 11 etiquetas de retorno y límite de cinco líneas en builder.md
ok A4: contrato nuevo y compatibilidad con el contrato anterior
exit 0

Paso 5 (agent-contracts.sh, 8p sin comprobaciones de builder):
$ bash -n tools/verify/agent-contracts.sh
exit 0

Paso 6 (segment-contract.sh, Long output, tramo-<n>.md y segment: <n> a la skill):
$ bash -n tools/verify/segment-contract.sh
exit 0

Paso 7 (operating-contract.sh, relectura a la skill):
$ bash -n tools/verify/operating-contract.sh
exit 0

Paso 8 (structure.test.mjs, git -C en builder.md):
$ node tests/permissions-contract/structure.test.mjs
exit 0

Paso 9 (workspace-contracts.sh, git -C < en builder.md):
$ bash -n tools/verify/workspace-contracts.sh
exit 0

Paso 10 (verificación completa):
$ ./verify
VERIFY OK
resultado registrado: Fingerprint: d685a3ad85ee
verify_exit=0
exit 0
Nota: una corrida anterior de `./verify` (antes de los últimos cambios de `builder-contract.mjs` y de la frase de apertura de la skill) falló en el paso 5d (equivalencia de simulación de desinstalación). No se reprodujo: la corrida posterior pasa, y dos instalaciones idénticas en homes temporales distintos solo difieren en rutas temporales embebidas en los wrappers. Se registra como fallo intermitente sin causa identificada.

Devolución del tramo 3 (corrección, 2026-11-26):

$ node --test tests/context-size/sizes.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

$ node tests/builder-contract.mjs
ok A2 pruebas proporcionales: 5 reglas y 5 mutaciones negativas detectadas
ok A5: 11 etiquetas de retorno y límite de cinco líneas en builder.md
ok A4: contrato nuevo y compatibilidad con el contrato anterior
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

$ wc -c core/agents/builder.md core/skills/execute-plan/SKILL.md
2753 core/agents/builder.md
10514 core/skills/execute-plan/SKILL.md
13267 total
(suma 13267 ≤ 13500)

Primera corrida final de `./verify` tras la corrección (fallo, causa propia): paso 8c (`tools/verify/operating-contract.sh`) exige la frase literal `3 runs` en la skill; el cambio de la línea de `verify` la había quitado. Corregido en la skill («outside it, `verify` fails in 3 runs of *Verification*»). Antes de relanzar: `node scripts/kit-verificado.mjs estado --nivel aceptacion` → `verificar: motivo=huella_distinta`, exit 1 (no exit 3).
$ ./verify
VERIFY FALLO: paso 8 (exit 1); detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: dc388ba963f2
exit 1

Segunda corrida final de `./verify` (tras la corrección):
$ ./verify
verify: 35 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 27bafbd82cea
VERIFY OK
verify_exit=0
exit 0

Segmento 4 (aviso de proporción de pruebas):

Paso 1 (casos A6 en `tests/kit-scope/run.mjs`, antes de implementar; los negativos pasan porque aún no hay aviso y quedan como guardas):
$ node --test tests/kit-scope/run.mjs
✖ A6: razón 3.25 con 130 líneas de prueba avisa y sale con 0
✖ A6: cambios confirmados en la rama cuentan igual que los sin confirmar
✖ A6: borradas cuentan como producto y sin confirmar se suman a las confirmadas
✖ A6: un archivo prohibido no se cuenta, así no tapa el aviso
ℹ pass 18
ℹ fail 4
exit 1

Paso 2 (`tools/check/proporcion.mjs`, nuevo):
$ node --check tools/check/proporcion.mjs
exit 0

Paso 3 (`tools/check/cambios.mjs`, `lineasDelRepo` con `diff --numstat -z` contra el merge-base, `lineasSinSeguimiento` con lstat y realpath):
$ node --check tools/check/cambios.mjs
exit 0

Paso 4 (`scripts/kit-scope.mjs`, fila `aviso` al final; el código no cambia):
$ node tests/kit-scope/run.mjs
ℹ tests 22
ℹ pass 22
ℹ fail 0
exit 0

Segment verification (segmento 4): `node tests/kit-scope/run.mjs`, exit 0, cubre A6. Corrida sobre el árbol final; no hubo cambios después.
Comprobaciones adicionales (pruebas relacionadas): `node --test tests/kit-scope/alcance.test.mjs` ℹ pass 15, ℹ fail 0, exit 0; `node tests/kit-close/run.mjs`, exit 0.

Segmento 5 (documentación y cifras finales):

Paso 1 (`docs/como-funciona.md`, bullet de contrato y aviso de `kit-scope`; líneas recortadas a 120 caracteres):
$ rg -n '13 500|proporci' docs/como-funciona.md
5:- Contrato del builder: `core/agents/builder.md` tiene identidad, límites y retorno; ...
18:- Contraste de alcance y cierre mecánico (sin modelo, solo lectura): ...
exit 0

Paso 2 (`tests/README.md`, fila `kit-scope` con aviso y fila nueva de `tests/context-size/sizes.test.mjs`):
$ rg -n 'proporci' tests/README.md
35:| `tests/kit-scope/run.mjs` | `node tests/kit-scope/run.mjs` | Fixtures de planes ... Aviso de proporción pruebas/producto (A6, fila `aviso`, ...
exit 0

Paso 3 (`reglas.md`, columna «real»):
$ wc -c core/agents/builder.md core/skills/execute-plan/SKILL.md changes/reducir-contrato-builder/reglas.md
 2753 core/agents/builder.md
10514 core/skills/execute-plan/SKILL.md
 3772 changes/reducir-contrato-builder/reglas.md
17039 total
exit 0
Las cifras de `reglas.md` coinciden: 2753 y 10514 B; total 13267 B (3317 tokens a 4 B, 4422 a 3 B).

Paso 4 (verificación final sobre el árbol final; primera y única corrida de este segmento):
$ ./verify
verify: 35 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 432ef33facd2
VERIFY OK
exit 0
Comprobación posterior: `node scripts/kit-verificado.mjs estado --nivel aceptacion` → `Fingerprint: 432ef33facd2`, `ya verificado: nivel=aceptacion fase=25`, exit 0.

Segment verification (segmento 5): `git diff --check`, exit 0; cubre A7 junto con la verificación final.

## Notes
- Segmento 1 completo (historia: los límites llegan al builder de `kit run`). Rama `feature/reducir-contrato-builder` creada desde `main` con `git switch -c`. Ningún cambio rastreado fuera de `changes/reducir-contrato-builder/`. Los archivos sin seguimiento de la raíz (`.bashrc`, `.gitconfig`, `.idea`, etc.) no se tocaron.
- Checkpoint segmento 1: archivos cambiados `tools/run/prompts.mjs` (promptBuilder lee `core/agents/builder.md` con `import.meta.url`, quita la cabecera y antepone `Builder contract:`/`---`), `tests/kit-run/run.mjs` (A1 exige el prompt exacto; A2 exige que cada relanzamiento empiece con el contrato, lo que cubre «también al relanzar» de A1). Resumen de diff: 2 archivos de código con ~20 líneas; ninguna aserción existente debilitada.
- Decisión menor (no cambia Scope): el ajuste «Fix before continuing:» va después de la línea de ejecución, como antes; el contrato va solo delante.
- `promptRevisor` sin cambios. Línea base de `./verify` no se ejecutó en este segmento (no es el segmento final).
- Pendientes tras el segmento 1 (contador `pendientes-plan`): 20, todos de los segmentos 2 a 5; ninguno del segmento 1.
- Revisión tramo 1 (planner, 2026-11-26): APPROVED. A1 cumple: `node tests/kit-run/run.mjs` 50 casos, exit 0; el prompt real incluye límites y *Return*, sin cabecera. «Falta builder.md → error» comprobado por lectura (`readFileSync` lanza), sin prueba propia.
- Checkpoint segmento 2 (pruebas proporcionales, 2026-11-26): archivos cambiados `tests/builder-contract.mjs` (+28 líneas: bloque A2 con las cinco reglas, validación y cinco mutaciones negativas) y `core/skills/execute-plan/SKILL.md` (+8 líneas: sección `## Proportional tests` antes de `## Final Verification`). Resumen de diff: 36 líneas añadidas en 2 archivos, ninguna existente cambiada. Check: `node tests/builder-contract.mjs`, exit 0. Comprobación adicional: `node --test tests/context-size/sizes.test.mjs`, exit 0. Tamaño de la skill: 11009 B (el presupuesto de 13 500 B se cierra en el segmento 3).
- Pendientes tras el segmento 2 (contador `pendientes-plan`): 18, todos de los segmentos 3 a 5.
- Sin commit. Rama `feature/reducir-contrato-builder` sin cambios de git tras el segmento 1; los archivos sin seguimiento de la raíz no se tocaron.
- Revisión tramo 2 (planner, 2026-11-26): APPROVED. A2 cumple: texto literal del Handoff, `node tests/builder-contract.mjs` exit 0 con 5 mutaciones negativas. La skill mide 11009 B: el tramo 3 debe partir de ahí.
- Checkpoint segmento 3 (una sola ubicación por regla y presupuesto): `core/agents/builder.md` reescrito (5470 → 2672 B; identidad, `## Non-negotiable limits`, `## Return`). `core/skills/execute-plan/SKILL.md` reescrito (11009 → 10074 B; puntero al contrato con la frase exacta del Handoff, procedimiento, pruebas proporcionales intactas, bloque `bash pendientes-plan` intacto). Pruebas: `tests/context-size/sizes.test.mjs` (suma ≤ 13500 y caso de 13501), `tests/builder-contract.mjs` (movimientos y etiquetas A5), `tests/permissions-contract/structure.test.mjs`, y `tools/verify/{agent-contracts,segment-contract,operating-contract,workspace-contracts}.sh`.
- Presupuesto: builder.md + SKILL.md = 12746 B (≤ 13500, margen 754). La skill queda en 10074 B, por encima de la meta de 9500 B de `reglas.md`; el criterio de A3 es la suma, y ninguna regla se quitó para llegar a ella.
- Reglas con cambio de sentido (frase antigua → frase nueva; texto de referencia en `inventario.md` §2):
  - R09: «Git de lectura limitado a la lista …, con o sin `-C`» → «Reads are limited to `status`, `diff`, `branch --show-current`, `rev-parse --verify --quiet`, and `symbolic-ref`» (en builder.md); se elimina «con o sin `-C`» (C1), la prohibición de `-C`/`-c` queda en R08.
  - R08: «Git con la carpeta como directorio de trabajo; nunca `git -C` ni `git -c`» → «Git there runs with that folder as the working directory; never use `git -C` or `git -c`, which are blocked» (builder.md; antes en la skill). Sentido igual, ubicación distinta.
  - R15-R16: frases separadas (campos editables; excepción de continuidad) → una sola frase en builder.md, «In the plan, change only step checkboxes, their evidence, frontmatter `status`, and the *Evidence* and *Notes* sections; never edit *Scope* or *Acceptance*. Only with `continuity: continuous` may you also update `segment:` and add minor resolved questions to *Decisions*» (C5).
  - R25: «Punto de control por tramo» → «add a checkpoint to *Notes* with files changed, a diff summary, and the check result» (skill; C8).
  - R12-R13: «`done` solo con verificación aprobada» y «no cerrar» quedan en builder.md como «Do not close anything or move the plan to `done/`» y en la skill como «Set `done` only when `verify` passed» (C12). Sentido igual.
  - R52: «Terminar solo con DONE/PAUSED» → «End your turn only with `DONE` or `PAUSED`; never end with a progress report. If work remains within *Scope*, keep going» (C6: la excepción de cierre cita la continuidad).
  - R02 y R81: «doing» y preguntar → solo «Do not ask questions or call other agents» y `kit-nota doing` solo con aprobación (C10).
  - R45: «releer» queda con la frase exacta «rereading relevant material after edits or recovery is allowed» (C4; en la skill).
- Aserciones movidas (archivo: objetivo antiguo → objetivo nuevo):
  - `tests/builder-contract.mjs`: «never edit *Scope* or *Acceptance*» skill → builder.md.
  - `tests/builder-contract.mjs`: «before starting the next step; do not accumulate checkboxes until the end of the segment» builder.md → skill.
  - `tests/builder-contract.mjs`: «do not move on to another story», «checkpoint to *Notes* with files changed», «fails twice for the same cause», «more than twice its measured duration», «when using `PAUSED`, set `status: partial`», «reapproves the plan before resumption» builder.md → skill.
  - `tests/builder-contract.mjs`: «continuity: continuous», «Do not commit between segments», «may you also update `segment:`», «add minor resolved questions to *Decisions*» siguen en builder.md (sin cambio).
  - `tests/builder-contract.mjs`: etiquetas de retorno nuevas en builder.md (`cambios:`, `evidencia:`, `decisiones:`, `revisar:`, `problema:`, `opciones:`, `retomar:`, `(recommended)`, «at most five lines in total»; A5).
  - `tools/verify/agent-contracts.sh` (8p): «1800000» y «session_id» en builder.md → retiradas de `textos_wstdin`; siguen en la skill y en codex-waits.md.
  - `tools/verify/segment-contract.sh`: «Long output» builder.md → «Long output (builds» skill; «For long output» skill → «Long output (builds» skill; «tramo-<n>.md» builder.md → se elimina (la skill ya la exige); «segment: <n>» builder.md → skill (ya exigido en la línea del frontmatter).
  - `tools/verify/operating-contract.sh`: «rereading relevant material after edits or recovery» builder.md → skill.
  - `tests/permissions-contract/structure.test.mjs`: «never use `git -C` or `git -c`, which are blocked» skill → builder.md; descripción de la prueba: «solo la advertencia del skill» → «solo la advertencia del builder».
  - `tools/verify/workspace-contracts.sh`: nueva comprobación negativa: builder.md no contiene «git -C <».
- Verificación del segmento 3: `node --test tests/context-size/sizes.test.mjs` exit 0 (7/7); `./verify` VERIFY OK, Fingerprint d685a3ad85ee. Estado `done` por el criterio de tramo; los tramos 4 y 5 siguen pendientes (8 casillas) para el planner. Sin commit ni push.
Devuelto: omision — tramo 3 — core/agents/builder.md:32, A4 (R52/R77, C6): «End your turn only with `DONE` or `PAUSED`» no cita la excepción decidida: ante aviso de corte queda `in progress` sin `DONE` ni `PAUSED`. Hoy contradice core/skills/execute-plan/SKILL.md:82.
Devuelto: omision — tramo 3 — core/skills/execute-plan/SKILL.md:84, A4 (C2/C3, ver *Assumptions* y *Decisions already taken*): sin motivos nuevos, escribir que dependencia incumplida (L26) → `ambiguous` y duración sin medir o vencida (L30) → `verify`; «`verify` fails in 3 runs» y «**Limit:** 3 final runs» (L77) deben acotarse a su ámbito (sin continuidad / corridas finales) y la 2.ª falla por la misma causa en continuo → `verify`.
Devuelto: defecto — tramo 3 — core/skills/execute-plan/SKILL.md:44, A4 (R35, C9): al quitar *When Done* se perdió «In *Notes*, record minor decisions» fuera de continuidad (el builder sin continuidad no puede editar *Decisions*). Regla: decisiones menores en *Notes*; con continuidad, en *Decisions*.
Devuelto: omision — tramo 3 — core/skills/execute-plan/SKILL.md:40 y :86, A4 (C7, C10; *Assumptions*: se corrige la redacción sin cambiar comportamiento): C7: sin `Comprobación rápida` se usa `verify` como hoy aunque use Docker; la reserva de Docker rige cuando la rápida existe. C10: `doing` solo si la persona ya lo aprobó; nunca preguntar.
Devuelto: defecto — tramo 3 — core/skills/execute-plan/SKILL.md:46-47, A4 (R48, R49, R68): se perdieron «in an `exec` cell», «never every few seconds» y «and captures»; restaurarlos.
- Corregir solo esto, mantener la suma ≤ 13500 B, conservar las aserciones y volver a correr `node --test tests/context-size/sizes.test.mjs`, `node tests/builder-contract.mjs` y `./verify`. Veredicto: RETURNED (1.ª devolución).
- Corrección del tramo 3 (builder, 2026-11-26), solo los cinco `Devuelto:`; ninguna regla quitada, ninguna aserción debilitada, ningún tramo 4 iniciado:
  1. `builder.md` (fin de turno): «End your turn only with `DONE` or `PAUSED`; never end with a progress report, except on a cut-off warning, when the state stays `in progress` (see the skill).»
  2. `SKILL.md` (motivos): dependencia incumplida → `PAUSED motivo=ambiguous`; duración sin medir o vencida y más del doble → `motivo=verify`; «fails twice for the same cause pauses» → `motivo=verify` en continuo; «Limit: 3 final runs» acotado a *Verification*; `verify` acotado a «in continuous mode, … outside it, `verify` fails in 3 runs of *Verification*».
  3. `SKILL.md`: decisiones menores en *Notes*; con continuidad, en *Decisions*.
  4. `SKILL.md`: sin `Comprobación rápida` se usa `verify` aunque use Docker; la reserva de Docker rige cuando la rápida existe. `doing` solo si la persona ya lo aprobó; «never ask for that approval».
  5. `SKILL.md`: restaurados «in an `exec` cell», «never every few seconds» y «and captures» (en «runs all journeys and captures in one pass»).
- Tamaños finales: `builder.md` 2753 B, `SKILL.md` 10514 B, suma 13267 B (≤ 13500). Tramo 4 y 5 siguen sin hacer (casillas pendientes), para el planner.
- Verificación del tramo 3: `node --test tests/context-size/sizes.test.mjs` exit 0 (7/7); `node tests/builder-contract.mjs` exit 0; `./verify` VERIFY OK, Fingerprint 27bafbd82cea (segunda corrida final; la primera falló en 8c por la frase `3 runs`, corregida). Estado `done` por el criterio de tramo. Sin commit ni push.
- Revisión tramo 3 (planner, 2026-11-26): APPROVED tras 1 devolución. Cinco correcciones comprobadas en el texto; límites de commit, push, merge, despliegue, `.env`, Git, Scope y Acceptance presentes en `builder.md`. A3: 2753 + 10514 = 13267 B (margen 233). A5 y aserciones: `builder-contract.mjs` y `sizes.test.mjs` exit 0; `./verify` `Fingerprint: 27bafbd82cea` (`kit-verificado estado` exit 0). Aceptada la reformulación `For long output` → `Long output (builds` en su aserción: misma regla.
- Checkpoint segmento 4 (aviso de proporción de pruebas): archivos cambiados `tools/check/proporcion.mjs` (nuevo, 44 líneas: clasificación igual a `medir-razon.mjs`, umbral 100 líneas y razón > 3, sin divisiones), `tools/check/cambios.mjs` (+`lineasDelRepo`, `lineasSinSeguimiento`, campo `sinSeguimiento`), `scripts/kit-scope.mjs` (import y fila `aviso` al final de `analizar`), `tests/kit-scope/run.mjs` (9 casos A6 sobre repos temporales). Resumen de diff: 170 líneas añadidas y 8 borradas en 3 archivos rastreados, más el archivo nuevo. Check: `node tests/kit-scope/run.mjs`, exit 0, 22/22.
- Decisión menor (no cambia Scope): los archivos sin seguimiento fuera de Scope no se leen ni cuentan; ya dan error «fuera de Scope». Solo se leen rutas que `clasificarRuta` da como `dentro`, con lstat y realpath dentro del repo; binarios y no regulares no cuentan.
- Decisión menor: los archivos rastreados (confirmados, sin confirmar y en el índice) cuentan con `git diff --numstat` contra el merge-base, y las borradas cuentan como producto, igual que en `medir-razon.mjs`.
- Pendientes tras el segmento 4 (contador `pendientes-plan`): 4, todos del segmento 5.
- Sin commit ni push. Los archivos sin seguimiento de la raíz (`.bashrc`, `.gitconfig`, `.idea`, etc.) no se tocaron.
- Checkpoint segmento 5 (documentación y cifras finales, 2026-11-26): archivos cambiados `docs/como-funciona.md` (bullet «Contrato del builder» con presupuesto 13 500 B y 13 267 B al cierre; aviso de `kit-scope` en la línea de contraste de alcance), `tests/README.md` (fila `kit-scope` con aviso A6; fila nueva de `tests/context-size/sizes.test.mjs`, que no existía) y `changes/reducir-contrato-builder/reglas.md` (columna «Después, real» con `wc -c`: builder.md 2753 B, SKILL.md 10514 B, total 13267 B; corregidas las frases de margen y de estimación). Resumen de diff: solo documentos; ningún archivo de producto tocado en este tramo. Checks: `rg` de los dos documentos con coincidencias, `wc -c` coincide con reglas.md, `git diff --check` exit 0, `./verify` VERIFY OK (`Fingerprint: 432ef33facd2`).
- Estado final: la skill quedó en 10514 B, por encima de su meta de 9500 B; el criterio que mide la prueba es la suma (13267 ≤ 13500). Plan `status: done` por verificación final aprobada. Sin commit ni push; no se ejecutó el A/B de `ab-p8.md`.
- Revisión tramo 4 (planner, 2026-11-26): APPROVED. A6: `node tests/kit-scope/run.mjs` 22/22, exit 0; sin seguimiento solo dentro de Scope, `lstat` y `realpath`; código de salida intacto. `kit-scope` sobre este cambio da errores esperados: el plan difiere del borrador versionado en `main` (reescritura previa al Gate 1) y artefactos sin seguimiento del sandbox.
- Revisión tramo 5 y final (planner, 2026-11-26): APPROVED. A1-A3 y A5-A7 cumplen; `./verify` `Fingerprint: 432ef33facd2` (`kit-verificado estado --nivel aceptacion` exit 0); `git diff --check` exit 0; archivos cambiados dentro de Scope. A4 cumple con una salvedad: R08 (directorio de trabajo), R10 (crear solo la rama autorizada) y R13 (el cierre es del planner) siguen mencionadas también en la skill como pasos del procedimiento; se conservan ante la duda (R08 además por una frase exigida por prueba). Pendiente: Gate 2 y cierre.
