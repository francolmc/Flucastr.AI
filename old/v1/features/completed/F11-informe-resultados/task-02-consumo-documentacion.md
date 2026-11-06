# task-02 — Bloque `--consumo`, pruebas de privacidad y documentación
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Añadir a `scripts/informe.mjs` la opción `--consumo <dir>`: bloque con costo y turnos totales, por rol y por tarea (aproximado), usando `scripts/consumo.mjs`. Probar privacidad y el bloque opcional, y documentar el comando en `README.md`.

## Contexto
- Lee solo las *Notas* de `features/F11-informe-resultados/task-01-nucleo-informe.md` (exportaciones reales de `scripts/informe.mjs`).
- Diseño aprobado: `definitions/ARCHITECTURE.md` «Informe de resultados del flujo», filas «Consumo» (línea 458) y pruebas 6 y 8 (líneas 503 y 505).
- De `scripts/consumo.mjs`: `descubrirSesiones(raiz, {hasta})` (línea 585) devuelve sesiones con `herramienta`, `rol`, `archivo` (ruta: no copiarla), `turnos`, `costo` (número o `null`/no numérico = `n/d`) y `subagentes.porRol` = `{rol: {corridas, turnos, costo}}`. `informeJson(sesiones, {tareas})` (línea 673) da el JSON con `porTarea: {costo, turnos}` por sesión.
- Fixtures sintéticos: `pruebas/comprobaciones/consumo-fixtures.mjs` (`registroSesionPi`, `turnoPi`, `unirJsonl`, `turnoClaude`, `metaSubagentePi`, `transcriptSubagentePi`, etc.). Ejemplo de uso en `pruebas/comprobaciones/consumo.test.mjs`.
- README: sección «Medición de consumo» (línea 253) y «Registro de eventos» (línea 264); árbol de `scripts/` (líneas 88–93).

## Decisiones ya tomadas
- `--consumo <dir>` sin otra opción nueva. Sin la bandera el informe no cambia nada respecto de task-01 (byte a byte). Si `<dir>` no es carpeta: stderr, código 1, no escribe.
- El bloque `## Consumo (aproximado)` va antes de «Límites de esta lectura». Contiene: total de turnos y costo (suma de sesiones; `n/d` si ninguna tiene costo numérico), tabla por rol (rol | corridas | turnos | costo) sumando `subagentes.porRol` de todas las sesiones más el rol propio de cada sesión (`rol` de la sesión, con sus `turnos` y `costo`), y «por tarea (promedio)» = totales ÷ `n` de tareas con `tarea_estado a=hecha` del informe (`n/d` si 0).
- Texto fijo en el bloque: «F20 mide sesiones, no tareas: el costo por tarea es un promedio, no una atribución».
- Nunca se copia `archivo`, rutas ni texto de mensajes. `--json` agrega la clave `consumo` con los mismos números.
- Con `n < minimo` el bloque no se calcula (el informe solo trae conteos).

## Alcance / Fuera de alcance
Alcance: `scripts/informe.mjs`, `pruebas/comprobaciones/informe-consumo.test.mjs` (nuevo), `README.md`.
Fuera de alcance: `definitions/**` (incluye `WORKFLOW.md` §10.5 y permisos del `coordinador`: lo corre Franco); `scripts/consumo.mjs`; calibrar el umbral (lectura posterior de Franco); `pruebas/README.md`.

## Pasos
1. `informe.mjs`: aceptar `--consumo <dir>` en `leerArgumentos`; validar carpeta.
2. Calcular el bloque con `descubrirSesiones` y sumas; incluirlo en Markdown y `--json`.
3. `informe-consumo.test.mjs`, prueba 8: sesiones sintéticas en carpeta temporal; con la bandera aparecen totales y por rol; sin ella no aparece nada de consumo. Control: costo ausente da `n/d`.
4. Misma prueba, caso 6: el log lleva claves y valores canario (título, autor, ruta absoluta) que `validarEvento` rechaza, y la sesión sintética tiene un `archivo` con nombre canario; ninguno aparece en `informe.md` ni en stdout.
5. `README.md`: en «Registro de eventos» reemplazar la frase «El informe que lo resuma es una feature aparte (F11)…» por una que diga que existe `node scripts/informe.mjs [--consumo <carpeta de logs>] [--minimo <n>] [--json]`, que lo corro yo tras `registrar.mjs`, que escribe `registro/informe.md` (ignorado por git) y que bajo 10 tareas con datos solo da conteos. Añadir la línea `informe.mjs` al árbol de `scripts/`.

