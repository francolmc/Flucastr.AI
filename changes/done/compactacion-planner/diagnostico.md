# Diagnóstico: "Autocompact is thrashing" en el planner

Estado: diagnóstico completo; plan en `plan.md`: tramo 1 (C1 y C2) aprobado el 2026-11-25; C3 aplazada.
Rama: feature/compactacion-planner (creada desde main, behind=0).

## 1. Lo que ya se sabía (docs/investigaciones/codex-compactacion.md)
- Solo Codex 0.167.0, `codex exec`, 2026-11-09. Nada medido en Claude Code ni Pi.
- Sirve `-c model_auto_compact_token_limit=<n>` en el lanzador; compacta dentro del turno.
- Con n=3000 compactó 4 veces (tras cada herramienta); entrada ~16,5k tok antes de compactar.
- `model_post_turn_compact_threshold_percent` solo compacta al final del turno; `.codex/config.toml` de proyecto no surtió efecto.
- Valor de producción `compactar_en` (100000 entonces) nunca medido en tarea real. No dice nada de thrashing.

## 2. Mediciones (wc -c)

Bytes con `wc -c`. «≈ tok» usa 3–4 bytes por token: es una estimación, no una medición.

### 2.1 Arranque de una sesión del planner

| Pieza | Bytes | Quién la controla |
| --- | --- | --- |
| `core/agents/planner.md` (instalado: 18121, más viejo) | 19046 | kit |
| `AGENTS.md` (se creía ~11 KB; son 15 KB) | 15020 | proyecto |
| Listado de skills | 32879 | kit + plugins de la persona |
| Herramientas diferidas | 11034 | conectores de la persona |
| Reglas del sandbox | 7291 | configuración |
| Listado de agentes | 6070 | kit + plugins |
| Instrucciones MCP | 3401 | conectores |

- El frontmatter de `planner.md` no declara skills: se cargan con la herramienta Skill.
- Primera llamada de la sesión: **60.100 tokens** (medido). Referenciados por `planner.md` y no cargados al arranque: `docs/practicas-por-tecnologia.md`, `docs/proyecto.md`, `scripts/*.mjs`.
- Skills bajo demanda: `plan-change` 18747, `execute-plan` 10397, `prepare-project` 7522 (+ `reference.md` 5539), `migrate-project` 5875, `design-experience` 4163, `define-project` 2980, `diagnose` 1556.

### 2.2 Dónde se define `compact_at`

`models.json`: global `100000`; `agents.planner.compact_at` `60000`; builder sin valor propio.

| Herramienta | Código | Planner | Builder |
| --- | --- | --- | --- |
| Claude Code | `adapters/claude-code/compaction.mjs` (`valorClaude`): `autoCompactWindow = compact_at + 33000`, rango 100000–1000000; no pisa un valor existente | **ignora 60000**: usa el global. Instalado `autoCompactWindow: 133000` → umbral ≈100k | ≈100k |
| Pi | `adapters/pi/compaction-plan.mjs`: `reserveTokens = ventana − compact_at` (mínimo 16384) | **ignora 60000**. Además `windows` no lista `gpt-6.1-terra` (modelo del nivel medio): se omitiría (inferido del código) | global |
| Codex | `tools/model-resolution/models.mjs` (`compactarCodex`) → `-c model_auto_compact_token_limit` | **60000** | 100000 |

El valor 60000 queda fuera del rango de Claude Code (60000 + 33000 = 93000 < 100000), así que aplicarlo ahí empeoraría el bucle.

### 2.3 Compactaciones reales (Claude Code 2.1.332, planner, claude-sonnet-5-5)

Registros de `~/.claude/projects/<este proyecto>/`; se extrajeron solo tamaños, conteos de tokens y rutas.

| Sesión | Compactaciones | Errores «thrashing» | Primera llamada tras compactar (tok) | Llamadas entre compactaciones |
| --- | --- | --- | --- | --- |
| a3cdabf2 | 9 auto | 1 | 71.097–102.971 | 7,1,3,2,9,2,3,1,2 |
| 635880a9 | 7 (6 auto) | 2 | 74.719–93.542 | 3,1,2,2,2,2,2 |

Umbral ≈100k; antes de compactar había 101k–111k. Una compactación quedó en 102.971, sobre el umbral desde la primera llamada.

Composición tras compactar (compactación 7 de a3cdabf2; primera llamada 102.971 = 31.478 de prefijo fijo en caché + 71.491 nuevos):

| Pieza re-inyectada | Bytes |
| --- | --- |
| Mensajes conservados (0–52,7 KB según la compactación) | 52687 |
| Listado de skills | 32879 |
| Archivos restaurados: `execute-plan/SKILL.md` 10897, `builder.md` 5874, `ejecutar.mjs` 4245, `verify` 3885 (+ referencia de 201 B a `inventario.md`) | 25102 |
| Resumen (9,7–29 KB según la compactación) | 21282 |
| Skill invocada `plan-change` | 18870 |
| Instrucciones (`AGENTS.md`) | 15204 |
| Herramientas diferidas, sandbox, agentes, MCP, sesión | ~28800 |

**Los archivos «releídos» los restaura Claude Code, no el planner.** `execute-plan/SKILL.md` y `builder.md` se re-inyectaron en 9 de 9 compactaciones de a3cdabf2 (7 de 7 en la otra), con a lo sumo 2 `Read` directos de cada uno en toda la sesión (hubo además lecturas por Bash: 3 de cada uno en a3cdabf2, 4–5 en la otra). `plan-change` vuelve en cada compactación posterior a invocarla (5 y 4 veces). `inventario.md` no se restaura entero: solo queda la referencia.

