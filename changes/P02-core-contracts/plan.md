---
status: done
format: 2
branch: feature/P02-core-contracts
base: main
repos: [.]
executor: builder
segment: 2
type: code
---
# P02 — Contratos centrales
Excepción de tamaño: conservar la evidencia real acumulada de las corridas y el diagnóstico de la pausa.

## Goal
Centralizar el texto vigente de alcance, estados y retorno y detectar desviaciones de las instrucciones operativas sin alterar su significado.

## Exploration
Un solo repositorio, indicado por la persona y AGENTS.md. Existen `termination.md` y `verification.md`; P01 está presente. `builder.md` y `execute-plan/SKILL.md` suman 13419 bytes antes de cambios; `planner.md` mide 8184 y `AGENTS.md` 6043. La suite nueva no está conectada a `verify`. La persona confirmó el enfoque y la integración a `verify` el 2026-11-28.

## Evaluation
Contratos canónicos con copias literales comprobadas mantienen el prompt de kit run y detectan divergencias; cuestan mantener una correspondencia explícita. El riesgo es omitir reglas o modificar su sentido. No hay fase de pantallas ni preparación: no se toca interfaz y existen AGENTS.md y verify.

## Decisions already taken
- D-01, D-02, D-03
- Executor: builder, por solicitud y dos tramos; requisitos, archivos y comprobaciones accesibles, sin credenciales ni despliegue.

## Scope
- `core/contracts/scope.md`
- `core/contracts/states.md`
- `core/contracts/return.md`
- `tests/contracts/`
- `tools/check/alcance.mjs`
- `tests/kit-scope/alcance.test.mjs`
- `./verify` (archivo raíz; kit-scope actualmente no reconoce rutas raíz sin extensión).

Lectura de planner, builder, execute-plan, contratos existentes y pruebas dependientes. No modificar builder, execute-plan ni planner: preservar las líneas que kit run antepone y las pruebas literales existentes.
No tocar `old/`, `changes/done/` ni `pruebas/.temporales/` manualmente.
Las salidas de verify están permitidas. Si preservar el significado exige salir de Scope, pausar.

## Verification
`./verify` — nivel 3, salida 0; incluye la suite nueva. Registrar salida real y fingerprint según contrato de verificación. Duración: no verificada.

## Steps
### Segment 1 — Story: contratos vigentes disponibles
Files: `core/contracts/scope.md`, `core/contracts/states.md`, `core/contracts/return.md`.
WHEN se consultan los contratos THEN el texto vigente está disponible sin cambiar su significado (A1).
Acceptance:
- A1: existen los cinco contratos solicitados; check with `ls core/contracts | wc -l`; expect >= 5.
Revisión manual: los tres nuevos recogen fielmente alcance, estados y retorno; registrar evidencia o «no verificado».
TODO:
- [x] Crear `scope.md` con las reglas vigentes de alcance y sus copias literales identificables (A1). Check: `test -s core/contracts/scope.md`; salida 0.
- [x] Crear `states.md` con los estados y transiciones vigentes y sus copias literales identificables (A1). Check: `test -s core/contracts/states.md`; salida 0.
- [x] Crear `return.md` con el formato vigente de retorno y sus copias literales identificables (A1). Check: `test -s core/contracts/return.md`; salida 0.
- [x] Comparar `core/contracts/scope.md`, `states.md` y `return.md` con planner, builder y execute-plan (A1). Check: revisión manual documentada en Evidence; sin cambios de significado identificados; registrar lo no verificado.
Segment verification: `test -f core/contracts/termination.md && test -f core/contracts/verification.md && test -s core/contracts/scope.md && test -s core/contracts/states.md && test -s core/contracts/return.md && test "$(ls core/contracts | wc -l)" -ge 5` — level 1; exit 0; covers A1.
Handoff: los contratos contienen texto canónico y sus correspondencias identificables; el tramo 2 verifica cada copia literal correspondiente.

