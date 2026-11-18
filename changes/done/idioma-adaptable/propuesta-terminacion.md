# Propuesta de terminación — borrador

Este documento organiza la próxima iteración; no autoriza ejecutar cambios ni sustituye el plan aprobado. Se interpreta «sigamos con eso» como aceptación de conservar los literales de contratos históricos; si no era la intención, habrá que revisar esta decisión antes de ejecutar.

## Diagnóstico

- Los tramos 1 a 12 figuran revisados y aprobados en el plan. El tramo 13 tiene dos pasos marcados y tres pendientes; el 14 no comenzó. Las casillas no reemplazan una revisión del diff completo.
- `git diff --stat` muestra 427 archivos versionados con cambios, además de archivos nuevos sin seguimiento. Hay renombres representados como bajas y altas; deben revisarse juntos. No se debe descartar ni sobrescribir trabajo existente.
- La última ejecución completa de `./verify` terminó en `VERIFY OK`; fue anterior a la última restauración documental de literales. Las pruebas históricas focalizadas pasaron antes de esa restauración. Esto no demuestra por sí solo la exactitud histórica de todas las citas ni la ausencia de enlaces rotos.
- El tramo 13 reúne cientos de archivos bajo una sola casilla y exige cero referencias mientras preserva contratos heredados que contienen algunas. Esa contradicción, las revisiones repetidas y los cortes entre tramos prolongan el trabajo. Se detectaron sustituciones dentro de ejemplos literales: requieren revisión sistemática contra la versión original.
- No hay evidencia aquí de que traducir prompts por sí solo mejore resultados; las pruebas verifican contratos y comportamiento, no calidad comparativa de modelos.

## Política propuesta

Conservar literalmente los valores, frases y rutas que sean contratos ejecutables o evidencia histórica que deba citarse exactamente; registrarlos como excepciones identificadas por ruta y motivo, sin reproducir nombres en el informe final. Anonimizar prosa, ejemplos no contractuales y rutas personales cuando no rompan enlaces ni alteren evidencia. Mantener las excepciones ya acordadas para `LICENSE` y URLs funcionales. No leer secretos, `old/v1/registro/` ni temporales; no reescribir el historial. Si un caso no se puede clasificar con evidencia, registrarlo para decisión, sin modificarlo por sustitución masiva.

## Tramos propuestos para una ejecución continua

1. **Inventario y corrección de evidencia histórica.** Comparar las modificaciones existentes por grupos, empezando por citas, bloques de código, valores y rutas; restaurar los literales contractuales alterados y comprobar cifras, fechas, estructura y destinos. Clasificar cada coincidencia restante como referencia por anonimizar, contrato justificado, URL permitida o falso positivo. Resultado: inventario reproducible y lista concreta de excepciones, sin cambios masivos ciegos.
2. **Completar la anonimización y sus pruebas.** Resolver los casos no contractuales del inventario en documentación, fixtures y pruebas dentro del alcance; actualizar rutas y enlaces. Ejecutar pruebas históricas relevantes y `git diff --check`; preservar la sensibilidad de las aserciones. Registrar los archivos y resultados por lotes, no detenerse tras cada archivo.
3. **Auditoría integral y cierre técnico.** Anonimizar el inventario publicable, buscar referencias y rutas en archivos versionados y nuevos pertinentes, verificar enlaces modificados y revisar el diff completo por categorías, incluidos archivos nuevos y renombres. Ejecutar una sola vez la verificación completa final `./verify`; registrar omisiones, excepciones y resultados. Revisar el conjunto frente a aceptación y dejar el resultado listo para revisión de la persona usuaria.

## Mecánica propuesta

- Un único plan ajustado y una sola autorización para la secuencia completa; puntos de control breves por lote y revisión al final, sin solicitar confirmación ni compactación por cada grupo.
- Usar comprobaciones focalizadas durante la ejecución y `./verify` al final; repetir una comprobación solo si un cambio posterior afecta su resultado o aparece un fallo. Medir sus tiempos antes de fijar plazos.
- La ejecución debe respetar el ejecutor expresamente autorizado y las reglas vigentes de base y delegación; la rama actual contiene cambios y no se presume limpia. Resolver cualquier incompatibilidad de delegación sin perder ni revertir esos cambios.
- Detenerse solo ante una decisión de comportamiento o alcance que no esté resuelta, un fallo persistente o una condición de seguridad del plan. Informar progreso cada tres minutos mientras haya trabajo activo; no convertir cada informe en una puerta de aprobación.
- Antes de iniciar, actualizar los criterios A13 y A14 para reflejar las excepciones acordadas, convertir estos grupos en pasos ejecutables con pruebas y duración medida, y revisar el plan con el revisor. Hasta entonces el plan actual sigue parcial.
