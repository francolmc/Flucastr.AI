---
status: done
branch: chore/estandarizar-ingles
base: main
repos: [.]
executor: builder
segment: 8
continuity: continuous
type: code
---
# Estandarizar el kit en inglés (nombres, claves y marcadores)

## Goal
Que todo nombre operativo del kit (carpetas, archivos, scripts, claves y secciones del plan, marcadores de retorno, claves de `modelos.json`, nombres de agentes y alias) esté en inglés y sin copias ni alias en español. La documentación (`docs/`, `README.md`, planes archivados) conserva su texto en español.

## Exploration
- Quedan copias en español atadas por `tools/core-compatibility.json`: `agentes/`, `skills/`, `nucleo/` y `pruebas/aceptacion/` (duplica `tests/acceptance/`). Referencias: 37, 39, 10 y 33 archivos.
- Otros nombres en español: `pruebas/` (109 archivos), `cambios/` (69 referencias, 64 carpetas archivadas), `friccion.md`, `PENDIENTES.md`, `instalar.sh`, `desinstalar.sh`, `instalar-remoto.sh`, `scripts/observar.mjs`, `scripts/uso.mjs` y las opciones en español de los comandos.
- Contratos en español fuera de `old/` y `cambios/hechos/`: `COMPLETADO` (21 archivos), `PAUSA` (35), `APROBADO` (11), `DEVUELTO` (14), claves del plan `estado:` (45), `tramo` (50), `continuidad` (17), `ejecutor` (35), secciones `## Alcance` (27), `## Evidencia` (16), `## Verificación` (16), nombres `principal` (68) y `constructor` (83), claves `niveles`/`alto`/`medio`/`bajo` de `modelos.json` (13).
- Lo leen `scripts/revisar-plan.mjs`, `scripts/kit-run.mjs`, `tools/run/*`, `tools/verify/*`, los adaptadores y los instaladores.
- No se tocan: `old/`, el contenido de `cambios/hechos/`, `LICENSE` y las excepciones de `cambios/hechos/idioma-adaptable/excepciones.md`.

## Evaluation
Opción recomendada: renombrar por áreas, de menor a mayor riesgo, con una comprobación mecánica por tramo (`git grep` sin el nombre viejo) y un migrador al final para proyectos instalados. Descartado: dejar alias (la persona usuaria pidió corte directo) y reescribir el texto de la documentación.

## Assumptions
- Mapa de nombres: `principal`→`planner`, `constructor`→`builder`, `tramo`→`segment`, `estado`→`status`, `rama`→`branch`, `ejecutor`→`executor`, `continuidad`→`continuity` (`continua`→`continuous`), `tipo`→`type` (`codigo`→`code`), `COMPLETADO`/`PAUSA`→`DONE`/`PAUSED`, `APROBADO`/`DEVUELTO`→`APPROVED`/`RETURNED`, `alto`/`medio`/`bajo`→`high`/`medium`/`low`, `niveles`→`levels`.
- Nombres de skills (decisión del principal, coincide con «todo en inglés»): `planificar-cambio`→`plan-change`, `ejecutar-plan`→`execute-plan`, `preparar-proyecto`→`prepare-project`, `definir-proyecto`→`define-project`, `migrar-proyecto`→`migrate-project`, `diagnosticar`→`diagnose`, `disenar-experiencia`→`design-experience`; el `name:` del frontmatter de cada `core/skills/*/SKILL.md` pasa a ser el de su carpeta.
- Estados del plan en inglés: `borrador`→`draft`, `aprobado`→`approved`, `parcial`→`partial`, `listo`→`done`.
- Secciones del plan: `Alcance`→`Scope`, `Evidencia`→`Evidence`, `Verificación`→`Verification`, `Pasos`→`Steps`, `Notas`→`Notes`, `Objetivo`→`Goal`, `Exploración`→`Exploration`, `Evaluación`→`Evaluation`, `Supuestos`→`Assumptions`, `Decisiones`→`Decisions`, `Validación`→`Validation`.
- Mapa de carpetas: `pruebas/`→`tests/` (subcarpetas: `contrato-constructor`→`builder-contract`, `permisos-contrato`→`permissions-contract`, `revisar-plan`→`review-plan`, `uso`→`usage`, `continuidad`→`continuity`, `diagnostico-sugiere`→`diagnosis-suggests`, `revisor-luna`→`luna-reviewer`), `cambios/`→`changes/` (`hechos/`→`done/`, `HISTORY.md` se conserva), `friccion.md`→`friction.md`, `PENDIENTES.md`→`TODO.md`.
- Los 6 planes en curso de `cambios/` (cola-docker, kit-run, proceso-rapido, prueba-informe, una-espera-write-stdin, verificacion-general) se migran con el mismo mapa.
- Los planes archivados en `cambios/hechos/` solo cambian de ruta, no de texto.
- La documentación (`README.md`, `AGENTS.md`, `docs/`, `tests/README.md`, `TODO.md`, `friction.md`, `evals/README.md`) queda en español pero actualizada con los nombres, rutas, comandos y marcadores nuevos (tramo 6). Los textos históricos (`docs/evaluaciones/`, `docs/investigaciones/`, `changes/done/`) solo actualizan rutas y enlaces para no romperse; sus citas literales se conservan.

## Decisions already taken
- La persona usuaria eligió: todo en inglés menos el texto de la documentación; nombres `planner/builder`; renombrar nombres de documentos sin reescribir su texto; migrador incluido; sin alias en español.
- Executor: builder, because the change is mechanical and spans several segments.

## Decisions
- Los tramos exceden tres archivos de producto porque son renombres mecánicos; cada uno se acota por una comprobación de `git grep` y por `./verify`.

## Validation
Aprobado por la persona usuaria.

## Scope
Puede cambiar: todo el repositorio salvo `old/`, el texto de `cambios/hechos/` (solo se mueve), `LICENSE` y la prosa de `docs/` y `README.md` (solo se actualizan los nombres, rutas, comandos y marcadores que citan).
Fuera: reescribir o traducir prosa de la documentación, proyectos instalados del usuario (los migra el migrador cuando él lo ejecute), commit y PR.

## Verification
`./verify` — exit 0 y `VERIFY OK`.

## Stop conditions
Continuar mientras la comprobación del tramo pase y el paso siguiente esté dentro del Alcance. Parar con nota si la misma causa falla dos veces, si un renombre rompe un contrato que el plan no previó o si hace falta decidir un nombre fuera del mapa. Revisión: por tramo.

## Steps

1. [Quitar copias en español](tramo-1.md): `agentes/`, `skills/`, `nucleo/`, `pruebas/aceptacion/` y `tools/core-compatibility.json`.
2. [pruebas/ pasa a tests/](tramo-2.md): mover y renombrar subcarpetas; actualizar referencias.
3. [cambios/ pasa a changes/](tramo-3.md): mover, `hechos`→`done`; actualizar referencias.
4. [Quitar alias y renombrar documentos](tramo-4.md): scripts, instaladores, `friction.md`, `TODO.md`.
5. [Vocabulario del plan, marcadores y agentes](tramo-5.md): claves, secciones, `modelos.json`, `planner`/`builder`.
6. [Documentación con nombres nuevos](tramo-6.md): `README.md`, `AGENTS.md`, `docs/` y demás documentos citan rutas, comandos y marcadores vigentes.
7. [Migrador y cierre](tramo-7.md): comando de migración, planes en curso y barrido final.

## Evidence

Tramo 1, TODO 1 (quitar lecturas de las copias en instaladores y `tools/verify/`): pendiente, la comprobación literal no pasa.
$ git grep -n core-compatibility -- install.sh tools tests README.md AGENTS.md
(sin salida) exit=1
$ git grep -n core-compatibility -- . ':!old' ':!cambios/hechos' ':!cambios/estandarizar-ingles'
docs/decisions/cleanup.md:5, :25, :73, :75
docs/decisions/structure.md:9, :11
exit=0
Nota: la comprobación literal del TODO 1 no excluye `cambios/estandarizar-ingles/` (este plan la nombra); la exclusión aquí se aplica para no contar el plan. Las 6 líneas restantes son prosa de `docs/decisions/` (tramo 6), fuera del alcance de A1 de este tramo.

Tramo 1, TODO 2 (borrar copias y apuntar a `tests/acceptance/` y `core/`):
$ git rm -r -q agentes skills nucleo pruebas/aceptacion tools/core-compatibility.json tools/verify/core-compatibility.mjs tools/verify/core-compatibility.test.mjs
exit=0 (21 archivos borrados en el índice, 1551 líneas; ver Notas sobre esta escritura de Git)
$ git ls-files agentes skills nucleo pruebas/aceptacion tools/core-compatibility.json
(sin salida) exit=0
$ git grep -nE '(^|[^a-z-])(agentes|nucleo)/|core-compatibility|skills/(definir|ejecutar|planificar|preparar|migrar|diagnosticar|disenar)' -- install.sh tools tests README.md AGENTS.md
(sin salida) exit=1 (A1 cumple)
Equivalencia antes de borrar: cada copia de `agentes/`, `skills/` y `nucleo/` es idéntica (cmp) a su destino en `core/`; `pruebas/aceptacion/` eran envoltorios que delegaban en `tests/acceptance/` y estos conservan la suite.

