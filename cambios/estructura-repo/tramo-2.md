# Tramo 2 — Matriz de consumidores (borrador)

## Pasos

### Tramo 2 — Historia: Matriz de consumidores
Como mantenedor quiero conocer los contratos de rutas para planificar movimientos seguros.
Dependencias: tramo 1 revisado; `rg`, Git y entorno aislado del tramo 1.
Contratos a conservar: entradas de instalación y desinstalación, enlaces instalados, modo copia y salida de simulación.
Rutas susceptibles de cambio: ninguna de producto en este tramo; el registro queda en `cambios/estructura-repo/`.
Ejemplo concreto del resultado esperado: una referencia a `scripts/resolver.mjs` identifica el consumidor y el comando que comprueba su resolución.
Alcance: documentación del cambio; ningún archivo de producto.
Archivos: ninguno.
CUANDO se examine cada consumidor ENTONCES queda trazado con su estrategia y comprobación, sin mover el archivo (A2).
Aceptación A2: La matriz identifica archivo y línea para cada referencia, comando o enlace público y su comprobación existente; registrar también las referencias dinámicas y las que no se puedan resolver.
TODO:
- [ ] Registrar en `cambios/estructura-repo/consumidores.md` los consumidores de rutas vigentes encontrados por `rg`, incluidos instaladores, resolver, lanzadores, pruebas y enlaces instalados. (A2). Comprobación: revisar la matriz frente a `rg` y los puntos de entrada; esperar cobertura trazable.
- [ ] Ejecutar `./verify` aislado (A2). Comprobación: esperar código 0 y resultados equivalentes a la línea base.
- [ ] Ejecutar `bash ./instalar.sh --simular` aislado (A2). Comprobación: esperar código 0 y resultados equivalentes a la línea base.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además comparar simulación. Duración: medida en tramo 1.
Handoff: registrar resultados y dudas no resueltas; detenerse antes de cambiar producto si falta un consumidor o estrategia.

## Evidencia
Pendiente.
