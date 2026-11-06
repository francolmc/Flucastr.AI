# task-08 — README al día con las ramas por feature y el refinado
repo: Flucastr.AI   depende_de: task-04, task-05   estado: hecha

## Descripción
`README.md` dice que los agentes no hacen commit ni git de escritura y no habla de ramas ni de refinado. Tras las tareas anteriores el constructor sí crea la rama de la feature y el planificador puede abrir un refinado. Esta tarea ajusta la regla 3 y el párrafo del flujo del README, sin romper la comprobación de estructura de F04.

## Contexto
- Repo: este, único repo. Leído: `README.md` (línea 15: «3. **Yo hago el commit.** Los agentes no hacen commit, push, PR, merge ni despliegue.»; línea 91: párrafo del flujo con las cuatro puertas) y `pruebas/comprobaciones/readme-estructura.mjs` (compara el árbol de `## Estructura` con `agentes/` y `skills/`; esta tarea no toca ese árbol).
- Fuente de las reglas: `definitions/WORKFLOW.md` §9.1 y §9.2.
- Archivo a tocar: solo `README.md`.

## Decisiones ya tomadas
- Línea 15: se mantiene «Yo hago el commit.» y se amplía con: «El `constructor` solo crea la rama de la feature (`git switch -c`) y, con mi confirmación, se cambia a una rama existente (`git switch`); el commit, el PR, el merge y el despliegue son míos.» No se quita «Los agentes no hacen commit, push, PR, merge ni despliegue.».
- Párrafo del flujo (línea 91): se añaden dos frases: una sobre la rama por feature (`feature/`, `fix/` o `chore/` + `Fxx-nombre`, aviso por `STATUS.md` cuando la última tarea queda `hecha`) y otra sobre el refinado previo solo cuando se requiere (hasta 5 preguntas con recomendación, `features/Fxx/refinado.md`). Detalle: `definitions/WORKFLOW.md` §9.
- No se tocan el árbol de `## Estructura`, el estado de las features ni la línea de estado del encabezado. No se menciona yolo (F06).

## Alcance / Fuera de alcance
Alcance: la línea 15 y el párrafo del flujo de `README.md`.
Fuera de alcance: `AGENTS.md`, `definitions/`, el árbol de estructura, el historial del README, cualquier otro archivo.

## Pasos
1. Editar la regla 3 de `README.md` según *Decisiones ya tomadas*. Resultado: `grep -n 'git switch' README.md` muestra la línea.
2. Añadir las dos frases al párrafo del flujo. Resultado: `grep -c 'refinado.md' README.md` devuelve al menos 1.
3. Correr la *Verificación*.

## Criterios de aceptación
1. El README conserva «Los agentes no hacen commit, push, PR, merge ni despliegue» y añade la excepción de la rama. Se comprueba con `grep`.
2. El README menciona `feature/`, `fix/`, `chore/` y `refinado.md`. Se comprueba con `grep`.
3. La comprobación de estructura sigue pasando. Se comprueba con `node --test pruebas/comprobaciones/readme-estructura.test.mjs`.
4. Solo cambió `README.md`. Se comprueba con `git diff --stat -- README.md`.

## Verificación
```
grep -c -F 'Los agentes no hacen commit, push, PR, merge ni despliegue' README.md
grep -c -F 'git switch' README.md
for f in 'feature/' 'fix/' 'chore/' 'refinado.md'; do grep -c -F -- "$f" README.md; done
node --test pruebas/comprobaciones/readme-estructura.test.mjs
git diff --stat -- README.md
```
Esperado: cada `grep -c` muestra un número mayor que 0; las pruebas con `fail 0`; `git diff --stat` muestra solo `README.md`.

## Evidencia

Comando: `cd /Users/franco/Codes/flucastr/Flucastr.AI && grep -c -F 'Los agentes no hacen commit, push, PR, merge ni despliegue' README.md`
```
1
```

Comando: `grep -c -F 'git switch' README.md`
```
1
```

Comando: `for f in 'feature/' 'fix/' 'chore/' 'refinado.md'; do grep -c -F -- "$f" README.md; done`
```
2
1
1
1
```

Comando: `node --test pruebas/comprobaciones/readme-estructura.test.mjs`
```
✔ muestra válida: no hay errores (1.407083ms)
✔ variante: falta un agente en el README (0.0905ms)
✔ variante: falta una skill en el README (0.434208ms)
✔ variante: sobra un agente en el README (0.063ms)
✔ variante: sobra una skill en el README (0.058292ms)
✔ variante: README sin sección «## Estructura» (0.046709ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.244084ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 63.039709
```

Comando: `git diff --stat -- README.md`
```
 README.md | 4 ++--
 1 file changed, 2 insertions(+), 2 deletions(-)
```

Criterios de aceptación:
1. Conserva «Los agentes no hacen commit, push, PR, merge ni despliegue» y añade la excepción de la rama (`git switch`): cumple (grep = 1 y grep `git switch` = 1).
2. Menciona `feature/`, `fix/`, `chore/` y `refinado.md`: cumple (2, 1, 1, 1).
3. La comprobación de estructura pasa: cumple (`fail 0`, 7 de 7).
4. Solo cambió `README.md`: cumple (`git diff --stat` solo lista `README.md`).

## Notas
- No hay línea `Rama:` en el encargo: no se ejecutó ningún comando git de rama (ni `git switch -c`, ni `git switch`, ni `git branch --show-current`).
- Hueco menor: la tarea no fija la posición de las dos frases nuevas del párrafo del flujo. Se añadieron al final del párrafo, tras «su cierre en `definitions/BACKLOG.md` lo hago yo.», sin tocar el resto.
- Hueco menor: la frase de la regla 3 se redactó según *Decisiones ya tomadas* y se alineó con `definitions/WORKFLOW.md` §9.1 (`git switch -c` para crear la rama; `git switch` solo con confirmación).
- Fuera de alcance respetado: árbol de `## Estructura`, línea de estado del encabezado, historial, `AGENTS.md`, `definitions/`, `STATUS.md`. No se menciona yolo.
- Sin señal de tarea incompleta: solo dos huecos menores.
