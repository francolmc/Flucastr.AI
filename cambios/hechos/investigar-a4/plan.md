---
estado: listo
rama: docs/investigar-a4
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Informe: por qué falló A4 y qué lo bajaría

## Supuestos
- Solo documentación: un informe en `docs/investigaciones/a4-costo-revisor.md` (≤ 80 líneas). No se editan scripts ni `modelos.json`; solo se proponen cambios.
- Distinguir siempre **medido** (rollouts), **documentado** (tarifas/mecánica del proveedor), **estimado** y **opinión**.
- Rama nueva `docs/investigar-a4` desde `main` (Franco decide cuándo; el piloto `docs/piloto-kit-run` aún no se mergea).

## Datos medidos (rollouts de Codex, 2026-11-10, `~/.codex/sessions/2026/11/10/`)
Revisor `gpt-6.1-sol`, esfuerzo `low`, 3 llamadas al modelo por revisión. Tarifas Sol: 50 entrada / 2,5 en caché / 250 salida (créditos por 1M).
| Revisión | Entrada total | En caché | Entrada sin caché | Salida (razonamiento) | Créditos |
| --- | --- | --- | --- | --- | --- |
| 1 | 64.501 | 40.576 | 23.925 → 1,196 | 323 (43) → 0,081 | 1,378 |
| 2 | 60.803 | 38.528 | 22.275 → 1,114 | 163 (0) → 0,041 | 1,251 |
- Primer turno de cada revisión: 19.265 y 18.786 tokens de entrada, **0 en caché** (≈0,96 créditos solo ese prefijo). En el constructor (Luna) el 2.º arranque sí tuvo 7.168 en caché.
- **Entrada sin caché ≈ 87 % del costo; salida + razonamiento ≈ 6 %.** El razonamiento no es la causa (esfuerzo ya `low`, 43 y 0 tokens).
- Constructor `gpt-6-luna`, `medium`: 285.268 y 282.930 tokens totales, ~80–90 % en caché; 0,2264 y 0,1702 créditos.
- Se descarta la hipótesis «razonamiento caro» del informe externo; se confirma la del prefijo fijo (medido: ≈19 k, más que los 8–13 k citados).

## Estimación (no medida)
Si el prefijo de ≈19 k estuviera en caché, cada revisión costaría ≈0,4 créditos y la razón sería ≈ 2,0 (< 3). Hay que medirlo.

## Pasos
- [x] Escribir el informe con: (1) causa medida de la razón 6,6; (2) tabla de arriba; (3) qué compone el prefijo de ≈19 k: correr `codex debug prompt-input` (o equivalente) con la config de `kit-run.mjs` para el revisor y listar AGENTS.md, skills, instrucciones y plan+diff con su tamaño; (4) palancas ordenadas por ahorro estimado: perfil mínimo del revisor (`--ignore-user-config`, `--ephemeral`, sin skills ni MCP), caché caliente entre revisiones, no revisar dos veces por defectos que el plan pudo cubrir, revisión escalonada con Luna, A4 por tamaño; (5) síntesis de la evidencia externa (adjunta abajo) marcando medido/opinión; (6) qué no se sabe y 5 mediciones mínimas.
  - evidencia: `docs/investigaciones/a4-costo-revisor.md`, 74 líneas; cifras de la tabla y del prefijo verificadas en los rollouts y en `codex debug prompt-input`.
- [x] Solo lectura sobre `~/.codex/sessions/` y el repo; no ejecutar `codex exec`.
  - evidencia: lectura de `~/.codex/sessions/2026/11/10/*.jsonl` (`total_token_usage`) y `codex -m gpt-6.1-sol -c model_reasoning_effort="low" debug prompt-input` (exit 0, sin `codex exec`).

## Evidencia externa (resumen, de la investigación de Franco)
Cognition (abr 2026): revisor sin contexto compartido funciona mejor, sin costo publicado (interno). Anthropic: relectura del historial con caché; subagente nuevo paga su prefijo (≈25 k en una medición de terceros). OpenAI (dic 2025): verificar cuesta «una fracción» del generador; esfuerzo alto rinde menos en código generado. Codex `exec` trivial: 8–13 k tokens de entrada. Tarifas Sol = 20 × Luna. No existe razón revisor/constructor de referencia publicada.

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| I1 | El informe existe y es breve | `wc -l docs/investigaciones/a4-costo-revisor.md` | entre 40 y 80 líneas |
| I2 | Las cifras medidas coinciden | `grep -c "1,378\|1,251\|19.265" docs/investigaciones/a4-costo-revisor.md` | ≥ 3 |
| I3 | Separa medido de estimado | leer el informe | cada afirmación marcada |
| I4 | Prefijo desglosado | leer sección 3 | lista de componentes con tamaño o «no se pudo medir» y por qué |

## Verificación
`./verify`

## Evidencia

$ ./verify (tramo final, cola)
```
kit-run: 13 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0
```

I1: `wc -l docs/investigaciones/a4-costo-revisor.md` = 74 (entre 40 y 80).
I2: `grep -c "1,378\|1,251\|19.265" docs/investigaciones/a4-costo-revisor.md` = 6 (≥ 3).
I3 y I4: lectura del informe; cada cifra va marcada como medido, documentado, estimado u opinión, y la sección 2 desglosa el prefijo por componente en caracteres (no en tokens, con el motivo).

## Notas

- El paso 3 de la lista del informe se midió con `codex debug prompt-input` (no `codex exec`). Ese comando necesita `-c` antes del subcomando; se usó `codex -m ... -c ... debug prompt-input`.
- El `./verify` muestra un AVISO por `pruebas/comparar-openspec/` ausente en este equipo (`pruebas/` está en `.gitignore`); es un paso omitido, no un fallo.
- El 6 % de salida del plan corresponde a la revisión 1; la revisión 2 da 3 %. El informe muestra ambas.
