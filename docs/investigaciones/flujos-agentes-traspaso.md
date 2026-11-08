# Por qué ayudan OpenSpec, ODD y otros flujos de agentes

Investigación: 8 de noviembre de 2026 (UTC). Estado: investigación para conversar; **no es un plan de implementación ni una propuesta aprobada**.

## Pregunta y alcance

¿Cómo conseguir que un principal investigue y prepare un cambio y que un constructor —posiblemente menos capaz— lo ejecute sin reinterpretarlo, desviarse o abandonar antes de terminar?

Se revisaron instrucciones y código de OpenSpec, Gentle AI/ODD, GSD, Superpowers, GitHub Spec Kit y BMAD; publicaciones de Anthropic y evaluaciones públicas que permiten matizar sus promesas. Se contrastaron con nuestras skills `planificar-cambio` y `ejecutar-plan`.

No se instalaron estos flujos, no se ejecutaron agentes experimentales, no se contrató acceso API ni se retomó el piloto. Las fuentes se descargaron para lectura en `/tmp/flucastr-investigacion-flujos/`. Este documento conserva conclusiones y enlaces fijados; no depende de que sobreviva esa carpeta temporal. Las cifras externas **no se reprodujeron aquí**.

## Conclusión ejecutiva

**La ventaja plausible no está en escribir más documentación: está en reducir las decisiones que el ejecutor debe reconstruir, conservar el significado exacto del pedido y cerrar el ciclo contra un resultado observable.**

OpenSpec aporta un contrato de comportamiento persistente, contexto consultable por operación y estado calculado por una herramienta. ODD ataca especialmente la pérdida de requisitos en los traspasos y el exceso de orquestación. GSD hace explícita la diferencia entre completar tareas y conseguir un objetivo. Superpowers separa implementación y revisión, a costa de más llamadas. Spec Kit analiza contradicciones y cobertura entre documentos. BMAD diferencia intención aprobada de notas que el ejecutor puede cambiar.

No son alternativas completamente excluyentes: actúan sobre fallos distintos. Tampoco encontré una comparación que demuestre que alguno supere a nuestro kit en nuestra carga de trabajo. La evidencia disponible permite estudiar mecanismos, **no elegir un ganador universal**.

Para nuestro caso, la combinación más pertinente para discutir es: **intención protegida + referencia canónica sin resúmenes sustitutivos + tareas enlazadas con aceptación + comprobación del recorrido completo + recuperación por estado real**. No exige incorporar todos los frameworks ni crear otro agente coordinador.

## 1. OpenSpec: por qué puede producir buenos resultados

### 1.1 Separa comportamiento de implementación

En el esquema `spec-driven`, la propuesta explica el porqué, las specs definen el comportamiento, el diseño las decisiones técnicas y las tareas la ejecución. No todo requiere un diseño detallado: sus instrucciones indican cuándo aporta valor.

La distinción importante es semántica, no el número de archivos. Una spec dice qué debe observar un usuario o un consumidor, con entradas, salidas y errores; un plan técnico explica cómo conseguirlo. Esto permite verificar el comportamiento aunque cambie la implementación. [O1]

Ejemplo ilustrativo —no un cambio solicitado—: «el backend acepta `high`» no basta para la prioridad de una tarea. El contrato tendría que precisar también el valor por defecto, su conservación al guardar y qué ocurre con valores inválidos. Esos escenarios dificultan que una implementación parcial parezca completa.

### 1.2 Obliga a consultar lo que ya existe

Las instrucciones del snapshot revisado distinguen `openspec list --specs` de la lista de cambios activos, exigen investigar capacidades relacionadas y leer sus escenarios antes de decidir qué falta. Esto reduce el riesgo de inventar una capacidad duplicada o implementar contra una descripción histórica. [O1]

La beta del PR #2134 también refuerza lectura previa, referencias e IDs estables. **Es una propuesta separada:** no atribuyo sus resultados ni todas sus instrucciones a la versión estable 1.16.1 del arnés local. [O4]

