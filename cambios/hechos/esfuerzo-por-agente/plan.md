---
estado: listo
rama: feature/esfuerzo-por-agente
repos: [.]
ejecutor: constructor
---
# Esfuerzo de razonamiento por agente en modelos.json

## Objetivo
El esfuerzo (qué tanto razona el modelo) se declara por agente en `modelos.json` y el resolver lo escribe en los agentes de Claude Code (`effort`) y de Pi (`thinking`), como ya hace con el modelo.

## Supuestos
- Constructor `high` en ambas herramientas y principal `medium` (lo eligió Franco). Subir o bajar es editar una línea de `modelos.json`.
- Sin `esfuerzo` en un agente no se escribe nada: hereda el valor de la herramienta. Así una copia personal vieja de `modelos.json` sigue funcionando.
- No se sube `version` de `modelos.json`; `comparar-modelos` avisa del campo nuevo con una línea.
- Valores válidos comunes a las dos herramientas: `low`, `medium`, `high`, `xhigh`, `max`.
- No se prueba con una corrida real si `claude --agent constructor` respeta `effort` del frontmatter (la documentación no lo aclara). Si no lo respeta, Franco usa `/effort`.

## Alcance
`modelos.json`, `scripts/resolver.mjs`, `instalar.sh` (solo `generar_lanzador_pi`), `AGENTS.md`, `verify`.
Fuera de alcance: `agentes/*.md`, skills, `desinstalar.sh`, `~/.pi` y `~/.claude` del usuario, `old/`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque pasa las 4 preguntas de la Prueba de ejecutabilidad: cada paso trae su comprobación, ninguno depende de algo que solo existe al ejecutar, los errores previstos están dichos y no toca credenciales ni despliegue.
- Claude Code usa el campo `effort`; Pi usa `thinking`. Los agentes fuente no los declaran, igual que `model:`.
- El lanzador `pi-<agente>` pasa el esfuerzo como sufijo del modelo (`modelo:esfuerzo`), que `pi --model` acepta. Los lanzadores ya instalados no se regeneran solos: Franco reinstala.
- La variable `CLAUDE_CODE_EFFORT_LEVEL` manda sobre el frontmatter; en el equipo de Franco no está definida.

## Escenarios
- CUANDO `modelos.json` trae `constructor.esfuerzo: "high"` ENTONCES `agente-claude` imprime `effort: high` y `agente-pi` imprime `thinking: high`.
- CUANDO un agente no trae `esfuerzo` ENTONCES no sale ninguna de las dos líneas y `esfuerzo` imprime vacío.
- CUANDO el valor no está en `esfuerzos` (p. ej. `turbo`) ENTONCES el resolver falla con un mensaje claro.
- CUANDO un agente fuente declara `effort:` o `thinking:` ENTONCES el resolver lo rechaza, como a `model:`.
- CUANDO se genera el lanzador de Pi ENTONCES usa `modelo-esfuerzo` y el modelo sale como `openai/gpt-6-luna:high`.

## Verificación
`./verify` — debe terminar en `VERIFY OK`, con las líneas nuevas del paso 3 y las pruebas negativas.

## Pasos
- [x] En `modelos.json` agrega `"esfuerzos": ["low", "medium", "high", "xhigh", "max"]` justo después de `niveles`.
  - evidencia: `modelos.json` (línea `"esfuerzos"` después de `"niveles"`); JSON válido
- [x] En `modelos.json` pon `"principal": { "nivel": "medio", "esfuerzo": "medium" }` y `"constructor": { "nivel": "bajo", "esfuerzo": "high" }`.
  - evidencia: `modelos.json` bloque `agentes`
- [x] En `_leeme` de `modelos.json` agrega: esfuerzo = agentes[agente].esfuerzo; si falta no se escribe nada.
  - evidencia: `modelos.json` campo `_leeme`
- [x] En `scripts/resolver.mjs` agrega `resolverEsfuerzo(agente)`: devuelve `agentes[agente].esfuerzo` o `""`; falla si no está en `esfuerzos`.
  - evidencia: `scripts/resolver.mjs` función `resolverEsfuerzo`
- [x] Agrega la orden `esfuerzo <agente>`: imprime `resolverEsfuerzo(agente)` y un salto de línea.
  - evidencia: `node scripts/resolver.mjs esfuerzo constructor` imprime `high`, exit 0
- [x] Agrega la orden `modelo-esfuerzo <agente> <herramienta>`: imprime `modelo:esfuerzo`, o solo el modelo si no hay esfuerzo.
  - evidencia: `node scripts/resolver.mjs modelo-esfuerzo constructor pi` imprime `openai/gpt-6-luna:high`, exit 0
