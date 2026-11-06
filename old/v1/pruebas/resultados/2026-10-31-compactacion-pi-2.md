# Pi: el `coordinador` retoma desde `STATUS.md` tras una compactación (F19, task-15, intento 2)

Corrida con modelo, 2026-10-31, en Pi. Segundo intento de la task-15. El intento 1 (`pruebas/resultados/2026-10-31-compactacion-pi.md`) dio **FALLA por umbral inviable** (1500 tokens de margen, por debajo de la base del `coordinador`); no se edita ni se borra. Este intento usa un umbral artificial de 18000 tokens, puesto solo en el `.pi/settings.json` de un fixture temporal (`mktemp -d`). `~/.pi/agent/settings.json` no se tocó, no se reinstaló nada y no se abrió ningún archivo de credenciales.

El umbral es artificial: 18000 tokens de margen (ventana 272000 − `reserveTokens` 254000) y `keepRecentTokens` 3000. No se retocó para forzar un resultado.

## Veredicto

**OK**, según los cinco criterios de la tarea, con una reserva que el lector debe tener en cuenta (ver «Lectura del resultado»).

La compactación se disparó **solo en el turno de retoma**, no en el turno 1. El turno 1 terminó con un pico de 17832 tokens, justo por debajo del umbral de 18000.

## Qué se corrió

- Modelo (`node scripts/resolver.mjs modelo coordinador pi`): `openai/gpt-6.1-sol`, ventana declarada 272000 en `modelos.json`. El registro lo reporta como `gpt-6.1-sol`.
- Precondiciones sin modelo: `command -v pi-coordinador` → `/Users/franco/.local/bin/pi-coordinador`; `node scripts/resolver.mjs cuerpo agentes/coordinador.md | grep -c 'Antes de delegar, escribe en'` → `1`.
- Fixture: `pruebas/fixtures/coordinador.sh "$T/fx"` (repo demo; `definitions/STATUS.md` mínimo, sin «Paso actual» ni «Espera a Franco»).
- `.pi/settings.json` del fixture (solo aquí; `~/.pi/agent/settings.json` no se tocó):
  `{"compaction":{"modelOverrides":{"openai/gpt-6.1-sol":{"reserveTokens":254000,"keepRecentTokens":3000}}}}`
- Envoltorio `$T/pi-compacta.sh`: quita `--no-session`, añade `-a --session-dir "$PI_SESIONES"` y, con `CONTINUAR=1`, `-c`; redirige la entrada desde `/dev/null`.
- Lanzador sin cambios: `pruebas/lanzar-coordinador-pi.sh`, con `FLUCASTR_PI_BIN` apuntando al envoltorio, `FLUCASTR_PI_TOPE=240`.
- `$T` es el directorio temporal `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.5gca9DTqD3`. Los registros (`reg1.jsonl`, `reg2.jsonl`) y la sesión quedan ahí, fuera del repo, sin publicar.

## Invocaciones con modelo

Dos invocaciones, el máximo permitido. No se usó la tercera (no hubo fallo de infraestructura).

1. **Turno 1** (prompt literal de la tarea). Resultado: `turno1 exit=0`. El registro tiene 290 líneas.
   Prompt: «Estás en el flujo de este proyecto. Lee, en este orden y completos, definitions/STATUS.md, definitions/BACKLOG.md, scripts/registrar.mjs y scripts/archivar.mjs. No delegues a ningún subagente. Después escribe en definitions/STATUS.md, sección «Activo», la línea literal `Retomar: ancla-4471` y, debajo, en una línea, qué debe revisar Franco según el estado. Responde solo: listo.»
2. **Turno de retoma** (`CONTINUAR=1`, misma sesión, prompt literal). Resultado: `retoma exit=0`. El registro tiene 77 líneas.
   Prompt: «Tu conversación se compactó: no te fíes de lo que recuerdes. Lee definitions/STATUS.md y responde con la línea que empieza por `Retomar:` tal cual está en ese archivo, y en una frase en qué puerta estamos. No delegues a ningún subagente.»

## Compactaciones por registro

| Registro | `compaction_end` | `tool_execution_start` | Pico de tokens (`message_end`) |
| --- | --- | --- | --- |
| `reg1.jsonl` (turno 1) | 0 | 5 (lecturas) | 17832 |
| `reg2.jsonl` (retoma) | 1 (`reason=threshold`) | 1 (lectura de `STATUS.md`) | 17925 |

En `reg2.jsonl` el orden es: lectura de `definitions/STATUS.md` (evento 26), `compaction_start` (31) y `compaction_end` (32), y luego la respuesta final. No hubo una segunda lectura tras la compactación.

## Condiciones

