# Exploración: arquitectura de documentos de cambio

Estado: propuesta para conversación; no modifica las reglas vigentes ni autoriza su implementación.

## Objetivo

Conservar el propósito completo de una feature y entregar a cada agente solo el contexto necesario para su decisión o tarea. Priorizar la comprensión de modelos pequeños sin asumir que todos tienen la misma ventana de contexto ni que una ventana grande garantice comprensión. La exploración existe siempre; su profundidad y los documentos resultantes dependen de la incertidumbre y el tamaño.

## Qué ocurre hoy

- `core/skills/plan-change/SKILL.md` ya contempla exploración, decisiones, aceptación, historias, tramos y documentos separados. La separación se decide según la complejidad; no hay una estructura única para todos los casos. Esa flexibilidad explica parte de la variación observada, sin demostrar por sí sola errores.
- El plan combina información necesaria para ejecutar con decisiones, notas y evidencia acumulada. En la copia examinada, `cambios/estructura-repo/plan.md` ocupa 261.439 bytes; el plan archivado de continuidad, 22.971 y su primer tramo, 2.010. Son ejemplos puntuales, no medidas de tokens ni evidencia de fallo causado por longitud.
- `cambios/hechos/continuidad/` muestra que ya es posible un índice y tramos autónomos; `pruebas/continuidad/evidencia-real.md` registra ejercicios controlados. La tabla de `docs/evaluaciones/tramos.md` está vacía; no equivale a decir que nunca se haya probado la continuidad.
- `docs/investigaciones/auditoria-andes-constructor.md` registra problemas reales de permisos, decisiones y conexión con el recorrido. Son riesgos pertinentes para diseñar la entrega de contexto; no se ha establecido que la arquitectura documental o el tamaño del modelo los causaran.
- El arnés de `docs/evaluaciones/openspec/protocolo.md` compara ejecución bajo condiciones definidas. La medición real aún no se ha ejecutado y su alcance actual no mide por completo el costo de explorar y planificar.

## Referentes y alternativas

