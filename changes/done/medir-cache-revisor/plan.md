---
estado: listo
rama: docs/medir-cache-revisor
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Medir si la caché del revisor sobrevive entre revisiones (medición 1 de A4)

## Supuestos
- Pregunta: ¿el primer turno de una segunda corrida de `codex exec` con Sol llega con `cached_input_tokens` > 0 cuando el prefijo es el mismo? En el piloto, las dos revisiones (separadas ≈2,5 min) llegaron con 0 en caché. Ver `docs/investigaciones/a4-costo-revisor.md`, secciones 1 y 5.
- Se mide **solo el prefijo**, con un prompt trivial, para no gastar una revisión real: ≈1 crédito la primera corrida, ≈0,1 las siguientes. Tope total: 3 corridas (≈1,5 créditos). Si una corrida falla, no se repite más de una vez.
- Misma configuración que el revisor real: leer `comando()` en `scripts/kit-run.mjs` (modelo y esfuerzo de `modelos.json` vía `scripts/resolver.mjs`, `--sandbox read-only`, `-C <raíz>`, sin `--output-schema`).
- Solo lectura sobre el repo; lo único que se edita es el informe. No se editan scripts ni `modelos.json`.

## Alcance
`docs/investigaciones/a4-costo-revisor.md` (nueva sección `## 6. Medición 1: caché entre revisiones`, ≤ 25 líneas). Fuera: todo lo demás.

## Pasos
- [x] Corrida A: `codex exec` (config del revisor) con el prompt fijo «Responde solo: OK». Anotar la hora.
  - evidencia: `echo "Responde solo: OK" | codex exec --sandbox read-only -m gpt-6.1-sol -c 'model_reasoning_effort="low"' -C <raíz> -`, 02:38:06 (UTC-3), exit 0; sesión 01a1c3f6-b77b-75c3-9140-4749efc63714
- [x] Corrida B: inmediatamente después (< 1 min), mismo prompt exacto.
  - evidencia: mismo comando, 02:38:17, exit 0; sesión 01a1c3f6-e034-7623-ad99-40efcf762ae2
- [x] Corrida C: inmediatamente después, prompt distinto («Responde solo: LISTO») para ver si el prefijo se comparte aunque cambie el final.
  - evidencia: mismo comando con «Responde solo: LISTO», 02:38:24, exit 0; sesión 01a1c3f6-fa0f-7363-8db0-689688e35b87
- [x] Para cada corrida, leer su rollout en `~/.codex/sessions/<año>/<mes>/<día>/` (el más reciente por hora) y extraer del primer evento `token_count`: `input_tokens`, `cached_input_tokens`, `output_tokens`; y créditos con `scripts/tarifas.json`.
  - evidencia: `~/.codex/sessions/2026/11/10/rollout-2026-11-10T02-38-{08,18,25}-*.jsonl`, primer `token_count`: A 17.756/0/5; B 18.299/7.168/5; C 18.300/7.168/6; créditos 0,889 / 0,576 / 0,576 (fórmula de `scripts/uso.mjs`)
- [x] Escribir la sección 6 con tabla (corrida, hora, entrada, en caché, % en caché, créditos), conclusión en una frase y, si la caché no sobrevive, qué tendría que cambiar (hipótesis, no hecho). Actualizar la sección 5 tachando la pregunta 1 de «qué no se sabe».
  - evidencia: `docs/investigaciones/a4-costo-revisor.md` secciones 5 y 6 (sección 6 de 19 líneas)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| M1 | Hay 3 corridas medidas | tabla de la sección 6 | 3 filas con tokens de entrada y en caché del primer turno |
| M2 | La conclusión responde sí/no | leer la sección 6 | frase explícita sobre B y C frente a A |
| M3 | Costo contenido | suma de créditos de la tabla | ≤ 2 |
| M4 | Nada más cambió | `git status --short` | solo el informe (y el plan) |

## Verificación
`./verify`

## Evidencia
- `./verify`: `VERIFY OK`, exit 0 (incluye 19 de 19 pruebas del medidor y 13 casos de kit run).
- Aceptación:
  - M1 cumple: 3 filas con entrada y caché (sección 6).
  - M2 cumple: la conclusión dice «sí» y compara B y C con A.
  - M3 **no cumple**: suma 2,041 créditos (0,889 + 0,576 + 0,576), por encima de ≤ 2.
  - M4 cumple: `git status --short` muestra solo `cambios/medir-cache-revisor/plan.md` y `docs/investigaciones/a4-costo-revisor.md`.

## Notas
- Pasé de `aprobado` a `parcial` sin poner antes `en curso`; el paso de cambio de estado no quedó registrado al inicio.
- Las corridas tardaron 7 s entre sí, no «< 1 min» como pedía el paso B; cumple el sentido (seguidas), no la cota exacta sobrante.
- Los créditos estimados en Supuestos (≈1 y ≈0,1) no se cumplieron: las corridas B y C costaron ≈0,58 cada una porque solo 7.168 tokens del prefijo entran en caché.
- PAUSA `motivo=alcance`: el único punto abierto es M3. Opciones: (1) aceptar 2,04 créditos como costo de la medición y cerrar (recomendada: el exceso es 2 %, y los datos están completos); (2) cambiar M3 a ≤ 2,1 en el plan y cerrar; (3) no cerrar el informe y decidir después si se repite la medición.
- Decisión del principal (2026-11-10): M3 se acepta con 2,041 créditos; el tope de 2 era una estimación mía y el exceso es del 2 %. El resultado es completo (sí, la caché sobrevive: 7.168 tokens en B y C).
