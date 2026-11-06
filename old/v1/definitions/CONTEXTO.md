# Contexto: reducir el consumo de tokens del kit

> Estado: aprobado por Franco (2026-10-31, puerta 1), con los ajustes de §8. Los cambios a definiciones aprobadas de §7 ya están aplicados. *Confirmado* = leído en archivo o dicho por Franco; *medido* = cifras que Franco aportó de los logs de Pi (costo de lista, no créditos); *inferido* = deducción mía, sin probar.

## 1. Problema y datos clave

Franco gastó 40 % de sus créditos en ~1 hora usando el kit con Pi + OpenAI en Flucastr.Cleaner (*medido*).

- **El costo está en el `coordinador`, no en los subagentes.** `coordinador` (`gpt-6.1-sol`, nivel medio): US$2.08 en 216 turnos y 26 llamadas a subagentes. `arquitecto` + `planificador`: ~US$0.65. `constructor` (`luna`): ~US$0.10 en 14 tareas. Los subagentes arrancan con ~3k tokens y llegan a 5–45k.
- **Mecanismo:** el `coordinador` es una sesión larga que relee su contexto (50–100k) en cada turno, y da ~8 turnos por cada llamada a subagente. Los 99 turnos con contexto >60k costaron 54 %; los 43 con <30k, 14 %.
- **En qué gasta turnos:** reescribir `STATUS.md` completo 52 (28 % del costo); texto a Franco 56 (23 %); delegar 23 (12 %); leer tarea completa 20 (11 %); cambiar estado 23 (11 %); `subagents_enable` 18 (5 %, repetido); leer STATUS/BACKLOG 12 (5 %); leer `definitions/` 7 (3 %).
- **Lecturas inútiles:** el `coordinador` leyó 187 KB, de ellos 68 KB de definiciones (que su prompt dice que no necesita) y 87 KB de tareas completas (la mitad en `borrador`, donde bastaba la ruta). El `constructor` leyó 419 KB en 14 corridas, incluidos 58 KB de `ARCHITECTURE`/`PROJECT` y 38 KB de tareas ya hechas: señal de tareas que no se bastan solas. El `planificador` leyó `ARCHITECTURE`+`PROJECT` completos (69 % de lo suyo). El `arquitecto` leyó `PROJECT` 5 veces y necesitó ~9 llamadas para una puerta.
- **Causa común (inferida):** las reglas de lectura están dispersas, no hay tope de tamaño que se verifique y no existe la métrica en el repo (el análisis fue manual).

Restricción (*confirmado*): los roles solo respetan su prompt; no hay mecanismo técnico que impida leer. Toda regla debe ser explícita y verificable **después** con logs.

## 2. Diseño

### 2.1 Capas (sin archivos nuevos de historia)

| Capa | Qué es | Quién la lee |
|---|---|---|
| Viva | `STATUS.md`, `BACKLOG.md`, tarea en curso | Siempre, el rol que toca |
| Referencia por rol | `definitions/*.md`, `refinado.md`, tareas de `depende_de` | Solo la sección que la tarea cita |
| Historia | `features/completed/`, `registro/`, filas `hecha` compactadas | Nunca, salvo pedido explícito de Franco (ya vigente) |

Evaluación de la propuesta del `coordinador` (Franco pidió criterio):

- **Aceptado:** tres capas; `STATUS.md` con tope duro, accionable y escrito solo en puertas y cambios de rol; resumen vigente de una página en `PROJECT`/`ARCHITECTURE`; que el movimiento lo haga un script o Franco, no un agente.
- **No se hace, archivar por tarea al pasar a `hecha`.** Nadie leyó tareas hechas desde el `coordinador` (*medido*), y el `constructor` las leyó por tareas incompletas, no por falta de archivo. Mover la evidencia rompe cosas aprobadas: `formato-tarea.mjs` exige *Evidencia* en `hecha`, `registrar.mjs` lee *Notas*/estado de las tareas, `archivar.mjs` exige todas las tareas `hecha` en su carpeta y `depende_de:` apunta a ellas. Costo alto, ahorro cercano a cero; se ataca la causa (tareas que se bastan solas + regla de no leer hechas).
- **No se hace, índice de estado de tareas en `BACKLOG.md`.** Crea una segunda fuente de verdad del estado (`WORKFLOW.md` §5, §10.1 la prohíben). Alternativa que cubre lo mismo: el `coordinador` lee **solo las 3 primeras líneas** de cada tarea (`Read` con `limit: 3`: título y línea `repo: … depende_de: … estado: …`), todas en un mismo turno.
- **Aceptado con cambio, mover PROPOSAL y alternativas descartadas a historia.** Dividir un documento exige juicio: lo hace el `arquitecto` en la puerta 1 (no un script). Mover `PROPOSAL.md` entero a `definitions/historia/` es un `mv` que Franco ejecuta al aprobar la puerta 1 (la skill lo deja como línea en «Espera a Franco»). El `coordinador` no necesita ejecutar nada nuevo: su lista de 3 comandos no cambia.

