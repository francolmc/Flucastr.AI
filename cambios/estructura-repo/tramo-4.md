# Tramo 4 — Aislar la instantánea de instalación (borrador)

## Pasos

### Tramo 4 — Historia: Aislar la instantánea de instalación
Como mantenedor quiero separar esta comprobación para poder leer `verify` por fases sin alterar su ejecución.

Dependencias: tramo 3 revisado; línea base del tramo 1 accesible; `bash`, `node` y herramientas de `./verify` disponibles.
Contratos a conservar: `instantanea` y `autoprueba_5a` siguen definidas en el mismo shell; no se ejecutan al cargar el módulo. El proceso conserva `set -euo pipefail`, el directorio de trabajo, las salidas y el código de salida originales.
Rutas susceptibles de cambio: `verify` y `tools/verify/snapshot.sh`; no mover pruebas ni actualizar sus aserciones. Los módulos se cargan con `source` desde la raíz del repositorio.
Ejemplo concreto del resultado esperado: la autoprueba 5a sigue detectando archivos añadidos y modificados e ignorando historiales.
Alcance: únicamente `verify` y `tools/verify/snapshot.sh` como archivos de producto.
Archivos: `verify`, `tools/verify/snapshot.sh`.
CUANDO se ejecute `./verify` desde la raíz ENTONCES esta fase mantiene su resultado y el flujo completo pasa como en la línea base (A4).
Aceptación A4: el bloque se ejecuta una sola vez en la posición original, su contenido y comportamiento se mantienen y la simulación sigue coincidiendo con la referencia.
TODO:
- [x] Copiar a `tools/verify/snapshot.sh` el bloque desde «# Instantánea de lo que instalar.sh escribe» hasta el final de `autoprueba_5a`, inmediatamente antes de «# 1. modelos.json» (A4). Comprobación: comparar el bloque con el original de Git; esperar contenido idéntico. **Evidencia:** el bloque eliminado mostrado por `git diff -- verify` se comparó línea por línea con `tools/verify/snapshot.sh`; 53 líneas idénticas (exit 0).
- [x] Sustituir el bloque original en `verify` por `source tools/verify/snapshot.sh` (A4). Comprobación: inspeccionar el diff; esperar una carga en la misma posición y ningún otro cambio de lógica. **Evidencia:** `git diff -- verify` muestra solo la extracción del bloque y su carga en la posición original; comprobación estructural confirma una carga antes de `# 1. modelos.json` y que las funciones ya no están duplicadas (exit 0).
- [x] Comprobar `bash -n verify` y `bash -n tools/verify/snapshot.sh` (A4). Comprobación: esperar código 0. **Evidencia:** ambos análisis de sintaxis terminaron sin salida y con código 0.
- [x] Ejecutar `./verify` completo (A4). Comprobación: esperar código 0 y comparar orden y resultados con la referencia, normalizando solo rutas temporales. **Evidencia:** la receta aislada terminó con código 0 y confirmó `verify` coincidente con `linea-base/verify.txt` tras las normalizaciones declaradas.
- [x] Ejecutar `bash ./instalar.sh --simular` con el aislamiento de la línea base (A4). Comprobación: esperar código 0 y salida y efectos equivalentes a la referencia. **Evidencia:** la receta aislada ejecutó dos simulaciones; ambas coincidieron con sus salidas y efectos registrados en `linea-base/` (exit 0).
Verificación del tramo: `./verify` — nivel 3, exigido por el usuario después de cada movimiento; además comparar la simulación. Duración: la medida en el tramo 1.
Handoff: registrar archivos, diff, resultados y duración; detenerse para revisión antes del siguiente tramo. Ante una diferencia no explicada, no avanzar.

## Evidencia
- Archivos de producto: `verify` y `tools/verify/snapshot.sh`. El diff solo extrae el bloque de instantánea/autoprueba y lo carga en la misma posición; no cambió su contenido ni ejecución. SHA-256 actual de `tools/verify/snapshot.sh`: `b0d9f024e7e16d3d8dc6e166a45306a4f22d15c84c0940a47fe6a67ccaeaadf3`.
- El bloque eliminado de `verify` se comparó línea por línea con el módulo (53 líneas idénticas); `bash -n verify` y `bash -n tools/verify/snapshot.sh` terminaron con código 0.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0: `Simulaciones repetibles y verify coinciden con linea-base/.` Ejecutó el `verify` completo y dos veces `bash ./instalar.sh --simular` en Bubblewrap y comparó resultados/efectos con la línea base según sus normalizaciones declaradas.
- No se tocaron proyectos ni rutas excluidas.
