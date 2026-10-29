# task-04 — El planificador en modo yolo: sin ronda de refinado ni supuestos
repo: Flucastr.AI   depende_de: —   estado: aprobada

## Descripción
En el modo yolo (`definitions/WORKFLOW.md` §9.3) no hay ventana de refinado con Franco ni se inventan supuestos: ante una feature ambigua el `planificador` devuelve `REFINAR:` y el coordinador lo trata como escalación. Además, las tareas que redacta en yolo no pueden depender de ramas ni de commits. Esta tarea deja ambas reglas en `agentes/planificador.md` y en `skills/descomponer-feature/SKILL.md`.

## Contexto
- Repo: este, único repo. Leídos: `agentes/planificador.md` (sección `## Refinado`) y `skills/descomponer-feature/SKILL.md` (paso 0 «Refinado (solo si se requiere)» con tres sub-bullets; pasos 1–5; sección `## Completa`).
- Validadores vigentes (`pruebas/comprobaciones/contrato-roles.mjs`): el planificador y la skill contienen `REFINAR: feature=Fxx; preguntas=<n>`; la skill contiene `solo puedes mover la marca` y cita `features/Fxx-nombre/refinado.md`; el planificador contiene la frase «escribes en `STATUS.md`» y la línea de BLOQUEO. No se puede borrar ninguna.
- Archivos a tocar: `agentes/planificador.md` y `skills/descomponer-feature/SKILL.md`. Comando de prueba: `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.

## Decisiones ya tomadas
- Señal: la línea exacta `Modo yolo: activo` en el **encargo** del coordinador.
- `skills/descomponer-feature/SKILL.md`, paso 0: añadir al final un cuarto sub-bullet literal: ``   - **Modo yolo:** si el encargo trae la línea `Modo yolo: activo`, no hay ronda de refinado ni supuestos. Si el refinado se requiere y no hay `features/Fxx-nombre/refinado.md`, responde con la primera línea `REFINAR: feature=Fxx; preguntas=<n>` y no crees tareas: el coordinador lo trata como escalación y detiene el modo. Si no se requiere, descompón con normalidad.``
- Mismo archivo, paso 2: añadir al final del paso una frase: «En yolo, ninguna tarea pide crear rama, hacer `git switch` ni commit, ni modificar `definitions/`, y su *Verificación* no depende de la rama actual.»
- `agentes/planificador.md`, sección `## Refinado`: añadir un párrafo final: ``Si el encargo trae la línea `Modo yolo: activo`, no hay ronda de refinado ni supuestos: ante una feature ambigua respondes con la primera línea `REFINAR: feature=Fxx; preguntas=<n>` y no creas tareas.``
- El resto del comportamiento (tareas en `borrador`, mover solo la marca `→`, nada de `hecha` ni `aprobada`) no cambia: en yolo las aprueba el coordinador.
- No se modifica ninguna otra frase de los dos archivos.

## Alcance / Fuera de alcance
Alcance: las tres inserciones descritas.
Fuera de alcance: el coordinador (task-02 y task-03), el validador (task-06), `crear-backlog`, el constructor, `definitions/`, `README.md`.

## Pasos
1. Editar el paso 0 de `skills/descomponer-feature/SKILL.md` con el sub-bullet de yolo. Resultado: ``grep -c -F 'no hay ronda de refinado ni supuestos' skills/descomponer-feature/SKILL.md`` devuelve 1.
2. Añadir la frase al paso 2 de la misma skill. Resultado: ``grep -c -F 'En yolo, ninguna tarea pide crear rama' skills/descomponer-feature/SKILL.md`` devuelve 1.
3. Editar `agentes/planificador.md` con el párrafo de `## Refinado`. Resultado: ``grep -c -F 'Modo yolo: activo' agentes/planificador.md`` devuelve 1.
4. Correr la *Verificación*.

## Criterios de aceptación
1. La skill contiene `Modo yolo: activo`, `no hay ronda de refinado ni supuestos` y `En yolo, ninguna tarea pide crear rama`. Se comprueba con `grep -c -F`.
2. El planificador contiene `Modo yolo: activo` y `no hay ronda de refinado ni supuestos`. Se comprueba con `grep -c -F`.
3. El contrato de roles previo sigue cumpliéndose. Se comprueba con `node --test pruebas/comprobaciones/contrato-roles.test.mjs` (`fail 0`).
4. Solo cambiaron esos dos archivos por esta tarea. Se comprueba con `git status --short agentes skills`.

## Verificación
```
for f in 'Modo yolo: activo' 'no hay ronda de refinado ni supuestos'; do grep -c -F -- "$f" agentes/planificador.md skills/descomponer-feature/SKILL.md; done
grep -c -F 'En yolo, ninguna tarea pide crear rama' skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs
git status --short agentes skills
```
Esperado: cada `grep -c` muestra un número mayor que 0 para cada archivo; las pruebas con `fail 0`; `git status` incluye `agentes/planificador.md` y `skills/descomponer-feature/SKILL.md`.

## Evidencia

## Notas
