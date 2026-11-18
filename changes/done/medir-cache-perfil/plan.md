---
estado: listo
rama: docs/medir-cache-perfil
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Medir la caché por separación de tiempo y el perfil mínimo del revisor

## Supuestos
- Continúa `docs/investigaciones/a4-costo-revisor.md`, sección 6: con corridas a 7 s, 7.168 de ≈18 k tokens llegan en caché (39 %); el piloto, a ≈2,5 min, tuvo 0. Dos preguntas: (1) ¿desde qué separación se pierde la caché? (2) ¿cuánto baja el prefijo con un perfil mínimo?
- Mismo método de la sección 6: `codex exec` con la config del revisor (`gpt-6.1-sol`, esfuerzo `low`, `--sandbox read-only`, `-C` raíz, de `modelos.json` vía `scripts/resolver.mjs` y `comando()` de `scripts/kit-run.mjs`), prompt trivial «Responde solo: OK», primer evento `token_count` del rollout en `~/.codex/sessions/`, créditos con `scripts/tarifas.json`.
- Tope total: 8 corridas (ampliado de 7 por el principal el 2026-11-10 para repetir M0 con `--json`) y **5 créditos**. Si una corrida falla, se repite una vez como máximo; si el tope se rompe, PAUSA.
- Solo lectura sobre el repo; solo se edita el informe. No se editan scripts ni `modelos.json`.
- Las esperas se hacen con `sleep` en llamadas de ≤ 8 min; una sola llamada por espera, sin sondeos.

## Alcance
`docs/investigaciones/a4-costo-revisor.md` (secciones nuevas `## 7. Medición 2: separación de tiempo` y `## 8. Medición 3: perfil mínimo`, ≤ 20 líneas cada una; tachar las preguntas correspondientes de la sección 5). Fuera: todo lo demás.

## Pasos
### Parte 1 — Separación de tiempo (4 corridas, config actual)
- [x] T0: corrida con el prompt fijo. Anotar la hora de fin.
- [x] T1: esperar 1 min desde el fin de T0 y correr. T2: esperar 5 min desde el fin de T1 y correr. T3: esperar 10 min desde el fin de T2 y correr.
- [x] Tabla: corrida, separación desde la anterior, entrada, en caché, % en caché, créditos. Conclusión: a partir de qué separación cae la caché (o «no cae hasta 10 min»).

### Parte 2 — Perfil mínimo (3 corridas)
- [x] Esperar 15 min desde T3 para que la caché de la config actual esté fría. Correr M0: igual que T0 pero con `--ignore-user-config --ephemeral -c skills.bundled.enabled=false -c skills.include_instructions=false`. Si algún flag falla, probar quitando uno a la vez y anotar cuál no funcionó; no inventar flags.
  - evidencia: M0 a las 03:18:45–51 (T3 terminó 03:03:38), exit 0; ver *Evidencia*.
- [x] M1: repetir M0 de inmediato (< 30 s) para ver la caché del perfil mínimo.
  - evidencia: M1 a las 03:19:28, con `--json`, `input_tokens` 16.370 y `cached_input_tokens` 7.168, exit 0; ver *Evidencia*.
- [x] Sacar `codex debug prompt-input` con el perfil mínimo (mismos flags) y anotar caracteres por componente (comparar con la tabla de la sección 2).
  - evidencia: `--ignore-user-config` y `--ephemeral` no los acepta `prompt-input` (error «unexpected argument»); con solo los dos `-c` salió 85.748 → 79.884 caracteres (sección 8). `-C` tampoco lo acepta; se corrió desde la raíz.
- [x] Tabla: M0 y M1 frente a T0 y T1 (entrada, en caché, créditos). Conclusión en una frase: tokens del primer turno ahorrados y créditos por revisión estimados (solo estimar con datos medidos; marcar qué es estimado).
  - evidencia: `docs/investigaciones/a4-costo-revisor.md`, sección 8, tabla y conclusión.
