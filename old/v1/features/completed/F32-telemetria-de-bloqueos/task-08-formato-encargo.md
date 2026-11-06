# task-08 — Módulo `formato-encargo.mjs`: leer `Disparó:` y la tarea de un encargo
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Para saber qué disparó cada delegación y a qué tarea pertenece, `consumo.mjs` debe leer el texto del encargo del subagente sin filtrar ese texto al informe. Esta tarea crea el módulo puro que extrae solo valores cerrados (origen, puerta, tarea, feature) y nunca devuelve texto del encargo.

## Contexto
- Tocar: `scripts/formato-encargo.mjs`, `pruebas/comprobaciones/formato-encargo.test.mjs`
- Requiere: ninguno
- Formato de la línea (decisión D4=A de Franco, `definitions/DIAGNOSTICO-BLOQUEOS.md` §5 y §8): `Disparó: puerta N`, `Disparó: BLOQUEO task-NN`, `Disparó: franco` o `Disparó: reintento`, en una línea del encargo.
- `scripts/consumo.mjs` (confirmado): tiene `FORMA_TAREA = /task-\d{2}-[^/]*\.md$/` (línea 39) y la regla de privacidad de que el texto del encargo no sale (`CENTINELA_TEXTO` en `pruebas/comprobaciones/consumo-fixtures.mjs`).
- Modelo de módulo puro (confirmado): `scripts/formato-requiere.mjs`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Exports: `parsearDisparo(texto)`, `rutaDeTarea(texto)` y `resumirEncargo(texto)`.
- `parsearDisparo` busca la primera línea que cumpla `/^Disparó: (puerta ([1-4])|BLOQUEO task-(\d{2})|franco|reintento)\s*$/` (multilínea) y devuelve `{ origen: 'puerta', puerta: N }`, `{ origen: 'bloqueo', tarea: 'NN' }`, `{ origen: 'franco' }` o `{ origen: 'reintento' }`; sin línea válida, `null`.
- `rutaDeTarea` busca la primera ocurrencia de `features/(F\d{2})-[A-Za-z0-9._-]+/task-(\d{2})-[A-Za-z0-9._-]+\.md` y devuelve `{ feature: 'Fxx', tarea: 'NN' }` o `null`.
- `resumirEncargo(texto)` devuelve siempre `{ disparo, feature, tarea }`: `disparo` de `parsearDisparo`; `feature` y `tarea` de `rutaDeTarea`; si no hay ruta de tarea, `feature` sale de la primera ocurrencia de `features/(F\d{2})-` (o `null`) y `tarea` de `disparo.tarea` (o `null`). Un texto que no es string (`undefined`, número) devuelve todo `null`.
- Ninguna función devuelve ni conserva fragmentos del texto de entrada fuera de esos valores cerrados.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el módulo y su prueba.
Fuera de alcance: leer logs (task-10), `agentes/coordinador.md` (task-09), `definitions/`.

## Pasos
1. Crea `scripts/formato-encargo.mjs` con los tres exports.
2. Crea `pruebas/comprobaciones/formato-encargo.test.mjs` con casos: las cuatro formas válidas; `puerta 5`, `BLOQUEO task-5` y `Disparó: otro` dan `null`; una línea con texto detrás (`Disparó: franco, tarde`) da `null`; la primera línea válida gana si hay dos; ruta de tarea completa y solo carpeta de feature; entrada no string; un texto con una frase centinela (`CENTINELA-ENCARGO`) y un `Disparó:` válido: `JSON.stringify(resumirEncargo(texto))` no contiene el centinela.
3. Corre la verificación.

## Criterios de aceptación
1. Las cuatro formas válidas se reconocen y las inválidas dan `null`; se comprueba con la prueba.
2. `resumirEncargo` no devuelve texto del encargo; se comprueba con el caso del centinela.
3. El módulo no tiene efectos al importarse; se comprueba con el segundo comando.

## Verificación
```
node --test pruebas/comprobaciones/formato-encargo.test.mjs 2>&1 | grep -E "^ℹ fail"
node -e "import('./scripts/formato-encargo.mjs').then(m=>console.log(JSON.stringify(m.resumirEncargo('Lee: features/F31-puerta-de-entorno/task-03-x.md\nDisparó: BLOQUEO task-03\n'))))"
```
Esperado: `ℹ fail 0` y la línea `{"disparo":{"origen":"bloqueo","tarea":"03"},"feature":"F31","tarea":"03"}`.

## Evidencia
```
$ node --test pruebas/comprobaciones/formato-encargo.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node -e "import('./scripts/formato-encargo.mjs').then(m=>console.log(JSON.stringify(m.resumirEncargo('Lee: features/F31-puerta-de-entorno/task-03-x.md\nDisparó: BLOQUEO task-03\n'))))"
{"disparo":{"origen":"bloqueo","tarea":"03"},"feature":"F31","tarea":"03"}
exit 0
```

## Notas
- Hueco menor 1: `parsearDisparo` usa `[ \t\r]*$` en lugar de `\s*$`, para que la coincidencia no cruce a otra línea. Se eligió la opción más conservadora; las cuatro formas y los `null` no cambian.
- Hueco menor 2: `puerta` se devuelve como número (`puerta: 3`); la tarea no fija el tipo. Los `null` de `resumirEncargo` con entrada no string se cubren en la prueba.
- Verificación: una pasada (intentos=1). El `exit` del primer comando es el de `grep`, que es el de la tubería tal como está escrita en *Verificación*.
- Modo yolo: no se creó rama, no hubo `git switch` ni commit. Ningún archivo fuera de `scripts/formato-encargo.mjs`, `pruebas/comprobaciones/formato-encargo.test.mjs`, esta tarea.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
