# task-05 — Línea de lectura acotada en `constructor` y `ejecutar-tarea`
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Agregar una línea de lectura acotada al `constructor` y a la skill `ejecutar-tarea`: leer por tramos con `offset`/`limit` y búsquedas estrechas, no releer lo ya leído, y modificar archivos con `edit` en vez de reescribirlos enteros con `write`. Reduce el contexto reenviado por turno (sondeo de consumo en Pi, palanca 3).

## Contexto
- Leído `agentes/constructor.md` (Límites, Skill, Cómo trabajas; termina con «Cierra con un resumen de cinco líneas…») y `skills/ejecutar-tarea/SKILL.md` (sección «Ejecución» con los pasos 1 a 4).
- Comprobadores que fijan frases de ambos: `pruebas/comprobaciones/contrato-constructor.mjs` y `contrato-roles.mjs`. Ninguna regla debe alterarse.
- Fundamento: `pruebas/resultados/2026-10-31-sondeo-consumo-pi.md` (P5 y palanca 3): `read` con tope de 2000 líneas o 50 KB y `offset`/`limit`; `write` y `edit` ponen el contenido de la llamada en el contexto.
- Depende de task-03 porque ambas tocan `agentes/constructor.md`.
- Dos archivos Markdown con el mismo texto: un solo objetivo.

## Decisiones ya tomadas
- Texto literal, igual en ambos archivos: «**Lectura acotada:** lee archivos grandes por tramos con `offset` y `limit`, usa `grep` con patrón estrecho y `limit`, no releas lo que ya leíste y modifica archivos con `edit` en vez de reescribirlos enteros con `write`.»
- En `agentes/constructor.md`: párrafo propio, justo antes de «Cierra con un resumen de cinco líneas».
- En `skills/ejecutar-tarea/SKILL.md`: paso 5 de «Ejecución», con el mismo texto.
- No se cambia ninguna otra regla ni el orden de las existentes.

## Alcance / Fuera de alcance
Alcance: la línea en los dos archivos.
Fuera de alcance: las demás skills y agentes, reportes breves de subagentes, `PI_CACHE_RETENTION`, el comprobador (task-06), `README.md`.

## Pasos
1. Insertar la línea en `agentes/constructor.md`. Resultado: `grep -c "Lectura acotada" agentes/constructor.md` → 1.
2. Insertar el paso 5 en `skills/ejecutar-tarea/SKILL.md`. Resultado: `grep -c "Lectura acotada" skills/ejecutar-tarea/SKILL.md` → 1.
3. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. Ambos archivos contienen literal «Lectura acotada» y «`edit` en vez de reescribirlos enteros con `write`» (`grep -c`).
2. `node --test pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs` termina con `fail 0`.
3. `git diff --stat` de esta tarea muestra solo esos dos archivos (más las eliminaciones de task-03 en `constructor.md`).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c "Lectura acotada" agentes/constructor.md skills/ejecutar-tarea/SKILL.md
grep -c "edit\` en vez de reescribirlos enteros con \`write\`" agentes/constructor.md skills/ejecutar-tarea/SKILL.md
node --test pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: `1` por archivo en ambos `grep`; `fail 0` (no ejecutado tras el cambio).

## Evidencia

Rama confirmada antes de empezar (no hubo switch): `git branch --show-current` → `feature/F18-identidad-y-prompts-livianos`.

Verificación de la tarea (`cd /Users/franco/Codes/flucastr/Flucastr.AI`):

```
$ grep -c "Lectura acotada" agentes/constructor.md skills/ejecutar-tarea/SKILL.md
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1
exit=0

$ grep -c "edit\` en vez de reescribirlos enteros con \`write\`" agentes/constructor.md skills/ejecutar-tarea/SKILL.md
agentes/constructor.md:1
skills/ejecutar-tarea/SKILL.md:1
exit=0

$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
ℹ tests 47
ℹ suites 0
ℹ pass 47
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 64.916791
```

Criterios de aceptación:
1. `grep -c` de «Lectura acotada» y de la frase con `edit`/`write`: 1 por archivo en ambos. Cumple.
2. `node --test` de los dos comprobadores: `fail 0` (47 de 47). Cumple.
3. `git diff --stat -- agentes/constructor.md skills/ejecutar-tarea/SKILL.md`:

```
 agentes/constructor.md         | 4 ++--
 skills/ejecutar-tarea/SKILL.md | 1 +
 2 files changed, 3 insertions(+), 2 deletions(-)
```

Los dos archivos son los únicos de esta tarea; las 2 eliminaciones de `constructor.md` son las de task-03 (línea de `modelos.json` y su línea en blanco). Cumple.

Verificación rápida (HOME real, `HOME=/Users/franco`, sin reinstalar nada):

```
$ bash pruebas/rapida.sh
ℹ tests 227
ℹ suites 0
ℹ pass 227
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 15269.805625
rapida: 22 archivos en 15 s (tope 30 s)
exit=0
```

Sin líneas `FALLA`. Corrida con el código de salida capturado (`exit=0`) en la segunda pasada; la primera, pasada por `tail`, dio el mismo resumen (227 pass, 0 fail).

## Notas
- Huecos menores: ninguno. La línea va como párrafo propio entre «Cómo trabajas» y «Cierra con un resumen…», y el paso 5 de «Ejecución» va después del paso 4, con el texto literal de *Decisiones ya tomadas*.
- `rapida.sh` se corrió dos veces (la segunda para capturar el código de salida); no era un paso de la tarea. Sus pruebas de instalación usan HOME temporal, como en task-03.
- No se tocó `definitions/STATUS.md`, ni la rama, ni hubo commit ni push.
- Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
