---
estado: listo
rama: feature/kit-v2
---
# pi-chequeo

## Objetivo
`./verify` falla si el constructor generado para Pi o para Claude Code pierde `skills: ejecutar-plan`; los documentos reflejan que Pi ya se probó en lo básico.

## Alcance
Solo `verify`, `PENDIENTES.md` y `AGENTS.md`. Fuera de alcance: `instalar.sh`, `desinstalar.sh`, `scripts/`, `agentes/`, `skills/` (el frontmatter del constructor ya está bien).

## Decisiones ya tomadas
- La comprobación va en el escalón 3 de `verify`, que ya genera `agente-claude` y `agente-pi` por agente. Es el lugar donde se ve el archivo generado.
- Se comprueba la línea exacta `skills: ejecutar-plan` en la salida de `resolver.mjs`. Si el resolver la quita para alguna herramienta, la prueba debe mostrarlo (no se arregla el resolver en este plan: se reporta en *Notas*).
- Prueba negativa: copiar `agentes/constructor.md` a un temporal sin la línea `skills:`, pasarlo por el resolver y comprobar que la función de chequeo lo rechaza. Sin tocar el archivo real.

## Escenarios
- CUANDO el constructor generado tiene `skills: ejecutar-plan` en Claude y en Pi ENTONCES el escalón 3 imprime `ok skills constructor` para ambos.
- CUANDO la salida generada no trae esa línea ENTONCES `verify` sale con `FALLO` y nombra herramienta y agente.
- CUANDO se corre la prueba negativa ENTONCES el chequeo detecta la ausencia y `verify` sigue verde.

## Verificación
`./verify` — termina en `VERIFY OK` y muestra las líneas nuevas.

## Pasos
- [x] Leer el escalón 3 de `verify` y la salida de `node scripts/resolver.mjs agente-pi agentes/constructor.md` y `agente-claude`: anotar en *Notas* si cada una trae `skills: ejecutar-plan` (y si `inheritProjectContext: true` también).
- [x] Agregar en `verify` una función `tiene_skills` que reciba la salida generada y exija `skills: ejecutar-plan` en la línea.
- [x] Llamarla en el escalón 3 para `constructor` con Claude Code y con Pi.
- [x] Agregar la prueba negativa con el temporal (se borra al salir).
- [x] `PENDIENTES.md`: «Probar Pi» pasa a «probado en lo básico» (una corrida real en Pi, plan mínimo, con `skills: ejecutar-plan` e `inheritProjectContext: true`). Dejar como pendiente: plan de varios archivos, caso `PARCIAL`, y dos dudas: Pi no tiene reglas deny, y no se sabe si `inheritProjectContext` hace algo.
- [x] `AGENTS.md`: añadir una regla corta: en Pi los subagentes no heredan skills; toda skill que use un subagente se declara en su frontmatter (`skills:`), y `inheritProjectContext: true` para el contexto del proyecto.
- [x] Correr `./verify` completo y pegar la salida en *Evidencia*.

## Evidencia
$ ./verify
== 3. resolver Claude Code y Pi por agente ==
ok constructor Claude Code claude-haiku-5-5
ok skills constructor Claude Code
ok constructor Pi openai/gpt-6-luna
ok skills constructor Pi
ok principal Claude Code claude-sonnet-5-5
ok principal Pi openai/gpt-6.1-sol
-- 3c. prueba negativa de skills
ok prueba negativa: sin skills, el chequeo rechaza (Claude Code y Pi)
== 4. skills con SKILL.md, name y description ==
ok ejecutar-plan
ok planificar-cambio
ok preparar-proyecto
== 5. instalar.sh --simular no escribe lo que instala ==
ok autoprueba: reacciona a añadir y cambiar; ignora transcripts e history
-- 5b. instalar.sh --simular sobre el home real
ok instantánea sin cambios (584 líneas)
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

## Notas
- Paso 1: el resolver trae `skills: ejecutar-plan` e `inheritProjectContext: true` en Pi (`model: openai/gpt-6-luna`) y en Claude Code (`model: claude-haiku-5-5`). No hubo que reportar nada del resolver.
- Decisión menor: `tiene_skills` se llama solo para el agente `constructor` (el alcance pide esa comprobación solo para él), e imprime `ok skills constructor <herramienta>`. La prueba negativa corre en una subshell con temporal propio (`trap` lo borra al salir) y usa `grep -v '^skills:'` sobre una copia de `agentes/constructor.md`; no toca el archivo real.
- Omisión mía: no cambié `estado` a `en curso` al empezar; lo dejé en `listo` al cerrar. Lo corrijo aquí para que el registro quede claro.
- Hubo una sola corrida de `./verify` antes de documentar (la de Evidencia es la segunda); no hizo falta corregir nada.
- `PENDIENTES.md` y `AGENTS.md` cambiaron según el plan. Ojo: el texto de `PENDIENTES.md` dice que hubo «una corrida real en Pi» porque así lo pide el plan; yo no corrí Pi en esta ejecución y no lo verifiqué. Conviene que Franco confirme esa corrida antes de dar el punto por cerrado.
