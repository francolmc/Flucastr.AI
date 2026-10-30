# task-03 — Contrato del constructor: reglas de rama y CONFIRMAR, con control negativo
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`pruebas/comprobaciones/contrato-constructor.mjs` verifica por frases literales el contrato de `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md`. Esta tarea añade las reglas que dejó task-01 (git de escritura acotado y línea `CONFIRMAR:`) para que un futuro cambio que las borre falle la verificación rápida, y las acompaña de variantes negativas.

## Contexto
- Repo: este, único repo. Node, ESM, `node:test`, sin dependencias. Leídos: `pruebas/comprobaciones/contrato-constructor.mjs` (arreglo `REGLAS` de objetos `{ n, sobre: 'constructor'|'skill', frases, despuesDe?, regex? }`; función `validarConstructor({ constructor, skill })` que devuelve un arreglo de errores en español, vacío = válido) y `pruebas/comprobaciones/contrato-constructor.test.mjs` (prueba que los textos reales dan `[]` y un arreglo `variantes` `[nombre, sobre, frases]` que borra cada frase del texto real y exige al menos un error).
- Las frases que existen tras task-01 están fijadas en *Decisiones ya tomadas* de `task-01-constructor-rama-y-confirmar.md`. Esta tarea no puede correrse antes de que task-01 esté `hecha`.
- Comando: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs`.
- Archivos a tocar: `pruebas/comprobaciones/contrato-constructor.mjs` y `pruebas/comprobaciones/contrato-constructor.test.mjs`.

## Decisiones ya tomadas
- Tres reglas nuevas, numeradas 10, 11 y 12, al final de `REGLAS`:
  - Regla 10, sobre `constructor`: frases `git switch -c`, `git branch --show-current` y la frase «Nunca `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout`» (con las comillas invertidas literales, sin el punto final).
  - Regla 11, sobre `skill`: frases `git switch -c`, `git branch --show-current`, `Rama:`, «Franco confirmó `git switch <rama>`», y `despuesDe` con las frases `git switch -c` y «Cambia `estado` a `en curso`» (la rama se resuelve antes de pasar a `en curso`; `despuesDe` usa la primera aparición de cada frase, como hoy).
  - Regla 12, sobre `skill`: la línea `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>` literal, más `regex: /CONFIRMAR: accion=git switch <[^>]+>; motivo=[^\n]+/`, con mensaje propio «falta la línea CONFIRMAR…».
- Como `regex` hoy produce siempre el mensaje de BLOQUEO, se cambia para que cada regla pueda traer su propio texto: campo `mensajeRegex` en la regla (la regla 8 conserva exactamente su mensaje actual).
- No se fija cuántas reglas hay: el título de la prueba de los textos reales deja de decir «nueve reglas» y pasa a «cumplen todas las reglas».
- Variantes negativas nuevas en el arreglo `variantes` del test, una por regla nueva (10, 11, 12), borrando sus frases como las existentes. Además una prueba de orden: intercambiar en la skill el paso de rama y «Cambia `estado` a `en curso`» hace que la regla 11 dé error (se construye moviendo el texto «Cambia `estado` a `en curso`» antes de «git switch -c»: reemplazar la primera aparición de `git switch -c` por `X` y añadir `git switch -c` al final del texto).
- No se modifica `agentes/` ni `skills/`; si una frase falta porque task-01 no la escribió, es un fallo de task-01: `BLOQUEO: rol=planificador; motivo=…`.

## Alcance / Fuera de alcance
Alcance: reglas 10–12, `mensajeRegex`, variantes negativas y el título de la prueba.
Fuera de alcance: `contrato-roles.mjs` (task-06), `constructor-resultado.mjs` (task-07), el coordinador, el lanzador, modo yolo, reescribir las reglas 1–9.

## Pasos
1. En `contrato-constructor.mjs`, añadir el campo opcional `mensajeRegex` y usarlo en el bloque que hoy emite «falta la línea «BLOQUEO…»» (si no está, se usa el mensaje actual). Resultado: la regla 8 da el mismo mensaje que antes.
2. Añadir las reglas 10, 11 y 12 con las decisiones de arriba. Resultado: `validarConstructor` con los textos reales devuelve `[]`.
3. En `contrato-constructor.test.mjs`, cambiar el título de la primera prueba y añadir tres variantes al arreglo `variantes` (reglas 10, 11 y 12).
4. Añadir la prueba de orden descrita. Resultado: error de la regla 11.
5. Correr la *Verificación*.

## Criterios de aceptación
1. Los textos reales cumplen todas las reglas. Se comprueba con la prueba «los textos reales…» (`fail 0`).
2. Borrar cualquiera de las frases de las reglas 10, 11 o 12 produce al menos un error. Se comprueba con las tres variantes nuevas.
3. Poner la rama después del paso a `en curso` produce error de la regla 11. Se comprueba con la prueba de orden.
4. El mensaje de la regla 8 no cambió. Se comprueba porque su variante existente sigue pasando.
5. La verificación rápida pasa. Se comprueba con la segunda orden de *Verificación*.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
bash pruebas/rapida.sh
git status --short pruebas/comprobaciones
```
Esperado: la primera con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la tercera muestra `contrato-constructor.mjs` y `contrato-constructor.test.mjs` entre los cambios.

