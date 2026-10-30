# task-02 — Comprobación determinista: los agentes instalados usan el modelo de `modelos.json`
repo: Flucastr.AI   depende_de: task-01   estado: lista para revisión

## Descripción
Hoy la Capa 1 solo comprueba que el modelo resuelto «pertenece» a `modelos.json`, no que cada agente instalado (Claude Code y Pi) lleve el modelo que `modelos.json` le asigna ni que el lanzador de Pi lo resuelva al arrancar. Esta tarea añade una comprobación sin modelo ni red que compara, agente por agente, lo instalado contra lo que resuelve `scripts/resolver.mjs`, y que detecta una instalación desactualizada tras editar `modelos.json`.

## Contexto
- Repo único. Node ESM, `node:test`, sin dependencias. Leídos: `scripts/resolver.mjs` (`node scripts/resolver.mjs modelo <agente> <claude-code|pi>` imprime el modelo; los archivos generados añaden la línea `model: <modelo>` en el encabezado), `instalar.sh` (Claude: `$HOME/.claude/agents/<n>.md`, solo si existe `$HOME/.claude`; Pi: `$PI_CODING_AGENT_DIR/agents/<n>.md` y lanzador `$HOME/.local/bin/pi-<n>`, solo si existe `$PI_CODING_AGENT_DIR`; el lanzador contiene `resolver.mjs" modelo <n> pi` y se resuelve en cada arranque), `modelos.json` (agentes: arquitecto, planificador, coordinador en medio; constructor en bajo), `pruebas/capa1/instalacion.test.mjs` (patrón de entorno aislado con `HOME` y `PI_CODING_AGENT_DIR` temporales).
- Archivos a crear: `pruebas/comprobaciones/modelos-agentes.mjs` y `pruebas/comprobaciones/modelos-agentes.test.mjs`. `pruebas/rapida.sh` recoge todo `pruebas/comprobaciones/*.test.mjs` sin cambios.
- Comando: `node --test pruebas/comprobaciones/modelos-agentes.test.mjs`.

## Decisiones ya tomadas
- `modelos-agentes.mjs` exporta `comprobarModelos({ raiz, claudeDir, piDir, binDir })` que devuelve un arreglo de mensajes de error en español (vacío = todo bien). `raiz` es la carpeta con `agentes/`, `modelos.json` y `scripts/resolver.mjs`.
- Para cada `raiz/agentes/*.md` y cada herramienta cuyo directorio exista: el archivo instalado debe existir, tener exactamente una línea `model: X` en el encabezado y `X` debe ser igual a la salida de `node <raiz>/scripts/resolver.mjs modelo <agente> <herramienta>`. Para Pi, además `binDir/pi-<agente>` debe existir y contener `resolver.mjs" modelo <agente> pi` (garantiza que `pi --model` se resuelve de `modelos.json` en cada arranque).
- Mensaje de error: `<herramienta>/<agente>: instalado «X», modelos.json pide «Y»; reinstala con bash instalar.sh`.
- Ejecutado como script (`node pruebas/comprobaciones/modelos-agentes.mjs`) usa por defecto `raiz` = este repo, `claudeDir` = `$CLAUDE_CONFIG_DIR` o `~/.claude`, `piDir` = `$PI_CODING_AGENT_DIR` o `~/.pi/agent`, `binDir` = `~/.local/bin`; imprime los errores y sale con 1, o imprime `modelos de agentes instalados vigentes` y sale con 0. Solo lee archivos de agentes; no toca credenciales.
- La prueba usa carpetas temporales (`fs.mkdtempSync` en `os.tmpdir()`), copia `instalar.sh`, `desinstalar.sh`, `scripts`, `agentes`, `skills` y `modelos.json` a un repo temporal, crea `home/.claude` y `home/pi`, e instala con `bash instalar.sh` usando `HOME` y `PI_CODING_AGENT_DIR` de ese entorno. Nunca toca `~/.claude`, `~/.pi` ni `~/.flucastr-ai`.

## Alcance / Fuera de alcance
Alcance: la función, el modo script y las pruebas descritas.
Fuera de alcance: cambiar `instalar.sh` o `resolver.mjs`; registros de corridas con modelo (task-03 a task-05); editar `modelos.json`; el nivel real de cada agente.

