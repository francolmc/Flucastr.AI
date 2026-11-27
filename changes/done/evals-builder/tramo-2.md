## Steps

### Segment 2 — Story: copia aislada de un tramo
As runner I want un repo desechable en el estado previo al tramo so that el builder no vea la solución.
Dependencies: Segment 1 — formato del corpus.
Contracts to keep: D-03, D-04; solo lectura del repo fuente.
Paths likely to change: `evals/builder/lib/copia.mjs`, `tests/evals-builder/copia.test.mjs`.
Concrete example of the expected result: tramo 2 en repo hijo → raíz y subcarpeta, cada una con un solo commit en `main` y rama `feature/bench`.
Scope: `evals/builder/lib/copia.mjs` y su prueba.
Files: evals/builder/lib/copia.mjs, tests/evals-builder/copia.test.mjs
WHEN se prepara un tramo THEN la copia tiene base, archivos de tramos previos y oráculo, sin historia ni secretos (A2)
Acceptance:
- A2: un commit por repo, fuente intacta, sin `changes/<cambio>` ni `changes/done/<cambio>`, sin `.env*` (salvo `.env.example`) ni `*.pem`/`*.key`, hashes del oráculo devueltos; check with `node --test tests/evals-builder/copia.test.mjs`; expect exit 0.
TODO:
- [x] Probar con repos falsos en `tests/evals-builder/copia.test.mjs`, incluido workspace con repo hijo (A2). Check: la prueba; expect rojo. (Rojo antes de crear `copia.mjs`: `Cannot find module`, exit 1.)
- [x] Extraer con `git archive`, hacer commit sintético sin hooks e identidad local en `evals/builder/lib/copia.mjs` (A2). Check: la prueba; expect un commit por repo. (Pruebas 1 y 2 en verde.)
- [x] Superponer tramos previos y pruebas de referencia en `evals/builder/lib/copia.mjs` (A2). Check: la prueba; expect contenidos y hashes. (Prueba 4 en verde.)
- [x] Borrar la copia ante error en `evals/builder/lib/copia.mjs` (A2). Check: caso de fallo; expect sin restos. (Pruebas 5 y 6 en verde.)
Segment verification: `node --test tests/evals-builder/copia.test.mjs` — level 1; exit 0; covers A2.
Handoff: base de la raíz en tramos de repo hijo = último commit de la raíz anterior a la fecha de la referencia; excluir la subcarpeta en `.git/info/exclude`. Previos = `Files:` de los tramos < N, tomados de la referencia, salvo los del tramo N. Oráculo = archivos añadidos o modificados base..referencia con ruta de prueba (`(^|/)(tests?|e2e|verification|verificacion|pruebas|__tests__)/`, `.(spec|test|e2e-spec).ext`, `(^|/)test[_-]`), sin `.md` ni los de `Files:`; más las pruebas que cite la verificación y falten, tomadas de `HEAD`. Nombre de la carpeta raíz: `bench-<corrida>-<ID>-r<k>`. Referencia de conducta: `corpus.md`.

## Evidence