Tramo 1, TODO 3 (comando de aceptación en `AGENTS.md`; `README.md` no lo nombra):
$ grep -n 'node --test' README.md AGENTS.md
AGENTS.md:7:- Aceptación: `node --test tests/acceptance/*.test.mjs` ...
exit=0 (README sin ocurrencias; nada que ajustar)
$ node --test tests/acceptance/*.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
exit=0

Verificación del tramo: `node --test tests/acceptance/*.test.mjs` exit=0 (3/3).
Verificación adicional: `./verify` — primera ejecución falló en 8b (`tools/verify/workspace-contracts.sh`: la copia temporal seguía escribiendo en `skills/` tras el renombre; corregido a `core/skills/`). Segunda ejecución:
$ ./verify
...
VERIFY OK
exit=0

Tramo 2, TODO 1 (mover `pruebas/` a `tests/`): pendiente, la comprobación literal no pasa.
$ git ls-files pruebas | wc -l
106
$ git ls-files --deleted -- pruebas | wc -l
106
$ ls -A pruebas
(sin salida: la carpeta queda vacía)
$ find pruebas -type f | wc -l
0
$ find tests -type f | wc -l
110
Causa: el índice sigue listando las 106 rutas viejas, porque los archivos se movieron con `mv` y `mv` no escribe el índice. Dejar `git ls-files pruebas` vacío exige `git rm --cached` o `git add -u`, que escriben el índice y quedan fuera de la regla del constructor. Equivalente comprobado: `pruebas/` no tiene archivos y las 106 rutas aparecen como borradas en el árbol de trabajo. Decisión del principal (ver Notas).

Tramo 2, TODO 2 (referencias a las rutas nuevas). La A1 de este tramo se mide con `grep -rn` sobre las rutas que toca, porque `git grep` no ve los archivos nuevos de `tests/` (no están en el índice):
$ grep -rn 'pruebas' verify tools tests scripts core adapters install.sh instalar.sh instalar-remoto.sh install-remote.sh README.md AGENTS.md .gitignore
Restos y motivo:
- `tools/verify/*`, `scripts/*`, `core/`, `adapters/`, `install.sh`: solo la palabra «pruebas» en prosa o comentarios, sin ruta vieja.
- `.gitignore:2` `pruebas/*`: intencional, ignora la carpeta vacía y el futuro `pruebas/.temporales/`; `tests/.tmp/` ya está ignorado.
- `AGENTS.md:43,45`: v1 y `pruebas/.temporales/`, intencionales (ver Alcance del plan).
- `scripts/permisos-hook.mjs:127`: la regla de escritura permite `pruebas/.temporales`; la ruta sigue válida porque esa carpeta no se mueve. Intencional.
- `tests/review-plan/revisar-plan.test.mjs:34` y `tests/review-plan/fixtures/*`, `tests/luna-reviewer/casos/*`, `tests/luna-reviewer/resultados.jsonl`: datos o texto de planes de prueba; no se editan.
Resto de `git grep -c 'pruebas/'` fuera de las rutas de este tramo (tramos 3, 6 y 7): `PENDIENTES.md` 2, `cambios/kit-run/plan.md` 19, `docs/decisions/cleanup.md` 16, `docs/decisions/structure.md` 1, `docs/evaluaciones/costos.md` 1, `docs/evaluaciones/openspec/aceptacion-arnes.md` 2, `docs/evaluaciones/openspec/hashes-iniciales.sha256` 83, `docs/evaluaciones/openspec/protocolo.md` 6, `docs/investigaciones/revisor-luna.md` 1, `docs/mejoras.md` 1, `evals/README.md` 4.

Tramo 2, TODO 3 (`./verify`): pasa.
$ ./verify > /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo2-final.log 2>&1; echo $?
0
$ tail -n 2 /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo2-final.log
ok 8t: principal con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
Esta ejecución final se hizo después de editar los comentarios de `instalar-remoto.sh` y `install-remote.sh`; `bash -n` sobre ambos: sin errores. Antes hubo dos fallos corregidos (ver Notas) y una ejecución en verde previa en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo2.log`.

Tramo 3, TODO 1 (`cambios/` pasa a `changes/`, `hechos/` pasa a `changes/done/`): equivalente aplicado; la comprobación literal no pasa por el índice.
$ mv cambios/hechos changes/done; mv de los planes en curso a changes/; rmdir cambios   (changes/HISTORY.md se conserva)
$ ls -d cambios
ls: cannot access 'cambios': No such file or directory
$ git ls-files cambios | wc -l
299
$ git ls-files --deleted -- cambios | wc -l
299
$ ls -d changes/done/*/ | wc -l; find changes/done -type f | wc -l
64
293
Nota: `git ls-files cambios` sigue listando 299 entradas porque `mv` no actualiza el índice y el constructor no escribe el índice (`git rm --cached` o `git add -u` quedan fuera de la regla). Equivalente aplicado: `cambios/` ausente y los 299 del índice borrados en disco. Así lo indicó el principal al lanzar el tramo.

