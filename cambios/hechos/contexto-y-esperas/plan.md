---
estado: listo
rama: feature/contexto-y-esperas
base: main
repos: [.]
ejecutor: constructor
tramo: 3
---
# Menos contexto y menos esperas en Codex; planes grandes en archivos

## Objetivo
Una sesión de Codex del kit no relee 120k+ tokens en cada llamada de espera: el contexto se compacta, el principal espera con pocas llamadas largas, y un plan grande se reparte en archivos por tramo con compactación al cerrar cada uno.

## Supuestos
- Evidencia (sesión de Memory-AI del 2026-11-08): 224 llamadas, 27,8M de tokens, 9 puntos de cuota; contexto mediana 123k, máximo 192k, 0 compactaciones; 81 `wait_agent` (45 s), 27 `send_message` y 10 esperas más, más de la mitad de las llamadas.
- La docs de Codex (resumen, no literal) listan `model_auto_compact_token_limit` y `model_post_turn_compact_threshold_percent` en `config.toml`, no en el TOML de un agente; no dicen si valen en `.codex/config.toml` ni el timeout de `wait_agent`. Por eso el tramo 1 lo prueba antes de tocar el instalador.
- Un agente no puede invocar `/compact` (la docs no lo dice). Si Franco quiere compactación 100 % automática, depende de lo que pruebe el tramo 1.
- Planes grandes: umbral «más de 3 tramos o más de ≈8 KB». Si Franco prefiere otro, cambia una cifra.

