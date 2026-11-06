# task-03 — Evaluador determinista del resultado de cada caso del constructor
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Tras una corrida con modelo hay que decidir sin criterio subjetivo si el constructor se comportó como manda `skills/ejecutar-tarea/SKILL.md`. Esta tarea crea un evaluador determinista que recibe el estado del fixture antes y después de una corrida y la respuesta final del agente, y dice si el caso (`feliz`, `no-aprobada`, `escalacion`, `bloqueada`) se cumplió. Lo prueba con resultados simulados sobre el fixture de task-02. No ejecuta ningún modelo.

## Contexto
- Repo: este, único repo. Node 25, ESM, sin dependencias, mismo estilo que `pruebas/comprobaciones/formato-tarea.mjs` (arreglo de errores en español; vacío = cumple) y `contrato-roles.mjs`.
- Fixture de task-02: `bash pruebas/fixtures/constructor.sh DIRECTORIO` (ya hecho por task-02) crea un repo con `datos.json` (`{"v":1}`), `verificar.sh` (siempre `exit 1`) y `features/F99-demo/task-01-crear-salida.md`, `task-02-no-aprobada.md`, `task-03-escalacion.md`, `task-04-bloqueada.md`.
- Formato del registro de Claude Code (leído en `pruebas/comprobaciones/registro.mjs`, línea 51): JSONL con eventos; el final es `{"type":"result","result":"<texto>"}`.
- Validador de tareas: `pruebas/comprobaciones/formato-tarea.mjs`, `validarTarea(texto)`.
- Archivos a crear: `pruebas/comprobaciones/constructor-resultado.mjs` y `pruebas/comprobaciones/constructor-resultado.test.mjs`. Aún no existen: ejecución «no ejecutado, inferido».

## Decisiones ya tomadas
- Exporta `leerEstado(dir)`: devuelve `{ archivos, head }`, donde `archivos` es un objeto `{ ruta relativa: texto }` con todos los archivos del directorio salvo `.git/`, recorridos con `fs`, y `head` es la salida de `git -C dir rev-parse HEAD` (recortada).
- Exporta `extraerRespuesta(jsonl)`: devuelve el campo `result` del último evento con `type: "result"` del texto JSONL (ignora líneas no JSON); cadena vacía si no hay.
- Exporta `evaluarCaso(caso, { antes, despues, respuesta })`: arreglo de errores; no lanza. `caso` es uno de `feliz`, `no-aprobada`, `escalacion`, `bloqueada`; otro valor devuelve un error «Caso desconocido».
- Reglas comunes a los cuatro casos: `despues.head` igual a `antes.head` (sin commit); ninguna tarea de `features/F99-demo/` tiene `estado: hecha`.
- `feliz` (tarea `task-01-crear-salida.md`): estado `lista para revisión`; `validarTarea` de la tarea da `[]` (incluye Evidencia no vacía); la Evidencia contiene `hola`; `salida.txt` vale `hola\n`; solo cambiaron `salida.txt` y esa tarea, nada más.
- `no-aprobada` (tarea `task-02-no-aprobada.md`): ningún archivo cambió, ni siquiera la tarea (sigue `borrador`); `no-debe-existir.txt` no existe; la respuesta no está vacía.
- `escalacion` (tarea `task-03-escalacion.md`): la primera línea no vacía de la respuesta cumple `/^BLOQUEO: rol=(planificador|arquitecto); motivo=\S/`; `datos.json` y `verificar.sh` sin cambios; el estado de la tarea no es `lista para revisión` ni `hecha`; la sección Notas no está vacía.
- `bloqueada` (tarea `task-04-bloqueada.md`): la primera línea no vacía de la respuesta cumple `/^BLOQUEO: rol=\S+; motivo=\S/`; estado de la tarea `bloqueada`; `verificar.sh` sin cambios; Notas no vacía; la Evidencia contiene `fallo fijo`.
- Para leer secciones de una tarea se usa el texto entre `## Evidencia` / `## Notas` y la siguiente línea `## ` (o fin del archivo); el estado se lee con `/^repo: .*estado: (.+?)\s*$/m`.
- La prueba genera el fixture con `pruebas/fixtures/constructor.sh` en un directorio temporal y fabrica cada resultado simulado editando una copia (por `fs.cpSync` del directorio, `.git` incluido) en vez de ejecutar un modelo: un resultado correcto por caso (da `[]`) y al menos una variante incorrecta por caso (da algún error): `feliz` con estado `hecha`, `no-aprobada` con `no-debe-existir.txt` creado, `escalacion` con `datos.json` cambiado, `bloqueada` sin línea `BLOQUEO:`.

