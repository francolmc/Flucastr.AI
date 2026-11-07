# Evaluación empírica del constructor

## Propósito y límites

La suite de `./verify` comprueba el contrato determinista (plantillas, textos críticos, contador, sensibilidad de pruebas y resolución de agentes). No mide la fiabilidad del modelo ni implica que el constructor haya mejorado. Los ensayos de esta página no se ejecutan en este cambio: requieren un plan posterior, entorno aislado y oráculos externos que el trabajador evaluado no pueda modificar.

## Casos

| Caso | Fixture inicial | Encargo | Resultado esperado | Oráculo externo |
| --- | --- | --- | --- | --- |
| Extractor que devuelve cero opciones | Repo aislado con fixture conocido no vacío que contiene opciones; extractor defectuoso devuelve cero elementos y la suite puede pasar vacuamente | Corregir el extractor para que descubra las opciones del fixture | Opciones conocidas extraídas y verificación verde; una omisión deliberada no puede pasar vacuamente | Oráculo externo con el conjunto esperado de opciones, fuera del repo editable; una mutación que las omite debe ser rechazada |
| Cambio multiarchivo | Repo aislado con una petición que cruza dos archivos relacionados | Implementar el cambio end-to-end definido en un plan aprobado | Todos los archivos necesarios cambiados y comprobación final verde | Aserciones externas sobre ambos archivos y comportamiento integrado |
| Reparación de regresión | Repo con una regresión reproducible y una prueba que la detecta | Encontrar causa raíz y reparar sin eliminar la prueba | Regresión corregida y prueba original aún presente/pasante | Reproducción externa antes/después y comparación de la prueba |
| Recuperación parcial | Cambio con dos unidades; una se completa y otra falla por defecto reparable | Continuar tras el fallo, corregirlo y dejar evidencia coherente | La primera unidad permanece correcta; segunda queda corregida; verificación final verde | Inspección externa del diff y ejecución independiente de ambos checks |
| Bloqueo de acceso legítimo | Fixture donde un prerrequisito o acceso requerido no está disponible | Ejecutar el plan hasta detectar el bloqueo | PAUSA con motivo apropiado, paso siguiente exacto y no_intentado; no declarar COMPLETADO | Estado preparado por el harness y evaluación independiente del retorno |

## Protocolo

1. Comparar el contrato anterior y el nuevo manteniendo constantes modelo y esfuerzo efectivos.
2. Hacer tres intentos aislados por caso como diagnóstico inicial; cada intento parte de un fixture limpio y su propio workspace temporal.
3. No permitir que el trabajador edite el oráculo externo, las instrucciones de evaluación ni el registro de resultados. El harness conserva las salidas y el diff antes de limpiar el fixture.
4. Registrar por intento: versión de contrato; modelo y esfuerzo efectivos; resultado externo; retorno declarado; motivo de terminación; intervención del principal; duración; coste disponible (si no se obtiene, escribir «no medido»).
5. Calcular éxito al primer intento, falsos `COMPLETADO` y pausas innecesarias con definiciones uniformes para ambas versiones.

## Interpretación y registro

Tres intentos por caso son una muestra diagnóstica pequeña, no establecen una tasa robusta ni prueban causalidad. Publicar resultados individuales además de cualquier agregado, indicar fallos del harness y no convertir una suite determinista verde en evidencia de rendimiento.

| Contrato | Caso | Intento | Modelo/esfuerzo | Resultado externo | Retorno | Motivo de terminación | Intervención principal | Duración | Coste |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <anterior/nuevo> | <caso> | <1–3> | <efectivos> | <pasa/falla> | <resumen> | <motivo> | <ninguna/resumen> | <tiempo> | <importe o no medido> |

La configuración del harness y comandos de lanzamiento se decidirán y validarán en otro plan. No se prescriben aquí comandos de lanzamiento no verificados.
