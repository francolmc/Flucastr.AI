---
name: descomponer-feature
description: "Descompone la feature marcada como siguiente en `BACKLOG.md` en tareas completas y acotadas dentro de `features/Fxx-nombre/`. Úsala en la puerta 3, cuando la siguiente feature no tiene tareas."
---

# Descomponer una feature en tareas

Entrada: `definitions/BACKLOG.md` (la fila con `→`), `definitions/` y los repos involucrados.

## Pasos

0. **Refinado (solo si se requiere).** Aplica el criterio: el refinado se requiere si puedes formular al menos una pregunta de alcance con dos o más respuestas razonables que producirían listas de tareas distintas y esa pregunta no está resuelta en `BACKLOG.md`, `PROJECT.md` ni en un `refinado.md` existente; si no puedes formularla, se omite y descompones directamente.
   - Si no se requiere, sigue al paso 1.
   - Si se requiere y no hay `features/Fxx-nombre/refinado.md` con las respuestas, no crees tareas y responde con la primera línea exacta `REFINAR: feature=Fxx; preguntas=<n>`, seguida de hasta 5 preguntas numeradas, de más a menos importante, cada una con su opción recomendada.
   - Si el encargo trae las respuestas de Franco, escríbelas en `features/Fxx-nombre/refinado.md` (un archivo de decisiones, no una tarea; una sección por pregunta con su respuesta) y descompón. Cada tarea cita `features/Fxx-nombre/refinado.md` en *Decisiones ya tomadas*.

1. Lee la feature y el código real de cada repo que toca. Ejecuta únicamente comandos sin efectos sobre archivos versionados (pruebas, lint, `--help`) para confirmar que los comandos de *Verificación* existen. Los que no puedas ejecutar así se marcan «no ejecutado, inferido» en el *Contexto* de la tarea.
2. Define tareas: un solo repo y un solo objetivo verificable cada una. Con varios repos, fija el orden con `depende_de:` (la API antes que el front).
3. Escribe cada tarea en `features/Fxx-nombre/task-NN-nombre.md` con la plantilla de abajo, estado `borrador`.
4. Pasa la lista «completa» y la «acotada» a cada tarea. Si falla, corrígela o pártela.
5. En `BACKLOG.md` solo puedes mover la marca `→`: si está en una feature `hecha`, pásala a la primera feature que no esté `hecha` (deja vacía la celda de la anterior). No cambies ningún otro campo ni fila. No muevas nada a `completed/`.

## Plantilla

```
# task-NN — título
repo: …   depende_de: …   estado: borrador

## Descripción      Qué y por qué, 3–5 líneas.
## Contexto         Rutas exactas a leer y a tocar; convenciones del repo; cómo se ejecuta y se prueba.
## Decisiones ya tomadas   Lo que el ejecutor NO debe volver a decidir (librería, nombres, formato…).
## Alcance / Fuera de alcance   Fuera de alcance no puede quedar vacío.
## Pasos            Numerados. Cada uno: archivo, qué cambia, resultado observable.
## Criterios de aceptación   Máximo 5, observables, cada uno con cómo se comprueba.
## Verificación     Comandos exactos y salida esperada.
## Evidencia        (lo llena el constructor)
## Notas            (lo llena el constructor)
```

Estados válidos: `borrador`, `aprobada`, `en curso`, `lista para revisión`, `hecha`, `bloqueada`. Tú solo escribes `borrador`. `depende_de:` lleva el ID de otra tarea o `—`.

## Completa (cumplir antes de la puerta 3)

- Las rutas del contexto las leíste en el repo. Los comandos los ejecutaste si no tienen efectos sobre archivos versionados (pruebas, lint, `--help`); los demás están marcados «no ejecutado, inferido» en el *Contexto*.
- No quedan «TBD», «a definir» ni «según corresponda».
- Todo lo que el ejecutor tendría que elegir está en *Decisiones ya tomadas*.
- Cada paso termina en algo que se puede ver o ejecutar.
- La verificación se puede correr tal cual está escrita.

## Acotada (cifras de partida, a calibrar con la primera feature real)

- Un solo repo y un solo objetivo verificable.
- Hasta ~8 pasos, ~5 archivos tocados y 5 criterios de aceptación.
- Al terminar, el repo queda funcionando (nada a medias).
- Si no cabe, pártela en dos tareas con `depende_de:`.

## Al terminar

Lista las tareas con su orden y di a Franco qué revisar (puerta 3, una por una) y dónde. Todas quedan en `borrador`.
