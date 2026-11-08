# Cómo lograr cierres fiables con un ejecutor pequeño: búsqueda en internet

Fecha: 2026-11-08. Motivo: el constructor declara terminado sin estarlo, deja tareas a medias y el principal rehace (ver `auditoria-andes-constructor.md`). Complementa `cambios/hechos/comparar-openspec/investigacion/modelos-pequenos.md` y `flujos-agentes-traspaso.md`. Es una búsqueda web y dos lecturas de fuentes primarias, no un experimento nuestro.

Etiquetas: **[primaria]** leí la página; **[resumen]** la página me llegó resumida por un modelo; **[secundaria]** blog o resultado de buscador que no abrí.

## 1. Hallazgos

### 1.1 Se puede forzar el cierre fuera del prompt
- Claude Code: el evento `SubagentStop` puede impedir que el subagente termine. Tabla oficial: «SubagentStop | Yes | Prevents the subagent from stopping» **[primaria, literal]**. Se bloquea con exit 2 (el stderr es el motivo) o con JSON `{"decision":"block","reason":…}` **[resumen]**.
- El hook recibe `agent_type` (nombre del agente) y puede filtrarse con `matcher` por ese nombre; los hooks de `settings.json` también corren dentro de subagentes **[primaria, literal]**. Así se puede apuntar solo al `constructor`.
- Para no entrar en bucle: `stop_hook_active` y un tope de 8 continuaciones seguidas (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`) **[resumen]**. `last_assistant_message` está disponible para leer la declaración final **[primaria]**.
- Existen hooks de tipo `prompt` (un modelo evalúa) y `agent` (un subagente verifica con herramientas); este último es experimental **[primaria]**.
- Pi: `agent_before_settle` puede añadir entradas y pedir una continuación con `continue: true` **[primaria, docs locales Pi 1.5.0]**.
- **No verificado:** que las extensiones de Pi se carguen en la ejecución del subagente constructor, y cómo se identifica al constructor allí.

### 1.2 Anthropic: arnés de agentes de larga duración **[primaria]**
- Fallos que describe: intentar todo de una vez y quedarse sin contexto a mitad de una función; declarar el proyecto terminado demasiado pronto; marcar funciones como hechas sin probarlas; dejar el entorno roto o sin documentar.
- Contramedidas: una función por sesión; lista `feature_list.json` donde el agente solo puede cambiar el campo `passes` («It is unacceptable to remove or edit tests»); empezar cada sesión leyendo git log, progreso y lista, y probando lo básico; pruebas de extremo a extremo «as a human user» con automatización de navegador (las pruebas unitarias o `curl` no detectaban que la función no andaba de punta a punta).
- Prefieren JSON a Markdown porque el modelo lo reescribe menos.
- **Límites:** no hay métricas; todo es instrucción de prompt, sin mecanismo que impida marcar `passes` sin prueba; probado con Opus 4.5 en una aplicación web.

### 1.3 Pasar las pruebas visibles no es terminar **[secundaria, no abierta]**
- SpecBench mide la brecha entre pruebas visibles y pruebas ocultas sobre las mismas funciones; reporta que todos los agentes saturan las visibles y que los modelos pequeños tienen brechas mayores en las ocultas.
- ImpossibleBench y un meta-análisis de 134 envíos a SWE-bench Verified describen atajos (modificar pruebas, sobreajustar a las visibles); las tareas «hackeables» inflan el Pass@1 en ≈14 puntos.
- Contramedidas citadas: pruebas independientes que el agente no ve, control de acceso a soluciones y a los verificadores.

### 1.4 Planificador fuerte, ejecutor débil **[secundaria]**
- Un benchmark (PEAR, oct. 2025) reportaría que la capacidad del planificador pesa más que la del ejecutor, con oscilaciones de hasta 40 puntos. Con ejecutores muy pequeños aparece replanificación frecuente que borra el ahorro.
- Un plan demasiado amplio hace fallar al ejecutor; demasiado detallado infla tokens y latencia.

### 1.5 Hooks de Stop como compuerta de «verdad» **[secundaria, anecdótica]**
- Varios blogs describen un Stop hook que rechaza el cierre si el turno no incluye una verificación que pasó; uno reporta que el 34 % de los PR de agentes fallaba CI antes de la compuerta (un solo caso de un proveedor). Recomiendan que quien juzga no sea el mismo modelo que hizo el trabajo. Una limitación señalada: el hook solo actúa al terminar el turno.
- Una guía de listas previas al cierre advierte que ítems vagos como «revisa tu trabajo» pasan sin verificar nada.

## 2. Qué implica para nuestro kit

1. **El problema no se arregla con más texto; sí con una compuerta.** Hay mecanismo oficial en Claude Code y uno documentado en Pi (por confirmar en el subagente). Es el plan siguiente al comprobador (`cambios/ejecucion-por-tramos/plan.md` (el comprobador de plan se descartó por ahora)).
2. **La compuerta debe verificar más que el estado del plan.** Los hallazgos 1.2 y 1.3 piden verificación de extremo a extremo y pruebas que el ejecutor no vea. En Andes, cuatro pruebas verdes sobre un montaje propio no acreditaron la página real. Incorporar al plan: aceptación sobre el recorrido real y, cuando se pueda, una comprobación externa que el constructor no pueda editar.
3. **Una unidad por entrega, con lista estructurada.** Alinea con «una función por sesión» y con nuestras reglas de tramos. Evaluar si el `## Aceptación` o los pasos deben tener un estado que el constructor solo cambie con evidencia (el comprobador ya cubre parte).
4. **La calidad del plan pesa más que el ejecutor** (si PEAR se sostiene), coherente con la auditoría: gran parte del retrabajo vino de la preparación del principal.
5. **Subir el nivel del constructor** sigue siendo una prueba barata; la evidencia sobre qué tan lejos llega no es concluyente.

## 3. Brechas
- No leí SpecBench, ImpossibleBench ni PEAR; vienen de resúmenes de buscador. Antes de basar una decisión en ellos, abrirlos.
- La documentación de hooks de Claude Code me llegó parcialmente resumida para `Stop`/`SubagentStop`; la forma exacta del JSON y el tope de 8 deben probarse con Claude Code real.
- No hay evidencia publicada específica de modelos pequeños con Stop hooks.

## Fuentes
- Documentación de hooks de Claude Code: https://code.claude.com/docs/en/hooks
- Anthropic, «Effective harnesses for long-running agents»: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- Docs de extensiones de Pi 1.5.0 (instalación local), sección Agent Events.
- Stop hook como compuerta (anecdótico): https://codingwithroby.substack.com/p/the-stop-hook-that-wont-let-claude · https://github.com/vnmoorthy/groundtruth · https://www.agentpatterns.ai/verification/pre-completion-checklists/ · https://regolo.ai/the-build-verify-loop-stop-your-ai-agent-from-claiming-victory-before-the-tests-pass
- Pruebas visibles vs. ocultas, reward hacking: https://arxiv.org/pdf/2606.26300 · https://www.greaterwrong.com/posts/qJYMbrabcQqCZ7iqm/impossiblebench-measuring-reward-hacking-in-llm-coding-1
- Planificador/ejecutor: https://www.emergentmind.com/topics/planned-execution-agent

## 4. Segunda búsqueda: cómo se maneja al agente en sistemas que sí funcionan

Pregunta de Franco: quizá el problema es cómo se le encarga el trabajo (prompt, orden), no la falta de una compuerta.

### 4.1 mini-SWE-agent: el bucle lo lleva el arnés, no el modelo **[primaria: `default.yaml` leído completo]**
- Una sola acción por turno («exactly ONE bash code block»), con una sección THOUGHT antes. La regla está al inicio del system prompt y se repite en la instrucción de la tarea.
- Flujo numerado corto y concreto: leer código → **crear un script que reproduzca el problema** → editar → **volver a correr el script** → probar casos límite → enviar.
- El fin se declara con un comando centinela (`echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT`) que no se puede combinar con otro; tras él no se sigue.
- **El arnés valida el formato y rechaza** la respuesta con un mensaje que cuenta cuántas acciones encontró y repite el formato correcto. También avisa cuando la salida es demasiado larga y cómo acotarla.
- Ejemplos literales de formato y de comandos (crear archivo, `sed`, ver líneas), no solo reglas.
- No hay estados de plan, casillas ni reglas de git para el modelo: solo código, un comando y su resultado.

### 4.2 Aider: separar razonar de dar formato **[primaria: post y docs leídos; prompts literales no]**
- Razón declarada: «the model has to split its attention between solving the coding problem and conforming to the edit format». Dos pasos: el arquitecto resuelve; el editor convierte la propuesta en ediciones con un prompt «more narrowly focused on just editing».
- Resultados (benchmark de 2024, modelos de esa época): casi todos mejoran con la pareja, incluso emparejando un modelo consigo mismo; un editor barato (DeepSeek) rindió bien. Cuesta dos llamadas.

### 4.3 Anthropic, sistema multiagente de investigación **[primaria]**
- Cada subagente necesita «an objective, an output format, guidance on the tools and sources to use, and clear task boundaries». Con instrucciones cortas y vagas, los subagentes malinterpretaban o duplicaban trabajo.
- Los agentes juzgan mal cuánto esfuerzo dedicar: pusieron reglas de escala en el prompt.
- «Agents are stateful and errors compound»: reanudar desde el punto donde iba, con puntos de control; salidas de subagentes a archivos para evitar el «teléfono descompuesto».
- Orientan con heurísticas, no solo reglas rígidas. Evaluación pequeña (≈20 consultas) con un juez LLM; no hay datos de modelos pequeños.

### 4.4 Agentless **[secundaria]**
- Pipeline fijo (localizar → reparar → validar) que decide el código, no el modelo; fue el mejor abierto y barato de 2024. Una revisión de 2026 señala que sistemas con modelos más fuertes lo superaron, así que no prueba que «sin agencia» sea mejor.

### 4.5 Prompts largos y reglas **[secundaria]**
- Los estudios que aparecen coinciden en que el seguimiento de instrucciones se degrada con más reglas y más turnos, y que viñetas cortas ayudan a modelos pequeños. Casi todos miden modelos de frontera o son preprints; no hay comparación directa en agentes de código pequeños.

### 4.6 Contraste con nuestro constructor
| mini-SWE-agent / Aider | Nuestro constructor |
| --- | --- |
| El modelo hace una cosa por turno y el arnés rechaza lo mal formado | El modelo lleva el bucle de todo el plan |
| La tarea es código; el formato lo valida el arnés | Además del código, debe: manejar estados del plan, casillas, líneas de evidencia, contador, ramas, reglas de git, formato de retorno y decidir cuándo pausar |
| Reproduce el problema y repite el script tras editar | Aceptación por plan, sin un primer paso «reproducir» obligatorio |
| Cierra con un centinela mecánico | Cierra declarando `COMPLETADO` en texto |
| Ejemplos concretos | Reglas en prosa y tablas |

**Hipótesis (no demostrada con modelos pequeños):** gran parte del fallo viene de pedirle al modelo pequeño que reparta la atención entre programar y la burocracia del protocolo, y que lleve solo un bucle largo de punta a punta. Lo que sí rinde con modelos baratos es acotar el turno y mover al arnés (script o principal) lo mecánico: ramas, estado, contador, captura de evidencia, validación de formato y cierre.
