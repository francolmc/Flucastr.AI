# task-08 — Regla de `Requiere:` y de comandos ≤ 180 s en `descomponer-feature`
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
El planificador debe declarar el entorno de cada tarea y diseñar la *Verificación* para que cada comando dure como máximo 180 s (margen bajo el corte de 240 s). La regla va en la skill `descomponer-feature`, porque `agentes/planificador.md` está en 3576/3584 B y no se toca; la skill recibe un tope.

## Contexto
- Tocar: `skills/descomponer-feature/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/topes-bytes.test.mjs`
- Requiere: ninguno
- `skills/descomponer-feature/SKILL.md` (confirmado, 5566 B): la plantilla marca `## Contexto` con «Rutas exactas a leer y a tocar; …; viñeta Fuente.» (línea 31); la sección «## Completa (cumplir antes de la puerta 3)» lista los criterios.
- `frases-por-archivo.mjs` (confirmado): `'skills/descomponer-feature'` en las líneas 141–147; task-07 dejó `FRASES_ENTORNO` (lee solo las *Notas* de task-07).
- `topes-bytes.test.mjs`: tras task-07 tiene 10 entradas.
- `scripts/formato-requiere.mjs` (task-02) define el vocabulario; no lo leas, el texto de abajo ya lo resume.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «4. Pieza 1 — Puerta de entorno»

## Decisiones ya tomadas
- En la línea 31 de la plantilla, la descripción de `## Contexto` termina con «viñeta Fuente; `- Requiere:`.».
- En «## Completa», una viñeta nueva: «`- Requiere:` en *Contexto*: `ninguno` o lista separada por «, » de `docker`, `navegador`, `red`, `puerto:<n>`, `runtime:<nombre>@<versión>` (nombre: `node`, `npm`, `python`, `python3`, `go`, `java`, `deno`, `bun`, `dotnet`), `largo:<segundos>`; dedúcela de los comandos de *Verificación*. Cada comando de *Verificación* debe correr en ≤180 s; si una suite no cabe, pártela en comandos por subconjunto. `largo:<s>` solo documenta un comando que no se puede partir.»
- Manifiesto: `FRASES_ENTORNO` agrega `'descomponer-feature': ['- Requiere:', '≤180 s']`; `'skills/descomponer-feature'` agrega `...FRASES_ENTORNO['descomponer-feature']`.
- Tope: `TOPES` agrega `{ ruta: 'skills/descomponer-feature/SKILL.md', tope: 6400, opcional: false }`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: los tres archivos nombrados.
Fuera de alcance: `agentes/planificador.md` (no puede crecer), `definitions/WORKFLOW.md` §6 (agregar `Requiere:` a la plantilla oficial es un pendiente de puerta 1), el resto de la skill.

## Pasos
1. En `SKILL.md`, edita la línea 31 de la plantilla y agrega la viñeta en «Completa».
2. Mide con `wc -c`; debe ser ≤ 6400.
3. Agrega las dos frases al manifiesto y la entrada de tope.
4. Corre la verificación.

## Criterios de aceptación
1. La skill contiene el vocabulario y la regla de 180 s y mide ≤ 6400 B; se comprueba con `grep -c` y `wc -c`.
2. `agentes/planificador.md` sigue en 3576 B; se comprueba con `wc -c`.
3. Con las frases nuevas no aparece ningún fallo nuevo (solo los 6 preexistentes); se comprueba con `node --test`.

## Verificación
```
wc -c skills/descomponer-feature/SKILL.md agentes/planificador.md
grep -c "≤180 s" skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: skill ≤ `6400` y agente `3576`; `1`; `ℹ fail 6`: exactamente los 6 fallos preexistentes ajenos a F31 («falta la lectura acotada en constructor» y «… en ejecutar-tarea», «un agente conserva la línea de modelos.json», «WORKFLOW.md conserva la frase sobre modelos.json», «WORKFLOW.md pasa de 30720 caracteres», «los archivos reales cumplen la regla») y ningún título `✖` nuevo.

## Evidencia

```
$ wc -c skills/descomponer-feature/SKILL.md agentes/planificador.md
    6057 skills/descomponer-feature/SKILL.md
    3576 agentes/planificador.md
    9633 total
exit 0
```
Anotación: tamaño 6057 / tope 6400 en skills/descomponer-feature/SKILL.md (antes 5566 B). agentes/planificador.md sigue en 3576 B.

```
$ grep -c "≤180 s" skills/descomponer-feature/SKILL.md
1
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 133
ℹ pass 127
ℹ fail 6
exit 0
```
Anotación (el exit es el del grep, que es el último del pipeline): `ℹ fail 6` = los 6 fallos preexistentes, sin fallos nuevos.

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E "^✖"
✖ los archivos reales cumplen la regla (2.360666ms)
✖ falla si un agente conserva la línea de modelos.json (0.426667ms)
✖ falla si falta la lectura acotada en constructor (0.318625ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (0.2865ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.535334ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.310667ms)
✖ failing tests:
✖ los archivos reales cumplen la regla (2.360666ms)
✖ falla si un agente conserva la línea de modelos.json (0.426667ms)
✖ falla si falta la lectura acotada en constructor (0.318625ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (0.2865ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.535334ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.310667ms)
exit 0
```
Anotación: los 6 títulos listados son los conocidos; ningún `✖` nuevo.

## Notas
- Tamaño de la skill: 5566 → 6057 B con tope 6400 (nuevo en `TOPES`). No se tocó ningún otro tope; `agentes/planificador.md` sigue en 3576 B.
- Cambios aplicados según *Decisiones ya tomadas*: línea 31 de la plantilla termina en «viñeta Fuente; `- Requiere:`.»; viñeta nueva en «## Completa»; `FRASES_ENTORNO['descomponer-feature']` = `['- Requiere:', '≤180 s']` y la entrada `skills/descomponer-feature` la incluye; entrada de tope 6400 en `topes-bytes.test.mjs`.
- Entorno (`entorno.mjs`): ok. Rama no tocada (modo yolo). Sin commit.
- Registro de task-07 leído (solo *Notas*): la base de 6 fallos coincide con la de esta corrida.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
