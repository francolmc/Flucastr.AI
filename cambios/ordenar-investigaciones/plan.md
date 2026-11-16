---
estado: aprobado
rama: docs/limpiar-cambios
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Ordenar investigaciones

## Objetivo
Dejar `cambios/` para trabajo pendiente y conservar las investigaciones históricas en documentación, con sus referencias actualizadas.

## Supuestos
- Las auditorías y el documento descriptivo son registros históricos; si deben permanecer activos, excluirlos del traslado.

## Alcance
Las siete carpetas `cambios/auditoria-burocracia`, `auditoria-codex-permisos-esperas`, `auditoria-donfinancio`, `auditoria-donfinancio-diseno`, `auditoria-tests-donfinancio`, `auditoria-verificacion-general` y `documentacion-kit`; sus destinos bajo `docs/investigaciones/`; documentos del repositorio que referencian esas rutas, incluidos planes históricos y `friccion.md`. No modificar contenido histórico salvo referencias; no mover planes pendientes.

## Decisiones ya tomadas
- Conservar nombres y contenidos de cada carpeta, incluyendo el JSONL de mediciones, bajo `docs/investigaciones/`.
- Actualizar referencias a las rutas anteriores en documentos versionados, incluso planes archivados, para mantener la trazabilidad.
- Ejecutor: constructor, porque el alcance, contexto y verificaciones son accesibles y no toca secretos, despliegue ni producción.

## Escenarios
- CUANDO se consulte una investigación histórica ENTONCES existe en documentación y las referencias apuntan a su nueva ruta (A1).
- CUANDO se consulte trabajo pendiente ENTONCES los planes actuales siguen en `cambios/` (A2).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Siete carpetas y sus archivos conservados; referencias actualizadas | Comparar archivos con `git diff --find-renames` y buscar las siete rutas anteriores con `rg` | Sin pérdida de contenido ni referencias antiguas |
| A2 | Los cinco planes pendientes permanecen | `test -f` para `cola-docker`, `kit-run`, `proceso-rapido`, `una-espera-write-stdin` y `verificacion-general` | Los cinco existen |

## Verificación
`./verify`, `git diff --check` y búsqueda de las siete rutas anteriores con `rg`, excluyendo `old/` y este plan; comprobar cada destino y los cinco planes con `test -f`. Se espera verificación exitosa, salida limpia, cero referencias antiguas y archivos presentes. El tipo es código por el traslado del JSONL fuera de `docs/`.

## Pasos
- [ ] Mover las siete carpetas de `cambios/` a `docs/investigaciones/`; comprobar cada destino con `test -d` (A1).
- [ ] Actualizar referencias versionadas a las rutas anteriores en `friccion.md` y demás documentos; comprobar con `rg` que no quedan referencias fuera de este plan y `old/` (A1).
- [ ] Comparar archivos trasladados de `docs/investigaciones/` con `git diff --find-renames` y comprobar que solo cambian referencias (A1).
- [ ] Comprobar con `test -f` los cinco planes pendientes en `cambios/` (A2).
- [ ] Ejecutar `./verify` y `git diff --check`; registrar resultados en `cambios/ordenar-investigaciones/plan.md` (A1, A2).

## Evidencia

## Notas
