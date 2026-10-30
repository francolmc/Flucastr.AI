# task-07 — Documentar permisos del `coordinador`, README de pruebas y cierre de la feature
repo: Flucastr.AI   depende_de: task-05, task-06   estado: bloqueada

## Descripción
Deja escrito, con los resultados reales de task-05 y task-06, qué contiene y qué no contiene cada herramienta al ejecutar scripts el `coordinador`, para que Franco lo revise y sea la base de F11. Documenta en `pruebas/permisos-ejecucion.md` la sección del `coordinador` (Claude Code por patrones; Pi solo instruccional), registra las pruebas nuevas en `pruebas/README.md` y comprueba que no queda ninguna mención contradictoria al comportamiento anterior de `--aplicar`.

## Contexto
- Repo: este, único. Node 25. Sin modelo.
- A leer y tocar: `pruebas/permisos-ejecucion.md` (11 líneas; hoy solo trata a las corridas del arquitecto, con secciones `## Claude Code` y `## Pi`), `pruebas/README.md` (línea 9 describe las corridas con modelo; añadir una línea para las del coordinador).
- A leer (resultados de tareas previas): `pruebas/resultados/2026-10-30-coordinador-claude.md` y `pruebas/resultados/2026-10-30-coordinador-pi.md` (creados por task-05 y task-06; si la fecha real difiere, usar los nombres que dejaron esas tareas en *Notas*), `agentes/coordinador.md`, `definitions/WORKFLOW.md` §3.1.
- Búsqueda a ejecutar: `grep -rn "aplicar" --include=*.md --include=*.mjs --include=*.sh . --exclude-dir=.git --exclude-dir=completed --exclude-dir=resultados --exclude-dir=.temporales` para encontrar menciones de `--aplicar` sin `Fxx` fuera de `definitions/` (no se editan allí).
- `pruebas/comprobaciones/readme-estructura.mjs` valida solo el árbol de `README.md` (agentes y skills); esta tarea no toca `README.md`.

## Decisiones ya tomadas
- Nueva sección `## Coordinador: ejecución de scripts` en `pruebas/permisos-ejecucion.md`, con estas cuatro cosas, cada una en una línea: (1) lista cerrada de los tres comandos y `Fxx` obligatorio (cita a `definitions/WORKFLOW.md` §3.1); (2) Claude Code: restricción por patrones en `tools:` del agente, con el resultado de la comprobación de task-02 y de task-05; (3) Pi: `bash` completo, contención solo instruccional, con el resultado de task-06 y la frase «un resultado limpio no demuestra contención»; (4) riesgo común: el `coordinador` ejecuta código de `scripts/` que el `constructor` puede modificar, por lo que la puerta 4 revisa `git diff scripts/`.
- Los resultados se citan por ruta y veredicto de cada caso (aprobado/fallo), sin pegar registros ni valores del canario.
- No se cambia ninguna regla; si la búsqueda halla una contradicción fuera de `definitions/`, se anota en *Notas* y no se corrige en esta tarea.
- No se edita `definitions/WORKFLOW.md`; las referencias a «comprobación pendiente» de §3.1 las actualiza Franco o el `arquitecto`.

## Alcance / Fuera de alcance
Alcance: las dos secciones de documentación y la búsqueda de contradicciones.
Fuera de alcance: editar `definitions/`, `README.md` (raíz), agentes, scripts o pruebas; relanzar corridas con modelo; commit; marcar la feature `hecha`.

## Pasos
1. Leer los dos informes de resultados y la sección actual de `pruebas/permisos-ejecucion.md`.
2. Añadir a `pruebas/permisos-ejecucion.md` la sección `## Coordinador: ejecución de scripts` según *Decisiones*.
3. Añadir a `pruebas/README.md`, a continuación de la línea 9, una línea con: fixture `pruebas/fixtures/coordinador.sh`, comprobador `pruebas/comprobaciones/coordinador-ejecucion.mjs`, lanzadores `pruebas/lanzar-coordinador-claude.sh` y `pruebas/lanzar-coordinador-pi.sh`, y que las corridas con modelo son bajo pedido de Franco.
4. Ejecutar la búsqueda de `aplicar` y anotar en *Notas* cada mención de `--aplicar` sin `Fxx` fuera de `definitions/`, o «ninguna».
5. Correr la suite completa y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `pruebas/permisos-ejecucion.md` contiene la sección con los cuatro puntos y cita ambos informes. Se comprueba con `grep` de *Verificación*.
2. `pruebas/README.md` menciona los cuatro archivos nuevos. Se comprueba con `grep`.
3. El documento dice que en Pi la contención es solo instruccional y no incluye el valor del canario. Se comprueba con `grep`.
4. La suite completa pasa sin fallos.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c "Coordinador: ejecución de scripts\|solo instruccional\|coordinador-claude\|coordinador-pi" pruebas/permisos-ejecucion.md
grep -c "fixtures/coordinador.sh\|coordinador-ejecucion.mjs\|lanzar-coordinador-claude.sh\|lanzar-coordinador-pi.sh" pruebas/README.md
grep -c "valor-reconocible-9f3a" pruebas/permisos-ejecucion.md pruebas/README.md
node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Salida esperada: el primer conteo ≥ 4; el segundo ≥ 4; el tercero `0` en ambos archivos; `fail 0`.

## Evidencia

Verificación, pasada 1 (tras escribir la sección de `permisos-ejecucion.md` y las viñetas de `README.md`; el primer conteo dio 3 porque la cita de Pi y «solo instruccional» iban en la misma línea):

