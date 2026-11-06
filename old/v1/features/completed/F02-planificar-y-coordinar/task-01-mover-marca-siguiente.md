# task-01 — El planificador mueve la marca «→» al descomponer
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Hoy nadie puede mover la marca `→` de `definitions/BACKLOG.md` cuando una feature queda `hecha`: `skills/descomponer-feature/SKILL.md` (paso 5) prohíbe tocar el backlog, `agentes/coordinador.md` solo puede editar el campo `estado`, y `definitions/STATUS.md` ya registró esa laguna. Con `→` en una feature `hecha`, el validador del backlog falla y el flujo no sabe cuál es la siguiente. Esta tarea permite al planificador mover únicamente esa marca, como parte de `descomponer-feature`.

## Contexto
- Repo: este, único repo; Markdown, sin build. Archivo a tocar: `skills/descomponer-feature/SKILL.md` (leído; el paso 5 de «Pasos» dice: «No cambies `BACKLOG.md` ni muevas nada a `completed/`.»).
- Se leyeron `agentes/planificador.md` (ya permite escribir `definitions/BACKLOG.md` y `features/**`, así que no requiere cambio) y `skills/crear-backlog/SKILL.md` (regla vigente: `→` solo en la primera feature no `hecha`).
- Formato del backlog validado por `pruebas/comprobaciones/formato-flujo.mjs` (`validarBacklog`, regla 4: un único `→`, en la primera feature que no está `hecha`).
- Pruebas: `bash pruebas/rapida.sh` (sin modelo ni red, ~15 s, tope 30 s).

## Decisiones ya tomadas
- Solo se edita el paso 5 de `skills/descomponer-feature/SKILL.md`. Texto exacto del paso 5 nuevo: «5. En `BACKLOG.md` solo puedes mover la marca `→`: si está en una feature `hecha`, pásala a la primera feature que no esté `hecha` (deja vacía la celda de la anterior). No cambies ningún otro campo ni fila. No muevas nada a `completed/`.»
- Ningún otro paso, plantilla ni sección de ese archivo se modifica.
- El campo `estado` de las features sigue siendo del coordinador con aprobación de Franco; el planificador no lo toca.

## Alcance / Fuera de alcance
Alcance: la edición del paso 5 en un único archivo.
Fuera de alcance: modificar `agentes/planificador.md`, `agentes/coordinador.md`, `crear-backlog`, `definitions/` o `definitions/BACKLOG.md`; agregar pruebas (las agrega task-03); hacer commit.

## Pasos
1. Abrir `skills/descomponer-feature/SKILL.md` y localizar la línea que empieza por `5. No cambies`.
2. Reemplazarla por el texto exacto de *Decisiones ya tomadas*. Resultado observable: `grep -n "^5\." skills/descomponer-feature/SKILL.md` muestra la línea nueva.
3. Confirmar que no quedó la frase antigua. Resultado observable: `grep -c "No cambies \`BACKLOG.md\`" skills/descomponer-feature/SKILL.md` imprime `0`.
4. Correr `bash pruebas/rapida.sh` y confirmar que sigue en 0.

## Criterios de aceptación
1. El paso 5 contiene la frase «solo puedes mover la marca» y el símbolo `→`. Se comprueba con la primera orden de *Verificación*.
2. La frase antigua ya no existe. Se comprueba con la segunda orden.
3. Solo cambió ese archivo. Se comprueba con la tercera orden.
4. La verificación rápida sigue en 0 y bajo 30 s. Se comprueba con la cuarta orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "solo puedes mover la marca" skills/descomponer-feature/SKILL.md
grep -c "No cambies \`BACKLOG.md\`" skills/descomponer-feature/SKILL.md
git status --short skills agentes definitions
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Salida esperada: una línea con el número 5 y el texto nuevo; `0`; `git status` lista solo ` M skills/descomponer-feature/SKILL.md` (más lo ya modificado por otras tareas de F02, nada más); `ℹ fail 0` y `rapida: N archivos en M s (tope 30 s)` con M ≤ 30.

## Evidencia

Comandos de *Verificación* ejecutados tal cual (desde `/Users/franco/Codes/flucastr/Flucastr.AI`):

```
$ grep -n "solo puedes mover la marca" skills/descomponer-feature/SKILL.md
16:5. En `BACKLOG.md` solo puedes mover la marca `→`: si está en una feature `hecha`, pásala a la primera feature que no esté `hecha` (deja vacía la celda de la anterior). No cambies ningún otro campo ni fila. No muevas nada a `completed/`.

$ grep -c "No cambies \`BACKLOG.md\`" skills/descomponer-feature/SKILL.md
0

$ git status --short skills agentes definitions
 M agentes/coordinador.md
 M definitions/BACKLOG.md
 M definitions/STATUS.md
 M skills/descomponer-feature/SKILL.md

$ bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
ℹ fail 0
rapida: 9 archivos en 14 s (tope 30 s)
```

Criterios de aceptación:
1. Paso 5 contiene «solo puedes mover la marca» y `→`: cumplido (línea 16).
2. Frase antigua ausente: cumplido (`0`).
3. Solo cambió ese archivo en esta tarea: cumplido. `git status` también muestra `agentes/coordinador.md`, `definitions/BACKLOG.md` y `definitions/STATUS.md` modificados, ya presentes antes de empezar (snapshot inicial) o de otro constructor; esta tarea no los tocó.
4. Verificación rápida en 0 y bajo 30 s: cumplido (`ℹ fail 0`, 14 s).

## Notas

- Hueco menor: la *Verificación* usa `git status --short skills agentes definitions`, que muestra cambios ajenos a esta tarea. Se interpretó la salida esperada como «ver solo ` M skills/descomponer-feature/SKILL.md` como cambio propio». No se tocó ningún otro archivo.
- Paso 2 se verificó con `grep -n "^5\."` además de la orden de *Verificación*; la línea nueva aparece en la 16.
- No se editaron `agentes/planificador.md`, `agentes/coordinador.md`, `crear-backlog`, `definitions/` ni pruebas. No hubo commit, push, PR, merge ni despliegue.
- El texto del paso 5 es el de *Decisiones ya tomadas*, sin cambios.
