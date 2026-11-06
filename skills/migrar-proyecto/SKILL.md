---
name: migrar-proyecto
description: "Termina la migración de un proyecto de la v1 a la v2 después de `bash instalar.sh --migrar <proyecto>`: deja su AGENTS.md corto, propone su comando verify y convierte el trabajo a medias en planes en borrador. Úsala tras correr --migrar en un proyecto."
---

# Migrar un proyecto de la v1 a la v2

`instalar.sh --migrar` ya movió lo de la v1 a `old/v1/` (sin borrar), quitó el hook de v1, dejó el agente `principal` y las reglas deny, y creó `cambios/`. Esta skill hace lo que el script no puede: entender el proyecto y dejarlo listo para trabajar con la v2.

Lo que el script no hizo tampoco se hace aquí sin preguntar: no se toca `src/`, no se borra nada de `old/v1/` y no se hace commit, push ni PR.

## 1. Trabajo a medias

Corre `bash instalar.sh --migrar <proyecto> --simular` si no tienes la salida a la vista. Su bloque «Trabajo a medias» lista:

- las tareas de `old/v1/features/*/task-*.md` con estado `aprobada`, `en curso` o `bloqueada`;
- las features de `old/v1/definitions/BACKLOG.md` cuyo Estado no sea `hecha` ni `completada`.

Esa lista es el único inventario. No abras `old/v1/registro/`: no se lee salvo pedido explícito de Franco.

## 2. Workspace (si aplica)

Si `instalar.sh --migrar` imprimió «Workspace: repos hijos: …», la raíz es un workspace. Carga `preparar-proyecto`, sección 4, y sigue su regla de repo propio.

- Si la raíz no es repo, pregunta a Franco con opciones cerradas (la recomendada es «sí»): «¿Hacemos la raíz repo propio?». No ejecutes `git init` sin su respuesta.
  - Sí: `git init` en la raíz y el `.gitignore` según esa sección. No hagas commit.
  - No: la raíz queda sin repo; sus planes llevan `repos: [.]` y no reciben rama.
- Si la raíz ya es repo, o no hay hijos con `.git`, esta sección no aplica.

## 3. AGENTS.md

Lee `old/v1/definitions/PROJECT.md`, `ARCHITECTURE.md`, `BACKLOG.md` y `STATUS.md` (solo lo necesario; si alguno no existe, sigue sin él). Con eso escribe `AGENTS.md` en la raíz del proyecto, máximo unas 40 líneas, con el formato de `preparar-proyecto`: qué es, estructura y stack, comandos, la línea `Verificar todo desde cero: ./verify` y reglas (agentes sin commit, push, PR, merge ni despliegue; no leer `.env` ni llaves; ramas `feature/`, `fix/`, `chore/`, `docs/`).

Qué se conserva del `AGENTS.md` viejo y de `old/v1/definitions/`: qué es el proyecto, su estructura, stack, comandos, restricciones propias del dominio y las reglas duras de la v2 (sin commit, push, PR, merge ni despliegue; no leer `.env` ni llaves).

Qué se descarta: `STATUS.md` y `BACKLOG.md` como flujo, nombres de rama por feature (`Fxx`), confirmaciones de rama, coordinador, tareas, puertas, «yolo» y reglas parecidas del flujo de la v1. Descártalas: no las copies ni las reescribas en otras palabras, porque una regla de flujo copiada sigue dándole motivos al subagente para dudar. Si una regla de flujo de la v1 parece útil, no la traigas: Franco la decide (ver la lista de abajo).

Al final de esta sección escribe la lista «Reglas de v1 que descarté»: cada regla de flujo que dejaste fuera, en una línea, o «ninguna» si no hubo. Muéstrala siempre, aunque esté vacía, porque Franco confirma, no tú. Si escribes `docs/proyecto.md` (sección 4), la misma lista va también en su «Descartado».

Si el `AGENTS.md` de la raíz ya existía (el script avisa «AGENTS.md sigue siendo de v1» si menciona `definitions/`, `features/` o `registro/`), no lo reemplaces sin respuesta. Pregunta a Franco con opciones cerradas:

1. AGENTS.md corto nuevo (recomendada): reemplaza el viejo tras su aprobación.
2. Conservar el viejo, solo corrigiendo los enlaces `definitions/`, `features/` y `registro/` a `old/v1/…`. Aquí no reescribes reglas: solo corriges enlaces y listas en «Reglas de v1 que descarté» las reglas de flujo que veas, sin modificarlas, para que Franco decida. Es la única excepción a «descartar».

## 4. docs/proyecto.md

Si existe alguno de `old/v1/definitions/PROJECT.md`, `REPOS.md` o `ARCHITECTURE.md`, escribe `docs/proyecto.md` condensado (una página) a partir de los que existan; sigue sin los que falten. **Nunca lo escribas desde cero.** Al final añade una sección «Descartado» con lo que dejaste fuera y su porqué. Si no hay ninguno de esos archivos, no crees `docs/proyecto.md`.

## 5. Comando verify

Carga `preparar-proyecto` y sigue su paso del `verify`. Propón el comando a partir de lo que el proyecto ya tenga (scripts, Makefile, pruebas). **No inventes uno**: si no puedes probarlo desde cero (build limpio, arranque, un recorrido real), déjalo escrito como plan pendiente en `cambios/` y dilo.

## 6. Trabajo a medias como planes

Por cada ítem de la lista de la sección 1, crea un plan con `planificar-cambio` en `cambios/<nombre>/plan.md` con `estado: borrador`. Un plan por ítem, nombre corto en minúsculas con guiones. Cada plan lleva `repos:` en el frontmatter: la carpeta de la columna `repo:` de la tarea v1 si existe; `[.]` en un solo repo; `[.]` también si el ítem solo toca la raíz. Cita solo rutas que hayas visto y confirma que existen en el proyecto actual; si una ruta de `old/v1/` ya no sirve, dilo en el plan en vez de copiarla.

Si un ítem es demasiado grande para un plan, no lo partas en silencio: anótalo en el plan como pendiente de decisión de Franco.

## 7. Puerta de Franco

Al terminar, detente. Resume en pocas líneas: qué quedó en `AGENTS.md`, si `verify` existe o está pendiente, y la lista de planes en borrador. Incluye la lista «Reglas de v1 que descarté» (o «ninguna») y pide a Franco que la confirme; si ve una regla útil ahí, la devuelve a mano. Franco aprueba los planes uno por uno (cambiar `estado: borrador` a `aprobado`); tú no los apruebas ni los ejecutas.

Si esta skill la usa un subagente en Pi, la skill debe declararse en `skills:` del agente que la llama. Hoy ningún agente de `agentes/` la usa.
