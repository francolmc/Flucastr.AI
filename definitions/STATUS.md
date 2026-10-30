# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F13 `hecha` (confirmada por Franco, 2026-10-30; task-01 `hecha`). Solo queda F11 (informe). F12 `hecha` (PR hecho, coordinador reinstalado). F11 (informe) requiere al `arquitecto` y datos de `Registro:`.
Rama: chore/F13-alinear-readme-archivar

## Espera a Franco

- Feature F13 completa en chore/F13-alinear-readme-archivar: cierra la rama, haz el PR y despliega.
- **Archivo aplicado (a tu pedido, 2026-10-30):** F12 y F13 movidas a `features/completed/` con `node scripts/archivar.mjs --aplicar`. Quedan **sin commit**: revisa `git status` y commitéalas en su propio commit `chore/` (el script recomienda hacerlo después del PR de la feature; F13 aún no tiene PR).
- **Menciones antiguas en `definitions/REGISTRO.md`** líneas 25 y 55 («no tiene Bash»): no estaban en el encargo del arquitecto. Revisa también el reemplazo por script del arquitecto en `WORKFLOW.md` §3.1, `PROJECT.md` y `ARCHITECTURE.md` (solo se verificó con `grep`).
- Concesión opcional del permiso en Claude Code: tres reglas `allow` en tu `settings.json` (ver `definitions/WORKFLOW.md` §3.1).
- **Registro de eventos:** corre `node scripts/registrar.mjs` cuando quieras (lo corres tú, o yo a tu pedido). `registro/` está ignorado por git.
- **Contexto grande:** F01–F10 ya están archivadas; falta compactar `BACKLOG.md` (planificador, puerta 2; su nota final «Hoy hay N pendientes» puede estar desactualizada) y acortar `WORKFLOW.md` (arquitecto). F11–F12 `hecha`: F12 se puede archivar con `node scripts/archivar.mjs --aplicar F12` (a tu pedido puedo correrlo yo).
- **Alinear `definitions/` (arquitecto, sin urgencia):** `REGISTRO.md` §1 (`resultado=confirmar` no se usa; caso `coordinador` en `tarea_estado.por`; comando sin `--reverse` por git 2.54); falta la regla «`registro/` no se lee» en `AGENTS.md`.
- **Riesgo de tiempo:** `rapida.sh` oscila entre 23 y 37 s (tope 30 s); el peso viene de `instalacion.test.mjs` (8–12 s). Conviene una tarea aparte (¿la abrimos?).
- **Antes de publicar el repo (tuyo):** gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar qué son los commits «intrusión». Si aparece algo: rotar la credencial primero. Luego haz público el repo.
- **Comprobación manual de F09 (tuya, con repo público):** comando de una línea en el PC de trabajo, `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar`, que tu `modelos.json` quede igual y que la red deje pasar `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`. Guía en el `README.md`.
- **Pendiente sin decidir (tarea aparte):** `instalar.sh --copiar` directo con un `modelos.json` inválido deja roto el personal; `instalar-remoto.sh` ya lo bloquea (R10).
- **Decisión abierta:** tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- **Verificación funcional observable (curl/Playwright):** NO se abre tarea ni se toca `definitions/` por ahora; se resuelve dentro del proyecto real. Solo con fricción repetida se evalúa una regla mínima en `descomponer-feature`. Un `verificador` aparte, solo con datos de `Registro:`.
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- Rama, PR y despliegue de F05: lo haces tú.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
