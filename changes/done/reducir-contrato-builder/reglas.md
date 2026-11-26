# Destino de cada regla y tamaños

IDs y texto de cada regla: [inventario.md](inventario.md) §2. B = `core/agents/builder.md`; S = `core/skills/execute-plan/SKILL.md`.

## Tamaños

«Después, meta» es la estimación previa al trabajo; «Después, real» es `wc -c` sobre el árbol final (tramo 5). Sin tokenizador local: se dan 3 y 4 bytes por token; las cifras reales se redondean al entero.

| Archivo | Antes (B) | tok ÷4 / ÷3 | Después, meta (B) | tok ÷4 / ÷3 | Después, real (B) | tok ÷4 / ÷3 |
|---|---|---|---|---|---|---|
| `builder.md` | 5 470 | 1 368 / 1 824 | ≤ 4 000 | 1 000 / 1 334 | 2 753 | 688 / 918 |
| `execute-plan/SKILL.md` | 10 397 | 2 600 / 3 466 | ≤ 9 500 | 2 375 / 3 167 | 10 514 | 2 629 / 3 505 |
| **Total** | **15 867** | **3 967 / 5 289** | **≤ 13 500** | **3 375 / 4 500** | **13 267** | **3 317 / 4 422** |

Por sección, antes (bytes):

| `builder.md` | B | `SKILL.md` | B |
|---|---|---|---|
| cabecera e identidad | 734 | cabecera | 240 |
| Limits | 4 037 | Before starting | 1 417 |
| Return | 699 | Segment | 2 898 |
| | | Execution loop | 2 578 |
| | | Final Verification | 1 170 |
| | | Counting, context, pausing | 1 573 |
| | | Evidence | 325 |
| | | When Done | 196 |

Resultado: la skill quedó en 10 514 B, por encima de su meta de 9 500 B (1 014 B más). La prueba `tests/context-size/sizes.test.mjs` exige solo la suma: 13 267 B, margen de 233 B. Para llegar a la meta de la skill no se quitó ninguna regla.

## Conservadas en B (identidad, límites, retorno)

Las copias en S se quitan, salvo tres que la skill sigue nombrando como pasos del procedimiento: R08 (directorio de trabajo; frase exigida por prueba), R10 (crear solo la rama autorizada) y R13 (el cierre es del planner).

| IDs | Tema | Cambio |
|---|---|---|
| R01-R05 | solo `approved`, no preguntar, seguir la skill, idioma, marcadores | se quedan |
| R07-R10 | `repos:`, Git por directorio de trabajo, lectura listada, única escritura | **R07, R08, R10 llegan desde S**; R08 y R09 se unifican (C1) |
| R13 | no cerrar ni mover a `done/` | se queda |
| R14-R17 | *Scope*, campos editables, excepción de continuidad, nunca *Scope* ni *Acceptance* | R15-R16 en una frase (C5) |
| R26, R40-R42 | sin commit, push, PR, merge, despliegue ni secretos | R26 desde S |
| R43 | `progress.jsonl` solo con `kit-nota` | se queda |
| R50-R52 | formato, retorno estructurado, terminar solo con `DONE`/`PAUSED` | amplía R51; R52 cita la excepción R77 (C6) |

## Movidas a S o conservadas en S (procedimiento)

| IDs | Tema | Cambio |
|---|---|---|
| R06 | lectura por tramos | copia de B fuera |
| R11-R12 | estados | **de B a S** (C12) |
| R18-R25, R27-R35 | tramos y continuidad | **copias de B fuera**; C2, C8, C9 redactadas |
| R36-R39 | casillas y evidencia | una vez (hoy en B21, S43, S68, S93) |
| R44-R46 | lectura y edición | **de B a S**; C4 unificada con R60 |
| R47-R49 | salida larga y esperas (receta con `1800000` y `session_id`) | **de B a S** |
| R53-R59 | preparación de repos, ramas y `type: docs` | sin cambio |
| R60-R82 | ejecución, verificación, pausa y evidencia | sin repeticiones; C3, C7, C10 redactadas |

## Reglas nuevas

Pruebas proporcionales (cinco frases del tramo 2) en S; retorno estructurado en B.

## Eliminadas

**Ninguna regla (0 de 82).** Solo se elimina texto:

| Texto | Razón |
|---|---|
| copias de las reglas duplicadas (51 con duplicado) | una sola ubicación |
| «with or without `-C`» (B24) | contradice S13 y las reglas de Codex; queda la versión estricta |
| «leer cada archivo una vez» sin excepción (S40) | contradice B28; queda con la excepción |
| «do not mark work done» en la descripción (B3) | contradice B19; pasa a «do not close» |
| remisiones cruzadas (B29, S86 y similares) | quedan sin destino tras mover |

## Cobertura por herramientas

No justifica quitar texto: inventario §5 (ninguna regla queda garantizada en las tres herramientas).
