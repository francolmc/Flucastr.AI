# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). Feature F12 (en curso): task-01 a 06 y task-08 `hecha`; task-07 `lista para revisión`. F10 `hecha`; F11 (informe) espera datos de `Registro:`.
Rama: feature/F12-coordinador-ejecuta-scripts

## Espera a Franco

- **PUERTA 4 (F12 task-07, la última):** revisa *Evidencia* y *Notas* en `features/F12-coordinador-ejecuta-scripts/task-07-documentar-permisos-y-cierre.md`, más `pruebas/permisos-ejecucion.md` y `pruebas/README.md`. Resultado: conteos 4/4/0 y suite 246/246 sin fallos. Haz el commit en `feature/F12-coordinador-ejecuta-scripts` y dime si queda `hecha`. Las anotaciones de abajo (README.md:54, archivar.mjs:10, WORKFLOW.md línea 83) no se corrigieron: decide si las abrimos como tarea.
- Si apruebas task-07, F12 quedará completa: te escribiré «Feature F12 completa en feature/F12-coordinador-ejecuta-scripts: cierra la rama, haz el PR y despliega.» y te pediré confirmar F12 como `hecha`.
- Tras F12, `bash instalar.sh` actualiza tu coordinador instalado. Concesión opcional del permiso en Claude Code: tres reglas `allow` en tu `settings.json` (ver `definitions/WORKFLOW.md` §3.1).
- **Anotaciones de task-07 para cerrar F12:** `README.md:54` y `scripts/archivar.mjs:9-10` («nunca un agente») contradicen §3.1; en `WORKFLOW.md` §3.1 los controles compensatorios siguen como «trabajo posterior»; `WORKFLOW.md` línea 4 («el coordinador instalado sigue sin `bash`») y `PROJECT.md` línea 45 quedaron desalineadas (arquitecto).
- **Registro de eventos:** corre `node scripts/registrar.mjs` cuando quieras (lo corres tú, o yo a tu pedido tras instalar F12). `registro/` está ignorado por git.
- **Contexto grande:** F01–F10 ya están archivadas; falta compactar `BACKLOG.md` (planificador, puerta 2; su nota final «Hoy hay N pendientes» está desactualizada) y acortar `WORKFLOW.md` (arquitecto).
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
