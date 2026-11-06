# task-03 — Dejar el README coherente con el cierre de F04
repo: Flucastr.AI   depende_de: task-01, task-02   estado: hecha

## Descripción
`README.md` todavía dice, en la línea 5, «falta cerrar una feature real de punta a punta» y, al final de `## Flujo` (línea 91), «Pendiente: cerrar una feature real de punta a punta (`definitions/BACKLOG.md`, F04)». Tras task-01 (README fiel al kit) y task-02 (comprobación de su estructura, ya en `pruebas/rapida.sh`), F04 hizo lo que prometía su título. Esta tarea cambia solo esas dos frases y agrega una viñeta a la bitácora, con el texto exacto de *Decisiones ya tomadas*, sin afirmar nada que no esté verificado. Además deja, en *Notas*, una calibración de las cifras de «acotada» de `descomponer-feature` con lo observado en F01 a F04, solo como propuesta para Franco.

## Contexto
- Repo: este, único repo (`/Users/franco/Codes/flucastr/Flucastr.AI`). Único archivo a tocar: `README.md` (101 líneas, leído). La calibración de *Notas* ya está escrita por el planificador; el constructor no la edita.
- Texto actual (leído): línea 5 `> Estado: MVP en construcción (2026-10-29). Arquitecto, coordinador, planificador y constructor existen; falta cerrar una feature real de punta a punta.`; línea 91 termina en `Pendiente: cerrar una feature real de punta a punta (`definitions/BACKLOG.md`, F04).`; última viñeta de `## Bitácora` en la línea 101: `- 2026-10-29: existen coordinador, planificador y constructor; el README se actualiza a ese estado.`
- Hechos verificados que sustentan el texto nuevo: en `definitions/BACKLOG.md` F01, F02 y F03 están `hecha`; las dos tareas de `features/F04-readme-al-dia/` (task-01 y task-02) están `hecha`; existen `pruebas/comprobaciones/readme-estructura.mjs` y `.test.mjs`; `bash pruebas/rapida.sh` termina con `ℹ fail 0` y `rapida: 16 archivos en 16 s (tope 30 s)` (ejecutado). F04 sigue `pendiente` en el backlog: su cierre lo hace Franco, por eso el texto no dice que F04 esté `hecha` ni que se haya completado una feature «de punta a punta».
- La prueba `readme-estructura` solo mira el bloque de código de `## Estructura`; estas ediciones no lo tocan.
- Convención: el README habla en primera persona de Franco («lo hago yo», «abro»). Las frases se copian tal cual.

## Decisiones ya tomadas
Texto exacto (una línea cada uno; sin cambiar nada más de la línea o párrafo salvo lo indicado):

1. Línea 5 completa pasa a:
   `> Estado: MVP en construcción (2026-10-29). Arquitecto, coordinador, planificador y constructor existen; F01 a F03 están hechas en el backlog y F04 dejó este README al día con su comprobación de estructura.`
2. En el párrafo de `## Flujo`, la frase final `Pendiente: cerrar una feature real de punta a punta (`definitions/BACKLOG.md`, F04).` se sustituye por:
   `F04 dejó este README al día y una comprobación que falla si el árbol de `## Estructura` no coincide con `agentes/` y `skills/` (`pruebas/comprobaciones/readme-estructura.mjs`); su cierre en `definitions/BACKLOG.md` lo hago yo.`
   (El resto del párrafo, incluido el enlace a `WORKFLOW.md`, queda igual.)
3. Nueva última viñeta de `## Bitácora`, debajo de la actual:
   `- 2026-10-29: F04 (README al día): el README refleja el kit real y `pruebas/comprobaciones/readme-estructura.mjs` comprueba su árbol de `## Estructura` contra `agentes/` y `skills/`.`
4. No se agrega ni se quita ninguna otra sección, viñeta ni línea. No se marca F04 como `hecha` en ningún lado.

## Alcance / Fuera de alcance
Alcance: las tres ediciones de arriba en `README.md`.

Fuera de alcance:
- `definitions/BACKLOG.md` y `definitions/STATUS.md` (los mueve Franco o el coordinador), y las tareas task-01 y task-02.
- La skill `descomponer-feature`: la calibración de *Notas* es propuesta, no se aplica.
- El bloque de código de `## Estructura`, `pruebas/` y cualquier otro archivo.
- Commit, push, PR, merge o despliegue.

