# Tramo 124 — Inventariar nombres propios vigentes

## Pasos

### Tramo 124 — Historia: Inventariar nombres propios vigentes
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 123 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: ninguno. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: ninguno.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A124).
Aceptación A124: Revisar agentes, skills, documentación, generadores y fixtures accesibles; no afirmar ausencia global mediante búsqueda de un solo nombre.
TODO:
- [x] En `cambios/estructura-repo/tramo-124.md`, Registrar en cambios/estructura-repo/anonimizacion.md cada coincidencia vigente, contexto, reemplazo propuesto, prueba y exclusión; buscar nombres personales y de proyectos conocidos sin leer secretos ni históricos protegidos. (A124). Comprobación: Revisar agentes, skills, documentación, generadores y fixtures accesibles; no afirmar ausencia global mediante búsqueda de un solo nombre.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A124). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: búsquedas por archivo y conteo de ocurrencias en `agentes/`, `skills/`, sus copias bajo `core/`, `docs/`, `scripts/`, `tools/`, `evals/`, `tests/` y `pruebas/`; inventario de contextos, propuestas, consumidores/pruebas y exclusiones en `anonimizacion.md`. Se encontraron coincidencias personales y de proyecto, nombres públicos preservables, fixtures sintéticos conservables y documentación histórica excluida. Se excluyeron `old/**`, `**/registro/**`, `.env*`, `pruebas/.temporales/**` y el árbol entero `pruebas/revisor-luna/**`; no se leyó ningún caso real. Ninguna sustitución de producto aplicada en este tramo. `git diff --check` ejecutado al finalizar y pasó (ver comprobación final).
- Paso 2: `timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0` (~42 s). La salida informa que `verify` coincide salvo el mensaje exacto autorizado del escenario 9 y que las simulaciones repetibles y `verify` coinciden con `linea-base/`, aplicando solo esa excepción. La ejecución quedó dentro del límite de 95 s; no se accedió a proyectos reales ni a áreas excluidas.
- `git diff --check -- cambios/estructura-repo/anonimizacion.md cambios/estructura-repo/tramo-124.md cambios/estructura-repo/plan.md`: `exit 0` tras completar el registro.
- Punto de control: solo documentación del plan/tramo modificada; inventario registrado, sin cambios de producto. Paso 1 (búsqueda contextual y exclusiones) y paso 2 (reproducción aislada de `./verify` y simulación de instalación) completados.
