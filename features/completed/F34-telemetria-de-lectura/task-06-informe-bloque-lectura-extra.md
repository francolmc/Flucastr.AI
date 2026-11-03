# task-06 — informe.mjs: bloque «Lectura extra» en Consumo y aviso de pistas no evaluadas
repo: Flucastr.AI   depende_de: task-04, task-05   estado: hecha

## Descripción
`informe.mjs --consumo <dir>` muestra el conteo y el cumplimiento de lecturas extra junto al resto del bloque «Consumo (aproximado)» y en la clave `consumo` del JSON. Con `--pistas` y sin `--consumo`, el aviso de pistas no evaluadas ahora incluye las pistas 7, 8 y 9, que también dependen de los logs.

## Contexto
- Tocar: `scripts/informe.mjs`, `pruebas/comprobaciones/informe-consumo.test.mjs`, `pruebas/comprobaciones/informe-pistas.test.mjs`
- Requiere: ninguno
- De `depende_de:` lee solo las *Notas* de task-04 (`resumenLecturaExtra`) y de task-05 (números de pista).
- `scripts/informe.mjs` (leído): `bloqueConsumo(sesiones, n)` (línea 218) devuelve `{ turnos, costo, filas, porTarea }`; `lineasConsumo(c)` (línea 249) imprime «## Consumo (aproximado)» y la tabla por rol; la línea 317 escribe `(pistas 2 y 6 no evaluadas: falta --consumo <dir>)`; ya importa `descubrirSesiones` de `./consumo.mjs`.
- `informe-pistas.test.mjs` línea 282 verifica ese texto exacto; `informe-consumo.test.mjs` (4 pruebas, medido) tiene `carpetaSesionesConsumo()` con una sesión Pi, un constructor con `definitions/PROJECT.md` de 2048 bytes y un planificador.
- Fuente: definitions/LECTURA-PRESUPUESTO.md «5. Telemetría sin duplicar»

## Decisiones ya tomadas
- `bloqueConsumo` agrega la clave `lecturaExtra: resumenLecturaExtra(sesiones.flatMap((s) => s.subagentes?.corridas ?? []))` (import desde `./consumo.mjs`).
- `lineasConsumo` agrega, tras la tabla y antes de la línea en blanco final: `Lectura extra: <extras> en <corridas> corrida(s) · declaradas <declaradas> · cumplimiento <p> %` (`n/d` si `cumplimiento` es `null`).
- El aviso pasa a `(pistas 2, 6, 7, 8 y 9 no evaluadas: falta --consumo <dir>)`; se actualizan el comentario de la línea 269 y la aserción de `informe-pistas.test.mjs` línea 282.
- Los 4 tests de `informe-consumo.test.mjs` no deben cambiar su resultado.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: los dos cambios de `informe.mjs`, la aserción de la línea 282 y 2 pruebas nuevas en `informe-consumo.test.mjs`.
Fuera de alcance: lógica de pistas (task-05), `consumo.mjs`, CLI de punta a punta (task-07).

## Pasos
1. `informe.mjs`: importa `resumenLecturaExtra`; añade la clave y la línea; cambia el aviso y su comentario.
2. `informe-pistas.test.mjs`: ajusta la aserción de la línea 282 al nuevo texto.
3. `informe-consumo.test.mjs`: agrega 2 pruebas con un directorio sintético (como `carpetaSesionesConsumo`) cuyo subagente lee de más `definitions/WORKFLOW.md` con `Evita leer: \`definitions/\`` y `textoFinal` declarándolo: (a) el Markdown con `--consumo` contiene `Lectura extra: 1 en 1 corrida(s) · declaradas 1 · cumplimiento 100 %`; (b) con `--json` la clave `consumo.lecturaExtra` es `{ corridas: 1, extras: 1, declaradas: 1, cumplimiento: 100, porLlamada: 1 }`.
4. Corre la verificación.

## Criterios de aceptación
1. La línea de Markdown sale con los números esperados; prueba (a).
2. El JSON lleva `lecturaExtra` con esas cifras; prueba (b).
3. El aviso nombra las pistas 2, 6, 7, 8 y 9; aserción de `informe-pistas.test.mjs`.
4. Las pruebas previas de informe siguen pasando.

## Verificación
```
node --test pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ tests 29`, `ℹ pass 29`, `ℹ fail 0` (4 + 2 nuevas, 12 y 11 medidas).

## Evidencia

```
$ node --test pruebas/comprobaciones/informe-consumo.test.mjs pruebas/comprobaciones/informe-pistas.test.mjs pruebas/comprobaciones/informe.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 29
ℹ pass 29
ℹ fail 0
exit 0
```

Salida completa sin el filtro (pasada 2, código de salida de `node --test` medido): `exit 0`, `ℹ tests 29`, `ℹ pass 29`, `ℹ fail 0`.

Criterios: (1) prueba (a) `6a` pasa con «Lectura extra: 1 en 1 corrida(s) · declaradas 1 · cumplimiento 100 %»; (2) prueba (b) `6b` pasa con `lecturaExtra` = `{ corridas: 1, extras: 1, declaradas: 1, cumplimiento: 100, porLlamada: 1 }`; (3) la aserción de `informe-pistas.test.mjs` pasa con «(pistas 2, 6, 7, 8 y 9 no evaluadas: falta --consumo <dir>)»; (4) los 4 tests previos de `informe-consumo.test.mjs` y los de `informe-pistas` e `informe` pasan sin cambios de resultado.

## Notas
- Decisión: la línea «Lectura extra» se añadió en `lineasConsumo` después de la tabla y antes de la línea en blanco final, como indica la tarea.
- Decisión: `bloqueConsumo` devuelve `lecturaExtra` (no se tocó `informeJson`, que ya usa el objeto `consumo`).
- Decisión: las dos pruebas nuevas usan una sesión Pi sintética propia (`carpetaLecturaExtra`) y no alteran `carpetaSesionesConsumo`.
- Sin huecos menores.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
