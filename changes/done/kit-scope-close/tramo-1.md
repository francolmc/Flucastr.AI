## Steps

### Segment 1 — Story: informe común y Scope interpretable
As planner I want one output format and a Scope parser that says "no verificable" instead of passing, so that both scripts report the same way and never give a false green.
Dependencies: Not applicable.
Contracts to keep: `tools/check/parse.mjs` y `scripts/kit-check.mjs` no cambian; solo se importan.
Paths likely to change: `tools/check/informe.mjs` (nuevo), `tools/check/alcance.mjs` (nuevo), `tests/kit-scope/alcance.test.mjs` (nuevo; puede moverse dentro de `tests/kit-scope/`).
Concrete example of the expected result: el texto `Producto: \`a/b.mjs\` (nuevo), \`t/**\`. Fuera: \`core/\`.` da incluidas `a/b.mjs` y `t/**`, excluida `core/`; `a/b.mjs` → dentro, `core/x.md` → excluido, `z.txt` → fuera.
Scope: `tools/check/informe.mjs`, `tools/check/alcance.mjs`, `tests/kit-scope/alcance.test.mjs`.
Files: tools/check/informe.mjs, tools/check/alcance.mjs, tests/kit-scope/alcance.test.mjs
WHEN el builder llama `parsearAlcance(textoPlan)` THEN devuelve `{estado, incluidas, excluidas}` con `estado` ∈ `ok | no_verificable` y motivo (A1, A2, A3).
WHEN se arma un informe con filas error/aviso/no_verificable/ok THEN la tabla y el JSON dan el mismo código de salida (A4).

#### Cómo se interpreta el Scope (contrato del parser)
1. Se toma la sección `## Scope` o `## Alcance` (hasta el siguiente `## `). Sin sección, o sin ninguna ruta en acentos graves: `no_verificable` (motivo «sin Scope» / «Scope sin rutas»).
2. Cada token entre acentos graves con `/` o con extensión conocida (`.mjs .js .sh .md .json .yml .test…`) es una ruta. Los demás (`./verify`, comandos con espacios, palabras) se ignoran. `./verify` se normaliza a `verify`.
3. Las anotaciones entre paréntesis tras la ruta (`(nuevo)`, `(líneas 20 y 22)`, `(solo la lista X)`) se ignoran. Una ruta con `(solo …)` o `(líneas …)` cuenta como incluida **completa**: el parser no mira dentro del archivo; el motivo queda en el informe como aviso «parcial», no como error.
4. Forma: `dir/` = prefijo; `dir/**` o `*.ext` = glob (`*` sin `/`, `**` con `/`); resto = archivo exacto.
5. Exclusión: tokens en una línea (o párrafo hasta línea en blanco) que empieza o contiene `Fuera`, `No tocar`, `No modificar`, `Out of scope`, `Excluded`. Gana la regla de prefijo más largo; en empate, la exclusión.
6. Prohibidas fijas (A5, tramo 2): `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa*`, lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, `Cargo.lock`, `poetry.lock`) salvo que el Scope los nombre.
7. Por tramo: si un `tramo-N.md` linkeado declara `Scope:`/`Files:`, esas rutas se **suman** a las del índice solo para el segmento ≤ `segment:` del frontmatter.

Casos que quedan `no_verificable`: sin sección Scope; Scope sin rutas; Scope solo con carpetas genéricas tipo `.` o `/`; una exclusión que cubre todo lo incluido; ruta con `..` o absoluta fuera del repo; token con `{a,b}` o `!` (no se expanden).

Acceptance:
- A1: Scope bien formado da incluidas y excluidas correctas; check with `node --test tests/kit-scope/alcance.test.mjs`; expect exit 0 y casos «exacta, carpeta, glob, exclusión más larga, empate».
- A2: sin sección o sin rutas da `no_verificable`, nunca `ok`; check with el mismo test (casos «sin Scope», «sin rutas», «todo excluido»); expect exit 0.
- A3: rutas con `..`, absolutas o llaves dan `no_verificable` con motivo; check with el mismo test; expect exit 0.
- A4: el informe reparte el código 0/1/3 según filas y `--json` repite las mismas filas; check with `node --test tests/kit-scope/alcance.test.mjs` (casos «informe»); expect exit 0.

TODO:
- [x] Medir la base: `time node tests/kit-check/run.mjs` y anotar en Evidence. Check: `$ time node tests/kit-check/run.mjs`; expect exit 0.
- [x] Crear `tools/check/informe.mjs` con `crearInforme(filas)`, `tabla(informe)` y `codigoSalida(informe)` (0 / 1 / 3). Check: `node --check tools/check/informe.mjs`; expect exit 0 (A4).
- [x] Crear `tools/check/alcance.mjs` con `parsearAlcance(texto)` y `clasificarRuta(ruta, alcance)` (`dentro | fuera | excluida | prohibida`). Check: `node --check tools/check/alcance.mjs`; expect exit 0 (A1, A2, A3).
- [x] Crear `tests/kit-scope/alcance.test.mjs` con los casos de A1–A4, incluidos los textos reales de `changes/done/kit-check/plan.md` y de un plan con `Fuera:` (leídos como fixture, no copiados). Check: `node --test tests/kit-scope/alcance.test.mjs`; expect exit 0 (A1–A4).
- [x] Sensibilidad: borrar en un fixture la línea `Fuera:` y comprobar que el test «exclusión» falla; restaurar. Check: `node --test tests/kit-scope/alcance.test.mjs`; expect fallo sin la línea y exit 0 con ella (A1).
Segment verification: `node --test tests/kit-scope/alcance.test.mjs` — level 1; exit 0; covers A1, A2, A3, A4.
Handoff: no hay git en este tramo; son funciones puras sobre texto. El estilo (ESM, sin dependencias, mensajes en español) sigue `tools/check/parse.mjs`. Si una regla del contrato es ambigua, elegir «no_verificable» y anotarlo en `## Decisions`.
