---
status: done
branch: fix/planner-no-se-detiene
base: main
repos: [.]
executor: builder
type: docs
---
# El planner no se detiene tras un avance parcial

## Goal
El planner sigue trabajando (explorar, evaluar, escribir, revisar el plan) hasta llegar a un punto de parada legítimo; no cierra el turno solo para informar un avance.

## Exploration
- Caso real: en `changes/cimientos` el planner amplió `exploracion.md`, informó «sigue pendiente cerrar las dependencias…» y se detuvo sin pregunta alguna; la persona usuaria tuvo que escribir «continúa».
- Causa (leído en `core/agents/planner.md`, 89 líneas): el paso 1 (Explore) y el paso 3 no dicen cuándo parar, y `## At the end of each response` (línea 87) manda cerrar cada respuesta con «qué viene y qué revisar», lo que invita a cerrar el turno tras cada trozo.
- Los únicos mandatos de espera existentes son: preguntas en Exploración, Gate 1, Gate 2, builder activo, `PAUSED` repetido.
- Tests: `tests/builder-contract.mjs` y `tests/continuity/protocol.mjs` solo comprueban tres frases de idioma de `planner.md`; no fijan el texto de las secciones a tocar.
- Un solo archivo de producto, `core/agents/planner.md`. Es la fuente; `install.sh` regenera las copias instaladas.

## Evaluation
Opción A (recomendada): sección nueva con lista cerrada de motivos de parada y acotar «At the end of each response» al mensaje final. Costo mínimo, un archivo, riesgo bajo (texto).
Opción B: solo reescribir el cierre de respuesta. Insuficiente: no dice que seguir sea la conducta por defecto.

## Assumptions
- La lista cerrada es: pregunta pendiente para la persona usuaria, Gate 1, Gate 2, builder en ejecución, bloqueo real (falla repetida, acceso o credenciales). Si la persona usuaria quiere otro motivo, cambia un ítem de la lista.
- Se mantiene el límite de cinco líneas para el mensaje final; no se aplica a mensajes intermedios (breves, una línea, sin cerrar el turno).

## Decisions already taken
- Executor: builder, porque el plan cubre el requisito, el contexto es un solo archivo, hay comprobación con resultado esperado y no hay credenciales ni despliegue.
- Reglas en `planner.md` en inglés (convención del kit); el texto exacto lo propone el plan abajo.

## Decisions
(ninguna)

## Validation
La persona usuaria aprobó la corrección propuesta («si», 2026-11-19): lista cerrada de motivos de parada. Falta aprobar este plan (Gate 1).

## Scope
- `core/agents/planner.md`
Todo lo demás queda fuera (no tocar `builder.md`, tests, `models.json`).

## Verification
`git diff --check && node --test tests/acceptance/builder-contract.test.mjs` — exit 0.

## Stop conditions
Un solo tramo; si el archivo no tiene las secciones citadas, detenerse con nota.

## Steps

