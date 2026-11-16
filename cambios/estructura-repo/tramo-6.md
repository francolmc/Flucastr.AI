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
- [ ] Copiar a `tools/verify/install-help.sh` el bloque desde «# 2. sintaxis de los instaladores» hasta justo antes de «# 3. resolver para cada agente y cada herramienta» (A6). Comprobación: comparar el bloque con el original de Git; esperar contenido idéntico.
- [ ] Sustituir el bloque original en `verify` por `source tools/verify/install-help.sh` (A6). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún otro cambio de lógica.
- [ ] Comprobar `bash -n verify` y `bash -n tools/verify/install-help.sh` (A6). Comprobación: esperar código 0.
- [ ] Ejecutar `./verify` completo (A6). Comprobación: esperar código 0 y comparar orden y resultados con la referencia, normalizando solo rutas temporales.
- [ ] Ejecutar `bash ./instalar.sh --simular` con el aislamiento de la línea base (A6). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, exigido por el usuario después de cada movimiento; además comparar la simulación. Duración: la medida en el tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante una diferencia no explicada, no avanzar.

## Evidencia
Pendiente.