## Alcance
Puede cambiar: `scripts/uso.mjs`, `pruebas/uso/`, `instalar.sh` (solo `generar_lanzador_codex` y lo que escriba ajustes de Codex), `scripts/resolver.mjs` (solo para leer `compactar_en`), `agentes/principal.md`, `agentes/constructor.md`, `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `verify` (pasos nuevos y `TEXTOS_TRAMOS`), `docs/investigaciones/codex-compactacion.md` (nuevo), `AGENTS.md`.
Fuera de alcance: `modelos.json`, `~/.codex/config.toml` real de Franco (solo se prueba con `CODEX_HOME` temporal), `old/`.
Prohibido leer `auth.json`, `.env`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque cada paso trae comando y resultado esperado y no toca credenciales ni despliegue.
- Los lanzadores `codex-<agente>` ya usan `-c clave=valor`; si la prueba confirma que `-c model_auto_compact_token_limit=<compactar_en>` funciona, se usa eso (no se edita el `config.toml` global de Franco).
- Resuelto: 2026-11-09 (tramo 1, `docs/investigaciones/codex-compactacion.md`) `-c model_auto_compact_token_limit=<compactar_en>` compacta; `.codex/config.toml` de proyecto no surte efecto; `model_post_turn_compact_threshold_percent` solo compacta si el contexto pasa ese % de la ventana (no se usa). El ajuste va solo en el lanzador `codex-<agente>`.
- El valor sale de `compactar_en` de `modelos.json` (hoy 100000); no se duplica.
- Esperas: el principal espera al constructor con una sola espera larga y no pregunta estado con `send_message`; si el plan es pesado ofrece `codex-constructor` (ventana propia).
- Plan en archivos: `plan.md` queda como índice corto; cada tramo grande vive en `tramo-N.md` en la misma carpeta, con sus pasos, `Verificación del tramo:` y su evidencia. El constructor lee `plan.md` y solo `tramo-<n>.md`.
- Al cerrar cada tramo el principal deja en *Notas* del `plan.md` un resumen de 5 líneas (qué quedó, qué sigue) y pide a Franco compactar (`/compact`) o abrir sesión nueva con `Plan: <ruta>`.

## Escenarios
- CUANDO se prueba Codex con un umbral de compactación bajo ENTONCES queda registrada la compactación y se sabe en qué configuración funciona (A1)
- CUANDO se genera el lanzador `codex-<agente>` ENTONCES lleva el umbral tomado de `compactar_en` y reinstalar no lo duplica (A2)
- CUANDO el medidor analiza una sesión de Codex ENTONCES muestra llamadas de espera, contexto mediana/máximo y compactaciones (A3)
- CUANDO el principal lanza al constructor ENTONCES sus textos mandan esperar una sola vez y no consultar con `send_message` (A4)
- CUANDO un plan es grande ENTONCES la skill pide tramos en `tramo-N.md` y el constructor lee solo el suyo (A5)
- CUANDO se corre `./verify` ENTONCES pasa y falla si falta alguno de los textos nuevos (A6)
- CUANDO la cuota semanal de Codex pasa del umbral ENTONCES el medidor avisa, y si no, no avisa (A7)
- CUANDO una herramienta devuelve una salida larga ENTONCES la regla manda mostrar solo la cola y los errores (A8)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Prueba real de compactación documentada | `codex exec -c model_auto_compact_token_limit=3000 "<tarea de 4 pasos con shell>"` en una carpeta temporal (con el `CODEX_HOME` real; no copiar ni leer `auth.json`) y buscar en su rollout un evento de compactación; repetir con `model_post_turn_compact_threshold_percent` | `docs/investigaciones/codex-compactacion.md` dice qué ajuste funcionó, con el evento citado; si ninguno, lo dice |
| A2 | Lanzador con umbral | `HOME` temporal, `bash instalar.sh` y `grep -c model_auto_compact_token_limit` en `codex-constructor`; reinstalar y repetir | exactamente 1 aparición, con el valor de `compactar_en`; con `compactar_en` ausente no aparece |
| A3 | Diagnóstico de sesión | `node scripts/uso.mjs --sesiones --herramienta codex --json` sobre un fixture con 5 esperas y una caída de contexto | `esperas=5`, `compactaciones=1`, `contexto_mediana` y `contexto_max` del fixture; sin esperas da 0 |
| A4 | Texto de espera | `grep -n` en `agentes/principal.md` de «una sola espera» y «send_message» | ambas frases presentes; revisión manual: la regla dice que no se pregunta estado |
| A5 | Plan en archivos | `grep -n` de `tramo-` en `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md` y `agentes/constructor.md` | los tres lo mencionan; la skill fija el umbral y el resumen de cierre de tramo |
| A6 | Verify | `./verify` | `VERIFY OK`; quitar una de las frases nuevas de una copia hace fallar el paso con su mensaje |
| A7 | Alerta de cuota | `node scripts/uso.mjs --herramienta codex --json` sobre dos fixtures: último `used_percent` 85 y 40 (umbral por defecto 70, opción `--umbral`) | con 85 `avisos` trae «Cuota semanal de Codex en 85 %»; con 40 no trae ese aviso; sin dato de cuota tampoco |
| A8 | Salidas cortas | `grep -n "cola" skills/ejecutar-plan/SKILL.md agentes/constructor.md` | ambos traen la regla: salidas largas (build, verify, listados) se muestran por la cola y los errores, no completas |

## Verificación
`./verify` — define «hecho».

## Pasos
### Tramo 1: probar la compactación de Codex (entorno)
Resultado: informe con evidencia de qué ajuste compacta en Codex 0.167.0 y cómo aplicarlo. Sin cambiar código. Toca solo `docs/investigaciones/codex-compactacion.md`.
- [x] Crear una carpeta temporal vacía y correr `codex exec -c model_auto_compact_token_limit=3000` con una tarea de 4 comandos de shell cortos (≈2 min, gasto mínimo) (A1)
  - evidencia: `codex exec --skip-git-repo-check -c model_auto_compact_token_limit=3000` en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/codex-prueba-1`, exit 0; rollout `rollout-2026-11-09T07-25-50-01a1bfd7-c122-7753-8c22-294db1bf8442.jsonl`
- [x] Buscar en el rollout nuevo (`~/.codex/sessions/AAAA/MM/DD/`, solo ese archivo) un evento de compactación o una caída del contexto en `token_count` (A1)
  - evidencia: `python3 -I` sobre `rollout-2026-11-09T07-25-50-01a1bfd7-c122-7753-8c22-294db1bf8442.jsonl`: 4 eventos `compacted` (ordinales 21, 35, 49, 63), `last_input 0` tras cada uno (25, 39, 53, 67), exit 0