## Evidencia

Dependencia: `task-01-constructor-rama-y-confirmar.md` tiene `estado: hecha` (comprobado antes de empezar). El encargo no trae línea `Rama:`, así que no se ejecutó ningún comando git de rama.

Comprobación previa de frases en los textos reales (`grep -nF`): «Nunca `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout`» y «git switch -c» en `agentes/constructor.md`; «git switch -c», «git branch --show-current», «Rama:», «Franco confirmó `git switch <rama>`», «Cambia `estado` a `en curso`» y la línea «CONFIRMAR: accion=git switch <rama>; motivo=<motivo>» en `skills/ejecutar-tarea/SKILL.md`. La regex de la regla 12 (`CONFIRMAR: accion=git switch <[^>]+>; motivo=[^\n]+`) coincide en la skill.

Cambios: `pruebas/comprobaciones/contrato-constructor.mjs` (campo `mensajeRegex`, reglas 10, 11 y 12) y `pruebas/comprobaciones/contrato-constructor.test.mjs` (título nuevo, tres variantes, prueba de orden).

1. `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` (salida con `tail -n 25`, sin cortar las pruebas):
```
✔ los textos reales del constructor y de ejecutar-tarea cumplen todas las reglas (2.802ms)
✔ rechaza regla 1: falta «estado: aprobada» o «te detienes» en el constructor (0.204459ms)
✔ rechaza regla 2: falta «Nunca escribes `hecha`» en el constructor (0.141625ms)
✔ rechaza regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor (0.12775ms)
✔ rechaza regla 4: falta «escribes en `STATUS.md`» en el constructor (0.129083ms)
✔ rechaza regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill (0.125125ms)
✔ rechaza regla 6: falta una de las tres causas de parada en la skill (0.143917ms)
✔ rechaza regla 7: falta «estado: bloqueada» en la skill (0.197167ms)
✔ rechaza regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill (0.208042ms)
✔ rechaza regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill (0.185958ms)
✔ rechaza regla 10: falta «git switch -c», «git branch --show-current» o la prohibición de `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout` en el constructor (0.084041ms)
✔ rechaza regla 11: falta «git switch -c», «git branch --show-current», «Rama:», «Franco confirmó `git switch <rama>`» o «Cambia `estado` a `en curso`» en la skill (0.075375ms)
✔ rechaza regla 12: falta la línea «CONFIRMAR: accion=git switch <rama>; motivo=<motivo>» en la skill (0.329708ms)
✔ rechaza la regla 11 si la rama se resuelve después del paso a «en curso» (0.899792ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 66.831584
```
Código de salida de `node --test ...` sin tubería: `0`.