### 2.2 Qué lee cada rol (regla verificable con logs)

| Rol | Lee | No lee |
|---|---|---|
| `coordinador` | `AGENTS.md`, `STATUS.md`, `BACKLOG.md`, lista de `features/Fxx`, **3 primeras líneas** de cada tarea de la feature en curso. Tarea completa solo para la revisión de yolo (§9.3, regla 2) | `definitions/` salvo `STATUS`/`BACKLOG` (y `REPOS.md` en yolo, una vez); tareas completas en `borrador` (puerta 3: escribe la ruta en `STATUS.md`); tareas `hecha`; `completed/`; `registro/` |
| `arquitecto` | `PROJECT`, `REPOS`, `ARCHITECTURE`: cada uno **una vez por sesión** (si lo necesita de nuevo, lee la sección con `offset`/`limit`) | `features/`, tareas |
| `planificador` | `BACKLOG.md`, `features/`, `PROJECT` (resumen vigente) y, de `ARCHITECTURE`/`PROJECT`, **solo la sección que toca la feature** (`grep -n '^## '` y luego `offset`/`limit`). En `crear-backlog` (puerta 2) sí lee todo, una vez | Tareas de otras features; `hecha`; `completed/` |
| `constructor` | Su tarea y las rutas de su *Contexto*. De `depende_de:` solo *Notas* de esa tarea | `definitions/` salvo que la tarea cite una sección (entonces solo esa); tareas `hecha` ajenas a `depende_de:` |

Al `planificador` le corresponde que la tarea **se baste sola**: cita en *Contexto* las líneas o firmas exactas que el `constructor` necesita y las secciones de definición con su ruta (`ARCHITECTURE.md` «Higiene de contexto»).

### 2.3 Topes de tamaño (puntos de partida, a calibrar con F20)

| Archivo | Tope | Quién lo verifica |
|---|---|---|
| `STATUS.md` | **1.5 KB como AVISO** (hoy el aviso es 3 KB). Se endurece a error en una feature posterior, solo cuando F20 muestre que se cumple | `archivar.mjs` (`UMBRALES.STATUS` = 1536, aviso en el chequeo) |
| Tarea | 6 KB (aviso), 8 KB (error). Cifras de Cleaner: 6–10 KB | `formato-tarea.mjs` y chequeo de `archivar.mjs` |
| *Evidencia* de la tarea | ≤1.5 KB: la cola relevante de la salida, no la salida entera | Regla en `ejecutar-tarea`; medida por tamaño de la tarea |
| `PROJECT`/`ARCHITECTURE` del cliente | ≤20 KB c/u (hoy aviso informativo a 30 KB) + «Resumen vigente» de una página al inicio | Chequeo informativo de `archivar.mjs` |

### 2.4 Comportamiento de `STATUS.md`

- Se reescribe **solo en puertas y en cambios de rol** (no en cada paso intermedio), y con `Edit` por sección, no `Write` completo.
- Contiene solo lo accionable ahora: escalación, paso actual (una línea por tarea en curso), qué revisa Franco con ruta, bloqueos abiertos. Sin historia ni recordatorios de largo plazo: cada ítem ≤150 caracteres.
- Se mantiene la regla aprobada «antes de delegar, escribe el paso actual en `STATUS.md`» (protege la compactación). Con las reglas de arriba esa es la **única** escritura por delegación.
- El `coordinador` agrupa en un mismo turno las llamadas independientes (por ejemplo el `Edit` de `STATUS.md` y el del `estado`, y varias lecturas de cabecera). *Supuesto:* Pi ejecuta varias llamadas de un mismo turno en el orden indicado; se verifica en F21.

### 2.5 Otras palancas (con evidencia y riesgo)

