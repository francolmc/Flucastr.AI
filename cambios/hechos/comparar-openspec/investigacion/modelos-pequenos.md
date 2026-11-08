# Desarrollo con modelos pequeños o económicos: qué está respaldado

## Pregunta y alcance

¿Cómo obtienen buenos resultados de desarrollo con modelos como Luna, Haiku y modelos abiertos pequeños, y qué podría servir para nuestro principal → constructor?

Investigación de fuentes primarias. No se cambian prompts, modelos ni permisos; no se ejecutan pruebas pagadas. Las propuestas siguientes son hipótesis para evaluar, no decisiones aprobadas.

Conviene separar **económico/rápido** de **pequeño en parámetros**: no conocemos por estas fuentes el tamaño de Luna o Haiku. Un modelo abierto de 7B permite investigar el efecto del tamaño, pero no es una equivalencia de capacidad con Haiku o Luna.

## 1. Lo más relevante para Luna y Haiku

### La documentación recomienda tareas delimitadas; no garantiza autonomía extensa

La ficha de Luna lo presenta como modelo eficiente para tareas enfocadas y de alto volumen [1]. Anthropic describe Haiku 5.5 como subagente para trabajo bien definido y programación enfocada: ediciones directas y cambios pequeños y específicos, incluso en varios archivos [2].

Esto respalda probar **unidades funcionales acotadas**, no «un agente por archivo». No demuestra que un modelo económico no pueda completar tareas largas ni que nuestro caso se resolviera solo dividiéndolo.

El anuncio de Haiku 4.5 propone que un modelo más capaz descomponga un problema y delegue subtareas a Haiku [3]. Nuestra separación de roles tiene sentido como arquitectura; no basta para que cualquier plan completo sea una unidad adecuada para el trabajador.

**Contraste con Andes:** recuperar presentación, crear un lector/DTO, construir infraestructura Docker/Playwright, reconstruir referencias, adaptar CSS y verificar formularios/documentos son varias clases de incertidumbre en una misma ejecución. El problema no era simplemente leer muchos pasos: había que descubrir y reparar infraestructura a la vez que implementar y aceptar producto.

### Es necesario comprobar el modo efectivo de herramientas y razonamiento

La documentación de Luna indica que con herramientas y razonamiento debe utilizarse Responses; function calling por Chat Completions se admite con esfuerzo `none` [1, 4].

Esto abre una comprobación técnica concreta: proveedor/endpoint efectivo, esfuerzo enviado, herramientas y respuestas del runtime. **No he comprobado que Pi o el otro PC estén mal configurados.** El nombre del modelo y `high` en un archivo no bastan para confirmar lo que se ejecutó. No se deben leer credenciales para comprobarlo.

La guía actual de GPT-6 también advierte que sus recomendaciones de prompting parten de comportamiento observado en Astra y deben evaluarse con el modelo elegido [4]. No presentaría esos prompts como receta demostrada para Luna.

## 2. Tres mecanismos con evidencia, que no conviene confundir

### A. Herramientas simples y fiables, más observaciones ejecutables

mini-SWE-agent ofrece un bucle mínimo: shell, historial lineal y acciones independientes, utilizable con varios modelos [5]. Es un buen ejemplo de que un harness no necesita mucha lógica para ser útil. Su puntuación destacada no debe atribuirse a un modelo pequeño: la página menciona resultados con modelos de mayor capacidad.

El trabajo original de Anthropic sobre SWE-bench describe mejoras al hacer las herramientas menos propensas a errores: rutas absolutas y reemplazos de texto con coincidencia única, además de ejecutar reproducciones y tests [6]. Es evidencia con Sonnet, no un experimento específico de Haiku; sirve para identificar mecanismos, no para predecir porcentajes.

**Qué sí podemos extraer:** reducir decisiones accidentales sobre rutas, configuración, ejecución y edición; devolver errores claros y permitir corregirlos. Las contradicciones de Git no ayudan a un modelo pequeño ni se compensan con un objetivo más detallado.

**Qué no copiar:** dar shell irrestricta o permitir commits/PR. La simplicidad del mecanismo es compatible con nuestros límites actuales.

### B. Entrenamiento especializado en trayectorias de desarrollo

