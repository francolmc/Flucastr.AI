---
plan: plan.md
segment: 7
---

## Steps

### Segment 7 — Story: contratos del builder y del planner, y costo medido
As a planner I want leer la señal y el resumen al revisar, y as a builder I want una regla mínima so that el costo de la capa del builder quede medido y decidido.
Dependencies: Segments 2 and 6.
Contracts to keep: contrato `DONE:`/`PAUSED:` del builder; el informe del planner ≤ 4 líneas; `tools/verify/agent-contracts.sh` y `tests/builder-contract` siguen verdes; nada de nombres de herramientas de stack en `core/agents/` ni `core/skills/`.
Paths likely to change: `core/agents/builder.md`, `core/skills/execute-plan/SKILL.md`, `core/agents/planner.md`, `docs/evaluaciones/progreso-en-vivo.md` (nuevo), `AGENTS.md` (solo en el cierre, por el planner).
Concrete example of the expected result: ante «¿cómo va?», el planner ejecuta `node scripts/kit-status.mjs <plan>` (una llamada, sin modelo) y responde, dentro de 4 líneas, segmento, paso, última actividad con tiempo, último archivo, señal y tiempo por paso del resumen si existe.
Scope: `core/agents/builder.md`, `core/skills/execute-plan/SKILL.md`, `core/agents/planner.md`.
Files: core/agents/builder.md, core/skills/execute-plan/SKILL.md, core/agents/planner.md
WHEN el builder lee sus límites THEN `builder.md` declara, en una frase, que puede anexar líneas a `changes/<n>/progress.jsonl` solo vía `kit-nota` y no puede editar ni borrar existentes ni tocar `progress-resumen.md` (A1)
WHEN el builder se detiene por un bloqueo THEN `execute-plan` pide en una línea en inglés ejecutar `kit-nota ... blocked "<cause>"` (y `doing` solo si la persona usuaria lo aprueba tras la medición) (A2)
WHEN el planner informa progreso o revisa THEN `planner.md` indica correr `kit-status` y leer `progress-resumen.md` si existe, e informar actividad reciente y tiempo por paso dentro de las cuatro líneas, distinguiendo `CORTE POR TOPE` de un PAUSED de producto (A3)
WHEN se mide el costo THEN `docs/evaluaciones/progreso-en-vivo.md` muestra tokens de la regla, por llamada, y el porcentaje sobre sesiones reales del builder (A4)
Acceptance:
- A1: `grep -n "kit-nota\|progress.jsonl" core/agents/builder.md core/skills/execute-plan/SKILL.md` y `grep -n "kit-status\|progress-resumen" core/agents/planner.md` devuelven las líneas esperadas (una por archivo, la regla de `execute-plan` en una sola línea); expect coincidencias; `bash tools/verify/agent-contracts.sh` y `node --test tests/acceptance/*.test.mjs` siguen verdes (salvo líneas base anotadas).
- A2: mismo caso que A1 (ver arriba)
- A3: mismo caso que A1 (ver arriba)
- A4: el documento contiene la cifra de tokens por sesión medida con `node scripts/usage.mjs --sessions` sobre ≥ 3 sesiones reales del builder (si no hay, «no medido» y la recomendación del plan queda como estimación); incluye la recomendación final y el número para decidir `doing`.
- A5: la regla no menciona herramientas de stack; `grep -n -i "pnpm\|npm\|docker" core/agents/builder.md core/skills/execute-plan/SKILL.md` sin coincidencias nuevas; expect sin coincidencias nuevas.
TODO:
- [x] Agregar a `core/agents/builder.md` (Limits) la excepción de `progress.jsonl` en una frase (A1). Check: `grep -n "progress.jsonl" core/agents/builder.md`; expect una coincidencia.
- [x] Agregar a `core/skills/execute-plan/SKILL.md` la regla de una línea (`Blocked:`; `Doing:` solo si se aprueba) (A2). Check: `grep -n "kit-nota" core/skills/execute-plan/SKILL.md`; expect una coincidencia.
- [x] Agregar a `core/agents/planner.md` (Builder report) la lectura de `kit-status` y `progress-resumen.md` sin pasar de cuatro líneas, y la distinción de corte por tope (A3). Check: `grep -n "kit-status" core/agents/planner.md`; expect coincidencias.
- [x] Medir y escribir `docs/evaluaciones/progreso-en-vivo.md` (A4). Check: el archivo existe con las cifras o «no medido»; expect presente.
- [x] Correr `bash tools/verify/agent-contracts.sh` y `node --test tests/acceptance/*.test.mjs` y anotar el resultado (A1–A3, A5). Check: salida; expect verdes salvo línea base anotada.
Segment verification: `bash tools/verify/agent-contracts.sh` — level 1; exit 0 (salvo línea base conocida: `$T8` sin definir en `agent-contracts.sh`, anotada como hallazgo previo); covers A1–A5. Gate 2 corre `./verify` completo en la máquina de la persona usuaria.
Handoff: ≤ 1 línea nueva en cada instrucción operativa; en inglés. No cerrar ni mover el plan: lo hace el planner.

## Evidence
