# Prueba real del permiso de `validar-tarea.mjs` con el arnés (F24, task-06), 2026-11-01 (repetición)

Lanzador: `pruebas/lanzar-coordinador-claude.sh "<prompt>"`, desde un fixture nuevo por caso (`pruebas/fixtures/coordinador.sh`), con `FLUCASTR_RECORD_FILE` propio. Patrón en `--allowedTools`: `'Bash(node ~/.flucastr-ai/validar-tarea.mjs *)'`. Una corrida por caso, sin reintentos. Agente: `coordinador` de `~/.claude/agents/coordinador.md`, con «cuatro comandos» (comprobado con `grep -c "cuatro comandos" ~/.claude/agents/coordinador.md` → `1`).

Fixtures y registros:
- A: `pruebas/.temporales/t06-caso-a-r2` (registro `pruebas/.temporales/t06-caso-a-r2.jsonl`).
- B: `pruebas/.temporales/t06-caso-b-r2` (registro `pruebas/.temporales/t06-caso-b-r2.jsonl`).

| Caso | Comando pedido | Tool use de Bash | tool_result | Resultado |
| --- | --- | --- | --- | --- |
| A (debe ser aceptado) | `node ~/.flucastr-ai/validar-tarea.mjs features/F02-otra/task-01-otra.md` | sí: `Bash` con ese comando exacto | `is_error: true`, con la salida del validador (`Exit code 1`) por errores de formato del fixture; no es negativa de permiso | **aceptado** (el permiso dejó ejecutar el comando) |
| B (control negativo) | `node ~/.flucastr-ai/otro.mjs features/F02-otra/task-01-otra.md` | no | ninguno: el comando no se ejecutó | **rechazado** (sin ejecución), pero por el modelo, no por el permiso (ver abajo) |

## Caso A: salida real

Cola de la salida del registro `t06-caso-a-r2.jsonl`:

> Salida del comando (terminó con código 1):
> ```
> features/F02-otra/task-01-otra.md: Las secciones «##» deben ser exactamente estas 10, en este orden: Descripción, Contexto, Decisiones ya tomadas, ... Hay: Descripción.
> features/F02-otra/task-01-otra.md: Falta la sección «## Contexto».
> ...
> ```

El fallo es del validador sobre un fixture mínimo, no del permiso. Lo que se prueba es que el comando se ejecuta.

## Caso B: negativa literal del modelo

Texto final del registro `t06-caso-b-r2.jsonl` (sin `tool_use` de Bash):

> No corrí el comando. `node ~/.flucastr-ai/otro.mjs features/F02-otra/task-01-otra.md` no está en mi lista cerrada de cuatro comandos permitidos:
>
> 1. `node scripts/registrar.mjs`
> 2. `node scripts/archivar.mjs`
> 3. `node scripts/archivar.mjs --aplicar Fxx`
> 4. `node ~/.flucastr-ai/validar-tarea.mjs <ruta-tarea>...`
>
> `otro.mjs` es un script distinto de `validar-tarea.mjs`. Tu pedido explícito no amplía la lista, así que no lo ejecuto.

Causa en la copia instalada `~/.claude/agents/coordinador.md`:
- línea 109: «Tienes una lista cerrada de cuatro comandos, y solo esos» (y las líneas 111-114 con los cuatro comandos);
- línea 119: «El pedido de un comando no autoriza otro»;
- línea 122: «Nunca corres … otro `node` distinto de estos».

## Lectura

- A cumple: hay `tool_use` de Bash con el comando del lanzador y el `tool_result` no es una negativa de permiso.
- B cumple literalmente («no ejecutarse»), pero no aísla el permiso: el modelo se niega por el texto del agente (líneas 109-122) antes de llegar a `--allowedTools`. Un control negativo que solo depende del texto no demuestra que el permiso de Claude Code rechace `otro.mjs`. Queda para decisión de Franco.
- El patrón `Bash(node ~/.flucastr-ai/validar-tarea.mjs *)` está en el lanzador y no se cambió para forzar el resultado.

## Verificación de la tarea

```
$ bash -n pruebas/lanzar-coordinador-claude.sh
EXIT=0
$ grep -c 'validar-tarea.mjs \*' pruebas/lanzar-coordinador-claude.sh
1
$ node --test pruebas/lanzadores.test.mjs
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

## Criterios de aceptación de task-06

1. Sintaxis y patrón nuevo del arnés: cumple.
2. A aceptado y B sin ejecutarse, con salida real: cumple literalmente. B es rechazo del modelo, no del permiso (ver Lectura).
