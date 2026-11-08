# Protocolo de evaluación OpenSpec

El manifiesto `manifest.json` fija las 12 ejecuciones máximas, parejas, alternancia, versiones y límites. Una ejecución nunca se lanza automáticamente tras construir o verificar el arnés. Antes del piloto, el principal debe revisar en una copia limpia los hashes del manifiesto, fixtures, encargos, adaptadores y oráculos, y documentar equivalencia semántica de ambos brazos.

## Condiciones comunes

Cada registro usa una copia y sesión nuevas. Misma versión del SDK Pi (1.5.0), modelo `openai/gpt-6-luna`, esfuerzo `high`, herramientas, producto inicial, requisitos, timeout y reservas. Solo varía el procedimiento del flujo: kit usa el constructor/skill copiados con plan aprobado; OpenSpec usa instrucciones generadas por OpenSpec 1.16.1 y artefactos equivalentes aprobados. El arnés no importa recursos globales. Fixtures no tienen `.git`; ambos encargos declaran esa condición. No se reparan herramientas ni se interviene entre miembros del par.

## Comandos

Desde la raíz del repo, instala de forma reproducible solo las dependencias locales del arnés con `npm ci --prefix pruebas/comparar-openspec --ignore-scripts`. Node debe ser compatible con Pi SDK 1.5.0; macOS necesita `/usr/bin/sandbox-exec`. Después:

- `node pruebas/comparar-openspec/runner/cli.mjs --self-test`
- `node pruebas/comparar-openspec/runner/cli.mjs --preflight`
- `node pruebas/comparar-openspec/runner/cli.mjs --run <id> --confirm-run <sha256-del-manifiesto>` (solo este modo puede hacer inferencia)
- `node pruebas/comparar-openspec/runner/cli.mjs --report`

No ejecutar `--run` durante construcción ni `verify`. La confirmación debe coincidir con el hash exacto del manifiesto y `docs/evaluaciones/openspec/run-authorization.json` debe vincular ese mismo hash con el SHA-256 del archivo local de tarifas y `approvedBy: "Franco"`. La fuente, fecha, modelo y tarifa deben estar documentados; `verifiedBy` puede ser `principal` si este justifica la cota dentro del plan aprobado, sin afirmar que Franco revisó personalmente tarifas o hashes. La aprobación humana de la autorización sigue siendo obligatoria. El preflight informa configuración detectable, pero no demuestra facturación real. El runtime debe usar la autenticación ya disponible, sin leer ni mostrar archivos de credenciales. Comprobación actual: `node pruebas/comparar-openspec/runner/cli.mjs --preflight` detectó `sdk=1.5.0`, `model=openai/gpt-6-luna`, `authAvailable=true`, `pricingConfigured=false`, `inferenceSent=false`, `credentialValuesExposed=false`; no envió inferencia ni expuso valores de credenciales. Por ello el estado actual está bloqueado y no debe usarse `--run`. Antes de autorizarlo, el responsable debe obtener una fuente tarifaria vigente, justificar la cota conservadora, guardar las tarifas y la autorización humana vinculada a sus hashes; no se deben inventar esos archivos ni tratar OAuth como comprobante de facturación. Si el precio aplicable no se puede justificar, la interceptación previa al proveedor no es completa, falla el aislamiento, o falta confirmación humana, `--run` debe cerrar sin petición.

## Controles económicos

Una ejecución reserva hasta USD 0,80; saldo total reservado USD 9,60; margen USD 0,40 inaccesible automáticamente. Reservar antes de cada petición el máximo conservador de tokens de entrada y salida (incluido razonamiento) por la tarifa más alta aplicable, sin descuentos. Rechazar antes de enviar si no cabe en ambos saldos. Consumo incierto conserva la reserva. Sin reintentos, refresh, compactación ni concurrencia. Guardar tarifa/fuente/fecha, límite aplicado, modelo/esfuerzo observados, reserva, estimación de uso y facturación (si se conoce) en columnas separadas. Nunca afirmar facturación desde OAuth o estimación.

La cota de entrada reserva `maxInputTokens` completo, no tokens estimados a partir de bytes. Debe cubrir la ventana efectiva del modelo **y** el máximo vigente justificable del servicio; la salida exige límite explícito. El CLI fija el endpoint OpenAI Responses oficial y comprueba los hashes congelados antes de arrancar. Los precios sintéticos de las pruebas no autorizan llamadas.

Pi 1.5.0 omite `max_output_tokens` cuando usa Sign in with ChatGPT. Una prueba con OAuth sintético y serializador real lo reproduce sin red: la puerta rechaza antes de fetch. Autenticación disponible no implica una vía compatible con el diseño económico aprobado. Si ese es el acceso disponible, resolver acceso/facturación compatible antes de iniciar; no añadir el campo ni relajar el control silenciosamente.

## Registro y corte

Guardar por ID, en almacenamiento durable separado del workspace del trabajador: estado, timestamps, versión/configuración, transcript, artefacto evaluable, resultado declarado y resultado del oráculo separados, tokens/costes disponibles, terminación, intervención y hashes. Timeout, fallo, bloqueo y transcript truncado son resultados, no exclusiones. Ante defecto del harness, detener; conservar pares afectados y no reponerlos sin autorización.

SIGINT/SIGTERM abortan la sesión y sus herramientas; la evidencia se conserva por el camino común de ejecución. SIGKILL o apagado no ejecutan finally: el registro inicial conserva la ruta temporal para recuperación y la continuación queda bloqueada por registro incompleto/lock. No se promete persistencia de eventos aún no escritos.

## Revisión del arnés

Ver [aceptacion-arnes.md](aceptacion-arnes.md): matriz A1–A7, controles integrados, correcciones y evidencia reproducible. Arnés verde y reporte `not-executed` **no** constituyen un experimento realizado ni justifican adoptar un flujo.

## Métricas

Éxito: todos los checks externos pasan dentro de límites, sin intervención. Falso COMPLETADO: afirmación de terminado con oráculo fallido. PAUSA innecesaria: revisión humana cita transcript que solicita decisión ya resuelta por estado vigente; no se decide con regex solamente. Informar por caso y par, además de preparación, ejecución y fallos operativos. Dos repeticiones son diagnósticas: no inferir significación estadística ni ahorro del ciclo completo.

## Limitaciones y prerrequisitos

Se comparan implementación con documentación ya preparada, no la planificación completa ni Andes/UI. Preflight puede funcionar con OAuth sin revelar gasto real. Aislamiento macOS requiere `/usr/bin/sandbox-exec`; cualquier probe fallido bloquea run. No iniciar llamadas si el aislamiento, la tarifa máxima, el mecanismo de reserva previa o la configuración efectiva no son demostrables. No ejecutar la medición hasta que el principal revise el arnés y resuelva estos prerrequisitos.
