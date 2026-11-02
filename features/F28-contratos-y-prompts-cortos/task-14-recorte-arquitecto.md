# task-14 — Recortar agentes/arquitecto.md a 3584 bytes
repo: Flucastr.AI   depende_de: task-13   estado: hecha

## Descripción
El `arquitecto` mide 4195 B. Sus seis principios y la tabla de skills admiten redacción más corta, y el detalle ya vive en `definir-proyecto`, `revisar-proyecto-existente`, `disenar-arquitectura` y `generar-clonar`. Esta tarea lo lleva a 3584 B sin quitar las frases de una sola pasada ni de lectura acotada, y baja su tope en la prueba de bytes. Es la última tarea de F28 que se puede construir sin tocar `definitions/`.

## Contexto
- Tocar: `agentes/arquitecto.md`, `pruebas/comprobaciones/topes-bytes.test.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- `agentes/arquitecto.md` (4195 B): `## Principios de razonamiento` (6 puntos), `## Límites`, `## Skills disponibles` (tabla de 4 filas), `## Cómo trabajas`, `## Una sola pasada`, `## Lectura acotada`, `## Antes de entregar` (4 viñetas).
- Frases exigidas (manifiesto de `frases-por-archivo.mjs`): de F27, `Una sola pasada por puerta`, `devuelves el documento y nada más`, `no reabres preguntas ni propones otra ronda`, `Otra ronda solo si Franco la pide`, `Decisiones para Franco`, `Tope de tamaño: 12288 bytes` y `Tamaño de la pasada: <n> bytes`; de F22, `una vez por sesión` y «No lees features/ ni tareas». `contrato-roles.mjs` regla 4 exige las cuatro skills entre comillas invertidas.
- Lee solo las *Notas* de task-13.

## Decisiones ya tomadas
- Se recorta solo redacción: cada principio a una línea (conservando las tres marcas *confirmado*, *inferido* y *supuesto* y la regla «máximo cinco preguntas»), la tabla de skills a cuatro viñetas, y `## Antes de entregar` a dos viñetas más la frase de cierre «di qué sigue».
- No se tocan `## Una sola pasada` ni `## Lectura acotada`.
- El tope de `agentes/arquitecto.md` en `topes-bytes.test.mjs` pasa a 3584.
- Si no se llega a 3584 B sin quitar una regla, la tarea queda `bloqueada` con `PARCIAL:` y la cifra lograda.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un agente y una constante de prueba.
Fuera de alcance: las skills del `arquitecto`, los otros agentes, la medición con `consumo.mjs` (la hace Franco) y todo lo de `definitions/`.

## Pasos
1. Recorta `agentes/arquitecto.md` por secciones, midiendo con `wc -c`.
2. Corre `contrato-roles.test.mjs` y arregla lo que falle sin copiar frases de otro lado.
3. Cambia el tope a 3584 en `topes-bytes.test.mjs`.
4. Corre la prueba de bytes y la rápida.

## Criterios de aceptación
1. `agentes/arquitecto.md` mide 3584 B o menos.
2. `contrato-roles.test.mjs` y `topes-bytes.test.mjs` dan `ℹ fail 0`.
3. Las siete frases de una sola pasada siguen en el archivo (control del manifiesto).
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
test $(wc -c < agentes/arquitecto.md) -le 3584 && echo "ok-arquitecto"; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -c -e 'Una sola pasada por puerta' -e 'Otra ronda solo si Franco la pide' -e 'Tope de tamaño: 12288 bytes' agentes/arquitecto.md; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ok-arquitecto`, `ℹ fail 0`, un conteo con `exit 0` y `ℹ fail 7`.

## Evidencia

```
$ test $(wc -c < agentes/arquitecto.md) -le 3584 && echo "ok-arquitecto"; echo "exit $?"
ok-arquitecto
exit 0
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
exit 0
```

```
$ grep -c -e 'Una sola pasada por puerta' -e 'Otra ronda solo si Franco la pide' -e 'Tope de tamaño: 12288 bytes' agentes/arquitecto.md; echo "exit $?"
2
exit 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
exit 0
```

## Notas
- Recorte solo de redacción en `agentes/arquitecto.md`: 4195 B a 3581 B. Los seis principios quedan en una línea cada uno, conservando *confirmado*, *inferido*, *supuesto* y «Máximo cinco por turno»; la tabla de skills pasa a cuatro viñetas; `## Antes de entregar` pasa a dos viñetas más «di qué sigue». `## Una sola pasada`, `## Lectura acotada` y el frontmatter no cambiaron.
- Siguen las siete frases de «Una sola pasada», «una vez por sesión» y «No lees `features/` ni tareas». Las cuatro skills siguen entre comillas invertidas.
- Tope de `agentes/arquitecto.md` en `topes-bytes.test.mjs`: 4300 pasa a 3584. El tope de hoy era 4300; el archivo medía 4195 B.
- `grep -c` da 2 porque «Una sola pasada por puerta» y «Otra ronda solo si Franco la pide» están en la misma línea; las tres frases están.
- Sin huecos menores.
Resultado final: verificación en una pasada, `arquitecto.md` en 3581 B con tope 3584, `ℹ fail 0` en la prueba de roles y bytes, y `ℹ fail 7` en la rápida.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
