# Permisos de corridas

Las ejecuciones con modelo se limitan a B, M y R. El arnés ejecuta antes de cada modelo `comprobaciones/agente-instalado.mjs`, y aborta si el agente que utilizará Claude Code o Pi no cumple el contrato vigente.

## Claude Code

El lanzador usa `dontAsk` y permisos explícitos por herramienta. `Read(./**)` permite inspección; `Write`/`Edit` se limitan a `definitions/**`, `AGENTS.md` e `initialize.sh`. Bash queda permitido solo para consultas Git, inspección acotada y `bash -n ./initialize.sh`; las lecturas de `.env` se niegan. No se habilitan Git mutantes ni Bash genérico.

## Pi

Pi usa el lanzador `pi-arquitecto` instalado, con sus herramientas normales. La ejecución no tiene confinamiento por ruta; el registro detecta lecturas de `.env` y ejecución de `initialize.sh`, mientras que la instantánea detecta modificaciones no permitidas.
