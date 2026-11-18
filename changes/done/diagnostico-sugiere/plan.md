---
estado: listo
rama: feature/diagnostico-sugiere
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Diagnóstico que sugiere: `docs/mejoras.md` sin bloquear

> Los nombres personales y de proyectos se anonimizaron; se conservan fechas y cifras.

## Objetivo
Que `preparar-proyecto` compare un proyecto con `nucleo/contrato/verificacion.md` y escriba en ese proyecto `docs/mejoras.md`: qué capacidad falta, cuánto cuesta hoy (con evidencia) y la siguiente mejora (una, con su porqué). Nada de eso bloquea planificar ni construir. El principal menciona como máximo una mejora relacionada al planificar y pregunta a la persona usuaria si entra o queda anotada. **No se toca el contrato.**

## Supuestos
- **Tipo `docs`:** todo son `*.md` del kit (skills, agente, README). Si la persona usuaria lo prefiere como código, solo cambia la Verificación.
- **Evidencia = dato observable**, nunca inventado: duración medida de una corrida, `git log` (arreglos que volvieron, reversiones), planes en `cambios/` con `PAUSA` o `DEVUELTO`, archivos de código sin test. Sin dato: la fila dice `sin evidencia` y no estima. Si la persona usuaria quiere que el diagnóstico corra `verify` para medir, es otro cambio (hoy `verify` solo corre cuando se pide).
- **«Tests de aceptación alterados»** se interpreta así: el constructor no edita, borra ni debilita un test de aceptación existente fuera del *Alcance* del plan para que pase; el principal lo ve en el `git diff` y devuelve el plan. Si querías otro significado, se corrige en el paso 3.
- **Cuándo corre:** al preparar un proyecto (`preparar-proyecto`) y cuando la persona usuaria pide «diagnostica». No se repite solo en cada plan; el principal solo lee `docs/mejoras.md` si existe.
- **Una mejora por plan, máximo:** la «relacionada» es la de la capacidad que el cambio pedido toca. Sin relación, no menciona ninguna.
- Los planes `proceso-rapido` y `verificacion-general` (borrador) tocan `preparar-proyecto`: aprobar este primero o rebasar los otros.

## Alcance
- `skills/preparar-proyecto/SKILL.md` (sección nueva 7 y una línea en la intro).
- `agentes/principal.md` (reglas duras: escribir `docs/mejoras.md`; sección «Qué bloquea y qué no»; paso de planificar).
- `skills/planificar-cambio/SKILL.md` (una regla nueva, 15).
- `README.md` (una viñeta).
- `pruebas/diagnostico-sugiere/juguete/` (proyecto de juguete sin tests, para el escenario).
- `.gitignore` (solo añadir la excepción `!pruebas/diagnostico-sugiere/` tras las otras `!pruebas/...`, para que el juguete entre en git).
- No: `nucleo/`, `instalar.sh`, `verify`, `ejecutar-plan`.

## Decisiones ya tomadas
- Formato de `docs/mejoras.md` (máx. ≈2 KB, en español): una tabla con una fila por capacidad del contrato (`Rápida`, `Servicio`, `Aceptación`, `Evidencia`) y columnas `Estado` (`cubierta` / `falta`), `Costo hoy` y `Evidencia`; luego `## Siguiente mejora` con **una** sola (qué, porqué, tamaño estimado) y `## Anotadas` para las que la persona usuaria dejó pendientes.
- Una capacidad está «cubierta» solo si su línea existe en `AGENTS.md` y el comando corre; si no, «falta» (se cubre con `./verify`, que sigue valiendo).
- Bloquean, y nada más: commit, secretos, tests de aceptación alterados y `verify` en rojo.

## Escenarios
- Proyecto de juguete sin tests: el diagnóstico lista `Rápida`, `Servicio` y `Aceptación` como `falta`, propone una sola mejora y el principal planifica igual el cambio pedido.
- Proyecto con las cuatro líneas: `docs/mejoras.md` dice «sin faltas» y no propone nada.
- Cambio que toca una capacidad faltante: el principal menciona esa mejora y pregunta «¿entra en este plan o queda anotada?».

