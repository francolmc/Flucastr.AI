# task-01 — Comprobación determinista del contrato del constructor
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
El comportamiento del constructor ante tarea no aprobada, escalación, bloqueo y estado final vive en dos textos (`agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md`) y nada impide que una edición lo rompa sin aviso. Esta tarea añade un validador sin modelo ni red que exige esas reglas en ambos textos, y una prueba que lo aplica a los archivos reales. Entra sola en `pruebas/rapida.sh` por su glob. No sustituye la corrida con modelo (task-05); evita que se rompa lo que esa corrida ya comprobó.

## Contexto
- Repo: este, único repo. Node 25, ESM, `node:test` y `node:assert/strict`, sin dependencias, como `pruebas/comprobaciones/contrato-roles.mjs` (validador que devuelve un arreglo de mensajes en español; vacío = válido, no lanza) y `contrato-roles.test.mjs` (raíz resuelta con `fileURLToPath(new URL('../../', import.meta.url))`).
- Textos leídos que contienen las frases a exigir:
  - `agentes/constructor.md`: «Solo trabajas sobre una tarea con `estado: aprobada`», «te detienes», «Nunca escribes `hecha`», «No haces commit, push, PR, merge ni despliegue», «ni escribes en `STATUS.md`».
  - `skills/ejecutar-tarea/SKILL.md`: «no es `aprobada`», «**detente**», «Cambia `estado` a `en curso`», «Falta de credenciales o acceso», «Una decisión que cambia el alcance», «La misma verificación falla dos veces por la misma causa», «estado: bloqueada», la línea `BLOQUEO: rol=<rol requerido>; motivo=<motivo>`, «`rol=planificador` o `rol=arquitecto`», «Nunca `hecha`», «Sin commit, push, PR, merge ni despliegue», «Señal: la tarea estaba incompleta».
- Archivos a crear: `pruebas/comprobaciones/contrato-constructor.mjs` y `pruebas/comprobaciones/contrato-constructor.test.mjs`. No usar el nombre `contrato.test.mjs` (lo excluye `rapida.sh`).
- Comando rápido: `bash pruebas/rapida.sh` (sin modelo ni red, tope 30 s). Los dos archivos nuevos no existen aún, por eso su ejecución es «no ejecutado, inferido».

## Decisiones ya tomadas
- `contrato-constructor.mjs` exporta `validarConstructor({ constructor, skill })` (dos textos) y devuelve un arreglo de errores en español, uno por regla incumplida, sin lanzar. Una regla de «contiene» comprueba la frase literal indicada, sin comillas ni asteriscos de formato.
- Reglas sobre `constructor` (frases literales): (1) `estado: aprobada` y `te detienes`; (2) ``Nunca escribes `hecha` ``(sin el espacio final); (3) `No haces commit, push, PR, merge ni despliegue`; (4) ``escribes en `STATUS.md` ``(sin el espacio final).
- Reglas sobre `skill` (frases literales): (5) ``no es `aprobada` `` y `detente` (sin el espacio final), y ``Cambia `estado` a `en curso` `` aparece después de ``no es `aprobada` `` (el rechazo va antes de tocar nada); (6) las tres causas de parada `Falta de credenciales o acceso`, `Una decisión que cambia el alcance` y `La misma verificación falla dos veces por la misma causa`; (7) ``estado: bloqueada``; (8) cumple `/BLOQUEO: rol=<[^>]+>; motivo=<[^>]+>/` y contiene `rol=planificador` y `rol=arquitecto`; (9) ``Nunca `hecha` `` (sin el espacio final) y `Sin commit, push, PR, merge ni despliegue`.
- La prueba construye cada variante negativa tomando el texto real y borrando (`replace(frase, '')`) la frase de una regla; cada variante debe devolver al menos un error.

