# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code y Pi. Un solo repo (remoto: `francolmc/Flucastr.AI`). **Versión 2 en construcción** (rama `feature/kit-v2`); la versión 1 está en el tag `kit-v1` y, mientras tanto, en `legacy/v1/`.

## Cómo funciona (v2)

- Dos agentes: `principal` (nivel medio: investiga, diagnostica, planifica, verifica) y `constructor` (nivel bajo: aplica el plan). Los niveles se traducen a modelos en `modelos.json`.
- El único traspaso es `cambios/<nombre>/plan.md`. Franco tiene dos puertas: aprobar el plan y revisar la evidencia.
- «Hecho» significa que el comando `verify` del proyecto pasa desde cero.
- Skills: `planificar-cambio`, `ejecutar-plan`, `preparar-proyecto`.
- Comando `verify`: `./verify` (modelos.json ↔ agentes, sintaxis de instalar/desinstalar, resolver Claude/Pi, skills, `instalar.sh --simular`, reglas deny del proyecto).

## Reglas

- Los agentes no hacen commit, push, PR, merge ni despliegue: lo hace Franco.
- No se leen `.env`, llaves ni credenciales (`.env.example` sí).
- Git permitido a los agentes: crear la rama del cambio con `git switch -c <prefijo>/<nombre>` (`feature/`, `fix/`, `chore/`, `docs/`).
- En un proyecto instalado con `--proyecto`, Claude Code bloquea con reglas deny `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C … commit`, `git -c … commit`, `git … push`, `bash -c`, `sh -c`, `zsh -c` y leer `.env`. Si una de esas acciones se bloquea, es la regla: no la saltes; lo hace Franco. El agente tampoco puede usar `bash -c` (intencional).

## Límites de las reglas deny

Las reglas viven en `<proyecto>/.claude/settings.json` (compartido, va a git). Según los docs oficiales de Claude Code (code.claude.com/docs/en/permissions) son una barrera, no una frontera de seguridad:

- Los comandos compuestos se separan por `&&`, `||`, `;`, `|`, `&` y saltos de línea, y basta que un subcomando coincida: `git add . && git commit` queda bloqueado.
- Cubiertos (probado con Claude Code real, ver `cambios/deny-endurecido/plan.md`): `git -C . commit`, `git -c k=v commit` y `bash -c`/`sh -c`/`zsh -c`; por eso el agente no puede usar `bash -c`, y es intencional.
- No cubren `sudo` ni `env <cmd>` (no probados). `Read(./.env)` cubre la herramienta Read y `cat/head/tail/sed/tee` en Bash, no `grep -r .` ni un script que abre `.env` (Python, Node, etc.); eso pide sandbox, fuera del kit.
- Subagentes: según los docs, los integrados heredan las reglas (lo leí en un resumen, no literal). No se garantiza que un `permissionMode` de subagente no la salte.
- Los arrays `deny` de varios archivos de ajustes se combinan.
- También bloquean los commits que Franco haga con Claude en ese proyecto; es lo esperado.
- Pi no tiene equivalente conocido: en Pi rige solo el prompt del agente.

Se retiran de la v1 cuando la v2 se haya usado en 2 o 3 proyectos reales. Lo que se retira:

- `legacy/`
- `definitions/`
- `features/`
- `pruebas/`
- los scripts de la v1: todo `scripts/` salvo `resolver.mjs`
- el README viejo

`registro/` no se lee salvo pedido explícito de Franco.
