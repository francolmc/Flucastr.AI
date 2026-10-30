# Estado del flujo

## Escalación

## Paso actual

Rol: coordinador, detenido en la puerta 4 de F06 task-06.
Rama: feature/F06-modo-yolo
El `constructor` dejó `task-06` en `lista para revisión`. Cambió `pruebas/comprobaciones/contrato-roles.mjs` (regla 12: modo yolo en coordinador, planificador y descomponer-feature) y `contrato-roles.test.mjs` (seis variantes). Según su informe, el test da 20/20 y `rapida.sh` da código 0 en 21 s (tope 30 s); no re-ejecutado por mí.
Siguiente: con `task-06` en `hecha` (tu decisión), delego `task-07` (depende de 01, ya hecha). Después 08.

## Espera a Franco

- **Puerta 4:** revisa la *Evidencia* y *Notas* de `features/F06-modo-yolo/task-06-contrato-roles-yolo.md` y el diff de los dos archivos de `pruebas/comprobaciones/`, haz el commit en `feature/F06-modo-yolo` y, si está bien, pásala a `hecha`.
- Hueco menor anotado por el constructor: la tarea decía «hoy 12», pero el archivo terminaba en la regla 11, así que la regla nueva es la 12.
- Supuestos del planificador (a)–(f) de F06 aceptados con la aprobación de las tareas, salvo que indiques lo contrario.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-29