### 1.3 Externaliza parte de la reconstrucción del contexto

`openspec status ... --json` y `openspec instructions apply ... --json` devuelven estado y contexto de la operación: rutas concretas, tareas, progreso e instrucciones. El agente no tiene que deducir todo eso de la conversación ni memorizar una estructura fija de carpetas. La aplicación lee esos archivos y avanza por tareas. [O2]

Este es un mecanismo más concreto que «tener Markdown»: una herramienta resuelve parte del trabajo administrativo que, de otro modo, hace el modelo de forma probabilística.

**Límite:** el estado de las tareas procede de artefactos editables. Una casilla marcada sigue sin demostrar que el producto funcione. El CLI no convierte por sí mismo el estado declarado en aceptación externa.

### 1.4 Conserva una referencia de comportamiento más allá del cambio

Las specs vigentes y los deltas evitan que el conocimiento útil quede solamente en una conversación o un plan archivado. Esto puede ayudar especialmente en repos existentes: el siguiente cambio tiene una descripción de comportamientos que preservar. [O1]

El beneficio depende de mantener esa referencia alineada con el código. Una spec obsoleta puede transmitir un error de forma muy organizada.

### 1.5 Su verificación es más prudente de lo que parece

La skill de verificación revisada separa completitud, corrección y coherencia, distingue lo no aplicable de lo no verificado y advierte expresamente que el estado de `apply` **no es un dictamen de verificación**. Pero también llama a su verificación *advisory*: parte de las comprobaciones busca evidencia en código y tests, no necesariamente ejecuta todo el comportamiento real. [O3]

Por eso «OpenSpec válido», «tareas completas», «implementación coherente» y «producto comprobado» no son sinónimos. Nuestro `verify` real no debería sustituirse por la validación documental de OpenSpec.

### Qué demuestra su resultado con Haiku

El PR #2134 reporta 42/65 → 64/65 ejecuciones con todos los checks para Haiku; 190/215 → 211/215 para Sonnet; y 4/15 → 15/15 en lectura de specs de un flujo express. En la consulta seguía abierto, sin merge. [O4]

Es una comparación entre **dos variantes de skills dentro de OpenSpec**, con varios cambios simultáneos. La batería mezcla cumplimiento del procedimiento, artefactos y algunas implementaciones con tests. No son 65 proyectos de producto independientes, ni OpenSpec contra nuestro kit. Las salidas completas no estaban publicadas en el directorio de resultados revisado. El ID exacto de Haiku no queda acreditado por el resumen.

Conclusión defendible: **la organización de instrucciones y el acceso al contexto pueden cambiar mucho el cumplimiento de un modelo económico**. No demuestra que OpenSpec haga que ese modelo termine el 98,5 % del desarrollo real ni identifica qué componente causó la mejora. El análisis anterior está en `cambios/comparar-openspec/investigacion/openspec-modelos-economicos.md`.

## 2. ODD de Gentleman Programming: su diferencia más útil

### Qué es y qué no es

ODD significa **Organic Driven Development**. Es el flujo de trabajo que Gentle AI distribuye a distintos agentes; no es por sí solo un orquestador multiagente independiente. Gentle Shell es una interfaz/runtime más próxima a esa función. El soporte y las capacidades varían entre adaptadores. [D1]

### 2.1 Primero autorización y exploración; luego proceso proporcional

Su recorrido parte de distinguir investigación/propuestas de autorización para modificar, explorar el código y resolver incertidumbres concretas. El tamaño no se decide mecánicamente por archivos o tests: una tarea es pequeña si puede retomarse desde el pedido y `git diff`; necesita un documento persistente si esa reconstrucción ya no alcanza. [D2, D5]

Esto evita dos extremos: una conversación informal para una migración difícil y un sistema de subagentes para corregir tres líneas. Es una heurística de **recuperabilidad**, no una garantía de corrección.

