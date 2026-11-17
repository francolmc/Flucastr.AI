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
- [x] Copiar a `tools/verify/models.sh` el bloque desde «# 1. modelos.json» hasta justo antes de «# 2. sintaxis de los instaladores» (A5). Comprobación: comparar el bloque con el original de Git; esperar contenido idéntico. **Evidencia:** comparación byte por byte del bloque original en `verify` con el módulo: 18 líneas, 867 bytes idénticos (exit 0).
- [x] Sustituir el bloque original en `verify` por `source tools/verify/models.sh` (A5). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún otro cambio de lógica. **Evidencia:** diff del tramo y comprobación estructural confirman una carga antes del marcador del paso 2, en posición original, y que el bloque ya no está en `verify` (exit 0).
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/models.sh` (A5). Comprobación: esperar código 0. **Evidencia:** ambos análisis de sintaxis terminaron sin salida y con código 0.
- [x] Ejecutar `./verify` completo (A5). Comprobación: esperar código 0 y comparar orden y resultados con la referencia, normalizando solo rutas temporales. **Evidencia:** la receta aislada terminó con código 0 y confirmó que `./verify` coincide con `linea-base/verify.txt` tras las normalizaciones declaradas.
- [x] Ejecutar `bash ./instalar.sh --simular` con el aislamiento de la línea base (A5). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia. **Evidencia:** la receta aislada ejecutó dos simulaciones; ambas coincidieron con sus salidas y efectos registrados en `linea-base/` (exit 0).
Verificación del tramo: `./verify` — nivel 3, exigido por el usuario después de cada movimiento; además comparar la simulación. Duración: la medida en el tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante una diferencia no explicada, no avanzar.

## Evidencia
- Archivos de producto: `verify` y `tools/verify/models.sh`. El módulo contiene el bloque original byte por byte, y `verify` lo carga una vez antes del paso 2; no cambió la lógica.
- Comparación previa a la sustitución: 18 líneas, 867 bytes idénticos. `bash -n verify` y `bash -n tools/verify/models.sh` terminaron con código 0.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`
  `v24.22.1`
  `codex-cli 0.169.0`
  `GNU Awk 5.3.2, API 4.0, PMA Avon 8-g1, (GNU MPFR 4.2.2, GNU MP 6.3.0)`
  `Simulaciones repetibles y verify coinciden con linea-base/.`
  `exit 0`
  El comando tomó aproximadamente 40 s y ejecutó el `./verify` completo y dos simulaciones aisladas de instalación, coincidentes con la referencia.
- No se tocaron proyectos ni rutas excluidas.