- **`subagents_enable` una sola vez** (Pi): hoy el texto de `coordinador.md` lo manda sin decir cuándo y se repitió 18 veces. Regla: «actívala una vez por sesión; si `subagent` ya funcionó, no la repitas». *Inferido:* la repetición viene de releer la instrucción tras compactar; se mide en F20.
- **Encargos completos a subagentes** (menos llamadas y reintentos): plantilla fija de encargo (skill, rutas a leer, qué no leer, qué devolver) y la frase «no uses `contact_supervisor` para preguntar: ante falta de información responde `BLOQUEO:` o `REFINAR:`». *Confirmado:* `contact_supervisor` no está mencionado hoy en ningún agente ni skill del repo.
- **Compactar antes.** `compactar_en` ya admite valor por perfil (`valorClaude` usa `perfil.compactar_en ?? c.compactar_en`). Propuesta de prueba: Pi `pi-openai` = 65000; Claude Code: el mínimo alcanzable es 67000 (`autoCompactWindow` ≥ 100000 menos el colchón de 33000); un valor menor se **omite con aviso** (`omitido-rango`), así que no hay riesgo de configuración inválida. *Inferido:* ahorra ~10 % (limita los turnos que hoy corren a 80–100k) pero cada compactación cuesta una llamada y puede perder detalle; con un piso de ~25k de contexto fijo, un umbral <55k puede compactar muy seguido. Es configuración, no código: se decide con datos de F20.
- **`coordinador` a nivel bajo** (una línea de `modelos.json`): es la palanca de mayor ratio si la razón de precios `luna`/`sol` es grande (**no medida**: sale del catálogo de Pi). Riesgo: el `coordinador` es quien aplica las reglas de puertas y escalación, y `STATUS.md` ya anota una observación de delegación sin escalar con el nivel medio. Se prueba **después** de reducir turnos, con la misma métrica, y se revierte editando una línea.
- **Prompt del `coordinador`** (16 KB ≈ 4k tokens en cada turno): mover «Modo yolo» (~4.7 KB) a una skill cargada bajo demanda ahorraría ~1.2k tokens por turno (~2 %, *inferido*). Última prioridad (F26): toca los comprobadores de contrato.

### 2.6 Estimación del efecto (inferida, a verificar)

Turnos de `STATUS` 52→~15, estados 23→~10 (agrupados), `subagents_enable` 18→1, lecturas de tarea y definiciones recortadas a la mitad o menos: **~35–40 % del costo del `coordinador`** (~US$0.7–0.8 de 2.08). Compactación temprana: ~5–10 % más. Nivel bajo: sin estimar. Meta a calibrar para aprobar el paquete: en un trabajo equivalente, `coordinador` ≤60 % del costo por tarea, y ≤4 turnos por llamada a subagente (hoy ~8).

## 3. Impacto sobre lo existente

| Pieza | Cambio |
|---|---|
| `agentes/coordinador.md`, `planificador.md`, `constructor.md`, `arquitecto.md` | Reglas de lectura, `subagents_enable`, encargo-plantilla, `STATUS.md` por sección. Texto de agentes, no definición aprobada |
| `skills/descomponer-feature`, `ejecutar-tarea`, `disenar-arquitectura`, `definir-proyecto` | Tarea que se basta sola, tope de *Evidencia*, resumen vigente, línea de `mv` de `PROPOSAL.md` |
| `scripts/archivar.mjs` | `UMBRALES.STATUS` 3072→1536 (aviso); umbral de tarea y de definición; informe de las nuevas cifras. Sin modos nuevos |
| `scripts/consumo.mjs` (nuevo, F20) | Solo lectura sobre logs de Pi y de Claude Code; salida de agregados sin contenido de conversación |
| `pruebas/comprobaciones/formato-tarea.mjs`, `higiene-contexto.test.mjs`, `contrato-roles.mjs` | Tope de tarea (error 8 KB); aviso de `STATUS`; frases clave de lectura por rol (verifican el **texto**, no el comportamiento) |
| `modelos.json` | Solo valores (`compactar_en` por perfil, nivel del `coordinador`), en F25 (nivel bajo, solo tras F21) |
| Instalador, `resolver.mjs`, manifiesto, `registrar.mjs`, lista de 3 comandos del `coordinador` | **Sin cambios** |

## 4. Riesgos y qué NO se hace

