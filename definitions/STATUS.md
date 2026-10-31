# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F19 task-02 `lista para revisión` (puerta 4; `fijar-compactacion` y `quitar-compactacion` de Pi en `scripts/resolver.mjs`). task-01 `hecha` (Franco, 2026-10-31).
Rama: feature/F19-compactacion-automatica
Feature en curso: F19 «Compactación automática instalada por el kit» (`→`). Tareas 01 a 14 `aprobadas` por Franco (2026-10-31), en orden de `depende_de:`; 15 a 17 en `borrador`. F01–F18 `hecha` (F17 y F18 archivadas en `features/completed/`). F11 (informe) en pausa por decisión de Franco: esperar más tareas reales con `Registro:` antes de llamar al `arquitecto`.

## Espera a Franco

- **Puerta 4 (F19 task-02, `lista para revisión`; toca `scripts/`):** `features/F19-compactacion-automatica/task-02-resolver-compactacion-pi.md`. Revisa `git diff scripts/` (+230/−2 en `scripts/resolver.mjs`), *Evidencia* y *Notas* (4 huecos menores). Mira en especial: (1) el helper `conBloqueo` (mkdir `<ruta>.lock`, 10 intentos de 20 ms, lock huérfano >10 s se borra una vez); (2) la escritura atómica (tmp + rename); (3) el borrado del archivo de ajustes (`archivo-quitado` con `rmSync`): debe ocurrir solo si el kit lo creó (`:creado`) y quedó vacío; (4) que ninguna ruta por defecto apunte a `~/.pi/agent` (la ruta llega como argumento). `rapida.sh` con tu HOME: 13 s, exit 0. Commitea en `feature/F19-compactacion-automatica` y dime si la pasas a `hecha`; sigue task-03 (prueba del resolver).


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

Ninguno.

## Última actualización

2026-10-31
