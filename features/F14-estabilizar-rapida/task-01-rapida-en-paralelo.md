# task-01 — Correr los archivos de `pruebas/rapida.sh` en paralelo
repo: Flucastr.AI   depende_de: —   estado: lista para revisión

## Descripción
`bash pruebas/rapida.sh` tarda 23–37 s con tope de 30 s y a veces falla por tiempo. Causa medida: `rapida.sh` corre los archivos de prueba uno tras otro (`node --test --test-concurrency=1`), así que el tiempo es la suma de todos (~26 s; el mayor es `pruebas/capa1/instalacion.test.mjs`, ~8 s, seguido de `modelos-agentes.test.mjs` ~4 s y `constructor-resultado.test.mjs` ~3,3 s). Medido en el checkout: sin `--test-concurrency=1` la misma lista de archivos tarda ~11 s, con los mismos 217 casos que pasan. La tarea quita esa opción para dejar el tiempo muy por debajo del tope, sin quitar ni saltar ninguna prueba.

## Contexto
- A tocar (único archivo): `pruebas/rapida.sh` (leído). Línea actual: `node --test --test-concurrency=1 "${archivos[@]}"`. El tope se lee de `FLUCASTR_TOPE_RAPIDA` (por defecto 30) y se compara con `$SECONDS` al final; ese cálculo no se toca.
- La lista de archivos del `for` (`pruebas/comprobaciones/*.test.mjs`, `pruebas/*.test.mjs`, `pruebas/capa1/instalacion.test.mjs`, `pruebas/capa1/copia.test.mjs`, excluyendo `contrato.test.mjs`) no se toca.
- Cada prueba de capa 1 usa un directorio propio con `mkdtempSync` bajo `pruebas/.temporales/` (ignorado por git), así que no comparten estado. Medido: 3 corridas completas en paralelo dieron 217 pasan, sin fallos nuevos.
- Línea de base medida (serie): ~26 s, 217 pasan. Hoy `rapida.sh` falla además con 1 prueba (`coherencia-features.test.mjs`: «se esperaba al menos una carpeta de feature y hay 0») porque `features/` solo tenía `completed/`; deja de fallar al existir `features/F14-estabilizar-rapida/`. No es parte de esta tarea.
- Máquina de medida: 6 núcleos (macOS). En la ejecución del constructor puede haber otros núcleos; el criterio usa un margen amplio.
- `pruebas/README.md` (línea 5) y `definitions/PROJECT.md` mencionan el tope de 30 s, no `--test-concurrency`; no se tocan. Las líneas de `README.md`/`PROJECT.md` con `--test-concurrency=1` son de otras suites y quedan igual.

## Decisiones ya tomadas
- Se quita solo `--test-concurrency=1`; se usa la concurrencia por defecto de `node --test` (no se fija un número).
- No se quita, salta ni reduce ninguna prueba, ni se cambia `instalacion.test.mjs` ni otro archivo de prueba.
- Alternativa solo si hay fallos: si en las 5 corridas de *Verificación* falla alguna prueba o el tiempo de alguna supera 20 s, se usa `--test-concurrency=2` en lugar de la concurrencia por defecto y se repiten las 5 corridas. Si aún falla o supera 20 s: estado `bloqueada` con el detalle (no se sigue ajustando).
- El mensaje final de `rapida.sh` y el tope de 30 s no cambian.

## Alcance / Fuera de alcance
Alcance: la línea de `node --test` en `pruebas/rapida.sh` y un comentario de una línea encima que diga por qué los archivos corren en paralelo (cada uno usa su directorio temporal propio).
Fuera de alcance: cambiar el tope de 30 s; tocar `README.md`, `definitions/`, `instalar.sh` o cualquier prueba; mover archivos dentro o fuera de la rápida; acelerar `instalacion.test.mjs`; la suite completa y `remoto.test.mjs`.

## Pasos
1. Medir la base: ejecutar `bash pruebas/rapida.sh 2>&1 | tail -3` y anotar en *Evidencia* la línea `rapida: N archivos en X s` y los totales `ℹ pass`/`ℹ fail` (`node --test` los imprime al final).
2. En `pruebas/rapida.sh`, cambiar `node --test --test-concurrency=1 "${archivos[@]}"` por `node --test "${archivos[@]}"`.
3. Añadir encima de esa línea el comentario `# Archivos en paralelo: cada prueba usa su propio directorio temporal en pruebas/.temporales.`
4. Ejecutar las 5 corridas de *Verificación* y anotar los tiempos y los totales en *Evidencia*.
5. Si se cumple alguna condición de la alternativa de *Decisiones*, aplicarla (una sola vez) y repetir el paso 4.

