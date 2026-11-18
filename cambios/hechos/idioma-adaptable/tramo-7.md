# Tramo 7 — Observador

## Pasos

### Tramo 7 — Historia: consultar el observador en inglés

Como persona que consulta el observador quiero opciones inglesas sin cambiar los informes ni mis scripts actuales para que el kit sea reutilizable.

Dependencias: ninguna funcional; se ejecuta después del tramo 6. Node disponible.

Contratos a conservar: subcomandos `start`, `stop`, `status`, `informe`, formato del informe, mensajes en español, límites y efectos del observador. No iniciar procesos reales en la prueba de equivalencia.

Rutas susceptibles de cambio: se agrega `scripts/observe.mjs`, se conservan `scripts/observar.mjs` y fixtures.

Ejemplo concreto del resultado esperado: `node scripts/observe.mjs report --data scripts/fixtures-observador/datos --since 2026-01-01` equivale a la invocación `informe --datos ... --desde ...`.

Alcance: los dos scripts del observador y pruebas `tools/verify/docker-observer.sh`.

Archivos: scripts/observar.mjs, scripts/observe.mjs

CUANDO se usa `report` con `--data` o `--since` ENTONCES el informe, los errores y el estado coinciden con la interfaz española (A7).

Aceptación:
- A7: con fixtures no vacíos comparar ambos nombres de archivo, `report`/`informe`, opciones inglesas/españolas mezcladas y opciones inválidas; esperar equivalencia y `./verify` exitoso.

TODO:
- [x] Añadir alias `report`, `--data` y `--since` en `scripts/observar.mjs` (A7). Comprobación: comparar el informe y errores con los alias españoles; esperar equivalencia.
- [x] Crear `scripts/observe.mjs` preservando argumentos y estado (A7). Comprobación: ejecutar ambas entradas con el mismo fixture; esperar resultados iguales.
- [x] Ampliar `tools/verify/docker-observer.sh` para comprobar alias y errores sin iniciar servicios externos (A7). Comprobación: `./verify`; esperar éxito y fallo ante eliminación temporal de un alias.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A7.

Handoff: pruebas exclusivamente de lectura con fixtures; no modificar ni consultar datos reales del observador.

## Evidencia

- `./verify`: VERIFY OK, exit 0; informes equivalentes con fixture no vacío y rutas con espacios, opciones mezcladas, errores y mutación aislada del alias. El ciclo existente usa Docker simulado.

## Notas