**Relecturas del planner** (herramienta `Read`): en a3cdabf2, `inventario.md` 13 veces (12 por rangos, 98 KB acumulados) y `builder-contract.mjs` 12 por rangos (52 KB); en 635880a9, `builder-contract.mjs` 3 lecturas completas (51 KB). Leer por rangos no evitó volver sobre lo mismo. Resultados de herramientas: hasta 118 KB entre dos compactaciones; en 635880a9, 439 de 489 KB vinieron de 28 resultados de más de 8 KB.

## 3. Las tres causas más probables

1. **El piso tras compactar casi iguala al umbral.** Umbral ≈100k; piso 71k–103k; incluso una sesión nueva parte en 60k. Quedan 0–29k tokens: 1 a 3 llamadas llenan el contexto. Es la causa directa del bucle.
2. **Re-inyección pesada y repetida.** En el peor caso: conservados 52,7 KB, listados y avisos del entorno ~61 KB, archivos restaurados 25–32 KB, resumen 10–29 KB, `plan-change` 18,9 KB y `AGENTS.md` 15,2 KB. De eso, el kit controla `plan-change`, `AGENTS.md`, `planner.md` y qué archivos se leen enteros.
3. **Lecturas grandes y repetidas.** Un documento de trabajo de 18 KB leído 13 veces y una prueba de 15,7 KB leída 3 a 12 veces. Cada resultado grande acerca la siguiente compactación y entra en los mensajes conservados.

No probado: la regla exacta con que Claude Code elige qué restaurar y qué conservar; cuánto ocupa en tokens cada pieza por separado; el efecto de las correcciones (requiere sesiones reales posteriores).

## 4. Correcciones, de menor a mayor riesgo

Ahorros calculados sobre las dos sesiones medidas; son techos, no promesas.

| # | Corrección | Ahorro estimado | Riesgo y límite | En el plan |
| --- | --- | --- | --- | --- |
| C0 | La persona usuaria desactiva plugins y conectores que no use en este proyecto | hasta ~22 KB por compactación y al arrancar (18,7 KB de skills de plugins + 3,5 KB de nombres de herramientas `mcp__`) | Sin cambios en el repo. No comprobado cuáles se pueden desactivar | No (acción suya) |
| C1 | `planner.md`: anotar hallazgos en el archivo del cambio y, tras compactar, retomar desde él sin releer fuentes ya anotadas ni archivos restaurados | hasta ~116 KB en a3cdabf2 (inventario 98→18 KB; `builder-contract.mjs` 52→16 KB), ≈13 KB por ciclo | Bajo, solo agrega texto (~0,6 KB). Ya existe «each file once per session» y no bastó. No evita la restauración de Claude Code | Sí |
| C2 | `planner.md`: filtrar o contar salidas largas (no escribirlas a archivo: el planner no gana permiso de escritura); sin lecturas completas de archivos de más de 150 líneas u 8 KB; no volcar varios archivos en un comando | exceso sobre 8000 B por resultado: 58 KB (a3cdabf2) y 215 KB (635880a9) | Bajo. Una excepción obligatoria: la revisión de planes, diffs y evidencia se lee entera, por tramos si hace falta | Sí |
| C3 | `models.json`: `profiles.claude-code.compact_at: 150000` (→ `autoCompactWindow` 183000, umbral ≈150k) | 0 bytes; margen +50k tokens (de 0–29k a ≈47k–79k) | Más tokens por llamada (hasta ≈150k en vez de 100k). Afecta a planner y builder en Claude Code; Pi y Codex no cambian. Reversible. Un valor ya instalado no se pisa | Sí |
| C4 | `AGENTS.md`: pasar el detalle de «Cómo funciona» (12,5 KB) a `docs/`, dejando una línea y puntero por tema; «Reglas» y «Límites» intactas | ~8 KB por compactación, arranque y subagente | Medio: reglas que hoy están siempre en contexto pasan a depender de que se lean | No (cambio aparte) |
| C5 | Partir `plan-change` en núcleo + `reference.md` | plantilla 6,3 KB; reglas 9,2 KB | Alto: `tests/builder-contract.mjs` lee la plantilla dentro de `SKILL.md` (habría que alterar un test de aceptación) y `tools/verify` busca cadenas en las reglas. Lo movido además podría restaurarse como archivo | No (descartada) |

Descartada: aplicar en Claude Code el `compact_at: 60000` del planner; baja el umbral por debajo del piso medido.

**Qué ataca cada causa:** causa 1 → C3 (directa) y C0; causa 2 → C0, C4; causa 3 → C1, C2.

Ajuste al redactar el plan: C1 y C2 juntas añaden ~1,1 KB a `planner.md` (texto en `bloque.md`), no ~0,6 KB.

## Decisión (2026-11-25) y siguientes candidatos

- Aprobado: solo el tramo 1 (C1 y C2). No se sube el umbral a 150 k por ahora: solo retrasa el bucle y sube el costo por llamada.
- Si el bucle persiste tras el tramo 1, los siguientes candidatos, en este orden:
  1. Partir `plan-change` en un núcleo corto y un `reference.md` bajo demanda. Condición ya vista (C5): `tests/builder-contract.mjs` lee la plantilla y «Before Requesting Approval» dentro de `SKILL.md`, y `tools/verify/` busca textos de las reglas; ese plan debe conservarlos en el núcleo o declarar y justificar el cambio de pruebas. Sin medir cuánto se puede mover bajo esa condición.
  2. Subir el umbral de Claude Code (C3: `profiles.claude-code.compact_at`).

