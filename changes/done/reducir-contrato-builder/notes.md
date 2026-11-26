# Notas de planificación

## Next action
Leídos `plan.md` e `inventario.md` completos (§1-§5). Falta: cargar `plan-change`, medir tamaños y razón pruebas/producto (punto 3), ubicar kit-scope/kit-close, presupuesto de tamaño, adaptadores.

## Hallazgos
- Partida: `builder.md` 5470 B (43 líneas), `execute-plan/SKILL.md` 10397 B (98), total 15867 B.
- Rama pedida ahora: `feature/reducir-contrato-builder` (el borrador decía `chore/`).
- Pendientes del borrador ya decididas por la persona: C2 (motivos actuales), C3 (2 en continuidad, 3 en el resto), C6 (aviso de corte queda `in progress`), una sola ubicación por regla.
- Punto 3 (script `medir-razon.mjs` en esta carpeta; 10 merges 0693be5…0d1d177): razón pruebas añadidas / producto (+/-), sin md, txt, lockfiles, docs/, changes/. 9 con producto: mediana 1.15, máx 4.17 (higiene-verify); compactacion-planner sin producto. Con `verify` y `tools/verify/` contados como prueba: mediana 1.33, máx 13.88. Umbral elegido: >3.0 y ≥100 líneas de prueba (marca solo 1 de 9). Va en `kit-scope` como `aviso` (no cambia código de salida; `puerta.mjs` ya lo pasa al revisor).
- No hay definición de «P8» en el repo (supuesto: etiqueta de la persona para el A/B). R5 = `changes/done/linea-base-builder/linea-base.md` L56.
- Sin tokenizador local; docs usan ≈4 bytes/token (`docs/investigaciones/a4-costo-revisor.md` L37).
- HALLAZGO CRÍTICO: `kit run` (solo Codex; `tools/run/commands.mjs`) lanza `codex exec` con el prompt de `tools/run/prompts.mjs` L8 («using the execute-plan skill»): NO carga `builder.md`. Hoy ahí no llegan no-commit (B3/B24), `.env` (B26) ni la sección *Return* (S86 remite a ella). Mover límites solo a `builder.md` los quitaría también en `executor: planner`.
- `scripts/kit-run.mjs` L388-391 ejecuta *Verification* tras el builder y luego la puerta (L414). En subagente/ventana no lo hace nadie salvo el planner (alto riesgo, sin Fingerprint).
- Bytes por sección: S28+S30+S32+S34 ≈ 2,9 KB; B18-B23 ≈ 2,6 KB; B30 548 B ≈ S48 553 B.
- Preguntado a la persona: suite completa, límites en kit run, presupuesto.
- Respuestas (2026-11-26): relacionadas al construir; inyectar `builder.md` en kit run; límite 13 500 B.
- Escritos `plan.md` (5 tramos, draft), `reglas.md`, `ab-p8.md`. `review-plan`: 2 avisos explicados en *Validation*.

## Next action
(vigente) Esperar la línea base de `./verify` (tarea en segundo plano, log `$TMPDIR/verify-base.log`), anotar resultado y duración en el plan y pedir aprobación (Gate 1).
- Línea base `./verify` en `main`: VERIFY OK, 35 pasos, 183 s, Fingerprint b406b5d57f81.

## Next action
(vigente) Gate 1: esperar aprobación de la persona. Tras el sí: `status: approved`, comprobar base (`git fetch`, 0 commits de atraso) y lanzar builder, tramo 1.
- 2026-11-26: Gate 1 aprobado; `status: approved`; base al día; builder como subagente, un tramo por vez.

## Next action
(vigente) Builder en tramo 1 (lanzado). Al volver DONE: revisar diff en Scope, Evidence, Notes; `kit-verificado estado`; pasar a `segment: 2` y `approved`.
- Tramo 1 APPROVED (kit-run 50 casos). Plan a `segment: 2`, `approved`.

## Next action
(vigente) Builder en tramo 2 (subagente). Al volver: revisar diff, `node tests/builder-contract.mjs`, pasar a tramo 3.
- Tramo 2 APPROVED (skill 11009 B tras añadir pruebas). Plan a `segment: 3`.

## Next action
(vigente) Builder en tramo 3. Al volver: revisar las 82 reglas contra `reglas.md` (en contexto: diff completo de ambos archivos), aserciones movidas sin debilitar, tamaños, `kit-verificado estado`.
- Tramo 3 devuelto (1/2): C6, C2/C3, R35, C7/C10, R48/R49/R68. Límites de seguridad verificados presentes en builder.md. 12746 B antes de corregir. Builder reportó 1 fallo intermitente de `./verify` paso 5d.

## Next action
(vigente) Builder corrige tramo 3. Al volver: revisar solo el diff de esas líneas, tamaños, `kit-verificado estado`; luego tramo 4.
- Tramo 3 APPROVED. builder 2753 + skill 10514 = 13267 B. Fingerprint 27bafbd82cea. Plan a `segment: 4`.

## Next action
(vigente) Builder en tramo 4 (aviso en kit-scope). Revisar: no leer secretos en sin seguimiento, umbral >3.0 y ≥100, exit sin cambio.
- Tramo 4 APPROVED (kit-scope 22/22). Plan a `segment: 5`.

## Next action
(vigente) Builder en tramo 5 (documentos y cifras reales; `./verify`). Luego revisión final, `kit-verificado estado`, Gate 2.
- Tramo 5 APPROVED; final: Fingerprint 432ef33facd2; 13267 B. Salvedad A4: R08, R10, R13 mencionadas también en la skill (docs/como-funciona dice «cada regla en una sola ubicación»: algo optimista). `./verify` falló una vez en 5d (tramo 3), no reproducido.

## Next action
(vigente) Gate 2: la persona revisa la evidencia. Con su sí: actualizar `AGENTS.md` (≤ 6144 B; hoy 5262), mover la carpeta a `changes/done/` sin cambiar `status`, sugerir mensaje de commit y PR contra `main`. No avanzar al siguiente cambio.
- 2026-11-26: Gate 2 aprobado. Cierre: `AGENTS.md` actualizado y carpeta movida a `changes/done/`. Las rutas `changes/reducir-contrato-builder/…` citadas en el plan y en `tools/check/proporcion.mjs` quedan como referencia histórica (ahora bajo `done/`).

## Next action
(vigente) La persona hace commit y abre el PR contra `main`. No avanzar al siguiente cambio.
