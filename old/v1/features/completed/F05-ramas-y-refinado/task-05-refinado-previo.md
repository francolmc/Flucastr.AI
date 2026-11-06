# task-05 — Refinado previo: el planificador devuelve REFINAR y el coordinador lo tramita
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
`definitions/WORKFLOW.md` §9.2 define un refinado previo a la puerta 3, solo cuando se requiere: el planificador puede devolver hasta 5 preguntas con recomendación en vez de descomponer, el coordinador las traslada a Franco y, con las respuestas, el planificador las guarda en `features/Fxx-nombre/refinado.md` y descompone. Esta tarea escribe esa regla en los tres textos que la ejecutan.

## Contexto
- Repo: este, único repo. Leídos: `agentes/planificador.md` (secciones `## Principios`, `## Límites`, `## Bloqueos`, `## Skills disponibles`, `## Cómo trabajas`; el paso 3 de «Cómo trabajas» dice «máximo cinco preguntas, agrupadas»), `skills/descomponer-feature/SKILL.md` (`## Pasos` 1 a 5, `## Plantilla`, `## Completa`, `## Acotada`, `## Al terminar`) y `agentes/coordinador.md` (tras task-04 tiene `## Ramas por feature`; esta tarea parte de ese estado).
- `definitions/WORKFLOW.md` §9.2: criterio de «requiere» y mecánica en cuatro pasos (leído).
- Restricciones de validadores vigentes (`pruebas/comprobaciones/contrato-roles.mjs`): `descomponer-feature` debe contener «solo puedes mover la marca» y no contener «No cambies `BACKLOG.md`»; el planificador debe seguir diciendo «escribes en `STATUS.md`» y «Bloqueos» con la línea BLOQUEO; el coordinador conserva los seis estados en su tabla. `pruebas/comprobaciones/coherencia-features.test.mjs` y `formato-tarea.test.mjs` leen solo archivos `task-NN-*.md`, así que `refinado.md` en una carpeta de feature no los afecta (leído).
- Archivos a tocar: `agentes/planificador.md`, `skills/descomponer-feature/SKILL.md` y `agentes/coordinador.md`.

## Decisiones ya tomadas
- Criterio verificable (copiar literal de WORKFLOW §9.2, en el skill): «El refinado se requiere si puedes formular al menos una pregunta de alcance con dos o más respuestas razonables que producirían listas de tareas distintas y esa pregunta no está resuelta en `BACKLOG.md`, `PROJECT.md` ni en un `refinado.md` existente; si no puedes formularla, se omite y descompones directamente.»
- Nuevo paso 0 en `## Pasos` de `descomponer-feature`, titulado «Refinado (solo si se requiere)», antes del actual paso 1 (los demás pasos mantienen su número: el 0 no los renumera). Contenido: aplica el criterio; si no se requiere, sigue al paso 1; si se requiere y no hay `refinado.md` con las respuestas, no crees tareas y termina con la primera línea exacta `REFINAR: feature=Fxx; preguntas=<n>` seguida de hasta 5 preguntas numeradas, de más a menos importante, cada una con su opción recomendada; si el encargo trae las respuestas de Franco, escríbelas en `features/Fxx-nombre/refinado.md` (un archivo de decisiones, no una tarea; secciones por pregunta con la respuesta) y descompón; cada tarea cita `features/Fxx-nombre/refinado.md` en *Decisiones ya tomadas*.
- `agentes/planificador.md`: nueva sección `## Refinado` antes de `## Skills disponibles`, con el criterio en una frase, la línea `REFINAR: feature=Fxx; preguntas=<n>` y que no es un bloqueo ni una puerta; en `## Límites`, «Solo escribes `definitions/BACKLOG.md` y `features/**`» ya cubre `refinado.md`, no se cambia.
- `agentes/coordinador.md`: nueva fila en la tabla de decisión: «El `planificador` responde con la primera línea `REFINAR: feature=Fxx; preguntas=<n>`» → «No es puerta ni bloqueo: registra las preguntas en «Espera a Franco» de `STATUS.md`, pregúntaselas a Franco en la conversación y te detienes. Con sus respuestas, vuelve a delegar al `planificador` (`descomponer-feature`) incluyendo las respuestas en el encargo». La fila no debe contener estados de tarea ajenos al sentido de la fila.
- No hay conteo fijo de preguntas más allá del máximo 5 ya aprobado. Yolo no se menciona (es F06).

## Alcance / Fuera de alcance
Alcance: los tres textos con las decisiones de arriba.
Fuera de alcance: validadores (task-06), crear un `refinado.md` real, modo yolo y la rama de `REFINAR` en yolo, cambios de plantilla de tarea, `crear-backlog`, `BACKLOG.md`, `definitions/`.

## Pasos
1. En `skills/descomponer-feature/SKILL.md`, añadir el paso 0 con el criterio literal y la mecánica. Resultado: `grep -c 'REFINAR: feature=Fxx; preguntas=<n>' skills/descomponer-feature/SKILL.md` devuelve al menos 1 y la frase «solo puedes mover la marca» sigue presente.
2. En `agentes/planificador.md`, añadir `## Refinado`. Resultado: la sección aparece antes de `## Skills disponibles`.
3. En `agentes/coordinador.md`, añadir la fila de la tabla. Resultado: la tabla sigue válida (cada fila una línea que empieza por `|`).
4. Correr la *Verificación*.