**Riesgos.** (1) Cumplimiento solo por prompt: mitigación, medir con F20 y repetir. (2) Una tarea que no se basta sola ahora falla en vez de leer de más: el `constructor` anota el hueco en *Notas* (regla 2 de `WORKFLOW.md` §6) y se mejora la plantilla. (3) `STATUS.md` más corto pierde contexto tras compactar: se mantiene la escritura previa a delegar. (4) Compactar pronto o usar nivel bajo puede empeorar la calidad del `coordinador`: se prueba por separado y se revierte editando `modelos.json`. (5) Supuestos sin verificar en Pi: que ejecute las llamadas de un turno en orden y que `Read` con `limit` funcione en el `coordinador` (el `constructor` ya lo usa). (6) El `backlog` admite 6 features pendientes y hoy hay 2 (F19, F11): las 7 propuestas entran en dos lotes.

**No se hace:** archivar por tarea; índice de estados en `BACKLOG.md`; resúmenes generados por modelo o por script; hooks o extensiones que impidan leer; borrar nada (todo queda versionado); tocar las cuatro puertas, yolo, la lista de 3 comandos o el instalador; ninguna automatización fuera de Franco o de los scripts existentes.

## 5. Cómo se medirá

`scripts/consumo.mjs` (F20) calcula, por sesión y por rol, con la misma métrica del análisis manual: costo por turno y por tramo de contexto (<30k, 30–60k, >60k); turnos por tipo (reescribir `STATUS`, delegar, leer tarea, cambiar estado, texto); llamadas a subagentes y turnos por llamada; KB leídos por archivo y por rol (cuánto se LEE, no solo cuánto se gasta: los roles ya leyeron archivos que su prompt no pedía); número de `subagents_enable`. Línea base: las cifras de la sección 1 (Cleaner). Comparación: **normalizada por tarea construida** (los proyectos no son idénticos), sobre la misma herramienta y modelos. Aprobación del paquete: el `coordinador` cumple la meta de §2.6 y no lee ninguna definición ni tarea `hecha` (KB = 0) en dos proyectos distintos. Ya se mide hoy la parte determinista sin modelo: tamaños con `node scripts/archivar.mjs`.

## 6. Features propuestas (orden de ejecución, habilitantes primero)

IDs a continuación de F19; F11 sigue en pausa. **Lote 1 = F20–F23: entra al backlog.** **Lote 2 = F24–F26: queda como propuesta, fuera del backlog por ahora** (tope de 6 pendientes). Orden: F20 primero; F21–F23 después de F20 (dependen de ella); F25 después de F21. Cada tarea ≤~3 archivos; tamaño = número aproximado de tareas.

| ID | Nombre | Tipo | Objetivo | Criterio de aceptación observable | Depende de | Tamaño |
|---|---|---|---|---|---|---|
| F20 | Medición de consumo desde logs | feature (habilitante) | `scripts/consumo.mjs` mide la métrica de §5, incluidos los KB leídos por rol | Con un log de prueba generado por la suite (sin modelo ni red), `node scripts/consumo.mjs --raiz <dir>` imprime las cifras esperadas, KB leídos por rol incluidos; sobre una sesión de Cleaner reproduce 216 turnos, 26 subagentes y US$2.08 ±5 % (lo comprueba Franco); su salida no contiene texto de mensajes (prueba con control negativo) | — | M (4–5 tareas: formato de log de Pi y de Claude Code, parseo, informe, pruebas, README) |
| F21 | `coordinador` con menos turnos | feature | Reglas de lectura, `STATUS.md` por sección y solo en puertas/rol, `subagents_enable` una vez, encargo-plantilla, lectura de cabecera de tareas | `contrato-roles`/`higiene-contexto` comprueban cada frase de regla en el agente generado para Pi y Claude Code; en una corrida real (Franco) con `consumo.mjs`: 0 KB de `definitions/` leídos por el `coordinador`, ≤1 `subagents_enable`, ≤4 turnos por llamada a subagente | F20 | S–M (3 tareas) |
| F22 | Lectura acotada de planificador, constructor y arquitecto | feature | Reglas de §2.2 y tarea que se basta sola en las skills | Pruebas de contrato comprueban las frases en los 3 agentes y en `descomponer-feature`/`ejecutar-tarea`; en una corrida real: `constructor` sin lecturas de `ARCHITECTURE`/`PROJECT` completas ni de tareas `hecha` ajenas a `depende_de`; `arquitecto` ≤1 lectura por documento | F20 | M (3–4 tareas) |
| F23 | Topes verificables de tarea y aviso de `STATUS` | feature | Convertir en comprobaciones los topes de §2.3 | `node scripts/archivar.mjs` reporta `STATUS.md` >1.5 KB y tarea >6 KB como aviso; `formato-tarea` falla con tarea >8 KB (caso negativo y positivo); `STATUS.md` NO falla (endurecerlo es una feature posterior, con datos de F20); `rapida.sh` sigue bajo 30 s | F20 | S (2–3 tareas) |
| F24 | Definiciones con resumen vigente (lote 2, propuesta) | feature | `PROJECT`/`ARCHITECTURE` nuevos nacen con resumen y ≤20 KB; alternativas a `historia/`; `PROPOSAL.md` a historia al cerrar la puerta 1 | Las skills de `definir-proyecto`/`disenar-arquitectura` lo exigen (prueba de texto); el chequeo informa el tope de 20 KB; en un proyecto nuevo, `PROJECT.md` ≤20 KB y `PROPOSAL.md` fuera de `definitions/` | F22 | S–M (3 tareas) |
| F25 | Experimento: umbral de compactación y nivel del `coordinador` (lote 2, propuesta) | chore | Decidir con datos, por separado, `compactar_en` 65000 en Pi (67000 en Claude Code) y el `coordinador` en nivel bajo (solo después de F21) | Informe en `pruebas/resultados/` con corridas medidas con F20 (base, umbral, nivel bajo) y recomendación; `modelos.json` queda con la opción elegida y `instalar.sh --simular` la refleja | F19, F20, F21 | S (2 tareas; la corrida con modelo la decide Franco por costo) |
| F26 | Prompt del `coordinador` más corto (lote 2, propuesta) | chore | Mover «Modo yolo» (y «Ramas» si conviene) a una skill bajo demanda | `coordinador.md` ≤10 KB; los comprobadores de contrato y la suite pasan; una corrida de yolo sigue activándose solo a pedido (prueba con modelo) | F21, y solo si F20 muestra que el prompt pesa | M (3–4 tareas) |

