---
status: done
branch: feature/kit-check
base: main
repos: [.]
executor: builder
segment: 1
continuity: continuous
type: code
---
# kit check: criterios de aceptación ejecutados por una herramienta

## Goal
`node scripts/kit-check.mjs <plan> [--segment N]` ejecuta la Comprobación de cada A# del plan y devuelve una tabla pasa / falla / no automatizable / bloqueado, con código de salida; el «hecho» deja de decidirlo el modelo.

## Exploration
- Evidencia: `changes/done/linea-base-builder/linea-base.md` §3–§5: 6 de 12 retornos con `verify` en verde y A# incumplido o prueba sobre montaje sintético (R2/R5).
- Parseo hoy: `tools/run/plan.mjs` solo da `frontmatter`, `progreso` y `comandoVerificacion`; `scripts/review-plan.mjs` es CLI sin exports y revisa A# por regex dentro de `### Segment N — Story:`. Ninguno extrae comando ni resultado esperado: se escribe un parser nuevo que reutiliza `frontmatter`.
- Política: no existe `adapters/claude-code/permissions-hook.mjs`; el hook es `scripts/permissions-hook.mjs` y `deny.mjs` solo escribe reglas. La política real es `accionProtegida` (commit/push/merge, `gh pr`, secretos, `rm` fuera de `pruebas/.temporales`, deploy) y `META`; no se exportan y el archivo ejecuta su `main` al importarse.
- Reutilizables: `redactar` y `truncar` de `tools/progress/eventos.mjs`.
- Formatos reales: 28 planes con tabla `| ID | Resultado observable | Comprobación | Resultado esperado |` (32 con `## Aceptación`); planes nuevos con `Acceptance:` y `- A1: …; check with …; expect ….` por historia (también en `tramo-N.md`); planes antiguos con `- A1: texto` sin comando separado.
- No verificado: `git fetch` falló por la red del sandbox; la base `main` local no se confirmó al día (el builder lo revisa antes de lanzar).

### Formatos que `kit check` soportará
1. **Tabla** de 4 columnas bajo `## Aceptación` / `## Acceptance` (cabeceras ES o EN). Global: con `--segment` falla con código 2.
2. **Historia nueva**: líneas `- A#: <resultado>; check with <comando>; expect <resultado>.` dentro de `### Segment N — Story:` de `plan.md` y de los `tramo-N.md` enlazados. `--segment N` limita a ese tramo.
3. **Lista antigua** `- A#: texto` sin comando: se reporta «no automatizable (requiere revisión)».

Quedan fuera: A# en prosa libre sin identificador; cabeceras de tabla en otro idioma; `### Tramo N` combinado con tabla global; elegir directorio por fila en planes con varios `repos:`; comandos con pipes, `&&`, redirecciones, `$()`; inferir un comando desde la descripción; detectar montajes sintéticos.

## Evaluation
Opción A (recomendada): módulos en `tools/check/` + CLI delgado, igual que `kit-status`; exportar `accionProtegida` del hook con un cambio mínimo (la política queda en un solo lugar). Opción B: copiar la política al módulo nuevo: más barata, pero se desalinea. Opción C: reutilizar parseo de `review-plan.mjs`: no extrae comando ni esperado y es heurístico. Riesgo de A: tocar el hook; lo cubren `tests/permissions-contract/*` y `tests/permissions-v2.test.mjs`.

## Assumptions
- El plan aprobado en Gate 1 es de confianza: se ejecutan sus comandos sin pedir permiso fila a fila (solo bloquea la política). Si no, habría que limitarse a los comandos declarados en `AGENTS.md`.
- Sin shell: argumentos con comillas simples/dobles se separan en el parser; cualquier operador de shell se reporta «bloqueado» (motivo: operador). Si se quiere admitir pipes, cambia el módulo de ejecución.
- Directorio: raíz del proyecto (dos niveles sobre `changes/<n>/`, tres si está en `done/`); si `repos:` tiene una sola carpeta distinta de `.`, esa. Varias: raíz.
- Resultado esperado automatizable: `exit N`/`rc N`/`código N` y «falla/rc≠0»; opcional «contiene `X`». Todo lo demás es ambiguo y queda «no automatizable» aunque el comando salga 0.
- Timeout 120 s por comando (`--timeout <seg>`); salida: cola de 20 líneas, redactada.
- Códigos: 0 todo pasa; 1 algún A# falla; 3 sin fallas pero hay bloqueado o no automatizable sin revisar; 2 uso o plan mal formado. `--revisado A3,A5` marca «no automatizable (revisado)» y no cuenta; nunca excusa un bloqueado ni un fallo.

