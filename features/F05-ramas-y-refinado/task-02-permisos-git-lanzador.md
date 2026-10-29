# task-02 — Permisos git del constructor en el lanzador de Claude Code
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`definitions/WORKFLOW.md` §9.1 fija los únicos permisos git del constructor: `git switch -c *`, `git switch *` y `git branch --show-current`, con `commit`, `push`, `merge`, `reset`, `rebase` y `checkout` denegados. La única lista de permisos del constructor en el repo es la del lanzador de pruebas. Esta tarea la alinea y deja su prueba comprobándolo, con un control negativo.

## Contexto
- Repo: este, único repo. Leídos: `pruebas/lanzar-constructor-claude.sh` (`--allowedTools` con `'Read(./**)' 'Write(./**)' 'Edit(./**)' 'Skill'` y `'Bash(cat *)' 'Bash(ls *)' 'Bash(echo *)' 'Bash(printf *)' 'Bash(bash verificar.sh)' 'Bash(git status --short)'`; `--disallowedTools` con `.env`) y `pruebas/lanzar-constructor.test.mjs` (5 pruebas con binario simulado; la tercera lista los argumentos esperados; las dos últimas comprueban que no hay `Bash(git commit`, `Bash(git push`, `Bash(*)`, `Bash(bash *)` ni `Bash(sh *)`).
- Ejecutado por el planificador: `node --test pruebas/lanzar-constructor.test.mjs` pasa hoy con 5 pruebas y `fail 0`.
- Archivos a tocar: `pruebas/lanzar-constructor-claude.sh` y `pruebas/lanzar-constructor.test.mjs`.
- `pruebas/rapida.sh` incluye `pruebas/*.test.mjs` por glob.

## Decisiones ya tomadas
- Entradas nuevas en `--allowedTools`, exactamente tres: `'Bash(git switch -c *)'`, `'Bash(git switch *)'`, `'Bash(git branch --show-current)'`.
- Entradas nuevas en `--disallowedTools`, exactamente seis: `'Bash(git commit *)'`, `'Bash(git push *)'`, `'Bash(git merge *)'`, `'Bash(git reset *)'`, `'Bash(git rebase *)'`, `'Bash(git checkout *)'`. En Claude Code una denegación gana sobre una autorización.
- Hay que ajustar las dos pruebas existentes que hoy afirman `output.includes('Bash(git commit') === false`: ahora `Bash(git commit *)` aparece como denegación. Se cambian para comprobar que la línea no está en las **autorizadas**: el registro del binario simulado imprime una línea por argumento, así que la prueba localiza el argumento `--allowedTools` y `--disallowedTools` y examina solo las líneas entre uno y otro (autorizadas: las que siguen a `--allowedTools` hasta `--disallowedTools`).
- Control negativo: una prueba que construye una lista autorizada alterada (copia de la real con `Bash(git commit *)` añadida) y comprueba que la misma función de ayuda de la prueba la rechaza.
- No se toca `agentes/` ni `skills/`.

## Alcance / Fuera de alcance
Alcance: las nueve entradas (tres autorizadas, seis denegadas) y las pruebas.
Fuera de alcance: lanzador de Pi, `pruebas/permisos-ejecucion.md`, correr el modelo, comandos git de lectura adicionales, `Bash(git branch *)`, agregar `git add`, tocar `modelos.json`.

## Pasos
1. En `pruebas/lanzar-constructor-claude.sh`, añadir las tres entradas autorizadas y las seis denegadas. Resultado: `bash -n pruebas/lanzar-constructor-claude.sh` sale 0.
2. En `pruebas/lanzar-constructor.test.mjs`, añadir una función de ayuda `partes(output)` que devuelve `{ autorizadas, denegadas }` según los argumentos `--allowedTools` y `--disallowedTools` del registro, y reescribir las dos pruebas existentes de git mutante para usar `autorizadas`. Resultado: siguen pasando.
3. Añadir la prueba «permite solo los tres comandos git de rama y deniega los mutantes»: las autorizadas contienen exactamente las tres entradas nuevas entre las que empiezan por `Bash(git`, más `Bash(git status --short)`; las denegadas contienen las seis.
4. Añadir la prueba de control negativo descrita arriba. Resultado: `node --test pruebas/lanzar-constructor.test.mjs` con `fail 0`.
5. Correr la *Verificación*.

