# Flucastr.AI

Kit de agentes y skills para trabajar con IA en Claude Code, Pi y Codex. Un solo repo (remoto: `francolmc/Flucastr.AI`). **Versión 2 en `main`** (en uso real; pendientes en `TODO.md`). La v1 está en `old/v1/` y en el tag `kit-v1`; no se ejecuta.

## Cómo funciona (v2)

El detalle por tema está en `docs/como-funciona.md`: lee solo la entrada del tema que tocas.

- Aceptación: `node --test tests/acceptance/*.test.mjs` corre un archivo por flujo (`builder-contract`, `kit-run`, `uso`); filtro por flujo con `--test-name-pattern=<flujo>`. Los envoltorios están en `tests/acceptance/` y no cambian las suites que envuelven.
- Comando `verify`: `./verify`; qué comprueba, en `README.md` («Verificación»). Modo remoto: `VERIFY_TARGET=<url> ./verify`, solo lectura salvo `VERIFY_PERMITIR_ESCRITURA=1`.
- Salida de `./verify`: solo un resumen (en rojo, la cola del paso que falló); detalle en `pruebas/.temporales/verify.log`: lee su cola o filtra. Cada corrida usa un temporal propio que se borra al salir (`docs/implementacion.md`).
- Rama base: `main`. Liberar a `main` lo hace la persona usuaria a mano.
- Si el builder no termina: escalera de recuperación (`kit run`; con subagentes, `scripts/kit-escalera.mjs`). Subir de nivel y el relevo del planner exigen el sí de la persona.
- Estructura: agentes en `core/agents/` (`planner`, `builder`), skills en `core/skills/`, referencias del planner en `core/references/planner/`, contrato de verificación en `core/contracts/`, lo propio de un stack en `core/recipes/`, adaptadores por herramienta en `adapters/`, modelos, esfuerzo y ventanas en `models.json`.
- Traspaso: `changes/<nombre>/plan.md`; avance en `changes/<nombre>/notes.md`; cerrados en `changes/done/`.
- Hook de permisos (Claude Code): `scripts/permissions-hook.mjs` conecta `hook-shell.mjs` (analiza) y `hook-decidir.mjs` (decide); solo levanta un bloqueo textual si toda la línea es inerte. Corre desde la carpeta del kit, también sin commit: conecta cambios ya probados. Límites: `docs/reglas-deny.md`.

## Invariantes

- `core/agents/` y `core/skills/` no nombran herramientas de un stack: los proyectos declaran sus comandos en su `AGENTS.md`.
- Instrucciones operativas de agentes y skills en inglés; documentación en español; comandos con opciones en español y alias en inglés; los agentes responden en el idioma de la conversación.
- Tamaños (piso tras compactar): `planner.md` ≤ 8192 bytes, `plan-change/SKILL.md` ≤ 6144, `builder.md` más `execute-plan/SKILL.md` ≤ 13500, este archivo ≤ 6144 (`tests/context-size/`). El detalle va a referencias o `docs/`.
- Contrato del builder: límites y retorno en `builder.md` (`kit run` lo antepone al prompt); procedimiento en `execute-plan`. No repitas una regla en el otro archivo.
- Hay pruebas que exigen frases literales (`tools/verify/`, `tests/builder-contract.mjs`, `tests/continuity/`): al mover una frase, mueve su comprobación sin debilitarla.
- `spawnSync`, `execFileSync` y `execSync` no usan stdin como pipe: usa `tools/spawn/sync-seguro.mjs` o `stdio` `ignore`/`inherit` (paso 19 de `./verify`).
- Un script nuevo que cree temporales los limpia también al fallar (`tests/temporales/estatico.test.mjs`, paso 24).
- Antes de pedir aprobación de un plan: `node scripts/review-plan.mjs <plan>`.
- Skills: `core/skills/*/SKILL.md` con `name` igual a la carpeta; en Pi, las de un subagente se declaran en su frontmatter con `inheritProjectContext: true`.

## Reglas

- Los agentes no hacen commit, push, PR, merge ni despliegue: lo hace la persona usuaria.
- No se leen `.env`, llaves ni credenciales (`.env.example` sí).
- Git permitido a los agentes: crear la rama del cambio con `git switch -c <prefijo>/<nombre>` (`feature/`, `fix/`, `chore/`, `docs/`).
- En Pi los subagentes no heredan skills: toda skill que use un subagente se declara en su frontmatter (`skills:`), y `inheritProjectContext: true` para el contexto del proyecto.
- En un proyecto instalado con `--project`, Claude Code bloquea con reglas deny `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C … commit`, `git -c … commit`, `git … push`, `bash -c`, `sh -c`, `zsh -c` y leer `.env`. Codex (experimental) bloquea por prefijo lo mismo, salvo leer `.env` (ver «Límites de las reglas deny»); bloquea también `git -C` y `git -c` aunque no sean commit: ejecuta Git con el repo como directorio de trabajo del comando (workdir), no con esas opciones. Si una de esas acciones se bloquea, es la regla: no la saltes; lo hace la persona usuaria. El agente tampoco puede usar `bash -c` (intencional).

## Límites de las reglas deny

Las reglas deny de Claude Code son una barrera, no una frontera: cubren `git -C/-c … commit` y `bash -c`/`sh -c`/`zsh -c`, pero no `sudo`, `env <cmd>` ni leer `.env` desde un script; el kit configura restricciones de sandbox, aún sin prueba de lectura Bash ni precedencia ante allow global. Codex no bloquea `.env` y Pi no tiene equivalente. Detalle, con lo probado y lo no probado: `docs/reglas-deny.md`.

Lo de la v1 está en `old/v1/` (`legacy/`, `definitions/`, `features/`, `pruebas/`, `registro/`, los scripts de la v1, el README viejo y los reportes sueltos). Borrar `old/` viene después de usar la v2 en 2 o 3 proyectos reales; es decisión de la persona usuaria.

`old/v1/registro/` no se lee salvo pedido explícito de la persona usuaria. `pruebas/.temporales/` (ignorado por git) no se borra ni se mueve sin pedido.
