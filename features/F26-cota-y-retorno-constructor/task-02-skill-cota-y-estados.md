# task-02 — Skill ejecutar-tarea: cota de verificación y retorno de 4 estados
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Hoy `ejecutar-tarea` solo corta si la verificación falla por la MISMA causa; con causa cambiante hubo hasta 5 pasadas (Cleaner, `task-05`). Esta tarea fija una cota: máximo 2 pasadas completas de *Verificación*. También define los 4 estados de retorno `completed | partial | blocked | interaction_required` y cómo se reflejan en el `Registro:`.

## Contexto
- Tocar: `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/contrato-constructor.mjs`, `pruebas/comprobaciones/contrato-constructor.test.mjs`
- `skills/ejecutar-tarea/SKILL.md` (5807 bytes): «Cuándo detenerte» (línea 28), «Línea de registro» (línea 47, con la lista de `causa`).
- Contrato que debe seguir pasando: regla 6 de `contrato-constructor.mjs` exige la frase `La misma verificación falla dos veces por la misma causa`; no se borra.
- `DECISION:` está definido en `definitions/WORKFLOW.md` §6, regla «2 bis»: primera línea `DECISION: tarea=task-NN; abiertas=<n>`, luego `Pregunta:`, `Motivo:`, `Opciones:` (2 o 3, `A) B) C)`), `Recomendada: <letra>`. No se define otro formato.
- `scripts/formato-evidencia.mjs` (task-01) ya valida `causa=verificacion_x2` y `causa=parcial`. Leer solo las *Notas* de task-01.

## Decisiones ya tomadas
- Cota: «corres como máximo 2 pasadas completas de *Verificación*; si la segunda no pasa, no corres una tercera». Queda `estado: bloqueada`, `causa=verificacion_x2`, `intentos=2`, primera línea `BLOQUEO:`.
- Estados de retorno (nueva sección «Retorno» antes de «Línea de registro»): `completed` = `lista para revisión`; `blocked` = `BLOQUEO: rol=<rol>; motivo=<motivo>`; `interaction_required` = el formato `DECISION:` de §6 regla 2 bis, sin tocar la tarea ni escribir `Registro:`; `partial` = primera línea `PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>`, luego `Hecho:`, `Falta:` (qué falta exactamente), `Opciones:` (2 o 3 cerradas), `Recomendada: <letra>`.
- `partial` aplica cuando hay parte del trabajo hecha y verificada y lo que falta se cierra con una opción de Franco; la cota usa siempre `BLOQUEO:`. Con `partial`: `estado: bloqueada` y `Registro:` con `resultado=bloqueada; causa=parcial`. No se añade valor a `resultado`.
- En la lista de `causa` se añade `parcial`; en «Cuándo detenerte» se añade el ítem de la cota sin quitar los existentes.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: texto de la skill y la regla 16 del contrato con su prueba.
Fuera de alcance: `agentes/constructor.md`, `agentes/coordinador.md`, `scripts/`, `definitions/`.

## Pasos
1. En «Cuándo detenerte», añadir el ítem de la cota (frase literal `como máximo 2 pasadas completas` y `no corres una tercera`).
2. Añadir la sección «Retorno» con los cuatro estados y los formatos de arriba (frases literales `completed | partial | blocked | interaction_required` y `PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>`).
3. En «Línea de registro», añadir `parcial` a las causas de `bloqueada` y la frase `causa=parcial` con `resultado=bloqueada`.
4. En `contrato-constructor.mjs`, añadir la regla 16 (`sobre: 'skill'`) con esas cinco frases; en el test, añadir su variante en `variantes` (borra las frases y exige error).

## Criterios de aceptación
1. La skill contiene las cinco frases. Se comprueba con la regla 16.
2. Sin las frases, la regla 16 falla (control negativo en la variante).
3. Las reglas 1-15 siguen pasando.
4. La rápida no suma fallos.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
grep -c 'PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>' skills/ejecutar-tarea/SKILL.md
bash pruebas/rapida.sh
```
Esperado: el primero termina con `ℹ fail 0`; el segundo imprime `1`; la rápida deja exactamente `ℹ fail 7` (ajenos: BACKLOG real y 6 de higiene de contexto).

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs
✔ rechaza regla 16: falta la cota («como máximo 2 pasadas completas», «no corres una tercera») o los estados de retorno en la skill (0.096792ms)
✔ rechaza la regla 11 si la rama se resuelve después del paso a «en curso» (0.127333ms)
✔ rechaza la regla 14 si «Modo yolo: activo» aparece después de «git switch -c» en la skill (0.10025ms)
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 50.953333
exit 0
```

```
$ grep -c 'PARCIAL: tarea=task-NN; hecho=<n>; falta=<n>' skills/ejecutar-tarea/SKILL.md
1
exit 0
```

```
$ bash pruebas/rapida.sh
ℹ tests 422
ℹ pass 415
ℹ fail 7
✖ definitions/BACKLOG.md real cumple el formato (3.295208ms)
✖ los archivos reales cumplen la regla (5.66025ms)
✖ falla si un agente conserva la línea de modelos.json (1.279625ms)
✖ falla si falta la lectura acotada en constructor (0.53225ms)
✖ falla si falta la lectura acotada en ejecutar-tarea (1.235959ms)
✖ falla si WORKFLOW.md pasa de 30720 caracteres (0.485416ms)
✖ falla si WORKFLOW.md conserva la frase sobre modelos.json (0.525083ms)
exit 1
```

## Notas

- Hueco menor: en «Retorno», `blocked` y `partial` dicen «la tarea bloqueada» en vez de repetir `estado: bloqueada`, porque la regla 7 exige que esa frase aparezca una sola vez (su variante borra la primera). Lo detectó la primera pasada: la regla 7 falló y se corrigió; la segunda pasada completa pasa.
- Rama: modo yolo, no se creó rama ni se hizo `git switch`. Sin commit.
- Autocomprobación: `node scripts/validar-tarea.mjs --evidencia` sale 0 con `OK: 1 tarea(s) con evidencia completa`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