### 2.2 El traspaso por referencia evita la degradación semántica

Es el hallazgo más directamente conectado con nuestro problema. El documento de feature organiza:

1. `## Specs`: requisitos `S#`, conservando cadenas exactas, errores y ejemplos del usuario.
2. `## Tasks`: tareas `T#` relacionadas con esas specs.
3. `## Log`: pedido original y correcciones, al final para que no oculten el contrato vigente.

El worker recibe una referencia del tipo `Spec: odd/tasks/<feature>.md (read until ## Log). Do T#; S#.`. No se sustituye el contrato por una nueva paráfrasis del padre. El verificador lee el documento completo y devuelve un dictamen por `S#`; debe ejecutar los ejemplos y reproducir fallos reportados antes de descartarlos. Los cambios actualizan las specs afectadas y reabren sus tareas, no reinician todo. [D3]

**Por qué importa:** en `usuario → principal → coordinador → constructor`, cada resumen puede eliminar una excepción que parecía secundaria. Añadir coordinadores sin preservar la referencia aumenta las oportunidades de pérdida. Más agentes no recuperan información que nunca recibieron.

### 2.3 El worker no hereda autoridad ilimitada

El padre conserva la interacción con el usuario, la coordinación y la revisión. El worker no redelega; recibe aceptación, contexto, skills, comandos y superficies de edición autorizadas. La spec referenciada prevalece sobre resúmenes del handoff. Un hallazgo no autoriza por sí mismo a ampliar el trabajo. [D4]

La lección transferible es distinguir **«encontré algo»** de **«tengo permiso para arreglarlo»**. Las acciones Git de otros frameworks no se trasladan: en nuestro kit siguen siendo de Franco.

### 2.4 Verificación proporcionada al riesgo, no revisión infinita

En el código actual revisado, `review assess` activa automáticamente revisión para riesgo alto; un ítem concreto y una razón permiten escalar el riesgo. Los comentarios y documentos no son completamente consistentes sobre presupuestos de tareas medianas: la rama efectiva de `reviewAssessDue` es la referencia de esta conclusión. [D6]

No es correcto decir que ODD exige siempre un segundo agente independiente. La separación se usa donde justifica el coste. Tampoco conviene confundir este mecanismo con toda la metodología RDD que aparece en el mismo proyecto.

### Evidencia de ODD y Gentle Shell

El README declara que sus ejemplos de enrutamiento son corridas locales con aceptación oculta y **n=1 por celda**, con coste equivalente API. Reporta una mejora grande al dejar de sobredimensionar un bug pequeño; en una migración, la revisión mejora la aceptación inicial, pero sube el coste y apenas cambia el tiempo. [D1]

El PR Gentle Shell #1718 documenta el fallo de traspasos parafraseados y el cambio a specs por referencia. También reconoce un detalle decisivo: las instrucciones en assets de carga diferida **no se leyeron** durante la corrida fallida, por lo que el contrato breve se movió a instrucciones siempre presentes. Tener la regla en un archivo no implica que el agente la use. [D7]

Son observaciones y resultados publicados por el proyecto, no una demostración causal aislada ni reproducida aquí. Además, `gentle-ai/bench` mide principalmente fricción de revisión CLI mediante recorridos deterministas **sin llamar a modelos**: ese benchmark no demuestra capacidad del constructor. [D8]

## 3. Otros enfoques que aportan algo diferente

