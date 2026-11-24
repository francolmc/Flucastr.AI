# Progreso en vivo: costo de la regla del builder

Medición del tramo 7 de `changes/progreso-en-vivo/` (A4). Cubre solo la capa que el builder lee: la línea de `core/agents/builder.md`, la de `core/skills/execute-plan/SKILL.md` y cada llamada a `kit-nota`.

## Tokens de la regla

- Medido por tamaño, no por tokenizador: `builder.md` 158 caracteres y `execute-plan/SKILL.md` 168 caracteres (326 en total). Con la aproximación de 4 caracteres por token del inglés, son unos 80 tokens de prompt que el builder lee una vez por sesión. El plan estimaba unos 45; la diferencia se anota aquí y no cambia la decisión.
- La regla de `planner.md` (373 caracteres, unos 95 tokens) se lee en la sesión del planner, no en la del builder; no entra en esta capa.
- Por llamada: `kit-nota` anexa una línea JSON. El plan estimaba unos 75 tokens por llamada; no se volvió a medir.

## Sesiones reales del builder

- Tokens por sesión del builder: **no medido.** `node scripts/usage.mjs --sessions` no separa las sesiones del builder. Los subagentes de Claude Code no suman en su fila, y las ventanas `codex-builder` y `pi-builder` no quedan etiquetadas en el informe. Por eso no hay cifra de tokens por sesión del builder sobre al menos tres sesiones.
- Referencia de contexto, no del builder: en la corrida del 2026-11-23 el informe listó 126 filas de sesiones de Claude Code, Codex y Pi; la mediana de `contexto_mediana` fue de 43.621 tokens. Con 80 tokens por sesión, la regla pesa unas 0,2 % del contexto mediano por sesión. Es una aproximación, no una medición del builder.

## Recomendación

- **Incluir solo `Blocked:`** (`kit-nota <plan> blocked "<causa>"`), como ya se decidió en el plan.
- **`Doing:` queda fuera por ahora.** Solo se incluiría si su costo supera el 2 % del costo del tramo. Sin sesiones del builder medidas, ese umbral no se puede comprobar; la referencia de arriba (unas 0,2 % del contexto) sugiere que no lo supera, pero es una estimación.
- Para decidir `Doing:` con datos, hace falta etiquetar las sesiones del builder en el informe de `usage.mjs` (hoy no hay forma de separarlas) y medir al menos tres.
