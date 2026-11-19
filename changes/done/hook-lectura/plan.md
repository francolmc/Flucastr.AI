---
status: done
branch: feature/hook-lectura
base: main
repos: [.]
executor: builder
type: code
---
# El hook de Bash no debe preguntar por comandos de solo lectura

## Goal
Que `grep`, `git branch`, `wc`, `ls` y similares (también con tuberías) se ejecuten sin confirmación, sin aflojar el bloqueo de commit, push, merge, `bash -c` ni secretos.

## Exploration
- Síntoma: `wc -l … && grep -n … | head -60` pide «Hook PreToolUse:Bash requires confirmation … requiere aprobación».
- Causa (`scripts/permissions-hook.mjs`, `decidir`): solo el comando de verificación declarado da `allow`; todo lo demás da `ask`, que fuerza la pregunta aunque haya reglas allow. `META` rechaza `|`, `&&`, comillas, así que ningún compuesto es «seguro». `.claude/settings.local.json` (generado por `instalar`) instala ese hook con `onFailure: block`; `settings.json` no tiene allow/ask.
- `tests/permissions-contract/hook.test.mjs` fija hoy ese `ask`.
- Reglas deny y sandbox son independientes del hook y se mantienen. Alcance elegido: kit completo.

## Evaluation
- A1 (recomendada, elegida): el hook decide solo lo que le importa: `allow` del comando declarado, `deny` de acciones protegidas; el resto sin decisión y rige el permiso normal de Claude Code. Riesgo medio (permisos); no afloja deny, sandbox ni commit/push/merge.
- A2: lista propia de solo lectura en el hook: más código, sin ventaja. B: quitar el hook: pierde allow y deny del hook. C: pedir todo: contradice el objetivo.

## Assumptions
- Que el permiso normal de Claude Code deje pasar grep/wc/head/git branch sin preguntar se comprueba con una prueba real tras reinstalar; si todavía preguntara, se añadirían reglas `permissions.allow` de solo lectura en `settings.json` (un archivo más en el alcance).
- Los comandos protegidos pasan de `ask` a `deny`; esto incluye `rm` fuera de `pruebas/.temporales` y `deploy`, que ya no se podrán aprobar desde el aviso. Si la persona usuaria prefiere `ask` para esos, cambia una línea.

## Decisions already taken
- Alcance: kit completo (respuesta de la persona usuaria).

- Opción A1 elegida por la persona usuaria («apruebo», 2026-11-19).
- Executor: builder, porque el cambio no es pequeño (seguridad/permisos, tests) y el plan cubre requisitos, contexto, comprobaciones con resultado esperado y no toca credenciales ni despliegue.

## Validation
La persona usuaria confirmó A1 y aprobó el plan (Gate 1) el 2026-11-19.

## Scope
- `scripts/permissions-hook.mjs` (solo `decidir`)
- `tests/permissions-contract/hook.test.mjs`
- `docs/reglas-deny.md` (una línea)
Fuera de alcance: `install.sh`, `.claude/settings*.json`, reglas deny, `accionProtegida`, `comandoSeguro`.

## Verification
`node --test tests/permissions-contract/*.test.mjs tests/permissions-v2.test.mjs && git diff --check` — exit 0.

## Stop conditions
Detenerse con nota si la misma causa falla dos veces, si hay que salir del Scope o si `tests/permissions-v2.test.mjs` exige cambiar algo fuera de él.

## Steps