Tramo 3, TODO 2 (rutas en `core/`, `adapters/`, `scripts/`, `tools/`, `tests/`, instaladores, `.gitignore`, `AGENTS.md`, `README.md`): hecho.
$ git grep -n 'cambios/' -- . ':!old' ':!cambios/hechos' ':!changes/done'
(salida restante, todo fuera de las rutas de este tramo)
AGENTS.md:18 (falso positivo: `evals/arquitectura-cambios/` contiene la palabra, no es la carpeta de planes)
PENDIENTES.md:8, :19, :35, :36, :42; archive/README.md:5; docs/decisions/cleanup.md:40-47; docs/decisions/structure.md:15, :17, :21; docs/evaluaciones/costos.md:3, :81, :84, :98, :115; docs/evaluaciones/openspec/hashes-iniciales.sha256:3-5; docs/evaluaciones/tramos.md:3; docs/guide.md:11, :16, :57, :72, :100; docs/investigaciones/*.md (varios); docs/kit-run.md:8; docs/mejoras.md:9-13; docs/reglas-deny.md:8; evals/README.md:25; evals/arquitectura-cambios/README.md:14-23; friccion.md:18
exit=0
Sin coincidencias en `core/`, `adapters/`, `scripts/`, `tools/`, `tests/`, instaladores, `.gitignore`, `README.md`. Las citas restantes son prosa e historial en `docs/`, `evals/`, `PENDIENTES.md`, `friccion.md` y `archive/README.md`, que el plan asigna a los tramos 6 y 7; el barrido global es del tramo 7.

Tramo 3, TODO 3 (`./verify`): pasa.
$ ./verify > /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo3.log 2>&1; echo $?
0
$ tail -n 1 /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo3.log
VERIFY OK
Incluye la prueba negativa A4i de `tests/usage/`, que pasa con el fixture renombrado (ver Notas).

Tramo 4, TODO 1 (quitar opciones y alias en español de `install.sh`, `kit run` y ayudas):
$ git grep -nE -- '--(proyecto|simular|migrar|copiar|solo|agente|skills-proyecto)' -- . ':!old' ':!changes/done'
(sin salida) exit=1
Árbol de trabajo (sin `.git`, `old/`, `changes/done/`, `node_modules/`), porque `git grep` no ve archivos sin indexar:
$ find . (podar .git old changes/done node_modules) -type f -print0 | xargs -0 grep -nIE -- '--(proyecto|simular|migrar|copiar|solo|agente|skills-proyecto)'
./changes/estandarizar-ingles/tramo-4.md:17 (el propio TODO, que nombra las opciones)
./tests/usage/probar.mjs:78 (caso que comprueba que las formas en español se rechazan con código 2 y «opción desconocida»)
Sin otras coincidencias. `--correr` no entra en el patrón; ver Notas.

Tramo 4, TODO 2 (`friccion.md` pasa a `friction.md`, `PENDIENTES.md` a `TODO.md`, enlaces): equivalente aplicado; la comprobación literal no pasa por el índice.
$ mv friccion.md friction.md; mv PENDIENTES.md TODO.md; mv scripts/observar.mjs scripts/observe.mjs; mv scripts/uso.mjs scripts/usage.mjs; mv instalar.sh install.sh; mv desinstalar.sh uninstall.sh (`instalar-remoto.sh` ya no existe en el árbol)
$ git ls-files | grep -E 'instalar|desinstalar|observar|uso\.mjs|friccion|PENDIENTES'
PENDIENTES.md, desinstalar.sh, friccion.md, instalar-remoto.sh, instalar.sh, scripts/observar.mjs, scripts/uso.mjs (borrados en disco, aún en el índice), más `old/v1/...` (archivo de la v1, fuera de A1) y `cambios/hechos/estructura-repo/linea-base/instalar-simular-{1,2}.txt` (ruta vieja de `changes/done/`)
$ git ls-files --deleted | grep -E 'instalar|desinstalar|observar|uso\.mjs|friccion|PENDIENTES' | wc -l
9
$ find . (podar .git old changes/done node_modules) \( -iname '*instalar*' -o -iname '*desinstalar*' -o -iname '*observar*' -o -name 'uso.mjs' -o -iname '*friccion*' -o -name 'PENDIENTES*' \) -print
(sin salida)
$ ls friction.md TODO.md install.sh uninstall.sh install-remote.sh scripts/usage.mjs scripts/observe.mjs
existen los siete
Enlaces: `grep -nIE 'friccion|PENDIENTES'` fuera de `old/`, `changes/done/` y `node_modules/` solo encuentra los planes `changes/estandarizar-ingles/*.md` (que nombran los archivos viejos como historia o como A1 del tramo 6).
Nota: `changes/done/estructura-repo/linea-base/instalar-simular-{1,2}.txt` contienen «instalar» en el nombre. Son capturas de la salida de `--simular` de un plan archivado; el Alcance dice que `changes/hechos/` solo se mueve, así que no se renombran. Quedan fuera de la comprobación equivalente.

Tramo 4, TODO 3 (`./verify`): pasa.
$ ./verify > /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo4.txt 2>&1; echo $?
0
$ tail -n 1 /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo4.txt
VERIFY OK
Incluye 8r con el rechazo de `--datos` y `--desde` (código 2, «opción desconocida»), la mutación de opción y la equivalencia de informes.

Tramo 5, TODO 1 (agentes `planner.md`/`builder.md`, `execute-plan`, `plan-change`, `migrate-project`, adapters): hecho.
$ ls core/agents/ && test ! -e core/agents/principal.md && test ! -e core/agents/constructor.md
builder.md
planner.md
(principal.md y constructor.md ausentes; `test` sale 0)
$ grep -rnE 'principal|constructor|COMPLETADO|PAUSA\b|APROBADO|DEVUELTO|^estado:|## Alcance|## Evidencia|## Pasos|## Notas|## Verificación|Review: per|agentes/' core adapters
core/skills/design-experience/SKILL.md:60:| [ Acción principal            ]      |
core/skills/prepare-project/SKILL.md:32:- Ramas: ... Rama base: `<rama>` solo si no es la principal del remoto.
exit=0
- Comprobación literal `git grep` sustituida por `grep -rnE` sobre el árbol de trabajo: `core/agents/planner.md`, `core/agents/builder.md` y las skills nuevas no están en el índice (`mv`, no `git mv`), y `git grep` no los ve. Equivalente y sin cambio de alcance.
- Los dos resultados restantes son sentidos protegidos (`Acción principal`, «la principal del remoto»). `Rama base:` en `prepare-project` es prosa y se revisa en el tramo 6.
- `core/skills/diagnose/SKILL.md:8` corregido de `agentes/planner.md` a `core/agents/planner.md`, con el título «What blocks and what does not» de `planner.md`.

Tramo 5, TODO 2 (aplicar el mapa a `scripts/`, `tools/`, `verify`, instaladores; `modelos.json` a `models.json`): comprobación literal NO cumplida; la casilla queda pendiente.
$ grep -rnE 'COMPLETADO|PAUSA|APROBADO|DEVUELTO|^estado:|## Alcance|## Evidencia|principal|constructor' core adapters scripts tools tests install.sh verify
69 líneas (salida completa en /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/gate-a1-tramo5.txt). Clasificación:
- 62 en datos de prueba que el Alcance (línea 123) excluye de edición: `tests/continuity/evidencia-real.md` (17), `tests/luna-reviewer/resultados.jsonl` (39), `tests/luna-reviewer/casos/c01|c06|c07/diff.patch` (4), `tests/review-plan/fixtures/a2-interrumpido.json` y `historia-nueva-valida.md` (2).
- 6 con «principal» como adjetivo (sesión principal, Acción principal, «la principal del remoto»), sin relación con los agentes: `core/skills/design-experience/SKILL.md:60`, `core/skills/prepare-project/SKILL.md:32`, `scripts/usage.mjs:18`, `tools/usage/claude.mjs:59`, `tests/usage/probar.mjs:303` y `:314`.
- 1 en la tabla de traducción de `tests/review-plan/review-plan.test.mjs:23`, que convierte los fixtures viejos al vocabulario nuevo en memoria (`## Alcance` → `## Scope`).
Ninguna línea de código de contrato (agentes, skills, adaptadores, scripts, verificación e instaladores) conserva un nombre viejo de agente, clave o marcador. La decisión sobre estas tres categorías está en Notas.

Tramo 5, TODO 3 (`tests/review-plan/review-plan.test.mjs`): cumplido.
$ node --test tests/review-plan/review-plan.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
exit=0 (salida en /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/review-plan-tramo5.txt)

Tramo 5, TODO 4 (`./verify`): cumplido.
$ ./verify > /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify-tramo5.log 2>&1; echo $?
0
$ tail -n 2 .../scratchpad/verify-tramo5.log
ok 8t: planner con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK

Tramo 6, TODO 1 (`README.md` y `AGENTS.md`): comprobación literal NO cumplida; la casilla queda pendiente.
$ git grep -nE 'cambios/|pruebas/|instalar\.sh|COMPLETADO|modelos\.json' -- README.md AGENTS.md
AGENTS.md:43 y AGENTS.md:45. Son rutas reales en disco: `old/v1/` contiene `pruebas/` (la v1) y `pruebas/.temporales/` es la carpeta que el Alcance prohíbe mover. README.md no tiene coincidencias.

Tramo 6, TODO 2 (`docs/guide.md`, `docs/kit-run.md`, `docs/reglas-deny.md`, `docs/mejoras.md`, `docs/practicas-por-tecnologia.md`, `tests/README.md`): comprobación literal NO cumplida; la casilla queda pendiente.
$ git grep -nE 'cambios/|pruebas/|agentes/|nucleo/|instalar\.sh|desinstalar\.sh|COMPLETADO|PAUSA\b|APROBADO|DEVUELTO|modelos\.json|PENDIENTES\.md|friccion\.md|\bprincipal\b|\bconstructor\b' -- docs/guide.md docs/kit-run.md docs/reglas-deny.md docs/mejoras.md docs/practicas-por-tecnologia.md tests/README.md
docs/guide.md:53 (`docs/evaluaciones/constructor.md`). Es un nombre de archivo real que coincide con `\bconstructor\b`; no es un nombre viejo. Los demás archivos no tienen coincidencias.

Tramo 6, TODO 3 (`TODO.md`, `friction.md`, `evals/README.md`, `docs/decisions/`, `docs/evaluaciones/`, `docs/investigaciones/`): cumplido.
$ node <scratchpad>/enlaces.mjs TODO.md friction.md evals/README.md docs/decisions/*.md docs/evaluaciones/*.md docs/investigaciones/**/*.md ...
rotos=0. Las citas históricas que quedan se listan en Notas.

Tramo 6, TODO 4 (`./verify`): cumplido.
$ ./verify > .../scratchpad/verify-tramo6.log 2>&1; echo $?
0
VERIFY OK

Tramo 6, TODO 1 (`README.md` y `AGENTS.md`): cumplido con la excepción (a) del principal.
$ git grep -nE 'cambios/|pruebas/|instalar\.sh|COMPLETADO|modelos\.json' -- README.md AGENTS.md
AGENTS.md:43:Lo de la v1 está en `old/v1/` (...`pruebas/`...) 
AGENTS.md:45:`old/v1/registro/` ... `pruebas/.temporales/` (...)
exit=0
Excepciones aceptadas: `AGENTS.md:43` y `:45` (nombres reales en disco). `AGENTS.md:17` (`auditoria-servicios-constructor.md`) ya estaba aceptado en la pausa del tramo 6.

Tramo 6, TODO 2 (`docs/guide.md`, `docs/kit-run.md`, `docs/reglas-deny.md`, `docs/mejoras.md`, `docs/practicas-por-tecnologia.md`, `tests/README.md`): cumplido con la excepción (a) del principal.
$ git grep -nE 'cambios/|pruebas/|agentes/|nucleo/|instalar\.sh|desinstalar\.sh|COMPLETADO|PAUSA\b|APROBADO|DEVUELTO|modelos\.json|PENDIENTES\.md|friccion\.md|\bprincipal\b|\bconstructor\b' -- docs/guide.md docs/kit-run.md docs/reglas-deny.md docs/mejoras.md docs/practicas-por-tecnologia.md tests/README.md
docs/guide.md:53:... `docs/evaluaciones/constructor.md` ...
exit=0
Excepción aceptada: `docs/guide.md:53` (nombre real de archivo, `constructor.md`).