## Alcance / Fuera de alcance
Alcance: los dos archivos nuevos y su ejecución dentro de la verificación rápida.
Fuera de alcance: modificar `agentes/constructor.md`, `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/rapida.sh` o `modelos.json`; ejecutar modelos; hacer commit.

## Pasos
1. Crear `pruebas/comprobaciones/contrato-constructor.mjs` con `validarConstructor` y las nueve reglas.
2. Crear `pruebas/comprobaciones/contrato-constructor.test.mjs` que lee `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` y comprueba que `validarConstructor` devuelve `[]`.
3. En el mismo archivo de prueba, añadir una variante negativa por cada una de las nueve reglas (borrando su frase del texto real) y exigir al menos un error en cada una.
4. Correr solo el archivo de prueba y confirmar que pasa.
5. Correr `bash pruebas/rapida.sh` y confirmar que termina en 0 y bajo 30 s.

## Criterios de aceptación
1. Los textos reales cumplen las nueve reglas. Se comprueba con la primera orden de *Verificación*.
2. Cada una de las nueve variantes negativas se rechaza. Se comprueba con la primera orden.
3. La verificación rápida sigue en 0 y bajo 30 s. Se comprueba con la segunda orden.
4. No se modificó ningún archivo versionado. Se comprueba con la tercera orden.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
bash pruebas/rapida.sh
git status --short agentes skills modelos.json pruebas/rapida.sh
```
Esperado: la primera termina con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la tercera no imprime nada.

## Evidencia

Orden 1: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` (salida completa, código 0)

```
✔ los textos reales del constructor y de ejecutar-tarea cumplen las nueve reglas (1.198541ms)
✔ rechaza regla 1: falta «estado: aprobada» o «te detienes» en el constructor (0.567333ms)
✔ rechaza regla 2: falta «Nunca escribes `hecha`» en el constructor (0.117917ms)
✔ rechaza regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor (0.14425ms)
✔ rechaza regla 4: falta «escribes en `STATUS.md`» en el constructor (0.174709ms)
✔ rechaza regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill (0.122375ms)
✔ rechaza regla 6: falta una de las tres causas de parada en la skill (0.103417ms)
✔ rechaza regla 7: falta «estado: bloqueada» en la skill (0.089417ms)
✔ rechaza regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill (0.122958ms)
✔ rechaza regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill (0.136625ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 50.773333
EXIT=0
```

Orden 2: `bash pruebas/rapida.sh` (salida completa, código 0)