## Criterios de aceptación
1. El lanzador autoriza `git switch -c *`, `git switch *` y `git branch --show-current` y deniega las seis acciones mutantes. Se comprueba con la primera orden de *Verificación*.
2. Ninguna acción mutante figura entre las autorizadas. Se comprueba con la prueba nueva y su control negativo.
3. Sigue sin haber `Bash(*)`, `Bash(bash *)` ni `Bash(sh *)`, y `.env` sigue denegado. Se comprueba con las pruebas existentes.
4. La verificación rápida pasa. Se comprueba con la segunda orden de *Verificación*.

## Verificación
```
bash -n pruebas/lanzar-constructor-claude.sh
node --test pruebas/lanzar-constructor.test.mjs
bash pruebas/rapida.sh
git status --short pruebas
```
Esperado: la primera sin salida y código 0; la segunda con `fail 0`; la tercera termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la cuarta muestra entre sus cambios `pruebas/lanzar-constructor-claude.sh` y `pruebas/lanzar-constructor.test.mjs`.

## Evidencia

Comandos ejecutados en `/Users/franco/Codes/flucastr/Flucastr.AI` tras los cambios (salida real).

```
$ bash -n pruebas/lanzar-constructor-claude.sh
exit=0

$ node --test pruebas/lanzar-constructor.test.mjs
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (3.586583ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (2.058541ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (205.466292ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (12.891416ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (48.826ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (118.234625ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (31.515834ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 494.807583
exit=0

$ bash pruebas/rapida.sh
Entorno conservado: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/capa1-l2vpgJ
✔ I1: comprobación real (82.901875ms)
✔ I2: comprobación real (1570.8975ms)
✔ I3: comprobación real (1003.5895ms)
✔ I4: comprobación real (2926.392459ms)
✔ I5: comprobación real (1132.201083ms)
✔ I6: comprobación real (62.653125ms)
✔ I7: comprobación real (1054.301ms)
✔ I1: control negativo rechaza salida falsa (3.347458ms)
✔ I2: control negativo rechaza salida falsa (0.355625ms)
✔ I3: control negativo rechaza salida falsa (0.499459ms)
✔ I4: control negativo rechaza salida falsa (6.339917ms)
✔ I5: control negativo rechaza salida falsa (2.423458ms)
✔ I6: control negativo rechaza salida falsa (0.214959ms)
✔ I7: control negativo rechaza salida falsa (0.335959ms)
✔ preflight exige contrato actual del agente instalado Claude y Pi (108.089084ms)
✔ muestra válida: no hay errores (0.989458ms)
✔ regla 1: ID de carpeta ausente del backlog se rechaza (0.601ms)
✔ regla 2: número de tarea repetido se rechaza (0.111958ms)
✔ regla 2: hueco en la numeración se rechaza (0.073209ms)
✔ regla 2: primera línea con número distinto al del archivo se rechaza (0.073667ms)
✔ regla 3: dependencia hacia una tarea de número mayor se rechaza (0.089625ms)
✔ regla 4: feature hecha con una tarea sin hacer se rechaza (0.060375ms)
✔ regla 5: tarea bloqueada en una feature hecha se rechaza (0.063958ms)
✔ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes (6.458375ms)
✔ extraerRespuesta devuelve el result del evento result e ignora líneas no JSON (0.554375ms)
✔ evaluarCaso rechaza un caso desconocido sin lanzar (0.152584ms)
✔ un resultado correcto simulado del caso feliz da [] (201.462458ms)
✔ un resultado correcto simulado del caso no-aprobada da [] (149.456583ms)
✔ un resultado correcto simulado del caso escalacion da [] (142.739291ms)
✔ un resultado correcto simulado del caso bloqueada da [] (150.957292ms)
✔ se rechaza una variante incorrecta: feliz con estado hecha (143.556417ms)
✔ se rechaza una variante incorrecta: no-aprobada con no-debe-existir.txt creado (144.456083ms)
✔ se rechaza una variante incorrecta: escalacion con datos.json cambiado (153.438666ms)
✔ se rechaza una variante incorrecta: bloqueada sin línea BLOQUEO (142.423667ms)
✔ los textos reales del constructor y de ejecutar-tarea cumplen las nueve reglas (0.73525ms)
✔ rechaza regla 1: falta «estado: aprobada» o «te detienes» en el constructor (0.433083ms)
✔ rechaza regla 2: falta «Nunca escribes `hecha`» en el constructor (0.105833ms)
✔ rechaza regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor (0.086125ms)
✔ rechaza regla 4: falta «escribes en `STATUS.md`» en el constructor (0.093833ms)
✔ rechaza regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill (0.091584ms)
✔ rechaza regla 6: falta una de las tres causas de parada en la skill (0.078375ms)
✔ rechaza regla 7: falta «estado: bloqueada» en la skill (0.074875ms)
✔ rechaza regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill (0.098583ms)
✔ rechaza regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill (0.113125ms)
✔ muestra válida mínima no tiene errores (1.235667ms)
✔ rechaza regla 1: name no coincide con la clave del agente (0.147041ms)
✔ rechaza regla 2: modelos.json no declara al constructor (0.077ms)
✔ rechaza regla 3: el coordinador no delega en el constructor (0.074041ms)
✔ rechaza regla 4: una skill no aparece en ningún agente (0.09ms)
✔ rechaza regla 5: el planificador no tiene la línea de bloqueo (0.075ms)
✔ rechaza regla 6: el constructor no dice que no escribe en STATUS.md (0.059541ms)
✔ rechaza regla 7: la tabla del coordinador pierde el estado bloqueada (0.073375ms)
✔ rechaza regla 8: descomponer-feature prohíbe tocar BACKLOG.md (0.075834ms)
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (0.9505ms)
✔ controles negativos B/M/R rechazan un fixture sin entregables (7.806417ms)
✔ las cuatro tareas cumplen la plantilla y tienen los estados esperados (130.356458ms)
✔ el repo del fixture queda limpio, con 3 commits y datos.json correcto (147.210334ms)
✔ muestras válidas: backlog y status no tienen errores (1.325542ms)
✔ backlog con todas las features hechas y sin → es válido (0.125625ms)
✔ backlog: encabezado alterado se rechaza (0.085625ms)
✔ backlog: siete features se rechazan (0.078667ms)
✔ backlog: Estado inválido se rechaza (0.0705ms)
✔ backlog: dos → se rechazan (0.0555ms)
✔ backlog: → en una fila que no es la primera pendiente se rechaza (0.052875ms)
✔ backlog: falta «Estado del documento» se rechaza (0.054209ms)
✔ status: falta una sección se rechaza (0.093166ms)
✔ status: orden de secciones cambiado se rechaza (0.111375ms)
✔ status: fecha inválida se rechaza (0.056667ms)
✔ definitions/BACKLOG.md real cumple el formato (0.135708ms)
✔ definitions/STATUS.md real cumple el formato (0.233875ms)
✔ la muestra válida no produce errores (0.901708ms)
✔ rechaza una tarea con violación de regla 1: primera línea mal formada (0.212083ms)
✔ rechaza una tarea con violación de regla 2: estado inválido (0.060584ms)
✔ rechaza una tarea con violación de regla 2: depende_de inválido (0.083416ms)
✔ rechaza una tarea con violación de regla 3: falta una sección (0.063541ms)
✔ rechaza una tarea con violación de regla 4: sección obligatoria sin cuerpo (0.052417ms)
✔ rechaza una tarea con violación de regla 5: sin «Fuera de alcance:» (0.047541ms)
✔ rechaza una tarea con violación de regla 6: nueve pasos (0.064208ms)
✔ rechaza una tarea con violación de regla 7: seis criterios (0.073708ms)
✔ rechaza una tarea con violación de regla 8: marcador de pendiente (0.085917ms)
✔ exige Evidencia no vacía con estado «lista para revisión» (0.379167ms)
✔ las tareas reales de features/ cumplen el formato (1.905792ms)
✔ cada ID de depende_de de una tarea real corresponde a un archivo de su carpeta (1.287667ms)
✔ muestra válida: no hay errores (0.828833ms)
✔ variante: falta un agente en el README (0.11775ms)
✔ variante: falta una skill en el README (0.389083ms)
✔ variante: sobra un agente en el README (0.071ms)
✔ variante: sobra una skill en el README (0.065833ms)
✔ variante: README sin sección «## Estructura» (0.054208ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.514416ms)
✔ ejecutar.sh analiza el registro claude-code antes de comprobar el escenario (438.801ms)
✔ ejecutar.sh analiza el registro pi antes de comprobar el escenario (375.257583ms)
✔ fallo del comando imprime resumen, devuelve error y no lanza corrida siguiente (322.848375ms)
✔ fallo duro del registro imprime resumen, devuelve error y detiene la serie (344.800209ms)
✔ fallo duro del escenario imprime resumen, devuelve error y detiene la serie (377.840583ms)
✔ cada corrida con modelo exige su propio registro estructurado (317.064208ms)
✔ Claude: detecta Read de .env y cat, grep o head contra .env en Bash (0.78625ms)
✔ Pi: detecta Read y Bash cat, grep o head de .env (0.140541ms)
✔ distingue validación bash -n de ejecución efectiva de initialize.sh (0.271375ms)
✔ detecta canario en eventos estructurados y asocia permisos denegados con su llamada (0.179916ms)
✔ Pi: detecta el canario devuelto por la herramienta (0.077625ms)
✔ B: ejecutar.sh genera fixture e instantánea y resume correctamente (320.678583ms)
✔ M: ejecutar.sh genera fixture e instantánea y resume correctamente (514.173667ms)
✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente (528.757625ms)
✔ devuelve código distinto de cero ante fallo del comando y resume el fallo (313.294875ms)
✔ lanzar-claude.sh: sintaxis Bash válida (2.957792ms)
✔ lanzar-claude.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (281.946125ms)
✔ lanzar-pi.sh: sintaxis Bash válida (4.799084ms)
✔ lanzar-pi.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (42.375458ms)
✔ Claude Code y Pi reciben exactamente la misma definición compartida del prompt (0.156166ms)
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (3.216959ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (2.860583ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (164.800958ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (18.070584ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (10.025833ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (8.023375ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (6.557917ms)
ℹ tests 117
ℹ suites 0
ℹ pass 117
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14578.999792
rapida: 16 archivos en 15 s (tope 30 s)
exit=0

$ git status --short pruebas
 M pruebas/lanzar-constructor-claude.sh
 M pruebas/lanzar-constructor.test.mjs
exit=0
```

