---
status: done
format: 2
branch: chore/P00-bootstrap
base: main
repos: [.]
executor: builder
segment: 3
continuity: continuous
type: code
---
# P00-bootstrap

Excepción de tamaño: conserva la evidencia de la línea base fallida y de la verificación externa posterior para reanudar sin repetir la medición.

## Goal
Preparar el autodesarrollo del kit con una línea base, un mapa de destino, margen en los archivos limitados y documentación vigente.

## Exploration
- Repo único, base `main`; D-01. `git status --short` estaba limpio antes del plan.
- La persona autorizó las escrituras normales de `./verify` en `pruebas/.temporales/verify.log` y `resultado.json` (D-03).
- Responsables (D-02): raíz y AGENTS P00; runtime P01; core/contracts P02; core/agents P03; core/skills P04; guardrails P05; observability P06; memory P07; adapters P08a Claude Code, P08b Codex, P08c Pi; templates P09; evals P10; docs P11; tests P12; scripts P13. `harness/` es destino propuesto, no carpeta existente presumida.
- `wc -c`: planner 8191, AGENTS 6039, builder + execute-plan 13419 bytes antes de editar. `structure.md` describe compatibilidad obsoleta. No se leyeron históricos protegidos.

## Evaluation
D-04. Beneficio: base y mapa verificables; costo: suites completas; riesgo: cambiar significado o debilitar pruebas al mover instrucciones. Mantener contratos y verificar sus consumidores. Se omiten diseño de pantallas y preparación del proyecto: no hay UI nueva y ya existen AGENTS y verify.

## Validation
Enfoque validado; criterios pendientes de Puerta 1.

## Decisions already taken
- D-01, D-02, D-03, D-04, D-05
- Executor: builder, por solicitud expresa y tres tramos; requisitos y rutas accesibles, comprobaciones y errores definidos, sin credenciales ni despliegue.

## Scope
Permitidos: `docs/decisions/estructura-objetivo.md`, `core/agents/planner.md`, `AGENTS.md`, referencias en `core/references/planner/`, documentación en `docs/`, `TODO.md`, comprobaciones existentes en `tools/verify/` y `tests/` solo si una frase exigida se traslada, y registros de este plan. No modificar `verify` ni debilitar pruebas. No mover ni renombrar carpetas o archivos de producto; no tocar `old/`, `changes/done/` ni `pruebas/.temporales/`, salvo D-03. No instalar, crear tag, commit, push, PR ni desplegar. La persona crea el tag `harness-base`.

## Verification
`node --test tests/acceptance/*.test.mjs && ./verify` — aceptación final fuera del sandbox; comparar con la referencia externa verde y registrar también la diferencia con la línea base original de A1 (D-05). Si la primera orden falla, registrar que `./verify` no se ejecutó y no atribuirle resultado. La línea base solo ejecuta `./verify` una vez: no afirmar comparación separada de aceptación si no es deducible de su salida; registrar «no verificado».

## Stop conditions
Revisión: fin de historia. Continuar los tres tramos de la misma historia; detenerse ante ambigüedad, cambio de alcance, fallo de verify o alteración de pruebas de aceptación fuera de Scope. No reparar fallos anteriores ajenos a este pedido. Antes de cada edición de archivos con tope medir con `wc -c`; si se mueven frases literales exigidas por pruebas, trasladar también sus comprobaciones sin debilitar sus casos negativos.