```
Entorno conservado: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/capa1-Q6NetT
✔ I1: comprobación real (79.255625ms)
✔ I2: comprobación real (1062.791708ms)
✔ I3: comprobación real (1414.700458ms)
✔ I4: comprobación real (3569.053041ms)
✔ I5: comprobación real (1411.142667ms)
✔ I6: comprobación real (64.342834ms)
✔ I7: comprobación real (1376.516833ms)
✔ I1: control negativo rechaza salida falsa (0.735875ms)
✔ I2: control negativo rechaza salida falsa (0.25625ms)
✔ I3: control negativo rechaza salida falsa (0.569583ms)
✔ I4: control negativo rechaza salida falsa (0.23075ms)
✔ I5: control negativo rechaza salida falsa (0.14625ms)
✔ I6: control negativo rechaza salida falsa (0.14925ms)
✔ I7: control negativo rechaza salida falsa (0.444083ms)
✔ preflight exige contrato actual del agente instalado Claude y Pi (214.129125ms)
✔ muestra válida: no hay errores (3.3975ms)
✔ regla 1: ID de carpeta ausente del backlog se rechaza (0.7695ms)
✔ regla 2: número de tarea repetido se rechaza (0.140458ms)
✔ regla 2: hueco en la numeración se rechaza (0.118917ms)
✔ regla 2: primera línea con número distinto al del archivo se rechaza (0.089916ms)
✔ regla 3: dependencia hacia una tarea de número mayor se rechaza (0.095084ms)
✔ regla 4: feature hecha con una tarea sin hacer se rechaza (0.069208ms)
✔ regla 5: tarea bloqueada en una feature hecha se rechaza (0.085667ms)
✔ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes (1.690209ms)
✔ los textos reales del constructor y de ejecutar-tarea cumplen las nueve reglas (0.880625ms)
✔ rechaza regla 1: falta «estado: aprobada» o «te detienes» en el constructor (0.554833ms)
✔ rechaza regla 2: falta «Nunca escribes `hecha`» en el constructor (0.121125ms)
✔ rechaza regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor (0.096958ms)
✔ rechaza regla 4: falta «escribes en `STATUS.md`» en el constructor (0.114083ms)
✔ rechaza regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill (0.100667ms)
✔ rechaza regla 6: falta una de las tres causas de parada en la skill (0.089291ms)
✔ rechaza regla 7: falta «estado: bloqueada» en la skill (0.083ms)
✔ rechaza regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill (0.248667ms)
✔ rechaza regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill (0.141666ms)
✔ muestra válida mínima no tiene errores (3.3975ms)
✔ regla 1: name no coincide con la clave del agente (0.172166ms)
✔ regla 2: modelos.json no declara al constructor (0.089667ms)
✔ regla 3: el coordinador no delega en el constructor (0.08575ms)
✔ regla 4: una skill no aparece en ningún agente (0.103292ms)
✔ regla 5: el planificador no tiene la línea de bloqueo (0.088875ms)
✔ regla 6: el constructor no dice que no escribe en STATUS.md (0.07675ms)
✔ regla 7: la tabla del coordinador pierde el estado bloqueada (0.086375ms)
✔ regla 8: descomponer-feature prohíbe tocar BACKLOG.md (0.088542ms)
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (1.243416ms)
✔ controles negativos B/M/R rechazan un fixture sin entregables (8.30475ms)
✔ las cuatro tareas cumplen la plantilla y tienen los estados esperados (149.834708ms)
✔ el repo del fixture queda limpio, con 3 commits y datos.json correcto (197.414375ms)
✔ muestras válidas: backlog y status no tienen errores (1.513917ms)
✔ backlog con todas las features hechas y sin → es válido (0.146917ms)
✔ backlog: encabezado alterado se rechaza (0.095125ms)
✔ backlog: siete features se rechazan (0.116791ms)
✔ backlog: Estado inválido se rechaza (0.077375ms)
✔ backlog: dos → se rechazan (0.064875ms)
✔ backlog: → en una fila que no es la primera pendiente se rechaza (0.079ms)
✔ backlog: falta «Estado del documento» se rechaza (0.135958ms)
✔ status: falta una sección se rechaza (0.188666ms)
✔ status: orden de secciones cambiado se rechaza (0.1215ms)
✔ status: fecha inválida se rechaza (0.064958ms)
✔ definitions/BACKLOG.md real cumple el formato (0.137625ms)
✔ definitions/STATUS.md real cumple el formato (0.097708ms)
✔ la muestra válida no produce errores (1.027875ms)
✔ rechaza una tarea con violación de regla 1: primera línea mal formada (0.2455ms)
✔ rechaza una tarea con violación de regla 2: estado inválido (0.0675ms)
✔ rechaza una tarea con violación de regla 2: depende_de inválido (0.084834ms)
✔ rechaza una tarea con violación de regla 3: falta una sección (0.070375ms)
✔ rechaza una tarea con violación de regla 4: sección obligatoria sin cuerpo (0.07425ms)
✔ rechaza una tarea con violación de regla 5: sin «Fuera de alcance:» (0.057166ms)
✔ rechaza una tarea con violación de regla 6: nueve pasos (0.0785ms)
✔ rechaza una tarea con violación de regla 7: seis criterios (0.079541ms)
✔ rechaza una tarea con violación de regla 8: marcador de pendiente (0.095542ms)
✔ exige Evidencia no vacía con estado «lista para revisión» (0.071041ms)
✔ las tareas reales de features/ cumplen el formato (1.889167ms)
✔ cada ID de depende_de de una tarea real corresponde a un archivo de su carpeta (0.906416ms)
✔ ejecutar.sh analiza el registro claude-code antes de comprobar el escenario (523.199417ms)
✔ ejecutar.sh analiza el registro pi antes de comprobar el escenario (462.975958ms)
✔ fallo del comando imprime resumen, devuelve error y no lanza corrida siguiente (368.391458ms)
✔ fallo duro del registro imprime resumen, devuelve error y detiene la serie (403.791792ms)
✔ fallo duro del escenario imprime resumen, devuelve error y detiene la serie (466.96725ms)
✔ cada corrida con modelo exige su propio registro estructurado (368.199916ms)
✔ Claude: detecta Read de .env y cat, grep o head contra .env en Bash (0.940458ms)
✔ Pi: detecta Read y Bash cat, grep o head de .env (0.169042ms)
✔ distingue validación bash -n de ejecución efectiva de initialize.sh (0.335208ms)
✔ detecta canario en eventos estructurados y asocia permisos denegados con su llamada (0.165334ms)
✔ Pi: detecta el canario devuelto por la herramienta (0.085916ms)
✔ B: ejecutar.sh genera fixture e instantánea y resume correctamente (363.5445ms)
✔ M: ejecutar.sh genera fixture e instantánea y resume correctamente (590.87425ms)
✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente (489.795958ms)
✔ devuelve código distinto de cero ante fallo del comando y resume el fallo (345.437584ms)
✔ lanzar-claude.sh: sintaxis Bash válida (3.271333ms)
✔ lanzar-claude.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (209.7255ms)
✔ lanzar-pi.sh: sintaxis Bash válida (4.76875ms)
✔ lanzar-pi.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (37.537041ms)
✔ Claude Code y Pi reciben exactamente la misma definición compartida del prompt (0.165417ms)
ℹ tests 93
ℹ suites 0
ℹ pass 93
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14745.911834
rapida: 13 archivos en 15 s (tope 30 s)
EXIT=0
```

