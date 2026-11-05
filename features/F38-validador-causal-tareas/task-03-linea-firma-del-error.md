# task-03 — Línea «Firma:» generada por el validador
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Para que F39 pueda detectar el mismo error repetido, el validador debe emitir una firma estable de su primer rechazo: `Firma: <regla>|<ruta>|<hash del archivo>`. La firma sale del validador, no del texto de `Bloqueo:`. Se agrega un módulo pequeño que clasifica el motivo en una regla con nombre fijo y calcula el hash, y el CLI imprime la línea cuando sale con 1.

## Contexto
- Fuente: definitions/BACKLOG.md «Base de la prioridad»
- Tocar: `scripts/firma.mjs`, `scripts/validar-tarea.mjs`, `pruebas/comprobaciones/validar-tarea.test.mjs`
- Requiere: runtime:node@25
- `scripts/validar-tarea.mjs` líneas 99-136: el bucle de rutas arma `rechazos` (`"<ruta>: <motivo>"`), imprime con `console.log(rechazos.join("\n"))` y fija `process.exitCode` (2 por uso, 1 si hay inválidas, 0 si no). Aplica a los tres modos (puerta previa, `--evidencia`, `--fuente`); `--presupuesto` no pasa por ahí y no cambia.
- `pruebas/comprobaciones/validar-tarea.test.mjs`: el test «válida más inválida sale con 1 y una sola línea de rechazo» (línea ~96) cuenta líneas de salida; hay que ajustarlo para que ignore la línea `Firma:`.
- Los motivos son los textos de `scripts/formato-tarea.mjs` y `scripts/formato-evidencia.mjs` (ya con task-01 y task-02).

## Decisiones ya tomadas
- `scripts/firma.mjs` exporta `reglaDe(motivo)` y `firma({ motivo, ruta, texto })`. `reglaDe` es una tabla ordenada de expresiones regulares sobre el motivo, con estos identificadores: `bloque-abierto` («bloque de código abierto»), `secciones` («Las secciones «##»» y «Falta la sección»), `cabecera` («La primera línea» y «La segunda línea»), `tamano` («caracteres»), `evidencia-falta` («Falta la salida», «Falta la línea «exit», «está vacía», «no aparece literal»), `registro` («Registro»), `bloqueo` («Bloqueo»), `fuente` («Fuente»), `estado` («no está terminada»), `otra` (todo lo demás).
- `firma` devuelve `Firma: <regla>|<ruta>|<hash>` donde `<hash>` son los primeros 12 caracteres hexadecimales del SHA-256 del contenido exacto del archivo (bytes tal cual se leyeron, con `node:crypto`). La regla es la del PRIMER motivo del PRIMER archivo rechazado.
- La línea se imprime una sola vez, al final de la salida estándar, solo cuando el código de salida es 1. Con 0 o 2 no se imprime.
- Solo lee: no escribe archivos ni guarda historial (eso es de F39).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `scripts/firma.mjs`, la línea en el CLI para los tres modos y sus pruebas.
Fuera de alcance: contar repeticiones, `--presupuesto`, `Bloqueo:`, skills y agentes, y el hook.

## Pasos
1. Crea `scripts/firma.mjs` con `reglaDe` y `firma`.
2. En `scripts/validar-tarea.mjs`, guarda el texto y el primer motivo del primer archivo rechazado, y tras imprimir los rechazos imprime la línea de firma si el código es 1.
3. En el test, ajusta el caso de la «una sola línea de rechazo» para que cuente solo las líneas que no empiezan con `Firma:`.
4. Pruebas nuevas: una tarea dañada da `Firma: bloque-abierto|<ruta>|<12 hex>`; el mismo archivo dos veces da la misma firma; cambiar un carácter cambia el hash; dos reglas distintas dan reglas distintas; `OK` y el código 2 no imprimen firma; `reglaDe('algo raro')` es `otra`.

## Criterios de aceptación
1. Una tarea inválida sale con 1 y su última línea es `Firma: <regla>|<ruta>|<12 hex>`. Se comprueba en `validar-tarea.test.mjs`.
2. Mismo archivo, misma firma; archivo distinto en un carácter, hash distinto; dos reglas, dos identificadores. Misma prueba.
3. Con 0 y con 2 no hay línea `Firma:`.
4. `bash pruebas/rapida.sh` termina en 0.

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/validar-tarea.test.mjs
node scripts/validar-tarea.mjs --evidencia features/F38-validador-causal-tareas/task-03-linea-firma-del-error.md; echo "exit $?"
bash pruebas/rapida.sh
```
Esperado: primera salida `fix/F38-validador-causal-tareas`; la prueba con `fail 0`; el comando 3 (la tarea está en `borrador`) termina en una línea que empieza con `Firma: estado|` y `exit 1`; `rapida.sh` con `exit 0`.

## Evidencia
```
$ git branch --show-current
fix/F38-validador-causal-tareas
exit 0
```

```
$ node --test pruebas/comprobaciones/validar-tarea.test.mjs
✔ una tarea válida (código 0) no imprime línea «Firma:» (37.105291ms)
✔ un uso con error (código 2) no imprime línea «Firma:» (34.061167ms)
✔ reglaDe clasifica un motivo desconocido como «otra» (2.408334ms)
ℹ tests 36
ℹ suites 0
ℹ pass 36
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1482.736042
exit 0
```

```
$ node scripts/validar-tarea.mjs --evidencia features/F38-validador-causal-tareas/task-03-linea-firma-del-error.md; echo "exit $?"
(salida real antes de reescribir esta Evidencia: 6 rechazos de «Falta la salida», «no aparece literal» y de los fragmentos esperados «borrador» y «Firma: estado|»)
Firma: evidencia-falta|features/F38-validador-causal-tareas/task-03-linea-firma-del-error.md|ca46add9590f
exit 1
```

Desvío de la Verificación 3: el fragmento esperado «Firma: estado|» con la tarea en `borrador` no se alcanza. La tarea está en `en curso` y su primer motivo de rechazo es de evidencia (regla `evidencia-falta`), así que la salida real empieza por `Firma: evidencia-falta|`. Ver Notas.

```
$ bash pruebas/rapida.sh
ℹ tests 778
ℹ pass 778
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 32498.375417
rapida: 53 archivos en 32 s (tope 90 s)
exit 0
```

## Notas
- Verificación del código existente: `scripts/firma.mjs` (`reglaDe`, `firma`) y la llamada de `scripts/validar-tarea.mjs` (primer rechazo, línea `Firma:` solo con código 1) ya estaban escritos y se revisaron; no se reescribieron.
- Bloque «Bloqueo:» y evidencia del intento anterior borrados, como pide el encargo.
- Hueco menor 1: los tests «una sola línea de rechazo» y «--evidencia con una completa y una incompleta» filtran las líneas `Firma:` antes de contar.
- Hueco menor 2: la regla `evidencia-falta` casa «Falta la línea «exit» por prefijo, porque el mensaje real es «Falta la línea «exit N»».
- Hueco menor 3: el hash se calcula sobre el texto leído en UTF-8 (`createHash` con la cadena tal cual se leyó), sin reescribirlo.
- Desvío de la Verificación 3: se esperaba `Firma: estado|` con la tarea en `borrador`; la tarea está en `en curso` y su primer motivo es de evidencia, así que la firma es `Firma: evidencia-falta|...`. No se cambió la tarea para que coincida. Hueco menor documentado, no bloqueo.
- Verificación 4: en esta ejecución `rapida.sh` sale con 0 (778 pass, 0 fail). Los 4 fallos del intento anterior ya no aparecen; no se tocó código para lograrlo.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
