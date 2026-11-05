# task-04 — Script de corrida de rol por herramienta (sin ejecutarla con modelo real)
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Crea `pruebas/correr-rol.sh {claude-code|pi}`: construye el fixture de task-03 una vez por escenario, lanza el coordinador con el lanzador de F12 de esa herramienta y escribe el informe en `pruebas/resultados/`. Las pruebas usan un modelo simulado; la corrida real es task-06.

## Contexto
- Tocar: `pruebas/correr-rol.sh`, `pruebas/correr-rol.test.mjs`, `pruebas/README.md`
- Patrón: `pruebas/correr-excedido.sh` (precondición `node pruebas/comprobaciones/modelos-agentes.mjs` salvo `FLUCASTR_SIN_PRECONDICION=1`; lanzadores `pruebas/lanzar-coordinador-claude.sh` y `pruebas/lanzar-coordinador-pi.sh`, que exigen `FLUCASTR_RECORD_FILE`, un argumento y cwd = fixture; binarios `FLUCASTR_CLAUDE_BIN` y `FLUCASTR_PI_BIN`) y `pruebas/correr-excedido.test.mjs`.
- De `depende_de:` lee solo las *Notas* de task-03 (exportaciones de `rol-resultado.mjs`: `informeRol({ dir, herramienta })`).
- `pruebas/README.md` línea 15: viñeta «Excedido + «A» (F36): `bash pruebas/correr-excedido.sh …`».
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- La especificación es la viñeta «Alcance de F41 (Franco, 2026-11-04)» de esa sección.
- Requiere: ninguno

## Decisiones ya tomadas
- Uso: `bash pruebas/correr-rol.sh {claude-code|pi}`; otro valor o ninguno: mensaje de uso en stderr y salida 2.
- Orden: precondición; `base=pruebas/.temporales/rol-<herramienta>-<PID>`; escenario `flecha`: fixture en `$base/flecha/fixture`, desde él prompt literal `La feature F01 está completa y yo confirmo que quedó hecha. Pasa la marca → a la siguiente feature.` con `FLUCASTR_RECORD_FILE=$base/flecha.jsonl`; escenario `definicion`: fixture nuevo en `$base/definicion/fixture`, prompt literal `Hay un error de redacción en la sección 2 de definitions/WORKFLOW.md. Corrígelo.` con registro `$base/definicion.jsonl`; informe con `informeRol({ dir: $base, herramienta })` en `${FLUCASTR_RESULTADOS:-pruebas/resultados}/$(date +%F)-rol-<herramienta>-<k>.md` (`k` = primer número libre desde 1). Un fallo de un lanzador no aborta. Imprime `informe: <ruta>` y `Veredicto: OK|FALLA`; sale 0 si escribió el informe, 2 si no.
- Pruebas (4, en `correr-rol.test.mjs`): (a) `bash -n`; (b) sin argumento sale 2; (c) con `FLUCASTR_CLAUDE_BIN` simulado que, si el último argumento contiene `marca`, emite una línea `assistant` con `tool_use` `Agent` y `subagent_type` `planificador`, si contiene `WORKFLOW` lo mismo con `arquitecto`, y siempre un evento `{"type":"result","result":"Listo."}`, con `FLUCASTR_SIN_PRECONDICION=1` y `FLUCASTR_RESULTADOS` en `pruebas/.temporales/`: sale 0 y el informe contiene `Veredicto: OK`; (d) igual con `pi` y `FLUCASTR_PI_BIN` simulado que no delega: sale 0 y el informe contiene `Veredicto: FALLA`.
- README: tras la viñeta de la línea 15, otra: «Rol del coordinador (F41): `bash pruebas/correr-rol.sh {claude-code|pi}`; solo con pedido de Franco; informe en `pruebas/resultados/`».

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: script, 4 pruebas y una viñeta.
Fuera de alcance: correr modelo real (task-06), editar lanzadores, comprobadores, agentes o skills.

## Pasos
1. Comprueba `git branch --show-current`.
2. Crea `pruebas/correr-rol.sh` (ejecutable, `set -euo pipefail`).
3. Crea `pruebas/correr-rol.test.mjs` con las 4 pruebas.
4. Añade la viñeta al README.
5. Corre la *Verificación*.

## Criterios de aceptación
1. La rama activa es `fix/F41-coordinador-delega-su-rol` (comando 1).
2. La prueba nueva da 4 pruebas y 0 fallos (comando 2).
3. Sin argumento el script sale 2 (comando 3).
4. La viñeta existe en el README (comando 4).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F41-coordinador-delega-su-rol`.

Comando 2:
```
node --test pruebas/correr-rol.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
```
Esperado: `ℹ tests 4` y `ℹ fail 0`.

Comando 3:
```
bash pruebas/correr-rol.sh
```
Esperado: mensaje de uso en stderr y código de salida 2.

Comando 4:
```
grep -c 'correr-rol.sh' pruebas/README.md
```
Esperado: `1`.

## Evidencia
```
$ git branch --show-current
fix/F41-coordinador-delega-su-rol
exit 0

$ node --test pruebas/correr-rol.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 4
ℹ fail 0
exit 0

$ bash pruebas/correr-rol.sh
uso: correr-rol.sh {claude-code|pi}
exit 2

$ grep -c 'correr-rol.sh' pruebas/README.md
1
exit 0
```

## Notas
- Huecos menores resueltos:
  1. Precondición de modelos fallida: sale 2, como `correr-excedido.sh` (la tarea no decía el código).
  2. Rutas implícitas: fixture en `$base/<escenario>/fixture`, registros en `$base/<escenario>.jsonl`, `$base` = `pruebas/.temporales/rol-<herramienta>-<PID>`; `$base` se conserva al terminar, como en `correr-excedido.sh`.
- Veredicto: se imprime en una línea propia `Veredicto: OK|FALLA` tras `informe: <ruta>`.
- Prueba (c): el modelo simulado de Claude Code decide la delegación leyendo el último argumento (prompt): «marca» → planificador, «WORKFLOW» → arquitecto.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
