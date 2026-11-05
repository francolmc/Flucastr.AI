# task-07 — Prueba de los mensajes didácticos y del texto de la skill, con control negativo
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
Añade una prueba que deja fijado lo que corrigen task-05 y task-06: la skill dice «sin punto final» y «sin comillas invertidas», y el validador rechaza `- Leer:`, `- Tocar:` y `- Fuente:` con punto final o comillas con un mensaje que muestra el formato exacto. Un control negativo comprueba que el texto anterior de la skill no contenía esas frases y que las líneas bien formadas siguen aceptándose.

## Contexto
- Leer: `scripts/formato-topes.mjs@28-46`, `scripts/formato-fuente.mjs@8-22`, `pruebas/comprobaciones/plantilla-diez-secciones.test.mjs@1-12`
- Tocar: `pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs`
- API exportada: `medirTopes(texto, leer)` devuelve `{ errores, avisos }` (`leer(ruta)` devuelve texto o `null`); `validarFuente(texto, leer)` devuelve un arreglo de motivos; `validarTarea(texto)` (`scripts/formato-tarea.mjs`) devuelve un arreglo de motivos.
- Convención: `node:test` + `node:assert/strict`; raíz con `fileURLToPath(new URL('../../', import.meta.url))`. `pruebas/rapida.sh` recoge todo `pruebas/comprobaciones/*.test.mjs`.
- Ninguno de estos módulos lo importan los fixtures nuevos; no hay lista de módulos que ajustar.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Un solo archivo nuevo con cuatro pruebas: (1) la skill contiene «sin punto final» y «sin comillas invertidas»; (2) `medirTopes` sobre una tarea mínima con ``- Leer: `a.js`.`` devuelve un error que contiene «sin punto final» y, con ``- Leer: `a.js` `` (sin punto), no devuelve error de formato; (3) `validarFuente` con ``- Fuente: `definitions/PROJECT.md` «X».`` devuelve un error que contiene «sin comillas invertidas», y con ``- Fuente: definitions/PROJECT.md «X»`` no devuelve error de formato (el error de encabezado inexistente lo evita un `leer` que devuelve ``## X``); (4) `validarTarea` con ``- Tocar: `a.js`.`` incluye un error que contiene «sin punto final», con ``- Tocar: `a.js` `` no incluye ningún error que mencione «Tocar».
- Control negativo de (1): el texto de la skill con esas dos frases eliminadas (`replaceAll`) ya no las contiene.
- La tarea mínima para (2) y (3) se arma en el propio archivo con las secciones mínimas que esos dos módulos leen (título, línea `repo: …   depende_de: —   estado: aprobada`, `## Contexto` con las líneas probadas); para (4) se arma una tarea completa de diez secciones como la de `formato-tarea.test.mjs`.
- No se modifica ningún archivo existente.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el archivo de prueba nuevo.
Fuera de alcance: cambiar la skill o los mensajes (task-05, task-06), topes, `pruebas/rapida.sh`, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Crea `pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs` con la prueba (1) y su control negativo, leyendo la skill.
3. Añade las pruebas (2) y (3) con las líneas con y sin punto final.
4. Añade la prueba (4) con una tarea completa.
5. Corre el archivo con `node --test` y confirma que pasan las cuatro.
6. Revisa que cada prueba (2) a (4) tenga las dos variantes (con y sin punto o comillas) en el mismo archivo.

## Criterios de aceptación
1. Rama `fix/F44-plantilla-diez-secciones` (comando 1).
2. El archivo nuevo termina con `ℹ fail 0` y `ℹ pass 5` o más (comando 2).
3. `node scripts/validar-tarea.mjs features/F*/task-*.md` termina en 0 (comando 3).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
```
Esperado: rama `fix/F44-plantilla-diez-secciones`; el segundo comando imprime `ℹ pass 5` (o más) y `ℹ fail 0`; el último termina con la línea `salida 0`.

## Evidencia

```
$ git branch --show-current
fix/F44-plantilla-diez-secciones
exit 0
```

```
$ node --test pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
ℹ pass 8
ℹ fail 0
exit 0
```

Esperado: `ℹ pass 5` o más y `ℹ fail 0`. Obtenido: `ℹ pass 8` (5 o más) y `ℹ fail 0`; cumple.

```
$ node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
OK: 9 tarea(s) válida(s)
salida 0
exit 0
```

## Notas
Huecos menores: (1) se crearon ocho pruebas `test()` en lugar de cuatro: cada prueba (1) a (4) tiene sus dos variantes o control por separado, lo que cumple «ℹ pass 5 o más». (2) En (2) y (3) el `leer` de prueba devuelve `## X`, con el mismo texto para todo archivo, para que la prueba aísle el formato. Ninguna decisión de diseño cambió. Sin commit ni push. Encargo con «Modo yolo: activo»; la rama ya era la actual, no se hizo `git switch`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
