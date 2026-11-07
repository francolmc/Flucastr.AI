---
estado: listo
rama: fix/constructor-por-defecto
repos: [.]
ejecutor: constructor
---
# El constructor ejecuta siempre; el principal planifica, diagnostica y verifica

## Objetivo
Todo cambio con plan lo ejecuta el constructor. El principal solo ejecuta cuando Franco lo pide expresamente, y esa petición queda escrita en el plan.

## Supuestos
- Los arreglos claros y pequeños sin plan (paso 3 de `principal.md`) siguen siendo del principal: Franco no los marcó como problema. Si quiere que también vayan al constructor, se quita esa frase.
- La Prueba de ejecutabilidad se queda, pero como control de calidad del plan: fallar una pregunta obliga a mejorar el plan, ya no pasa el plan al principal.
- Lo que toque credenciales, despliegue o producción se deja fuera del alcance del plan; lo hace Franco.

## Alcance
`skills/planificar-cambio/SKILL.md` (regla 7 y comentario de la plantilla), `agentes/principal.md` (pasos 3, 4 y 5), `AGENTS.md`, `verify` (bloque 8i).
Fuera de alcance: `ejecutar-plan`, `constructor.md`, `modelos.json`, `old/`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque pasa las 4 preguntas de la Prueba: son ediciones de texto comprobadas con `grep`, sin depender de resultados en ejecución y sin tocar credenciales ni despliegue.
- Franco eligió «constructor siempre, principal solo diagnostica». Su queja: el principal se asigna los planes a sí mismo (`ejecutor: principal`).
- Causa: la regla 7 mandaba a `principal` si fallaba la pregunta 2 o la 4; la 2 falla con cualquier paso de build o prueba.
- Ahora, si una pregunta falla, el principal mejora el plan: investiga él lo que falte (1 y 3), parte el trabajo en pasos que el constructor corrige dentro del alcance (2) y deja fuera lo de credenciales o producción (4).
- `ejecutor: principal` solo se escribe si Franco lo pidió; la línea de razón cita su petición.
- Tras dos `PAUSA` por la misma causa, el principal no toma el plan: se lo propone a Franco y espera su respuesta.

## Escenarios
- CUANDO se escribe un plan ENTONCES lleva `ejecutor: constructor`, salvo petición expresa de Franco.
- CUANDO falla una pregunta de la Prueba ENTONCES el principal mejora el plan y repite la Prueba; nunca asigna `principal` por eso.
- CUANDO Franco dice «hazlo tú» en la puerta 1 ENTONCES `ejecutor: principal` y la razón cita su petición.
- CUANDO el constructor devuelve la misma `PAUSA` dos veces ENTONCES el principal se lo propone a Franco y espera.
- CUANDO la causa de una `PAUSA` es vaga ENTONCES el principal relanza con un tramo más estrecho, sin ejecutarlo él.

## Verificación
`./verify` — debe terminar en `VERIFY OK`, con el bloque nuevo 8i.

## Pasos
- [x] En `planificar-cambio`, regla 7, reemplaza «Falla la 1 o la 3 … Falla la 2 o la 4: `ejecutor: principal`» por «si falla alguna, mejora el plan y repite la Prueba».
  - evidencia: skills/planificar-cambio/SKILL.md, regla 7; grep de «Falla la 1 o la 3» y «Falla la 2 o la 4» = 0 coincidencias
- [x] En esa regla 7 agrega cómo mejorar: 1 y 3, investiga tú; 2, pasos que el constructor corrige dentro del alcance; 4, déjalo fuera del alcance.
  - evidencia: skills/planificar-cambio/SKILL.md, regla 7, frase «Cómo mejorarlo: si falla la 1 o la 3 … si falla la 4, déjalo fuera del alcance del plan»
- [x] En esa regla 7 agrega: el ejecutor es `constructor` salvo que Franco pida que ejecutes tú; en ese caso la razón cita su petición.
  - evidencia: skills/planificar-cambio/SKILL.md, regla 7, frase «El ejecutor es `constructor` salvo que Franco pida que ejecutes tú»
- [x] En la plantilla de `planificar-cambio`, la línea `ejecutor:` pasa a `constructor` con el comentario «principal solo si Franco lo pidió».
  - evidencia: skills/planificar-cambio/SKILL.md, plantilla, línea «ejecutor: constructor   # principal solo si Franco lo pidió»
- [x] En `principal.md`, paso 3, cambia «El ejecutor lo decide la regla 7 …» por «El ejecutor es `constructor` salvo petición expresa de Franco».
  - evidencia: agentes/principal.md, paso 3; grep de «El ejecutor lo decide la regla 7» = 0, grep de «El ejecutor es `constructor` salvo petición expresa de Franco.» = 1