## Pasos
1. En `README.md`, sustituir la línea 5 por la de *Decisiones ya tomadas*, punto 1. Resultado: `sed -n 5p README.md` muestra el texto nuevo.
2. En `README.md`, sustituir la frase final de `## Flujo` por la del punto 2. Resultado: `grep -c "Pendiente: cerrar una feature real" README.md` imprime `0` y `grep -c "su cierre en" README.md` imprime `1`.
3. En `README.md`, agregar la viñeta del punto 3 como última línea de `## Bitácora`. Resultado: `tail -n 1 README.md` muestra la viñeta nueva.
4. Correr la verificación. Resultado: salidas de *Verificación*.

## Criterios de aceptación
1. La línea 5 ya no dice «falta cerrar» y coincide con el texto de la decisión 1. Se comprueba con la primera y segunda orden de *Verificación*.
2. `## Flujo` no contiene «Pendiente: cerrar una feature real» y sí la frase de la decisión 2. Se comprueba con la tercera orden.
3. La bitácora termina en la viñeta de la decisión 3 y tiene 4 viñetas con fecha. Se comprueba con la cuarta orden.
4. Solo cambia `README.md`: tres hunks y ninguna línea de `## Estructura`. Se comprueba con `git diff --stat` y la prueba de estructura.
5. La suite rápida sigue en verde, incluida `readme-estructura`. Se comprueba con la última orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c "falta cerrar" README.md
sed -n 5p README.md
grep -c "Pendiente: cerrar una feature real" README.md; grep -c "su cierre en .definitions/BACKLOG.md. lo hago yo" README.md
tail -n 1 README.md; grep -c "^- 2026-" README.md
node --test pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Salida esperada: `0`; la línea de la decisión 1; `0` y `1`; la viñeta de la decisión 3 y `4`; `ℹ tests 7`, `ℹ pass 7`, `ℹ fail 0`; `ℹ fail 0` y `rapida: 16 archivos en S s (tope 30 s)` con S ≤ 30. (Todo ejecutado por el planificador contra el README actual, salvo las salidas posteriores a la edición, que son las esperadas.)

## Evidencia
Pasos ejecutados en `README.md` (tres ediciones con Edit): línea 5 sustituida por la decisión 1; frase final de `## Flujo` sustituida por la decisión 2; viñeta de la decisión 3 agregada al final de `## Bitácora`.

Verificación (salida real, `cd /Users/franco/Codes/flucastr/Flucastr.AI`):
```
$ grep -c "falta cerrar" README.md
0
$ sed -n 5p README.md
> Estado: MVP en construcción (2026-10-29). Arquitecto, coordinador, planificador y constructor existen; F01 a F03 están hechas en el backlog y F04 dejó este README al día con su comprobación de estructura.
$ grep -c "Pendiente: cerrar una feature real" README.md; grep -c "su cierre en .definitions/BACKLOG.md. lo hago yo" README.md
0
1
$ tail -n 1 README.md; grep -c "^- 2026-" README.md
- 2026-10-29: F04 (README al día): el README refleja el kit real y `pruebas/comprobaciones/readme-estructura.mjs` comprueba su árbol de `## Estructura` contra `agentes/` y `skills/`.
4
$ node --test pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 7
ℹ pass 7
ℹ fail 0
$ bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
ℹ fail 0
rapida: 16 archivos en 19 s (tope 30 s)
```

Diff (`git diff --stat -- README.md`): `README.md | 26 ++++++++++++++++++--------` (18 inserciones, 8 borrados). Con `git diff -U0 -- README.md` aparecen 10 hunks en total: tres son los de esta tarea (líneas 5, `## Flujo` y `## Bitácora`); los demás (bloque de `## Estructura`, línea de `instalar`/`desinstalar`, `pruebas/README.md`) ya estaban en el árbol de trabajo antes de empezar (`git status` inicial mostraba `M README.md`) y vienen de task-01. Ninguna línea de `## Estructura` fue tocada por esta tarea.