- [x] Repetir con `-c model_post_turn_compact_threshold_percent=10` y anotar si compacta tras la respuesta final (A1)
  - evidencia: `codex exec --skip-git-repo-check -c model_post_turn_compact_threshold_percent=10` en `codex-prueba-2`, exit 0; rollout `rollout-2026-11-09T07-27-32-01a1bfd9-4f7e-76e3-a0e7-04b238096716.jsonl`: 0 compactaciones. Con `=1` (corrida 3, rollout `rollout-2026-11-09T07-28-07-01a1bfd9-d890-7fc0-9a66-ff0d08f37e3c.jsonl`, exit 0): 1 compactación tras la respuesta final (ordinal 48, respuesta en 43, cierre en 54)
- [x] Probar si `.codex/config.toml` de proyecto con la misma clave surte efecto (proyecto temporal marcado de confianza solo si hace falta) y anotarlo (A1)
  - evidencia: `codex-proyecto-cfg/.codex/config.toml` con `model_auto_compact_token_limit = 3000`: sin confianza, rollout `rollout-2026-11-09T07-28-48-01a1bfda-7971-7fa1-a5bb-e8cabb812447.jsonl` 0 compactaciones; con `-c projects."<dir>".trust_level="trusted"` (sin editar `config.toml`), rollout `rollout-2026-11-09T07-29-11-01a1bfda-d3ed-7680-af47-d258fad12ed4.jsonl` 0 compactaciones. Control `model_reasoning_effort = "high"` en `codex-proyecto-cfg2`: `reasoning effort: low` en ambos casos, no surte efecto
- [x] Escribir `docs/investigaciones/codex-compactacion.md`: comando, resultado, evento citado, recomendación (A1)
  - evidencia: `docs/investigaciones/codex-compactacion.md` (nuevo)

Verificación del tramo: el informe existe y cada afirmación cita un archivo de rollout (A1).

### Tramo 2: umbral en el lanzador y diagnóstico en el medidor
Resultado: `codex-<agente>` arranca con el umbral y `uso.mjs --sesiones` muestra esperas y contexto. Toca `instalar.sh`, `scripts/resolver.mjs`, `scripts/uso.mjs`, `pruebas/uso/`, `verify`. Se ajusta según el informe del tramo 1.
- [x] En `generar_lanzador_codex` agregar el ajuste que confirmó el tramo 1 con el valor de `compactar_en`, sin duplicar al reinstalar (A2)
  - evidencia: `scripts/resolver.mjs` (nuevo comando `compactar-codex <agente>`), `instalar.sh` (`generar_lanzador_codex`). HOME temporal con fake codex: `grep -c model_auto_compact_token_limit` en `codex-constructor` = 1 con `-c model_auto_compact_token_limit=100000`; reinstalar = 1; `compactar-codex` sin `compactar_en` (perfil ni raíz) sale vacío, exit 0
- [x] Extender el paso 3f de `verify` con la comprobación de A2 y su caso negativo (A2, A6)
  - evidencia: `verify` (bloques «(1b)» y el chequeo de conteo en «(3)»). Bloque 3f aislado (líneas 761 a 886 de `verify`, con `paso`/`fallo` iguales): `$ bash <bloque 3f>` exit 0, con «ok 3f: compactar_en de modelos.json va en codex-constructor una sola vez (reinstalar no duplica); sin compactar_en no aparece» y «ok 3f: reinstalar con low refresca el TOML y codex-constructor, sin duplicar el umbral»
- [x] Agregar a `uso.mjs` la opción `--sesiones` (por sesión: llamadas, esperas = `wait_agent`, `wait`, `sleep`, `send_message`, contexto mediana/máximo, compactaciones = caídas del 40 % o más) (A3)
  - evidencia: `scripts/uso.mjs` (`--sesiones`, `ESPERAS`, `estadisticasContexto`, `imprimirSesiones`). `node scripts/uso.mjs --sesiones --herramienta codex --desde 2026-01-01 --codex-dir pruebas/uso/fixtures/codex-sesiones --json`: sesión con esperas `llamadas 5, esperas 5, contexto_mediana 45000, contexto_max 80000, compactaciones 1`; sesión sin esperas `esperas 0`; exit 0