| Enfoque | Diferencia concreta en las instrucciones revisadas | Qué tomar como idea | Coste o incompatibilidad |
| --- | --- | --- | --- |
| **GSD** | Revisión del plan antes de ejecutar y verificación hacia atrás desde el objetivo; requisitos → tareas → artefactos → conexiones → datos reales. | No basta con «existe el endpoint y existe la UI»: comprobar que están conectados y llevan datos reales. | Más artefactos y coordinación; sus umbrales de tamaño son heurísticas, no leyes. No copiar commits automáticos. |
| **Superpowers** | Implementador fresco por tarea, revisión de cumplimiento y calidad tras cada tarea, revisión global final y ledger ligado al plan. | Separar autor de juez; reanudar solo el registro del plan correcto. | Más contextos, tokens y latencia. Su autonomía para dictar `Ruling` y seguir contradice nuestra reserva de decisiones de producto a Franco. |
| **GitHub Spec Kit** | `analyze` compara spec, plan y tareas: ambigüedad, contradicciones, requisitos sin tarea y tareas sin requisito, bajo una constitución. | Detectar pérdida o invención de trabajo **antes** de entregarlo al ejecutor. | Una matriz consistente puede seguir describiendo una solución equivocada; varios documentos pueden divergir. El análisis es una operación explícita, no asumir que siempre ocurrió. |
| **BMAD build actual** | Plan compacto con bloque de intención congelado tras aprobación, mapa de código y notas de implementación separadas. | El ejecutor puede registrar descubrimientos sin reescribir lo que el usuario aceptó; el resultado de revisar un mal plan no es solo «arreglar código». | No importar automáticamente su arquitectura completa de roles ni sus presupuestos orientativos de tokens. |
| **Anthropic, agentes largos** | Trabajo incremental, contexto persistente entre sesiones y, en otro arnés, planner/generator/evaluator con comprobación en la app viva. | Progreso recuperable y aceptación que recorre el producto, no solo lee el diff. | Sus resultados con modelos potentes y ejecuciones costosas no demuestran que el mismo esquema sea óptimo para un constructor económico. |

### GSD: el criterio de finalización más concreto

El plan-checker distingue explícitamente «plan completo» de «objetivo alcanzable». Comprueba cobertura, dependencias y tareas con archivos, acción, verificación y condición de terminado. El verificador posterior distingue artefactos existentes, sustantivos y conectados, y añade seguimiento del origen de datos para detectar interfaces conectadas a datos vacíos o fijos. [G1, G2]

Esto ataca un fallo frecuente: cada capa parece correcta por separado, pero el recorrido real no funciona. Sus búsquedas estáticas orientan la inspección; **no sustituyen** ejecutar un recorrido cuando es comprobable. El propio verificador conserva casos de verificación humana y no debe reportarlos como `passed`.

### Superpowers: contexto fresco y revisión no equivalen a garantía

Sus planes exigen decisiones ejecutables para alguien sin contexto del repositorio. Su modo de subagentes construye el contexto de cada implementador en lugar de transmitir toda la conversación, y separa revisión por tarea de revisión global. [S1, S2]

Pero la versión examinada también permite resolver conflictos con `Ruling: ...` y continuar sin esperar al humano. Ese intercambio —menos interrupciones a cambio de más decisiones autónomas— **no es automáticamente adecuado para nosotros**. Un constructor económico no debe adquirir autoridad de producto para evitar una pausa.

La evaluación propia de recuperación revisada usa cinco subagentes Sonnet por brazo en situaciones muy acotadas de identidad del ledger y reanudación; no es una tasa general de entrega de software. [S3]

### BMAD: separar intención estable de conocimiento adquirido

Su plantilla mantiene `Intent`, restricciones y matriz de entradas/salidas dentro de `<frozen-after-approval>`. El mapa de código y las notas de implementación viven fuera. Las preguntas que cambian intención se resuelven antes de aprobar; el ejecutor no puede convertirlas en supuestos. [B1, B2]

Esto ayuda a resolver una tensión real: el principal no puede prever todos los detalles, pero el constructor tampoco puede alterar la aceptación porque la solución inicial resulte difícil. La técnica puede cambiar dentro del contrato; el objetivo no.

## 4. Qué dice la evidencia, incluida la que contradice las promesas

Hay que separar cuatro niveles: instrucciones inspeccionadas, mecanismo plausible, resultados reportados y resultados reproducidos. Esta investigación llega a los tres primeros, no al cuarto.

