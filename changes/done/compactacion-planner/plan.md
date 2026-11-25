---
status: done
branch: feature/compactacion-planner
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Compactación del planner

## Goal
Una sesión larga del planner retoma desde sus notas y acota cada resultado, para que una compactación no lo haga empezar de nuevo.

## Exploration
Medidas en [`diagnostico.md`](diagnostico.md): tras compactar quedan 71–103 k tokens con umbral ≈100 k; cada vez se reinyectan archivos, skills y listados; el planner además relee y recibe resultados grandes. En Claude Code manda `compact_at` general (100000), no el 60000 del planner. `adapters/claude-code/compaction.mjs` ya lee `profiles.claude-code.compact_at`. `grep` en `tests/`, `tools/` y `verify` no halló pruebas que fijen 133000.

Preguntas pendientes: ninguna; las correcciones se confirman al aprobar.

## Evaluation
- Incluidas: C1 (retomar desde notas) y C2 (resultados acotados), solo texto añadido.
- C3 (umbral 150000) excluida por decisión de la persona usuaria: solo retrasa el bucle y sube el costo por llamada.
- Si el bucle persiste, siguen en otro cambio: partir `plan-change` y después el umbral (`diagnostico.md`).
- Costo: ~1,1 KB fijos más en el planner.

## Assumptions
- C1 y C2 valen para las tres herramientas; si deben ser solo de Claude Code, cambia el archivo del tramo.
- C2 filtra la salida en vez de escribirla a `/tmp`: el planner no gana permiso de escritura.

## Decisions already taken
- Executor: builder, because requisitos, contexto, comprobaciones y ausencia de credenciales o despliegue quedan cubiertos (cuatro respuestas: sí).
- Solo se añade texto a `planner.md`; nada se borra ni se reescribe: cero reducción de contrato y seguridad.
- El umbral de compactación no cambia.

## Validation
2026-11-25: la persona usuaria aprobó el tramo 1 y pidió quitar el tramo 2.

## Scope
- `core/agents/planner.md`.
- `changes/compactacion-planner/` (evidencia y notas).

Fuera: todo lo demás, incluidos `models.json`, `core/skills/`, `tools/`, `scripts/`, `adapters/`, `tests/`, `AGENTS.md` y `changes/reducir-contrato-builder/`.

## Verification
`./verify` — completo, una vez, al final del tramo 1; sale 0.

## Stop conditions
Parar con `PAUSED` si: una comprobación falla dos veces por la misma causa; cumplir un criterio exige tocar algo fuera de Scope o borrar o reescribir texto existente de `planner.md`; falta una decisión de la persona usuaria. No modificar pruebas ni contratos de `tools/verify/` para que pasen.

## Steps

### Segment 1 — Story: el planner retoma desde sus notas y acota sus lecturas
As persona usuaria del kit I want que el planner guarde sus hallazgos y lea por partes so that una compactación no lo haga empezar de nuevo.
Dependencies: none ("Not applicable").
Contracts to keep: todo el texto actual de `core/agents/planner.md`; revisión completa de plan, diff y evidencia; *Verification* sin filtrar; `diagnose` sin escribir archivos. `tests/builder-contract.mjs` y `tools/verify/*contract*.sh` leen este archivo.
Paths likely to change: `core/agents/planner.md` (no se mueve ni se archiva).
Concrete example of the expected result: el planner anota «`execute-plan` revisado, 3 hallazgos» en el plan; tras compactar lee el plan y no vuelve a abrir esa skill salvo que haya cambiado o necesite el texto exacto.
Scope: `core/agents/planner.md`.
Files: core/agents/planner.md
WHEN la sesión del planner se compacta THEN continúa desde el archivo del cambio sin releer lo ya anotado (A1)
WHEN el planner lee un archivo grande o una salida larga THEN pide solo la parte necesaria (A2)
Acceptance:
- A1: existe la sección `## Context budget` con las reglas de notas, retomada y relectura; check with `grep -c "Resume from notes" core/agents/planner.md`; expect 1.
- A2: existe la regla de resultados acotados con su excepción de revisión; check with `grep -c "Never a shortcut" core/agents/planner.md`; expect 1.
- A3: no se borra ni reescribe ninguna línea; check with `git diff --numstat -- core/agents/planner.md`; expect segunda columna (líneas borradas) 0.
TODO:
- [x] En `core/agents/planner.md`, insertar antes de `## Keep going until a stop point` el contenido exacto de `changes/compactacion-planner/bloque.md`, seguido de una línea en blanco (A1, A2). Check: `grep -c "## Context budget" core/agents/planner.md`; expect 1.
- [x] Revisar el diff de `core/agents/planner.md`: solo líneas añadidas (A3). Check: `git diff --numstat -- core/agents/planner.md`; expect borradas 0.
- [x] Medir el tamaño de `core/agents/planner.md` (A3). Check: `wc -c core/agents/planner.md`; expect 20500 o menos.

- [x] Ejecutar `./verify` completo y anotar su duración en Evidence (duración no medida al planificar) (A1, A2, A3). Check: `./verify`; expect exit 0.
Segment verification: `node tests/builder-contract.mjs` — level 1; exit 0; covers A1, A2, A3.
Handoff: texto cerrado en `changes/compactacion-planner/bloque.md`; insertar sin editar nada más. Ejemplo: `git diff --numstat -- core/agents/planner.md` muestra algo como `10 0 core/agents/planner.md`. Devolver ese diff y la salida de las comprobaciones. La verificación final es de nivel 3: `./verify`.

## Follow-up for the user (tras el merge)
- Volver a ejecutar `install.sh` para actualizar el planner instalado.
- Opcional (C0): desactivar plugins y conectores que no uses.
- El efecto solo se ve en sesiones reales; si el bucle persiste, ver los candidatos en `diagnostico.md`.

## Evidence
$ grep -c "## Context budget" core/agents/planner.md
1
exit 0

$ git diff --numstat -- core/agents/planner.md
10	0	core/agents/planner.md
exit 0

$ wc -c core/agents/planner.md
20205 core/agents/planner.md
exit 0

$ grep -c "Resume from notes" core/agents/planner.md
1
exit 0

$ grep -c "Never a shortcut" core/agents/planner.md
1
exit 0

$ node tests/builder-contract.mjs   (Segment verification, nivel 1)
ok A1
ok A2
ok A3
ok A5
ok A4
exit 0

$ ./verify   (duración medida: 121 s, 1 corrida)
✔ 21. builder pegado en kit run: detector y casos D1–D5 (tests/kit-run/pegado.test.mjs)
ℹ tests 10
ℹ suites 3
ℹ pass 10
ℹ fail 0
ℹ duration_ms 927.325406
VERIFY OK
resultado registrado: Fingerprint: 351eb002f64a
exit 0

## Notes
- Tramo 1 (única historia del plan): `core/agents/planner.md` +10 líneas, 0 borradas, 20205 bytes (límite 20500). Sin otros archivos de producto cambiados por el builder.
- Checkpoint: archivo cambiado `core/agents/planner.md`; diff: insertada la sección `## Context budget` (10 líneas) antes de `## Keep going until a stop point`; checks: A1, A2, A3 pasan.
- `git status` muestra también entradas `?? .bashrc`, `?? .gitconfig` y similares en la raíz: son dispositivos de caracteres (`crw-rw-rw-`, fecha 2026-11-24) del sandbox, no del cambio; no se tocaron.
- Verificación final: `./verify` salió 0 en 121 s; fingerprint 351eb002f64a.
