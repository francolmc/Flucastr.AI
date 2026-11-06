# task-05 — Regresión final: formatos F24–F29 y pruebas existentes siguen igual
repo: Flucastr.AI   depende_de: task-03, task-04   estado: hecha

## Descripción
Cierra F30 con la prueba explícita de que nada se rompió: las tareas F24–F29 validan igual que en la base de task-01, el formato de 8 claves de `Registro:` no cambió, y toda la verificación rápida pasa dentro de su tope. Añade a la prueba de regresión los casos de borde propios de F30.

## Contexto
- Tocar: `pruebas/comprobaciones/regresion-validadores.test.mjs`
- Prueba creada en task-01 (leer solo sus *Notas*): compara los motivos de `validarTarea`, `validarEvidencia` y `validarFuente` con `pruebas/fixtures/regresion-f24-f29.json` (38 tareas).
- `RE_REGISTRO` de `scripts/formato-evidencia.mjs` (línea 14) y de `scripts/registrar.mjs` (líneas 73–77): 8 claves en el orden `n, herramienta, modo, intentos, verificacion, huecos, resultado, causa`.
- `bash pruebas/rapida.sh` recoge `pruebas/comprobaciones/*.test.mjs` y `pruebas/capa1/{instalacion,copia,skills-proyecto,compactacion}.test.mjs`; su tope es 30 s (`FLUCASTR_TOPE_RAPIDA`). Su salida incluye `ℹ pass N` y `ℹ fail N`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «Riesgos»

## Decisiones ya tomadas
- Casos nuevos en la prueba de regresión: (a) una línea `Registro:` con 7 claves y otra con las 8 en distinto orden siguen rechazadas por `validarEvidencia` con el motivo de los «8 campos» (no se cambia el regex); (b) una línea válida coherente de las 8 claves no produce motivos de `Registro`; (c) la base de task-01 no se regenera ni se edita.
- No se modifica ningún `scripts/*` ni `skills/*` en esta tarea: si la regresión falla, la tarea queda `bloqueada` y se informa con `BLOQUEO: rol=planificador`.
- Base de `bash pruebas/rapida.sh` medida el 2026-11-02 antes de F30 (confirmado, ejecutado): `ℹ pass 514`, `ℹ fail 7` (521 pruebas, ~18 s, dentro del tope de 30 s). Las 7 fallas son anteriores a F30: `definitions/BACKLOG.md real cumple el formato` (fila F26 con `\|`) y 6 de higiene de contexto por `WORKFLOW.md`: `los archivos reales cumplen la regla`, `falla si un agente conserva la línea de modelos.json`, `falla si falta la lectura acotada en constructor`, `falla si falta la lectura acotada en ejecutar-tarea`, `falla si WORKFLOW.md pasa de 30720 caracteres` y `falla si WORKFLOW.md conserva la frase sobre modelos.json`. F30 no las corrige ni las agrava.
- Criterio de «no se rompió nada»: `ℹ fail` de `rapida.sh` exactamente 7 y el conjunto de pruebas fallidas idéntico a esas 7; las pruebas de F30 y las 38 tareas pasan sin excepción. Si aparece una falla fuera de la lista, la tarea queda `bloqueada`.
- Los motivos de la base ya conocidos (F24 task-06 y task-07, F25 task-02, F27 task-02 a 04) se mantienen tal cual; no son tarea de F30.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: los casos (a) y (b) y la corrida de toda la verificación.
Fuera de alcance: corregir motivos previos, ajustar topes, `README.md`, `definitions/`.

## Pasos
1. En `regresion-validadores.test.mjs` agrega el caso (a) con `validarEvidencia` y una tarea terminada mínima (puede reutilizar el armado de tarea de `formato-evidencia.test.mjs`, copiándolo, sin importarlo).
2. Agrega el caso (b).
3. Corre la prueba de regresión.
4. Corre las cuatro pruebas tocadas por F30 y luego `bash pruebas/rapida.sh`.
5. Confirma con `git status --short` que solo cambió `pruebas/comprobaciones/regresion-validadores.test.mjs` respecto del cierre de task-04.

## Criterios de aceptación
1. La regresión de las 38 tareas pasa con la base original (`git diff -- pruebas/fixtures/regresion-f24-f29.json` vacío).
2. Las líneas con 7 claves o claves reordenadas siguen rechazadas.
3. `bash pruebas/rapida.sh` reporta exactamente `ℹ fail 7` y las 7 fallas son las de la lista de base de *Decisiones ya tomadas*; se comprueba con el comando de fallas.
4. `node scripts/validar-tarea.mjs features/F30-coherencia-resultado/task-*.md` sale 0.

