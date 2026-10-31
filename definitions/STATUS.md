# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F17 task-04 `lista para revisión` (puerta 4). task-01 a task-03 `hecha` (Franco, 2026-10-31); task-05 `aprobada`. task-01 y task-02 `hecha` (Franco, 2026-10-31). task-01 `hecha` (Franco, 2026-10-31); task-03 a 05 `aprobada`, en orden. F01–F16 `hecha` (F15 y F16 archivadas, sin commit). F17 (skills de Pi dentro del workspace) `→`. F11 (informe) en pausa por decisión de Franco: esperar más tareas reales con `Registro:` antes de llamar al `arquitecto`.
Rama: feature/F17-skills-pi-en-workspace

## Espera a Franco

- **Puerta 4 (F17 task-04, pruebas):** `features/F17-skills-pi-en-workspace/task-04-pruebas-skills-proyecto.md`. Revisa *Evidencia*, *Notas*, `pruebas/capa1/skills-proyecto.test.mjs` (nuevo, 4 pruebas) y `git diff pruebas/rapida.sh`. Tiempo de `rapida.sh`: 25, 15 y 13 s (peor 25 s, tope 30 s; el margen de 5 s es chico, la primera corrida en frío fue la lenta); suite 224/224. Tres puntos: (1) usó 7 ejecuciones de `instalar.sh` y 2 de `desinstalar.sh` (la tarea fijaba máximo 5 y 3); (2) `git status` muestra `?? .claude/` por `--proyecto` (comportamiento previo, la prueba lo afirma); (3) las 4 pruebas comparten entornos y dependen del orden. Commitea y dime si la pasas a `hecha`; entonces sigo con task-05 (README).



- **Puerta 4 (F17 task-01, `lista para revisión`):** `features/F17-skills-pi-en-workspace/task-01-instalar-skills-proyecto.md`. Revisa *Evidencia*, *Notas* y `git diff instalar.sh` (+74/-1). Franco corrió `rapida.sh` y pasa 220/220 en 12 s; los 7 fallos de `ejecutar.sh` que reportó el constructor no se reproducen (probablemente propios de su entorno de ejecución). Falta tu aprobación explícita para pasarla a `hecha`.
- **Hueco conocido hasta task-02/03:** reinstalar sin el flag tras usarlo borra las copias del proyecto y deja las 7 líneas de `exclude` huérfanas. No corras `bash instalar.sh` sin opciones en un proyecto con el flag hasta terminar task-02 y task-03.
- Hay un commit tuyo `1fd4f0a` en la rama de F17 con `definitions/` y las tareas; el cambio de `instalar.sh` y de la tarea están sin commit.

- **Puerta 3 (5 tareas de F17 en `borrador`, una por una)** en `features/F17-skills-pi-en-workspace/`: `task-01-instalar-skills-proyecto.md`, `task-02-desinstalar-skills-proyecto.md`, `task-03-reinstalar-proyectos-registrados.md`, `task-04-pruebas-skills-proyecto.md`, `task-05-readme-instalacion-skills-proyecto.md`. Revisa las decisiones que añadió el planificador (ver respuesta en la conversación): sin comentario `# flucastr-ai` en `exclude`; `--skills-proyecto` con `--solo claude` es error; copias aunque Pi no esté instalado; `desinstalar.sh --proyecto` borra `.pi` y `.pi/skills` solo si quedan vacíos; margen de `rapida.sh` (hoy 21 s, tope 30 s). Diseño de `ARCHITECTURE.md` aprobado (2026-10-31).

- Puertas 1 y 2 aprobadas por Franco (2026-10-31): backlog con F17 `aprobado` y el diseño de `definitions/ARCHITECTURE.md` (sección «Skills dentro del workspace para Pi») con las 4 recomendaciones: `--skills-proyecto` con `--proyecto`, copia a `<proyecto>/.pi/skills/`, solo con el flag, exclusión en `.git/info/exclude`. Después viene la puerta 3 (tareas de F17).
- **Prueba en tu PC mientras tanto:** copia las skills a `<proyecto>/.pi/skills/` y usa `/trust` en Pi. No está verificado que resuelva el bloqueo «fuera del workspace».
- **Commit pendiente (tuyo):** el archivo de F15 y F16 (`features/completed/`), más `definitions/` modificados. Conviene un commit `chore/` en su propia rama.
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea). Registro de eventos: `node scripts/registrar.mjs` (no corrido hoy; dime si lo quieres).
- Concesión opcional del permiso en Claude Code: tres reglas `allow` en tu `settings.json` (`WORKFLOW.md` §3.1).
- **Antes de publicar el repo (tuyo):** gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar los commits «intrusión». Si aparece algo: rotar la credencial primero. (El repo ya es público: revisa esto cuanto antes.)
- **Comprobación manual de F09 (tuya):** la descarga desde `raw` ya funciona. Falta en el PC de trabajo: `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar`; que `modelos.json` quede igual y que la red deje pasar `api.github.com` y `codeload.github.com` (guía en `README.md`).
- **Decisiones abiertas (tareas aparte, sin urgencia):** `instalar.sh --copiar` con `modelos.json` inválido deja roto el personal (`instalar-remoto.sh` ya lo bloquea); ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos); estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo (F03).
- Verificación funcional observable (curl/Playwright): no se abre tarea ni se toca `definitions/` por ahora.
- Los commits de mantenimiento se hicieron directo en `main`; puedes borrar `pruebas/.temporales/capa1-*` y `/tmp/rapida-check.txt` si existen.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-31
