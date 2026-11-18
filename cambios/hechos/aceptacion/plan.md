---
estado: listo
rama: feature/aceptacion
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Capacidad Aceptación en el kit

> Los nombres personales y de proyectos se anonimizaron; se conservan fechas y cifras.

## Objetivo
Que el kit declare en su `AGENTS.md` una línea `Aceptación:` cuyo comando corre un archivo por flujo, se filtra por nombre, no corta al primer fallo y resume todos los fallos al final (contrato, capacidad Aceptación). Observable: rompes una suite a propósito y el comando falla nombrando el flujo.

## Diagnóstico (`docs/mejoras.md`)
Las cuatro capacidades faltan; Aceptación es la que más desbloquea porque `verify` (1207 líneas, 19 pasos) llama `fallo()` = `exit 1` y se enteran de un fallo por corrida de 32 s medidos. Rápida ahorraría segundos sobre 32 s; Evidencia depende de tener antes flujos separados.

## Dos caminos (stack: bash + Node 24)
- **A (recomendado): `node:test` envolviendo las suites existentes.** `pruebas/aceptacion/<flujo>.test.mjs`, uno por flujo, que ejecuta la suite `.mjs` actual con `spawnSync` y afirma código 0. Se corre con `node --test pruebas/aceptacion/*.test.mjs`; filtro por nombre con `--test-name-pattern=<flujo>` (flags confirmados con `node --help`, Node 24.22). Sin dependencias nuevas; el corredor ya informa todos los fallos al final. Porqué: es la herramienta nativa del stack y las suites ya usan `node:assert`.
- **B: partir `verify` en `pruebas/pasos/NN-*.sh` y un corredor bash propio** que acumule fallos. Cubre los 19 pasos, pero toca 1207 líneas de `verify` y reescribe un corredor que `node --test` ya da.

Recomiendo A: entrega lo observable con riesgo bajo; los pasos bash quedan en `./verify` y B puede venir en un plan siguiente.

## Supuestos
- Flujos de A: `contrato-constructor`, `kit-run` (`pruebas/kit-run/probar.mjs`) y `uso` (`pruebas/uso/probar.mjs`). `revisor-luna/medir.mjs` es medición, no prueba: queda fuera.
- No se mueven ni editan las suites; solo se añaden envoltorios. `verify` sigue como está.
- Un test que revele un bug de producto: se anota en *Notas* y el constructor se detiene (PAUSA).

## Alcance
Puede crear: `pruebas/aceptacion/*.test.mjs`, y editar `AGENTS.md` (línea `Aceptación:`). Excepción de `.gitignore`: `!pruebas/aceptacion/`. No toca `verify`, `scripts/`, `agentes/`, `skills/`, `nucleo/`.

## Pasos
- [x] 1. Un `.test.mjs` por flujo, cada uno con `node:test` y `spawnSync` de la suite; el mensaje de fallo incluye el flujo y la cola de la salida.
  - evidencia: `pruebas/aceptacion/contrato-constructor.test.mjs`, `pruebas/aceptacion/kit-run.test.mjs`, `pruebas/aceptacion/uso.test.mjs`; comprobación del mensaje de fallo en Evidencia.
- [x] 2. Excepción en `.gitignore` (`pruebas/*` ignora todo).
  - evidencia: `.gitignore` con `!pruebas/aceptacion/`; `git check-ignore pruebas/aceptacion/kit-run.test.mjs` exit 1.
- [x] 3. Línea en `AGENTS.md`: `Aceptación: node --test pruebas/aceptacion/*.test.mjs` (filtro: `--test-name-pattern=<flujo>`; en Node 24 un directorio no funciona, hay que pasar el glob).
  - evidencia: `AGENTS.md` línea 7 (`grep -n "^- Aceptación:" AGENTS.md` exit 0).

## Aceptación
- A1: `node --test pruebas/aceptacion/*.test.mjs` pasa (rc 0) en el árbol actual.
- A2: `node --test --test-name-pattern=kit-run pruebas/aceptacion/*.test.mjs` corre solo ese flujo.
- A3: rompe a propósito dos suites (copia temporal o cambio revertido): el comando falla (rc≠0), y el resumen final nombra ambos flujos.
- A4: `AGENTS.md` tiene la línea `Aceptación:` con ese comando.
- A5: `git check-ignore pruebas/aceptacion/kit-run.test.mjs` sale 1; `./verify` sigue pasando; `git diff --check` limpio.

## Verificación
`node --test pruebas/aceptacion/*.test.mjs` y `./verify` (≈32 s).

