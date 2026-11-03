# task-01 — Módulo `formato-bloqueo.mjs`: líneas `Bloqueo:` y `Cancelada:`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Las líneas `Bloqueo: tipo=…; falta=…` y `Cancelada: motivo=…` de *Notas* necesitan un vocabulario cerrado y un analizador único. Esta tarea crea el módulo puro; lo usarán el validador de evidencia (task-02), el de tarea (task-03) y `registrar.mjs` (task-06 y task-07). No toca ningún archivo existente.

## Contexto
- Tocar: `scripts/formato-bloqueo.mjs`, `pruebas/comprobaciones/formato-bloqueo.test.mjs`
- Requiere: ninguno
- Modelo a imitar (confirmado): `scripts/formato-requiere.mjs` (módulo puro con `export const` y funciones; importa `secciones` de `formato-tarea.mjs`). `parsearRequiere(valor)` devuelve `{ ok: true, items: [{ texto }] }` o `{ ok: false, error }`; el separador es «, »; `ninguno` devuelve `items: []` (medido con `node -e`).
- `scripts/entorno.mjs` imprime `falta=<items separados por ,>` sin espacio (línea 183, confirmado), así que `Bloqueo:` debe aceptar «,» y «, ».
- Base medida: `node --test pruebas/comprobaciones/formato-evidencia.test.mjs` da `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- Exports: `TIPOS_BLOQUEO = ['entorno','alcance','especificacion','decision_diseno','verificacion_x2','credenciales','otra']`, `MOTIVOS_CANCELADA = ['replanificada','obsoleta','duplicada','fuera_de_alcance','otra']`, `parsearBloqueo(linea)`, `parsearCancelada(linea)`, `coherenciaBloqueo({ tipo, causa })`, `lineasDeNotas(texto, prefijo)`.
- `parsearBloqueo` acepta solo `Bloqueo: tipo=<tipo>; falta=<valor>` completa, sin texto extra. `valor` es `-` o items del vocabulario de `Requiere:` separados por «,» o «, »: se normaliza a «, » y se valida con `parsearRequiere` (importado de `./formato-requiere.mjs`, usado solo dentro de funciones; ya existe el ciclo `formato-tarea` ↔ `formato-requiere`). `tipo=entorno` exige `falta` distinto de `-`.
- Devuelve `{ ok: true, tipo, falta: [textos] }` (`falta: []` con `-`) o `{ ok: false, error }` en español.
- `parsearCancelada` acepta solo `Cancelada: motivo=<motivo>`; devuelve `{ ok: true, motivo }` o `{ ok: false, error }`.
- `coherenciaBloqueo`: `entorno` exige `causa=otra` (decidido en F31); `credenciales` exige `causa=credenciales`; `verificacion_x2` exige `causa=verificacion_x2`; los demás tipos no restringen; `causa` indefinida no da motivos. Devuelve motivos en español que empiezan con «Bloqueo». 
- `lineasDeNotas(texto, prefijo)`: líneas de la sección `## Notas` (usa `secciones` de `./formato-tarea.mjs`, fuera de bloques de código), sin espacios finales, que empiezan con `prefijo`.
- Sin efectos al importar: nada de código de nivel superior fuera de constantes y funciones.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el módulo y su prueba.
Fuera de alcance: usarlo en `formato-evidencia.mjs`, `formato-tarea.mjs` o `registrar.mjs` (tareas siguientes), el instalador (los scripts viajan por `~/.flucastr-ai/raiz`), `definitions/`.

## Pasos
1. Crea `scripts/formato-bloqueo.mjs` con los exports de *Decisiones ya tomadas*.
2. Crea `pruebas/comprobaciones/formato-bloqueo.test.mjs` (`node:test`, `assert/strict`) con estos casos: `falta=docker,puerto:55432` y `falta=docker, puerto:55432` dan `falta: ['docker','puerto:55432']`; `falta=-` con `tipo=alcance` es válida; `tipo=entorno; falta=-` se rechaza; un tipo fuera de la lista, un item fuera del vocabulario y una clave extra (`; nota=x`) se rechazan; `Cancelada: motivo=obsoleta` es válida y `motivo=nueva` no; los tres pares de `coherenciaBloqueo` y uno sin restricción; `lineasDeNotas` ignora líneas fuera de *Notas* y dentro de bloques de código.
3. Corre la verificación.

## Criterios de aceptación
1. `parsearBloqueo('Bloqueo: tipo=entorno; falta=docker,puerto:55432')` devuelve `ok: true` y dos items; se comprueba con el segundo comando.
2. Los rechazos del paso 2 devuelven `ok: false` con mensaje en español; se comprueba con la prueba.
3. La prueba pasa; se comprueba con `node --test`.

## Verificación
```
node --test pruebas/comprobaciones/formato-bloqueo.test.mjs 2>&1 | grep -E "^ℹ fail"
node -e "import('./scripts/formato-bloqueo.mjs').then(m=>console.log(JSON.stringify(m.parsearBloqueo('Bloqueo: tipo=entorno; falta=docker,puerto:55432'))))"
```
Esperado: `ℹ fail 0` y la línea `{"ok":true,"tipo":"entorno","falta":["docker","puerto:55432"]}`.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-bloqueo.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node -e "import('./scripts/formato-bloqueo.mjs').then(m=>console.log(JSON.stringify(m.parsearBloqueo('Bloqueo: tipo=entorno; falta=docker,puerto:55432'))))"
{"ok":true,"tipo":"entorno","falta":["docker","puerto:55432"]}
exit 0

$ node --test pruebas/comprobaciones/formato-bloqueo.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 11
ℹ pass 11
ℹ fail 0
exit 0

Anotación: los rechazos del paso 2 (tipo=entorno con falta=-, tipo fuera de lista, item fuera de vocabulario, clave extra, motivo=nueva) están en la prueba y pasan; criterio 2 cubierto.

$ sh pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 609
ℹ pass 602
ℹ fail 7
exit 0

Anotación: base 598/591/7; delta +11 tests (los de este módulo), todos pasan. Los 7 fallos son los de la base por nombre (BACKLOG F26; 2 de lectura acotada en constructor y ejecutar-tarea; 1 de modelos.json en agente; 2 de WORKFLOW.md; «los archivos reales cumplen la regla»). `rapida.sh` sale 1 por esos 7, como en la base.
```

## Notas
- Huecos menores resueltos: (1) `parsearBloqueo` normaliza «,» y «, » a «, » con una regex antes de llamar a `parsearRequiere`; `docker,,x` da item vacío y se rechaza. (2) `lineasDeNotas` filtra por su cuenta las líneas dentro de bloques de código: `secciones` solo omite los encabezados dentro de código, no su contenido. (3) Un `;` en `falta` se rechaza como clave extra antes de validar items.
- Decisión abierta: ninguna. Sin commit ni rama nueva (modo yolo).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
