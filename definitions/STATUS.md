# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 4). task-04 `lista para revisión` (`features/F08-limpieza-y-archivo/task-04-readme-y-chequeo-final.md`), última de F08. task-01 a task-03 `hecha`. F08 `en curso`; las 4 tareas `aprobadas` por Franco (2026-10-30). F07 `hecha` y mergeada.
Rama: feature/F08-limpieza-y-archivo

## Espera a Franco

- **Puerta 4:** revisa Evidencia y Notas de `features/F08-limpieza-y-archivo/task-04-readme-y-chequeo-final.md` y el diff de `README.md` (`features/completed/` mencionado; `scripts/` con `resolver.mjs` y `archivar.mjs`). `rapida.sh`: 181 pass, 21 s. Chequeo sobre el repo real (solo lectura, salida 0): AVISO de tamaño en `BACKLOG.md` y `WORKFLOW.md`; 7 candidatas a archivar (F01–F07). Haz el commit y pásala a `hecha`. Con eso F08 queda completa.

- Como el coordinador es un agente instalado, tras el commit de task-03 conviene `bash instalar.sh` para actualizar tu copia instalada.

- **Cuándo ejecutar `--aplicar` en el repo real:** es tuyo; por tu respuesta pendiente de §10.6, recomendado después del PR de F08, en su propio commit `chore/`.


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
