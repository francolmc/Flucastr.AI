---
status: partial
format: 2
branch: chore/P00-bootstrap
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Recuperar captura de procesos en sandbox

Excepción de tamaño: conserva evidencia de dos fallos de verify y ampliaciones aprobadas para reanudar sin repetir una huella fallida.

## Goal
Restituir la salida de procesos síncronos y asíncronos del kit dentro de Codex workspace-write para desbloquear la verificación de P00, sin cambiar su contrato público.

## Exploration
En P00, `./verify` falló 6b; `node --test tests/permissions-v2.test.mjs` pasó fuera de workspace-write y falló dentro. Una llamada mínima con `spawnSyncSeguro` perdió stdout y stderr pese a exit 0. En `codex sandbox -c 'sandbox_mode="workspace-write"'`, la captura por pipes síncrona y asíncrona devolvió cadenas vacías; descriptores a archivos temporales devolvieron `OUT` y `ERR`, exit 0. La causa del entorno sigue sin verificar. `main` y HEAD coinciden; la rama actual es `chore/P00-bootstrap` y los únicos cambios anteriores son registros sin seguimiento en `changes/`.

## Evaluation
D-01, D-02. Capturar en archivos es una solución reproducida con coste de E/S temporal; el riesgo es alterar errores, buffers u opciones de subprocess. Cubrir los contratos existentes y limpieza. No se requiere diseño de pantallas ni preparación del proyecto: no cambia UI y ya existen AGENTS y verify.

## Validation
La persona aprobó el plan y ambas ampliaciones de alcance (D-03, D-04).

## Decisions already taken
- D-01, D-02, D-03, D-04
- Executor: builder, por afectar primitivas compartidas y requerir pruebas de comportamiento y sandbox; requisitos, rutas y comprobaciones accesibles, sin credenciales ni despliegue.

## Scope
`tools/spawn/sync-seguro.mjs`, `tools/run/process.mjs`, `tests/spawn-seguro/`, `tests/kit-run/` y `tests/progress/run.mjs`, más `changes/fix-captura-sandbox/` para registros. Conservar la API Node, opciones explícitas `stdio`, entrada, codificación, buffers, errores y códigos de salida; no cambiar otros consumidores ni reglas de seguridad. No modificar `old/`, `changes/done/` ni `pruebas/.temporales/`, salvo escrituras normales de `./verify` en `verify.log` y `resultado.json` autorizadas por la persona en P00. No instalar, commit, push, PR, tag ni despliegue. Esta corrección usa la rama actual; P00 sigue pendiente.

## Verification
`node --test tests/permissions-v2.test.mjs && ./verify` — exit 0. Correr en sandbox workspace-write; registrar resultado, duración y código. No repetir una verificación fallida de la misma huella; ante fallo, PAUSED y registrar causa.

## Steps
### Segment 1 — Story: recuperar la salida en sandbox
Files: `tools/spawn/sync-seguro.mjs`, `tools/run/process.mjs`, `tests/spawn-seguro/run.mjs`, `tests/kit-run/run.mjs`, `tests/progress/run.mjs`.
WHEN una llamada síncrona captura salida dentro de workspace-write THEN conserva stdout, stderr y el contrato previo sin dejar temporales (A1, A2, A3, A4).
Acceptance:
- A1: `spawnSyncSeguro` y `execFileSyncSeguro` capturan stdout y stderr exactos dentro del sandbox; check `node tests/spawn-seguro/run.mjs` en workspace-write; expect exit 0 y pruebas de captura no vacías.
- A2: se conservan tipos Buffer/string, encoding, status, errores, señales y `stdio` explícito, y se limpian temporales en éxito y fallo; check `node tests/spawn-seguro/run.mjs`; expect exit 0.
- A4: `correrVigilado` conserva stdout, stderr, errores, timeout, vigilancia y limpieza en workspace-write; check `node tests/kit-run/run.mjs`; expect exit 0.
- A5: progress-watch mantiene sus comprobaciones de líneas, señal, salida y eventos dentro del sandbox; check `node tests/progress/run.mjs`; expect exit 0.
- A3: la prueba de permisos y verify pasan en workspace-write; check `node --test tests/permissions-v2.test.mjs && ./verify`; expect exit 0 para ambas.
TODO:
- [x] Ampliar `tests/spawn-seguro/run.mjs` con procesos controlados que escriban salidas distintas y fallen; verificar buffers, encoding, errores, señales, stdin, stdio explícito y limpieza (A1, A2). Check: `node tests/spawn-seguro/run.mjs`; casos descubiertos no vacíos y exit 0 fuera del sandbox; comprobar que la prueba de captura falle en sandbox antes del arreglo.
- [x] Corregir `tools/spawn/sync-seguro.mjs` usando archivos temporales para las salidas capturadas por defecto; conservar el comportamiento para stdio explícito, opciones, resultados y excepciones, y limpiar recursos incluso al fallar (A1, A2). Check: `node tests/spawn-seguro/run.mjs` en workspace-write; exit 0, incluida captura exacta. Añadir caso de `execFileSyncSeguro` con `stdio` explícito y contrastarlo con Node nativo; no debe devolver `undefined` si Node devuelve `null`.
- [x] Corregir `tools/run/process.mjs` para recuperar ambas salidas asíncronas, preservando vigilancia, tiempos, señales y limpieza; añadir pruebas focales en `tests/kit-run/run.mjs` (A4). Check: `node tests/kit-run/run.mjs` en workspace-write; exit 0.
- [x] Adaptar `tests/progress/run.mjs` para capturar el vigilante con archivos temporales, conservando todas las aserciones y limpiando aun al fallar (A5). Check: `node tests/progress/run.mjs` en workspace-write; exit 0.
- [ ] Ejecutar la prueba de permisos dentro de workspace-write y el verify completo (duración no medida); anotar salida y exit en Evidence (A3). Check: `node --test tests/permissions-v2.test.mjs && ./verify`; exit 0 dentro de workspace-write.
Segment verification: `node tests/spawn-seguro/run.mjs` — level 1; exit 0; covers A1, A2; A4 y A5 se comprueban en sus pasos y A3 en Verification.
Handoff: reportar comprobación de sandbox, salida y errores capturados, limpieza, verify y huella; después se revisa evidencia en Puerta 2 y solo entonces se retoma P00.