## Criterios de aceptación
1. Los tres archivos contienen `REFINAR: feature=Fxx; preguntas=<n>`; el skill contiene `features/Fxx-nombre/refinado.md`. Se comprueba con los `grep`.
2. El skill contiene el criterio («dos o más respuestas razonables») y el máximo de 5 preguntas. Se comprueba con `grep`.
3. Los contratos de roles previos siguen pasando. Se comprueba con `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.
4. Solo cambiaron esos tres archivos. Se comprueba con `git status --short agentes skills`.

## Verificación
```
grep -c -F 'REFINAR: feature=Fxx; preguntas=<n>' agentes/planificador.md skills/descomponer-feature/SKILL.md agentes/coordinador.md
grep -c -F 'features/Fxx-nombre/refinado.md' skills/descomponer-feature/SKILL.md
grep -c -F 'dos o más respuestas razonables' skills/descomponer-feature/SKILL.md
grep -c -F 'solo puedes mover la marca' skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs
git status --short agentes skills
```
Esperado: cada `grep -c` muestra un número mayor que 0 por archivo; las pruebas con `fail 0`; `git status` lista los tres archivos de esta tarea entre sus cambios.

## Evidencia

Salida real, en `/Users/franco/Codes/flucastr/Flucastr.AI`:

```
$ grep -c -F 'REFINAR: feature=Fxx; preguntas=<n>' agentes/planificador.md skills/descomponer-feature/SKILL.md agentes/coordinador.md
agentes/planificador.md:1
agentes/coordinador.md:1
skills/descomponer-feature/SKILL.md:1

$ grep -c -F 'features/Fxx-nombre/refinado.md' skills/descomponer-feature/SKILL.md
2

$ grep -c -F 'dos o más respuestas razonables' skills/descomponer-feature/SKILL.md
1

$ grep -c -F 'solo puedes mover la marca' skills/descomponer-feature/SKILL.md
1

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs
✔ muestra válida mínima no tiene errores (3.464792ms)
✔ rechaza regla 1: name no coincide con la clave del agente (0.291209ms)
✔ rechaza regla 2: modelos.json no declara al constructor (0.073167ms)
✔ rechaza regla 3: el coordinador no delega en el constructor (0.067916ms)
✔ rechaza regla 4: una skill no aparece en ningún agente (0.082125ms)
✔ rechaza regla 5: el planificador no tiene la línea de bloqueo (0.07175ms)
✔ rechaza regla 6: el constructor no dice que no escribe en STATUS.md (0.078917ms)
✔ rechaza regla 7: la tabla del coordinador pierde el estado bloqueada (0.094667ms)
✔ rechaza regla 8: descomponer-feature prohíbe tocar BACKLOG.md (0.084584ms)
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (1.712167ms)
ℹ tests 10
ℹ pass 10
ℹ fail 0

$ git status --short agentes skills
 M agentes/constructor.md
 M agentes/coordinador.md
 M agentes/planificador.md
 M skills/descomponer-feature/SKILL.md
 M skills/ejecutar-tarea/SKILL.md
```

Comprobaciones adicionales (criterio 2 y tabla):

```
$ grep -c -F 'hasta 5 preguntas' skills/descomponer-feature/SKILL.md
1

$ grep -n '^## ' agentes/planificador.md
12:## Principios
20:## Límites
28:## Bloqueos
36:## Refinado
40:## Skills disponibles
49:## Cómo trabajas
55:## Antes de entregar

$ grep -n '^|' agentes/coordinador.md   (filas 30 a 43; cada una empieza por |; la fila nueva es la 35)
```

Criterios de aceptación:
1. Cumplido: los tres archivos contienen `REFINAR: feature=Fxx; preguntas=<n>` (1 cada uno) y el skill contiene `features/Fxx-nombre/refinado.md`.
2. Cumplido: el skill contiene «dos o más respuestas razonables» y «hasta 5 preguntas».
3. Cumplido: `node --test pruebas/comprobaciones/contrato-roles.test.mjs` con `pass 10`, `fail 0`.
4. Cumplido en lo que esta tarea tocó: los archivos modificados por esta tarea son `skills/descomponer-feature/SKILL.md`, `agentes/planificador.md` y `agentes/coordinador.md`. `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` ya aparecían modificados en el estado de git del inicio de la sesión; no los toqué. Ver *Notas*.

## Notas

- Hueco menor 1: el encargo de la tarea dice «termina con la primera línea exacta» para `REFINAR`. Lo escribí como «responde con la primera línea exacta `REFINAR: feature=Fxx; preguntas=<n>`, seguida de hasta 5 preguntas», que es lo que pide *Decisiones ya tomadas* (la primera línea es la que el coordinador lee).
- Hueco menor 2: la cita de `refinado.md` en *Decisiones ya tomadas* de cada tarea se puso dentro del mismo paso 0 del skill, sin tocar la plantilla de tarea (fuera de alcance).
- Criterio 4 y estado de git: `git status` lista también `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md`, que ya estaban modificados antes de esta sesión (snapshot de git del inicio). No los editó esta tarea; no se hizo ningún comando git que cambie el árbol ni de rama (no hay línea `Rama:` en el encargo).
- No se escribió en `definitions/STATUS.md`, no se hizo commit, push, PR ni merge, y no se leyeron credenciales.
- No hubo muchos huecos: no aplica la frase «Señal: la tarea estaba incompleta».
