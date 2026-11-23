---
plan: plan.md
segment: 3
---

## Steps

### Segment 3 — Story: convención «Devuelto:» en el contrato del planner (solo si se aprueba)
As the planner I want registrar cada devolución con un formato fijo so that el informe las cuente.
Dependencies: Segment 2 — el informe ya cuenta las líneas; aprobación de la convención en Gate 1.
Contracts to keep: `tools/verify/agent-contracts.sh` (frases requeridas de `core/agents/planner.md`: «You may create or edit only files», «APPROVED», «do not fix it», «one long wait»); sin nombres de herramientas de stack.
Paths likely to change: `core/agents/planner.md` (paso 5); no se mueve.
Concrete example of the expected result: tras devolver, el planner anota en Notes `- Devuelto: omision — tramo 1 — scripts/x.mjs:12, A3: falta el caso vacío`.
Scope: `core/agents/planner.md`.
Files: core/agents/planner.md
WHEN el planner devuelve un entregable al builder THEN anota una línea `Devuelto: <categoría> — tramo <N> — <detalle>` en `## Notes` (A11)
Acceptance:
- A11: `planner.md` contiene «Devuelto:» con las cuatro categorías y las frases del contrato siguen; check con `grep -c "Devuelto:" core/agents/planner.md` y `./verify`; expect ≥ 1 y verde.
TODO:
- [x] En el paso 5 de `core/agents/planner.md`, tras «Record it in *Notes* (file, line, criterion)», agregar el formato `Devuelto: <defecto|omision|verify|otro> — tramo <N> — <detalle>` (A11). Check: `grep -n "Devuelto:" core/agents/planner.md`; expect una coincidencia en el paso 5.
- [ ] Ejecutar `./verify` (A11). Check: salida; expect verde, con `agent-contracts.sh` incluido.
Segment verification: `./verify` — level 3; exit 0; covers A11 y la verificación final de la historia.
Handoff: solo ejecutar si en `## Validation` figura la aprobación de la convención. Texto en inglés (instrucciones operativas), sin nombres de herramientas.

## Evidence
**Paso 1 (A11, formato en `core/agents/planner.md`, paso 5).** Check `grep -n "Devuelto:" core/agents/planner.md`: una coincidencia (línea 59, dentro del veredicto DONE del paso 5). `grep -c "Devuelto:"` = 1.
$ grep -n "Devuelto:" core/agents/planner.md
59:   - **DONE:** review the `git diff` for files in *Scope*, the *Evidence* queue, and *Notes*; mark each Acceptance row met or defective. For continuous work, review in a fresh context at the end of the story. If the plan requires `Revisión: por tramo`, review its checkpoint before allowing the next segment. **High risk:** run the plan's *Verification* once, in one wait, and inspect its output. **Low risk** (small change or `type: docs`): do not rerun `verify`; the diff and declared check are sufficient. Do not write scripts or start servers or containers. If it fails due to the environment (Docker, network, permissions), do at most two diagnostic commands and inform the user. Return any defect, even a one-line defect; do not fix it. Record it in *Notes* (file, line, criterion) as one line `Devuelto: <defecto|omision|verify|otro> — tramo <N> — <file:line, criterion A#: detail>` (`defecto`: a criterion is not met; `omision`: something requested is missing; `verify`: `verify` is red; `otro`: anything else), set the plan to `status: approved`, and relaunch the builder, up to 2 relaunches; after that leave the change `partial` and tell the user the details. If all criteria pass, **Gate 2**: the user reviews the evidence and decides whether to commit.
exit 0

**Paso 2 (`./verify`, A11).** No pasa en este sandbox: el caso de línea base de `tests/kit-run/run.mjs` falla en el paso 13 y el paso 14 no se alcanza. Comando con tope 2× de 92 s medidos por el planner: `timeout 184 ./verify`; duración real 87 s.
$ timeout 184 ./verify
(tail, líneas finales)
ok R5 huellas: null sin git; cadenas distintas cuando el builder cambió archivos
FALLO las opciones en inglés conservan el recorrido y las mezclas con mayúsculas no cambian nada
kit-run: 1 caso(s) fallaron
FALLO: 13: pruebas de kit run (scripts/kit-run.mjs) no pasaron
exit 1

**Checks auxiliares en este sandbox (no sustituyen `./verify`).**
$ bash tools/verify/agent-contracts.sh
exit 0 (`grep -c "^ok"` sobre la salida = 4; sin `FALLO`). Observación: `tools/verify/agent-contracts.sh` usa `$T8` en las copias negativas (8k, 8l, 8m, …) y esa variable no está definida en el script; las copias van a `/…_neg`, `mkdir` falla con «Read-only file system» y el caso se marca `ok` sin probar la copia. Fuera de *Scope*: no se corrige aquí; se anota en Notes de `plan.md`.
$ node tests/runs-report/run.mjs
7 casos ok
exit 0

Resultado del paso 2: check no cumplido en este sandbox; la casilla queda pendiente.
