# Validación de la arquitectura para modelos pequeños

Estado: evaluación de diseño, sin ejecución comparativa con modelos. La propuesta aún no está validada empíricamente.

## Investigación externa y contraste con el diseño

Consulta: 17 de noviembre de 2026. Las fuentes siguientes estudian agentes, tareas o modelos concretos; ninguna evalúa directamente este kit ni demuestra que el formato propuesto mejore a un modelo pequeño.

1. **Más documentación no garantiza éxito.** [Gloaguen y colaboradores, Evaluating AGENTS.md](https://arxiv.org/html/2602.11988), comparan archivos de contexto generados y proporcionados por desarrolladores en tareas de repositorios. En sus escenarios, los archivos generados aumentaron el costo y no mejoraron el éxito; los escritos por desarrolladores tuvieron otros resultados y tampoco permiten concluir que cualquier archivo adicional ayude. Su análisis no encontró un efecto fuerte de la longitud por sí sola. Implicación: comparar también una variante breve y evitar requisitos de archivos vacíos; medir el trabajo total, no presumir que la nueva documentación ahorra tokens.
2. **Encontrar el contexto es parte del problema.** [ContextBench](https://contextbench.github.io/) evalúa búsqueda de contexto y resolución en repositorios. Sus resultados dependen de la combinación de agente y modelo y muestran que recuperar el contexto correcto es una tarea separada de editar. Implicación: el tramo debe indicar rutas y secciones necesarias y el experimento debe registrar las lecturas; fragmentar documentos sin comprobar recuperación podría empeorar el resultado.
3. **La posición de la información puede importar.** [Lost in the Middle](https://arxiv.org/abs/2307.03172) observó sensibilidad a la posición en recuperación y preguntas sobre documentos. Eso respalda probar distintos tamaños y posiciones, no afirmar que toda división mejora la programación ni fijar un umbral universal. Implicación: incluir casos con información esencial en distintas posiciones y probar que el agente la aplica.
4. **Leer documentación no demuestra que se haya aplicado.** [Gao y Chen](https://arxiv.org/abs/2608.20195), en un análisis observacional de sesiones y PRs, encontraron que los agentes interactúan frecuentemente con instrucciones y notas, pero no observaron una secuencia explícita y consistente de validación basada en documentación. Es asociación descriptiva, no una prueba causal. Implicación: contrastar las lecturas con los resultados mediante oráculos externos e inspección de trazas.

**Veredicto:** hay fundamento para experimentar con contexto relevante, referencias explícitas y comprobación independiente; no hay evidencia suficiente para declarar validada la arquitectura propuesta, ni que separar siempre ahorre contexto. En particular, `specs/` más delta puede perder una restricción vigente, y la solución de enlazarla debe comprobarse con modelos reales. La comparación debe incluir también documentos reunidos y no solo el flujo actual frente al fragmentado.

## Diseño sometido a evaluación

- `specs/<capacidad>.md`: comportamiento vigente de una capacidad.
- `cambios/<cambio>/propuesta.md`: problema, exploración, alcance y decisiones.
- `spec.md`: modificación propuesta al comportamiento, referida a la capacidad vigente.
- `plan.md`: resultado de la feature, criterios globales, dependencias, estado y mapa de tareas.
- `tramo-N.md`: instrucciones ejecutables para una unidad, solo cuando sea útil.
- Una vez aceptado el resultado se actualiza `specs/` y se archiva el cambio; hasta entonces la especificación vigente no se presenta como modificada. En cambios sin comportamiento nuevo, el delta puede omitirse. La exploración es obligatoria pero puede ser breve y estar incorporada a otro documento.

## Revisión de escritorio: situaciones que debe resolver

| Situación | Riesgo para un modelo | Regla propuesta y resultado esperable |
| --- | --- | --- |
| Modificación sencilla de texto | Gastar contexto buscando cinco documentos vacíos. | Una exploración y comprobación breves; aplicar la vía pequeña vigente si corresponde. No crear `spec.md` ni tramos por obligación. |
| Agregar una condición a una capacidad existente | Leer solo el delta y perder restricciones anteriores. | El tramo identifica la sección vigente aplicable, el delta y la aceptación local. El paquete de ejecución incluye ambos: por ejemplo, conservar la regla de permisos existente y aplicar la nueva condición. |
| Dos tramos dependen de un contrato común | Interpretaciones distintas o fallo de integración pese a checks locales verdes. | El plan fija una fuente para el contrato, cada tramo la referencia y la comprobación global ejecuta el recorrido completo. Si el contrato es imprescindible y extenso, se selecciona la sección concreta sin quitar contexto necesario. |
| Decisión cambiada durante exploración | Seguir una decisión antigua copiada en un tramo. | Actualizar la fuente vigente y referencias afectadas; ante conflicto el constructor se detiene. El historial se conserva separado de instrucciones activas. |
| Tramo termina con verificación fallida | Marcarlo completo o ejecutar el siguiente. | El paso sigue pendiente, se registra evidencia y se respetan las condiciones de parada; solo se avanza después de resolver la falla conforme a las reglas. |
| Reanudar después de una sesión | Perder propósito, estado o próximo paso. | El mapa indica estado comprobado, siguiente tramo y enlaces; la lectura del plan, tramo y referencias obligatorias debe bastar sin historial conversacional. |
| Cierre de cambio aprobado | `specs/` describe la intención aunque la implementación falle o diverja. | Actualizar especificaciones únicamente después de revisión y aceptación, contrastando el resultado real; archivar junto con evidencia y preservar referencias. |

Estas son propiedades previstas del diseño, no observaciones de desempeño. No basta tener enlaces: hay que comprobar que el agente realmente puede leerlos, selecciona la sección correcta y que los permisos y el tamaño de entrada dejan disponible el contexto esencial.

## Protocolo experimental propuesto

**Pregunta:** ¿el nuevo formato mejora o mantiene la corrección y reduce el contexto o costo para un modelo pequeño frente al formato vigente, sin aumentar omisiones ni intervenciones? La respuesta se mide, no se deduce de la estructura de carpetas.

1. Preparar como mínimo cuatro casos reproducibles: edición simple, modificación que conserva una restricción vigente, dos tramos con dependencia e integración real, y contradicción o verificación fallida que exige pausa. Añadir un caso de reanudación si cabe en presupuesto. Cada caso incluye código inicial, encargo, aceptación independiente, pruebas externas y condiciones de parada.
2. Para cada caso crear tres variantes semánticamente equivalentes: flujo vigente; propuesta con `specs/` más delta y mapa; y variante breve con contexto esencial reunido en un solo documento. Misma información y reglas de conducta, con distinta organización; congelar hashes y pedir revisión de equivalencia antes de correr. La preparación y documentación se contabilizan por separado, también al comparar costo del ciclo completo.
3. Ejecutar cada terna en copias limpias y sesiones independientes con el mismo modelo pequeño, versión, esfuerzo, herramientas, presupuesto, permisos y límites. Alternar orden y repetir según presupuesto; registrar el orden. Si se usa una referencia mayor, identificarla y aplicar exactamente los mismos casos. Repeticiones pequeñas aportan indicios, no significación estadística.
4. Guardar configuración, hashes, solicitudes y respuestas sin secretos, documentos efectivamente leídos, resultado declarado, diff, ejecución de oráculos, tiempos, tokens de entrada/salida/razonamiento disponibles, costos estimados y facturación real si se conoce. Contar pausas justificadas e injustificadas, intervenciones y fallos de infraestructura; no descartar fallos silenciosamente.
5. Evaluar por caso: aceptación externa y regresiones; comprensión de restricciones y dependencias; conexión al recorrido real; pausa correcta ante contradicción o fallo; reanudación; falsos completados; tokens, latencia y costo tanto de ejecución como de preparación. Un ahorro no compensa perder un criterio obligatorio.

### Criterios de decisión del piloto

Como puerta inicial propuesta, ambos brazos deben ejecutar los mismos casos y condiciones; la propuesta solo avanza si cumple todos los criterios críticos de aceptación, no produce falsos completados en los casos ejecutados y pausa correctamente en las situaciones de parada. Comparar diferencias de recursos e intervenciones por caso, no solo promedios. Si alguno falla, analizar el transcript y corregir el diseño antes de concluir. Superar un piloto pequeño no prueba confiabilidad general ni garantiza desempeño de otros modelos.

### Presupuesto de contexto

Medir tokens realmente suministrados, incluyendo instrucciones de agente, herramientas, documentos, mensajes previos y margen de salida; los bytes de los archivos no son tokens. Registrar también lecturas adicionales. No fijar un límite numérico universal: establecer presupuestos por modelo y escenario antes de ejecutar, y detectar si el contexto necesario queda fuera. La selección de secciones debe conservar siempre criterios, restricciones y contratos aplicables.

## Estado real y siguientes pasos

`pruebas/continuidad/evidencia-real.md` registra sesiones reales de un ejercicio pequeño de continuidad y parada, pero no compara el formato propuesto ni acredita comportamiento en cambios complejos. `docs/evaluaciones/openspec/protocolo.md` describe una comparación de ejecución todavía no realizada, con controles económicos y autorización humana expresa para su modo de inferencia; no mide todo el ciclo de planificación. Durante la revisión actual, la ruta `pruebas/comparar-openspec/` indicada en ese protocolo no existe en el árbol de trabajo, que está atravesando una reorganización. Hay que localizar y revisar la versión estable del arnés antes de reutilizarlo.

El siguiente trabajo concreto es preparar fixtures equivalentes y el protocolo ejecutable en un plan separado, respetando el cambio de estructura en curso. Antes de llamadas con gasto deben estar demostrados aislamiento, límites y tarifas y cumplirse la autorización exigida por el protocolo aplicable. Hasta contar con resultados, recomendar la arquitectura como hipótesis fundamentada, no como solución validada para modelos pequeños.