- [x] En `agente-claude` y `agente-pi`, falla si la cabecera declara `effort:` o `thinking:`, igual que con `model:`.
  - evidencia: `scripts/resolver.mjs` (chequeo tras el de `model:`); prueba negativa en `verify` 3d
- [x] `agente-claude` escribe `effort: <valor>` antes de `model:`; `agente-pi` escribe `thinking: <valor>`; sin esfuerzo, ninguna.
  - evidencia: `scripts/resolver.mjs` (`lineaEsfuerzo` antes de `model:`)
- [x] En `comparar-modelos` agrega la línea `campo nuevo: esfuerzo (agente X)` cuando el publicado lo trae y el personal no.
  - evidencia: `scripts/resolver.mjs` rama `comparar-modelos` (bucle sobre `nuevo.agentes`)
- [x] Agrega las dos órdenes nuevas al mensaje de uso y a los comentarios iniciales del resolver.
  - evidencia: `scripts/resolver.mjs` cabecera de comentarios y mensaje de `fallar("uso: ...")`
- [x] En `instalar.sh`, `generar_lanzador_pi`: cambia `resolver.mjs" modelo $nombre pi` por `modelo-esfuerzo $nombre pi` dentro del lanzador.
  - evidencia: `instalar.sh` línea 578 (`exec pi --model ... modelo-esfuerzo $nombre pi`); `bash -n instalar.sh`, exit 0 (verify paso 2)
- [x] En `verify` paso 3, comprueba `effort: <v>` (Claude) y `thinking: <v>` (Pi) iguales a lo que imprime `esfuerzo`.
  - evidencia: `verify` función `chequear` (bloque «esfuerzo»); `./verify` exit 0
- [x] En `verify` agrega prueba negativa: con `FLUCASTR_MODELOS` apuntando a un json con `"esfuerzo": "turbo"`, `esfuerzo` debe fallar.
  - evidencia: `verify` función `prueba_negativa_esfuerzo` (i); `./verify` exit 0
- [x] En `verify` agrega prueba negativa: un agente temporal con `effort:` en la cabecera debe ser rechazado por ambas órdenes.
  - evidencia: `verify` función `prueba_negativa_esfuerzo` (ii); `./verify` exit 0
- [x] En `AGENTS.md`, «Cómo funciona», agrega una viñeta: el esfuerzo se declara en `modelos.json` y se traduce a `effort` o `thinking`.
  - evidencia: `AGENTS.md` viñeta nueva bajo «Cómo funciona (v2)»
- [x] Corre `./verify` y pega en *Evidencia* las líneas de esfuerzo y las dos pruebas negativas.
  - evidencia: `./verify` exit 0 (ver *Evidencia*)

## Evidencia
$ ./verify
== 3. resolver Claude Code y Pi por agente ==
ok constructor Claude Code claude-haiku-5-5
ok esfuerzo constructor Claude Code high
ok skills constructor Claude Code
ok constructor Pi openai/gpt-6-luna
ok esfuerzo constructor Pi high
ok skills constructor Pi
ok principal Claude Code claude-sonnet-5-5
ok esfuerzo principal Claude Code medium
ok principal Pi openai/gpt-6.1-sol
ok esfuerzo principal Pi medium
ok lanzador Pi usa modelo-esfuerzo
-- 3c. prueba negativa de skills
ok prueba negativa: sin skills, el chequeo rechaza (Claude Code y Pi)
-- 3d. pruebas negativas de esfuerzo
ok prueba negativa: esfuerzo 'turbo' rechazado
ok prueba negativa: 'effort:' y 'thinking:' en la cabecera rechazados (Claude Code y Pi)
...
== 9a. migrar-proyecto: lista de reglas descartadas y prohibición de copiarlas ==
ok 9a: migrar-proyecto trae «Reglas de v1 que descarté», «no las copies» y Fxx; una copia sin la lista falla
VERIFY OK
exit 0

## Notas
- Decisión menor: la prueba de esfuerzo en `verify` usa un `FLUCASTR_MODELOS` temporal con `perfiles` mínimo (solo `pi-openai`) para que `esfuerzo` falle por `turbo` y no por otro motivo; el rechazo se comprueba por el texto del error.
- Decisión menor: el lanzador de Pi se comprueba en `verify` paso 3 con una búsqueda de texto en `instalar.sh` (`modelo-esfuerzo $nombre pi`); no se generó un lanzador real.
- No probado: un agente sin `esfuerzo` (la rama que no escribe línea) no está en el repo, así que `verify` solo comprueba que no salga la línea cuando el valor está vacío en la rama de código; no hay prueba negativa dedicada para ese caso.
- Sin fallos relacionados que corregir.
