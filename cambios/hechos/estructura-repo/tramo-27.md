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
- [x] Capturar en fixtures sintéticos los códigos, stdout, stderr y efectos de cada rama de despacho de `scripts/resolver.mjs`, incluso subcomandos no documentados y opciones inválidas, incluyendo configuración válida, ausente o inválida, simulación, repetición y eliminación selectiva. Registrar entradas y receta reproducible en `cambios/estructura-repo/` sin credenciales. (A27). Comprobación: revisar el diff y verificar que solo contiene el alcance declarado.
- [x] Repetir la matriz de `cambios/estructura-repo/tramo-27.md` en el mismo entorno aislado: resultados idénticos y errores sin modificaciones laterales. (A27). Comprobación: registrar la comparación y esperar coincidencia.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A27). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A27). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `capturar-matriz-resolver.mjs`, `ejecutar-matriz-resolver.sh` y `matriz-resolver.jsonl` registran 101 fixtures/124 invocaciones sintéticas con argumentos, códigos, stdout, stderr y manifiestos antes/después. La receta Bubblewrap repitió cada captura y `cmp` confirmó igualdad; SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`. Los errores y `--simular` exigen árbol inalterado. Se corrigieron nombres de archivo Claude y el fixture Codex ahora inicia con `rules` ausente; sus casos de simulación, aplicación, repetición y retirada, y el caso con AGENTS sintético, terminan con código 0. La búsqueda de rutas temporales/privadas en la captura no encontró coincidencias; `node --check`, `bash -n` y `git diff --check` pasaron. Revisión del alcance: nuevos artefactos de prueba/documentación en `cambios/estructura-repo/`, sin editar archivos de producto.
- Paso 2: `bash cambios/estructura-repo/ejecutar-matriz-resolver.sh` volvió a capturar dos veces en el mismo aislamiento; 101 casos, SHA-256 idéntico `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`, código 0. El arnés detiene la captura si un error o simulación cambia el manifiesto.
- Paso 3: `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` en aislamiento; código 0. Salida y comparación coinciden con la referencia salvo el mensaje exacto autorizado del escenario 9.
- Paso 4: la misma receta ejecutó dos `bash ./instalar.sh --simular` en el aislamiento; ambas salidas y efectos coincidieron entre sí y con la referencia. Resultado total `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, código 0.
