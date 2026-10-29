# task-08 — README al día con el modo yolo
repo: Flucastr.AI   depende_de: task-03, task-04   estado: aprobada

## Descripción
`README.md` explica las cuatro puertas, las ramas por feature y el refinado, pero no el modo yolo. Esta tarea añade dos frases breves para que quien lea el README sepa que existe, cuándo se activa y qué no cambia (sin commit de agentes), sin romper la comprobación de estructura de F04.

## Contexto
- Repo: este, único repo. Leído: `README.md` (regla 3 «**Yo hago el commit.**» y el párrafo del flujo que empieza «El `coordinador` (el único agente que abro)…»; ambos ya hablan de ramas y refinado) y `pruebas/comprobaciones/readme-estructura.mjs` (compara el árbol de `## Estructura` con `agentes/` y `skills/`; esta tarea no lo toca).
- Fuente: `definitions/WORKFLOW.md` §9.3.
- Archivo a tocar: solo `README.md`. Comando de prueba: `node --test pruebas/comprobaciones/readme-estructura.test.mjs`.

## Decisiones ya tomadas
- En la regla 3, al final, añadir: «Tampoco en el modo yolo: ahí los cambios quedan sin commit en la rama actual para que yo los revise.»
- En el párrafo del flujo, al final, añadir: ``Solo si lo pido de forma explícita en la conversación (por ejemplo «yolo F05»), con el alcance nombrado, la definición aprobada y un único repo, existe el modo yolo: el `coordinador` omite las puertas 2, 3 y 4, trabaja directo en la rama actual (con una advertencia si es `main`) y se detiene ante cualquier escalación o si una feature necesita refinado. Detalle en `definitions/WORKFLOW.md` §9.3.``
- No se tocan el árbol de `## Estructura`, el estado de las features ni la línea de estado del encabezado.

## Alcance / Fuera de alcance
Alcance: las dos frases en `README.md`.
Fuera de alcance: `AGENTS.md`, `definitions/`, el árbol de estructura, cualquier otro archivo.

## Pasos
1. Añadir la frase a la regla 3. Resultado: ``grep -c -F 'Tampoco en el modo yolo' README.md`` devuelve 1.
2. Añadir la frase al párrafo del flujo. Resultado: ``grep -c -F 'existe el modo yolo' README.md`` devuelve 1.
3. Correr la *Verificación*.

## Criterios de aceptación
1. El README conserva «Los agentes no hacen commit, push, PR, merge ni despliegue» y añade la frase de yolo sin commit. Se comprueba con `grep -c -F`.
2. El README nombra el modo yolo, la advertencia de `main` y `definitions/WORKFLOW.md` §9.3. Se comprueba con `grep -c -F`.
3. La comprobación de estructura sigue pasando. Se comprueba con `node --test pruebas/comprobaciones/readme-estructura.test.mjs` (`fail 0`).
4. Solo cambió `README.md` por esta tarea. Se comprueba con `git diff --stat -- README.md`.

## Verificación
```
grep -c -F 'Los agentes no hacen commit, push, PR, merge ni despliegue' README.md
for f in 'Tampoco en el modo yolo' 'existe el modo yolo' 'advertencia si es `main`' '§9.3'; do grep -c -F -- "$f" README.md; done
node --test pruebas/comprobaciones/readme-estructura.test.mjs
git diff --stat -- README.md
```
Esperado: cada `grep -c` muestra un número mayor que 0; las pruebas con `fail 0`; `git diff --stat` muestra `README.md`.

## Evidencia

## Notas
