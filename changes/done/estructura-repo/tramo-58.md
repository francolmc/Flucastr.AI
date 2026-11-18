# Tramo 58 — Separar enlaces de instalación (borrador)

## Pasos

### Tramo 58 — Historia: Separar enlaces de instalación
Como mantenedor quiero aislar enlaces de instalación para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 57 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/links.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/links.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES enlaces de instalación conserva comportamiento y efectos (A58).
Aceptación A58: funciones `enlazar y liberar` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `enlazar y liberar` a `tools/install/links.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A58). Comprobación: revisar el diff; Conservar las condiciones de simulación, enlaces existentes y mensajes.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A58). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/links.sh` (A58). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A58). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A58). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: `enlazar` y `liberar` se movieron literalmente a `tools/install/links.sh` (39 líneas), y el módulo se carga después de `manifest.sh`, antes del trap y antes de toda llamada. Se conservaron condiciones, mensajes, código de retorno y orden de ejecución; comparación literal de ambos cuerpos con la versión previa pasó. `git diff --check -- instalar.sh tools/install/links.sh` pasó.
- Paso 2: la matriz completa de 32 escenarios se capturó para el instalador anterior reconstruido, la versión actual y una repetición actual, con mismo root aislado y `mktemp` determinista; todos los campos se compararon sin normalizar ni excluir. `cmp` estricto pasó; los tres SHA-256 son `e0530379f5c6e88992e02a9c0a513c133b7534f8992209a74ff5d4a3321d884b`. La evidencia y detalle de la comparación están en `tramo-56.md`.
- Paso 3: `bash -n instalar.sh && bash -n tools/install/links.sh && git diff --check -- instalar.sh tools/install/links.sh` terminó con código 0.
- Pasos 4–5: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0. `./verify` coincide con la línea base salvo el mensaje exacto autorizado del escenario 9; las dos ejecuciones de `bash ./instalar.sh --simular` coinciden entre sí y con la línea base. Ejecución aislada por Bubblewrap.
