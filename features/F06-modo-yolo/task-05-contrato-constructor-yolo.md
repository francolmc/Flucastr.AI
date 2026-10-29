# task-05 — Contrato del constructor: reglas de yolo, con control negativo
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

## Descripción
`pruebas/comprobaciones/contrato-constructor.mjs` verifica por frases literales el contrato de `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md`. Esta tarea añade las reglas que dejó task-01 (yolo: sin rama, sin `git switch`, sin `CONFIRMAR:`, sin commit) para que un cambio futuro que las borre, o que ponga el sub-bullet de yolo después de la resolución de rama, falle la verificación rápida. Va acompañada de variantes negativas.

## Contexto
- Repo: este, único repo. Node, ESM, `node:test`, sin dependencias. Leídos: `pruebas/comprobaciones/contrato-constructor.mjs` (arreglo `REGLAS` de objetos `{ n, sobre: 'constructor'|'skill', frases, despuesDe?, regex?, mensajeRegex? }`; hoy llega a la regla 12; `despuesDe: [primera, segunda]` da error si `segunda` aparece antes que `primera`, usando la primera aparición de cada frase) y `pruebas/comprobaciones/contrato-constructor.test.mjs` (prueba de textos reales, arreglo `variantes` `[nombre, sobre, frases]` que borra cada frase con `replace` y exige al menos un error, y una prueba de orden para la regla 11).
- Las frases las fijó task-01 en sus *Decisiones ya tomadas*. Esta tarea no puede correrse antes de que task-01 esté `hecha`.
- Archivos a tocar: `pruebas/comprobaciones/contrato-constructor.mjs` y `pruebas/comprobaciones/contrato-constructor.test.mjs`. Comando: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs`.

## Decisiones ya tomadas
- Dos reglas nuevas al final de `REGLAS`, numeradas a continuación de la última existente (hoy 13 y 14):
  - Regla 13, sobre `constructor`: frases `Modo yolo: activo`, `no creas rama`, ``no emites `CONFIRMAR:` `` y `ni local`.
  - Regla 14, sobre `skill`: frases `Modo yolo: activo`, `salta este paso entero`, ``no emites `CONFIRMAR:` `` y `ni local`, y `despuesDe: ['Modo yolo: activo', 'git switch -c']` (el sub-bullet de yolo va antes de resolver la rama).
- Si al empezar la última regla existente no es la 12, se numeran a continuación de la última; los títulos de las pruebas no fijan cuántas reglas hay.
- Variantes negativas nuevas en `variantes` del test: una por regla nueva (13 y 14), con el formato `['regla N: falta … en …', sobre, [frases]]`. Más una prueba de orden: en la skill, reemplazar la primera aparición de `Modo yolo: activo` por `X` y añadir `Modo yolo: activo` al final del texto hace que la regla 14 dé error (mismo patrón que la prueba de la regla 11).
- No se modifican `agentes/` ni `skills/`; si una frase falta porque task-01 no la escribió, es un fallo de task-01: `BLOQUEO: rol=planificador; motivo=…`.

## Alcance / Fuera de alcance
Alcance: las dos reglas nuevas, sus dos variantes y la prueba de orden.
Fuera de alcance: reescribir las reglas existentes, `contrato-roles.mjs` (task-06), `constructor-resultado.mjs` (task-07), el coordinador, el lanzador.

## Pasos
1. Añadir las reglas 13 y 14 a `REGLAS` en `contrato-constructor.mjs`. Resultado: `validarConstructor` con los textos reales devuelve `[]`.
2. Añadir dos variantes al arreglo `variantes` del test. Resultado: ambas pasan (el validador rechaza el texto alterado).
3. Añadir la prueba de orden de la regla 14. Resultado: el error empieza por `Regla 14 `.
4. Correr la *Verificación*.

## Criterios de aceptación
1. Los textos reales cumplen todas las reglas. Se comprueba con la prueba «los textos reales…» (`fail 0`).
2. Borrar cualquiera de las frases de las reglas 13 o 14 produce al menos un error. Se comprueba con las dos variantes nuevas.
3. Poner `Modo yolo: activo` después de `git switch -c` en la skill produce error de la regla 14. Se comprueba con la prueba de orden.
4. La verificación rápida pasa. Se comprueba con la segunda orden de *Verificación*.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
bash pruebas/rapida.sh
git status --short pruebas/comprobaciones
```
Esperado: la primera con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la tercera muestra `contrato-constructor.mjs` y `contrato-constructor.test.mjs` entre los cambios.

## Evidencia

## Notas
