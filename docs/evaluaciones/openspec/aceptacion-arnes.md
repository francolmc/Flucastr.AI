# Revisión del arnés, sin piloto

Estado: arnés verificado por el principal, pendiente de revisión de Franco. **Piloto no ejecutado: 0/12 registros reales, sin resultados comparativos.** No se cambió el modelo aprobado ni se lanzaron más subagentes.

## Correcciones comprobadas

- El comando `openspec` del trabajador resuelve un lanzador privado de la dependencia local **1.16.1**, con Node absoluto y argumentos preservados. No depende del OpenSpec global. Los seis workspaces preparados se comprueban con la misma herramienta de shell del worker; OpenSpec entrega `status` y `instructions apply` ready, tareas pendientes y cuatro grupos de archivos legibles.
- `noTools: 'all'` desactivaba también las herramientas personalizadas. Ahora se excluyen solo las integradas y se seleccionan explícitamente `read_file`, `write_file`, `edit_file`, `run_command`. Se comprueba la configuración efectiva de la sesión y las declaraciones recibidas por el transporte. Una llamada de herramienta realmente ejecutada por `createAgentSession` devuelve OpenSpec 1.16.1 al modelo simulado.
- Las negativas uncertain/corrupt ya no llaman una función inexistente ni aceptan cualquier excepción. Exigen el error pertinente y cero envíos. Quitar la protección uncertain en una copia temporal hace fallar la prueba: `Missing expected rejection.`; el repositorio no se muta.
- `executeRun` es el camino común del CLI real y las pruebas integradas: preparación, `runSdk`/`createAgentSession`, eventos, reservas, transcript, evaluación externa y persistencia. Las inyecciones de transporte existen solo como parámetros de módulo; el CLI no ofrece una bandera ni variable para saltarse controles.
- El SDK convierte rechazos del proveedor en mensajes assistant con `stopReason: error`, sin necesariamente rechazar `session.prompt`. Ahora esos mensajes se registran como fallo operativo, no `finished`.
- Error de proveedor, timeout, SIGINT real y timeout durante una herramienta conservan evidencia y reservas inciertas. SIGINT/SIGTERM abortan la sesión; la cancelación se transmite al grupo del subprocess. Después del corte la puerta rechaza nuevas reservas/envíos. Un ID previo no puede sobrescribirse.
- Un ledger dañado no se reinicializa, ni siquiera desde el catch de ejecución. La ausencia inicial es el único caso que permite crearlo. Los estados iniciados, dañados, sintéticos o incompletos bloquean la continuación del CLI. El directorio de lock no se interpreta como una ejecución.
- La prueba anterior de red fallaba al abrir la configuración SSL de curl: eso no acreditaba bloqueo de socket. Ahora Node intenta conectar directamente y exige `EPERM`. Las negativas de lectura/escritura también exigen denegación pertinente, con hermano externo y workspace con espacios/comilla.

## Presupuesto y serialización efectiva

La reserva cubre **todo el máximo de entrada aprobado**, no una estimación optimista de tokens basada en bytes del JSON. Dicho máximo debe cubrir como mínimo el `contextWindow` del modelo efectivo; el revisor de tarifas debe además justificar que cubra el límite vigente del servicio. La salida incluye su máximo explícito y cualquier cota adicional de razonamiento. Se redondea hacia arriba antes de comparar con los saldos; no se descuentan aciertos de caché. Se conserva por separado reservado, estimado por uso y facturado (desconocido).

Además del proveedor de eventos simulado, dos pruebas atraviesan el **serializador OpenAI Responses real de Pi 1.5.0** con fetch reemplazado y una credencial sintética: reserva válida → 1 fetch, reserva agotada → 0 fetch. El fetch inspecciona el cuerpo y verifica la reserva ya escrita antes de responder HTTP 400 determinista; no abre red. Se comprueba el máximo de salida, modelo y esfuerzo efectivo: este serializador envía `reasoning.effort: medium` y la selección `high` en el último `configuration_update` de `input`.

