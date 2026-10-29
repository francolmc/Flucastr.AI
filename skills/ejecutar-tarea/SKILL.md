---
name: ejecutar-tarea
description: "Ejecuta una tarea `aprobada` de `features/**`: todos los pasos y la verificación, evidencia real y estado «lista para revisión». Úsala al construir; se detiene solo por las causas listadas."
---

# Ejecutar una tarea

Entrada: la ruta del archivo de la tarea.

## Antes de empezar

1. Lee la tarea completa. Si `estado` no es `aprobada`, **detente** y dilo; no cambies nada.
2. Cambia `estado` a `en curso`.
3. Lee las rutas de *Contexto*. Trabaja solo en el repo del campo `repo:`.

## Ejecución

1. Haz **todos** los *Pasos*, en orden, respetando *Decisiones ya tomadas* y sin salir de *Alcance* (lo de *Fuera de alcance* no se toca).
2. **Ante un hueco menor** (algo no cubierto por la tarea): elige la opción más conservadora y coherente con la tarea, anótala en *Notas* y sigue. No preguntes.
3. Corre la *Verificación* tal cual está escrita. Pega en *Evidencia* la salida **real** (comando y salida), nunca una versión resumida o inventada.
4. Comprueba cada criterio de aceptación contra esa evidencia.

## Cuándo detenerte (solo estos casos)

- **Falta de credenciales o acceso.**
- **Una decisión que cambia el alcance:** es una escalación; infórmala, no la resuelvas.
- **La misma verificación falla dos veces por la misma causa:** pon `estado: bloqueada`.

En cualquiera: anota el motivo en *Notas* y termina tu respuesta final con la **primera línea exacta**:

`BLOQUEO: rol=<rol requerido>; motivo=<motivo>`

(para una escalación de alcance, `rol=planificador` o `rol=arquitecto` según toque), y debajo qué dejaste hecho. No sigas.

## Al terminar bien

- `estado: lista para revisión`. **Nunca `hecha`.**
- *Notas*: los huecos menores resueltos y su decisión. Si fueron **muchos**, agrega la frase «Señal: la tarea estaba incompleta» y cuáles faltaban, para mejorar la plantilla.
- En la tarea solo tocaste *Evidencia*, *Notas* y `estado`. Sin commit, push, PR, merge ni despliegue.