| Enfoque | Aporte | Costo o límite para el objetivo |
| --- | --- | --- |
| Actual del kit | Roles, aceptación, verificación, revisión y tramos ya existen. | El documento principal puede crecer y obliga a localizar el estado relevante dentro del historial. |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec/blob/main/docs/explore.md) | Exploración separada; [artefactos y dependencias](https://github.com/Fission-AI/OpenSpec/blob/main/docs-lab/reference/schemas/spec-driven/index.md) hacen explícita la transición desde propuesta hasta tareas. | Adoptarlo completo agrega convenciones y archivos; su exploración es opcional, mientras aquí se propone siempre, ajustada al caso. |
| [Organic Driven Development de Gentle AI](https://github.com/Gentleman-Programming/gentle-ai/blob/main/docs/usage.md) | Escala el proceso: cambios sencillos con poca ceremonia; trabajo mayor con especificación, tareas y registro, apoyado por memoria. | Una memoria o un archivo único creciente requieren una estrategia clara de selección, vigencia y recuperación. |
| Propuesta híbrida | Exploración obligatoria proporcional, intención compartida, ejecución acotada y evidencia recuperable; reutiliza lo que ya existe. | Hay que diseñar compatibilidad, mantener enlaces válidos y medir si mejora resultados antes de imponerla. |

Recomiendo la opción híbrida. SDD es una familia de prácticas, no una garantía de calidad: una especificación útil debe expresar comportamiento y criterios comprobables. De ODD tomaría la adaptación al tamaño, sin depender de memoria implícita. El estudio [Lost in the Middle](https://arxiv.org/abs/2307.03172) muestra sensibilidad a posición y longitud en tareas estudiadas; no justifica fijar un límite universal de tokens ni atribuir todos los errores a modelos pequeños.

## Arquitectura propuesta

Una **feature** representa un resultado observable compartido. Su documento principal responde qué se busca, para quién, qué límites y criterios globales existen, qué decisiones rigen y cómo se relacionan sus unidades. Es el mapa estable; no debe crecer con cada salida de comando. Una unidad de ejecución es un tramo con objetivo, dependencias y comprobación propios. Una historia describe un resultado verificable; puede requerir uno o varios tramos.

```text
cambios/<feature>/
  plan.md             # intención, decisiones vigentes, aceptación global y mapa
  exploracion.md      # solo si el análisis no cabe claramente en el plan
  tramo-01.md         # solo si conviene separar ejecución; repetir según necesidad
  evidencia/          # opcional: resultados extensos, referenciados desde el estado
```

Los nombres se apoyan en las convenciones actuales; son una propuesta, no una migración decidida. Para algo sencillo basta `plan.md`, y para un cambio que cumple las seis condiciones actuales de cambio pequeño basta la exploración y comprobación en línea: no se elimina esa vía. Para trabajo mayor, el plan enlaza tramos y exploración. No se crean archivos por cumplir una cuota.

### Contenido mínimo por nivel

1. **Exploración siempre:** petición y resultado esperado; evidencia de lo existente; incertidumbres y riesgos; cómo comprobarlo. Si todo es evidente, puede ser unas líneas en el plan o la conversación según las reglas vigentes. Si existen alternativas o incertidumbre significativa, dejar análisis separado, fuentes, opciones y decisiones pendientes.
2. **Plan principal:** propósito, alcance y exclusiones; decisiones vigentes con enlaces a su justificación; comportamiento y errores relevantes; aceptación global observable; mapa de historias/tramos, dependencias y estado actual; verificación final y enlaces a evidencia. El criterio global vive aquí, sin copiarse a cada tramo.
3. **Tramo ejecutable:** objetivo acotado, archivos o superficies permitidas, contexto y contratos imprescindibles, prerrequisitos, pasos, comprobación concreta con resultado esperado, criterios de parada y enlace al plan. Incluir qué integración real debe seguir funcionando. Los criterios particulares viven en el tramo y el plan los referencia.
4. **Estado y evidencia:** una ubicación explícita y breve para el estado vigente de cada tramo, responsable y próxima acción; salidas extensas y cronología fuera del recorrido de lectura habitual. Una afirmación de terminado requiere comprobación y referencia a evidencia. Conservar el historial sin convertirlo en instrucción vigente.

### Regla de lectura y vigencia

El principal lee el mapa y la exploración necesaria para decidir; el constructor recibe el mapa mínimo, el tramo activo, las decisiones y contratos que este referencia, y el código pertinente. La revisión necesita además los criterios globales, diff y evidencia. Cualquier referencia obligatoria debe ser identificable y accesible: no se supone que el agente recordará conversaciones anteriores. Los documentos históricos completos se consultan cuando la tarea lo requiera.

Cada dato tiene una fuente principal: aceptación global en el plan, instrucciones y aceptación local en su tramo, estado vigente en el mapa de estado, justificación en exploración y resultados en evidencia. Las referencias no sustituyen el contenido necesario para ejecutar. Si hay contradicción, falta un contrato o una decisión afecta el resultado, detenerse y pedir resolución; no elegir silenciosamente el texto más reciente. Al cambiar una decisión, actualizar su fuente vigente y registrar el cambio con enlace al historial.

### Cuándo separar

- Una feature agrupa trabajo cuando comparte resultado, aceptación y entrega; no se divide solo por cantidad de archivos. Resultados útiles que pueden aceptarse y entregarse de forma independiente pueden ser features separadas, con una iniciativa o documento padre que conserve el cometido común.
- Crear una historia cuando se puede describir un comportamiento verificable y sus dependencias; crear un tramo cuando facilita ejecutar y comprobar una unidad coherente dentro de esa historia. No separar una operación atómica dejando el producto incoherente entre tramos.
- Usar el límite vigente de hasta tres archivos de producto mientras rija; si una unidad requiere más para mantener coherencia, esa tensión debe resolverse mediante una decisión de diseño y una modificación aprobada de la regla, no ignorándola.
- Las dependencias se ordenan explícitamente. Cada tramo declara qué entrega y qué necesita; la aceptación global comprueba que las piezas funcionan juntas, no solo que pasan por separado.

## Esfuerzo proporcional, independiente del riesgo

| Situación | Exploración y documentación sugeridas | Ejecución |
| --- | --- | --- |
| Sencilla, clara y de bajo impacto | Revisar el contexto y expresar resultado y comprobación en pocas líneas. | Si cumple las seis condiciones vigentes de pequeño, vía directa; si no, plan breve. |
| Acotada pero con varias decisiones o pasos | Comparar opciones y registrar decisiones; plan único con aceptación y pasos. | Un tramo cuando sea coherente; más solo si aporta control. |
| Amplia, incierta o transversal | Exploración explícita, alternativas, decisión validada y mapa de historias con dependencias. | Tramos autocontenidos, integración y revisión según riesgo. |

La incertidumbre determina cuánto investigar; el alcance y las dependencias determinan cómo dividir; el riesgo determina comprobaciones y revisión. Una modificación pequeña en líneas puede ser de alto riesgo. «Esfuerzo» aquí significa trabajo de análisis y documentación; el esfuerzo de razonamiento configurado por modelo es otra decisión que debe medirse, no una equivalencia automática.

## Ejemplo aplicado

Para un ajuste de texto claro: exploración breve del lugar y comportamiento existente, resultado esperado y comprobación; si cumple la definición de pequeño, edición directa sin feature artificial.

Para agregar continuidad de ejecución: la feature define que una historia aprobada pueda avanzar por tramos con condiciones de parada y revisión, preservando las reglas de aprobación. La exploración compara ejecución por tramo y continua. Un tramo puede actualizar el contrato del plan y comprobar su interpretación; otro conectar la ejecución real; otro verificar integración. Sus fronteras exactas deben surgir de las dependencias reales. La aceptación global comprueba que ante un fallo se detiene y que el resultado integrado cumple el recorrido, no solo que cada documento existe.

## Validación antes de adoptar

1. Diseñar ejemplos representativos: corrección sencilla, feature de un tramo, feature transversal, requisito ambiguo y caso con riesgo de integración o cambio de decisión. Usar repositorios y verificaciones reproducibles, con oráculos externos cuando sea posible.
2. Comparar el flujo actual y el propuesto con las mismas tareas, modelos, herramientas, estado inicial y presupuesto; incluir OpenSpec solo si se adapta el protocolo. Medir también la preparación y planificación, no únicamente la ejecución. Repeticiones pequeñas son exploratorias y no permiten generalizaciones estadísticas fuertes.
3. Medir criterios cumplidos y fallos de integración/regresión, falsos «terminado», decisiones perdidas, intervenciones humanas, tokens de entrada/salida, costo total, duración y costo de preparar documentos. Registrar contexto completo enviado, herramientas y ventanas, no inferir tokens desde bytes. Comparar modelos pequeños y al menos una referencia mayor si existe presupuesto.
4. Definir antes del piloto umbrales y reglas de evaluación acordes al presupuesto. No aumentar autonomía si el costo baja a costa de omisiones o errores. El arnés existente puede aportar fixtures y controles, pero necesita ampliación para medir el ciclo completo; no hay resultado real disponible que pruebe esta propuesta.

## Transición y decisiones pendientes

Mantener legibles los planes antiguos y los trabajos activos; ensayar el formato nuevo en un cambio nuevo antes de migrar. Si el piloto funciona, preparar un plan separado para actualizar skills, agentes, revisor, documentación y pruebas de compatibilidad, con reglas de lectura y estado inequívocas. La infraestructura de revisión debe comprobar referencias y coherencia útiles, sin imponer archivos vacíos ni falsos límites universales. No trasladar ni reescribir el historial activo durante esta exploración.

Decisiones para validar: si el mapa principal conserva el nombre `plan.md`; dónde se registra el estado vigente sin duplicación; si una iniciativa que agrupa features necesita documento propio; y qué modelos, casos y presupuesto se usarán en el piloto. Las reglas actuales de aprobación, seguridad, revisión y verificación siguen vigentes hasta que se apruebe un cambio concreto.