2. `bash pruebas/rapida.sh` (salida completa):
```
Entorno conservado: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/capa1-nN6Tq5
✔ I1: comprobación real (55.818334ms)
✔ I2: comprobación real (940.707167ms)
✔ I3: comprobación real (905.917334ms)
✔ I4: comprobación real (2784.014209ms)
✔ I5: comprobación real (1045.201167ms)
✔ I6: comprobación real (51.4695ms)
✔ I7: comprobación real (875.873917ms)
✔ I1: control negativo rechaza salida falsa (0.693958ms)
✔ I2: control negativo rechaza salida falsa (0.176416ms)
✔ I3: control negativo rechaza salida falsa (0.444917ms)
✔ I4: control negativo rechaza salida falsa (0.167875ms)
✔ I5: control negativo rechaza salida falsa (0.115916ms)
✔ I6: control negativo rechaza salida falsa (0.108167ms)
✔ I7: control negativo rechaza salida falsa (0.296208ms)
✔ preflight exige contrato actual del agente instalado Claude y Pi (115.098667ms)
✔ muestra válida: no hay errores (0.889875ms)
✔ regla 1: ID de carpeta ausente del backlog se rechaza (0.377167ms)
✔ regla 2: número de tarea repetido se rechaza (0.110833ms)
✔ regla 2: hueco en la numeración se rechaza (0.072417ms)
✔ regla 2: primera línea con número distinto al del archivo se rechaza (0.074416ms)
✔ regla 3: dependencia hacia una tarea de número mayor se rechaza (0.065167ms)
✔ regla 4: feature hecha con una tarea sin hacer se rechaza (0.058041ms)
✔ regla 5: tarea bloqueada en una feature hecha se rechaza (0.063208ms)
✔ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes (6.839125ms)
✔ extraerRespuesta devuelve el result del evento result e ignora líneas no JSON (0.568541ms)
✔ evaluarCaso rechaza un caso desconocido sin lanzar (0.140916ms)
✔ un resultado correcto simulado del caso feliz da [] (146.047334ms)
✔ un resultado correcto simulado del caso no-aprobada da [] (135.05075ms)
✔ un resultado correcto simulado del caso escalacion da [] (143.528417ms)
✔ un resultado correcto simulado del caso bloqueada da [] (146.980708ms)
✔ se rechaza una variante incorrecta: feliz con estado hecha (145.879291ms)
✔ se rechaza una variante incorrecta: no-aprobada con no-debe-existir.txt creado (139.016541ms)
✔ se rechaza una variante incorrecta: escalacion con datos.json cambiado (180.710792ms)
✔ se rechaza una variante incorrecta: bloqueada sin línea BLOQUEO (148.582625ms)
✔ los textos reales del constructor y de ejecutar-tarea cumplen todas las reglas (1.065375ms)
✔ rechaza regla 1: falta «estado: aprobada» o «te detienes» en el constructor (0.159459ms)
✔ rechaza regla 2: falta «Nunca escribes `hecha`» en el constructor (0.094959ms)
✔ rechaza regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor (0.087709ms)
✔ rechaza regla 4: falta «escribes en `STATUS.md`» en el constructor (0.091792ms)
✔ rechaza regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill (0.093333ms)
✔ rechaza regla 6: falta una de las tres causas de parada en la skill (0.084334ms)
✔ rechaza regla 7: falta «estado: bloqueada» en la skill (0.078416ms)
✔ rechaza regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill (0.092042ms)
✔ rechaza regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill (0.112542ms)
✔ rechaza regla 10: falta «git switch -c», «git branch --show-current» o la prohibición de `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout` en el constructor (0.08375ms)
✔ rechaza regla 11: falta «git switch -c», «git branch --show-current», «Rama:», «Franco confirmó `git switch <rama>`» o «Cambia `estado` a `en curso`» en la skill (0.076292ms)
✔ rechaza regla 12: falta la línea «CONFIRMAR: accion=git switch <rama>; motivo=<motivo>» en la skill (0.079375ms)
✔ rechaza la regla 11 si la rama se resuelve después del paso a «en curso» (0.39175ms)
✔ muestra válida mínima no tiene errores (1.245375ms)
✔ rechaza regla 1: name no coincide con la clave del agente (0.148042ms)
✔ rechaza regla 2: modelos.json no declara al constructor (0.076042ms)
✔ rechaza regla 3: el coordinador no delega en el constructor (0.071334ms)
✔ rechaza regla 4: una skill no aparece en ningún agente (0.08425ms)
✔ rechaza regla 5: el planificador no tiene la línea de bloqueo (0.073834ms)
✔ rechaza regla 6: el constructor no dice que no escribe en STATUS.md (0.057958ms)
✔ rechaza regla 7: la tabla del coordinador pierde el estado bloqueada (0.06925ms)
✔ rechaza regla 8: descomponer-feature prohíbe tocar BACKLOG.md (0.07225ms)
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (0.941125ms)
✔ controles negativos B/M/R rechazan un fixture sin entregables (7.679ms)
✔ las cuatro tareas cumplen la plantilla y tienen los estados esperados (127.967791ms)
✔ el repo del fixture queda limpio, con 3 commits y datos.json correcto (139.284584ms)
✔ muestras válidas: backlog y status no tienen errores (1.194042ms)
✔ backlog con todas las features hechas y sin → es válido (0.148792ms)
✔ backlog: encabezado alterado se rechaza (0.096084ms)
✔ backlog: siete features se rechazan (0.086167ms)
✔ backlog: Estado inválido se rechaza (0.073584ms)
✔ backlog: dos → se rechazan (0.055792ms)
✔ backlog: → en una fila que no es la primera pendiente se rechaza (0.053875ms)
✔ backlog: falta «Estado del documento» se rechaza (0.054917ms)
✔ status: falta una sección se rechaza (0.109709ms)
✔ status: orden de secciones cambiado se rechaza (0.101125ms)
✔ status: fecha inválida se rechaza (0.054417ms)
✔ definitions/BACKLOG.md real cumple el formato (0.126375ms)
✔ definitions/STATUS.md real cumple el formato (0.244667ms)
✔ la muestra válida no produce errores (0.878833ms)
✔ rechaza una tarea con violación de regla 1: primera línea mal formada (0.20625ms)
✔ rechaza una tarea con violación de regla 2: estado inválido (0.059666ms)
✔ rechaza una tarea con violación de regla 2: depende_de inválido (0.097083ms)
✔ rechaza una tarea con violación de regla 3: falta una sección (0.075292ms)
✔ rechaza una tarea con violación de regla 4: sección obligatoria sin cuerpo (0.046875ms)
✔ rechaza una tarea con violación de regla 5: sin «Fuera de alcance:» (0.046125ms)
✔ rechaza una tarea con violación de regla 6: nueve pasos (0.06275ms)
✔ rechaza una tarea con violación de regla 7: seis criterios (0.066125ms)
✔ rechaza una tarea con violación de regla 8: marcador de pendiente (0.083167ms)
✔ exige Evidencia no vacía con estado «lista para revisión» (0.056291ms)
✔ las tareas reales de features/ cumplen el formato (1.981833ms)
✔ cada ID de depende_de de una tarea real corresponde a un archivo de su carpeta (1.289083ms)
✔ muestra válida: no hay errores (0.659541ms)
✔ variante: falta un agente en el README (0.085958ms)
✔ variante: falta una skill en el README (0.307042ms)
✔ variante: sobra un agente en el README (0.057333ms)
✔ variante: sobra una skill en el README (0.056333ms)
✔ variante: README sin sección «## Estructura» (0.047708ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.5245ms)
✔ ejecutar.sh analiza el registro claude-code antes de comprobar el escenario (372.541041ms)
✔ ejecutar.sh analiza el registro pi antes de comprobar el escenario (358.724416ms)
✔ fallo del comando imprime resumen, devuelve error y no lanza corrida siguiente (315.449958ms)
✔ fallo duro del registro imprime resumen, devuelve error y detiene la serie (336.909583ms)
✔ fallo duro del escenario imprime resumen, devuelve error y detiene la serie (450.398875ms)
✔ cada corrida con modelo exige su propio registro estructurado (309.632875ms)
✔ Claude: detecta Read de .env y cat, grep o head contra .env en Bash (0.91025ms)
✔ Pi: detecta Read y Bash cat, grep o head de .env (0.156166ms)
✔ distingue validación bash -n de ejecución efectiva de initialize.sh (0.283167ms)
✔ detecta canario en eventos estructurados y asocia permisos denegados con su llamada (0.14ms)
✔ Pi: detecta el canario devuelto por la herramienta (0.066834ms)
✔ B: ejecutar.sh genera fixture e instantánea y resume correctamente (320.65375ms)
✔ M: ejecutar.sh genera fixture e instantánea y resume correctamente (578.918834ms)
✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente (537.785917ms)
✔ devuelve código distinto de cero ante fallo del comando y resume el fallo (318.799917ms)
✔ lanzar-claude.sh: sintaxis Bash válida (4.1115ms)
✔ lanzar-claude.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (742.230791ms)
✔ lanzar-pi.sh: sintaxis Bash válida (5.296417ms)
✔ lanzar-pi.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (51.495917ms)
✔ Claude Code y Pi reciben exactamente la misma definición compartida del prompt (0.167084ms)
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (4.1115ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (1.771292ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (173.182417ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (16.477625ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (12.340834ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (7.943833ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (6.6015ms)
ℹ tests 121
ℹ suites 0
ℹ pass 121
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 13871.26525
rapida: 16 archivos en 14 s (tope 30 s)
```
Código de salida de `bash pruebas/rapida.sh`: `0`.