### Tramo 7 — Migrador y barrido final (TODO 1 a 5)
- TODO 1 (`--migrate-names` con `--dry-run`): `bash install.sh --migrate-names . --dry-run` sin `head`, salida completa en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/dry-run.txt`: exit 0; lista 11 cambios con `cambiaría:` y no escribe nada. Antes, en un proyecto temporal: simulación sin escritura, aplicación, segunda corrida con `sin cambios` y exit 0. `names.sh` ya no reescribe el texto de `## Evidencia`/`## Evidence`, porque es salida real de comandos; el cambio se hizo antes del dry-run final.
- TODO 2 (prueba): `node --test tests/migration/names.test.mjs` → `ℹ tests 3`, `ℹ pass 3`, `ℹ fail 0`, exit 0. Cubre: la simulación no escribe; la aplicación renombra `cambios/`→`changes/`, `hechos/`→`done/`, claves, secciones, etiquetas y `settings.local.json`; la segunda corrida no cambia nada; combinar con `--agent` falla con exit 1 y no mueve nada.
- TODO 3 (planes en curso y este plan): aplicado con `nombres_programa` y `nombres_aplicar` de `tools/install/migration/names.sh` a `changes/{cola-docker,kit-run,proceso-rapido,prueba-informe,una-espera-write-stdin,verificacion-general}/plan.md`; salida: seis `reescrito: changes/…/plan.md`. `changes/estandarizar-ingles/plan.md` no cambió, porque ya estaba en el vocabulario nuevo. No se ejecutó `--migrate-names .` sobre el repo porque también reescribiría `tramo-1` a `tramo-4` y `tramo-7` de este plan, que TODO 3 no incluye (ver Notas). Comprobación: `node scripts/revisar-plan.mjs changes/estandarizar-ingles/plan.md` → único aviso «el plan supera 8192 bytes», exit 1; sin avisos de claves desconocidas.
- TODO 4 (barrido de `README.md` y `AGENTS.md`): `git grep -nE 'cambios/|hechos/|agentes/|nucleo/|instalar\.sh|desinstalar\.sh|COMPLETADO|PAUSA\b|APROBADO|DEVUELTO|modelos\.json|PENDIENTES\.md|friccion\.md|\bprincipal\b|\bconstructor\b|ejecutor:|continuidad:|estado:|rama:' -- README.md AGENTS.md`: única coincidencia `AGENTS.md:17` (`auditoria-servicios-constructor.md`), excepción aprobada. `README.md` sin coincidencias. Se actualizaron en `AGENTS.md` las claves `ejecutor:`→`executor:` y `continuidad: continua`→`continuity: continuous` (líneas 12 y 13); la prosa no cambió. `git ls-files README.md AGENTS.md` lista ambos.
- TODO 5 (`./verify`): exit 0, última línea `VERIFY OK`; salida en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify.txt`.

### Tramo 8 — Nombres de archivo restantes (TODO 1 a 4)
- TODO 3 (`tests/migration/names.test.mjs` en `./verify` y `docs/guide.md:18`): `verify` carga `tools/verify/names-migration.sh` (paso 9b). `docs/guide.md:18` dice ahora `### Segment N` y `continuity: continuous`.
$ node --test tests/migration/names.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
exit=0
- Defecto propio corregido antes de la comprobación final: la primera ejecución de `./verify` falló en 10c (`SyntaxError: ... does not provide an export named 'huella'`). `tests/diagnosis-suggests/fingerprint.test.mjs` seguía importando y llamando `huella` tras el renombre del módulo a `fingerprint`. Se cambiaron la importación y las tres llamadas a `fingerprint(dir)`. La clave JSON `.huella` no se tocó.
$ node --test tests/diagnosis-suggests/fingerprint.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit=0
- TODO 4 (`./verify`): segunda ejecución, salida completa en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/1a0b8ad1-5a0e-4c31-ab9d-47dbda8e8fe6/scratchpad/verify2.log`.
$ ./verify > .../verify2.log 2>&1; echo $?
0
$ grep -E '^ok 9b|^VERIFY' .../verify2.log
ok 9b: pruebas de migración de nombres pasaron
VERIFY OK
exit=0
- TODO 1 (A1, `git grep`): no cumplida. El `git grep` de A1 sigue devolviendo dos archivos (exit 0):
$ git grep -nE "revisar-plan|permisos-hook|diagnosticar|probar\.mjs|medir\.mjs|huella|protocolo\.mjs|uso\.test" -- . ':!old' ':!changes/done' ':!docs/evaluaciones' ':!docs/investigaciones' ':!docs/decisions'
core/contracts/verificacion.md:21: { "huella": "<12 hex>", ... }
core/skills/diagnose/result.mjs:11: ... huella ...
core/skills/diagnose/result.mjs:32-35: variable local `huella` y clave `huella` del resultado de diagnóstico
Motivo: `huella` es clave del contrato de `resultado.json` y de la salida del diagnóstico. Cambiarla es decisión del principal (ver Notas). TODO 1 queda sin marcar.
- A1, revisor: `node scripts/review-plan.mjs changes/estandarizar-ingles/plan.md` responde con `changes/estandarizar-ingles/plan.md:1: el plan supera 8192 bytes`, exit 1. Es el mismo residual de los tramos 5 a 7: el plan pesa más del límite del revisor y reducirlo exige borrar historial.
- TODO 2 (barrido con `find`): no cumplido. El `find` (excluye `old/`, `changes/done/`, `docs/evaluaciones/`, `docs/investigaciones/` y `docs/decisions/`) aún encuentra, entre otros:
  - `pruebas/` (la carpeta aparece en el `find`; no se mueve sin pedido).
  - `core/skills/prepare-project/referencia.md`.
  - `tests/continuity/evidencia-real.md` (excluido por el Alcance) y `tests/luna-reviewer/casos/c01` a `c12/evidencia.txt` (datos de prueba).
  - `evals/arquitectura-cambios/` (`autoprueba.mjs`, `oraculos.mjs`, `verify.sh`, `README.md`, `casos/`, `variantes/`, `controles/`, `manifiesto.json`, `controles.json`).
  - Carpetas de planes en curso con nombre en español (`changes/proceso-rapido`, `changes/prueba-informe`, `changes/verificacion-general`), pendientes de decisión.
  La salida se truncó a 60 líneas, así que el barrido no está completo.
- Corrección tras la resolución del principal (esta ejecución):
  - `huella` → `fingerprint`: `core/skills/diagnose/result.mjs` escribe y lee `fingerprint`; si falta, lee `huella` como clave heredada. Cambio de contrato de `resultado.json`. `core/contracts/verification.md` documenta la clave nueva y la heredada. `tests/diagnosis-suggests/fingerprint.test.mjs` escribe `fingerprint` y tiene una prueba con `huella` heredada.
  - Identificador `diagnosticar` → `diagnose` en `core/skills/diagnose/diagnose.mjs` (comentario, función y llamada), `tests/permissions-v2.test.mjs` y el texto de `tests/permissions-contract/structure.test.mjs`.
  - Renombres con `mv`: `core/skills/prepare-project/referencia.md` → `reference.md`; `core/contracts/verificacion.md` → `verification.md`. Referencias actualizadas en `core/skills/prepare-project/SKILL.md`, `tools/verify/workflow-contract.sh`, `tools/verify/workspace-contracts.sh`, `docs/practicas-por-tecnologia.md`, README.md, AGENTS.md, `core/recipes/node-pnpm.md`, `core/skills/diagnose/diagnose.mjs`, `docs/guide.md`, `docs/mejoras.md` y el test de fingerprint.
  - Pruebas: `node --test tests/diagnosis-suggests/fingerprint.test.mjs tests/permissions-v2.test.mjs tests/permissions-contract/structure.test.mjs` → 9 pasan, 0 fallan.
  - A1 con `git grep` (solo ve archivos rastreados): `core/skills/diagnose/result.mjs:8,10`, la lectura heredada aprobada. La búsqueda por sistema de archivos (incluye archivos renombrados y sin rastrear) muestra además solo residuales aprobados: `core/contracts/verification.md:26` (nota de compatibilidad), `tests/diagnosis-suggests/fingerprint.test.mjs:83` (prueba de la clave heredada) y `changes/*/plan.md` (documentación del cambio, fuera de A1).
  - Barrido `find` (excluye `old/`, `changes/done/`, `docs/evaluaciones/`, `docs/investigaciones/`, `docs/decisions/`): quedan solo excepciones aprobadas: datos de prueba (`tests/luna-reviewer/casos/*`, `tests/luna-reviewer/resultados.jsonl`, `tests/review-plan/fixtures/*`, `tests/usage/fixtures/*`, `tests/continuity/evidencia-real.md`, `scripts/fixtures-observer/datos/*`), `evals/`, carpetas de planes en curso (`changes/proceso-rapido`, `changes/prueba-informe`, `changes/verificacion-general`) y `pruebas/`, que está vacía. Un filtrado final no encontró otros nombres en español.
  - Revisor: `node scripts/review-plan.mjs changes/estandarizar-ingles/plan.md` responde y solo avisa del tamaño (8192 bytes), exit 1. Residual 6 de Notas, sin cambio.
  - `./verify` tras los cambios: exit 0, `ok 9b` y `VERIFY OK`. Salida en `/tmp/claude-1000/verify-tramo8.log`.

## Notes
- Resuelto por el principal tras la PAUSA del tramo 1: (a) nombres de skills en inglés (ver Supuestos; el `name:` del frontmatter se ajusta en el tramo 1, único cambio permitido en `core/` ahí); (1) la A1 de cada tramo se limita a las rutas que ese tramo toca y las pruebas negativas de `tools/verify/` se actualizan a la ruta nueva; el barrido global queda para el tramo 7.
- Punto de control, tramo 1 (estado `parcial`, PAUSA):
  - Archivos tocados: `.gitignore`, `AGENTS.md`, `README.md`, `adapters/codex/install-launcher.sh`, `adapters/pi/install-launcher.sh`, `instalar.sh`, `instalar-remoto.sh`, `install-remote.sh`, `tools/install/project-skills.sh`, `tools/install/skills.sh`, `tools/verify/*` (14 archivos), `pruebas/contrato-constructor.mjs`, `pruebas/continuidad/protocolo.mjs`, `pruebas/diagnostico-sugiere/huella.test.mjs`, `pruebas/permisos-v2.test.mjs`, `tests/README.md`, `tests/acceptance/*.test.mjs` (3), `core/skills/*/SKILL.md` (7, solo la línea 2 `name:`). Borrados: `agentes/`, `skills/`, `nucleo/`, `pruebas/aceptacion/`, `tools/core-compatibility.json`, `tools/verify/core-compatibility.mjs`, `tools/verify/core-compatibility.test.mjs`.
  - Resumen del diff: renombre de rutas (`agentes/`→`core/agents/`, `skills/<viejo>/`→`core/skills/<nuevo>/`, `nucleo/`→`core/`, `pruebas/aceptacion/`→`tests/acceptance/`); el contenido de agentes y contratos no cambia. `models.sh` pierde la línea de `core-compatibility`.
  - Comprobación: `./verify` → `VERIFY OK` (exit 0); acceptance 3/3. TODO 1 queda pendiente (ver Evidencia).
- Escritura de Git fuera de la regla del constructor: `git rm` escribe en el índice y la regla solo admite `switch -c`. Lo ejecuté porque el TODO 2 lo pide literalmente. Quedan 21 borrados en el índice; no hay commit. El principal decide si deshace el staging (`git reset -- <rutas>`).
- Pendiente de decisión (TODO 1): su comprobación literal exige cero menciones de `core-compatibility` fuera de `old/` y `cambios/hechos/`. Quedan `docs/decisions/cleanup.md` (4 líneas) y `docs/decisions/structure.md` (2 líneas). Opciones: (a) limitar la comprobación a `install.sh`, `tools`, `tests`, `README.md` y `AGENTS.md` (resolución 1 del principal), (b) quitar ahora esas menciones en `docs/decisions/`, (c) dejarlas para el tramo 6.
- Desfase de nombres en agentes (Issue 2): `core/agents/constructor.md` (frontmatter `skills: ejecutar-plan` y prosa) y `core/agents/principal.md` (`planificar-cambio`, `ejecutar-plan`, `definir-proyecto`) siguen con los nombres viejos mientras el `name:` ya es inglés. Tramo 1 no cambia contenido de agentes; se resuelve en el tramo 5. Hasta entonces, la skill instalada se llama `execute-plan` y el agente la declara como `ejecutar-plan`.
- Decisión menor dentro del alcance: la skill instalada toma el nombre de su carpeta, así que la ruta de instalación pasa a `.agents/skills/execute-plan`; `pruebas/continuidad/protocolo.mjs` y `tools/verify/codex-launcher.sh` la esperan con ese nombre.
- Restos de `core/` fuera de la A1 de este tramo, diferidos a los tramos 6 y 7 según el plan: `core/recipes/node-pnpm.md:3` (`nucleo/contrato/verificacion.md`), `core/skills/diagnose/SKILL.md:8` (`agentes/principal.md`), `core/skills/diagnose/diagnosticar.mjs:2` y `:113` (comentarios `nucleo/`), `core/skills/migrate-project/SKILL.md:63` (`agentes/`), `core/skills/plan-change/SKILL.md:122` y `:128` (`agentes/principal.md`). La prosa de `AGENTS.md:20` (skill `diagnosticar`) queda para el tramo 6.
- Retomar: TODO 1 de `tramo-1.md` tras la decisión de la persona principal; después `tramo: 2` solo con revisión.
- Tramo 1 revisado por el principal: APROBADO (copias borradas, skills con nombre en inglés, aceptación y `./verify` en verde). Las 6 menciones de `core-compatibility` en `docs/decisions/` se corrigen en el tramo 6. Para mover o borrar usar `mv`/`rm` de archivos, no `git mv`/`git rm`.
- Punto de control, tramo 2 (estado `listo`: `./verify` pasa; TODO 1 queda pendiente por la causa de índice de Evidencia):
  - Archivos tocados. Movidos con `mv`: `pruebas/continuidad`→`tests/continuity`, `pruebas/contrato-constructor`→`tests/builder-contract`, `pruebas/contrato-constructor.mjs`→`tests/contrato-constructor.mjs`, `pruebas/diagnostico-sugiere`→`tests/diagnosis-suggests`, `pruebas/kit-run`→`tests/kit-run`, `pruebas/permisos-contrato`→`tests/permissions-contract`, `pruebas/permisos-v2.test.mjs`→`tests/permisos-v2.test.mjs`, `pruebas/revisar-plan`→`tests/review-plan`, `pruebas/revisor-luna`→`tests/luna-reviewer`, `pruebas/uso`→`tests/usage`. `pruebas/` queda vacía y sin borrar; `pruebas/.temporales/` no existe en este checkout. Editados: `.gitignore` (nueve negaciones `!pruebas/...` quitadas; `tests/.tmp/` añadido), `tests/acceptance/{contrato-constructor,kit-run,uso}.test.mjs`, `tests/contrato-constructor.mjs`, `tests/kit-run/probar.mjs`, `tests/continuity/protocolo.mjs`, `tests/luna-reviewer/medir.mjs`, `tests/review-plan/revisar-plan.test.mjs`, `tests/usage/probar.mjs`, `tests/README.md` (reescrito), `tools/verify/usage-and-run.sh`, `tools/verify/codex-launcher.sh`, `tools/verify/codex-negative.sh`, `tools/verify/fingerprint-module.test.mjs`, `tools/verify/project-permissions.sh`, `tools/verify/offline-selftests.sh`, `AGENTS.md` (dos rutas), `instalar-remoto.sh` y `install-remote.sh` (comentario de la lista permitida: `pruebas/`→`tests/`).
  - Resumen del diff: renombre de rutas, sin cambio de contenido de las suites salvo rutas y dos URL relativas. Tras el primer `./verify` falló el paso 8j porque `tests/contrato-constructor.mjs` usaba `./revisar-plan/fixtures/` (corregido a `./review-plan/fixtures/`); el mismo tipo de error estaba en `tests/kit-run/probar.mjs` (`../revisor-luna/medir.mjs`, corregido a `../luna-reviewer/medir.mjs`). Lección: buscar también nombres viejos de carpeta en `new URL(...)` y `join(...)`, no solo `pruebas/`.
  - Comprobación: `./verify` exit 0 y VERIFY OK (ejecución final tras los comentarios de los instaladores); `bash -n` sobre `instalar-remoto.sh` y `install-remote.sh` sin errores; A1 por `grep -rn` (ver Evidencia).
- Decisión del principal (TODO 1 del tramo 2). Su comprobación literal `git ls-files pruebas` sin salida no puede pasar sin escribir el índice (`git rm --cached` o `git add -u`), y el constructor no escribe el índice. Opciones: (a) dar por cumplida la comprobación equivalente de Evidencia (`git ls-files --deleted -- pruebas` = 106, `pruebas/` vacía), igual que el tramo 1 (recomendada); (b) hacer el staging de `pruebas/` antes del commit y repetir la comprobación literal; (c) cambiar la comprobación del TODO a la equivalente en el plan. Estado del índice: los 21 borrados del tramo 1 siguen en staging por el `git rm` de allí; los 106 del tramo 2 siguen sin tocar.
- Restos fuera de la A1 de este tramo, asignados por el plan: `docs/` y `evals/` (tramo 6), `docs/evaluaciones/openspec/hashes-iniciales.sha256` (83 entradas de historial; decidir en el tramo 7 si se reescribe o se conserva como registro), `cambios/kit-run/plan.md` y `PENDIENTES.md` (tramos 3 y 7).
- Residuales para renombrar en tramo 5 o 7, según el plan: nombres de archivo en español: `probar.mjs` (`tests/kit-run/`, `tests/usage/`, `tests/acceptance/` los llama), `medir.mjs`, `protocolo.mjs`, `huella.test.mjs`, `huella-reference.mjs`, `evidencia-real.md`, `revisar-plan.test.mjs`, `estructura.test.mjs`, `generacion.test.mjs`, `hook.test.mjs`, `contrato-constructor.mjs`, `permisos-v2.test.mjs`. Carpeta `comparar-openspec` (tramo 7; hoy no existe en `tests/`, así que el paso 10 de `offline-selftests.sh` se omite con AVISO). Carpetas ya en inglés: `continuity`, `builder-contract`, `diagnosis-suggests`, `kit-run`, `permissions-contract`, `review-plan`, `luna-reviewer`, `usage`.
- Retomar: nada pendiente dentro de la historia. Tramo 3 (`cambios/` a `changes/`) no empieza hasta la revisión del principal; con `Revisión: por tramo` el constructor se detiene aquí.
- Tramo 2 revisado por el principal: APROBADO (`./verify` VERIFY OK; `tests/` con el mapa aplicado; `pruebas/` queda vacía y ignorada por `.gitignore` para no tocar `.temporales`). Pendiente para el tramo 4: renombrar `tests/contrato-constructor.mjs`→`tests/builder-contract.mjs` y `tests/permisos-v2.test.mjs`→`tests/permissions-v2.test.mjs` y sus referencias. Las menciones de `pruebas/` en `PENDIENTES.md`, `AGENTS.md`, `evals/README.md` son de los tramos 4 y 6.
- Punto de control, tramo 3 (estado `en curso`; `./verify` pasa; TODO 1 queda con equivalente por la causa de índice de Evidencia):
  - Plan a partir de ahora en `changes/estandarizar-ingles/plan.md` (Handoff del tramo). El frontmatter ya dice `tramo: 4`.
  - Archivos tocados. Movidos con `mv`: `cambios/hechos` a `changes/done` (64 carpetas, 293 archivos); los planes en curso a `changes/` (`cola-docker`, `estandarizar-ingles`, `kit-run`, `proceso-rapido`, `prueba-informe`, `una-espera-write-stdin`, `verificacion-general`); `changes/HISTORY.md` se conserva; `cambios/` se elimina con `rmdir`. Renombrado: `tests/usage/fixtures/invasion/edicion-cambios/` a `edicion-changes/`. Editados: `core/contracts/verificacion.md`, `core/skills/diagnose/{fingerprint.mjs,SKILL.md}`, `core/skills/{plan-change,execute-plan,design-experience,prepare-project,migrate-project,define-project}/SKILL.md`, `core/agents/{constructor,principal}.md`, `scripts/{uso,revisar-plan,kit-run}.mjs`, `tools/install/migration/run.sh`, `tools/verify/{migration.sh,fingerprint-module.test.mjs}`, `tests/diagnosis-suggests/{huella.test.mjs,huella-reference.mjs,juguete/AGENTS.md}`, `tests/continuity/protocolo.mjs`, `tests/kit-run/probar.mjs`, `tests/usage/probar.mjs`, `instalar.sh` (comentario), `AGENTS.md` (seis líneas), `README.md` (una línea), `changes/HISTORY.md` (enlaces a `changes/done/`).
  - Resumen del diff: solo rutas de carpeta (`cambios/`→`changes/`, `hechos/`→`done/`) y la regex de `scripts/uso.mjs` (`/(^|\/)changes\//`); el texto de los planes archivados no cambia. Las variables `hechos` de código (`scripts/kit-run.mjs:162`, `tools/run/plan.mjs:27-29`) y la prosa quedan para el tramo 5 y 6, como indica el plan.
  - Decisión menor dentro del alcance: el fixture de invasión pasa a `edicion-changes/` porque la prueba A4i de `tests/usage/` compara la clave con la regex nueva; sus jsonl usan `changes/inv/plan.md` y la clave en `tests/usage/probar.mjs` es `"edicion-changes"`.
  - Comprobación: `./verify` exit 0 y `VERIFY OK`; A1 del tramo por `git grep` (ver Evidencia), sin coincidencias en las rutas que el tramo toca.
  - Residuales diferidos: `PENDIENTES.md`, `friccion.md`, `archive/README.md` (su enlace `../cambios/hechos/` queda roto hasta los tramos 6 y 7), `docs/`, `evals/` (incluido `evals/arquitectura-cambios/`, cuyo nombre no es una ruta de planes), `tests/review-plan/fixtures/` y `tests/continuity/evidencia-real.md` (texto de planes de prueba o evidencia histórica, sin editar).
  - Retomar: tramo 4 (`tramo-4.md`), empezando por leer el tramo completo.
