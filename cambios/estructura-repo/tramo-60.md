# Tramo 60 — Separar skills en proyecto sintético (borrador)

## Pasos

### Tramo 60 — Historia: Separar skills en proyecto sintético
Como mantenedor quiero aislar skills en proyecto sintético para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 59 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/project-skills.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/project-skills.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES skills en proyecto sintético conserva comportamiento y efectos (A60).
Aceptación A60: funciones `exclusion_de_git, excluir_en_git e instalar_skills_proyecto` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `exclusion_de_git, excluir_en_git e instalar_skills_proyecto` a `tools/install/project-skills.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A60). Comprobación: revisar el diff; Mantener SIN_GIT_AVISADO y el orden de sus inicializaciones y efectos.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A60). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/project-skills.sh` (A60). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A60). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A60). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
