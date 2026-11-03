# task-07 — Paso de entorno del constructor en `ejecutar-tarea`, con manifiesto y tope
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
El constructor comprueba el entorno antes de tocar nada (decisión D1=A de Franco, 2026-11-02): si `entorno.mjs` informa una falta, deja la tarea `bloqueada` y avisa solo a Franco con `BLOQUEO: rol=franco`. El texto vive en la skill porque `agentes/constructor.md` está en 3008/3072 B y no se toca. La frase queda protegida por el manifiesto y la skill recibe un tope.

## Contexto
- Tocar: `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/topes-bytes.test.mjs`
- Requiere: ninguno
- `skills/ejecutar-tarea/SKILL.md` (confirmado, 7382 B): «## Antes de empezar», punto 1 «Lee la tarea completa. Si `estado` no es `aprobada`, **detente**…», punto 2 «Rama de la feature», punto 3 «Cambia `estado` a `en curso`».
- `frases-por-archivo.mjs` (confirmado): `'skills/ejecutar-tarea': [ ...FRASES_LECTURA_F22['ejecutar-tarea'] ]` (líneas 148–150); `contrato-roles.test.mjs` genera un caso positivo y uno negativo por frase de ese objeto, sin tests nuevos.
- `topes-bytes.test.mjs` (confirmado): arreglo `TOPES` de 9 entradas, última `skills/lectura-extra/SKILL.md` con 5120.
- Existen reglas de contrato que leen la skill: `pruebas/comprobaciones/contrato-constructor.test.mjs` y `contrato-roles.test.mjs`.
- De task-06 lee solo las *Notas*: el lanzador es `~/.flucastr-ai/entorno.mjs`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «4. Pieza 1 — Puerta de entorno»

## Decisiones ya tomadas
- Debajo del punto 1 de «Antes de empezar», con sangría de 3 espacios, una viñeta: «**Entorno:** corre `node ~/.flucastr-ai/entorno.mjs <ruta-tarea>`. Si imprime `falta=<lista>`: `bloqueada`, en *Notas* `Bloqueo: tipo=entorno; falta=<lista>` y termina con `BLOQUEO: rol=franco; motivo=entorno: falta=<lista>`.» Se decide con la salida impresa `falta=`, no con el código: si el lanzador no está instalado, no imprime `falta=` y el paso se omite.
- La viñeta crece como máximo 241 B netos (7382 + 241 = 7623, el tope de esta skill). Si no cabe, se acorta la propia viñeta, nunca otro texto de la skill.
- El `Registro:` de ese cierre usa `resultado=bloqueada; causa=otra`, ya cubierto por «Línea de registro»; no se agrega texto para eso.
- Manifiesto: `FRASES_LECTURA_EXTRA` no se toca; se agrega, antes de `FRASES_POR_ARCHIVO`, `export const FRASES_ENTORNO = { 'ejecutar-tarea': ['entorno.mjs', 'BLOQUEO: rol=franco; motivo=entorno:'] }` y `'skills/ejecutar-tarea'` agrega `...FRASES_ENTORNO['ejecutar-tarea']`.
- Tope: `TOPES` agrega `{ ruta: 'skills/ejecutar-tarea/SKILL.md', tope: 7623, opcional: false }`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: los tres archivos nombrados.
Fuera de alcance: `agentes/constructor.md` (no puede crecer), la línea `Bloqueo:` en `registrar.mjs` (feature F32), `formato-evidencia.mjs`, cualquier otro tope existente, `definitions/`.

## Pasos
1. En `SKILL.md`, agrega la viñeta de *Decisiones ya tomadas* bajo el punto 1.
2. Mide con `wc -c skills/ejecutar-tarea/SKILL.md`; debe ser ≤ 7623.
3. En `frases-por-archivo.mjs`, agrega `FRASES_ENTORNO` y la propagación.
4. En `topes-bytes.test.mjs`, agrega la entrada nueva.
5. Corre la verificación.

