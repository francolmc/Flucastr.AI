---
status: done
format: 2
branch: feature/P01-runtime-lanzamiento
base: main
repos: [.]
executor: builder
segment: 1
type: code
---
# Captura de subprocesos en sandbox Codex

## Goal
Capturar stdout/stderr reales en ejecución sync y async dentro y fuera de Codex workspace-write sin debilitar aislamiento ni límites.

## Exploration
- D-01, D-02, D-03, D-04, D-05. Leer investigacion.md para evidencia anterior; dos intentos partial no arreglaron producto.
- Control Python real externo y Codex anidado 0.172.0: subprocess con pipes devuelve child-ok y err-ok, exit 0. No acredita todavía supervisión, límites ni aceptación.
- Archivos conectados directamente al hijo no conservan maxBuffer; sondeo por tamaño permite crecimiento ilimitado. Worker Node reutiliza transporte afectado sin evidencia de mejora; compilar supervisor nativo añade toolchain y binarios. Python estándar evita compilación y tiene control de pipes, tiempos y señales.
- Executor: builder, porque requisitos, contexto, comprobaciones y alcance están disponibles y no se requieren credenciales ni publicación.

## Scope
`tools/spawn/`, `tools/run/process.mjs`, pruebas `tests/spawn-seguro/`, documentación pertinente y `changes/fix-captura-sandbox/`. Migrar consumidores directos en `tools/`, `scripts/`, `tests/`, `adapters/` solo cuando la repetición real demuestre que una llamada cruda impide captura: conservar argumentos, opciones y aserciones, sin exenciones nuevas ni pruebas debilitadas. Mantener cambios P01 existentes y rama sucia autorizada. No editar models.json, permisos, sandbox, old/, changes/done/; no leer secretos ni manipular pruebas/.temporales/ a mano. No modificar ni borrar probe.mjs.

## Design
- Mediador Python 3 estándar con pipes del hijo; Node lo inicia con stdin cerrado y transporte por archivos privados de resultado. Leer pipes incrementalmente y limitar bytes durante ejecución, nunca revisar tamaño solo al final. Memoria y archivos acotados por maxBuffer más bloque fijo de lectura, matar al exceder; nunca volcar salida ilimitada ni usar communicate sin límite.
- Compartir transporte/normalización sync y async. Conservar camino nativo fuera del entorno afectado cuando permita compatibilidad; detección mediante control real de transporte con valores no vacíos, no por stdout vacío del comando solicitado. Si falta Python en entorno afectado, error explícito, nunca éxito con salida vacía.
- Preservar status/error/signal/pid/output, Buffer/texto y encoding, env/cwd, input y stdio explícito (inherit/ignore/fd/mixto), shell y argumentos sin interpolar; execFileSyncSeguro debe lanzar con status/signal/stdout/stderr ante error como Node. Validar opciones antes de producir efectos y no ignorar opciones silenciosamente.
- maxBuffer síncrono conserva contrato Node (incluidos ENOBUFS y contador real de bytes); el truncado/tamaño de bloque puede diferir solo dentro del sobrepaso acotado observado de Node. El async existente no tenía maxBuffer: conservar su contrato o incorporar límite explícito compatible sin reducirlo silenciosamente. Timeout, killSignal, salida no cero y señales del hijo deben conservarse. Mantener vigilancia async y muerte del grupo SIGTERM/SIGKILL a 10 s; el supervisor debe permitir esa propagación sin procesos huérfanos.
- Limpiar descriptores y temporales en éxito, spawn error, timeout, buffer excedido y corte vigilado. Documentar requisito Python, selección, plataformas POSIX soportadas y qué no se comprobó en macOS/Windows. No declarar portabilidad sin evidencia.

## Verification
`node --test tests/acceptance/*.test.mjs && ./verify` — ejecutar en entorno principal (≈4 min, última corrida 238,691 s) y en Codex anidado workspace-write real (tope inicial 10 min); guardar salidas, tiempos, huellas y entorno. Reanudación D-05: ejecutar de nuevo el árbol final en ambos entornos; máximo dos intentos por entorno en esta reanudación. No usar ignore-rules, bypass, cambiar nivel/modelos ni quitar aislamiento.

