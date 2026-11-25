---
status: done
branch: fix/verify-sandbox-eperm
base: main
repos: [.]
executor: builder
segment: 8
continuity: continuous
type: code
---
# Corregir `./verify` dentro del sandbox del constructor (`spawnSync bash EPERM`)

## Goal
Que `./verify` pase dentro del sandbox del constructor sin abrir permisos más de lo necesario, y que una prueba detecte la regresión. Causa raíz probada (stdin pipe en spawn síncrono); historias pendientes de la decisión de alcance.

## Exploration
Detalle completo, con la evidencia de las tres corridas y la auditoría: [exploracion.md](exploracion.md).
- Probado (Codex 0.172.0 `workspace-write`, Node v24.22.1, WSL2): `spawnSync`/`execFileSync` con **stdin como pipe** devuelve `error.code 'EPERM'` aunque el hijo corre y sale con `status 0`. Con stdin `ignore`/`inherit` y `spawn` asíncrono no ocurre.
- Supuesto, sin probar: la syscall denegada es una operación sobre el socketpair de stdin.
- Auditoría: ~60 llamadas en ~29 archivos fuera de `old/`; el reproductor está en `fixture/repro.mjs`.
- Sin reproducción en Claude Code: el fallo es del sandbox de Codex (`kit run` lo lanza con `--sandbox workspace-write`).

## Evaluation
| Opción | Beneficio | Costo | Riesgo |
|---|---|---|---|
| **A. Helper `stdin: ignore` por defecto + migrar todas las llamadas + prueba estática en `./verify` (recomendada, elegida)** | Corrige la causa probada; la prueba impide reintroducirla; no toca sandbox, deny ni hook | ~29 archivos en 7 tramos; los 3 sitios con `input` usan un archivo como stdin (por probar en Codex) | Bajo: solo cambia stdio de hijos de prueba; `status`/`stdout`/`stderr` se leen igual |
| B. `stdio: ["ignore","pipe","pipe"]` literal en cada sitio | Sin módulo nuevo | Repite el valor y es fácil olvidarlo | Igual; la prueba estática lo cubre |
| C. Solo la prueba estática + arreglar lo que falle | Menos archivos | No puedo correr `./verify` bajo Codex; deja sitios latentes | Medio |
| D. Solo documentar la regla | Nada que romper | No corrige `./verify` en Codex | Alto: el fallo sigue |
Descartadas (no son seguras): ignorar `result.error` cuando hay `status` (oculta errores reales de verdad); abrir permisos de `workspace-write` o `danger-full-access` (debilita la barrera); correr `./verify` fuera del sandbox (esconde el fallo); tocar deny o hook (no participan). Opción A elegida por la persona usuaria.
Nota: `core/skills/diagnose/fingerprint.mjs` se instala copiado en otros proyectos y no puede importar el helper; usa `stdio` literal.

## Assumptions
- Confirmado por la persona usuaria (2026-11-24): el fallo ocurrió con Codex (`codex exec --sandbox workspace-write`).
- Una prueba viva bajo el sandbox de Codex no corre en Claude Code: la regresión se cubre con una prueba estática. La confirmación en vivo la hace la persona usuaria (`codex exec --sandbox workspace-write` corriendo `./verify`). Si prefiere que sea automática, habría que añadir un paso que requiera Codex.
- Los hijos de estas pruebas no leen stdin (salvo los 3 con `input`). Si alguno lo lee, `ignore` lo haría ver EOF: el builder lo anota y lo devuelve.
- El paso nuevo de `./verify` es el 19 (el builder confirma el número real).

## Decisions already taken
- Alcance A (helper + migrar todo + prueba estática), elegido el 2026-11-24.
- No se debilita ninguna regla deny ni el hook; ningún tramo toca `scripts/permissions-hook.mjs`, `adapters/` ni el instalador.
- Executor: builder, because (1) requisitos cubiertos, (2) contexto y prerrequisitos accesibles, (3) cada tramo tiene comprobación con resultado esperado y el bloqueo posible (hijo que lee stdin) está contemplado, (4) sin credenciales, despliegue ni producción; el cambio no es pequeño.
- Tramo 7 (2026-11-24): `tests/luna-reviewer/measure.mjs` lanza `codex` real y el Handoff pide no correrlo: solo se pasó `node --check` (exit 0). Los demás checks del tramo usan codex o agentes falsos en el PATH (`tests/kit-run`, `tests/progress`) o no lanzan agente; el plan no fija duración medida previa, así que cada check tiene tope `timeout 120` (`timeout 300` en acceptance), no alcanzado; duraciones medidas: progress 13 s, kit-run 20 s, kit-scope 1 s, kit-close 0 s, kit-check 1 s, usage 2 s, runs-report 0 s, review-plan 1 s, acceptance 20 s.
- Tramo 6 (2026-11-24): ningún check lanzó un agente real (`node --test`; `codex --version` y `codex execpolicy check` no ejecutan agente), así que no se sustituyó nada por `node --check`. Tope de corrida `timeout 120` porque la duración del tramo está medida solo como «segundos»; la corrida tardó ≈5 s.

