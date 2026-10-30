# task-08 — README al día con el modo yolo
repo: Flucastr.AI   depende_de: task-03, task-04   estado: lista para revisión

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

Rama: `git branch --show-current` → `feature/F06-modo-yolo` (ya era la rama del encargo; sin `git switch`).

Verificación (salida real):
```
$ grep -c -F 'Los agentes no hacen commit, push, PR, merge ni despliegue' README.md
1
$ for f in 'Tampoco en el modo yolo' 'existe el modo yolo' 'advertencia si es `main`' '§9.3'; do grep -c -F -- "$f" README.md; done
1
1
1
1
$ node --test pruebas/comprobaciones/readme-estructura.test.mjs
✔ muestra válida: no hay errores (1.880208ms)
✔ variante: falta un agente en el README (0.144875ms)
✔ variante: falta una skill en el README (0.616ms)
✔ variante: sobra un agente en el README (0.112167ms)
✔ variante: sobra una skill en el README (0.088958ms)
✔ variante: README sin sección «## Estructura» (0.072541ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.30375ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
$ git diff --stat -- README.md
 README.md | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
```

Referencia §9.3 existe: `definitions/WORKFLOW.md:228` → `### 9.3 Modo «yolo» (F06)`.

Diff del README (resumen de lo añadido):
- Regla 3: añadida al final la frase «Tampoco en el modo yolo: ahí los cambios quedan sin commit en la rama actual para que yo los revise.»
- Párrafo `## Flujo`: añadida al final la frase que empieza «Solo si lo pido de forma explícita en la conversación (por ejemplo «yolo F05»)…» y termina en «Detalle en `definitions/WORKFLOW.md` §9.3.»

Criterios de aceptación:
1. Se cumple: la frase «Los agentes no hacen commit…» sigue (grep = 1) y la frase de yolo sin commit está (grep «Tampoco en el modo yolo» = 1).
2. Se cumple: grep de «existe el modo yolo», «advertencia si es `main`» y «§9.3» devuelve 1 en cada caso.
3. Se cumple: `fail 0` en `readme-estructura.test.mjs` (7/7 pasan).
4. Se cumple: `git diff --stat -- README.md` muestra solo `README.md`.

## Notas
- Rama: el encargo traía `Rama: feature/F06-modo-yolo` y ya era la actual; no se ejecutó ningún comando git de escritura, ni `git switch` ni `git switch -c`.
- Sin huecos menores: se hicieron exactamente los dos pasos de *Decisiones ya tomadas*, con el texto literal indicado.
- No se tocaron el árbol de `## Estructura`, la línea de estado del encabezado, la bitácora ni ningún otro archivo, según *Fuera de alcance*.
- Sin commit, push, PR, merge ni despliegue. `definitions/STATUS.md` no se tocó.
