# task-02 — El coordinador cubre todos los estados de tarea
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
La tabla de decisión de `agentes/coordinador.md` solo cubre «feature sin tareas» y «tarea `aprobada`». Quedan sin regla: tareas en `borrador` (puerta 3 pendiente), `en curso` (sesión interrumpida), `lista para revisión` (puerta 4), `bloqueada`, y la feature con todas sus tareas `hecha`. Sin esas filas, el coordinador improvisa justo en las puertas. Esta tarea las agrega con el comportamiento ya definido en `definitions/WORKFLOW.md`, sin inventar roles ni permisos nuevos.

## Contexto
- Repo: este, único repo. Archivo a tocar: `agentes/coordinador.md` (leído completo). Su tabla «Tabla de decisión» tiene dos columnas, `Estado observado | Paso`, con 6 filas.
- Reglas ya vigentes en ese archivo, que no se cambian: solo escribe `definitions/STATUS.md` y el campo `estado` (solo con aprobación explícita de Franco); en una puerta se detiene y escribe en `STATUS.md` qué revisar y la ruta; el formato de `STATUS.md` es el de «Formato de `definitions/STATUS.md`».
- Estados de tarea: `borrador`, `aprobada`, `en curso`, `lista para revisión`, `hecha`, `bloqueada` (`definitions/WORKFLOW.md` §6; `skills/ejecutar-tarea/SKILL.md`).
- Orden de tareas: `depende_de:` de cada tarea (formato validado por `pruebas/comprobaciones/formato-tarea.mjs`).
- Pruebas: `bash pruebas/rapida.sh`.

## Decisiones ya tomadas
- Se agregan exactamente estas filas a la tabla, después de la fila «Tarea `aprobada`», con estas dos columnas:
  1. `Tareas de la feature siguiente en `borrador`` → «**Puerta 3**: no delegas. Escribe en `STATUS.md` la ruta de cada tarea en `borrador` y espera la aprobación de Franco, una por una.»
  2. `Tarea `lista para revisión`` → «**Puerta 4**: no delegas. Escribe en `STATUS.md` la ruta de la tarea y que Franco revise la evidencia y haga el commit. Solo Franco la pasa a `hecha`.»
  3. `Tarea `en curso` sin sesión del constructor activa` → «Escalación: tarea interrumpida. No la vuelvas a delegar sin que Franco lo decida.»
  4. `Tarea `bloqueada`` → «Registra el bloqueo en `STATUS.md` (*Bloqueos abiertos*) con el motivo de la sección *Notas* de la tarea y enrútalo según la fila de bloqueos; si es un cambio de alcance, es escalación.»
  5. `Todas las tareas de la feature `hecha`` → «Pide a Franco que confirme la feature como `hecha`. Con su aprobación explícita, escribe `hecha` en `BACKLOG.md` y delega al `planificador` con `descomponer-feature` para la siguiente (mueve la marca `→`).»
- En la fila existente «Tarea `aprobada`» se agrega al final del texto de la columna Paso: « Una a la vez, en orden de número, y solo si cada tarea de su `depende_de:` está `hecha`.»
- No se agrega el estado `en curso` a las features del backlog; no se cambian los demás apartados del archivo.

## Alcance / Fuera de alcance
Alcance: cinco filas nuevas y una frase añadida en la tabla de `agentes/coordinador.md`.
Fuera de alcance: cambiar permisos de escritura, el formato de `STATUS.md`, las demás secciones del archivo, otros agentes, `definitions/WORKFLOW.md`; agregar pruebas (las agrega task-03); hacer commit.

## Pasos
1. En `agentes/coordinador.md`, agregar a la fila «Tarea `aprobada`» la frase de *Decisiones ya tomadas*.
2. Insertar debajo de esa fila las cinco filas nuevas, en el orden listado. Resultado observable: la tabla tiene 11 filas de datos.
3. Confirmar que la tabla sigue bien formada: `awk '/^\| Estado observado/,/^$/' agentes/coordinador.md | grep -c '^|'` imprime `13` (encabezado, separador y 11 filas).
4. Correr `bash pruebas/rapida.sh` y confirmar que sigue en 0.

## Criterios de aceptación
1. La tabla de decisión menciona los seis estados de tarea (`borrador`, `aprobada`, `en curso`, `lista para revisión`, `hecha`, `bloqueada`). Se comprueba con la segunda orden de *Verificación*.
2. La tabla tiene 13 líneas que empiezan por `|`. Se comprueba con la primera orden.
3. Solo cambió `agentes/coordinador.md`. Se comprueba con la tercera orden.
4. La verificación rápida sigue en 0 y bajo 30 s. Se comprueba con la cuarta orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
awk '/^\| Estado observado/,/^$/' agentes/coordinador.md | grep -c '^|'
node --input-type=module -e 'import fs from "node:fs"; const t=fs.readFileSync("agentes/coordinador.md","utf8").split("\n").filter(l=>l.startsWith("|")).join("\n"); const f=["borrador","aprobada","en curso","lista para revisión","hecha","bloqueada"].filter(e=>!t.includes(e)); console.log(f.length?"FALTAN: "+f.join(", "):"ESTADOS COMPLETOS")'
git status --short agentes skills definitions
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Salida esperada: `13`; `ESTADOS COMPLETOS`; `git status` lista solo ` M agentes/coordinador.md` (más lo ya modificado por otras tareas de F02, nada más); `ℹ fail 0` y `rapida: N archivos en M s (tope 30 s)` con M ≤ 30.

## Evidencia

Comando: `awk '/^\| Estado observado/,/^$/' agentes/coordinador.md | grep -c '^|'`
```
13
```

Comando: `node --input-type=module -e '...'` (criterio 1, comprueba los seis estados en las filas de la tabla)
```
ESTADOS COMPLETOS
```

Comando: `git status --short agentes skills definitions`
```
 M agentes/coordinador.md
 M definitions/BACKLOG.md
 M definitions/STATUS.md
 M skills/descomponer-feature/SKILL.md
```
Nota: `definitions/BACKLOG.md`, `definitions/STATUS.md` y `skills/descomponer-feature/SKILL.md` aparecen modificados por trabajo previo o de otras tareas; esta tarea no los tocó.

Comando: `bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"`
```
ℹ fail 0
rapida: 9 archivos en 13 s (tope 30 s)
```

Criterios de aceptación:
1. Seis estados presentes en la tabla: cumplido (`ESTADOS COMPLETOS`).
2. 13 líneas que empiezan por `|`: cumplido (`13`).
3. Solo `agentes/coordinador.md` cambió dentro de esta tarea: cumplido (el resto de `git status` es trabajo previo o de otras tareas, indicado arriba).
4. Verificación rápida en 0 fallos y bajo 30 s: cumplido (`ℹ fail 0`, 13 s).

## Notas

Huecos menores resueltos:
- La columna Paso de la fila «Tarea `aprobada`» no terminaba en punto; se añadió «.» antes de la frase de *Decisiones ya tomadas* para separar las dos oraciones.
- En *Decisiones ya tomadas*, la primera columna venía con backticks anidados («`Tareas de la feature siguiente en `borrador``»); se escribió como «Tareas de la feature siguiente en `borrador`», que es la intención literal.

No hubo bloqueos ni escalaciones. No se tocó `definitions/STATUS.md`, no hay commit ni push.
