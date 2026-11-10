---
estado: listo
rama: feature/espera-unica
base: main
repos: [.]
ejecutor: constructor
tramo: 3
---
# Esperar con una sola llamada y gastar menos créditos en Claude Code, Pi y Codex

## Objetivo
Los agentes de los tres soportes esperan al constructor y a los comandos largos (`verify`, builds) con una sola llamada larga, sin bucles de `sleep`/`tail`/estado. El principal compacta antes y revisa más liviano. El medidor muestra créditos y sondeos por sesión para comprobarlo. Sin agentes nuevos.

## Supuestos
- Evidencia (Codex, 8-9 nov, ≈1,2 créditos por punto de la ventana de 5 h): `wait_agent` con 10–60 s y bucles de `tail`/`sleep` fueron ≈46 % de los créditos de `sol` (principal) y 31 % de las llamadas de `luna`. Pi: 58 de 2625 llamadas `bash` fueron `sleep`/`tail`. Claude Code: no medido; si el medidor no lo ve, se anota y no se inventa.
- Esperar con `timeout_ms: 3600000` en `wait_agent` ya funcionó en Codex (una llamada de 21 min). Una espera larga de comandos con `background_terminal_max_timeout` NO está probada: el tramo 2 la prueba; si no funciona, se deja solo la regla de texto.
- Si Franco quiere otro valor de compactación del principal que 60000, cambia una línea de `modelos.json`.

## Alcance
`agentes/principal.md`, `agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`, `instalar.sh`, `scripts/resolver.mjs`, `scripts/uso.mjs`, `modelos.json`, `pruebas/uso/`, `verify`, `docs/evaluaciones/costos.md`, `AGENTS.md`. Fuera: agentes nuevos, `.codex/config.toml` de proyectos, topes de llamadas, el tramo 5 de `recortar-contexto-fijo` (Docker, recortes de principal/planificar-cambio).

## Decisiones ya tomadas
- Ejecutor: constructor, porque los requisitos, el contexto y las comprobaciones están en el plan y no toca credenciales ni producción.
- No se agregan agentes (Franco; Anthropic desaconseja multiagente para código y el multiagente gasta ≈15× los tokens de un chat).
- El principal sigue en `medio`/`low` y el constructor en `bajo`/`medium`.
- Reglas de texto sin nombres de herramienta salvo una línea por soporte: Codex `wait_agent` con `timeout_ms: 3600000` y `yield_time_ms` alto; Claude Code, comando largo con `timeout` máximo o `run_in_background` y esperar su aviso; Pi, el timeout de `bash` o la espera de fondo que ofrezca. Nunca bucles de `sleep`, `tail` o consulta de estado.
- No debilitar pruebas de `verify`: grep antes de quitar cualquier texto (regla de oro de `recortar-contexto-fijo`).

