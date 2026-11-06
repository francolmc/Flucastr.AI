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

## 2. AGENTS.md

Lee `old/v1/definitions/PROJECT.md`, `ARCHITECTURE.md`, `BACKLOG.md` y `STATUS.md` (solo lo necesario; si alguno no existe, sigue sin él). Con eso escribe `AGENTS.md` en la raíz del proyecto, máximo unas 40 líneas, con el formato de `preparar-proyecto`: qué es, estructura y stack, comandos, la línea `Verificar todo desde cero: ./verify` y reglas (agentes sin commit, push, PR, merge ni despliegue; no leer `.env` ni llaves; ramas `feature/`, `fix/`, `chore/`, `docs/`).

Si el proyecto ya tiene `AGENTS.md`, no lo reemplaces: pregunta a Franco qué conservar.

## 3. Comando verify

Carga `preparar-proyecto` y sigue su paso del `verify`. Propón el comando a partir de lo que el proyecto ya tenga (scripts, Makefile, pruebas). **No inventes uno**: si no puedes probarlo desde cero (build limpio, arranque, un recorrido real), déjalo escrito como plan pendiente en `cambios/` y dilo.

## 4. Trabajo a medias como planes

Por cada ítem de la lista de la sección 1, crea un plan con `planificar-cambio` en `cambios/<nombre>/plan.md` con `estado: borrador`. Un plan por ítem, nombre corto en minúsculas con guiones. Cita solo rutas que hayas visto y confirma que existen en el proyecto actual; si una ruta de `old/v1/` ya no sirve, dilo en el plan en vez de copiarla.

Si un ítem es demasiado grande para un plan, no lo partas en silencio: anótalo en el plan como pendiente de decisión de Franco.

## 5. Puerta de Franco

Al terminar, detente. Resume en pocas líneas: qué quedó en `AGENTS.md`, si `verify` existe o está pendiente, y la lista de planes en borrador. Franco aprueba los planes uno por uno (cambiar `estado: borrador` a `aprobado`); tú no los apruebas ni los ejecutas.

Si esta skill la usa un subagente en Pi, la skill debe declararse en `skills:` del agente que la llama. Hoy ningún agente de `agentes/` la usa.
