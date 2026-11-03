# task-03 — validarStatus acepta el STATUS.md compacto
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
La prueba «definitions/STATUS.md real cumple el formato» usa `validarStatus` de `pruebas/comprobaciones/formato-flujo.mjs`, que exige el formato antiguo (`# Estado del flujo` y cinco secciones `##`). Cuando el `coordinador` pase a la plantilla compacta de una sola escritura, esa prueba fallaría. Esta tarea hace que `validarStatus` acepte también la plantilla compacta (reusando `validarStatusCompacto` de task-01) y conserve intacta la validación del formato antiguo.

## Contexto
- Tocar: `pruebas/comprobaciones/formato-flujo.mjs`, `pruebas/comprobaciones/formato-flujo.test.mjs`
- Fuente: definitions/CONSUMO.md «(a) `STATUS.md` en una sola escritura»
- `formato-flujo.mjs`: `validarStatus(texto)` (línea 114) exige `lineas[0] === '# Estado del flujo'`, secciones `##` exactas en orden y fecha en `Última actualización`. `SECCIONES_STATUS` y `seccionesStatus` son internos.
- `formato-flujo.test.mjs`: `STATUS_VALIDO` es la muestra del formato antiguo; el último test lee el `definitions/STATUS.md` real.
- Plantilla compacta: primera línea `# Estado` y siete líneas (`Escalación:`, `Paso actual:`, `Presupuesto:`, `Espera a Franco:`, `Bloqueos abiertos:`, `Retomar:`, `Actualizado:`); la valida `validarStatusCompacto` de `scripts/formato-presupuesto.mjs`.
- `definitions/WORKFLOW.md` §4 sigue describiendo el formato antiguo y no se toca (decisión 4 = A de Franco).
- Lee solo las *Notas* de task-02.

## Decisiones ya tomadas
- Si la primera línea del texto es exactamente `# Estado`, `validarStatus` devuelve el resultado de `validarStatusCompacto(texto)` y nada más. Con cualquier otra primera línea, el comportamiento actual no cambia.
- El import es `import { validarStatusCompacto } from '../../scripts/formato-presupuesto.mjs'`.
- No se cambian los mensajes del formato antiguo ni las pruebas existentes.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: una rama nueva en `validarStatus` y sus pruebas.
Fuera de alcance: `WORKFLOW.md`, `definitions/STATUS.md`, `formato-presupuesto.mjs` y `validar-tarea.mjs`.

## Pasos
1. En `formato-flujo.mjs`, importa `validarStatusCompacto` y delega al inicio de `validarStatus` cuando `lineas[0] === '# Estado'`.
2. En `formato-flujo.test.mjs`, añade una muestra compacta sintética (siete líneas, bien formada) y las pruebas: se acepta; una línea quitada se rechaza; un texto de 1537 B se rechaza; y `STATUS_VALIDO` antiguo sigue aceptado.
3. Corre `formato-flujo.test.mjs` y la rápida.

## Criterios de aceptación
1. Las pruebas nuevas de `formato-flujo.test.mjs` (al menos 4) pasan y la única prueba que falla en esa suite es «definitions/BACKLOG.md real cumple el formato» (fallo previo ajeno: la fila F26 de `definitions/BACKLOG.md` tiene 11 celdas en vez de 8); `ℹ fail 1`.
2. La muestra compacta se acepta con `[]`; la de 1537 B devuelve un motivo con `1536`; `STATUS_VALIDO` sigue dando `[]`.
3. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E '^✖ ' | sed 's/ ([0-9.]*ms)//' | sort -u; echo "exit $?"
grep -c "validarStatusCompacto" pruebas/comprobaciones/formato-flujo.mjs; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 1` en el primero; las dos líneas `✖ definitions/BACKLOG.md real cumple el formato` y `✖ failing tests:` (y ninguna otra) en el segundo; un número mayor que 0 en el tercero; `ℹ fail 7` en el último.

## Evidencia

Pasada 1 de 2 (intentos=1), la única; todos los comandos coinciden con su «Esperado».

```
$ node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 1
exit 0
```

Esperado: `ℹ fail 1`. Coincide.

```
$ node --test pruebas/comprobaciones/formato-flujo.test.mjs 2>&1 | grep -E '^✖ ' | sed 's/ ([0-9.]*ms)//' | sort -u; echo "exit $?"
✖ definitions/BACKLOG.md real cumple el formato
✖ failing tests:
exit 0
```

Esperado: `✖ definitions/BACKLOG.md real cumple el formato` y `✖ failing tests:`, y ninguna otra. Coincide.

```
$ grep -c "validarStatusCompacto" pruebas/comprobaciones/formato-flujo.mjs; echo "exit $?"
2
exit 0
```

Esperado: un número mayor que 0. Coincide (2).

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

Esperado: `ℹ fail 7`. Coincide.

Comprobación adicional de *Notas*:

```
$ node --test pruebas/comprobaciones/formato-tarea.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

## Notas
Corrección: el fallo previo de la fila F26 del BACKLOG se declara en el criterio 1.
Repetición: el código ya estaba hecho; no se reescribió. `validarStatusCompacto` está importado (línea 4) y usado en `validarStatus` (línea 121) de `formato-flujo.mjs`.
Huecos menores: 0. El archivo no tenía ninguna línea `Registro:` al empezar esta ejecución; por eso esta es la única y lleva n=1 (líneas previas más 1), no n=2.
Autocomprobación `--evidencia`: salida `OK: 1 tarea(s) con evidencia completa`, exit 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
