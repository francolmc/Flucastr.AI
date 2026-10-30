# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (puerta 4). task-01 `lista para revisión` (`features/F10-registro-de-eventos/task-01-registrar-script.md`). F10 `en curso`; las 3 tareas `aprobadas` por Franco (2026-10-30); F10 y F11 reaprobadas en `BACKLOG.md`. F09 `hecha` y mergeada.
Rama: feature/F10-registro-de-eventos

## Espera a Franco

- **Puerta 4:** revisa Evidencia y Notas de `features/F10-registro-de-eventos/task-01-registrar-script.md` y el código de `scripts/registrar.mjs` y `pruebas/capa1/registrar.test.mjs` (6 de 6 pasan; `rapida.sh`: 186 pass, 25 s, código 0). Sobre el repo real: la primera corrida generó 128 eventos (F01–F09 y F10 solo en BACKLOG), la segunda 0 (idempotente); `registro/eventos.jsonl` tiene 0 correos y 0 rutas absolutas, y `registro/` queda ignorado (no aparece en `git status`). Haz el commit y pásala a `hecha`. Ojo: `registro/` está ignorado, no se commitea.
- **Desviaciones (Notas):** `git log --follow --reverse` corta el historial de renombres en git 2.54, así que se usa sin `--reverse` y se invierte en JavaScript; la raíz debe ser la del repositorio; `tarea_estado.por` no incluye `coordinador` aunque `REGISTRO.md` §1 lo lista. El arquitecto debe alinear `REGISTRO.md` (caso `coordinador`, comando de `--reverse` y `resultado=confirmar`).

- **Antes de publicar el repo (tuyo):** correr gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar qué son los commits «intrusión». Si aparece algo: rotar la credencial primero. Luego haz público el repo.
- **Comprobación manual de F09 (tuya, con repo público):** comando de una línea en el PC de trabajo, `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar`, que tu `modelos.json` quede igual y que la red deje pasar `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`. Guía en el `README.md`.
- **Cobertura:** `pruebas/capa1/remoto.test.mjs` (12 pruebas) está fuera de `rapida.sh` (36 s con ella, tope 30 s). Córrela aparte: `node --test pruebas/capa1/remoto.test.mjs`. Las de F10 irán igual en `registrar.test.mjs`.
- **Pendiente sin decidir (tarea aparte):** `instalar.sh --copiar` directo con un `modelos.json` inválido deja roto el personal; `instalar-remoto.sh` ya lo bloquea (R10).
- **Para el arquitecto:** `definitions/REGISTRO.md` §1 aún lista `resultado=confirmar` (no se usa); falta además la regla «`registro/` no se lee» en `AGENTS.md`.
- **Archivar (tuyo, en su propio commit `chore/`):** `node scripts/archivar.mjs` (chequeo) y luego `--aplicar` con los IDs que correspondan. Candidatas: F01–F09.
- **Contexto grande:** `BACKLOG.md` y `WORKFLOW.md` superan el umbral de aviso; compactar `BACKLOG.md` es del planificador (puerta 2, tras archivar; la nota final «Hoy hay 3 pendientes» está desactualizada); acortar `WORKFLOW.md`, del arquitecto.
- Como el coordinador es un agente instalado, tras los commits conviene `bash instalar.sh` para actualizar tu copia.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
