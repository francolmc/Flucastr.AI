---
estado: listo
rama: feature/medidor-costos
base: main
repos: [.]
ejecutor: constructor
tramo: 2
---
# Medidor de costos y calibración de modelos

## Objetivo
Franco puede correr `node scripts/uso.mjs` y ver cuánto consumen Claude Code, Codex y Pi por día, proyecto y modelo, y cuántos puntos de cuota semanal de Codex cuesta cada modelo. Con eso se decide qué modelo usa cada agente en `modelos.json`.

## Supuestos
- Solo lectura y sin dependencias: Node estándar, como `scripts/resolver.mjs`. Si Franco quiere un lanzador instalado (`uso`), se agrega un paso a `instalar.sh`.
- «Día» = fecha UTC del primer evento de la sesión (así se hizo el análisis previo). Si Franco quiere hora de Chile, cambia un cálculo.
- No se calcula dinero: solo tokens y puntos de cuota; no hay tarifas conocidas.
- `modelos.json` se edita solo en el tramo 3, con el valor concreto que Franco apruebe tras leer el informe del tramo 2 (Resuelto: 2026-11-09 Franco eligió el tramo 3 en vez de editarlo a mano).

## Alcance
Puede cambiar: `scripts/uso.mjs` (nuevo), `pruebas/uso/` (nuevo: `probar.mjs` y `fixtures/`), `verify` (paso 12 nuevo, antes de la línea `VERIFY OK`), `docs/evaluaciones/costos.md` (nuevo), `AGENTS.md` (una línea), `.gitignore` (excepción para `pruebas/uso/`).
Tramo 3 (solo tras ver el informe del tramo 2): `modelos.json`.
Fuera de alcance: `instalar.sh`, agentes, skills, `old/`.
Prohibido leer `auth.json`, `.env` o cualquier archivo fuera de las carpetas de sesiones indicadas abajo.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los requisitos y formatos están escritos abajo, los datos son accesibles y no toca credenciales ni despliegue.
- Formatos (comprobados en esta máquina):
  - Claude Code: `~/.claude/projects/<dir>/**/*.jsonl` (incluye `subagents/`, rol `sub`). Línea con `message.usage` (`input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`), `message.model`, `message.id`, `requestId`, `timestamp`. Se cuenta una vez cada par (`message.id`,`requestId`). Proyecto = `<dir>` sin el prefijo `-home-<usuario>-Codes-`.
  - Codex: `~/.codex/sessions/AAAA/MM/DD/rollout-*.jsonl`. `session_meta.payload.cwd` da el proyecto (último tramo de la ruta); `turn_context.payload.model` el modelo. Eventos `payload.type == "token_count"` con `payload.info.total_token_usage` (acumulado: vale el último de la sesión: `input_tokens`, `cached_input_tokens`, `output_tokens`, `total_tokens`) y `payload.rate_limits.secondary.used_percent` (cuota semanal). Llamadas = cantidad de eventos `token_count` con `info`.
  - Pi: `~/.pi/agent/sessions/<dir>/**/*.jsonl` (incluye `subagent-artifacts`). Líneas con `message.role == "assistant"`: `message.usage` (`input`, `output`, `cacheRead`, `cacheWrite`), `message.model`, `timestamp`. Si `stopReason == "error"` y `errorMessage` contiene «usage limit», cuenta como aviso de límite.
- Rendimiento: leer cada archivo por streaming y saltar los archivos con mtime anterior a `--desde` (una prueba previa con Python tardó más de 2 min en Pi).
- Interfaz: `--desde AAAA-MM-DD` (por defecto hace 7 días), `--herramienta claude|codex|pi`, `--proyecto <subcadena>`, `--json`, `--claude-dir`, `--codex-dir`, `--pi-dir`. Si ninguna carpeta existe: mensaje y exit 1; si falta alguna: aviso y sigue. Líneas JSON corruptas se ignoran.
- Salida `--json`: `{"filas":[{"herramienta","fecha","proyecto","modelo","rol","sesiones","llamadas","entrada","cache_leida","cache_escrita","salida"}],"cuota":[{"modelo","puntos","tokens","sesiones"}],"avisos":[...]}`. «entrada» excluye lo leído de caché. Sin `--json`, tablas de texto con las mismas columnas.
- Calibración: solo sesiones Codex *exclusivas* (su intervalo primer–último evento no se cruza con otra sesión de Codex), con `used_percent` inicial y final no nulos y sin bajar (si baja hubo reinicio: se descarta). `puntos` = final − inicial; `tokens` = `total_tokens` final. Se agrupa por modelo. Si un modelo tiene menos de 5 sesiones, agregar aviso «muestra pequeña».

