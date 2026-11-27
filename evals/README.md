# Evaluaciones

Este índice describe las evaluaciones existentes y conserva sus ubicaciones mientras se prepara la estructura `evals/`.

## Revisor de kit run

El medidor está en [`tests/luna-reviewer/measure.mjs`](../tests/luna-reviewer/measure.mjs). Compara tres condiciones de revisor sobre casos con defectos sembrados: S (`gpt-6.1-sol`, esfuerzo bajo), L1 (`gpt-6-luna`, esfuerzo bajo) y L2 (`gpt-6-luna`, esfuerzo medio). Los casos están en `tests/luna-reviewer/casos/`; cada uno aporta un diff, evidencia, plan y oráculo para evaluar el veredicto.

Los resultados históricos se conservan en [`tests/luna-reviewer/resultados.jsonl`](../tests/luna-reviewer/resultados.jsonl). Una medición normal invoca Codex, reanuda las combinaciones ya registradas y añade sus filas a ese archivo. La autoprueba no cambia ni añade resultados históricos.

Para comprobar el flujo sin red, modelo real ni gasto, ejecuta:

```sh
node tests/luna-reviewer/measure.mjs --autoprueba
```

La autoprueba usa un ejecutable `codex` falso, fixtures y resultados temporales, y los elimina al terminar. Comprueba el cálculo de créditos, la captura de veredictos y el límite de corridas.

## Comparación con OpenSpec

`pruebas/comparar-openspec/` no existe en este checkout; por tanto, no hay resultados de esa comparación que catalogar aquí.

## Piloto de arquitectura de cambios

El [piloto offline](arquitectura-cambios/README.md) contiene cuatro casos y tres presentaciones de contexto para una comparación futura con modelos pequeños. Su autoprueba valida los oráculos y controles sintéticos, pero no ejecuta modelos ni mide qué formato funciona mejor.

## Banco del builder

El [banco del builder](builder/README.md) calibra un corpus de tramos históricos, corre una variante con semilla fija y compara dos corridas pareadas. Sus pruebas (`tests/evals-builder/`) no llaman a Codex ni a la red y forman parte de `./verify`.