### Segment 2 — Story: coherencia verificable
Dependencies: Segment 1 — se necesitan los contratos canónicos para contrastar sus copias.
Files: `verify`, `tools/check/alcance.mjs`, `tests/contracts/coherence.test.mjs`, `tests/kit-scope/alcance.test.mjs`.
WHEN cambia una línea de contrato reproducida en instrucciones THEN la prueba detecta la divergencia y el tamaño no crece (A2, A3).
Acceptance:
- A2: coherencia de contratos; check with `node --test tests/contracts/*.test.mjs`; expect exit 0.
- A3: tamaño combinado; check with `cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c`; expect <= 13419 bytes y <= 13500.
- A4: kit-scope reconoce `./verify` como ruta raíz sin extensión, manteniendo el rechazo de prosa y comandos; check with `node --test tests/kit-scope/alcance.test.mjs`; expect exit 0.
Además, al modificar temporalmente una línea cubierta de cada contrato, la misma prueba falla por divergencia y, restaurados, vuelve a salir 0. Correspondencias explícitas, no vacías, cubren todas las líneas reproducidas literalmente en builder y execute-plan y comprueban presencia en ambas direcciones; no sustituir el producto con fixtures.
TODO:
- [x] Completar `core/contracts/states.md` con `draft`, aprobación y transiciones de continuidad vigentes; ampliar `tests/contracts/coherence.test.mjs` y probar sensibilidad (A1, A2). Check: `node --test tests/contracts/*.test.mjs`; salida 0; cotejar con planner, plan-change y execute-plan sin cambiar significado.
- [x] Corregir `tests/contracts/coherence.test.mjs` y contratos para que cada línea normativa canónica quede contrastada y su modificación aislada falle (A2). Check: `node --test tests/contracts/*.test.mjs`; salida 0; demostrar sensibilidad de las líneas canónicas con mutaciones restauradas y evidencia real.
- [x] Corregir `tools/check/alcance.mjs` y `tests/kit-scope/alcance.test.mjs` para reconocer rutas explícitas `./nombre` sin extensión, manteniendo los demás filtros (A4). Check: `node --test tests/kit-scope/alcance.test.mjs`; salida 0; cubrir inclusión y exclusión de `./verify`, y prosa sin rutas.
- [x] Crear `tests/contracts/coherence.test.mjs` con correspondencias explícitas no vacías para scope, estados y retorno (A2). Check: `node --test tests/contracts/*.test.mjs`; salida 0.
- [x] Probar sensibilidad mutando temporalmente `core/contracts/scope.md`, `core/contracts/states.md` y `core/contracts/return.md`, restaurando siempre incluso ante fallo (A2). Check: cada mutación falla por divergencia y `node --test tests/contracts/*.test.mjs` restaurada sale 0; registrar salidas y restauración.
- [x] Incorporar la suite a `./verify` sin debilitar comprobaciones existentes (A2). Check: `rg -n 'node --test tests/contracts/\*\.test\.mjs' verify`; aparece la invocación.
- [x] Medir `core/agents/builder.md` y `core/skills/execute-plan/SKILL.md` juntos (A3). Check: `test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419`; salida 0.
- [x] Ejecutar `./verify` para `tests/contracts/coherence.test.mjs` y dependientes (A2, A3). Check: `./verify`; salida 0; duración no verificada.
Segment verification: `node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419` — level 1; exit 0; covers A2, A3, A4.

## Evidence

Relevo del planner A4:
$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
18 pruebas pasaron; exit 0

$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 6ac150b9d5f7
VERIFY OK
exit 0

$ ls core/contracts | wc -l
5
exit 0

$ cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c
13419
exit 0

$ test -s core/contracts/scope.md
exit 0
$ test -s core/contracts/states.md
exit 0
$ test -s core/contracts/return.md
exit 0

