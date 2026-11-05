# task-08 — Corrida con modelo real: el hook bloquea una escritura dañada
repo: Flucastr.AI   depende_de: task-07   estado: bloqueada

## Descripción
Aceptación de F38: una prueba real en Claude Code muestra que el hook bloquea una escritura dañada y deja pasar una válida (con control negativo sin hook), y que corre también dentro de un subagente. Se ejecuta `pruebas/correr-hook.sh` con el `claude` real y se deja el informe en `pruebas/resultados/`. No se cambia código de producto.

## Contexto
- Fuente: definitions/AUDITORIA.md «2.7 Documento de tarea dañado: quién repara»
- Tocar: `pruebas/resultados/README.md`
- Requiere: red, largo:170, runtime:node@25
- `pruebas/correr-hook.sh` (task-07) corre un escenario por invocación; cada uno usa `claude -p` con el modelo real y tarda menos de 180 s. `~/.flucastr-ai/raiz` debe apuntar a este repo (hoy: `/Users/franco/Codes/flucastr/Flucastr.AI`, verificado) y `~/.flucastr-ai/validar-tarea.mjs` existir.
- Nota de patrón: F36 y F41 hicieron la corrida real de la misma manera; los informes viejos están en `pruebas/resultados/` (por ejemplo `2026-11-04-rol-claude-code-1.md`).
- `pruebas/resultados/README.md`: si no existe, créalo con el índice de informes de F38.

## Decisiones ya tomadas
- Se usa el modelo por defecto de Claude Code; no se fija otro.
- Si el nombre de la herramienta de subagentes difiere de `Agent` o `Task` y el escenario `subagente` da FALLA solo por eso, se anota en *Notas* y se informa a Franco con `BLOQUEO: rol=constructor; motivo=codigo: nombre de herramienta de subagente`; no se edita el script en esta tarea.
- Si el JSON que recibe el hook no trae `tool_input.file_path`, `danada` da FALLA: se informa con `BLOQUEO: rol=constructor; motivo=codigo: forma del evento del hook` y se pega el `.jsonl` relevante en *Notas*.
- El informe y su veredicto se pegan en *Evidencia* (cola).
- Sin red o sin `claude`: `BLOQUEO: rol=franco; motivo=entorno: falta=red`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: correr los cinco comandos, dejar el informe y el índice.
Fuera de alcance: modificar scripts, el hook o el instalador; Pi; cualquier commit.

## Pasos
1. Corre los escenarios `danada`, `valida`, `sin-hook` y `subagente`, uno por uno, y después `informe`.
2. Si el veredicto es OK, crea o actualiza `pruebas/resultados/README.md` con una línea que apunte al informe nuevo.
3. Si es FALLA, no repitas la corrida más de una vez; aplica las decisiones de arriba.

## Criterios de aceptación
1. `danada` muestra el mensaje «bloque de código abierto en línea» del hook; `valida` y `sin-hook` no. Se comprueba en el informe.
2. `subagente` muestra el mismo mensaje con una llamada a la herramienta de subagente.
3. `pruebas/resultados/` tiene un informe `…-hook-claude-code-N.md` con «Veredicto: OK».

## Verificación
```
git branch --show-current
bash pruebas/correr-hook.sh claude-code danada
bash pruebas/correr-hook.sh claude-code valida
bash pruebas/correr-hook.sh claude-code sin-hook
bash pruebas/correr-hook.sh claude-code subagente
bash pruebas/correr-hook.sh claude-code informe
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; el último comando imprime `Veredicto: OK`.

## Evidencia

Dos pasadas completas de la Verificación (cota de 2). Informes: `pruebas/resultados/2026-11-05-hook-claude-code-1.md` (pasada 1, FALLA) y `pruebas/resultados/2026-11-05-hook-claude-code-2.md` (pasada 2, FALLA).

$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0

$ bash pruebas/correr-hook.sh claude-code danada
fijado
escenario: danada; salida: .../pruebas/.temporales/hook-claude-code/danada.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code valida
fijado
escenario: valida; salida: .../pruebas/.temporales/hook-claude-code/valida.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code sin-hook
escenario: sin-hook; salida: .../pruebas/.temporales/hook-claude-code/sin-hook.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code subagente
fijado
escenario: subagente; salida: .../pruebas/.temporales/hook-claude-code/subagente.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code informe
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-hook-claude-code-1.md
Veredicto: FALLA
exit 0

Pasada 2 (los cuatro escenarios de nuevo, idénticos a los de arriba, con `exit 0` cada uno), luego:

$ bash pruebas/correr-hook.sh claude-code informe
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-hook-claude-code-2.md
Veredicto: FALLA
exit 0

Veredicto por escenario en la pasada 2 (`...-hook-claude-code-2.md`):
- danada — FALLA: «sin mención del bloque de código abierto». El modelo describe el bloqueo del hook («bloque de código abierto en la línea 32», firma `bloque-abierto|…|7e8eb467ab13`), pero la frase literal «bloque de código abierto en línea» no aparece en `danada.jsonl`.
- valida — OK.
- subagente — OK («llamó a la herramienta de subagente», y el mensaje literal del hook sí aparece en el resultado: «Hay un bloque de código abierto en línea 32…»).
- sin-hook — OK.

Pasada 1 de `subagente` dio FALLA por la misma frase literal ausente; la pasada 2 dio OK. No fue por el nombre de la herramienta (llamó a Write por subagente en ambas).

Criterios: 1 no cumplido (danada sin la frase literal); 2 cumplido en la pasada 2; 3 no cumplido (ningún informe con «Veredicto: OK»).

## Notas

Bloqueo: tipo=verificacion_x2; falta=-

Decisiones de *Decisiones ya tomadas* evaluadas: ninguna aplica. El evento de `danada` sí trae `tool_input.file_path`, y el nombre de la herramienta de subagente (`Agent`/`Task`) no es la causa: la llamada ocurrió en las dos pasadas. Por eso no hay `BLOQUEO` de esas dos decisiones; el bloqueo es por verificación.

Causa observada, no resuelta: el hook sí se dispara en `danada` (el modelo cita la firma y la línea 32), pero el texto literal del hook no queda en `danada.jsonl` en ninguna de las dos pasadas. En `subagente` sí queda. El comprobador `pruebas/comprobaciones/hook-resultado.mjs` exige la frase literal en el registro, así que `danada` falla siempre. No se modificó el comprobador ni el script (fuera de alcance). Hace falta que Franco decida si el hook debe volcar su mensaje al registro del `Write` del agente principal o si el comprobador debe aceptar la paráfrasis del modelo.

Huecos menores: ninguno. No se creó `pruebas/resultados/README.md` porque el veredicto no es OK (paso 2 solo con OK).

Limpieza: se borró `pruebas/.temporales/hook-claude-code/` (temporales de la corrida). Los informes en `pruebas/resultados/` se conservan.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