Sugerencia de rama (`WORKFLOW.md` §9.1): F20–F24 `feature/`; F25 y F26 `chore/`.

## 7. Cambios a definiciones aprobadas (APLICADOS 2026-10-31)

Aprobados por Franco (puerta 1) y aplicados por el `arquitecto`, con el tope de `STATUS.md` como aviso (ajuste 2). `higiene-contexto.test.mjs` limita `WORKFLOW.md` a 30 720 caracteres; tras los cambios mide 30 674.

- **A. `WORKFLOW.md` §10.4:** la tabla «Qué entra al contexto, por rol» se sustituye por un párrafo que remite a este documento (§2.2–2.3) y añade `PENDIENTES.md` a lo que nadie lee sin pedido de Franco.
- **B. `WORKFLOW.md` §10.4, punto 1:** `STATUS.md` > 1,5 KB como aviso (error más adelante, según F20); tareas > 6 KB; definiciones > 20 KB (informativo).
- **C. `WORKFLOW.md` §6:** «~5 archivos» pasa a «~3»; tarea hasta 6 KB (aviso) / 8 KB (error); *Evidencia* hasta 1,5 KB. Cierra la decisión abierta de bajar a ~3 archivos.
- **D. `WORKFLOW.md` §3:** de las tareas, el `coordinador` lee solo sus 3 primeras líneas; `STATUS.md` se reescribe solo en puertas y cambios de rol, con aviso a 1,5 KB.
- **E. `ARCHITECTURE.md`, «Higiene de contexto»:** subsección «Consumo del `coordinador`» con remisión a este documento.
- **F. `AGENTS.md`:** una línea que enlaza este documento.

## 8. Decisiones de Franco (2026-10-31, puerta 1)

1. **Orden.** F20 primero; F21–F23 después de F20; F25 después de F21. Lote 1 (F20–F23) al backlog; lote 2 (F24–F26) fuera por ahora; F11 en pausa.
2. **Tope de `STATUS.md`.** Empieza como aviso (1536); se endurece a error en una feature posterior, solo cuando F20 muestre que se cumple.
3. **Tareas.** ~3 archivos, 6 KB (aviso) / 8 KB (error): aprobado.
4. **Experimentos.** `compactar_en` 65000 en Pi (67000 en Claude Code) y, por separado, el `coordinador` en nivel bajo solo tras F21 (F25), sometidos a la medición de F20. F20 mide también cuánto se LEE por rol.
5. **Pendientes de largo plazo.** Salen de `STATUS.md` a [`PENDIENTES.md`](PENDIENTES.md), que ningún agente lee sin pedido explícito de Franco. El `coordinador` quita esos puntos de `STATUS.md`.
