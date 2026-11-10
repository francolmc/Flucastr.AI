# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code, Pi y Codex. Un solo repo (remoto: `francolmc/Flucastr.AI`). **Versión 2 en `main`** (candidata: falta probarla en proyectos reales, ver `PENDIENTES.md`). La v1 está en `old/v1/` (movida, no borrada) y en el tag `kit-v1`; no se ejecuta (README, «La v1»).

## Cómo funciona (v2)

- Dos agentes: `principal` (nivel medio con esfuerzo `low`: investiga, planifica y revisa; no edita el producto) y `constructor` (nivel bajo, esfuerzo `medium`: ejecuta toda edición del plan). Los niveles se traducen a modelos en `modelos.json`. El principal no rinde en nivel bajo (probado 2026-11-09): se queda en medio y se ahorra con el esfuerzo.
- El esfuerzo (qué tanto razona el modelo) se declara por agente en `modelos.json` y se traduce a `effort` (Claude Code), `thinking` (Pi) o `model_reasoning_effort` (Codex, donde `max` se escribe como `xhigh`).
- Traspaso: solo `cambios/<nombre>/plan.md`, con `## Aceptación` (README, «Qué es»).
- Ejecutor: el `ejecutor:` del plan; el constructor ejecuta siempre y el principal solo si Franco lo pide (`planificar-cambio`, regla 7).
- Tramos: el constructor recibe uno por vez (`tramo: <n>`) y el principal revisa cada uno antes de avanzar (`planificar-cambio`, regla 11). Un plan grande (más de 3 tramos o ≈8 KB) se reparte en `tramo-N.md` con un `plan.md` índice; al cerrar cada tramo, `/compact` o sesión nueva. En Codex, `codex-<agente>` fija `model_auto_compact_token_limit` con `compactar_en` de `modelos.json`. Usos reales: `docs/evaluaciones/tramos.md`.
- Ventana propia: `claude-<agente>`, `pi-<agente>` y `codex-<agente>` (README, «Ejecutar un plan en ventana propia»); `instalar.sh` los regenera al reinstalar.
- Cierre: tras tu aprobación, el principal archiva el plan en `cambios/hechos/`, te pide el commit y luego el PR (`agentes/principal.md`, paso 6). Antes de crear una rama nueva exige la rama base limpia y al día; si hay una rama sin mergear, se detiene y pregunta.
- Arnés de comparación con OpenSpec: `pruebas/comparar-openspec/` (fixtures, oráculos externos, runner con sandbox y reserva de gasto; documentado en `docs/evaluaciones/openspec/`). `./verify` corre solo sus autopruebas offline (paso 10), nunca `--run`. La medición real no se ha ejecutado. Evidencia de fallos reales del constructor: `docs/investigaciones/auditoria-andes-constructor.md`.
- Skills: `planificar-cambio`, `ejecutar-plan`, `preparar-proyecto`, `definir-proyecto`, `migrar-proyecto`.
- Workspaces: cada plan lleva `repos:` (carpetas que toca; `[.]` si es un repo) y la rama se crea solo en esas; detalle en `preparar-proyecto`, sección 4.
- Rama base: `base:` del plan (`planificar-cambio`, regla 10); los proyectos que trabajan sobre `develop` la declaran. Para este proyecto es `main`. Liberar a `main` lo hace Franco a mano.
- Comando `verify`: `./verify`; qué comprueba, en `README.md` («Verificación»). Modo remoto: `VERIFY_TARGET=<url> ./verify` corre solo el recorrido contra un despliegue, solo lectura salvo `VERIFY_PERMITIR_ESCRITURA=1` (`preparar-proyecto`, sección 3b).
- Migrar un proyecto de la v1: `bash instalar.sh --migrar <proyecto> [--simular]`. Mueve `definitions/`, `features/` y `registro/` a `old/v1/` (sin borrar), deja `principal`, quita el hook de v1, pone las 12 reglas deny, ignora `.claude/settings.local.json`, lista los repos hijos, avisa si `AGENTS.md` es de v1 y crea `cambios/`. Solo Claude Code y solo ese proyecto; no se combina con `--proyecto`, `--skills-proyecto`, `--copiar`, `--solo` ni `--agente`.
- Medidor de costos (solo lectura): `node scripts/uso.mjs` da tokens por día, proyecto y modelo de Claude Code, Codex y Pi, y la cuota semanal de Codex; con `--sesiones` da créditos estimados (`scripts/tarifas.json`) y sondeos por sesión. Informe en `docs/evaluaciones/costos.md`.

## Reglas

- Los agentes no hacen commit, push, PR, merge ni despliegue: lo hace Franco.
- No se leen `.env`, llaves ni credenciales (`.env.example` sí).
- Git permitido a los agentes: crear la rama del cambio con `git switch -c <prefijo>/<nombre>` (`feature/`, `fix/`, `chore/`, `docs/`).
- En Pi los subagentes no heredan skills: toda skill que use un subagente se declara en su frontmatter (`skills:`), y `inheritProjectContext: true` para el contexto del proyecto.
- En un proyecto instalado con `--proyecto`, Claude Code bloquea con reglas deny `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C … commit`, `git -c … commit`, `git … push`, `bash -c`, `sh -c`, `zsh -c` y leer `.env`. Codex (experimental) bloquea por prefijo lo mismo, salvo leer `.env` (ver «Límites de las reglas deny»). Si una de esas acciones se bloquea, es la regla: no la saltes; lo hace Franco. El agente tampoco puede usar `bash -c` (intencional).

## Límites de las reglas deny

Las reglas deny de Claude Code son una barrera, no una frontera: cubren `git -C/-c … commit` y `bash -c`/`sh -c`/`zsh -c`, pero no `sudo`, `env <cmd>` ni leer `.env` desde un script. Codex no bloquea `.env` y Pi no tiene equivalente. Detalle, con lo probado y lo no probado: `docs/reglas-deny.md`.

Lo de la v1 está en `old/v1/` (`legacy/`, `definitions/`, `features/`, `pruebas/`, `registro/`, los scripts de la v1, el README viejo y los reportes sueltos). Borrar `old/` viene después de usar la v2 en 2 o 3 proyectos reales; es decisión de Franco.

`old/v1/registro/` no se lee salvo pedido explícito de Franco. `pruebas/.temporales/` (3,9 GB, ignorado por git) no se borra ni se mueve sin pedido.
