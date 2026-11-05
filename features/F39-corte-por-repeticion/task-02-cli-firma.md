# task-02 — `--presupuesto ... --firma` en la CLI (solo lectura)
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Conecta el estado `repetido` con `scripts/validar-tarea.mjs`: `--presupuesto features/Fxx-nombre --firma '<regla>|<ruta>|<hash>'` calcula el resumen de la firma, lo compara con el guardado en `STATUS.md` y sale 1 con `estado=repetido`. La CLI no escribe nada: el historial lo guarda el coordinador en `STATUS.md`, fuera de `features/`.

## Contexto
- Tocar: `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- `scripts/validar-tarea.mjs`: función `presupuesto(args)` (líneas 54-92; exige `args.length === 1`) y cabecera (líneas 1-28).
- De `depende_de:` lee solo las *Notas* de task-01 (nombres exportados: `digestFirma`, parámetro `firma` de `calcularPresupuesto`).
- Prueba: `node --test pruebas/comprobaciones/validar-tarea.test.mjs`; busca allí las pruebas existentes de `--presupuesto` y sigue su patrón de directorio temporal y `spawnSync`.
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Especificación: viñeta «Alcance de F37–F39 (Franco, 2026-11-04)», parte F39.
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Forma: `--presupuesto <carpeta> [--firma <valor>]`. `<valor>` es la firma sin `Firma: `. Otro número de argumentos, `--firma` sin valor o una opción distinta salen 2 con el mensaje de uso en stderr.
- La CLI calcula `digestFirma(valor)` y lo pasa como `firma` a `calcularPresupuesto`. Exit 1 con `estado=excedido` o `estado=repetido`; 0 con `ok` o `aviso`.
- Sigue sin escribir: ni archivos ni historial. Cabecera actualizada con la forma nueva.
- Sin `--firma`, la salida es idéntica a la actual.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: parseo de `--firma`, uso, cabecera y 4 pruebas.
Fuera de alcance: escribir historial, tocar `STATUS.md`, el skill, `formato-presupuesto.mjs`.

## Pasos
1. Corre `git branch --show-current`.
2. En `presupuesto(args)` acepta `[carpeta]` o `[carpeta, '--firma', valor]`, calcula el digest y pásalo; actualiza uso y cabecera.
3. En `validar-tarea.test.mjs` agrega: (a) `STATUS.md` con `firma=<digest de X>` y `--firma X`: stdout con `estado=repetido`, exit 1; (b) `--firma Y` distinta: `estado=ok` o `aviso`, exit 0, y la línea termina en `; firma=<digest de Y>`; (c) `--firma` sin valor: exit 2; (d) el directorio de la feature y `definitions/STATUS.md` no cambian (nombres, tamaños y mtime iguales antes y después, como en `pruebas/comprobaciones/entorno.test.mjs` líneas 168-178).

## Criterios de aceptación
1. Dos rechazos con la misma firma dan `repetido` y exit 1 (prueba a).
2. Dos con firmas distintas no (prueba b).
3. `--firma` mal formado sale 2 (prueba c).
4. La CLI no escribe en el directorio de la tarea ni en `STATUS.md` (prueba d).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/validar-tarea.test.mjs
node --test pruebas/comprobaciones/formato-presupuesto.test.mjs
```
Esperado: rama `feature/F39-corte-por-repeticion`; las dos pruebas con 0 fallos.

## Evidencia
```
$ git branch --show-current
feature/F39-corte-por-repeticion
exit 0
```
```
$ node --test pruebas/comprobaciones/validar-tarea.test.mjs
ℹ tests 40
ℹ suites 0
ℹ pass 40
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2059.542375
exit 0
```
```
$ node --test pruebas/comprobaciones/formato-presupuesto.test.mjs
ℹ tests 36
ℹ suites 0
ℹ pass 36
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 95.845291
exit 0
```

## Notas
- Rama `feature/F39-corte-por-repeticion` ya existía y es la actual: no se ejecutó ningún comando de rama.
- `entorno.mjs` devolvió `ok`.
- Hueco menor: `--firma ""` (valor vacío) se trata como uso y sale 2, igual que `--firma` sin valor. Opción conservadora; no hay prueba propia de ese caso.
- Las pruebas (a)–(d) se añadieron después de «--presupuesto sin carpeta» en `validar-tarea.test.mjs`. La prueba (d) compara nombres, tamaños y mtime de las entradas de primer nivel de la carpeta de la feature y de `definitions/STATUS.md`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
