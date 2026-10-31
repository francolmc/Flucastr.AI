# task-05 — Línea de lectura acotada en `constructor` y `ejecutar-tarea`
repo: Flucastr.AI   depende_de: task-03   estado: borrador

## Descripción
Agregar una línea de lectura acotada al `constructor` y a la skill `ejecutar-tarea`: leer con `offset`/`limit` y búsquedas estrechas, no releer lo ya leído, y modificar archivos con `edit` en vez de reescribirlos enteros con `write`. Reduce contexto reenviado (sondeo Pi, palanca 3).

## Contexto
- Leído: `agentes/constructor.md` (secciones Límites, Skill, Cómo trabajas) y `skills/ejecutar-tarea/SKILL.md` (Antes de empezar, Ejecución, Cuándo detenerte, Al terminar bien, Línea de registro).
- Comprobador que fija frases de ambos: `pruebas/comprobaciones/contrato-constructor.mjs` (15 reglas: `estado: aprobada`, `Nunca escribes \`hecha\``, `BLOQUEO:`, `CONFIRMAR:`, `Registro: n=<n>; …`, etc.). Ninguna debe alterarse.
- Fundamento: `pruebas/resultados/2026-10-31-sondeo-consumo-pi.md` P5 y palanca 3: `read` con tope de 2000 líneas o 50 KB y `offset`/`limit`; `write` y `edit` ponen el contenido de la llamada en el contexto; los topes no son configurables.
- Depende de task-03 porque ambas tocan `agentes/constructor.md`.
- Son dos archivos Markdown con el mismo texto: un solo objetivo.

## Decisiones ya tomadas
- Texto literal, igual en ambos archivos: «**Lectura acotada:** lee archivos grandes por tramos con `offset` y `limit`, usa `grep` con patrón estrecho y `limit`, no releas lo que ya leíste y modifica archivos con `edit` en vez de reescribirlos enteros con `write`.»
- En `agentes/constructor.md`: párrafo propio, justo antes de la línea «Cierra con un resumen de cinco líneas».
- En `skills/ejecutar-tarea/SKILL.md`: viñeta nueva como paso 5 de «Ejecución».
- No se cambia ninguna otra regla ni el orden de las existentes.

## Alcance / Fuera de alcance
Alcance: la línea en los dos archivos.
Fuera de alcance: las demás skills y agentes, reportes breves de subagentes, el comprobador (task-06), `README.md`.

## Pasos
1. Insertar la línea en `agentes/constructor.md`. Resultado: `grep -c "Lectura acotada" agentes/constructor.md` → 1.
2. Insertar la línea en `skills/ejecutar-tarea/SKILL.md`. Resultado: `grep -c "Lectura acotada" skills/ejecutar-tarea/SKILL.md` → 1.
3. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. Ambos archivos contienen literal «Lectura acotada» y «`edit` en vez de reescribirlos enteros con `write`» (`grep -c`).
2. `node --test pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs` termina con `fail 0`.
3. `git diff --stat` de esta tarea muestra solo esos dos archivos.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c "Lectura acotada" agentes/constructor.md skills/ejecutar-tarea/SKILL.md
node --test pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: `1` por archivo; `fail 0` (no ejecutado tras el cambio).

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
