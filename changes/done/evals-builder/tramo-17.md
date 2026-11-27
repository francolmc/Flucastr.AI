## Steps

### Segment 17 — Story: uso actualizado
As persona que corre la base I want la documentación al día so that no use carpetas ni campos viejos.
Dependencies: Segment 16 — pruebas ocultas.
Contracts to keep: comandos y códigos de salida existentes.
Paths likely to change: `evals/builder/README.md`.
Concrete example of the expected result: README: pruebas ocultas, `oraculo_pasa`, contrato en tramos K, excluidos y salida nueva tras cambiar el corpus.
Scope: los archivos de *Files* y sus pruebas en `tests/evals-builder/`.
Files: evals/builder/README.md
WHEN se lee el README THEN coincide con el código (A11)
Acceptance:
- A11: el README describe D-34 a D-37, que hay que recalibrar y usar carpetas de salida nuevas, y el humo `--tramos K-02,P1-03`; sin restos de `pruebas_alteradas` (check with `node --test tests/evals-builder/*.test.mjs && timeout 398 ./verify`; expect exit 0).
TODO:
- [x] En `evals/builder/README.md`, actualizar uso, métricas y límites (A11). Check: `rg -n 'oraculo_pasa|excluido|K-02,P1-03' evals/builder/README.md`; expect las tres.
Segment verification: `timeout 300 node --test tests/evals-builder/*.test.mjs && timeout 398 ./verify` — level 3; exit 0; covers A11, A14–A17.
Handoff: límite a declarar: `calibrar` no corre dentro del sandbox de Codex, así que aún pueden salir pares `entorno`; quedan justo 10 tramos. No corras el banco sobre los repos reales ni leas `local.json` para la evidencia.

## Evidence

## Notes
