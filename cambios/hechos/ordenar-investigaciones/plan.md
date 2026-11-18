---
estado: listo
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
Las siete carpetas `cambios/auditoria-burocracia`, `auditoria-codex-permisos-esperas`, `auditoria-finanzas`, `auditoria-finanzas-diseno`, `auditoria-tests-finanzas`, `auditoria-verificacion-general` y `documentacion-kit`; sus destinos bajo `docs/investigaciones/`; documentos del repositorio que referencian esas rutas, incluidos planes históricos y `friccion.md`. No modificar contenido histórico salvo referencias; no mover planes pendientes.

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
- [x] Mover las siete carpetas de `cambios/` a `docs/investigaciones/`; comprobar cada destino con `test -d` (A1).
  - evidencia: `test -d` para los 7 destinos; salida `7 destinos presentes` (exit 0). Los archivos por carpeta son 1, 1, 1, 1, 1, 4 y 1, igual que el respaldo de `git archive` de HEAD.
- [x] Actualizar referencias versionadas a las rutas anteriores en `friccion.md` y demás documentos; comprobar con `rg` que no quedan referencias fuera de este plan y `old/` (A1).
  - evidencia: `$ rg -n 'cambios/(auditoria-burocracia|auditoria-codex-permisos-esperas|auditoria-finanzas|auditoria-finanzas-diseno|auditoria-tests-finanzas|auditoria-verificacion-general|documentacion-kit)' --glob '!old/**' --glob '!cambios/ordenar-investigaciones/plan.md'`; sin coincidencias (exit 1, esperado).
- [x] Comparar archivos trasladados de `docs/investigaciones/` con `git diff --find-renames` y comprobar que solo cambian referencias (A1).
  - evidencia: comparación recursiva de cada directorio contra su copia de `git archive HEAD`: solo difieren las dos referencias actualizadas en `hallazgo.md`; los otros 8 archivos, incluido el JSONL, conservan contenido. `git diff` no incluye destinos aún no versionados, así que se comparó cada carpeta contra HEAD sin añadir archivos al índice.
- [x] Comprobar con `test -f` los cinco planes pendientes en `cambios/` (A2).
  - evidencia: `test -f cambios/<plan>/plan.md` para los cinco nombres; salida `5 planes pendientes presentes` (exit 0).
- [x] Ejecutar `./verify` y `git diff --check`; registrar resultados en `cambios/ordenar-investigaciones/plan.md` (A1, A2).
  - evidencia: `./verify` terminó con `VERIFY OK` (exit 0); `git diff --check` sin salida (exit 0); búsqueda de referencias antiguas sin coincidencias (exit 1 esperado); los 7 destinos y 5 planes están presentes.

## Evidencia
$ ./verify
...
VERIFY OK
exit 0

$ git diff --check
(sin salida)
exit 0

$ rg -n 'cambios/(auditoria-burocracia|auditoria-codex-permisos-esperas|auditoria-finanzas|auditoria-finanzas-diseno|auditoria-tests-finanzas|auditoria-verificacion-general|documentacion-kit)' --glob '!old/**' --glob '!cambios/ordenar-investigaciones/plan.md'
(sin coincidencias; exit 1 esperado)
exit 1

$ for d in auditoria-burocracia auditoria-codex-permisos-esperas auditoria-finanzas auditoria-finanzas-diseno auditoria-tests-finanzas auditoria-verificacion-general documentacion-kit; do test -d "docs/investigaciones/$d" || exit 1; done; printf '7 destinos presentes\n'
7 destinos presentes
exit 0

$ for p in cola-docker kit-run proceso-rapido una-espera-write-stdin verificacion-general; do test -f "cambios/$p/plan.md" || exit 1; done; printf '5 planes pendientes presentes\n'
5 planes pendientes presentes
exit 0

## Notas
- La copia de comparación se extrajo con `git archive HEAD`; `git diff` no detecta destinos aún no versionados y no se añadió nada al índice.
