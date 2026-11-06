# task-08 — Regresión final de F36 (ronda 2)
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
Cierra la segunda ronda de F36 como lo hizo task-05: topes de bytes, contratos y verificación rápida con los conteos medidos y ningún archivo fuera de alcance tocado. No añade comportamiento ni lanza modelos. Si algo falla por culpa de task-06 o task-07, lo anota sin corregirlo.

## Contexto
- Tocar: `features/F36-excedido-con-una-respuesta/task-08-regresion-final-de-f36-ronda-2.md`
- Solo se escribe *Evidencia* y *Notas* de esta tarea.
- De `depende_de:` lee solo las *Notas* de task-07 (y, si hace falta el conteo de task-06, las de esa).
- Topes en `pruebas/comprobaciones/topes-bytes.test.mjs` (23 pruebas): `skills/control-consumo/SKILL.md` 4096 (medido tras task-07), `agentes/coordinador.md` 7168 (hoy 7168), planificador 3584, arquitecto 3584, constructor 3072, `skills/ejecutar-tarea/SKILL.md` 7623 (7619), `skills/descomponer-feature/SKILL.md` 6400 (6339).
- Línea base de fallos ajenos de la rápida (6): «falla si falta la lectura acotada en constructor», «… en ejecutar-tarea», «falla si un agente conserva la línea de modelos.json», «falla si WORKFLOW.md conserva la frase sobre modelos.json», «falla si WORKFLOW.md pasa de 30720 caracteres» y «los archivos reales cumplen la regla».
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Esta tarea no edita archivos versionados; si una verificación falla por F36, el constructor la deja `bloqueada` con `BLOQUEO: rol=constructor; motivo=codigo:` y lo describe en *Notas*. Un séptimo fallo, o uno de nombre distinto, es regresión.
- Esperados con tareas 01-07 hechas: rápida `ℹ tests 741`, `ℹ fail 6`; `contrato-roles` 125; `topes-bytes` 23; `coherencia-features` 13.
- El criterio de éxito de F36 lo cierra Franco, no esta tarea: `bash pruebas/correr-excedido.sh pi 3` y `bash pruebas/correr-excedido.sh claude-code 3`, con `Corridas: 3/3 OK` en cada una (6 de 6 `Veredicto: OK`). Si una herramienta falla en las 3 corridas es bloqueo real y F36 no se da por cumplida; los informes dicen la `Causa probable`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: correr las verificaciones y pegar la evidencia.
Fuera de alcance: corregir fallos, tocar `agentes/`, `definitions/`, `scripts/`, hacer commit, y lanzar modelos (`correr-excedido.sh`, `claude`, `pi`).

## Pasos
1. Lee las *Notas* de task-07.
2. Corre la *Verificación* en orden y pega la salida literal en *Evidencia*.
3. Compara los nombres de los fallos de la rápida con la lista ajena; anota en *Notas* «sin regresión» o el fallo nuevo.

## Criterios de aceptación
1. `wc -c < skills/control-consumo/SKILL.md` ≤ 4096 y `wc -c < agentes/coordinador.md` imprime `7168`.
2. `git status --short -- agentes definitions/WORKFLOW.md scripts skills/ejecutar-tarea skills/descomponer-feature` no imprime nada.
3. `topes-bytes`, `contrato-roles` y `coherencia-features` suman `ℹ tests 161` con `ℹ fail 0`.
4. `bash pruebas/rapida.sh` da `ℹ tests 741` y `ℹ fail 6`, con los mismos nombres ajenos.

## Verificación
```
wc -c < skills/control-consumo/SKILL.md | tr -d ' '; wc -c < agentes/coordinador.md | tr -d ' '
git status --short -- agentes definitions/WORKFLOW.md scripts skills/ejecutar-tarea skills/descomponer-feature
node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
bash pruebas/rapida.sh 2>&1 | grep -E '^(ℹ (tests|fail)|✖)' | sort -u
```
Esperado: un número ≤ 4096 y `7168`; salida vacía; `ℹ tests 161` y `ℹ fail 0`; `ℹ tests 741`, `ℹ fail 6`, las seis líneas `✖` ajenas más `✖ failing tests:` (la rápida sale 1 mientras haya fallos conocidos).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia
```
$ wc -c < skills/control-consumo/SKILL.md | tr -d ' '; wc -c < agentes/coordinador.md | tr -d ' '
3832
7168
exit 0
```
```
$ git status --short -- agentes definitions/WORKFLOW.md scripts skills/ejecutar-tarea skills/descomponer-feature
(sin salida)
exit 0
```
```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coherencia-features.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'
ℹ tests 161
ℹ fail 0
exit 0
```
```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^(ℹ (tests|fail)|✖)' | sort -u
ℹ fail 6
✖ failing tests:
✖ falla si falta la lectura acotada en constructor (0.544417ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (0.509708ms)
✖ falla si un agente conserva la línea de modelos.json (0.673417ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (1.801792ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.745ms)
✖ los archivos reales cumplen la regla (4.621833ms)
ℹ tests 741
exit 0
```

## Notas
- Sin regresión: los seis fallos de la rápida son exactamente los de la línea base; ningún fallo nuevo. `ℹ tests 741`, `ℹ fail 6`, 161 pruebas de las tres suites con 0 fallos.
- `exit 0` en el cuarto bloque es el del pipeline (lo da `sort`). El código real de `bash pruebas/rapida.sh` medido aparte es `1`, esperado mientras haya fallos ajenos.
- Topes: `skills/control-consumo/SKILL.md` 3832 B (≤4096), `agentes/coordinador.md` 7168 B (= 7168). Ningún archivo fuera de alcance tocado.
- Sin ramas ni `git switch` (modo yolo); sin commit ni lanzamiento de modelos.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
