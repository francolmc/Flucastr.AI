# task-03 — `registrar.mjs` cuenta como inválidas las líneas incoherentes
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
`registrar.mjs` acepta hoy cualquier combinación de las 8 claves y emite `ejecucion` con `resultado=lista` aunque `verificacion=parcial`. Pasa a llamar `coherenciaRegistro`: una línea incoherente cuenta en `invalidas` y no genera evento. Esto aplica también a `--reconstruir` sobre registros históricos (decisión D3=A).

## Contexto
- Tocar: `scripts/registrar.mjs`, `pruebas/capa1/registrar.test.mjs`
- Código (confirmado): `registrosDeNotas(texto)` en `scripts/registrar.mjs` líneas 257–279: aplica `RE_REGISTRO` y cuenta `invalidas` si no calza. `extraer` (línea 383) lo usa y suma `invalidasVersion`. El regex de 8 claves (líneas 73–77) no cambia.
- `coherenciaRegistro` sale de `scripts/formato-evidencia.mjs` (task-02; leer solo sus *Notas*). `registrar.mjs` no importa hoy ese archivo; ambos están en `scripts/`, import relativo `./formato-evidencia.mjs`.
- Pruebas (confirmado, 10 pasan): `pruebas/capa1/registrar.test.mjs` define `LINEA_1` (pasa+lista+ninguna) y `LINEA_2` (`verificacion=parcial; intentos=1; resultado=bloqueada; causa=verificacion_x2`) en las líneas 313–314; la prueba (7) las espera válidas. `LINEA_2` debe seguir válida: por eso `registrar.mjs` llama a la función sin `intentos` ni `estado`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «Pieza 2 — Coherencia de `resultado`»

## Decisiones ya tomadas
- En `registrosDeNotas`, tras calzar el regex, llamar `coherenciaRegistro({ verificacion, resultado, causa })` sin `estado` ni `intentos`. Si devuelve motivos, `invalidas++` y se omite la línea (no entra en `lineas`).
- No se añade estado ni evento nuevo; no se toca `ESQUEMA`, `EJECUCION` ni `RE_REGISTRO`.
- El mensaje de `registrar:` por consola no cambia (`… líneas Registro: no válidas`).
- Las líneas incoherentes ya escritas en eventos viejos no se borran; `--reconstruir` regenera sin ellas.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el uso de la función y sus pruebas de integración.
Fuera de alcance: `informe.mjs` (no cuenta lo que no se emite), eventos `bloqueo` o `cancelada`, `consumo.mjs`.

## Pasos
1. En `scripts/registrar.mjs` importa `coherenciaRegistro` de `./formato-evidencia.mjs`.
2. En `registrosDeNotas`, tras `RE_REGISTRO.exec`, llama a la función con los valores capturados; si hay motivos, `invalidas++` y `continue`.
3. En `pruebas/capa1/registrar.test.mjs` añade una prueba nueva: una tarea con tres líneas (`n=1` coherente, `n=2` con `verificacion=parcial; resultado=lista; causa=ninguna`, `n=3` con `verificacion=falla; resultado=lista; causa=ninguna`) da un solo evento `ejecucion` (el `n=1`) y la salida `2 líneas Registro: no válidas`.
4. Añade el caso `--reconstruir`: tras la corrida anterior, reconstruir deja el mismo contenido y no incluye `resultado=lista` con `verificacion` distinta de `pasa`.
5. Corre `registrar.test.mjs` completo.

## Criterios de aceptación
1. Las 10 pruebas previas de `registrar.test.mjs` pasan sin cambiar sus datos (incluida `LINEA_2`).
2. Una línea `parcial`+`lista` no genera evento `ejecucion` y suma 1 a las no válidas; se comprueba en la prueba nueva.
3. `--reconstruir` produce el mismo resultado que la corrida normal con esas líneas.
4. `RE_REGISTRO` no cambió; se comprueba con `git diff` sin líneas tocadas en el rango 73–77.

## Verificación
```
node --test pruebas/capa1/registrar.test.mjs
node --test pruebas/comprobaciones/regresion-validadores.test.mjs
git diff -U0 scripts/registrar.mjs
```
Esperado: `ℹ fail 0` en las dos primeras; el `git diff` no muestra hunks con encabezado de líneas 73 a 77 (`@@ -73` a `@@ -77`).

## Evidencia
```
$ node --test pruebas/capa1/registrar.test.mjs
✔ (1) estados → tarea_estado y puerta; un commit que solo cambia la Descripción no genera evento
✔ (2) idempotencia: dos corridas idénticas; un commit nuevo anexa solo lo suyo; --reconstruir reproduce
✔ (3) privacidad: ningún dato canario sale; el validador rechaza campos y valores fuera de esquema
✔ (4) aislamiento: registro/ queda ignorado, .env no se abre y nada fuera de registro/ cambia
✔ (5) renombre con git mv a features/completed/: historial sin duplicar y un feature_archivada
✔ (6) feature_estado desde BACKLOG y escalacion al pasar de vacía a con texto; control: de con texto a vacía no genera evento
✔ (7) Registro: en Notas da un ejecucion por n con su modelo configurado; fuera de Notas o con un valor fuera de lista no genera evento
✔ (8) repetir la corrida no duplica; una línea nueva añade solo su n; --reconstruir reproduce el mismo contenido
✔ (11) coherencia: Registro con verificacion distinta de pasa y resultado=lista no genera evento; --reconstruir igual
✔ (10) argumentos inválidos: opción repetida, opción desconocida y argumento suelto terminan en 1 sin crear registro/
✔ (9) canarios en el resto de Notas y una clave extra (titulo=) no llegan a eventos.jsonl
ℹ tests 11
ℹ pass 11
ℹ fail 0
exit 0
```

```
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ todo 0
exit 0
```

```
$ git diff -U0 scripts/registrar.mjs
diff --git a/scripts/registrar.mjs b/scripts/registrar.mjs
index dd82e15..c81240e 100644
--- a/scripts/registrar.mjs
+++ b/scripts/registrar.mjs
@@ -34,0 +35 @@ import { fileURLToPath } from "node:url";
+import { coherenciaRegistro } from "./formato-evidencia.mjs";
@@ -266,0 +268,6 @@ function registrosDeNotas(texto) {
+    // Coherencia (task-03 de F30): sin estado ni intentos, para que LINEA_2 de las pruebas siga válida.
+    const motivos = coherenciaRegistro({ verificacion: m[5], resultado: m[7], causa: m[8] });
+    if (motivos.length > 0) {
+      invalidas++;
+      continue;
+    }
exit 0
```

```
$ git diff -U0 scripts/registrar.mjs | grep -n "@@ -73\|@@ -77"
exit 1
```

## Notas
Decisión: la prueba nueva (11) cubre el caso del paso 3 con sus números exactos (2 eventos nuevos, 2 líneas no válidas); no hubo huecos menores.
Verificación: la primera pasada corrió los tres comandos por separado durante el desarrollo; la segunda, la formal, dio los mismos resultados (intentos=2).
Criterio 4: `git diff -U0` no muestra hunks en los rangos 73–77 de `RE_REGISTRO`; el único cambio de `registrar.mjs` está en la línea 35 (import) y en 268–273 (llamada).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