- Punto de control, tramo 4 (estado `en curso`; `./verify` pasa; TODO 1, 2 y 3 marcados con evidencia; TODO 2 con equivalente por la causa de índice de Evidencia):
  - Archivos tocados. Renombrados con `mv`: `instalar.sh`→`install.sh`, `desinstalar.sh`→`uninstall.sh`, `scripts/observar.mjs`→`scripts/observe.mjs`, `scripts/uso.mjs`→`scripts/usage.mjs`, `friccion.md`→`friction.md`, `PENDIENTES.md`→`TODO.md`. `instalar-remoto.sh` ya no está en el árbol (quedó `install-remote.sh`). Editados: `install.sh` (líneas de ayuda de alias quitadas), `uninstall.sh`, `install-remote.sh`, `scripts/observe.mjs` y `scripts/usage.mjs` (mapas de alias quitados; las opciones en español dan código 2 con «opción desconocida»), `tools/observe/report.mjs` (`--since debe ser AAAA-MM-DD`), `tools/verify/install-help.sh`, `tools/verify/docker-observer.sh` (dos correcciones de 8r: `cp` de `scripts/observe.mjs` sin la fuente duplicada, y el bucle de rechazo ahora acepta solo código 2 con «opción desconocida» para `--datos` y `--desde`), `tests/kit-run/probar.mjs` (los alias se sustituyen por casos de equivalencia en inglés y un caso de rechazo en español), `tests/usage/probar.mjs` (bucle sobre las formas en español con código 2 y «opción desconocida»), `README.md`, `TODO.md`, `AGENTS.md` (líneas 28-29 sin paréntesis de alias).
  - Resumen del diff: renombre de documentos y scripts, retiro de alias y opciones en español, y pruebas de ayuda y de observador que comprueban el rechazo en lugar de la aceptación. Ninguna prueba se debilitó: las mutaciones de `install-simulation.sh` (`--dry-run`, `--status`, `--project`) y de `docker-observer.sh` (`--since`) siguen fallando como antes.
  - Comprobación: `./verify` exit 0 y `VERIFY OK`; `bash -n install.sh` y `bash -n tools/verify/docker-observer.sh` sin errores.
  - Equivalente de índice: `git ls-files` lista las rutas viejas (`instalar.sh`, `friccion.md`, etc.) como borradas en disco, no como A1 incumplida. Son 9 entradas en `git ls-files --deleted`. Dejarlas fuera del índice exige escribir el índice, lo que queda fuera de la regla del constructor. Igual que en tramos 2 y 3, el principal decide.
  - Decisiones y residuales (no bloquean):
    - `--correr` (modo interno de `scripts/observe.mjs:181` y `tools/observe/process.mjs:33`) no se renombra porque no es una opción pública. Opciones para el principal: (a) dejarlo como interno y excluirlo del barrido; (b) renombrarlo a `--run` o `--internal-run`. Se decide en el tramo 5, junto con la prosa de `observar`.
    - `AGENTS.md:22` sigue diciendo que los alias están permitidos. Queda para el tramo 6.
    - `scripts/fixtures-observador/datos/LEEME.txt` está en español y fuera del Alcance de A1 de este tramo. Queda para el tramo 7, si se decide.
    - `changes/done/estructura-repo/linea-base/instalar-simular-{1,2}.txt` contienen «instalar» en el nombre. Son capturas de un plan archivado y el Alcance dice que `done/` solo se mueve, así que no se renombran.
    - Los textos históricos de `docs/evaluaciones/` y `docs/investigaciones/` actualizan nombres citados para no romper la coherencia; es provisional y el tramo 6 lo revisa.
    - `changes/HISTORY.md` sigue abierto, sin decisión del principal.
  - Revisión: el plan declara `Revisión: por tramo`, así que me detengo aquí para la revisión del principal. Tramos 5, 6 y 7 quedan pendientes.
  - Retomar: tramo 5 (`tramo-5.md`), leyendo primero el tramo completo y la decisión sobre `--correr`.