## Aceptación
| # | Criterio | Comprobación |
|---|----------|--------------|
| A1 | `preparar-proyecto` tiene la sección del diagnóstico, que apunta a `nucleo/contrato/verificacion.md` y define el formato y las reglas de evidencia | `grep -n "docs/mejoras.md" skills/preparar-proyecto/SKILL.md` y `grep -c "verificacion.md" skills/preparar-proyecto/SKILL.md` (≥ 1 cada una) |
| A2 | El formato exige: capacidad que falta, costo con evidencia, una sola siguiente mejora con porqué | Leer la sección: las tres cosas, y «sin evidencia» cuando no hay dato |
| A3 | `principal.md` lista que solo bloquean commit, secretos, tests de aceptación alterados y `verify` en rojo, y que las capacidades faltantes no bloquean | `grep -n "no bloquea" agentes/principal.md` y lectura de la sección |
| A4 | `principal.md` permite escribir `docs/mejoras.md` solo desde `preparar-proyecto` o cuando la persona usuaria diagnostica | Lectura de la regla de ediciones |
| A5 | `planificar-cambio` regla 15: como máximo una mejora relacionada, con pregunta cerrada «entra / queda anotada» | `grep -n "^15\." skills/planificar-cambio/SKILL.md` |
| A6 | El juguete existe sin ningún test | `find pruebas/diagnostico-sugiere/juguete -name "*test*" -o -name "*spec*"` sin salida |
| A7 | El contrato no cambió | `git diff --stat -- nucleo/` vacío |
| A8 | `./verify` termina en `VERIFY OK` | `./verify` |
| A9 | Escenario de la persona usuaria: en una sesión nueva sobre el juguete, pedir «prepara el proyecto» deja `docs/mejoras.md` con las faltas y pedir un cambio pequeño lo planifica igual | La corre la persona usuaria al revisar (el constructor no puede simularla) |

## Verificación
`git diff --check` y `./verify` (tipo `docs`; sin Docker). Un solo comando final: `./verify`.

## Pasos
1. En `skills/preparar-proyecto/SKILL.md` agrega la **sección 7 «Diagnóstico de mejoras»**: compara el `AGENTS.md` y el código del proyecto con `nucleo/contrato/verificacion.md`; escribe `docs/mejoras.md` con el formato de *Decisiones ya tomadas*; reglas de evidencia (dato observable o `sin evidencia`); «no bloquea nada». Agrega a la intro una línea que lo mencione. (comprobación: A1, A2)
2. En `agentes/principal.md`: (a) en la regla de ediciones añade `docs/mejoras.md` junto a `AGENTS.md` y `docs/proyecto.md`, cuando `preparar-proyecto` lo indica o la persona usuaria pide diagnosticar; (b) sección corta **«Qué bloquea y qué no»**: solo commit, secretos, tests de aceptación alterados y `verify` en rojo; una capacidad faltante nunca impide planificar ni construir; (c) en el paso 1, si existe `docs/mejoras.md`, léelo una vez. (comprobación: A3, A4)
3. En `skills/planificar-cambio/SKILL.md` añade la **regla 15**: al planificar, si `docs/mejoras.md` tiene una mejora relacionada con lo que toca el cambio, menciónala (como máximo una) y pregunta con opciones cerradas «entra en este plan / queda anotada»; si queda anotada, pasa a `## Anotadas`; si entra, es un paso más del plan con su criterio de aceptación. Sin mejora relacionada, no menciones ninguna. (comprobación: A5)
4. Crea `pruebas/diagnostico-sugiere/juguete/` con un `AGENTS.md` mínimo de 8 líneas (solo `Instalar` y `Correr en local`, sin `Comprobación rápida`/`Servicio`/`Aceptación`/`Evidencia`) y un programa trivial (p. ej. `suma.js` o `suma.py` con una función). Sin tests, sin `package.json` con scripts de test. (comprobación: A6)
5. En `README.md` añade una viñeta que apunte a la sección 7 de `preparar-proyecto`. (comprobación: `git diff --check`)
6. Corre `git diff --stat -- nucleo/` (debe estar vacío) y `./verify` (A7, A8). Deja la cola en *Evidencia*.