SWE-agent-LM-7B no obtiene su comportamiento solo de un prompt: su ficha describe Qwen 2.5 Coder Instruct ajustado con 5.000 trayectorias de SWE-agent + Claude 3.7 Sonnet [7].

SWE-Gym estudia entrenamiento con repositorios, runtimes y pruebas ejecutables, usando modelos Qwen de 7B, 14B y 32B [8].

**Consecuencia:** cuando alguien muestra un modelo pequeño resolviendo issues, hay que preguntar si es el modelo base o una variante entrenada específicamente para actuar como agente. No podemos reproducir automáticamente un resultado cambiando nuestro prompt de constructor. Tampoco estamos proponiendo entrenar un modelo propio.

### C. Más intentos y una selección mejor, no solo una autocorrección más larga

SWE-Gym estudia verifiers entrenados para ordenar trayectorias. En su configuración de 7B, el resultado en SWE-bench Lite pasa de 10 % a 13,3 % al seleccionar entre candidatos; el beneficio del verificador 7B se estabiliza tras cuatro muestras en ese experimento [8, sección 5.1].

S* combina candidatos, refinamiento secuencial y selección apoyada en ejecución; evalúa doce modelos y comunica mejoras también con uno de 3B [9]. Pero sus resultados son de generación de código en LiveCodeBench, no de desarrollo visual multiarchivo en un workspace.

**Consecuencia:** muchos resultados buenos incluyen entrenamiento, varios intentos y un selector competente. No son una garantía de pass@1 de un trabajador barato. Generar alternativas solo sirve si podemos evaluarlas con suficiente fiabilidad y el coste total compensa.

No recomendaría todavía varias ejecuciones del constructor: en nuestro caso los graders vacíos y la cobertura parcial harían que más intentos pudieran producir más salidas aparentemente verdes, no necesariamente mejores.

## 3. Qué hacen los diseños de agentes que sí conviene poner a prueba

Anthropic recomienda empezar por una solución simple, usar cadenas cuando el trabajo se descompone limpiamente y dirigir tareas sencillas a modelos económicos y difíciles a modelos más capaces [10]. Es una guía de diseño, no evidencia de que un enrutador concreto acierte en nuestro proyecto.

Traducido a hipótesis comprobables:

| Hipótesis | Aplicación al caso auditado | Señal que la validaría |
| --- | --- | --- |
| Unidades con aceptación cercana reducen la carga del trabajador | Mantener un solo plan humano, pero ejecutar primero un recorrido vertical pequeño; después ampliar, sin un plan por archivo | Menos intervención del principal y menos trabajo sustituido, no solo más retornos parciales |
| Infraestructura ya operativa evita gastar razonamiento en fallos ajenos al producto | Comprobar al inicio montaje productivo, CSS y un test real; preparar dependencias reutilizables para checks intermedios, conservando aceptación limpia final | Menos tiempo en reinstalaciones y configuración, mismo aislamiento y resultado externo |
| Reanudación con estado vigente supera un historial de notas acumuladas | Resumen corto de lo conservado, lo pendiente y las decisiones cerradas, reconstruido con diff y archivos | No volver a pedir la referencia histórica ya recuperada; continuar desde el punto correcto |
| Feedback específico supera «verify pasó/no pasó» | Relacionar fallo con requisito y prueba; comprobar sensibilidad sobre un defecto real | Detectar una omisión funcional, no solamente propagar `expect(1).toBe(2)` |
| El modo de ejecución importa | Comprobar endpoint, esfuerzo y herramientas efectivos | Poder reproducir la configuración sin atribuir comportamientos al nombre del modelo |

No son cambios a implementar sin aprobación. En especial, reasignar tareas al principal o cambiar modelo es una decisión posterior: nuestras reglas actuales mantienen constructor por defecto.

## 4. Qué no está demostrado

- Que Luna y Haiku rindan igual o fallen por la misma razón.
- Que más esfuerzo siempre compense más autonomía, contexto o dificultad.
- Que un plan más minucioso mejore resultados frente a un estado actual más breve y una aceptación mejor.
- Que añadir trabajadores, reintentos o un supervisor adicional ahorre coste total.
- Que un resultado en issues de Python o ejercicios de código transfiera a UI visual, accesibilidad, auth y bases de datos.
- Que el fallo de aplicar una instrucción leída se explique exclusivamente por longitud de contexto: es una hipótesis, no una causa establecida por la auditoría.
- Que todo el ahorro de tokens baratos sobreviva al tiempo de Docker, reanudaciones y correcciones del principal.

