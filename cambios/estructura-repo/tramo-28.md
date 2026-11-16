# Tramo 28 — Preparar la copia del instalador remoto (borrador)

## Pasos

### Tramo 28 — Historia: Preparar la copia del instalador remoto
Como mantenedor quiero preparar la copia del instalador remoto para conservar el funcionamiento del kit mientras se separan responsabilidades.
Dependencias: tramo 27 revisado, entorno aislado y línea base del tramo 1. Contratos: no acceder a proyectos reales, HOME real, secretos ni `pruebas/.temporales/`; conservar salida, códigos y efectos salvo excepciones aprobadas. Rutas sensibles: `scripts/resolver.mjs`, instalación remota y lanzadores existentes. Ejemplo: la resolución del modelo del agente `principal` para `codex` devuelve la misma salida que antes.
Alcance: `./instalar-remoto.sh`.
Archivos: `./instalar-remoto.sh`. Pruebas y documentos de evidencia no cuentan como archivos de producto.
CUANDO se complete este tramo ENTONCES El paquete remoto conserva módulos futuros; no cambia la política de descarga ni se accede a un HOME real. (A28).
Aceptación A28: El paquete remoto conserva módulos futuros; no cambia la política de descarga ni se accede a un HOME real. La matriz del tramo 27 y las comprobaciones pertinentes conservan códigos, salida y efectos; cualquier diferencia no autorizada detiene el avance.
TODO:
- [ ] Ampliar únicamente `copiar_permitidas` en `./instalar-remoto.sh` para copiar los directorios `tools/` y `adapters/` cuando existan, conservando el resto de la lista y el comportamiento ante directorios ausentes. Añadir una prueba de integración offline que construya un archivo de descarga sintético con módulos en ambas rutas, ejercite el flujo remoto real con HOME temporal y compruebe su presencia en el kit instalado; usar los mecanismos existentes de prueba o un sustituto local de descarga, sin red. (A28). Comprobación: revisar el diff y verificar que solo contiene el alcance declarado.
- [ ] Comprobar el archivo `./instalar-remoto.sh` con directorios presentes y ausentes, y que entradas no permitidas permanecen excluidas; deben pasar la prueba offline y `bash instalar.sh --copiar --simular` dentro del kit copiado. (A28). Comprobación: registrar la comparación y esperar coincidencia.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A28). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A28). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
Pendiente.
