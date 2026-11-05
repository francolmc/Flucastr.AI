# task-08 — Corrida con modelo real: el hook bloquea una escritura dañada
repo: Flucastr.AI   depende_de: task-07   estado: hecha

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

Una pasada completa (intentos=1). Informe: `pruebas/resultados/2026-11-05-hook-claude-code-3.md`, Veredicto: OK.

```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0

$ bash pruebas/correr-hook.sh claude-code danada
fijado
escenario: danada; salida: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/hook-claude-code/danada.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code valida
fijado
escenario: valida; salida: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/hook-claude-code/valida.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code sin-hook
escenario: sin-hook; salida: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/hook-claude-code/sin-hook.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code subagente
fijado
escenario: subagente; salida: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/hook-claude-code/subagente.jsonl
exit 0

$ bash pruebas/correr-hook.sh claude-code informe
informe: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/resultados/2026-11-05-hook-claude-code-3.md
Veredicto: OK
exit 0
```

Criterios: 1 cumplido (`danada` con el mensaje del hook; `valida` y `sin-hook` sin él); 2 cumplido (`subagente` con el mensaje y la llamada al subagente); 3 cumplido (informe `-3` con «Veredicto: OK»).

## Notas

Reintento: *Evidencia* y *Notas* del intento previo se borraron (instrucción del encargo). Las pasadas 1 y 2 de la corrida anterior quedan en sus informes `2026-11-05-hook-claude-code-1.md` y `-2.md` (FALLA por la frase literal ausente). La corrida nueva pasó en la primera pasada; no hizo falta una segunda.

Decisiones de *Decisiones ya tomadas* evaluadas: ninguna aplica. El evento de `danada` trajo `tool_input.file_path` y la herramienta de subagente funcionó sin cambios.

Huecos menores resueltos: (1) `pruebas/resultados/README.md` no existía; se creó como índice de los tres informes de F38 (uno por línea, con su veredicto), no solo con la línea del informe nuevo. (2) Se borró `pruebas/.temporales/hook-claude-code/` (temporales de esta corrida), igual que en la corrida anterior; el resto de `pruebas/.temporales/` no se tocó. Los informes en `pruebas/resultados/` se conservan.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