| Fuente | Resultado publicado | Qué permite concluir | Qué no permite concluir |
| --- | --- | --- | --- |
| OpenSpec #2134 | Mejora grande de cumplimiento en su batería con skills beta. | El diseño de skills/contexto puede importar mucho. | Que OpenSpec supere a nuestro kit o dé un 98,5 % de éxito general. |
| Gentle AI / Gentle Shell | Ejemplos de enrutamiento n=1, corrección de pérdida de requisitos y comparación propia con Codex CLI. | Hay fallos concretos que justifican referencia canónica y proceso proporcional. | Que ODD sea siempre más rápido, barato o correcto. |
| Superpowers, evaluación de ledger | Prueba de presión con cinco subagentes nuevos por brazo y puntuación manual. | Evidencia local de comportamiento de recuperación. | Superioridad global en programación. |
| Experimento independiente SKT | 16 tareas, cuatro brazos, dos repeticiones: 128 corridas. Superpowers 24/32 aceptadas, igual que sin skills, con 3,07× tokens. | Más uso de tests y más proceso no garantizaron mayor aceptación en ese entorno. | Que Superpowers no sirva en otro modelo, repositorio o modo de ejecución. |
| Google, generación de tests guiada por contratos | +9,8 puntos porcentuales en detección de bugs y +2,5 en cobertura de ramas frente a su baseline. | Explicitar pre/postcondiciones puede mejorar **esa tarea** de generación de tests. | Validación integral de OpenSpec, ODD o Spec Kit. |
| ESEM 2026, artefactos de especificación en PRs | 88.052 PRs de 119 repos; no encuentra el efecto protector esperado tras controlar complejidad. | Más documentación asociada al PR no basta para asumir menos defectos. | Refutación de las herramientas SDD: el estudio dice que mide sobre todo issues/tickets y que la adopción de estas herramientas sigue sin probarse. |
| Anthropic, arnés de desarrollo largo | Ejemplos de apps con evaluación funcional y correcciones; el primer arnés comparado costó más de 20×. | El evaluador puede encontrar funciones aparentes que no funcionan. | Una mejora gratuita o una comparación equivalente con nuestro presupuesto/modelo. |

### Por qué SKT es relevante, con cautela

El autor publica prompts, aceptación oculta, referencia, corridas y análisis fijados a un commit. Se usa un backend Java, Codex `gpt-5.6-luna`, esfuerzo bajo; los packs se adaptan a Codex. En **28 de 30 corridas fallidas** el agente afirmó que el cambio funcionaba. Es un resultado del autor, no auditado ni reproducido por nosotros. [E1]

El caso más útil es una validación declarada mediante anotaciones que nadie ejecutaba. Añadir el código «correcto en apariencia» no hacía que la API rechazara el valor. También hubo una modificación de código compartido que rompía creación mientras intentaba arreglar edición: probar solo el comportamiento nuevo dejó la regresión sin detectar.

La lección no es «TDD no sirve» ni «las skills no sirven»: es que **la prueba puede compartir la interpretación incompleta del implementador**. Hace falta aceptación que represente el pedido y preserve comportamientos vecinos, no solamente pruebas que confirmen el parche.

### Anthropic también advierte contra acumular estructura

Su artículo más reciente revisado explica que el arnés se simplificó al pasar de Opus 4.5 a 4.6; retiró sprints mientras mantuvo planner y evaluador. También registra cambios adicionales de prompting y ejemplos, por lo que no atribuyo toda diferencia al modelo. El valor del evaluador depende de qué parte del trabajo exceda lo que el generador hace bien por sí solo. [A2]

No conviene copiar literalmente su planner que amplía ambiciosamente un pedido: nuestro alcance aprobado pertenece a Franco. Sí interesa su evaluación de la app en ejecución, que encontró funciones visuales sin interacción real.