## Escenarios
- CUANDO un log de Claude repite el mismo `message.id` y `requestId` ENTONCES se cuenta una sola vez y el subagente sale con rol `sub` (A1)
- CUANDO una sesión de Codex tiene varios `token_count` ENTONCES se usa el último acumulado y las llamadas son todos los eventos (A2)
- CUANDO Pi tiene un mensaje de error por límite ENTONCES sale como aviso y no suma tokens (A3)
- CUANDO hay líneas corruptas, archivos anteriores a `--desde` o una carpeta ausente ENTONCES se ignoran o avisan y el resto se suma bien (A4)
- CUANDO la carpeta de Codex trae un `auth.json` ENTONCES su contenido nunca aparece ni se lee (A5)
- CUANDO una sesión de Codex ve la cuota bajar o se cruza con otra ENTONCES se excluye de la calibración (A6)
- CUANDO se corre sobre los logs reales de Franco ENTONCES los totales coinciden con el análisis previo (A7)
- CUANDO se corre `./verify` ENTONCES el paso 12 pasa y falla si el medidor se rompe (A8)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Dedupe y rol sub en Claude | `node pruebas/uso/probar.mjs` sobre `fixtures/claude` (un mensaje duplicado, un subagente) | salida sumada = valores del fixture; con el duplicado contado dos veces el test falla (sensibilidad: el test compara contra el total sin duplicar) |
| A2 | Último acumulado en Codex | mismo script, `fixtures/codex` con 3 eventos en una sesión | `salida`, `cache_leida` y `llamadas=3` del último/total esperado |
| A3 | Pi: suma y aviso | mismo script, `fixtures/pi` con 2 mensajes y 1 error | tokens de los 2 mensajes; `avisos` con 1 línea de límite |
| A4 | Robustez | fixture con línea corrupta, archivo viejo (mtime antiguo con `touch -d`) y `--claude-dir` inexistente | exit 0, solo cuenta lo válido, aviso por la carpeta ausente; con todas ausentes exit 1 |
| A5 | No lee credenciales | fixture codex con `auth.json` que contiene `SECRETO-NO-LEER`; revisión manual: `grep -n "auth.json\|\.env" scripts/uso.mjs` | la salida (texto y JSON) no contiene `SECRETO-NO-LEER`; el grep no muestra lecturas de esos archivos |
| A6 | Calibración válida | fixture con 6 sesiones: 4 exclusivas válidas, 1 con cuota que baja, 1 que se cruza | `cuota` cuenta 4 sesiones y suma los puntos esperados; la que baja y la cruzada no entran; `muestra pequeña` aparece (n<5) |
| A7 | Coincide con lo real | `node scripts/uso.mjs --herramienta codex --desde 2026-11-08 --proyecto Memory-AI --json` | para 2026-11-08: coincide con un cálculo independiente hecho en ese momento (Python sobre los mismos logs, entrada, caché leída, salida y llamadas); referencia del 2026-11-09: 10 sesiones, 1113 llamadas, salida ≈256k. Los logs crecen mientras Franco trabaja, por eso se compara contra el cálculo del momento |
| A8 | Paso 12 de verify | `./verify` | termina en `VERIFY OK`; con `scripts/uso.mjs` roto a propósito el paso 12 falla |

## Verificación
`./verify` — define «hecho» (el paso 12 corre `node pruebas/uso/probar.mjs`).