- Tramos 3 y 4 revisados por el principal: APROBADOS (`./verify` VERIFY OK; `cambios/`→`changes/`, alias y opciones en español retirados). Decisiones para el tramo 5: renombrar `--correr`→`--run` y el subcomando `informe`→`report` de `scripts/observe.mjs` (con sus pruebas y documentos que los citen) y `scripts/fixtures-observador/`→`scripts/fixtures-observer/` con `LEEME.txt`→`README.txt`; `changes/HISTORY.md` se conserva. El resto de nombres en español dentro de scripts (mensajes de uso, variables) no se traduce: solo opciones, subcomandos, claves, marcadores y nombres de archivo.
- Punto de control, tramo 5 (estado `parcial`, PAUSA `motivo=ambiguous`; TODO 1, 3 y 4 marcados; TODO 2 pendiente):
  - Archivos tocados (vocabulario, sin cambio de contrato): `core/agents/{planner,builder}.md` (renombrados con `mv`), `core/skills/*/SKILL.md` de execute-plan, plan-change, migrate-project, diagnose, design-experience, prepare-project y define-project, `adapters/*` (lanzadores, reglas, compactación y hook), `models.json` (renombrado con `mv` desde `modelos.json`), `scripts/{resolver,kit-run,revisar-plan,usage}.mjs`, `tools/{run,model-resolution,usage,verify,install}/*`, `tests/*` (review-plan, builder-contract, kit-run, continuity, permissions-contract, usage, luna-reviewer, acceptance y README), `tests/permissions-v2.test.mjs` (renombrado con `mv`), `install.sh`, `scripts/fixtures-observer/datos/README.txt` (renombrado con `mv` desde `LEEME.txt`).
  - Excluidos a propósito por el Alcance (línea 123): `tests/continuity/evidencia-real.md`, `tests/luna-reviewer/casos/*` y `resultados.jsonl`, `tests/review-plan/fixtures/*` (restaurados desde HEAD tras una edición por error; diff vacío).
  - Correcciones de errores propios, dentro del alcance: `herramienta`→`tool` en `scripts/usage.mjs` rompió la tabla y dos pruebas; se restableció `herramienta` como clave de datos (la opción `--tool` se conserva). Este cambio no estaba en el mapa de vocabulario. `scripts/tarifas.json` y `tests/usage/fixtures/tarifas-prueba.json` mantienen la clave `modelos` (la lee `tools/usage/rates.mjs` como `.modelos`). `tools/run/commands.mjs` usaba `effort:` donde se desestructura `esfuerzo`; el constructor de codex perdía `model_reasoning_effort`; corregido y kit-run 24/24.
  - Comprobación: `node --test tests/review-plan/review-plan.test.mjs` 15/15 exit 0; `./verify` exit 0 y VERIFY OK (ver Evidencia). Las pruebas de `tests/usage` (20/20), `tests/kit-run` (24/24), `tests/builder-contract` y `tests/acceptance` pasaron en las ejecuciones previas de este tramo.
  - Decisiones menores tomadas dentro del alcance: los nombres de archivo en español de `tests/` (`probar.mjs`, `medir.mjs`, `protocolo.mjs`, `huella.test.mjs`, `huella-reference.mjs`, `evidencia-real.md`, `estructura.test.mjs`, `generacion.test.mjs`, `hook.test.mjs`) se renombran en el tramo 7, en una sola pasada, porque `tests/acceptance/*` y `tests/kit-run/probar.mjs` los citan por nombre. La mención histórica `informe` en `docs/investigaciones/documentacion-kit/como-funciona.md:88` se conserva como registro. Los sentidos protegidos de «principal» (sesión principal, Acción principal, «la principal del remoto») no se traducen.
  - Decisión pendiente del principal (TODO 2, A1 literal, 69 líneas). Clasificación: 62 en datos de prueba que el Alcance excluye de edición, 6 con «principal» como adjetivo y 1 en la tabla de traducción de `tests/review-plan/review-plan.test.mjs:23`. Opciones:
    (a) (recomendada) Aceptar esas tres categorías como excepciones documentadas y marcar TODO 2 con la salida de la clasificación como evidencia.
    (b) Ampliar el Alcance para permitir actualizar esos datos de prueba y reescribir los seis sentidos de «principal», y repetir el barrido literal.
    (c) Acotar la A1 de la Aceptación a las rutas de contrato, sin `tests/` y sin sentidos protegidos. Esto cambia la Aceptación, que solo el principal puede modificar.
  - Retomar: decidir A1 (TODO 2). Después, como último paso del tramo, migrar `changes/estandarizar-ingles/plan.md` y `tramo-5.md` al vocabulario nuevo (`status`, `segment`, `executor: builder`, `continuity: continuous`, secciones en inglés, `### Segment 5 — Story:`); todavía no se ha hecho porque el tramo no ha cerrado. Luego el punto de control final del tramo 5 y la revisión del principal. Tramos 6 y 7 no han empezado.
