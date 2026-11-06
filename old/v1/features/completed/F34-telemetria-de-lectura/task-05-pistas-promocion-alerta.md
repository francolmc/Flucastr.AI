# task-05 — pistas.mjs: pistas 7 (promoción), 8 (alerta) y 9 (cumplimiento)
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
`calcularPistas` suma tres pistas de lectura desde `corridas` (con `lecturaExtra` y `kb`, tasks 02 y 03): la 7 propone promover a `Lee:` un archivo leído de más con frecuencia; la 8 alerta si las lecturas extra por llamada o los KB por corrida se disparan; la 9 avisa si se declaran menos del 90 % de las lecturas extra. Decide Franco; las pistas solo sugieren.

## Contexto
- Tocar: `scripts/pistas.mjs`, `pruebas/comprobaciones/informe-pistas-lectura.test.mjs`
- Requiere: ninguno
- De `depende_de:` lee solo las *Notas* de task-03 (forma de la corrida: `{ rol, disparo, feature, tarea, turnos, costo, kb, lecturaExtra: { extras, declaradas } }`; `kb` puede ser `null`).
- `scripts/pistas.mjs` (leído, 107 líneas): `ACCION` por número (1 a 6); `calcularPistas(eventos, { corridas = null, consumo = null })` emite con `emitir(n, feature, medicion)`; el bloque de pista 6 (`if (consumo) {…}`) está en las líneas 99 a 105 y el `sort` final usa `n` y luego `feature` (con `null` en pistas globales el orden entre iguales es el de inserción).
- Ejemplo de pruebas puras: `pruebas/comprobaciones/informe-pistas.test.mjs` (12 pruebas, `ℹ fail 0`; lee solo líneas 1 a 50 como modelo de `import` y helpers).
- Umbrales *supuestos*, a calibrar con datos reales.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «5. Telemetría sin duplicar»

## Decisiones ya tomadas
- Constantes exportadas: `UMBRAL_PROMOCION_CORRIDAS = 3`, `UMBRAL_PROMOCION_FEATURES = 2`, `UMBRAL_EXTRAS_POR_LLAMADA = 1`, `UMBRAL_KB = 1.25`, `UMBRAL_CUMPLIMIENTO = 0.9`.
- Todo bajo `if (corridas)` (sin corridas no se evalúan). Una corrida sin `lecturaExtra` cuenta como 0 extras. Las tres pistas son globales (`feature: null`); se insertan en orden de rol y de ruta (alfabético) para un orden estable.
- Pista 7, por par `(rol, ruta)`: corridas del rol con esa ruta en `extras` ≥ 3 **y** features distintas no nulas de esas corridas ≥ 2. Medición: `<rol> lee de más \`<ruta>\` en <c> corridas y <f> features`. Acción: «Pásala a `Lee:` del rol o a su lista de «Qué lees» (decide Franco).»
- Pista 8, por rol, dos formas independientes (como la pista 4):
  - (a) Σ `extras.length` / n° de corridas del rol > 1 (estricto). Medición: `<rol>: <x> lecturas extra por llamada` con `x` a un decimal (`toFixed(1)`).
  - (b) media de `kb` de corridas **con** extras > 1,25 × media de `kb` de corridas **sin** extras (solo `kb` numérico; hacen falta al menos una de cada tipo y media sin extras > 0). Medición: `<rol>: <p> % más KB por corrida con lectura extra que sin ella` con `p = Math.round((con/sin - 1)*100)`. La base es la propia del rol sin extras (supuesto: el documento no fija otra base).
  - Acción: «Lecturas extra por encima del límite: si se repite en una segunda feature, vuelve ese rol a «No leas» duro (decide Franco).»