## Decisions already taken
- Executor: builder, porque requisitos, contexto y comprobaciones están escritos y no hay credenciales ni despliegue.
- No se cambia `kit run` (integración = C3) ni el plan evaluado: `kit check` solo lee.

## Decisions
- Tramo 2: `contiene «X»` da `pasa` si la salida (sin redactar) incluye X, sin exigir código; `falla`/`rc≠0` da `pasa` con cualquier código distinto de 0. Ambos quedan documentados en la prueba A1/A2 de `tools/check/ejecutar.mjs`.
- Tramo 2: el orden es esperado no automatizable → `no-automatizable`, luego protegido o metacarácter → `bloqueado`, y solo después se ejecuta; así un esperado ambiguo nunca corre el comando.

## Validation
Aprobado por la persona usuaria (Gate 1): supuestos confirmados, 2026-11-24.

## Scope
`tools/check/parse.mjs`, `tools/check/ejecutar.mjs`, `scripts/kit-check.mjs`, `scripts/permissions-hook.mjs` (solo exportar y proteger `main`), `tools/verify/usage-and-run.sh` (paso 16), `tests/kit-check/**`, `README.md`, `tests/README.md`, `AGENTS.md`. Fuera: `kit run`, otros scripts.

## Verification
`./verify` — Nivel 3, solo en la revisión final; `Segment verification:` de cada tramo usa las pruebas de `tests/kit-check`.

## Stop conditions
Continuar si el check pasa y el siguiente paso sigue en Scope. Parar con nota si la misma causa falla dos veces, hay que salir de Scope, falta una decisión, o un check dura más del doble de lo medido (baseline: `node --test tests/permissions-contract/*.test.mjs`, a medir en el primer paso de `tramo-2.md`).

## Steps
Revisión: fin de historia. Tramos en `tramo-N.md`:
- `tramo-1.md` — Segment 1 — Story: extraer la tabla de aceptación (3 formatos)
- `tramo-2.md` — Segment 2 — Story: ejecutar comprobaciones bajo la política del hook
- `tramo-3.md` — Segment 3 — Story: informe, códigos de salida y fixtures de la línea base

## Evidence
Tramo 1, pasos 1–2 (fixtures y pruebas antes de implementar):
$ ls tests/kit-check/fixtures
enlazado
historia.md
lista.md
malformada.md
tabla.md
exit 0

$ node --test tests/kit-check/parse.test.mjs
(fallo esperado: ERR_MODULE_NOT_FOUND para tools/check/parse.mjs; 0 pasan, 1 falla)
exit 1

Tramo 1, pasos 3–4 (implementación y solo-lee), comandos reales:
$ node --test tests/kit-check/parse.test.mjs
ℹ tests 7
ℹ pass 7
ℹ fail 0
exit 0

A1: $ node --test tests/kit-check/parse.test.mjs
ℹ tests 7 / ℹ pass 7 / ℹ fail 0
exit 0
A2: $ node --test --test-name-pattern=segmento tests/kit-check/parse.test.mjs
ℹ tests 1 / ℹ pass 1 / ℹ fail 0
exit 0
A3: $ node --test --test-name-pattern=malformada tests/kit-check/parse.test.mjs
ℹ tests 1 / ℹ pass 1 / ℹ fail 0
exit 0
A4: $ node --test --test-name-pattern=global tests/kit-check/parse.test.mjs
ℹ tests 1 / ℹ pass 1 / ℹ fail 0
exit 0
A5: $ node --test --test-name-pattern=ambiguo tests/kit-check/parse.test.mjs
ℹ tests 1 / ℹ pass 1 / ℹ fail 0
exit 0
solo-lee: $ node --test --test-name-pattern=solo-lee tests/kit-check/parse.test.mjs
ℹ tests 1 / ℹ pass 1 / ℹ fail 0
exit 0

