# task-08 — Corrida con modelo real: el hook bloquea una escritura dañada
repo: Flucastr.AI   depende_de: task-07   estado: aprobada

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

## Notas
