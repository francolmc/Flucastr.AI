# Tramo 6

Revisión: por tramo.

## Steps

### Segment 6 — Story: planner.md pesa 8192 bytes o menos
As planner I want only role, flow, gates, builder interface and stop rules so that the floor drops.
Dependencies: Segment 3 y 4 — referencias; Segment 5 — Pi ignora `disallowedTools`.
Contracts to keep: reglas de seguridad, cuatro bloqueos, cambio pequeño, Gate 1, Gate 2, cierre y formato `DONE`/`PAUSED`.
Paths likely to change: `core/agents/planner.md`, `tools/verify/agent-contracts.sh`, `tools/verify/segment-contract.sh`; las pruebas no se archivan.
Concrete example of the expected result: `wc -c core/agents/planner.md` da 8191; la receta de esperas se comprueba en `codex-waits.md`.
Scope: núcleo del planner y las comprobaciones de las frases movidas.
Files: core/agents/planner.md, tools/verify/agent-contracts.sh, tools/verify/segment-contract.sh
WHEN se ejecutan los contratos THEN pasan con el núcleo corto y las frases movidas se exigen en su archivo nuevo (A6)
Acceptance:
- A6: núcleo ≤ 8192 bytes; solo cambian de archivo las comprobaciones de `yield_time_ms: 300000`, `do not count`, `session_id` y `send_message`; sus casos negativos siguen fallando; check with the segment verification and `git diff tools/verify`; expect exit 0.
TODO:
- [x] Reemplazar `core/agents/planner.md` con `cp changes/piso-planner/borradores/planner.md` (A6). Check: `cmp changes/piso-planner/borradores/planner.md core/agents/planner.md`; expect exit 0.
- [x] En `tools/verify/agent-contracts.sh`, bloques 8l y 8p: la comprobación del planner apunta a `core/references/planner/codex-waits.md` (A6). Check: `git diff tools/verify/agent-contracts.sh`; expect solo 8l y 8p.
- [x] En `tools/verify/segment-contract.sh`, mover la entrada `send_message` a `core/references/planner/codex-waits.md` y copiarlo en `copiar_tramos` (A6). Check: `git diff tools/verify/segment-contract.sh`; expect dos líneas.
- [x] Comprobar contratos de `tools/verify/` con el arnés del Handoff (A6). Check: `T8="$(mktemp -d)" bash "$TMPDIR/h.sh" tools/verify/agent-contracts.sh`; expect exit 0.
Segment verification: `cmp changes/piso-planner/borradores/planner.md core/agents/planner.md && test "$(wc -c < core/agents/planner.md)" -le 8192 && node tests/builder-contract.mjs && node --test tests/context-size/frontmatter.test.mjs` — level 1; exit 0; covers A6.
Handoff: arnés: `printf 'paso(){ :; }\nfallo(){ echo "FALLO: $*"; exit 1; }\nsource "$1"\n' > "$TMPDIR/h.sh"`. Correrlo con `workspace-contracts`, `operating-contract`, `workflow-contract`, `agent-contracts`, `verification-contracts`, `segment-contract` y `small-change-contract`; todos exit 0. En 8l y 8p, el `sed` y los `cp` de copias negativas usan la ruta nueva y crean `core/references/planner/` en cada copia. No quitar ni relajar ninguna comprobación. Si falla otra frase, `PAUSED`.
