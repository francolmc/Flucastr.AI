# Tramo 3

## Pasos

### Tramo 3 — Historia: los planes piden criterio de terminado y continuidad
Como persona usuaria quiero planes con tramos cerrables y continuos para que el constructor no se detenga entre ellos.
Dependencias: No aplica.
Contratos a conservar: reglas actuales del revisor; planes antiguos siguen siendo válidos.
Rutas susceptibles de cambio: la prueba del revisor, si existe, se amplía.
Ejemplo concreto del resultado esperado: un plan con 3 tramos y sin `continuidad: continua` recibe un aviso; un tramo cuya verificación no es un comando recibe un aviso.
Alcance: dos archivos de producto.
Archivos: core/skills/plan-change/SKILL.md, scripts/revisar-plan.mjs
CUANDO un plan tiene varios tramos de una misma historia sin `continuidad: continua` ENTONCES el revisor avisa (A3).
Aceptación:
- A3: `revisar-plan.mjs` avisa en un plan de 2 o más tramos sin `continuidad: continua`, y no avisa en uno con ella; la skill dice que los planes con varios tramos la declaren por defecto y que cada tramo tenga un criterio de terminado medible; comprobar con una fixture válida y otra inválida; esperar aviso solo en la inválida.
TODO:
- [x] En `scripts/revisar-plan.mjs` añadir el aviso de continuidad ausente en planes con 2 o más tramos (A3). Comprobación: `node scripts/revisar-plan.mjs cambios/permisos-y-cierre-turno/plan.md`; esperar sin ese aviso.
- [x] Probar `scripts/revisar-plan.mjs` con una copia temporal del plan sin la línea `continuidad` (A3). Comprobación: mismo comando sobre la copia; esperar el aviso nuevo.
- [x] En `core/skills/plan-change/SKILL.md` añadir a la regla 11 la recomendación de `continuidad: continua` por defecto y el criterio de terminado medible por tramo (A3). Comprobación: `grep -n "continuidad" core/skills/plan-change/SKILL.md`; esperar la regla nueva.
- [x] Sincronizar la copia de compatibilidad de la skill si `tools/core-compatibility.json` la lista (A3). Comprobación: `./verify`; esperar `VERIFY OK`.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A3.
Handoff: es una heurística; el aviso no bloquea.

## Evidencia

$ node scripts/revisar-plan.mjs cambios/permisos-y-cierre-turno/plan.md
(sin salida)
exit 0

$ grep -v '^continuidad:' cambios/permisos-y-cierre-turno/plan.md > "<scratchpad>/plan-sin-continuidad.md"; node scripts/revisar-plan.mjs "<scratchpad>/plan-sin-continuidad.md"
<scratchpad>/plan-sin-continuidad.md:47: el plan tiene 3 tramos sin «continuidad: continua»; si son de una misma historia, declárala (heurística)
exit 1

$ node --test pruebas/revisar-plan/revisar-plan.test.mjs
ℹ tests 15
ℹ pass 15
ℹ fail 0
exit 0

$ grep -n "continuidad" core/skills/plan-change/SKILL.md | cut -c1-200
30:continuidad: continua   # opcional: habilita al constructor a avanzar por los tramos aprobados
87:To enable continuity, set `continuidad: continua` in the frontmatter; if omitted, the plan keeps one-tramo-at-a-time execution. In continuous mode, a story may include several small, ordered tramos
126:11. **Stories and tramos.** A feature uses one branch and one `plan.md`. Each self-contained story may use one tramo or group several consecutive small tramos under the same user outcome. Each tramo has a scope of up to three product files, its own A# criteria, atomic TODOs naming files and checks, verification, and evidence; the story includes the user and value, dependencies, CUANDO/ENTONCES, and handoff. Each story must be buildable and verifiable on its own against the base; if it depends on another, explain which result it needs and why, and order it afterward. Keep stories small, preferably bounded by file, without splitting a flow into isolated functions that are not useful outcomes. If the environment has not been verified, the first tramo covers only the environment (install, start, reproduce), with no code changes. Without `continuidad: continua`, the principal launches one tramo at a time; with it, the constructor continues through approved tramos of the same story in order, subject to `## Condiciones de parada`. A plan with two or more tramos of the same story should declare `continuidad: continua` by default; `revisar-plan` warns when two or more tramos lack it. Each tramo's completion criterion is measurable: its `Verificación del tramo:` names a command and its expected result (exit code or output), not a general description. Adjust later tramos after seeing the previous tramo's actual state. Older plans with traditional steps or tramos remain executable. To limit constructor context when needed, put some stories in `tramo-N.md` files linked from `plan.md`, each with its story, steps, `Verificación del tramo:`, and evidence; the index retains frontmatter, objective, exploration if applicable, assumptions, decisions, validation, scope, verification, and the ordered story list with status. Neither size nor story count alone requires externalizing stories. The constructor reads `plan.md` and only the active `tramo-<n>.md`, not other tramo documents. At the end of each story, use `/compact` or a new session so the principal reviews in a fresh context. A plan may require review per tramo, including for high-risk work; if declared, it blocks progress until the verdict. A final review preserves continuity but may find accumulated defects; reviewing each tramo finds them sooner, with more pauses and reviews. In either case, each tramo checkpoint records files, a diff summary, and verification, and suggests a story commit for the user to make, without committing. Record a minor decision resolved during the change in `## Decisiones` as `Resuelto: <date> <decision>`. Each `Verificación del tramo:` declares its level (rule 13); Level 3 is only for the final acceptance run in the last story.

$ diff core/skills/plan-change/SKILL.md skills/planificar-cambio/SKILL.md
(sin salida)
diff exit 0

$ ./verify  (tail; log completo en el scratchpad)
ok 8t: principal con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
exit 0

## Notas
- Paso 3 (regla 11): la regla queda en inglés, como el resto de la skill. La línea 126 de `core/skills/plan-change/SKILL.md` ya tiene la recomendación de continuidad y el criterio medible.
- Punto de control del tramo 3: archivos tocados `scripts/revisar-plan.mjs` (bloque de continuidad sobre tramos `### Tramo N` y enlaces `tramo-N.md`, y línea en HELP), `pruebas/revisar-plan/revisar-plan.test.mjs` (fixture con `continuidad: continua` y test nuevo de aviso), `core/skills/plan-change/SKILL.md` y `skills/planificar-cambio/SKILL.md` (regla 11, copia idéntica). Diff: solo aviso heurístico y texto nuevo; el aviso no bloquea. Comprobación: `./verify` exit 0, `VERIFY OK`.
- Desviación: el revisor cuenta también enlaces `tramo-\d+\.md` dentro de ## Pasos, porque el índice `plan.md` no tiene encabezados `### Tramo`; sin eso la copia temporal no producía aviso.
