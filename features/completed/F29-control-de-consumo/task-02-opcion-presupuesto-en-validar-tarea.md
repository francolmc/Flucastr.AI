# task-02 — Opción --presupuesto en validar-tarea.mjs
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`scripts/validar-tarea.mjs` gana la opción `--presupuesto features/Fxx-nombre` (solo lectura): lee las `task-*.md` de esa carpeta y `definitions/STATUS.md`, y con `formato-presupuesto.mjs` (task-01) imprime una línea de presupuesto. El comportamiento sin la opción nueva, con `--evidencia` y con `--fuente` no cambia.

## Contexto
- Tocar: `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- Fuente: definitions/CONSUMO.md «(b) Presupuesto por feature»
- `scripts/validar-tarea.mjs` (3332 B): importa `readFileSync`, `validarTarea`, `validarEvidencia`, `validarFuente`; `conEvidencia`/`conFuente` salen de `argumentos[0]`; `opcionDesconocida` rechaza cualquier otra `--...`; usa `process.exitCode`, nunca `process.exit`.
- `pruebas/comprobaciones/validar-tarea.test.mjs`: usa `spawnSync(process.execPath, [script, ...args])`, `base = pruebas/.temporales` y un directorio temporal `dir` que se borra en `after`.
- Instalación: el lanzador `~/.flucastr-ai/validar-tarea.mjs` importa `scripts/validar-tarea.mjs` de la raíz del kit (`instalar.sh`, líneas 449-465), así que el módulo nuevo se resuelve por import relativo, como `formato-fuente.mjs` (*confirmado* leyendo el código).
- Lee solo las *Notas* de task-01.

## Decisiones ya tomadas
- `--presupuesto` debe ser el primer argumento y va con exactamente una ruta de carpeta; cualquier argumento extra, o ninguna ruta, sale con 2 y un mensaje en stderr que empieza por `Uso: ... --presupuesto features/Fxx-nombre`. Se añade a la excepción de `opcionDesconocida`.
- Lee solo los archivos que cumplen `/^task-.*\.md$/` directamente en la carpeta (no entra en subcarpetas, `completed/` ni `registro/`) y `definitions/STATUS.md` relativo al directorio actual. `feature` = la parte `Fxx` del nombre de la carpeta (`/^F\d+/`); si no la tiene, salida 2.
- Salida: si `validarStatusCompacto` da motivos, imprime una línea `definitions/STATUS.md: <motivo>` por motivo y sale con 1 (sin línea de presupuesto). Si no, imprime la `linea` de `calcularPresupuesto`; sale 1 con `estado=excedido` y 0 con `ok` o `aviso`.
- Carpeta o `STATUS.md` ilegibles: stderr y salida 2. No escribe nada.
- Se actualiza el comentario de cabecera del script con el uso nuevo.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el CLI y sus pruebas.
Fuera de alcance: cambiar `formato-presupuesto.mjs`, el lanzador de `instalar.sh`, `--evidencia`, `--fuente`, los agentes y todo lo de `definitions/`.

## Pasos
1. En `validar-tarea.mjs`, añade el import y la rama `--presupuesto` antes del flujo actual, sin alterarlo.
2. En `validar-tarea.test.mjs`, añade pruebas con fixtures sintéticas bajo `dir` (carpeta `F90-prueba/` con tareas y un `definitions/STATUS.md`, ejecutando con `cwd` = `dir`): salida 0 con `estado=ok` y con `estado=aviso`; salida 1 con `estado=excedido`; salida 1 con un `STATUS.md` de 1537 B y con una línea faltante; salida 2 con carpeta inexistente y con un argumento extra.
3. Control negativo: dos tareas en `F90-prueba/completed/` con `Registro:` no suman a `E`.
4. Corre las pruebas de validar-tarea, de puerta previa y la rápida.

## Criterios de aceptación
1. `validar-tarea.test.mjs` da `ℹ fail 0` y las pruebas previas de `--evidencia` y `--fuente` siguen en verde.
2. `node scripts/validar-tarea.mjs --presupuesto features/F29-control-de-consumo` desde la raíz, con el `STATUS.md` actual (formato antiguo), sale 1 con un motivo sobre `STATUS.md` y no escribe nada (`git status --short` no cambia).
3. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/validar-tarea.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
node scripts/validar-tarea.mjs --presupuesto features/F29-control-de-consumo; echo "exit $?"
node scripts/validar-tarea.mjs --presupuesto 2>&1; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0` en el primero; `definitions/STATUS.md:` y `exit 1` en el segundo; `Uso` y `exit 2` en el tercero; `ℹ fail 7` en el último.

## Evidencia

```
$ node --test pruebas/comprobaciones/validar-tarea.test.mjs pruebas/comprobaciones/puerta-previa.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
exit 0
```

```
$ node scripts/validar-tarea.mjs --presupuesto features/F29-control-de-consumo; echo "exit $?"
definitions/STATUS.md: El STATUS.md compacto ocupa 2134 B; el tope es 1536 B.
definitions/STATUS.md: La línea 1 debe ser «# Estado».
definitions/STATUS.md: Falta la línea «Escalación».
definitions/STATUS.md: Falta la línea «Paso actual».
[... motivos intermedios de la misma salida, todos «definitions/STATUS.md: ...» ...]
definitions/STATUS.md: Línea no esperada: «## Bloqueos abiertos».
definitions/STATUS.md: Línea no esperada: «».
definitions/STATUS.md: Línea no esperada: «Ninguno.».
definitions/STATUS.md: Línea no esperada: «».
definitions/STATUS.md: Línea no esperada: «## Última actualización».
definitions/STATUS.md: Línea no esperada: «».
definitions/STATUS.md: Línea no esperada: «2026-11-01».
exit 1
exit 1
```

```
$ node scripts/validar-tarea.mjs --presupuesto 2>&1; echo "exit $?"
Uso: node validar-tarea.mjs --presupuesto features/Fxx-nombre
exit 2
exit 2
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
exit 0
```

## Notas
Cambios: `scripts/validar-tarea.mjs` (import de `formato-presupuesto.mjs`, función `presupuesto` y rama `--presupuesto` antes del flujo existente, cabecera actualizada) y `pruebas/comprobaciones/validar-tarea.test.mjs` (11 pruebas nuevas con fixtures bajo `dir`: ok, aviso K2, excedido arq, 1537 B, línea «Retomar» faltante, carpeta inexistente, argumento extra y sin carpeta; el control negativo de `completed/` está en la preparación de fixtures y lo verifica la prueba de `ok`). Las pruebas de `--evidencia`, `--fuente` y de la opción desconocida no se tocaron y siguen verdes.
Corrección de una expectativa de prueba antes de la verificación (no es una pasada): en el caso `excedido` puse `D=1`, pero `D = E + arq + plan = 4`; el código era correcto y se corrigió la prueba.
Huecos menores: (1) las entradas de la carpeta que no son archivo (p. ej. un directorio `task-x.md`) se ignoran, y las tareas se leen en orden alfabético, para que la salida sea determinista; (2) el `--presupuesto` con una carpeta cuyo nombre no empieza por `Fxx` sale con 2, como indica la tarea, con un mensaje propio en stderr.
La salida de `--presupuesto` del criterio 2 no escribe nada: el código solo llama a `readdirSync` y `readFileSync`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
