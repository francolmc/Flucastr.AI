---
estado: borrador
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
- Tope total: 7 corridas y **5 créditos**. Si una corrida falla, se repite una vez como máximo; si el tope se rompe, PAUSA.
- Solo lectura sobre el repo; solo se edita el informe. No se editan scripts ni `modelos.json`.
- Las esperas se hacen con `sleep` en llamadas de ≤ 8 min; una sola llamada por espera, sin sondeos.

## Alcance
`docs/investigaciones/a4-costo-revisor.md` (secciones nuevas `## 7. Medición 2: separación de tiempo` y `## 8. Medición 3: perfil mínimo`, ≤ 20 líneas cada una; tachar las preguntas correspondientes de la sección 5). Fuera: todo lo demás.

## Pasos
### Parte 1 — Separación de tiempo (4 corridas, config actual)
- [ ] T0: corrida con el prompt fijo. Anotar la hora de fin.
- [ ] T1: esperar 1 min desde el fin de T0 y correr. T2: esperar 5 min desde el fin de T1 y correr. T3: esperar 10 min desde el fin de T2 y correr.
- [ ] Tabla: corrida, separación desde la anterior, entrada, en caché, % en caché, créditos. Conclusión: a partir de qué separación cae la caché (o «no cae hasta 10 min»).

### Parte 2 — Perfil mínimo (3 corridas)
- [ ] Esperar 15 min desde T3 para que la caché de la config actual esté fría. Correr M0: igual que T0 pero con `--ignore-user-config --ephemeral -c skills.bundled.enabled=false -c skills.include_instructions=false`. Si algún flag falla, probar quitando uno a la vez y anotar cuál no funcionó; no inventar flags.
- [ ] M1: repetir M0 de inmediato (< 30 s) para ver la caché del perfil mínimo.
- [ ] Sacar `codex debug prompt-input` con el perfil mínimo (mismos flags) y anotar caracteres por componente (comparar con la tabla de la sección 2).
- [ ] Tabla: M0 y M1 frente a T0 y T1 (entrada, en caché, créditos). Conclusión en una frase: tokens del primer turno ahorrados y créditos por revisión estimados (solo estimar con datos medidos; marcar qué es estimado).
- [ ] Actualizar la sección 3 («Palancas») solo en la línea de la palanca 1 y 2 con las cifras medidas.

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
