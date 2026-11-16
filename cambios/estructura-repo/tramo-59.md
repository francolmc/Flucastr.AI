# Tramo 59 — Separar instalación de skills (borrador)

## Pasos

### Tramo 59 — Historia: Separar instalación de skills
Como mantenedor quiero aislar instalación de skills para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 58 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/skills.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/skills.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES instalación de skills conserva comportamiento y efectos (A59).
Aceptación A59: funciones `enlazar_skills, instalar_skills y copiar_skills` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [ ] Extraer `enlazar_skills, instalar_skills y copiar_skills` a `tools/install/skills.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A59). Comprobación: revisar el diff; Conservar la copia o enlace según el modo y los nombres existentes.
- [ ] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A59). Comprobación: registrar resultados y diferencias autorizadas.
- [ ] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/skills.sh` (A59). Comprobación: ambos retornan 0.
- [ ] Ejecutar `./verify` en el aislamiento del tramo 1 (A59). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [ ] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A59). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
Pendiente.
