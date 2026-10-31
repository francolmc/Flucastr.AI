# Backlog — Flucastr.AI

Base confirmada: definición aprobada por Franco el 2026-10-29; alcance y orden de uso de `PROJECT.md` y `WORKFLOW.md`. Valor, esfuerzo y priorización: inferidos por el planificador a partir del checkout actual.

| ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente |
|---|---|---|---|---|---|---|---|
| F01 | Base local de verificación rápida y acotada | habilitante | alto | bajo | Base determinista sin modelo ni red antes de ampliar el flujo. | hecha | |
| F02 | Planificar y coordinar desde archivos, con backlog, tareas y puertas | producto | alto | medio | Un solo coordinador sobre los agentes y skills ya existentes. | hecha | |
| F03 | Verificar y completar el constructor (Claude Code, escalación, bloqueo, tarea no aprobada) | producto | alto | bajo | Cierra lo no comprobado del constructor antes de F04. | hecha | |
| F04 | Completar una feature real por las cuatro puertas, en este repo | producto | alto | medio | Prueba la cadena de punta a punta con evidencia. | hecha | |
| F05 | Ramas por feature y refinado previo a la descomposición | producto | alto | alto | Pedida por Franco (2026-10-29); cambia el flujo base de toda feature posterior. | hecha | |
| F06 | Modo «yolo»: implementar sin aprobaciones, solo un repo y a pedido explícito | producto | medio | medio | Pedida por Franco (2026-10-29); tras F05. | hecha | |
| F07 | Cada agente y subagente corre con el modelo de `modelos.json`, en Claude Code y Pi | habilitante | alto | bajo | Todo resultado posterior vale solo para el modelo realmente usado. | hecha | |
| F08 | Limpieza y archivo de lo terminado en `features/completed/` | habilitante | alto | medio | Mantiene corto lo que leen los agentes; antes de F09/F10. | hecha | |
| F09 | Instalador para el PC de trabajo sin clonar, con actualización | producto | alto | alto | Pedida por Franco (2026-10-29); sobre un repo ya ordenado (F08). | hecha | |
| F10 | Registro de eventos del flujo en `registro/eventos.jsonl` | producto | medio | medio | Los datos solo existen si se acumulan desde ya; antes de F11. | hecha | |
| F12 | Coordinador ejecuta registro y archivo con controles | habilitante | alto | medio | Verifica el permiso de ejecutar scripts (`WORKFLOW.md` §3.1); antes de F11. | hecha | |
| F13 | Alinear README y comentario de `scripts/archivar.mjs` con el permiso del `coordinador` | habilitante | bajo | bajo | Chore tras F12, sin cambio de comportamiento. | hecha | |
| F14 | Estabilizar `pruebas/rapida.sh` bajo su tope de 30 s | habilitante | medio | bajo | Una verificación rápida inestable resta confianza; antes de F11. | hecha | |
| F11 | Informe de resultados del flujo | producto | medio | bajo | Feature aparte, tras F10 y con datos de ~10 tareas con línea `Registro:` (cifra a calibrar): se diseña con datos reales. Requiere al `arquitecto` antes de descomponer. | pendiente | → |

Estado del documento: aprobado

## Base de la prioridad

- **Confirmado por lectura:** el kit no tiene servicio que desplegar; hay instalador, resolver y arnés local (`instalar.sh`, `scripts/resolver.mjs`, `pruebas/README.md`).
- **Confirmado por Franco (2026-10-29 y 2026-10-30):** F05–F14 son pedidos suyos; orden, valor y esfuerzo, inferidos por el planificador. Cada fila nueva agrega alcance y exige reaprobar el backlog.
- **Requiere al `arquitecto` antes de descomponer:** F11.
- **Máximo de features:** el tope de 6 cuenta solo las pendientes (hoy 1: F11); las `hecha` no cuentan.
