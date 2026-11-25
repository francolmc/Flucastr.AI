## Steps

### Segment 1 — Story: la receta de `session_id` está en los tres textos y protegida
As planner o builder en Codex I want una receta para esperar con `write_stdin` so that un `verify` largo pida permiso una vez, no decenas de veces.
Dependencies: Not applicable.
Contracts to keep: «Script running with cell ID N → una llamada `wait`, `yield_time_ms: 300000`», «one long wait» y «do not count» en `planner.md`; la regla «never loop with `sleep`, `tail`, or status polling».
Paths likely to change: ninguno se mueve; `tools/verify/agent-contracts.sh` gana un bloque al final.
Concrete example of the expected result: en `core/agents/builder.md`, la línea de comandos largos termina con «…`yield_time_ms: 300000`; if it returns a `session_id`, make one `write_stdin` call with empty `chars` and `yield_time_ms: 1800000`, and repeat only while the command still runs, never every few seconds».
Scope: `core/skills/execute-plan/SKILL.md`, `core/agents/builder.md`, `core/agents/planner.md`
Files: core/skills/execute-plan/SKILL.md, core/agents/builder.md, core/agents/planner.md
WHEN se leen `execute-plan` y `builder.md` THEN traen la receta con `session_id` y `1800000` (A1).
WHEN se lee `planner.md` THEN su viñeta de Codex trae `session_id` y ya no dice «empty `write_stdin`» como prohibido (A2).
WHEN una copia pierde `1800000` o `session_id` THEN el bloque 8p de `verify` falla (A3).
Acceptance:
- A1: receta en skill y builder; check with `grep -c '1800000' core/skills/execute-plan/SKILL.md core/agents/builder.md`; expect 1 en cada archivo.
- A2: receta en planner sin la contradicción; check with `grep -c 'session_id' core/agents/planner.md` y `grep -c 'empty `write_stdin`' core/agents/planner.md`; expect 1 y 0, y `grep -c '300000\|do not count\|one long wait' core/agents/planner.md` sigue siendo 3 o más.
- A3: el chequeo es sensible; check with `./verify` más la copia negativa del propio bloque; expect `ok 8p` y que las copias sin `1800000` / sin `session_id` fallen.
- A4: lo vecino no se rompe; check with `VERIFY_RAPIDO=1 ./verify`; expect exit 0, `ok 8k`, `ok 8l`, `ok 8p`.
TODO:
- [x] En `core/skills/execute-plan/SKILL.md` (línea 48), al final de la receta de Codex añade la frase de la receta (en inglés). (A1). Check: `grep -c '1800000' core/skills/execute-plan/SKILL.md`; expect 1.
- [x] En `core/agents/builder.md` (línea 30), añade la misma frase. (A1). Check: `grep -c '1800000' core/agents/builder.md`; expect 1.
- [x] En `core/agents/planner.md` (línea 62), añade la receta tras la de `wait` y cambia «Do not poll with `tail` or empty `write_stdin`» por «Do not poll with `tail` or repeated short `write_stdin` calls». (A2). Check: `grep -c 'session_id' core/agents/planner.md`; expect 1.
- [x] En `tools/verify/agent-contracts.sh`, al final añade el bloque `8p` con el patrón del 8l: función `textos_wstdin` que exige `1800000` y `session_id` en `execute-plan` y `builder.md`, y `session_id` en `planner.md`; copias negativas con `sed` (sin `1800000`; sin `session_id`) que deben fallar con `fallo`. (A3). Check: `grep -c '^# 8p' tools/verify/agent-contracts.sh`; expect 1.
- [x] Corre `VERIFY_RAPIDO=1 ./verify` y pega la cola en *Evidence*. (A4). Check: `VERIFY OK` en la salida; expect exit 0.
Segment verification: `VERIFY_RAPIDO=1 ./verify` — level 2; exit 0 (≈1 min 33 s medido el 2026-11-25 en esta máquina); covers A1–A4.
Handoff: la receta se escribe en inglés (instrucciones operativas) y el bloque de `verify` en español como los vecinos. No toques las frases de los bloques 8k y 8l. Al terminar el tramo, deja el checkpoint (archivos, resumen del diff, resultado) en *Notes* y sigue al tramo 2.


## Evidence
$ grep -c '1800000' core/skills/execute-plan/SKILL.md core/agents/builder.md
1
1
exit 0

$ grep -c 'session_id' core/agents/planner.md; grep -c 'empty `write_stdin`' core/agents/planner.md; grep -c '300000\|do not count\|one long wait' core/agents/planner.md
1
0
3
exit 0

$ grep -c '^# 8p' tools/verify/agent-contracts.sh
1
exit 0

$ VERIFY_RAPIDO=1 timeout 180s ./verify   (salida completa en $TMPDIR/verify-t1.log; cola y líneas 8k, 8l, 8p)
ok 8k: planner con «You may create or edit only files», «APPROVED», «do not fix it» y «one long wait»; copias sin la lista o con la frase vieja fallan
ok 8l: planner con «yield_time_ms: 300000» y «do not count»; copia sin la receta falla
ok 8m: ambos agentes declaran adaptación al idioma y salida española; copia sin la regla falla
ok 8p: receta de write_stdin con «session_id» y «1800000» en execute-plan y builder, «session_id» en planner; copias sin «1800000» o sin «session_id» fallan
...
ok 19: escaneo de stdin pasó sobre el repo y falló como se esperaba en las dos fixtures
ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
exit 0
