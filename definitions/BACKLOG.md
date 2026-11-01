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
| F15 | Actualizar `README.md`: idea, uso, instalación, diagramas y logo | habilitante | medio | bajo | Pedida por Franco (2026-10-30); documentación sin cambio de comportamiento, antes de F11. | hecha | |
| F16 | `coherencia-features` acepte `features/` sin carpetas de feature activas | habilitante | medio | bajo | Pedida por Franco (2026-10-30). Quitó el assert `carpetas.length >= 1`: con todo archivado en `completed/` el backlog se valida y pasa. | hecha | |
| F17 | Skills de Pi dentro del workspace (`instalar.sh`) | producto | alto | medio | Pedida por Franco (2026-10-31): `--proyecto` ahora instala las skills de Pi en el workspace. Confirmada por Franco (2026-10-31). | hecha | |
| F18 | Identidad del agente y prompts livianos | habilitante | alto | bajo | Pedida por Franco (2026-10-31): línea «Herramienta / Modelo / Agente» en cada agente generado, prompts más cortos y lectura acotada. Confirmada por Franco (2026-10-31). | hecha | |
| F19 | Compactación automática instalada por el kit | habilitante | alto | alto | Pedida por Franco (2026-10-31): `instalar.sh` deja la compactación puesta en Pi y Claude Code. Tras F18; antes de F11. Diseño aprobado, no requiere `arquitecto`. Detalle abajo. | hecha | |
| F20 | Medición de consumo desde logs (`scripts/consumo.mjs`) | habilitante | alto | medio | Pedida por Franco (2026-10-31, `CONTEXTO.md`): mide costo, turnos y KB leídos por rol. Primera del lote 1: F21–F23 dependen de ella. Sin dependencias. | hecha | |
| F21 | `coordinador` con menos turnos | producto | alto | medio | `CONTEXTO.md` §2.4/§2.5: reglas de lectura, `STATUS.md` por sección, `subagents_enable` una vez, encargo-plantilla. Depende de F20 (la meta se mide con ella). | hecha | |
| F22 | Lectura acotada de planificador, constructor y arquitecto | producto | medio | medio | `CONTEXTO.md` §2.2: reglas de lectura por rol y tarea que se basta sola en las skills. Depende de F20. | hecha | → |
| F23 | Topes verificables de tarea y aviso de `STATUS.md` | habilitante | medio | bajo | `CONTEXTO.md` §2.3: avisos (`STATUS.md` 1,5 KB, tarea 6 KB) y error de tarea a 8 KB en las comprobaciones. Depende de F20. | pendiente | |
| F11 | Informe de resultados del flujo | producto | medio | bajo | Feature aparte, tras F10 y con datos de ~10 tareas con línea `Registro:` (cifra a calibrar): se diseña con datos reales. Requiere al `arquitecto` antes de descomponer. | pendiente | |

Estado del documento: aprobado

## Base de la prioridad

- **Confirmado por lectura:** el kit no tiene servicio que desplegar; hay instalador, resolver y arnés local (`instalar.sh`, `scripts/resolver.mjs`, `pruebas/README.md`).
- **Confirmado por Franco (2026-10-29 a 2026-10-31):** F05–F23 son pedidos suyos; orden, valor y esfuerzo, inferidos por el planificador. Cada fila nueva agrega alcance y exige reaprobar el backlog.
- **Requiere al `arquitecto` antes de descomponer:** F11. F19 no: el diseño («Higiene de contexto» y «Cambio de diseño» de `ARCHITECTURE.md`) lo aprobó Franco el 2026-10-31.
- **Alcance de F19 (Franco, 2026-10-31):** (1) `modelos.json` con `ventanas` (las tres de OpenAI = 272.000) y `compactar_en` (100000). (2) `scripts/resolver.mjs` con `fijar-compactacion` y `quitar-compactacion`; `reserveTokens = ventana − compactar_en`. (3) `instalar.sh` escribe `compaction.modelOverrides` en `~/.pi/agent/settings.json` con bloqueo `settings.json.lock` y escritura atómica, sin pisar claves del usuario. (4) Claude Code: `autoCompactWindow = compactar_en + 33000` en `.claude/settings.local.json` con `--proyecto`. (5) `desinstalar.sh` quita solo lo del kit; manifiesto con tipo `compactacion`. (6) Pruebas Capa 1 con control negativo, y una prueba con modelo que cruce una compactación y compruebe que el `coordinador` retoma desde `STATUS.md`. (7) El `coordinador` escribe `STATUS.md` antes de delegar. (8) Guía en el README con la tabla de mecanismos. Informe base: `pruebas/resultados/2026-10-31-verificacion-compactacion.md` (resuelve la verificación de Claude Code).
- **Siguiente (`→`):** F21, `pendiente`, con tareas en `borrador` en `features/F21-coordinador-menos-turnos/` (puerta 3 por tarea). Orden: F21, luego F22 y F23 (dependen de F20, ya `hecha`), F11. Lote 2 de `CONTEXTO.md` (F24–F26) fuera del backlog hasta que haya cupo. F11 sigue en pausa por datos (espera más tareas con línea `Registro:`); no se descompone hasta que `arquitecto` la diseñe.
- **Máximo de features:** el tope de 6 cuenta solo las pendientes (hoy 6: F19, F20, F21, F22, F23 y F11; en el tope); las `hecha` no cuentan.
