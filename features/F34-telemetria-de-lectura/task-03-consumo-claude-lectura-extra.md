# task-03 — consumo.mjs (Claude Code): `kb` y `lecturaExtra` por corrida de subagente
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Igual que task-02 pero para los subagentes de Claude Code: cada corrida de `analizarSubagentesClaude` suma `kb` y `lecturaExtra` con la misma forma, de modo que pistas e informe no distinguen herramienta.

## Contexto
- Tocar: `scripts/consumo.mjs`, `pruebas/comprobaciones/consumo-fixtures.mjs`, `pruebas/comprobaciones/consumo.test.mjs`
- Requiere: ninguno
- De `depende_de:` lee solo las *Notas* de task-02 (forma de la corrida y del fixture).
- `scripts/consumo.mjs` (leído): `agruparClaude(texto, limite)` (línea 369) recorre los registros y devuelve `{ rol, turnos, lecturasPorId, bytesPorId }`; en los registros `type: 'assistant'` itera `mensaje.content`; `encargoClaude(texto)` (línea 349); `lecturasDeClaude` (línea 422) devuelve `Map<ruta, { lecturas, bytes }>`; `analizarSubagentesClaude` (línea 507) empuja la corrida en la línea 547 con `costo: null`. Las rutas leídas son `input.file_path`.
- `consumo-fixtures.mjs` (leído): `turnoClaude({ id, ts, … })` pone `CENTINELA_TEXTO` como único texto; `registroPromptClaude(texto)` abre el transcript con el encargo.
- Pruebas `corridas (3)` y `corridas (4)` (líneas 530 a 550) usan `deepEqual` y deben actualizarse. `ℹ tests` previo: 57 (tras task-02).
- Logs de Claude Code: formato inferido; solo fixtures sintéticos, sin logs reales.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «5. Telemetría sin duplicar»

## Decisiones ya tomadas
- `agruparClaude` agrega a su retorno `textos: string[]` con los `text` de los items `type: 'text'` de los registros `assistant`. `analizarSesionClaude` lo ignora.
- La corrida de Claude Code: `kb = aKb(suma de bytes de lecturasDeClaude)` (0 si no hay lecturas o no hay transcript; aquí no se distingue transcript ausente) y `lecturaExtra = resumirLecturaExtra({ encargo: encargoClaude(texto), rutas: [...claves], textos })`.
- Fixture: `turnoClaude({ …, texto })`; si `texto` es string reemplaza a `CENTINELA_TEXTO` en el item de texto.
- Nunca salen el motivo ni el texto; solo rutas y números.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `agruparClaude` (solo el retorno), `analizarSubagentesClaude`, fixture, 3 pruebas nuevas y 2 actualizadas.
Fuera de alcance: Pi (task-02), informe, pistas.

## Pasos
1. `consumo.mjs`: en `agruparClaude` junta `textos`; en `analizarSubagentesClaude` usa `lecturaExtra` y `kb` como arriba.
2. `consumo-fixtures.mjs`: agrega `texto` a `turnoClaude`.
3. `consumo.test.mjs`: actualiza `corridas (3)` (sin lecturas: `kb: 0`, `lecturaExtra: { extras: [], declaradas: 0 }`) y `(4)` (igual).
4. Agrega 3 pruebas: (a) encargo con `Evita leer: \`definitions/\``, una `Read` de `/ws/definitions/WORKFLOW.md` (2048 bytes, con `resultadoReadClaude`) y un turno con `texto` `Lectura extra: definitions/WORKFLOW.md; motivo=falta una regla` → `extras: ['definitions/WORKFLOW.md']`, `declaradas: 1`, `kb: 2`; (b) misma lectura sin declaración → `declaradas: 0`; (c) `JSON.stringify(corridas)` sin `motivo=` ni `CENTINELA_TEXTO`.
5. Corre la verificación.

## Criterios de aceptación
1. Lectura de `Evita leer:` declarada: `extras` con la ruta normalizada, `declaradas: 1`; prueba (a).
2. Sin declaración: `declaradas: 0`; prueba (b).
3. El motivo y el texto no salen; prueba (c).
4. Las pruebas de Pi y las demás de Claude siguen pasando.

## Verificación
```
node --test pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ tests 60`, `ℹ pass 60`, `ℹ fail 0` (54 medidas + 3 de task-02 + 3 nuevas).

## Evidencia

Pasada 1 (zsh, sin código de salida fiable; mismo resultado): 60 / 60 / 0.
Pasada 2 (última permitida; envuelta en `bash -c` con `pipefail` para capturar el código real):

```
$ node --test pruebas/comprobaciones/consumo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 60
ℹ pass 60
ℹ fail 0
exit 0
```

Criterios: (1) prueba task-03 a: `extras: ['definitions/WORKFLOW.md']`, `declaradas: 1`, `kb: 2`, ok. (2) prueba task-03 b: `declaradas: 0`, ok. (3) prueba task-03 c: sin `motivo=` ni `CENTINELA_TEXTO` en `JSON.stringify(corridas)`, ok. (4) Pi (task-02) y Claude (1-8, corridas 1-5) pasan, 60/60.

## Notas
Hueco menor: `estado: en curso` se puso después de editar el código, no antes de empezar; el paso 3 del procedimiento no se siguió en orden. Sin efecto sobre el resultado.
Hueco menor: `extras` incluye rutas leídas sin declaración (como en task-02 b); la tarea solo fija `declaradas: 0` en la prueba (b), así que se dejó el comportamiento de `resumirLecturaExtra`.
Decisión: `kb` de Claude es 0 sin transcript (como manda la tarea), mientras Pi da `kb: null` sin transcript; la forma de la corrida no es idéntica en ese caso. Lo fijó la tarea; no se cambió.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
