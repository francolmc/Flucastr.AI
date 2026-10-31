# Estado del flujo

## Escalación

## Paso actual

Rol: `planificador`, descomponiendo F19 (compactación automática). F18 `hecha` (8 tareas `hecha`; feature confirmada por Franco, 2026-10-31); `→` pasa a F19. F11 (informe) sigue en pausa por datos. task-01 a task-07 `hecha` (Franco, 2026-10-31). task-01 a task-06 `hecha` (Franco, 2026-10-31); Franco corrió `bash instalar.sh` (agentes instalados con la línea de identidad verificada); task-08 `aprobada` (Pi), después. task-01 a task-05 `hecha` (Franco, 2026-10-31); task-07 y 08 `aprobada` (corridas reales con modelo; exigen `bash instalar.sh` antes). task-01 a task-04 `hecha` (Franco, 2026-10-31); task-06 a 08 `aprobada`, en orden. task-01 a task-03 `hecha` (Franco, 2026-10-31); task-05 a 08 `aprobada`, en orden. task-01 y task-02 `hecha` (Franco, 2026-10-31); task-04 a 08 `aprobada`, en orden. task-01 `hecha` (Franco, 2026-10-31); task-03 a 08 `aprobada`, en orden. (Estado anterior: esperando a Franco.) F17 `hecha` en `BACKLOG.md` (confirmada por Franco, 2026-10-31); el `planificador` mueve el `→` a F11 (en pausa por datos). task-01 a task-04 `hecha` (Franco, 2026-10-31). task-01 a task-03 `hecha` (Franco, 2026-10-31); task-05 `aprobada`. task-01 y task-02 `hecha` (Franco, 2026-10-31). task-01 `hecha` (Franco, 2026-10-31); task-03 a 05 `aprobada`, en orden. F01–F16 `hecha` (F15 y F16 archivadas, sin commit). F17 (skills de Pi dentro del workspace) `→`. F11 (informe) en pausa por decisión de Franco: esperar más tareas reales con `Registro:` antes de llamar al `arquitecto`.
Rama: feature/F17-skills-pi-en-workspace

## Espera a Franco

- Feature F18 completa en feature/F18-identidad-y-prompts-livianos: cierra la rama, haz el PR y despliega. Antes del commit: elimina `features/F18-higiene-de-contexto/` (obsoleta), saca `modelos.txt` del repo y separa los commits (definitions aprobadas, informes de `pruebas/resultados/`, F17 y F18).
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Features F17 y F18 archivables: `node scripts/archivar.mjs --aplicar F17` y `--aplicar F18` (lo corre Franco o, si lo pide, tú, después del PR y en su propio commit `chore/`).









- Las 8 tareas de F18 `aprobadas` por Franco (2026-10-31) en `features/F18-identidad-y-prompts-livianos/`; en orden, task-01 delegada al `constructor` (rama `feature/F18-identidad-y-prompts-livianos`). En la puerta 4 de task-01 revisa `git diff scripts/` (toca `scripts/resolver.mjs`). Las tareas 07 y 08 exigen que Franco corra antes `bash instalar.sh` y hacen una corrida real con modelo cada una.
- **Pendiente tuyo:** elimina la carpeta vieja `features/F18-higiene-de-contexto/` (mismo ID F18); borra o saca del repo `modelos.txt` (630 KB, sin trackear); y commitea por separado los cambios de `definitions/` ya aprobados y los informes de `pruebas/resultados/`, para que los commits de F18 queden limpios (el árbol tiene todo mezclado).

- Refinado de F18 respondido por Franco (2026-10-31): opción A (la línea de identidad también sale en `resolver.mjs cuerpo`, los lanzadores `pi-*`). El `planificador` descompone F18 en `features/F18-identidad-y-prompts-livianos/` (puerta 3 después).
- **Carpeta vieja a eliminar (tuya):** `features/F18-higiene-de-contexto/` (10 tareas obsoletas, mismo ID F18) antes de la puerta 3 de F18. Lo útil se rescata al descomponer F19.

