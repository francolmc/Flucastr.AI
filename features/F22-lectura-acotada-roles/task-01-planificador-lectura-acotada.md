# task-01 — `planificador` y `descomponer-feature`: lectura acotada y tarea que se basta sola
repo: Flucastr.AI   depende_de: —   estado: borrador

## Descripción
En la sesión medida (`definitions/CONTEXTO.md` §1) el `planificador` leyó `ARCHITECTURE.md` y `PROJECT.md` completos (69 % de lo que leyó). Esta tarea fija en `agentes/planificador.md` la regla de §2.2 (solo la sección que toca la feature) y, en `skills/descomponer-feature/SKILL.md`, la regla de que cada tarea se baste sola: cita las líneas o firmas exactas y las secciones de definición con ruta, para que el `constructor` no tenga que leer documentos enteros. Corrige además una cifra desfasada de la skill (`~5 archivos`; `WORKFLOW.md` §6 dice `~3`).

## Contexto
- Diseño aprobado: `definitions/CONTEXTO.md` §2.2 (fila `planificador` y párrafo «Al `planificador` le corresponde…») y §2.3 (topes). Leer solo esas secciones. Tamaños y topes de tarea: `definitions/WORKFLOW.md` §6, «Qué las hace acotadas».
- `agentes/planificador.md` (3777 bytes): el paso 1 de «## Cómo trabajas» dice hoy ``1. Lee `AGENTS.md` y `definitions/` (`PROJECT.md`, `REPOS.md`, `ARCHITECTURE.md`).``; la sección siguiente es «## Antes de entregar».
- `skills/descomponer-feature/SKILL.md` (4696 bytes): paso 1 de «## Pasos» (`1. Lee la feature y el código real de cada repo que toca.…`), el bloque de la plantilla (termina en la línea de «Estados válidos…»), y en «## Acotada» la viñeta ``- Hasta ~8 pasos, ~5 archivos tocados y 5 criterios de aceptación.``
- Nada en `pruebas/` ni `scripts/` fija las frases que se reemplazan (comprobado con `grep -rn`). Sí deben seguir pasando: `pruebas/comprobaciones/contrato-roles.test.mjs` (reglas 5, 6, 8, 11, 12, 13), `pruebas/comprobaciones/higiene-contexto.test.mjs`, `pruebas/comprobaciones/formato-tarea.test.mjs`.
- `grep -n '^## ' definitions/ARCHITECTURE.md` lista las secciones del documento (comprobado).
- Tocar: `agentes/planificador.md`, `skills/descomponer-feature/SKILL.md`.

## Decisiones ya tomadas
- Se edita con `Edit`; cada reemplazo de esta tarea es un solo `Edit` con el texto exacto de abajo (no por tramos de a poco). Cada frase obligatoria va en su propia línea, porque la verificación cuenta líneas con `grep -c`.
- `agentes/planificador.md`, paso 1 de «Cómo trabajas» pasa a: ``1. Lee `AGENTS.md`, `definitions/BACKLOG.md` y la lista de `features/` (sin entrar en `features/completed/`). De `definitions/` lee lo que indica «Lectura acotada».``
- Sección nueva `## Lectura acotada` entre «Cómo trabajas» y «Antes de entregar», con estas viñetas literales:
  - ``- Solo lees de `definitions/` la sección que toca la feature.``
  - ``- Ubícala con `grep -n '^## '` sobre el documento y léela con `Read` y `offset`/`limit`; no releas lo que ya leíste.``
  - ``- No lees tareas de otras features ni tareas `hecha`.``
  - ``- Con la skill `crear-backlog` (puerta 2) sí lees `PROJECT.md`, `REPOS.md` y `ARCHITECTURE.md` completos, una vez.``
