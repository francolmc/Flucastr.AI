# task-05 — descomponer-feature: tarea de corrección ante un bloqueo de código
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Con el paso 9 de `control-consumo` (task-03), un `BLOQUEO: rol=constructor; motivo=codigo:` se delega al `planificador` para que escriba una tarea de corrección. La skill `descomponer-feature` no dice cómo hacerlo: esta tarea añade la regla en una frase, sin tocar `agentes/planificador.md` (3576 de 3584 B).

## Contexto
- Tocar: `skills/descomponer-feature/SKILL.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- De `depende_de:` lee solo las *Notas* de task-04.
- En `skills/descomponer-feature/SKILL.md` (6199 B hoy): paso 3 de «Pasos» (línea 20).
- En `pruebas/comprobaciones/frases-por-archivo.mjs`: el bloque `'skills/descomponer-feature': [` (línea 157).
- Tope de bytes: `skills/descomponer-feature/SKILL.md` ≤ 6400; no se cambia.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Edición. Antes (línea 20): `3. Escribe cada tarea en `features/Fxx-nombre/task-NN-nombre.md` con la plantilla de abajo, estado `borrador`.` Después: la misma línea seguida de ` Con `Disparó: BLOQUEO task-NN` y `motivo=codigo:` escribe solo una tarea de corrección nueva en la misma feature, sin tocar la bloqueada.`
- Resultado medido en una copia de trabajo con exactamente esa edición: 6339 B (tope 6400).
- La tarea de corrección sigue la plantilla y el refinado no aplica; su `depende_de:` es `—` (la bloqueada vuelve a `aprobada` cuando la de corrección esté `hecha`; eso lo lleva el `coordinador`).
- Manifiesto: en `'skills/descomponer-feature'` añade la frase `'escribe solo una tarea de corrección nueva'`; conserva las demás.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: una edición en la skill y una frase en el manifiesto.
Fuera de alcance: `agentes/`, otras skills, `scripts/`, `definitions/`.

## Pasos
1. Lee las *Notas* de task-04.
2. Aplica la edición con `Edit` en `skills/descomponer-feature/SKILL.md`.
3. Añade la frase al manifiesto.
4. Mide con `wc -c` y corre la *Verificación*.

## Criterios de aceptación
1. `wc -c < skills/descomponer-feature/SKILL.md` imprime un valor ≤ 6400 (esperado 6339).
2. `node --test pruebas/comprobaciones/topes-bytes.test.mjs` da `ℹ tests 23` y `ℹ fail 0`.
3. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` da `ℹ tests 114` y `ℹ fail 0` (tras task-04 son 113; +1 frase).
4. `bash pruebas/rapida.sh` da `ℹ fail 6` (los mismos ajenos).

## Verificación
```
wc -c < skills/descomponer-feature/SKILL.md | tr -d ' '; echo "exit $?"
node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
```
Esperado: `6339`; `ℹ tests 23` y `ℹ fail 0`; `ℹ tests 114` y `ℹ fail 0`; `ℹ fail 6` con `ℹ tests` igual a 682 más los nuevos de tareas 01 a 04 más 1 (base medida el 2026-11-03: 682 tests, 6 fail ajenos). Cada `exit` es el del último comando de su línea (0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia
```
$ wc -c < skills/descomponer-feature/SKILL.md | tr -d ' '; echo "exit $?"
6339
exit 0
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 23
ℹ fail 0
exit 0
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 114
ℹ fail 0
exit 0
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 702
ℹ fail 6
exit 0
```

## Notas
- Entorno: `node ~/.flucastr-ai/entorno.mjs` imprime `ok`; `Requiere: runtime:node@25` cumplido.
- Edición aplicada tal como dice «Decisiones ya tomadas»: SKILL.md 6199 → 6339 B (tope 6400). Frase añadida al manifiesto en `'skills/descomponer-feature'`, detrás de «Modo yolo: activo»; las demás se conservan.
- Hueco menor: `rapida.sh` da `ℹ tests 702`; el criterio no fija la cifra (solo `ℹ fail 6`), y no recalculé la fórmula 682 + tareas 01 a 04 + 1. Es +1 respecto de los 701 medidos en task-04, coherente con la frase nueva.
- Una pasada completa de *Verificación*, todos los criterios pasan.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