- Resuelto por el principal tras la PAUSA del tramo 5: opción (a). El barrido literal del TODO 2 admite como excepciones documentadas: datos de prueba históricos (`tests/luna-reviewer/resultados.jsonl`, `tests/luna-reviewer/casos/*/diff.patch`, `tests/continuity/evidencia-real.md`, fixtures de `tests/review-plan/` y `tests/usage/` que citan texto real), «principal» como adjetivo (sesión principal, Acción principal, rama principal del remoto) y la tabla de traducción de `tests/review-plan/review-plan.test.mjs:23`. Marca el TODO 2 con esa nota y continúa: migrar `plan.md` y `tramo-5.md` al vocabulario nuevo como último paso del tramo 5, y seguir con 6 y 7.
- Punto de control, tramo 5 (cierre, `done`): TODO 2 cerrado con la excepción (a) del principal, según la nota anterior. Migrados `changes/estandarizar-ingles/plan.md` (frontmatter `status`, `segment`, `executor: builder`, `continuity: continuous`; secciones en inglés) y `changes/estandarizar-ingles/tramo-5.md` (`## Steps`, `### Segment 5 — Story:`, campos en inglés, TODO 1 a 4 marcados).
  - Archivos tocados en este cierre: solo `changes/estandarizar-ingles/plan.md` y `changes/estandarizar-ingles/tramo-5.md`. No hay cambios de producto nuevos en este paso.
  - Comprobación: `./verify` exit 0 y VERIFY OK; `node scripts/revisar-plan.mjs changes/estandarizar-ingles/tramo-5.md` exit 0 sin avisos.
  - Residual 1: `plan.md` supera el límite del revisor de 8192 bytes (40492 bytes). Reducirlo exige borrar historial de Evidence y Notes; no se hizo. Lo reporto al principal.
  - Residual 2: `tramo-5.md` declara cinco archivos de producto en `Files:` (límite de tres). El revisor no lo marca; la sección Decisiones lo justifica como renombre mecánico.
  - Residual 3: el plan declara `Revisión: por tramo`, pero el principal indicó continuar con 5, 6 y 7 con puntos de control. Se sigue por esa instrucción y se anota aquí.
  - Avance: `segment: 8`, `status: in progress`. Siguiente paso: migrar `changes/estandarizar-ingles/tramo-6.md` al vocabulario nuevo y luego ejecutar sus TODO.
- Punto de control, tramo 6 (estado `partial`, PAUSA `motivo=ambiguo`; TODO 3 y 4 marcados; TODO 1 y 2 pendientes):
  - Archivos tocados: `AGENTS.md`, `README.md`, `docs/guide.md`, `docs/kit-run.md`, `docs/mejoras.md`, `docs/practicas-por-tecnologia.md`, `docs/reglas-deny.md`, `evals/README.md`, y citas de rutas en `docs/decisions/*`, `docs/evaluaciones/*` e `docs/investigaciones/*` (TODO 3). `TODO.md`, `friction.md` y `tests/README.md` no tienen coincidencias de la A1.
  - Resumen del diff: solo nombres, rutas, comandos y claves. `agentes/`→`core/agents/`, `skills/`→`core/skills/`, `nucleo/contrato/`→`core/contracts/`, `cambios/hechos/`→`changes/done/`, `pruebas/aceptacion/`→`tests/acceptance/`, `pruebas/revisor-luna/`→`tests/luna-reviewer/`, `planificar-cambio`→`plan-change`, `COMPLETADO`/`PAUSA`→`DONE`/`PAUSED` y `listo`/`parcial`→`done`/`partial` en `docs/kit-run.md`, `modelos.json`→`models.json`, nombres de skills en `docs/guide.md`. No se reescribió prosa.
  - Regresiones corregidas tras un reemplazo global: `auditoria-servicios-constructor.md` (AGENTS.md:17, nombre real), `principales` (README.md:24, había quedado `planneres`), `planificar-cambio` (docs/practicas-por-tecnologia.md:72), `docs/evaluaciones/builder.md` → `constructor.md` (docs/guide.md, archivo existente), y los enlaces `pruebas/revisor-luna/` de `evals/README.md`.
  - Comprobación: `./verify` exit 0 y VERIFY OK tras la última edición; enlaces relativos rotos = 0 en los documentos de TODO 3 y en los de TODO 1 y 2.
  - Motivo de la pausa: el resumen de la sesión anterior daba por aceptadas las cuatro coincidencias de A1. No es una decisión del constructor, así que TODO 1 y 2 quedan sin marcar. Las coincidencias son nombres reales: `AGENTS.md:43` y `:45` (`old/v1/` con `pruebas/` y `pruebas/.temporales/`), `docs/guide.md:53` (`docs/evaluaciones/constructor.md`).
  - Decisión pendiente del principal (TODO 1 y 2). Opciones:
    (a) (recomendada) Aceptar esas coincidencias como excepciones documentadas, marcar TODO 1 y 2 con esta nota como evidencia y seguir con el tramo 7.
    (b) Reescribir `AGENTS.md:43` y `:45` sin el nombre `pruebas/` y ampliar la A1 para excluir nombres de archivo `*constructor.md`. Esto cambia la Aceptación, que solo el principal puede modificar.
    (c) Renombrar `docs/evaluaciones/constructor.md` y ajustar su enlace en `docs/guide.md`. Sale de «solo rutas y enlaces» del TODO 2 y toca un documento histórico.
  - Citas históricas dejadas a propósito (TODO 3): `docs/decisions/cleanup.md` y `structure.md` (34 líneas de inventario con `nucleo/`, `agentes/`, `cambios/` y `pruebas/`, que documentan el cambio); `docs/evaluaciones/*` (131 líneas) y `docs/investigaciones/*` (136 líneas), que citan nombres de su fecha; `evals/README.md:21` (`pruebas/comparar-openspec/`, que el propio texto dice que no existe); `evals/arquitectura-cambios/*` (solo el nombre de la carpeta); `docs/evaluaciones/openspec/hashes-iniciales.sha256` (sin tocar, 83 entradas de historial de hashes). Los contratos históricos no se editan.
  - Retomar: con la decisión, marcar TODO 1 y 2 de `tramo-6.md` con la evidencia de la opción elegida, cambiar `segment: 7` y empezar el tramo 7. Si se elige (b) o (c), el principal lo indica en el mismo mensaje.
