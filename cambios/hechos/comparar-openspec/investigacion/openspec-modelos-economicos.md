# OpenSpec con modelos económicos: resultados encontrados y límites

## Alcance

Revisión del repositorio Fission-AI/OpenSpec, documentación, issues y código de un harness de evaluación. No se instala OpenSpec ni se lanzan modelos. Las cifras son resultados reportados por su autor, no reproducidos localmente.

Pregunta: ¿hay evidencia de que OpenSpec permita obtener buenos resultados de desarrollo con Haiku, Luna u otros modelos económicos?

## Hallazgo principal: sí hay una evaluación específica de Haiku

El PR [#2134](https://github.com/Fission-AI/OpenSpec/pull/2134), «openspec-beta skills, installed once per machine, with stable IDs and short decisions», reporta:

| Evaluación reportada | Skills anteriores | Skills beta |
| --- | ---: | ---: |
| Haiku, ejecuciones que pasan todos los checks | 42/65 (64,6 %) | 64/65 (98,5 %) |
| Sonnet, 43 escenarios × 5 repeticiones | 190/215 (88,4 %) | 211/215 (98,1 %) |
| Lectura de specs existentes en express | 4/15 | 15/15 |

**Es evidencia prometedora de sensibilidad a las skills, no una tasa de éxito general de desarrollo.**

En la consulta, el PR estaba **abierto, sin merge**. Su head era `6b61c3c4575e672e29547e5c40e6aac65bf395dc`. El autor figura como colaborador del repositorio; esto no equivale a validación independiente.

El resumen etiqueta el modelo como Haiku, pero no documenta allí su ID/versionado efectivo ni explica con precisión el desglose de esas 65 ejecuciones. No debe compararse directamente ese porcentaje con las 215 de Sonnet ni atribuirlo sin más a Haiku 5.5.

### Qué cambia la propuesta beta

Según el PR y los archivos revisados:

- Una skill central explica OpenSpec y las skills de cada operación son cortas y remiten a referencias.
- El flujo de planificación incluye un paso explícito de leer las specs existentes antes de redactar.
- Planifica lo que falta, explicita supuestos y conserva la separación entre proponer e implementar.
- Usa IDs estables de requisitos y decisiones cortas que pueden citar las tareas.
- El flujo apply obtiene del CLI estado, bloqueos, tareas, rutas y archivos de contexto, en lugar de inferirlos del historial.
- Tras cambiar una casilla, vuelve a consultar el progreso al CLI.

Son varios cambios simultáneos: **la evaluación no identifica cuánto aporta cada uno**. No prueba que los IDs o una skill más corta, por sí solos, expliquen la mejora de Haiku.

El PR también declara casos donde la beta no mejora y un aumento agregado de coste por ejecución de aproximadamente 11 %. Ese incremento no está desglosado como coste de Haiku y no equivale a coste por cambio aceptado.

## Qué mide realmente el harness

Se revisaron `scripts/skill-eval/README.md`, `run.mjs`, extractos de `scenarios.mjs` y la referencia beta de apply de la rama del PR.

El procedimiento:

1. Copia un fixture de una biblioteca pequeña de tareas, o un repositorio para escenarios seleccionados.
2. Instala skills en un proyecto temporal.
3. Ejecuta Claude Code headless, con el modelo seleccionable mediante `--model`.
4. Comprueba resultados mediante CLI, sistema de archivos y, en escenarios de implementación, tests.
5. Guarda checks, transcript, tokens, coste, turnos y tiempo.

Entre los escenarios hay propuestas, aplicación de cambios, reconciliación spec/diseño, bloqueos, verificación de una implementación incompleta, sincronización y archivado. Existen pruebas sobre repositorios reales, pero las filas de express e insyra del README evalúan principalmente **propuestas sin tocar código**. No son entregas completas de funcionalidades en esos repositorios.

### Límites importantes

- Muchos checks son de **comportamiento del workflow y estructura de artefactos**: no escribir código al proponer, conservar specs, detectar bloqueos o producir un cambio validable.
- Algunos escenarios apply sí ejecutan tests sobre el fixture; no convierten toda la batería en una evaluación de producto compleja.
- Algunas comprobaciones de verify buscan expresiones en el informe final. Por tanto, aunque el harness evita usar únicamente el autoinforme, no todos sus juicios son oráculos funcionales externos.
- El código del harness es público, pero su carpeta `scripts/skill-eval/results/` está ignorada en Git. No he auditado las 65 salidas ni encontrado en los materiales consultados un volcado completo que permita reconstruir esa cifra.
- Los escenarios con repeticiones no son 65 proyectos independientes; el porcentaje describe esa batería concreta.
- Se comparan **dos variantes de skills con OpenSpec**, no OpenSpec frente a ausencia de OpenSpec, ni frente a nuestro kit.
- El harness usa `bypassPermissions` en directorios temporales y realiza commits de preparación de fixtures. **No se debe ejecutar sin adaptación bajo las reglas de nuestro proyecto.** No lo ejecuté.

Por tanto, el resultado respalda: «unas skills revisadas mejoraron mucho el cumplimiento de una batería acotada con Haiku». No respalda: «OpenSpec hace que Haiku complete el 98,5 % de las tareas de desarrollo».

## Luna y otros modelos: no encontré un resultado equivalente verificable

No localicé en las fuentes examinadas una comparación controlada de Luna usando OpenSpec, con versión, tareas, presupuesto y resultados auditables. Esto es un límite de la búsqueda, no una prueba de que nadie lo haya hecho.

El issue [#1726](https://github.com/Fission-AI/OpenSpec/issues/1726) propone comparar estrategias flagship, tiered y budget por calidad y coste de artefactos e implementación. Es una **oferta de benchmark**, no resultados publicados; además, su autor declara interés comercial en un gateway. Las afirmaciones sobre ahorro o equivalencia de implementación del texto no deben tratarse como conclusiones experimentales.

El issue [#2209](https://github.com/Fission-AI/OpenSpec/issues/2209) comunica dificultades de modelos locales pequeños/medianos para elegir skills y propone una skill enrutadora. Habla de resultados «prometedores», pero no publica modelos exactos, tareas, muestras ni cifras. Es experiencia anecdótica útil para formular una hipótesis, no una validación.

## La documentación oficial no promete compensar un modelo menos capaz

La [FAQ](https://github.com/Fission-AI/OpenSpec/blob/main/docs/faq.md) recomienda modelos de alto razonamiento para **planificación e implementación**, y limpiar el contexto antes de implementar.

También hay un reporte de que las reglas en instrucciones pueden ignorarse y no tienen cumplimiento determinista: [#825](https://github.com/Fission-AI/OpenSpec/issues/825). La mención a Haiku allí es una instrucción para invocar un subagente, no prueba de que Haiku fuera quien desobedeció. No lo atribuyo a ese modelo.

Esto importa para nuestro problema: una especificación escrita puede mejorar la referencia disponible, pero no obliga al agente a consultarla ni demuestra que el código la cumpla.

## Qué aprender para nuestro flujo

La señal más interesante no es «cambiemos a OpenSpec», sino que existe una propuesta pública que **mide si los agentes usan el procedimiento y el contexto que se les entregan**.

Tres mecanismos merecen una comparación posterior, no implementación automática:

1. **Lectura del estado vigente, explícita y observable.** No basta con incluir la instrucción: medir si ocurrió y si se repiten decisiones cerradas.
2. **Estado calculado por herramientas.** Obtener bloqueos y pendientes a partir de archivos actuales; no dejar toda la reconstrucción a una conversación larga. Nosotros ya tenemos un contador y verify, pero no un estado estructurado equivalente al CLI.
3. **Skills sin duplicación y contexto por operación.** Probar si mejora cumplimiento sin perder información necesaria, manteniendo las dos puertas humanas y el constructor como ejecutor por defecto.

Antes de adoptar un framework, comparar el mismo modelo y las mismas tareas con nuestro flujo y OpenSpec, usando aceptación externa común y coste total de ambos agentes. La evaluación debe incluir producto y reanudación, no solamente archivos de planificación válidos.

## Conclusión

**Sí hay un dato específico y relevante con Haiku: 42/65 → 64/65 al revisar las skills de OpenSpec.** Su alcance es una evaluación propia de workflow, con código público y resultados no reproducidos aquí; corresponde a una propuesta aún no integrada.

**No encontré evidencia equivalente para Luna ni una demostración de que OpenSpec resuelva nuestro problema de desarrollo largo y recuperación.** Sí encontré mecanismos concretos y un diseño de evaluación que merecen estudiarse antes que añadir más instrucciones.

## Referencias de código

- PR y resultados reportados: https://github.com/Fission-AI/OpenSpec/pull/2134
- Harness, documentación: https://github.com/Fission-AI/OpenSpec/blob/6b61c3c4575e672e29547e5c40e6aac65bf395dc/scripts/skill-eval/README.md
- Runner: https://github.com/Fission-AI/OpenSpec/blob/6b61c3c4575e672e29547e5c40e6aac65bf395dc/scripts/skill-eval/run.mjs
- Escenarios y checks: https://github.com/Fission-AI/OpenSpec/blob/6b61c3c4575e672e29547e5c40e6aac65bf395dc/scripts/skill-eval/scenarios.mjs
- Apply beta: https://github.com/Fission-AI/OpenSpec/blob/6b61c3c4575e672e29547e5c40e6aac65bf395dc/skills/openspec-beta/references/apply.md

Los archivos se recuperaron mediante la rama indicada en el PR; los enlaces con SHA fijan el head observado para facilitar una revisión posterior.