- Puerta 2 aprobada por Franco (2026-10-31): backlog con F18 y F19 `aprobado`; el `planificador` descompone F18 (puerta 3 después). F19 se descompone al cerrar F18. Las 10 tareas viejas de `features/F18-higiene-de-contexto/` se reaprovechan en parte (task-03, 04 y 05 para F18; task-07 a 10 reescritas para F19; task-01 y task-02 no); su carpeta tiene el mismo ID F18 y el planificador dirá qué hacer con ella.

- **Tras instalar F18 (tuyo):** abre un Pi nuevo (no aplica en caliente sin `/reload`) y confirma que compacta al pasar de ~100 k; con `instalar.sh --simular` y un `diff` comprueba que solo se añade `compaction.modelOverrides` y que `packages` y `deviceId` siguen.





- Puerta 2 aprobada por Franco (2026-10-31): backlog con F18 reescrita `aprobado`; el `planificador` descompone F18 (puerta 3 después). Aviso: F18 documenta la compactación como GUÍA en el README; no la instala automáticamente. Franco decidió no aplicar la configuración manual de Pi hasta probar F18.
- **Confirmado por Franco (2026-10-31, pie de Pi):** ventana de `openai/gpt-6.1-sol` = 272 k (`17.8%/272k (auto)`), proveedor `openai`; `reserveTokens` 172000 compacta cerca de 100 k (lo aplica Franco en `~/.pi/agent/settings.json`). Pendiente tuyo, opcional: `showCacheMissNotices: true` una semana para medir.



- **`rapida.sh` ya superó el tope tres veces** (36 s, 30,6 s en `I7` y ahora 46 s, con 224 pruebas pasando). Mídelo tú 3 veces con la máquina libre: si se repite, abrimos una feature como F14 (sacar `skills-proyecto.test.mjs` de la rápida o aligerarlo) antes de descomponer F18, porque cada tarea corre la rápida.

- **Sondeo de Codex hecho (2026-10-31):** `pruebas/resultados/2026-10-31-sondeo-codex.md` (Codex 0.160.0 instalado; sin documentación local; parte de la evidencia viene de cadenas del binario, no verificada). Recomienda hacerlo parcial en dos fases, con un spike primero (~9 tareas). Decide si se abre como feature (puerta 2 + diseño del arquitecto, puerta 1). El informe lista 8 comprobaciones que solo tú puedes hacer.
- **Observación de Franco (en espera de datos):** alto consumo de tokens en Pi (`pi-coordinador`, `gpt-6.1-sol`) en `testskills`: ~20 % en 15 min en una tarea de limpiar/mover documentos que derivó en una auditoría. Hipótesis: el coordinador no escaló un pedido fuera de su tabla y delegó (p. ej. al arquitecto con `revisar-proyecto-existente`). Franco repetirá una sesión similar y anotará: su mensaje, la respuesta previa del coordinador y qué subagente se lanzó. Si delegó sin escalar: tarea para reforzar `agentes/coordinador.md`.

- **Riesgo de tiempo de `rapida.sh` (decisión tuya):** el `planificador` midió una corrida de 36 s (superó el tope de 30 s) y otra con `I7` en 30,6 s; las 224 pruebas pasaron. Antes de F17 estaba en 11–15 s y task-04 midió 13–25 s. Sospecha: el archivo nuevo `skills-proyecto.test.mjs` (task-04) sumó carga, o había otros procesos corriendo a la vez; no investigado. Opciones: (a) tarea para sacar `skills-proyecto.test.mjs` de la rápida o aligerarlo; (b) medirlo tú con la máquina libre antes de decidir.

- **Comprobado por Franco (2026-10-31):** en `testskills`, Pi lee las skills desde `.pi/skills/` (con `/trust`). Falta repetirlo en el PC de trabajo, cuya política podría diferir; el README aún dice «Pendiente de comprobar en el PC de trabajo».
- Feature F17 completa en feature/F17-skills-pi-en-workspace: cierra la rama, haz el PR y despliega.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Features F15, F16 y F17 archivables: `node scripts/archivar.mjs --aplicar F15`, `--aplicar F16` y `--aplicar F17` (lo corre Franco o, si lo pide, tú, después del PR y en su propio commit `chore/`).

- **Comprobación pendiente en tu PC de trabajo (F17):** que Pi lea las skills desde `<proyecto>/.pi/skills/` (con `/trust`). El README lo declara como pendiente. No hay garantía de que resuelva el bloqueo «fuera del workspace».




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