## Criterios de aceptación
1. `pruebas/rapida.sh` ya no contiene `--test-concurrency=1` (`grep -c "test-concurrency" pruebas/rapida.sh` imprime `0`) o contiene `--test-concurrency=2` si se aplicó la alternativa.
2. Cinco corridas seguidas terminan con código 0 y `ℹ fail 0`.
3. En cada una de las cinco corridas la línea final dice `rapida: … en X s` con X ≤ 20.
4. El total de casos que pasan es igual o mayor al de la línea de base de la tarea (217 pasan, más los que sume la propia carpeta F14) y el número de archivos en `rapida: N archivos` no cambia respecto de la base.
5. `git diff --stat` muestra solo `pruebas/rapida.sh` (más, ya existentes, los cambios previos en `definitions/BACKLOG.md` y `definitions/STATUS.md`, que no son de esta tarea).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c "test-concurrency" pruebas/rapida.sh
for i in 1 2 3 4 5; do bash pruebas/rapida.sh > /tmp/rapida-$i.txt 2>&1; echo "corrida $i rc=$?"; grep -E "^ℹ (pass|fail)|^rapida:" /tmp/rapida-$i.txt; done
git diff --stat -- pruebas
```
Salida esperada: `0` en la primera línea; cinco bloques con `rc=0`, `ℹ fail 0`, `ℹ pass ≥ 217` y `rapida: N archivos en X s (tope 30 s)` con X ≤ 20; el diff de `pruebas/` solo lista `pruebas/rapida.sh`. Comandos ejecutados en la planificación (con la opción ya quitada de una copia temporal): 11 s, 217 pasan. Las cinco corridas completas con el archivo real: no ejecutado, inferido.
Nota: usa `/tmp` solo para las salidas de la verificación; si el entorno del constructor lo restringe, usa su directorio temporal de sesión.

## Evidencia

Rama: `chore/F14-estabilizar-rapida` (creada con `git switch -c` desde `main`; la rama no existía).

Paso 1, línea de base (`bash pruebas/rapida.sh`, antes del cambio), dos corridas:
```
ℹ tests 218
ℹ pass 218
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
rapida: 21 archivos en 26 s (tope 30 s)
```

Pasos 2 y 3: en `pruebas/rapida.sh` se quitó `--test-concurrency=1` y se añadió el comentario de una línea encima de `node --test`. Diff real:
```
-node --test --test-concurrency=1 "${archivos[@]}"
+# Archivos en paralelo: cada prueba usa su propio directorio temporal en pruebas/.temporales.
+node --test "${archivos[@]}"
```

Verificación: `grep -c "test-concurrency" pruebas/rapida.sh` imprime `0`.

Paso 4, cinco corridas con el archivo real (`rapida.sh` en cada una, salidas en el directorio temporal de la sesión):
```
corrida 1 rc=0
ℹ pass 218
ℹ fail 0
rapida: 21 archivos en 11 s (tope 30 s)
corrida 2 rc=0
ℹ pass 218
ℹ fail 0
rapida: 21 archivos en 11 s (tope 30 s)
corrida 3 rc=0
ℹ pass 218
ℹ fail 0
rapida: 21 archivos en 11 s (tope 30 s)
corrida 4 rc=0
ℹ pass 218
ℹ fail 0
rapida: 21 archivos en 12 s (tope 30 s)
corrida 5 rc=0
ℹ pass 218
ℹ fail 0
rapida: 21 archivos en 11 s (tope 30 s)
```

Paso 5: no aplica. Las cinco corridas pasaron con concurrencia por defecto y ninguna superó 20 s, así que no se usó `--test-concurrency=2`.

`git diff --stat` (salida real):
```
 definitions/BACKLOG.md |  6 ++++--
 definitions/STATUS.md  | 12 +++++++-----
 pruebas/rapida.sh      |  3 ++-
 3 files changed, 13 insertions(+), 8 deletions(-)
```
Los cambios de `definitions/BACKLOG.md` y `definitions/STATUS.md` ya estaban antes de empezar (no los toqué). `git diff --stat -- pruebas` solo lista `pruebas/rapida.sh`.

Criterios de aceptación:
1. Cumple: `grep -c` da `0`.
2. Cumple: cinco corridas con rc=0 y `ℹ fail 0`.
3. Cumple: las cinco líneas `rapida: … en X s` tienen X = 11 o 12 (≤ 20).
4. Cumple: 218 pasan (≥ 217); el número de archivos sigue en 21, igual que la base.
5. Cumple: en `pruebas/` solo cambió `pruebas/rapida.sh`; los otros dos archivos ya estaban modificados antes.

## Notas
- Hueco menor: la *Verificación* indica `/tmp` para las salidas. Usé el directorio temporal de sesión, como pide el procedimiento del constructor. Mismo resultado.
- La tarea decía 217 pasan en la línea de base; al medir, dio 218. La diferencia viene de la propia carpeta `features/F14-estabilizar-rapida/`, que ahora existe: `coherencia-features.test.mjs` pasa (antes fallaba con 0 carpetas). No cambié nada para lograrlo.
- No ejecuté `git commit`, `push`, PR, merge ni despliegue. Estado: `lista para revisión`, nunca `hecha`.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=5; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
