# task-03 — `arquitecto`: el puntero reemplaza la prohibición, sin subir el tope
repo: Flucastr.AI   depende_de: task-02   estado: borrador

## Descripción
La prohibición «No lees `features/` ni tareas» pasa a llevar la excepción en la misma frase: «salvo `lectura-extra`». Así el agente que se bloqueaba por esa línea sabe qué skill cargar. `agentes/arquitecto.md` está a 3 B de su tope (3581 de 3584): se compensa quitando una frase redundante, sin subir ningún tope.

## Contexto
- Tocar: `agentes/arquitecto.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Línea a cambiar (confirmado), `agentes/arquitecto.md` línea 54: «- No lees `features/` ni tareas.» en «## Lectura acotada».
- Línea a recortar (confirmado), línea 8: «…decidir la estructura y dibujar la arquitectura. No construyes nada.» La frase final « No construyes nada.» (20 B con el espacio inicial) es redundante con «## Límites» (línea 21: «No escribes código de producto…»). Ninguna prueba ni manifiesto la cita (`grep` en `pruebas/`, `scripts/`, `skills/` y `README.md`: sin resultados).
- Medido (confirmado): el añadido « salvo `lectura-extra`» pesa 22 B; 3581 + 22 − 20 = 3583 B (tope 3584, `pruebas/comprobaciones/topes-bytes.test.mjs`).
- En `frases-por-archivo.mjs` la lista `FRASES_LECTURA_EXTRA` la creó task-02; `'agentes/arquitecto'` (líneas 75–78) usa `...FRASES_LECTURA_F22.arquitecto`, cuya frase `No lees \`features/\` ni tareas` se conserva como subcadena.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «Dónde vive el texto»

## Decisiones ya tomadas
- Línea nueva, literal: «- No lees `features/` ni tareas salvo `lectura-extra`.»
- Recorte: borrar solo « No construyes nada.» al final del párrafo de la línea 8. No se recorta nada más.
- En `FRASES_LECTURA_EXTRA` se agrega la clave `arquitecto: ['No lees `features/` ni tareas salvo `lectura-extra`']` y `'agentes/arquitecto'` la propaga con `...FRASES_LECTURA_EXTRA.arquitecto`.
- Prohibido subir cualquier tope de `topes-bytes.test.mjs`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: una línea cambiada, una frase recortada y una frase nueva en el manifiesto.
Fuera de alcance: las demás reglas de `arquitecto.md`, `topes-bytes.test.mjs`, `definitions/`, otros agentes.

## Pasos
1. En `agentes/arquitecto.md` reemplaza la línea 54 por la línea nueva de *Decisiones ya tomadas*.
2. En el mismo archivo borra « No construyes nada.» de la línea 8.
3. Agrega la clave `arquitecto` a `FRASES_LECTURA_EXTRA` y la propagación en `'agentes/arquitecto'`.
4. Mide con `wc -c` y corre las pruebas.

## Criterios de aceptación
1. `agentes/arquitecto.md` mide como máximo 3584 B; se comprueba con `wc -c`.
2. La línea nueva existe y `No lees \`features/\` ni tareas` sigue presente; se comprueba con `grep -c`.
3. `topes-bytes` y `contrato-roles` pasan sin cambiar topes; se comprueba con `node --test`.
4. « No construyes nada.» ya no está; se comprueba con `grep -c`.

## Verificación
```
wc -c < agentes/arquitecto.md
grep -c "No lees \`features/\` ni tareas salvo \`lectura-extra\`" agentes/arquitecto.md
grep -c "No construyes nada" agentes/arquitecto.md
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: un número ≤ 3584 (3583); `1`; `0`; `ℹ fail 0`.

## Evidencia

## Notas
