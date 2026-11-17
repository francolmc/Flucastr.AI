# Evaluaciones

Este índice describe las evaluaciones existentes y conserva sus ubicaciones mientras se prepara la estructura `evals/`.

## Revisor de kit run

El medidor está en [`pruebas/revisor-luna/medir.mjs`](../pruebas/revisor-luna/medir.mjs). Compara tres condiciones de revisor sobre casos con defectos sembrados: S (`gpt-6.1-sol`, esfuerzo bajo), L1 (`gpt-6-luna`, esfuerzo bajo) y L2 (`gpt-6-luna`, esfuerzo medio). Los casos están en `pruebas/revisor-luna/casos/`; cada uno aporta un diff, evidencia, plan y oráculo para evaluar el veredicto.

Los resultados históricos se conservan en [`pruebas/revisor-luna/resultados.jsonl`](../pruebas/revisor-luna/resultados.jsonl). Una medición normal invoca Codex, reanuda las combinaciones ya registradas y añade sus filas a ese archivo. La autoprueba no cambia ni añade resultados históricos.

Para comprobar el flujo sin red, modelo real ni gasto, ejecuta:

```sh
node pruebas/revisor-luna/medir.mjs --autoprueba
```

La autoprueba usa un ejecutable `codex` falso, fixtures y resultados temporales, y los elimina al terminar. Comprueba el cálculo de créditos, la captura de veredictos y el límite de corridas.

## Comparación con OpenSpec

`pruebas/comparar-openspec/` no existe en este checkout; por tanto, no hay resultados de esa comparación que catalogar aquí.
