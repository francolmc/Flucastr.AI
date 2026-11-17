# Tramo 70 — Separar agente de proyecto claude (borrador)

## Pasos

### Tramo 70 — Historia: Separar agente de proyecto claude
Como mantenedor quiero aislar agente de proyecto claude para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 69 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `adapters/claude-code/install-project-agent.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `adapters/claude-code/install-project-agent.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES agente de proyecto claude conserva comportamiento y efectos (A70).
Aceptación A70: funciones `fijar_agente_proyecto` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `fijar_agente_proyecto` a `adapters/claude-code/install-project-agent.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A70). Comprobación: el bloque completo, incluido comentario, coincide byte por byte con `instalar-current69.sh`; el único `source` está antes de la llamada; la matriz sintética conserva ajustes y manifiestos. `exit 0`.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A70). Comprobación: Bubblewrap capturó previa, actual y repetición sobre la misma raíz sintética; `cmp` estricto de cada captura completa, SHA-256 idéntico y 32 casos; sin diferencias ni normalizaciones. `exit 0`.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n adapters/claude-code/install-project-agent.sh` (A70). Comprobación: ambos retornan 0; `git diff --check` también pasó. La extracción byte por byte tiene 17 líneas y el `source` único precede la primera llamada. `exit 0`.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A70). Comprobación: `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó verify en Bubblewrap; código 0, coincide salvo el mensaje exacto autorizado del escenario 9.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A70). Comprobación: la misma receta corrió dos simulaciones aisladas, coinciden con `linea-base/` y entre sí; mensaje final de coincidencia y código 0. La receta completa terminó en 45.2 s.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- La extracción byte por byte, orden de carga y matriz A70 están documentados en `tramo-56.md`; las capturas completas y el runner reproducible están en `/tmp/tramo60-matriz-1/work/`.
- Receta aislada completa: verify y dos simulaciones coinciden con la línea base salvo la excepción textual aprobada del escenario 9; código 0 (45.2 s). Matriz, sintaxis, orden de carga y `git diff --check` pasan. Detener para revisión del principal.
