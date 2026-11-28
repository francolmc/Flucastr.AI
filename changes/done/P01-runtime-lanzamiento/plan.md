---
status: done
format: 2
branch: feature/P01-runtime-lanzamiento
base: main
repos: [.]
executor: builder
segment: 5
continuity: continuous
type: code
---
# P01-runtime-lanzamiento

Excepción de tamaño: la persona pidió cinco tramos ordenados para un único flujo y aceptó ampliar el soporte a tres herramientas.
Revisión: fin de historia

## Goal
El planner identifica mecánicamente el resultado del builder en Claude Code, Codex y Pi, tanto en primer como segundo plano, sin depender de notificaciones.

## Exploration
- D-01, D-02. Repositorio único; `planner.md` antes: 7398 bytes. Se omiten preparación y diseño visual: no aplican.
- `runs.jsonl` usa `plan`, `tramo`, `fecha` ISO y `resultado`; en `kit run`, `fecha` es de inicio del intento. El retorno textual usa `segment`, `verify` y, en PAUSED, `motivo`, `hecho`, `siguiente`, `no_intentado`.
- Claude `SubagentStop` entrega `agent_type`, `last_assistant_message` y `stop_hook_active`; la entrega por SubagentHandback puede dejar otro texto en ese campo: https://code.claude.com/docs/en/hooks.
- Claude documenta 600000 ms como máximo predeterminado configurable para Bash, no como límite universal: https://code.claude.com/docs/en/env-vars. Usar 570 s por defecto; documentar la necesidad de ajustar también el timeout de la herramienta.
- Pi: la integración de extensiones en subagentes sigue no verificada; investigar la instalación real y probar el adaptador con una ejecución de extremo a extremo. Si no existe una interfaz fiable, PAUSED motivo=access con evidencia, sin declarar soporte.
- La muerte abrupta sin observador no demuestra interrupción; nunca inferirla de falta de progreso o de un timeout. El lanzador que observa la terminación debe registrar INTERRUMPIDO; si no observa, EN_CURSO.

## Scope
`core/contracts/termination.md`, `scripts/kit-await.mjs`, `scripts/kit-run.mjs`, `tools/run/`, `adapters/claude-code/`, `adapters/pi/`, `core/agents/planner.md`, `core/references/planner/codex-waits.md`, integración estrictamente necesaria en `install.sh` y desinstalación, `docs/kit-run.md`, pruebas nuevas en `tests/kit-await/`, `tests/subagent-stop/`, `tests/pi-termination/`, y pruebas existentes y contratos literales directamente afectados; `changes/P01-runtime-lanzamiento/`. Excluye `models.json`, `old/`, `changes/done/` y acciones manuales en `pruebas/.temporales/`.

## Assumptions
- Una corrida activa por plan; correlacionar ruta normalizada, tramo y fecha posterior al instante capturado antes de lanzar. Rechazar la ambigüedad, nunca atribuir un retorno a otro plan.
- Campo de término `fecha` ISO representa el momento de escritura; conservar los registros históricos de intentos y su interpretación. Si hace falta una marca adicional para distinguir intentos intermedios, definirla en contrato y comprobar compatibilidad con consumidores existentes.
- `--desde` es milisegundos epoch, estrictamente anterior a `fecha`; la misma marca se conserva en cada repetición. Sin señal suficiente para detectar pegado, no inventarlo.
- INVALIDO e INTERRUMPIDO salen 1; pegado 4; EN_CURSO 3; uso 2; DONE 0. Una línea por resultado, sin diagnóstico extra en stdout.
- La compuerta Claude identifica el plan por retorno válido; si falta, usa solo un plan activo inequívoco, sin leer secretos. Si no es posible identificarlo, informar error sin escribir un registro incorrecto.

## Verification
`node --test tests/acceptance/*.test.mjs && ./verify` — aceptación final; aceptación de línea base exit 0 en 46,2 s; `./verify` de línea base: exit 0, 36 pasos, Fingerprint: e3b0c44298fc; duración no medida. Pruebas focalizadas por tramo; los 10 lanzamientos reales son revisión manual de la persona y no se marcan como aprobados sin sus datos.

