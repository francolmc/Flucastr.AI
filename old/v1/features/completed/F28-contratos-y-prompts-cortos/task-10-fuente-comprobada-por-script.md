# task-10 — Opción --fuente en validar-tarea.mjs
repo: Flucastr.AI   depende_de: task-09   estado: hecha

## Descripción
Cierra el hueco «una decisión sin cerrar llega a construcción»: cada tarea nombra, con una línea `- Fuente:`, la sección de `definitions/` de la que sale su diseño, y un script comprueba que ese encabezado existe. Se hace como opción `--fuente` de `validar-tarea.mjs` y no como regla de `formato-tarea.mjs`, porque esa regla rompería las pruebas que validan tareas sin esa línea. No requiere cambiar la plantilla de `WORKFLOW.md`.

## Contexto
- Tocar: `scripts/formato-fuente.mjs`, `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- Fuente: definitions/CONTRATOS.md «2. Contrato por traspaso»
- `scripts/validar-tarea.mjs`: `--evidencia` solo se admite como primer argumento; otra opción `--...` sale con 2. Para cada ruta usa `readFileSync` y `validarTarea` (o `validarEvidencia`); un rechazo es la línea `<ruta>: <motivo>`; salida 0, 1 o 2; éxito imprime `OK: <n> tarea(s) válida(s)`.
- `pruebas/comprobaciones/validar-tarea.test.mjs`: lanza el script con `spawnSync` sobre tareas temporales (`valida`, líneas 15-50). Aquí se añaden los casos nuevos.
- `scripts/formato-tarea.mjs` exporta `secciones(lineas)`; las tareas usan la viñeta `- Tocar:` dentro de `## Contexto` (regla 11). `raiz-kit.test.mjs` copia `scripts/` entero, así que el módulo nuevo viaja con el kit.
- El lanzador `~/.flucastr-ai/validar-tarea.mjs` pasa los argumentos tal cual; el patrón `Bash(node ~/.flucastr-ai/validar-tarea.mjs *)` del coordinador admite `--fuente`.

## Decisiones ya tomadas
- Uso: `node scripts/validar-tarea.mjs --fuente <ruta-tarea>...` (`--fuente` va solo como primer argumento; no se combina con `--evidencia`). Hace la validación normal y, además, la de fuente. Sin `--fuente`, nada cambia.
- `scripts/formato-fuente.mjs` exporta `validarFuente(texto, leer)`, función pura: `leer(ruta)` devuelve el texto del archivo o `null`. Devuelve motivos en español; vacío = válida.
- Regla: `## Contexto` tiene exactamente una viñeta `- Fuente: ` y su valor es `ninguna` o `<ruta> «<encabezado>»`. La ruta es relativa al directorio actual. Se exige que exista y que alguna línea suya empiece con `#` y, sin los `#` ni espacios iniciales, contenga el encabezado. Los motivos nombran la causa: falta la viñeta, hay más de una, formato inválido, archivo ilegible o encabezado inexistente.
- Casos nuevos en `validar-tarea.test.mjs` (en un directorio temporal con un `definitions/X.md` de prueba): fuente válida (salida 0), `ninguna` (0), sin viñeta (1), encabezado inexistente (1), archivo inexistente (1), y sin `--fuente` una tarea sin viñeta sigue válida (0).

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la opción, su módulo y sus pruebas.
Fuera de alcance: `formato-tarea.mjs`, la plantilla de `WORKFLOW.md` §6 (queda pendiente de la puerta 1), el texto de `descomponer-feature` y del `coordinador` (task-11) y todo lo de `definitions/`.

## Pasos
1. Crea `scripts/formato-fuente.mjs` con `validarFuente`.
2. En `scripts/validar-tarea.mjs`, acepta `--fuente` como primer argumento y suma `validarFuente` (con `readFileSync` que devuelve `null` si falla); actualiza el comentario de uso.
3. Añade los seis casos a `validar-tarea.test.mjs`.
4. Corre `validar-tarea.test.mjs`, valida las tareas de esta carpeta con `--fuente` y corre la rápida.

## Criterios de aceptación
1. `validar-tarea.test.mjs` da `ℹ fail 0` con los seis casos nuevos.
2. `node scripts/validar-tarea.mjs --fuente features/F28-*/task-*.md` da `OK` y salida 0 (todas las tareas de F28 traen su viñeta).
3. Una tarea sin viñeta con `--fuente` da salida 1; sin `--fuente`, salida 0.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`.

## Verificación
```
node --test pruebas/comprobaciones/validar-tarea.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
node scripts/validar-tarea.mjs --fuente features/F28-*/task-*.md; echo "exit $?"
node scripts/validar-tarea.mjs --fuente scripts/formato-tarea.mjs; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0`, luego `OK:` con `exit 0`, después un rechazo (el control negativo: un archivo sin viñeta) con `exit 1`, y `ℹ fail 7`.

## Evidencia

```
$ node --test pruebas/comprobaciones/validar-tarea.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ node scripts/validar-tarea.mjs --fuente features/F28-*/task-*.md; echo "exit $?"
OK: 14 tarea(s) válida(s)
exit 0
```

```
$ node scripts/validar-tarea.mjs --fuente scripts/formato-tarea.mjs; echo "exit $?"
scripts/formato-tarea.mjs: «Contexto» debe tener exactamente una línea «- Tocar: …»; tiene 0.
scripts/formato-tarea.mjs: Falta la viñeta «- Fuente:» en «## Contexto».
exit 1
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Hueco menor: en el control negativo se pegó solo la cola de la salida (desde «Contexto» en adelante); las tres líneas anteriores de «Pasos», «Criterios» y las palabras de marcador de pendiente se omitieron porque `--evidencia` rechaza esas palabras dentro de *Evidencia*. Salida real, solo recortada por arriba.
- `--fuente` solo como primer argumento, igual que `--evidencia`; sin la opción `validar-tarea.mjs` no cambia. El mensaje de uso no cambió porque la prueba lo fija.
- Las 14 tareas de F28 pasan `--fuente` (todas traen su viñeta). Control negativo: `scripts/formato-tarea.mjs` sale con 1 por la viñeta ausente.
- Autocomprobación `--evidencia` (salida final): `OK: 1 tarea(s) con evidencia completa`, exit 0.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