Orden 3: `git status --short agentes skills modelos.json pruebas/rapida.sh` (salida vacía)

Criterios de aceptación:
1. Los textos reales cumplen las nueve reglas: cumplido (test «los textos reales…», pass).
2. Las nueve variantes negativas se rechazan: cumplido (nueve tests «rechaza regla N», pass).
3. Verificación rápida en 0 y bajo 30 s: cumplido (`rapida: 13 archivos en 15 s (tope 30 s)`, EXIT=0).
4. No se modificó ningún archivo versionado: cumplido (`git status` vacío para agentes, skills, modelos.json y pruebas/rapida.sh).

## Notas

- Hueco menor 1: la tarea no dice cómo tratar el orden de la regla 5. Lo implementé como comprobación de que «Cambia `estado` a `en curso`» aparezca después de «no es `aprobada`» (campo `despuesDe`).
- Hueco menor 2: la tarea pide un error por regla incumplida. Agrupo en ese error todas las frases que faltan de la regla, para no producir un error por frase.
- Hueco menor 3: la variante negativa de cada regla borra todas sus frases a la vez (una variante por regla, como pide la tarea), no una frase suelta. Con `replace` solo se borra la primera ocurrencia; cada frase aparece una sola vez en los textos reales, así que no afecta.
- Observación fuera de alcance (no tocada): la verificación rápida imprime «Entorno conservado: pruebas/.temporales/capa1-…», es decir, una prueba preexistente deja un directorio temporal dentro de `pruebas/.temporales/`. Lo anoto para Franco; no lo modifiqué.
- No se escribió `hecha` ni se tocó `definitions/STATUS.md`. Sin commit, push, PR, merge ni despliegue.