## Steps
### Segment 1 — Story: captura acotada en los dos caminos
Files: `tools/spawn/sync-seguro.mjs`, `tools/spawn/mediador.py`, `tools/run/process.mjs`.
WHEN un hijo escribe ambos flujos THEN el llamador obtiene bytes reales y conserva terminación y límites (A1–A4).
Acceptance:
- A1: sync y execFileSync: salida no vacía simultánea, input/vacío, Buffer/utf8 multibyte, env/cwd, stdio explícito/mixto, exit no cero, comando inexistente, señales y timeout conservados; `node tests/spawn-seguro/run.mjs`; expect exit 0 en ambos entornos.
- A2: maxBuffer sobre stdout, stderr y combinación, bytes multibyte y productor continuo: ENOBUFS, proceso detenido durante ejecución, memoria/disco acotados y limpieza también en fallos; `node tests/spawn-seguro/run.mjs`; expect exit 0 en ambos entornos. Comparar contrato con Node nativo fuera del sandbox; control crudo diagnóstico no reemplaza aserciones de producto dentro.
- A3: async captura ambos flujos, salida no cero, error de lanzamiento, timeout, vigilancia y señales sin huérfanos ni restos; `node tests/spawn-seguro/run.mjs && node --test tests/kit-run/pegado.test.mjs`; expect exit 0 en ambos entornos.
- A4: aceptación completa y verify pasan en ambos entornos; `node --test tests/acceptance/*.test.mjs && ./verify`; expect exit 0. Registrar cualquier caso/plataforma no comprobable como no verificado, nunca marcar evidencia inexistente.
TODO:
- [x] Extender regresión real sync/async y límites (A1–A3). Check: `node tests/spawn-seguro/run.mjs`; exit 0.
- [x] Implementar mediación acotada y compatibilidad sync (A1,A2). Check: `node tests/spawn-seguro/run.mjs`; exit 0.
- [x] Integrar async preservando vigilancia y limpieza (A3). Check: `node tests/spawn-seguro/run.mjs && node --test tests/kit-run/pegado.test.mjs`; exit 0.
- [x] Documentar dependencia/plataformas y contrastar controles en Codex anidado workspace-write (A1–A3). Check: `node tests/spawn-seguro/run.mjs && node --test tests/kit-run/pegado.test.mjs`; exit 0 dentro y fuera.
- [x] Auditar el consumidor de cambios pendiente en workspace-write y adaptar solo si falla (A4). Check: `node tests/kit-check/run.mjs`; expect exit 0 dentro y fuera. `kit-scope` nested 22/22 ejercita `tools/check/cambios.mjs`; no se reprodujo pérdida.
- [x] Ejecutar aceptación y verify completos en ambos entornos y registrar evidencia (A4, ≈8 min). Check: `node --test tests/acceptance/*.test.mjs && ./verify`; exit 0 dentro y fuera. Árbol final: ambos acceptance 3/3 y verify 36 pasos; Fingerprint `4aa124e6b749`.
Segment verification: `node tests/spawn-seguro/run.mjs` — level 1; exit 0; covers A1 A2 A3 A4.
Handoff: auditar `tools/check/cambios.mjs` con control real en sandbox antes de la verificación completa; preservar comandos de solo lectura y usar cwd según AGENTS.md, sin evadir bloqueos. La aprobación explícita del prompt autoriza este rediseño y dependencias; ejecutar con builder actual, sin escalada. El control Python es preliminar: validar toda la semántica. Codex anidado debe ejecutar comandos reales, conservar workspace-write y reglas; guardar evidencia verificable en la carpeta del cambio. No relanzar kit run ciegamente sobre su pausa anterior.

## Evidence
Detalle de comandos, salidas y diagnóstico: evidencia-final.md.

$ node tests/spawn-seguro/run.mjs
Host 23 casos y Codex nested workspace-write 23 casos; exit 0 en ambos.
exit 0
$ node --test tests/kit-run/pegado.test.mjs
Host 10/10; nested 1/1; fail 0.
exit 0
$ node tests/progress/run.mjs
44 casos pasaron después de adaptar el fd de salida de la prueba A2.
exit 0
$ node tests/kit-check/run.mjs
7 casos pasaron en host y 7 en nested workspace-write.
exit 0
$ node --test tests/acceptance/*.test.mjs && ./verify
Host: acceptance 3/3; ./verify 36 pasos, VERIFY OK, Fingerprint b05a2e808791 (antes de las adaptaciones finales de consumidores).
Nested pasada 1: acceptance 3/3, verify paso 15 FAIL. Nested pasada 2: acceptance 3/3, verify paso 16 FAIL. No intentado por límite de dos corridas; causa y arreglos en evidencia-final.md.
Host final (≈239 s): acceptance 3/3; ./verify 36 pasos, VERIFY OK, Fingerprint 4aa124e6b749.
Nested Codex 0.172.0 workspace-write (371.141 s): acceptance 3/3; ./verify 36 pasos, VERIFY OK, Fingerprint 4aa124e6b749.
exit 0 en ambos entornos

## Notes
D-05: la persona reautoriza A4 tras pausa; auditar el consumidor pendiente, validar árbol final y registrar resultados reales.

## Revisión final
APPROVED — A1–A4: evidencia registrada en evidencia-final.md; huella vigente `4aa124e6b749` confirmada por `kit-verificado` (nivel aceptacion). Sin cambios en tests/acceptance. Límites: macOS, Windows y Python 3.9–3.13 no verificados; el .pyc bloqueado permanece. La persona aprobó el cierre.
