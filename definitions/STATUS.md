# Estado del flujo

## Escalación

## Paso actual

Rol: coordinador, detenido en la puerta 4 de F06 task-05.
Rama: feature/F06-modo-yolo
El `constructor` dejó `task-05` en `lista para revisión`. Cambió `pruebas/comprobaciones/contrato-constructor.mjs` (reglas 13 y 14) y `contrato-constructor.test.mjs`. Según su informe, el test da 17/17 y `rapida.sh` da 133 pruebas sin fallos, en 27 s con tope de 30 s (no re-ejecutado por mí).
Siguiente: con `task-05` en `hecha` (tu decisión), delego `task-06` (depende de 02, 03 y 04, ya hechas). Después 07 y 08.

## Espera a Franco

- **Puerta 4:** revisa la *Evidencia* de `features/F06-modo-yolo/task-05-contrato-constructor-yolo.md` y el diff de los dos archivos de `pruebas/comprobaciones/`, haz el commit en `feature/F06-modo-yolo` y, si está bien, pásala a `hecha`.
- Aviso: `rapida.sh` tardó 27 s frente a un tope de 30 s; las próximas tareas de pruebas pueden pasarse del tope.
- Confirma que hiciste el commit de task-04; si no, quedó mezclado con el de task-05.
- Supuestos del planificador (a)–(f) de F06 aceptados con la aprobación de las tareas, salvo que indiques lo contrario.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-29
