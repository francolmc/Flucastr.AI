# task-07 — Refuerzo de control-consumo ante excedido
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Reduce en `skills/control-consumo/SKILL.md` las tres fallas observadas en Claude Code (claude-sonnet-5-5) sin que ninguna llegara a la regla de la letra: (1) no escribió la Escalación («me falta información para decidir el paso siguiente»); (2) dijo que Bash estaba negado, probablemente por usar otra forma del comando de chequeo; (3) escribió un ítem de 183 caracteres (tope 150) y su validador rechazó `STATUS.md`. El texto debe servir igual a Pi y a Claude Code.

## Contexto
- Tocar: `skills/control-consumo/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/control-consumo-letras.test.mjs`
- La skill pesa 3496 bytes (tope 4096 en `pruebas/comprobaciones/topes-bytes.test.mjs`). El manifiesto: bloque `'skills/control-consumo'`, líneas 143-159. El test (7 pruebas) tiene `paso(texto, n)` (la línea `N. `), `validarLetras` y `mutar`.
- De `depende_de:` lee solo las *Notas* de task-06.
- Paso 3 de la skill hoy: «Al inicio de cada transición corre `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/Fxx-nombre` y lee solo la línea `Presupuesto Fxx: ...`.» Paso 5: describe la Escalación con letras A-D y termina con «Responde con una letra». Con `excedido` el chequeo sale con código 1 y Claude Code lo marca `is_error` (`Exit code 1`): es el resultado normal, no una falla.
- `lanzar-coordinador-claude.sh` solo permite `Bash(node ~/.flucastr-ai/validar-tarea.mjs *)`: cualquier `cd x && ...`, `;` o redirección cae fuera de ese patrón.
- `agentes/coordinador.md` está en 7168/7168 y NO se toca.
- Cada frase del manifiesto añade 1 prueba a `contrato-roles.test.mjs` (hoy 120).
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Paso 3: añade, tras el comando, la frase exacta «Escríbelo siempre igual, sin `cd`, `&&`, `;`, `2>&1` ni redirecciones. Con `estado=excedido` sale 1: es lo esperado, no un fallo.» (el ejecutor puede reordenar palabras fuera de las cinco frases clave de abajo).
- Paso 5: añade al inicio «Con `estado=excedido` SIEMPRE escribes la Escalación con las letras en esa misma transición; nunca «me falta información».» y, cerca del final, el ejemplo corto «Cada ítem ≤150 caracteres, p. ej. `A) ampliar tope arq en 1 (amp_arq=1)`.»
- Las cinco frases clave (van exactas en la skill y en el manifiesto): `sin `cd`, `&&`, `;`, `2>&1` ni redirecciones`; `sale 1: es lo esperado`; `SIEMPRE escribes la Escalación con las letras`; `nunca «me falta información»`; `A) ampliar tope arq en 1 (amp_arq=1)`.
- Si la skill supera 4096 bytes, recorta palabras ajenas a esas cinco frases y a lo ya cubierto por el manifiesto; no subas el tope ni muevas texto al coordinador.
- Pruebas de contrato: amplía `validarLetras` y añade 2 pruebas: una que quita «sin `cd`...» del paso 3 (un error que cite «paso 3») y otra que quita «SIEMPRE escribes la Escalación con las letras» del paso 5 (un error que cite «paso 5»); ambas con `mutar`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: los tres archivos de *Contexto*.
Fuera de alcance: `agentes/`, `definitions/`, `scripts/`, los lanzadores, otras skills, y lanzar modelos. Si las pruebas de task-06 muestran que Bash fue denegado incluso con la forma exacta, eso es un hallazgo de permisos del lanzador para Franco: se anota en *Notas*, no se corrige aquí.

## Pasos
1. Edita los pasos 3 y 5 de la skill según *Decisiones*; mide `wc -c`.
2. Añade las cinco frases al bloque `'skills/control-consumo'` del manifiesto.
3. Amplía `validarLetras` y añade las 2 pruebas.
4. Corre la *Verificación*.

## Criterios de aceptación
1. `wc -c < skills/control-consumo/SKILL.md` ≤ 4096.
2. `control-consumo-letras.test.mjs` da `ℹ tests 9` y `ℹ fail 0`.
3. `contrato-roles.test.mjs` da `ℹ tests 125` y `ℹ fail 0`; `topes-bytes.test.mjs` da `ℹ tests 23` y `ℹ fail 0`.
4. `git status --short agentes` no imprime nada.
5. `bash pruebas/rapida.sh` da `ℹ tests 741` y `ℹ fail 6` (ajenos).

## Verificación
```
wc -c < skills/control-consumo/SKILL.md | tr -d ' '
node --test pruebas/comprobaciones/control-consumo-letras.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
git status --short agentes
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
```
Esperado: un número ≤ 4096; `ℹ tests 9` y `ℹ fail 0`; `ℹ tests 148` (125 + 23) y `ℹ fail 0`; salida vacía; `ℹ tests 741` y `ℹ fail 6` (la rápida sale 1 mientras haya fallos conocidos).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia
```
$ wc -c < skills/control-consumo/SKILL.md | tr -d ' '
3832
exit 0
```

```
$ node --test pruebas/comprobaciones/control-consumo-letras.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 9
ℹ fail 0
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 148
ℹ fail 0
exit 0
```

```
$ git status --short agentes
(salida vacía)
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 741
ℹ fail 6
exit 0
```

## Notas
- Hueco menor 1: la frase del paso 3 va en la misma línea, tras el comando (la tarea no fija la posición).
- Hueco menor 2: «SIEMPRE escribes…» va al inicio del paso 5, antes de «Con `estado=excedido` no delegas.»; el ejemplo «Cada ítem ≤150 caracteres…» va antes de «Termina con».
- Hueco menor 3: la skill queda en 3832 B (≤4096), sin recorte. La segunda pasada se corrió con `bash -c` para leer el código de salida (zsh no expone `PIPESTATUS`); los pipelines salen 0 por `grep`. `pruebas/rapida.sh` solo sale 1 por los 6 fallos ajenos.
- Pruebas: `validarLetras` comprueba ahora la frase de paso 3 y la de paso 5; se añadieron 2 pruebas con `mutar` (paso 3 «sin `cd`…», paso 5 «SIEMPRE escribes…»). Manifiesto: 5 frases nuevas en `skills/control-consumo`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
