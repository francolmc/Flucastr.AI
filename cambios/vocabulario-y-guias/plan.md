---
estado: aprobado
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
- [ ] `planificar-cambio`: lista de estados con responsables junto a la plantilla (`estado: borrador`); cambiar la regla 4; en «Antes de pedir la aprobación» mantener «con su sí, `estado: aprobado`» y añadir qué hacer tras `parcial`.
- [ ] `ejecutar-plan`: poner la lista y quién hace cada cambio; ajustar «Nunca otro estado: cerrar es de Franco» a «cerrar y mover a `hechos/` es del principal».
- [ ] `agentes/principal.md` (pasos 3–6) y `agentes/constructor.md` (límites y retorno): mismas palabras y responsables.
- [ ] `AGENTS.md`: reemplazar la frase del paso 3 (lista + condición).
- [ ] Correr `./verify` y el `grep`; pegar ambas salidas en Evidencia.

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
