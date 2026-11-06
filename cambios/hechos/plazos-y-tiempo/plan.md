---
estado: listo
rama: feature/endurecer-constructor
repos: [.]
ejecutor: principal
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
- [x] `planificar-cambio`: los pasos que lanzan builds, instalaciones o suites llevan su duración estimada entre paréntesis; un plan cuya suma pase de unos 20 minutos se parte en tramos con verificación parcial. Los planes no piden «sin caché» salvo en la corrida final.
  - evidencia: `skills/planificar-cambio/SKILL.md`, regla 9 (duración entre paréntesis, tramos de ~20 min, `VERIFY_RAPIDO=1` en intermedios)
- [x] `preparar-proyecto/SKILL.md` y `referencia.md`: `verify` acepta `VERIFY_RAPIDO=1` (build con caché); el build sin caché queda para la corrida final. Probar el esqueleto en una carpeta temporal con un compose mínimo si hay Docker; si no, anotarlo.
  - evidencia: `referencia.md` (cabecera y línea de build) y `preparar-proyecto/SKILL.md`; probado con compose mínimo en Docker: `VERIFY_RAPIDO=1` reutiliza capa (`#6 CACHED`), sin la variable usa `--no-cache`
- [x] `agentes/principal.md`: tras un corte por plazo, antes de relanzar, revisar y limpiar solo los recursos Docker con el prefijo del proyecto de verify; nunca `docker system prune`.
  - evidencia: `agentes/principal.md`, punto 5: limpieza con `--filter name=<prefijo>`; «Nunca `docker system prune`»
- [x] Leer en la documentación de pi-subagents (`docs/agents.md`, `docs/tool-reference.md`, configuración de la extensión) qué acepta `timeoutMs` y `checkpointBeforeDeadlineMs`; anotar el fragmento exacto en *Notas*. Comprobar: la cita existe en la documentación leída.
  - evidencia: cita en *Notas* (`docs/agents.md` l.470, `docs/configuration.md` l.431-437 y l.457-463, `docs/tool-reference.md` l.108-110)
- [x] Probar en Pi con un proyecto temporal y un plan de 3 pasos, con `timeoutMs` bajo (p. ej. 60 s) y un paso que lo exceda: el subagente se corta o deja checkpoint, y con un valor acorde completa. Si funciona, agregar `timeoutMs: 3600000` a `constructor.md` y documentar la configuración opcional en `README.md`; si no, no tocar `constructor.md` y registrarlo en `PENDIENTES.md`.
  - evidencia: prueba real en Pi 0.84.0, ver *Notas*; `timeoutMs: 3600000` agregado a `agentes/constructor.md`; `README.md` sección «Plazos en Pi (opcional)»
- [x] `verify`: bloque `8e` con frases clave (`VERIFY_RAPIDO` en `referencia.md`; `docker system prune` en `principal.md` como prohibición; `timeoutMs` en `constructor.md` solo si se adoptó) y copia negativa sin `VERIFY_RAPIDO` que debe fallar; comprobar que el agente generado para Claude Code sigue resolviendo (`node scripts/resolver.mjs agente-claude agentes/constructor.md`). Comprobar: `./verify` termina en `VERIFY OK`.
  - evidencia: `verify` bloque `8e`; `./verify` → exit 0 (`VERIFY OK`)

## Evidencia
$ ./verify
...
ok 8e: VERIFY_RAPIDO, docker system prune prohibido y timeoutMs presentes; el agente de Claude resuelve; copia sin VERIFY_RAPIDO falla
VERIFY OK
exit 0

Prueba en Pi (ver Notas): con `timeoutMs: 60000` el subagente se cortó (`Subagent timed out after 60000ms`, `termination: timed-out`); con `timeoutMs: 3600000` el mismo plan terminó en `COMPLETADO`.

## Notas
- Docs leídas (pi-subagents 0.84.0, `~/.pi/agent/npm/node_modules/pi-subagents/docs/`): `agents.md`: «`timeoutMs` | Positive integer default runtime deadline in milliseconds for single-agent launches. Foreground launches use 30 minutes when neither the call nor agent provides a timeout; explicit `timeoutMs`/`maxRuntimeMs` and agent defaults win.» `configuration.md`: `checkpointBeforeDeadlineMs` es «Global default for the async single-agent … launch option … best-effort "checkpoint and stop" steer … the ordinary `timeoutMs` kill still applies».
- Prueba real en Pi (el principal, proyecto temporal en el scratchpad, `.pi/agents/constructor.md` generado con `agente-pi`, plan de 3 pasos con `sleep 100` en el 2.º): (1) sin `--approve` Pi ignora los agentes del proyecto (no está en `trust.json`) y corrió el constructor global, sin corte; la prueba válida exige `pi -p --approve`. (2) `timeoutMs: 60000`: cortó a los 60 s sin checkpoint (foreground), `a.txt` creado y paso 1 marcado, plan en `en curso`, pasos 2 y 3 sin tocar; el estado se reconstruyó desde `git status`/plan. (3) `timeoutMs: 3600000`, desde el estado cortado: `COMPLETADO`, `verify` pasa, plan `listo` (3 min 17 s).
- `checkpointBeforeDeadlineMs` solo aplica a corridas asíncronas de un agente: no se probó (la prueba fue en primer plano) y no va en `constructor.md`; queda documentado como opcional.
- Claude Code ignora `timeoutMs` y acepta el agente (`claude --agent constructor -p` respondió); `verify` 8e lo comprueba con el resolver.
- Aviso: el `constructor.md` global instalado en `~/.pi/agent/agents/` es del kit anterior (aún dice «Carga `ejecutar-plan`»). Hay que reinstalar con `instalar.sh` para que Pi use los cambios de los tres tramos.
