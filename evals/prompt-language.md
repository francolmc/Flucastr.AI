# Protocolo para evaluar el idioma de prompts

## Objetivo y límites

Comparar instrucciones equivalentes en español e inglés para estimar si el idioma afecta su cumplimiento, las regresiones y el uso de tokens y costo. Este documento define un experimento futuro; no presenta resultados ni recomienda traducir prompts. No se ejecutan modelos, cambian prompts ni incurre en gasto hasta que la persona mantenedora apruebe el presupuesto, el proveedor/modelo y la decisión de evaluar la traducción.

## Unidad y pares de instrucciones

La unidad es un caso de trabajo con un contrato observable, su instrucción aplicable y un oráculo de aceptación escrito antes de producir las variantes. Se preparan pares ES/EN para:

1. Instrucciones de agentes: seleccionar al menos tres tareas representativas con límites y resultados verificables, incluyendo una de planificación/revisión y otra de ejecución.
2. Instrucciones de skills: seleccionar al menos tres flujos representativos con pasos y criterios de salida comprobables.

Para cada caso se conserva un único contrato, contexto, archivos de entrada, herramientas y oráculo. Dos personas bilingües redactan/revisan variantes independientes y resuelven discrepancias antes de la prueba; una revisión de equivalencia registra cada diferencia terminológica y confirma que no cambia permisos, obligaciones, condiciones, ejemplos ni criterios. Se congela el texto final y se registra SHA-256 por variante. No se traducen resultados del modelo para puntuarlos.

## Muestra y controles

El conjunto debe incluir seis pares como mínimo (tres de agentes y tres de skills), y al menos dos repeticiones independientes por idioma y caso. Se fijan antes de la corrida el conjunto de casos, versión del repositorio, modelo, configuración, herramientas disponibles, límites de salida y semilla de asignación. Las repeticiones usan sesiones limpias y orden balanceado para reducir efectos de orden; no comparten conversación ni memoria.

Una persona coordinadora asigna IDs aleatorios que ocultan el idioma a quienes puntúan. Se conservan la asignación y el mapeo ES/EN fuera del paquete de puntuación hasta que se cierren y firmen las etiquetas. Cuando sea posible, la misma persona no redacta el par y puntúa sus resultados. Los evaluadores aplican el mismo oráculo a ambas variantes sin conocer el idioma.

## Métricas

- **Cumplimiento**: proporción de requisitos obligatorios satisfechos por ejecución, con cada requisito calificado como pasa/falla y evidencia observable.
- **Regresión**: número y severidad de incumplimientos nuevos respecto al contrato y al conjunto de regresión congelado; cualquier efecto prohibido cuenta como regresión crítica.
- **Tokens**: tokens de entrada y salida reportados por el proveedor, separados por caso, idioma y repetición. Si no hay medición fiable, se registra como no disponible y no se estima a partir de caracteres.
- **Costo**: costo calculado con uso reportado y tarifa fechada/aprobada para el modelo y modalidad de ejecución. Se guardan fórmula, unidades, moneda y fuente de tarifa; si no hay tarifa verificable, se informa como no disponible.

Se publican resultados por caso y agregados, diferencias EN menos ES, número de observaciones, dispersión y datos faltantes. No se combina cumplimiento con costo en un único puntaje ni se infiere causalidad fuera del conjunto probado.

## Umbrales y decisión

Antes de ejecutar se requiere aprobación explícita de presupuesto y se registran modelo/proveedor, límite de gasto, muestra final, tolerancia aceptable de regresión y criterio de parada. El borrador propone como puerta de seguridad cero regresiones críticas y ningún requisito obligatorio que empeore de pasa a falla; cualquier caso así detiene la recomendación de adopción y exige revisión del par. El umbral para diferencias de cumplimiento, el margen de equivalencia, el nivel de confianza y el máximo de gasto quedan **pendientes de aprobación**; no se sustituyen por umbrales escogidos después de ver resultados.

No se afirma ahorro ni mejora antes de medir. Una diferencia de tokens o costo solo se describe para la muestra y condiciones observadas. Una traducción requeriría una decisión posterior separada, incluso si la comparación favorece una variante.

## Registro reproducible

Cada corrida futura debe guardar, en un directorio de resultados aprobado y sin datos sensibles:

- commit/versión, fecha, sistema de evaluación y hashes de instrucciones, casos y oráculos;
- autoría/revisión de equivalencia, idioma oculto, semilla, asignación y orden;
- modelo/proveedor/versionado, parámetros, herramientas, límites, región si aplica y configuración relevante;
- presupuesto autorizado, tarifa fechada, costo real y tokens de entrada/salida por ejecución;
- salida original, puntuaciones ciegas con evidencia, desacuerdos y resolución;
- exclusiones, errores, reintentos y cualquier desviación del protocolo.

La persona que coordina firma el cierre antes de revelar qué ID corresponde a cada idioma. Se publican las métricas agregadas junto con las condiciones y limitaciones, manteniendo suficiente registro para repetir el análisis. No se guardan secretos ni datos de proyectos reales.