Criterios de aceptación:
1. Línea 5 sin «falta cerrar» y igual a la decisión 1: cumple (`grep` = 0 y salida de `sed -n 5p`).
2. `## Flujo` sin «Pendiente: cerrar una feature real» y con la frase de la decisión 2: cumple (0 y 1).
3. Bitácora termina en la viñeta de la decisión 3 con 4 viñetas con fecha: cumple.
4. Solo cambia `README.md` por esta tarea, sin líneas de `## Estructura`: cumple con la salvedad de los hunks previos de task-01 explicada arriba; la prueba `readme-estructura` pasa (7/7).
5. Suite rápida en verde incluida `readme-estructura`: cumple (`ℹ fail 0`, 19 s ≤ 30 s).

## Notas
- Huecos menores: ninguno. Las frases se copiaron tal cual de *Decisiones ya tomadas*; la línea de bitácora se agregó debajo de la última viñeta existente.
- Aviso sobre el criterio «tres hunks»: el criterio se cumple para las ediciones de esta tarea, pero `git diff` de `README.md` muestra 10 hunks porque task-01 ya había dejado cambios sin commit en el mismo archivo. No se revirtió nada para ajustar la cifra.
- No se tocó `definitions/BACKLOG.md` ni `definitions/STATUS.md` (git los muestra modificados desde antes de esta tarea; no son míos). No se marcó F04 como `hecha`. La sección «Notas del planificador» no se modificó.
- Sin commit, push, PR, merge ni despliegue.

### Notas del planificador: calibración de «acotada» (propuesta, sin tocar la skill)
Observado leyendo las 17 tareas de F01 a F04 y sus *Notas*; los conteos de pasos y criterios son contados en cada archivo, los de archivos tocados salen de las *Notas* de cada una (confirmado), con redondeo.

| Feature | Tareas | Pasos por tarea | Criterios | Archivos tocados por tarea |
|---|---|---|---|---|
| F01 | 5 | 5, 5, 5, 5, 6 | 4, 5, 4, 4, 3 | 2 a 3 (código + prueba, o doc) |
| F02 | 4 | 4, 4, 5, 5 | 4 en todas | 1 a 2 |
| F03 | 6 | 5, 5, 5, 4, 7, 7 | 4, 4, 4, 4, 5, 5 | 1 a 2 (task-05: solo un informe) |
| F04 | 2 (3 con esta) | 6, 6 | 5, 5 | 1 y 2 |

- Cupieron sin partirse: las 17. Máximo observado: 7 pasos, 5 criterios y 3 archivos. Ninguna superó 8 pasos, 5 criterios o ~5 archivos, así que esos topes nunca fueron el límite real.
- Huecos menores por tarea: 1 a 4, todos resueltos por el constructor sin escalar; en ninguna apareció la señal de tarea incompleta.
- Desvíos: (a) F01 task-04 quedó `bloqueada` porque su prueba real dependía del estado de `definitions/BACKLOG.md` (borrador y 7 features), un documento fuera de la tarea; (b) F01 task-02 usó `PIPESTATUS`, que zsh no define, y F02 task-03 fijó «9 archivos» cuando eran 10: cifras y comandos de la verificación que se rompen por el entorno, no por el tamaño; (c) F03 necesitó task-06 después de task-05 porque la corrida real reveló un permiso faltante: ese descubrimiento no se prevé por tamaño; (d) F04 task-01 reintentó una edición por un texto distinto al del archivo (el árbol de `## Estructura`).
- Lectura: lo que falló no fue el tamaño sino dos cosas: verificación que depende de un valor ajeno a la tarea (conteos, estado de otro documento, comandos de un shell) y huecos de convenciones menores.
- Propuesta a Franco (no aplicada): (1) bajar «~5 archivos tocados» a «~3» en `skills/descomponer-feature/SKILL.md`, porque 3 fue el máximo real y 5 ya no protege nada; (2) dejar «hasta ~8 pasos» y «5 criterios» como están, el máximo observado (7 y 5) cabe; (3) agregar a la lista «Completa» una línea: «la verificación no fija conteos ni estados de otros documentos que la tarea no controla; si los necesita, los lee en vivo». No cambiar nada si prefieres esperar más features: con 17 tareas sin partir, el riesgo de dejar las cifras es bajo.