- Tramo 8 (2026-11-24): el escaneo de `tests/spawn-seguro/estatico.mjs` resuelve `const X = {...}` del mismo archivo y `...X` dentro de las opciones (caso `core/skills/diagnose/fingerprint.mjs`, sin relajar la regla de stdin). La excepción de un control crudo es el comentario `estatico: control-crudo` en la línea de la llamada, no una exención por ruta; `tools/spawn/sync-seguro.mjs` sí queda exento por ruta (es el helper).

## Validation
Pendiente de Gate 1: la persona usuaria aprueba el plan. Alcance confirmado el 2026-11-24.

## Scope
`tools/spawn/`, `tools/run/{profiles,process,tree-fingerprint}.mjs`, `tools/check/{ejecutar,cambios}.mjs`, `tools/observe/diagnose.mjs`, `core/skills/diagnose/fingerprint.mjs`, `tests/**` y `tools/verify/` (solo los archivos nombrados en cada tramo), `verify` (un paso nuevo). Fuera de alcance: `old/`, `evals/`, `changes/done/`, `scripts/permissions-hook.mjs`, `adapters/`, `install.sh`, reglas deny.

## Verification
`./verify` — define «hecho» (Nivel 3, solo en el último tramo). Intermedios: la `Segment verification:` de cada tramo. Confirmación en vivo (la hace la persona usuaria, fuera de este plan): `codex exec --sandbox workspace-write` corriendo `./verify` sin EPERM.

## Stop conditions
Seguir si la comprobación pasa, el siguiente paso queda en Scope y no falta una decisión. Parar con nota si la misma causa falla dos veces, hay que salir de Scope, falta una decisión, o una comprobación tarda más del doble de su duración medida. Si un hijo necesita stdin real y el archivo-como-stdin falla, parar y anotar.
Duraciones medidas: `./verify` completo ≈1 min 38 s (Claude Code, 2026-11-24); pruebas de tramo unitarias, segundos.
Revisión: fin de historia.

## Steps

- [Segment 1](tramo-1.md): helper de spawn síncrono seguro
- [Segment 2](tramo-2.md): llamadas de `tools/run` sin stdin pipe
- [Segment 3](tramo-3.md): `tools/check` y `tools/observe`
- [Segment 4](tramo-4.md): skill `diagnose` instalable
- [Segment 5](tramo-5.md): pruebas A (contrato, continuidad, huella)
- [Segment 6](tramo-6.md): pruebas B (permisos y migración)
- [Segment 7](tramo-7.md): pruebas C (kit run, progreso, informes)
- [Segment 8](tramo-8.md): prueba estática de regresión en `./verify`

