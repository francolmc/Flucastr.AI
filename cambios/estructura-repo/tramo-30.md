# Tramo 30 — Extraer predicados de objetos (borrador)

## Pasos

### Tramo 30 — Historia: Extraer predicados de objetos
Como mantenedor quiero extraer predicados de objetos para conservar el funcionamiento del kit mientras se separan responsabilidades.
Dependencias: tramo 29 revisado, entorno aislado y línea base del tramo 1. Contratos: no acceder a proyectos reales, HOME real, secretos ni `pruebas/.temporales/`; conservar salida, códigos y efectos salvo excepciones aprobadas. Rutas sensibles: `scripts/resolver.mjs`, instalación remota y lanzadores existentes. Ejemplo: la resolución del modelo del agente `principal` para `codex` devuelve la misma salida que antes.
Alcance: `scripts/resolver.mjs` y `tools/resolver/object.mjs`.
Archivos: `scripts/resolver.mjs`, `tools/resolver/object.mjs`. Pruebas y documentos de evidencia no cuentan como archivos de producto.
CUANDO se complete este tramo ENTONCES Las comprobaciones de tipos mantienen el mismo resultado y los mismos errores. (A30).
Aceptación A30: Las comprobaciones de tipos mantienen el mismo resultado y los mismos errores. La matriz del tramo 27 y las comprobaciones pertinentes conservan códigos, salida y efectos; cualquier diferencia no autorizada detiene el avance.
TODO:
- [ ] Mover `esObjeto`, `tiene` y `esEntero` a `tools/resolver/object.mjs`, exportarlos e importarlos en el punto de entrada sin alterar sus expresiones ni los lugares que los usan. (A30). Comprobación: revisar el diff y verificar que solo contiene el alcance declarado.
- [ ] Ejecutar la matriz de `cambios/estructura-repo/tramo-27.md`; incluir objetos, arrays, valores nulos y enteros inválidos en las entradas de configuración existentes. (A30). Comprobación: registrar la comparación y esperar coincidencia.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A30). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A30). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