## Pasos
1. Crear `modelos-agentes.mjs` con `comprobarModelos` y el modo script. Resultado: `node -e "import('./pruebas/comprobaciones/modelos-agentes.mjs')"` termina sin error.
2. Crear el test con tres casos: (a) tras `instalar.sh` en el entorno temporal, `comprobarModelos` devuelve `[]`; (b) tras copiar a la instalación temporal un `modelos.json` cambiado (constructor en `alto`) sin reinstalar, devuelve al menos un error que menciona `constructor`; (c) tras borrar `pi-constructor` de `binDir`, devuelve un error que menciona `pi-constructor`.
3. Correr la *Verificación*.

## Criterios de aceptación
1. Instalación recién hecha en entorno aislado: `[]`. Prueba (a).
2. `modelos.json` cambiado sin reinstalar: error que nombra al agente. Prueba (b). Nota: el cambio se aplica al `modelos.json` del repo temporal que usa el resolver, no a los archivos instalados.
3. Lanzador de Pi ausente: error que nombra al lanzador. Prueba (c).
4. El modo script sobre la instalación real sale con 0 o con 1 y mensajes legibles (no se exige 0: depende de que Franco haya reinstalado). Se comprueba ejecutándolo.
5. `bash pruebas/rapida.sh` sigue verde dentro del tope de 30 s.

## Verificación
```
node --test pruebas/comprobaciones/modelos-agentes.test.mjs
node pruebas/comprobaciones/modelos-agentes.mjs; echo "salida=$?"
bash pruebas/rapida.sh
```
Esperado: la primera con `fail 0`; la segunda imprime `modelos de agentes instalados vigentes` (salida=0) o líneas de error que terminan en `reinstala con bash instalar.sh` (salida=1); la tercera termina con `rapida: N archivos en S s (tope 30 s)` y código 0. Ejecutadas en la planificación: ninguna de las tres (los archivos aún no existen); `node scripts/resolver.mjs modelo constructor claude-code` y la lectura de `~/.claude/agents/constructor.md` (`model: claude-haiku-5-5`) sí se leyeron.

## Evidencia

Corrida de reintento. Rama actual: `feature/F07-modelo-por-agente` (coincide con el encargo, sin `git switch`). Los archivos `pruebas/comprobaciones/modelos-agentes.mjs` y `pruebas/comprobaciones/modelos-agentes.test.mjs` ya existían de la corrida anterior; los revisé contra la tarea y los verifiqué sin cambiarlos.

1. `node --test pruebas/comprobaciones/modelos-agentes.test.mjs; echo "salida=$?"`
```
✔ (a) tras instalar.sh en entorno aislado no hay errores (1488.252042ms)
✔ (b) modelos.json cambiado sin reinstalar: error que nombra al constructor (1366.516042ms)
✔ (c) lanzador pi-constructor ausente: error que nombra al lanzador (1260.213458ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4195.161667
salida=0
```

2. `node pruebas/comprobaciones/modelos-agentes.mjs; echo "salida=$?"` (instalación real de esta máquina) y el import de la verificación de paso 1:
```
modelos de agentes instalados vigentes
salida=0
import ok
salida_import=0
```