- [x] Crear fixture de Codex con 5 esperas y una caída, y su prueba en `probar.mjs` (A3)
  - evidencia: `pruebas/uso/fixtures/codex-sesiones/sessions/2026/11/08/rollout-2026-11-08T12-00-00-sesion-con-esperas.jsonl` (nuevo; 5 esperas, contexto 20000/50000/80000/30000/45000) y `rollout-2026-11-08T15-00-00-sesion-sin-esperas.jsonl` (nuevo); prueba `A3s` en `pruebas/uso/probar.mjs`; `node pruebas/uso/probar.mjs`, exit 0 («ok A3s», «pruebas del medidor: 12 de 12 ok»)
- [x] Agregar la alerta de cuota: `avisos` con «Cuota semanal de Codex en N %» si el último `used_percent` es ≥ `--umbral` (por defecto 70); dos fixtures (85 y 40) con su prueba y un caso sin dato (A7)
  - evidencia: `scripts/uso.mjs` (`--umbral`, aviso tras `calcularCuota`); fixtures `pruebas/uso/fixtures/codex-alerta-85/` y `codex-alerta-40/` (nuevos); prueba `A7` en `pruebas/uso/probar.mjs` (caso sin dato en un temporal). `node pruebas/uso/probar.mjs`, exit 0, «ok A7»

Verificación del tramo: `node pruebas/uso/probar.mjs && ./verify` (A2, A3, A7).

### Tramo 3: esperas y planes en archivos (textos)
Resultado: los textos del kit mandan esperar una vez y repartir planes grandes. Toca `agentes/principal.md`, `agentes/constructor.md`, las dos skills, `verify`, `AGENTS.md`. Incluye la regla de salidas cortas.
- [x] En `principal.md`, sección Delega: añadir «una sola espera», no consultar estado con `send_message`, y ofrecer ventana propia en planes con 3 tramos o más (A4)
  - evidencia: `agentes/principal.md` línea 28 (sección Delega); antes `grep -n -e "una sola espera" -e "send_message"` sin coincidencias (exit 1); después ambas frases presentes en la línea 28 (exit 0). Revisión manual: la frase dice no consultar estado con `send_message`
- [x] En `planificar-cambio`, regla 11: más de 3 tramos o ≈8 KB → `tramo-N.md`; `plan.md` es índice con la lista de tramos y su estado (A5)
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 93 (regla 11). Antes `grep -n -e "tramo-"` sin coincidencias (exit 1); después la línea 93 cita `tramo-N.md`, el índice y el umbral (exit 0)
- [x] En `planificar-cambio` y `ejecutar-plan`: resumen de 5 líneas en *Notas* y pedir `/compact` o sesión nueva al cerrar cada tramo (A5)
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 93 y `skills/ejecutar-plan/SKILL.md` línea 26 (ambas con «5 líneas» y «/compact»). `grep -n -e "compact" -e "5 líneas"` antes sin coincidencias (exit 1); después ambas presentes (exit 0)
- [x] En `ejecutar-plan` y `constructor.md`: salidas largas (build, `verify`, listados) se muestran por la cola y los errores, y los comandos usan opciones silenciosas cuando existan (A8)
  - evidencia: `skills/ejecutar-plan/SKILL.md` línea 38 (Bucle de ejecución) y `agentes/constructor.md` línea 24 (Límites). `grep -n -e "salidas largas"` antes sin coincidencias (exit 1); después ambas presentes y «cola» en las dos (exit 0)
- [x] En `constructor.md` y `ejecutar-plan`: con `tramo: n` leer `plan.md` y solo `tramo-<n>.md` (A5)
  - evidencia: `agentes/constructor.md` línea 16 y `skills/ejecutar-plan/SKILL.md` línea 26. `grep -n -e "tramo-"` antes sin coincidencias (exit 1); después ambos archivos lo mencionan (exit 0)
