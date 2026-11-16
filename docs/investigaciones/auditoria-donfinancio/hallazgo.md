# Auditoría: Don Financio, F04 (2026-11-10)

## Hechos (comprobados)
- Hoy: 0 commits (último, 11-08). F04 en `estado: parcial`, tramo 2 de 4, 0/16 casillas aceptadas, 3 repos con cambios sin commit.
- Hoy: 2 sesiones Codex (Sol 19,3 créditos, 4 compactaciones; Luna 2,3 créditos, 4 compactaciones) más sesiones Claude.
- `plan.md` de F04: 32 KB (el kit pide repartir sobre ≈8 KB), 4 tramos, ~20 KB son *Notas* convertidas en bitácora.
- `ejecutor: principal`: el constructor se interrumpió el 11-08 y desde entonces edita el producto el principal, contra la separación del kit.
- Las fallas de hoy, una por corrida completa de `VERIFY_RAPIDO=1 ./verify` (builds Docker, `pnpm install` ≈5 min, tope de 3 corridas):
  1. Import de Prisma con ruta mala (TS2307).
  2. Lint: callback de `describe` con 48 líneas (3 corridas).
  3. HTTP 500 por `pg_advisory_xact_lock` devolviendo `void`.
  4. `crypto.randomUUID` indefinido en HTTP interno (bug real).
  5. `browser.newPage()` mal usado en el runner.
- Solo 3 y 4 eran del producto. Las otras tres se veían con `tsc`, `lint` o `node --check` en segundos.

## Diagnóstico
1. **El tramo 2 es demasiado grande.** Migración, módulo de API, concurrencia, UI y recorrido de navegador entran en un solo tramo, y el único juez es el verify completo.
2. **No hay bucle interno rápido.** Cada error trivial cuesta un ciclo Docker y gasta el tope de corridas, así que se avanza por tandas de 3 intentos en vez de iterar.
3. **El plan hace de bitácora.** Las *Notas* de "revisión temprana sobre código en construcción" son micro-dirección del principal; inflan el contexto (compactaciones) y no mejoran el resultado.
4. **No es el kit entero.** F08 y F09 cerraron con él en 11-06/11-08. Falla con cortes verticales grandes y verify pesado.

## Recomendación (no abandonar; cambiar el corte)
1. Dividir F04 en planes de ≤1 tramo, cada uno con su aceptación propia:
   - (a) API + migración, probada solo con tests de API, sin navegador;
   - (b) UI mínima de registro;
   - (c) concurrencia y recorrido E2E.
   Lo ya escrito se reparte, no se rehace.
2. Añadir un nivel rápido a `verify` o a los pasos del plan: `tsc` + lint + tests unitarios en el host, sin Docker, antes de cada corrida completa. El tope de 3 corridas cuenta solo las completas.
3. Hacer un WIP commit en la rama (lo hace Franco) para que el trabajo hecho no dependa del estado del árbol.
4. Volver a `ejecutor: constructor` con planes chicos, y dejar de usar *Notas* como bitácora (máx. 5 líneas por tramo).
5. Cambio al kit: en `planificar-cambio`, un tramo que toque DB + API + UI + navegador debe partirse. Ahora es solo una recomendación de tamaño.

## No verificado
- Calidad del código de F04 (no se revisó el diff de fondo).
- Consumo de Claude hoy: `uso.mjs` solo listó las dos sesiones Codex de DonFinancio.
