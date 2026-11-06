# task-01 — Parser de `Evita leer:`, `Lee:` y `Lectura extra:` en formato-encargo.mjs
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`scripts/formato-encargo.mjs` ya lee `Disparó:` del encargo. Esta tarea le suma, en el mismo módulo (un solo parser de líneas `Clave:`, como pide la fuente), las funciones puras que deciden qué lectura es «extra» (ruta de `Evita leer:` que no está en `Lee:`) y cuáles de esas fueron declaradas con `Lectura extra:`. Las usan las tareas 02 y 03; no hay evento nuevo en `registrar.mjs`.

## Contexto
- Tocar: `scripts/formato-encargo.mjs`, `pruebas/comprobaciones/formato-encargo.test.mjs`
- Requiere: ninguno
- `scripts/formato-encargo.mjs` (leído): exporta `parsearDisparo`, `rutaDeTarea`, `resumirEncargo`; regex de línea `/^Disparó: …$/m`; sin I/O. Estilo: comillas simples, `export function`.
- `pruebas/comprobaciones/formato-encargo.test.mjs` (leído): 8 pruebas con `node:test`; hoy `ℹ tests 8`, `ℹ fail 0` (medido).
- Forma del encargo (confirmado, `agentes/coordinador.md` línea 60): `Lee:` rutas exactas (y la sección citada) y `Evita leer:` «`definitions/` salvo lo citado, tareas `hecha`».
- Forma de la declaración (confirmado, `skills/lectura-extra/SKILL.md` paso 3): `Lectura extra: <ruta>; motivo=<qué te falta>`, en el retorno del subagente.
- Los logs de Pi y Claude Code son inferidos: aquí solo se prueba con textos sintéticos.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «5. Telemetría sin duplicar»

## Decisiones ya tomadas
- Funciones nuevas exportadas (nombres fijos):
  - `listaDeRutas(texto, clave)`: `clave` es `'Lee'` o `'Evita leer'`. Toma la primera línea que empiece por `<clave>:` (`^…$` con flag `m`). Parte el resto por `,` o `;`; en cada trozo toma el primer token entre backticks si hay, si no la primera palabra; descarta lo que no cumpla `/^[A-Za-z0-9._\/-]+$/` o no tenga `/` ni `.`. Devuelve `string[]` (`[]` si `texto` no es string o no hay línea). Ejemplo: `Evita leer: \`definitions/\` salvo lo citado, tareas \`hecha\`` → `['definitions/']`.
  - `normalizarRuta(ruta)`: cambia `\` por `/`, quita `./` inicial y recorta todo lo anterior a la primera aparición de `definitions/`, `features/`, `registro/`, `agentes/`, `skills/`, `scripts/`, `pruebas/` o `assets/` (precedida de inicio o `/`). Si no aparece ninguna, devuelve la ruta tal cual.
  - `rutaCalza(ruta, entrada)`: normaliza ambas; si la entrada termina en `/`, calza con `startsWith`; si no, con igualdad.
  - `declaracionesLecturaExtra(textos)`: `textos` es `string[]`; toma las líneas `/^Lectura extra: (\S+); motivo=/gm`, normaliza la ruta y devuelve `Set<string>`. El motivo no se guarda ni se devuelve.
  - `resumirLecturaExtra({ encargo, rutas, textos })`: `rutas` son las leídas con `read`. Una ruta es extra si calza con alguna entrada de `Evita leer` y con ninguna de `Lee`. Devuelve `{ extras, declaradas }`: `extras` = rutas normalizadas únicas, ordenadas; `declaradas` = cuántas de `extras` están en el `Set`. Con `encargo` no string, `{ extras: [], declaradas: 0 }`.
- Límite conocido y aceptado: un `Evita leer:` en prosa sin ruta (p. ej. «tareas `hecha`») no se mide; solo cuentan rutas o carpetas. No se usa el motivo en ninguna medición.
- `parsearDisparo`, `rutaDeTarea` y `resumirEncargo` no cambian.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: las cinco funciones y sus pruebas.
Fuera de alcance: leer logs (tareas 02 y 03), informe, pistas, agentes, skills, `registrar.mjs`, `definitions/`.

## Pasos
1. En `scripts/formato-encargo.mjs`, actualiza el comentario de cabecera con las cinco funciones nuevas y agrégalas al final.
2. En `formato-encargo.test.mjs`, agrega exactamente 5 pruebas: (a) `listaDeRutas` con backticks y con prosa («`definitions/` salvo lo citado» y `Lee: a/b.md «## 2», c/d.md`); (b) `normalizarRuta` de `/ws/definitions/X.md` y `.\\features/F1-x/t.md`; (c) `rutaCalza` carpeta contra archivo y archivo contra distinto archivo; (d) `declaracionesLecturaExtra` ignora el motivo y normaliza rutas absolutas; (e) `resumirLecturaExtra` con `Lee: definitions/PROJECT.md`, `Evita leer: \`definitions/\``, rutas `/ws/definitions/PROJECT.md`, `/ws/definitions/WORKFLOW.md`, `/ws/features/F33-a/task-01-b.md` y un texto con `Lectura extra: definitions/WORKFLOW.md; motivo=x` → `{ extras: ['definitions/WORKFLOW.md'], declaradas: 1 }`.
3. Corre la verificación.

## Criterios de aceptación
1. `listaDeRutas` devuelve `['definitions/']` para el ejemplo con «tareas `hecha`»; se comprueba en la prueba (a).
2. Una ruta de `Lee:` dentro de una carpeta de `Evita leer:` no es extra; se comprueba en (e).
3. El motivo de la declaración no aparece en ningún valor devuelto; se comprueba en (d).
4. Las 8 pruebas previas siguen pasando; se comprueba con el conteo.

## Verificación
```
node --test pruebas/comprobaciones/formato-encargo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ tests 13`, `ℹ pass 13`, `ℹ fail 0` (8 medidas + 5 nuevas).

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-encargo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 13
ℹ pass 13
ℹ fail 0
exit 0
```

Nota de evidencia: el comando exacto de arriba se corrió en la primera pasada (salida `ℹ tests 12`, antes de dividir la prueba de `rutaCalza`). En la segunda pasada, tras la corrección, se ejecutó `node --test pruebas/comprobaciones/formato-encargo.test.mjs > <scratchpad>/salida.txt 2>&1` y después `grep -E "^ℹ (tests|pass|fail)"` sobre ese archivo; la salida mostrada es de esa segunda pasada, con `exit 0` de `node`.

## Notas
Hueco menor: `normalizarRuta` y `rutaCalza` con entrada no string devuelven `''` y `false`; no lo fijaba la tarea. Opción conservadora: no lanzar error.
Hueco menor: `resumirLecturaExtra` acepta `rutas` o `textos` ausentes (valores por defecto `[]`) y descarta entradas no string.
Decisión: la prueba (c) de la tarea se dejó como prueba propia de `rutaCalza` (no mezclada con `normalizarRuta`) para cumplir el conteo de 5 pruebas nuevas.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
