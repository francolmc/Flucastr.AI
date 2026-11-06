# Investigación externa: estabilizar el kit Flucastr.AI

> Estado: **borrador por revisar**. Fecha: 2026-11-04. Fase 2 de la auditoría (`definitions/AUDITORIA.md`): responde sus 8 preguntas (§6) más una transversal sobre complejidad de orquestación.
> Origen: investigación web con fuentes (lista al final). Los umbrales concretos (2 repeticiones, k=5, topes en KB) son criterio derivado de las fuentes, no estándares. Ver «Advertencias» para qué está verificado y qué no.
> Título del informe: *Flucastr.AI: cómo estabilizar el kit pasando de reglas por prompt a rieles deterministas*

El kit se estabiliza sacando los controles críticos del prompt y llevándolos a scripts y hooks que corren siempre, y reduciendo la orquestación a un solo escritor por artefacto. Los cuatro problemas de la auditoría (nadie repara la tarea dañada, el freno cuenta rondas y no detecta repetición, se valida el borrador y no el archivo final, y todo depende de que el modelo obedezca) tienen una solución conocida en la industria. La validación ocurre en cada escritura y los mensajes de error son causales. Además se calcula una "firma de error" que corta el bucle a la segunda repetición. Cada tipo de defecto tiene un dueño de la reparación. Lo que conviene eliminar es complejidad de coordinación, no capacidades.

## TL;DR

- **El bucle de DonFinancio se corta con dos piezas.** La primera es un validador que corre en cada Write/Edit (hook `PostToolUse` en Claude Code, `tool_result` en Pi) y dice "bloque de código abierto en línea N sin cerrar". La segunda es un contador determinista de "misma firma de error + mismo hash del artefacto" que detiene el flujo a la 2.ª repetición y no deja que "A" (ampliar) reabra el mismo bucle. Es lo que hacen OpenHands (StuckDetector), SWE-agent (linter que rechaza la edición), Aider (máx. 3 reflexiones) y Roo Code (límite de 3 errores/repeticiones).
- **Menos roles y menos reglas por prompt.** Lo que funciona en 2025-2026 es "inteligencia en paralelo, escrituras en un solo hilo" (Walden Yan, "Multi-Agents: What's Actually Working", Cognition, 22 abr. 2026). Para un desarrollador solo, la arquitectura mínima estable tiene un planificador fuerte (Sonnet) que escribe planes y tareas, un constructor liviano (Haiku) que es el único que escribe código, y un orquestador que es un *script*, no un agente. Las puertas humanas bajan de 4 a 2.
- **Medir el estado, no la respuesta.** Las evals deben correr con Haiku (el modelo de producción), con 10-20 tareas × 3-5 repeticiones en `claude -p --max-turns --max-budget-usd`. Se califica con los mismos validadores sobre los archivos resultantes y se reporta pass^k. La telemetría pasa de git a un `events.jsonl` append-only que escriben los hooks.

---

## Resumen ejecutivo: las 8 recomendaciones de mayor impacto (en orden)

1. **Validación en cada escritura con mensajes causales (F37).** `validar-tarea.mjs` pasa a ser un hook `PostToolUse` (matcher `Edit|Write`, filtrado a `features/**/task-*.md`, `STATUS.md`, `BACKLOG.md`) en Claude Code y un handler `tool_result` en Pi. Debe detectar fences impares y reportar la *primera* causa con número de línea. El validador corre sobre el archivo en disco, no sobre el borrador.
2. **Detector de bucles por firma (F38).** Firma = `regla_id + ruta + sha1(contenido)`. Si la misma firma aparece 2 veces seguidas, el flujo se detiene y se escala al humano con un paquete estructurado. "Ampliar" solo se acepta si cambió el hash del artefacto o el dueño de la reparación.
3. **Tipo de bloqueo `documento_dañado` y dueño de la reparación (F39).** Un defecto estructural (fence, sección, frontmatter) lo autorrepara el constructor en un intento acotado, con el validador como juez. Un defecto de contenido (alcance, criterios) vuelve a su emisor, el planificador. Nunca se genera una "tarea de corrección" para un documento roto.
4. **Mover a scripts todo lo que hoy "debe hacer el modelo" (F40).** Presupuesto, conteo de rondas, escritura de STATUS y transiciones de estado se resuelven con un solo comando `flujo.mjs avanzar` que el agente invoca y que valida antes de cambiar nada. Con esto el prompt del coordinador baja de 7168 a menos de 3500 bytes.
5. **Telemetría por eventos, no por git (F41).** Los hooks agregan líneas JSON a `.flucastr/events.jsonl` con `bloqueo`, `reintento`, `escalacion`, `presupuesto`, `validacion` y causa estructurada. Opcionalmente se activa OpenTelemetry de Claude Code.
6. **Evals reproducibles con Haiku y criterio de estado (F42).** El arnés casero usa `claude -p`, 12 casos (incluido el fence sin cerrar), k=3 para empezar y k=5 para regresión. El "OK" lo dan los validadores sobre el árbol resultante.
7. **Simplificar la orquestación (F43).** Arquitecto y planificador se fusionan en un rol "planificador" (Sonnet). El coordinador pasa a ser un script más un prompt corto. Quedan 2 puertas humanas (aprobar plan y aceptar feature). El "modo yolo" queda como el modo normal dentro de una feature ya aprobada, siempre con los rieles deterministas activos.
8. **Higiene documental con tamaño como puerta y operación remota (F44-F46).** Hay que poner tope en bytes a todo lo que leen los agentes y podar al cerrar cada feature. Para operar desde el celular, Remote Control (Claude Code) o tmux+ssh (Pi). Un sello de versión del kit se verifica al iniciar sesión.

---

## 1. Detección y corte de reintentos sin progreso

### Qué hacen otros

