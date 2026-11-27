# Decisions — ritmo

| ID | Decision | Reason | Date | Status |
|----|----------|--------|------|--------|
| D-01 | Un solo tramo; solo se tocan los cuatro archivos pedidos, sus pruebas y las comprobaciones de frases movidas; el resto queda pendiente. | Modo rápido pedido por la persona. | 2026-11-27 | active |
| D-02 | `kit run` es el modo por defecto cuando el planner corre en Codex; en Claude Code y Pi sigue el subagente. | `kit run` aún no mapea claude ni pi. | 2026-11-27 | active |
| D-03 | `./verify` completo corre una vez al final; si falla se corrige y se repite una sola vez, y un segundo fallo es `PAUSED`. | Pedido: sin tercer intento. | 2026-11-27 | active |
| D-04 | En `planner.md` y `segment-contract.sh`, «Per-segment review» pasa a «Final review» (una revisión al final). `referencias/review-extras.md` conserva su título: fuera de *Scope*. | A2: una revisión al final. | 2026-11-27 | active |
| D-05 | El límite de corridas de `execute-plan` pasa de «3 runs» a «2 runs» (`operating-contract.sh` busca la frase nueva). | D-03: una corrida más tras un fallo. | 2026-11-27 | active |
| D-06 | La persona autoriza una corrida más de `./verify` en este cambio, tras corregir los dos `Devuelto:`; si falla, `PAUSED` sin más intentos. | Excepción puntual a D-03. | 2026-11-27 | active |