## Verificación
```
node --test pruebas/comprobaciones/regresion-validadores.test.mjs
bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (pass|fail)|^✖"
git diff --stat -- pruebas/fixtures/regresion-f24-f29.json
node scripts/validar-tarea.mjs features/F30-coherencia-resultado/task-01-base-de-regresion.md features/F30-coherencia-resultado/task-02-coherencia-registro.md features/F30-coherencia-resultado/task-03-registrar-usa-coherencia.md features/F30-coherencia-resultado/task-04-skill-ejecutar-tarea.md features/F30-coherencia-resultado/task-05-regresion-final.md
```
Esperado: `ℹ fail 0` en la primera; en la segunda, exactamente `ℹ fail 7` (y `ℹ pass 514` más las pruebas nuevas de F30) y la lista `✖` igual a las 7 de base (tarda ~18 s); la tercera no imprime nada; la cuarta sale 0.

## Evidencia

```
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E "^ℹ (pass|fail)|^✖"
✖ definitions/BACKLOG.md real cumple el formato
✖ los archivos reales cumplen la regla
✖ falla si un agente conserva la línea de modelos.json
✖ falla si falta la lectura acotada en constructor
✖ falla si falta la lectura acotada en ejecutar-tarea
✖ falla si WORKFLOW.md pasa de 30720 caracteres
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json
ℹ pass 528
ℹ fail 7
✖ failing tests:
[…recortado: 7 líneas, repetición de las 7 ✖ anteriores…]
exit 1
```

Con `set -o pipefail` (la línea literal sin él sale con el código de `grep`, 0). Las 7 fallas coinciden exactamente con la lista de base de *Decisiones ya tomadas*. Comparación con lo esperado en *Verificación*: el esperado era `ℹ pass 514` más las pruebas nuevas de F30; el real es `ℹ pass 528`, es decir 514 + 14 pruebas nuevas de F30 (incluidas las 2 de esta tarea). Total 535 = 528 + 7.

```
$ git diff --stat -- pruebas/fixtures/regresion-f24-f29.json
(sin salida)
exit 0
```

```
$ node scripts/validar-tarea.mjs features/F30-coherencia-resultado/task-01-base-de-regresion.md features/F30-coherencia-resultado/task-02-coherencia-registro.md features/F30-coherencia-resultado/task-03-registrar-usa-coherencia.md features/F30-coherencia-resultado/task-04-skill-ejecutar-tarea.md features/F30-coherencia-resultado/task-05-regresion-final.md
OK: 5 tarea(s) válida(s)
exit 0
```

Pasos 3 y 4 (pruebas tocadas por F30, no incluidas en la Verificación literal):

```
$ node --test pruebas/capa1/registrar.test.mjs pruebas/comprobaciones/contrato-constructor.test.mjs pruebas/comprobaciones/formato-evidencia.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs
ℹ tests 63
ℹ pass 63
ℹ fail 0
exit 0
```

Paso 5: `git status --short` muestra los cambios tracked de la foto inicial (sin cambios nuevos en `scripts/` ni `skills/` en esta tarea); `regresion-validadores.test.mjs` es archivo sin seguimiento, así que no aparece como modificado.

## Notas
- Caso (a) añadido: `Registro:` con 7 claves y con las 8 reordenadas, ambas rechazadas con el motivo «8 campos». Caso (b): línea coherente de 8 claves sin motivos de `Registro`. Armado copiado de `formato-evidencia.test.mjs`, no importado.
- Huecos menores resueltos: (1) el Paso 4 dice «cuatro pruebas» sin listarlas; corrí las cuatro que F30 toca (`registrar.test.mjs`, `contrato-constructor`, `formato-evidencia`, `regresion-validadores`). (2) `pruebas/fixtures/regresion-f24-f29.json` y `regresion-validadores.test.mjs` no tienen seguimiento git, así que `git diff --stat` del criterio 1 queda vacío por construcción; la comprobación real es que la regresión pasa contra la base sin regenerarla (no se usó `FLUCASTR_GENERAR_BASE`).
- `Registro:` de task-01, task-03 y task-04 no se tocaron; `Registro:` de esta tarea es la primera línea de esta ejecución.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
