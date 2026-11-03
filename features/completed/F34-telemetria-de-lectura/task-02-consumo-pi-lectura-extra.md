# task-02 — consumo.mjs (Pi): `kb` y `lecturaExtra` por corrida de subagente
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Cada corrida de subagente de Pi ya sale en `subagentes.corridas` con `{ rol, disparo, feature, tarea, turnos, costo }`. Esta tarea agrega `kb` (KB leídos en la corrida) y `lecturaExtra: { extras, declaradas }`, calculados con `resumirLecturaExtra` (task-01) sobre el encargo (`meta.task`), las rutas leídas del transcript y los textos del asistente. Es el insumo del conteo, la promoción y la alerta.

## Contexto
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo-fixtures.mjs`, `pruebas/comprobaciones/consumo.test.mjs`
- Requiere: ninguno
- De `depende_de:` lee solo las *Notas* de task-01 (firma de `resumirLecturaExtra`).
- `scripts/consumo.mjs` (leído): `analizarSubagentesPi` (línea 252) hace `corridas.push({ rol, disparo, feature, tarea, turnos, costo })` en la línea 289, antes de leer el transcript; `lecturasDeTranscript(texto)` (línea 206) devuelve `Map<ruta, { lecturas, bytes }>`; `aKb` (línea 78); `import { resumirEncargo } from "./formato-encargo.mjs"` (línea 20).
- `consumo-fixtures.mjs` (leído): `transcriptSubagentePi({ lecturas })` arma un mensaje del asistente con `CENTINELA_TEXTO`.
- `consumo.test.mjs`: hoy `ℹ tests 54`, `ℹ fail 0` (medido). Las pruebas `corridas (1)` y `corridas (2)` (líneas 492 a 528) usan `deepEqual` sobre `r.corridas` y deben actualizarse.
- Logs de Pi: formato de `transcript` inferido; solo fixtures sintéticos, sin logs reales.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «5. Telemetría sin duplicar»

## Decisiones ya tomadas
- La corrida pasa a `{ rol, disparo, feature, tarea, turnos, costo, kb, lecturaExtra }`. Se crea el objeto, se empuja y, tras leer el transcript, se le asignan `kb` y `lecturaExtra` (misma posición en el arreglo).
- Sin transcript: `kb: null` y `lecturaExtra: { extras: [], declaradas: 0 }`. Con transcript sin lecturas: `kb: 0`.
- `kb` = `aKb(suma de bytes de las lecturas de esa corrida)`.
- Función nueva `textosDeTranscript(texto)` (interna): textos `string` de los items `type: 'text'` de los mensajes `recordType: 'message'` con `role: 'assistant'`. Se busca la declaración en todos ellos, no solo en el último.
- Fixture: `transcriptSubagentePi({ lecturas, textoFinal })`; si `textoFinal` es string, se agrega un segundo item `text` al mensaje del asistente.
- Privacidad: solo rutas y números salen de `corridas`; nunca el motivo ni el texto.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `analizarSubagentesPi`, el fixture y 3 pruebas nuevas más las 2 actualizadas.
Fuera de alcance: Claude Code (task-03), línea de informe (task-04), `informe.mjs`, `pistas.mjs`.

## Pasos
1. `consumo.mjs`: importa `resumirLecturaExtra`; agrega `textosDeTranscript`; en `analizarSubagentesPi` guarda el objeto de la corrida y completa `kb` y `lecturaExtra` tras `lecturasDeTranscript`; sin transcript deja los valores por defecto.
2. `consumo-fixtures.mjs`: agrega `textoFinal` a `transcriptSubagentePi`.
3. `consumo.test.mjs`: actualiza `corridas (1)` y `(2)` (ambos con transcript sin lecturas: `kb: 0`, `lecturaExtra: { extras: [], declaradas: 0 }`).
4. Agrega 3 pruebas: (a) encargo `Lee: features/F34-x/task-02-y.md\nEvita leer: \`definitions/\`\nDisparó: puerta 4`, lectura de `definitions/WORKFLOW.md` (2048 bytes) y `textoFinal` `Lectura extra: definitions/WORKFLOW.md; motivo=falta una regla` → `extras: ['definitions/WORKFLOW.md']`, `declaradas: 1`, `kb: 2`; (b) misma lectura sin declaración → `declaradas: 0`, y una lectura de `definitions/PROJECT.md` listada en `Lee:` no es extra; (c) sin transcript → `kb: null`, y `JSON.stringify(corridas)` no contiene `motivo=` ni `CENTINELA_TEXTO`.
5. Corre la verificación.

## Criterios de aceptación
1. Una lectura de `Evita leer:` declarada sale con `extras: [ruta]` y `declaradas: 1`; prueba (a).
2. Sin declaración, `declaradas: 0`; una ruta de `Lee:` no cuenta; prueba (b).
3. Sin transcript, `kb: null`; el motivo no sale en `corridas`; prueba (c).
4. Las otras 52 pruebas de `consumo.test.mjs` siguen pasando.

## Verificación
```
node --test pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --test pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ tests 57`, `ℹ pass 57`, `ℹ fail 0`; luego `ℹ tests 27`, `ℹ pass 27`, `ℹ fail 0` (4 + 12 + 11 medidas, sin cambios).

## Evidencia

```
$ node --test pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 57
ℹ pass 57
ℹ fail 0
exit 0

$ node --test pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 27
ℹ pass 27
ℹ fail 0
exit 0
```

## Notas
Hueco menor: la prueba (c) comprueba `motivo=` y `CENTINELA_TEXTO` sobre `JSON.stringify(corridas)` sin transcript; sin transcript no hay texto que filtrar, así que la comprobación es de regresión y no de fuga real.
Hueco menor: en la prueba (b) `extras` incluye `definitions/WORKFLOW.md` aunque no esté declarada (la declaración solo cuenta en `declaradas`), que es lo que define `resumirLecturaExtra`; la tarea no dejaba claro si `extras` exige declaración.
Decisión: `textoFinal` de `transcriptSubagentePi` se agrega después de las llamadas `read` en el mismo mensaje del asistente.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