## Evidence
- `$ node tests/spawn-seguro/run.mjs` (antes del arreglo, en el entorno workspace-write): nueve casos de captura fallaron con salida vacía; 2 casos pasaron; exit 1.
- `$ timeout 30s node tests/spawn-seguro/run.mjs` (versión inicial del test): cinco casos pasaron y el control crudo con `stdin` por pipe se detuvo; exit 124.
- `$ node tests/spawn-seguro/run.mjs` (tras ampliar los casos): 11 casos pasaron; exit 0. Huella: pendiente de `./verify`.
- `$ codex sandbox -c 'sandbox_mode="workspace-write"' -- node tests/spawn-seguro/run.mjs`
  - El CLI no pudo crear alias de PATH en solo lectura y terminó con `error building bubblewrap command: app-server socket directory must be a user-owned directory with mode 0700`; exit 1.
- `$ node tests/spawn-seguro/run.mjs` (árbol actual): 11 casos pasaron, con captura exacta de stdout/stderr y sin temporales residuales; exit 0.
- `$ node tests/spawn-seguro/run.mjs`
  - 12 casos pasaron; captura exacta de stdout/stderr, encoding, errores, señales, stdin, stdio explícito y temporales limpios; `execFileSyncSeguro` coincide con Node nativo (`null`); exit 0.
- `$ node tests/kit-run/run.mjs`
  - El caso A4 capturó stdout y stderr en salida no cero y por timeout, conservando salida parcial y limpiando temporales; 53 casos pasaron; exit 0.
- `$ node tests/progress/run.mjs`
  - 44 casos pasaron; el progress-watch produjo líneas de estado en stderr mediante archivos temporales, preservó stdout vacío, SIGTERM y evento `casilla_marcada`; exit 0.
- `$ node --test tests/permissions-v2.test.mjs && ./verify`
  - `tests/permissions-v2.test.mjs`: 1 pasada, 0 fallidas; duración 5.00 s.
  - `./verify`: paso 16 falló en `tests/kit-check/run.mjs`; el fixture verde obtuvo código 1 porque `node -e "console.log('listo')"` no entregó stdout. `scripts/check/ejecutar.mjs` usa `spawnSync` nativo con pipes, fuera de Scope. Fingerprint: `8ee6d963835d`; exit 1; duración total aprox. 126 s. `node scripts/kit-verificado.mjs estado --nivel aceptacion` devolvió exit 3: no relanzar esta huella.
- `$ node --test tests/permissions-v2.test.mjs && ./verify`
  - `tests/permissions-v2.test.mjs`: 1 pasada, 0 fallidas.
  - `./verify`: paso 15 falló en `progress-watch`: «esperaba ≥ 2 líneas de estado, hubo 0». El resto de los casos de progreso y el A1 del vigilante de kit run pasaron. Fingerprint: `887712f3f4ae`; exit 1; duración observada aprox. 126 s.
  - `$ node scripts/kit-verificado.mjs estado --nivel aceptacion` informó fallo previo en la misma huella y salida 3; no relanzar.
- `$ node --test tests/permissions-v2.test.mjs && ./verify`
  - Prueba de permisos: 1 pasada, 0 fallidas; duración 5.23 s.
  - `./verify`: paso 13 falló; salida reportó 30 casos fallidos en el arnés kit-run, con varios builders simulados que devolvieron salida vacía. `verify.log` termina en `FALLO: 13: pruebas de kit run (scripts/kit-run.mjs) no pasaron`.
  - Fingerprint: 9becf7899947; exit 1 (duración total aprox. 66 s). No se repetirá esta huella.

