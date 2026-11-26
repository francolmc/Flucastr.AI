# Decisions — decisiones-estructuradas

| ID | Decision | Reason | Date | Status |
|----|----------|--------|------|--------|
| D-01 | Claves fijas de `decisions.md` y `notes.md` en inglés; el texto, en el idioma de la conversación | Coherente con `plan.md` y con el hook | 2026-11-26 | active |
| D-02 | Planner y builder escriben: el builder agrega filas solo para decisiones menores dentro de Scope y reescribe `notes.md`; la bitácora sigue en *Notes* del plan | Cierra C9 sin perder la bitácora | 2026-11-26 | active |
| D-03 | «Falta ID» es una viñeta de las secciones de decisiones, o un `Resuelto:`, sin ID; `Executor:` queda exenta | Pedido de la persona | 2026-11-26 | active |
| D-04 | El hook de compactación agrega una línea que apunta a `decisions.md` | No depender del resumen de compactación | 2026-11-26 | active |
| D-05 | Sin `decisions.md` y sin citas, el comportamiento y la salida son los de hoy | Migración de planes existentes | 2026-11-26 | active |
| D-06 | La comprobación es textual, solo avisa e ignora el código; no detecta contradicciones de sentido | Un script no interpreta prosa libre | 2026-11-26 | active |
| D-07 | Un reemplazo en `superseded by D-NN` debe existir en el registro, además de no ser el mismo ID | Una cadena con reemplazo inexistente queda rota | 2026-11-26 | active |
| D-08 | La prueba del repo llama a la función de revisión (sin lanzar el CLI por plan) y el CLI se prueba aparte | Velocidad: 91 planes en una sola prueba | 2026-11-26 | active |
| D-09 | El builder aplica una decisión encontrada solo si está `active`; se corrigen las dos frases de `execute-plan` antes del commit | Hueco del plan detectado en la revisión; pedido de la persona | 2026-11-26 | active |