```
$ grep -c "Coordinador: ejecución de scripts\|solo instruccional\|coordinador-claude\|coordinador-pi" pruebas/permisos-ejecucion.md
3
$ grep -c "fixtures/coordinador.sh\|coordinador-ejecucion.mjs\|lanzar-coordinador-claude.sh\|lanzar-coordinador-pi.sh" pruebas/README.md
4
$ grep -c "valor-reconocible-9f3a" pruebas/permisos-ejecucion.md pruebas/README.md
pruebas/permisos-ejecucion.md:0
pruebas/README.md:0
$ node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 244
ℹ pass 243
ℹ fail 1
```

Verificación, pasada 2 (tras partir las citas de Claude y Pi en sub-líneas de `permisos-ejecucion.md`):

```
$ grep -c "Coordinador: ejecución de scripts\|solo instruccional\|coordinador-claude\|coordinador-pi" pruebas/permisos-ejecucion.md
4
$ grep -c "fixtures/coordinador.sh\|coordinador-ejecucion.mjs\|lanzar-coordinador-claude.sh\|lanzar-coordinador-pi.sh" pruebas/README.md
4
$ grep -c "valor-reconocible-9f3a" pruebas/permisos-ejecucion.md pruebas/README.md
pruebas/permisos-ejecucion.md:0
pruebas/README.md:0
$ node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs pruebas/capa1/*.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)|^✖ definitions|AssertionError \["
✖ definitions/BACKLOG.md y features/F*/task-*.md reales son coherentes (0.541292ms)
ℹ tests 244
ℹ pass 243
ℹ fail 1
  AssertionError [ERR_ASSERTION]: se esperaban al menos dos carpetas de feature y hay 1
```

Causa del fallo (la misma en las dos pasadas): `pruebas/comprobaciones/coherencia-features.test.mjs:109` exige al menos dos carpetas `F*` directas en `features/`. Estado real del repo:

```
$ ls features/
completed  F12-coordinador-ejecuta-scripts
$ ls features/completed/
F01-base-verificacion-rapida  F02-planificar-y-coordinar  F03-verificar-constructor  F04-readme-al-dia  F05-ramas-y-refinado  F06-modo-yolo  F07-modelo-por-agente  F08-limpieza-y-archivo  F09-instalador-sin-clon  F10-registro-de-eventos
```

Las features F01–F10 ya estaban archivadas en `features/completed/` antes de esta tarea (`git status` no muestra cambios en ellas). La tarea solo edita `pruebas/permisos-ejecucion.md`, `pruebas/README.md` y su propio archivo; el test no depende de ellos. Corregir el test queda fuera de alcance (`pruebas/`), así que no se tocó.

Criterios de aceptación:
1. Cumple: `permisos-ejecucion.md` tiene la sección con los cuatro puntos, cita ambos informes (conteo 4).
2. Cumple: `README.md` menciona los cuatro archivos nuevos (conteo 4).
3. Cumple: «solo instruccional» en Pi; el valor del canario aparece 0 veces en ambos archivos.
4. No cumple: la suite tiene 1 fallo (`coherencia-features.test.mjs`), por la causa anterior; `fail 0` no se alcanza sin cambiar un test fuera de alcance.

Búsqueda de `aplicar` (paso 4), resultado con `grep` fuera de `definitions/`, `completed`, `resultados` y `.temporales`: menciones de `--aplicar` sin `Fxx` en la documentación y el código del repo, anotadas en *Notas*.

## Notas
- Búsqueda de `--aplicar` sin `Fxx` fuera de `definitions/` (no corregidas; fuera de alcance):
  - `README.md:54`: «con --aplicar (lo corre Franco), mueve las features hecha a features/completed/». No menciona `Fxx`; contradice «`Fxx` obligatorio» (§3.1, decisión 2).
  - `scripts/archivar.mjs:9-10` (cabecera): «--aplicar solo renombra carpetas» y «Lo ejecuta Franco, nunca un agente.». La segunda frase contradice §3.1, donde el `coordinador` puede correrlo a pedido de Franco. La línea 7 sí trae `Fxx`.
  - Las demás menciones (`agentes/coordinador.md`, `pruebas/comprobaciones/*`, `pruebas/lanzar-coordinador-claude.sh`) llevan `Fxx` o son pruebas de rechazo de argumentos.
- Contradicción para Franco en `definitions/WORKFLOW.md` (no editado): §3.1 lista los «Controles compensatorios que se piden (trabajo posterior)». Las pruebas con modelo de task-05 y task-06 ya existen; la frase sigue en futuro.
- Huecos menores resueltos:
  1. La línea 9 de `pruebas/README.md` trata de corridas de modelo, no del `coordinador`. Se añadieron cuatro viñetas a continuación, una por archivo, porque la verificación cuenta líneas.
  2. En `permisos-ejecucion.md`, las citas de Claude y Pi van en sub-líneas, por el mismo motivo (conteo ≥ 4).
  3. La comprobación de task-02 no tiene informe en `pruebas/resultados/`; se cita por ruta a su *Evidencia* en `features/F12-coordinador-ejecuta-scripts/task-02-coordinador-comandos-claude.md`.
- Bloqueo: la *Verificación* falló dos veces por la misma causa (`coherencia-features.test.mjs`, ver *Evidencia*). Desbloquear requiere decidir si el test se adapta al repo actual (carpetas archivadas) o si se restaura alguna carpeta; eso es decisión fuera de esta tarea. Pendiente para el planificador.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=falla; huecos=3; resultado=bloqueada; causa=verificacion_x2
