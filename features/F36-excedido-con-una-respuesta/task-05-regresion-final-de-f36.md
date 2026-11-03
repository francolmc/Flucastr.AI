# task-05 — Regresión final de F36
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Cierra F36 comprobando que el conjunto quedó coherente: topes de bytes respetados (en especial `control-consumo` ≤ 4096 y `agentes/coordinador.md` intacto en 7168), contratos de roles y de features verdes, la verificación rápida con solo los fallos ajenos de antes y ningún archivo fuera de alcance tocado. No añade comportamiento; solo deja la evidencia de regresión y, si algo falla por culpa de F36, lo anota sin corregirlo.

## Contexto
- Tocar: `features/F36-excedido-con-una-respuesta/task-05-regresion-final-de-f36.md`
- Solo se escribe *Evidencia* y *Notas* de esta tarea; ningún otro archivo.
- De `depende_de:` lee solo las *Notas* de task-04.
- Topes en `pruebas/comprobaciones/topes-bytes.test.mjs` (23 pruebas hoy): `skills/control-consumo/SKILL.md` 4096 (esperado 3496 tras task-03), `agentes/coordinador.md` 7168 (hoy 7168), planificador 3584 (3576), arquitecto 3584 (3583), constructor 3072 (3008), `skills/ejecutar-tarea/SKILL.md` 7623 (7619), `skills/descomponer-feature/SKILL.md` 6400 (6339).
- Línea base medida el 2026-11-03 con las tareas de F36 en `borrador`: `bash pruebas/rapida.sh` da `ℹ tests 702` y `ℹ fail 6`; los seis fallos ajenos son: «falla si falta la lectura acotada en constructor», «… en ejecutar-tarea», «falla si un agente conserva la línea de modelos.json», «falla si WORKFLOW.md conserva la frase sobre modelos.json», «falla si WORKFLOW.md pasa de 30720 caracteres» y «los archivos reales cumplen la regla».
- `node --test pruebas/comprobaciones/contrato.test.mjs` (6 pruebas, ~36 s) queda fuera de la rápida.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Esta tarea no edita archivos versionados; si una verificación falla por F36, el constructor la deja `bloqueada` con `BLOQUEO: rol=constructor; motivo=codigo:` y describe el fallo en *Notas*.
- Los seis fallos ajenos no se corrigen aquí ni se cuentan como regresión de F36. Un séptimo fallo, o uno de nombre distinto, sí lo es.
- Esperados con las tareas 01–04 hechas: rápida `ℹ tests 728`, `ℹ fail 6`; `contrato-roles.test.mjs` `ℹ tests 120`; `topes-bytes.test.mjs` `ℹ tests 23`.
- Corrida con modelo: no se lanza aquí. El criterio de éxito de F36 lo cierra Franco tras aprobar: `bash pruebas/correr-excedido.sh pi` y `bash pruebas/correr-excedido.sh claude-code`, 3 corridas por herramienta, las 6 con `Veredicto: OK`. Si una herramienta falla tras 3 corridas es bloqueo real y F36 no se da por cumplida (línea base: Pi OK, Claude Code FALLA porque pedía el número N; el kit debe funcionar igual en ambas).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: correr las verificaciones y pegar la evidencia.
Fuera de alcance: corregir cualquier fallo, tocar `agentes/`, `definitions/` o `scripts/`, hacer commit, y lanzar modelos: el criterio de éxito (3 corridas por herramienta con `correr-excedido.sh`, 6 de 6 con `Veredicto: OK`) lo cierra Franco, no esta tarea.

## Pasos
1. Lee las *Notas* de task-04.
2. Corre la *Verificación* en el orden dado y pega la salida literal en *Evidencia*.
3. Compara los nombres de los fallos de la rápida con la lista ajena; anota en *Notas* «sin regresión» o el nombre del fallo nuevo.

## Criterios de aceptación
1. `wc -c < skills/control-consumo/SKILL.md` ≤ 4096 y `wc -c < agentes/coordinador.md` imprime `7168`.
2. `git status --short -- agentes definitions/WORKFLOW.md scripts skills/ejecutar-tarea skills/descomponer-feature` no imprime nada.
3. `topes-bytes.test.mjs`, `contrato-roles.test.mjs` y `coherencia-features.test.mjs` dan `ℹ fail 0`.
4. `bash pruebas/rapida.sh` da `ℹ tests 728` y `ℹ fail 6`, con los mismos nombres ajenos.

## Verificación
```
wc -c < skills/control-consumo/SKILL.md | tr -d ' '; wc -c < agentes/coordinador.md | tr -d ' '
git status --short -- agentes definitions/WORKFLOW.md scripts skills/ejecutar-tarea skills/descomponer-feature
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
bash pruebas/rapida.sh 2>&1 | grep -E '^(ℹ (tests|fail)|✖)' | sort -u
```
Esperado: `3496` y `7168`; salida vacía; `ℹ tests 156` (23 + 120 + 13; base medida hoy: topes y coherencia suman 36, contrato-roles 114) y `ℹ fail 0`; `ℹ tests 728`, `ℹ fail 6` y las seis líneas `✖` ajenas más `✖ failing tests:` (la rápida sale 1 mientras haya fallos conocidos: no se exige salida 0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia

```
$ wc -c < skills/control-consumo/SKILL.md | tr -d ' '; wc -c < agentes/coordinador.md | tr -d ' '
3496
7168
exit 0
```

```
$ git status --short -- agentes definitions/WORKFLOW.md scripts skills/ejecutar-tarea skills/descomponer-feature
exit 0
```

```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 156
ℹ fail 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^(ℹ (tests|fail)|✖)' | sort -u
ℹ fail 6
✖ failing tests:
✖ falla si falta la lectura acotada en constructor (7.451416ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (5.224666ms)
✖ falla si un agente conserva la línea de modelos.json (1.116208ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (1.011458ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (4.878125ms)
✖ los archivos reales cumplen la regla (6.563917ms)
ℹ tests 728
exit 1
```

## Notas
- Criterios: 1 cumple (3496 ≤ 4096; coordinador 7168). 2 cumple (git status vacío). 3 cumple (topes+contrato-roles+coherencia: 156 pruebas, fail 0). 4 cumple (rápida: 728 pruebas, fail 6, mismos seis nombres ajenos de la línea base; la salida 1 es la esperada mientras existan fallos conocidos).
- Sin regresión: ningún séptimo fallo ni nombre distinto. Los fallos de la rápida son los seis ajenos documentados en la tarea.
- Verificación ejecutada dos veces (`intentos=2`); la segunda pasada, con `set -o pipefail`, es la que registra los códigos de salida reales.
- No se lanzó ningún modelo (`correr-excedido.sh`, `claude`, `pi`), no se tocó ningún archivo fuera de esta tarea, ni `definitions/STATUS.md`.
- El criterio de éxito de F36 no se verifica aquí: lo cierra Franco con `bash pruebas/correr-excedido.sh pi` y `bash pruebas/correr-excedido.sh claude-code`, 3 corridas por herramienta, las 6 con `Veredicto: OK`; si una herramienta falla tras 3 corridas es bloqueo real y no se da por cumplida. Esta tarea solo verifica lo automatizable.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