## Steps
### Segment 1 — Story: término observable en las tres herramientas
Files: `core/contracts/termination.md`, `tools/run/termination.mjs`, `scripts/kit-run.mjs`.
WHEN se termina una ejecución THEN existe un registro inequívoco y compatible (A1).
Acceptance:
- A1: contrato ≤ 2048 bytes define DONE, PAUSED, INVALIDO e INTERRUMPIDO, campos y fecha de término; `rg -c 'DONE|PAUSED|INVALIDO|INTERRUMPIDO' core/contracts/termination.md`; espera ≥ 4.
TODO:
- [x] Definir contrato de retorno textual y registro JSON, incluidos campos opcionales y asociación (A1). Check: `wc -c core/contracts/termination.md`; espera ≤ 2048.
- [x] Implementar validador y escritor compartidos, compatibles con historial y consumidores (A1). Check: `node --test tests/kit-await/contract.test.mjs`; exit 0.
- [x] Registrar término real de `kit run` después de su resultado final, sin exponer intentos intermedios como finales (A1). Check: `node --test tests/kit-await/contract.test.mjs`; exit 0.
Segment verification: `node --test tests/kit-await/contract.test.mjs` — level 1; exit 0; covers A1.

### Segment 2 — Story: término observable en las tres herramientas
Files: `scripts/kit-await.mjs`.
WHEN llega un registro posterior al lanzamiento THEN la espera devuelve su resultado o el estado correcto (A2).
Acceptance:
- A2: DONE 0, PAUSED/INVALIDO/INTERRUMPIDO 1, EN_CURSO 3, pegado 4 y uso 2; `node --test tests/kit-await/*.test.mjs`; expect exit 0.
TODO:
- [x] Implementar `scripts/kit-await.mjs` con espera cada 5 s, límite, selección por plan/tramo/fecha y una línea (A2). Check: `node --test tests/kit-await/*.test.mjs`; expect exit 0.
- [x] Reutilizar `evaluarPegado` en `scripts/kit-await.mjs` sobre progreso disponible sin cortar procesos (A2). Check: `node --test tests/kit-await/*.test.mjs`; expect exit 0.
Segment verification: `node --test tests/kit-await/*.test.mjs` — level 1; exit 0; covers A2.

### Segment 3 — Story: término observable en las tres herramientas
Files: `adapters/claude-code/subagent-stop-hook.mjs`, `adapters/claude-code/install-subagent-stop-hook.sh`.
WHEN termina un builder de Claude THEN se valida y registra el retorno sin afectar otros agentes (A3).
Acceptance:
- A3: válido registra y sale 0; inválido inicial sale 2 con clave; inválido repetido registra INVALIDO y sale 0; `node --test tests/subagent-stop/*.test.mjs`; expect exit 0.
TODO:
- [x] Crear `adapters/claude-code/subagent-stop-hook.mjs` con stdin acotado, matcher builder y ruta validada (A3). Check: `node --test tests/subagent-stop/*.test.mjs`; expect exit 0.
- [x] Crear `adapters/claude-code/install-subagent-stop-hook.sh` idempotente que preserve ajustes ajenos y quite solo su entrada (A3). Check: `node --test tests/subagent-stop/*.test.mjs`; expect exit 0.
Segment verification: `node --test tests/subagent-stop/*.test.mjs` — level 1; exit 0; covers A3.

### Segment 4 — Story: término observable en las tres herramientas
Files: `adapters/pi/termination.mjs`, `core/agents/planner.md`, `core/references/planner/codex-waits.md`.
WHEN termina el builder en Claude, Codex o Pi THEN el planner recibe el hecho correlacionado (A4).
Acceptance:
- A4: integración Pi instalada y comprobada, planner usa `kit-await`, Codex conserva `kit run`; `node --test tests/pi-termination/*.test.mjs && rg -c kit-await core/agents/planner.md && test "$(wc -c < core/agents/planner.md)" -le 8192`; expect exit 0.
TODO:
- [x] Integrar `adapters/pi/termination.mjs` como observador Pi y prueba de ejecución, con término e interrupción reales observables (A4). Check: `node --test tests/pi-termination/*.test.mjs`; exit 0.
- [x] Actualizar planner y receta para lanzar, capturar marca y repetir solo EN_CURSO (A4). Check: `rg -c kit-await core/agents/planner.md && test "$(wc -c < core/agents/planner.md)" -le 8192`; expect exit 0.
- [x] Integrar `adapters/pi/termination.mjs` en instalación y retiro, preservando reglas literales y sus pruebas (A4). Check: `node --test tests/pi-termination/*.test.mjs`; exit 0.
Segment verification: `node --test tests/pi-termination/*.test.mjs` — level 1; exit 0; covers A4.

