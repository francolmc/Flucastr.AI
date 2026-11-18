> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

# Inventario de consumidores pendientes

Este inventario es evidencia de diseño, no implica que los movimientos ya tengan tramos ejecutables. No leer ni copiar el archivo de credenciales usado como fixture; ver `aislamiento.md`.

| Unidad actual | Consumidor observado | Consecuencia para el movimiento |
|---|---|---|
| `pruebas/aceptacion/{contrato-constructor,kit-run,uso}.test.mjs` | `AGENTS.md` declara `node --test pruebas/aceptacion/*.test.mjs` y filtros por nombre. Cada wrapper resuelve su suite con `import.meta.url`. | Mantener el comando y filtros antiguos; mover uno por vez, recalcular las rutas relativas y probar que un fallo real de la suite sigue propagándose. No sustituir ni debilitar aceptación. |
| `pruebas/permisos-v2.test.mjs` | `verify`, sección 3 | Preservar la ruta invocada o adaptar conjuntamente la fase extraída sin cambiar la prueba. |
| `pruebas/permisos-contrato/estructura.test.mjs` | `verify`, sección 8 | Preservar ruta y prueba negativa; revisar además los otros archivos de esta familia y sus fixtures antes de mover. |
| `pruebas/revisar-plan/*.test.mjs` | `verify`, sección 10b | Conservar descubrimiento por glob y comprobar que se descubre al menos una suite. |
| `pruebas/diagnostico-sugiere/*.test.mjs` | `verify`, sección 10c | Preservar fixtures y rutas usadas para construir repositorios sintéticos y verificar huellas. |
| `pruebas/uso/probar.mjs` | `verify`, sección 12 y wrapper de aceptación | Conservar CLI, fixtures relativos y ejecución como proceso; no tocar credenciales. |
| `pruebas/kit-run/probar.mjs` | `verify`, sección 13 y wrapper de aceptación | Conservar CLI, fixtures relativos y ejecución como proceso. |
| `pruebas/revisor-luna/medir.mjs` y `casos/` | El propio script construye `pruebas/revisor-luna/casos/<id>/plan.md`; documenta `--autoprueba`. | Diseñar compatibilidad de rutas antes de mover casos; correr solo autoprueba offline. La ejecución con modelos queda fuera sin presupuesto autorizado. |
| `pruebas/comparar-openspec/runner/cli.mjs` | `verify`, sección 10, solo si existe | Ausente en este checkout: conservar el aviso y la omisión, no inventar ni mover archivos inexistentes. |
| `README.md` | `verify` exige el literal `pi-constructor` y prueba una copia que debe fallar al quitar contenido exigido | Mantener literal, enlaces y prueba negativa al reducir el README; revisar todos los enlaces y anclas antes del cambio. |
| `skills/planificar-cambio/SKILL.md` | `verify`, sección 8i, exige `salvo que Franco` y rechaza `Falla la 2 o la 4` | En el tramo de anonimización actualizar el literal y su comprobación en la misma unidad, incluyendo la copia equivalente en `core/`; conservar la prueba negativa y registrar el cambio de mensaje autorizado. |

## Pendiente antes de aprobar

Completar el inventario de rutas dinámicas y fixtures por suite; especificar un tramo por movimiento con pruebas efectivas, rutas de wrapper y cobertura negativa. El módulo de verify que recibe la sección 8i debe identificarse a partir del tramo que la extraiga: no asumir su nombre. Mantener separados los resultados de la auditoría estática y los resultados aún no ejecutados.