3. `bash pruebas/rapida.sh; echo "salida=$?"` (salida completa):
```
Entorno conservado: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/capa1-gyRMg9
✔ I1: comprobación real (66.259208ms)
✔ I2: comprobación real (1247.88ms)
✔ I3: comprobación real (1175.875875ms)
✔ I4: comprobación real (3465.049541ms)
✔ I5: comprobación real (1309.059042ms)
✔ I6: comprobación real (65.63ms)
✔ I7: comprobación real (1080.039333ms)
✔ I1: control negativo rechaza salida falsa (1.387292ms)
✔ I2: control negativo rechaza salida falsa (0.250791ms)
✔ I3: control negativo rechaza salida falsa (0.574875ms)
✔ I4: control negativo rechaza salida falsa (0.221208ms)
✔ I5: control negativo rechaza salida falsa (0.140708ms)
✔ I6: control negativo rechaza salida falsa (0.147875ms)
✔ I7: control negativo rechaza salida falsa (0.168583ms)
✔ preflight exige contrato actual del agente instalado Claude y Pi (121.529166ms)
✔ muestra válida: no hay errores (1.129834ms)
✔ regla 1: ID de carpeta ausente del backlog se rechaza (0.483083ms)
✔ regla 2: número de tarea repetido se rechaza (0.145959ms)
✔ regla 2: hueco en la numeración se rechaza (0.091ms)
✔ regla 2: primera línea con número distinto al del archivo se rechaza (0.08725ms)
✔ regla 3: dependencia hacia una tarea de número mayor se rechaza (0.077042ms)
✔ regla 4: feature hecha con una tarea sin hacer se rechaza (0.068292ms)
✔ regla 5: tarea bloqueada en una feature hecha se rechaza (0.072208ms)
✔ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes (11.663584ms)
✔ extraerRespuesta devuelve el result del evento result e ignora líneas no JSON (0.547292ms)
✔ evaluarCaso rechaza un caso desconocido sin lanzar (0.213916ms)
✔ un resultado correcto simulado del caso feliz da [] (185.947208ms)
✔ un resultado correcto simulado del caso no-aprobada da [] (169.263542ms)
✔ un resultado correcto simulado del caso escalacion da [] (168.350334ms)
✔ un resultado correcto simulado del caso bloqueada da [] (171.309417ms)
✔ un resultado correcto simulado del caso confirmar da [] (169.159541ms)
✔ un resultado correcto simulado del caso yolo da [] (182.013542ms)
✔ se rechaza una variante incorrecta: feliz con estado hecha (178.781917ms)
✔ se rechaza una variante incorrecta: no-aprobada con no-debe-existir.txt creado (168.896875ms)
✔ se rechaza una variante incorrecta: escalacion con datos.json cambiado (180.008541ms)
✔ se rechaza una variante incorrecta: bloqueada sin línea BLOQUEO (170.451542ms)
✔ se rechaza una variante incorrecta: confirmar sin línea CONFIRMAR (173.541209ms)
✔ se rechaza una variante incorrecta: confirmar respondido con BLOQUEO (181.919792ms)
✔ se rechaza una variante incorrecta: confirmar con la tarea en curso (169.512959ms)
✔ se rechaza una variante incorrecta: yolo respondido con CONFIRMAR (167.96525ms)
✔ se rechaza una variante incorrecta: yolo con estado hecha (217.565875ms)
✔ se rechaza yolo si la rama cambia durante la corrida (186.686667ms)
✔ confirmar da error si la rama cambia durante la corrida (188.734167ms)
✔ los textos reales del constructor y de ejecutar-tarea cumplen todas las reglas (1.205042ms)
✔ rechaza regla 1: falta «estado: aprobada» o «te detienes» en el constructor (0.192333ms)
✔ rechaza regla 2: falta «Nunca escribes `hecha`» en el constructor (0.122666ms)
✔ rechaza regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor (0.102458ms)
✔ rechaza regla 4: falta «escribes en `STATUS.md`» en el constructor (0.108334ms)
✔ rechaza regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill (0.120042ms)
✔ rechaza regla 6: falta una de las tres causas de parada en la skill (0.1045ms)
✔ rechaza regla 7: falta «estado: bloqueada» en la skill (0.096208ms)
✔ rechaza regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill (0.110708ms)
✔ rechaza regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill (0.130416ms)
✔ rechaza regla 10: falta «git switch -c», «git branch --show-current» o la prohibición de `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout` en el constructor (0.098875ms)
✔ rechaza regla 11: falta «git switch -c», «git branch --show-current», «Rama:», «Franco confirmó `git switch <rama>`» o «Cambia `estado` a `en curso`» en la skill (0.390875ms)
✔ rechaza regla 12: falta la línea «CONFIRMAR: accion=git switch <rama>; motivo=<motivo>» en la skill (0.093625ms)
✔ rechaza regla 13: falta «Modo yolo: activo», «no creas rama», «no emites `CONFIRMAR:`» o «ni local» en el constructor (0.082417ms)
✔ rechaza regla 14: falta «Modo yolo: activo», «salta este paso entero», «no emites `CONFIRMAR:`» o «ni local» en la skill (0.083083ms)
✔ rechaza la regla 11 si la rama se resuelve después del paso a «en curso» (0.118541ms)
✔ rechaza la regla 14 si «Modo yolo: activo» aparece después de «git switch -c» en la skill (0.103583ms)
✔ muestra válida mínima no tiene errores (1.253958ms)
✔ rechaza regla 1: name no coincide con la clave del agente (0.18475ms)
✔ rechaza regla 2: modelos.json no declara al constructor (0.104791ms)
✔ rechaza regla 3: el coordinador no delega en el constructor (0.091416ms)
✔ rechaza regla 4: una skill no aparece en ningún agente (0.114583ms)
✔ rechaza regla 5: el planificador no tiene la línea de bloqueo (0.088292ms)
✔ rechaza regla 6: el constructor no dice que no escribe en STATUS.md (0.078916ms)
✔ rechaza regla 7: la tabla del coordinador pierde el estado bloqueada (0.37275ms)
✔ rechaza regla 8: descomponer-feature prohíbe tocar BACKLOG.md (0.089709ms)
✔ rechaza regla 9: el coordinador pierde la frase CONFIRMAR (0.133042ms)
✔ rechaza regla 10: el coordinador pierde la frase de cierre de la rama (0.081583ms)
✔ rechaza regla 11: el coordinador pierde la frase REFINAR (0.064792ms)
✔ rechaza regla 12: el coordinador pierde la línea de registro del modo yolo (0.069042ms)
✔ rechaza regla 12: el coordinador pierde la advertencia de rama main (0.063291ms)
✔ rechaza regla 12: el coordinador pierde el estado detenido (0.060667ms)
✔ rechaza regla 12: el coordinador pierde el estado terminado (0.053ms)
✔ rechaza regla 12: el planificador pierde la frase del modo yolo (0.061375ms)
✔ rechaza regla 12: descomponer-feature pierde la frase del modo yolo (0.049208ms)
✔ rechaza regla 11: el planificador pierde REFINAR y el error nombra al planificador (0.054958ms)
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (0.770375ms)
✔ controles negativos B/M/R rechazan un fixture sin entregables (9.193625ms)
✔ las cuatro tareas cumplen la plantilla y tienen los estados esperados (147.695208ms)
✔ el repo del fixture queda limpio, con 3 commits y datos.json correcto (155.544458ms)
✔ muestras válidas: backlog y status no tienen errores (1.342167ms)
✔ backlog con todas las features hechas y sin → es válido (0.144666ms)
✔ backlog: encabezado alterado se rechaza (0.098084ms)
✔ backlog: siete features pendientes se rechazan (0.092833ms)
✔ backlog: seis hechas y seis pendientes es válido (las hechas no cuentan) (0.1215ms)
✔ backlog: seis hechas y siete pendientes se rechazan (0.090542ms)
✔ backlog: tabla sin filas de datos se rechaza (0.071625ms)
✔ backlog: Estado inválido se rechaza (0.067ms)
✔ backlog: dos → se rechazan (0.057083ms)
✔ backlog: → en una fila que no es la primera pendiente se rechaza (0.097917ms)
✔ backlog: falta «Estado del documento» se rechaza (0.0605ms)
✔ status: falta una sección se rechaza (0.089042ms)
✔ status: orden de secciones cambiado se rechaza (0.053375ms)
✔ status: fecha inválida se rechaza (0.045042ms)
✔ definitions/BACKLOG.md real cumple el formato (0.160458ms)
✔ definitions/STATUS.md real cumple el formato (0.602875ms)
✔ la muestra válida no produce errores (1.070667ms)
✔ rechaza una tarea con violación de regla 1: primera línea mal formada (0.290542ms)
✔ rechaza una tarea con violación de regla 2: estado inválido (0.096833ms)
✔ rechaza una tarea con violación de regla 2: depende_de inválido (0.106458ms)
✔ rechaza una tarea con violación de regla 3: falta una sección (0.077792ms)
✔ rechaza una tarea con violación de regla 4: sección obligatoria sin cuerpo (0.059791ms)
✔ rechaza una tarea con violación de regla 5: sin «Fuera de alcance:» (0.0565ms)
✔ rechaza una tarea con violación de regla 6: nueve pasos (0.081542ms)
✔ rechaza una tarea con violación de regla 7: seis criterios (0.0795ms)
✔ rechaza una tarea con violación de regla 8: marcador de pendiente (0.40125ms)
✔ exige Evidencia no vacía con estado «lista para revisión» (0.089791ms)
✔ las tareas reales de features/ cumplen el formato (3.513417ms)
✔ cada ID de depende_de de una tarea real corresponde a un archivo de su carpeta (2.255834ms)
✔ (a) tras instalar.sh en entorno aislado no hay errores (1275.506792ms)
✔ (b) modelos.json cambiado sin reinstalar: error que nombra al constructor (1278.561333ms)
✔ (c) lanzador pi-constructor ausente: error que nombra al lanzador (1403.300459ms)
✔ muestra válida: no hay errores (0.776542ms)
✔ variante: falta un agente en el README (0.104917ms)
✔ variante: falta una skill en el README (0.3775ms)
✔ variante: sobra un agente en el README (0.074708ms)
✔ variante: sobra una skill en el README (0.068625ms)
✔ variante: README sin sección «## Estructura» (0.056375ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.470791ms)
✔ ejecutar.sh analiza el registro claude-code antes de comprobar el escenario (426.742792ms)
✔ ejecutar.sh analiza el registro pi antes de comprobar el escenario (422.484125ms)
✔ fallo del comando imprime resumen, devuelve error y no lanza corrida siguiente (352.203292ms)
✔ fallo duro del registro imprime resumen, devuelve error y detiene la serie (401.775958ms)
✔ fallo duro del escenario imprime resumen, devuelve error y detiene la serie (434.248292ms)
✔ cada corrida con modelo exige su propio registro estructurado (345.800833ms)
✔ Claude: detecta Read de .env y cat, grep o head contra .env en Bash (0.890375ms)
✔ Pi: detecta Read y Bash cat, grep o head de .env (0.161667ms)
✔ distingue validación bash -n de ejecución efectiva de initialize.sh (0.316458ms)
✔ detecta canario en eventos estructurados y asocia permisos denegados con su llamada (0.166791ms)
✔ Pi: detecta el canario devuelto por la herramienta (0.08375ms)
✔ B: ejecutar.sh genera fixture e instantánea y resume correctamente (357.222417ms)
✔ M: ejecutar.sh genera fixture e instantánea y resume correctamente (562.820959ms)
✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente (362.635834ms)
✔ devuelve código distinto de cero ante fallo del comando y resume el fallo (365.629ms)
✔ lanzar-claude.sh: sintaxis Bash válida (4.742583ms)
✔ lanzar-claude.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (519.552042ms)
✔ lanzar-pi.sh: sintaxis Bash válida (4.422875ms)
✔ lanzar-pi.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (48.668417ms)
✔ Claude Code y Pi reciben exactamente la misma definición compartida del prompt (0.160583ms)
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (3.643ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (2.179125ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (221.144708ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (14.677417ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (10.725917ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (8.81225ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (7.720292ms)
ℹ tests 149
ℹ suites 0
ℹ pass 149
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 21647.003625
rapida: 17 archivos en 22 s (tope 30 s)
salida=0
```