## Evidencia

Línea de base (antes de tocar nada, suites tal cual):

```
$ node pruebas/contrato-constructor.mjs
ok A1 / ok A2 / ok A3 / ok A5 / ok A4   (resumen)
exit 0

$ node pruebas/uso/probar.mjs
pruebas del medidor: 19 de 19 ok
exit 0

$ node pruebas/kit-run/probar.mjs
kit-run: 17 casos pasaron
exit 0
```

Intento previo con el directorio (descartado, ver Notas):

```
$ node --test pruebas/aceptacion/
✖ pruebas/aceptacion (85.124695ms)
ℹ tests 1
ℹ fail 1
  code: 'MODULE_NOT_FOUND'  (salida recortada)
exit 1
```

A1 (corrida final con el glob):

```
$ node --test pruebas/aceptacion/*.test.mjs
ℹ tests 3
ℹ pass 3
ℹ fail 0
exit 0
```

A2 (filtro por flujo; solo la prueba de kit-run se ejecuta, las de contrato y uso quedan filtradas):

```
$ node --test --test-name-pattern=kit-run pruebas/aceptacion/*.test.mjs
✔ pruebas/aceptacion/contrato-constructor.test.mjs (46.349468ms)
✔ kit-run: la suite de kit run pasa (5232.460781ms)
✔ pruebas/aceptacion/uso.test.mjs (52.19253ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
ℹ skipped 0
exit 0
```

A3 (copia en scratchpad, fuera del repo; kit-run y uso con `process.exit(1)` insertado tras el shebang; contrato-constructor intacto):

```
$ node --test pruebas/aceptacion/*.test.mjs   (en la copia)
✖ kit-run: la suite de kit run pasa (32.227238ms)
✖ uso: la suite del medidor de costos pasa (30.780606ms)
ℹ pass 1
ℹ fail 2
AssertionError [ERR_ASSERTION]: flujo kit-run falló (exit 1): ...
AssertionError [ERR_ASSERTION]: flujo uso falló (exit 1): ...
exit 1
```

A4 (línea en AGENTS.md):

```
$ grep -n "^- Aceptación:" AGENTS.md
7:- Aceptación: `node --test pruebas/aceptacion/*.test.mjs` corre un archivo por flujo ...
exit 0
```

A5 (ignorado, diff limpio y verify):

```
$ git check-ignore pruebas/aceptacion/kit-run.test.mjs
check-ignore exit 1
$ git diff --check
diff-check exit 0
$ ./verify
...
ok 13: pruebas de kit run pasaron con los CLIs simulados
...
VERIFY OK
exit 0
```

## Notas

- **Diseño (resuelto):** `node --test pruebas/aceptacion/` no funciona en Node v24.22.1. Con un directorio, `node --test` intenta cargarlo como módulo y falla con `MODULE_NOT_FOUND`. El principal eligió la opción 1: `node --test pruebas/aceptacion/*.test.mjs` (probada, 3 de 3 pasan, el filtro por nombre funciona). Se aplica a AGENTS.md, a A1 a A5 y a la Evidencia de este plan.
- Opciones descartadas en la PAUSA: (2) `node --test 'pruebas/aceptacion/**/*.test.mjs'` (glob de Node, equivalente, no se usó); (3) mantener el directorio y que `verify` liste los archivos.
- Los pasos del plan no tenían casillas `- [ ]`, así que el contador marcaba 0 pendientes. Solo se añadieron `- [x]`/`- [ ]` a los pasos 1 a 3; su texto no cambió.
- Los envoltorios no tocan las suites: solo las ejecutan con `spawnSync` y afirman código 0. `verify` no cambió.
- Sin bugs de producto detectados.
- Un intento temporal escribió salida en `/tmp` (archivos `a1.txt` y `a2.txt`); se borraron.

## Resumen de cierre (para el principal)

Hecho: pasos 1, 2 y 3. A1 a A5 pasan con `node --test pruebas/aceptacion/*.test.mjs` y `./verify` pasa (VERIFY OK, exit 0). Pendiente para el principal: revisar el plan y archivarlo en `cambios/hechos/` tras la aprobación de la persona usuaria. No hay bugs de producto.

- Devuelto por PAUSA (diseño): `node --test <directorio>/` falla en Node 24.22.1 (MODULE_NOT_FOUND). Decisión del principal: opción 1, glob `pruebas/aceptacion/*.test.mjs`. Relanzado y completado: pasos 1 a 3 hechos, A1 a A5 y `./verify` en verde.
