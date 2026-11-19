---
status: done
branch: fix/codex-git-c-lectura
base: main
repos: [.]
executor: builder
type: code
---
# Que Codex pueda leer el estado Git de cada repo de un workspace

## Goal
En un workspace (p. ej. don financio) el agente de Codex debe poder ejecutar consultas Git de solo lectura en cada repo hijo sin que la revisión automática las rechace, manteniendo bloqueados commit, push, merge y PR.

## Exploration
- Causa raíz confirmada en la sesión de Codex del 2026-11-18: se rechazaron `git -C <repo> status --short --branch`; el mensaje era la justificación de la regla `["git","-C"]` de `adapters/codex/deny.mjs` («Lo hace el mantenedor: … commit, push, merge ni PR»).
- `prefix_rule` solo compara prefijos de tokens, sin comodines para la ruta, así que no se puede permitir `git -C <ruta> status` y prohibir `git -C <ruta> commit` con reglas por prefijo; «forbidden» gana sobre «allow».
- El propio kit contradice la regla: `core/skills/execute-plan/SKILL.md` (líneas 15, 16 y 18) manda usar `git -C <folder> …` para repos hijos.
- `docs/reglas-deny.md` ya registraba que `git -C`/`git -c` quedan bloqueados aunque no sean commit («aceptado»); en workspaces ese límite sí duele.
- Claude Code no se ve afectado: sus reglas son `git -C … commit`, no todo `git -C`.

## Evaluation
- A (recomendada): mantener el bloqueo de `git -C`/`git -c` (cierra el rodeo de commit) y quitar la necesidad: el kit manda ejecutar Git con el repo hijo como directorio de trabajo del comando (`workdir`/`cd`), nunca con `-C`; la justificación de esas dos reglas lo dice, para que el agente se corrija solo. Beneficio: sin debilitar la barrera. Costo: tres líneas de skill, un mensaje y pruebas.
- B: reglas por prefijo `git -C <ruta> commit|push|merge` por cada repo. Depende de cómo se escriba la ruta y es fácil de rodear; descartada.
- C: allow-list de `git -C … status`. No viable: forbidden gana sobre allow.

## Assumptions
- Codex acepta `workdir` por comando dentro del sandbox `workspace-write` abierto en la raíz del workspace, que contiene a los repos hijos.
- No se toca el comportamiento de Claude Code ni de Pi.

## Decisions already taken
- La persona usuaria pidió cubrir la causa de raíz en el kit, no pedir la salida a mano en cada sesión.
- Executor: builder (toca reglas de seguridad y pruebas, no es un cambio pequeño).

## Decisions
- Opción A, aprobada. Alcance: los tres agentes (Claude Code, Codex y Pi). La instrucción del skill es neutra («directorio de trabajo del comando»: `workdir` en Codex, `cd <repo> && git …` o equivalente en Claude Code y Pi), de modo que ninguno use `git -C`; el bloqueo de `-C`/`-c` es solo de Codex y Claude (Claude: `git -C … commit`, sin cambio).

## Validation
Aprobado por la persona usuaria, para Claude Code, Codex y Pi.

## Scope
Puede cambiar: `core/skills/execute-plan/SKILL.md`, `adapters/codex/deny.mjs`, `tests/permissions-v2.test.mjs`, `tests/permissions-contract/structure.test.mjs`, `tests/permissions-contract/generation.test.mjs`, `tools/verify/workspace-contracts.sh` (líneas 20 y 22 exigen hoy `git -C <folder>` en el skill: pasan a exigir la instrucción nueva y la ausencia de `git -C <`), `docs/reglas-deny.md`, `AGENTS.md` (solo la frase sobre `git -C`/`-c` en Codex).
Fuera: quitar o debilitar reglas deny, Claude Code, Pi, proyectos instalados, commit y PR.

## Verification
`./verify` — exit 0 y `VERIFY OK`.

## Stop conditions
Parar con nota si la misma causa falla dos veces o si hace falta tocar un archivo fuera del Scope.

## Steps

1. [x] `core/skills/execute-plan/SKILL.md`: reemplazar los tres usos de `git -C <folder> …` por «ejecuta `git …` con `<folder>` como directorio de trabajo del comando (para `.`, la raíz); no uses `git -C` ni `git -c`: están bloqueados». Comprobación: `git grep -n "git -C\|git -c" -- core` sin salida salvo esa advertencia.
2. [x] `adapters/codex/deny.mjs`: dar a `["git","-C"]` y `["git","-c"]` una justificación propia: «Git con -C/-c está bloqueado: ejecuta git con el repo como directorio de trabajo del comando (workdir) y sin -C/-c. Commit, push, merge y PR los hace el mantenedor.»; las demás reglas conservan la actual. Los `match` siguen igual. Comprobación: `node --test tests/permissions-contract/*.test.mjs` pasa.
3. [x] Pruebas: en `tests/permissions-contract/generation.test.mjs` afirmar que el archivo generado contiene la justificación nueva para `git -C` y `git -c` y que `git commit` sigue «forbidden»; en `structure.test.mjs` afirmar que ningún `.md` bajo `core/` instruye `git -C <` o `git -c ` salvo la línea de advertencia. Comprobación: ambas pasan, y fallan si se reintroduce `git -C <folder> status` en el skill.
4. [x] `tools/verify/workspace-contracts.sh`: ajustar las comprobaciones de las líneas 20 y 22 a la instrucción nueva (directorio de trabajo por repo, sin `git -C <`). Comprobación: el script pasa. Los `git -C` de scripts del kit (`tools/`) no se tocan: no los ejecuta un agente.
5. [x] `docs/reglas-deny.md` y `AGENTS.md`: actualizar la frase de Codex (`git -C`/`-c` bloqueados aunque no sean commit) para decir que el kit usa el directorio de trabajo del comando por repo y que el mensaje de rechazo lo indica. Comprobación: `git grep -n "aceptado" docs/reglas-deny.md` ya no afirma el límite como aceptado sin la salida.
6. [x] `./verify` completo en verde.