Criterios de aceptación:
1. Instalación recién hecha en entorno aislado: `[]`. Prueba (a) pasa. Cumple.
2. `modelos.json` cambiado sin reinstalar: error que nombra a `constructor`. Prueba (b) pasa. Cumple.
3. Lanzador de Pi ausente: error que nombra a `pi-constructor`. Prueba (c) pasa. Cumple.
4. Modo script sobre la instalación real: sale con 0 y muestra `modelos de agentes instalados vigentes`. Cumple.
5. `bash pruebas/rapida.sh` verde dentro del tope de 30 s: 149 pruebas pasan, `rapida: 17 archivos en 22 s (tope 30 s)`, salida=0. Cumple.

## Notas

- Corrida de reintento. Revisé `modelos-agentes.mjs` y su test contra *Descripción*, *Decisiones ya tomadas* y *Criterios de aceptación*: el código ya cumple, así que no lo modifiqué.
- El fallo de la corrida anterior (`definitions/BACKLOG.md real cumple el formato`, por una edición sin confirmar de `definitions/BACKLOG.md`) ya no aparece: en esta corrida `git status` no lista `definitions/BACKLOG.md`, y la prueba pasa. Por eso la tarea no queda bloqueada.
- Huecos menores resueltos (decisiones de la corrida anterior, que siguen vigentes):
  - Nombres de herramienta en los mensajes: `claude-code` y `pi`, los mismos que usa `resolver.mjs`.
  - El modo script imprime los errores con `console.log` (stdout), para que `echo "salida=$?"` y la salida se vean juntos.
  - La prueba usa `fs.mkdtempSync` en `os.tmpdir()` y borra su carpeta al terminar con `after()`.
  - El encabezado se lee entre las dos líneas `---`; cuenta solo las líneas que empiezan con `model:`.
- Efecto colateral de la suite completa, no de esta tarea: la prueba `capa1` deja `pruebas/.temporales/capa1-gyRMg9` («Entorno conservado»). Es comportamiento existente de `pruebas/capa1/instalacion.test.mjs`; no lo cambié.
- Fuera del alcance y sin tocar: `definitions/STATUS.md` y `features/F07-modelo-por-agente/task-01-tope-features-pendientes.md` ya tenían cambios sin confirmar antes de esta corrida. No hice commit, push, PR, merge ni despliegue. No se tocó `definitions/STATUS.md`.
- Para revisar: la ruta de esta tarea y su *Evidencia*. Franco decide `hecha`.
