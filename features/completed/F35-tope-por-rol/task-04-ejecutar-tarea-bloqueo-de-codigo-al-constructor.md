# task-04 — ejecutar-tarea: bloqueo de código o verificación con rol=constructor
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
`skills/ejecutar-tarea/SKILL.md` solo nombra `rol=planificador` o `rol=arquitecto` para un `BLOQUEO:` por alcance, así que un defecto de código (en Memory-AI F05, un cliente HTTPS sin ruta) acabó tres veces en el `arquitecto`. Esta tarea añade el rol `constructor` con `motivo=codigo:` para defectos de código o de verificación del repo, incluida la cota `verificacion_x2`. El `coordinador` los enruta con el paso 9 de `control-consumo` (task-03). El archivo está a 19 B de su tope (7604 de 7623), así que lo que se añade se compensa quitando una frase redundante.

## Contexto
- Tocar: `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- De `depende_de:` lee solo las *Notas* de task-03.
- En `skills/ejecutar-tarea/SKILL.md`: la línea 41 «(para una escalación de alcance, ...)» en «Cuándo detenerte», y la línea 54 (viñeta `blocked` de «Retorno»).
- En `pruebas/comprobaciones/frases-por-archivo.mjs`: el bloque `'skills/ejecutar-tarea': [` (línea 166).
- Tope de bytes: `skills/ejecutar-tarea/SKILL.md` ≤ 7623 (`pruebas/comprobaciones/topes-bytes.test.mjs`); no se cambia.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Edición 1 (línea 41). Antes: `(para una escalación de alcance, `rol=planificador` o `rol=arquitecto` según toque), y debajo qué dejaste hecho. No sigas.` Después: `(alcance: `rol=planificador` o `rol=arquitecto`; defecto de código o verificación, con `verificacion_x2`: `rol=constructor; motivo=codigo: <causa>`), y debajo qué dejaste hecho. No sigas.`
- Edición 2 (línea 54). Antes: `- `blocked`: primera línea `BLOQUEO: rol=<rol>; motivo=<motivo>`, con la tarea bloqueada. La cota de verificación usa siempre este estado.` Después: `- `blocked`: primera línea `BLOQUEO: rol=<rol>; motivo=<motivo>`, con la tarea bloqueada.` (la cota ya dice en «Cuándo detenerte» que la respuesta empieza con `BLOQUEO:`).
- Resultado medido en una copia de trabajo con exactamente estas dos ediciones: 7619 B (tope 7623). Si el resultado difiere, el tope manda: recorta palabras de la edición 1, nunca subas el tope.
- Un defecto de código es el que se arregla editando archivos del repo de la tarea sin cambiar su alcance; sigue siendo `rol=planificador` o `rol=arquitecto` el cambio de alcance o de diseño, y los fallos de `git switch` (`rol=arquitecto`, paso 2 de «Antes de empezar») no se tocan.
- Manifiesto: en `'skills/ejecutar-tarea'` añade la frase `'rol=constructor; motivo=codigo: <causa>'`; conserva las que ya hay (`...FRASES_*`).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: dos ediciones en la skill y una frase en el manifiesto.
Fuera de alcance: `agentes/constructor.md` (3008 de 3072 B, no se toca), `agentes/coordinador.md`, `skills/control-consumo/`, `skills/descomponer-feature/`, `scripts/`, `definitions/`.

## Pasos
1. Lee las *Notas* de task-03.
2. Aplica con `Edit` las ediciones 1 y 2 en `skills/ejecutar-tarea/SKILL.md`.
3. Añade la frase al manifiesto.
4. Mide con `wc -c` y corre la *Verificación*.

## Criterios de aceptación
1. `wc -c < skills/ejecutar-tarea/SKILL.md` imprime un valor ≤ 7623 (esperado 7619).
2. `node --test pruebas/comprobaciones/topes-bytes.test.mjs` da `ℹ tests 23` y `ℹ fail 0`.
3. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` da `ℹ tests 113` y `ℹ fail 0` (tras task-03 son 112; +1 frase).
4. `grep -c 'rol=constructor; motivo=codigo:' skills/ejecutar-tarea/SKILL.md` imprime `1`.
5. `bash pruebas/rapida.sh` da `ℹ fail 6` (los mismos ajenos).

## Verificación
```
wc -c < skills/ejecutar-tarea/SKILL.md | tr -d ' '; echo "exit $?"
grep -c 'rol=constructor; motivo=codigo:' skills/ejecutar-tarea/SKILL.md; echo "exit $?"
node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
```
Esperado: `7619`; `1`; `ℹ tests 23` y `ℹ fail 0`; `ℹ tests 113` y `ℹ fail 0`; `ℹ fail 6` con `ℹ tests` igual a 682 más los nuevos de tareas 01 a 03 más 1 (base medida el 2026-11-03: 682 tests, 6 fail ajenos). Cada `exit` es el del último comando de su línea (0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia
```
$ wc -c < skills/ejecutar-tarea/SKILL.md | tr -d ' '; echo "exit $?"
7619
exit 0
$ grep -c 'rol=constructor; motivo=codigo:' skills/ejecutar-tarea/SKILL.md; echo "exit $?"
1
exit 0
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 23
ℹ fail 0
exit 0
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 113
ℹ fail 0
exit 0
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 701
ℹ fail 6
exit 0
```

## Notas
- Edición 1 (línea 41) y edición 2 (línea 54) aplicadas tal como dice «Decisiones ya tomadas»; SKILL.md 7604 → 7619 B (tope 7623).
- Frase añadida al manifiesto de `frases-por-archivo.mjs` en `'skills/ejecutar-tarea'`, detrás de los `...FRASES_*`.
- Hueco menor: `rapida.sh` da `ℹ tests 701`, no la cuenta de la fórmula; se toma la cifra medida (task-03 medía 700 antes de esta frase). `ℹ fail 6` coincide con los ajenos.
- Dos pasadas completas: la primera con los mismos comandos reescritos a mano, la segunda con el bloque exacto de *Verificación*; ambas pasan.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
