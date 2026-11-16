# Tramo 31 — Extraer lectura de ajustes JSON (borrador)

## Pasos

### Tramo 31 — Historia: Extraer lectura de ajustes JSON
Como mantenedor quiero extraer lectura de ajustes json para conservar el funcionamiento del kit mientras se separan responsabilidades.
Dependencias: tramo 30 revisado, entorno aislado y línea base del tramo 1. Contratos: no acceder a proyectos reales, HOME real, secretos ni `pruebas/.temporales/`; conservar salida, códigos y efectos salvo excepciones aprobadas. Rutas sensibles: `scripts/resolver.mjs`, instalación remota y lanzadores existentes. Ejemplo: la resolución del modelo del agente `principal` para `codex` devuelve la misma salida que antes.
Alcance: `scripts/resolver.mjs` y `tools/resolver/json-settings.mjs`.
Archivos: `scripts/resolver.mjs`, `tools/resolver/json-settings.mjs`. Pruebas y documentos de evidencia no cuentan como archivos de producto.
CUANDO se complete este tramo ENTONCES Las lecturas comparten una responsabilidad sin cambiar las operaciones de escritura. (A31).
Aceptación A31: Las lecturas comparten una responsabilidad sin cambiar las operaciones de escritura. La matriz del tramo 27 y las comprobaciones pertinentes conservan códigos, salida y efectos; cualquier diferencia no autorizada detiene el avance.
TODO:
- [ ] Mover desde `scripts/resolver.mjs` `leerJson`, `leerAjustes`, `ajustesDeObjeto` y `leerAjustesOpcional` al módulo nuevo; importar allí los predicados y `fallar` de los tramos 29 y 30 y en el punto de entrada las funciones utilizadas. Conservar mensajes, tratamiento de archivo ausente y el resultado null de lectura opcional. Dejar `escribirAtomico` y toda escritura en su sitio. (A31). Comprobación: revisar el diff y verificar que solo contiene el alcance declarado.
- [ ] Ejecutar la matriz de `cambios/estructura-repo/tramo-27.md` con archivo inexistente, JSON inválido, array y objeto válido; comparar salida, código y ausencia de escrituras cuando corresponde. (A31). Comprobación: registrar la comparación y esperar coincidencia.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A31). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A31). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