## 5. Contraste con nuestro kit: qué ya existe y qué merece conversación

No partimos de cero. `skills/planificar-cambio/SKILL.md` ya exige investigar el código, decisiones cerradas, alcance completo por recorrido, escenarios A#, aceptación, sensibilidad de pruebas y un único `verify`. `skills/ejecutar-plan/SKILL.md` ya exige ejecución por unidades, evidencia real, cero pendientes y pausa ante cambio de comportamiento/alcance. Las casillas no se presentan como evidencia independiente.

Por eso **«añadir escenarios», «decir que termine» o «pedir que verifique» no son por sí solos mejoras nuevas**. El problema puede estar en qué parte del contrato se consulta y ejecuta realmente, en la calidad del plan o en la capacidad del modelo. Sin trazas del fallo no sería honesto atribuirlo todo al prompt.

Ideas para conversar, no cambios autorizados:

| Prioridad de discusión | Idea | Diferencia frente a lo actual | Fallo que atacaría |
| --- | --- | --- | --- |
| Alta | **Intención aprobada protegida**, separada de pasos/notas revisables. | La autoridad ya existe en las reglas; BMAD muestra cómo distinguirla dentro del documento. | Reescribir aceptación para poder declarar terminado. |
| Alta | **Referencia canónica con IDs estables** desde pedido/escenario hasta tarea y evidencia. | Ya hay A# y un único plan; falta considerar si cada paso conserva explícitamente su vínculo y si un coordinador introduce resúmenes sustitutivos. | Perder detalles, repetir aclaraciones o ejecutar tareas sin justificación. |
| Alta | **Cobertura por resultado y conexiones**, antes y después de implementar. | El alcance integral ya lo pide; GSD ofrece una forma explícita de buscar enlaces y datos reales ausentes. | «Cada pieza está» pero el producto no funciona. |
| Media | **Estado estructurado y recuperable**, derivado de archivos y comprobaciones. | Tenemos contador y estados; OpenSpec reduce más reconstrucción administrativa con su CLI. | Reanudar un plan equivocado, tomar un error de lectura por ausencia de pendientes, repetir trabajo. |
| Media | **Contrato breve siempre visible; detalles por referencia**. | Un plan compacto ya es objetivo; ODD muestra el riesgo de dejar reglas esenciales en assets que no se leen. | Una buena regla que nunca entra al contexto efectivo. |
| Condicional | **Revisión separada según riesgo**, con hallazgos accionables. | El principal ya verifica al volver; no justifica añadir un tercer agente por defecto. | Autovalidación indulgente o revisión costosa de cambios triviales. |

**No recomendaría todavía:** migrar a un framework completo, multiplicar coordinadores, importar commits automáticos, imponer revisión doble a toda tarea o permitir que el constructor resuelva unilateralmente decisiones de producto. Ninguna de esas medidas se sigue necesariamente de la evidencia.

## 6. Cómo encaja esto en principal → coordinador/constructor

La separación útil de responsabilidades sería conceptual, no una implementación acordada:

- **Principal:** investiga, preserva el pedido, resuelve decisiones con Franco y entrega contrato verificable con mapa de código suficiente. No convierte el plan en una transcripción de toda su investigación.
- **Coordinación, si hace falta:** asigna unidades, controla dependencias, reúne evidencia y reconstruye estado. No vuelve a resumir el contrato ni decide un alcance nuevo. Para un cambio pequeño puede ser función del principal, no otro agente.
- **Constructor:** elige detalles locales permitidos, implementa y prueba; no puede redefinir el resultado observable, omitir escenarios difíciles ni dar por resuelto un bloqueo de diseño.
- **Aceptación:** contrasta diff y comportamiento contra los requisitos originales y la intención aprobada. La afirmación del constructor, una skill ejecutada o un test verde aislado no bastan.

Ejemplo ilustrativo de trazabilidad mínima, no plantilla propuesta para instalar:

