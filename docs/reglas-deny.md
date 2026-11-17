# Límites de las reglas deny

Estas reglas reducen acciones directas y no son protección completa; los secretos reales no deben estar donde el agente trabaja sin sandbox.

Las reglas viven en `<proyecto>/.claude/settings.json` (compartido, va a git). Según los docs oficiales de Claude Code (code.claude.com/docs/en/permissions) son una barrera, no una frontera de seguridad:

- Los comandos compuestos se separan por `&&`, `||`, `;`, `|`, `&` y saltos de línea, y basta que un subcomando coincida: `git add . && git commit` queda bloqueado.
- Cubiertos (probado con Claude Code real, ver `cambios/hechos/deny-endurecido/plan.md`): `git -C . commit`, `git -c k=v commit` y `bash -c`/`sh -c`/`zsh -c`; por eso el agente no puede usar `bash -c`, y es intencional.
- No cubren `sudo` ni `env <cmd>` (no probados). `Read(./.env)` cubre la herramienta Read y `cat/head/tail/sed/tee` en Bash, no `grep -r .` ni un script que abre `.env` (Python, Node, etc.); el kit configura restricciones de lectura en el sandbox, pero su eficacia ante esas vías no se ha comprobado.
- Subagentes: según los docs, los integrados heredan las reglas (lo leí en un resumen, no literal). No se garantiza que un `permissionMode` de subagente no la salte.
- Los arrays `deny` de varios archivos de ajustes se combinan.
- También bloquean los commits que la persona usuaria haga con Claude en ese proyecto; es lo esperado.
- Pi no tiene equivalente conocido: en Pi rige solo el prompt del agente.
- Codex (experimental; `<proyecto>/.codex/rules/flucastr.rules`, solo con `--proyecto`): Codex solo carga las reglas en proyectos de confianza (trusted) y son experimentales. Bloquean por prefijo `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C`, `git -c`, `bash -c`, `sh -c` y `zsh -c`; `git -C` y `git -c` quedan bloqueados aunque no sean commit (aceptado). No bloquean `bash -lc` ni `sh -lc`, porque Codex ejecuta así sus comandos y bloquearlo rompería todo. No hay regla para leer `.env`: una sesión real leyó un `.env` ficticio; rechazó tres comandos Git por instrucciones del proyecto, no por una regla observada. También se comprobó la política con `codex execpolicy check`.

## Sandbox y modos de trabajo

Con `--proyecto`, el instalador activa el sandbox de Claude Code y añade `sandbox.filesystem.denyRead` para `.env`, `.env.*`, rutas anidadas equivalentes, `~/.ssh`, `~/.aws` y extensiones comunes de llaves (`.pem`, `.key`, `.p12`, `.pfx`, `id_rsa`, `id_ed25519`, `id_ecdsa`). También conserva los deny de lectura de `.env` y `.env.*`, y añade `Bash(git -c * merge *)`. El patrón `.env.*` también alcanza `.env.example`; mantenlo fuera de ese nombre mientras el sandbox del proyecto esté activo si necesitas que el agente lea un ejemplo. Los patrones de llaves son selectivos, no cubren todos los formatos ni toda ruta posible. Los deny añadidos por el kit se registran y al desinstalar se retiran solo si siguen con el valor exacto que agregó.

El sandbox no cubre todos los comandos. Comandos excluidos, hooks y servidores MCP pueden actuar fuera de él. Las reglas allow globales y otros ajustes efectivos pueden ampliar el acceso o autorizar comandos; revisa la configuración efectiva. El instalador y `diagnosticar` muestran estos límites, pero no cambian preferencias globales. Codex se lanza con `workspace-write` y aprobaciones `on-request`; esto no impide leer `.env` mediante las herramientas de archivos. Pi no recibe cambios de protección y no tiene equivalente de sandbox/deny en este kit.

En Linux, Claude Code necesita dependencias del sandbox como `bwrap` y `socat`. El instalador y `diagnosticar` avisan si no encuentran alguna; confirma el aviso que emita el propio CLI al iniciar. Si el CLI dice que el sandbox está desactivado, sus restricciones de archivos y red no están aplicándose aunque la configuración del proyecto las declare.

Para trabajo desatendido con bypass total, elige explícitamente un contenedor o VM aislados. No montes el HOME del anfitrión, `.env`, llaves ni el socket Docker; tampoco configures un remoto con escritura. Un worktree ordena cambios de Git, pero comparte el acceso de la máquina y no es aislamiento. La autenticación disponible dentro del entorno y el acceso de red dependen de lo que se configure allí; no se asume aislamiento de red. Este modo no se activa por defecto ni se recomienda para trabajo en un worktree de la máquina habitual.