## Pasos
### Tramo 1: medidor
Resultado: `node scripts/uso.mjs --json` funciona sobre fixtures de las tres herramientas. Toca `scripts/uso.mjs`, `pruebas/uso/`.
- [x] Crear `pruebas/uso/fixtures/{claude,codex,pi}` con logs sintéticos mínimos en los formatos de *Decisiones*, con totales conocidos (A1, A2, A3)
  - evidencia: `pruebas/uso/fixtures/claude/-home-test-Codes-proyecto-a/sesion-1.jsonl`, `pruebas/uso/fixtures/claude/-home-test-Codes-proyecto-a/sesion-1/subagents/agente-1.jsonl`, `pruebas/uso/fixtures/pi/--home-test-Codes-proyecto-b--/sesion-pi-1.jsonl`, `pruebas/uso/fixtures/codex/sessions/2026/11/08/rollout-2026-11-08T14-00-00-fixture-proyecto-c.jsonl` y `pruebas/uso/fixtures/codex/auth.json`
- [x] Escribir `scripts/uso.mjs`: parseo de opciones y lectura por streaming de las tres herramientas (A1, A2, A3)
  - evidencia: `scripts/uso.mjs` creado; `node --check scripts/uso.mjs`, exit 0
- [x] Agregar dedupe (id + requestId), rol `sub`, saltar archivos por mtime y tolerar líneas corruptas y carpetas ausentes (A1, A4)
  - evidencia: `scripts/uso.mjs` (clave `id|requestId`, rol `sub` si un segmento empieza por `subagent`, filtro por mtime, `JSON.parse` con descarte por línea, aviso por carpeta ausente); `node pruebas/uso/probar.mjs`: A1, A4a y A4b en ok (ver *Evidencia*)
- [x] Agregar la salida `--json` y la de texto (A1, A2, A3)
  - evidencia: `node scripts/uso.mjs --desde 2026-01-01 --claude-dir pruebas/uso/fixtures/claude --codex-dir pruebas/uso/fixtures/codex --pi-dir pruebas/uso/fixtures/pi`, exit 0 (salida de texto en *Evidencia*)
- [x] Escribir `pruebas/uso/probar.mjs`: corre el script sobre los fixtures y compara con totales esperados; incluir los casos de A4 y A5 (A1–A5)
  - evidencia: `pruebas/uso/probar.mjs`; `node pruebas/uso/probar.mjs`, exit 0 (ver *Evidencia*)
- [x] Agregar «paso 12» a `verify` que corre `node pruebas/uso/probar.mjs` (A8)
  - evidencia: `verify` (bloque `# 12.` antes de `VERIFY OK`); `bash -n verify`, exit 0; el comando del paso 12, exit 0 (ver *Evidencia*)
