# Decisions — P01-runtime-lanzamiento

| ID | Decision | Reason | Date | Status |
|----|----------|--------|------|--------|
| D-01 | Incluir Claude Code, Codex y Pi desde el inicio y permitir cambios necesarios en `kit run`. | Confirmado por la persona usuaria. | 2026-11-27 | active |
| D-02 | Mantener cinco tramos y dos puertas, con builder y sin subir su nivel. | Pedido explícito. | 2026-11-27 | active |
| D-03 | Reanudar directamente R1 y tramo 5, conservar `hecho: "1/1"` y exigirlo en la comparación completa de R1; sin subir el nivel ni commit. | Pedido explícito de la persona usuaria. | 2026-11-28 | active |
| D-04 | Codex se admite mediante `kit run`; retirar la receta de subagente Codex sin observador y posponer esa modalidad. | La persona aprobó esta alternativa para evitar una espera indefinida. | 2026-11-28 | active |
| D-05 | Autorizar un único intento con nivel superior para corregir el diagnóstico de clave faltante y verificarlo. | Autorización explícita de la persona usuaria, limitada a este intento. | 2026-11-28 | active |
