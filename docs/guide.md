# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code, Pi y Codex. Versión 2.

## Qué es

Dos agentes y dos puertas humanas:

- **`planner`** (nivel medio, esfuerzo `medium`): entiende la intención de la persona usuaria, investiga, diagnostica, escribe el plan y verifica el resultado.
- **`builder`** (nivel bajo, esfuerzo `high`): aplica el plan aprobado, corre `verify` y deja la evidencia.
- **Puerta 1**: la persona usuaria aprueba `changes/<nombre>/plan.md` antes de construir.
- **Puerta 2**: la persona usuaria revisa la evidencia antes de dar algo por hecho.
- **Cambio pequeño** (`core/agents/planner.md`, seis condiciones: una intención, un repo, hasta 2 archivos y 30 líneas, sin funcionalidad nueva ni áreas sensibles, con comprobación previa): el planner lo edita en línea, sin plan ni builder. Todo lo demás va por plan.
- Cada plan aprobado debe incluir `## Aceptación`, con escenarios trazables a resultados, comprobaciones y resultados esperados; puede usar revisión manual explicada cuando no haya oráculo automático.

El único traspaso entre agentes es `changes/<nombre>/plan.md`. Los niveles se traducen a modelos en `models.json`.

Un cambio largo se parte en tramos pequeños (`### Segment N`). Por defecto, el builder ejecuta un tramo y espera la revisión del planner; un plan puede declarar `continuity: continuous` para que complete la historia aprobada de punta a punta. El plan fija condiciones de parada y mide antes la duración de cada comprobación limitante. Si la medida falta, el builder se detiene antes de esa comprobación. Al completar la historia, el planner revisa en contexto nuevo; si es de riesgo alto, el plan puede exigir revisión por tramo, que detecta defectos antes a costa de más pausas. Cada tramo deja un punto de control con archivos tocados, resumen del diff y comprobación; sugiere un commit al final de la historia, que el mantenedor hace manualmente.

«Hecho» significa que `./verify` pasa desde cero.

## Skills

- `plan-change`: escribe el plan de un cambio.
- `execute-plan`: aplica un plan aprobado.
- `prepare-project`: deja un proyecto listo (`AGENTS.md` y `verify`).
- `diagnose`: a pedido («diagnostica»), compara el proyecto con el contrato de verificación y responde en la conversación qué falta, cuánto cuesta hoy y una sola mejora. Solo lee; no escribe archivos ni bloquea.
- `define-project`: define un proyecto nuevo (hasta 5 preguntas cerradas, `AGENTS.md` y `docs/proyecto.md`).
- `migrate-project`: termina la migración de un proyecto de la v1 a la v2.
- `design-experience`: boceto de pantallas que la persona usuaria aprueba antes de planificar una interfaz.
- Prácticas por tecnología que el planner consulta al revisar: `docs/practicas-por-tecnologia.md`.

## Instalación

```bash
bash install.sh              # instala en Claude Code, Pi y Codex (en los que encuentra)
bash install.sh --dry-run    # muestra lo que haría, sin escribir nada
bash install.sh --project <ruta>   # además fija el agente y las reglas deny en un proyecto
```

Opciones útiles: `--copy` (copia las skills en vez de enlazarlas), `--only claude|pi|codex`, `--project-skills`.

Para ver todas las opciones, restricciones y ejemplos: `bash install.sh --help`.

Para desinstalar: `bash uninstall.sh`.

## Verificación

```bash
./verify
```

Comprueba que `models.json` coincide con los agentes, que la sintaxis de instalar y desinstalar es válida, que los modelos se resuelven para Claude, Pi y Codex, que las skills están completas, que `install.sh --dry-run` no escribe nada, las reglas deny del proyecto, y pruebas deterministas aisladas del contrato (incluido el contador de pasos y una mutación de sensibilidad). Estas pruebas no miden la fiabilidad del modelo; el protocolo futuro está en `docs/evaluaciones/constructor.md`.

- Niveles de verificación (`plan-change`, regla 13): **Nivel 1** `Comprobación rápida` (línea de `AGENTS.md`; host, sin Docker, segundos), **Nivel 2** `VERIFY_RAPIDO=1 ./verify` (Docker con caché), **Nivel 3** `./verify` sin caché (aceptación final).
- Contrato de verificación por capacidades (qué declara cada proyecto en su `AGENTS.md`): `core/contracts/verification.md`.
- Experiencia antes del plan (`design-experience`): si el cambio toca pantallas, el planner deja un boceto ASCII (hasta 40 columnas) en `changes/<nombre>/pantallas.md` y lo pega en la terminal para tu aprobación en la puerta 1.
- Observador de Docker (solo lectura, datos en `~/.flucastr-ai/observador/`, nada sale del equipo): `node scripts/observe.mjs start` lo arranca en segundo plano, `status` y `stop` lo controlan, y `report` (`[--since AAAA-MM-DD]`) muestra medianas y caché de builds, pico de memoria por contenedor, OOM y unhealthy, y los proyectos que se solaparon.

## Ejecutar un plan en ventana propia

Un plan pesado (muchos pasos, builds, Compose) puede correrse en una ventana propia del builder, para ver el avance en vivo:

```bash
claude-builder   # Claude Code (con el esfuerzo de models.json)
pi-builder       # Pi (con el esfuerzo de models.json)
codex-builder    # Codex (con el modelo y el esfuerzo de models.json)
```

