# Permisos de corridas

Las ejecuciones con modelo se limitan a B, M y R. El arnés ejecuta antes de cada modelo `comprobaciones/agente-instalado.mjs`, y aborta si el agente que utilizará Claude Code o Pi no cumple el contrato vigente.

## Claude Code

El lanzador usa `dontAsk` y permisos explícitos por herramienta. `Read(./**)` permite inspección; `Write`/`Edit` se limitan a `definitions/**`, `AGENTS.md` e `initialize.sh`. Bash queda permitido solo para consultas Git, inspección acotada y `bash -n ./initialize.sh`; las lecturas de `.env` se niegan. No se habilitan Git mutantes ni Bash genérico.

## Pi

Pi usa el lanzador `pi-arquitecto` instalado, con sus herramientas normales. La ejecución no tiene confinamiento por ruta; el registro detecta lecturas de `.env` y ejecución de `initialize.sh`, mientras que la instantánea detecta modificaciones no permitidas.

## Coordinador: ejecución de scripts

- Comandos permitidos: lista cerrada de tres, `node scripts/registrar.mjs`, `node scripts/archivar.mjs` y `node scripts/archivar.mjs --aplicar Fxx` (`Fxx` obligatorio; solo a pedido explícito de Franco en la conversación; `definitions/WORKFLOW.md` §3.1).
- Claude Code: `tools:` del agente limita a esos tres patrones `Bash(...)` y no concede permiso; cada ejecución pide aprobación a Franco salvo que añada las tres reglas `permissions.allow`, que no se instalan por defecto.
  - Comprobación de task-02 (`features/F12-coordinador-ejecuta-scripts/task-02-coordinador-comandos-claude.md`): aprobada con limitación, porque la negativa se observó con un cuerpo que ya prohíbe los comandos y no aísla el efecto de `tools:`.
  - Comprobación de task-05 (`pruebas/resultados/2026-10-30-coordinador-claude.md`): 8 de 8 casos ok, con los tres patrones concedidos en `--allowedTools` del lanzador `pruebas/lanzar-coordinador-claude.sh` (modo `dontAsk`); ningún commit, ni lectura de `.env`, ni `--aplicar` sin pedido o sin `Fxx` candidata.
- Pi: `bash` completo, sin filtro técnico por comando; la contención es solo instruccional.
  - Resultado de task-06 (`pruebas/resultados/2026-10-30-coordinador-pi.md`): 8 de 8 casos ok, con Bash en 3 casos (chequeo, `--aplicar F01` y el caso de commit con `.env`) y ningún comando fuera de la lista. Un resultado limpio no demuestra contención: la instrucción se cumplió en estos casos, no en todos los posibles.
- Riesgo común: el `coordinador` ejecuta código de `scripts/` que el `constructor` puede modificar; por eso la puerta 4 revisa `git diff scripts/` antes de cualquier ejecución (`definitions/WORKFLOW.md` §3.1).
