## Steps

### Segment 2 — Story: contrastar git contra el Scope
As planner I want `kit-scope` to list files out of Scope, untouched Scope files and forbidden files, so that I see omissions and strays before reviewing.
Dependencies: Segment 1 — `parsearAlcance`, `clasificarRuta` e `informe.mjs`.
Contracts to keep: solo lectura sobre el repo analizado (solo `git diff`, `git status`, `git merge-base`, `git rev-parse`, `git show`); salida y códigos de `informe.mjs`.
Paths likely to change: `tools/check/cambios.mjs` (nuevo), `scripts/kit-scope.mjs` (nuevo), `tests/kit-scope/run.mjs` (nuevo; puede moverse dentro de `tests/kit-scope/`).
Concrete example of the expected result: repo temporal con Scope `src/a.mjs`; el builder toca `src/a.mjs` y `otro.txt` → fila `error  fuera de Scope  otro.txt`, exit 1. Si solo toca `src/a.mjs` → exit 0.
Scope: `tools/check/cambios.mjs`, `scripts/kit-scope.mjs`, `tests/kit-scope/run.mjs`.
Files: tools/check/cambios.mjs, scripts/kit-scope.mjs, tests/kit-scope/run.mjs
WHEN todos los cambios están en Scope THEN exit 0 y tabla sin errores (A1).
WHEN hay un archivo fuera de Scope THEN fila `error` y exit 1 (A2).
WHEN un archivo del Scope no se tocó THEN fila `aviso` «posible omisión» sin cambiar el exit (A3).
WHEN se toca `.env`, una llave, un lockfile no autorizado o el propio plan THEN fila `error` «prohibido» (A4).
WHEN la base no existe, no es repo git o el Scope no es parseable THEN `no_verificable` y exit 3, nunca 0 (A5).

#### Cómo se obtienen los cambios
Por cada carpeta de `repos:` (`[.]` = raíz): base = `base:` (mapa por carpeta si lo es) → `origin/HEAD` → `main`/`master`; `git rev-parse --verify <base>^{commit}` falla → `no_verificable` («base inexistente»). Cambios = unión sin duplicados de `git diff --name-only -z <merge-base> HEAD`, `git diff --name-only -z` (sin confirmar) y `git status --porcelain -z` (incluye sin seguimiento y renombres con ambos nombres). Rutas se prefijan con la carpeta del repo para comparar con el Scope. Se permiten siempre `changes/<nombre>/**` (plan, `progress.jsonl`, `runs.jsonl`) salvo lo de A4.
- «El propio Scope/Aceptación del plan»: si `changes/<nombre>/plan.md` está en git, se compara el texto de sus secciones `## Scope` y `A#` contra `git show <merge-base>:<plan>`; si cambió → `error` «prohibido: plan». Si el plan es nuevo en la rama (no existe en la base) → `no_verificable` («sin versión previa»). No se compara contra el tramo.
- Omisión: cada ruta incluida exacta (sin glob ni carpeta) que no aparece en los cambios → `aviso`. Globs y carpetas se avisan solo si no tocan ninguna ruta.

Acceptance:
- A1: dentro de Scope da exit 0 y ninguna fila error; check with `node tests/kit-scope/run.mjs`; expect exit 0 y caso «dentro».
- A2: fuera de Scope da `error` y exit 1; check with el mismo comando; expect caso «fuera» correcto.
- A3: omisión da `aviso` con exit 0; check with el mismo comando; expect caso «omisión» correcto.
- A4: `.env`, `*.pem`, lockfile no autorizado y plan alterado dan `error`; check with el mismo comando; expect casos «prohibido» y «lockfile autorizado = ok».
- A5: base inexistente, fuera de git o Scope vacío dan exit 3; check with el mismo comando; expect casos «base», «sin Scope», «sin git».

TODO:
- [x] Crear `tools/check/cambios.mjs` con `cambiosDelRepo(carpeta, base)` (solo comandos git de lectura, sin shell, `execFileSync`). Check: `node --check tools/check/cambios.mjs`; expect exit 0 (A1, A5).
- [x] Crear `scripts/kit-scope.mjs <plan> [--base <rama>] [--json]` que lee `repos:`/`base:`, une Scope de índice y tramos ≤ `segment:`, y emite el informe. Check: `node scripts/kit-scope.mjs changes/kit-scope-close/plan.md --json`; expect JSON válido y exit 0, 1 o 3 (A1–A5).
- [x] Crear `tests/kit-scope/run.mjs` con repos git temporales en `$TMPDIR` (patrón `tests/kit-run/run.mjs`) y los cinco casos de arriba. Check: `node tests/kit-scope/run.mjs`; expect exit 0 (A1–A5).
- [x] Prueba de no escritura: en el caso «dentro», comparar `git status --porcelain` y el hash de `.git/index` antes y después. Check: `node tests/kit-scope/run.mjs`; expect caso «no escribe» correcto (A1).
- [x] Sensibilidad: quitar de un fixture una exclusión y comprobar que «fuera» deja de dar error (el test debe fallar). Check: `node tests/kit-scope/run.mjs`; expect fallo sin la exclusión (A2).
Segment verification: `node tests/kit-scope/run.mjs` — level 1; exit 0; covers A1, A2, A3, A4, A5. Medir la primera corrida (`time`) y anotarla en Evidence.
Handoff: el repo real muestra archivos sin seguimiento ajenos (`.bashrc`, `.idea`…): se informan como fuera de Scope, sin filtro. Dentro del sandbox `git fetch` falla; no usarlo, solo git local. Si `git status` da rutas con comillas, usar `-z`. No leer `.env`: solo nombrar la ruta.
