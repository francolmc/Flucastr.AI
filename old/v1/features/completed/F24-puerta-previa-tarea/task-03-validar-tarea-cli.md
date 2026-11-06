# task-03 — Script validar-tarea.mjs
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
La puerta previa necesita un comando que el `coordinador` pueda correr sobre una o varias tareas y que responda con un código de salida, sin que el modelo lea la tarea para decidir si está completa (S7: en yolo nadie revisaba tamaño ni secciones). Esta tarea crea `scripts/validar-tarea.mjs`, un CLI delgado sobre `validarTarea`, y su prueba.

## Contexto
- Leer: `definitions/ARCHITECTURE.md`, subsección «Raíz del kit y puerta previa de tarea (F24…)», viñeta «Contrato de `validar-tarea.mjs`». De task-02 (`depende_de`), solo sus *Notas*.
- Tocar: `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- Modelo de CLI: `scripts/archivar.mjs` y `scripts/registrar.mjs` (módulos ES, sin dependencias; aquí se usa `process.exitCode`). Modelo de prueba: `pruebas/comprobaciones/formato-tarea.test.mjs` (`node:test`, `node:assert/strict`) y `pruebas/capa1/instalacion.test.mjs` líneas 9-11 (carpeta temporal bajo `pruebas/.temporales`, ignorada por git).
- Núcleo: `scripts/formato-tarea.mjs` exporta `validarTarea(texto)` (arreglo de mensajes; vacío = válida).

## Decisiones ya tomadas
- Invocación: `node scripts/validar-tarea.mjs <ruta>...` con una o más rutas.
- Importa el núcleo con `import { validarTarea } from './formato-tarea.mjs'` (relativo al script, no al directorio actual), de modo que funcione desde cualquier cwd.
- Salida 0 si todas válidas; 1 si alguna inválida; 2 por error de uso (sin argumentos, o una ruta que no se puede leer). Si hay una ruta ilegible, termina con 2 aunque otras sean inválidas.
- Salida por stdout: una línea por rechazo, `<ruta>: <motivo>`; si todas son válidas, una sola línea `OK: <n> tarea(s) válida(s)`. Los errores de uso van a stderr con la forma `Uso: node validar-tarea.mjs <ruta-tarea>...` o `No se puede leer: <ruta>`.
- Solo lee los archivos indicados; no escribe nada, no usa red ni git.
- Se ejecuta al cargarlo: el lanzador fijo de task-04 lo carga con `import()` y le deja `process.argv` intacto. Por eso el script no exporta `main` ni usa guarda `import.meta`; lee `process.argv.slice(2)` y fija `process.exitCode` (no `process.exit`, para no cortar la salida pendiente). Cierra la duda que dejó `ARCHITECTURE.md`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el CLI y su prueba con control negativo.
Fuera de alcance: cambiar reglas del validador, instalación de la raíz, permisos del `coordinador`, recorrer carpetas (solo rutas de archivo).

## Pasos
1. Crear `scripts/validar-tarea.mjs`: leer `process.argv.slice(2)`, validar con `validarTarea`, imprimir según las decisiones y fijar `process.exitCode` en 0/1/2, sin `export`.
2. Crear `pruebas/comprobaciones/validar-tarea.test.mjs` con una carpeta temporal en `pruebas/.temporales` y tres archivos: una tarea válida de diez secciones escrita en el propio test, la misma con 4 rutas en `Tocar` (control negativo) y la válida con `Decisiones abiertas` sin resolver.
3. En la prueba, cubrir con `spawnSync(process.execPath, [script, ...])`, ejecutando con `cwd` = la carpeta temporal: válida sola da 0 y `OK: 1`; inválida sola da 1 con su ruta y «Tocar» en stdout; válida más inválida da 1 y una sola línea de rechazo por error; sin argumentos da 2; ruta inexistente da 2.
4. Ejecutar la verificación.

## Criterios de aceptación
1. Los códigos 0, 1 y 2 salen como se describe: `node --test pruebas/comprobaciones/validar-tarea.test.mjs` sin fallos.
2. Funciona desde un cwd sin `scripts/`: lo cubre el `cwd` temporal de la prueba.
3. Las tareas reales de F24 pasan: comando de *Verificación*.

## Verificación
```
node --test pruebas/comprobaciones/validar-tarea.test.mjs
node scripts/validar-tarea.mjs features/F24-puerta-previa-tarea/task-*.md; echo "salida=$?"
node scripts/validar-tarea.mjs; echo "salida=$?"
```
Esperado: `ℹ fail 0`; luego `OK: 6 tarea(s) válida(s)` y `salida=0`; luego `Uso: node validar-tarea.mjs <ruta-tarea>...` y `salida=2`.

## Evidencia
`node --test pruebas/comprobaciones/validar-tarea.test.mjs` (cola):
```
✔ una tarea válida sola sale con 0 y OK: 1
✔ una tarea inválida sola sale con 1, con su ruta y el motivo sobre «Tocar»
✔ válida más inválida sale con 1 y una sola línea de rechazo
✔ decisiones abiertas sin resolver se rechazan
✔ sin argumentos sale con 2 y muestra el uso en stderr
✔ ruta inexistente sale con 2 y lo indica en stderr
✔ una ruta ilegible sale con 2 aunque otra sea inválida
ℹ tests 7
ℹ pass 7
ℹ fail 0
```
`node scripts/validar-tarea.mjs features/F24-puerta-previa-tarea/task-*.md; echo "salida=$?"`:
```
OK: 7 tarea(s) válida(s)
salida=0
```
`node scripts/validar-tarea.mjs; echo "salida=$?"`:
```
Uso: node validar-tarea.mjs <ruta-tarea>...
salida=2
```
`bash pruebas/rapida.sh` (cola): `ℹ fail 7`, los 7 fallos ajenos previos (ninguno en `validar-tarea`); salida=1, igual que antes de la tarea.

Criterios: 1 cumplido (tests 7/7, `fail 0`). 2 cumplido (la prueba corre con `cwd` en una carpeta temporal sin `scripts/`). 3 cumplido en código de salida y reglas (las siete tareas F24 son válidas); el conteo esperado «6» no coincide con el real «7» (ver Notas).

## Notas
- Corrección 2026-11-01: el script se ejecuta al importarse (lo carga el lanzador fijo de task-04); `process.exitCode` en vez de `process.exit`.
- Decisión menor: «una línea por rechazo» se implementó como una línea por motivo devuelto por `validarTarea` (formato `<ruta>: <motivo>`), no una línea por archivo.
- Hueco menor: la *Verificación* espera `OK: 6` y el glob `task-*.md` de F24 da 7 archivos (task-01 a task-07; task-06 y task-07 se renumeraron en el árbol de trabajo). Las siete son válidas y el código es 0. No se cambió la tarea ni el validador; el «6» parece estar desactualizado y conviene que Franco lo corrija al revisar.
- Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
