# Pi: el `coordinador` que cruza una compactación real (F19, task-15)

Corrida con modelo, 2026-10-31, en Pi. Se fuerza una compactación con un umbral artificial puesto solo en el `.pi/settings.json` de un fixture temporal (`mktemp -d`). `~/.pi/agent/settings.json` no se tocó: la prueba solo escribe el `.pi/settings.json` del fixture, y no se reinstaló nada. El umbral es artificial: 1500 tokens de margen (ventana 272000 − `reserveTokens` 270500).

**Veredicto: FALLA** (en la condición 2 del turno 1). Las condiciones 3 y 4 no se evalúan porque el turno de retoma no se corrió. La causa observada: con un umbral tan bajo el agente compacta en cada paso y no llega a escribir `STATUS.md` antes del tope de tiempo. No se clasifica como falla de infraestructura, por lo que no se usó una tercera invocación.

## Qué se corrió

- Modelo (`node scripts/resolver.mjs modelo coordinador pi`): `openai/gpt-6.1-sol`, ventana declarada 272000 en `modelos.json`.
- Fixture: `pruebas/fixtures/coordinador.sh "$T/fx"` (repo demo; `definitions/STATUS.md` mínimo, sin «Paso actual» ni «Espera a Franco»).
- `.pi/settings.json` del fixture: `{"compaction":{"modelOverrides":{"openai/gpt-6.1-sol":{"reserveTokens":270500,"keepRecentTokens":100}}}}`.
- Envoltorio `$T/pi-compacta.sh`: quita `--no-session`, añade `-a --session-dir "$PI_SESIONES"` y, con `CONTINUAR=1`, `-c`; redirige la entrada desde `/dev/null`.
- Lanzador: `pruebas/lanzar-coordinador-pi.sh` con `FLUCASTR_PI_BIN="$T/pi-compacta.sh"`, `FLUCASTR_PI_TOPE=240`, `FLUCASTR_RECORD_FILE="$T/reg1.jsonl"`.

## Invocaciones con modelo

Dos invocaciones permitidas; se usó **1**.

1. **Turno 1** (prompt literal de la tarea). Resultado: `exit=143`, «Pi no terminó en 240 s; se cortó la corrida». El registro tiene 332 líneas.
2. **Turno de retoma**: no se corrió. Sin un turno 1 completado, `STATUS.md` no tiene `ancla-4471`, y la retoma no tendría nada que verificar. Repetir el turno 1 habría sido un tercer intento sin causa de infraestructura, fuera del tope.

## Lo que muestra el registro del turno 1

- Eventos: `turn_start` 11, `tool_execution_start` 11 (todas `read`), `compaction_start` 10, `compaction_end` 9, `reason=threshold`.
- Tras cada compactación el agente volvió a leer `definitions/STATUS.md` y `definitions/BACKLOG.md`, y a intentar `features/`, que devolvió `EISDIR`. No hubo ninguna escritura en `STATUS.md` y no se produjo respuesta final.
- Conclusión: con 1500 tokens de margen, cada paso dispara una compactación y el agente queda en bucle de lectura; el tope de 240 s lo corta antes de llegar a escribir. Es un efecto del umbral artificial, no una propiedad verificada de Pi en uso real.

## Condiciones medidas

| # | Condición | Valor |
| --- | --- | --- |
| 1 | Al menos un `compaction_end` en `reg1.jsonl` o `reg2.jsonl` | Sí (9 en `reg1.jsonl`) |
| 2 | `definitions/STATUS.md` del fixture contiene `ancla-4471` tras el turno 1 | No (0 apariciones) |
| 3 | `reg2.jsonl` tiene un `tool_execution_start` que lee `STATUS.md` | No evaluada (no hubo turno de retoma) |
| 4 | El texto final de la retoma contiene `ancla-4471` | No evaluada (no hubo turno de retoma) |

Según la definición de la tarea: hubo compactación y falta (2), por lo tanto **FALLA**. Esta falla es del turno 1 con este umbral; no prueba que el coordinador no retome desde `STATUS.md` en uso normal.

## Limitaciones

- El umbral de 1500 tokens compacta casi en cada turno. Esta corrida no demuestra que 100 k sea un umbral adecuado, ni que el retomar funcione con un umbral realista.
- La prueba no quedó concluyente sobre la retoma: el turno de retoma no se ejecutó.
- Canario del fixture: su valor no aparece en este informe ni se publicó ningún registro.
- Registros (`reg1.jsonl`) y sesión quedan en el directorio temporal, fuera del repo, sin publicar.

## Pruebas del repo

`bash pruebas/rapida.sh` con el HOME real (`/Users/franco`): `tests 277`, `pass 277`, `fail 0`, `cancelled 0`; «rapida: 27 archivos en 17 s (tope 30 s)». La salida se vio por `tail -60`; el resumen global dice `fail 0`. No se comprobó por separado que `registro.e2e.test.mjs` aparezca en esa salida recortada, y el código de salida no se capturó por la tubería.