### Segment 1 — Story: el planner solo se detiene en puntos legítimos
As persona usuaria I want que el planner continúe sin que yo lo empuje so that no pierdo turnos entre exploración, plan y revisión.
Dependencies: Not applicable.
Contracts to keep: las tres frases de idioma de `planner.md` (tests de idioma); Gate 1, Gate 2 y la regla de espera del builder sin cambios de significado.
Paths likely to change: `core/agents/planner.md` (sin tests que dependan de su posición).
Concrete example of the expected result: tras ampliar `exploracion.md` y quedar pendiente trabajo propio, el planner lo continúa en el mismo turno; solo termina el turno si debe preguntar, esperar aprobación, esperar al builder o está bloqueado.
Scope: `core/agents/planner.md`
Files: core/agents/planner.md
WHEN el planner termina un trozo de trabajo y aún quedan pasos propios THEN sigue en el mismo turno, sin cerrar con un informe (A1)
WHEN existe un motivo de la lista cerrada THEN se detiene y lo dice en el mensaje final de hasta cinco líneas (A2)
Acceptance:
- A1: `planner.md` contiene una sección `## Keep going until a stop point` con la lista cerrada de cinco motivos y la frase de que un avance parcial no es motivo; check con `rg -n "Keep going until a stop point" core/agents/planner.md`; expect 1 coincidencia y los cinco motivos listados.
- A2: `## At the end of each response` aplica solo al mensaje final que cierra el turno; check con `sed -n '/At the end of each response/,$p' core/agents/planner.md`; expect mención explícita de «final message» y de que no cierra el turno tras un avance parcial.
- A3: no se rompen las frases de idioma ni el diff; check con `git diff --check && node --test tests/acceptance/builder-contract.test.mjs`; expect exit 0.
TODO:
- [x] En `core/agents/planner.md`, antes de `## When to ask the user`, añadir `## Keep going until a stop point` con: continuar sin pedir permiso entre exploración, evaluación, escritura del plan y revisión; avance parcial o informe intermedio no cierran el turno (A1). Check: `rg -n "Keep going until a stop point" core/agents/planner.md`; expect 1 línea.
- [x] En esa sección, listar los únicos motivos de parada: pregunta pendiente a la persona usuaria, Gate 1, Gate 2, builder en ejecución (esperar su retorno), bloqueo real (misma causa falla dos veces o falta acceso/credencial) (A1). Check: `sed -n '/Keep going/,/^## When/p' core/agents/planner.md | rg -c "^- "`; expect 5.
- [x] Reescribir `## At the end of each response`: las cinco líneas aplican al mensaje final que cierra el turno por un motivo de la lista; un mensaje intermedio es de una línea y no cierra el turno (A2). Check: `rg -n "final message" core/agents/planner.md`; expect al menos 1 línea.
- [x] Ejecutar la verificación del plan (A3). Check: `git diff --check && node --test tests/acceptance/builder-contract.test.mjs`; expect exit 0.
Segment verification: `git diff --check && node --test tests/acceptance/builder-contract.test.mjs` — level 1; exit 0; covers A1, A2, A3.
Handoff: solo se edita `core/agents/planner.md`, 89 líneas. Texto operativo en inglés. No tocar las frases de idioma de las líneas iniciales. No hacer commit.

## Evidence
Paso 1 (sección `## Keep going until a stop point` añadida antes de `## When to ask the user`, A1):
$ rg -n "Keep going until a stop point" core/agents/planner.md
83:## Keep going until a stop point
exit 0

Paso 2 (lista cerrada de cinco motivos, A1):
$ sed -n '/Keep going/,/^## When/p' core/agents/planner.md | rg -c "^- "
5
exit 0

Paso 3 (`## At the end of each response` acotado al mensaje final, A2):
$ rg -n "final message" core/agents/planner.md
99:The five-line limit applies to the final message, the one that closes the turn for a reason from the list above. In that final message, say what happens next and what the user should review, with the path. An intermediate message is one line, does not close the turn, and is followed by continued work in the same turn.
exit 0

Paso 4 (verificación del plan, A3):
$ git diff --check && node --test tests/acceptance/builder-contract.test.mjs
✔ builder-contract: la suite del contrato del builder pasa (73.057431ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0

## Notes
- Cambio: `core/agents/planner.md` (+11/-1). Se añade `## Keep going until a stop point` antes de `## When to ask the user`, con los cinco motivos de parada. `## At the end of each response` aplica las cinco líneas solo al mensaje final; un mensaje intermedio es de una línea y no cierra el turno.
- Rama: `fix/planner-no-se-detiene` ya estaba activa; no se creó rama. Git: `git diff --name-only` solo lista `core/agents/planner.md`.
- Untracked previos no tocados: en la raíz hay archivos sin seguir (`.bashrc`, `.gitconfig`, `.gitmodules`, `.mcp.json`, `.vscode`, etc.) que ya existían antes de esta ejecución; no se modificaron ni se incluyen en el cambio.
- Verificación extra fuera del plan: `node --test tests/continuity/protocol.mjs` falla antes de llegar a `planner.md`. Ese test lanza un Codex real (`codex-builder exec`) y el sandbox bloqueó el app-server (`Read-only file system (os error 30)`) y la red a `ab.chatgpt.com:443`. Es un fallo de entorno de esta sesión, no del cambio. No se reintentó fuera del sandbox; si se quiere confirmar, ejecutarlo fuera del sandbox.
- Mejora sugerida: ninguna (el cambio es de texto en un archivo del kit).
