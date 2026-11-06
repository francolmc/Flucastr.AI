# task-09 — Los fixtures copian `firma.mjs` junto al validador
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`scripts/validar-tarea.mjs` importa `./firma.mjs` desde task-03. Los fixtures `pruebas/fixtures/excedido.sh` y `pruebas/fixtures/rol.sh` copian el validador y sus módulos a un directorio temporal con una lista fija que no incluye `firma.mjs`; allí `node scripts/validar-tarea.mjs --presupuesto` muere con `ERR_MODULE_NOT_FOUND` y las 4 pruebas de `rapida.sh` fallan. La causa fue comprobada (no es la línea `Firma:`): hay que agregar `firma.mjs` a las dos listas de copia. Con esto `bash pruebas/rapida.sh` vuelve a 0 y task-03 puede reintentarse.

## Contexto
- Fuente: ninguna
- Tocar: `pruebas/fixtures/excedido.sh`, `pruebas/fixtures/rol.sh`
- Requiere: runtime:node@25
- Causa comprobada: `scripts/validar-tarea.mjs` línea 35 `import { firma } from "./firma.mjs";`. En `pruebas/fixtures/excedido.sh` (líneas 12-14) y `pruebas/fixtures/rol.sh` (líneas 12-14) el `cp` copia `validar-tarea.mjs`, `formato-tarea.mjs`, `formato-evidencia.mjs`, `formato-fuente.mjs`, `formato-presupuesto.mjs`, `formato-bloqueo.mjs` y `formato-requiere.mjs` a `"$out/scripts/"`, sin `firma.mjs`. Reproducción: `d=$(mktemp -d); bash pruebas/fixtures/excedido.sh $d; (cd $d && node scripts/validar-tarea.mjs --presupuesto features/F01-demo)` imprime `Cannot find module '…/scripts/firma.mjs'`.
- Las pruebas que fallan: `excedido-resultado.test.mjs` (a) y (b), `rol-resultado.test.mjs` (i), `formato-presupuesto.test.mjs` (1).
- `scripts/firma.mjs` ya existe en el árbol (lo creó task-03, aún sin commit); esta tarea no lo modifica. El instalador copia `scripts/` entero, no hay otra lista que tocar (comprobado con `grep -rln formato-requiere`: solo `entorno.mjs`, `formato-tarea.mjs`, `formato-bloqueo.mjs`, pruebas y los dos fixtures).

## Decisiones ya tomadas
- No se cambia `scripts/validar-tarea.mjs` ni la línea `Firma:`: `--presupuesto` no la imprime y no es la causa.
- No se cambian las pruebas; solo las listas de copia de los fixtures.
- En ambos fixtures, `firma.mjs` se agrega en la última línea de la lista, antes de `"$out/scripts/"`: `"$REPO/scripts/formato-requiere.mjs" "$REPO/scripts/firma.mjs" "$out/scripts/"`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: añadir `scripts/firma.mjs` a las dos listas de `cp` de los fixtures.
Fuera de alcance: `scripts/firma.mjs`, `scripts/validar-tarea.mjs`, las pruebas, task-03 y su estado, `agentes/coordinador.md`, `definitions/`.

## Pasos
1. En `pruebas/fixtures/excedido.sh`, agrega `"$REPO/scripts/firma.mjs"` a la lista del `cp` (línea 14). Resultado: el fixture deja `scripts/firma.mjs` en el directorio generado.
2. En `pruebas/fixtures/rol.sh`, el mismo cambio (línea 14).
3. Corre las tres pruebas afectadas y luego `rapida.sh`.

## Criterios de aceptación
1. `bash pruebas/fixtures/excedido.sh <dir>` deja `<dir>/scripts/firma.mjs`; se comprueba con `ls` (Verificación 2).
2. Las tres pruebas afectadas terminan con `fail 0`.
3. `bash pruebas/rapida.sh` termina en 0 con los cambios de task-03 intactos (`git status` sigue mostrando `scripts/firma.mjs` y `scripts/validar-tarea.mjs`).

## Verificación
```
git branch --show-current
d=$(mktemp -d) && bash pruebas/fixtures/excedido.sh "$d" && ls "$d/scripts/firma.mjs"
node --test pruebas/comprobaciones/excedido-resultado.test.mjs pruebas/comprobaciones/rol-resultado.test.mjs pruebas/comprobaciones/formato-presupuesto.test.mjs
bash pruebas/rapida.sh; echo "exit $?"
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; el `ls` imprime la ruta sin error; la prueba con `fail 0`; `rapida.sh` con `exit 0` (tarda menos de 90 s, tope de la propia rápida).

## Evidencia
```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0

$ d=$(mktemp -d) && bash pruebas/fixtures/excedido.sh "$d" && ls "$d/scripts/firma.mjs"
/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.C0YMt8O0v9/scripts/firma.mjs
exit 0

$ node --test pruebas/comprobaciones/excedido-resultado.test.mjs pruebas/comprobaciones/rol-resultado.test.mjs pruebas/comprobaciones/formato-presupuesto.test.mjs
ℹ tests 46
ℹ suites 0
ℹ pass 46
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0

$ bash pruebas/rapida.sh; echo "exit $?"
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (24.294291ms)
ℹ tests 778
ℹ suites 0
ℹ pass 778
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
rapida: 53 archivos en 35 s (tope 90 s)
exit 0
```

## Notas
- Sin decisiones abiertas. Encargo con `Rama:` ya era la rama actual: no se ejecutó ningún `git switch`.
- Huecos menores: ninguno. Cambio idéntico al de *Pasos* 1 y 2 en ambos fixtures.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
