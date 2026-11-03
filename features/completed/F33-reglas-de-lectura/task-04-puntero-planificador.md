# task-04 — `planificador`: el puntero reemplaza la prohibición, sin subir el tope
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
La prohibición «No lees tareas de otras features ni tareas `hecha`» pasa a incluir «salvo `lectura-extra`». `agentes/planificador.md` está a 3 B de su tope (3581 de 3584): se compensa recortando una cláusula redundante, sin subir ningún tope.

## Contexto
- Tocar: `agentes/planificador.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Línea a cambiar (confirmado), `agentes/planificador.md` línea 58 en «## Lectura acotada»: «- No lees tareas de otras features ni tareas `hecha`.»
- Línea a recortar (confirmado), línea 8: «Ordenas el backlog y redactas tareas; no construyes ni apruebas.» La cláusula «; no construyes ni apruebas» (27 B) repite lo que dicen «## Límites» (líneas 20–25: no código de producto, no `aprobada` ni `hecha`). Ninguna prueba ni manifiesto la cita (`grep` en `pruebas/`, `scripts/`, `skills/` y `README.md`: sin resultados).
- Medido (confirmado): el añadido « salvo `lectura-extra`» pesa 22 B; 3581 + 22 − 27 = 3576 B (tope 3584 en `topes-bytes.test.mjs`).
- `'agentes/planificador'` (`frases-por-archivo.mjs`, líneas 79–85) usa `...FRASES_LECTURA_F22.planificador`; la frase `No lees tareas de otras features ni tareas \`hecha\`` se conserva como subcadena.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «Dónde vive el texto»

## Decisiones ya tomadas
- Línea nueva, literal: «- No lees tareas de otras features ni tareas `hecha` salvo `lectura-extra`.»
- Recorte: la línea 8 queda «…Ordenas el backlog y redactas tareas.» (se borra solo «; no construyes ni apruebas»).
- En `FRASES_LECTURA_EXTRA` se agrega `planificador: ['No lees tareas de otras features ni tareas `hecha` salvo `lectura-extra`']` y `'agentes/planificador'` la propaga con `...FRASES_LECTURA_EXTRA.planificador`.
- Prohibido subir cualquier tope.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: una línea cambiada, una cláusula recortada y una frase nueva en el manifiesto.
Fuera de alcance: las demás reglas de `planificador.md` (incluida la línea «Con `crear-backlog`… lees completos»), `topes-bytes.test.mjs`, `definitions/`, otros agentes.

## Pasos
1. En `agentes/planificador.md` reemplaza la línea 58 por la línea nueva.
2. Borra «; no construyes ni apruebas» de la línea 8.
3. Agrega la clave `planificador` a `FRASES_LECTURA_EXTRA` y la propagación en `'agentes/planificador'`.
4. Mide con `wc -c` y corre las pruebas.

## Criterios de aceptación
1. `agentes/planificador.md` mide como máximo 3584 B; se comprueba con `wc -c`.
2. La línea nueva existe; se comprueba con `grep -c`.
3. `topes-bytes` y `contrato-roles` pasan sin cambiar topes; se comprueba con `node --test`.
4. «no construyes ni apruebas» ya no está; se comprueba con `grep -c`.

## Verificación
```
wc -c < agentes/planificador.md
grep -c "ni tareas \`hecha\` salvo \`lectura-extra\`" agentes/planificador.md
grep -c "no construyes ni apruebas" agentes/planificador.md
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: un número ≤ 3584 (3576); `1`; `0`; `ℹ fail 0`.

## Evidencia

Medido antes del cambio: `$ wc -c < agentes/planificador.md` → 3581 (tope 3584).

Pasada 1 (todos los comandos de *Verificación*):

```
$ wc -c < agentes/planificador.md
3576
exit 0
$ grep -c "ni tareas \`hecha\` salvo \`lectura-extra\`" agentes/planificador.md
1
exit 0
$ grep -c "no construyes ni apruebas" agentes/planificador.md
0
exit 1
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
[…recortado: 7 líneas «✔ control negativo sintético…» sin alterar valores…]
ℹ tests 116
ℹ suites 0
ℹ pass 116
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 112.879375
exit 0
```

Pasada 1: el `exit 0` del bloque anterior es el del `tail` del pipeline, no el de `node`; el código de `node` de la pasada 1 no quedó capturado y lo cubre la pasada 2.

Pasada 2 (repetición completa de la *Verificación*, con código de salida de `node` capturado aparte):

```
$ wc -c < agentes/planificador.md
3576
exit 0
$ grep -c "ni tareas \`hecha\` salvo \`lectura-extra\`" agentes/planificador.md
1
exit 0
$ grep -c "no construyes ni apruebas" agentes/planificador.md
0
exit 1
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
ℹ pass 116
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 181.527667
exit 0
```

(Salida de `node --test` de la pasada 2 con `tail -n 6`; el código 0 de `node` se capturó aparte: `exit node=0`.)

Criterios: 1 cumplido (3576 ≤ 3584); 2 cumplido (`grep -c` = 1); 3 cumplido (`ℹ fail 0`, topes sin cambiar); 4 cumplido (`grep -c` = 0; sale con código 1 por no tener coincidencias, resultado esperado).

## Notas
- Cambios: `agentes/planificador.md` línea 8 sin «; no construyes ni apruebas»; línea 58 reemplazada por «- No lees tareas de otras features ni tareas `hecha` salvo `lectura-extra`.»; `pruebas/comprobaciones/frases-por-archivo.mjs` (clave `planificador` en `FRASES_LECTURA_EXTRA` y propagación `...FRASES_LECTURA_EXTRA.planificador` en `'agentes/planificador'`, después de `...FRASES_LECTURA_F22.planificador`).
- Hueco menor: la tarea no decía en qué posición de `'agentes/planificador'` va la propagación; la puse al final del bloque. Sin efecto sobre las pruebas.
- Ningún tope cambiado; `topes-bytes.test.mjs` no se tocó.
- Modo yolo: no se creó rama, no hubo `git switch` ni commit; el trabajo queda en `feature/F33-reglas-de-lectura`. No se tocó `definitions/STATUS.md`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