- [x] En `principal.md`, paso 4, deja `ejecutor: principal` como caso de petición expresa de Franco, no como resultado de la Prueba.
  - evidencia: agentes/principal.md, paso 4, frase «Si dice `ejecutor: principal` (solo por petición expresa de Franco; la línea de razón la cita)»
- [x] En `principal.md`, paso 5, quita «o hazlo tú» del caso de `PAUSA` vaga y deja solo el relanzamiento con un tramo más estrecho.
  - evidencia: agentes/principal.md, paso 5; grep de «o hazlo tú» = 0
- [x] En `principal.md`, paso 5, agrega: tras dos `PAUSA` por la misma causa, propón a Franco ejecutarlo tú y espera su respuesta.
  - evidencia: agentes/principal.md, paso 5, frase «Tras dos `PAUSA` por la misma causa, propón a Franco ejecutarlo tú y espera su respuesta»
- [x] En `AGENTS.md`, reemplaza la viñeta «Ejecutor: …» por: constructor ejecuta siempre; el principal solo si Franco lo pide expresamente.
  - evidencia: AGENTS.md, línea 10, viñeta «Ejecutor: el constructor ejecuta siempre; el principal solo si Franco lo pide expresamente, y esa petición se escribe en el plan.»
- [x] En `verify`, antes de 9a, agrega 8i: `planificar-cambio` con «salvo que Franco» y sin «Falla la 2 o la 4»; `principal.md` con «petición expresa».
  - evidencia: verify, bloque «# 8i.» (línea 710), antes de «# 9a.»; bash -n verify, exit 0
- [x] En 8i agrega la prueba negativa: copia de `planificar-cambio` con «Falla la 2 o la 4» añadido debe fallar.
  - evidencia: verify, bloque 8i, variable cons_neg: copia con «Falla la 2 o la 4» añadido y `if textos_constructor` → fallo; bash -n verify, exit 0
- [x] Corre `./verify` y pega en *Evidencia* las líneas de 8g y 8i.
  - evidencia: ./verify, exit 0 (segunda corrida; la primera salió con exit 1 en 8g, ver Notas); salida en *Evidencia*

## Evidencia
$ ./verify
ok 8c: contrato del constructor presente (grep -c, siguiente=, no_intentado=, 3 corridas, git diff --stat, sin PARCIAL:); copias sin esas frases fallan
ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla
ok 8e: VERIFY_RAPIDO, docker system prune prohibido y timeoutMs presentes; el agente de Claude resuelve; copia sin VERIFY_RAPIDO falla
ok 8f: ceremonia de cierre, abrir el PR y rama base presentes; copia sin «ceremonia de cierre» falla
ok 8g: Prueba de ejecutabilidad en planificar-cambio y principal, y carga de ejecutar-plan presentes; copia sin la prueba falla
ok 8h: base: en planificar-cambio, «hacia su base:» en principal, «de base:» en constructor y ejecutar-plan; copia de ejecutar-plan sin «de base:» falla
== 3e. claude-<agente> y pi-<agente> con esfuerzo; reinstalar refresca; archivo sin marca se respeta ==
ok 3e: effort y thinking low->max al reinstalar, --effort en claude-constructor, archivo sin marca intacto, desinstalar limpia
ok 8i: planificar-cambio dice «salvo que Franco» sin «Falla la 2 o la 4»; principal dice «petición expresa»; copia con «Falla la 2 o la 4» falla
== 9a. migrar-proyecto: lista de reglas descartadas y prohibición de copiarlas ==
ok 9a: migrar-proyecto trae «Reglas de v1 que descarté», «no las copies» y Fxx; una copia sin la lista falla
VERIFY OK
exit 0

## Notas
- Rama `fix/constructor-por-defecto` creada desde `main` (base: `origin/main`); antes, `main` estaba limpio salvo `cambios/constructor-por-defecto/`.
- Primera corrida de `./verify`: exit 1 en 8g («falta algún texto de la prueba de ejecutabilidad»). Causa: al reescribir el paso 3 de `agentes/principal.md` quité la frase «Prueba de ejecutabilidad», que 8g exige. Corrección dentro del alcance: el paso 3 ahora dice «El ejecutor es `constructor` salvo petición expresa de Franco; la Prueba de ejecutabilidad (regla 7 de `planificar-cambio`) solo mejora el plan, no elige el ejecutor.» Coherente con *Supuestos* (la Prueba se queda como control de calidad). Segunda corrida: `VERIFY OK`.
- Decisión menor: en la regla 7 quedó la frase «Sea cual sea el ejecutor, …» sin cambios; la línea de razón en *Decisiones ya tomadas* sigue siendo obligatoria.
- Ruido preexistente en 8b (no es fallo): `grep: .../neg3/skills/definir-proyecto/SKILL.md: No such file or directory` sale en la salida de `verify`; la comprobación de esa copia pasa como se espera.
- No se hizo commit, push ni PR.