## 5. Qué medir antes de otro cambio de prompts

Una evaluación representativa debería incluir tres tipos de tarea: arreglo concreto con prueba existente; cambio multiarchivo con aceptación integrada; recuperación de trabajo parcial con una decisión de bloqueo ya resuelta.

Comparar primero **el mismo modelo y esfuerzo** con encargo completo frente a hitos funcionales, sin cambiar simultáneamente herramientas y prompt. Mantener el mismo objetivo final, permisos y oráculo externo. Cada repetición parte del mismo fixture en un entorno aislado; no reutilizar resultados aprendidos de una corrida como contexto de la otra.

Registrar:

- Cumplimiento externo al primer intento y tras las correcciones permitidas.
- Falso COMPLETADO y PAUSA innecesaria.
- Decisiones resueltas que vuelve a preguntar.
- Implementación que el principal debe reparar o sustituir, descrita por unidad, sin inventar porcentaje de reutilización.
- Tokens/coste de ambos agentes, tiempo de entorno y tiempo total; «no medido» donde falten datos.
- Modelo, versión cuando exista, endpoint y esfuerzo efectivos.

Después se puede comparar Luna/Haiku u otro modelo sobre ese mismo procedimiento, y solo posteriormente evaluar candidatos múltiples. Los resultados servirían para decidir límites de delegación sin convertir la impresión de una sesión en una regla general.

## Conclusión para nuestro kit

La evidencia favorece probar **encargos delimitados, herramientas sin fricción, feedback ejecutable y evaluación externa**. También muestra que parte de los resultados publicados depende de entrenamiento especializado y varios candidatos, no de instrucciones más extensas.

Nuestro constructor recibió en Andes suficiente trabajo como para producir una base reutilizable, pero además tuvo que construir el sistema que debía demostrar que esa base era correcta. Separar la incertidumbre del entorno, el avance funcional y la aceptación es una hipótesis más defendible que «el modelo pequeño necesita más órdenes». Aún requiere pruebas controladas.

## Fuentes primarias

[1] OpenAI — GPT-6 Luna, ficha y compatibilidad de herramientas.
https://developers.openai.com/api/docs/models/gpt-6-luna

[2] Anthropic — Claude Haiku, secciones Subagents y Simple coding.
https://www.anthropic.com/claude/haiku

[3] Anthropic — Introducing Claude Haiku 4.5, ejemplo de Sonnet descomponiendo trabajo y Haiku ejecutando subtareas. Se cita la arquitectura, no cifras de benchmark de imágenes no extraídas.
https://www.anthropic.com/news/claude-haiku-4-5

[4] OpenAI — Using GPT-6, límites, prompting y migración. Recomendaciones generales con advertencia de validarlas en el modelo elegido.
https://developers.openai.com/api/docs/guides/latest-model

[5] Equipo SWE-agent — mini-SWE-agent, diseño y límites del baseline.
https://mini-swe-agent.com/latest/

[6] Anthropic — Raising the bar on SWE-bench Verified with Claude 3.5 Sonnet, herramientas y retos de evaluación. Resultado histórico con otro modelo.
https://www.anthropic.com/research/swe-bench-sonnet

[7] SWE-bench — SWE-agent-LM-7B, ficha de entrenamiento de SWE-smith.
https://huggingface.co/SWE-bench/SWE-agent-LM-7B

[8] Training Software Engineering Agents and Verifiers with SWE-Gym, versión 2, ICML 2025; secciones 4 y 5.1. La lectura de 7B y su plateau procede del texto completo, no solo del abstract.
https://arxiv.org/html/2412.21139v2

[9] S*: Test Time Scaling for Code Generation. Se consultó el abstract; no se verificaron tablas ni protocolo completo. No se extrapolan sus cifras a repositorios.
https://arxiv.org/abs/2502.14382

[10] Anthropic — Building effective agents, prompt chaining, routing y orchestrator-workers.
https://www.anthropic.com/engineering/building-effective-agents