## Criterios de aceptación
1. Con `--consumo`, el informe incluye totales y tabla por rol con los números de las sesiones sintéticas; sin la bandera, no hay bloque.
2. Ningún canario (log ni ruta de sesión) aparece en `informe.md` ni en stdout.
3. `--consumo` con una carpeta inexistente: código 1 y no escribe.
4. `README.md` documenta el comando y `informe.mjs` figura en el árbol.
5. `bash pruebas/rapida.sh` pasa bajo 30 s.

## Verificación
- `node --test pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs` → todas pasan.
- `bash pruebas/rapida.sh` → sin fallas, bajo 30 s.
- `grep -n "informe.mjs" README.md` → al menos 2 líneas.
(No ejecutados aún, inferidos.)

## Evidencia
Comando: `node --test pruebas/comprobaciones/informe.test.mjs pruebas/comprobaciones/informe-consumo.test.mjs`
```
✔ (8) consumo opcional: con --consumo hay totales y tabla por rol; sin la bandera no hay bloque
✔ (8b) control negativo: sin costo numérico el costo sale n/d; la tabla sigue con las corridas y turnos
✔ (6) privacidad: canarios del log y de la sesión no aparecen en informe.md ni en stdout
✔ (8c) --consumo con carpeta inexistente o que es archivo: código 1 y no escribe
...
ℹ tests 15
ℹ pass 15
ℹ fail 0
```
Bloque real (sesiones sintéticas de la prueba 8, 10 tareas hechas):
```
## Consumo (aproximado)
Total: turnos 8 · costo US$0.900
F20 mide sesiones, no tareas: el costo por tarea es un promedio, no una atribución.
por tarea (promedio, n=10): turnos 0.8 · costo US$0.090

| Rol | Corridas | Turnos | Costo |
|---|---|---|---|
| constructor | 1 | 4 | US$0.100 |
| coordinador | 1 | 2 | US$0.750 |
| planificador | 1 | 2 | US$0.050 |
```

Comando: `bash pruebas/rapida.sh`
```
ℹ tests 366
ℹ pass 366
ℹ fail 0
rapida: 31 archivos en 17 s (tope 30 s)
(exit 0)
```

Comando: `grep -n "informe.mjs" README.md`
```
93:│   ├── informe.mjs    # informe de resultados del flujo desde registro/eventos.jsonl; con --consumo añade el bloque de consumo (lo corre Franco)
266:Junto datos de cada ejecución del flujo ... El informe que lo resume existe: `node scripts/informe.mjs [--consumo <carpeta de logs>] [--minimo <n>] [--json]`. ...
```

Criterios de aceptación:
1. Cumplido: con `--consumo` aparecen totales y tabla por rol (prueba 8); sin la bandera no hay bloque ni clave `consumo` en `--json`.
2. Cumplido: canarios de título, autor, ruta absoluta, nombre de sesión y centinela no aparecen en `informe.md` ni en stdout (prueba 6).
3. Cumplido: carpeta inexistente o que es archivo da código 1, stderr y no escribe `informe.md` (prueba 8c).
4. Cumplido: README documenta el comando e `informe.mjs` figura en el árbol de `scripts/`.
5. Cumplido: `rapida.sh` pasa en 17 s (tope 30 s).

Control adicional: sin `--consumo`, `registro/informe.md` y la salida `--json` salen byte a byte iguales a la versión anterior (task-01), con 10 tareas sintéticas.

## Notas
Huecos menores y decisiones:
1. Con `n < minimo` el bloque no se calcula: en `--json` la clave `consumo` vale `null` y el Markdown no lleva bloque (sin aviso aparte).
2. Totales: suman sesiones principales y sus subagentes, para que la tabla por rol sume lo mismo. `costo` vale `n/d` solo si ninguna fila tiene costo numérico. Claude Code no tiene costo por subagente: esas filas quedan `n/d` y no suman.
3. Cada sesión cuenta como una corrida de su rol.
4. Un rol que no sea nombre simple (`^[a-z][a-z0-9-]{0,39}$`) sale como «otro», para no copiar texto que venga de los logs.
5. `--consumo` con carpeta inválida: mensaje genérico en stderr, sin imprimir la ruta.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=5; resultado=lista; causa=ninguna
