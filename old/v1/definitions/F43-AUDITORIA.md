# F43: diseño de la auditoría de contexto (BORRADOR, puerta 1)

Estado: borrador hasta aprobación de Franco. Origen: fila F43 y «Alcance de F43» de `BACKLOG.md` (confirmado); lo medido hoy está en `CONTEXTO.md` §1 y §5 y no se repite. **No se cambia ninguna regla, prompt, skill ni agente hasta tener datos.** Este documento no edita `WORKFLOW.md`, `AGENTS.md` ni `agentes/`.

## 1. Qué se mide y cómo

Unidad: un lanzamiento (sesión del coordinador, o subagente con su `rol`). Fuente: logs de sesión que `scripts/consumo.mjs` ya descubre (Pi: sesión + `subagent-artifacts/`; Claude Code: transcripts). Solo lectura, sin modelo ni red.

| Fuente de contexto | Cómo se obtiene (log) |
|---|---|
| Prompt del agente | Tamaño de `agentes/<rol>.md` del repo (fs) y, si el log trae el system prompt, su longitud real (*a verificar* en la tarea 1) |
| Skills cargadas | Llamadas a `Skill` (Claude) / lecturas de `skills/*/SKILL.md` (Pi): bytes del archivo |
| Línea `Lee:` | Texto del encargo (primer mensaje del subagente), vía `resumirEncargo` de `formato-encargo.mjs` |
| `STATUS.md`, `definitions/*` | Llamadas `read` con `path`; bytes devueltos por el resultado (o `limit`/`offset` aplicado) |
| Lecturas repetidas | Misma ruta leída ≥2 veces en un lanzamiento, o por ≥2 roles en la misma feature |

Tabla de salida (una fila por fuente y rol): `fuente | bytes (único) | veces leída | bytes totales cargados | rol`, ordenada por bytes totales, más un top 10 y la columna «¿su prompt dice que la necesita?» (sí/no, a mano). Formato texto y `--json`.

## 2. Qué se reutiliza y qué es nuevo

- **Reutiliza** de `consumo.mjs` (ya exportado): `descubrirSesiones`, `analizarSesionPi/Claude`, `analizarSubagentesPi/Claude` (llamadas `read` por rol y KB por archivo, ya existen) y `leerArgumentos`. `formato-encargo.mjs` para la línea `Lee:`.
- **Nuevo (inferido, mínimo):** `scripts/contexto-fuentes.mjs`, hermano de `consumo.mjs`, que agrega por fuente/rol/repetición y suma prompts y skills desde el filesystem. No crece `consumo.mjs` (40 KB) ni ningún prompt. Topes de bytes: script ≤ 12 KB, prueba ≤ 8 KB, salida de texto ≤ 4 KB.
- Si falta un dato en el log (p. ej. bytes del resultado), el script lo marca `n/d`; no estima.

## 3. Verificación de caché o resumen compartido

Se hace **después** de la medición y solo sobre las 3 fuentes que más pesan y se repiten entre roles. Candidatos: definiciones leídas por varios roles, `STATUS.md`, tareas `hecha`.

1. Documentación (*a citar con enlace y fecha en la tarea*): Claude Code (prompt caching del proveedor, subagentes con contexto propio, memoria/`CLAUDE.md`) y Pi (sesiones, `subagent-artifacts`, caché del proveedor OpenAI). Hoy no sé si hay mecanismo compartido entre subagentes: *supuesto sin verificar*.
2. Prueba real: dos lanzamientos seguidos del mismo rol con la misma fuente; comparar `input`/`cacheRead`/`cacheWrite` del log (campos que `consumo.mjs` ya usa) con y sin el mecanismo.
3. **Criterio «vale la pena»** (propuesto): ahorro medido ≥ 20 % de los bytes de entrada del rol en la prueba, **y** el mecanismo es verificable (hash o fecha del archivo fuente en el resumen), **y** no sube ningún prompt sobre su tope. Si falta alguno: «no».
4. **Riesgo de contexto desactualizado:** un resumen puede divergir del archivo vigente. Condición mínima para un «sí»: el resumen lleva el hash del original y el rol lo descarta si no coincide. Sin eso, «no».

## 4. Tareas (≤6 pasos, ≤3 archivos a tocar, ≤4 a leer; una tarea, un archivo de evidencia)

| # | Tarea | Depende de |
|---|---|---|
| 01 | **Medición:** `scripts/contexto-fuentes.mjs` + su prueba; corre sobre un log real y guarda la tabla en `features/F43-auditoria-contexto/medicion.md` | nada |
| 02 | Análisis: top de fuentes, repetidas y no pedidas por el prompt del rol; lista corta en `analisis.md` | 01 |
| 03 | Docs: qué mecanismo existe en Claude Code y en Pi (citas con fecha) en `mecanismos.md` | 02 (elige candidatos) |
| 04 | Prueba real del mecanismo en cada herramienta, con campos de caché del log, en `prueba.md` | 03 y **Franco** (corre Pi/Claude real y puede costar créditos: debe autorizarla) |
| 05 | Informe final con «vale la pena / no» y riesgo de desactualizado, en `informe.md` | 04 |

**Decisión de Franco (puerta 1 aparte, tras 05):** caché sí/no. Si es «sí» o si la medición pide recortar prompts, sale como feature `producto` nueva (toca `agentes/planificador.md` y `skills/descomponer-feature/SKILL.md`, ya tocados por F42). Las tareas 01-03 no requieren decisión; 04 requiere autorización de gasto; 05 termina en su decisión.

## 5. Nombres

- Carpeta: `features/F43-auditoria-contexto/`
- Rama: `chore/F43-auditoria-contexto` (sin cambio de comportamiento)

## Decisiones para Franco

- **A (recomendada):** aprobar este diseño y descomponer las 5 tareas; la 04 se autoriza al llegar.
- **B:** solo tareas 01-02 ahora; decidir 03-05 con los datos.
- **C:** descartar el caché y quedarse con la auditoría (01-02).
