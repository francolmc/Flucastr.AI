# Costos y calibración de cuota (Codex)

Informe del medidor `scripts/uso.mjs`, tramo 2 de `cambios/medidor-costos/plan.md`. Datos de los logs locales de Codex (`~/.codex/sessions`) el 2026-11-08, con eventos hasta el 2026-11-09 01:44 UTC. Los logs siguen creciendo mientras se trabaja, así que las cifras son de ese momento.

Reproducir:

```
node scripts/uso.mjs --herramienta codex --desde 2026-11-01 --json
```

Se calcula tokens y puntos de cuota semanal. Desde el cambio `espera-unica`, `--sesiones` añade créditos estimados por sesión (con `scripts/tarifas.json`) y sondeos; ver «Créditos y espera» más abajo. No se calcula dinero. Solo Codex tiene cuota en este medidor: Claude Code y Pi no se calibran aquí.

## Uso desde 2026-11-01 (todos los proyectos)

Día = fecha UTC del primer evento de cada sesión.

| fecha | sesiones | llamadas | salida |
| --- | --- | --- | --- |
| 2026-11-01 | 1 | 5 | 1884 |
| 2026-11-03 | 1 | 1 | 14 |
| 2026-11-04 | 1 | 8 | 1268 |
| 2026-11-05 | 1 | 15 | 3255 |
| 2026-11-08 | 13 | 1383 | 357380 |
| 2026-11-09 | 1 | 224 | 78000 |

Por modelo, sumando todos los días:

| modelo | sesiones | llamadas | entrada | caché leída | salida |
| --- | --- | --- | --- | --- | --- |
| gpt-6-luna | 13 | 926 | 1574643 | 104747776 | 300611 |
| gpt-6.1-sol | 5 | 710 | 698994 | 70482304 | 141190 |

«Entrada» excluye lo leído de caché. El 2026-11-08 concentra casi todo el uso: 13 sesiones, la mayoría en paralelo.

## Calibración de cuota

Solo cuentan sesiones exclusivas: su intervalo primer-último evento no se cruza con otra sesión de Codex. También se descartan las sesiones donde el porcentaje de cuota baja, porque eso es un reinicio. `puntos` = porcentaje final menos inicial de la cuota secundaria; `tokens` = `total_tokens` final de la sesión.

| modelo | sesiones exclusivas | tokens | puntos | puntos por millón de tokens |
| --- | --- | --- | --- | --- |
| gpt-6-luna | 4 | 587306 | 0 | 0,00 (no informativo) |
| gpt-6.1-sol | 0 | - | - | sin muestra |

gpt-6-luna tiene 4 sesiones exclusivas, menos de 5, así que el medidor avisa «muestra pequeña». gpt-6.1-sol no tiene ninguna. Con esta muestra no hay una tabla de puntos por millón de tokens que sirva para decidir.

## Hallazgos

1. **La concurrencia deja casi sin muestra.** El 2026-11-08 hubo muchas sesiones solapadas. La exclusividad deja solo 4 sesiones de gpt-6-luna en todo el rango y ninguna de gpt-6.1-sol. Para calibrar hace falta trabajo en serie: una sesión de Codex a la vez, en un bloque donde no haya otra corriendo.
2. **`used_percent` avanza en pasos de 1 punto.** En los eventos revisados el valor es entero. Una sesión que no cambia el porcentaje da 0 aunque haya consumido cientos de miles de tokens; por ejemplo, la sesión de Memory-AI que empezó 2026-11-08 15:48 UTC (15618 tokens) quedó en 91 → 91. Cada sesión tiene un error de hasta ±1 punto, y un 0 no significa que la sesión no costó nada.
3. **La cuota se reinicia dentro del día.** Entre las 22:07 y las 23:00 UTC del 2026-11-08 el porcentaje bajó de 97 a 1. Dos sesiones de Memory-AI cruzan ese reinicio (22:07 de gpt-6.1-sol, de 97 a 6; 22:14 de gpt-6-luna, de 98 a 4). Quedan fuera por bajada y también por cruce, así que con estos datos el control de bajada no cambia el resultado. Sin ese control, una sesión exclusiva que cruzara un reinicio restaría puntos; eso lo prueba el caso A6b del fixture.

## Recomendación para `modelos.json` (sugerencia, no aplicada)

No cambiar niveles ni esfuerzos todavía. Los datos de cuota de hoy no alcanzan para comparar modelos. Para decidir hace falta:

- Al menos 5 sesiones exclusivas por modelo con variación de cuota mayor que 0. Eso se consigue corriendo Codex en serie, un bloque de trabajo a la vez.
- Repetir el informe con esos datos. Si la tabla de puntos por millón de tokens muestra una diferencia clara entre gpt-6-luna y gpt-6.1-sol, esa diferencia decide el cambio; si no, `modelos.json` queda como está.

Franco aprueba cualquier cambio en `modelos.json` (tramo 3).

## Límites

- Solo Codex. Claude Code y Pi no tienen cuota en este medidor.
- El día es UTC; por eso un bloque de trabajo de la noche chilena puede caer en el día siguiente.
- Un punto de cuota equivale a un porcentaje entero de la cuota secundaria. Con muestras cortas el error relativo es grande.

## Créditos y espera

`node scripts/uso.mjs --sesiones --herramienta codex --json` da por sesión `creditos` y `sondeos`.

- `creditos`: tokens sin caché × entrada, más caché leída × entrada en caché, más salida × salida, todo por millón y según `scripts/tarifas.json` (fuente: `learn.chatgpt.com/codex/pricing`, fecha 2026-11-09). Es una estimación con las tarifas guardadas en ese archivo; si la fuente cambia, se actualiza el archivo. Sin tarifa para el modelo, `creditos` es `null`, no 0. Pi usa la misma tabla; Claude Code no tiene tarifas aquí, así que `null`.
- `sondeos`: llamadas de shell con `sleep`, `tail` o `watch`, contadas una vez cada una. Es una aproximación: no separa «consultas de estado» de otros usos de `tail`. Claude Code no lo mide (`null`).
- Regla de trabajo: en las sesiones de Codex de 8 y 9 de noviembre, unos 1,2 créditos equivalían a un punto de la ventana de 5 horas. Las esperas (`wait_agent` con 10 a 60 s y bucles de `tail` y `sleep`) fueron alrededor de 46 % de los créditos del principal y 31 % de las llamadas de `luna`, según el registro de esa fecha.
- Antes y después: el antes es ese registro. El después se mide con el mismo medidor en sesiones nuevas, comparando `creditos` y `sondeos` por sesión; hasta que haya esas sesiones, no hay cifra de ahorro. No se estima sin datos.
- Límite: la tabla de tarifas y la regla de 1,2 créditos por punto son una lectura del registro local; no es facturación.
