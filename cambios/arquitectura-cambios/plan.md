---
estado: borrador
rama: feature/piloto-arquitectura-cambios
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Piloto de arquitectura de cambios

## Objetivo
Preparar una comparación reproducible que permita evaluar tres formas de entregar contexto a un modelo pequeño, antes de adoptar una arquitectura documental como estándar.

## Exploración
- El diseño, las fuentes, los riesgos y el protocolo propuesto están en [validación de modelos pequeños](validacion-modelos-pequenos.md) y [exploración](exploracion.md). Son hipótesis, no resultados de una comparación real.
- `docs/evaluaciones/openspec/protocolo.md` documenta un arnés que no está en este checkout. `evals/README.md` confirma su ausencia; no debe suponerse que se puede ejecutar ni reutilizar.
- `pruebas/revisor-luna/medir.mjs` se cita en `evals/README.md` como medidor de otra evaluación, con autoprueba sin red. Su utilidad para este piloto aún debe evaluarse sobre la base estable.
- La rama actual `feature/estructura-repo` contiene una reorganización y modificaciones sin finalizar. La implementación del piloto debe planificarse contra la base efectiva una vez disponible, sin interferir con ese trabajo.
- Pendiente de respuesta: herramienta y modelo pequeño para las corridas reales, y presupuesto máximo autorizado. Estos datos afectan la ejecución y medición; preparar material offline no autoriza inferencia ni gasto.

## Evaluación
- Adoptar directamente la estructura propuesta es rápido, pero no demuestra que ayude al modelo pequeño ni detecta costos de recuperación de contexto.
- Comparar solo la estructura actual con la fragmentada deja fuera una alternativa breve que podría funcionar mejor con menos carga documental.
- Recomendada: comparar el flujo actual, la propuesta fragmentada y un documento breve integrado, con casos y oráculos equivalentes. Preparar y comprobar primero el material sin inferencia; ejecutar después con condiciones y presupuesto explícitos. Una sola repetición por caso aporta señales iniciales, no confiabilidad estadística.

## Supuestos
- El piloto no modifica todavía las reglas de trabajo del kit; si se desea adopción inmediata, cambia el alcance y debe revisarse la evaluación.
- Se preparan al menos cuatro casos; reanudación y repeticiones adicionales dependen del presupuesto y de las condiciones de ejecución confirmadas.

## Decisiones ya tomadas
- La exploración existe siempre, pero puede ser breve y estar integrada en otro documento; los tramos son opcionales.
- Se comparan tres formatos con las mismas reglas e información esencial, y se mide corrección además de costo y contexto.
- Ejecutor: constructor, por tratarse de un cambio de varios pasos; la prueba de ejecutabilidad se completará cuando exista el plan ejecutable.

## Validación
La persona usuaria aceptó avanzar con la preparación del piloto. Faltan las condiciones de ejecución real y la revisión de la base estable antes de definir historias y solicitar aprobación del plan.

## Alcance previsto
Material reproducible, evaluación independiente, medición y autoprueba offline del piloto. Quedan fuera la adopción de la arquitectura como estándar, llamadas a modelos, credenciales, despliegue y cambios ajenos a la evaluación. Las rutas concretas se fijarán al revisar la base estable.

## Verificación prevista
La autoprueba offline deberá demostrar que los casos y variantes se descubren, que los oráculos detectan al menos un fallo sembrado y que no se producen llamadas reales; además se aplicará `./verify` según el plan definitivo. Los comandos específicos se fijarán tras definir la implementación.

## Pasos
Pendientes: no hay historias ejecutables mientras falten las condiciones y la revisión de la base.

## Evidencia
Sin ejecución del piloto.

## Notas
La revisión automática del plan se ejecutará cuando existan historias y comandos concretos, antes de solicitar aprobación para construir.
