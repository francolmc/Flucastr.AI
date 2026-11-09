# Compactación de contexto en Codex: qué ajuste funciona

Origen: tramo 1 del cambio `cambios/contexto-y-esperas/plan.md`, 2026-11-09. Medido con `codex-cli 0.167.0` (modelo `gpt-6.1-sol` según el rollout, ventana de contexto 475000 tokens). Solo `codex exec`; no se probó una sesión interactiva. Las corridas usaron el `CODEX_HOME` real; no se leyó ni copió `auth.json`, y `~/.codex/config.toml` no se modificó.

Tarea de prueba (igual en todas las corridas, carpeta temporal vacía en el scratchpad): cuatro comandos de shell cortos (`echo paso1` … `echo paso4`), una línea de salida por comando y respuesta final `fin`. Cada rollout se leyó solo en el archivo nuevo de esa corrida.

## Resultados

| Corrida | Ajuste | Rollout (`~/.codex/sessions/2026/11/09/`) | Compactaciones |
| --- | --- | --- | --- |
| 1 | `-c model_auto_compact_token_limit=3000` | `rollout-2026-11-09T07-25-50-01a1bfd7-c122-7753-8c22-294db1bf8442.jsonl` | 4 |
| 2 | `-c model_post_turn_compact_threshold_percent=10` | `rollout-2026-11-09T07-27-32-01a1bfd9-4f7e-76e3-a0e7-04b238096716.jsonl` | 0 |
| 3 | `-c model_post_turn_compact_threshold_percent=1` | `rollout-2026-11-09T07-28-07-01a1bfd9-d890-7fc0-9a66-ff0d08f37e3c.jsonl` | 1 |
| 4a | `.codex/config.toml` de proyecto con `model_auto_compact_token_limit = 3000`, sin confianza | `rollout-2026-11-09T07-28-48-01a1bfda-7971-7fa1-a5bb-e8cabb812447.jsonl` | 0 |
| 4b | Lo mismo, con `-c 'projects."<dir>".trust_level="trusted"'` | `rollout-2026-11-09T07-29-11-01a1bfda-d3ed-7680-af47-d258fad12ed4.jsonl` | 0 |

### Evento de compactación (corrida 1)

El rollout registra la compactación como líneas `"type":"compacted"` en los ordinales 21, 35, 49 y 63, y como `item_completed` de tipo `ContextCompaction` en 26, 40, 54 y 68. La entrada de contexto por llamada (`last_token_usage.input_tokens`) es de unos 16,5 k tokens antes de compactar; tras la compactación el `token_count` siguiente marca `last_input 0` (ordinales 25, 39, 53, 67). Es decir, con el límite en 3000 se compacta después de cada llamada de herramienta, no solo una vez.

### Evento de compactación (corrida 3)

Con `post_turn_threshold_percent=1` hay una compactación en el ordinal 48 (`compacted` y `ContextCompaction` en 53). El mensaje final de la respuesta está en el ordinal 43 y `task_complete` en el 54: compacta tras la respuesta final, antes de cerrar el turno.

### Por qué la corrida 2 no compactó

El umbral posterior al turno es un porcentaje de la ventana (10 % de 475000 ≈ 47,5 k tokens). Las entradas de la tarea rondaban los 17 k tokens, así que nunca llegó al umbral. No es que la clave no funcione: la corrida 3 demuestra que sí, con 1 % (≈ 4,75 k).

### Por qué no sirve el `.codex/config.toml` de proyecto (corridas 4a y 4b)

Control: un `.codex/config.toml` de proyecto con `model_reasoning_effort = "high"` no cambió la cabecera de la sesión, que dice `reasoning effort: low` tanto sin confianza explícita (control A, `rollout-2026-11-09T07-29-43-01a1bfdb-4ffc-7083-9f77-ba4466be77b8.jsonl`) como con la confianza dada por la línea de comandos (control B, `rollout-2026-11-09T07-29-49-01a1bfdb-6499-7283-bdaa-d33c33c25609.jsonl`; la atribución A/B es por orden de hora, el rollout no guarda el `-c`). Los dos rollouts de control están en `~/.codex/sessions/2026/11/09/`, con `reasoning_effort` `low`. Es decir, el archivo de proyecto no llegó a surtir efecto en esta prueba. No se marcó la carpeta como confiable en `~/.codex/config.toml` porque eso modifica la configuración real de Franco. Conclusión: el ajuste de compactación debe ir en la línea de comandos (`-c`), no en el `config.toml` de proyecto.

Nota: hubo una tercera sesión de control (`rollout-2026-11-09T07-29-54-01a1bfdb-7ab2-72d0-9191-5a45754bf8cd.jsonl`, con `-C` y la misma carpeta) que se lanzó sin anotar su cabecera; su rollout también dice `reasoning_effort` `low`. No cambia las conclusiones.

## Recomendación

- Usar `-c model_auto_compact_token_limit=<compactar_en>` en el lanzador `codex-<agente>`. Es el único ajuste probado que compacta dentro de un turno de forma automática, y lo hace con la clave que ya usan los lanzadores.
- `model_post_turn_compact_threshold_percent` compacta al final del turno solo si el contexto supera ese porcentaje de la ventana; con el valor 10 no se disparó en la tarea de prueba. No se recomienda como sustituto del límite automático.
- No usar `.codex/config.toml` de proyecto para este ajuste; no surtió efecto en la prueba.
- Límite de la prueba: el valor 3000 es artificial (fuerza compactación en cada llamada). El valor de producción sale de `compactar_en` (hoy 100000) y no se midió con esa cifra en una tarea real.
