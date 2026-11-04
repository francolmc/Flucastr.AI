# F40 — Rama de trabajo también en yolo: propuesta de cambios de definición

> Estado: **borrador** hasta que Franco apruebe. Puerta 1. Franco edita `WORKFLOW.md` y `AGENTS.md`; aquí solo está el texto exacto. Origen de las decisiones: Franco, 2026-11-04 (*confirmado*, `BACKLOG.md` «Alcance de F40»).

## A. Texto vigente que cambia

`WORKFLOW.md` (31 298 caracteres con `wc -m`; tope de higiene 32 000):

- §9.1, «Rama ya existente», punto 5: «5. En yolo no aplica (§9.3).»
- §9.3, «Qué se omite»: «El trabajo se hace directo en la **rama actual, aunque sea `main`**, sin rama por feature: el `constructor` **no** crea rama ni hace `git switch` y no emite `CONFIRMAR:`; no hay commits, ni locales.»
- §9.3, párrafo «Advertencia de rama (decisión de Franco)»: se elimina entero.
- §9.3, «“Todas las features” incluye la descomposición»: «el `coordinador` orquesta sin preguntar: el `planificador`…» (sin pausa entre features).
- §9.3, «Commits»: «en el árbol de la rama actual para que».
- §9.3, «Registro en `STATUS.md`»: «`…; rama <…>`, y una línea por tarea…».
- §9.4: «El aviso de feature completa va en «Espera a Franco», no es escalación.» (ya dicho en §9.1; se elimina para compensar caracteres).

`AGENTS.md` (1291 caracteres), párrafo «Reglas»: «En yolo no crea rama ni hace switch.»

## B. Texto de reemplazo exacto

**`WORKFLOW.md`** (cada bloque sustituye al vigente de A, en el mismo lugar):

1. §9.1, punto 3 de «Rama ya existente», última frase: sustituir «Si el `switch` falla (p. ej. cambios sin commit que chocan), `BLOQUEO:` normal; el `constructor` no evita el intento con el árbol sucio.» por «Si falla (p. ej. cambios sin commit que chocan), `BLOQUEO:` normal.»
2. §9.1, punto 5 de «Rama ya existente»: **eliminar** la línea «  5. En yolo no aplica (§9.3).»
3. §9.1, bullet «Permisos»: quitar « (`agentes/constructor.md` y `ejecutar-tarea` lo dicen igual)».
4. §9.1, **nuevo bullet** justo antes de «Estado de las tareas»: «- **Comprobación:** la primera línea de *Verificación* de cada tarea es `git branch --show-current` con la rama esperada (prefijo del backlog + `Fxx-nombre`); su salida va en *Evidencia* (F25).»
5. §9.3, «Qué se omite», última oración: sustituir por «Rama como en §9.1 (el encargo lleva `Rama:` junto a `Modo yolo:`): el `constructor` la crea solo en la primera tarea de cada feature; después solo lee `git branch --show-current`; si existe y no es la actual, `CONFIRMAR:`. No hay commits, ni locales.»
6. §9.3: **eliminar** el párrafo «Advertencia de rama».
7. §9.3, «Todas las features»: «orquesta sin preguntar entre tareas: el `planificador`…» y, tras «respetando `depende_de:`.», insertar «**Pausa entre features:** al terminar cada una yolo se detiene con `Modo yolo: detenido (Fxx completa: commitea y cierra la rama)`; Franco commitea y pide seguir.» (antes de «**Feature ambigua:**»).
8. §9.3, «Quién hace qué»: «las ejecuta como siempre» pasa a «las ejecuta».
9. §9.3, «Commits»: «en la rama de la feature para que».
10. §9.3, «Registro en `STATUS.md`»: tras «`…; rama <…>`» añadir « (la de la feature)».
11. §9.4: eliminar la última oración (ver A).

Medición (aplicado a una copia con `wc -m`): **31 298 → 31 239 caracteres, neto −59** (tope 32 000; margen 761). Cumple ≤ 0.

**`AGENTS.md`** (párrafo «Reglas»): sustituir «En yolo no crea rama ni hace switch.» por «En yolo rige la misma regla de rama y, con varias features, se detiene al terminar cada una para que Franco commitee (§9.3).» El resto del párrafo igual. Medido sobre una copia: 1291 → 1379 caracteres (1393 bytes), ≤ 2048. Cumple.

