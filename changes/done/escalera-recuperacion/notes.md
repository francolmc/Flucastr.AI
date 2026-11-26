# Notas: escalera-recuperacion

## Hallazgos
- 2026-11-26: rama feature/escalera-recuperacion creada desde main (0 detrás de origin/main).
- Reglas: planner.md 8191/8192 bytes (margen 1 byte); paused-and-interrupted.md (5 líneas) tiene la oferta de relevo.
- En este repo no hay ningún changes/**/runs.jsonl (solo fixtures); progress.jsonl: 3 archivos de 1 línea.
- A4 (docs/evaluaciones/costos.md L97-108): 6,6 = créditos del REVISOR (sol, 2 revisiones, 0 ediciones) / builder. NO mide el planner ejecutando. Avisar a la persona.
- No existe ningún runs.jsonl real; progress.jsonl: 3 líneas en total (2 bloqueo, 1 comando).
- kit-run.mjs: exit!=0/tope del builder -> PAUSED motivo=access sin relanzar (L~230); fallback de motivo "alcance" no está en la lista. Solo mapea codex.
- Override por corrida YA existe: FLUCASTR_MODELOS (tools/model-resolution/models.mjs). Builder = low en models.json.
- informe.mjs validarRegistro: motivo_relanzamiento solo verify|revisor|puerta|null (campos nuevos permitidos).
- LISTO pausas.md (script $TMPDIR/gen.py): 87 detenciones: infra 9, entorno 10, plan 40, decisión 8, tarea 16, sin causa 4; 54 devoluciones aparte.
- Sesiones: thrash 7 eventos/5 sesiones, todos del planner; 0 del builder.

- LISTO plan.md (draft) y tramo-1..6.md; review-plan: tramos exit 0, plan.md solo aviso de continuity (explicado).

- Gate 1: aprobado 2026-11-26 (D1-D5 recomendadas).

- Tramo 1: DONE, 27/27; devuelto (1/2) por señal en clasificar.mjs:59. Tramo-2 aclarado: pasar 40 líneas.
- plan.md crece (6321 B de 8192): al aprobar cada tramo mover su evidencia a tramo-N.md.

- Tramo 1 APPROVED (evidencia movida a tramo-1.md).

- Tramo 2: DONE (paso0 9/9, kit-run 50, runs-report 7); devuelto (1/2): clase de veredicto inválido y árbol modificado. Builder dijo que un hook bloqueó un Bash con rm -rf (no lo reintentó) y que paso0.test.mjs cambió fuera de su sesión (contenido revisado: correcto).

- Tramo 2 APPROVED. Supuesto nuevo (escalera agotada) en plan.md: avisar a la persona al final.

- Tramo 3: DONE (escalera 44, kit-run 50, progress 44); devuelto (1/2) por 3 puntos. Ajusté Assumption y A6 (--paso 3 vale con escalera agotada): avisar a la persona.

- Tramo 3 APPROVED. kit-run tarda ~42 s de reloj (comparar con HEAD).

- Tramo 4: DONE (escalera 65, kit-run 50); devuelto (1/2): relevo ofrecido en fallas no-tarea.

- Tramo 4 APPROVED.

- Tramo 5: DONE (escalera 74); devuelto (1/2): resuelto_por de paso 3/4.

- Tramo 5 APPROVED.

- Tramo 6: DONE, verify OK (4951b6f49d5e); devuelto (1/2): reglas mandaban --paso 3 en Pi y comando incompleto (error de mi Handoff). Para el informe final: Pi sin mecanismo de paso 3 es decisión de la persona.

- Tramo 6 APPROVED; revision.md escrito (APPROVED, huella 6df8aac37cd4).

- Compuerta 2 aprobada. AGENTS.md actualizado; carpeta movida a changes/done/. Las cabeceras de código citan changes/escalera-recuperacion/ (ahora bajo done/).

## Next action
La persona: commit y PR a main. No avanzar a otro cambio.