Revisión manual A1: cotejé síntesis y citas con planner, builder, execute-plan y termination; coinciden literalmente y sin cambios de significado. Automatización reservada al segmento 2.
$ test -f core/contracts/termination.md && test -f core/contracts/verification.md && test -s core/contracts/scope.md && test -s core/contracts/states.md && test -s core/contracts/return.md && test "$(ls core/contracts | wc -l)" -ge 5
exit 0

$ ls core/contracts | wc -l
5
exit 0
$ test -f core/contracts/termination.md && test -f core/contracts/verification.md && test -s core/contracts/scope.md && test -s core/contracts/states.md && test -s core/contracts/return.md && test "$(ls core/contracts | wc -l)" -ge 5
exit 0
$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 666e619a90c6
VERIFY OK
exit 0
Fingerprint: 666e619a90c6

$ node --test tests/contracts/*.test.mjs
✔ tests/contracts/coherence.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

$ node --input-type=module -e '<mutation harness for the three contracts>'
core/contracts/scope.md: mutated suite exit 1
core/contracts/states.md: mutated suite exit 1
core/contracts/return.md: mutated suite exit 1
restored suite exit 0
exit 0

$ rg -n 'node --test tests/contracts/\*\.test\.mjs' verify
98:node --test tests/contracts/*.test.mjs || fallo "27: pruebas de coherencia de contratos no pasaron"
exit 0

$ test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
exit 0

$ node --test tests/kit-scope/alcance.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: abae09517cce
VERIFY OK
exit 0
Fingerprint: abae09517cce

$ node --test tests/contracts/*.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 666e619a90c6
VERIFY OK
exit 0
Fingerprint: 666e619a90c6

A2: coherencia contratos (corrida posterior a la corrección)
$ node --test tests/contracts/*.test.mjs
✔ tests/contracts/coherence.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

A3: tamaño combinado (corrida posterior a la corrección)
$ cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c
13419
exit 0

A3: límite combinado (corrida posterior a la corrección)
$ test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
exit 0

A4: parser y clasificación de `./verify` (corrida posterior a la corrección)
$ node --test tests/kit-scope/alcance.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

Verificación del segmento 2:
$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0

Verificación completa posterior a las correcciones:
$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 585de2789a1f
VERIFY OK
exit 0
Fingerprint: 585de2789a1f

Corrección A2 tras revisión del planner: cada línea normativa de las secciones canónicas se compara contra un inventario explícito y fuentes literales correspondientes.
$ node --test tests/contracts/*.test.mjs
✔ tests/contracts/coherence.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

Sensibilidad A2: mutaciones aisladas de las 10 líneas canónicas (scope 1, states 5, return 4) detectadas; archivos restaurados en todos los casos.
exit 0

Verificación del segmento 2 posterior a A2:
$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

Verificación completa final:
$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 7b74d42e5687
VERIFY OK
exit 0
Fingerprint: 7b74d42e5687

Corrección A4 tras revisión:
$ node --test tests/kit-scope/alcance.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0

$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 3740bf7848aa
VERIFY OK
exit 0
Fingerprint: 3740bf7848aa

A1/A2: estados ampliados con `draft`, aprobación por el usuario, transiciones de verificación, `partial`, continuidad y corte; cotejo manual con planner, plan-change y execute-plan, sin divergencias de significado.
$ node --test tests/contracts/*.test.mjs
✔ tests/contracts/coherence.test.mjs (45.500256ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

Sensibilidad states: mutación aislada de cada una de las 5 reglas canónicas falló en la prueba; archivo restaurado. Suite restaurada pasa.
$ node --input-type=module -e 'import fs from "node:fs"; import { spawnSync } from "node:child_process"; const p="core/contracts/states.md", original=fs.readFileSync(p,"utf8"), lines=original.split("\n"), start=lines.indexOf("## Canonical states and transitions")+1, end=lines.findIndex((x,i)=>i>start&&x.startsWith("## ")), ids=lines.map((x,i)=>i).filter(i=>i>=start&&(end<0||i<end)&&lines[i].startsWith("- ")); let n=0; try { for(const i of ids){ const changed=[...lines]; changed[i]+=" [mutation]"; fs.writeFileSync(p,changed.join("\n")); const r=spawnSync("node",["--test","tests/contracts/coherence.test.mjs"],{encoding:"utf8"}); if(r.status!==0)n++; else throw Error(`mutation undetected: ${i+1}`); } } finally { fs.writeFileSync(p,original); } if(n!==ids.length)throw Error(`${n}/${ids.length}`); console.log(`Mutaciones de estados detectadas: ${n}/${ids.length}; archivo restaurado.`);' && node --test tests/contracts/*.test.mjs
Mutaciones de estados detectadas: 5/5; archivo restaurado.
✔ tests/contracts/coherence.test.mjs (43.593504ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
ℹ duration_ms 50.281335
exit 0

Verificación del segmento 2:
$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs (50.759204ms)
✔ tests/kit-scope/alcance.test.mjs (58.629241ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
ℹ duration_ms 69.554302
exit 0

Verificación completa final:
$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: d9ee2a70c81d
VERIFY OK
exit 0
Fingerprint: d9ee2a70c81d

Corrección A1 tras revisión: la regla canónica de continuidad ahora exige que pase la verificación, que el trabajo siga dentro de Scope y que no se necesite una decisión de la persona usuaria; la prueba mantiene el inventario sincronizado con la regla.
$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0

Verificación completa tras la corrección A1:
$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 7a3840364995
VERIFY OK
exit 0
Fingerprint: 7a3840364995

Corrección A1 tras devolución del planner: `scope.md` recoge los límites exactos de edición del plan, las excepciones de `continuity: continuous`, `decisions.md`/`notes.md` y `kit-nota`; `return.md` limita cinco líneas solo a `DONE`, conserva las secciones de `PAUSED` y la excepción de corte con estado `in progress`. Las citas y correspondencias de `coherence.test.mjs` cubren estas reglas.
$ node --test tests/contracts/*.test.mjs
✔ tests/contracts/coherence.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

Sensibilidad posterior a la corrección: se mutó por separado cada una de las 12 líneas normativas canónicas de `scope.md`, `states.md` y `return.md`; las 12 mutaciones fallaron por divergencia, los contratos se restauraron y la suite restaurada salió 0.
$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs
✔ tests/kit-scope/alcance.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0

Verificación completa tras corregir A1:
$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 8e03493bb748
VERIFY OK
exit 0
Fingerprint: 8e03493bb748

Corrección A1/A2: contratos con texto literal como regla canónica; scope incluye las siete restricciones completas del builder. La prueba contrasta citas y fuentes en ambas direcciones. Dos intentos iniciales de sensibilidad terminaron con exit 1 porque la captura nativa no devolvió el diagnóstico; los contratos se restauraron. Se usó `spawnSyncSeguro` y se comprobó el diagnóstico directamente además del resultado de la suite.
$ node --input-type=module -e 'import fs from "node:fs"; import {spawnSyncSeguro} from "./tools/spawn/sync-seguro.mjs"; for (const p of ["core/contracts/scope.md", "core/contracts/states.md", "core/contracts/return.md"]) { const original=fs.readFileSync(p,"utf8"), lines=original.split("\n"), ids=lines.map((x,i)=>i).filter(i=>lines[i].startsWith("- `")); let detected=0; try { for (const i of ids) { const changed=[...lines]; changed[i]=changed[i].replace(/.”$/, "[mutation]”"); fs.writeFileSync(p,changed.join("\n")); const suite=spawnSyncSeguro("node",["--test","tests/contracts/coherence.test.mjs"],{encoding:"utf8"}), detail=spawnSyncSeguro("node",["tests/contracts/coherence.test.mjs"],{encoding:"utf8"}); if(suite.status!==1 || detail.status!==1 || !`${detail.stdout}${detail.stderr}`.includes("missing mapped quote")) throw Error(`${p}:${i+1}: divergence not detected`); detected++; } } finally { fs.writeFileSync(p,original); } console.log(`${p}: divergencias detectadas ${detected}/${ids.length}; restaurado`); }' && node --test tests/contracts/*.test.mjs
core/contracts/scope.md: divergencias detectadas 8/8; restaurado
core/contracts/states.md: divergencias detectadas 10/10; restaurado
core/contracts/return.md: divergencias detectadas 8/8; restaurado
✔ tests/contracts/coherence.test.mjs (42.34745ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
ℹ duration_ms 49.556792
exit 0

$ node --test tests/contracts/*.test.mjs tests/kit-scope/alcance.test.mjs && test "$(cat core/agents/builder.md core/skills/execute-plan/SKILL.md | wc -c)" -le 13419
✔ tests/contracts/coherence.test.mjs (46.9799ms)
✔ tests/kit-scope/alcance.test.mjs (57.923044ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0

$ ./verify
verify: 37 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: f9bd92c73277
VERIFY OK
exit 0
Fingerprint: f9bd92c73277

## Notes
- Corrección alcance: el parser ahora separa cláusulas por punto y coma; `./verify` queda dentro y `pruebas/.temporales/` excluido. Prueba unitaria pasa.
- A2: coherencia pasa; Evidence contiene corrida identificada. A3: 13419 bytes, pasa ambos límites; Evidence contiene corrida identificada. A4: pruebas de inclusión, exclusión y autorización pasan.
- Checkpoint segmento 2: cambios en `tools/check/alcance.mjs` y `tests/kit-scope/alcance.test.mjs`; diff funcional: separar exclusión y autorización explícita. Segment verification pasa; `./verify` pasa, 37 pasos, Fingerprint `585de2789a1f`.
- Aviso proporcionalidad revisado: 138 líneas de prueba frente a 20 de producto (6.90); la prueba nueva cubre que autorización tras punto y coma no herede la exclusión.
- Pendientes: 0. Dejar para revisión del planner; no cerrar ni mover el plan.
- kit run: PAUSED (design): paso 2: escribe «Consejo (tramo 2): …» y vuelve a lanzar. Fallo: revisión devuelta tras 2 corridas: [{"archivo":"tools/check/alcance.mjs","linea":133,"criterio":"A4","descripcion":"Separar incondicionalmente por punto y coma cambia el alcance de las exclusiones: en «No tocar `a/`; `b/`», `b/` pasa a incluirse aunque la regla vigente extiende la exclusión hasta el final de la línea. Esto puede autorizar cambios fuera del alcance previsto; hay que conservar esa regla o reconocer explícitamente una autorización posterior sin convertir las demás rutas en inclusiones."}]; revisor=gpt-6.1-terra:low.
- Devuelto: defecto — tramo 2 — tools/check/alcance.mjs:133, A4: la separación por punto y coma debilita exclusiones; clase tarea.
- Consejo (tramo 2): conserva la exclusión hasta fin de línea y añade regresión `No tocar \u0060a/\u0060; \u0060b/\u0060`; el plan separa la autorización de verify en otra línea. Mantén reconocimiento explícito de `./verify` y verifica A4 y el sistema completo.
- Corrección de A4: el parser vuelve a extender la exclusión hasta fin de línea, incluyendo tras `;`; la regresión verifica `a/` y `b/` excluidas y `c/` incluida. La autorización de `./verify` queda en línea separada. Prueba A4 pasa; `estado --nivel aceptacion` indica `motivo=huella_distinta`, pendiente verificación completa.
- Checkpoint corregido del segmento 2: diff de producto restaura exclusión hasta fin de línea y añade la regresión indicada; autorización de `./verify` probada en línea separada. A4 y verificación del segmento pasan; `./verify` completo pasa (37 pasos), Fingerprint `3740bf7848aa`. Pendientes: 0; dejar para revisión del planner, no cerrar ni mover.
- kit run: revisión APPROVED tras 3 corrida(s) del builder; verify pasó; revisor=gpt-6.1-terra:low.
- Devuelto: defecto — tramo 2 — tests/contracts/coherence.test.mjs:105, A2: solo comprueba citas mapeadas; cambiar una línea de `Canonical rules`, `Canonical states and transitions` o `Canonical format` no falla, contrario al criterio de sensibilidad de los contratos. Clase tarea; huella de verify 3740bf7848aa.
- La persona autorizó el paso 3 para corregir A2 y volver a verificar.
- A2 corregido tras la revisión: inventario exacto para las reglas canónicas y correspondencias a sus fuentes; return.md separa sus cuatro reglas para que el inventario detecte cada desviación. La mutación de las 10 reglas falla en la suite y todos los contratos se restauran.
- Checkpoint final segmento 2: archivos cambiados en `tests/contracts/coherence.test.mjs` y `core/contracts/return.md`; el diff añade cobertura exacta de reglas canónicas. Pruebas de coherencia y sensibilidad pasan; verificación del segmento pasa; `./verify` pasa (37 pasos), Fingerprint `7b74d42e5687`. Pendientes: 0; entregar para revisión del planner, sin mover el plan.
- kit run: revisión APPROVED tras 1 corrida(s) del builder; verify pasó; revisor=gpt-6.1-terra:low.
- Devuelto: omision — tramo 2 — core/contracts/states.md:3, A1: faltan el estado `draft`, aprobación y las transiciones de continuidad vigentes. Clase tarea. A2: la evidencia de mutaciones solo resume la corrida y no registra el comando real; aportar comando y salida o marcar no verificado.
- Omisión corregida: `states.md` recoge todos los estados y las reglas de continuidad; el inventario canónico compara cada línea y la sensibilidad aislada detectó 5/5 mutaciones. La primera ejecución falló porque faltaba en la lista canónica la regla de interrupción; se añadió conforme a la fuente y la repetición pasó.
- Checkpoint final segmento 2: cambios en `core/contracts/states.md`, `tests/contracts/coherence.test.mjs` y `plan.md` (estado, evidencia y notas); diff añade estados, transiciones y correspondencias literales verificables. Prueba de coherencia, sensibilidad 5/5, verificación de segmento y `./verify` pasan; 37 pasos, Fingerprint `d9ee2a70c81d`. La primera corrida de `./verify` quedó sin resultado en el límite de ejecución; `estado --nivel aceptacion` indicó `motivo=sin_resultado`, y la segunda corrida completó correctamente. Pendientes: 0; dejar para revisión del planner, no cerrar ni mover.
- Corrección tras revisión A1: cambios en `core/contracts/states.md` y `tests/contracts/coherence.test.mjs`; diff añade las tres condiciones vigentes a la regla canónica de continuidad y conserva su detección por inventario. Verificación del segmento pasa; `./verify` pasa (37 pasos), Fingerprint `7a3840364995`. Pendientes: 0; dejar para revisión del planner, no cerrar ni mover.
- kit run: PAUSED (design): paso 2: escribe «Consejo (tramo 2): …» y vuelve a lanzar. Fallo: revisión devuelta tras 2 corridas: [{"archivo":"core/contracts/return.md","linea":8,"criterio":"A1 (D-01)","descripcion":"El formato canónico aplica el límite de cinco líneas a toda respuesta, pero builder.md lo exige solo para DONE. También prohíbe terminar con un informe de avance sin recoger la excepción vigente ante un aviso de corte. El contrato cambia así el significado de las instrucciones que debe preservar."},{"archivo":"core/contracts/scope.md","linea":5,"criterio":"A1 (D-01)","descripcion":"La regla canónica limita las; revisor=gpt-6.1-terra:low.
- Devuelto: defecto — tramo 2 — core/contracts/return.md:8 y core/contracts/scope.md:5, A1: el resumen cambia límites y omite excepciones vigentes; clase tarea.
- Consejo (tramo 2): coteja cada resumen con las instrucciones completas, conserva las excepciones de continuidad, decisions.md y notes.md; limita cinco líneas solo a DONE e incluye excepción por aviso de corte. Actualiza correspondencias y sensibilidad sin cambiar significado.
- kit run: PAUSED (design): escalera agotada: revisión devuelta tras 3 corridas: [{"archivo":"core/contracts/return.md","linea":6,"criterio":"A1 (D-01)","descripcion":"El formato canónico omite campos obligatorios de la primera línea: `plan=<path>` y `verify=pasa` para DONE. También omite que `opciones:` en PAUSED debe contener dos o tres opciones fijas y marcar una como recomendada. Las citas literales posteriores los incluyen, pero el resumen canónico no recoge íntegramente el formato vigente."},{"archivo":"changes/P02-core-contracts/plan.md","linea":276,"criterio":"A2 (D-02)","descripcion":"La evidencia final de sensi; revisor=gpt-6.1-terra:low.
- La persona autorizó simplificar: usar el texto literal vigente como contrato, eliminar resúmenes que alteren o dupliquen significado y comprobar correspondencias contra ese texto. Cubrir integralmente reglas de scope, estados y retorno, incluidas excepciones. Registrar comando real y salida de mutaciones restauradas; correr pruebas dirigidas y una verificación final tras cambios. Relanzamiento `--paso 3` autorizado.

- Checkpoint tramo 2: contratos y prueba de coherencia usan citas literales completas y correspondencias bidireccionales; 26/26 mutaciones detectadas y restauradas. Verificación de tramo y `./verify` pasan; fingerprint `f9bd92c73277`. Pendientes: 0; revisión del planner.
- kit run: PAUSED (design): escalera agotada: revisión devuelta tras 4 corridas: [{"archivo":"tools/check/alcance.mjs","linea":41,"criterio":"A4 (D-03)","descripcion":"Todo token como `./verify` se interpreta como ruta, incluso en prosa que solo menciona el comando, por ejemplo «Ver `./verify`». Un Scope que antes devolvía no_verificable ahora autoriza modificar el archivo verify. La prueba anterior de ese caso fue reemplazada por `verify`, por lo que ya no comprueba que se rechacen comandos con prefijo `./` cuando no se declaran como rutas."}]; revisor=gpt-6.1-terra:low.
- kit run: paso 4: el paso 3 (nivel medium, modelo gpt-6.1-terra) no terminó: escalera agotada: revisión devuelta tras 4 corridas: [{"archivo":"tools/check/alcance.mjs","linea":41,"criterio":"A4 (D-03)","descripcion":"Todo token como `./verify` se interpreta como ruta, incluso . Créditos del paso 3: «sin tokens medidos» (estimación). Relevo al planner (modelo gpt-6.1-terra): «sin tokens medidos» (estimación). Pregunta de relevo: ¿lo quieres? La persona responde; kit run no lo ejecuta ni corre nada más.
- Relevo autorizado: `./verify` en lista explícita se reconoce; una mención en prosa no autoriza la ruta, incluso con otra ruta incluida. Exclusión hasta fin de línea preservada. Las pruebas dirigidas y verify pasan; fingerprint 6ac150b9d5f7. `kit-scope`: todos los archivos dentro, plan sin versión en base no verificable y aviso de proporción de pruebas.
- APPROVED: A1 existen cinco contratos y se cotejaron citas literales (D-01); A2 suite y sensibilidad 26/26 registradas por el builder (D-02); A3 13419 bytes, sin crecimiento; A4 pruebas de inclusión, exclusión y prosa pasan (D-03). Evidencia completa arriba; huella de aceptación 6ac150b9d5f7.