## C. Efectos fuera de las definiciones (no se editan aquí)

Tamaños con `wc -c`, hoy. «Crece» = bytes netos.

| Archivo | Hoy / tope | Cambio | Crece |
|---|---|---|---|
| `agentes/coordinador.md` | 7168 / 7168 | l.68: quitar « (salvo yolo)»; l.59-60: «`Rama:` o `Modo yolo:`» → «`Rama:` y `Modo yolo:`» (misma longitud). | −13 B. Cabe. |
| `agentes/constructor.md` | 3008 / 3072 | Quitar el bullet «Modo yolo: … no creas rama…» (l.19, ~175 B); lo cubre el resto del texto. | −175 B. Cabe. |
| `skills/modo-yolo` | 5006 / 5120 | Entrada 3: la rama es «la de la feature (`ramas-feature`)», sin leer `.git/HEAD` (−190 B). Quitar entrada 4 «Advertencia» (−230 B) y renumerar (sigue «nueve reglas» del bloque activo). Activa regla 1: «Al `constructor` no le pasas `Rama:`» → «Todo encargo al `constructor` lleva también `Rama:`». Regla 4 `CONFIRMAR:`: flujo de `ramas-feature` (registrar, preguntar, re-delegar), y sacar `CONFIRMAR:` de la lista de la regla 5. Regla 7: quitar «No escribes el aviso… no hay rama de feature» y poner «con features restantes en el alcance, la línea pasa a `Modo yolo: detenido (Fxx completa: commitea y cierra la rama)` y te detienes» (+~110 B). | ≈ −300 B. Cabe. |
| `skills/ramas-feature` | 1562 / 5120 | Añadir una frase: «En yolo se carga igual al abrir cada feature (el pedido de Franco cubre la aprobación) y `Rama:` va también con `Modo yolo:`.» | +~140 B. Cabe en el tope (holgura 3558). |
| `skills/ejecutar-tarea` | 7619 / 7623 | Quitar el bullet «Modo yolo: … salta este paso entero…» (l.15, ~235 B) y, en «Cuándo detenerte», « En modo yolo esta causa no aplica.» (~35 B). | −270 B. Cabe; libera margen para el diagnóstico (D). |
| `skills/descomponer-feature` | 6339 / 6400 | l.19: sustituir «En yolo, ninguna tarea pide crear rama, hacer `git switch` ni commit, ni modificar `definitions/`, y su *Verificación* no depende de la rama actual.» por «En yolo, ninguna tarea pide commit ni modificar `definitions/`.» (−~85 B). En la plantilla (l.36): «Comandos exactos y salida esperada; el primero, `git branch --show-current` con la rama esperada.» (+~85 B). | ≈ 0. Cabe (holgura 61). |
| `contrato-constructor.mjs` y su `.test.mjs` | — | **Borrar** reglas 13 y 14 y sus filas de prueba (l.34-35 y la prueba de la regla 14, l.58-62). Reglas 11 y 12 siguen válidas (la skill mantiene `git switch -c`, `git branch --show-current`, `Rama:`, `Franco confirmó…` y `CONFIRMAR:`, y el orden respecto de «en curso»). | Sin tope. |
| `frases-por-archivo.mjs` | — | `skills/modo-yolo`: quitar `'ADVERTENCIA: rama main'` (l.167); opcional, añadir `'Fxx completa: commitea y cierra la rama'`. | Sin tope. |
| `skills/comandos-coordinador` (l.32), `skills/control-consumo` (l.19) | no medidos | Sin edición obligatoria. Revisar que el aviso «cierra la rama» no choque con la línea de pausa de yolo. | 0 |

**Ninguno de los archivos con tope necesita quitar texto ajeno al cambio: 0 no caben.** `coordinador.md` y `ejecutar-tarea` quedan por debajo del tope gracias a las frases que dejan de existir. (*Inferido*: hay otras pruebas de escenario que citen el comportamiento viejo; no las leí. La primera tarea debe correr `grep -rn 'no creas rama\|salta este paso entero\|ADVERTENCIA: rama' pruebas`; hoy solo salen los tres archivos de pruebas de la tabla.)

## D. Hipótesis: por qué el modo normal a veces no crea la rama en la tarea 1