- [x] Actualizar la sección 3 («Palancas») solo en la línea de la palanca 1 y 2 con las cifras medidas.
  - evidencia: `docs/investigaciones/a4-costo-revisor.md`, sección 3, líneas 1 y 2.

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| P1 | Parte 1 medida | tabla de la sección 7 | 4 filas con separación, entrada y caché |
| P2 | Parte 2 medida | tabla de la sección 8 | 2 filas M0 y M1 y la comparación con T0/T1 |
| P3 | Conclusiones sí/no | leer 7 y 8 | frase explícita en cada una |
| P4 | Costo contenido | suma de créditos de las dos tablas | ≤ 5 |
| P5 | Nada más cambió | `git status --short` | solo el informe y el plan |

## Verificación
`./verify`

## Evidencia
- Parte 1 (`docs/investigaciones/a4-costo-revisor.md`, sección 7): T0 02:47:20–27, rollout `rollout-2026-11-10T02-47-20-01a1c3ff-2607-7973-99f0-f3726110de70.jsonl`, entrada 17.756, caché 7.168; T1 02:48:27, entrada 18.299, caché 0; T2 02:53:32, entrada 18.299, caché 0; T3 03:03:38, entrada 18.299, caché 0. `codex exec --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="low" -C <raíz> -` con «Responde solo: OK», exit 0 en las cuatro.
- Parte 2, M0 (perfil mínimo, sin `--json`): `codex exec … --ignore-user-config --ephemeral -c skills.bundled.enabled=false -c skills.include_instructions=false`, exit 0, 03:18:45–51. Con `--ephemeral` no se escribe rollout, así que no hay desglose de caché; la línea `tokens used` de stderr dice 3.447.
- Parte 2, M0b y M1 (mismos flags más `--json`): `turn.completed` con `input_tokens` 16.370, `cached_input_tokens` 7.168, `output_tokens` 5; M0b a las 03:19:23 y M1 a las 03:19:28, exit 0 en ambas.
- Verificación final: `$ ./verify` (una corrida), últimas líneas reales:
  ```
  ok 13: pruebas de kit run pasaron con los CLIs simulados
  VERIFY OK
  ```
  exit 0.
- Aceptación P5: `git status --short` muestra solo `M cambios/medir-cache-perfil/plan.md` y `M docs/investigaciones/a4-costo-revisor.md`.
- Parte 2, M0c (decisión del principal): mismos flags que M0b, con `--json`, `codex exec --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort="low" -C <raíz> --json --ignore-user-config --ephemeral -c skills.bundled.enabled=false -c skills.include_instructions=false -`, 03:20:44–48, exit 0; `turn.completed` con `input_tokens` 16.370, `cached_input_tokens` 7.168, `output_tokens` 5. Coincide con M0b y M1.
- Tope: 8 corridas usadas (T0–T3, M0, M0b, M1, M0c) de 8. Créditos: parte 1, 3,297; M0 ≤ 0,173 (sin caché conocida, cota superior); M0b 0,479; M1 0,479; M0c 0,479. Suma ≈ 4,91 ≤ 5. `codex debug prompt-input` no es corrida (no llama al modelo).

## Notas
- Contradicción sin resolver: M0 (sin `--json`) reporta 3.447 tokens totales y M0b (con `--json`, mismos flags) reporta 16.370 de entrada con 7.168 en caché. No sé cuál es el perfil mínimo real; no reconcilié ambas lecturas y no escribí la sección 8.
- T3 se hizo en dos esperas de ≤8 min (la plantilla pedía «una sola llamada por espera»); el tiempo entre corridas se midió con la hora de fin de cada una.
- M1 no fue «< 30 s» desde M0 (hubo un monitor de por medio); se corrió 5 s después de M0b, que es la comparación válida.
- T0 no se guardó su stderr; los datos de T0 vienen del rollout.
- Cerrado por el constructor (2026-11-10): M0c confirmó 16.370 de entrada con `--json`; sección 8 escrita (tabla, conclusión, sin reconciliar la cifra de stderr 3.447); palancas 1 y 2 actualizadas; sección 5 tachada en lo respondido.
- Decisión del principal (2026-11-10): M0 sin `--json` (3.447 «tokens used», sin rollout por `--ephemeral`) no es comparable con M0b/M1 (16.370 de entrada, 7.168 en caché, con `--json`). Corrida extra **M0c**: mismos flags que M0b, con `--json`, para confirmar la cifra; tope 8 corridas. Con M0c, cerrar la sección 8: si M0c coincide con M0b/M1, el perfil mínimo ahorra ≈11 %; si no, marcar no concluyente. No repetir más.
