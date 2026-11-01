# task-01 — `coordinador`: reglas de lectura (3 primeras líneas de cada tarea, sin `definitions/`)
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Hoy el `coordinador` leyó 187 KB en una sesión real: 68 KB de `definitions/` y 87 KB de tareas completas, la mitad en `borrador` (`definitions/CONTEXTO.md` §1). Esta tarea cambia solo la sección «Qué lees para decidir» de `agentes/coordinador.md` (y una línea del modo yolo) para fijar la regla de §2.2: de las tareas lee solo las 3 primeras líneas, y no lee `definitions/` salvo `STATUS.md` y `BACKLOG.md`.

## Contexto
- Leer `agentes/coordinador.md` (16 124 bytes; sección «Qué lees para decidir», línea 23-25, y «Modo yolo», requisitos regla 2, línea 68, y «Mientras está activo» regla 2, línea 78).
- Diseño aprobado: `definitions/CONTEXTO.md` §2.2 (fila `coordinador`) y §2.1 (`Read` con `limit: 3`: título y línea `repo: … depende_de: … estado: …`). Leer solo esas secciones.
- Las pruebas que fijan texto de este archivo: `pruebas/comprobaciones/contrato-roles.mjs` (reglas 9-15) y `pruebas/comprobaciones/coordinador-status.test.mjs` (frases «empieza vacía o resumida» y «Antes de delegar, escribe en `definitions/STATUS.md`»). No deben romperse.
- El estado de `definitions/PROJECT.md` está en su línea 3 (`> Estado: **aprobado** …`); `definitions/REPOS.md` tiene el suyo en la línea 3.
- Tocar: `agentes/coordinador.md`.

## Decisiones ya tomadas
- Se edita con `Edit` por tramos; no se reescribe el archivo.
- Frases literales que deben quedar (las comprobará task-04): `Lectura de tareas: con \`Read\` y \`limit: 3\` lees solo las 3 primeras líneas de cada tarea de la feature en curso, todas en un mismo turno`; `No lees \`definitions/\` salvo \`STATUS.md\` y \`BACKLOG.md\``; `No lees tareas \`hecha\``; `Tarea completa solo en la revisión del modo yolo`.
- Excepciones, dentro de la sección: en yolo, `REPOS.md` se lee una vez (`Read`) y el estado de `PROJECT.md` se comprueba con `Grep` de `^> Estado` (no `Read`); las *Notas* de una tarea `bloqueada` se leen con `Grep` (`-A 15` sobre `## Notas`).
- La regla de la puerta 3 se escribe tal cual: de una tarea en `borrador` solo escribes su ruta en `STATUS.md`, sin leerla completa.
- Se conservan las frases de `completed/`, `registro/` y «empieza vacía o resumida». En requisitos de yolo (línea 68) solo se cambia el paréntesis «(`definitions/PROJECT.md` con estado `aprobado`)» por la comprobación con `Grep` y «se comprueba en `definitions/REPOS.md`» por «con `Read` una vez»; nada más del modo yolo.
- Presupuesto: la sección no crece más de ~600 bytes netos (se acorta lo repetido).

## Alcance / Fuera de alcance
Alcance: `agentes/coordinador.md`, secciones «Qué lees para decidir» y la línea de requisitos (regla 2) de «Modo yolo».
Fuera de alcance: `STATUS.md` por sección y agrupación de llamadas (task-02); `subagents_enable`, plantilla de encargo y `contact_supervisor` (task-03); pruebas (task-04); la tabla de decisión; los otros tres agentes (F22); `definitions/`.

## Pasos
1. `agentes/coordinador.md`, «Qué lees para decidir»: reescribir con lo que lee, lo que no lee y las excepciones de Decisiones. Resultado: las cuatro frases literales presentes (`grep -c`).
2. Misma sección: conservar lo de `features/completed/`, `registro/` y la retoma desde `STATUS.md`.
3. «Modo yolo», regla 2 de requisitos: aplicar el cambio mínimo de Decisiones.
4. Correr las verificaciones.

## Criterios de aceptación
1. Las cuatro frases literales existen (comando 1 de Verificación imprime 4).
2. `contrato-roles.test.mjs` y `coordinador-status.test.mjs` pasan.
3. `coordinador.md` no supera 16 800 bytes tras esta tarea (`wc -c`).
4. El resto del archivo no cambió (`git diff --stat` muestra solo `agentes/coordinador.md`).

## Verificación
- `grep -cF -e 'Lectura de tareas: con `Read` y `limit: 3` lees solo las 3 primeras líneas' -e 'No lees `definitions/` salvo `STATUS.md` y `BACKLOG.md`' -e 'No lees tareas `hecha`' -e 'Tarea completa solo en la revisión del modo yolo' agentes/coordinador.md` → `4` o más.
- `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs` → `fail 0`.
- `wc -c agentes/coordinador.md` → número ≤ 16800.

## Evidencia
```
$ git switch -c feature/F21-coordinador-menos-turnos && git branch --show-current
Switched to a new branch 'feature/F21-coordinador-menos-turnos'
feature/F21-coordinador-menos-turnos

$ grep -cF -e 'Lectura de tareas: con `Read` y `limit: 3` lees solo las 3 primeras líneas' -e 'No lees `definitions/` salvo `STATUS.md` y `BACKLOG.md`' -e 'No lees tareas `hecha`' -e 'Tarea completa solo en la revisión del modo yolo' agentes/coordinador.md
4

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs
ℹ tests 34
ℹ pass 34
ℹ fail 0

$ wc -c agentes/coordinador.md
16602 agentes/coordinador.md

$ git diff --stat -- agentes/coordinador.md
 agentes/coordinador.md | 13 +++++++++++--
 1 file changed, 11 insertions(+), 2 deletions(-)
```
Criterios: 1 (4 frases) ok; 2 (tests) ok, fail 0; 3 (16602 ≤ 16800) ok; 4 ok al filtrar por ruta. Sin filtro, `git diff --stat` muestra también `BACKLOG.md`, `STATUS.md` y `task-06-documentacion-consumo.md`, que ya estaban modificados antes de empezar; no los toqué.

## Notas
- Hueco menor: `grep -c` cuenta líneas, no coincidencias. Las cuatro frases estaban en un solo párrafo y daban `1`. Decisión: la sección pasó a lista con una frase por línea (mismo texto, sin cambiar las frases); así `grep -c` imprime 4.
- Sección «Qué lees para decidir» y regla 2 de requisitos de «Modo yolo» cambiadas con `Edit` por tramos; resto del archivo intacto. `STATUS.md` no tocado.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