Insumo del diagnóstico (primera tarea). *Confirmado* = leído en el texto; *inferido* = deducido.

1. *Confirmado:* en `skills/ejecutar-tarea`, «Antes de empezar» el paso 1 contiene la comprobación de **entorno** (`entorno.mjs`), y el paso 2 es «Rama de la feature»; el paso 3 pone `en curso`. Si falta algo del entorno, la skill marca `bloqueada` y termina con `BLOQUEO:` **antes** de llegar al paso 2. El orden de la skill **permite** exactamente el caso observado de F37 task-01 (entorno, luego rama). La prueba de contrato (reglas 5 y 11) solo exige «`git switch -c` antes de `en curso`» y «`no es aprobada` antes de `en curso`»; no ordena la rama respecto del entorno.
2. *Inferido:* la rama es idempotente: al volver a ejecutar la tarea tras arreglar el entorno, el paso 2 corre. Por eso un fallo de entorno solo produce «rama no creada» si la ejecución se da por terminada en esa pasada, o si la segunda ejecución no trae `Rama:`.
3. *Confirmado:* el paso 2 es condicional («Solo si el encargo trae la línea `Rama:`; si no la trae, no ejecutes ningún comando git de rama»). Sin `Rama:` la rama no se crea sin aviso alguno.
4. *Confirmado:* `Rama:` en el encargo depende del `coordinador`: `coordinador.md` l.68 carga `ramas-feature` «al pasar una feature a `en curso`» y l.60 dice «`Rama:` o `Modo yolo:` si aplica». *Inferido:* si la feature ya estaba `en curso` (sesión nueva, STATUS sin `Rama:`) o Franco lanza al `constructor` a mano, el encargo sale sin `Rama:` y no hay error.
5. *Confirmado:* `constructor.md` (Cómo trabajas, 1) pone antes de la skill las comprobaciones de estado, `DECISION:` y `CONFIRMAR:`; ninguna crea la rama. Una `DECISION:` abierta o una rama existente que no es la actual cortan también antes de crearla (esto último es lo esperado).
6. *Inferido (débil):* `ejecutar-tarea` anida la rama como sub-bullets con ramas (a)–(d) tras una condición «Solo si»; un modelo puede saltarla, y no hay prueba que mire el repo, solo que el texto exista.
7. *Por confirmar con el caso de Franco:* si el encargo de F37 task-01 llevaba `Rama:` (de eso depende 3 y 4), qué mostró `git branch --show-current` y si entorno falló antes de la rama.

Dirección de arreglo posible (no decidida): mover el paso de rama antes del de entorno (la rama es inocua y «antes de tocar nada»), o dejarlo y exigir en *Verificación* la comprobación de decisión 5, que ya detecta el defecto tras la ejecución.

## E. Decisiones para Franco

1. **Orden rama/entorno en `ejecutar-tarea`.** A) Mover la rama antes del entorno. B) Mantener el orden. C) Decidir tras el diagnóstico de la tarea 1. **Recomendada: C** (el orden está confirmado como causa posible, no probado como causa real).
2. **Quién da la rama esperada al planificador.** A) El `coordinador` pasa `Rama:` también al encargo del `planificador` (más bytes en `coordinador.md`, que está al tope). B) El `planificador` la deriva (prefijo de la fila del backlog + carpeta `Fxx-nombre`), como dice tu decisión 5. **Recomendada: B.**
3. **Parada entre features con un solo elemento en el alcance.** A) `detenido (Fxx completa…)` solo si quedan features en el alcance; si era la última, `terminado`. B) Siempre `detenido`. **Recomendada: A.**

Tamaño de la pasada: 10476 bytes

## Decisiones de Franco (2026-11-04)

Estado: aprobado por Franco; WORKFLOW.md y AGENTS.md editados por el arquitecto con su autorización.

1. Orden rama/entorno en `ejecutar-tarea`: **C**, se decide tras el diagnóstico (primera tarea de F40); no se cambia el orden ahora.
2. La rama esperada para los comandos de *Verificación* la deriva el **planificador** (prefijo de la fila del backlog + carpeta `Fxx-nombre`); el coordinador no la pasa en el encargo.
3. Parada entre features en yolo: **solo si quedan features en el alcance**; si era la última, `Modo yolo: terminado`.
