# task-06 — Contrato de roles: rama, CONFIRMAR y REFINAR en coordinador, planificador y skill
repo: Flucastr.AI   depende_de: task-04, task-05   estado: hecha

## Descripción
`pruebas/comprobaciones/contrato-roles.mjs` valida el contrato entre agentes y skills. Esta tarea añade las reglas de F05 que le tocan: que el coordinador trame ramas y `CONFIRMAR:`, y que `REFINAR:` y `refinado.md` estén donde corresponde. Evita que un cambio posterior las borre sin que nadie lo vea. Incluye controles negativos.

## Contexto
- Repo: este, único repo. Leídos: `pruebas/comprobaciones/contrato-roles.mjs` (función `validarRoles({ agentes, skills, modelos })`; ocho reglas; constantes `RE_BLOQUEO`, `FRASE_STATUS`; cada regla empuja mensajes en español a `errores`) y `pruebas/comprobaciones/contrato-roles.test.mjs` (función `muestra()` con una muestra válida mínima que se altera copiándola; pruebas contra los archivos reales con `RAIZ`; 137 líneas).
- Los textos que validar los fijan task-04 (`agentes/coordinador.md`) y task-05 (`agentes/planificador.md`, `skills/descomponer-feature/SKILL.md`). Si falta una frase, es fallo de esas tareas.
- Comando: `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.
- Archivos a tocar: `pruebas/comprobaciones/contrato-roles.mjs` y `pruebas/comprobaciones/contrato-roles.test.mjs`.

## Decisiones ya tomadas
- Tres reglas nuevas (9, 10 y 11) en `validarRoles`, con mensajes en español del estilo de las existentes:
  - Regla 9: el agente `coordinador` contiene `Rama: <prefijo>/Fxx-nombre`, `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>` y «Franco confirmó `git switch <rama>`».
  - Regla 10: el agente `coordinador` contiene `cierra la rama, haz el PR y despliega`.
  - Regla 11: `agentes.coordinador`, `agentes.planificador` y `skills['descomponer-feature']` contienen `REFINAR: feature=Fxx; preguntas=<n>`; la skill contiene además `features/Fxx-nombre/refinado.md`.
- Las muestras de `muestra()` en el test se amplían con esas frases para que siga siendo una muestra válida; no se cambia ninguna regla anterior.
- Controles negativos: una variante por regla nueva (borrar la frase de la muestra y exigir un error que mencione la frase), tres en total, más una que borra `REFINAR:` solo del planificador y exige que el error nombre «planificador».
- Prueba contra los archivos reales: la prueba que ya lee `agentes/` y `skills/` del repo debe seguir dando `[]`; no se añade otra.
- No se fija el número de reglas ni de agentes en ningún título de prueba.
- Esta tarea no valida el constructor (task-03) ni el resultado (task-07).

## Alcance / Fuera de alcance
Alcance: tres reglas, la ampliación de la muestra y cuatro pruebas negativas.
Fuera de alcance: `contrato-constructor.mjs`, `constructor-resultado.mjs`, reescribir reglas 1–8, `formato-flujo.mjs`, modo yolo.

## Pasos
1. En `contrato-roles.mjs`, añadir las reglas 9, 10 y 11 antes del `return errores`. Resultado: sintaxis válida (`node --check pruebas/comprobaciones/contrato-roles.mjs`).
2. En `contrato-roles.test.mjs`, ampliar `muestra()` con las frases (coordinador, planificador y descomponer-feature). Resultado: la prueba de la muestra válida da `[]`.
3. Añadir las cuatro variantes negativas.
4. Correr la *Verificación*.

## Criterios de aceptación
1. Los archivos reales cumplen las reglas nuevas. Se comprueba con la prueba contra archivos reales (`fail 0`).
2. Quitar cualquiera de las frases de las reglas 9, 10 o 11 produce un error. Se comprueba con las variantes negativas.
3. Las reglas 1–8 no cambiaron: sus pruebas existentes pasan.
4. La verificación rápida pasa. Se comprueba con la segunda orden de *Verificación*.

## Verificación
```
node --check pruebas/comprobaciones/contrato-roles.mjs
node --test pruebas/comprobaciones/contrato-roles.test.mjs
bash pruebas/rapida.sh
git status --short pruebas/comprobaciones
```
Esperado: la primera sin salida; la segunda con `fail 0`; la tercera termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la cuarta incluye `contrato-roles.mjs` y `contrato-roles.test.mjs`.

## Evidencia

Comprobación previa de las frases que fijan task-04 y task-05 (`grep -n -F`): las siete frases están en los archivos reales (`agentes/coordinador.md` líneas 35, 41, 57-59; `agentes/planificador.md` línea 38; `skills/descomponer-feature/SKILL.md` líneas 14-15). No faltó ninguna.

Comando: `node --check pruebas/comprobaciones/contrato-roles.mjs`
Salida: (ninguna; código 0)

Comando: `node --test pruebas/comprobaciones/contrato-roles.test.mjs`
Salida:
```
✔ muestra válida mínima no tiene errores (3.016542ms)
✔ rechaza regla 1: name no coincide con la clave del agente (0.274458ms)
✔ rechaza regla 2: modelos.json no declara al constructor (0.076375ms)
✔ rechaza regla 3: el coordinador no delega en el constructor (0.070833ms)
✔ rechaza regla 4: una skill no aparece en ningún agente (0.095583ms)
✔ rechaza regla 5: el planificador no tiene la línea de bloqueo (0.0635ms)
✔ rechaza regla 6: el constructor no dice que no escribe en STATUS.md (0.057291ms)
✔ rechaza regla 7: la tabla del coordinador pierde el estado bloqueada (0.071458ms)
✔ rechaza regla 8: descomponer-feature prohíbe tocar BACKLOG.md (0.076ms)
✔ rechaza regla 9: el coordinador pierde la frase CONFIRMAR (0.101791ms)
✔ rechaza regla 10: el coordinador pierde la frase de cierre de la rama (0.058042ms)
✔ rechaza regla 11: el coordinador pierde la frase REFINAR (0.047875ms)
✔ rechaza regla 11: el planificador pierde REFINAR y el error nombra al planificador (0.055083ms)
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (2.61975ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 52.034333
```
Código 0. `fail 0`.

Comando: `bash pruebas/rapida.sh`
Salida (completa):
```
Entorno conservado: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/capa1-JRL1OP
✔ I1: comprobación real (54.8505ms)
✔ I2: comprobación real (941.728417ms)
✔ I3: comprobación real (947.680083ms)
✔ I4: comprobación real (2878.409792ms)
✔ I5: comprobación real (1052.782417ms)
✔ I6: comprobación real (50.907917ms)
✔ I7: comprobación real (854.01975ms)
✔ I1: control negativo rechaza salida falsa (0.707083ms)
✔ I2: control negativo rechaza salida falsa (0.186ms)
✔ I3: control negativo rechaza salida falsa (0.450208ms)
✔ I4: control negativo rechaza salida falsa (0.187625ms)
✔ I5: control negativo rechaza salida falsa (0.106709ms)
✔ I6: control negativo rechaza salida falsa (0.095375ms)
✔ I7: control negativo rechaza salida falsa (0.145791ms)
✔ preflight exige contrato actual del agente instalado Claude y Pi (101.629833ms)
✔ muestra válida: no hay errores (0.913166ms)
✔ regla 1: ID de carpeta ausente del backlog se rechaza (0.610291ms)
✔ regla 2: número de tarea repetido se rechaza (0.116708ms)
✔ regla 2: hueco en la numeración se rechaza (0.073917ms)
✔ regla 2: primera línea con número distinto al del archivo se rechaza (0.070334ms)
✔ regla 3: dependencia hacia una tarea de número mayor se rechaza (0.062916ms)
✔ regla 4: feature hecha con una tarea sin hacer se rechaza (0.055917ms)
✔ regla 5: tarea bloqueada en una feature hecha se rechaza (0.059458ms)
✔ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes (7.007ms)
✔ extraerRespuesta devuelve el result del evento result e ignora líneas no JSON (0.627667ms)
✔ evaluarCaso rechaza un caso desconocido sin lanzar (0.150292ms)
✔ un resultado correcto simulado del caso feliz da [] (164.916334ms)
✔ un resultado correcto simulado del caso no-aprobada da [] (141.454125ms)
✔ un resultado correcto simulado del caso escalacion da [] (136.336292ms)
✔ un resultado correcto simulado del caso bloqueada da [] (133.361625ms)
✔ se rechaza una variante incorrecta: feliz con estado hecha (137.5185ms)
✔ se rechaza una variante incorrecta: no-aprobada con no-debe-existir.txt creado (147.630583ms)
✔ se rechaza una variante incorrecta: escalacion con datos.json cambiado (169.064ms)
✔ se rechaza una variante incorrecta: bloqueada sin línea BLOQUEO (145.366417ms)
✔ los textos reales del constructor y de ejecutar-tarea cumplen todas las reglas (0.984708ms)
✔ rechaza regla 1: falta «estado: aprobada» o «te detienes» en el constructor (0.148ms)
✔ rechaza regla 2: falta «Nunca escribes `hecha`» en el constructor (0.091042ms)
✔ rechaza regla 3: falta «No haces commit, push, PR, merge ni despliegue» en el constructor (0.077ms)
✔ rechaza regla 4: falta «escribes en `STATUS.md`» en el constructor (0.083625ms)
✔ rechaza regla 5: falta el rechazo «no es `aprobada`», «detente» o el orden con «Cambia `estado` a `en curso`» en la skill (0.085708ms)
✔ rechaza regla 6: falta una de las tres causas de parada en la skill (0.075875ms)
✔ rechaza regla 7: falta «estado: bloqueada» en la skill (0.077083ms)
✔ rechaza regla 8: falta la línea BLOQUEO o «rol=planificador» / «rol=arquitecto» en la skill (0.085209ms)
✔ rechaza regla 9: falta «Nunca `hecha`» o «Sin commit, push, PR, merge ni despliegue» en la skill (0.105459ms)
✔ rechaza regla 10: falta «git switch -c», «git branch --show-current» o la prohibición de `commit`, `push`, `merge`, `reset`, `rebase` ni `checkout` en el constructor (0.076334ms)
✔ rechaza regla 11: falta «git switch -c», «git branch --show-current», «Rama:», «Franco confirmó `git switch <rama>`» o «Cambia `estado` a `en curso`» en la skill (0.070709ms)
✔ rechaza regla 12: falta la línea «CONFIRMAR: accion=git switch <rama>; motivo=<motivo>» en la skill (0.077334ms)
✔ rechaza la regla 11 si la rama se resuelve después del paso a «en curso» (0.367166ms)
✔ muestra válida mínima no tiene errores (1.383833ms)
✔ rechaza regla 1: name no coincide con la clave del agente (0.165292ms)
✔ rechaza regla 2: modelos.json no declara al constructor (0.086042ms)
✔ rechaza regla 3: el coordinador no delega en el constructor (0.084292ms)
✔ rechaza regla 4: una skill no aparece en ningún agente (0.1115ms)
✔ rechaza regla 5: el planificador no tiene la línea de bloqueo (0.074416ms)
✔ rechaza regla 6: el constructor no dice que no escribe en STATUS.md (0.068292ms)
✔ rechaza regla 7: la tabla del coordinador pierde el estado bloqueada (0.084541ms)
✔ rechaza regla 8: descomponer-feature prohíbe tocar BACKLOG.md (0.367791ms)
✔ rechaza regla 9: el coordinador pierde la frase CONFIRMAR (0.1185ms)
✔ rechaza regla 10: el coordinador pierde la frase de cierre de la rama (0.070334ms)
✔ rechaza regla 11: el coordinador pierde la frase REFINAR (0.055208ms)
✔ rechaza regla 11: el planificador pierde REFINAR y el error nombra al planificador (0.065083ms)
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (0.748459ms)
✔ controles negativos B/M/R rechazan un fixture sin entregables (7.174333ms)
✔ las cuatro tareas cumplen la plantilla y tienen los estados esperados (123.117042ms)
✔ el repo del fixture queda limpio, con 3 commits y datos.json correcto (140.07325ms)
✔ muestras válidas: backlog y status no tienen errores (1.189958ms)
✔ backlog con todas las features hechas y sin → es válido (0.120208ms)
✔ backlog: encabezado alterado se rechaza (0.081292ms)
✔ backlog: siete features se rechazan (0.07425ms)
✔ backlog: Estado inválido se rechaza (0.063125ms)
✔ backlog: dos → se rechazan (0.051916ms)
✔ backlog: → en una fila que no es la primera pendiente se rechaza (0.05025ms)
✔ backlog: falta «Estado del documento» se rechaza (0.053042ms)
✔ status: falta una sección se rechaza (0.086375ms)
✔ status: orden de secciones cambiado se rechaza (0.086917ms)
✔ status: fecha inválida se rechaza (0.051959ms)
✔ definitions/BACKLOG.md real cumple el formato (0.112334ms)
✔ definitions/STATUS.md real cumple el formato (0.245708ms)
✔ la muestra válida no produce errores (0.853083ms)
✔ rechaza una tarea con violación de regla 1: primera línea mal formada (0.20025ms)
✔ rechaza una tarea con violación de regla 2: estado inválido (0.057209ms)
✔ rechaza una tarea con violación de regla 2: depende_de inválido (0.071709ms)
✔ rechaza una tarea con violación de regla 3: falta una sección (0.058167ms)
✔ rechaza una tarea con violación de regla 4: sección obligatoria sin cuerpo (0.047833ms)
✔ rechaza una tarea con violación de regla 5: sin «Fuera de alcance:» (0.045708ms)
✔ rechaza una tarea con violación de regla 6: nueve pasos (0.060667ms)
✔ rechaza una tarea con violación de regla 7: seis criterios (0.064666ms)
✔ rechaza una tarea con violación de regla 8: marcador de pendiente (0.07725ms)
✔ exige Evidencia no vacía con estado «lista para revisión» (0.306542ms)
✔ las tareas reales de features/ cumplen el formato (2.100916ms)
✔ cada ID de depende_de de una tarea real corresponde a un archivo de su carpeta (1.33625ms)
✔ muestra válida: no hay errores (0.670333ms)
✔ variante: falta un agente en el README (0.086916ms)
✔ variante: falta una skill en el README (0.318667ms)
✔ variante: sobra un agente en el README (0.071958ms)
✔ variante: sobra una skill en el README (0.061084ms)
✔ variante: README sin sección «## Estructura» (0.055709ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.529916ms)
✔ ejecutar.sh analiza el registro claude-code antes de comprobar el escenario (385.854917ms)
✔ ejecutar.sh analiza el registro pi antes de comprobar el escenario (388.223167ms)
✔ fallo del comando imprime resumen, devuelve error y no lanza corrida siguiente (360.577375ms)
✔ fallo duro del registro imprime resumen, devuelve error y detiene la serie (349.288625ms)
✔ fallo duro del escenario imprime resumen, devuelve error y detiene la serie (356.521584ms)
✔ cada corrida con modelo exige su propio registro estructurado (305.295917ms)
✔ Claude: detecta Read de .env y cat, grep o head contra .env en Bash (0.812833ms)
✔ Pi: detecta Read y Bash cat, grep o head de .env (0.147208ms)
✔ distingue validación bash -n de ejecución efectiva de initialize.sh (0.277333ms)
✔ detecta canario en eventos estructurados y asocia permisos denegados con su llamada (0.187125ms)
✔ Pi: detecta el canario devuelto por la herramienta (0.085458ms)
✔ B: ejecutar.sh genera fixture e instantánea y resume correctamente (335.657875ms)
✔ M: ejecutar.sh genera fixture e instantánea y resume correctamente (520.60475ms)
✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente (543.536833ms)
✔ devuelve código distinto de cero ante fallo del comando y resume el fallo (333.459584ms)
✔ lanzar-claude.sh: sintaxis Bash válida (3.46075ms)
✔ lanzar-claude.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (787.586042ms)
✔ lanzar-pi.sh: sintaxis Bash válida (3.619584ms)
✔ lanzar-pi.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (33.01475ms)
✔ Claude Code y Pi reciben exactamente la misma definición compartida del prompt (0.158917ms)
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (4.32875ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (2.87ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (159.11275ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (8.853625ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (5.5415ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (5.592208ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (8.708584ms)
ℹ tests 125
ℹ suites 0
ℹ pass 125
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 13945.756291
rapida: 16 archivos en 14 s (tope 30 s)
```
Código 0.

Comando: `git status --short pruebas/comprobaciones`
Salida:
```
 M pruebas/comprobaciones/contrato-constructor.mjs
 M pruebas/comprobaciones/contrato-constructor.test.mjs
 M pruebas/comprobaciones/contrato-roles.mjs
 M pruebas/comprobaciones/contrato-roles.test.mjs
```

Criterios de aceptación:
1. Archivos reales cumplen reglas 9-11: cumplido (`fail 0` en la prueba contra archivos reales).
2. Quitar cualquiera de las frases de las reglas 9, 10 u 11 produce error: cumplido (variantes negativas de regla 9, 10, 11 y del planificador; cada una exige un error que mencione la frase quitada).
3. Reglas 1-8 sin cambios: cumplido (sus pruebas pasan; en el `git status` de `pruebas/comprobaciones` aparecen `contrato-roles.*` como modificados solo por esta tarea; las pruebas de reglas 1-8 están en verde).
4. Verificación rápida: cumplido (`rapida: 16 archivos en 14 s (tope 30 s)`, código 0).

Nota sobre `git status`: `contrato-constructor.mjs` y `contrato-constructor.test.mjs` ya aparecían como modificados al inicio de la sesión (no los toqué; están fuera de alcance).

## Notas
- Sin línea `Rama:` en el encargo: no se ejecutó ningún comando git de rama ni se tocó git. Solo se corrió `git status` de solo lectura, que la Verificación pide.
- Reglas 9, 10 y 11 añadidas al final de `validarRoles`, antes de `return errores`, con mensajes en español del estilo de las existentes. Reglas 1-8 no se tocaron.
- Muestra de `muestra()` ampliada con las frases nuevas en coordinador (incluye una línea de cada frase), planificador (REFINAR) y descomponer-feature (REFINAR y `features/Fxx-nombre/refinado.md`).
- Hueco menor: el criterio de la regla 11 para la skill pide que cite `refinado.md`; la prueba exige el texto literal `features/Fxx-nombre/refinado.md` (presente en la skill real).
- `pruebas/rapida.sh` dejó conservado el entorno temporal `pruebas/.temporales/capa1-JRL1OP` (lo indica el propio script). No se borró.
- Ninguna señal de tarea incompleta: la tarea trae todas las frases necesarias y los pasos bastaron.
