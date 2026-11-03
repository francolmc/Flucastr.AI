# task-02 — Pruebas del CLI --presupuesto y de formato-flujo con los sufijos amp_*
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Con task-01, la línea `Presupuesto:` admite `; amp_arq=<n>`, `; amp_plan=<n>`, `; amp_k=<n>`. Esta tarea fija por prueba que los dos consumidores existentes de esa línea la aceptan: el validador de `STATUS.md` de `formato-flujo` (el que usan `coordinador` y las comprobaciones) y la opción `--presupuesto` de `scripts/validar-tarea.mjs`. No cambia código de producto: si una prueba falla, el defecto está en task-01.

## Contexto
- Tocar: `pruebas/comprobaciones/formato-flujo.test.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- De `depende_de:` lee solo las *Notas* de task-01.
- En `pruebas/comprobaciones/formato-flujo.test.mjs`: constante `STATUS_COMPACTO` (línea 159) y el test `status compacto: la muestra de siete líneas se acepta` (línea 185); `validarStatus` es la función ya importada.
- En `pruebas/comprobaciones/validar-tarea.test.mjs`: helpers `registroLista`, `tareaCon`, `statusValido(presupuesto)`, `prepararPresupuesto` (líneas 215 a 240) y `correr` (línea 78) y el test `--presupuesto con rondas de arquitecto por encima del tope sale con 1 y estado=excedido` (línea 255) como modelo.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- En `formato-flujo.test.mjs` añade 2 tests: (a) `STATUS_COMPACTO` con la línea `Presupuesto: F29; rondas arq=3 plan=0; ampliado=0; amp_arq=1; amp_plan=2; amp_k=1` se acepta (`[]`); (b) la misma línea con el orden cambiado (`; amp_plan=2; amp_arq=1`) se rechaza con un error que incluye `Presupuesto`.
- En `validar-tarea.test.mjs` añade 2 tests con `prepararPresupuesto` y la carpeta `F90-prueba`: (a) una tarea con `registroLista`, `statusValido('Presupuesto: F90; rondas arq=3 plan=0; ampliado=0; amp_arq=1')`: salida 0 y línea exacta `Presupuesto F90: D=4/7; E=1; I=1; K=0/2; rondas arq=3/3 plan=0/3; estado=ok`; (b) la misma tarea con `arq=4` y `amp_arq=1`: salida 1 y línea exacta `Presupuesto F90: D=5/7; E=1; I=1; K=0/2; rondas arq=4/3 plan=0/3; estado=excedido arq`. Valores medidos con el prototipo de task-01 (mismas cuentas con T=1).
- No cambies tests existentes ni los helpers.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: cuatro tests nuevos en dos archivos de prueba.
Fuera de alcance: `scripts/`, `skills/`, `agentes/`, `definitions/` y la base `pruebas/fixtures/regresion-f24-f29.json` (los validadores de tarea no cambian y esa base no incluye la línea `Presupuesto:`; no se regenera).

## Pasos
1. Lee las *Notas* de task-01.
2. Añade los 2 tests de `formato-flujo.test.mjs` tras el test de la línea 185.
3. Añade los 2 tests de `validar-tarea.test.mjs` tras el de la línea 255.
4. Corre la *Verificación*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/formato-flujo.test.mjs` da `ℹ tests 22` y `ℹ fail 0` (hoy 20 y 0).
2. `node --test pruebas/comprobaciones/validar-tarea.test.mjs` da `ℹ tests 29` y `ℹ fail 0` (hoy 27 y 0).
3. `node --test pruebas/comprobaciones/regresion-validadores.test.mjs` da `ℹ pass 9` y `ℹ fail 0` (sin cambios).
4. `bash pruebas/rapida.sh` da `ℹ fail 6`, los mismos ajenos de antes (suben 4 los tests).

## Verificación
```
node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
node --test pruebas/comprobaciones/validar-tarea.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
```
Esperado: `ℹ tests 22` y `ℹ fail 0`; `ℹ tests 29` y `ℹ fail 0`; `ℹ pass 9` y `ℹ fail 0`; `ℹ fail 6`, con `ℹ tests` igual a 682 más los de task-01 más 4 (base medida el 2026-11-03: 682 tests, 6 fail ajenos). Cada `exit` es el de `grep` (0).
La *Evidencia* se pega concisa: solo la salida literal de cada comando, sin repetir los resultados en prosa.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 22
ℹ fail 0
exit 0
$ node --test pruebas/comprobaciones/validar-tarea.test.mjs 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 29
ℹ fail 0
exit 0
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
ℹ pass 9
ℹ fail 0
exit 0
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ (tests|fail)'; echo "exit $?"
ℹ tests 697
ℹ fail 6
exit 0
```

## Notas
- Los 4 tests ya estaban escritos en los dos archivos de prueba cuando empecé; no los dupliqué ni cambié ningún test existente. Quedan exactamente los 4 que pide la tarea: en `formato-flujo.test.mjs`, «status compacto: Presupuesto con sufijos amp_* en orden se acepta» y «status compacto: Presupuesto con sufijos amp_* fuera de orden se rechaza»; en `validar-tarea.test.mjs`, «--presupuesto con amp_arq=1 y arq=3 dentro de tope sale con 0 y estado=ok» y «--presupuesto con arq=4 y amp_arq=1 sobre el tope ampliado sale con 1 y estado=excedido arq». Sus valores coinciden con *Decisiones ya tomadas*.
- Bloqueo anterior resuelto: `task-01-tope-por-rol-en-formato-presupuesto.md` mide 6983 caracteres (`wc -c`), bajo el tope de 8192; el criterio 4 ya no depende de task-01.
- El conteo de `rapida.sh` (697 = 682 base + 11 de task-01 + 4 de esta tarea) confirma que los 4 tests están y que los 6 `fail` son los ajenos de siempre.
- Huecos menores: ninguno.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
