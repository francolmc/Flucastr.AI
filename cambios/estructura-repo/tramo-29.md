# Tramo 29 — Extraer errores de resolver (borrador)

## Pasos

### Tramo 29 — Historia: Extraer errores de resolver
Como mantenedor quiero extraer errores de resolver para conservar el funcionamiento del kit mientras se separan responsabilidades.
Dependencias: tramo 28 revisado, entorno aislado y línea base del tramo 1. Contratos: no acceder a proyectos reales, HOME real, secretos ni `pruebas/.temporales/`; conservar salida, códigos y efectos salvo excepciones aprobadas. Rutas sensibles: `scripts/resolver.mjs`, instalación remota y lanzadores existentes. Ejemplo: la resolución del modelo del agente `principal` para `codex` devuelve la misma salida que antes.
Alcance: `scripts/resolver.mjs` y `tools/resolver/errors.mjs`.
Archivos: `scripts/resolver.mjs`, `tools/resolver/errors.mjs`. Pruebas y documentos de evidencia no cuentan como archivos de producto.
CUANDO se complete este tramo ENTONCES El punto de entrada original permanece y los errores conservan su contrato. (A29).
Aceptación A29: El punto de entrada original permanece y los errores conservan su contrato. La matriz del tramo 27 y las comprobaciones pertinentes conservan códigos, salida y efectos; cualquier diferencia no autorizada detiene el avance.
TODO:
- [ ] Mover la función `fallar` a `tools/resolver/errors.mjs` e importarla desde `scripts/resolver.mjs`, conservando prefijo, stderr y `process.exit(1)`. No mover otras funciones. (A29). Comprobación: revisar el diff y verificar que solo contiene el alcance declarado.
- [ ] Ejecutar la matriz documentada en `cambios/estructura-repo/tramo-27.md` y comparar bytes, códigos y efectos; incluir configuración inválida y subcomando inválido. (A29). Comprobación: registrar la comparación y esperar coincidencia.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A29). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A29). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