## Criterios de aceptación
1. La skill no pasa de 7623 B y `agentes/constructor.md` sigue en 3008 B; se comprueba con `wc -c`.
2. Las dos frases están en la skill y en el manifiesto y no aparece ningún fallo nuevo (solo los 6 preexistentes); se comprueba con `node --test` de los contratos y los topes.
3. Los topes existentes no cambiaron; se comprueba con `grep -c "ruta:"` → `10`.

## Verificación
```
wc -c skills/ejecutar-tarea/SKILL.md agentes/constructor.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
grep -c "ruta:" pruebas/comprobaciones/topes-bytes.test.mjs
```
Esperado: un tamaño ≤ `7623` para la skill y `3008` para el agente; `ℹ fail 6`: exactamente los 6 fallos preexistentes ajenos a F31 («falta la lectura acotada en constructor» y «… en ejecutar-tarea», «un agente conserva la línea de modelos.json», «WORKFLOW.md conserva la frase sobre modelos.json», «WORKFLOW.md pasa de 30720 caracteres», «los archivos reales cumplen la regla») y ningún título `✖` nuevo; `10`.

## Evidencia

```
$ wc -c skills/ejecutar-tarea/SKILL.md agentes/constructor.md
    7613 skills/ejecutar-tarea/SKILL.md
    3008 agentes/constructor.md
   10621 total
exit 0
```

Tamaño de la skill 7613 / tope 7623 (margen 10 B); `agentes/constructor.md` sigue en 3008 B, sin tocar.

```
$ grep -n "7623" pruebas/comprobaciones/topes-bytes.test.mjs
22:  { ruta: 'skills/ejecutar-tarea/SKILL.md', tope: 7623, opcional: false },
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 151
ℹ pass 145
ℹ fail 6
exit 0
```

El `exit 0` es el de `grep`, último del pipe. Anotación: `ℹ fail 6` son los 6 fallos preexistentes ajenos a F31; ningún `✖` nuevo. Títulos (misma salida en ambas pasadas):

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs 2>&1 | grep -E "^✖"
✖ los archivos reales cumplen la regla (2.240375ms)
✖ falla si un agente conserva la línea de modelos.json (1.184917ms)
✖ falla si falta la lectura acotada en constructor (1.05125ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (0.660333ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (1.050875ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.335458ms)
✖ failing tests:
✖ los archivos reales cumplen la regla (2.240375ms)
✖ falla si un agente conserva la línea de modelos.json (1.184917ms)
✖ falla si falta la lectura acotada en constructor (1.05125ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (0.660333ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (1.050875ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.335458ms)
exit 0
```

```
$ grep -c "ruta:" pruebas/comprobaciones/topes-bytes.test.mjs
10
exit 0
```

## Notas
- Bloqueo previo: el *Esperado* pedía `ℹ fail 0`, inalcanzable con 6 fallos preexistentes; el planificador lo corrigió a `ℹ fail 6` con esos títulos.
- Corrida 2 (yolo, sin rama ni switch, código no rehecho): pasadas 1 y 2 de la Verificación con la misma salida (`ℹ tests 151`, `ℹ pass 145`, `ℹ fail 6`), sin `✖` nuevos. El `exit` de `node` no se capturó porque va en pipe; el del `grep` es 0.
- Rápida (`bash pruebas/rapida.sh`, sale 1 como se espera): `ℹ tests 590`, `ℹ pass 583`, `ℹ fail 7`; coincide con la base (los 7 nombres conocidos, F26 incluido).
- Cambios de la tarea (corrida 1, sin cambios en la 2): `skills/ejecutar-tarea/SKILL.md` 7382 → 7613 B; `frases-por-archivo.mjs` (`FRASES_ENTORNO`); `topes-bytes.test.mjs` (entrada 7623). `agentes/constructor.md` sin tocar. Sin commit, push ni switch.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=falla; huecos=0; resultado=bloqueada; causa=verificacion_x2
Registro: n=2; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