- **OpenHands (verificado en su documentación y repositorio).** Su `StuckDetector` viene activo por defecto y analiza el historial después del último mensaje del usuario. Detecta cinco patrones, entre ellos "la misma acción produce error repetidamente (3+ veces)" y 4 pares acción-observación idénticos. Compara por contenido semántico (nombre de herramienta + contenido), no por identidad de objeto, e ignora marcas de tiempo. Los umbrales por defecto documentados en un issue del SDK son 4/3/3/6. Cuando detecta el patrón, la conversación pasa a `ConversationExecutionStatus.STUCK`. Esto también enseña algo: el detector de "bucle de error de ventana de contexto" fue un stub que siempre devolvía `False` hasta un PR de octubre de 2026, que lo marca como atascado tras 5 condensaciones fallidas seguidas. Otro issue documenta que el servidor de agentes descartaba en silencio los umbrales personalizados. **Lección: el detector también necesita pruebas.**
- **SWE-agent (paper NeurIPS 2024, verificado).** El comando de edición integra un linter (`flake8 --select=F821,F822,F831,E111,E112,E113,E999,E902`). Si la edición introduce un error de sintaxis, la edición se revierte y el agente recibe: *"Your changes have NOT been applied… DO NOT re-run the same failed edit command. Running it again will lead to the same error."* En la ablación (SWE-bench Lite, GPT-4 Turbo) la tasa de resolución pasa de 15,0 % sin linter a 18,0 % con linter. El paper también reporta que una edición tiene 90,5 % de probabilidad de terminar bien, pero solo 57,2 % después de un primer intento fallido, y que las ediciones fallidas en cascada explican el 23,4 % de los fracasos. **Es exactamente el patrón de DonFinancio: tras el primer fallo, la probabilidad de éxito cae fuerte, así que hay que cortar temprano y cambiar de estrategia.**
- **Aider (código fuente verificado).** `max_reflections = 3`, fijo en `base_coder.py`, con el contador reiniciado en cada mensaje del usuario. Los errores de lint/test se reinyectan como el siguiente mensaje al modelo, y al llegar al tope imprime "Only 3 reflections allowed, stopping." Desde la v0.47 pregunta antes de intentar corregir lint.
- **Roo Code (PR verificado).** `consecutiveMistakeLimit` con valor por defecto 3 y un `ToolRepetitionDetector` para llamadas idénticas consecutivas. El valor 0 desactiva ambos. Hay evidencia contradictoria sobre si en la versión final comparten el mismo límite o quedan separados; en ambos casos el valor por defecto es 3.
- **Cline (parcialmente verificado).** Un issue muestra el mensaje "Detected 5 consecutive identical calls… stopping to avoid a loop". El aviso "suave" a las 3 llamadas solo aparece en fuentes secundarias.
- **LangGraph (documentación oficial).** `recursion_limit` (25 por defecto en LangGraph.js) lanza `GraphRecursionError`. Un practicante advierte que un *wrapper* de reintento que vuelve a invocar el mismo hilo tras ese error "le entrega a un agente en bucle otro presupuesto completo". **Es tu problema con "A": ampliar resetea el volumen pero no cambia la causa.**
- **Claude Agent SDK / `claude -p` (documentación oficial).** `maxTurns` y `maxBudgetUsd` cortan el bucle con los subtipos `error_max_turns` y `error_max_budget_usd`. Son frenos de volumen, no de repetición.
- **Codex CLI:** no encontré evidencia primaria de detección de repeticiones. Un tercero afirma que Claude Code y Codex "confían en el modelo"; tómalo como opinión no verificada.

### Quién escala y con qué información

En todos los sistemas revisados, el corte lo decide **código** (detector, contador, límite) y no el modelo. Lo que recibe el humano es el estado más la causa. OpenHands expone el estado STUCK y el tipo de bucle; SWE-agent entrega el error del linter con el fragmento antes/después.

### Patrón recomendado para Flucastr.AI