Tramo 2, paso 1 (línea base de parada, antes de tocar el hook):
$ timeout 120s node --test tests/permissions-contract/*.test.mjs
ℹ tests 11 / ℹ pass 11 / ℹ fail 0 / ℹ duration_ms 1975
duración de reloj: 2013 ms
exit 0

Tramo 2, paso 2 (pruebas A1–A5 antes de implementar):
$ node --test tests/kit-check/ejecutar.test.mjs
(fallo esperado: ERR_MODULE_NOT_FOUND para tools/check/ejecutar.mjs; no hay tests ejecutados)
exit 1

Tramo 2, paso 3 (A6: hook con accionProtegida y META exportados, main protegido):
$ node --test tests/permissions-contract/*.test.mjs
ℹ tests 11 / ℹ pass 11 / ℹ fail 0
exit 0
$ node scripts/permissions-hook.mjs comprobar "$TMPDIR"  →  ausente, exit 0 (ejecución como script igual que antes)
$ node --input-type=module -e "await import('…/scripts/permissions-hook.mjs')"  →  sin salida, exit 0; accionProtegida('rm -rf /') = true, META.test('a|b') = true

Tramo 2, paso 4 (implementación de tools/check/ejecutar.mjs):
$ node --test tests/kit-check/ejecutar.test.mjs
ℹ tests 11 / ℹ pass 11 / ℹ fail 0
exit 0
A1: $ node --test --test-name-pattern=pasa tests/kit-check/ejecutar.test.mjs → tests 2 / pass 2 / fail 0, exit 0
A2: $ node --test --test-name-pattern=falla tests/kit-check/ejecutar.test.mjs → tests 2 / pass 2 / fail 0, exit 0
A3: $ node --test --test-name-pattern=bloqueado tests/kit-check/ejecutar.test.mjs → tests 3 / pass 3 / fail 0, exit 0
A4: $ node --test --test-name-pattern=ambiguo tests/kit-check/ejecutar.test.mjs → tests 2 / pass 2 / fail 0, exit 0
A5: $ node --test --test-name-pattern=salida tests/kit-check/ejecutar.test.mjs → tests 3 / pass 3 / fail 0, exit 0
A6: $ node --test tests/permissions-contract/*.test.mjs → tests 11 / pass 11, exit 0

Verificación del segmento 2 (nivel 2):
$ node --test tests/kit-check/*.test.mjs tests/permissions-contract/*.test.mjs
ℹ tests 29 / ℹ pass 29 / ℹ fail 0 / ℹ duration_ms 7196
duración de reloj: 7316 ms (sin duración previa; corrida bajo `timeout 120s`)
exit 0

Tramo 3, TODO 1–3 (fixtures, pruebas que fallan primero, CLI), comandos reales:
$ node tests/kit-check/run.mjs   (antes de existir scripts/kit-check.mjs)
Cannot find module '…/scripts/kit-check.mjs'
exit 1, 203 ms de reloj (fallo esperado)

$ node tests/kit-check/run.mjs   (con scripts/kit-check.mjs)
ok verde / ok rojo / ok bloqueado / ok ambiguo / ok malformada / ok verify-verde / ok typecheck
exit 0, 523 ms de reloj

Tramo 3, A1–A6 (comando individual de cada caso, corrida final):
A1: $ node tests/kit-check/run.mjs --caso=verde → exit 0, 128 ms
A2: $ node tests/kit-check/run.mjs --caso=rojo → exit 0, 116 ms
A3: $ node tests/kit-check/run.mjs --caso=bloqueado → exit 0, 100 ms (incluye ambiguo y --revisado)
A4: $ node tests/kit-check/run.mjs --caso=malformada → exit 0, 65 ms
A5: $ node tests/kit-check/run.mjs --caso=verify-verde → exit 0, 115 ms
A6: $ node tests/kit-check/run.mjs --caso=typecheck → exit 0, 119 ms

A7: $ ./verify → «VERIFY OK», exit 0, 82412 ms de reloj. Incluye «ok 16: pruebas de kit-check pasaron sobre los fixtures». `changes/kit-check/plan.md` no tiene cambios en Scope ni en Acceptance.

Verificación final del segmento 3 (nivel 3): `./verify` → exit 0, 82412 ms. Las duraciones de `tests/kit-check/run.mjs` son de este entorno y sirven de referencia; el tope de tiempo del plan (dos veces la duración medida) no se alcanzó en ninguna corrida.

Corrección de la revisión final (defecto de `criteriosHistoria`: prosa con `check with` generaba una fila `?`), comandos reales:
$ node --test --test-name-pattern=prosa tests/kit-check/parse.test.mjs   (antes de la corrección; la prueba nueva falla: actual ['?','A1'])
ℹ tests 1 / ℹ pass 0 / ℹ fail 1
exit 1

$ node --test tests/kit-check/*.test.mjs   (después de la corrección)
ℹ tests 19 / ℹ pass 19 / ℹ fail 0 / ℹ duration_ms 502.7
exit 0

$ node tests/kit-check/run.mjs
ok verde / ok rojo / ok bloqueado / ok ambiguo / ok malformada / ok verify-verde / ok typecheck
exit 0

$ node scripts/kit-check.mjs changes/kit-check/tramo-1.md --segment 1
A# | estado | comando ejecutado | motivo/cola
A1 | pasa | node --test tests/kit-check/parse.test.mjs | -
A2 | pasa | node --test --test-name-pattern=segmento tests/kit-check/parse.test.mjs | -
A3 | pasa | node --test --test-name-pattern=malformada tests/kit-check/parse.test.mjs | -
A4 | pasa | node --test --test-name-pattern=global tests/kit-check/parse.test.mjs | -
A5 | pasa | node --test --test-name-pattern=ambiguo tests/kit-check/parse.test.mjs | -
kit-check: pasa=5 falla=0 bloqueado=0 no-automatizable=0 revisado=0
exit 0

$ ./verify
== 16. kit-check: pruebas de scripts/kit-check.mjs sobre fixtures sintéticos ==
ok verde / ok rojo / ok bloqueado / ok ambiguo / ok malformada / ok verify-verde / ok typecheck
ok 16: pruebas de kit-check pasaron sobre los fixtures
== 8t. small change: definición, riesgo y prácticas por tecnología ==
ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
exit 0

## Notes
- Builder (corrección de la revisión final): `tools/check/parse.mjs` (`criteriosHistoria`) reordenado: `RE_A` se evalúa antes de la rama `check with`, así que una línea que no empieza por `- A#:` ya no genera fila. `tests/kit-check/parse.test.mjs` con una prueba nueva («prosa que cita check with no genera fila»). Sin cambios en `tools/check/` fuera de esa función ni en el contrato de fila. No se tocó ningún otro archivo; sin commit ni push.
- Estado: `done` (verify pasó, nivel 3). `kit-check` sobre `tramo-1.md` da solo A1–A5 con código 0. El planner decide el cierre.
Checkpoint tramo 1 (historia «extraer la tabla de aceptación (3 formatos)»), completa:
- Archivos nuevos: `tools/check/parse.mjs` (169 líneas), `tests/kit-check/parse.test.mjs` (107), `tests/kit-check/fixtures/{tabla,historia,lista,malformada}.md`, `tests/kit-check/fixtures/enlazado/{plan,tramo-1,tramo-2}.md`. Ningún archivo existente de producto cambiado.
- Check del tramo: `node --test tests/kit-check/parse.test.mjs` → 7/7, exit 0. A1–A5 y solo-lee, cada uno con su patrón, pasan.
- Duración medida del check del tramo 1: 168 ms de reloj (archivo completo). No había duración previa, así que el check corrió con tope de 120 s (`timeout 120s`); esta medición queda como referencia para este archivo.
- Decisiones menores (dentro de Scope): cada fila añade `motivo` (A5 exige el motivo de `comando: null`); las filas de lista antigua llevan un indicador interno `lista`; un plan sin ningún A# da error «sin criterios A# en el plan»; los tramos enlazados van en `fixtures/enlazado/` porque el enlace requiere archivos hermanos.
- Las casillas de este tramo están en `tramo-1.md`, donde se declaran los pasos.
- Parada por frontera de historia: los tramos 2 y 3 son historias distintas («ejecutar comprobaciones bajo la política del hook», «informe, códigos de salida y fixtures de la línea base»). Según los límites del builder no se cruza una frontera de historia en una misma corrida, así que el tramo 2 no se ejecutó. Hace falta la revisión del planner en contexto nuevo y reaprobar el plan; al reanudar: `segment: 2`, empezando por la medición de la línea base de `permissions-contract` que pide `tramo-2.md`.
- `./verify` (nivel 3) no se ejecutó: el plan lo reserva para la verificación final, después del tramo 3. Tampoco se ejecutó `kit run` ni se tocó.
- Estado: `done` por el check de segmento del tramo 1; el planner decide la reapertura.
- Planner: tramo 1 revisado (7/7 pruebas, 1 archivo de producto, en alcance). El builder paró porque cada tramo es «Story:» propia; los tres forman una sola entrega, así que se relanza con segment: 2 y se continúa hasta el tramo 3 sin pausa.
- Tramo 2, línea base medida: `node --test tests/permissions-contract/*.test.mjs` tarda 2013 ms de reloj (11/11 pasan). Corrió bajo `timeout 120s` porque no había duración previa. Sirve de referencia para el tope de parada del paso A6.
- Desviación registrada: el check del tramo 1 también corrió sin duración previa, con el mismo tope de 120 s; el planner debe saber que no se pausó antes de medirlo.
- Checkpoint tramo 2 (historia «ejecutar comprobaciones bajo la política del hook»), completo:
  - Archivos: `tools/check/ejecutar.mjs` (nuevo, 105 líneas), `tests/kit-check/ejecutar.test.mjs` (nuevo, 90 líneas), `scripts/permissions-hook.mjs` (4 inserciones, 3 borrados: `export` en `META` y `accionProtegida`, y `main` guardado con `resolve(process.argv[1]) === SCRIPT`). La política no cambió: el diff del hook solo toca esas tres líneas.
  - Check del tramo: `node --test tests/kit-check/*.test.mjs tests/permissions-contract/*.test.mjs` → 29/29, exit 0 (7 parse, 11 ejecutar, 11 permissions-contract). Medida: 7316 ms de reloj, bajo `timeout 120s`.
  - A1–A6 pasan con los comandos de su línea en Evidence.
  - Parada de guarda: no se disparó. La guarda de `main` no cambió el comportamiento: el hook sigue respondiendo como script (`comprobar`) y importarlo no ejecuta nada.
  - Estado: `in progress`; continúa al tramo 3 en la misma entrega (orden del planner). `./verify` queda para el final del tramo 3.
- Checkpoint tramo 3 (historia «informe, códigos de salida y fixtures de la línea base»), completo:
  - Archivos nuevos: `scripts/kit-check.mjs` (CLI con `--segment`, `--timeout`, `--revisado`, `--help`; códigos 0/1/2/3), `tests/kit-check/run.mjs` (siete casos: verde, rojo, bloqueado, ambiguo, malformada, verify-verde, typecheck), `tests/kit-check/fixtures/{verde,rojo,bloqueado,ambiguo,verify-verde,typecheck}.md` (sintéticos, sin contenido de proyectos).
  - Archivos cambiados: `tools/verify/usage-and-run.sh` (paso 16 después del 15), `tests/README.md` (fila de `tests/kit-check/run.mjs` con formatos soportados y excluidos), `README.md` y `AGENTS.md` (una entrada cada uno con el comando y los códigos). `kit run` no se tocó; el plan evaluado no cambió.
  - Diff: 5 archivos existentes con líneas añadidas, sin borrados de contenido; 3 archivos nuevos de CLI y pruebas; 6 fixtures.
  - Checks: A1–A6 pasan con los comandos individuales de Evidence; `./verify` (A7) → exit 0, paso 16 `ok`.
  - Residual conocido (no corregido): la columna de comando de la tabla del informe puede contener « | » (por ejemplo, el caso de pipe bloqueado), así que la tabla no se puede separar de forma estricta por ese separador. Un lector que la parsee debe contar las columnas por el primer y último separador.
  - Desviación de tope de tiempo: no aplica en este tramo; las duraciones de `kit-check` y de `permissions-contract` ya estaban medidas en tramos 1 y 2.
  - Estado: `done` porque `./verify` pasó (nivel 3). El planner revisa en contexto nuevo al cerrar la historia.
- Planner: tramo 3 (última entrega) con `./verify` en verde. Revisión final pendiente: el planner decide si la historia queda cerrada.
- Planner (revisión final): Devuelto: defecto. `tools/check/parse.mjs`, `criteriosHistoria`: toda línea que contiene `check with` se toma como criterio, aunque no empiece por `- A#:`. Repro: `node scripts/kit-check.mjs changes/kit-check/tramo-1.md --segment 1` imprime una fila extra `? | no-automatizable | (sin comando)` (la línea `Example:` del tramo cita `- A2: ... check with ...`) y sale 3 aunque A1–A5 pasan. Criterio: filas = solo A# reales (A1 del tramo 1/F2). Corrección: exigir `RE_A` (`^- A\d+:`) antes de la rama `check with`; añadir un caso de prueba en `tests/kit-check/parse.test.mjs` con una línea de prosa que cite `check with` y verificar que no genera fila; repetir `node --test tests/kit-check/*.test.mjs` y `node tests/kit-check/run.mjs`; `./verify` al final. Sin otros cambios.
- Planner: revisado y sin defecto: `changes/done/aceptacion/plan.md` usa lista antigua `- A#: ... pasa (rc 0)` (F3), no tabla; 5 × «no automatizable» es el comportamiento previsto. Residual del builder (« | » en la columna de comando del informe) aceptado y documentado. Mejora sugerida: ninguna (sin Docker/Compose/navegador).