### Segment 1 — Story: comandos de solo lectura sin confirmación del hook
As a user I want `grep`, `git branch` or `wc` (even piped) to run without the hook asking, so that I work uninterrupted while commit, push, merge and secrets stay blocked.
Dependencies: Not applicable.
Contracts to keep: el comando declarado y limpio en HEAD sigue dando `allow`; Read/Grep/Glob siguen sin pasar por el hook; `comandoSeguro` y `accionProtegida` no cambian.
Paths likely to change: ninguna ruta se mueve; `tests/permissions-contract/hook.test.mjs` se actualiza en el mismo tramo.
Concrete example of the expected result: `grep -n x AGENTS.md | head -5` → el hook no imprime nada (sin decisión); `git commit -m test` → `deny`.
Scope: `scripts/permissions-hook.mjs`, `tests/permissions-contract/hook.test.mjs`, `docs/reglas-deny.md`
Files: scripts/permissions-hook.mjs, tests/permissions-contract/hook.test.mjs, docs/reglas-deny.md
WHEN el comando Bash no es el declarado ni una acción protegida THEN el hook no emite decisión (A1)
WHEN el comando es una acción protegida (commit, push, merge, `gh pr create/merge`, secretos, `rm` fuera de `pruebas/.temporales`, deploy) THEN el hook emite `deny` (A2)
Acceptance:
- A1: un comando no declarado y no protegido da «sin decisión»; check with `node --test tests/permissions-contract/hook.test.mjs`; expect pasa con casos `grep -n x AGENTS.md | head -5`, `git branch`, `wc -l AGENTS.md`, `node verificacion/rapida.mjs --extra` y `npm run test` en «normal».
- A2: las acciones protegidas dan `deny`; check with el mismo test; expect `git commit -m test`, `git push`, `git merge main`, `gh pr create`, `vercel deploy` y `cat .env` en `deny`, y que `git status && git commit -m x` también.
- A3: el comando declarado sigue en `allow` con scripts limpios y pasa a «normal» (no `ask`) con scripts modificados, preparados o ausentes; check with el mismo test; expect pasa.
- A4: `docs/reglas-deny.md` describe el nuevo comportamiento; check with `rg -n "sin decisión" docs/reglas-deny.md`; expect una coincidencia.
TODO:
- [x] En `decidir` de `scripts/permissions-hook.mjs`, cambiar la rama final de Bash: si `accionProtegida(cmd)` devolver `respuesta("deny", "acción protegida: la hace la persona usuaria")`; si no, no devolver nada (A1, A2). Check: `node scripts/permissions-hook.mjs decision --project . <<< '{"tool_name":"Bash","tool_input":{"command":"git branch"}}'`; expect salida vacía.
- [x] En `scripts/permissions-hook.mjs`, mantener `allow` para `comandoSeguro` antes de esa rama y `ask` solo si `command` no es texto (A3). Check: leer `decidir`; expect esas dos ramas intactas.
- [x] En `tests/permissions-contract/hook.test.mjs`, cambiar a `"normal"` las expectativas `ask` de comandos no declarados (primer test) (A1). Check: `node --test tests/permissions-contract/hook.test.mjs`; expect ese test pasa.
- [x] En `tests/permissions-contract/hook.test.mjs`, añadir al primer test los casos de solo lectura `grep -n x AGENTS.md | head -5`, `git branch`, `wc -l AGENTS.md` esperando `"normal"` (A1). Check: mismo comando; expect pasa.
- [x] En `tests/permissions-contract/hook.test.mjs`, cambiar a `"normal"` las expectativas `ask` de scripts modificados, preparados o ausentes (segundo test) y el del ejecutable local editado (tercer test) (A3). Check: mismo comando; expect pasa.
- [x] En `tests/permissions-contract/hook.test.mjs`, en el cuarto test, cambiar `ask` a `deny`, renombrarlo («acciones protegidas… se deniegan») y añadir `git status && git commit -m x` esperando `deny` (A2). Check: mismo comando; expect pasa.
- [x] Sensibilidad en `scripts/permissions-hook.mjs`: revertir temporalmente la rama `deny` en `decidir` (devolver nada), correr `node --test tests/permissions-contract/hook.test.mjs`; expect rojo por `git commit -m test`; restaurar y expect verde (A2).
- [x] Añadir en `docs/reglas-deny.md`, junto a la línea 10, una línea: el hook solo autoriza el comando declarado y deniega acciones protegidas; para lo demás queda sin decisión y rige el permiso normal de Claude Code (A4). Check: `rg -n "sin decisión" docs/reglas-deny.md`; expect una coincidencia.
Segment verification: `node --test tests/permissions-contract/*.test.mjs tests/permissions-v2.test.mjs` — level 1; exit 0; covers A1, A2, A3, A4.
Handoff: no se toca `install.sh` ni `settings.json`. Tras mergear, la persona usuaria reinstala (`node scripts/permissions-hook.mjs instalar <proyecto>`) y prueba un `grep` real; si aún preguntara, se abre otro cambio con reglas `permissions.allow` de solo lectura.

## Evidence
- Paso 1 (`decidir`, rama final de Bash). Antes: `git branch` daba `ask` («comando no autorizado de forma segura; requiere aprobación»).
  $ node scripts/permissions-hook.mjs decision --project . <<< '{"tool_name":"Bash","tool_input":{"command":"git branch"}}'
  (salida vacía)
  exit 0
- Paso 2 (`decidir` sin cambios en `allow` ni en `ask` para entrada no textual). Lectura de `scripts/permissions-hook.mjs` líneas 244-257: `comandoSeguro` → `allow` (línea 250), `typeof cmd !== "string"` → `ask` (línea 249), `accionProtegida` → `deny` (línea 251), resto sin decisión (línea 253).
  $ (lectura de decidir)
  exit 0

- Pasos 3-6 (`tests/permissions-contract/hook.test.mjs`). Cambios: primer test `ask`→`normal` para `--extra`, `node -e`, `npm run test`; se añaden `grep -n x AGENTS.md | head -5`, `git branch`, `wc -l AGENTS.md` como `normal`; segundo y tercer test `ask`→`normal`; cuarto test `ask`→`deny`, renombrado «acciones protegidas de Bash se deniegan…», con `git status && git commit -m x` añadido. Corrección del fixture de `kit run` (ver Notes).
  $ timeout 120 node --test tests/permissions-contract/hook.test.mjs
  ✔ un ejecutable local sin extensión queda protegido frente a cambios (166.425207ms)
  ✔ acciones protegidas de Bash se deniegan; Read, Grep y Glob no pasan por el hook (330.885546ms)
  ✔ instala hooks sin pisar entradas ajenas, es idempotente y kit run exige esa política (612.0095ms)
  ✔ auditar enumera reglas allow amplias previas por archivo y avisa si no hay hook (51.760515ms)
  ℹ tests 6
  ℹ pass 6
  ℹ fail 0
  exit 0