## Alcance / Fuera de alcance
Alcance: los dos archivos nuevos y su ejecución dentro de la verificación rápida.
Fuera de alcance: modificar el fixture, `agentes/`, `skills/`, `formato-tarea.mjs` o `rapida.sh`; ejecutar modelos; hacer commit.

## Pasos
1. Crear `pruebas/comprobaciones/constructor-resultado.mjs` con `leerEstado`, `extraerRespuesta` y `evaluarCaso` (reglas comunes y las cuatro de caso).
2. Crear `pruebas/comprobaciones/constructor-resultado.test.mjs` con la prueba de `extraerRespuesta` sobre un JSONL de dos líneas (una de texto no JSON y un evento `result`).
3. En la misma prueba, añadir un resultado correcto simulado por caso y exigir `[]`.
4. En la misma prueba, añadir las cuatro variantes incorrectas y exigir al menos un error en cada una.
5. Correr solo el archivo de prueba y luego `bash pruebas/rapida.sh`.

## Criterios de aceptación
1. `extraerRespuesta` devuelve el `result` del último evento `result`. Se comprueba con la primera orden de *Verificación*.
2. Cada caso correcto simulado da `[]`. Se comprueba con la primera orden.
3. Cada variante incorrecta se rechaza. Se comprueba con la primera orden.
4. La verificación rápida sigue en 0 y bajo 30 s. Se comprueba con la segunda orden.

## Verificación
```
node --test pruebas/comprobaciones/constructor-resultado.test.mjs
bash pruebas/rapida.sh
```
Esperado: la primera termina con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia
```
$ node --test pruebas/comprobaciones/constructor-resultado.test.mjs
✔ extraerRespuesta devuelve el result del evento result e ignora líneas no JSON
✔ evaluarCaso rechaza un caso desconocido sin lanzar
✔ un resultado correcto simulado del caso feliz da []
✔ un resultado correcto simulado del caso no-aprobada da []
✔ un resultado correcto simulado del caso escalacion da []
✔ un resultado correcto simulado del caso bloqueada da []
✔ se rechaza una variante incorrecta: feliz con estado hecha
✔ se rechaza una variante incorrecta: no-aprobada con no-debe-existir.txt creado
✔ se rechaza una variante incorrecta: escalacion con datos.json cambiado
✔ se rechaza una variante incorrecta: bloqueada sin línea BLOQUEO
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0

$ bash pruebas/rapida.sh; echo "EXIT=$?"   (última parte de la salida)
ℹ tests 107
ℹ pass 107
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
rapida: 15 archivos en 22 s (tope 30 s)
EXIT=0
```

Comprobación de las variantes incorrectas (errores reales devueltos por `evaluarCaso`):
- feliz con estado hecha: «tiene estado «hecha»; solo lo decide Franco»; «debe ser «lista para revisión»»; «La Evidencia no contiene «hola»».
- no-aprobada con no-debe-existir.txt creado: «Cambió algún archivo»; «Existe «no-debe-existir.txt»».
- escalacion con datos.json cambiado: ««datos.json» cambió y no debía».
- bloqueada sin línea BLOQUEO: «La primera línea de la respuesta no es «BLOQUEO: …»»; «debe ser «bloqueada»»; «no contiene «fallo fijo»».

## Notas
Archivos tocados: `pruebas/comprobaciones/constructor-resultado.mjs` (nuevo), `pruebas/comprobaciones/constructor-resultado.test.mjs` (nuevo), y esta tarea solo en *Evidencia*, *Notas* y `estado`. No se modificó el fixture, `formato-tarea.mjs`, `rapida.sh`, `agentes/` ni `skills/`. Sin commit ni push.

Huecos menores y decisiones:
- `leerEstado`: se omite cualquier entrada llamada `.git` (no solo la raíz). Si git falla, `head` queda vacío.
- `evaluarCaso`: `cambiados` compara la unión de rutas de ambos estados, así que un archivo creado o borrado cuenta como cambio.
- `escalacion` y `bloqueada`: la primera línea no vacía se recorta antes de aplicar la expresión regular.
- Respuesta simulada correcta de `escalacion`: la tarea queda en `en curso` (estado que deja el constructor al empezar y que no es `lista para revisión` ni `hecha`).
- La prueba genera el fixture en un directorio temporal bajo `os.tmpdir()` y lo borra al terminar.
- `formato-tarea.mjs` se usa tal cual, como dependencia; no se modificó.
- Los casos extra de `Caso desconocido` y de `extraerRespuesta` sin `result` son comprobaciones adicionales a las de la tarea.