- Resuelto por el principal tras la PAUSA del tramo 6: opción (a). Se aceptan como excepciones documentadas `AGENTS.md:17` y `docs/guide.md:53` (`constructor.md`, nombre real de archivo) y `AGENTS.md:43`/`:45` (`old/v1/` y `pruebas/.temporales/`, nombres reales). Marca TODO 1 y 2 del tramo 6 con esta nota, pasa a `segment: 7` y ejecútalo completo (migrador, migración de planes en curso, barrido final, AGENTS.md/README.md, `./verify`). Termina solo con DONE o PAUSED.
- Punto de control, tramo 7 (estado `done`; TODO 1 a 5 marcados en `tramo-7.md`):
  - Archivos tocados: `tools/install/migration/names.sh` (nuevo), `install.sh` (opción `--migrate-names`, ayuda y envío), `tests/migration/names.test.mjs` (nuevo), `AGENTS.md` (claves `executor:` y `continuity:`, líneas 12 y 13), los seis planes en curso (vocabulario, sin mover archivos), `changes/estandarizar-ingles/plan.md` (estado y evidencia) y `changes/estandarizar-ingles/tramo-7.md` (casillas).
  - Resumen del diff: migrador nuevo; en los planes solo cambian claves, secciones y etiquetas, no la prosa ni la evidencia; `changes/done/`, `old/` y `HISTORY.md` sin tocar en este tramo. Sin commit, sin `git mv`/`git rm`, sin escribir el índice.
  - Comprobación: TODO 1 a 5 (ver Evidencia de este tramo); `./verify` VERIFY OK.
  - Decisión de alcance dentro del tramo: TODO 3 se aplicó a los seis planes en curso y a `plan.md`, no con `--migrate-names .`. Los tramos 1 a 4 y 7 de este plan conservan etiquetas en español (`Dependencias:`, `### Tramo N`, `Alcance:`) y no se reescribieron; el tramo 6 ya usa el vocabulario nuevo. Migrarlos es decisión del principal.
- Residuales (fuera del TODO de este tramo o pendientes de decisión):
  1. `plan.md` supera el límite de 8192 bytes del revisor (aviso único de `revisar-plan`).
  2. `./verify` no ejecuta `tests/migration/names.test.mjs`; añadirlo a la suite es decisión del principal.
  3. Nombres de archivo en español en `tests/` (`probar.mjs`, `medir.mjs`, `protocolo.mjs`, `huella.test.mjs`, `huella-reference.mjs`, `evidencia-real.md`, `estructura.test.mjs`, `generacion.test.mjs`, `hook.test.mjs`): la nota del tramo 5 los asignaba al tramo 7, pero `tramo-7.md` no los incluye; no se renombraron.
  4. `docs/evaluaciones/openspec/hashes-iniciales.sha256`: la nota del tramo 6 lo asignaba al tramo 7 para decidir; no se tomó la decisión y no se tocó.
  5. `docs/guide.md:18` conserva `continuidad: continua` y `### Tramo N`; está fuera del barrido de TODO 4 (solo `README.md` y `AGENTS.md`).
  6. El migrador no traduce la prosa WHEN/THEN, `## Aceptación` ni `## Escenarios`, y conserva `tramo-N.md`, que es el nombre vigente del código del kit.
  7. El migrador no quita los agentes globales `constructor` y `principal` de `~/.claude/agents`; se actualizan al reinstalar con `install.sh`.
  8. La prueba `names.test.mjs` no comprueba que la sección de evidencia quede sin cambios.
  9. `changes/HISTORY.md` sigue modificado desde el tramo 3, sin decisión del principal.
- Revisión del principal, tramos 6 y 7: migrador, su prueba (3/3) y `./verify` bien. Defectos devueltos: nombres de archivo en español en `scripts/` y `tests/`, `docs/guide.md:18` con claves viejas y la prueba del migrador fuera de `./verify`. Se añade el tramo 8 (`tramo-8.md`); ejecútalo completo y termina solo con DONE o PAUSED.
- Punto de control, tramo 8 (estado `parcial`, PAUSA `motivo=ambiguo`; TODO 3 y 4 marcados; TODO 1 y 2 pendientes):
  - Archivos tocados. Renombrados con `mv` (sin `git mv`, sin escribir el índice): `scripts/revisar-plan.mjs`→`review-plan.mjs`, `scripts/permisos-hook.mjs`→`permissions-hook.mjs`, `scripts/tarifas.json`→`rates.json`, `tests/acceptance/uso.test.mjs`→`usage.test.mjs`, `tests/kit-run/probar.mjs`→`run.mjs`, `tests/usage/probar.mjs`→`run.mjs`, `tests/luna-reviewer/medir.mjs`→`measure.mjs`, `tests/continuity/protocolo.mjs`→`protocol.mjs`, `tests/diagnosis-suggests/huella*`→`fingerprint*`, `tests/permissions-contract/{estructura,generacion}.test.mjs`→`{structure,generation}.test.mjs`, `core/skills/diagnose/diagnosticar.mjs`→`diagnose.mjs`, y fixtures de `tests/review-plan/` y `tests/usage/fixtures/`. Se revirtieron a propósito `scripts/fixtures-observer/datos/{eventos,muestras,builds}.jsonl` y `README.txt`, porque cambiarlos cambia nombres de archivo en tiempo de ejecución.
  - Referencias: se actualizaron unos 325 archivos de texto con sed. Identificadores internos: `debeDiagnosticar`→`shouldDiagnose` y `diagnosticar`→`diagnose` en `scripts/observe.mjs` y `tools/observe/diagnose.mjs`; `huella()`→`fingerprint()` en las pruebas de fingerprint. Nuevo `tools/verify/names-migration.sh`, cargado desde `verify`. Editados `docs/guide.md:18` y `tests/diagnosis-suggests/fingerprint.test.mjs` (importación y llamadas).
  - Resumen del diff: solo renombres, referencias y cuatro identificadores. El comportamiento no cambia, salvo que la clave `huella` sigue sin tocarse (residual 1).
  - Comprobación: `./verify` exit 0 y VERIFY OK; `tests/migration/names.test.mjs` 3/3; `tests/diagnosis-suggests/fingerprint.test.mjs` 2/2. A1 de `git grep` no cumplido (2 archivos).
  - Residuales para el principal:
    1. Clave `huella` en `resultado.json` y en la salida del diagnóstico (`core/contracts/verificacion.md:21`, `core/skills/diagnose/result.mjs:11,32-35`). Opciones: (a) (recomendada) renombrar a `fingerprint` leyendo también `huella` por compatibilidad, y registrarlo como cambio de contrato; (b) mantener `huella` y declarar una excepción documentada en A1; (c) renombrar sin compatibilidad, que rompe los `resultado.json` existentes.
    2. Barrido de TODO 2: restos listados en Evidencia del tramo 8. Opciones: (a) (recomendada) aceptar como excepciones los datos de prueba (`tests/luna-reviewer/casos/*/evidencia.txt`, `tests/continuity/evidencia-real.md`) y `evals/arquitectura-cambios/`, y renombrar `core/skills/prepare-project/referencia.md`→`reference.md` con sus enlaces; (b) ampliar el Alcance para renombrar también `evals/` y los datos de prueba.
    3. Carpetas de planes en curso con nombre en español (`changes/proceso-rapido`, `changes/prueba-informe`, `changes/verificacion-general`). Opciones: (a) (recomendada) renombrarlas con `mv` y actualizar sus referencias en un tramo aparte; (b) aceptarlas como excepción.
    4. Nombres de runtime del observador (`datos/`, `eventos.jsonl`, `muestras.jsonl`, `--datos`, `--desde`). Recomendado: mantenerlos, porque renombrarlos cambia el comportamiento.
    5. Identificadores en español en código, no nombres de archivo (p. ej. `diagnosticar` en `core/skills/diagnose/diagnose.mjs:170`, `tests/permissions-contract/structure.test.mjs:29`). Quedan para otra pasada.
    6. `plan.md` supera el límite del revisor de 8192 bytes (residual de tramos 5 a 7).
  - Retomar: decidir 1, 2 y 3. Con esas decisiones, marcar TODO 1 y 2 de `tramo-8.md` con su evidencia, pasar `status: done` y terminar. `old/`, `changes/done/` y `docs/evaluaciones/` no se tocaron.
- Resuelto por el principal tras la PAUSED del tramo 8: clave `huella` → opción (a): renombrar a `fingerprint`, leer `huella` por compatibilidad y anotarlo como cambio de contrato en Notes. Barrido → opción (a) con ajuste: excepciones aprobadas los datos de prueba, `evals/` y los nombres de las carpetas de planes en curso (`changes/proceso-rapido`, `prueba-informe`, `verificacion-general`, nombres de feature, no vocabulario del kit); renombra `referencia.md` con mv y sus referencias. Marca TODO 1 y 2 con esta nota y termina con DONE o PAUSED.
- Punto de control, tramo 8 (estado `listo`, DONE): TODO 1 y 2 de `tramo-8.md` marcados con evidencia (plan, Evidencia del tramo 8, «Corrección tras la resolución del principal»). Archivos tocados: `core/skills/diagnose/result.mjs`, `core/skills/diagnose/diagnose.mjs`, `core/contracts/verification.md` (mv), `core/skills/prepare-project/reference.md` (mv), `tests/diagnosis-suggests/fingerprint.test.mjs`, `tests/permissions-v2.test.mjs`, `tests/permissions-contract/structure.test.mjs` y las referencias listadas en Evidencia. Decisiones aplicadas: (1) cambio de contrato: `resultado.json` pasa de `huella` a `fingerprint`; se lee `huella` como clave heredada y el kit no la escribe; (2) barrido con excepciones aprobadas; (3) `referencia.md` renombrado con mv. Residual aceptado: el plan supera 8192 bytes (revisor, tramos 5 a 7). Sin commit, sin `git mv`/`git rm`, sin escribir el índice. Comprobación: `./verify` exit 0 y VERIFY OK; 9/9 pruebas de fingerprint, permisos y estructura.
