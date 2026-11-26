# Tabla antes/después y destino de las reglas

## Bytes por archivo (`wc -c`; tok ≈ bytes / 4)

| Archivo | Antes | Después | Tok antes | Tok después |
| --- | --- | --- | --- | --- |
| `core/agents/planner.md` | 20205 | 8191 | 5051 | 2048 |
| `core/skills/plan-change/SKILL.md` | 18747 | 4366 | 4687 | 1092 |
| `AGENTS.md` | 16310 | 4434 | 4078 | 1109 |
| **Siempre en contexto (suma)** | **55262** | **16991** | **13816** | **4248** |
| Definiciones de Artifact, SendFeedback, ScheduleWakeup y ReportFindings (Claude Code; caracteres medidos en sesión) | 51013 | 0 | 12753 | 0 |
| `core/agents/builder.md` (el planner deja de leerlo) | 5470 | 5470 | 1368 | 1368 |
| `core/skills/execute-plan/SKILL.md` (igual) | 10397 | 10397 | 2599 | 2599 |

Se leen solo cuando aplica (medidos en los borradores):

| Archivo nuevo | Bytes | Tok |
| --- | --- | --- |
| `plan-change/references/template.md` | 7212 | 1803 |
| `plan-change/references/rules.md` | 6623 | 1656 |
| `plan-change/references/segments.md` | 3409 | 852 |
| `plan-change/references/verification.md` | 1223 | 306 |
| `core/references/planner/review-extras.md` | 5438 | 1360 |
| `core/references/planner/planning.md` | 3021 | 755 |
| `core/references/planner/progress-report.md` | 2596 | 649 |
| `core/references/planner/codex-waits.md` | 1274 | 319 |
| `core/references/planner/paused-and-interrupted.md` | 859 | 215 |
| `docs/como-funciona.md` (se crea en el tramo 11) | ~15000 | ~3750 |

## Piso tras compactar (tokens medidos; planner en Claude Code)

Base: 66 compactaciones desde el 2026-11-25, mediana 84.388, máximo 102.971 (`medir-piso.mjs`). En esta medición un token equivale a unos 2,4 caracteres del contenido variable y 3,15 del prefijo: `bytes / 4` **subestima** el costo real entre 1,3 y 1,7 veces.

| Pieza | Hoy | Proyectado |
| --- | --- | --- |
| Piso mediano | 84,4k | — |
| `planner.md` | | −3,8k |
| `plan-change` re-adjunta | | −6,0k |
| `AGENTS.md` | | −4,6k |
| Cuatro herramientas fuera | | −16,2k |
| **Subtotal** | | **≈54k** |
| Sin releer `builder.md` ni `execute-plan` (si no entran otros archivos en su lugar) | | hasta −6,6k → **≈47k** |
| Tú desactivas plugins y conectores sin uso | | −7k a −9k → **38k–47k** |

**45k no está garantizado.** Solo con el kit la proyección es 47k–54k. Es una proyección: se confirma midiendo una sesión real después de reinstalar.

## Reglas de `planner.md`

| Regla | Destino | Razón |
| --- | --- | --- |
| Sin commit, push, PR, merge ni despliegue | Conservada en el núcleo | Seguridad |
| No leer `.env`, llaves ni credenciales | Conservada | Seguridad |
| `git switch -c`; preguntar si la rama existe | Conservada | Seguridad |
| Qué archivos puede editar el planner | Conservada | Seguridad |
| Cambio pequeño: seis condiciones, clasificación, veto, no encadenar | Conservada, redacción más corta | Seguridad |
| Cuatro bloqueos y definición de aceptación alterada | Conservada | Seguridad |
| Nunca `docker system prune` | Conservada | Seguridad |
| No elegir repo único o workspace | Conservada; se elimina la frase explicativa sobre detectar repos hijos | Explicativa |
| Gate 1, Gate 2, cierre, `base:` | Conservadas | Contrato |
| Revisión: diff, Evidence, Aceptación, `kit-verificado`, devoluciones, 2 relanzamientos, veredicto | Condensada en la interfaz; texto íntegro en `review-extras.md` | Contrato |
| Revisión por tramo | Condensada; íntegra en `review-extras.md` | Contrato |
| Exploración, evaluación, tamaño y riesgo | Condensada; íntegra en `planning.md` | Contrato |
| Informe de avance («how is it going?») | Movida íntegra a `progress-report.md` | Caso raro |
| `PAUSED`, interrupción, limpieza de Docker, reconstrucción de estado | Resumen en el núcleo; íntegra en `paused-and-interrupted.md` | Caso raro |
| Esperas en Codex (`yield_time_ms`, `session_id`, `send_message`) | Movida íntegra a `codex-waits.md`; se mueven sus pruebas | Solo una herramienta |
| Opciones de base sucia, ventana propia, mejoras sugeridas, resumen de historia | Condensada o movida a `review-extras.md` | Caso raro |
| Presupuesto de contexto, parada, preguntas, formato final | Condensada. Se eliminan: «lecturas independientes en una llamada», detalle de «un resultado por turno» y la aclaración sobre `diagnose` (ya dice «no files») | Eficiencia o duplicado |
| Interfaz del builder (14 líneas) y no leer `builder.md` ni `execute-plan` salvo `executor: planner` | Nueva | Pedido |
| `notes.md` con `## Next action`; delegar inventarios a un subagente de solo lectura (≤1.500 tokens, detalle a disco) | Nueva | Pedido |
| Sin Artifact, ScheduleWakeup, SendFeedback, ReportFindings | Nueva (Claude Code) | Decisión del 2026-11-25: el planner ya no publica páginas, usa `/loop`, envía borradores de feedback ni usa ese informe de revisión |

El «solo lectura» del subagente es una instrucción, no un permiso: las reglas deny y el hook siguen aplicando, pero nada impide técnicamente que escriba.

## Reglas de `plan-change`

| Regla | Destino |
| --- | --- |
| Plantilla mínima con la historia completa | Núcleo |
| Plantilla anotada y «Before Writing» | `references/template.md` (líneas 10-101 del original, íntegras) |
| Reglas 1-10 y 14, estados, revisión previa | `references/rules.md` (íntegras) |
| Reglas 11 y 15 | `references/segments.md` (íntegras); resumen en el núcleo |
| Reglas 12 y 13 | `references/verification.md` (íntegras) |
| Pasos atómicos, ejecutor, `repos:`, lista previa a aprobar | Resumen en el núcleo con las frases que exigen las pruebas |

Ninguna regla eliminada: los números de regla se conservan.

## `AGENTS.md`

«Reglas» y «Límites de las reglas deny» quedan iguales. La línea `Aceptación:` queda igual (la leen las herramientas de permisos). Todas las viñetas de «Cómo funciona» pasan íntegras a `docs/como-funciona.md`; quedan en `AGENTS.md` solo las invariantes. Se agregan invariantes de tamaño y de pruebas de frases.

## Pruebas que cambian

Solo las cuatro frases de la receta de esperas de Codex (`yield_time_ms: 300000`, `do not count`, `session_id`, `send_message`): `tools/verify/agent-contracts.sh` (bloques 8l y 8p) y `tools/verify/segment-contract.sh` (una entrada y la lista de archivos copiados). Los casos negativos se conservan apuntando al archivo nuevo. `tests/builder-contract.mjs` no cambia.
