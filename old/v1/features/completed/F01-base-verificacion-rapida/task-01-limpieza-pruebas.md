# task-01 — Retirar restos obsoletos de pruebas/
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Cierra la limpieza de pruebas que quedó a medias tras retirar el escenario C. Hay tres restos que no usa nadie: un informe TAP viejo y versionado que muestra I3–I5 fallando (hoy pasan 12/12), un script de comprobaciones sin ningún importador y un directorio vacío. Quitarlos deja una base más corta y sin señales engañosas antes de añadir comprobaciones nuevas.

## Contexto
- Repo: este (`/Users/franco/Codes/flucastr/Flucastr.AI`), único repo. Node 25 y Bash. Sin red ni modelo.
- A borrar (leídos): `pruebas/capa1/ultima-ejecucion.tap` (versionado; contiene `✖ I3`, `✖ I4`, `✖ I5`), `pruebas/comprobaciones/escenario.mjs` (versionado; no lo importa ni lo invoca ningún `.sh`, `.mjs` ni `.md` fuera de `pruebas/resultados/`; `pruebas/ejecutar.sh` usa `escenarios.mjs`, en plural), `pruebas/comprobaciones/casos-negativos/` (directorio vacío, sin versionar).
- Suite completa actual (ejecutada por el planificador): `node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs` → 28 pruebas, 0 fallos, ~46 s. Capa 1: `node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs` → 12 pruebas, ~8 s.
- Hay cambios sin commitear en el árbol (borrado de `definicion/`, agentes y skills nuevos, `pruebas/lanzar-pi.sh`): no tocarlos.

## Decisiones ya tomadas
- Solo se borran los tres elementos listados. Nada más se borra ni se mueve.
- No se borra `pruebas/resultados/` (informes históricos) ni `pruebas/.temporales/` (ignorado por Git).
- No se regenera el `.tap`: se elimina.

## Alcance / Fuera de alcance
Alcance: borrar los tres elementos y comprobar que la suite sigue igual.
Fuera de alcance: cambiar `pruebas/capa1/instalacion.test.mjs` (incluida su política de conservar `pruebas/.temporales/`), editar `pruebas/README.md`, tocar `definitions/PROJECT.md` (sus cifras de «61/61» no se corrigen aquí), hacer commit.

## Pasos
1. Antes de borrar, correr desde la raíz: `grep -rn "ultima-ejecucion\|comprobaciones/escenario\.mjs\|casos-negativos/" --exclude-dir=.git --exclude-dir=.temporales --exclude-dir=resultados --exclude-dir=features .`. Debe no imprimir nada (código de salida 1). Si imprime algo, detenerse y anotarlo en *Notas* (es un cambio de alcance).
2. Borrar `pruebas/capa1/ultima-ejecucion.tap`.
3. Borrar `pruebas/comprobaciones/escenario.mjs`.
4. Borrar el directorio vacío `pruebas/comprobaciones/casos-negativos/` con `rmdir`.
5. Correr la suite completa y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. Los tres elementos ya no existen. Se comprueba con la primera orden de *Verificación*.
2. Ningún archivo fuera de `pruebas/resultados/`, `.temporales/` y `features/` los referencia. Se comprueba con la segunda orden.
3. La suite completa sigue en 28 pruebas pasando y 0 fallos. Se comprueba con la tercera orden.
4. `git status --short pruebas` muestra solo ` D` para el `.tap` y `escenario.mjs`, más el ` M pruebas/lanzar-pi.sh` previo. Se comprueba con la cuarta orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
test ! -e pruebas/capa1/ultima-ejecucion.tap && test ! -e pruebas/comprobaciones/escenario.mjs && test ! -d pruebas/comprobaciones/casos-negativos && echo BORRADOS
grep -rn "ultima-ejecucion\|comprobaciones/escenario\.mjs\|casos-negativos/" --exclude-dir=.git --exclude-dir=.temporales --exclude-dir=resultados --exclude-dir=features . ; echo "rc=$?"
node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
git status --short pruebas
```
Salida esperada: `BORRADOS`; solo `rc=1`; `ℹ tests 28`, `ℹ pass 28`, `ℹ fail 0`; y las líneas ` D pruebas/capa1/ultima-ejecucion.tap`, ` D pruebas/comprobaciones/escenario.mjs`, ` M pruebas/lanzar-pi.sh`.

## Evidencia

Pre-chequeo (paso 1), desde la raíz:
```
$ grep -rn "ultima-ejecucion\|comprobaciones/escenario\.mjs\|casos-negativos/" --exclude-dir=.git --exclude-dir=.temporales --exclude-dir=resultados --exclude-dir=features . ; echo "rc=$?"
rc=1
```

Borrado (pasos 2–4): `rm pruebas/capa1/ultima-ejecucion.tap && rm pruebas/comprobaciones/escenario.mjs && rmdir pruebas/comprobaciones/casos-negativos && echo DONE` → `DONE`.

Verificación (comandos de la tarea, salida real):
```
$ test ! -e pruebas/capa1/ultima-ejecucion.tap && test ! -e pruebas/comprobaciones/escenario.mjs && test ! -d pruebas/comprobaciones/casos-negativos && echo BORRADOS
BORRADOS

$ grep -rn "ultima-ejecucion\|comprobaciones/escenario\.mjs\|casos-negativos/" --exclude-dir=.git --exclude-dir=.temporales --exclude-dir=resultados --exclude-dir=features . ; echo "rc=$?"
rc=1

$ node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 28
ℹ pass 28
ℹ fail 0

$ git status --short pruebas
 D pruebas/capa1/ultima-ejecucion.tap
 D pruebas/comprobaciones/escenario.mjs
 M pruebas/lanzar-pi.sh
```

Criterios de aceptación:
1. Los tres elementos ya no existen: cumple (`BORRADOS`).
2. Ninguna referencia fuera de `pruebas/resultados/`, `.temporales/` y `features/`: cumple (`rc=1`).
3. Suite en 28 pruebas, 28 pasan, 0 fallos: cumple.
4. `git status --short pruebas` solo muestra ` D` para el `.tap` y `escenario.mjs`, más ` M pruebas/lanzar-pi.sh` previo: cumple.

## Notas

- Estado cambiado a `en curso` antes de empezar (procedimiento de la skill) y a `lista para revisión` al terminar.
- La salida de la suite pegada arriba es la filtrada por la orden de *Verificación* (líneas `ℹ tests/pass/fail`). La suite completa sin filtro no se volcó aquí; el resultado de pruebas es el que indica la orden de la tarea.
- Sin huecos menores: la tarea cubrió todos los pasos. No se tocó nada fuera de los tres elementos. Cambios previos sin commitear (`definicion/`, agentes, skills, `features/`, `modelos.json`, etc.) quedaron intactos.
- Sin commit, push, PR, merge ni despliegue. `STATUS.md` no se tocó.
