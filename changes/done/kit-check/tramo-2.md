## Steps

### Segment 2 — Story: ejecutar comprobaciones bajo la política del hook

As a planner, I want each check run only if the permissions-hook policy allows it, with a timeout and redacted output, so that the tool can run plan commands without running protected actions.

Dependencies: Segment 1 (`parsearPlan`, forma de fila).
Scope: `scripts/permissions-hook.mjs` solo para exportar `accionProtegida` y `META` y proteger su `main` con `import.meta.url`; sin cambiar la política. Nada más del hook.
Files: `scripts/permissions-hook.mjs`, `tools/check/ejecutar.mjs`, `tests/kit-check/ejecutar.test.mjs`.

Contract: `ejecutarFila(fila, { timeoutMs })` devuelve `{ estado, comando, codigo, salida, motivo }`. `estado`: `pasa`|`falla`|`no-automatizable`|`bloqueado`. Sin shell: se tokeniza con comillas simples/dobles y se usa `spawn` sin shell; cualquier metacarácter fuera de comillas (`META`) o `accionProtegida(comando)` verdadero → `bloqueado` y no se ejecuta. Esperado automatizable: `exit N`/`rc N`/`código N`, `falla`/`rc≠0`, `contiene «X»`; otro texto → `no-automatizable` aunque el comando salga 0 (sin ejecutarlo si es ambiguo). `salida`: cola de 20 líneas pasada por `redactar` y `truncar` de `tools/progress/eventos.mjs`. Timeout → `falla` con motivo. Siempre devuelve `comando`.

Example: `rm -rf /` → `bloqueado`; `git commit -m x` → `bloqueado`; `node -e "process.exit(3)"` con esperado `exit 3` → `pasa`; `echo a | cat` → `bloqueado` (operador).

WHEN el comando sale con el código esperado THEN `pasa` (A1).
WHEN sale con otro código o excede el timeout THEN `falla` (A2).
WHEN el comando es una acción protegida o tiene operador de shell THEN `bloqueado` y NO se ejecuta (se prueba con un archivo testigo que no aparece) (A3).
WHEN el esperado es ambiguo o falta comando THEN `no-automatizable`, nunca `pasa` (A4).
WHEN la salida contiene una llave o supera 20 líneas THEN sale redactada y truncada a la cola (A5).
WHEN se importa el hook THEN no ejecuta su `main`, y sus pruebas existentes siguen verdes (A6).

Acceptance:
- A1: código esperado da `pasa`; check with `node --test --test-name-pattern=pasa tests/kit-check/ejecutar.test.mjs`; expect exit 0.
- A2: otro código o timeout da `falla`; check with `node --test --test-name-pattern=falla tests/kit-check/ejecutar.test.mjs`; expect exit 0.
- A3: protegido u operador da `bloqueado` sin ejecutar; check with `node --test --test-name-pattern=bloqueado tests/kit-check/ejecutar.test.mjs`; expect exit 0.
- A4: ambiguo da `no-automatizable`; check with `node --test --test-name-pattern=ambiguo tests/kit-check/ejecutar.test.mjs`; expect exit 0.
- A5: salida redactada y truncada; check with `node --test --test-name-pattern=salida tests/kit-check/ejecutar.test.mjs`; expect exit 0.
- A6: el hook sigue igual; check with `node --test tests/permissions-contract/*.test.mjs`; expect exit 0.

TODO:
- [x] Medir y anotar en `changes/kit-check/plan.md` (Notes) la duración de `node --test tests/permissions-contract/*.test.mjs` (línea base de parada). Check: el mismo comando.
- [x] Escribir `tests/kit-check/ejecutar.test.mjs` para A1–A5 (A1, A2, A3, A4, A5) con comandos `node -e` y archivo testigo; deben fallar antes. Check: `node --test tests/kit-check/ejecutar.test.mjs` (falla).
- [x] En `scripts/permissions-hook.mjs`: exportar `accionProtegida` y `META` y guardar `main` con `import.meta.url`; ejecutar como script debe comportarse igual (A6). Check: `node --test tests/permissions-contract/*.test.mjs`.
- [x] Implementar `tools/check/ejecutar.mjs` importando esa política (no copiarla). Check: `node --test tests/kit-check/ejecutar.test.mjs`.

Segment verification: `node --test tests/kit-check/*.test.mjs tests/permissions-contract/*.test.mjs` (nivel 2).
Handoff: `ejecutarFila` y los cuatro estados quedan fijos para el tramo 3. Si la guarda de `main` cambia el comportamiento del hook, parar y anotar.
