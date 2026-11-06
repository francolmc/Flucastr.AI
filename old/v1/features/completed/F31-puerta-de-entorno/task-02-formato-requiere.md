# task-02 — Módulo `formato-requiere.mjs`: vocabulario cerrado de `Requiere:`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`Requiere:` es una línea de *Contexto* que declara el entorno que exige la tarea. Esta tarea crea el módulo puro que define el vocabulario y lo analiza; lo usarán el validador de tarea (task-03) y `scripts/entorno.mjs` (task-04). No toca ningún archivo existente.

## Contexto
- Tocar: `scripts/formato-requiere.mjs`, `pruebas/comprobaciones/formato-requiere.test.mjs`
- Requiere: ninguno
- Convención (confirmado en `scripts/formato-fuente.mjs`): módulo ESM puro con función exportada, comentario de cabecera en español, sin tocar disco; `formato-tarea.mjs` exporta `secciones(lineas)` que divide por `## `.
- Pruebas: `node:test` + `node:assert/strict`, como `pruebas/comprobaciones/formato-tarea.test.mjs`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «4. Pieza 1 — Puerta de entorno»

## Decisiones ya tomadas
- Línea: `- Requiere: ninguno` o `- Requiere: <item>, <item>` (separador exacto `, `, sin comillas invertidas, sin repetidos).
- Vocabulario cerrado: `docker`, `navegador`, `red`, `puerto:<n>` (entero 1–65535, sin ceros a la izquierda), `runtime:<nombre>@<versión>` (nombre uno de `node`, `npm`, `python`, `python3`, `go`, `java`, `deno`, `bun`, `dotnet`; versión `\d+(\.\d+){0,2}`), `largo:<segundos>` (entero 1–3600). `ninguno` no se combina con otros.
- Exporta `RE_REQUIERE_LINEA`, `parsearRequiere(valor)` → `{ ok: true, items: [{tipo, valor?, nombre?, version?, texto}] }` o `{ ok: false, error }`, y `extraerRequiere(texto)` → `{ estado: 'ausente' | 'multiple' | 'presente', valor? }` leyendo las líneas `- Requiere: ` de la sección `## Contexto` (usa `secciones` de `./formato-tarea.mjs`). `texto` es el item original (p. ej. `puerto:55432`).
- `ninguno` devuelve `items: []`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el módulo y sus pruebas.
Fuera de alcance: la regla en `formato-tarea.mjs` (task-03), las sondas (task-04), `--sugerir` (task-05), `definitions/WORKFLOW.md` (pendiente de puerta 1).

## Pasos
1. Crea `scripts/formato-requiere.mjs` con las tres exportaciones.
2. Crea `pruebas/comprobaciones/formato-requiere.test.mjs` con casos válidos (`ninguno`, `docker, puerto:55432`, `runtime:node@24`, `largo:240`).
3. Agrega casos inválidos con control negativo: vacío, `Docker`, `puerto:0`, `puerto:70000`, `runtime:ruby@3`, `runtime:node`, `largo:0`, `docker,red` (sin espacio), `docker, docker`, `ninguno, docker`.
4. Agrega casos de `extraerRequiere`: sin línea → `ausente`; dos líneas → `multiple`; una → `presente`; una línea dentro de otra sección no cuenta.

## Criterios de aceptación
1. Cada valor del vocabulario se acepta y devuelve sus items; se comprueba con el test.
2. Cada valor inválido de *Pasos* 3 devuelve `ok: false` con un `error` en español; se comprueba con el test.
3. `extraerRequiere` distingue ausente, múltiple y presente; se comprueba con el test.

## Verificación
```
node --test pruebas/comprobaciones/formato-requiere.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ fail 0` y `ℹ pass` igual a `ℹ tests`, con al menos 3 pruebas.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-requiere.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 4
ℹ pass 4
ℹ fail 0
exit 0
```

## Notas
- Hueco menor: el test importa `../../scripts/formato-requiere.mjs` directamente (no hay re-export en `pruebas/comprobaciones/`, a diferencia de `formato-tarea.mjs`); el módulo vive solo en `scripts/`, como pide *Tocar*.
- Hueco menor: `extraerRequiere` devuelve `valor` sin recortar (texto tal cual tras «- Requiere: »); `- Requiere:` sin espacio no se reconoce como línea. Opción conservadora para que task-03 valide la presencia de la línea con la misma regla.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
