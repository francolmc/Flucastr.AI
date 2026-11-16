# Tramo 27 — Caracterizar la interfaz del resolver (borrador)

## Pasos

Casos y capturas obligatorios: [matrices de caracterización](matrices.md).

### Tramo 27 — Historia: Caracterizar la interfaz del resolver
Como mantenedor quiero caracterizar la interfaz del resolver para conservar el funcionamiento del kit mientras se separan responsabilidades.
Dependencias: tramo 26 revisado, entorno aislado y línea base del tramo 1. Contratos: no acceder a proyectos reales, HOME real, secretos ni `pruebas/.temporales/`; conservar salida, códigos y efectos salvo excepciones aprobadas. Rutas sensibles: `scripts/resolver.mjs`, instalación remota y lanzadores existentes. Ejemplo: la resolución del modelo del agente `principal` para `codex` devuelve la misma salida que antes.
Alcance: sin archivos de producto.
Archivos: ninguno. Pruebas y documentos de evidencia no cuentan como archivos de producto.
CUANDO se complete este tramo ENTONCES La matriz y su cobertura por subcomando quedan registradas antes de extraer código. (A27).
Aceptación A27: La matriz y su cobertura por subcomando quedan registradas antes de extraer código. La matriz del tramo 27 y las comprobaciones pertinentes conservan códigos, salida y efectos; cualquier diferencia no autorizada detiene el avance.
TODO:
- [ ] Capturar en fixtures sintéticos los códigos, stdout, stderr y efectos de cada rama de despacho de `scripts/resolver.mjs`, incluso subcomandos no documentados y opciones inválidas, incluyendo configuración válida, ausente o inválida, simulación, repetición y eliminación selectiva. Registrar entradas y receta reproducible en `cambios/estructura-repo/` sin credenciales. (A27). Comprobación: revisar el diff y verificar que solo contiene el alcance declarado.
- [ ] Repetir la matriz de `cambios/estructura-repo/tramo-27.md` en el mismo entorno aislado: resultados idénticos y errores sin modificaciones laterales. (A27). Comprobación: registrar la comparación y esperar coincidencia.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A27). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A27). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
