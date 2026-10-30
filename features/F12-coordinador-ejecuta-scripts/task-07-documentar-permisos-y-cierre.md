# task-07 — Documentar permisos del `coordinador`, README de pruebas y cierre de la feature
repo: Flucastr.AI   depende_de: task-05, task-06   estado: borrador

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

## Notas
