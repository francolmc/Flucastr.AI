# Estado del flujo

## Escalación

## Paso actual

Rol: coordinador, esperando a Franco. Feature F05 (`en curso`): las 8 tareas están `hecha`. Falta que Franco confirme F05 como `hecha`.
Siguiente tras la confirmación: F06 (yolo). Con F05 `hecha` escribo `hecha` en `BACKLOG.md` y delego al `planificador` con `descomponer-feature` para F06 (mueve la marca `→`).
Franco aprobó las 8 tareas de F05 (2026-10-29). Orden: 01; luego 02, 03, 04 y 07 (dependen de 01); 05 (de 04); 06 y 08 (de 04 y 05). Una a la vez, solo si su `depende_de:` está `hecha`.
Nota: F05 define el mecanismo de ramas, que aún no existe; por eso sus tareas se ejecutan sin línea `Rama:` y en la rama actual (`main`). Si quieres rama propia para F05, créala tú antes de continuar.

## Espera a Franco

- **Confirmar F05 como `hecha`** (todas sus tareas, `features/F05-ramas-y-refinado/`, están `hecha`). Con esa feature cerrada, la rama, el PR y el despliegue son tuyos (F05 se construyó en la rama actual, sin rama propia, porque definía el mecanismo).
- `rapida.sh` dejó conservado `pruebas/.temporales/capa1-JRL1OP` (comportamiento del propio script); puedes borrarlo si no lo necesitas.
- Commit de los cambios de F02, F03, F04 y de la definición actualizada: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-29