- Paso 7 (sensibilidad). Con la rama `deny` desactivada temporalmente, el test de acciones protegidas falla por `git commit -m test`. Con la rama restaurada, pasa.
  $ timeout 120 node --test tests/permissions-contract/hook.test.mjs   (con la rama deny desactivada)
  ✖ acciones protegidas de Bash se deniegan; Read, Grep y Glob no pasan por el hook
  AssertionError [ERR_ASSERTION]: git commit -m test
  ℹ pass 5 / ℹ fail 1
  exit 1
  $ timeout 120 node --test tests/permissions-contract/hook.test.mjs   (rama restaurada)
  ℹ pass 6 / ℹ fail 0
  exit 0
- Paso 8 (A4, `docs/reglas-deny.md`). Línea 11 añadida tras la línea 10.
  $ rg -n "sin decisión" docs/reglas-deny.md
  11:- El hook solo autoriza el comando declarado y deniega acciones protegidas (commit, push, merge, `gh pr create/merge`, secretos, `rm` fuera de `pruebas/.temporales`, deploy); para los demás comandos Bash queda sin decisión y rige el permiso normal de Claude Code.
  exit 0
- Verificación final (`node --test tests/permissions-contract/*.test.mjs tests/permissions-v2.test.mjs && git diff --check`), única corrida final:
  ✔ Claude no autoriza el comando declarado si verify o el script rápido está modificado, preparado o ausente (332.328208ms)
  ✔ acciones protegidas de Bash se deniegan; Read, Grep y Glob no pasan por el hook (384.763872ms)
  ✔ instala hooks sin pisar entradas ajenas, es idempotente y kit run exige esa política (485.877721ms)
  ✔ auditar enumera reglas allow amplias previas por archivo y avisa si no hay hook (49.925408ms)
  ✔ sandbox Claude se fusiona, se reinstala y se retira sin tocar valores ajenos (1579.028808ms)
  ℹ tests 16
  ℹ pass 16
  ℹ fail 0
  exit 0
- Cuenta de pendientes (`awk` canónico sobre el plan): 0.
  exit 0
- Diferencia (`git diff --stat -- scripts tests docs`): `docs/reglas-deny.md` +1; `scripts/permissions-hook.mjs` +4/−1; `tests/permissions-contract/hook.test.mjs` +33/−16 (22 inserciones y 16 borrados en total).

## Notes
- Antes de empezar: no hay cambios en archivos rastreados respecto de `main` (`git diff --name-only main` sin salida). Los dotfiles sin rastrear de la raíz se ignoran según la instrucción recibida.
- Prueba preexistente inestable: `instala hooks sin pisar entradas ajenas…` (`tests/permissions-contract/hook.test.mjs`, cuarto test) falló una de tres corridas en la línea de `kit run` con `PAUSED … builder falló (spawnSync … EPIPE)`. Causa: los scripts falsos `builder.sh` y `revisor.sh` terminan sin leer el prompt que `tools/run/process.mjs` escribe por stdin; si el hijo sale antes, el envío da EPIPE. Corrección dentro de Scope: los dos fixtures consumen stdin (`cat >/dev/null`) antes de imprimir. No cambia lo que se verifica.
- Herramienta del entorno: un comando Bash que contiene el texto `git commit` (aunque sea dentro de una prueba) lo bloquea el hook de este proyecto; las comprobaciones se hacen con comandos separados.
- Decisión menor dentro de Scope: en `tests/permissions-contract/hook.test.mjs` se renombró el segundo test de «Claude pide aprobación si verify…» a «Claude no autoriza el comando declarado si verify…», porque ahora afirma `normal` y el nombre anterior quedaba contradictorio. No se tocó ninguna otra aserción fuera de las de los pasos 3 a 6.
- Dotfiles sin rastrear en la raíz (`.bashrc`, `.gitconfig`, `.idea`, etc.) no se tocaron ni se incluyen; `git diff --name-only main` no muestra cambios en archivos rastreados.
- Sin commit, push, PR ni merge: la rama `feature/hook-lectura` queda con los cambios sin confirmar para la persona usuaria.
- Handoff pendiente (fuera de este tramo, según el plan): tras reinstalar (`node scripts/permissions-hook.mjs instalar <proyecto>`), probar un `grep` real en Claude Code; el comportamiento de `normal` en la sesión real no se ha comprobado aquí.
