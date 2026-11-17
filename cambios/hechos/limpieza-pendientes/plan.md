---
estado: listo
rama: docs/limpieza-pendientes
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Limpiar planes pendientes

## Objetivo
Eliminar los seis planes que ya no se ejecutarán y retirar referencias activas que los presentan como pendientes.

## Exploración
El árbol estaba limpio. Hay cuatro borradores (`cola-docker`, `proceso-rapido`, `una-espera-write-stdin`, `verificacion-general`), `kit-run` parcialmente ejecutado y `prueba-informe` terminado. Cada carpeta contiene solo `plan.md`. `docs/mejoras.md` y `docs/evaluaciones/costos.md` mantienen referencias activas; planes en `cambios/hechos/` contienen referencias históricas. La persona usuaria indicó «limpiamos todo» después de conocer las opciones de archivo y eliminación.

## Evaluación
Eliminar los seis responde al pedido; conservar referencias históricas evita alterar registros de trabajos anteriores. El costo es perder los detalles de los planes eliminados en el árbol actual, recuperables en la historia de Git.

## Supuestos
- Las referencias históricas de `cambios/hechos/` quedan como registro de su momento; si se quieren actualizar, cambia el alcance.

## Decisiones ya tomadas
- Eliminar los seis planes, incluso la evidencia del plan parcial y la prueba terminada.
- Ejecutor: constructor, porque los requisitos, rutas y comprobaciones son accesibles y no involucran credenciales ni producción.

## Decisiones
Ninguna.

## Validación
El usuario confirmó eliminar todo y aprobó este plan el 2026-11-17.

## Alcance
Las seis carpetas indicadas en Exploración, `docs/mejoras.md` y `docs/evaluaciones/costos.md`. No modificar código ni planes archivados.

## Verificación
`git diff --check` — salida vacía y código 0; además comprobar ausencia de las seis carpetas y referencias activas como indica la aceptación.

## Pasos
### Tramo 1 — Historia: pendientes retirados
Como mantenedor quiero retirar planes abandonados para que la carpeta refleje el trabajo vigente.
Dependencias: ninguna.
Contratos a conservar: registros históricos de `cambios/hechos/` y datos medidos de costos.
Rutas susceptibles de cambio: las seis carpetas mencionadas y los dos documentos de Alcance; no hay pruebas que dependan de esas rutas identificadas en la exploración.
Ejemplo concreto del resultado esperado: `cambios/kit-run/plan.md` ya no existe y el informe de costos conserva la medición sin proponer ejecutar su tramo 3.
Alcance: solo documentos y las seis carpetas indicadas.
Archivos: `docs/mejoras.md`, `docs/evaluaciones/costos.md`.
CUANDO se consulta el trabajo pendiente ENTONCES los seis planes ya no aparecen y las referencias activas no los presentan como vigentes (A1, A2).
Aceptación:
- A1: las seis carpetas no existen; comprobar con `test ! -e` para cada una; esperar código 0.
- A2: ambos documentos no apuntan a los planes retirados como trabajo pendiente y los datos de costos se conservan; comprobar con `rg` y revisión del diff.
TODO:
- [x] Eliminar `cambios/cola-docker/plan.md`, `cambios/kit-run/plan.md`, `cambios/proceso-rapido/plan.md`, `cambios/prueba-informe/plan.md`, `cambios/una-espera-write-stdin/plan.md` y `cambios/verificacion-general/plan.md` y sus carpetas vacías (A1). Comprobación: `for d in cola-docker kit-run proceso-rapido prueba-informe una-espera-write-stdin verificacion-general; do test ! -e "cambios/$d" || exit 1; done`; esperar código 0.
- [x] En `docs/mejoras.md`, retirar las dos referencias a `cambios/proceso-rapido` sin inventar un plan alternativo (A2). Comprobación: `rg -n 'cambios/proceso-rapido' docs/mejoras.md`; esperar código 1.
- [x] En `docs/evaluaciones/costos.md`, retirar la propuesta de ejecutar el tramo 3 de `kit-run` y conservar los datos históricos (A2). Comprobación: `rg -n 'Siguiente paso: medir un cambio de código mayor antes del tramo 3' docs/evaluaciones/costos.md`; esperar código 1; revisar el diff.
Verificación del tramo: `git diff --check` — nivel docs; código 0; cubre formato de A1 y A2 junto con las comprobaciones individuales.
Handoff: no modificar referencias históricas en `cambios/hechos/`; dejar evidencia de las comprobaciones y del diff.

## Evidencia
- Paso 1: eliminadas las seis carpetas; comprobación indicada ejecutada, código 0.
- Paso 2: retiradas ambas referencias activas de `docs/mejoras.md`; `rg -n 'cambios/proceso-rapido' docs/mejoras.md` sin resultados, código 1 esperado.
- Paso 3: retirada la propuesta de tramo 3 en `docs/evaluaciones/costos.md`; comprobación `rg` sin resultados, código 1 esperado. Revisión del diff confirma que se eliminó solo la propuesta y se conservan mediciones y hallazgos.
- Verificación del tramo: `git diff --check`, código 0. `git diff --name-only main` lista únicamente las seis eliminaciones y los dos documentos del alcance; las seis carpetas están ausentes.

## Notas
