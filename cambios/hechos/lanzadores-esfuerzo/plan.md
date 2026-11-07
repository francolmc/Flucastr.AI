---
estado: listo
rama: feature/lanzadores-esfuerzo
repos: [.]
ejecutor: principal
---
# Lanzadores con esfuerzo

## Objetivo
Abrir un agente en ventana propia con `claude-<agente>` respeta el esfuerzo de `modelos.json`, igual que `pi-<agente>`.

## Supuestos
- (Corregido al ejecutar) La regeneración no hace falta: `instalar.sh` ya quita la instalación anterior antes de reinstalar. Un archivo que no es del kit sigue como «OMITIDO (ya existe)».
- Los lanzadores nuevos se llaman `claude-constructor` y `claude-principal` (junto a `pi-constructor`/`pi-principal`).
- Con `--proyecto`, el agente predeterminado del proyecto sigue sin esfuerzo (Claude Code no lo aplica a la sesión principal). Se cubre con `claude-principal` o `/effort`; no se cambia aquí.
- Los enlaces de skills no se tocan: ya se actualizan al ser enlaces.

## Alcance
`instalar.sh` (función nueva `generar_lanzador_claude` y bloque de Claude), `README.md` (sección «ventana propia»), `agentes/principal.md` (paso 4), `AGENTS.md`, `verify` (8d y bloque nuevo 3e).
Fuera de alcance: `desinstalar.sh` salvo que no borre los lanzadores nuevos, `modelos.json`, resolver, skills, `old/`.

## Decisiones ya tomadas
- Ejecutor: principal, porque falla la pregunta 2 de la Prueba: cómo `instalar.sh` registra en el manifiesto un archivo regenerado solo se ve al correrlo.
- Motivo del cambio: `effort` y `thinking` del frontmatter no se aplican cuando el agente es la sesión principal (`claude --agent`, `pi --agent`). Probado: `pi --agent constructor` abre Luna en `low`; `pi-constructor` abre Luna en `high`.
- El lanzador de Claude usa `--effort <valor de resolver esfuerzo>` y omite el flag si el valor está vacío.
- El lanzador de Pi ya existe y usa `modelo-esfuerzo`; solo cambia que ahora se regenera.
- (Corregido) Se retiró la regeneración de lo generado: el diagnóstico de que el instalador no refrescaba era falso. El `OMITIDO` salía de `--simular`, que no quita nada primero.

## Escenarios
- CUANDO `modelos.json` cambia el esfuerzo y se reinstala ENTONCES los agentes y lanzadores quedan con el valor nuevo.
- CUANDO el destino existe y no trae la marca ENTONCES se deja intacto y se dice OMITIDO.
- CUANDO se abre `claude-constructor` ENTONCES ejecuta `claude --agent constructor --effort high`.
- CUANDO un agente no declara esfuerzo ENTONCES el lanzador no pasa `--effort`.
- CUANDO se corre `desinstalar.sh` ENTONCES se borran también los lanzadores de Claude.

## Verificación
`./verify` — debe terminar en `VERIFY OK`, con el bloque nuevo 3e.

## Pasos
- [x] Crea `generar_lanzador_claude <archivo>` que escribe `$BIN_DIR/claude-<agente>` con `exec claude --agent <agente> ${esfuerzo:+--effort "$esfuerzo"} "$@"`.
- [x] En ese lanzador, calcula `esfuerzo` con `resolver.mjs esfuerzo <agente>` y registra el archivo en el manifiesto.
- [x] Llama a `generar_lanzador_claude` en el bloque de Claude, tras `generar_agente_claude`, y agrega el aviso de PATH.
- [x] Comprueba que `desinstalar.sh` borra `claude-<agente>`; si no, corrígelo.
- [x] En `README.md`, sección «ventana propia», pon `claude-constructor` y aclara que `--agent` directo no aplica el esfuerzo.
- [x] En `agentes/principal.md`, paso 4, cambia `claude --agent constructor` por `claude-constructor`.
- [x] En `verify`, bloque 8d, cambia la comprobación `claude --agent constructor` por `claude-constructor`.
- [x] En `AGENTS.md`, agrega una viñeta: ventana propia con `claude-<agente>` o `pi-<agente>`; `instalar.sh` regenera lo generado.
- [x] En `verify`, antes de 9a, agrega 3e: HOME temporal, `FLUCASTR_MODELOS` con constructor en `low`, `instalar.sh`; comprueba `effort: low` y `thinking: low`.
- [x] En 3e cambia a `max`, reinstala y comprueba `effort: max`, `thinking: max` y `--effort max` en `claude-constructor`.
- [x] En 3e agrega prueba negativa: un destino sin marca queda intacto tras instalar.
- [x] En 3e corre `desinstalar.sh` y comprueba que no quedan agentes ni lanzadores generados.
- [x] Corre `./verify` y pega en *Evidencia* las líneas de 3e.

## Evidencia
$ ./verify
...
ok 3e: effort y thinking low->max al reinstalar, --effort en claude-constructor, archivo sin marca intacto, desinstalar limpia
ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla
VERIFY OK
exit 0
Cambios: instalar.sh (generar_lanzador_claude + aviso de PATH), README.md, agentes/principal.md, AGENTS.md, verify (3e y 8d).

## Notas
- Ejecutó el principal. Cargó `ejecutar-plan` antes (en esta sesión).
- Corrección de alcance: al probar `instalar.sh` en un HOME temporal vi que ya desinstala lo anterior antes de reinstalar. Los pasos 1 a 4 (regenerar lo marcado) se retiraron del plan y del código; mi diagnóstico previo era erróneo. `desinstalar.sh` ya borraba los lanzadores nuevos por manifiesto, sin cambios.
- El esfuerzo real que verá Franco en ventana propia: `claude-constructor` con `--effort`, `pi-constructor` con sufijo; abrir con `--agent` directo o dentro de Pi no lo aplica.
- Sin probar con corrida real: que `--effort` en `claude --agent` se vea en la interfaz; se comprueba con `/effort status`.