- [x] Agregar los textos nuevos a `TEXTOS_TRAMOS` de `verify` y repetir la prueba negativa del paso 11 (A6)
  - evidencia: `verify` (`TEXTOS_TRAMOS`, 9 textos nuevos: `una sola espera`, `send_message` en principal; `Salidas largas`, `tramo-<n>.md` en constructor; `tramo-N.md`, `/compact` en planificar-cambio; `tramo-<n>.md`, `/compact`, `Salidas largas` en ejecutar-plan). Bloque 11 aislado (`awk` de «# 11.» a «# 12.» con `paso`/`fallo`): `$ bash bloque11.sh`, `ok 11 baseline`, 21 `ok 11 negativa` (12 previos + 9 nuevos), exit 0
- [x] Agregar a `AGENTS.md` una línea sobre planes en archivos y compactación (A5)
  - evidencia: `AGENTS.md` línea 11 (viñeta «Ejecución por tramos»). `grep -n -e "tramo-N.md" -e "compact"` antes sin coincidencias en la línea nueva (solo la línea 11 original con «tramos»); después la línea 11 trae `tramo-N.md`, `/compact` y `compactar_en` (exit 0)
- [x] Correr `./verify` completo (≈ varios min) y anotarlo en *Evidencia* (A6)
  - evidencia: `./verify`, exit 0 (salida completa en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/verify-final-1.out`; cola en *Evidencia*, «VERIFY OK»)

Verificación del tramo: `./verify` (A4–A6, A8).

## Evidencia
Tramo 1 (2026-11-09), codex-cli 0.167.0; rollouts en `~/.codex/sessions/2026/11/09/`.

$ codex exec --skip-git-repo-check -c model_auto_compact_token_limit=3000 "<tarea de 4 echo>"   (en scratchpad/codex-prueba-1)
...
hook: PostToolUse
context compacted
...
fin
exit 0
rollout: rollout-2026-11-09T07-25-50-01a1bfd7-c122-7753-8c22-294db1bf8442.jsonl, 4 compacted (ordinales 21, 35, 49, 63)

$ codex exec --skip-git-repo-check -c model_post_turn_compact_threshold_percent=10 "<tarea>"   (scratchpad/codex-prueba-2)
fin
exit 0
rollout: rollout-2026-11-09T07-27-32-01a1bfd9-4f7e-76e3-a0e7-04b238096716.jsonl, 0 compacted

$ codex exec --skip-git-repo-check -c model_post_turn_compact_threshold_percent=1 "<tarea>"   (scratchpad/codex-prueba-3)
fin
exit 0
rollout: rollout-2026-11-09T07-28-07-01a1bfd9-d890-7fc0-9a66-ff0d08f37e3c.jsonl, 1 compacted (ordinal 48, tras la respuesta final)

$ codex exec (proyecto con .codex/config.toml, sin confianza y con trust_level por -c)   (scratchpad/codex-proyecto-cfg)
fin
exit 0
rollouts: rollout-2026-11-09T07-28-48-01a1bfda-7971-7fa1-a5bb-e8cabb812447.jsonl y rollout-2026-11-09T07-29-11-01a1bfda-d3ed-7680-af47-d258fad12ed4.jsonl, 0 compacted cada uno

$ awk ... docs/investigaciones/codex-compactacion.md (verificación del tramo: informe y rollouts citados)
informe existe
8
4711
exit 0

Tramo 2 (2026-11-09), verificación del tramo: `node pruebas/uso/probar.mjs && ./verify`

$ node pruebas/uso/probar.mjs
pruebas del medidor: 12 de 12 ok
exit 0

$ ./verify
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
real 0m23.801s
exit 0

Tramo 3 (2026-11-09), verificación del tramo: `./verify`

$ ./verify   (salida final; ok 11 negativa lista las 21 copias sin texto)
ok 11 negativa: copia sin «tramo-<n>.md» en skills/ejecutar-plan/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «/compact» en skills/ejecutar-plan/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «Salidas largas» en skills/ejecutar-plan/SKILL.md rechazada con su mensaje
== 12. medidor de costos: pruebas de scripts/uso.mjs sobre fixtures ==
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
ok A3s: Sesiones de Codex: esperas, contexto mediana y máximo, compactación por caída del 40 %; sin esperas da 0
ok A7: Cuota de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
pruebas del medidor: 12 de 12 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

## Notas
- Tramo 1: la prueba de confianza se hizo pasando `-c projects."<dir>".trust_level="trusted"` en vez de editar `~/.codex/config.toml` real; el rollout no guarda ese `-c`, así que no hay prueba de que la confianza se aplicó. Lo que sí se midió: el archivo de proyecto no cambió la cabecera (`reasoning effort: low`) con o sin esa línea.
- Tramo 1: una corrida de control (`codex-proyecto-cfg2`, con `-C`) se lanzó sin anotar su cabecera; su rollout `rollout-2026-11-09T07-29-54-01a1bfdb-7ab2-72d0-9191-5a45754bf8cd.jsonl` dice `reasoning_effort` `low`.
- Tramo 1: la corrida 3 (`post_turn=1`) se hizo además de las pedidas, para saber si la clave funciona con un valor que sí se alcanza; la corrida con 10 no compacta porque el contexto (≈17 k) no llega al 10 % de la ventana (475 k).
- Tramo 1: el ajuste de compactación se confirmó con `codex exec`; no se probó en sesión interactiva.
- Tramo 1: la verificación del tramo no tiene comando propio; se comprobó el informe y sus rollouts citados (ver arriba).
- Tramo 1: consumo de cuota: 8 sesiones `codex exec` (3 de la tarea de 4 comandos, 2 de proyecto y 3 de control), sin medir el costo exacto.

## Notas
- Tramo 2: el lanzador `codex-<agente>` ya existente no se reescribe por sí mismo; instalar.sh lo regenera al reinstalar porque el registro lo marca como generado. Probado con el flujo de dos instalaciones (xhigh y luego low): el lanzador cambió y el umbral quedó una sola vez.
- Tramo 2: las pruebas con instalar.sh usaron un codex falso en PATH y un HOME temporal; la primera reproducción sin `unset CODEX_HOME` no escribió nada en `~/.codex` (las TOML ya existían y salieron como OMITIDO; sus fechas no cambiaron).
- Tramo 2: `--sesiones` solo aplica a Codex (con otra herramienta sale código 2). La compactación por sesión es una caída de 40 % o más del `last_token_usage.input_tokens` entre llamadas; no cuenta los eventos `compacted` del rollout.
- Tramo 2: la alerta de cuota usa la sesión con dato de cuota más reciente dentro de `--desde`, y el campo `secondary.used_percent` como el resto del medidor.
- Tramo 2: `verify` corrió completo en ≈24 s en este entorno. El paso 10 (OpenSpec) salió omitido por la falta de `pruebas/comparar-openspec/`, como ya estaba.
- Base comprobada al escribir: `main` local al día con `origin/main` (incluye el PR #59).
- El tramo 1 gasta algo de cuota de Codex (una tarea corta); es medida, no ejecución de producción.
- Este plan va en un solo archivo porque la convención de `tramo-N.md` es lo que el propio plan crea.
- Revisión tramo 2 (principal, 2026-11-09): `probar.mjs` 12/12 y `./verify` VERIFY OK; `uso.mjs --sesiones` sobre los logs reales de Memory-AI del 8 nov da esperas de 125/240, 76/169, 52/208 y 53/69 llamadas (coincide con el diagnóstico); lanzador con el umbral por una sola vía (`instalar.sh` + `compactar-codex`). Pendiente de Franco: reinstalar con `bash instalar.sh` para que `~/.local/bin/codex-*` lleve el umbral.
- Tramo 3 (constructor, 2026-11-09): los ocho pasos son textos del kit (`principal.md`, `constructor.md`, las dos skills, `AGENTS.md` y `verify`); no hubo decisiones de diseño ni cambios fuera de *Alcance*.
- Tramo 3: al leer la skill `planificar-cambio` intenté un `bash -c` de prueba por error; la regla deny lo bloqueó, no se repitió y no forma parte del cambio.
- Tramo 3: el paso 6 añadió 9 textos a `TEXTOS_TRAMOS`; el bloque 11 aislado da 21 copias negativas `rechazada`, no solo las 9 nuevas.
- Tramo 3: `./verify` completo pasó en la primera corrida final (`VERIFY OK`), sin correcciones.
- Pendiente de Franco: revisar el `git diff` del tramo 3 y la evidencia de *Evidencia*; luego el commit.