## Evidence

Paso 1:

$ git grep -n "git -C\|git -c" -- core
core/skills/execute-plan/SKILL.md:13:2. If the task includes `Branch:`, for each folder in the frontmatter's `repos:` and only those folders. Run every `git` command with `<folder>` as the command's working directory (for `.`, the root); never use `git -C` or `git -c`, which are blocked:
exit 0

Paso 2:

$ node --test tests/permissions-contract/*.test.mjs
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

Verificación adicional (generación y carga por Codex):

$ node scripts/resolver.mjs fijar-deny codex <scratchpad>/paso2/flucastr.rules <scratchpad>/paso2/AGENTS.md && grep -n -A1 'pattern = \["git","-[Cc]"\]' <scratchpad>/paso2/flucastr.rules
fijado
38:    pattern = ["git","-C"],
39:    decision = "forbidden",
--
45:    pattern = ["git","-c"],
46:    decision = "forbidden",
$ codex execpolicy check --rules <scratchpad>/paso2/flucastr.rules -- git -C /tmp/x status
{"matchedRules":[{"prefixRuleMatch":{"matchedPrefix":["git","-C"],"decision":"forbidden","justification":"Git con -C/-c está bloqueado: ejecuta git con el repo como directorio de trabajo del comando (workdir) y sin -C/-c. Commit, push, merge y PR los hace el mantenedor."}}],"decision":"forbidden"}
exit 0

Paso 3:

$ node --test tests/permissions-contract/*.test.mjs
✔ Codex explica en la justificación cómo ejecutar Git sin -C/-c, y git commit sigue prohibido
✔ ningún Markdown de core/ instruye git -C ni git -c; solo la advertencia del skill los nombra
ℹ tests 11
ℹ pass 11
ℹ fail 0
exit 0

Mutación temporal (revertida): se reintrodujo en core/skills/execute-plan/SKILL.md la línea «If `git -C <folder> status` already returns the requested branch, continue.».

$ node --test --test-name-pattern="ningún Markdown" tests/permissions-contract/structure.test.mjs
  + '/home/franco/Codes/flucastr/Flucastr.AI/core/skills/execute-plan/SKILL.md:    - If `git -C <folder> status` already returns the requested branch, continue.'
    actual: [ '/home/franco/Codes/flucastr/Flucastr.AI/core/skills/execute-plan/SKILL.md:    - If `git -C <folder> status` already returns the requested branch, continue.' ]
exit 1 (la prueba falla, como se esperaba)

Paso 4:

$ bash tools/verify/workspace-contracts.sh
tools/verify/workspace-contracts.sh: line 2: paso: command not found
ok 8a: workspace con dos hijos con .git -> find devuelve 2
ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin define-project o sin VERIFY_TARGET fallan la comprobación
exit 0

(La línea «paso: command not found» viene de la línea 2, que ya existía en HEAD; `./verify` define `paso` al llamar al script.)

Paso 5:

$ git grep -n "aceptado" -- docs/reglas-deny.md
exit 1 (sin coincidencias: el límite ya no figura como aceptado)

$ git grep -n "git -C\` y \`git -c\`" -- docs AGENTS.md
AGENTS.md:37: ... Codex (experimental) bloquea por prefijo lo mismo, salvo leer `.env` (ver «Límites de las reglas deny»); bloquea también `git -C` y `git -c` aunque no sean commit: ejecuta Git con el repo como directorio de trabajo del comando (workdir), no con esas opciones. ...
docs/reglas-deny.md:15: ... `git -C` y `git -c` quedan bloqueados aunque no sean commit; el kit no los usa, y el mensaje de rechazo indica ejecutar git con el repo como directorio de trabajo del comando (workdir). ...
exit 0

Paso 6 (verificación final, única corrida; la salida completa se guardó en un archivo y se muestra su cola):

$ ./verify
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
== 8t. small change: definición, riesgo y prácticas por tecnología ==
ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
exit 0

Tail de las pruebas de permisos (`node --test` dentro de `./verify`): `✔ Codex evalúa reglas directas y registra el límite de lectura de archivos`, `✔ comandos de lanzamiento declaran workspace-write y aprobaciones on-request`; `workspace-contracts` (paso 8): `ok 8a`, `ok 8b`. El log no contiene «not ok», «fallo» ni «✖».

## Notes
Residual fuera de Scope (no editado): `docs/guide.md:83` aún dice «(es aceptado)» sobre `git -C`/`git -c` en Codex; conviene alinearlo con `docs/reglas-deny.md` en un cambio aparte.

Después del merge: la persona usuaria reinstala (`bash install.sh --project <don-financio>`) para regenerar `.codex/rules/flucastr.rules` y corre `--migrate-names` si el proyecto aún usa los nombres viejos (`cambios/`).
