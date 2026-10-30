# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 1). El arquitecto dejó la definición para F08 como cambio propuesto por aprobar. F07 `hecha` (confirmada por Franco, 2026-10-30). Siguiente: aprobada la definición, el planificador descompone F08.

## Espera a Franco

- Feature F07 completa en feature/F07-modelo-por-agente: cierra la rama, haz el PR y despliega.
- **Puerta 1:** revisa y aprueba los cambios propuestos en `definitions/WORKFLOW.md` (§4, §5, §7 «Resultado de F07», §10 nueva con F08), `definitions/PROJECT.md` (etapa 5, fuente de verdad, tabla de pruebas) y `definitions/ARCHITECTURE.md` (`scripts/archivar.mjs`). Diseño: script en modo chequeo por defecto, `--aplicar` solo lo corre Franco; mueve la feature completa (con sus tareas) a `features/completed/` sin borrar ni sobrescribir; el coordinador corre el chequeo al terminar una feature y deja el aviso aquí.
- **Preguntas abiertas (WORKFLOW §10.6):** (1) ¿archivar antes o después del PR de la feature? Se recomienda después, en su propio commit `chore/`. (2) ¿aceptas los umbrales como punto de partida: `STATUS.md` > 3 KB, `BACKLOG.md` > 8 KB, `AGENTS.md` > 2 KB, filas `hecha` > ~300 caracteres?
- La nota de `BACKLOG.md` (línea 28, «DECISIÓN PARA FRANCO») queda por alinear: el arquitecto no podía tocarla; la compacta el planificador.
- Si `~/.claude` o `~/.pi` están desactualizados, el constructor pedirá que corras `bash instalar.sh`.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-JRL1OP`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
