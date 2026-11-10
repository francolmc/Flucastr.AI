# Revisor Luna frente a Sol en `kit run`

Fecha: 2026-11-10. Rama `feature/probar-revisor-luna`. Plan `cambios/probar-revisor-luna/plan.md`, tramo 2.

## Qué se midió
- 12 casos fijos en `pruebas/revisor-luna/casos/`: 6 con defecto sembrado (c01–c06) y 6 limpios (c07–c12).
- Condiciones: **S** = `gpt-6.1-sol` `low` (revisor actual), **L1** = `gpt-6-luna` `low`, **L2** = `gpt-6-luna` `medium`. Mismo prompt y esquema que `scripts/kit-run.mjs`.
- Acierto: el veredicto coincide con el oráculo y, en los sembrados, algún defecto contiene una palabra clave. Sin LLM-juez.
- Créditos: último `token_count` con `info` de cada rollout nuevo, a `scripts/tarifas.json`.

## Problema del gasto en S (medido)
S se corrió dos veces en paralelo por error (dos procesos del runner). Hubo 24 filas de S y 32,95 créditos gastados. Se conservó una fila por caso (la primera). Los créditos de esas 12 filas no son fiables (rollouts mezclados), así que solo se usa su **detección**. Su **costo** sale de tres corridas limpias nuevas (c01, c07, c11), que se marcaron `costo_limpio: true`.

## Resultados (medido)

| Condición | Sembrados detectados (de 6) | Falsas alarmas (de 6 limpios) | Costo medio por caso (créditos) |
| --- | --- | --- | --- |
| S | 6 | 1 (c11) | 0,574 (3 corridas limpias) |
| L1 | 5 (falla c05) | 1 (c12) | 0,049 (12 corridas) |
| L2 | 4 (fallan c01 y c05) | 1 (c11) | 0,052 (12 corridas) |

Notas de los casos: L1 devolvió PAUSA en c11 (no cuenta como falsa alarma). c05 es un fallo de palabra clave en L1 y L2: el veredicto fue DEVUELTO, pero el texto no contenía la palabra del oráculo.

## Regla fijada de antemano (aplicada)
Luna es viable si detecta ≥ S − 1, tiene ≤ falsas alarmas de S + 1 y su costo medio es ≤ 25 % del de S (0,574 × 0,25 = 0,143).

- **L1:** detecta 5 ≥ 5 ✔; falsas alarmas 1 ≤ 2 ✔; costo 0,049 ≤ 0,143 ✔. **Viable según la regla.**
- **L2:** detecta 4 ≥ 5 ✘. **No viable.**

## Veredicto
Según la regla fijada, **gpt-6-luna en `low` (L1) es viable** como revisor. L2 no lo es. Con eso no basta para cambiar el revisor: la base es pequeña (6 sembrados, una corrida por caso, costo de S sobre 3 casos) y c05 podría ser un fallo del oráculo y no del modelo. Antes de adoptarlo haría falta repetir las corridas.

## Gasto (medido)
- Total gastado del proyecto: ≈35,9 créditos (32,95 de las 24 filas de S más 2,9 de las 15 corridas nuevas).
- Tope del relanzamiento: 25,01 (filas conservadas de S, 15,01, más 10). Gasto acumulado del runner: 17,94.

## Limitaciones (opinión)
- Una sola corrida por caso y condición; sin medir varianza.
- Los sembrados son 6 y los limpios 6: con ese tamaño, un caso cambia el resultado.
- La palabra clave del oráculo puede rechazar una detección correcta (c05).
- Sol gastó de más por el paralelismo; el informe no lo corrige.
