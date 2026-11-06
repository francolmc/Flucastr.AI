# task-02 — `formato-tarea`: error si la tarea supera 8 KB
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`definitions/CONTEXTO.md` §2.3 y `definitions/WORKFLOW.md` §6 ponen el tope de tarea en 8 KB como error. `pruebas/comprobaciones/formato-tarea.mjs` valida la plantilla pero no el tamaño. Esta tarea agrega la regla 9 (largo ≤ 8192 caracteres) y hace que la prueba de tareas reales solo cubra las vigentes de `features/`, no las archivadas en `completed/` (históricas, casi todas sobre 8 KB).

## Contexto
- Tocar: `pruebas/comprobaciones/formato-tarea.mjs` y `pruebas/comprobaciones/formato-tarea.test.mjs`. No tocar otros archivos.
- `formato-tarea.mjs`: `validarTarea(texto)` devuelve un arreglo de mensajes; ya tiene `const todo = String(texto).replace(/\r\n?/g, '\n')` y reglas 1-8 (la 8 es la última, antes de `return errores`). Los mensajes van en español.
- `formato-tarea.test.mjs`: `muestra` (línea 10), arreglo `variantes` (línea ~47, pares `[nombre, función]` que deben producir error; el bucle `test('rechaza ... ${nombre}')` está en la línea ~63), `reales` (línea ~75: `fs.readdirSync(features, { recursive: true })` filtrado por `/(^|\/)task-\d{2}-[^/]*\.md$/`) y los tests que lo usan. Se ejecuta con `node --test`.
- Medidas reales (bytes, `find features -name 'task-*.md'`): las tareas vigentes más grandes miden ~8,1 KB (F22 task-01, 8152 bytes, menos caracteres); las de `features/completed/` llegan a 24 KB.
- Referencia: `definitions/CONTEXTO.md` §2.3.

## Decisiones ya tomadas
- Constante `MAX_CARACTERES = 8192` exportada desde `formato-tarea.mjs`; el largo es `todo.length` (caracteres, 1 KB = 1024, igual que `archivar.mjs`). Error si `todo.length > MAX_CARACTERES`; exactamente 8192 es válido.
- Mensaje: `La tarea mide ${n} caracteres; el máximo es 8192 (8 KB).`
- `reales` excluye las rutas que empiezan por `completed/`; las archivadas quedan fuera del tope. La regla vale para toda tarea nueva o vigente.
- La regla de 6 KB como aviso NO va aquí (la cubre la tarea-01 en `archivar.mjs`).

## Alcance / Fuera de alcance
Alcance: regla 9 en el validador, caso negativo y positivo, filtro de `completed/` en `reales`.
Fuera de alcance: aviso a 6 KB, cambiar `archivar.mjs`, recortar tareas existentes, tocar `WORKFLOW.md` o las skills.

## Pasos
1. En `formato-tarea.mjs`, exportar `MAX_CARACTERES = 8192` y agregar la regla 9 al final de `validarTarea`, antes de `return errores`.
2. En `formato-tarea.test.mjs`, importar `MAX_CARACTERES` junto a `validarTarea` y agregar a `variantes` el caso `['regla 9: más de 8192 caracteres', (t) => t.replace('Texto que describe el objetivo de la tarea.', 'x'.repeat(MAX_CARACTERES))]`.
3. Agregar el test positivo: la muestra rellenada hasta exactamente `MAX_CARACTERES` caracteres (reemplazar el texto de Descripción por `x` repetida lo justo, sin saltos de línea) devuelve `[]`.
4. Filtrar `completed/` en `reales`: añadir `.filter((r) => !r.startsWith('completed/'))` antes del `.map`.
5. Comprobar que las tareas vigentes de `features/` (hoy F22 y F23) pasan; si alguna supera 8192 caracteres, anotarlo en *Notas* y detenerse (no recortarla).

## Criterios de aceptación
1. `validarTarea` devuelve un error con «8192» para una tarea de 8193 caracteres o más (caso negativo de `variantes`).
2. Una tarea de exactamente 8192 caracteres es válida (test positivo).
3. `reales` no incluye rutas de `completed/` y el test «las tareas reales de features/ cumplen el formato» pasa.
4. Los casos negativos 1-8 existentes siguen pasando.
5. `rapida.sh` termina en 0 dentro del tope de 30 s.

## Verificación
```
node --test pruebas/comprobaciones/formato-tarea.test.mjs
bash pruebas/rapida.sh
```
Salida esperada: `ℹ fail 0` en el primero; `rapida: ... (tope 30 s)` y código 0 en el segundo.

## Evidencia
```
$ node --test pruebas/comprobaciones/formato-tarea.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
(…) rechaza una tarea con violación de regla 9: más de 8192 caracteres ✔
(…) una tarea de exactamente MAX_CARACTERES caracteres es válida ✔
(…) las tareas reales de features/ cumplen el formato ✔
exit=0

$ bash pruebas/rapida.sh
ℹ tests 351
ℹ pass 351
ℹ fail 0
rapida: 29 archivos en 20 s (tope 30 s)
exit=0

$ comprobación del mensaje de la regla 9 (node -e, tarea de 8267 caracteres)
[ 'La tarea mide 8267 caracteres; el máximo es 8192 (8 KB).' ]
```

## Notas
- Hueco menor: el criterio 1 pide que el error contenga «8192», pero el caso de `variantes` solo exige al menos un error. No añadí una aserción nueva en el test; comprobé el texto del mensaje con `node -e` (ver *Evidencia*).
- `reales` filtra `completed/` por prefijo de ruta relativa con `/`; en Windows la ruta usaría `\`, no aplica a este repo.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
