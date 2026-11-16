# Tramo 63 — Separar lanzadores de pi (borrador)

## Pasos

### Tramo 63 — Historia: Separar lanzadores de pi
Como mantenedor quiero aislar lanzadores de pi para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 62 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/pi/install-launcher.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/pi/install-launcher.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES lanzadores de pi conserva comportamiento y efectos (A63).
Aceptación A63: funciones `generar_lanzador_pi` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `generar_lanzador_pi` a `adapters/pi/install-launcher.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A63). Comprobación: revisar el diff; Preservar argumentos, rutas, permisos y texto generado.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A63). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/pi/install-launcher.sh` (A63). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A63). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A63). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
