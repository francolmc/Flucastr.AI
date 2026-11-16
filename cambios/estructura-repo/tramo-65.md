# Tramo 65 — Separar agentes de codex (borrador)

## Pasos

### Tramo 65 — Historia: Separar agentes de codex
Como mantenedor quiero aislar agentes de codex para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 64 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/codex/install-agent.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/codex/install-agent.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agentes de codex conserva comportamiento y efectos (A65).
Aceptación A65: funciones `generar_agente_codex` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `generar_agente_codex` a `adapters/codex/install-agent.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A65). Comprobación: revisar el diff; Preservar contenido, modelo y esfuerzo generados.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A65). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/codex/install-agent.sh` (A65). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A65). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A65). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
