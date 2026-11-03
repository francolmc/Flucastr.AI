# task-04 — `planificador`: el puntero reemplaza la prohibición, sin subir el tope
repo: Flucastr.AI   depende_de: task-03   estado: borrador

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

## Notas
