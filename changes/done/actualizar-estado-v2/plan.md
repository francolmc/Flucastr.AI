---
status: done
branch: docs/actualizar-estado-v2
base: main
repos: [.]
executor: builder
segment: 1
type: docs
---
# Actualizar el estado de la v2 en TODO.md y AGENTS.md

## Goal
`TODO.md` y `AGENTS.md` dicen que la v2 está en uso real (ya no «candidata»), con fecha de hoy, una sección «Dolor actual» y rutas reparadas. Lo no confirmado queda sin tocar.

## Exploration
Detalle, tabla de rutas y los 11 puntos «por confirmar con Franco» en [`exploracion.md`](exploracion.md). Resumen: solo el estado, la fecha y las rutas son claras; los puntos 1–4 del TODO (proyecto real, Pi, instalación remota, Codex) no se deciden.

## Evaluation
Cambio claro, sin alternativas relevantes: edición mínima de dos documentos; lo dudoso se deja como está.

## Assumptions
- Los nombres de proyecto (Don Financio, Byteria, Andes) se citan tal como los dijo Franco; si no deben figurar, el builder los quita de dos frases.
- «Dolor actual» lleva solo las dos viñetas dichas; si quiere más, se añade una línea.
- Solo se reparan rutas; nombres antiguos (`principal`, `constructor`, etc.) quedan para Franco (punto 10).

## Decisions already taken
- Executor: builder, porque los requisitos están completos, el contexto son dos archivos, cada paso tiene comprobación y no hay credenciales ni despliegue.
- Tipo `docs`: solo `*.md`; no se toca `old/`, `archive/` ni `pruebas/.temporales`.

## Validation
Franco aprobó el plan (Gate 1) el 2026-11-23.

## Scope
`TODO.md` y `AGENTS.md` (raíz). Nada más. Un solo repo, rama `docs/actualizar-estado-v2`.

## Verification
`git diff --check && test "$(git diff --name-only | tr '\n' ' ')" = "AGENTS.md TODO.md " && ! grep -nE 'cambios/hechos|modelos\.json|versión candidata|candidata:' TODO.md AGENTS.md` — sin salida de error, exit 0.

## Stop conditions
Si un destino de ruta no existe al comprobarlo, no lo cambia y lo anota. Si hace falta tocar otro archivo, se detiene y lo anota.

## Steps

### Segment 1 — Story: Estado y rutas de la v2 al día
As Franco I want TODO.md y AGENTS.md alineados con el uso real so that nadie lea que la v2 aún no se prueba.
Dependencies: Not applicable.
Contracts to keep: los puntos «por confirmar» (`exploracion.md`) no cambian de texto; `AGENTS.md:43` (borrar `old/`) intacto.
Paths likely to change: `TODO.md`, `AGENTS.md`; ninguna prueba cita estos textos.
Concrete example of the expected result: `AGENTS.md` línea 3 dice «en uso real»; `TODO.md` abre con «Estado al 2026-11-23».
Scope: `TODO.md`, `AGENTS.md`
Files: TODO.md, AGENTS.md
WHEN se lee TODO.md o AGENTS.md THEN dicen que la v2 está en uso real, con fecha 2026-11-23, «Dolor actual» y rutas existentes (A1)
Acceptance:
- A1: estado, fecha y dolor actual presentes; `grep -n 'Estado al 2026-11-23\|## Dolor actual' TODO.md` da 2 líneas y `grep -c candidata AGENTS.md` da 0.
- A2: las 7 rutas de la tabla de `exploracion.md` apuntan a destinos que existen; `grep -nE 'cambios/hechos|modelos\.json' TODO.md` sin salida y `test -e` de cada destino exit 0.
- A3: solo cambian `TODO.md` y `AGENTS.md`; `git diff --name-only` lista exactamente esos dos.
TODO:
- [x] `TODO.md` línea 3: reemplazar `old/v1/definitions/TODO.md` por `old/v1/definitions/PENDIENTES.md` (A2). Check: `test -e old/v1/definitions/PENDIENTES.md`; exit 0.
- [x] `./TODO.md` línea 4: reescribir como «Estado al 2026-11-23: la v2 está en uso real (Don Financio, Byteria, Andes, entre otros; dicho por Franco). Los puntos de «Para dar la v2 por buena» no se han reevaluado: lo marcado «por confirmar con Franco» está sin decidir.» Sin «versión candidata» (A1). Check: `grep -c candidata TODO.md`; esperar 0.
- [x] `./TODO.md`: insertar `## Dolor actual` antes de `## Qué está probado`, con dos viñetas: «El builder (subagente pequeño) se pega y tarda.» y «Sus entregas vuelven con defectos u omisiones y el planner debe iterar.» (A1). Check: `grep -n -A3 '## Dolor actual' TODO.md`; esperar 2 viñetas y nada más.
- [x] `./TODO.md` líneas 8, 19 (dos rutas), 35 y 36 (segunda ruta): cambiar `cambios/hechos/` por `changes/done/` (A2). Check: `grep -c 'cambios/hechos' TODO.md`; esperar 0. Dejar la primera ruta de la línea 36 sin tocar.
- [x] `./TODO.md` línea 55: cambiar `modelos.json` por `models.json` (A2). Check: `test -e models.json && grep -c 'modelos.json' TODO.md`; esperar 0.
- [x] `./TODO.md`: marcar «por confirmar con Franco» al final de los puntos 1, 2, 3 y 4 de «Para dar la v2 por buena» sin cambiar su texto, y en los ítems de Codex, `define-project` y modo remoto de «Detalles menores» (A1). Check: `grep -c 'por confirmar con Franco' TODO.md`; esperar al menos 7.
- [x] `./AGENTS.md` línea 3: reemplazar «(candidata: falta probarla en proyectos reales, ver `./TODO.md`)» por «(en uso real en Don Financio, Byteria, Andes y otros proyectos; pendientes por confirmar en `TODO.md`)» (A1). Check: `grep -c candidata AGENTS.md`; esperar 0.
- [x] En `./` comprobar que solo cambiaron los dos archivos (A3). Check: `git diff --name-only`; esperar `./AGENTS.md` y `./TODO.md`.
Segment verification: `git diff --check && test "$(git diff --name-only | tr '\n' ' ')" = "AGENTS.md TODO.md "` — level 1; exit 0; covers A1, A2, A3.
Handoff: Contexto completo en `exploracion.md` (tabla de rutas y puntos por confirmar). No decidas ningún punto «por confirmar»: solo márcalo. No toques `AGENTS.md:43`, `old/`, `archive/` ni `pruebas/.temporales`. Registra en *Evidence* la salida de cada check.

