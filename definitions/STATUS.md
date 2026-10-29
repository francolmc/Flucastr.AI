# Estado del flujo

## Escalación

## Paso actual

Rol: coordinador, detenido en la puerta 4 de F06 task-02.
Rama: feature/F06-modo-yolo
El `constructor` dejó `task-02` en `lista para revisión`. Cambió solo `agentes/coordinador.md` (sección `## Modo yolo` y una fila en la tabla de decisión). Según su informe, las pruebas de contrato y formato dan 27 pass, 0 fail (no re-ejecutado por mí).
Siguiente: con `task-02` en `hecha` (tu decisión), delego `task-03` (depende de 02).

## Espera a Franco

- **Puerta 4:** revisa la *Evidencia* de `features/F06-modo-yolo/task-02-coordinador-activacion-yolo.md` y el diff de `agentes/coordinador.md`, haz el commit en `feature/F06-modo-yolo` y, si está bien, pásala a `hecha`.
- Aviso: el constructor vio `agentes/constructor.md` aún modificado en `git status`. Si tu commit de task-01 era solo de esa tarea, puede ser un resto; revísalo antes de commitear.
- Supuestos del planificador (a)–(f) de F06 aceptados con la aprobación de las tareas, salvo que indiques lo contrario.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-29
