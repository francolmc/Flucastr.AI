# Tramo 3 — Diseño de compatibilidad (borrador)

## Pasos

### Tramo 3 — Historia: Diseño de compatibilidad
Como mantenedor quiero conocer los contratos de rutas para planificar movimientos seguros.
Dependencias: tramo 2 revisado; `rg`, Git y entorno aislado del tramo 1.
Contratos a conservar: entradas de instalación y desinstalación, enlaces instalados, modo copia y salida de simulación.
Rutas susceptibles de cambio: ninguna de producto en este tramo; el registro queda en `cambios/estructura-repo/`.
Ejemplo concreto del resultado esperado: una referencia a `scripts/resolver.mjs` identifica el consumidor y el comando que comprueba su resolución.
Alcance: documentación del cambio; ningún archivo de producto.
Archivos: ninguno.
CUANDO se examine cada consumidor ENTONCES queda trazado con su estrategia y comprobación, sin mover el archivo (A3).
Aceptación A3: Cada consumidor de la matriz tiene estrategia verificable y prueba asociada; las referencias sin estrategia quedan como bloqueo y no se modifica producto.
TODO:
- [ ] Registrar en `cambios/estructura-repo/compatibilidad.md` el destino, wrapper o alias y orden de migración para cada contrato de la matriz. (A3). Comprobación: revisar la matriz frente a `rg` y los puntos de entrada; esperar cobertura trazable.
- [ ] Ejecutar `./verify` aislado (A3). Comprobación: esperar código 0 y resultados equivalentes a la línea base.
- [ ] Ejecutar `bash ./instalar.sh --simular` aislado (A3). Comprobación: esperar código 0 y resultados equivalentes a la línea base.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además comparar simulación. Duración: medida en tramo 1.
Handoff: registrar resultados y dudas no resueltas; detenerse antes de cambiar producto si falta un consumidor o estrategia.

## Evidencia
Pendiente.