## Evidence
- Paso 1 (TODO.md línea 3):
  $ test -e old/v1/definitions/PENDIENTES.md; echo "exit $?"
  exit 0
- Paso 2 (TODO.md línea 4):
  $ grep -c candidata TODO.md
  0
  exit 1 (grep sin coincidencias; el conteo es 0)
- Paso 3 (`## Dolor actual`):
  $ grep -n -A3 '## Dolor actual' TODO.md
  6:## Dolor actual
  7-
  8-- El builder (subagente pequeño) se pega y tarda.
  9-- Sus entregas vuelven con defectos u omisiones y el planner debe iterar.
  exit 0
- Paso 4 (rutas `cambios/hechos/` → `changes/done/`):
  $ grep -c 'cambios/hechos' TODO.md
  0
  exit 1 (grep sin coincidencias; el conteo es 0)
  $ test -e changes/done/migrar-v1-v2/plan.md; test -e changes/done/migrar-workspaces/plan.md; test -e changes/done/deny-endurecido/plan.md; test -e changes/done/deny-endurecido; echo "exit $?"
  exit 0
- Paso 5 (`modelos.json` → `models.json`):
  $ test -e models.json && grep -c 'modelos.json' TODO.md
  0
  exit 1 (grep sin coincidencias; el conteo es 0; `test -e models.json` exit 0)
- Paso 6 (marcas «por confirmar con Franco» en puntos 1–4 y en los ítems de Codex, `definir-proyecto` y modo remoto):
  $ grep -c 'por confirmar con Franco' TODO.md
  8
  exit 0 (8 ≥ 7; incluye la marca de la línea 4, que ya cita el término)
- Paso 7 (`AGENTS.md` línea 3):
  $ grep -c candidata AGENTS.md
  0
  exit 1 (grep sin coincidencias; el conteo es 0)
- Paso 8 (solo cambian los dos archivos):
  $ git diff --name-only
  AGENTS.md
  TODO.md
  exit 0
- Verificación de segmento (y final, es el único segmento), comando exacto del plan:
  $ git diff --check && test "$(git diff --name-only | tr '\n' ' ')" = "AGENTS.md TODO.md " && ! grep -nE 'cambios/hechos|modelos\.json|versión candidata|candidata:' TODO.md AGENTS.md
  exit 0
- Tipo `docs` (`git diff --name-only main`): AGENTS.md, TODO.md; ambos `*.md`, exit 0.

## Notes
- Rama: `docs/actualizar-estado-v2` ya existía y estaba activa; no se creó otra. `repos: [.]`, base `main`.
- Decisión menor (en alcance): la marca «por confirmar con Franco» del punto 1 va al final de su última viñeta («Migrar un proyecto real…»), y la del punto 2 al de su última viñeta («No se sabe si `inheritProjectContext`…»).
- Decisión menor: en los ítems de Codex de «Detalles menores» solo se marcó «Codex (soporte experimental)»; el ítem «Codex: `codex-<agente>` abre con el aviso…» no se marcó porque ya dice que Franco lo probó.
- Sin cambios fuera de alcance: no se tocaron `AGENTS.md:43`, `old/`, `archive/`, `pruebas/.temporales`, ni `cambios/deny-endurecido/plan.md` (línea 41 de TODO.md, cita histórica que la exploración dejó sin corregir), ni el texto de los puntos «por confirmar».
- Los nombres de proyecto (Don Financio, Byteria, Andes) se citaron tal como los dio Franco, según la sección Assumptions.
- Pendiente fuera de este cambio (exploración, puntos 7–11): cifra «cuatro veces», nombres antiguos de agentes y skills en TODO.md, `docs/implementacion.md` con «candidata».
- Conteo de casillas pendientes tras el último paso: 0.
