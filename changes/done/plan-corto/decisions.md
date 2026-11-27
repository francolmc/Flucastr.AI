# Decisions — plan-corto

| ID | Decision | Reason | Date | Status |
|----|----------|--------|------|--------|
| D-01 | Cambio pequeño: hasta 2 archivos de producto y 120 líneas de diff, con comportamiento nuevo permitido si al menos una prueba lo cubre y pasa en la comprobación rápida; sin esa prueba o sobre 120 líneas, plan normal. | Elección de la persona usuaria. | 2026-11-27 | active |
| D-02 | Las reglas cortas y la exigencia de comando por A# de review-plan se activan con `format: 2` en el frontmatter; sin la marca, las comprobaciones son las actuales. | Los planes antiguos siguen válidos. | 2026-11-27 | active |
| D-03 | Un A# es de alto riesgo (prueba de sensibilidad y secciones opcionales) si toca la lista de la condición 4 del cambio pequeño. | La definición general marca casi todo como alto riesgo y anularía el ahorro. | 2026-11-27 | active |
| D-04 | Las pruebas no cuentan como archivos de producto, pero sus líneas sí cuentan en las 120; documentos y `changes/` siguen excluidos. | Conserva la exclusión actual del tope de líneas. | 2026-11-27 | superseded by D-05 |
| D-05 | Las 120 líneas son solo de producto; las pruebas no cuentan en ellas ni como archivos de producto y tienen tope propio de 150 líneas; documentos y `changes/` siguen excluidos. | Ajuste de la persona usuaria al aprobar. | 2026-11-27 | active |
| D-06 | Con `format: 2`, review-plan no valida el nombre del binario: cada A# necesita un comando entre acentos graves y un resultado esperado (`expect`, `espera`, `esperado`), salvo «revisión manual»; los literales a restaurar en `planner.md` son los originales en inglés. | Pedido de la persona usuaria tras la revisión; las instrucciones operativas van en inglés. | 2026-11-27 | active |