```text
S2/A2: guardar y volver a leer una tarea conserva priority=high.
T3: conectar el campo con la persistencia existente; cubre S2/A2.
Evidencia: crear → guardar → recargar → leer high en el recorrido real.
No basta: testear por separado el selector y un objeto en memoria.
```

La referencia por sí sola tampoco es una barrera determinista: el agente puede ignorarla. Los controles automatizables deben vivir en comprobaciones reales; la semántica restante requiere revisión. Esto no se arregla únicamente agregando MUST a otra instrucción.

## 7. Síntesis para la conversación con Franco

1. **OpenSpec no demuestra una capacidad mágica:** organiza y vuelve consultable lo que debe mantenerse estable mientras cambia el código.
2. **ODD ofrece la lección más directa para el handoff:** el pedido no debe degradarse al pasar entre agentes, y las reglas esenciales deben estar donde de verdad se leen.
3. **GSD ofrece el cierre más útil:** comprobar el objetivo, las conexiones y los datos, no solamente tareas terminadas.
4. **BMAD ayuda a proteger la intención; Superpowers, a separar autor y revisión; Spec Kit, a detectar contradicciones antes de ejecutar.** Se pueden adoptar ideas sin adoptar todos sus procesos.
5. **Nuestro kit ya recoge buena parte de estas ideas.** La siguiente conversación debería elegir qué fallo concreto queremos evitar, no qué framework instalar. No propongo reabrir el piloto ni pedir API para conversar sobre esto.

## Fuentes y snapshots revisados

Los SHA fijan el material leído; `main` y los PR pueden cambiar. La fecha de consulta es 2026-11-08 UTC. En las publicaciones con métricas se revisó el texto y su metodología declarada, no se ejecutó su código de evaluación.

### OpenSpec

