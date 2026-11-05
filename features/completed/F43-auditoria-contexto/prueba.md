# prueba

Prueba real del caché del proveedor con el mismo prompt en dos lanzamientos seguidos (2026-11-05). Prompt idéntico en las cuatro corridas: «Lee definitions/F43-AUDITORIA.md y responde solo con su primera línea.». Salidas guardadas fuera del repo en el directorio temporal de la sesión (`f43/`). Los valores salen del JSON de salida de cada lanzamiento (campos de uso), no de `scripts/consumo.mjs`.

## Corridas

| herramienta | corrida | input | cacheRead | cacheWrite | fuente |
|---|---|---|---|---|---|
| claude | 1 | 4 | 36784 | 18882 | `claude -p "<prompt>" --output-format json`, `usage` del JSON (`cache_read_input_tokens`, `cache_creation_input_tokens`) |
| claude | 2 | 4 | 55666 | 0 | igual que corrida 1 |
| pi | 1 | 6080 | 0 | 0 | `PI_CACHE_RETENTION=long pi --model openai/gpt-6-luna --mode json --no-session -p "<prompt>"`; suma de 2 respuestas del modelo (una `toolUse` con la lectura, una `stop`), sin repetir por `responseId`: 3002 + 3078 |
| pi | 2 | 3264 | 2816 | 0 | igual que corrida 1; suma de 2 respuestas: 3002 (`toolUse`, sin caché) + 262 input con 2816 `cacheRead` (`stop`) |

Modelo y comando reales: `--model openai/gpt-6-luna` (flag de `pi --help`: `--model <pattern>`, formato `provider/id`). No se tocó `modelos.json` ni ningún archivo de configuración. Salidas JSON guardadas fuera del repo en `f43/pi-1.jsonl` y `f43/pi-2.jsonl` del directorio temporal de la sesión. El aviso `Invalid settings file /Users/franco/.pi/agent/settings.json` salió en ambas corridas; no se abrió ese archivo.

Lanzamientos de Pi con modelo en esta relanzada: 2 (sin reintentos). Los `usage` de la corrida 1 y 2 son los de la API (no 0), a diferencia del error anterior con `gpt-5.5`.

## Resultado

- Claude Code: ahorro de la segunda corrida = 55666 / (4 + 55666 + 0) = **100.0 %** (cacheRead de la segunda sobre su input + cacheRead + cacheWrite). La primera corrida escribió 18882 tokens en caché y la segunda los leyó.
- Pi: ahorro de la segunda corrida = 2816 / (3264 + 2816 + 0) = **46.3 %**. La primera corrida no leyó caché ni escribió (0 / 0), y la segunda leyó 2816 tokens. Cada corrida suma sus 2 respuestas del modelo.
- Campo de caché en el log: en Claude Code sí venía (`cache_read_input_tokens` y `cache_creation_input_tokens`). En Pi el JSON trae `cacheRead`/`cacheWrite` en cada respuesta válida; en la corrida 2 el campo vino con valor distinto de 0.
- Diferencia de método a tener en cuenta: en Pi la corrida incluye una lectura de archivo por herramienta (respuesta `toolUse`), así que el prefijo y el número de llamadas no son idénticos a los de Claude Code. Solo se mide el caché del proveedor; no se cambió prompt ni configuración.