- `descomponer-feature`, paso 1: se agrega al final la frase ``De `definitions/` lee solo la sección que toca la feature, nunca el documento entero.``
- `descomponer-feature`: sección nueva `## Tarea que se basta sola` antes de «## Completa», con estas viñetas literales:
  - ``- En *Contexto*, cita en *Contexto* las líneas o firmas exactas que el ejecutor necesita (archivo y rango de líneas, o la firma).``
  - ``- Cita cada sección de `definitions/` con su ruta y título (por ejemplo `definitions/WORKFLOW.md` §6), no el documento entero.``
  - ``- De `depende_de:` indica leer solo las *Notas* de esa tarea.``
  - ``- No pidas leer tareas `hecha` ajenas a `depende_de:`.``
- `descomponer-feature`, «Acotada»: la viñeta de pasos pasa a ``- Hasta ~8 pasos, ~3 archivos tocados y 5 criterios de aceptación.`` y se agrega debajo ``- Hasta 6 KB (aviso) / 8 KB (error); *Evidencia* hasta 1,5 KB.``
- Topes finales: `agentes/planificador.md` ≤ 4600 bytes; `skills/descomponer-feature/SKILL.md` ≤ 5600 bytes.

## Alcance / Fuera de alcance
Alcance: los dos archivos de *Contexto*, solo los pasajes indicados.
Fuera de alcance: `crear-backlog` y las demás skills; `constructor`, `arquitecto` y `coordinador`; pruebas de contrato (task-04); `scripts/archivar.mjs` y `formato-tarea.mjs` (F23); `definitions/`; correr modelo.

## Pasos
1. `agentes/planificador.md`: `Edit` del paso 1 de «Cómo trabajas» con el texto de *Decisiones*.
2. `agentes/planificador.md`: `Edit` que inserta la sección «## Lectura acotada» antes de «## Antes de entregar».
3. `skills/descomponer-feature/SKILL.md`: `Edit` del paso 1 de «Pasos» (agrega la frase).
4. `skills/descomponer-feature/SKILL.md`: `Edit` que inserta «## Tarea que se basta sola» antes de «## Completa».
5. `skills/descomponer-feature/SKILL.md`: `Edit` de la viñeta ``~5 archivos`` y de la viñeta nueva de tamaños en «## Acotada».
6. Correr la *Verificación* y pegar la cola relevante en *Evidencia*.

## Criterios de aceptación
1. Cada frase obligatoria aparece en exactamente una línea (`grep -cF` imprime 1 por frase).
2. `agentes/planificador.md` ya no contiene ``(`PROJECT.md`, `REPOS.md`, `ARCHITECTURE.md`).`` en el paso 1 y mide ≤ 4600 bytes; la skill mide ≤ 5600 bytes y ya no contiene ``~5 archivos``.
3. Las suites de contrato y de higiene siguen en `fail 0`.
4. `bash pruebas/rapida.sh` termina con código 0 y S ≤ 30.

## Verificación
- `cd /Users/franco/Codes/flucastr/Flucastr.AI && for f in 'Solo lees de `definitions/` la sección que toca la feature' 'No lees tareas de otras features ni tareas `hecha`' 'Con la skill `crear-backlog` (puerta 2) sí lees `PROJECT.md`, `REPOS.md` y `ARCHITECTURE.md` completos, una vez'; do grep -cF -- "$f" agentes/planificador.md; done` → `1` tres veces.
- `for f in 'Tarea que se basta sola' 'cita en *Contexto* las líneas o firmas exactas que el ejecutor necesita' 'con su ruta y título' 'De `depende_de:` indica leer solo las *Notas* de esa tarea' '~3 archivos tocados' 'lee solo la sección que toca la feature'; do grep -cF -- "$f" skills/descomponer-feature/SKILL.md; done` → `1` seis veces.
- `grep -c '~5 archivos' skills/descomponer-feature/SKILL.md` → `0`; `wc -c agentes/planificador.md skills/descomponer-feature/SKILL.md` → ≤ 4600 y ≤ 5600.
- `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs pruebas/comprobaciones/formato-tarea.test.mjs` → `fail 0`.
- `bash pruebas/rapida.sh` → código 0 y `rapida: … (tope 30 s)` con S ≤ 30 (si pasa de 30 s sin prueba fallida, repetirla una vez y anotarlo en *Notas*).

## Evidencia

## Notas
