# Tramo 6 — Aislar sintaxis y ayuda de instalación (borrador)

## Pasos

### Tramo 6 — Historia: Aislar sintaxis y ayuda de instalación
Como mantenedor quiero separar esta comprobación para poder leer `verify` por fases sin alterar su ejecución.

Dependencias: tramo 5 revisado; línea base del tramo 1 accesible; `bash`, `node` y herramientas de `./verify` disponibles.
Contratos a conservar: conservar variables, funciones, trap EXIT y temporales en el mismo shell, sin subshell. El proceso conserva `set -euo pipefail`, el directorio de trabajo, las salidas y el código de salida originales.
Rutas susceptibles de cambio: `verify` y `tools/verify/install-help.sh`; no mover pruebas ni actualizar sus aserciones. Los módulos se cargan con `source` desde la raíz del repositorio.
Ejemplo concreto del resultado esperado: las dos ayudas siguen siendo idénticas y la ayuda incompleta sigue siendo rechazada.
Alcance: únicamente `verify` y `tools/verify/install-help.sh` como archivos de producto.
Archivos: `verify`, `tools/verify/install-help.sh`.
CUANDO se ejecute `./verify` desde la raíz ENTONCES esta fase mantiene su resultado y el flujo completo pasa como en la línea base (A6).
Aceptación A6: el bloque se ejecuta una sola vez en la posición original, su contenido y comportamiento se mantienen y la simulación sigue coincidiendo con la referencia.
TODO:
- [x] Copiar a `tools/verify/install-help.sh` el bloque desde «# 2. sintaxis de los instaladores» hasta justo antes de «# 3. resolver para cada agente y cada herramienta» (A6). Comprobación: comparar el bloque con el original de Git; esperar contenido idéntico.
- [x] Sustituir el bloque original en `verify` por `source tools/verify/install-help.sh` (A6). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún otro cambio de lógica.
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/install-help.sh` (A6). Comprobación: esperar código 0.
- [x] Ejecutar `./verify` completo (A6). Comprobación: esperar código 0 y comparar orden y resultados con la referencia, normalizando solo rutas temporales.
- [x] Ejecutar `bash ./instalar.sh --simular` con el aislamiento de la línea base (A6). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, exigido por el usuario después de cada movimiento; además comparar la simulación. Duración: la medida en el tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante una diferencia no explicada, no avanzar.

## Evidencia
- Paso 1 (A6): se copió el bloque actual de `verify` antes de sustituirlo. Comparación byte por byte con la porción fuente: idéntico, 52 líneas y 3108 bytes; comando Python de extracción/comparación, código 0. El bloque conserva newline final y se ejecuta como archivo fuente, no en subshell.
- Paso 2 (A6): `verify` carga el módulo exactamente una vez en el lugar del bloque, antes de la fase 3; comprobación estructural y diff: código 0. El contenido se eliminó solo de `verify` y quedó en `tools/verify/install-help.sh`; sin cambios adicionales de lógica.
- Paso 3 (A6): `bash -n verify && bash -n tools/verify/install-help.sh` terminó con código 0.
- Paso 4 (A6): `bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` completo en Bubblewrap; código 0, salida y orden coincidentes con `linea-base/verify.txt` según normalizaciones registradas en `plan.md`.
- Paso 5 (A6): la misma receta ejecutó dos `bash ./instalar.sh --simular` aislados; ambas salidas y efectos coincidieron con `linea-base/`; código 0. Duración total observada: aproximadamente 39.7 s (30.0 s primera espera + 9.5 s final).