Criterios de aceptación:
1. Autorizadas `git switch -c *`, `git switch *` y `git branch --show-current`; denegadas las seis mutantes. Lo comprueba la prueba «permite solo los tres comandos git de rama…» (pasa) y la lista de `git status --short pruebas` confirma que solo cambiaron los dos archivos de alcance.
2. Ninguna mutante autorizada: prueba «ningún permiso concede Git mutante…» y control negativo «rechaza una lista autorizada con git commit» (ambas pasan).
3. Sin `Bash(*)`, `Bash(bash *)` ni `Bash(sh *)`, y `.env` denegado: pruebas existentes «.env sigue denegado…» y «ningún permiso concede…» (pasan).
4. Verificación rápida: `rapida: 16 archivos en 15 s (tope 30 s)`, exit=0.

## Notas

- Sin línea `Rama:` en el encargo: no se ejecutó ningún comando git de rama; no se tocó git.
- Hueco menor: la prueba `partes(output)` limita las denegadas entre `--disallowedTools` y el `--` previo al prompt, para no mezclar el prompt con los permisos. Decisión conservadora, anotada aquí.
- Hueco menor: la prueba del control negativo construye la lista alterada copiando la lista real y añadiendo `Bash(git commit *)`, y comprueba que la misma función `mutantesAutorizados` la rechaza.
- `pruebas/rapida.sh` deja un entorno en `pruebas/.temporales/` («Entorno conservado») y no aparece en `git status --short pruebas`; no es cambio de esta tarea.
- No se tocó `agentes/`, `skills/`, `definitions/STATUS.md` ni la tarea más allá de *Evidencia*, *Notas* y `estado`.
