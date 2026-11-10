---
estado: borrador
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
- [ ] Corrida A: `codex exec` (config del revisor) con el prompt fijo «Responde solo: OK». Anotar la hora.
- [ ] Corrida B: inmediatamente después (< 1 min), mismo prompt exacto.
- [ ] Corrida C: inmediatamente después, prompt distinto («Responde solo: LISTO») para ver si el prefijo se comparte aunque cambie el final.
- [ ] Para cada corrida, leer su rollout en `~/.codex/sessions/<año>/<mes>/<día>/` (el más reciente por hora) y extraer del primer evento `token_count`: `input_tokens`, `cached_input_tokens`, `output_tokens`; y créditos con `scripts/tarifas.json`.
- [ ] Escribir la sección 6 con tabla (corrida, hora, entrada, en caché, % en caché, créditos), conclusión en una frase y, si la caché no sobrevive, qué tendría que cambiar (hipótesis, no hecho). Actualizar la sección 5 tachando la pregunta 1 de «qué no se sabe».

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| M1 | Hay 3 corridas medidas | tabla de la sección 6 | 3 filas con tokens de entrada y en caché del primer turno |
| M2 | La conclusión responde sí/no | leer la sección 6 | frase explícita sobre B y C frente a A |
| M3 | Costo contenido | suma de créditos de la tabla | ≤ 2 |
| M4 | Nada más cambió | `git status --short` | solo el informe (y el plan) |

## Verificación
`./verify`