- [x] Comprobar sensibilidad: duplicar un mensaje en un fixture temporal y ver que el test falla (A1)
  - evidencia: con una copia del medidor sin dedupe en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/sens/uso-sin-dedupe.mjs`, `node pruebas/uso/probar.mjs --script <esa copia>` falla A1, exit 1; con un mensaje duplicado extra en un fixture temporal, el medidor real pasa, exit 0 (ver *Evidencia*)

Verificación del tramo: `node pruebas/uso/probar.mjs` (A1–A5).

### Tramo 2: calibración e informe
Resultado: `cuota` en la salida, validada con fixtures y con los logs reales, e informe en `docs/evaluaciones/costos.md`. Toca `scripts/uso.mjs`, `pruebas/uso/`, `docs/evaluaciones/costos.md`, `AGENTS.md`.
- [x] `.gitignore` ignora `pruebas/` entero y `pruebas/uso/` no entra en git: cambiar la línea `pruebas/` por `pruebas/*`, `!pruebas/uso/` y `!pruebas/contrato-constructor.mjs`; comprobar con `git status --short pruebas` que `pruebas/uso/` aparece y `git check-ignore pruebas/.temporales` lo ignora (A8)
  - evidencia: `.gitignore` (líneas 2–4: `pruebas/*`, `!pruebas/uso/`, `!pruebas/contrato-constructor.mjs`); `git status --short pruebas` muestra `?? pruebas/uso/` (antes: vacío); `git check-ignore -v pruebas/.temporales` → `.gitignore:2:pruebas/*`, exit 0
- [x] Crear fixture `fixtures/codex-cuota` con las 6 sesiones de A6 (A6)
  - evidencia: `pruebas/uso/fixtures/codex-cuota/sessions/2026/11/08/` con 6 rollouts: `cuota-a`, `cuota-b`, `cuota-c`, `cuota-d` (válidas, sin cruce, sin baja: 3 + 2,5 + 1 + 4 = 10,5 puntos; 5000 + 3000 + 1000 + 8000 = 17000 tokens), `cuota-baja` (50 a 45, se cruza con `cuota-cruzada` 13:10–13:40 y baja) y `cuota-cruzada` (62 - 60 = 2, se cruza con `cuota-baja`)
- [x] Implementar `cuota`: sesiones exclusivas, sin baja de cuota, agrupadas por modelo, aviso `muestra pequeña` (A6)
  - evidencia: `scripts/uso.mjs` (`procesarCodex` reúne todas las sesiones de Codex; `calcularCuota` aplica exclusividad, sin baja, agrupa por modelo y avisa si hay menos de 5); `node scripts/uso.mjs --desde 2026-01-01 --herramienta codex --codex-dir pruebas/uso/fixtures/codex-cuota`, exit 0:
    ```
    cuota semanal de Codex (puntos = % de la cuota secundaria; solo sesiones exclusivas)
    modelo             puntos  tokens  sesiones
    gpt-cuota-fixture  10.5    17000   4
    aviso: Codex: muestra pequeña para gpt-cuota-fixture (4 sesiones; se recomiendan 5 o más)
    exit 0
    ```
- [x] Agregar los casos de A6 a `probar.mjs` y comprobar que una sesión que baja o se cruza hace fallar el test si entrara (A6)
  - evidencia: `pruebas/uso/probar.mjs` (A6, A6b; A3 cuenta ahora solo los avisos de límite). `node pruebas/uso/probar.mjs`, exit 0: `pruebas del medidor: 10 de 10 ok` (A6: `ok A6: Calibración de cuota: sesiones exclusivas sin baja, puntos y tokens, aviso de muestra pequeña`; A6b: `ok A6b: Calibración: la sesión que baja queda fuera también sin la cruzada`). Sensibilidad con copias en el scratchpad de `scripts/uso.mjs` sin el control de cruce (`if (cruza) continue;` quitado): `FALLO A6`, `FALLO: 1 de 10 pruebas del medidor no pasaron`, exit 1. Sin el control de baja (`if (s.cuotaFinal < s.cuotaInicial) continue;` quitado): `FALLO A6b`, `FALLO: 1 de 10 pruebas del medidor no pasaron`, exit 1. A6 pasa sin el control de baja porque la sesión que baja se cruza con la otra: por eso A6b la prueba sola
- [x] Correr el comando de A7 sobre los logs reales (solo lectura) y anotar la salida en *Evidencia* (A7)
  - evidencia: `node scripts/uso.mjs --herramienta codex --desde 2026-11-08 --proyecto Memory-AI --json`, exit 0. Suma de las filas del día 2026-11-08 (gpt-6-luna 7 sesiones, gpt-6.1-sol 3): sesiones=10, llamadas=1121, entrada=1531168, cache_leida=110778624, salida=258524. Cálculo independiente en el mismo momento con `python3 -I` sobre `~/.codex/sessions/**/rollout-*.jsonl` (script en el scratchpad, `a7/independiente.py`): sesiones=10, llamadas=1121, entrada=1531168, cache_leida=110778624, salida=258524, exit 0. Coinciden. Ver *Evidencia*
- [x] Correr `node scripts/uso.mjs --herramienta codex --desde 2026-11-01 --json` y escribir `docs/evaluaciones/costos.md`: hallazgos, tabla de puntos por millón de tokens por modelo, tamaño de muestra y una recomendación para `modelos.json` marcada como sugerencia (A7)
  - evidencia: `node scripts/uso.mjs --herramienta codex --desde 2026-11-01 --json`, exit 0 (salida en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/a7/informe-desde-11-01.json`); `docs/evaluaciones/costos.md` escrito. Resumen: gpt-6-luna 4 sesiones exclusivas, 587306 tokens, 0 puntos (muestra pequeña, no informativo); gpt-6.1-sol sin sesiones exclusivas. Recomendación: no cambiar `modelos.json` todavía (sugerencia)
- [x] Agregar a `AGENTS.md` una línea que apunte a `scripts/uso.mjs` y a `docs/evaluaciones/costos.md` (A8)
  - evidencia: `AGENTS.md` línea 21 (`Medidor de costos (solo lectura): ...`), apunta a `scripts/uso.mjs` y `docs/evaluaciones/costos.md`