Los lanzadores `claude-<agente>`, `pi-<agente>` y `codex-<agente>` los crea `install.sh`. Abrir el agente a mano (`claude --agent builder`, `pi --agent builder` o eligiéndolo dentro de Pi) no aplica el esfuerzo de `models.json`: ese valor solo vale cuando el planner lanza al builder como subagente o cuando usas el lanzador. En Codex, elegir el rol a mano desde `~/.codex/agents` no está probado; usa `codex-<agente>`.

Primer mensaje: `Plan: <ruta>` y `Rama: <rama>` (por ejemplo `Plan: changes/mi-cambio/plan.md`, `Rama: feature/mi-cambio`). Es el mismo plan, el mismo agente y el mismo retorno que al delegar desde el planner; solo cambia que se ve en vivo.

## Codex (experimental)

`install.sh` configura Codex cuando lo encuentra: si existe `CODEX_HOME` o `~/.codex`, o si está el comando `codex`. Está sin probar en una sesión real de Codex: `./verify` comprueba la generación, el esfuerzo, la instalación y las reglas con `codex execpolicy`, pero no un plan completo con el builder como subagente.

- Agentes: `<CODEX_HOME o ~/.codex>/agents/<agente>.toml`, con `model` y `model_reasoning_effort` de `models.json` (`max` se escribe como `xhigh`). `sandbox_mode` y los permisos no se fijan ahí: heredan de la sesión.
- Skills: `~/.agents/skills` (enlace en modo repo, copia con `--copy`).
- Lanzadores: `~/.local/bin/codex-<agente>`.
- Reglas deny: `bash install.sh --project <ruta>` escribe `<proyecto>/.codex/rules/flucastr.rules` (`prefix_rule` con `forbidden`). Son experimentales, y Codex solo las carga en proyectos marcados como de confianza (trusted).
- `bash install.sh` también actualiza las reglas de Codex de los proyectos registrados, sin ir uno por uno. Un proyecto que ya no existe solo se avisa.
- Bloquean por prefijo: `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C`, `git -c`, `bash -c`, `sh -c` y `zsh -c`. Por eso `git -C` y `git -c` quedan bloqueados aunque no sean commit; por eso el kit ejecuta Git con el repo como directorio de trabajo del comando (`workdir`), sin `-C`, y el mensaje de rechazo lo indica. No bloquean `bash -lc` ni `sh -lc`, porque Codex ejecuta así sus comandos. No hay regla para leer `.env`: es un límite documentado.
- Permitidos (`allow`, sin pedir permiso): `git switch -c` (el sandbox de Codex deja `.git` en solo lectura), `./verify`, `VERIFY_RAPIDO=1 ./verify`, `npm test`, `npm run`, `git fetch`, `git status`, `git diff`, `docker ps`, `docker info`, `docker version`, `docker compose` (build, up, run, ps, logs, stop, down), `pnpm` (install, lint, test, build, typecheck) y las formas `/bin/bash -lc ./verify` y `/bin/bash -lc "VERIFY_RAPIDO=1 ./verify"` (Codex ejecuta así los comandos). Sin ellos, el builder espera aprobaciones que el planner no muestra (ver `docs/investigaciones/auditoria-memoria-finanzas.md`). `docker run` y el resto siguen pidiendo permiso. Reinstala con `bash install.sh --project <ruta>` para recibirlos. Sin probar en sesión real: `VERIFY_RAPIDO=1 ./verify` lleva una variable de entorno y Codex puede no reconocerlo como prefijo.
- Desinstalar: `bash uninstall.sh` quita lo que creó el kit y deja lo ajeno.

## Plazos en Pi (opcional)

El agente `builder` declara `timeoutMs: 3600000` (60 min); Pi lo respeta (probado: con 60 s el subagente se corta; con 3 600 000 completa) y Claude Code lo ignora. Sin él, Pi corta a los 30 minutos. Para que Pi avise antes de cortar, `~/.pi/agent/extensions/subagent/config.json` admite `checkpointBeforeDeadlineMs` (solo corridas asíncronas de un agente); el kit no instala ni edita ese archivo. Para iterar rápido, `VERIFY_RAPIDO=1 ./verify` construye con caché; la corrida final va sin la variable.

## Revisor de kit run

El revisor de `kit run` se configura en `models.json` con `kit_run.revisor` (`nivel` y `esfuerzo`, resueltos como los agentes). El repo lo deja en `medio`/`low`, igual que el agente `planner`; si la clave falta, el revisor es `planner`. Para probar Luna como revisor, cambia su `nivel` a `bajo`. No hay agente nuevo: `kit run` anota `revisor=<modelo>:<esfuerzo>` en *Notas* del plan. Solo Codex lo usa hoy.

## Estructura

- `core/agents/`: definiciones de `planner` y `builder`.
- `core/skills/`: las siete skills.
- `scripts/resolver.mjs`: resuelve modelos y ajustes para las herramientas.
- `changes/`: un directorio por cambio, con su `plan.md`.
- `models.json`: nivel de cada agente y su modelo en Claude, Pi y Codex.

## La v1

La versión 1 está en `old/v1/` y también en el tag `kit-v1`. No se ejecuta ni se mantiene. Se borra cuando la v2 se haya usado en 2 o 3 proyectos reales.
