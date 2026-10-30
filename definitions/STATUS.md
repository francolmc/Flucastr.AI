# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F08 `hecha` (confirmada por Franco, 2026-10-30): las 4 tareas `hecha`. Siguiente en el backlog: F09 (instalador sin clonar), que choca con la definición y requiere al `arquitecto` antes de descomponer.
Rama: feature/F08-limpieza-y-archivo

## Espera a Franco

- Feature F08 completa en feature/F08-limpieza-y-archivo: cierra la rama, haz el PR y despliega.
- **Archivar (tuyo, después del PR, en su propio commit `chore/`):** primero el chequeo, `node scripts/archivar.mjs`; luego `node scripts/archivar.mjs --aplicar F01` … (o sin ID según el uso de `--aplicar` que implementó task-02; revisa `--aplicar` en el script). El chequeo marca F01–F07 como candidatas; F08 lo será tras su PR.
- **Contexto grande:** `BACKLOG.md` (10 023 caracteres, umbral 8 192) y `WORKFLOW.md` (37 488, umbral 30 720) superan el aviso; filas `hecha` largas: F03, F05, F06, F07. Compactar `BACKLOG.md` es del planificador por la puerta 2 (recomendado tras archivar); acortar `WORKFLOW.md`, del arquitecto.
- **Antes de F09 (puerta 1):** necesito tus decisiones: (1) ¿el instalador copia o descarga desde GitHub? (2) ¿cómo se actualiza? (3) ¿el remoto `francolmc/Flucastr.AI` es público o privado? Con eso delego al `arquitecto`.
- Como el coordinador es un agente instalado, tras el commit de F08 conviene `bash instalar.sh` para actualizar tu copia instalada.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
