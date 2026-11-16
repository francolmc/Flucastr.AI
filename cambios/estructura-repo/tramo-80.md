# Tramo 80 — Separar coordinación de migración (borrador)

## Pasos

### Tramo 80 — Historia: Separar coordinación de migración
Como mantenedor quiero aislar coordinación de migración para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 79 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/migration/run.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/migration/run.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES coordinación de migración conserva comportamiento y efectos (A80).
Aceptación A80: funciones `migrar` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `migrar` a `tools/install/migration/run.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A80). Comprobación: revisar el diff; Mantener inicialización y trap, errores, orden de operaciones y contenido de old/v1 generado en el fixture.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A80). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/migration/run.sh` (A80). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A80). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A80). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