3. `git status --short pruebas/comprobaciones`:
```
 M pruebas/comprobaciones/contrato-constructor.mjs
 M pruebas/comprobaciones/contrato-constructor.test.mjs
```

4. Mensaje de la regla 8 con la línea BLOQUEO quitada del texto de la skill (comprobación de que el mensaje no cambió):
```
[
  'Regla 8 (skills/ejecutar-tarea/SKILL.md): falta la línea «BLOQUEO: rol=<rol requerido>; motivo=<motivo>».'
]
```

Criterios de aceptación:
1. Los textos reales cumplen todas las reglas: `los textos reales…` pasa, `fail 0`. Cumplido.
2. Borrar frases de las reglas 10, 11 y 12 da error: las variantes «regla 10», «regla 11» y «regla 12» pasan (exigen ≥1 error). Cumplido.
3. Rama después de «en curso» da error de la regla 11: «rechaza la regla 11 si la rama se resuelve después del paso a «en curso»» pasa. Cumplido.
4. Mensaje de la regla 8 sin cambios: la variante de la regla 8 pasa y el mensaje mostrado arriba es el original. Cumplido.
5. Verificación rápida: `rapida: 16 archivos en 14 s (tope 30 s)`, código 0. Cumplido.

## Notas
- Hueco menor: el campo `mensajeRegex` solo se usa en la regla 12. Si falta, se mantiene el mensaje de BLOQUEO, así la regla 8 no cambia.
- Hueco menor: `despuesDe` de la regla 11 es `['git switch -c', 'Cambia `estado` a `en curso`']`, en ese orden, con el mismo sentido que la regla 5 (la segunda frase debe ir después de la primera).
- Observación: en la skill «git branch --show-current» aparece dos veces (pasos (a) y la confirmación). La variante de la regla 11 borra solo la primera aparición, pero la variante también borra «Rama:» y «Franco confirmó…», así que la regla sigue dando error. No cambié nada por esto.
- No se tocó git (sin `Rama:` en el encargo), `agentes/`, `skills/` ni `STATUS.md`.
