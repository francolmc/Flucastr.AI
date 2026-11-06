---
estado: listo
rama: feature/endurecer-constructor
repos: [.]
---
# La migración no arrastra reglas de flujo de la v1 (Pedido 9)

## Objetivo
`migrar-proyecto` condensa el `AGENTS.md` de un proyecto con v1 conservando solo hechos del proyecto y las reglas duras de la v2, descarta las reglas de flujo de la v1 y muestra a Franco la lista «Reglas de v1 que descarté» para que la confirme.

## Supuestos
- Se descarta, sin copiar ni reescribir: `STATUS.md` y `BACKLOG.md`, nombres de rama por feature (`Fxx`), confirmaciones de rama, coordinador, tareas, puertas, «yolo» y reglas parecidas del flujo de la v1. Si Franco ve que quedó una regla útil en la lista, la devuelve a mano.
- Se conserva: qué es el proyecto, estructura, stack, comandos, restricciones propias del dominio y las reglas duras de la v2 (sin commit/push/PR/merge ni despliegue, no leer `.env`).
- Aplica a las dos rutas de la skill: AGENTS.md nuevo y corregir enlaces del viejo (opción 2). En la opción 2 la skill no reescribe reglas: solo corrige los enlaces y lista las reglas de flujo que ve, para que Franco decida; es la única excepción a «descartar».
- La lista va en la respuesta final de la skill y también en la sección «Descartado» ya existente solo si se escribe `docs/proyecto.md`; no se agrega un archivo nuevo.
- La prueba sobre el proyecto sintético la corre el principal con `claude -p`, fuera del repo; el `verify` del kit solo comprueba el texto de la skill (no llama a un modelo).
- Rama desde `main`; este plan no depende de los de `constructor-contrato`, `ejecutor-y-pasos` ni `plazos-y-tiempo`, pero sí toca `verify`: si se fusiona después de ellos, el bloque nuevo (`9a`) va al final.

## Alcance
Cambiar: `skills/migrar-proyecto/SKILL.md` (secciones 3 y 7), `verify` (bloque `9a`).
Fuera de alcance: `instalar.sh`, `scripts/`, `agentes/`, `old/`, proyectos reales (Don Financio, Cleaner).

## Decisiones ya tomadas
- Descartar, no reescribir: copiar una regla de flujo de la v1 en otras palabras sigue dándole motivos al subagente para dudar (`inheritProjectContext` la inyecta en su prompt).
- Mostrar la lista siempre, aunque esté vacía («ninguna»). Porque Franco confirma, no el agente.
- Esta corrección va en la skill, no en el script: el script no lee el contenido de `AGENTS.md`.

## Escenarios
- CUANDO el `AGENTS.md` de v1 trae «formato `<prefijo>/Fxx-nombre`», «confirmación explícita antes de crear ramas» y «Rama: de STATUS debe coincidir» ENTONCES el nuevo `AGENTS.md` no contiene ninguna y la respuesta lista las tres bajo «Reglas de v1 que descarté».
- CUANDO el `AGENTS.md` no trae reglas de flujo ENTONCES la lista dice «ninguna».
- CUANDO se elige conservar el viejo (opción 2) ENTONCES se corrigen los enlaces y se listan las reglas de flujo detectadas sin tocarlas.

## Verificación
1. `./verify` termina en `VERIFY OK`, con el bloque `9a` en verde y su prueba negativa fallando.
2. Prueba real (la corre el principal): copia temporal de un proyecto v1 sintético (`mktemp -d`) cuyo `AGENTS.md` traiga las tres reglas anteriores más un hecho del dominio; correr `bash instalar.sh --migrar <copia>` y luego `claude -p --append-system-prompt "$(node scripts/resolver.mjs cuerpo agentes/principal.md)" "Ejecuta la skill migrar-proyecto"` dentro de la copia. Esperado: el `AGENTS.md` nuevo no contiene `Fxx`, `STATUS`, `BACKLOG` ni la confirmación de rama; conserva el hecho del dominio; la respuesta trae la lista «Reglas de v1 que descarté».

## Pasos
La prueba real de *Verificación* 2 no es un paso: la corre el principal al volver el constructor y pega su evidencia.
- [x] `migrar-proyecto`, sección 3: agregar qué se conserva y qué se descarta (lista de arriba), «no las copies ni las reescribas» y la lista «Reglas de v1 que descarté» al final. Comprobar: `grep -n 'Reglas de v1 que descarté' skills/migrar-proyecto/SKILL.md`.
  - evidencia: `skills/migrar-proyecto/SKILL.md` líneas 30-38 (qué se conserva, qué se descarta, «Descarta: no las copies ni las reescribas», lista «Reglas de v1 que descarté»); `grep` devuelve líneas 38, 43 y 61, exit 0.
- [x] Misma sección, opción 2: solo corregir enlaces y listar las reglas de flujo vistas, sin modificarlas.
  - evidencia: `skills/migrar-proyecto/SKILL.md` línea 43 (opción 2: conservar el viejo, solo enlaces; reglas de flujo listadas sin modificar; «única excepción a descartar»), `grep` exit 0.
- [x] `migrar-proyecto`, sección 7: el resumen final incluye la lista y pide a Franco que la confirme.
  - evidencia: `skills/migrar-proyecto/SKILL.md` línea 61 (resumen incluye «Reglas de v1 que descarté» o «ninguna» y pide confirmación).
- [x] `verify`: bloque `9a` con frases clave (`Reglas de v1 que descarté`, `no las copies` y `Fxx` en `migrar-proyecto`) y copia negativa sin `Reglas de v1 que descarté` que debe fallar. Comprobar: `./verify` termina en `VERIFY OK`.
  - evidencia: `verify` bloque `9a` añadido tras `8e`; `./verify` corrido una vez, exit 0 (ver *Evidencia*).

## Evidencia

Verificación 1 (`./verify` en la raíz, sin variables):

```
$ ./verify
...
ok 8a: workspace con dos hijos con .git -> find devuelve 2
grep: /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.aVR67bRE34/neg3/skills/definir-proyecto/SKILL.md: No such file or directory
ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin definir-proyecto o sin VERIFY_TARGET fallan la comprobación
ok 8c: contrato del constructor presente (grep -c, siguiente=, no_intentado=, 3 corridas, git diff --stat, sin PARCIAL:); copias sin esas frases fallan
ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla
ok 8e: VERIFY_RAPIDO, docker system prune prohibido y timeoutMs presentes; el agente de Claude resuelve; copia sin VERIFY_RAPIDO falla
== 9a. migrar-proyecto: lista de reglas descartadas y prohibición de copiarlas ==
ok 9a: migrar-proyecto trae «Reglas de v1 que descarté», «no las copies» y Fxx; una copia sin la lista falla
VERIFY OK
exit 0
```

Nota: la línea `grep: ... No such file` sale de la copia negativa `neg3` de 8b (a propósito sin `definir-proyecto`); la comprobación falla como se espera y el bloque pasa.

Prueba real (*Verificación* 2): pendiente, la corre el principal con `claude -p` sobre una copia temporal.

## Notas
- Decisión menor: la sección 3 dice que, si se escribe `docs/proyecto.md`, la misma lista va en su «Descartado». La sección 4 no se tocó, porque el alcance fija las secciones 3 y 7.
- Decisión menor: el bloque `9a` comprueba que `migrar-proyecto` contenga `Fxx`; el término aparece en la sección 3 como regla descartada, no como regla activa.
- Ningún fallo previo corregido fuera de alcance. El `grep: No such file` de 8b es ruido de la prueba negativa ya existente, no un error.