## Steps
### Segment 1 — Story: base para el autodesarrollo
Files: `docs/decisions/estructura-objetivo.md`.
WHEN se mide la base y se consulta el mapa THEN quedan registrados el resultado y las carpetas de destino (A1, A2).
Acceptance:
- A1: `notes.md` conserva resultado, paso fallido, código de salida y duración de la línea base original; si la duración no se capturó, indicar «no verificado»; check `rg -n 'exit|salida' changes/P00-bootstrap/notes.md`; expect al menos una coincidencia.
- A2: mapa de al menos 13 filas con carpeta, estado, ubicación actual y prompt responsable; check `rg -c '^\| \x60' docs/decisions/estructura-objetivo.md`; expect al menos 13 filas. Incluir `harness/`, AGENTS, core/contracts, core/agents, core/skills, runtime, guardrails, observability, memory, adapters, templates, evals, docs, tests y scripts; incluir los tres prompts de adapters.
TODO:
- [x] Línea base `./verify` ya ejecutada en sandbox: exit 1, paso 6b; duración total no verificada (A1). Check: `rg -n 'exit|salida' changes/P00-bootstrap/notes.md`; al menos una coincidencia. No repetirla.
- [x] Crear `docs/decisions/estructura-objetivo.md` contrastando rutas reales y tabla D-02, sin leer históricos protegidos (A2). Check: `rg -c '^\| \x60' docs/decisions/estructura-objetivo.md`; salida ≥ 13; revisar estado, ubicación y responsable de cada fila.
Segment verification: `rg -q 'exit|salida' changes/P00-bootstrap/notes.md && test "$(rg -c '^\| \x60' docs/decisions/estructura-objetivo.md)" -ge 13` — level 1; exit 0; covers A1, A2.
Handoff: conservar la línea de resultado en notes durante todo el plan; ejemplo: `exit 0; duración 120 s; paso fallido: ninguno`.

### Segment 2 — Story: base para el autodesarrollo
Files: `core/agents/planner.md`, `AGENTS.md`, `core/references/planner/planning.md` (pruebas asociadas solo si son necesarias).
WHEN se consultan las instrucciones THEN conservan sus reglas y margen (A3).
Acceptance:
- A3: planner ≤ 7400 bytes y AGENTS ≤ 5500 bytes; check `wc -c core/agents/planner.md AGENTS.md`; expect cada cifra bajo su límite.
TODO:
- [x] Medir antes de editar `wc -c core/agents/planner.md AGENTS.md core/agents/builder.md core/skills/execute-plan/SKILL.md` (A3). Check: cuatro tamaños registrados en Evidence.
- [x] Mover detalle de `core/agents/planner.md` a `core/references/planner/planning.md`, manteniendo su activación y significado; trasladar comprobaciones literales necesarias junto con sus controles negativos (A3). Check: `node --test tests/context-size/*.test.mjs`; exit 0.
- [x] Reducir AGENTS trasladando detalle a documentación existente y corregir referencias inexistentes identificadas, sin eliminar restricciones (A3). Check: `wc -c core/agents/planner.md AGENTS.md`; límites de A3 cumplidos.
Segment verification: `test "$(wc -c < core/agents/planner.md)" -le 7400 && test "$(wc -c < AGENTS.md)" -le 5500` — level 1; exit 0; covers A3.
Handoff: preservar en Evidence los tamaños antes y después y las pruebas concretas de frases trasladadas.

### Segment 3 — Story: base para el autodesarrollo
Files: `docs/decisions/structure.md`, `TODO.md`, `docs/como-funciona.md`.
WHEN se consultan la estructura y las reglas THEN describen rutas existentes y autodesarrollo (A4, A5).
Acceptance:
- A4: `structure.md` no menciona rutas inexistentes y enlaza el mapa; check `rg -n 'core-compatibility|nucleo/' docs/decisions/structure.md`; expect exit 1 sin coincidencias, y revisar las demás rutas citadas.
- A5: aceptación y verify pasan fuera del sandbox; check `node --test tests/acceptance/*.test.mjs && ./verify`; expect exit 0, como la referencia externa verde; registrar diferencia con la línea base original y declarar la comparación de aceptación no verificable cuando corresponda.
TODO:
- [x] Corregir `structure.md`, eliminando compatibilidades inexistentes y apuntando al mapa (A4). Check: `rg -n 'core-compatibility|nucleo/' docs/decisions/structure.md`; exit 1; revisar demás rutas.
- [x] Corregir en `./TODO.md` rutas obsoletas (A4). Check: `rg -n 'cambios/deny-endurecido' TODO.md`; exit 1.
- [x] Añadir a `docs/como-funciona.md` «Autodesarrollo del kit»: reinstalar solo entre prompts, tag `harness-base` y volver al tag si un prompt degrada al planner (A5). Check: `rg -n 'Autodesarrollo del kit|harness-base' docs/como-funciona.md`; ambas expresiones presentes.
- [x] Ejecutar aceptación y verify final fuera del sandbox (duración: no medida), registrar códigos y comparar con la referencia externa y la base original (A5). Check: `node --test tests/acceptance/*.test.mjs && ./verify`; exit 0 como la referencia externa; registrar la diferencia con la base original.
Segment verification: `git diff --check && ! rg -n 'core-compatibility|nucleo/' docs/decisions/structure.md && rg -q 'Autodesarrollo del kit' docs/como-funciona.md && rg -q 'harness-base' docs/como-funciona.md` — level 1; exit 0; covers A4, A5 (documentación); aceptación completa según Verification.
Handoff: reportar los resultados comparables, las partes no verificadas y los bytes antes y después para Puerta 2.

