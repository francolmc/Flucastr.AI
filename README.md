# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code, Pi y Codex. Versión 2.

## Qué es

Dos agentes y dos puertas humanas:

- **`principal`** (nivel medio, esfuerzo `low`): entiende lo que Franco quiere, investiga, diagnostica, escribe el plan y verifica el resultado.
- **`constructor`** (nivel bajo, esfuerzo `medium`): aplica el plan aprobado, corre `verify` y deja la evidencia.
- **Puerta 1**: Franco aprueba `cambios/<nombre>/plan.md` antes de construir.
- **Puerta 2**: Franco revisa la evidencia antes de dar algo por hecho.
- Cada plan aprobado debe incluir `## Aceptación`, con escenarios trazables a resultados, comprobaciones y resultados esperados; puede usar revisión manual explicada cuando no haya oráculo automático.

El único traspaso entre agentes es `cambios/<nombre>/plan.md`. Los niveles se traducen a modelos en `modelos.json`.

Un cambio largo se parte en tramos (`### Tramo N`): el constructor hace un tramo por vez y el principal revisa cada uno antes de avanzar.

«Hecho» significa que `./verify` pasa desde cero.

## Skills

- `planificar-cambio`: escribe el plan de un cambio.
- `ejecutar-plan`: aplica un plan aprobado.
- `preparar-proyecto`: deja un proyecto listo (`AGENTS.md` y `verify`).

## Instalación

```bash
bash instalar.sh              # instala en Claude Code, Pi y Codex (en los que encuentra)
bash instalar.sh --simular    # muestra lo que haría, sin escribir nada
bash instalar.sh --proyecto <ruta>   # además fija el agente y las reglas deny en un proyecto
```

Opciones útiles: `--copiar` (copia las skills en vez de enlazarlas), `--solo claude|pi|codex`, `--skills-proyecto`.

Para ver todas las opciones, restricciones y ejemplos: `bash instalar.sh --help`.

Para desinstalar: `bash desinstalar.sh`.

## Verificación

```bash
./verify
```

Comprueba que `modelos.json` coincide con los agentes, que la sintaxis de instalar y desinstalar es válida, que los modelos se resuelven para Claude, Pi y Codex, que las skills están completas, que `instalar.sh --simular` no escribe nada, las reglas deny del proyecto, y pruebas deterministas aisladas del contrato (incluido el contador de pasos y una mutación de sensibilidad). Estas pruebas no miden la fiabilidad del modelo; el protocolo futuro está en `docs/evaluaciones/constructor.md`.

## Ejecutar un plan en ventana propia

Un plan pesado (muchos pasos, builds, Compose) puede correrse en una ventana propia del constructor, para ver el avance en vivo:

```bash
claude-constructor   # Claude Code (con el esfuerzo de modelos.json)
pi-constructor       # Pi (con el esfuerzo de modelos.json)
codex-constructor    # Codex (con el modelo y el esfuerzo de modelos.json)
```

Los lanzadores `claude-<agente>`, `pi-<agente>` y `codex-<agente>` los crea `instalar.sh`. Abrir el agente a mano (`claude --agent constructor`, `pi --agent constructor` o eligiéndolo dentro de Pi) no aplica el esfuerzo de `modelos.json`: ese valor solo vale cuando el principal lanza al constructor como subagente o cuando usas el lanzador. En Codex, elegir el rol a mano desde `~/.codex/agents` no está probado; usa `codex-<agente>`.

Primer mensaje: `Plan: <ruta>` y `Rama: <rama>` (por ejemplo `Plan: cambios/mi-cambio/plan.md`, `Rama: feature/mi-cambio`). Es el mismo plan, el mismo agente y el mismo retorno que al delegar desde el principal; solo cambia que se ve en vivo.

## Codex (experimental)

`instalar.sh` configura Codex cuando lo encuentra: si existe `CODEX_HOME` o `~/.codex`, o si está el comando `codex`. Está sin probar en una sesión real de Codex: `./verify` comprueba la generación, el esfuerzo, la instalación y las reglas con `codex execpolicy`, pero no un plan completo con el constructor como subagente.