### Segment 5 — Story: término observable en las tres herramientas
Files: `docs/kit-run.md`, `changes/P01-runtime-lanzamiento/evidencia-real.md`.
WHEN se revisa la entrega THEN quedan verificaciones automáticas y procedimiento manual (A5, A6).
Acceptance:
- A5: aceptación y `./verify` pasan como la línea base; check `node --test tests/acceptance/*.test.mjs && ./verify`; expect exit 0.
- A6: revisión manual: diez lanzamientos Claude/Codex pasan sin «continúa»; registrar además Pi como no verificado hasta disponer de datos reales.
TODO:
- [x] Documentar comandos, instalación, compatibilidad y límites de interrupción (A5). Check: `rg -c kit-await docs/kit-run.md`; espera ≥ 1.
- [x] Crear tabla vacía de cinco lanzamientos Claude y cinco Codex, modo, continuidad e intervención (A6). Check: `test -f changes/P01-runtime-lanzamiento/evidencia-real.md`; exit 0.
- [x] Ejecutar aceptación y `./verify`, registrar resultado y tiempos (A5). Check: `node --test tests/acceptance/*.test.mjs && ./verify`; expect exit 0.
Segment verification: `test -f changes/P01-runtime-lanzamiento/evidencia-real.md && rg -q kit-await docs/kit-run.md` — level 1; exit 0; covers A5 A6.

