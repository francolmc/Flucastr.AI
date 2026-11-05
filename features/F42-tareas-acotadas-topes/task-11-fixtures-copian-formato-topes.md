# task-11 — Corrección: los fixtures de excedido, repetido y rol copian `formato-topes.mjs`
repo: Flucastr.AI   depende_de: task-03   estado: hecha

## Descripción
Desde task-03, `scripts/validar-tarea.mjs` importa `./formato-topes.mjs`. Los fixtures `excedido.sh`, `repetido.sh` y `rol.sh` copian a su directorio de trabajo una lista fija de módulos que no lo incluye, así que `validar-tarea.mjs --presupuesto` falla allí con `ERR_MODULE_NOT_FOUND` y siete pruebas de `bash pruebas/rapida.sh` fallan (*confirmado*: se armó el fixture de `rol.sh` y el validador dio ese error). Esta tarea añade el módulo a las tres copias, igual que F38 añadió `firma.mjs`.

## Contexto
- Tocar: `pruebas/fixtures/excedido.sh`, `pruebas/fixtures/repetido.sh`, `pruebas/fixtures/rol.sh`
- Leer: `pruebas/fixtures/rol.sh@10-15`
- Las tres tienen el mismo bloque en las líneas 12-14: `cp "$REPO/scripts/validar-tarea.mjs" ... "$REPO/scripts/formato-requiere.mjs" "$REPO/scripts/firma.mjs" "$out/scripts/"`.
- Fuente: ninguna
- Requiere: runtime:node@25

## Decisiones ya tomadas
- En cada uno de los tres archivos, en la línea 14, cambia `"$REPO/scripts/formato-requiere.mjs" "$REPO/scripts/firma.mjs"` por `"$REPO/scripts/formato-requiere.mjs" "$REPO/scripts/formato-topes.mjs" "$REPO/scripts/firma.mjs"`. Nada más.
- No se tocan `planificador.sh` (ya copia `formato-*.mjs`), `basico.sh`, `medio.sh`, `constructor.sh` ni `coordinador.sh`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la misma edición de una línea en tres fixtures y las siete pruebas que dependían de ellos.
Fuera de alcance: `validar-tarea.mjs`, topes, pruebas, `definitions/`, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Aplica la edición de *Decisiones ya tomadas* en `pruebas/fixtures/excedido.sh`, `repetido.sh` y `rol.sh`. Resultado: `grep -c formato-topes` da 1 en cada uno.
3. Corre la verificación y copia la salida real en *Evidencia*.

## Criterios de aceptación
1. Rama `feature/F42-tareas-acotadas-topes` (comando 1).
2. Los tres fixtures nombran `formato-topes.mjs` una vez cada uno (comando 2).
3. Las pruebas de excedido, repetido, rol y `correr-repetido` terminan con `fail 0` (comando 3).

## Verificación
```
git branch --show-current
grep -c "formato-topes.mjs" pruebas/fixtures/excedido.sh pruebas/fixtures/repetido.sh pruebas/fixtures/rol.sh
node --test pruebas/comprobaciones/excedido-resultado.test.mjs pruebas/comprobaciones/repetido-resultado.test.mjs pruebas/comprobaciones/rol-resultado.test.mjs pruebas/correr-repetido.test.mjs
```
Esperado: rama `feature/F42-tareas-acotadas-topes`; tres líneas terminadas en `:1`; `fail 0`.

## Evidencia
Comandos ejecutados desde la raíz del repo `/Users/franco/Codes/flucastr/Flucastr.AI`.

```
$ git branch --show-current
feature/F42-tareas-acotadas-topes
exit 0
```

```
$ grep -c "formato-topes.mjs" pruebas/fixtures/excedido.sh pruebas/fixtures/repetido.sh pruebas/fixtures/rol.sh
pruebas/fixtures/rol.sh:1
pruebas/fixtures/excedido.sh:1
pruebas/fixtures/repetido.sh:1
exit 0
```

```
$ node --test pruebas/comprobaciones/excedido-resultado.test.mjs pruebas/comprobaciones/repetido-resultado.test.mjs pruebas/comprobaciones/rol-resultado.test.mjs pruebas/correr-repetido.test.mjs
(cola de la salida real, primera pasada)
✔ (e) el fixture deja un STATUS.md válido con firma= igual a la firma real y el validador da estado=repetido (1085.905666ms)
✔ (1) el fixture da validar-tarea --presupuesto con salida 0 (735.894ms)
✔ (2) flecha OK: delegó en planificador y el texto final no tiene «sed» (4.460375ms)
✔ (6) informeRol da Veredicto OK y Veredicto FALLA según los dos escenarios (6.614542ms)
✔ correr-repetido.sh claude-code: modelo simulado inerte da Veredicto: FALLA (880.738292ms)
ℹ tests 24
ℹ suites 0
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

```
$ node --test pruebas/comprobaciones/excedido-resultado.test.mjs pruebas/comprobaciones/repetido-resultado.test.mjs pruebas/comprobaciones/rol-resultado.test.mjs pruebas/correr-repetido.test.mjs
ℹ tests 24
ℹ pass 24
ℹ fail 0
exit 0
```

## Notas
- Decisión: la edición se aplicó tal cual en *Decisiones ya tomadas*, línea 14 de cada fixture (`rol.sh`, `excedido.sh` y `repetido.sh` tenían el mismo bloque). Nada más se tocó (`repetido.sh` línea 52 usa `firma.mjs` como import y no se cambió).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