## Evidence
Segment 1 (historia «helper de spawn síncrono seguro»): comprobaciones y salidas reales en [tramo-1.md](tramo-1.md), sección Evidence. `node tests/spawn-seguro/run.mjs` → exit 0 (6 casos).
Segment 2 (historia «llamadas de `tools/run` sin stdin pipe»): comprobaciones y salidas reales en [tramo-2.md](tramo-2.md), sección Evidence. `node tests/kit-run/run.mjs` → exit 0 (45 casos); `node tests/progress/run.mjs` → exit 0 (44 casos).
Segment 3 (historia «`tools/check` y `tools/observe`»): comprobaciones y salidas reales en [tramo-3.md](tramo-3.md), sección Evidence. `node tests/kit-check/run.mjs && node tests/kit-scope/run.mjs` → exit 0.
Segment 4 (historia «skill `diagnose` instalable»): comprobaciones y salidas reales en [tramo-4.md](tramo-4.md), sección Evidence. `node --test tests/diagnosis-suggests/*.test.mjs` → exit 0 (3 casos).
Segment 5 (historia «pruebas A», parcial): pasos 1 y 3 comprobados en [tramo-5.md](tramo-5.md), sección Evidence. `node tests/builder-contract.mjs` → exit 0; `node --test tests/diagnosis-suggests/fingerprint.test.mjs tools/verify/fingerprint-module.test.mjs` → exit 0 (6 casos). Paso 2 (`tests/continuity/protocol.mjs`) pendiente: no ejecutado.
Segment 6 (historia «pruebas B (permisos y migración)»): comprobaciones y salidas reales en [tramo-6.md](tramo-6.md), sección Evidence. `node --test tests/permissions-v2.test.mjs tests/permissions-contract/*.test.mjs tests/migration/names.test.mjs` → exit 0 (19 casos).
Segment 7 (historia «pruebas C (kit run, progreso, informes)»): comprobaciones y salidas reales en [tramo-7.md](tramo-7.md), sección Evidence. `node tests/progress/run.mjs` → exit 0 (44 casos); `node tests/kit-run/run.mjs` → exit 0 (45 casos); `node tests/kit-scope/run.mjs`, `node tests/kit-close/run.mjs` y `node tests/kit-check/run.mjs` → exit 0; `node tests/usage/run.mjs`, `node tests/runs-report/run.mjs` y `node --test tests/review-plan/review-plan.test.mjs` → exit 0 (15 casos); `node --test tests/acceptance/*.test.mjs` → exit 0 (3 casos, segment verification, A9). `node --check tests/luna-reviewer/measure.mjs` → exit 0 (sin ejecutar: lanza `codex`).
Segment 8 (historia «prueba estática de regresión en `./verify`»): TODO 1 a 4 cumplidos, salidas en [tramo-8.md](tramo-8.md), sección Evidence. `node tests/spawn-seguro/estatico.mjs` → exit 0 (14 llamadas); `--fixture-mala` → exit 1 (`tools/llamada-mala.mjs:2`); `--vacio` → exit 1; `bash -n tools/verify/usage-and-run.sh` → exit 0. `./verify` → exit 1 en el intento 1 (paso 8r, causa corregida); reanudación: `./verify` completo → exit 0 (`VERIFY OK`, pasos 19 y 8r pasan). Segmento verificado; salida en [tramo-8.md](tramo-8.md).

## Notes
- Checkpoint segment 1 (historia completa; fin de historia, revisión del planner en contexto nuevo):
  - Archivos nuevos: `tools/spawn/sync-seguro.mjs` (exporta `prepararStdio`, `spawnSyncSeguro`, `execFileSyncSeguro`; A1 stdin `ignore`, A2 `input` por archivo temporal borrado al terminar, A3 `stdio` explícito intacto) y `tests/spawn-seguro/run.mjs` (casos A1, A2, A3 y control con `spawnSync` crudo).
  - Sin cambios en archivos existentes; no se tocó Scope fuera de `tools/spawn/` y `tests/spawn-seguro/`.
  - Check: `node --check` exit 0; `node tests/spawn-seguro/run.mjs` exit 0.
  - No verificado bajo Codex `workspace-write` (el EPERM no se reproduce desde Claude Code). La prueba A2 con archivo como stdin queda por confirmar en vivo, como anota el Handoff del tramo.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` ya activa (no se creó nada). `git status` muestra además dotfiles sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.gitmodules`, `.profile`, `.zshrc`, etc.) que no creó el builder y no se tocaron; el planner debe decidir si se excluyen antes del commit.
  - Pendiente para la siguiente historia (tramo 2): no iniciado; el plan queda con `segment: 1`.
