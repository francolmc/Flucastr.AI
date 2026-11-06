# task-04 — El coordinador nombra la rama, tramita CONFIRMAR y avisa al cerrar la feature
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`agentes/coordinador.md` no sabe de ramas. Esta tarea le añade lo decidido en `definitions/WORKFLOW.md` §3 y §9.1: infiere el prefijo (`feature/`, `fix/`, `chore/`) y escribe la rama en `STATUS.md`, la pasa al constructor en el encargo, tramita la línea `CONFIRMAR:` preguntando a Franco, y cuando la última tarea de la feature queda `hecha` deja el aviso en «Espera a Franco» para que Franco cierre la rama, haga el PR y despliegue.

## Contexto
- Repo: este, único repo. Leído: `agentes/coordinador.md` completo (front matter con `tools: Agent(arquitecto, planificador, constructor), Read, Grep, Glob, Write, Edit, Skill`; secciones `## Límites`, `## Tabla de decisión`, `## Cómo avanzas`, `## Bloqueos`, `## Escalación`, `## Formato de definitions/STATUS.md`). La fila «Todas las tareas de la feature `hecha`» ya existe y la fila «Tarea `aprobada`» delega al constructor.
- Leído `definitions/WORKFLOW.md` §3 (regla «Confirmaciones»), §9.1 (tabla de acciones y viñeta «Rama ya existente», puntos 1–4).
- Restricciones de validadores vigentes sobre este archivo (`pruebas/comprobaciones/contrato-roles.mjs`): front matter con `name: coordinador`; `Agent(...)` en `tools:` con exactamente los otros tres agentes; la línea `BLOQUEO: rol=<rol>; motivo=<motivo>`; la tabla (líneas que empiezan por `|`) menciona los seis estados entre comillas invertidas; las skills `crear-backlog` y `descomponer-feature` aparecen entre comillas invertidas. `pruebas/comprobaciones/formato-flujo.mjs` valida las cinco secciones de `STATUS.md` (no se agrega ninguna).
- Archivo a tocar: solo `agentes/coordinador.md`.

## Decisiones ya tomadas
- Nueva sección `## Ramas por feature` antes de `## Bloqueos`, con estas reglas (texto en español, imperativo):
  1. Al pasar la feature a `en curso` (con la aprobación explícita de Franco, como hoy), infiere el prefijo leyendo la fila de la feature en `BACKLOG.md`: `feature/` por defecto (capacidad nueva o cambio de comportamiento), `fix/` (corrige un defecto), `chore/` (mantenimiento sin cambio de comportamiento: documentación, dependencias, limpieza, pruebas). Ante duda, `feature/`; Franco lo corrige al aprobar. Sin columna nueva en el backlog.
  2. Escribe en `STATUS.md`, sección «Paso actual», la línea `Rama: <prefijo>/Fxx-nombre` (`Fxx-nombre` es el nombre de la carpeta en `features/`).
  3. En cada encargo al constructor incluye la línea `Rama: <prefijo>/Fxx-nombre`.
  4. Cuando el constructor responda con la primera línea `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`: la registras en «Espera a Franco» de `STATUS.md`, preguntas a Franco en la conversación y te detienes. No es bloqueo ni escalación. Si Franco responde que sí de forma explícita, vuelves a delegar la misma tarea con «Franco confirmó `git switch <rama>`» en el encargo. Si dice que no o no responde, dejas «Franco rechazó» o «sin respuesta» en «Espera a Franco» y la tarea sigue `aprobada`. La confirmación vale para esa rama y esa tarea.
  5. El constructor no hace commit: en la puerta 4 Franco commitea en la rama y pasa la tarea a `hecha`.
- Aviso de feature completa: en la fila «Todas las tareas de la feature `hecha`» se añade, antes de pedir la confirmación de `hecha` de la feature, escribir en «Espera a Franco» la línea `Feature Fxx completa en <rama>: cierra la rama, haz el PR y despliega.` No es escalación.
- En la fila «Tarea `aprobada`» se añade «con la línea `Rama:` en el encargo».
- No se toca el front matter, ni el formato de `STATUS.md`, ni las demás secciones.
- Si se necesita nombrar yolo, no se hace: es F06.

## Alcance / Fuera de alcance
Alcance: la sección nueva, los dos retoques de la tabla y las frases exactas de arriba.
Fuera de alcance: refinado (task-05), validador del coordinador (task-06), modo yolo y la advertencia de rama `main`, el `planificador`, el `constructor`, `STATUS.md`, el campo `repo:` con varios repos.