## Escenarios
- CUANDO el principal lanza al constructor ENTONCES espera con una sola llamada larga y no consulta su estado (A1)
- CUANDO un agente corre un comando largo ENTONCES lo espera con una sola llamada, no con `sleep`/`tail` repetidos (A1)
- CUANDO se instalan los lanzadores de Codex ENTONCES fijan la espera larga de comandos y compactan al principal antes que al constructor (A2, A3)
- CUANDO se lanza `codex-principal` ENTONCES compacta con su valor propio y `codex-constructor` con el general; Claude Code y Pi no pueden por agente (su umbral es un ajuste compartido) y siguen con el general (A3)
- CUANDO el principal revisa un tramo ENTONCES lee `git diff` de los archivos del Alcance, la cola de `verify` y las *Notas*, no el plan entero (A4)
- CUANDO se corre el medidor con `--sesiones` ENTONCES cada sesión trae créditos y sondeos (A5)
- CUANDO se corre `./verify` ENTONCES pasa sin debilitar pruebas (A6)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Reglas de espera única en los agentes | `grep -n "timeout_ms" agentes/principal.md` y `grep -ln "sleep" agentes/principal.md agentes/constructor.md skills/ejecutar-plan/SKILL.md`; revisión manual de la redacción | la regla aparece en principal, constructor y ejecutar-plan; nombra los tres soportes en una línea cada uno; prohíbe bucles de `sleep`/`tail`/estado |
| A2 | Espera larga de comandos en Codex | HOME temporal, `bash instalar.sh`, `grep -c background_terminal_max_timeout` en `codex-principal` y `codex-constructor`; prueba real: `codex exec -m <luna> -c background_terminal_max_timeout=... "ejecuta una vez sleep 90 y espera sin consultar"` y contar llamadas en el rollout | valor presente en ambos; en la prueba real ≤ 3 llamadas de herramienta; si sale más, el resultado y el motivo quedan en *Notas* y la clave se deja solo si no empeora |
| A3 | Compactación del principal en Codex | `node scripts/resolver.mjs compactar-codex principal` y `... constructor`; `node scripts/resolver.mjs` de Claude Code y Pi sin cambios | Codex: principal 60000 y constructor 100000; Claude Code y Pi: mismos valores que antes (el umbral es compartido); sin clave por agente, rige el general |
| A4 | Revisión liviana | `grep -n "git diff" agentes/principal.md`; revisión manual | conserva «git diff» y la tabla de Aceptación; pide diff de los archivos del Alcance y cola de `verify`; no pide releer el plan |
| A5 | Medidor con créditos y sondeos | `node scripts/uso.mjs --sesiones --json` sobre fixtures Codex y Pi nuevos, con una sesión que tiene 3 `tail` de sondeo y otra sin ninguno | `creditos` igual al cálculo manual con la tarifa del fixture (±0,01) y `sondeos` 3 y 0; sin tarifa para el modelo, `creditos` es `null`, no 0 |
| A6 | Sin pérdida | `./verify` y `node pruebas/uso/probar.mjs` | `VERIFY OK`; ninguna prueba debilitada |

Sensibilidad de A5: un fixture con tarifa distinta debe cambiar `creditos`; si no cambia, la prueba falla.

## Verificación
`./verify` — define «hecho».

## Pasos

### Tramo 1: reglas de texto
Resultado: las tres piezas de texto traen la regla y la revisión liviana. Toca `agentes/principal.md`, `agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`, `verify` si una prueba exige texto movido.
- [x] En `principal.md` (sección Delega) reemplazar la frase de espera por la regla de decisiones y añadir la línea por soporte; grep antes de borrar (A1)
  - evidencia: `agentes/principal.md` línea 35 (regla «Por soporte: Codex…, Claude Code…, Pi…» y «Nunca bucles de `sleep`, `tail` ni consulta de estado»); `grep -n "timeout_ms" agentes/principal.md`, exit 0; `grep -n "una sola espera"` y `send_message` conservados (los exige `verify`)
- [x] En `constructor.md` y `ejecutar-plan` añadir la regla de comandos largos con una sola llamada, en una línea cada una (A1)
  - evidencia: `agentes/constructor.md` línea 24 y `skills/ejecutar-plan/SKILL.md` línea 38 (regla de comandos largos); `grep -ln "sleep"` lista ambos archivos
- [x] En `principal.md`, «Al volver el constructor»: revisión de `git diff` de los archivos del Alcance + cola de `verify` + *Notas*; conservar `git diff` y la tabla de Aceptación (A4)
  - evidencia: `agentes/principal.md` línea 37 (`git diff` de los archivos del *Alcance*, cola de `verify`, *Notas* y tabla de Aceptación); `grep -n "git diff"` exit 0
- [x] Correr `./verify` y anotar la cola (≈ varios min) (A6)
  - evidencia: `./verify`, exit 0 (salida completa en el scratchpad `verify-t1.log`); cola en *Evidencia*

Verificación del tramo: `./verify` (A1, A4, A6).

### Tramo 2: lanzadores y compactación por agente
Resultado: Codex fija la espera larga y compacta al principal antes que al constructor. Toca `instalar.sh`, `scripts/resolver.mjs`, `modelos.json`, `verify`.
- [x] En `modelos.json` añadir `compactar_en: 60000` opcional bajo `agentes.principal`; sin ella rige el general (A3)
  - evidencia: `modelos.json` línea de `agentes.principal` (`"compactar_en": 60000`); `node scripts/resolver.mjs compactar-codex principal` → `60000`, exit 0