- Checkpoint segment 2 (historia completa «llamadas de `tools/run` sin stdin pipe»; fin de historia, revisión del planner en contexto nuevo):
  - Archivos cambiados: `tools/run/profiles.mjs` (4 `spawnSync` → `spawnSyncSeguro`, import desde `../spawn/sync-seguro.mjs`), `tools/run/tree-fingerprint.mjs` (3 `spawnSync` → `spawnSyncSeguro`, mismo import), `tools/run/process.mjs` (1 `spawnSync` de `correr` → `spawnSyncSeguro`; sigue pasando `input`, que el helper entrega por archivo temporal, A2).
  - Diff: 3 archivos, 11 inserciones y 11 eliminaciones, solo cambian el import y el nombre de la función; `encoding`, `cwd`, `maxBuffer`, `shell`, `timeout` y el resultado (`status`, `stdout`, `stderr`, `error`) no cambian. Sin cambios en `tests/`.
  - Check: `node tests/kit-run/run.mjs` exit 0 (45 casos); `node tests/progress/run.mjs` exit 0 (44 casos). Duración previa medida 33 s; tope 2x = 66 s, no se alcanzó. Grep final: sin `spawnSync` crudo en los 3 archivos (solo un comentario).
  - Fuera de este run: no se verificó bajo el sandbox de Codex. El paso de `input` por archivo temporal como stdin de `correr` (process.mjs) queda por confirmar en vivo, igual que A2 en el tramo 1.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` ya activa (no se creó ni se hizo commit). Dotfiles sin seguimiento en la raíz (`.bashrc`, `.gitconfig`, `.zshrc`, etc.) no tocados, como se pidió.
  - Parada: la historia 2 está completa; no se avanzó a la historia 3 (otra historia). `segment:` queda en 2 para que el planner revise en contexto nuevo y reapruebe el siguiente tramo; `status: done` por la comprobación del tramo.
- Checkpoint segment 3 (historia completa «`tools/check` y `tools/observe`»; fin de historia, revisión del planner en contexto nuevo):
  - Archivos cambiados: `tools/check/ejecutar.mjs` (una línea: `stdio: ["ignore", "pipe", "pipe"]` en el `spawnSync` de la línea 74; resto de opciones iguales) y `tools/observe/diagnose.mjs` (import de `spawnSyncSeguro` desde `../spawn/sync-seguro.mjs`; 2 llamadas de docker migradas, `encoding: "utf8"` intacto).
  - `tools/check/cambios.mjs` no se tocó: ya usaba `stdio: ["ignore", "pipe", "pipe"]` en su `execFileSync`, cumple A5 (el paso admite helper o `stdio` literal).
  - Diff: 2 archivos, 5 inserciones y 3 eliminaciones. Sin cambios en `tests/` ni en Scope fuera de `tools/check/` y `tools/observe/`.
  - Check: `node tests/kit-check/run.mjs && node tests/kit-scope/run.mjs` exit 0. Duración previa medida ≈1 s (tope 2x no se alcanzó).
  - Sin Resuelto ni decisiones nuevas. No verificado bajo Codex `workspace-write`; la confirmación en vivo queda en el plan (Assumptions).
  - Estado Git observado: rama `fix/verify-sandbox-eperm` activa (no se creó nada, sin commit). Dotfiles sin seguimiento de la raíz no tocados, como se pidió.
  - Parada: historia 3 completa; no se avanzó a la historia 4. `segment:` queda en 3 para que el planner revise en contexto nuevo y reapruebe el tramo 4; `status: done` por la comprobación del tramo.
- Checkpoint segment 4 (historia completa «skill `diagnose` instalable»; fin de historia, revisión del planner en contexto nuevo):
  - Archivos cambiados: `core/skills/diagnose/fingerprint.mjs` (una línea: `opts.stdio` pasa de `['ignore','pipe','ignore']` a `['ignore','pipe','pipe']`). Sin `import` nuevo; la skill sigue autocontenida. El stdin ya era `ignore` en las tres llamadas de git; el stderr no se imprime en ningún caso.
  - Diff: 1 línea. Sin cambios en `tests/`, en `tools/` ni fuera de Scope.
  - Check: `node --check` exit 0; `node --test tests/diagnosis-suggests/*.test.mjs` exit 0 (3 casos, huella sin cambios). Pendientes en tramo-4: 0.
  - Decisión menor: el paso pedía `stdio` literal; como stdin ya estaba en `ignore`, el único cambio real es el stderr, que sigue sin imprimirse. Anotado, no requiere decisión del usuario.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` activa (no se creó nada, sin commit). Dotfiles sin seguimiento de la raíz (`.bashrc`, `.zshrc`, `.gitmodules`, etc.) no tocados, como se pidió.
  - Parada: historia 4 completa; no se avanzó a la historia 5. `segment:` queda en 4 para que el planner revise en contexto nuevo y reapruebe el tramo 5; `status: done` por la comprobación del tramo.
- Checkpoint segment 5 (historia «pruebas A», PAUSADA a mitad de historia; `status: partial`):
  - Hecho (casillas 1 y 3 de tramo-5.md, con evidencia): `tests/builder-contract.mjs` (import y línea 215 → `spawnSyncSeguro`), `tests/diagnosis-suggests/fingerprint.test.mjs` (línea 18 → `spawnSyncSeguro`; `execFileSync` ya llevaba `stdio` literal), `tools/verify/fingerprint-module.test.mjs` (líneas 15 y 39 → `spawnSyncSeguro`). Migrado también `tests/continuity/protocol.mjs` (línea 39 `ejecutar` → `spawnSyncSeguro`), aunque su casilla sigue pendiente.
  - Diff: 4 archivos, 10 inserciones y 9 eliminaciones. Sin líneas `assert` borradas (A7). Espacio tras la coma en las llamadas migradas.
  - Check: `node tests/builder-contract.mjs` exit 0; `node --test tests/diagnosis-suggests/fingerprint.test.mjs tools/verify/fingerprint-module.test.mjs` exit 0 (6 casos). `node --check` de los 4 archivos exit 0.
  - Pendiente (casilla 2, `tests/continuity/protocol.mjs`): no ejecutada. Motivo: su check lanza `codex-builder` real (`LANZADOR`, 30 min por llamada) y no hay duración medida registrada para esta prueba; las «pruebas de tramo unitarias, segundos» del plan no la cubren. Se pausa antes de correrla (regla de continuidad). Reanudar: decidir si se autoriza la ejecución real (o registrar una duración medida); luego `node tests/continuity/protocol.mjs` con tope de 2x la duración medida, y después la `Segment verification:` del tramo 5 (`node --test tests/acceptance/builder-contract.test.mjs && node --test tests/diagnosis-suggests/*.test.mjs`).
  - Hallazgo para el tramo 8: `tests/acceptance/builder-contract.test.mjs` (no nombrado en el tramo 5) sigue con `spawnSync` sin `stdio`; la prueba estática debe decidir si lo cubre.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` activa; no se creó nada ni hubo commit. Dotfiles sin seguimiento de la raíz no tocados.
  - `segment:` queda en 5 (la historia no está completa).
- Revisión planner tramo 5 (APPROVED): defecto del plan, no del builder. `tests/continuity/protocol.mjs` lanza `codex-builder` real y no está en `./verify`; el check pasó a `node --check` (exit 0). Su corrida viva queda para la persona usuaria. Verificación del tramo: builder-contract y diagnosis-suggests exit 0; 0 líneas `assert` borradas. Hallazgo del builder: `tests/acceptance/builder-contract.test.mjs` sigue con `spawnSync` sin stdio; ya está en el tramo 7.
  Mejora para próximos planes: antes de poner un check, confirmar que el archivo no lance un agente real.
- Checkpoint segment 6 (historia completa «pruebas B (permisos y migración)»; fin de historia, revisión del planner en contexto nuevo):
  - Archivos cambiados: `tests/permissions-v2.test.mjs`, `tests/permissions-contract/hook.test.mjs`, `tests/permissions-contract/structure.test.mjs`, `tests/permissions-contract/generation.test.mjs`, `tests/migration/names.test.mjs`. Solo cambian el import y las llamadas de spawn (`spawnSync`/`execFileSync` → `spawnSyncSeguro`/`execFileSyncSeguro`). El `execFileSync` auxiliar de git en `hook.test.mjs` conserva `stdio` literal (A5).
  - Diff: 5 archivos, 25 inserciones y 24 eliminaciones. Una línea `assert` eliminada y una añadida: la aserción `comprobar` → `ausente`, migrada en su sitio con el mismo valor. Ninguna aserción retirada (handoff del tramo).
  - Corrección antes del cierre: dos llamadas migradas sin espacio tras la coma (`raiz],{` en `hook.test.mjs` y `"bash",[` en `names.test.mjs`) se corrigieron, según la instrucción de la persona usuaria.
  - Check: `node --test tests/permissions-v2.test.mjs tests/permissions-contract/*.test.mjs tests/migration/names.test.mjs` exit 0 (19 casos). Pasos 1, 2 y 3 del tramo, exit 0. `node --check` exit 0 en los 5 archivos.
  - Tope: duración no medida (solo «segundos» en el plan); corrida con `timeout 120`, no alcanzado (≈5 s).
  - Ningún check lanzó un agente real; no hizo falta `node --check` como sustituto. No verificado bajo Codex `workspace-write`; la confirmación viva queda para la persona usuaria.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` activa; no hubo commit ni push. Dotfiles sin seguimiento de la raíz no tocados.
  - Parada: historia «pruebas B» completa; no se avanzó a «pruebas C» (tramo 7). `segment:` queda en 6 para la revisión del planner; `status: done` por la comprobación del tramo.
- Checkpoint segment 7 (historia completa «pruebas C (kit run, progreso, informes)»; fin de historia, revisión del planner en contexto nuevo):
  - Archivos cambiados (12): `tests/progress/run.mjs`, `tests/kit-run/run.mjs`, `tests/kit-scope/run.mjs`, `tests/kit-close/run.mjs`, `tests/kit-check/run.mjs`, `tests/usage/run.mjs`, `tests/runs-report/run.mjs`, `tests/review-plan/review-plan.test.mjs`, `tests/acceptance/builder-contract.test.mjs`, `tests/acceptance/kit-run.test.mjs`, `tests/acceptance/usage.test.mjs`, `tests/luna-reviewer/measure.mjs`. Solo cambian el import (`spawnSyncSeguro`/`execFileSyncSeguro` desde `../../tools/spawn/sync-seguro.mjs`; `spawn` se conserva en `progress/run.mjs`) y las llamadas. Incluye los `input` de `progress/run.mjs` (:291 y :589) y de `measure.mjs`, que el helper entrega por archivo temporal.
  - Diff: 12 archivos, 45 inserciones y 44 eliminaciones. Ninguna aserción retirada: la única línea `assert` cambiada es `progress/run.mjs`, donde solo cambia la llamada dentro del `assert.equal`. Espacio tras la coma en las llamadas migradas.
  - Check: `node tests/progress/run.mjs` exit 0 (44); `node tests/kit-run/run.mjs` exit 0 (45); `node tests/kit-scope/run.mjs`, `node tests/kit-close/run.mjs`, `node tests/kit-check/run.mjs` exit 0; `node tests/usage/run.mjs`, `node tests/runs-report/run.mjs`, `node --test tests/review-plan/review-plan.test.mjs` exit 0; `node --test tests/acceptance/*.test.mjs` exit 0 (3 casos, 20 s, Segment verification). Sin `spawnSync`/`execFileSync` crudo en los 12 archivos. `node --check` exit 0 en los 11 de prueba y en `measure.mjs`.
  - Decisión menor: `measure.mjs` no se ejecutó (lanza `codex`); anotado en Decisions. No es un bloqueo.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` activa; no se creó ni se hizo commit ni push. Dotfiles sin seguimiento de la raíz no tocados, como se pidió.
  - Parada: historia «pruebas C» completa; el tramo 8 (prueba estática en `./verify`, otra historia) no se avanzó. `segment:` queda en 7 para la revisión del planner; `status: done` por la comprobación del tramo.

- Revisión planner tramo 7 (APPROVED): diff solo de imports y llamadas; node --check measure.mjs y acceptance exit 0. tools/run/registro.mjs es falso positivo (spawnSync solo en un comentario). Tramo 8: la prueba estática debe ignorar comentarios.
- Checkpoint segment 8 (historia «prueba estática de regresión en `./verify`»; PAUSED, motivo=scope; `segment:` queda en 8):
  - Archivos cambiados: `tests/spawn-seguro/estatico.mjs` (nuevo: escaneo con `--fixture-mala` y `--vacio`), `tests/spawn-seguro/run.mjs` (la marca `estatico: control-crudo` en la línea de la llamada control; sin cambio de semántica), `tools/verify/usage-and-run.sh` (+9 líneas: paso 19), `AGENTS.md` (+1 línea), `tests/README.md` (+1 fila). `tests/spawn-seguro/` es nueva y sin seguimiento; `git diff --stat` solo recoge las tres modificadas (11 inserciones).
  - Escaneo: 14 llamadas en 96 archivos; 3 exentas (2 del helper por ruta en `tools/spawn/sync-seguro.mjs`, 1 control marcado). Dos ajustes antes de la pasada: (a) resolver `const opts = {...}` del mismo archivo y `...opts`, caso de `core/skills/diagnose/fingerprint.mjs:29,31,34` (stdin es `ignore`: falso positivo del escaneo, no relajado); (b) excepción visible por línea para el control de `tests/spawn-seguro/run.mjs:57`.
  - Hallazgo pedido (producción): ningún archivo de producción tiene llamada síncrona con stdin pipe. Las llamadas crudas que quedan en producción dejan stdin fuera de pipe: `tools/check/ejecutar.mjs:74` y `tools/check/cambios.mjs:12` (`stdio: ["ignore","pipe","pipe"]`), `scripts/kit-run.mjs:89` (`["ignore","ignore","inherit"]`) y `core/skills/diagnose/fingerprint.mjs:29,31,34` (`opts` con `ignore`). `tests/acceptance/builder-contract.test.mjs` (hallazgo del tramo 7) usa `spawnSyncSeguro`; no queda llamada cruda.
  - Checks: `node tests/spawn-seguro/estatico.mjs` exit 0 (14 llamadas); `--fixture-mala` exit 1; `--vacio` exit 1; `bash -n tools/verify/usage-and-run.sh` exit 0; `rg -c "spawn-seguro" AGENTS.md tests/README.md` → 2 coincidencias; `node tests/spawn-seguro/run.mjs` exit 0 (6 casos).
  - Verificación del segmento NO pasa: `./verify` exit 1. El paso 19 imprime `ok 19`; el run se detiene en el paso 8r con `FALLO: 8r: informe filtrado sin builds del fixture` (`tools/verify/docker-observer.sh:32`). Causa: regresión de un tramo anterior. `tools/observe/diagnose.mjs` importa `../spawn/sync-seguro.mjs` (migrado al helper) y el paso 8r copia solo `tools/observe` y `scripts/observe.mjs` a un kit temporal; ahí el import falla (`ERR_MODULE_NOT_FOUND`, exit 1). En HEAD pasa porque `diagnose.mjs` usaba `spawnSync` directo. Log: `/tmp/claude-1000/verify-tramo8.log`.
  - Por qué se pausa: el arreglo mínimo es copiar también `tools/spawn` en `tools/verify/docker-observer.sh` (junto a `cp -R tools/observe`). Ese archivo está fuera del Scope de este tramo (solo `tools/verify/usage-and-run.sh`), así que no se edita. Copiar el helper dentro de `tools/observe` se descarta: duplicaría código.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` activa; sin commit ni push. Dotfiles y `changes/` sin tocar fuera de este plan.
  - Reanudación: (1) decidir si `tools/verify/docker-observer.sh` entra en Scope (recomendado: sí, una línea de `cp`); (2) aplicarla; (3) repetir `./verify` completo (el paso 19 ya pasa). No hay que repetir los tramos 1 a 7.

- Revisión planner tramo 8 (PAUSED, resuelto): causa verificada, `tools/observe/diagnose.mjs:4` importa `../spawn/sync-seguro.mjs` y `docker-observer.sh:18` copia solo `tools/observe`. Defecto de Scope del plan. Se añade `tools/verify/docker-observer.sh` al Scope; el builder aplica el `cp -R tools/spawn` y repite `./verify`. Mejora: al migrar un módulo, buscar kits temporales que lo copien.
- Checkpoint segment 8 (reanudación, historia «prueba estática de regresión en `./verify`»; fin de la última historia del plan, revisión del planner en contexto nuevo):
  - Archivos cambiados en esta reanudación: `tools/verify/docker-observer.sh` (una línea: `cp -R tools/spawn "$T8R/kit con espacios/tools/"` tras la línea `cp -R tools/observe`, paso 8r). Sin otros cambios.
  - Check: `bash -n tools/verify/docker-observer.sh` exit 0; `./verify` completo exit 0 (`VERIFY OK`; paso 19 `ok 19`; paso 8r `ok 8r A1-A3`, `ok 8r idioma`, `ok 8r negativa`, `ok 8r A4`). Una sola corrida. Log en el scratchpad de la sesión (`verify-tramo8-r2.log`); salida en `tramo-8.md`, sección Evidence.
  - Pendientes: 0 casillas en `tramo-8.md` (TODO 1 a 4 marcados). Duración de `./verify` no registrada en esta corrida.
  - Estado Git observado: rama `fix/verify-sandbox-eperm` activa; no se creó nada en Git.
  - Parada: última historia del plan completa; `status: done` por la comprobación del tramo. Revisión del planner pendiente antes de cerrar.