| # | Condición | Valor |
| --- | --- | --- |
| 1 | Al menos un `compaction_end` entre `reg1.jsonl` y `reg2.jsonl` | Sí (0 en `reg1.jsonl`, 1 en `reg2.jsonl`) |
| 2 | `definitions/STATUS.md` del fixture contiene `ancla-4471` tras el turno 1 | Sí (1 aparición, línea 11: `Retomar: ancla-4471`) |
| 3 | `reg2.jsonl` tiene un `tool_execution_start` cuyos `args` mencionan `STATUS.md` | Sí (`read` con `path: definitions/STATUS.md`) |
| 4 | El texto final de la retoma contiene `ancla-4471` | Sí |
| 5 | No más de 4 `compaction_end` por turno, y canario 0 en registros e informe | Sí (máximo 1 por turno); canario 0 en `reg1.jsonl`, `reg2.jsonl` y este informe |

Texto final de la retoma, según `registro.mjs` (`analyzeRecordFile(..., 'pi')`):

> Retomar: ancla-4471
>
> Estamos en la puerta 2, a la espera de que Franco revise y apruebe explícitamente `definitions/BACKLOG.md`.

## Lectura del resultado

- Las cinco condiciones se cumplen literalmente, así que el veredicto es OK.
- **Reserva sobre la condición 3 y 4:** la única lectura de `STATUS.md` en la retoma ocurrió **antes** de la compactación. Tras la compactación no hubo una nueva lectura. Por lo tanto, la respuesta `Retomar: ancla-4471` pudo salir del resumen de la compactación (que incluye el contenido leído) y no de un acceso posterior al archivo. Esta corrida no separa «retoma desde `STATUS.md`» de «retoma desde el resumen que conservó el contenido de `STATUS.md`». Para separarlo haría falta una retoma con una compactación que ocurra antes de la lectura, y eso no está en el alcance de esta tarea.
- El turno 1 no compactó: el pico de 17832 tokens quedó 168 por debajo del umbral. La compactación apareció solo al cruzarlo en la retoma.

## Limitaciones

- El umbral de 18000 tokens es artificial. Esta corrida no demuestra que 100 k sea el umbral adecuado para el uso real.
- Un solo caso, una sola compactación. No es una medida de frecuencia ni de robustez.
- La reserva anterior sobre la fuente de la respuesta de retoma se mantiene.
- No se midió `tokensBefore` del `compaction_end`; el pico de tokens de la tabla viene de los `usage` de `message_end`.

## Pruebas del repo

`bash pruebas/rapida.sh` con el HOME real, una sola corrida, sin tubería que oculte el código de salida:

```
exit=0
ℹ suites 0
ℹ pass 277
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
rapida: 27 archivos en 16 s (tope 30 s)
```

No hubo falla intermitente de `registro.e2e.test.mjs` («2 !== 1») y no se repitió la corrida.

## Comandos (sin secretos)

```
cd /Users/franco/Codes/flucastr/Flucastr.AI
command -v pi-coordinador                                    # /Users/franco/.local/bin/pi-coordinador
node scripts/resolver.mjs cuerpo agentes/coordinador.md | grep -c 'Antes de delegar, escribe en'   # 1
MODELO=$(node scripts/resolver.mjs modelo coordinador pi)    # openai/gpt-6.1-sol; ventana 272000
bash pruebas/fixtures/coordinador.sh "$T/fx"
# .pi/settings.json del fixture: reserveTokens 254000, keepRecentTokens 3000 (escrito con node)
# envoltorio $T/pi-compacta.sh (quita --no-session; -a --session-dir; -c si CONTINUAR=1; </dev/null)
export FLUCASTR_PI_BIN="$T/pi-compacta.sh" FLUCASTR_PI_TOPE=240 PI_SESIONES="$T/s"
cd "$T/fx"
FLUCASTR_RECORD_FILE="$T/reg1.jsonl" bash pruebas/lanzar-coordinador-pi.sh '<prompt turno 1>'      # turno1 exit=0
grep -c 'ancla-4471' definitions/STATUS.md                    # 1
CONTINUAR=1 FLUCASTR_RECORD_FILE="$T/reg2.jsonl" bash pruebas/lanzar-coordinador-pi.sh '<prompt retoma>'   # retoma exit=0
grep -c 'compaction_end' "$T/reg1.jsonl" "$T/reg2.jsonl"       # 0 y 1
bash pruebas/rapida.sh > "$T/rapida.txt" 2>&1; echo "exit=$?"    # exit=0
```

## Intento 1

El intento 1 dio **FALLA** en la condición 2 del turno 1: con 1500 tokens de margen el agente compactó 9 veces, quedó en un bucle de lectura y el turno se cortó a los 240 s sin escribir `STATUS.md`. Esa falla fue del umbral, no del diseño de la retoma. Este intento 2 usa 18000 tokens, por encima de la base del `coordinador`, y su resultado es el de este informe.
