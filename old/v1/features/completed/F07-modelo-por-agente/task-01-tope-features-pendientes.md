# task-01 — El tope de 6 features cuenta solo las pendientes
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
`pruebas/comprobaciones/formato-flujo.mjs` exige entre 1 y 6 filas en total en `definitions/BACKLOG.md`, y `skills/crear-backlog/SKILL.md` fija «Máximo 6 features». Con F01–F06 `hecha` y F07–F10 abiertas el backlog tiene 10 filas y `bash pruebas/rapida.sh` falla en «definitions/BACKLOG.md real cumple el formato». Decisión de Franco (2026-10-29, opción 1 / opción (a) del backlog): el tope de 6 se cuenta solo sobre las features no `hecha`. Esta tarea cambia validador, pruebas y texto de la skill para que sea así y habilita task-02.

## Contexto
- Repo único. Node ESM, `node:test`, sin dependencias. Leídos: `pruebas/comprobaciones/formato-flujo.mjs` (regla 2, líneas 44-48: `filas.length < 1 || filas.length > 6` y el mensaje `La tabla debe tener entre 1 y 6 features; tiene N.`), `pruebas/comprobaciones/formato-flujo.test.mjs` (test «backlog: siete features se rechazan», líneas 66-73, comprueba `e.includes('entre 1 y 6')`; el test «backlog real» está en la línea 121), `skills/crear-backlog/SKILL.md` línea 34 (`- **Máximo 6 features.** Si salen más, agrupa o deja las últimas fuera y dilo en una nota.`), `definitions/BACKLOG.md` (10 filas, 4 no `hecha`).
- Otros lugares que repiten el tope (grep de «6 features», «entre 1 y 6», «máximo de 6»): `definitions/WORKFLOW.md` líneas 146 y 149 (historial, «propuesta: hasta 6 features»), `definitions/BACKLOG.md` línea 28 (nota de decisión) y `definitions/STATUS.md`. `AGENTS.md` y `agentes/planificador.md` no lo repiten. Los de `definitions/` NO se editan aquí; se reportan.
- Archivos a tocar: los 3 primeros de arriba. Comando: `node --test pruebas/comprobaciones/formato-flujo.test.mjs`.

## Decisiones ya tomadas
- «Pendiente» significa Estado distinto de `hecha` (es decir `pendiente` o `en curso`).
- Nueva regla 2: al menos 1 fila de datos en total (sin tope total) y como máximo 6 filas con Estado distinto de `hecha`. Cada fila sigue necesitando 8 celdas e ID único.
- Mensajes exactos: `La tabla debe tener al menos 1 feature; tiene 0.` y `El backlog admite como máximo 6 features pendientes (Estado distinto de hecha); tiene N.`
- La cuenta de pendientes usa solo filas con 8 celdas, leyendo la celda de Estado (índice 6).
- Texto nuevo de la skill: `- **Máximo 6 features pendientes** (Estado distinto de \`hecha\`); las \`hecha\` no cuentan. Si salen más pendientes, agrupa o deja las últimas fuera y dilo en una nota.`
- No se tocan `definitions/`, `AGENTS.md`, el estado ni el contenido de otras tareas.

## Alcance / Fuera de alcance
Alcance: regla 2 del validador, sus pruebas y la línea 34 de la skill.
Fuera de alcance: editar `definitions/**` o `AGENTS.md`; archivar features `hecha` (es F08); cambiar otras reglas del validador; modificar `definitions/BACKLOG.md`.

## Pasos
1. En `formato-flujo.mjs`, reemplaza el bloque de la regla 2 (comentario incluido): si `filas.length < 1` agrega el primer mensaje exacto. Dentro del bucle existente, tras `datos.push(c)`, no cambies nada más; después del bucle calcula `pendientes = datos.filter((c) => c[6] !== 'hecha').length` y, si `pendientes > 6`, agrega el segundo mensaje. Resultado: el validador acepta 10 filas con 4 pendientes.
2. En `formato-flujo.test.mjs`, cambia el test «backlog: siete features se rechazan» a «siete features pendientes se rechazan» y su aserción a `e.includes('como máximo 6 features pendientes')`.
3. Añade tres tests en el mismo archivo: (a) 6 filas `hecha` + 6 `pendiente` (la primera con `→`) es válido (`deepEqual(..., [])`); (b) 6 `hecha` + 7 pendientes se rechaza con el mensaje del paso 2; (c) tabla sin filas de datos se rechaza con `al menos 1 feature`.
4. En `skills/crear-backlog/SKILL.md` línea 34, sustituye la viñeta por el texto nuevo de *Decisiones ya tomadas*.
5. Ejecuta la verificación.