- [x] En `resolver.mjs`, `compactar-codex` lee primero `agentes.<agente>.compactar_en`; Claude Code y Pi no cambian porque su umbral es un ajuste compartido de todos los agentes (A3)
  - evidencia: `scripts/resolver.mjs` función `compactarCodex` (línea 103); `node scripts/resolver.mjs compactar-codex constructor` → `100000`; `node scripts/resolver.mjs modelo principal claude-code` → `claude-sonnet-5-5` (sin cambio)
- [x] En `instalar.sh` (`generar_lanzador_codex`) añadir `-c background_terminal_max_timeout=1800000` a ambos lanzadores (A2)
  - evidencia: `instalar.sh` línea 705 (bandera `background_terminal_max_timeout=1800000` en `generar_lanzador_codex`); `bash -n instalar.sh`, exit 0
- [x] Extender el paso 3f de `verify` para comprobar el valor por agente y la clave nueva (A2, A3)
  - evidencia: `verify` bloque «(1c)» tras la línea 826 (umbral principal 60000 y constructor general; `background_terminal_max_timeout=1800000` en `codex-principal` y `codex-constructor`); `./verify`, exit 0 (ver *Evidencia*)
- [x] Prueba real de A2 con `codex exec` (luna, esfuerzo low, ≈2 min) y pegar el conteo de llamadas en *Notas* (A2)
  - evidencia: `codex exec -m gpt-6-luna -c 'model_reasoning_effort="low"' -c background_terminal_max_timeout=1800000 "...sleep 90 && echo listo..."` (salida JSON en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/a2/salida2.jsonl`), exit 0; 1 llamada de herramienta (`/bin/bash -lc 'sleep 90 && echo listo'`, `exit_code 0`, salida «listo»), sin sondeos

Verificación del tramo: `./verify` (A2, A3, A6).

### Tramo 3: medidor y cierre
Resultado: `uso.mjs` da créditos y sondeos. Toca `scripts/uso.mjs`, `pruebas/uso/`, `docs/evaluaciones/costos.md`, `AGENTS.md`.
- [x] Crear `scripts/tarifas.json` con créditos por millón (entrada, entrada en caché, salida) de `gpt-6.1-sol` 50/2,5/250, `gpt-6-luna` 2,5/0,25/12,5 y `gpt-6-astra` 250/25/1250, con la fuente `learn.chatgpt.com/codex/pricing` y la fecha (A5)
  - evidencia: `scripts/tarifas.json` (gpt-6.1-sol 50/2,5/250, gpt-6-luna 2,5/0,25/12,5, gpt-6-astra 250/25/1250; fuente `learn.chatgpt.com/codex/pricing`, fecha 2026-11-09); comprobado en `pruebas/uso/probar.mjs` prueba A5c
- [x] En `uso.mjs --sesiones` añadir `creditos` (Codex y Pi; `null` sin tarifa) y `sondeos` (llamadas `sleep`, `tail`/`watch` repetidos y consultas de estado) en las herramientas que los exponen (A5)
  - evidencia: `scripts/uso.mjs` funciones `creditosSesion`, `esSondeo`, `comandoDe`, `cargarTarifas` y campos `creditos`/`sondeos` en Claude, Codex y Pi; `node scripts/uso.mjs --sesiones --herramienta codex --codex-dir pruebas/uso/fixtures/codex-sondeos --json`, con `creditos` 0.0285 y 0.01 y `sondeos` 3 y 0
- [x] Fixtures con sondeos y tarifas, y pruebas en `pruebas/uso/probar.mjs` con la comprobación de sensibilidad (A5)
  - evidencia: `pruebas/uso/fixtures/codex-sondeos/`, `pruebas/uso/fixtures/pi-sondeos/`, `pruebas/uso/fixtures/tarifas-prueba.json`, `pruebas/uso/probar.mjs` (pruebas A5a a A5d y expectativas A3s y A8 con los campos nuevos); `node pruebas/uso/probar.mjs`, exit 0 (18 de 18 ok)
- [x] En `costos.md`, sección «Créditos y espera» con la regla ≈1,2 créditos por punto y el antes/después; en `AGENTS.md` una línea (A5)
  - evidencia: `docs/evaluaciones/costos.md` sección «Créditos y espera» y línea de tarifas corregida; `AGENTS.md` línea 20 (medidor con créditos y sondeos)
- [x] Correr `./verify` completo (≈ varios min) y anotar la cola (A6)
  - evidencia: `./verify`, exit 0 (VERIFY OK; cola en *Evidencia*; log completo en el scratchpad `verify-t3.log`)

Verificación del tramo: `./verify` y `node pruebas/uso/probar.mjs` (A5, A6).

## Evidencia
Tramo 1 (reglas de texto).

$ ./verify
...
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

Tramo 2 (lanzadores y compactación por agente):

$ ./verify
...
ok 3f: umbral por agente (principal 60000, constructor 100000 general) y espera larga de comandos en ambos lanzadores
...
VERIFY OK
exit 0

$ codex exec -m gpt-6-luna -c 'model_reasoning_effort="low"' -c background_terminal_max_timeout=1800000 "Ejecuta una sola vez el comando: sleep 90 && echo listo. ..."
  -> 1 llamada: /bin/bash -lc 'sleep 90 && echo listo' → listo, exit 0; respuesta «listo»
exit 0

Comprobaciones A1 y A4 del tramo (grep):
$ grep -n "timeout_ms" agentes/principal.md   -> línea 35, exit 0
$ grep -ln "sleep" agentes/principal.md agentes/constructor.md skills/ejecutar-plan/SKILL.md   -> los tres archivos, exit 0
$ grep -n "git diff" agentes/principal.md   -> líneas 37, 38 y 41, exit 0

## Notas
Tramo 2 (lanzadores y compactación por agente), cierre:
- Quedó: `compactar_en: 60000` en `agentes.principal` de `modelos.json`; `compactar-codex` lee el valor del agente antes que el del perfil y el general; `codex-<agente>` lleva `background_terminal_max_timeout=1800000`; paso «(1c)» de 3f en `verify` comprueba ambos lanzadores.
- A2, prueba real: 1 llamada de herramienta (`sleep 90 && echo listo`, exit 0), 0 sondeos, respuesta «listo». Cumple ≤ 3 llamadas. La clave se mantiene.
- Primer intento de la prueba real sin `< /dev/null`: `codex exec` quedó esperando stdin («Reading additional input from stdin...») y no produjo salida; se repitió con stdin cerrado. Lo anoto por si se repite la prueba.
- `./verify` pasa (exit 0, VERIFY OK) con la comprobación nueva.
- Decisión menor: el estado pasó de `aprobado` a `listo` sin pasar por `en curso`, porque el tramo cerró de una vez (no hubo corte).

Tramo 1 cerrado (5 líneas):
- Quedó: regla de espera única por soporte en `principal.md` (Delega), regla de comandos largos en `constructor.md` y `ejecutar-plan`, y revisión liviana en «Al volver el constructor».
- Se conservaron «una sola espera», `send_message` y `git diff` porque `verify` los exige.
- `./verify` pasa (exit 0, VERIFY OK) sin cambios en las pruebas.
- Sigue: tramo 2 (lanzadores Codex y compactación por agente), que incluye la prueba real de A2 con `codex exec`.
- Decisión menor: la regla de comandos largos se añadió también en `skills/ejecutar-plan/SKILL.md` (el plan la pide para ambos).

- Revisión tramo 2 (principal, 2026-11-09): pruebas propias con `codex exec` (luna, low). El constructor contó 3 llamadas con `yield_time_ms` de 30 s, así que la clave `background_terminal_max_timeout` NO hizo esperar de una vez. `exec_command` con `yield_time_ms` 120000 devolvió a los ~30 s; `write_stdin` con 150000 a los ~37 s. Lo que sí funciona (sin la clave): un `exec_command` en una celda `exec` y UNA llamada `wait` con el `cell_id` y `yield_time_ms: 300000`: `sleep 150` en 2 llamadas del modelo, 160 s en total. Texto de constructor, ejecutar-plan y principal corregido a ese mecanismo. La clave queda en los lanzadores por ser inocua, pero no es lo que ahorra; cualquier cambio de ella queda fuera de este plan.

Tramo 3 (medidor y cierre):

$ ./verify
 no se leen ni aparecen en texto ni en JSON
ok A6: Calibración de cuota: sesiones exclusivas sin baja, puntos y tokens, aviso de muestra pequeña
ok A6b: Calibración: la sesión que baja queda fuera también sin la cruzada
ok A3s: Sesiones de Codex: esperas, contexto mediana y máximo, compactación por caída del 40 %; sin esperas da 0
ok A8: Sesiones de Claude Code y de Pi: esperas, contexto mediana y máximo, compactación por caída del 40 %; sin esperas da 0; sin --herramienta salen las tres
ok A7: Cuota de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
ok A2v: Ventana de 5 horas de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
ok A5a: Créditos y sondeos de Codex con la tarifa de scripts/tarifas.json
ok A5b: Créditos y sondeos de Pi con tarifa de fixture; una tarifa distinta cambia creditos (sensibilidad)
ok A5c: Sin tarifa del modelo, creditos es null (no 0); los sondeos se miden igual; tarifas.json trae las tres tarifas
ok A5d: Tarifas ilegibles avisan y dejan creditos en null sin salir con error
pruebas del medidor: 18 de 18 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

$ node pruebas/uso/probar.mjs
pruebas del medidor: 18 de 18 ok
exit 0

Tramo 3 (medidor y cierre), cierre:
- Quedó: `scripts/tarifas.json` con las tres tarifas del plan; `uso.mjs --sesiones` da `creditos` (Codex y Pi; `null` sin tarifa o en Claude Code) y `sondeos` (Claude Code `null`); texto de la tabla con las dos columnas nuevas; fixtures `codex-sondeos`, `pi-sondeos` y `tarifas-prueba.json`; pruebas A5a a A5d; `costos.md` con «Créditos y espera» y `AGENTS.md` línea 20.
- Decisión menor: las tarifas se toman del plan aprobado. En esta corrida no se consultó la fuente en línea; la fecha 2026-11-09 es la de la corrida, no la de publicación de la tarifa. Antes de usarlas para decidir, verificarlas en `learn.chatgpt.com/codex/pricing`.
- Decisión menor: se añadió la opción `--tarifas <archivo>` (no estaba en el plan) para que la prueba de sensibilidad A5b cambie la tarifa sin tocar `scripts/tarifas.json`. Sin ella no hay forma de probar la sensibilidad con fixtures.
- Definición de sondeo: llamadas de shell cuyo comando contiene `sleep`, `tail` o `watch` como palabra, y llamadas cuyo nombre es `sleep`, `tail` o `watch`. «Consultas de estado» no se mide aparte; `git status` no cuenta. Es una aproximación: `grep sleep` también cuenta.
- Decisión menor: en Pi, la caché escrita se cobra a tarifa de entrada (la de Codex no tiene caché escrita). Documentado en el código, no en `costos.md`.
- Pruebas existentes: solo se añadieron campos `creditos` y `sondeos` a las expectativas de A3s y A8 (con valores calculados a mano: null y 1 o 0). No se quitó ni se debilitó ninguna prueba.
- Límite del «después»: `costos.md` deja el antes con el registro del 8 y 9 de noviembre y el después como pendiente, porque no hay sesiones nuevas medidas. No se estimó ningún ahorro.
- Incidente menor: un comando mío con `bash -c` fue denegado por la regla deny del proyecto. No se reintentó ni se usó otra forma para saltarla.
- `./verify` pasa (exit 0, VERIFY OK) con las pruebas nuevas.