Una tercera prueba con credencial OAuth sintética reproduce que Pi omite `max_output_tokens` para Sign in with ChatGPT: **0 fetch**, rechazado por falta de máximo explícito. No se fuerza ese campo sobre un transporte que lo omite intencionalmente, ni se toma OAuth como prueba de facturación.

## Matriz de aceptación

| ID | Evidencia actual | Resultado |
| --- | --- | --- |
| A1 | `./verify` con SDK/proveedor/fetch simulados | Exit 0; no llamadas reales |
| A2 | Manifiesto de 12 IDs/6 pares; preparación de 3 casos × 2 brazos; contexto separado; sesión y herramientas efectivas comprobadas | Pasa offline; no mide rendimiento |
| A3 | Positivos y mutaciones funcionales en oráculos aislados | Pasa; no confundir con éxito de un modelo |
| A4 | Lectura externa/hermano/symlink/traversal, escritura, repo, socket EPERM, git y positivo útil con espacios/comilla | Pasa |
| A5 | Presupuesto por SDK real y serializador/fetch simulado, reservas previas durables, errores específicos y mutación uncertain detectada | Pasa offline; tarifas reales siguen sin configurar |
| A6 | Camino común CLI: respuesta válida que falla el oráculo externo, error proveedor/HTTP, bloqueo, timeout/aborto de herramienta y SIGINT; registros no sobrescritos y truncado clasificado aparte | Pasa |
| A7 | Reportes de cero/algunos/doce datos de prueba; reporte actual `not-executed`, 0/12 | Pasa; sin resultados inventados |

## Evidencia reproducible

- `$ ./verify` → exit 0; `/tmp/comparar-openspec-principal-final.log`, termina `VERIFY OK`.
- SDK integrado: `valid:1`, `tool-use:2`, `insufficient:0`, `total-exhausted:0`, `uncertain:0`, `corrupt:0`, `ledger-write-error:0`, `missing-price:0`, `invalid-price:0`, `invalid-payload:0`, `wrong-model:0`, `provider-error:1`, `timeout:1`, `interrupted:1`, `tool-timeout:1`, `http-valid:1`, `http-insufficient:0`, `http-oauth:0`. Son envíos **simulados**, nunca resultados experimentales.
- Mutación temporal uncertain detectada, exit 0 de la comprobación negativa; `/tmp/comparar-openspec-principal-mutation.log`.
- `$ shasum -a 256 -c docs/evaluaciones/openspec/hashes-iniciales.sha256` → exit 0; 83 entradas, incluyendo ambos módulos nuevos; `/tmp/comparar-openspec-principal-hashes.log`.
- `$ node pruebas/comparar-openspec/runner/cli.mjs --preflight` → exit 0, `authAvailable: true`, `pricingConfigured: false`, `inferenceSent: false`; `/tmp/comparar-openspec-principal-preflight.json`.
- `$ node pruebas/comparar-openspec/runner/cli.mjs --report` → exit 0, `not-executed`, 0 registros, 12 oráculos desconocidos; `/tmp/comparar-openspec-principal-report.json`.
- `$ git diff --check` → exit 0.

## Límites y siguiente puerta

El arnés no demuestra rendimiento, ahorro ni superioridad de ningún flujo. Las pruebas no reproducen la facturación del servicio. Los precios usados por las simulaciones son datos sintéticos; no habilitan `--run`.

Antes del piloto faltan tarifas vigentes aplicables, cota documentada y autorización vinculada a sus hashes. Si solo se dispone de OAuth con el comportamiento observado, la exigencia de salida acotada impide ejecutar: hace falta una vía de acceso/facturación compatible, sin copiar ni mostrar credenciales, o una decisión explícita de cambiar el diseño. No se relajan silenciosamente los controles. No se crearon archivos de precios/autorización.

SIGKILL o caída del equipo no permiten ejecutar finally: el registro inicial conserva la ruta del workspace para recuperación, y el CLI bloqueará por ejecución incompleta/lock residual. No se promete que un último evento aún no escrito sobreviva un apagado; el reporte no debe contarlo como aceptación completa. La recuperación manual nunca repone un ID ni elimina evidencia para volver a gastar.