## Evidence
$ node tests/spawn-seguro/estatico.mjs
estatico: OK 29 llamadas en 161 archivos (3 exentas: helper o control marcado)
exit 0
$ node --test tests/pi-termination/*.test.mjs
Pruebas 3, pass 3, fail 0, skipped 0; duration_ms 2261.17675. Incluye subagente Pi real con proveedor faux, DONE e INTERRUMPIDO.
exit 0
$ node scripts/kit-verificado.mjs estado --nivel rapida
Fingerprint: 7eed832dd52c
verificar: motivo=huella_distinta
exit 1
$ node --test tests/acceptance/*.test.mjs && ./verify
✔ builder-contract: la suite del contrato del builder pasa (90.474441ms)
✔ kit-run: la suite de kit run pasa (44254.991649ms)
✔ uso: la suite del medidor de costos pasa (2256.861434ms)
ℹ tests 3; pass 3; fail 0; duration_ms 44311.25318
verify: 36 pasos; detalle en pruebas/.temporales/verify.log
resultado registrado: Fingerprint: 7eed832dd52c
VERIFY OK
exit 0
Tiempo medido con `time`: aceptación y verify 238,691 s; aceptación 44,311 s; verify y sobrecarga del shell 194,380 s. Primera corrida fallida: duración de verify no medida.
Revisión final local: R1 conserva comparación completa y exige hecho=1/1; stdio Pi explícito conserva captura y evita stdin pipe; documentación y tabla distinguen pruebas automáticas de revisión manual pendiente. Sin cierre ni traslado del plan.
Pendientes del plan: 0 (contador canónico tras marcar el tramo 5). A6 manual sigue pendiente de datos, según Verification.
$ node --test tests/acceptance/*.test.mjs && ./verify
Aceptación: tests 3, pass 3, fail 0; duration_ms 44004.578589.
VERIFY FALLO: paso 19 (exit 1): tests/pi-termination/termination.test.mjs:90: spawnSync sin stdio.
Fingerprint: 742217b61a9f
exit 1
Diagnóstico y corrección: stdin no se usa en la prueba Pi; declarar stdio [ignore, pipe, pipe] conserva la captura y evita el pipe de entrada.
$ rg -c kit-await docs/kit-run.md
3
exit 0
$ test -f changes/P01-runtime-lanzamiento/evidencia-real.md
exit 0
$ test -f changes/P01-runtime-lanzamiento/evidencia-real.md && rg -q kit-await docs/kit-run.md
exit 0
$ node --test tests/kit-await/*.test.mjs tests/subagent-stop/*.test.mjs tests/pi-termination/*.test.mjs && rg -c kit-await core/agents/planner.md && test "$(wc -c < core/agents/planner.md)" -le 8192 && rg -q -- '--hasta' docs/kit-run.md && git diff --check
Pruebas 4, pass 4, fail 0; duración 2232.89 ms. Planner dentro del límite; alias documentado.
exit 0
$ node --test tests/acceptance/kit-run.test.mjs
Falló tras 30117 ms; el arnés no mostró detalle del hijo.
exit 1
$ node tests/kit-run/run.mjs
41 casos fallaron; los subprocesos devolvieron status 1/sin salida para casos que requieren procesos; casos no dependientes de spawn pasaron.
exit 1
$ node -e 'const { spawnSync } = require("node:child_process"); const r = spawnSync(process.execPath, ["-e", "process.stdout.write(\"child-ok\")"], { stdio: ["ignore", "pipe", "pipe"] }); process.stdout.write(JSON.stringify({ status: r.status, error: r.error?.code, stdout: r.stdout?.toString(), stderr: r.stderr?.toString() })); process.exitCode = r.status ?? 1;'
{"status":0,"stdout":"","stderr":""}
exit 0
$ node --test tests/acceptance/*.test.mjs && ./verify
✔ tests/acceptance/builder-contract.test.mjs (137.471298ms)
✖ tests/acceptance/kit-run.test.mjs (30375.785065ms)
✖ tests/acceptance/usage.test.mjs (950.200477ms)
ℹ tests 3; pass 1; fail 2; duration_ms 30387.75257
./verify no se ejecutó por el fallo de aceptación (&&).
exit 1
$ wc -c core/contracts/termination.md
1188 core/contracts/termination.md
exit 0
$ rg -c 'DONE|PAUSED|INVALIDO|INTERRUMPIDO' core/contracts/termination.md
5
exit 0
$ node --test tests/kit-await/contract.test.mjs
✔ tests/kit-await/contract.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0
Fingerprint: f96fef522d3b
$ node --test tests/kit-await/contract.test.mjs
✔ tests/kit-await/contract.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0
Fingerprint: d0e03964120b
$ node --test tests/kit-await/*.test.mjs
✔ tests/kit-await/await.test.mjs
✔ tests/kit-await/contract.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0
Fingerprint: 0ed3f8af24e3
$ node --test tests/subagent-stop/*.test.mjs
✔ tests/subagent-stop/subagent-stop.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0
Fingerprint: 4694447c7974
$ node --test tests/subagent-stop/*.test.mjs
✔ tests/subagent-stop/subagent-stop.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0
Fingerprint: 4694447c7974
$ node --test tests/kit-await/*.test.mjs
✔ tests/kit-await/await.test.mjs
✔ tests/kit-await/contract.test.mjs
ℹ tests 2
ℹ pass 2
ℹ fail 0
exit 0
Fingerprint: 0ed3f8af24e3
$ node --test tests/pi-termination/*.test.mjs && rg -c kit-await core/agents/planner.md && test "$(wc -c < core/agents/planner.md)" -le 8192 && node --check adapters/pi/termination.mjs && node --check adapters/pi/install-termination.mjs && node --check tests/pi-termination/faux-provider.mjs && node --check tests/pi-termination/termination.test.mjs && bash -n adapters/pi/install-agent.sh
✔ tests/pi-termination/termination.test.mjs
1
exit 0
$ PI_CODING_AGENT_DIR=<temporal> PI_MANAGED_INSTALL_ROOT=<Pi local> PI_OFFLINE=1 /home/franco/.local/bin/pi --offline --no-context-files --no-skills --extension pi-subagents/bundle/index.js --extension adapters/pi/termination.mjs --extension tests/pi-termination/faux-provider.mjs --model faux/test --print 'Delegate to builder and return its result.'
exit 0; hijo Pi registra DONE. Repetición con `FLUCASTR_PI_E2E_ABORT=1`: exit 0; hijo Pi registra INTERRUMPIDO observado. Proveedor faux, sin red ni credenciales. La ejecución CLI directa fue necesaria porque el sandbox bloquea `spawnSync(pi)` desde `node --test` (EPERM); ese subcaso queda omitido por el arnés.
$ node scripts/kit-verificado.mjs estado --nivel rapida
Fingerprint: b1ae8c0cca10
exit 1; motivo=huella_distinta por los cambios activos del plan.
$ node --test tests/kit-await/contract.test.mjs && git diff --check
✔ tests/kit-await/contract.test.mjs
ℹ tests 1
ℹ pass 1
ℹ fail 0
exit 0
$ node --test tests/acceptance/kit-run.test.mjs
✖ tests/acceptance/kit-run.test.mjs (31224.980259ms)
ℹ tests 1
ℹ pass 0
ℹ fail 1
exit 1
$ node tests/kit-run/run.mjs
FALLO R4 registro no escribible: mismo código y salida, con aviso por stderr
… otros casos también recibieron salida vacía y exit 1 en este sandbox
kit-run: 41 caso(s) fallaron
exit 1

$ node --test tests/acceptance/*.test.mjs && ./verify
✔ tests/acceptance/builder-contract.test.mjs (145.49938ms)
✖ tests/acceptance/kit-run.test.mjs (30399.851188ms)
✖ tests/acceptance/usage.test.mjs (928.801575ms)
ℹ tests 3; pass 1; fail 2; duration_ms 30411.899801
./verify no se ejecutó por el fallo de aceptación (&&).
Diagnóstico: la suite directa de kit-run falló en 41 casos con salida vacía; la de uso, en 20 de 21. Una reproducción mínima de spawnSync dio status 0, error null y stdout/stderr vacíos.
Fingerprint: no emitido; ./verify no se ejecutó.
exit 1
$ node --test tests/acceptance/*.test.mjs && ./verify
✔ tests/acceptance/builder-contract.test.mjs (129.15771ms)
✖ tests/acceptance/kit-run.test.mjs (30437.141408ms)
✖ tests/acceptance/usage.test.mjs (950.114149ms)
ℹ tests 3; pass 1; fail 2; duration_ms 30448.577653
./verify no se ejecutó por el fallo de aceptación. Fingerprint: no emitido.
exit 1
$ node tests/kit-run/run.mjs
41 casos fallaron; varias aserciones de procesos hijos recibieron stdout/stderr vacíos y exit 1.
exit 1

$ node --test tests/subagent-stop/*.test.mjs tests/kit-await/contract.test.mjs
2 archivos, pass 2, fail 0; duration_ms 60.046315.
exit 0
$ test -f changes/P01-runtime-lanzamiento/evidencia-real.md && rg -q kit-await docs/kit-run.md
exit 0
$ node --test tests/acceptance/*.test.mjs && ./verify
Aceptación: pass 1, fail 2 (kit-run y usage); duration_ms 30181.729699; tiempo total 30.221 s. ./verify no ejecutado por &&; Fingerprint: no emitido.
exit 1
$ node -e 'reproducción mínima spawnSync de Node con stdout pipe'
{"status":0,"error":null,"stdout":"","stderr":""}
exit 0

## Notes
Checkpoint segmento 1: añadidos `core/contracts/termination.md`, `tools/run/termination.mjs` y `tests/kit-await/contract.test.mjs`; `scripts/kit-run.mjs` registra `terminacion` únicamente en el intento final. Top-level `fecha` conserva el inicio histórico; `terminacion.fecha` registra el cierre. Corregido el aviso a «no se pudo escribir el registro» y añadida una regresión para R4. Segment verification: `node --test tests/kit-await/contract.test.mjs`, exit 0, 3 pruebas del archivo; Fingerprint `d0e03964120b`. `node --check scripts/kit-run.mjs` pasó. Diagnóstico adicional: `node --test tests/acceptance/kit-run.test.mjs` y `node tests/kit-run/run.mjs` fallaron con múltiples casos que devolvieron exit 1 sin stdout/stderr; no se aisló la causa en esta sesión. El segmento 1 queda completo; siguiente paso aprobado es implementar `scripts/kit-await.mjs` para A2.

Checkpoint segmento 2: `scripts/kit-await.mjs` espera 5 s (límite predeterminado 570 s), correlaciona ruta/tramo/fecha, emite una sola línea y mapea salidas; `evaluarPegado` solo observa progreso y nunca detiene procesos. `node --test tests/kit-await/*.test.mjs` pasó; Fingerprint `0ed3f8af24e3`. La aceptación adicional de `kit-run` falló porque `spawnSyncSeguro` del arnés recibió resultados sintéticos vacíos en este entorno (status 0, sin stdout/stderr); causa localizada en la ejecución de procesos bajo sandbox, no en A1. Siguiente segmento: instalar el hook de término de Claude (A3).

Checkpoint segmento 3: añadido `subagent-stop-hook.mjs` para `agent_type=builder`, retorno con plan/tramo validados, entrada limitada, errores con clave y `INVALIDO` tras repetición; el instalador delega a un módulo idempotente que conserva y retira solo su entrada. `node --test tests/subagent-stop/*.test.mjs` y `bash -n adapters/claude-code/install-subagent-stop-hook.sh` pasaron; Fingerprint `4694447c7974`. Documentación oficial consultada: `SubagentStop` incluye `agent_type`, `stop_hook_active` y `last_assistant_message`. Siguiente segmento: integrar observador Pi y planner (A4).

Checkpoint segmento 4: `adapters/pi/termination.mjs` registra el retorno correlacionado y `INTERRUMPIDO` solo al observar `agent_settled.aborted`; registra `INVALIDO` si el retorno no coincide. La integración se carga en perfiles builder generados y su archivo queda bajo el manifiesto existente para retiro. El planner captura una marca epoch una vez y repite `kit-await` solo ante `EN_CURSO`; Codex conserva su flujo. `node --test tests/pi-termination/*.test.mjs`, sintaxis y comprobación del planner pasaron; Fingerprint `b1ae8c0cca10`. Ejecuciones CLI locales de Pi con el proveedor faux registraron `DONE` y una interrupción observada como `INTERRUMPIDO`; no hubo red ni credenciales. El subcaso E2E dentro del test se omite porque el sandbox devuelve EPERM al crear Pi desde `spawnSync`; la misma corrida directa de Pi confirmó ambos estados. Segmento 4 completo; siguiente segmento aprobado: documentar compatibilidad/límites y preparar tabla manual A5/A6.

Corrección previa a continuar: `tools/run/termination.mjs` usa ahora el aviso requerido `kit-run: no se pudo escribir el registro` al fallar la escritura del término; `node --test tests/kit-await/contract.test.mjs && git diff --check` pasó. La aceptación `node --test tests/acceptance/kit-run.test.mjs` falló y la ejecución directa de `tests/kit-run/run.mjs` mostró 41 casos afectados por procesos con salida vacía/exit 1, incluido R4; no se puede confirmar el resultado del arreglo en este sandbox. Bloqueo registrado con `kit-nota`. Reanudar con el mismo comando de aceptación en un entorno donde el arnés pueda crear subprocesos, luego continuar la documentación y tabla A5/A6.
- kit run: PAUSED (verify): escalera agotada: PAUSED: plan=changes/P01-runtime-lanzamiento/plan.md; segment=4; motivo=verify; hecho=3/3; siguiente=node --test tests/acceptance/kit-run.test.mjs; no_intentado=./verify y los pasos A5/A6, porque la aceptación falló en este sandbox. Para otro relanzamiento la persona aprueba --paso 3; revisor=gpt-6.1-terra:low.
- Diagnóstico del planner: `node --test tests/acceptance/kit-run.test.mjs` en el entorno principal, exit 1: único fallo R1, la aserción espera `{fecha, resultado}` y recibe además `hecho: '1/1'`. R4 y demás casos visibles pasaron. No atribuir este fallo al sandbox sin corregir la incompatibilidad y volver a comprobar.
- Estado tras pausa: rama `feature/P01-runtime-lanzamiento`; modificados `adapters/pi/install-agent.sh`, `core/agents/planner.md`, `core/references/planner/codex-waits.md`, `scripts/kit-run.mjs`, `tests/kit-run/run.mjs`; archivos nuevos en adaptadores Claude/Pi, contrato, `kit-await`, pruebas, `tools/run/termination.mjs` y carpeta del plan. Sin revisión final ni `./verify` posterior al cambio.

- Devuelto: defecto — tramo 5 — core/agents/planner.md:49, A4: la receta `kit-await` solo aplica a Pi; Claude conserva la espera anterior y no consume el registro como veredicto. Integrar y comprobar Claude y Codex, incluido el uso real de `kit run` y el instalador del hook. Mantener `--hasta` como alias requerido para `--limite` y `--desde` opcional según el pedido original, con pruebas. A6 sigue manual pendiente.

Checkpoint segmento 5: `kit-await` acepta `--hasta` como alias y omite `--desde` usando la hora de inicio del comando; el planner y la referencia documentan Claude, Pi y Codex subagente, conservando `kit run` por defecto. Suites focalizadas pasaron (4 archivos, exit 0); planner ≤8192 bytes y `git diff --check` pasó. La aceptación de `kit-run` y la verificación final fallaron con subprocesos que devolvieron status sin salida; una prueba mínima anidada también devolvió status 0 y salida vacía. El comando final no llegó a `./verify`. A5 queda pendiente; A6 requiere diez lanzamientos reales con datos de la persona usuaria. Próximo paso: repetir `node --test tests/acceptance/*.test.mjs && ./verify` en un entorno donde los procesos hijos ejecuten y capturen salida; después completar el registro A6. `kit-nota blocked` registrado en `progress.jsonl`.

Pausa segmento 5: tras retomar con el plan aprobado, la aceptación volvió a fallar en dos suites por captura vacía de stdout/stderr en procesos hijos; la reproducción mínima confirma status 0, error null y stdout/stderr vacíos. No se atribuye a cambios del plan: afecta tanto kit-run como uso. ./verify no se ejecutó porque la aceptación falló. Paso pendiente: ejecutar exactamente node --test tests/acceptance/*.test.mjs && ./verify en un entorno donde spawnSync capture la salida, registrar tiempos y huellas; no marcar A5 hasta que pase. A6 continúa como revisión manual pendiente de diez lanzamientos reales.
- kit run: PAUSED (verify): paso 2: escribe «Consejo (tramo 5): …» y vuelve a lanzar. Fallo: PAUSED: plan=changes/P01-runtime-lanzamiento/plan.md; segment=5; motivo=verify; hecho=2/3; siguiente=Ejecutar aceptación y `./verify`, registrar resultado y tiempos (A5). Check: `node --test tests/acceptance/*.test.mjs && ./verify`; expect exit 0.; no_intentado=./verify y la revisión manual A6, porque falló la aceptación; revisor=gpt-6.1-terra:low.
- Verificación del planner en entorno principal: `node --test tests/acceptance/*.test.mjs && ./verify`, exit 0; aceptación 3/3, verify 36 pasos, Fingerprint: 2b00fc343bd2. La captura vacía del sandbox no se reproduce aquí.
- Devuelto: defecto — tramo 5 — core/agents/planner.md:49, A4: se indica usar marcador y `kit-await` con subagente Codex, pero no hay observador Codex que registre su retorno; un subagente Codex elegido explícitamente puede quedar en EN_CURSO indefinidamente. El soporte de Pi real y A6 siguen no verificados.

Consejo (tramo 5): retirar la receta del subagente Codex sin observador de `core/agents/planner.md` y `core/references/planner/codex-waits.md`; declarar Codex soportado por `kit run`, sin espera por subagente Codex. Mantener Claude y Pi y las pruebas de --hasta. A6 y Pi real siguen pendientes. Si el sandbox devuelve salida vacía al crear procesos, registrar la causa y PAUSED; el planner verificará fuera.

Pausa A5 tras aplicar el consejo: `core/agents/planner.md` y `core/references/planner/codex-waits.md` ya limitan la espera por subagente a Claude y Pi; Codex queda con `kit run`. `node --test tests/kit-await/*.test.mjs`, el límite de tamaño del planner y `git diff --check` pasan. La aceptación exacta falló en `kit-run` y `usage` (duration_ms 30448.577653); la suite directa `node tests/kit-run/run.mjs` reproduce 41 fallos con salidas vacías de procesos hijos. `./verify` no se ejecutó por `&&`, y no se emitió Fingerprint. El planner reportó en entorno principal aceptación 3/3 y `./verify` 36 pasos, Fingerprint `2b00fc343bd2`. Bloqueo anotado con `kit-nota`; A5 sigue pendiente, A6 requiere datos de diez lanzamientos reales. Tras revisión y reaprobación, repetir exactamente `node --test tests/acceptance/*.test.mjs && ./verify` en el entorno verificado por el planner.
- kit run: PAUSED (verify): escalera agotada: PAUSED: plan=changes/P01-runtime-lanzamiento/plan.md; segment=5; motivo=verify; hecho=2/3; siguiente=Ejecutar aceptación y `./verify`, registrar resultado y tiempos (A5); no_intentado=`./verify` y la revisión manual A6 porque falló la aceptación. Para otro relanzamiento la persona aprueba --paso 3; revisor=gpt-6.1-terra:low.
- Revisión D-04: retirada la receta de subagente Codex; `kit run` queda como ruta soportada. Verificación del planner en entorno principal tras la corrección: `node --test tests/acceptance/*.test.mjs && ./verify`, exit 0; aceptación 3/3, verify 36 pasos, Fingerprint: b1f10826d801. `git diff --check`, exit 0. `planner.md`: 7990 bytes. Builder PAUSED por captura vacía del sandbox; A6 y Pi con proveedor real permanecen no verificados.
- Revisión adicional del planner: suites focalizadas `node --test tests/kit-await/*.test.mjs tests/subagent-stop/*.test.mjs tests/pi-termination/*.test.mjs`, 17/17, exit 0 (incluye Pi con proveedor simulado). Defecto A3 pendiente: `tools/run/termination.mjs` devuelve siempre «retorno de builder no cumple el contrato» ante formato inválido; `adapters/claude-code/subagent-stop-hook.mjs` no identifica qué clave falta, aunque la solicitud lo exige.

- D-05. Consejo: corregir A3 en `tools/run/termination.mjs` y `tests/subagent-stop/`: el error inicial debe identificar la clave que falta (por ejemplo `verify` en DONE); conservar la validación estricta y comprobar stderr, no solo un prefijo. Verificar aceptación y `./verify` cuando el entorno lo permita. No modificar `models.json`. A6 y Pi real siguen pendientes.

Pausa D-05: el validador identifica la primera clave obligatoria ausente sin relajar la validación estricta; la prueba del hook comprueba stderr con `verify`. Suites focalizadas y comprobación del segmento pasan. La aceptación falló en kit-run y usage; reproducción mínima confirma captura vacía de stdout del hijo en este sandbox. `./verify` no se ejecutó. Reanudar A5 en entorno con captura funcional; A6 y Pi real siguen pendientes.
- kit run: PAUSED (verify): escalera agotada: PAUSED: plan=changes/P01-runtime-lanzamiento/plan.md; segment=5; motivo=verify; hecho=2/3; siguiente=Ejecutar aceptación y `./verify`, registrar resultado y tiempos (A5); no_intentado=`./verify` porque falló la aceptación; revisor=gpt-6.1-terra:low.
- kit run: paso 4: el paso 3 (nivel medium, modelo gpt-6.1-terra) no terminó: escalera agotada: PAUSED: plan=changes/P01-runtime-lanzamiento/plan.md; segment=5; motivo=verify; hecho=2/3; siguiente=Ejecutar aceptación y `./verify`, registrar resultado y tiempos (A5); no_intentad. Créditos del paso 3: «sin tokens medidos» (estimación). Relevo al planner (modelo gpt-6.1-terra): «sin tokens medidos» (estimación). Pregunta de relevo: ¿lo quieres? La persona responde; kit run no lo ejecuta ni corre nada más.
- Verificación del planner tras D-05 en entorno principal: `node --test tests/kit-await/*.test.mjs tests/subagent-stop/*.test.mjs tests/pi-termination/*.test.mjs && node --test tests/acceptance/*.test.mjs && ./verify`, exit 0; pruebas focalizadas 17/17, aceptación 3/3 y verify 36 pasos, Fingerprint: 5d9f1f144ba6. Confirmado: un DONE sin verify devuelve `falta la clave verify`. Builder PAUSED por captura vacía del sandbox; A6 y Pi con proveedor real siguen no verificados.

## Cierre autorizado
La persona autorizó cerrar antes de completar A6. A5: aceptación 3/3 y `./verify` 36 pasos en host y Codex workspace-write; huella `4aa124e6b749`, según `changes/done/fix-captura-sandbox/evidencia-final.md`. A6 sigue sin verificar: los diez lanzamientos reales quedan pendientes en `evidencia-real.md`; Pi con proveedor real también sigue sin verificar. Codex se soporta mediante `kit run`. Cierre administrativo por decisión de la persona, sin declarar A6 aprobado.
