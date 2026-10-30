# task-05 — Contrato del constructor: reglas de yolo, con control negativo
repo: Flucastr.AI   depende_de: task-01   estado: hecha

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

Rama (`git branch --show-current`): `feature/F06-modo-yolo`, igual a la de la tarea; no hubo `git switch`.
Dependencia: `features/F06-modo-yolo/task-01-constructor-en-yolo.md` tiene `estado: hecha`.
Textos reales: `agentes/constructor.md` y `skills/ejecutar-tarea/SKILL.md` contienen `Modo yolo: activo`, `no creas rama`, `no emites `CONFIRMAR:``, `ni local` y `salta este paso entero`, con `Modo yolo: activo` antes de `git switch -c` en la skill.

Comando: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs`
Salida (final):
```
ℹ tests 17
ℹ suites 0
ℹ pass 17
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
EXIT=0
```
Pruebas nuevas en esa salida: `rechaza regla 13: falta «Modo yolo: activo», «no creas rama», «no emites `CONFIRMAR:`» o «ni local» en el constructor` ✔, `rechaza regla 14: falta «Modo yolo: activo», «salta este paso entero», «no emites `CONFIRMAR:`» o «ni local» en la skill` ✔, `rechaza la regla 14 si «Modo yolo: activo» aparece después de «git switch -c» en la skill` ✔, y `los textos reales del constructor y de ejecutar-tarea cumplen todas las reglas` ✔.

Comando: `bash pruebas/rapida.sh`
Última línea de salida: `rapida: 16 archivos en 27 s (tope 30 s)`; código de salida 0. Resumen: 133 pruebas, `pass 133`, `fail 0`.

Comando: `git status --short pruebas/comprobaciones`
Salida:
```
 M pruebas/comprobaciones/contrato-constructor.mjs
 M pruebas/comprobaciones/contrato-constructor.test.mjs
```

Criterios de aceptación:
1. Textos reales cumplen todas las reglas: cumplido (prueba «los textos reales…» ✔, `fail 0`).
2. Borrar frases de las reglas 13 o 14 produce error: cumplido (variantes «regla 13» y «regla 14» ✔).
3. `Modo yolo: activo` después de `git switch -c` produce error de la regla 14: cumplido (prueba de orden ✔; el error empieza por `Regla 14 `).
4. Verificación rápida pasa: cumplido (`rapida: 16 archivos en 27 s (tope 30 s)`, código 0).

Sin commit, push, PR, merge ni despliegue. `definitions/STATUS.md` no se tocó.

## Notas
- Cambios de código: en `pruebas/comprobaciones/contrato-constructor.mjs` se añadieron las reglas 13 y 14 al final de `REGLAS`, con las frases y `despuesDe` exactos de la tarea. En `pruebas/comprobaciones/contrato-constructor.test.mjs` se añadieron las variantes «regla 13» y «regla 14» al arreglo `variantes` y la prueba de orden de la regla 14. Sin huecos ni decisiones menores; no se modificó `agentes/` ni `skills/`.
- `bash pruebas/rapida.sh` imprimió «Entorno conservado: .../pruebas/.temporales/capa1-…»; es salida normal de esa comprobación, no un cambio de este encargo.
- Tiempo de la verificación rápida: 27 s sobre tope de 30 s; queda margen acotado, a vigilar si crecen las comprobaciones.
