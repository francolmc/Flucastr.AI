# Estado del flujo

## Escalación

## Paso actual

Modo yolo: terminado (Franco prefirió modo normal para las tareas 11 a 14, 2026-10-31)
Rol: ninguno (esperando a Franco). F19: las 16 tareas `hecha`; falta que Franco confirme F19 como `hecha` en `BACKLOG.md`. Sin commits: los cambios quedan sin commitear en `feature/F19-compactacion-automatica`.
task-03: hecha | features/F19-compactacion-automatica/task-03-prueba-resolver-compactacion-pi.md
task-04: hecha | features/F19-compactacion-automatica/task-04-resolver-compactacion-claude.md
task-05: hecha | features/F19-compactacion-automatica/task-05-prueba-resolver-compactacion-claude.md (errata del texto de la tarea: 85000 por 83000; anotada en sus Notas)
task-06: hecha | features/F19-compactacion-automatica/task-06-desinstalar-compactacion.md
task-07: hecha | features/F19-compactacion-automatica/task-07-desinstalar-compactacion-proyecto.md
task-08: hecha | features/F19-compactacion-automatica/task-08-instalar-compactacion-pi.md
task-09: hecha | features/F19-compactacion-automatica/task-09-instalar-compactacion-claude.md
task-10: hecha (Franco, 2026-10-31; criterio «< 6 s» aceptado tal cual, `registro.e2e` intermitente no reproducido) | features/F19-compactacion-automatica/task-10-prueba-capa1-compactacion.md
Feature en curso: F19 «Compactación automática instalada por el kit» (`→`). Tareas 01 a 14 `aprobadas` por Franco (2026-10-31), en orden de `depende_de:`; 15 a 17 en `borrador`. F01–F18 `hecha` (F17 y F18 archivadas en `features/completed/`). F11 (informe) en pausa por decisión de Franco: esperar más tareas reales con `Registro:` antes de llamar al `arquitecto`.

## Espera a Franco

- Feature F19 completa en feature/F19-compactacion-automatica: cierra la rama, haz el PR y despliega. Antes de commitear revisa `git diff scripts/`, `git diff instalar.sh desinstalar.sh` y `git diff agentes/coordinador.md` (no pasaron por puerta 4 tarea a tarea en yolo). Confirma F19 como `hecha` de forma explícita para marcarla en `BACKLOG.md`.













- **Puerta 3 pendiente (tareas 15, 16 y 17 de F19):** corridas con modelo que cruzan una compactación (15 Pi, 16 Claude Code) y `pruebas/README.md` (17). La 16 está estimada en US$1–3 (tope US$6) frente a ~US$0,065 de la verificación de Claude Code ya hecha: decide ese gasto, o redúcela, al llegar a ella. Las 15 y 16 exigen que corras `bash instalar.sh` después de la task-12.
- **Puerta 4, en cada tarea de F19:** las tareas 02 y 04 tocan `scripts/resolver.mjs`: revisa `git diff scripts/`. Las 06 a 09 tocan `desinstalar.sh` e `instalar.sh` (raíz).
- **Tras instalar F19 (tuyo):** abre un Pi nuevo (no aplica en caliente sin `/reload`) y confirma que compacta al pasar de ~100 k; con `bash instalar.sh --simular` y un `diff` de `~/.pi/agent/settings.json` comprueba que solo se añade `compaction.modelOverrides` y que `packages` y `deviceId` siguen.
- **Registro de eventos:** `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- **Comprobación pendiente en el PC de trabajo (F17):** que Pi lea las skills desde `<proyecto>/.pi/skills/` (con `/trust`). En `testskills` ya funciona. El README aún dice «Pendiente de comprobar en el PC de trabajo».
- **Antes de publicar el repo (tuyo):** gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar los commits «intrusión». Si aparece algo: rotar la credencial primero. (El repo ya es público: revísalo cuanto antes.)
- **Comprobación manual de F09 (tuya):** la descarga desde `raw` ya funciona. Falta en el PC de trabajo: `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar`; que `modelos.json` quede igual y que la red deje pasar `api.github.com` y `codeload.github.com` (guía en `README.md`).
- **Decisión sobre Codex:** el sondeo (`pruebas/resultados/2026-10-31-sondeo-codex.md`) recomienda soporte parcial en dos fases con un spike. Si se abre, pasa por el backlog (puerta 2) y el diseño del arquitecto (puerta 1); respeta el contrato de herramientas nuevas de `ARCHITECTURE.md` («Higiene de contexto»).
- **Observación de consumo en Pi (en espera de datos):** si repites una sesión parecida, anota tu mensaje, la respuesta previa del coordinador y qué subagente se lanzó; si delegó sin escalar, abrimos una tarea para reforzar `agentes/coordinador.md`.
- **Decisiones abiertas (tareas aparte, sin urgencia):** `instalar.sh --copiar` con `modelos.json` inválido deja roto el personal (`instalar-remoto.sh` ya lo bloquea); ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos); estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo (F03); `rapida.sh` rozó el tope de 30 s en dos corridas (36 s y 46 s): vigílalo, hoy marca ~12 s.
- **Higiene del árbol:** saca `modelos.txt` del repo si sigue (630 KB, sin trackear) y puedes borrar `pruebas/.temporales/capa1-*` y `/tmp/rapida-check.txt`.
- Concesión opcional del permiso en Claude Code: tres reglas `allow` en tu `settings.json` (`WORKFLOW.md` §3.1).

## Bloqueos abiertos

- **F19 task-15** (constructor, modo normal): veredicto FALLA por diseño de la prueba (umbral artificial de 1500 tokens inviable para el `coordinador`). Rol requerido: `planificador` (reescribir la tarea con un umbral viable) si Franco elige repetir la corrida; si no, se acepta como hallazgo.

## Última actualización

2026-10-31
