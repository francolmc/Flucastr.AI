# task-06 — Documentar cómo se comprueba el modelo de cada agente
repo: Flucastr.AI   depende_de: task-02, task-03, task-04, task-05   estado: hecha

## Descripción
Deja escrito en `pruebas/README.md` cómo comprobar que cada agente corre con el modelo de `modelos.json` (comprobación determinista y lanzadores con modelo), sin duplicar lo ya dicho.

## Contexto
- Repo único. Leídos: `pruebas/README.md` (secciones sobre verificación rápida y precondición de agente instalado, líneas 5–9) y los resultados de task-02 a task-05.
- Archivo a tocar: solo `pruebas/README.md`. La prueba de estructura del README es `pruebas/comprobaciones/readme-estructura.test.mjs` (`node --test`).

## Decisiones ya tomadas
- Se añade una viñeta tras la línea de la precondición de agente instalado, de máximo 6 líneas, con: el comando `node pruebas/comprobaciones/modelos-agentes.mjs` (qué comprueba, exit 1 si hay que reinstalar), los lanzadores `pruebas/lanzar-modelos-claude.sh` y `pruebas/lanzar-modelos-pi.sh` (una corrida por herramienta, con modelo), `modelosPorActor` en `registro.mjs`, y la advertencia de que `CLAUDE_CODE_SUBAGENT_MODEL` invalida la prueba en Claude Code. La viñeta también dice (confirmado en `pruebas/lanzar-modelos-claude.sh`, línea 10, y aprobado por Franco el 2026-10-30): (1) Claude Code: la variable `FLUCASTR_PERSISTIR_SESION=1` del lanzador omite `--no-session-persistence`, porque el modelo del subagente sale de las transcripciones de `~/.claude/projects/` y la sesión debe persistir; (2) Pi: el modelo del subagente sale del propio registro `--mode json` (`result.details.results[].model` del `tool_execution_end` de `subagent`), sin transcripciones ni variable equivalente (hallazgo de task-04 y task-05, aprobado por Franco el 2026-10-30); (3) `modelosPorActor` recibe el texto del registro más, solo en Claude Code, esas líneas de transcripción.
- No se editan `definitions/` (`WORKFLOW.md` §7 queda como está; actualizarlo es del `arquitecto` si Franco lo pide).

## Alcance / Fuera de alcance
Alcance: la viñeta en `pruebas/README.md`.
Fuera de alcance: `definitions/**`, `AGENTS.md`, el README raíz y cualquier código.

## Pasos
1. Leer *Evidencia* y *Notas* de task-02 a task-05.
2. Añadir la viñeta (≤ 6 líneas) que cubra Claude Code y Pi. Resultado: `grep -c "modelos-agentes.mjs" pruebas/README.md` ≥ 1.
3. Correr la *Verificación*.

## Criterios de aceptación
1. El README menciona las tres piezas, `CLAUDE_CODE_SUBAGENT_MODEL`, `FLUCASTR_PERSISTIR_SESION`, las transcripciones de `~/.claude/projects/`, el registro `--mode json` de Pi y que `modelosPorActor` recibe el registro más esas líneas en Claude Code. Se comprueba con los siete `grep -c`.
2. Las pruebas de estructura del README siguen pasando.

## Verificación
```
for t in modelos-agentes.mjs lanzar-modelos-claude.sh lanzar-modelos-pi.sh CLAUDE_CODE_SUBAGENT_MODEL FLUCASTR_PERSISTIR_SESION '~/.claude/projects/' '--mode json'; do grep -cF -- "$t" pruebas/README.md; done
node --test pruebas/comprobaciones/readme-estructura.test.mjs
```
Esperado: siete números, cada uno ≥ 1; y `fail 0`. No ejecutado: depende de la edición.

## Evidencia

Rama actual: `feature/F07-modelo-por-agente` (coincide con el encargo; sin `git switch`). Leídas *Evidencia* y *Notas* de task-02 a task-05 (paso 1). Se añadió una viñeta en `pruebas/README.md` (línea 9), tras la precondición de agente instalado (línea 8). Ningún otro archivo tocado.

Verificación (salida real, `grep -cF` sobre `pruebas/README.md`):
```
$ for t in modelos-agentes.mjs lanzar-modelos-claude.sh lanzar-modelos-pi.sh CLAUDE_CODE_SUBAGENT_MODEL FLUCASTR_PERSISTIR_SESION '~/.claude/projects/' '--mode json'; do grep -cF -- "$t" pruebas/README.md; done
1
1
1
1
1
1
1
```

```
$ node --test pruebas/comprobaciones/readme-estructura.test.mjs; echo "salida=$?"
✔ muestra válida: no hay errores (1.521791ms)
✔ variante: falta un agente en el README (0.115167ms)
✔ variante: falta una skill en el README (0.443541ms)
✔ variante: sobra un agente en el README (0.107708ms)
✔ variante: sobra una skill en el README (0.082916ms)
✔ variante: README sin sección «## Estructura» (0.060792ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.574125ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 81.7895
salida=0
```

Criterios de aceptación:
1. El README menciona las siete piezas (`grep -c` de arriba, todas = 1): **cumple**.
2. Pruebas de estructura del README: `fail 0`, `salida=0`: **cumple**.

## Notas

- Huecos menores resueltos:
  - La viñeta va en una sola línea del archivo (≤ 6 líneas cumplido) y cubre: `modelos-agentes.mjs` (exit 1 según `process.exit(1)` de la línea 96 del script), los dos lanzadores con modelo, `modelosPorActor` en `registro.mjs`, la advertencia de `CLAUDE_CODE_SUBAGENT_MODEL`, y los tres puntos aprobados (`FLUCASTR_PERSISTIR_SESION=1` y transcripciones de `~/.claude/projects/` en Claude Code; registro `--mode json` de Pi sin transcripciones; `modelosPorActor` con registro más transcripciones solo en Claude Code).
  - `CLAUDE_CODE_SUBAGENT_MODEL` no aparece en ningún script del repo (`grep` sin coincidencias fuera de `.temporales`); la advertencia se tomó tal cual de *Decisiones ya tomadas*.
- No se editó `definitions/` ni `definitions/STATUS.md`. Sin commit, push, PR, merge ni despliegue.
