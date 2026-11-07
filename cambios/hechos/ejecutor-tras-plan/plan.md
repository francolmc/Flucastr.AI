---
estado: listo
rama: feature/ejecutor-tras-plan
repos: [.]
ejecutor: principal
---
# El ejecutor se decide por la calidad del plan, no por el tipo de tarea

## Objetivo
Primero se escribe un plan que el constructor pueda seguir sin adivinar; con el plan terminado, una prueba de cuatro preguntas decide quién lo ejecuta (ya no el tipo de tarea) y la razón queda escrita para la puerta 1.

## Supuestos
- La prueba se aplica siempre, también cuando gana el constructor. Si Franco quiere razón solo para `principal`, cambia una frase en la regla 7.
- El nivel del principal (medio o alto) ya se elige en `modelos.json` (`agentes.principal.nivel`); este cambio no lo toca.
- Fuera de alcance: el nivel de esfuerzo de los modelos (Luna rinde como Opus solo en esfuerzo máximo; Haiku 5.5 tiene `effort`). Es otro cambio, porque toca el resolver.
- Cuando el principal ejecuta, debe cargar `ejecutar-plan` con la herramienta Skill (en `cierre-con-pr` lo hice de memoria). Si Franco lo ve de más, se quita un paso.

## Alcance
`skills/planificar-cambio/SKILL.md`, `agentes/principal.md`, `AGENTS.md`, `verify` (bloque nuevo 8g).
Fuera de alcance: `modelos.json`, resolver, instaladores, `README.md`, `old/`.

## Decisiones ya tomadas
- Ejecutor `principal`: es redacción de reglas entre agentes y no hay criterio previo con el que probar al constructor. El siguiente plan será el primero en pasar por la prueba nueva.
- Cambia el criterio y se hace explícito un paso (planificar, probar el plan, elegir ejecutor); el momento de decidir casi no cambia. La investigación sobre Haiku 5.5 y Luna no mide planes como los nuestros, así que la confianza viene de la calidad del plan, no del modelo.
- La prueba de ejecutabilidad son cuatro preguntas sí/no sobre el plan terminado: (1) cada paso trae su comprobación exacta; (2) ningún paso depende de un resultado que solo existe al ejecutar; (3) el plan dice qué hacer ante cada error previsible; (4) no toca credenciales, despliegue ni producción.
- Si falla (1) o (3), el principal investiga y mejora el plan y repite la prueba. Solo si falla (2) o (4) con el plan ya mejorado, ejecuta el principal.
- Se mantiene: dos `PAUSA` por la misma causa pasan el plan al principal.

## Escenarios
- CUANDO el plan está escrito ENTONCES el principal aplica la prueba antes de pedir la aprobación y anota el resultado en `## Decisiones ya tomadas`.
- CUANDO las cuatro respuestas son sí ENTONCES `ejecutor: constructor` y una línea «Ejecutor: constructor, prueba de ejecutabilidad aprobada».
- CUANDO falla el punto 1 o 3 ENTONCES el principal mejora el plan y repite la prueba antes de elegir.
- CUANDO falla el punto 2 o 4 tras mejorar el plan ENTONCES `ejecutor: principal` con el punto que falló.
- CUANDO el principal ejecuta ENTONCES carga la skill `ejecutar-plan` antes del primer paso.

## Verificación
`./verify` — debe terminar en `VERIFY OK`, con el bloque 8g nuevo.

## Pasos
- [x] En `planificar-cambio`, reescribe la regla 7: el ejecutor se decide con el plan ya escrito, mediante la «Prueba de ejecutabilidad».
- [x] En esa regla 7 lista las cuatro preguntas sí/no de `## Decisiones ya tomadas`, tal cual.
- [x] En esa regla 7 agrega: si falla la 1 o la 3, mejora el plan y repite; si falla la 2 o la 4, `principal`.
- [x] En esa regla 7 exige una línea de razón en `## Decisiones ya tomadas`, sea cual sea el ejecutor.
- [x] En la plantilla del plan, la sección `## Decisiones ya tomadas` menciona la línea «Ejecutor: … porque …».
- [x] En «Antes de pedir la aprobación» agrega: aplica la Prueba de ejecutabilidad antes de pedir el «sí».
- [x] En `agentes/principal.md`, paso 3, agrega: la regla 7 de `planificar-cambio` decide el ejecutor después de escribir el plan.
- [x] En el paso 4 de `principal.md`, cambia «ejecutas tú con `ejecutar-plan`» por «carga la skill `ejecutar-plan` y ejecutas tú».
- [x] En `AGENTS.md`, «Cómo funciona», agrega una viñeta: primero plan, luego prueba de ejecutabilidad, luego ejecutor.
- [x] En `verify`, antes de 9a, agrega 8g: «Prueba de ejecutabilidad» en `planificar-cambio` y `principal.md`; «carga la skill `ejecutar-plan`» en `principal.md`.
- [x] En 8g agrega la prueba negativa: copia de `planificar-cambio` sin «Prueba de ejecutabilidad» debe fallar.
- [x] Corre `./verify` y pega la salida de 8g en *Evidencia*.

## Evidencia
$ ./verify
...
ok 8g: Prueba de ejecutabilidad en planificar-cambio y principal, y carga de ejecutar-plan presentes; copia sin la prueba falla
VERIFY OK
exit 0
Cambios: AGENTS.md, agentes/principal.md, skills/planificar-cambio/SKILL.md, verify (+21 −5). Pasos 1 a 6 en planificar-cambio (regla 7, plantilla de Decisiones, «Antes de pedir la aprobación»); 7 y 8 en principal.md; 9 en AGENTS.md; 10 y 11 en verify 8g.

## Notas
- Ejecutó el principal; cargó `ejecutar-plan` con la herramienta Skill antes del primer paso, como pide este plan.
- Tras la aclaración de Franco, ajusté título, objetivo y una decisión del plan para decir «criterio» y no «orden nuevo».
- Franco dijo «ahora sí» y lo tomé como el «sí» de la puerta 1.
- Pendiente aparte: el nivel de esfuerzo de los modelos (resolver).