- Agentes: `<CODEX_HOME o ~/.codex>/agents/<agente>.toml`, con `model` y `model_reasoning_effort` de `modelos.json` (`max` se escribe como `xhigh`). `sandbox_mode` y los permisos no se fijan ahí: heredan de la sesión.
- Skills: `~/.agents/skills` (enlace en modo repo, copia con `--copiar`).
- Lanzadores: `~/.local/bin/codex-<agente>`.
- Reglas deny: `bash instalar.sh --proyecto <ruta>` escribe `<proyecto>/.codex/rules/flucastr.rules` (`prefix_rule` con `forbidden`). Son experimentales, y Codex solo las carga en proyectos marcados como de confianza (trusted).
- Bloquean por prefijo: `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C`, `git -c`, `bash -c`, `sh -c` y `zsh -c`. Por eso `git -C` y `git -c` quedan bloqueados aunque no sean commit (es aceptado). No bloquean `bash -lc` ni `sh -lc`, porque Codex ejecuta así sus comandos. No hay regla para leer `.env`: es un límite documentado.
- Permitidos (`allow`, sin pedir permiso): `git switch -c` (el sandbox de Codex deja `.git` en solo lectura), `./verify`, `VERIFY_RAPIDO=1 ./verify`, `npm test`, `npm run`, `git fetch`, `git status`, `git diff`, `docker ps`, `docker info`, `docker version`, `docker compose` (build, up, run, ps, logs, stop, down), `pnpm` (install, lint, test, build, typecheck) y las formas `/bin/bash -lc ./verify` y `/bin/bash -lc "VERIFY_RAPIDO=1 ./verify"` (Codex ejecuta así los comandos). Sin ellos, el constructor espera aprobaciones que el principal no muestra (ver `docs/investigaciones/auditoria-memoryai-donfinancio.md`). `docker run` y el resto siguen pidiendo permiso. Reinstala con `bash instalar.sh --proyecto <ruta>` para recibirlos. Sin probar en sesión real: `VERIFY_RAPIDO=1 ./verify` lleva una variable de entorno y Codex puede no reconocerlo como prefijo.
- Desinstalar: `bash desinstalar.sh` quita lo que creó el kit y deja lo ajeno.

## Plazos en Pi (opcional)

El agente `constructor` declara `timeoutMs: 3600000` (60 min); Pi lo respeta (probado: con 60 s el subagente se corta; con 3 600 000 completa) y Claude Code lo ignora. Sin él, Pi corta a los 30 minutos. Para que Pi avise antes de cortar, `~/.pi/agent/extensions/subagent/config.json` admite `checkpointBeforeDeadlineMs` (solo corridas asíncronas de un agente); el kit no instala ni edita ese archivo. Para iterar rápido, `VERIFY_RAPIDO=1 ./verify` construye con caché; la corrida final va sin la variable.

## Revisor de kit run

El revisor de `kit run` se configura en `modelos.json` con `kit_run.revisor` (`nivel` y `esfuerzo`, resueltos como los agentes). El repo lo deja en `medio`/`low`, igual que el agente `principal`; si la clave falta, el revisor es `principal`. Para probar Luna como revisor, cambia su `nivel` a `bajo`. No hay agente nuevo: `kit run` anota `revisor=<modelo>:<esfuerzo>` en *Notas* del plan. Solo Codex lo usa hoy.

## Estructura

- `agentes/`: definiciones de `principal` y `constructor`.
- `skills/`: las tres skills.
- `scripts/resolver.mjs`: resuelve modelos y ajustes para las herramientas.
- `cambios/`: un directorio por cambio, con su `plan.md`.
- `modelos.json`: nivel de cada agente y su modelo en Claude, Pi y Codex.

## La v1

La versión 1 está en `old/v1/` y también en el tag `kit-v1`. No se ejecuta ni se mantiene. Se borra cuando la v2 se haya usado en 2 o 3 proyectos reales.