- [x] Correr `./verify` completo (≈ varios min) y anotar el resultado (A8)
  - evidencia: `./verify`, exit 0 (27 s; cola en *Evidencia*, Tramo 2)

Verificación del tramo: `./verify` (A6–A8).

### Tramo 3: aplicar la calibración (se detalla tras el tramo 2)
Resultado: `modelos.json` con los niveles o esfuerzos aprobados por Franco y `./verify` verde. Los pasos y la comprobación se escriben cuando exista el informe; el constructor no arranca este tramo sin ellos y sin `estado: aprobado`.

## Evidencia
Tramo 1 (salidas reales de esta sesión):

$ node pruebas/uso/probar.mjs
ok A1: Claude: mensaje duplicado contado una vez y subagente con rol sub
ok A2: Codex: último total acumulado, llamadas = eventos con info, filtro por herramienta
ok A3: Pi: suma de 2 mensajes, error por límite fuera de los tokens y 1 aviso
ok A4a: Robustez: línea corrupta (en el fixture) y archivo con mtime antiguo ignorados
ok A4b: Robustez: carpeta de Claude ausente avisa y el resto se suma
ok A4c: Robustez: con todas las carpetas ausentes sale con código 1
ok A4d: Opciones inválidas salen con código 2
ok A5: Credenciales de Codex: no se leen ni aparecen en texto ni en JSON
pruebas del medidor: 8 de 8 ok
exit 0

$ node scripts/uso.mjs --desde 2026-01-01 --claude-dir pruebas/uso/fixtures/claude --codex-dir pruebas/uso/fixtures/codex --pi-dir pruebas/uso/fixtures/pi
herramienta  fecha       proyecto    modelo                 rol   sesiones  llamadas  entrada  cache_leida  cache_escrita  salida
claude       2026-11-08  proyecto-a  claude-haiku-fixture   sub   1         1         10       0            0              5
claude       2026-11-08  proyecto-a  claude-sonnet-fixture  main  1         2         130      1500         200            70
codex        2026-11-08  proyecto-c  gpt-codex-fixture      main  1         3         1500     1500         0              450
pi           2026-11-08  proyecto-b  modelo-pi-fixture      main  1         2         600      300          10             180
aviso: Pi: límite de uso alcanzado en proyecto-b (2026-11-08T12:03:00.000Z); no suma tokens
exit 0

$ grep -n "auth.json\|\.env" scripts/uso.mjs
(sin líneas)
exit 1

$ bash -n verify
exit 0

$ node --check scripts/uso.mjs && node --check pruebas/uso/probar.mjs
exit 0

$ node pruebas/uso/probar.mjs >/dev/null && echo "ok 12: pruebas del medidor pasaron sobre los fixtures"   (paso 12 de verify)
ok 12: pruebas del medidor pasaron sobre los fixtures
exit 0