- **O1.** [Esquema e instrucciones spec-driven](https://github.com/Fission-AI/OpenSpec/blob/0fa4a9705c20ef1c571fe3ded74435733e4b73a1/schemas/spec-driven/schema.yaml).
- **O2.** [Skill apply: estado, contexto y tareas](https://github.com/Fission-AI/OpenSpec/blob/0fa4a9705c20ef1c571fe3ded74435733e4b73a1/src/core/templates/workflows/apply-change.ts).
- **O3.** [Skill verify: alcance y límites](https://github.com/Fission-AI/OpenSpec/blob/0fa4a9705c20ef1c571fe3ded74435733e4b73a1/src/core/templates/workflows/verify-change.ts).
- **O4.** [PR #2134](https://github.com/Fission-AI/OpenSpec/pull/2134), head observado `6b61c3c4575e672e29547e5c40e6aac65bf395dc`; [harness y resultados reportados](https://github.com/Fission-AI/OpenSpec/blob/6b61c3c4575e672e29547e5c40e6aac65bf395dc/scripts/skill-eval/README.md). Estado consultado mediante API: abierto, no merged.

### Gentleman Programming

- **D1.** [Gentle AI README: flujo, enrutamiento, evidencia y límites](https://github.com/Gentleman-Programming/gentle-ai/blob/55240afb100ad6d2ef5fbe16f7be33a7693f77ad/README.md#organic-driven-development).
- **D2.** [Instrucciones compartidas del orquestador ODD](https://github.com/Gentleman-Programming/gentle-ai/blob/55240afb100ad6d2ef5fbe16f7be33a7693f77ad/internal/assets/skills/_shared/odd-orchestrator-sections.md).
- **D3.** [Contrato spec-by-reference](https://github.com/Gentleman-Programming/gentle-ai/blob/55240afb100ad6d2ef5fbe16f7be33a7693f77ad/odd/tasks/odd-spec-by-reference.md).
- **D4.** [Worker: autoridad, contexto y superficies](https://github.com/Gentleman-Programming/gentle-ai/blob/55240afb100ad6d2ef5fbe16f7be33a7693f77ad/internal/assets/opencode/agents/gentle-ai-worker.md).
- **D5.** [Gentle Shell #1723: tamaño por recuperabilidad](https://github.com/Gentleman-Programming/gentle-shell/pull/1723).
- **D6.** [Implementación efectiva review assess](https://github.com/Gentleman-Programming/gentle-ai/blob/55240afb100ad6d2ef5fbe16f7be33a7693f77ad/internal/cli/review_assess.go).
- **D7.** [Gentle Shell #1718: pérdida de requisitos y corrección](https://github.com/Gentleman-Programming/gentle-shell/pull/1718), merged; head consultado `7c89cca48d7912656ac7e0edde6539bcaef3a8fa`.
- **D8.** [Qué mide bench y qué no](https://github.com/Gentleman-Programming/gentle-ai/blob/55240afb100ad6d2ef5fbe16f7be33a7693f77ad/bench/README.md).

### Otros flujos

- **G1.** [GSD plan-checker](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/agents/gsd-plan-checker.md).
- **G2.** [GSD verifier](https://github.com/gsd-build/get-shit-done/blob/bdcaab2c752d9a33a1a1ca9acf3a3c81fb991815/agents/gsd-verifier.md).
- **S1.** [Superpowers writing-plans](https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/writing-plans/SKILL.md).
- **S2.** [Superpowers subagent-driven-development](https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/skills/subagent-driven-development/SKILL.md).
- **S3.** [Evaluación propia de ledger y reanudación](https://github.com/obra/superpowers/blob/22f0b463e7a5e579904dd6211a520321035526f7/docs/superpowers/specs/2026-07-06-sdd-plan-scoped-workspace-eval-results.md).
- **K1.** [Spec Kit analyze: cobertura y consistencia entre artefactos](https://github.com/github/spec-kit/blob/c43849408ac0de2ca6a52f14eaae71449776057b/templates/commands/analyze.md).
- **B1.** [BMAD build: planificación, preguntas y aprobación](https://github.com/bmad-code-org/BMAD-METHOD/blob/e734d3ac3c0f4ea31cc2c2bbbe79e86e54f2cae6/skills/bmad-build/step-02-plan.md).
- **B2.** [BMAD plan-template: intención congelada y notas](https://github.com/bmad-code-org/BMAD-METHOD/blob/e734d3ac3c0f4ea31cc2c2bbbe79e86e54f2cae6/skills/bmad-build/plan-template.md).

### Publicaciones y evaluaciones

- **A1.** Anthropic: [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents).
- **A2.** Anthropic: [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps).
- **E1.** [SKT: artículo y limitaciones](https://programmingtheloop.com/experiments/skills-tasks/); [informe fijado con materiales de reproducción](https://github.com/meabs/experiments/blob/766313eaf42070cbaaf565b95d6e33ed0c1986d2/2026-10-skills-tasks/REPORT.md). Se consultó también ese informe primario.
- **E2.** Google Research: [Grounding AI Agents in Contracts: An Empirical Evaluation of Spec-Driven Test Generation](https://research.google/pubs/grounding-ai-agents-in-contracts-an-empirical-evaluation-of-spec-driven-test-generation/). Los números aquí citados proceden del abstract publicado; no de una reproducción ni auditoría del dataset.
- **E3.** ESEM: [Specification Artifacts in Open-Source Pull Request Workflows Do Not Reduce Defects](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.ESEM.2026.84). Se consultó el abstract con su límite explícito sobre adopción SDD.

También se exploró [harness-eval](https://github.com/natea/harness-eval): describe una infraestructura de comparación y criterios ponderados, pero su existencia no demuestra por sí sola un ranking general. No se adoptó ni ejecutó. Una [revisión secundaria de ODD](https://siemprelisto.cl/tecnologias/organic-driven-development/22-evidencia-y-lecciones/) ayudó a localizar matices y fuentes; las afirmaciones centrales anteriores se contrastaron con README, instrucciones, PR y código primarios.
