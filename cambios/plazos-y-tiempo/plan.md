---
estado: borrador
rama: feature/endurecer-constructor
repos: [.]
---
# Plazos: planes que caben en el tiempo del subagente (Pedido 8, tramo 3 de 3)

## Objetivo
Los planes caben en el plazo de 30 minutos de Pi: los pasos pesados llevan duración estimada, el `verify` tiene un modo rápido con caché para iterar, el constructor declara un `timeoutMs` probado, y tras un corte el principal limpia solo los recursos Docker de su proyecto de verify.

Cubre (g) del Pedido 8. Va después de `cambios/constructor-contrato` y `cambios/ejecutor-y-pasos`.

## Supuestos
- Este plan lo ejecuta el principal (`ejecutor: principal` cuando exista el campo): hay una prueba real en Pi (paso 5) que el constructor barato no debe hacer. Si Franco prefiere el constructor con nivel `medio`, cambia solo quién lo lanza.
- `VERIFY_RAPIDO=1` solo cambia el build: usa caché de Docker en vez de `--no-cache`. Los demás escalones (arranque, recorrido) corren igual. La corrida final de aceptación va sin la variable y sin caché.
- «Unos 20 minutos» es la suma de las duraciones estimadas de los pasos del plan; las estimaciones son del principal y pueden fallar.
- `timeoutMs` valdrá 3 600 000 (60 min, decisión de Franco) en `constructor.md` mientras no se pruebe otro; si Pi lo rechaza o lo ignora, no se adopta y se anota en `PENDIENTES.md`.
- La configuración de `~/.pi/agent/extensions/subagent/config.json` (`timeoutMs`, `checkpointBeforeDeadlineMs`) se documenta como opcional para quien use Pi, en `README.md`. El kit no la instala ni la edita.
- Si las pruebas de Pi no se pueden correr (Pi no disponible), el campo y la configuración quedan como «no probado» en `PENDIENTES.md` y no se agregan a `constructor.md`.
- Rama desde `main` con los tramos 1 y 2 ya fusionados o commiteados.

## Alcance
Cambiar: `skills/planificar-cambio/SKILL.md`, `skills/preparar-proyecto/SKILL.md`, `skills/preparar-proyecto/referencia.md`, `agentes/constructor.md`, `agentes/principal.md`, `README.md`, `PENDIENTES.md`, `verify` (bloque `8e`).
Fuera de alcance: `ejecutar-plan`, `modelos.json`, `scripts/`, instalador, `old/`, `~/.pi/` (solo se lee y se prueba con un directorio temporal).

## Decisiones ya tomadas
- Un solo build sin caché, en la corrida final. Porque repetirlo en cada iteración consumía el plazo en Don Financio.
- Limpieza tras un corte: solo contenedores, redes y volúmenes con el prefijo del proyecto de compose de `verify`. Nunca `docker system prune`. Porque podría borrar recursos de otros proyectos.
- Claude Code ignora `timeoutMs`; el campo no debe romper el agente generado para Claude (se comprueba con el resolver).

## Escenarios
- CUANDO un plan tiene pasos de build que suman más de unos 20 minutos ENTONCES se parte en tramos, cada uno con su verificación parcial.
- CUANDO se itera sobre una corrección ENTONCES `VERIFY_RAPIDO=1 ./verify` usa caché; la corrida de aceptación no.
- CUANDO Pi corta por plazo ENTONCES el principal revisa y limpia solo `docker ... --filter name=<prefijo>` del proyecto de verify antes de relanzar.

## Verificación
`./verify` — debe terminar en `VERIFY OK`, con el bloque `8e` en verde y su prueba negativa fallando donde corresponde. Más la prueba en Pi del paso 5 (evidencia en *Evidencia*).

## Pasos
- [ ] `planificar-cambio`: los pasos que lanzan builds, instalaciones o suites llevan su duración estimada entre paréntesis; un plan cuya suma pase de unos 20 minutos se parte en tramos con verificación parcial. Los planes no piden «sin caché» salvo en la corrida final.
- [ ] `preparar-proyecto/SKILL.md` y `referencia.md`: `verify` acepta `VERIFY_RAPIDO=1` (build con caché); el build sin caché queda para la corrida final. Probar el esqueleto en una carpeta temporal con un compose mínimo si hay Docker; si no, anotarlo.
- [ ] `agentes/principal.md`: tras un corte por plazo, antes de relanzar, revisar y limpiar solo los recursos Docker con el prefijo del proyecto de verify; nunca `docker system prune`.
- [ ] Leer en la documentación de pi-subagents (`docs/agents.md`, `docs/tool-reference.md`, configuración de la extensión) qué acepta `timeoutMs` y `checkpointBeforeDeadlineMs`; anotar el fragmento exacto en *Notas*. Comprobar: la cita existe en la documentación leída.
- [ ] Probar en Pi con un proyecto temporal y un plan de 3 pasos, con `timeoutMs` bajo (p. ej. 60 s) y un paso que lo exceda: el subagente se corta o deja checkpoint, y con un valor acorde completa. Si funciona, agregar `timeoutMs: 3600000` a `constructor.md` y documentar la configuración opcional en `README.md`; si no, no tocar `constructor.md` y registrarlo en `PENDIENTES.md`.
- [ ] `verify`: bloque `8e` con frases clave (`VERIFY_RAPIDO` en `referencia.md`; `docker system prune` en `principal.md` como prohibición; `timeoutMs` en `constructor.md` solo si se adoptó) y copia negativa sin `VERIFY_RAPIDO` que debe fallar; comprobar que el agente generado para Claude Code sigue resolviendo (`node scripts/resolver.mjs agente-claude agentes/constructor.md`). Comprobar: `./verify` termina en `VERIFY OK`.

## Evidencia
(la escribe quien ejecute)

## Notas
(la escribe quien ejecute)