## Notes
- La prueba focal `node tests/spawn-seguro/run.mjs` pasa (11 casos) en el workspace-write actual. El wrapper `codex sandbox` no arranca por permisos del socket del app-server.
- Diagnóstico del fallo de `./verify` paso 13: `tests/kit-run/run.mjs` lanza el builder por `correrVigilado`, que captura con pipes asíncronos en `tools/run/process.mjs`; esa ruta devuelve stdout vacío. `tools/run/process.mjs` queda fuera de Scope, así que A3 no se puede completar sin ampliar Scope. El mismo fallo está reproducido por el test focal del arnés kit-run; el comando a retomar es `node tests/kit-run/run.mjs` tras ampliar Scope para adaptar la captura asíncrona.
- No relanzar `./verify` con Fingerprint `9becf7899947`; `node scripts/kit-verificado.mjs estado --nivel aceptacion` devuelve exit 3 para el mismo árbol fallido.
- Pendientes: 2.
- kit run: PAUSED motivo=scope, tramo 1; detalle en `runs.jsonl`.
- kit run: Diagnóstico: clase=plan; señal=motivo=scope; qué hacer=revisar el alcance o el plan con la persona antes de volver a correr kit run; el builder no lo puede resolver solo

- Alcance ampliado por autorización de la persona: D-03. Git: dos archivos modificados, `tools/spawn/sync-seguro.mjs` y `tests/spawn-seguro/run.mjs`; no descartar sus cambios. Próximo paso: probar contrato stdio explícito y completar correcciones síncrona y asíncrona antes de repetir verify con huella nueva.
- review-plan: avisos A1/A4 y A2/A4: ambas capturas forman una sola reparación necesaria para el flujo de kit run y verify.
- Checkpoint segmento 1: cambiaron `tools/spawn/sync-seguro.mjs`, `tools/run/process.mjs`, `tests/spawn-seguro/run.mjs` y `tests/kit-run/run.mjs`. Diff: la captura síncrona y asíncrona por defecto usa archivos temporales; se conserva `stdio` explícito y se prueba stdout/stderr, estado, timeout y limpieza. Comprobaciones focales pasan (12 y 53 casos); verificación final falla fuera de Scope en `tests/progress/run.mjs` A2. No corregir sin ampliar alcance. Pendiente: paso A3 final; huella fallida `887712f3f4ae` no se relanza. Reanudar tras revisión y re aprobación del plan, resolviendo la prueba externa o su alcance.
- kit run: PAUSED (verify): paso 2: escribe «Consejo (tramo 1): …» y vuelve a lanzar. Fallo: PAUSED: plan=changes/fix-captura-sandbox/plan.md; segment=1; motivo=verify; hecho=3/4; siguiente=Ejecutar la prueba de permisos dentro de workspace-write y el verify completo (duración no medida); anotar salida y exit en Evidence (A3).; no_intentado=la huella 887712f3f4ae ya falló; kit-verificado prohíbe relanzarla; revisor=gpt-6.1-terra:low.

- D-04: la persona autorizó adaptar `tests/progress/run.mjs`; conservar sus aserciones. Git: cuatro archivos de producto/pruebas modificados, no revertirlos. Reanudar con ese paso y luego verify solo con huella distinta de `887712f3f4ae`.
- Consejo (tramo 1): D-04 autoriza adaptar solo la captura del caso progress-watch en tests/progress/run.mjs; usar archivos temporales y conservar todas las aserciones, señal SIGTERM y limpieza; verificar el test focal y ejecutar verify solo si la huella cambió. No revertir los cuatro archivos ya modificados.
- Checkpoint segmento 1: cambió `tests/progress/run.mjs`; el caso progress-watch ahora captura stdout/stderr en archivos temporales, cierra descriptores y los limpia en `finally`. `node tests/progress/run.mjs` pasó (44 casos). Fingerprint actual previo a verify: `8ee6d963835d`, distinta de las huellas fallidas; pendiente A3 (`node --test tests/permissions-v2.test.mjs && ./verify`).
- Cierre pausado: A3 sigue pendiente; `./verify` falló en paso 16 por captura con `spawnSync` nativo en `tools/check/ejecutar.mjs`, fuera de Scope. Huella fallida `8ee6d963835d` no se relanza. `kit-nota blocked` registrado. Pendientes: 1. Retomar después de que planner/persona amplíe Scope para corregir la captura de `tools/check/ejecutar.mjs`, obtener una huella nueva y repetir el comando A3.
- kit run: PAUSED (verify): escalera agotada: PAUSED: plan=changes/fix-captura-sandbox/plan.md; segment=1; motivo=verify; hecho=4/5; siguiente=Ejecutar la prueba de permisos dentro de workspace-write y el verify completo (duración no medida); no_intentado=no se relanza: la huella 8ee6d963835d ya falló y corregir la captura requerida queda fuera de Scope.. Para otro relanzamiento la persona aprueba --paso 3; revisor=gpt-6.1-terra:low.
- Cierre por decisión de la persona: corrección transversal interrumpida y descartada para priorizar P00; sus cinco archivos de producto/pruebas fueron restituidos a HEAD. Se archiva como partial, sin afirmar que el fallo del sandbox esté corregido.
