# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 4). task-01 `lista para revisión` (`features/F08-limpieza-y-archivo/task-01-archivar-chequeo.md`); arquitecto terminó el ajuste de §10.5. F08 `en curso`; las 4 tareas `aprobadas` por Franco (2026-10-30). F07 `hecha` y mergeada.
Rama: feature/F08-limpieza-y-archivo

## Espera a Franco

- **Puerta 4:** revisa Evidencia y Notas de `features/F08-limpieza-y-archivo/task-01-archivar-chequeo.md` (`scripts/archivar.mjs` y `pruebas/comprobaciones/archivar.test.mjs`: 10 pass; `rapida.sh`: 168 pass, 22 s de 30 s). Rama `feature/F08-limpieza-y-archivo` creada desde `main`. El chequeo marca F01–F07 como candidatas a archivar (correcto según las reglas). Haz el commit (incluye los cambios de `definitions/` ya aprobados) y pásala a `hecha`. Luego task-02.

- **Puerta 1 (menor):** el arquitecto ajustó `definitions/WORKFLOW.md` §10.5 y una frase de §10.2 (el `coordinador` no corre `archivar.mjs`; deja el comando aquí y lo corres tú) y reflejó el cambio en `ARCHITECTURE.md` (alternativa descartada). Quitó «por aprobar» del resto de F08 en `WORKFLOW.md`, `PROJECT.md` y `ARCHITECTURE.md`. Revisa esos pasajes y apruébalos. Sin respuesta explícita quedan las dos «Abiertas» de §10.6 (archivar antes/después del PR, umbrales).
- task-03 de F08 debe alinear `agentes/coordinador.md` con esto (no correr el script, solo escribir el comando).
- Después de F08: pedir al planificador compactar las filas `hecha` de `BACKLOG.md` (10 424 bytes, umbral 8 KB) por la puerta 2.
- `rapida.sh` tarda ~22 s de 30 s: las pruebas nuevas deben ser livianas.
- Los documentos de `definitions/` aún llevan la marca «cambio propuesto por aprobar» del arquitecto; quitarla le toca a él (no la edito yo).
- Supuestos para F08 (preguntas de WORKFLOW §10.6 sin respuesta explícita): archivar después del PR en un commit `chore/` aparte; umbrales de tamaño como punto de partida. Dime si quieres otra cosa.
- Si `~/.claude` o `~/.pi` están desactualizados, el constructor pedirá que corras `bash instalar.sh`.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