Sensibilidad (paso 7). Copias en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/sens/`:

$ node pruebas/uso/probar.mjs --fixtures .../sens/fx        (fixture con un mensaje duplicado extra; medidor real)
pruebas del medidor: 8 de 8 ok
exit 0

$ node pruebas/uso/probar.mjs --script .../sens/uso-sin-dedupe.mjs        (fixtures originales)
FALLO A1: Claude: mensaje duplicado contado una vez y subagente con rol sub
FALLO: 2 de 8 pruebas del medidor no pasaron
exit 1

$ node pruebas/uso/probar.mjs --script .../sens/uso-sin-dedupe.mjs --fixtures .../sens/fx
FALLO A1: Claude: mensaje duplicado contado una vez y subagente con rol sub
FALLO A4a: Robustez: línea corrupta (en el fixture) y archivo con mtime antiguo ignorados
FALLO: 2 de 8 pruebas del medidor no pasaron
exit 1

Verificación del tramo: `node pruebas/uso/probar.mjs` (A1–A5), exit 0. `./verify` completo se corre en el tramo 2.

Tramo 2 (salidas reales de esta sesión):

$ node pruebas/uso/probar.mjs
ok A1: Claude: mensaje duplicado contado una vez y subagente con rol sub
ok A2: Codex: último total acumulado, llamadas = eventos con info, filtro por herramienta
ok A3: Pi: suma de 2 mensajes, error por límite fuera de los tokens y 1 aviso
ok A4a: Robustez: línea corrupta (en el fixture) y archivo con mtime antiguo ignorados
ok A4b: Robustez: carpeta de Claude ausente avisa y el resto se suma
ok A4c: Robustez: con todas las carpetas ausentes sale con código 1
ok A4d: Opciones inválidas salen con código 2
ok A5: Credenciales de Codex: no se leen ni aparecen en texto ni en JSON
ok A6: Calibración de cuota: sesiones exclusivas sin baja, puntos y tokens, aviso de muestra pequeña
ok A6b: Calibración: la sesión que baja queda fuera también sin la cruzada
pruebas del medidor: 10 de 10 ok
exit 0

Sensibilidad de A6 (copias en el scratchpad, `sens-cuota/`):

$ node pruebas/uso/probar.mjs --script <scratchpad>/sens-cuota/uso-sin-cruce.mjs
FALLO A6: Calibración de cuota: sesiones exclusivas sin baja, puntos y tokens, aviso de muestra pequeña
ok A6b: Calibración: la sesión que baja queda fuera también sin la cruzada
FALLO: 1 de 10 pruebas del medidor no pasaron
exit 1

$ node pruebas/uso/probar.mjs --script <scratchpad>/sens-cuota/uso-sin-baja.mjs
ok A6: Calibración de cuota: sesiones exclusivas sin baja, puntos y tokens, aviso de muestra pequeña
FALLO A6b: Calibración: la sesión que baja queda fuera también sin la cruzada
FALLO: 1 de 10 pruebas del medidor no pasaron
exit 1

Paso 12 con `scripts/uso.mjs` roto a propósito (sintaxis, `node --check` falla; restaurado y comparado byte a byte con el respaldo):

$ node pruebas/uso/probar.mjs
FALLO: 10 de 10 pruebas del medidor no pasaron
exit 1

A7 (logs reales de Codex, solo lectura):

$ node scripts/uso.mjs --herramienta codex --desde 2026-11-08 --proyecto Memory-AI --json
(filas del día 2026-11-08: gpt-6-luna 7 sesiones y gpt-6.1-sol 3 sesiones; suma)
sesiones=10 llamadas=1121 entrada=1531168 cache_leida=110778624 salida=258524
cuota: [{"modelo":"gpt-6-luna","puntos":0,"tokens":15618,"sesiones":1}]
avisos: ["Codex: muestra pequeña para gpt-6-luna (1 sesiones; se recomiendan 5 o más)"]
exit 0

$ python3 -I <scratchpad>/a7/independiente.py 2026-11-08 Memory-AI
sesiones=10 llamadas=1121 entrada=1531168 cache_leida=110778624 salida=258524
exit 0

Informe (`docs/evaluaciones/costos.md`):

$ node scripts/uso.mjs --herramienta codex --desde 2026-11-01 --json
cuota: [{"modelo":"gpt-6-luna","puntos":0,"tokens":587306,"sesiones":4}]
avisos: ["Codex: muestra pequeña para gpt-6-luna (4 sesiones; se recomiendan 5 o más)"]
exit 0

Verificación final del tramo (cola):

$ ./verify
== 12. medidor de costos: pruebas de scripts/uso.mjs sobre fixtures ==
ok A6: Calibración de cuota: sesiones exclusivas sin baja, puntos y tokens, aviso de muestra pequeña
ok A6b: Calibración: la sesión que baja queda fuera también sin la cruzada
pruebas del medidor: 10 de 10 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

## Notas
- Al escribir el plan `git fetch` falló (sin red); no se pudo confirmar que `main` esté al día con `origin/main`. Revisar antes de crear la rama.
- Rama (paso 2): el encargo trae `Rama: feature/medidor-costos`. Ya existía y era la rama actual, en el mismo commit que `main` (2e4cc3d). No se creó nada. Sin fetch (el agente no lo tiene permitido); `main` y `origin/main` coinciden en las referencias locales.
- Decisión para Franco o el principal (fuera de Alcance, no lo toqué): `.gitignore` tiene `pruebas/` (línea 2) y `git status` no muestra `pruebas/uso/`. Sin cambio, el commit no incluye fixtures ni `probar.mjs`, y el paso 12 falla en un clon limpio. Opciones: `git add -f pruebas/uso` al commitear, o una excepción `!pruebas/uso/` en `.gitignore` en otro cambio.
- Sensibilidad: un mensaje duplicado en un fixture no hace fallar al medidor real (la dedupe lo cuenta una vez, que es lo correcto). La sensibilidad se comprobó con una copia del medidor sin dedupe, que falla A1.
- Decisiones menores: `--claude-dir` y `--pi-dir` apuntan a la carpeta de proyectos. `--codex-dir` apunta a la carpeta de Codex y solo se recorren `sessions/rollout-*.jsonl`. El día de cada sesión es el primer evento en UTC, en las tres herramientas. En Pi, un error «usage limit» da aviso y no suma llamadas ni tokens. `cuota` sale `[]` hasta el tramo 2.
- Contador canónico: 7 pendientes en el plan, todos del Tramo 2. El Tramo 1 queda en 0.
- Para el tramo 2 (A7), sin tocar nada: con `--herramienta codex --desde 2026-11-08 --proyecto Memory-AI`, el 2026-11-08 da 10 sesiones (esperado ≈10), 1106 llamadas (esperado ≈1016, +9 %) y 255022 de salida (esperado ≈240k, +6 %). Puede venir del crecimiento de los logs desde el análisis previo. Hay que revisarlo al correr A7.
- Tramo 2, `.gitignore`: `pruebas/*`, `!pruebas/uso/` y `!pruebas/contrato-constructor.mjs`. Así se resuelve la decisión del Tramo 1 (excepción en `.gitignore`). Revisar antes del commit: `pruebas/uso/fixtures/codex/auth.json` contiene la cadena falsa `SECRETO-NO-LEER` y entra en git; es un fixture de A5, no una credencial real.
- Pendientes: el Tramo 2 tenía 8 casillas, no 7 como decía la nota anterior. El contador canónico da 8 al empezar y 0 al terminar.
- Cuota: el control de cruce mira todas las sesiones de Codex de la carpeta, también las de otros proyectos y las anteriores a `--desde`, porque todas gastan la misma cuota. `--proyecto` filtra solo lo que sale.
- A3 (Tramo 1) cambió: ahora cuenta solo los avisos de límite. El fixture de Codex de una sesión produce el aviso nuevo de muestra pequeña, y el aviso de límite sigue saliendo exactamente una vez.
- A6: en el fixture de 6 sesiones, la que baja se cruza con la cruzada, así que sin el control de baja A6 sigue pasando. Por eso se agregó A6b (la misma prueba sin la cruzada): esa sí falla sin el control de baja. Las dos sensibilidades quedaron en *Evidencia*.
- A7: al principio parecía que no coincidían (7 contra 10 sesiones). Era un error de mi consulta, que tomaba solo la primera fila del día; el medidor agrupa por modelo. Sumando las filas coincide exacto con Python en el mismo momento. Sin cambios en el medidor por esto.
- Las cifras de la nota anterior (1106 llamadas, 255022 de salida) eran de otro momento. Ahora: 1121 llamadas y 258524 de salida, con el cálculo independiente en el mismo momento. La referencia de A7 para 2026-11-09 (1113 llamadas, ≈256k) queda cerca; la diferencia parece crecimiento de los logs, sin comprobarlo.
- Hallazgos del informe: `used_percent` avanza en pasos de 1 punto, y la cuota se reinició entre 22:07 y 23:00 UTC del 2026-11-08. Con muchas sesiones solapadas, la calibración necesita trabajo en serie.
- `modelos.json` no se tocó. El informe recomienda no cambiarlo todavía; el tramo 3 espera la aprobación de Franco.
- Git: rama `feature/medidor-costos` ya activa, no se creó nada. No hice commit ni push. Quedó un `git fetch` sin hacer, como en el Tramo 1.
- Cierre 2026-11-09: Franco cerró el cambio sin el tramo 3. La muestra exclusiva de cuota fue insuficiente (ver `docs/evaluaciones/costos.md`); `modelos.json` no se tocó. Se retoma con sesiones de Codex en serie o con otro método de calibración.
