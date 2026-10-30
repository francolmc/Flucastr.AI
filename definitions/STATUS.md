# Estado del flujo

## Escalación

## Paso actual

Rol: coordinador, detenido en la puerta 4 de F06 task-07.
Rama: feature/F06-modo-yolo
El `constructor` dejó `task-07` en `lista para revisión`. Cambió `pruebas/comprobaciones/constructor-resultado.mjs` (caso `yolo`: rama sin cambios, sin `CONFIRMAR:` ni `BLOQUEO:`) y `constructor-resultado.test.mjs`. Según su informe, el test da 19/19 y `rapida.sh` da 143 pruebas sin fallos en 24 s (tope 30 s); no re-ejecutado por mí.
Siguiente: con `task-07` en `hecha` (tu decisión), delego `task-08` (README; depende de 03 y 04, hechas).

## Espera a Franco

- **Puerta 4:** revisa la *Evidencia* y *Notas* de `features/F06-modo-yolo/task-07-resultado-yolo.md` y el diff de los dos archivos de `pruebas/comprobaciones/`, haz el commit en `feature/F06-modo-yolo` y, si está bien, pásala a `hecha`.
- Nota del constructor: el bloque de `rapida.sh` en la *Evidencia* omite líneas intermedias por longitud; el resumen y el conteo son literales.
- Supuestos del planificador (a)–(f) de F06 aceptados con la aprobación de las tareas, salvo que indiques lo contrario.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-29