## Criterios de aceptación
1. 10 filas con 4 pendientes no dan error de tope: `node --input-type=module -e "import fs from 'node:fs'; import {validarBacklog} from './pruebas/comprobaciones/formato-flujo.mjs'; console.log(validarBacklog(fs.readFileSync('definitions/BACKLOG.md','utf8')))"` imprime `[]`.
2. 7 pendientes se rechazan y 0 filas se rechazan: los tests nuevos pasan.
3. La skill dice «Máximo 6 features pendientes»: `grep -n "Máximo 6 features pendientes" skills/crear-backlog/SKILL.md` devuelve la línea 34.
4. `node --test pruebas/comprobaciones/formato-flujo.test.mjs` termina con 0 fallos.
5. `bash pruebas/rapida.sh` termina en verde con el BACKLOG real.

## Verificación
- `node --test pruebas/comprobaciones/formato-flujo.test.mjs` → `# fail 0`.
- `bash pruebas/rapida.sh` → exit 0 y línea final `rapida: N archivos en X s (tope 30 s)`. Nota: `pruebas/comprobaciones/modelos-agentes.test.mjs` (sin versionar, de task-02) está en el árbol y también corre; debe pasar. El comando del criterio 1 se ejecutó antes de cambiar el código y hoy imprime el error del tope (confirmado).

## Evidencia

Reintento (2026-10-29). Estado previo al cambio: `aprobada`, rama `feature/F07-modelo-por-agente` ya actual (sin `git switch`). Código revisado contra los pasos: `git diff` coincide con la regla 2 nueva, los tres tests nuevos, el test renombrado y la línea 34 de la skill. La numeración de F07 ya es `task-01-…` (renombrada desde `task-00-…`), por lo que el bloqueo de la corrida anterior ya no aplica.

Verificación 1, `node --test pruebas/comprobaciones/formato-flujo.test.mjs` (resumen final, salida verbatim):
```
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 64.294791
```

Criterio 1, `node --input-type=module -e "... validarBacklog(fs.readFileSync('definitions/BACKLOG.md','utf8')) ..."`:
```
[]
```

Criterio 2: los tests «siete features pendientes se rechazan», «seis hechas y seis pendientes es válido (las hechas no cuentan)», «seis hechas y siete pendientes se rechazan» y «tabla sin filas de datos se rechaza» aparecen en la salida de la verificación 1 como ✔ y no hay fallos.

Criterio 3: `grep -n "Máximo 6 features pendientes" skills/crear-backlog/SKILL.md`:
```
34:- **Máximo 6 features pendientes** (Estado distinto de `hecha`); las `hecha` no cuentan. Si salen más pendientes, agrupa o deja las últimas fuera y dilo en una nota.
```

Criterio 4: `ℹ fail 0` (verificación 1).

Criterio 5, `bash pruebas/rapida.sh` (salida final verbatim; las ~149 líneas ✔ intermedias se omiten, todas pasaron):
```
Entorno conservado: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/capa1-gvayeB
[… líneas ✔ de los tests de capa1, controles negativos, coherencia, agentes, skills, lanzadores y tareas …]
ℹ tests 149
ℹ suites 0
ℹ pass 149
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 21177.429708
rapida: 17 archivos en 21 s (tope 30 s)
```
Exit code: `exit=0`.

Incluye `modelos-agentes.test.mjs` (task-02, sin versionar): pasa dentro de las 149.

## Notas

- Causa del bloqueo de la corrida anterior, resuelta por Franco fuera de esta tarea: la tarea estaba como `task-00-…` y `coherencia-features.mjs` exige numeración desde `task-01`. El archivo ya se renombró a `task-01-tope-features-pendientes.md`; no se tocó ninguna regla de coherencia.
- Ningún hueco menor nuevo en este reintento: el código coincidía con los pasos, así que no hubo decisiones de interpretación.
- Fuera de alcance, no tocado y reportado para `definitions/` (decisión de Franco): `definitions/WORKFLOW.md` líneas 146 y 149, `definitions/BACKLOG.md` línea 28 y `definitions/STATUS.md` todavía dicen «máximo de 6» / «hasta 6 features».
- `definitions/BACKLOG.md`, `definitions/STATUS.md`, `pruebas/comprobaciones/formato-flujo.mjs` (ver diff) y `skills/crear-backlog/SKILL.md` aparecen modificados en `git status`; `definitions/BACKLOG.md` y `definitions/STATUS.md` no los modificó esta tarea.
- `rapida.sh` deja `pruebas/.temporales/capa1-gvayeB`; está ignorado por `pruebas/.gitignore`, no aparece en `git status`.
- Este reintento no escribió en `definitions/STATUS.md`. No hubo commit, push, PR, merge ni despliegue. Git: solo `git branch --show-current` (sin `switch`, la rama ya era la actual).
