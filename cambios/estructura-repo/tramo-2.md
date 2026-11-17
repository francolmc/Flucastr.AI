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
- [x] Registrar en `cambios/estructura-repo/consumidores.md` los consumidores de rutas vigentes encontrados por `rg`, incluidos instaladores, resolver, lanzadores, pruebas y enlaces instalados. (A2). Comprobación: inventarios reproducibles por ocurrencia estática y constructores de ruta, más filas analíticas con comprobaciones y límites explícitos.
- [x] Ejecutar `./verify` aislado (A2). Comprobación: la receta terminó correctamente y confirmó salida idéntica a la referencia tras normalizaciones aprobadas; termina en `VERIFY OK`.
- [x] Ejecutar `bash ./instalar.sh --simular` aislado (A2). Comprobación: las dos simulaciones repetidas coinciden entre sí y con ambas referencias guardadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además comparar simulación. Duración: medida en tramo 1.
Handoff: registrar resultados y dudas no resueltas; detenerse antes de cambiar producto si falta un consumidor o estrategia.

## Evidencia
- `consumidores.md`: matriz trazada por fuente y línea, agrupada por entradas públicas, fuentes/adaptadores, herramientas y pruebas. Los índices anexos enumeran 1947 coincidencias estáticas y 337 usos de constructores con una referencia archivo/línea por ocurrencia, sin copiar texto fuente.
- `rg` con patrones documentados confirma las coincidencias por ocurrencia en el alcance. Se inspeccionaron los consumidores de resolver, kit-run, permisos-hook, uso, suites activas de aceptación, revisor/diagnóstico y literales congelados relevantes de `verify`; las limitaciones y pruebas están asociadas en la matriz.
- Referencias sin inspección interior declaradas: OpenSpec no está presente en este checkout; las rutas de proyectos instalados externos no se inventariaron. Se excluyeron deliberadamente secretos, proyectos reales, `old/v1/registro/` y `pruebas/.temporales/`.
- `bash cambios/estructura-repo/reproducir-linea-base.sh`: finalizó con el mensaje `Simulaciones repetibles y verify coinciden con linea-base/.`; por tanto pasaron `./verify` aislado y las dos simulaciones, con comparación de salida completa frente a las salidas persistidas del tramo 1. La salida de verificación comparada termina en `VERIFY OK`.
- No se modificó producto: se añadieron la matriz y los índices archivo/línea, y se actualizó la evidencia del plan/tramo dentro de `cambios/estructura-repo/`.
