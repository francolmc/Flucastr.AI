# task-03 — Reglas del coordinador y del constructor sobre la evidencia
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Con la opción `--evidencia` lista, el `coordinador` debe usarla en vez de leer la *Evidencia*, y el `constructor` debe escribirla en el formato que el script reconoce. Sin esto el script existe pero nadie lo corre y las tareas siguen volviendo por huecos.

## Contexto
- Tocar: `agentes/coordinador.md`, `skills/ejecutar-tarea/SKILL.md`
- `agentes/coordinador.md`: regla 6 de yolo (línea 100, «`hecha` por evidencia») y la lista cerrada de comandos (líneas 106-111, ítem 4). El `tools:` (línea 4) ya trae `Bash(node ~/.flucastr-ai/validar-tarea.mjs *)`: no se toca. El archivo mide 17871 bytes.
- `skills/ejecutar-tarea/SKILL.md`: «Ejecución» paso 3 (línea 24, pegar comando y salida en *Evidencia*) y «Línea de registro» (línea 52). Mide 5486 bytes.
- Formato de *Evidencia* que reconoce el script: `$ <comando>` idéntico al de *Verificación*, salida en las líneas siguientes y `exit N` al final de la salida. Detalle en las *Notas* de task-01.
- Comprobaciones que leen estos archivos: `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.

## Decisiones ya tomadas
- Regla 6 del `coordinador`: ante `lista para revisión`, corre `node ~/.flucastr-ai/validar-tarea.mjs --evidencia <ruta-tarea>`; salida 0 escribe `hecha` con la línea de «Paso actual» ya existente; salida 1 deja `bloqueada` con las líneas del comando como motivo, y el modo se detiene; salida 2 es escalación. Ya no lee la *Evidencia* para decidir. Lo demás de la regla (BLOQUEO del constructor, verificación fallada dos veces) no cambia.
- Ítem 4 de la lista cerrada pasa a `node ~/.flucastr-ai/validar-tarea.mjs [--evidencia] <ruta-tarea>...` y la lista sigue en cuatro comandos. El permiso y `WORKFLOW.md` §3.1 no cambian.
- Skill del `constructor`: el paso 3 pide el formato `$ <comando>` + salida + `exit N`, y antes de dejar `lista para revisión` correr `node scripts/validar-tarea.mjs --evidencia <ruta-tarea>` solo si existe `scripts/validar-tarea.mjs`; si la salida es 1, corrige la *Evidencia* corriendo lo que falte (no la inventa).
- Texto breve: sumar menos de 700 bytes en total.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos edits de texto con `Edit`.
Fuera de alcance: `scripts/`, `instalar.sh`, `definitions/` (incluido `WORKFLOW.md` §3.1 y `ARCHITECTURE.md`), el `tools:` del `coordinador`, la puerta 4 de modo normal y reglas de otros agentes.

## Pasos
1. En `agentes/coordinador.md`, reescribir la regla 6 según la decisión.
2. En el mismo archivo, cambiar el ítem 4 de la lista cerrada.
3. En `skills/ejecutar-tarea/SKILL.md`, ampliar el paso 3 de «Ejecución» con el formato y el autochequeo.
4. Comprobar tamaños y que `tools:` no cambió.

## Criterios de aceptación
1. La regla 6 menciona `--evidencia` y sus tres salidas. Se comprueba con `grep`.
2. La línea `tools:` del coordinador es idéntica a la de antes (`git diff` no la muestra).
3. La skill describe `$ <comando>` y `exit N`.
4. Las pruebas de contrato no suman fallos.

## Verificación
```
grep -c -e '--evidencia' agentes/coordinador.md skills/ejecutar-tarea/SKILL.md
git diff --stat -- agentes/coordinador.md skills/ejecutar-tarea/SKILL.md
git diff -U0 -- agentes/coordinador.md | grep -c '^[-+]tools:'
node --test pruebas/comprobaciones/contrato-roles.test.mjs
bash pruebas/rapida.sh
```
Esperado: el primero muestra `agentes/coordinador.md:` y `skills/ejecutar-tarea/SKILL.md:` con conteos mayores que 0; el segundo muestra los dos archivos; el tercero `0`; el cuarto `ℹ fail 0`; el quinto exactamente 7 fallos (los ajenos: BACKLOG real y 6 de higiene de contexto por `WORKFLOW.md` > 30720), sin fallos nuevos.

## Evidencia

```
$ grep -c -e '--evidencia' agentes/coordinador.md skills/ejecutar-tarea/SKILL.md
agentes/coordinador.md:2
skills/ejecutar-tarea/SKILL.md:1
exit 0

$ git diff --stat -- agentes/coordinador.md skills/ejecutar-tarea/SKILL.md
 agentes/coordinador.md         | 4 ++--
 skills/ejecutar-tarea/SKILL.md | 2 +-
 2 files changed, 3 insertions(+), 3 deletions(-)
exit 0

$ git diff -U0 -- agentes/coordinador.md | grep -c '^[-+]tools:'
0
exit 1

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs
✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato (3.680583ms)
ℹ tests 56
ℹ suites 0
ℹ pass 56
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 107.23925
exit 0

$ bash pruebas/rapida.sh
✖ definitions/BACKLOG.md real cumple el formato (2.2435ms)
✖ los archivos reales cumplen la regla (3.740375ms)
✖ falla si un agente conserva la línea de modelos.json (1.028417ms)
✖ falla si falta la lectura acotada en constructor (0.625917ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (1.037375ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.534375ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.619333ms)
ℹ tests 417
ℹ pass 410
ℹ fail 7
✖ failing tests:
✖ definitions/BACKLOG.md real cumple el formato (2.2435ms)
✖ los archivos reales cumplen la regla (3.740375ms)
✖ falla si un agente conserva la línea de modelos.json (1.028417ms)
✖ falla si falta la lectura acotada en constructor (0.625917ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (1.037375ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.534375ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.619333ms)
ℹ tests 417
ℹ pass 410
ℹ fail 7
exit 1
```

## Notas

- Hueco menor: la regla 6 dice «con las líneas de salida del comando como motivo» para la salida 1 (la tarea decía «las líneas del comando»); tomé la salida del comando.
- Tamaño: `agentes/coordinador.md` pasó de 17871 a 17887 bytes (tope 17920, 33 libres; la regla 6 nueva suma solo 2 bytes sobre la vieja y el ítem 4 suma 14). No se subió el tope. `skills/ejecutar-tarea/SKILL.md` pasó de 5486 a 5807 bytes.
- `rapida.sh` sale 1 con exactamente los 7 fallos ajenos esperados; no hay fallos nuevos. Se toma como `verificacion=pasa` porque coincide con lo *Esperado*.
- `estado` no pasó por `en curso` en la ejecución; se escribió directo a `lista para revisión` al terminar.
- Autocomprobación `node scripts/validar-tarea.mjs --evidencia <ruta>`: salida 0, `OK: 1 tarea(s) con evidencia completa`. Antes faltaban el bloque de código y la línea `Registro:`, y se corrigieron.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=4; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna

