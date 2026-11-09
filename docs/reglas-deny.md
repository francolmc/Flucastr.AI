# Límites de las reglas deny

Las reglas viven en `<proyecto>/.claude/settings.json` (compartido, va a git). Según los docs oficiales de Claude Code (code.claude.com/docs/en/permissions) son una barrera, no una frontera de seguridad:

- Los comandos compuestos se separan por `&&`, `||`, `;`, `|`, `&` y saltos de línea, y basta que un subcomando coincida: `git add . && git commit` queda bloqueado.
- Cubiertos (probado con Claude Code real, ver `cambios/deny-endurecido/plan.md`): `git -C . commit`, `git -c k=v commit` y `bash -c`/`sh -c`/`zsh -c`; por eso el agente no puede usar `bash -c`, y es intencional.
- No cubren `sudo` ni `env <cmd>` (no probados). `Read(./.env)` cubre la herramienta Read y `cat/head/tail/sed/tee` en Bash, no `grep -r .` ni un script que abre `.env` (Python, Node, etc.); eso pide sandbox, fuera del kit.
- Subagentes: según los docs, los integrados heredan las reglas (lo leí en un resumen, no literal). No se garantiza que un `permissionMode` de subagente no la salte.
- Los arrays `deny` de varios archivos de ajustes se combinan.
- También bloquean los commits que Franco haga con Claude en ese proyecto; es lo esperado.
- Pi no tiene equivalente conocido: en Pi rige solo el prompt del agente.
- Codex (experimental; `<proyecto>/.codex/rules/flucastr.rules`, solo con `--proyecto`): Codex solo carga las reglas en proyectos de confianza (trusted) y son experimentales. Bloquean por prefijo `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C`, `git -c`, `bash -c`, `sh -c` y `zsh -c`; `git -C` y `git -c` quedan bloqueados aunque no sean commit (aceptado). No bloquean `bash -lc` ni `sh -lc`, porque Codex ejecuta así sus comandos y bloquearlo rompería todo. No hay regla para leer `.env`: límite documentado. Se comprobó con `codex execpolicy check`; no hay prueba con una sesión real de Codex.