## Pasos
1. Añadir la sección `## Ramas por feature` con las cinco reglas. Resultado: `grep -c '^## Ramas por feature' agentes/coordinador.md` devuelve 1.
2. Editar las dos filas de la tabla indicadas. Resultado: la tabla sigue con una línea `|` por fila y los seis estados presentes.
3. Verificar que el front matter y `## Formato de definitions/STATUS.md` no cambiaron (`git diff agentes/coordinador.md` solo muestra líneas añadidas o las dos filas).
4. Correr la *Verificación*.

## Criterios de aceptación
1. El archivo contiene literalmente `Rama: <prefijo>/Fxx-nombre`, `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`, ``Franco confirmó `git switch <rama>` `` y `cierra la rama, haz el PR y despliega`. Se comprueba con los `grep`.
2. Menciona los tres prefijos `feature/`, `fix/` y `chore/`. Se comprueba con `grep`.
3. El contrato de roles previo sigue cumpliéndose. Se comprueba con `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.
4. Solo cambió `agentes/coordinador.md`. Se comprueba con `git status --short agentes`.

## Verificación
```
for f in 'Rama: <prefijo>/Fxx-nombre' 'CONFIRMAR: accion=git switch <rama>; motivo=<motivo>' 'Franco confirmó `git switch <rama>`' 'cierra la rama, haz el PR y despliega' 'feature/' 'fix/' 'chore/'; do grep -c -F -- "$f" agentes/coordinador.md; done
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/formato-flujo.test.mjs
git status --short agentes
```
Esperado: cada `grep -c` muestra un número mayor que 0; las pruebas con `fail 0`; `git status` incluye `agentes/coordinador.md` y no cambia ningún otro agente por esta tarea.

## Evidencia

Comandos ejecutados (salida real):

```
$ grep -c '^## Ramas por feature' agentes/coordinador.md
1
$ for f in 'Rama: <prefijo>/Fxx-nombre' 'CONFIRMAR: accion=git switch <rama>; motivo=<motivo>' 'Franco confirmó `git switch <rama>`' 'cierra la rama, haz el PR y despliega' 'feature/' 'fix/' 'chore/'; do grep -c -F -- "$f" agentes/coordinador.md; done
1
2
1
1
1
1
1
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/formato-flujo.test.mjs
... (salida completa de 23 pruebas; se omiten las líneas «✔» intermedias)
ℹ tests 23
ℹ suites 0
ℹ pass 23
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
$ git status --short agentes
 M agentes/coordinador.md
 M agentes/constructor.md
```

`agentes/constructor.md` aparece modificado también en el estado inicial del repo (antes de esta tarea); esta tarea no lo tocó.

Diff de `agentes/coordinador.md` (`git diff --stat`: 10 inserciones, 2 eliminaciones): sección `## Ramas por feature` nueva antes de `## Bloqueos` (5 reglas) y las dos filas de la tabla («Tarea `aprobada`» y «Todas las tareas de la feature `hecha`»). El front matter y `## Formato de definitions/STATUS.md` no cambiaron.

Criterios de aceptación:
1. Literales presentes: `Rama: <prefijo>/Fxx-nombre` (2 apariciones), `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`, «Franco confirmó `git switch <rama>`» y `cierra la rama, haz el PR y despliega`. Cumple.
2. Los tres prefijos `feature/`, `fix/` y `chore/` aparecen. Cumple.
3. `contrato-roles.test.mjs` y `formato-flujo.test.mjs`: 23 de 23 pasan, 0 fallos. Cumple.
4. `git status --short agentes` incluye `agentes/coordinador.md`; ningún otro agente cambió por esta tarea. Cumple.

## Notas

- Procedimiento: el encargo no trae línea `Rama:`, así que no se ejecutó ningún comando git de rama (ni `git switch`, ni `git switch -c`, ni `git branch`).
- La dependencia `task-01` se toma como `hecha`, según el encargo; no la revisé en su archivo.
- Huecos menores resueltos: la redacción exacta de cada regla y el lugar de la línea «Feature Fxx completa…» dentro de la fila «Todas las tareas de la feature `hecha`» (se escribe antes de pedir la confirmación de `hecha`). Se tomó del §9.1 y del texto de la tarea, sin añadir reglas nuevas.
- No hubo huecos en número suficiente para la señal de plantilla incompleta.
