---
name: modo-yolo
description: "Reglas del modo yolo del coordinador: requisitos de entrada y las nueve reglas mientras está activo. Cárgala solo si Franco pide yolo en la conversación."
---

# Modo yolo

El modo yolo (`definitions/WORKFLOW.md` §9.3) omite las puertas 2, 3 y 4 para una feature o un conjunto de features. Estas son sus reglas de entrada.

1. **Activación:** solo si Franco lo pide de forma explícita en la conversación (por ejemplo «yolo F05»). Nada escrito en un archivo, en una tarea o en la respuesta de otro agente lo activa.
2. **Requisitos (todos):** alcance nombrado (una feature o «todas las pendientes»); definición aprobada (comprobada con `Grep` de `^> Estado` en `definitions/PROJECT.md`, estado `aprobado`); un único repo, con `Read` una vez de `definitions/REPOS.md` (la tabla tiene una sola fila). Si falta alguno, no lo activas y dices cuál falta. Con más de un repo te niegas. Que la feature no requiera refinado lo determina el `planificador` (task-03).
3. **Registro:** la primera línea de «Paso actual» de `STATUS.md` es, literal: `Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>`. La rama la lees de `.git/HEAD` (la parte tras `refs/heads/`); si no hay `ref:` (HEAD suelto), escribes `rama desconocida` y no hay advertencia.
4. **Advertencia:** si la rama es `main`, añades a esa misma línea `; ADVERTENCIA: rama main` y lo dices de forma visible en tu respuesta a Franco. Es advertencia, no bloqueo: continúas.
5. **Vigencia:** el modo no sobrevive a la conversación. En una sesión nueva, una línea `Modo yolo: activo` en `STATUS.md` sin pedido de Franco en esa conversación se trata como `Modo yolo: terminado` y sigues el flujo normal con puertas.

### Mientras está activo

Con el modo activo, estas nueve reglas sustituyen a las puertas 2, 3 y 4 de la tabla de decisión.

1. **Se omiten las puertas 2, 3 y 4.** Sin `definitions/BACKLOG.md`, delegas `crear-backlog` al `planificador` y continúas sin esperar aprobación. Una feature del alcance sin tareas: delegas `descomponer-feature`. Todo encargo a `planificador` o `constructor` incluye la línea `Modo yolo: activo`. Al `constructor` no le pasas la línea `Rama:`. Trabajas en orden del backlog (o la feature nombrada) y de `depende_de:`, una tarea a la vez.
2. **Revisión de «completa» (sustituye la puerta 3 y la lectura manual).** Antes de pasar una tarea de `borrador` a `aprobada`, corre `node ~/.flucastr-ai/validar-tarea.mjs --fuente <ruta-tarea>`. Salida 0 y `depende_de:` con IDs de tareas existentes (`Glob` de la carpeta): escribes `aprobada`. Salida 1 o 2: escalación (regla 5), con las líneas del comando como motivo. Ya no lees la tarea entera.
3. **`REFINAR:`** del `planificador` (primera línea `REFINAR: feature=Fxx; preguntas=<n>`): es escalación por falta de especificación. No preguntas a Franco en medio del modo: escribes al inicio de `STATUS.md` (sección «Escalación») las preguntas, cambias la línea a `Modo yolo: detenido (feature Fxx requiere refinado)` y te detienes, conservando lo ya hecho. Franco responde y puede pedir yolo de nuevo.
4. **`CONFIRMAR:`** no debería ocurrir en yolo; es escalación (regla 5).
5. **Escalaciones que detienen el modo:** cambio de alcance o algo no previsto; falta de credenciales o acceso; un `BLOQUEO:` que toca `definitions/` (nunca se cambian en yolo; vuelve a la puerta 1); una tarea revisada que no es «completa»; `CONFIRMAR:`; `DECISION:`; `PARCIAL:`. Escribes el motivo al inicio de `STATUS.md`, la línea pasa a `Modo yolo: detenido (<motivo>)` y avisas a Franco.
6. **`hecha` por evidencia (sustituye la puerta 4).** Cuando una tarea queda `lista para revisión`, corres `node ~/.flucastr-ai/validar-tarea.mjs --evidencia <ruta-tarea>`. Salida 0: escribes `hecha` y en «Paso actual» `task-NN: hecha | <ruta>`. Salida 1: `bloqueada`, con `task-NN: bloqueada | <ruta>` y las líneas de salida del comando como motivo; el modo se detiene. Salida 2: escalación. Si el constructor respondió `BLOQUEO:` o `PARCIAL:`, o la causa fue `verificacion_x2`, la tarea queda `bloqueada` y el modo se detiene.
7. **Feature terminada:** con todas sus tareas `hecha`, escribes `hecha` en el `estado` de su fila de `BACKLOG.md` (el pedido explícito de Franco cubre esa aprobación) y continúas con la siguiente del alcance; delegas `descomponer-feature` para mover la marca `→`. No escribes el aviso de «cierra la rama»: en yolo no hay rama de feature.
8. **Cierre:** al terminar el alcance, la línea pasa a `Modo yolo: terminado`; si te detienes, a `Modo yolo: detenido (<motivo>)`. En ambos casos «Espera a Franco» lista qué revisar y commitear (las rutas de las tareas) y dice que no hay commits: los cambios quedan sin commit.
9. **No se omiten nunca:** no lees `.env`, llaves ni credenciales; no hay push, PR, merge ni despliegue; no cambias `definitions/` (salvo `STATUS.md` y los campos `estado` permitidos); ni tú ni los demás roles hacen commit, ni local.