## Evidencia
$ git diff --check
(sin salida)
exit 0

$ git diff --stat -- nucleo/
(sin salida: el contrato no cambió; A7)
exit 0

$ find pruebas/diagnostico-sugiere/juguete -name "*test*" -o -name "*spec*"
(sin salida; A6)
exit 0

$ ./verify
ok A3d DEVUELTO siempre: cupo de 2 agotado, parcial sin más corridas
ok A5a revisor que devuelve texto no JSON: parcial sin aprobar
ok A5b APROBADO con defectos: viola el esquema, parcial
ok A5c veredicto con clave extra: viola el esquema, parcial
ok C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente
ok C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
ok uso: plan en curso se rechaza sin cambiarlo
ok V2 revisor con nivel bajo: Luna low; el constructor no cambia
ok V3 sin kit_run el revisor usa el modelo y esfuerzo del principal
ok V4 nivel inválido en kit_run.revisor: exit 2 y plan intacto
ok V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
== 8r. observador de Docker: informe sobre el fixture, ciclo con docker falso y copia sin oom ==
ok 8r A1-A3: el informe del fixture coincide con LEEME.txt (medianas, máximos, caché, OOM, solape y pico)
ok 8r negativa: la copia sin oom no muestra OOM
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
== 8t. cambio pequeño: definición, riesgo y prácticas por tecnología ==
ok 8t: principal con la definición de cambio pequeño, riesgo alto y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «cambio pequeño» falla
VERIFY OK
exit 0

## Notas
- Estado final `listo`: `./verify` pasó en la primera corrida (una sola corrida, tipo `docs`). `git diff --name-only main` solo lista `*.md`.
- Los pasos del plan son numerados (`1.` a `6.`), no casillas `- [ ]`: no las marqué ni cambié su formato. El contador `pendientes-plan` da 0 por eso; los seis pasos están hechos según las comprobaciones de la sección Aceptación (A1 a A7 pasaron; A8 es `./verify`; A9 la corre la persona usuaria).
- **Juguete ignorado por git:** `.gitignore` tiene `pruebas/*` y solo exceptúa `uso`, `kit-run`, `revisor-luna` y `contrato-constructor.mjs`. `pruebas/diagnostico-sugiere/juguete/` existe en disco pero no entra en `git status` ni en el commit. Hace falta una excepción `!pruebas/diagnostico-sugiere/` en `.gitignore`, que está fuera del Alcance; no la añadí. la persona usuaria decide si la agrega antes del commit.
- Decisión menor en `planificar-cambio` regla 15: si la mejora «queda anotada», el principal la anota en `## Anotadas` solo cuando la persona usuaria lo pide. Así no se contradice A4 (escribir `docs/mejoras.md` solo desde `preparar-proyecto` o al diagnosticar).
- «Tests de aceptación alterados» se redactó como en *Supuestos* (edición, borrado o debilitamiento fuera del Alcance para que pase) en `agentes/principal.md`, sección «Qué bloquea y qué no».
- Fallos relacionados corregidos: ninguno; `verify` pasó sin cambios adicionales.

- Principal (revisión): defecto del plan, no del constructor. El juguete queda ignorado por `pruebas/*`; se amplía el Alcance con la excepción en `.gitignore`. Nuevo criterio A10: `git check-ignore pruebas/diagnostico-sugiere/juguete/suma.js` sin salida y `git status --short` lista el juguete. Relanzar solo para eso; no repetir `./verify` (tipo docs, solo `.gitignore`).

- Constructor (revisión, A10): añadida `!pruebas/diagnostico-sugiere/` en `.gitignore`, tras `!pruebas/contrato-constructor.mjs`. Comprobado: `git check-ignore pruebas/diagnostico-sugiere/juguete/suma.js` sin salida (exit 1, no ignorado); `git status --short -uall pruebas/diagnostico-sugiere/` lista `juguete/AGENTS.md` y `juguete/suma.js` como `??`; `git diff --check` exit 0. No se repitió `./verify`, como pidió el principal.
- Constructor: el plan pasó a `estado: listo`. El cierre (archivo en `hechos/`, commit y PR) es del principal y de la persona usuaria.
