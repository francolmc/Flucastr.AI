# task-01 — Topes por rol ampliables en formato-presupuesto.mjs
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Hoy `ampliado=N` solo sube el tope general `D`; los topes por rol (`arq` 2, `plan` 3, `K` 2) son fijos. Esta tarea añade a la línea `Presupuesto:` los sufijos opcionales `amp_arq`, `amp_plan`, `amp_k`, que suben el tope de ese rol, y hace que `calcularPresupuesto` y `validarStatusCompacto` los entiendan. Una línea sin sufijos se comporta exactamente como hoy.

## Contexto
- Tocar: `scripts/formato-presupuesto.mjs`, `pruebas/comprobaciones/formato-presupuesto.test.mjs`
- Leer en `scripts/formato-presupuesto.mjs`: `RE_PRESUPUESTO` (línea 20) y `calcularPresupuesto` desde `let arq = 0;` (línea 104) hasta el `return` (línea 141).
- Leer en `pruebas/comprobaciones/formato-presupuesto.test.mjs`: las funciones auxiliares `statusCompacto`, `tareaListas`, `tareaCon` y los tests `excedido por arq` y `ampliado sube el tope`.
- Se prueba con `node:test` y `node:assert/strict`, sin leer `definitions/` ni `features/`.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Forma de la línea: `Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>` seguida, opcionalmente y solo en este orden, de `; amp_arq=<n>`, `; amp_plan=<n>`, `; amp_k=<n>`. Cada sufijo es opcional por separado. Largo máximo posible ≈ 85 caracteres, bajo el tope de 150 por ítem.
- `RE_PRESUPUESTO` pasa a ser: `/^Presupuesto: (F\d+|ninguna); rondas arq=(\d+) plan=(\d+); ampliado=(\d+)(?:; amp_arq=(\d+))?(?:; amp_plan=(\d+))?(?:; amp_k=(\d+))?$/`. `calcularPresupuesto` usa esa misma constante (hoy repite una regex propia con `[^;\s]+`).
- Valores ausentes valen 0. Topes: `topeArq = 2 + amp_arq`, `topePlan = 3 + amp_plan`, `topeK = 2 + amp_k`.
- Tope general: `tope = 2*T + 4 + ampliado + amp_arq + amp_plan` (cada ronda extra de arq o plan cuenta en `D`, así que su ampliación sube también `D`). `amp_k` no sube `D`.
- Excedido: `D > tope`, `K > topeK`, `arq > topeArq`, `plan > topePlan`. Aviso por `K` cuando `K === topeK`, con causa `K${topeK}` (con `amp_k` ausente sigue siendo `K2`). `D75` no cambia.
- La línea de salida muestra los topes vigentes: `K=<K>/<topeK>; rondas arq=<arq>/<topeArq> plan=<plan>/<topePlan>`. Sin sufijos queda idéntica a la de hoy.
- Una línea de otra feature sigue sin contar sus rondas ni sus ampliaciones.
- Valores medidos con el prototipo (T=1, feature F35, una ejecución `lista`): `arq=3 ampliado=0` da `D=4/6 ... rondas arq=3/2 ... estado=excedido arq`; con `; amp_arq=1` da `D=4/7; E=1; I=1; K=0/2; rondas arq=3/3 plan=0/3; estado=ok`; con `arq=4` y `amp_arq=1`, `estado=excedido arq`; con tres tareas `bloqueada` y `amp_k=1`, `estado=aviso K3`; con dos, `estado=ok`.
- `validarStatusCompacto` acepta las formas anteriores y rechaza como `forma inválida` un sufijo fuera de orden (`; amp_plan=1; amp_arq=1`) o sin valor (`; amp_arq=`).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el módulo y su prueba.
Fuera de alcance: `scripts/validar-tarea.mjs`, `skills/`, `agentes/`, `definitions/` (incluido `definitions/CONSUMO.md`; lo actualiza Franco aparte), `pruebas/comprobaciones/frases-por-archivo.mjs`.

