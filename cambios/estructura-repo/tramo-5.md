# Tramo 5 — Aislar la comprobación de modelos (borrador)

## Pasos

### Tramo 5 — Historia: Aislar la comprobación de modelos
Como mantenedor quiero separar esta comprobación para poder leer `verify` por fases sin alterar su ejecución.

Dependencias: tramo 4 revisado; línea base del tramo 1 accesible; `bash`, `node` y herramientas de `./verify` disponibles.
Contratos a conservar: la llamada `paso 1`, la lectura de `modelos.json` y `agentes/`, y todos sus mensajes y errores conservan su orden. El proceso conserva `set -euo pipefail`, el directorio de trabajo, las salidas y el código de salida originales.
Rutas susceptibles de cambio: `verify` y `tools/verify/models.sh`; no mover pruebas ni actualizar sus aserciones. Los módulos se cargan con `source` desde la raíz del repositorio.
Ejemplo concreto del resultado esperado: una discrepancia entre agentes y modelos sigue dando error.
Alcance: únicamente `verify` y `tools/verify/models.sh` como archivos de producto.
Archivos: `verify`, `tools/verify/models.sh`.
CUANDO se ejecute `./verify` desde la raíz ENTONCES esta fase mantiene su resultado y el flujo completo pasa como en la línea base (A5).
Aceptación A5: el bloque se ejecuta una sola vez en la posición original, su contenido y comportamiento se mantienen y la simulación sigue coincidiendo con la referencia.
TODO:
- [ ] Copiar a `tools/verify/models.sh` el bloque desde «# 1. modelos.json» hasta justo antes de «# 2. sintaxis de los instaladores» (A5). Comprobación: comparar el bloque con el original de Git; esperar contenido idéntico.
- [ ] Sustituir el bloque original en `verify` por `source tools/verify/models.sh` (A5). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún otro cambio de lógica.
- [ ] Comprobar `bash -n verify` y `bash -n tools/verify/models.sh` (A5). Comprobación: esperar código 0.
- [ ] Ejecutar `./verify` completo (A5). Comprobación: esperar código 0 y comparar orden y resultados con la referencia, normalizando solo rutas temporales.
- [ ] Ejecutar `bash ./instalar.sh --simular` con el aislamiento de la línea base (A5). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia.
Verificación del tramo: `./verify` — nivel 3, exigido por el usuario después de cada movimiento; además comparar la simulación. Duración: la medida en el tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante una diferencia no explicada, no avanzar.

## Evidencia
Pendiente.
