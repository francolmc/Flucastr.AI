# Tramo 62 — Separar agentes de pi (borrador)

## Pasos

### Tramo 62 — Historia: Separar agentes de pi
Como mantenedor quiero aislar agentes de pi para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 61 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/pi/install-agent.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/pi/install-agent.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agentes de pi conserva comportamiento y efectos (A62).
Aceptación A62: funciones `generar_agente_pi` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `generar_agente_pi` a `adapters/pi/install-agent.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A62). Comprobación: revisar el diff; Preservar frontmatter, skills declaradas y contenido generado.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A62). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n adapters/pi/install-agent.sh` (A62). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A62). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A62). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