## Pasos
1. En `scripts/formato-presupuesto.mjs` sustituye `RE_PRESUPUESTO` por la de «Decisiones ya tomadas» y haz que `calcularPresupuesto` la use con `exec` sobre la línea (grupos 5, 6 y 7 son los sufijos).
2. Añade `ampArq`, `ampPlan`, `ampK` y calcula `topeArq`, `topePlan`, `topeK` y `tope` como indica «Decisiones ya tomadas»; usa los topes en las comparaciones de `excedido`, en el aviso por `K` y en la línea de salida.
3. En `pruebas/comprobaciones/formato-presupuesto.test.mjs` añade al menos 8 tests que cubran las cuentas de «Decisiones ya tomadas» (cada sufijo, `D` con `amp_arq` y `amp_plan`, línea sin sufijos idéntica, otra feature no cuenta) y `validarStatusCompacto` (tres sufijos juntos, orden cambiado, `; amp_arq=`).
4. No cambies los tests existentes salvo que su resultado dependa de un texto que esta tarea cambió (ninguno debería).
5. Corre la *Verificación*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/formato-presupuesto.test.mjs` termina con `ℹ fail 0` y `ℹ tests` ≥ 28 (hoy 20).
2. Con `arq=3 ampliado=0; amp_arq=1`, `calcularPresupuesto` devuelve estado `ok` y la línea trae `rondas arq=3/3`.
3. Una línea sin sufijos produce la misma línea de salida que antes: los 20 tests existentes pasan sin tocarlos.
4. `validarStatusCompacto` devuelve `[]` para un STATUS con `ampliado=0; amp_arq=1; amp_plan=2; amp_k=1` y un motivo con `forma inválida` si el orden cambia.
5. `bash pruebas/rapida.sh` no añade fallos respecto de la base previa a esta tarea (ver *Verificación*).

## Verificación
```
node --test pruebas/comprobaciones/formato-presupuesto.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'; echo "exit $?"
node -e 'import("./scripts/formato-presupuesto.mjs").then(m=>{const st=["# Estado","Escalación: ninguna","Paso actual: x","Presupuesto: F35; rondas arq=3 plan=0; ampliado=0; amp_arq=1","Espera a Franco: ninguna","Bloqueos abiertos: ninguno","Retomar: x","Actualizado: 2026-11-03"].join("\n");console.log(m.calcularPresupuesto({feature:"F35",tareas:[],status:st}).linea, JSON.stringify(m.validarStatusCompacto(st)))})'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
```
Esperado: primer comando, `ℹ tests 28` o más y `ℹ fail 0`, con `exit 0`; segundo, `Presupuesto F35: D=3/5; E=0; I=0; K=0/2; rondas arq=3/3 plan=0/3; estado=ok []`, con `exit 0`; tercero, `ℹ tests` igual o mayor que 682 + los tests nuevos de esta tarea y `ℹ fail 6` (base medida el 2026-11-03: 682 tests, 6 fail ajenos; el `exit` es el de `grep`).

## Evidencia
Esperado cumplido: `ℹ tests 28` o más, `ℹ fail 0`, `ℹ fail 6` en `features/F35-tope-por-rol/`.

```
$ node --test pruebas/comprobaciones/formato-presupuesto.test.mjs 2>&1 | grep -E '^ℹ (tests|pass|fail)'; echo "exit $?"
ℹ tests 31
ℹ pass 31
ℹ fail 0
exit 0
$ node -e 'import("./scripts/formato-presupuesto.mjs").then(m=>{const st=["# Estado","Escalación: ninguna","Paso actual: x","Presupuesto: F35; rondas arq=3 plan=0; ampliado=0; amp_arq=1","Espera a Franco: ninguna","Bloqueos abiertos: ninguno","Retomar: x","Actualizado: 2026-11-03"].join("\n");console.log(m.calcularPresupuesto({feature:"F35",tareas:[],status:st}).linea, JSON.stringify(m.validarStatusCompacto(st)))})'; echo "exit $?"
Presupuesto F35: D=3/5; E=0; I=0; K=0/2; rondas arq=3/3 plan=0/3; estado=ok []
exit 0
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 693
ℹ fail 6
exit 0
```

## Notas
- Los 6 `fail` de `rapida.sh` son ajenos. Tests nuevos: 11 (total 31). `calcularPresupuesto` solo acepta `F\d+` o `ninguna` como feature.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
