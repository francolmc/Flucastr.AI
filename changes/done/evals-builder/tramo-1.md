## Steps

### Segment 1 — Story: corpus versionado y anónimo
As persona dueña del kit I want una lista fija de tramos so that dos corridas midan lo mismo.
Dependencies: External — `changes/evals-builder/corpus.md` y el mapa local indicado en Handoff.
Contracts to keep: D-05.
Paths likely to change: `evals/builder/corpus.json`, `.gitignore`, `tests/evals-builder/corpus.test.mjs`.
Concrete example of the expected result: entrada `{"id":"K-02","alias":"K","tramo":1,"base":"015d31413c","referencia":"9f1ede7ce4","archivos":3,"lineas":61,"estado":"calibrado","verificacion_en":"raiz","preparacion":[],"env":{},"manifiestos_referencia":false}`.
Scope: `evals/builder/corpus.json`, `.gitignore`, su prueba.
Files: evals/builder/corpus.json, .gitignore, tests/evals-builder/corpus.test.mjs
WHEN se lee el corpus THEN trae 16 tramos sin nombres ni rutas privadas (A1)
Acceptance:
- A1: 10 `calibrado` y 6 `reserva`, IDs únicos, solo claves permitidas, sin rutas absolutas, `cambio` solo en `K`, y `local.json` ignorado; check with `node --test tests/evals-builder/corpus.test.mjs`; expect exit 0.
TODO:
- [x] Crear `tests/evals-builder/corpus.test.mjs` (A1). Check: `node --test tests/evals-builder/corpus.test.mjs`; expect rojo sin corpus.
- [x] Crear `evals/builder/corpus.json` desde `changes/evals-builder/corpus.md` (A1). Check: la prueba; expect 16 entradas.
- [x] Añadir `evals/builder/local.json` a `.gitignore` (A1). Check: `git check-ignore evals/builder/local.json`; expect exit 0.
- [x] Después del paso anterior, escribir `evals/builder/local.json` (no versionado) desde el mapa (A1). Check: `git status --porcelain evals/builder`; expect que no lo liste.
- [x] Corregir `repo_codigo` en `evals/builder/local.json` (A1). Check: por cada ID, `git cat-file -e` de `base` y `referencia` con esa carpeta como directorio de trabajo; expect 16 de 16. (Usado `git rev-parse --verify --quiet <hash>^{commit}`: `cat-file` queda fuera de las lecturas permitidas al builder; ver D-10.)
- [x] Quitar nombres de proyectos de `tests/evals-builder/corpus.test.mjs` (A1, D-05). Check: `node --test tests/evals-builder/corpus.test.mjs`; expect exit 0.
Segment verification: `node --test tests/evals-builder/corpus.test.mjs` — level 1; exit 0; covers A1.
Handoff: mapa en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/efaf2fa6-7441-4184-ab0d-9ab82c554ace/scratchpad/mapa-corpus.md`; si no existe, `PAUSED motivo=access`. `repo_codigo` es el nombre exacto de la subcarpeta, dentro del repo del alias, cuyo Git contiene `base` y `referencia`. Forma de `local.json`: `{"repos":{"P1":"<ruta>"},"tramos":{"P1-01":{"cambio":"<carpeta>","repo_codigo":"<subcarpeta o .>"}}}`. `verificacion_en` es `codigo` solo en P1-01. P1-01: `preparacion` `["pnpm install --ignore-scripts"]`, `manifiestos_referencia` true. P1-02: además `npx --no-install prisma generate` y `env.DATABASE_URL` ficticia, no secreta. Reservas: P1-03 y P1-04 como P1-02; P1-05 sin preparación; P3-01 sin preparación; P3-02 y P3-03 como P1-01.

## Evidence
