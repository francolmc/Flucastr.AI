# Observación de la persona usuaria (2026-11-14): demasiada burocracia

> Los nombres se anonimizaron; se conservan fechas y cifras.

Dicho por la persona usuaria: «somos muy burocráticos; es como que tenemos muchas ventanas para un trámite».

Es una observación, no un plan. Nada se cambia por ahora.

## Evidencia a mano (de esta sesión)
- Un arreglo de 3 Dockerfiles (Proyecto.Finanzas `verificacion-rapida`) pasó por: auditorías, hallazgo, propuesta, plan de 2 tramos, copia aislada con worktrees, dos aprobaciones, constructor ×2, verify del constructor y verify mío repetido (sin caché ≈ 25 min cada una).
- Planes en borrador sin lanzar: `una-espera-write-stdin`, `proceso-rapido`, `cola-docker` (×3), `verificacion-general`. Varios nacieron para gestionar el propio proceso.
- Cada tramo exige: resumen de 5 líneas, `/compact` o sesión nueva, revisión por tramo, veredicto, puerta 1 y puerta 2.
- F10: ~11,6 h de sesión, 4 DEVUELTO, 11 corridas de verify.

## Para pensar cuando la persona usuaria retome
- ¿Qué cambios chicos pueden saltarse plan/tramos? (regla 13 ya define «cambio chico»; ¿se usa?)
- ¿El principal debe repetir la verificación completa, o basta la evidencia del constructor + diff?
- ¿Cuántas ventanas/agentes por trámite son realmente necesarias?
- Medir: pasos del proceso vs. líneas de producto cambiadas, por cambio.
