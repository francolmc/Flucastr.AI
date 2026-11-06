---
estado: listo
rama: feature/kit-v2
---
# vocabulario-y-guias

## Objetivo
Una sola lista de estados del plan, dicha igual en skills y agentes; una orientación honesta de tamaño del plan; y `AGENTS.md` con lo que se retira de la v1 escrito, no sobreentendido. Solo texto: ningún comportamiento de código cambia.

## Alcance
`skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `agentes/principal.md`, `agentes/constructor.md`, `AGENTS.md`, este plan. Fuera: scripts, `verify`, `instalar.sh`, `legacy/`, y los planes ya cerrados en `cambios/hechos/` (se dejan como están).

## Decisiones ya tomadas
- Estados: `borrador → aprobado → en curso → listo` (o `parcial`). Quién: el principal pasa a `aprobado` con el «sí» de Franco; el constructor pasa a `en curso` y luego a `listo` o `parcial`; al cerrar, el principal mueve la carpeta a `cambios/hechos/` **sin cambiar `estado`** (la carpeta es la marca; no existe el estado `hecho`).
- Tras `parcial`: el principal corrige el plan y lo vuelve a `aprobado` antes de relanzar (el constructor solo arranca con `aprobado`). Escribirlo en ambas guías.
- Tamaño en `planificar-cambio` (regla 4 y su mención): los cambios simples caben en unos 5 KB; uno que investiga y toca varias piezas puede llegar a unos 8 KB; si pasa de eso, probablemente son dos cambios. Sin herramienta que lo mida.
- `AGENTS.md`: reemplazar la frase del «paso 3 del rediseño» por una lista explícita de lo que se retira: `legacy/`, `definitions/`, `features/`, `pruebas/`, los scripts de la v1 (todo `scripts/` salvo `resolver.mjs`) y el README viejo; y la condición: haber usado la v2 en 2 o 3 proyectos reales. Mantener la frase sobre `registro/`. No ampliar la lista con otros archivos.

## Escenarios
- CUANDO se lee cualquiera de los cuatro archivos de skills/agentes ENTONCES nombra los mismos estados y los mismos responsables, sin otro estado (`hecho`, `cerrado`).
- CUANDO se lee `planificar-cambio` ENTONCES no dice «5 KB» como límite duro y da las dos cifras.
- CUANDO se lee `AGENTS.md` ENTONCES no aparece «paso 3» y sí la lista y la condición.

## Verificación
`./verify` — `VERIFY OK` (los frontmatter de las skills siguen válidos). Además `grep -rn "paso 3" AGENTS.md skills agentes` sin resultados.

## Pasos
- [x] `planificar-cambio`: lista de estados con responsables junto a la plantilla (`estado: borrador`); cambiar la regla 4; en «Antes de pedir la aprobación» mantener «con su sí, `estado: aprobado`» y añadir qué hacer tras `parcial`.
- [x] `ejecutar-plan`: poner la lista y quién hace cada cambio; ajustar «Nunca otro estado: cerrar es de Franco» a «cerrar y mover a `hechos/` es del principal».
- [x] `agentes/principal.md` (pasos 3–6) y `agentes/constructor.md` (límites y retorno): mismas palabras y responsables.
- [x] `AGENTS.md`: reemplazar la frase del paso 3 (lista + condición).
- [x] Correr `./verify` y el `grep`; pegar ambas salidas en Evidencia.

## Evidencia
$ ./verify
== 1. modelos.json parsea y agentes coinciden ==
agentes: constructor, principal
== 2. sintaxis de instalar.sh y desinstalar.sh ==
ok instalar.sh
ok desinstalar.sh
== 3. resolver Claude Code y Pi por agente ==
ok constructor Claude Code claude-haiku-5-5
ok constructor Pi openai/gpt-6-luna
ok principal Claude Code claude-sonnet-5-5
ok principal Pi openai/gpt-6.1-sol
== 4. skills con SKILL.md, name y description ==
ok ejecutar-plan
ok planificar-cambio
ok preparar-proyecto
== 5. instalar.sh --simular no escribe lo que instala ==
ok autoprueba: reacciona a añadir y cambiar; ignora transcripts e history
-- 5b. instalar.sh --simular sobre el home real
ok instantánea sin cambios (585 líneas)
== 6. reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto) ==
ok escenario 1: sin archivo -> 12 reglas y 12 líneas deny
ok escenario 2: se conservan allow, otra clave y deny propios; solo se registran las agregadas
ok escenario 3: reinstalar deja el archivo y las líneas deny iguales
ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo
ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta
ok escenario 6: actualización de 7 a 12 reglas; se agregan y registran solo las 5 nuevas
ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 5; desinstalar deja las 7
VERIFY OK
exit 0

$ grep -rn "paso 3" AGENTS.md skills agentes
(sin salida)
exit 1

## Notas
- Verify corrido una sola vez; pasó a la primera (1 de 3 corridas).
- `planificar-cambio`: añadí la sección «Estados» (lista con responsables) entre la plantilla y las reglas; en la regla 4 las dos cifras de tamaño, sin límite duro.
- `ejecutar-plan`: en «Al terminar» puse primero los estados que usa el constructor (`en curso`, `listo`, `parcial`) y luego la prohibición; cerrar y mover a `hechos/` queda como del principal.
- `AGENTS.md`: la lista de retiro incluye exactamente lo indicado en el plan (`legacy/`, `definitions/`, `features/`, `pruebas/`, `scripts/` salvo `resolver.mjs`, README viejo) con la condición de 2 o 3 proyectos reales; no se amplió la lista. Se mantuvo la frase sobre `registro/`.
- `agentes/principal.md` y `agentes/constructor.md` usan las mismas palabras de estados y responsables.
