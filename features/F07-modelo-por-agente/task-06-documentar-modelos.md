# task-06 — Documentar cómo se comprueba el modelo de cada agente
repo: Flucastr.AI   depende_de: task-02, task-03, task-04, task-05   estado: aprobada

## Descripción
Deja escrito en `pruebas/README.md` cómo comprobar que cada agente corre con el modelo de `modelos.json` (comprobación determinista y lanzadores con modelo), sin duplicar lo ya dicho.

## Contexto
- Repo único. Leídos: `pruebas/README.md` (secciones sobre verificación rápida y precondición de agente instalado, líneas 5–9) y los resultados de task-02 a task-05.
- Archivo a tocar: solo `pruebas/README.md`. La prueba de estructura del README es `pruebas/comprobaciones/readme-estructura.test.mjs` (`node --test`).

## Decisiones ya tomadas
- Se añade una viñeta tras la línea de la precondición de agente instalado, de máximo 6 líneas, con: el comando `node pruebas/comprobaciones/modelos-agentes.mjs` (qué comprueba, exit 1 si hay que reinstalar), los lanzadores `pruebas/lanzar-modelos-claude.sh` y `pruebas/lanzar-modelos-pi.sh` (una corrida por herramienta, con modelo), `modelosPorActor` en `registro.mjs`, y la advertencia de que `CLAUDE_CODE_SUBAGENT_MODEL` invalida la prueba en Claude Code. La viñeta también dice (confirmado en `pruebas/lanzar-modelos-claude.sh`, línea 10, y aprobado por Franco el 2026-10-30): (1) la variable `FLUCASTR_PERSISTIR_SESION=1` del lanzador de Claude Code, que omite `--no-session-persistence`; (2) que en Claude Code el modelo del subagente sale de las transcripciones de `~/.claude/projects/`, por eso la sesión debe persistir; (3) que `modelosPorActor` recibe el texto del registro más esas líneas de transcripción.
- Lo relativo a Pi depende de lo que halle task-04 (en ejecución al ajustar esta tarea): el ejecutor lo toma de su *Evidencia*/*Notas*; no se inventa.
- Si task-04 dejó «subagente no observable en el registro», el README lo dice con esas palabras.
- No se editan `definitions/` (`WORKFLOW.md` §7 queda como está; actualizarlo es del `arquitecto` si Franco lo pide).

## Alcance / Fuera de alcance
Alcance: la viñeta en `pruebas/README.md`.
Fuera de alcance: `definitions/**`, `AGENTS.md`, el README raíz y cualquier código.

## Pasos
1. Leer *Evidencia* y *Notas* de task-02 a task-05.
2. Añadir la viñeta. Resultado: `grep -c "modelos-agentes.mjs" pruebas/README.md` ≥ 1.
3. Correr la *Verificación*.

## Criterios de aceptación
1. El README menciona las tres piezas, `CLAUDE_CODE_SUBAGENT_MODEL`, `FLUCASTR_PERSISTIR_SESION`, las transcripciones de `~/.claude/projects/` y que `modelosPorActor` recibe registro más esas líneas. Se comprueba con los cinco `grep -c`.
2. Las pruebas de estructura del README siguen pasando.

## Verificación
```
for t in modelos-agentes.mjs lanzar-modelos-claude.sh lanzar-modelos-pi.sh CLAUDE_CODE_SUBAGENT_MODEL FLUCASTR_PERSISTIR_SESION; do grep -c "$t" pruebas/README.md; done
node --test pruebas/comprobaciones/readme-estructura.test.mjs
```
Esperado: cinco números, cada uno ≥ 1 (`grep -c FLUCASTR_PERSISTIR_SESION pruebas/README.md` ≥ 1); y `fail 0`. No ejecutado: depende de la edición.

## Evidencia

## Notas