- Pista 9, global: con Σ extras ≥ 1 y Σ declaradas / Σ extras < 0,9 (estricto). Medición: `<d> de <e> lecturas extra declaradas (<p> %)` con `p = Math.round(d*100/e)`. Acción: «Declara cada lectura extra con `Lectura extra:` en el retorno.»
- Se agregan `7`, `8`, `9` a `ACCION`. No se tocan las pistas 1 a 6 ni `informe.mjs` (task-06).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `pistas.mjs` y 6 pruebas puras en un archivo nuevo.
Fuera de alcance: `informe.mjs` y su mensaje de «no evaluadas» (task-06), CLI (task-07), logs.

## Pasos
1. En `pistas.mjs` actualiza el comentario de cabecera (pistas 7 a 9), agrega constantes y `ACCION`, y un bloque `if (corridas)` antes del `return`.
2. Crea `informe-pistas-lectura.test.mjs` con 6 pruebas de `calcularPistas([], { corridas })`: (1) pista 7 con 3 corridas del `planificador` en F01, F02, F02 que leen de más `definitions/A.md`; (2) no dispara si las 3 son de la misma feature o si son 2 corridas en 2 features; (3) pista 8(a): 2 corridas con 3 extras en total (1,5 por llamada) dispara; 2 corridas con 2 extras (1,0) no; (4) pista 8(b): `kb` 10 con extras contra 6 sin extras (+67 %) dispara y 7 contra 6 (+17 %) no; (5) pista 9: 8 declaradas de 10 → `8 de 10 lecturas extra declaradas (80 %)`; 9 de 10 no dispara; (6) sin `corridas` o con corridas sin `lecturaExtra` no emite pistas 7 a 9.
3. Corre la verificación.

## Criterios de aceptación
1. La pista 7 exige 3 corridas y 2 features a la vez; pruebas (1) y (2).
2. La pista 8 dispara por cualquiera de sus dos formas y respeta los umbrales estrictos; prueba (3) y (4).
3. La pista 9 dispara bajo 90 % y no en 90 %; prueba (5).
4. Sin datos de lectura no hay pistas 7 a 9, y las pruebas existentes de pistas no cambian; prueba (6) y conteo.

## Verificación
```
node --test pruebas/comprobaciones/informe-pistas-lectura.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --test pruebas/comprobaciones/informe-pistas.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ tests 6`, `ℹ pass 6`, `ℹ fail 0`; luego `ℹ tests 12`, `ℹ pass 12`, `ℹ fail 0` (12 medidas).

## Evidencia
```
$ node --test pruebas/comprobaciones/informe-pistas-lectura.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 6
ℹ pass 6
ℹ fail 0
exit 0

$ node --test pruebas/comprobaciones/informe-pistas.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 12
ℹ pass 12
ℹ fail 0
exit 0
```

Criterios: 1 (pista 7 exige 3 corridas y 2 features) prueba «pista 7 dispara…» y «pista 7 no dispara…» en verde; 2 (pista 8 por cualquiera de sus formas, umbrales estrictos) pruebas 8 (a) y 8 (b) en verde; 3 (pista 9 bajo 90 %, no en 90 %) prueba de pista 9 en verde; 4 (sin datos no hay pistas 7 a 9; pruebas existentes sin cambio) prueba «sin corridas…» en verde y las 12 de informe-pistas en verde.

## Notas
Hueco menor: la tarea describe 6 pruebas pero la prueba (1) y la (2) estaban en un solo `test`; se separaron en dos para que el conteo sea 6. Primera pasada: 5 tests (no pasó el conteo); segunda pasada tras separar: 6 y 6/6. Cuenta como intento 2 de 2.
Hueco menor: «features distintas no nulas» se implementó como `typeof feature === "string"`.
Hueco menor: `extras` se trata como arreglo de rutas (forma de task-03); `declaradas` ausente cuenta 0 y `lecturaExtra` ausente cuenta 0 extras. `kb` no numérico se excluye de la forma (b).
Decisión: orden de emisión de pistas 7 y 8 por rol alfabético y ruta alfabética; dentro de un rol, 8 (a) antes que 8 (b). El `sort` final es estable para `feature: null`.
Estado: `en curso` se puso antes de editar código (paso 3 del procedimiento en orden).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
