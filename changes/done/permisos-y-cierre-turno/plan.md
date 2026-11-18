---
estado: listo
rama: fix/permisos-y-cierre-turno
base: main
repos: [.]
ejecutor: constructor
tramo: 3
continuidad: continua
tipo: codigo
---
# Menos permisos de lectura y menos cierres de turno a medias

## Objetivo
Que Claude Code no pida aprobación para leer, buscar ni listar (solo vigila Bash), y que el constructor (Codex, Pi, Claude) no cierre el turno con informes de avance: solo con `COMPLETADO` o `PAUSA`.

## Exploración
- Hook `scripts/permisos-hook.mjs`: instala dos matchers (`Bash` y `Read|Grep|Glob`); `decidir` responde «ask» a todo Grep/Glob y a todo Bash no declarado. Eso causaba los avisos constantes. Visto en el código (líneas 157, 221-224, 254-270).
- Sesiones Codex del 2026-11-17 (idioma-adaptable): el tramo 13 se cerró unas 25 veces con «Avancé…» porque no tenía criterio de terminado medible; a las 18:23 Codex se detuvo tras el tramo 3 porque el plan no tenía `continuidad: continua`. El contrato (`core/agents/constructor.md`, «Return») no prohíbe cerrar con informes.
- Sesiones Pi de este repo: no analizadas (solo existen bajo rutas antiguas). Se asume el mismo contrato.
- `agentes/constructor.md` es copia de `core/agents/constructor.md` (`tools/core-compatibility.json`); deben quedar idénticos.

## Evaluación
Opción recomendada: cambio mínimo en el hook (quitar el matcher de lectura; `.env` sigue protegido por reglas deny y sandbox) y reglas de texto en el contrato más una advertencia en el revisor de planes. Alternativa descartada: hooks de cierre (`SubagentStop`, `agent_before_settle`), más costosos y no verificados en el constructor.

## Supuestos
- Dejar de vigilar Read/Grep/Glob es aceptable porque deny y sandbox cubren `.env`; si la persona usuaria quiere un vigilante ligero solo de secretos, se agrega un tramo.
- Instalaciones existentes con los dos matchers: `estaInstalado` pasa a «ausente» y `instalar` las repara (retira los viejos y deja solo `Bash`).

## Decisiones ya tomadas
- La persona usuaria eligió «Quitar el hook de lectura» e «Investigar sesiones reales primero».
- Ejecutor: constructor, porque texto y comprobaciones están definidos, los archivos son accesibles y no hay credenciales ni producción.

## Decisiones
- Tramo 2: la regla de cierre se redactó en inglés como «progress report», porque `core/agents/constructor.md` está en inglés; la comprobación `grep -n "informe"` de la plantilla no aplica. Resuelto dentro del Alcance.

## Validación
La persona usuaria aprobó el plan ("dale").

## Alcance
Puede cambiar: `scripts/permisos-hook.mjs`, `pruebas/permisos-contrato/hook.test.mjs`, `docs/reglas-deny.md`, `AGENTS.md`, `core/agents/constructor.md`, `agentes/constructor.md`, `core/skills/execute-plan/SKILL.md`, `core/skills/plan-change/SKILL.md`, `scripts/revisar-plan.mjs` y su prueba si existe, y copias de compatibilidad listadas en `tools/core-compatibility.json`.
Fuera: instaladores, `modelos.json`, otros agentes.

## Verificación
`./verify` — exit 0 y `VERIFY OK`.

## Condiciones de parada
Continuar mientras la comprobación pase, el paso siguiente esté dentro del Alcance y no haga falta una decisión. Parar con nota si la misma causa falla dos veces, hay que salir del Alcance o falta una decisión.

## Pasos

1. [El hook solo vigila Bash](tramo-1.md): quitar el matcher de lectura y actualizar pruebas y documentos.
2. [El constructor no cierra con informes de avance](tramo-2.md): regla de cierre en el contrato y en `execute-plan`.
3. [Los planes piden criterio de terminado y continuidad](tramo-3.md): aviso del revisor y regla de la skill.

## Evidencia
$ ./verify  (tail; log completo en el scratchpad)
ok 8t: principal con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
exit 0

## Notas
- Punto de control del plan (tramos 1 a 3, continuidad continua, una sola historia):
  - Tramo 1: `scripts/permisos-hook.mjs` solo vigila Bash; `pruebas/permisos-contrato/hook.test.mjs`, `docs/reglas-deny.md` y `AGENTS.md` actualizados.
  - Tramo 2: regla de cierre con solo `COMPLETADO` o `PAUSA` en `core/agents/constructor.md` y `agentes/constructor.md` (idénticos) y en `core/skills/execute-plan/SKILL.md` y `skills/ejecutar-plan/SKILL.md` (idénticos). Contrato `node pruebas/contrato-constructor.mjs` exit 0.
  - Tramo 3: `scripts/revisar-plan.mjs` avisa una vez con 2 o más tramos sin `continuidad: continua` (también cuenta enlaces `tramo-N.md` en ## Pasos); `pruebas/revisar-plan/revisar-plan.test.mjs` con 15 pruebas en verde; regla 11 de `core/skills/plan-change/SKILL.md` y copia `skills/planificar-cambio/SKILL.md` idénticas.
  - Diff: solo texto nuevo y el aviso heurístico del revisor; no cambian formatos de COMPLETADO ni PAUSA, ni instaladores, `modelos.json` u otros agentes.
  - Comprobación final: `./verify` exit 0, `VERIFY OK` (una corrida final; las pruebas de tramo no cuentan contra el límite).
- Hallazgos para la revisión del principal:
  - Los tramos 2 y 3 tienen encabezados «Historia» distintos. Se tratan como una historia porque el principal ordenó continuidad y el Objetivo del plan los cubre.
  - El aviso del revisor incluye el índice de `plan.md` con enlaces a `tramo-N.md`; es una heurística y no bloquea.
  - La mutación explícita del caso de reparación del tramo 1 no se ejecutó como prueba aparte; queda implícita en la aserción de `pruebas/permisos-contrato/hook.test.mjs`.