## Evidence

$ rg -n 'exit|salida' changes/P00-bootstrap/notes.md && rg -c '^\| \x60' docs/decisions/estructura-objetivo.md && rg -q 'exit|salida' changes/P00-bootstrap/notes.md && test "$(rg -c '^\| \x60' docs/decisions/estructura-objetivo.md)" -ge 13
4:- Línea base sandbox: `./verify` exit 1, paso 6b; duración no verificada.
14
exit 0

- Persona usuaria informó ejecución externa de `$ ./verify`: `verify: 36 pasos; detalle en pruebas/.temporales/verify.log`; `resultado registrado: Fingerprint: e3b0c44298fc`; `VERIFY OK`; exit 0. Duración no informada.

$ ./verify
== 6b. matriz negativa de permisos v2 con archivos y reglas ficticios ==
✖ tests/permissions-v2.test.mjs (3944.749137ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3952.440196
FALLO: matriz de permisos v2 falló
resultado registrado: Fingerprint: e3b0c44298fc
exit 1

## Notes
- Segment 3 checkpoint: `structure.md` enlaza el mapa y ya no describe compatibilidad obsoleta; rutas citadas comprobadas; `TODO.md` sin la referencia vieja; entrada de autodesarrollo con tres reglas. `git diff --check` y verificación documental exit 0.
- Segment 2 checkpoint: `core/agents/planner.md` quedó en 7398 bytes (−793); el detalle de Context y Stop and answer vive en `core/references/planner/planning.md`. `AGENTS.md` quedó en 5500 bytes (−539), con límites de deny referidos a `docs/reglas-deny.md` y restricciones de históricos preservadas. `node --test tests/context-size/*.test.mjs` (10) y `node tests/builder-contract.mjs` pasaron; tamaños y Segment verification exit 0. No se movieron frases literales exigidas por pruebas. `docs/decisions/estructura-objetivo.md`; mapa con 14 destinos (14 filas), rutas revisadas en el checkout. Comprobación A1/A2 y `Segment verification` exit 0.
- Segmento 1 detenido antes de editar producto: la línea base de `./verify` falló en 6b (`tests/permissions-v2.test.mjs`). No reparar fallos ajenos según el plan.
- Retomar: requiere que planner revise y reapruebe; la línea base solo podía ejecutarse una vez. Se observó la ejecución durante al menos 30,2 s, pero la duración final no quedó capturada.
- kit run: PAUSED (verify): paso 2: escribe «Consejo (tramo 1): …» y vuelve a lanzar. Fallo: PAUSED: plan=changes/P00-bootstrap/plan.md; segment=1; motivo=verify; hecho=0/9; siguiente=Ejecutar `./verify` una sola vez antes de editar producto; no_intentado=ya se ejecutó una vez y falló en 6b; repetirla contradice el plan.; revisor=gpt-6.1-terra:low.
- Diagnóstico posterior: `node --test tests/permissions-v2.test.mjs` pasó 5/5, exit 0 fuera del builder; no reproduce ni explica el fallo de la línea base. La huella del árbol sigue siendo la misma y el estado de verify permanece fallido.
- Diagnóstico en `codex exec --sandbox workspace-write`: `node --test tests/permissions-v2.test.mjs` falla; `node tests/permissions-v2.test.mjs` identifica Aserción en línea 44: `resolver` devuelve salida vacía en vez de `agregado:sandbox.allowUnsandboxedCommands:false`; 4/5 casos pasan. En el entorno externo la suite pasa 5/5. Causa raíz y corrección: no verificadas.
- Investigación workspace-write: un hijo mínimo con console.log/console.error y `spawnSyncSeguro` devuelve status 0 sin error, pero stdout y stderr vacíos; `resolver` también actualiza el fixture y devuelve salida vacía. La causa de la captura y su corrección siguen sin verificar.

$ node --test tests/acceptance/*.test.mjs && ./verify
✔ builder-contract: la suite del contrato del builder pasa (99.350527ms)
✔ kit-run: la suite de kit run pasa (45148.245291ms)
✔ uso: la suite del medidor de costos pasa (2389.924026ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ duration_ms 45214.839966
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: cda10834ba3e
VERIFY OK
exit 0

- Comparación A5: la aceptación pasa (3/3) y `./verify` termina con exit 0, 36 pasos, Fingerprint `cda10834ba3e`, igual que la referencia externa en resultado y cantidad de pasos; la huella es distinta (`e3b0c44298fc`) porque esta ejecución cubre el árbol editado de P00. La base original de A1 fue exit 1 en 6b. Las duraciones de las corridas externas no se informaron; duración de esta corrida combinada: no medida por el comando.
- La captura inicial de esta comprobación combinada no dejó resultado recuperable (`kit-verificado`: `sin_resultado`); se ejecutó de nuevo sin cambios en el árbol para obtener evidencia completa.

$ node --test tests/acceptance/*.test.mjs && ./verify
✔ builder-contract: la suite del contrato del builder pasa (99.393245ms)
✔ kit-run: la suite de kit run pasa (43950.90097ms)
✔ uso: la suite del medidor de costos pasa (2241.720421ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ duration_ms 44007.556569
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 679cda12b859
VERIFY OK
exit 0

- Corrección de omisiones devueltas: `notes.md` conserva exit 1, paso 6b y duración no verificada; el mapa incluye árbol explícito `harness/AGENTS.md` con todas las carpetas y su tabla. Checks del árbol, A1/A2 y Segment verification exit 0. Verificación final repetida tras estos cambios: aceptación 3/3, `./verify` exit 0, 36 pasos, Fingerprint `679cda12b859`.

- Reanudación propuesta D-05: `node scripts/kit-verificado.mjs estado --nivel aceptacion` devuelve exit 0, fase 26 y Fingerprint `e3b0c44298fc` tras `./verify` externo de la persona; duración externa no verificada. La base original continúa siendo exit 1 en 6b, duración no verificada. P00 sigue pendiente de aprobación de Puerta 2 para A1 y A2.

- Devuelto: omision — tramo 3 — changes/P00-bootstrap/notes.md: A1 debe conservar «duración no verificada» de la base original; docs/decisions/estructura-objetivo.md: A2 debe mostrar el árbol de destino solicitado, incluyendo harness/AGENTS.md y las carpetas core/{contracts,agents,skills} además de la tabla existente. No rehacer la base.

- Revisión final APPROVED: A1 pasa (base exit 1, 6b, duración no verificada; D-05); A2 pasa (árbol y 14 filas; D-02); A3 pasa (7398 y 5500 bytes); A4 pasa (rutas y enlace revisados); A5 pasa (aceptación 3/3 y verify exit 0, Fingerprint: 679cda12b859; D-05). Sin verificación de la duración de la base ni comparación separada de aceptación inicial.