- **Firma de error:** `{regla, archivo, linea, sha1_archivo}` emitida por el validador.
- **Regla de corte:** misma `regla+archivo` con el mismo `sha1` dos veces seguidas significa `atascado`. La misma regla tres veces aunque cambie el hash significa `atascado_sin_progreso`. Los umbrales son más agresivos que los de OpenHands porque cada "ronda" tuya es una invocación cara de subagente, no un paso de herramienta.
- **Paquete de escalación (máx. ~10 líneas):** firma, número de intentos, último diff del artefacto (o "sin cambios"), dueño propuesto de la reparación y 3 opciones: `R` (reparo yo, el humano), `P` (devolver al planificador), `X` (descartar la tarea). **Se elimina la opción "Ampliar" para una firma repetida**; ampliar solo existe para el freno de volumen.
- **Claude Code:** un hook `SubagentStop` sobre `constructor` lee `events.jsonl`, calcula la firma y, si está atascado, escribe `STATUS.md` con el paquete. Al coordinador le devuelve un `additionalContext` con la instrucción de detenerse. Conviene evitar `exit 2` en `Stop` para "obligar a seguir": según una fuente secundaria que cita la documentación, Claude Code termina igual el turno tras 8 continuaciones consecutivas por stop-hook (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`).
- **Pi:** una extensión con `pi.on("tool_result")` registra la firma y, si hay atasco, `pi.on("tool_call")` devuelve `{ block: true, reason }`. Según la documentación de extensiones, `tool_call` acepta `terminate`, y `ctx.abort()` está disponible.

---

## 2. Dueño de la reparación de artefactos compartidos

### Qué hacen otros

- **Spec-driven development (Birgitta Böckeler, "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl", martinfowler.com, 15 oct. 2025; opinión experta fundada).** Distingue tres niveles: *spec-first* (la spec se escribe antes y luego se abandona), *spec-anchored* (la spec se mantiene durante toda la vida de la feature) y *spec-as-source* (Tessl: la spec es el artefacto y el código es su salida). Sus hallazgos aplican directo a tu kit. Kiro convirtió un bug pequeño en "4 'user stories' with a total of 16 acceptance criteria" ("like using a sledgehammer to crack a nut"). Spec Kit generó tantos Markdown repetitivos que concluyó: *"I'd rather review code than all these markdown files"*. Además, una spec detallada daba una falsa sensación de control que el agente no respetaba.
- **SWE-agent:** la herramienta rechaza el artefacto inválido *en el momento de escribirlo*, así que el emisor repara de inmediato con el error delante. No hay un "consumidor" posterior que se tope con el documento roto.
- **Cognition (abril 2026):** la regla que funciona es *"writes stay single-threaded"*. Cada artefacto tiene un solo escritor.

### Patrón recomendado

Una matriz de dueños que el script de flujo aplica, no el prompt:

| Tipo de defecto | Ejemplo | Dueño | Cómo |
|---|---|---|---|
| Estructural/sintáctico | fence sin cerrar, sección faltante, frontmatter inválido | **Quien escribió el archivo, en el acto** (hook en la escritura) | Si se escapa, el constructor tiene **1 autorreparación acotada**: solo formato, sin tocar contenido, con el validador como juez |
| Contenido de la tarea | criterios ambiguos o contradictorios, alcance imposible | **Emisor (planificador)** | Devolución con la firma y la evidencia; el planificador reescribe la tarea |
| Código | test falla, build roto | **Constructor** | Hasta el límite de firma (§1) |
| Kit/skill contradictoria | `--evidencia` con la tarea "en curso" | **Humano (mantenedor del kit)** | Se registra como `defecto_kit`; nunca se reintenta |

**Aplicación:** agregar `documento_dañado` y `defecto_kit` a la taxonomía de bloqueos. Con eso desaparece la etiqueta genérica "codigo" que generaba tareas de corrección inútiles. El caso de DonFinancio queda así: el hook bloquea la escritura del planificador con "fence abierto en línea 42" y el planificador lo cierra en la misma sesión. Si el archivo llegara dañado por otra vía, el constructor tiene un intento de reparación de formato, y si falla se escala con la firma.

---

## 3. Validar el documento final, no el borrador

### Qué ofrece cada herramienta (verificado en documentación oficial)

**Claude Code (referencia de hooks):**
- Eventos relevantes: `PreToolUse` (puede bloquear), `PostToolUse` (la herramienta ya corrió; `exit 2` manda stderr a Claude), `PostToolUseFailure`, `Stop`, `SubagentStart/SubagentStop`, `UserPromptSubmit`, `SessionStart`, `PreCompact`, `TaskCreated/TaskCompleted` y `FileChanged`, entre otros.
- `exit 2` bloquea en los eventos que admiten bloqueo. `exit 1` es un error **no bloqueante**: la acción sigue. Es una confusión común en los blogs.
- Tipos de handler: `command`, `http`, `mcp_tool`, `prompt` y `agent` (este último experimental).
- Los hooks de settings corren **también dentro de subagentes** y la entrada incluye `agent_id` y `agent_type`. Los hooks en el frontmatter de un subagente corren solo mientras ese subagente está activo, y un `Stop` ahí se convierte en `SubagentStop`.
- El campo `if` usa sintaxis de permisos (p. ej. `"Edit(features/**)"`), pero la documentación dice que es *best-effort*: para un allow/deny duro hay que usar el sistema de permisos.
- Aviso: hay un issue abierto que reporta un `PreToolUse` con `exit 2` que no bloqueó un comando Bash. Verifica con una prueba propia en tu versión.

**Pi (documentación de extensiones en pi.dev, verificada a nivel de API):**
- Las extensiones son módulos TypeScript en `~/.pi/agent/extensions/` (global) o `.pi/extensions/` (proyecto, que solo se carga si el proyecto es de confianza) y se recargan con `/reload`.
- `tool_call` puede bloquear o mutar la entrada (`{ block: true, reason, terminate? }`). `tool_result` puede modificar `content`, `details` e `isError`. `turn_end` puede agregar entradas y pedir continuación. `agent_settled` marca la inactividad final.
- Si un handler de `tool_call` lanza una excepción, la herramienta se bloquea (fail-safe) y el agente continúa.
- También existen `pi.exec`, `pi.appendEntry`, `pi.registerTool` y `ctx.getContextUsage()`.

**Markdown:** markdownlint tiene reglas de fences (MD031 líneas en blanco, MD040 lenguaje, MD046 estilo, MD048 marcador), pero **ninguna de esas reglas dice "fence sin cerrar"**. Según CommonMark, un fence sin cerrar se extiende hasta el final del documento, y por eso el parser "ve" que falta `## Notas`. `rumdl` (linter en Rust) sí detecta y repara fences sin cerrar (MD046 con fix) y colisiones de fences anidados (MD070).

### Patrón recomendado

1. **Validación en la escritura.** Hook `PostToolUse` con `matcher: "Edit|Write"` que llama `node scripts/validar-tarea.mjs --archivo "$path" --modo=estructura`. Si falla, `exit 2` con el error causal en stderr. El agente lo recibe de inmediato, como en SWE-agent. En Pi, el mismo script se invoca desde `tool_result` con `pi.exec`, marcando `isError: true` y reemplazando el contenido por el diagnóstico.
2. **Validación de transición** (al pasar a `hecha`): la ejecuta `flujo.mjs avanzar`, no la skill. Así se resuelve la contradicción de `--evidencia` con la tarea "en curso": la validación de evidencia pertenece a la transición `en_curso → revision`, no al estado.
3. **Prepase léxico obligatorio** antes de parsear secciones: contar fences por línea (respetando ``` y ~~~ y su longitud) y abortar con el primer error. Eso evita el mensaje sintomático.
4. **Frontmatter mínimo con esquema:** `id`, `estado`, `dueño`, `version_kit`, validado con JSON Schema (p. ej. con `ajv`). Es barato y elimina la ambigüedad sobre de quién es cada archivo.

---

## 4. Mensajes de error causales para LLMs

### Evidencia

- **SWE-agent** es el mejor dato duro: con un mensaje que dice *qué pasó, que no se aplicó y que no repita lo mismo*, más el fragmento antes/después, la resolución sube 3 puntos (15,0 % → 18,0 %).
- **Armin Ronacher (práctica, 2025):** las herramientas deben *"clearly inform agents of misuse or errors to ensure forward progress"* y estar *"protected against an LLM chaos monkey"*. Él diseña sus scripts para que respondan, por ejemplo, "services already running" en vez de fallar en silencio.
- **Aider:** reinyecta el error literal del linter o del test como el próximo mensaje, con un prefijo de instrucción ("Fix any errors below, if possible").

### Formato recomendado para `validar-tarea.mjs`

```text
ERROR E-FENCE-ABIERTO features/F12/task-03.md:42
Causa: bloque de código abierto con ``` en la línea 42 y nunca cerrado; todo lo posterior se interpreta como código.
Efecto: las secciones "## Notas" y "## Evidencia" quedan dentro del bloque y no se detectan.
Corrección: agregar ``` en una línea propia después de la línea 57 (fin del ejemplo).
No reintentar: volver a ejecutar sin editar la línea 42 producirá el mismo error.
Firma: E-FENCE-ABIERTO|features/F12/task-03.md|a41c9e
```

Principios: (a) **solo el primer error raíz**, no la cascada, igual que los compiladores con recuperación de errores, que reportan lo primero y suprimen lo derivado; (b) código estable de regla (sirve para la firma y la telemetría); (c) ubicación exacta; (d) acción concreta; (e) la frase "no reintentar igual", tomada de SWE-agent. La salida JSON con los mismos campos (`--json`) sirve para los hooks y la telemetría.

---

## 5. Presupuestos y límites deterministas fuera del modelo

### Lo que ofrece hoy Claude Code (verificado)

| Mecanismo | Qué hace | Uso en el kit |
|---|---|---|
| `PreToolUse` + `exit 2` o `permissionDecision: "deny"` | Bloquea la llamada; la razón llega a Claude. Un deny gana incluso en modo bypass (fuente secundaria que cita la documentación) | Bloquear `git commit/push`; bloquear escrituras fuera de la feature activa |
| `PostToolUse` + `exit 2` | Retroalimenta tras la ejecución | Validar tarea/STATUS en cada escritura |
| `SubagentStart/SubagentStop` | Marcan el inicio y fin de un subagente (con `agent_type`) | Contar rondas, calcular la firma, aplicar el presupuesto |
| `UserPromptSubmit` | Puede rechazar o enriquecer el prompt | Inyectar 3 líneas de STATUS reales en vez de pedir al coordinador que las lea |
| `SessionStart` | Al iniciar o reanudar | Verificar la versión del kit y la higiene documental |
| Permisos (`allow/deny` en settings) | Deny duro | `Bash(git push:*)`, `Bash(git commit:*)` en deny |
| `claude -p --max-turns N --max-budget-usd X` | Tope de turnos y gasto (solo en modo print) | Evals y ejecuciones desatendidas del constructor |
| Agent SDK `maxTurns` / `maxBudgetUsd` | Devuelven `error_max_turns` / `error_max_budget_usd` | Si algún día el orquestador pasa a ser un script en TS |

### Lo que ofrece Pi (verificado a nivel de API; comportamiento fino sin confirmar)

- Bloqueo por `tool_call`, modificación por `tool_result`, continuación o corte en `turn_end`, `ctx.abort()`, `ctx.getContextUsage()`, y herramientas propias con `pi.registerTool` (por ejemplo, una herramienta `avanzar_tarea` que encapsule `flujo.mjs`).
- **No confirmado:** que Pi tenga un `--max-turns` o un tope de gasto nativo equivalente; cómo propaga límites el paquete de subagentes de terceros (`pi-subagents`); y si las extensiones globales se cargan en cada subproceso de subagente. Por diseño, Zechner no incluye subagentes en el núcleo y recomienda lanzar otra instancia de Pi (idealmente en tmux) para ver la transcripción completa. Debes **probarlo en tu instalación**. Un contador en archivo (`.flucastr/ronda.json`) que lea una extensión en cada `turn_start` funciona sin importar cómo se lancen los procesos.

### Patrón recomendado

**Un solo punto de verdad: `flujo.mjs`**, con los subcomandos `avanzar`, `bloquear --causa`, `presupuesto` y `estado`. Es el único que escribe `STATUS.md` (y verifica el tope de 1536 bytes), suma rondas y aplica la firma. Los hooks lo llaman automáticamente y los agentes solo lo invocan; ya no "recuerdan" hacerlo. Con eso salen del prompt del coordinador: correr el presupuesto, sumar rondas, escribir STATUS una vez y validar antes de avanzar. **Esta es la medida que más bytes libera del prompt.**

---

## 6. Telemetría mínima entre máquinas sin depender de commits

### Qué existe (verificado)

- **OpenTelemetry de Claude Code:** se activa con `CLAUDE_CODE_ENABLE_TELEMETRY=1` más `OTEL_LOGS_EXPORTER`/`OTEL_METRICS_EXPORTER` y un protocolo (Claude Code no tiene protocolo por defecto). Emite eventos `claude_code.user_prompt`, `api_request`, `api_error`, `tool_decision` y `tool_result` (con `tool_name`, `success` y `duration_ms`), además de `event.sequence` para ordenar. El texto de los prompts y los detalles de las herramientas se redactan por defecto. La configuración se lee solo al arrancar. Hay integraciones documentadas con SigNoz, Elastic, Last9, Better Stack y OpenObserve.
- **Pi:** documenta el formato de archivo de sesión, un "JSON Event Stream" y un protocolo RPC. Terceros ya construyeron trazas OTLP por sesión con una extensión que solo observa eventos.
- **Langfuse/Phoenix:** son útiles para equipos, pero para un desarrollador solo con 2-3 PCs son sobredimensionados. Recomiendo empezar sin ellos.

### Patrón recomendado: `events.jsonl` append-only, escrito por hooks

Una línea por evento, en `~/.flucastr/events/<maquina>.jsonl` (por máquina, para evitar conflictos), sincronizado por la nube que ya uses o por un repo de telemetría aparte:

```json
{"ts":"2026-11-04T15:02:11Z","maq":"pc-casa","kit":"1.8.3","proy":"DonFinancio","feat":"F12","tarea":"task-03","evento":"bloqueo","tipo":"documento_dañado","regla":"E-FENCE-ABIERTO","firma":"a41c9e","intento":2,"agente":"constructor","modelo":"haiku"}
```

Eventos mínimos: `validacion` (ok/falla + regla), `reintento`, `bloqueo` (tipo + regla + firma), `escalacion` (opción elegida por el humano), `presupuesto` (rondas/tokens acumulados), `transicion` (estado anterior → nuevo) y `sesion` (inicio/fin, versión del kit). `registrar.mjs` pasa a leer este archivo, y git queda solo como evidencia de entrega. OTel de Claude Code sirve como complemento opcional para tokens y costos, no como fuente de bloqueos: no conoce tu taxonomía.

---

## 7. Evaluar los prompts de coordinación con modelos reales

### Evidencia (Anthropic, "Demystifying evals for AI agents", ene. 2026)

- Vocabulario: *task*, *trial*, *grader*, *transcript* y **outcome = estado final del entorno, no lo que dice el agente**.
- No determinismo: pass@k (al menos un éxito en k intentos) frente a pass^k (todos los intentos exitosos). Con 75 % de éxito por intento, pass^3 ≈ 42 %. Para un flujo desatendido como el tuyo importa **pass^k**.
- Una tarea con 0 % en pass@100 indica que *la tarea* está mal formulada, no que falle el agente. Hay que calificar resultados, no pasos. Las evals de capacidad (pasan poco) se separan de las de regresión (deben pasar casi todas).

### Diagnóstico de tu situación

n=3 con Sonnet, cuando producción usa Haiku, y midiendo la respuesta: con eso no puedes distinguir un 60 % de un 95 %, y ni siquiera mides el modelo correcto.

### Patrón recomendado (barato y reproducible)

- **Arnés casero:** `evals/casos/*.json` describe el repo semilla, el prompt, el agente y la verificación. `evals/correr.mjs` copia la semilla a un directorio temporal y ejecuta `claude -p --agent constructor --model haiku --max-turns 25 --max-budget-usd 0.30 --output-format json`. Después corre **los mismos validadores** sobre el árbol resultante y agrega la línea en `evals/resultados.jsonl`.
- **Casos iniciales (12):** tarea normal; fence sin cerrar (DonFinancio); sección faltante; tarea contradictoria; test que falla por una causa real; test que falla por un defecto del entorno; presupuesto agotado; skill con instrucción contradictoria; STATUS cerca del tope; tarea que requiere tocar un archivo fuera de alcance (debe bloquearse); escalación correcta; reanudación tras compactación.
- **Repeticiones:** k=3 mientras iteras y k=5 antes de publicar una versión del kit. Reporta pass^k por caso. El criterio de "listo" es pass^5 = 100 % en los casos de regresión.
- **Alternativas:** promptfoo (proveedor de shell/exec y aserciones por script) o Inspect (UK AISI) si quieres paneles. Para un desarrollador solo, el arnés casero de ~150 líneas en Node alcanza y reutiliza tus validadores.
- **Pi:** el mismo arnés con Pi en modo no interactivo/JSON (documentado como "JSON Event Stream"). No verifiqué las banderas exactas; confírmalas en la referencia de la CLI.

---

## 8. Documentación acotada y operación remota

### Documentación que leen y escriben los agentes

- **Anthropic (oficial):** la guía de buenas prácticas propone una sola pregunta para cada línea de CLAUDE.md: *"Would removing this cause Claude to make mistakes?"*. Advierte que *"Bloated CLAUDE.md files cause Claude to ignore your actual instructions!"*, apunta a menos de 200 líneas por archivo y distingue: CLAUDE.md es orientación, los hooks son deterministas.
- **Context engineering (Anthropic, sept. 2025):** buscar *"the smallest set of high-signal tokens"*, cargar contexto *just in time* con identificadores livianos (rutas) y usar compactación, notas estructuradas y subagentes para tareas largas.
- **Aplicación:**
  - **Tamaño como puerta** en `SessionStart`: `ARCHITECTURE.md` ≤ 8 KB (resumen vigente) más `docs/archivo/` (histórico que no se carga); `WORKFLOW.md` ≤ 6 KB; prompts de agentes ≤ 3,5 KB; skills ≤ 4 KB cada una. Si se supera, el hook avisa y `flujo.mjs` se niega a abrir una feature nueva.
  - **Poda al cerrar una feature:** la transición `feature → cerrada` exige actualizar el resumen (≤ 15 líneas por feature en `CHANGELOG-kit.md`) y mover las tareas a un archivo histórico.
  - **BACKLOG generado, no editado:** `flujo.mjs backlog` lo reconstruye a partir del frontmatter de las tareas, y así no puede quedar desactualizado.
  - **AGENTS.md:** si usas Pi y Claude Code, mantén un solo `AGENTS.md` con lo común y un `CLAUDE.md` mínimo que lo importe (`@AGENTS.md`). Según fuentes secundarias, Claude Code solo lee AGENTS.md por su cuenta cuando no hay CLAUDE.md.

### Operar desde el celular

- **Claude Code Remote Control (oficial):** requiere v2.1.51+ y se inicia con `claude remote-control`, `claude --remote-control` (`--rc`) o `/remote-control` dentro de una sesión. La sesión corre en tu máquina; el celular o el navegador es solo una ventana, y la conexión usa HTTPS saliente sin puertos entrantes. Hay una sesión remota por instancia. **Madurez con reservas:** hay issues abiertos por comandos slash que no se procesan desde el remoto, sesiones que se congelan hasta pulsar Esc en la terminal local y sesiones que no aparecen en el celular. Úsalo para *aprobar puertas y responder escalaciones*, que es justo lo que tu flujo necesita del humano, no para sesiones largas.
- **Claude Code en la web (nube):** sirve, pero las sesiones en la nube **no leen tu `~/.claude/settings.json`**. Tus hooks tienen que estar en el `.claude/settings.json` del proyecto para que apliquen.
- **Pi:** tiene guías oficiales para "Run Pi in tmux" y "Run Pi on Android" (Termux). La ruta robusta es tmux + ssh (por ejemplo, sobre Tailscale) desde el celular. También existen extensiones de terceros (bot de Discord) que no evalué.
- **Notificación:** un hook `Notification` en Claude Code o `agent_settled` en Pi (existe el ejemplo `notify.ts`) que avise al celular cuando haya una escalación pendiente. Así no tienes que estar mirando la pantalla.

### Sincronizar la versión del kit entre PCs

- El kit vive en su propio repo git con `kit.json` (`version`, `sha`). Cada proyecto guarda `.flucastr/kit.lock` con la versión esperada.
- El hook `SessionStart` (Claude Code) o el evento de inicio de sesión (Pi) compara la versión instalada, el lock y el `origin`. Si difieren, advierte en el contexto y registra `sesion{kit_desfasado}` en `events.jsonl`.
- Los eventos llevan `kit` y `maq`, lo que te permite ver si un bloqueo ocurre solo en una versión o una máquina.

---

## 9. Pregunta transversal: ¿multi-agente con muchos roles o agente único bien guiado?

### Evidencia y opiniones fundadas

- **A favor del multi-agente, en un dominio acotado (Anthropic, "How we built our multi-agent research system", jun. 2025):** su sistema de investigación (Opus 4 como líder y Sonnet 4 como subagentes) superó en 90,2 % a Opus 4 solo, en una eval interna de investigación *breadth-first* ("outperformed single-agent Claude Opus 4 by 90.2% on our internal research eval"). A cambio, según el mismo post, "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats". Es un resultado propio, en tareas elegidas por ser paralelizables. **No aplica a construir una feature secuencial.**
- **En contra, para escritura paralela (Walden Yan, Cognition, jun. 2025):** "Don't Build Multi-Agents". Hay que compartir el contexto completo, y las acciones llevan decisiones implícitas que chocan entre agentes. Para un agente lineal de un solo hilo, Yan escribe: "The simplest way to follow the principles is to just use a single-threaded linear agent", que "will get you very far".
- **Actualización (Walden Yan, "Multi-Agents: What's Actually Working", Cognition, 22 abr. 2026):** lo que hoy funciona es *"multiple agents contribute intelligence to a task while writes stay single-threaded"*. Dos patrones concretos:
  1. Un ciclo de revisión con un revisor de **contexto limpio**: según Yan, Devin Review "catches an average of 2 bugs per PR, of which roughly 58% are severe".
  2. Un **"smart friend"**: un modelo pequeño como principal que consulta a uno grande. La dificultad es que "el modelo más tonto no sabe cuándo está en su límite", y recomiendan compartir un *fork* del contexto completo y reglas prescriptivas, por ejemplo consultar siempre ante conflictos de merge.
- **Mario Zechner (Pi):** cuatro herramientas (read, write, edit, bash) bastan, y el system prompt más las herramientas caben en menos de 1000 tokens. No incluye subagentes en el núcleo, el estado vive en archivos visibles (TODO.md) y la observabilidad es total.
- **Armin Ronacher (2025):** usaba "exclusivamente el modelo Sonnet, más barato", scripts simples como herramientas, logs combinados y "lo más tonto que funcione". Hoy alterna Amp, Claude Code y Pi.
- **Böckeler:** los flujos SDD pesados generan sobrecarga de revisión y no escalan bien a problemas pequeños.

### Conclusión aplicada a tu caso (opinión fundada)

Tu kit combina lo peor de ambos mundos: **muchos roles que se pasan artefactos por archivo, con reglas críticas en prompt**. Cada traspaso es un punto donde puede nacer un documento dañado sin dueño. La evidencia apunta a una arquitectura mínima de **dos agentes y un script**:

1. **Planificador (Sonnet), fusión de arquitecto y planificador.** Conversa contigo, escribe la definición corta y las tareas de una página. Es el único escritor de `features/Fxx/*.md`.
2. **Constructor (Haiku).** Ejecuta una tarea, verifica y deja evidencia. Es el único escritor de código. Puede consultar al planificador como "smart friend" en situaciones prescritas (2.º fallo con la misma firma, conflicto de alcance), no a discreción.
3. **`flujo.mjs` más hooks en el papel del coordinador.** Se encarga de las transiciones, el presupuesto, la firma, STATUS, la telemetría y las escalaciones. Si quieres conservar un "coordinador" conversacional, que sea el planificador con un prompt corto que invoca `flujo.mjs`, no un tercer agente.
4. **Puertas humanas: 2.** Aprobar el plan de la feature y aceptar la feature terminada. Las otras dos (definición y paso a construcción) se vuelven automáticas cuando los validadores pasan. Las escalaciones por atasco no son una "puerta": son interrupciones con un paquete causal.
5. **Opcional, más adelante:** un revisor de contexto limpio (Sonnet) antes de la aceptación, siguiendo el patrón de revisión de Cognition. Solo si las evals muestran defectos que se escapan.

Esto respeta tu principio de "dividir para conquistar": se dividen *tareas*, no *roles*. También respeta tu preferencia por confiar en el juicio del modelo, porque los prompts quedan cortos y de principios, y las garantías pasan al código.

---

## Tabla: mover, eliminar/simplificar, mantener

| Elemento | Decisión | Prioridad | Mecanismo |
|---|---|---|---|
| Validar tarea/STATUS/BACKLOG | **Mover a determinista** | P0 | Hook `PostToolUse` (CC) / `tool_result` (Pi) → `validar-tarea.mjs` |
| Detección de fences impares y errores causales | **Mover a determinista** | P0 | Prepase léxico en el validador; primer error raíz |
| Corte por repetición (firma) | **Mover a determinista** | P0 | `SubagentStop` / extensión Pi + `events.jsonl` |
| Conteo de rondas y presupuesto | **Mover a determinista** | P0 | `flujo.mjs presupuesto` llamado por hook |
| Escritura de `STATUS.md` (tope 1536 B) | **Mover a determinista** | P0 | Solo la escribe `flujo.mjs` |
| Prohibir commit/push | **Mover a determinista** | P0 | Deny en permisos + `PreToolUse` (CC); `tool_call` block (Pi) |
| Transiciones de estado y evidencia | **Mover a determinista** | P1 | `flujo.mjs avanzar` valida según la transición |
| Telemetría | **Mover a determinista** | P1 | Hooks → JSONL por máquina; `registrar.mjs` lee JSONL |
| Verificación de versión del kit | **Mover a determinista** | P2 | `SessionStart` + `kit.lock` |
| Tamaño de documentos | **Mover a determinista** | P2 | Puerta en `SessionStart` y al abrir feature |
| Opción "A: ampliar" ante la misma firma | **Eliminar** | P0 | Solo para el freno de volumen |
| Agente coordinador separado | **Simplificar** | P1 | Script + prompt corto en el planificador |
| Arquitecto como rol separado | **Eliminar (fusionar)** | P1 | Planificador único |
| 4 puertas humanas | **Simplificar a 2** | P1 | Las demás quedan condicionadas a los validadores |
| Etiqueta "codigo" para todo bloqueo | **Eliminar** | P0 | Taxonomía con `documento_dañado` y `defecto_kit` |
| Skill que manda `--evidencia` en "en curso" | **Eliminar/corregir** | P0 | La evidencia se valida en la transición |
| ARCHITECTURE.md 68 KB / WORKFLOW.md 31 KB | **Simplificar** | P1 | Resumen ≤ 8 KB / ≤ 6 KB + archivo histórico |
| BACKLOG editado a mano | **Simplificar** | P2 | Generado desde el frontmatter |
| Telemetría derivada de git | **Eliminar como fuente primaria** | P1 | Git solo como evidencia de entrega |
| Tareas de una página | **Mantener** | — | Es tu mejor decisión de diseño |
| Skills cargadas bajo demanda | **Mantener** | — | Coincide con el *just-in-time context* |
| Estado en archivos | **Mantener** | — | Igual que el TODO.md de Pi; visible y editable |
| `modelos.json` por nivel | **Mantener** | — | Haiku construye, Sonnet planifica |
| El humano hace commit/push | **Mantener** | — | Ahora reforzado por permisos |
| Modo yolo | **Mantener, redefinido** | P2 | "Sin puertas intermedias", nunca "sin rieles" |

---

## Plan de estabilización en features pequeñas

Cada feature cabe en 1-3 tareas de una página y tiene una verificación objetiva. Orden sugerido: F37 → F38 → F39 → F40 primero (son las que cortan los bucles). **Regla de disciplina: después de F40, vuelve una semana al producto antes de seguir.**

- **F37 – Validador causal en cada escritura.**
  - Prepase de fences.
  - Códigos de regla.
  - Salida `--json`.
  - Hook `PostToolUse` (CC) y extensión `tool_result` (Pi).
  - *Verificación:* reproducir el archivo de DonFinancio. El agente recibe `E-FENCE-ABIERTO …:42` en la primera escritura, y en las evals el caso pasa con pass^5 = 100 %.
- **F38 – Firma de error y corte por repetición.**
  - `events.jsonl`.
  - Cálculo de firma.
  - Corte a la 2.ª repetición.
  - Paquete de escalación R/P/X.
  - *Verificación:* un caso de eval con un defecto irreparable termina en ≤ 2 rondas con `escalacion` registrada, y nunca con 9.
- **F39 – Taxonomía y dueño de la reparación.**
  - Tipos `documento_dañado` y `defecto_kit`.
  - Matriz de dueños en `flujo.mjs`.
  - Autorreparación de formato acotada (1 intento).
  - *Verificación:* 3 casos (estructural, contenido, kit) se enrutan al dueño correcto en 5/5 corridas.
- **F40 – `flujo.mjs` como coordinador determinista.**
  - `avanzar`, `bloquear`, `presupuesto`, `estado`.
  - STATUS escrito solo por el script.
  - Se corrige la skill contradictoria.
  - *Verificación:* el prompt del coordinador (o del planificador) queda ≤ 3500 B, y `grep` no encuentra instrucciones de "correr presupuesto" ni "sumar rondas" en ningún prompt.
- **F41 – Telemetría por eventos.**
  - Hooks de sesión, subagente, validación y transición.
  - `registrar.mjs` lee JSONL por máquina.
  - OTel opcional documentado.
  - *Verificación:* un bloqueo en el PC A aparece en el resumen generado en el PC B sin ningún commit.
- **F42 – Arnés de evals con Haiku.**
  - 12 casos, `claude -p` con topes, calificación por estado.
  - pass^k en `resultados.jsonl`.
  - *Verificación:* `node evals/correr.mjs --k 5` corre por debajo del presupuesto definido y produce una tabla por caso.
- **F43 – Simplificación de roles y puertas.**
  - Fusión de arquitecto y planificador.
  - Coordinador = script + prompt corto.
  - 2 puertas.
  - *Verificación:* las evals de regresión mantienen o mejoran pass^5 frente a la versión con 4 agentes.
- **F44 – Higiene documental con tamaño como puerta.**
  - Resúmenes vigentes, archivo histórico, BACKLOG generado, poda al cerrar la feature.
  - *Verificación:* la prueba de higiene en verde; `SessionStart` bloquea al abrir una feature si se supera un tope.
- **F45 – Operación remota.**
  - Hook de notificación.
  - Guía de Remote Control (CC) y tmux+ssh (Pi).
  - Escalaciones respondibles con una letra.
  - *Verificación:* completar una escalación R/P/X desde el celular sin tocar el PC.
- **F46 – Versión del kit entre PCs.**
  - `kit.json`, `kit.lock` y verificación en el inicio de sesión.
  - *Verificación:* un PC desfasado muestra una advertencia y registra `kit_desfasado`.

---

## Advertencias: qué está verificado y qué no

**Verificado en documentación oficial o código fuente:**
- Eventos y semántica de exit codes de los hooks de Claude Code; hooks dentro de subagentes; el carácter *best-effort* del campo `if`.
- `--max-turns` / `--max-budget-usd` y `maxTurns` / `maxBudgetUsd` del SDK.
- Variables y eventos OTel de Claude Code; requisitos y arquitectura de Remote Control.
- API de extensiones de Pi (`tool_call` con bloqueo, `tool_result`, `turn_end`, `agent_settled`, ubicaciones, fail-safe).
- StuckDetector de OpenHands; linter y ablación de SWE-agent; `max_reflections = 3` de Aider; límite de 3 en Roo Code; `recursion_limit` de LangGraph.
- Reglas de fences de markdownlint.
- Conceptos de evals de Anthropic (pass^k, estado final).
- Guía de CLAUDE.md de Anthropic.

**Fuentes secundarias o con reservas:**
- El tope de 8 continuaciones por stop-hook (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`).
- Que un deny en `PreToolUse` gane incluso en modo bypass.
- El aviso suave de Cline a las 3 llamadas.
- La lectura de AGENTS.md por Claude Code solo en ausencia de CLAUDE.md.
- Hay un issue abierto donde `exit 2` no bloqueó un Bash. Prueba tus hooks con un caso real antes de confiar en ellos.

**Opinión o experiencia de terceros:**
- Cognition (ambos posts), Zechner, Ronacher y Böckeler.
- El 90,2 % de Anthropic es una eval interna propia y en un dominio distinto (investigación).
- Los umbrales concretos que propongo (2 repeticiones, k=5, topes en KB) son criterio mío derivado de esas fuentes, no estándares.

**Sin confirmar en Pi:**
- Un equivalente nativo a `--max-turns` o a un tope de gasto.
- Cómo propaga límites y extensiones el paquete de subagentes de terceros.
- Las banderas exactas del modo no interactivo/JSON para el arnés de evals.
- Si los subprocesos de subagentes cargan las extensiones globales.

**Sin evidencia:**
- No encontré mecanismos documentados de detección de repetición en Codex CLI, Devin, Amp, Factory, CrewAI ni AutoGen. Las secciones correspondientes se apoyan en las herramientas que sí pude verificar.

## Fuentes

- [arxiv](https://arxiv.org/pdf/2405.15793)
- [dev](https://dev.to/masihmoafi/how-aider-works-under-the-hood-3ik7)
- [github](https://github.com/RooCodeInc/Roo-Code/pull/5752)
- [openhands](https://docs.openhands.dev/sdk/guides/agent-stuck-detector)
- [claude](https://code.claude.com/docs/en/remote-control.md)
- [dev](https://dev.to/truongpx396/openhands-deep-dive-build-your-own-guide-1al0)
- [github](https://github.com/OpenHands/software-agent-sdk/issues/6240)
- [github](https://github.com/OpenHands/software-agent-sdk/issues/6104)
- [github](https://github.com/OpenHands/software-agent-sdk/pull/6105)
- [github](https://github.com/Aider-AI/aider/issues/3865)
- [github](https://github.com/Aider-AI/aider/blob/main/aider/coders/base_coder.py)
- [github](https://github.com/Aider-AI/aider/issues/3450)
- [aider](https://aider.chat/HISTORY.html)
- [deepwiki](https://deepwiki.com/RooCodeInc/Roo-Code/5.5-error-handling-and-retries)
- [github](https://github.com/cline/cline/issues/15266)
- [github](https://github.com/itlackey/akm/pull/1282)
- [langchain](https://reference.langchain.com/python/langgraph/errors/GraphRecursionError)
- [langchain](https://reference.langchain.com/python/deepagents-code/config_manifest/RECURSION_LIMIT_DEFAULT)
- [priorstack](https://priorstack.com/langchain-agent-infinite-loop/)
- [machinelearningplus](https://machinelearningplus.com/gen-ai/langgraph-cycles-recursion-limits-agent-loops/)
- [dev](https://dev.to/gabrielanhaia/langgraphjs-stops-your-agent-at-25-super-steps-set-recursionlimit-on-purpose-828)
- [claude](https://code.claude.com/docs/en/agent-sdk/agent-loop)
- [docs](https://docs.rs/koda-core/0.2.21/koda_core/loop_guard/index.html)
- [dev](https://dev.to/runbyagent/claude-code-hooks-most-people-miss-12p2)
- [pi](https://pi.dev/docs/latest/extensions)
- [cognition](https://cognition.com/blog/multi-agents-working)
- [claude](https://code.claude.com/docs/en/hooks)
- [claude](https://code.claude.com/docs/en/sub-agents)
- [github](https://github.com/anthropics/claude-code/issues/23284)
- [learnblockchain](https://learnblockchain.cn/article/27115)
- [github](https://github.com/pokutuna/pi-extensions/blob/main/docs/extensions.md)
- [github](https://github.com/DavidAnson/markdownlint)
- [docs](https://docs.rs/crate/rumdl/latest/source/docs/md070.md)
- [docs](https://docs.rs/crate/rumdl/0.2.62/source/docs/md046.md)
- [pocoo](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)
- [github](https://github.com/Aider-AI/aider/issues/2350)
- [agentpatterns](https://agentpatterns.ai/workflows/headless-claude-ci/)
- [yage](https://yage.ai/share/pi-coding-agent-locked-out-en-20260518.html)
- [minai](https://minai.dev/posts/pi-coding-agent-lessons/)
- [developersdigest](https://www.developersdigest.tech/blog/pi-deep-dive-agent-toolkit-architecture)
- [claude](https://code.claude.com/docs/en/monitoring-usage)
- [last9](https://last9.io/docs/integrations/claude-code)
- [openobserve](https://openobserve.ai/docs/integration/ai/claude-code-tracing/)
- [betterstack](https://betterstack.com/docs/logs/claude-code/)
- [elastic](https://www.elastic.co/docs/reference/integrations/claude_code)
- [signoz](https://signoz.io/docs/claude-code-monitoring)
- [openobserve](https://openobserve.ai/docs/integration/ai/claude-code-tracing.md)
- [github](https://github.com/future-agi/docs/pull/926)
- [github](https://gist.github.com/pebeto/76c1e61120cb27445d53a00459db5fc8)
- [ai-eval](https://ai-eval.org/deep-dive/anthropic-demystifying-evals-for-ai-agents)
- [dev](https://dev.to/promptmaster/your-claudemd-is-too-long-what-to-cut-so-claude-code-follows-it-5713)
- [munderdiffl](https://munderdiffl.in/blog/claude-code-best-practices/)
- [dev](https://dev.to/eliran_kotzero_e1781dc487/why-your-long-claudemd-gets-ignored-and-how-to-fix-it-3hog)
- [anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [maketocreate](https://maketocreate.com/claude-md-best-practices-the-complete-2026-guide/)
- [medium](https://medium.com/@tentenco/the-claude-md-guide-how-one-file-turns-a-stateless-ai-into-your-long-term-coding-partner-b8806683df7f)
- [medium](https://medium.com/@gautsoni/claude-remote-control-anthropics-take-your-terminal-with-you-feature-and-how-it-relates-to-d0dbb01946c0)
- [helpnetsecurity](https://www.helpnetsecurity.com/2026/02/25/anthropic-remote-control-claude-code-feature/)
- [github](https://github.com/anthropics/claude-code/issues/28379)
- [github](https://github.com/anthropics/claude-code/issues/84929)
- [github](https://github.com/anthropics/claude-code/issues/51267)
- [anthropic](https://docs.anthropic.com/en/docs/claude-code/hooks-guide)
- [rednafi](https://rednafi.com/misc/pi-harness/)
- [thinhcorner](https://thinhcorner.com/writing/pi-agent)
- [pocoo](https://lucumr.pocoo.org/2025/12/22/a-year-of-vibes/)
- [thenote](https://thenote.app/post/en/armin-ronacher-agentic-coding-recommendations-hrsqldxxra)
- [daniliants](https://daniliants.com/insights/understanding-spec-driven-development-kiro-spec-kit-and-tessl/)
- [langchain](https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT.md)
- [frenchydigital](https://frenchydigital.com/blog/multi-agent-systems-architecture-2026)
