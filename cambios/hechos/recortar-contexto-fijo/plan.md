---
estado: listo
rama: feature/recortar-contexto-fijo
base: main
repos: [.]
ejecutor: constructor
tramo: 6
---
# Menos llamadas y menos contexto en las sesiones del kit (Claude Code, Pi y Codex)

## Objetivo
Las sesiones de Claude Code, Pi y Codex hacen menos llamadas, releen menos y arrastran menos texto: los agentes agrupan lecturas independientes, leen cada archivo una vez y los textos fijos del kit pesan ≈25 % menos sin perder reglas. El medidor ve las tres herramientas y avisa también de la ventana de 5 horas de Codex. El principal pasa a nivel bajo por ahora.

## Supuestos
- Evidencia (sesión de Memory-AI, 2026-11-09 08:51, 55 llamadas, 3,14M tokens releídos): 47 de 56 llamadas solo despachan una herramienta; evitar 15 llamadas ahorraría ≈28 %; el texto fijo del kit recortado 25 % ahorraría ≈2 %. Se leyeron `planificar-cambio` y `AGENTS.md` 3 veces en 6 min.
- Franco pidió bajar el principal de nivel medio a bajo «por ahora» (2026-11-09). Efecto: `gpt-6-luna` en Codex y Pi, `claude-haiku-5-5` en Claude Code. No hay evidencia de que ahorre cuota (la calibración de modelos quedó inconclusa) y puede bajar la calidad de planificar y revisar; se mide y se revierte cambiando una línea.
- Las reglas de lectura y de agrupar se escriben neutras (valen para los tres soportes); el tramo 2 midió que Claude Code y Pi casi no esperan con sondeo (Claude 3 esperas en 69 sesiones, Pi 20 en 648; Codex 491 en 7 días): el problema es de Codex.
- Empezar solo cuando el PR de `contexto-y-esperas` esté fusionado: este plan edita los mismos archivos.
- Bajar `compactar_en` (hoy 100000, mediana real 58k) NO entra: es decisión de `modelos.json` y se evalúa con las nuevas mediciones.
- No hay prueba automática del comportamiento del modelo: la comprobación real es el diff y medir con `uso.mjs --sesiones` unos días después.

## Alcance
Puede cambiar: `modelos.json` (solo `agentes.principal.nivel`), `README.md` (solo donde cite el nivel del principal), `agentes/principal.md`, `agentes/constructor.md`, `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `skills/preparar-proyecto/SKILL.md` (solo recibe la limpieza de Docker), `AGENTS.md`, `docs/reglas-deny.md` (nuevo), `scripts/uso.mjs`, `pruebas/uso/`, `verify` (solo para mover textos exigidos).
Fuera de alcance: el resto de `modelos.json`, `instalar.sh`, `scripts/resolver.mjs`, `old/`, reglas deny reales. Prohibido leer `auth.json`, `.env`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque cada cambio está listado con su destino y `./verify` y `contrato-constructor.mjs` detectan texto exigido que falte.
- Orden por impacto: tramo 1 (menos llamadas y relecturas), tramo 2 (medir los tres soportes), tramo 3 (principal a nivel bajo) y después los recortes de texto (tramos 4 a 6).
- Resuelto: 2026-11-09 Franco pidió `principal` nivel bajo por ahora; el esfuerzo (`medium`) no cambia.
- Soportes: Claude Code y Pi ya compactan por `compactar_en` (resolver); Codex lo recibe por `-c` desde el cambio anterior. Los textos van en archivos que se generan para los tres; ninguna regla nombra una herramienta salvo para decir cómo agrupar en ella.
- Regla de oro: cada instrucción vive en un solo archivo; el otro la cita en una línea. Las reglas de seguridad (git, credenciales, estados) se quedan donde las lee quien las cumple.
- Antes de quitar o mover un texto: `grep -rnF "<texto>" verify pruebas scripts agentes skills AGENTS.md`. Si una prueba lo exige y es redundante, se mueve la exigencia al archivo que queda; nunca se debilita una prueba.
- Se conservan: el bloque `bash pendientes-plan`, los formatos `COMPLETADO`/`PAUSA`, las 4 preguntas de la Revisión por tramo y las reglas duras del principal.
- Cada recorte se anota en *Notas* de su tramo: «archivo: qué se quitó → dónde sigue / por qué sobra».

## Escenarios
- CUANDO el principal o el constructor necesitan leer varias cosas independientes ENTONCES sus instrucciones mandan hacerlo en una sola llamada y leer cada archivo una vez (A1)
- CUANDO la ventana de 5 horas de Codex pasa del umbral ENTONCES el medidor avisa, y si no, no (A2)
- CUANDO se genera el principal para Claude Code, Pi y Codex ENTONCES los tres traen las reglas de agrupar y de lectura única (A7)
- CUANDO el medidor analiza una sesión de Claude Code o de Pi ENTONCES muestra llamadas, contexto mediana/máximo, esperas y compactaciones como con Codex (A8)
- CUANDO se resuelve el modelo del principal ENTONCES es el de nivel medio con esfuerzo low en las tres herramientas (cambiado por Franco el 2026-11-09, ver Decisiones) y el constructor es nivel bajo (A9)
- CUANDO se comparan tamaños antes y después ENTONCES cada archivo cumple su meta (A3)
- CUANDO se corre `./verify` y las pruebas ENTONCES pasan sin debilitar ninguna (A4)
- (diferido con el tramo 5) la limpieza de Docker sigue en `principal.md` (A5)
- CUANDO se busca el detalle de reglas deny ENTONCES vive en `docs/reglas-deny.md` y `AGENTS.md` solo lo resume y enlaza (A6)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Agrupar y leer una vez | `grep -n "una sola llamada" agentes/principal.md skills/ejecutar-plan/SKILL.md` y `grep -n "una vez" agentes/principal.md` | ambos textos presentes; revisión manual: mandan agrupar lecturas independientes, `rg`/`sed -n` en vez de `cat` de archivos grandes, y no releer tras compactar lo ya resumido |
| A2 | Alerta 5 h | `node scripts/uso.mjs --herramienta codex --json` sobre fixtures con `primary.used_percent` 85 y 40 (umbral 70, `--umbral`) | con 85 `avisos` trae «Ventana de 5 horas de Codex en 85 %»; con 40 no; sin dato no |
| A3 | Tamaños | `wc -c` de los cinco archivos | constructor ≤ 2200, ejecutar-plan ≤ 5800, AGENTS.md ≤ 5500; principal y planificar-cambio no se recortan (tramo 5 diferido); tabla antes/después de los cinco en *Evidencia* (hoy 9341, 2616, 9945, 7184, 8519) |
| A4 | Sin pérdida | `./verify` y `node pruebas/uso/probar.mjs`; revisión manual de las *Notas* | `VERIFY OK`; ninguna prueba debilitada; ninguna regla dura desaparece |
| A5 | Docker movido (diferido con el tramo 5, 2026-11-09; no aplica en este plan) | — | — |
| A6 | Reglas deny aparte | `test -f docs/reglas-deny.md && grep -c "bash -c" docs/reglas-deny.md AGENTS.md` | el doc trae los límites completos; `AGENTS.md` resume en ≤ 6 líneas y enlaza |
| A7 | Tres soportes | HOME temporal, `bash instalar.sh`, y `grep -c "una sola llamada"` en el principal generado de Claude Code, de Pi y de Codex | 1 o más en cada uno de los tres; revisión manual: ninguna regla depende de una herramienta que otra no tenga |
| A8 | Medidor en los tres | `node scripts/uso.mjs --sesiones --json` sobre fixtures de Claude Code y de Pi | por sesión: `llamadas`, `esperas`, `contexto_mediana`, `contexto_max`, `compactaciones` con los valores del fixture; sin esperas da 0 |
| A9 | Principal medio/low, constructor bajo | `node scripts/resolver.mjs modelo principal codex`, `... claude-code`, `... pi`; y lo mismo con `constructor` | principal: `gpt-6.1-sol`, `claude-sonnet-5-5`, `openai/gpt-6.1-sol`; constructor `gpt-6-luna`, `claude-haiku-5-5`, `openai/gpt-6-luna`; `./verify` pasa |

## Verificación
`./verify` — define «hecho».

## Tramos
- Tramo 1: reglas de agrupar y lectura única para los tres soportes + alerta de 5 horas (`tramo-1.md`): listo
- Tramo 2: medidor `--sesiones` en Claude Code y Pi (`tramo-2.md`): listo
- Tramo 3: principal a nivel bajo (`tramo-3.md`): listo
- Tramo 4: recortes del constructor y `ejecutar-plan` (`tramo-4.md`): listo
- Tramo 5: recortes del principal y `planificar-cambio` (`tramo-5.md`): diferido por Franco (2026-11-09), no se ejecuta en este plan
- Tramo 6: `AGENTS.md`, reglas deny aparte y medición final (`tramo-6.md`): listo

## Evidencia
(la escribe el constructor, en cada `tramo-N.md`)

## Notas
- Antes de lanzar: el PR de `contexto-y-esperas` debe estar fusionado y `main` al día.
- Medir el efecto real: unos días después, `node scripts/uso.mjs --sesiones --herramienta codex` y comparar llamadas por tarea, contexto mediana y relecturas con las sesiones del 8 y 9 nov.
- Tramo 1 cerrado (resumen). Quedó: «Lectura» en `principal.md` y una línea en el bucle de `ejecutar-plan` (rg/sed -n nombrados, como pide el paso); alerta de ventana de 5 horas de Codex en `uso.mjs` con fixtures y prueba A2v (13 de 13, y falla contra el medidor de HEAD); instalación en HOME temporal con las reglas en los tres soportes; `./verify` pasa. Sube `principal.md` a 9341 bytes y `ejecutar-plan` a 7184: el recorte va en los tramos 4 y 5. Sigue: tramo 2 (medidor `--sesiones` en Claude Code y Pi). Antes del tramo 3: confirmar que `instalar.sh` regenera `principal.toml` del `~/.codex` real (en la prueba omitió «ya existe»; detalle en *Notas* de `tramo-1.md`). Pedir a Franco `/compact` o sesión nueva con `Plan: cambios/recortar-contexto-fijo/plan.md`.
- Revisión tramo 1 (principal, 2026-11-09): `probar.mjs` 13/13 y `./verify` VERIFY OK; instalación en HOME temporal con `CODEX_HOME` sin definir deja la regla «una sola llamada» en los principales de Claude Code y Codex (el constructor comprobó Pi); el `principal.toml` y `principal.md` reales ya se regeneraron con la reinstalación de Franco. El aviso del constructor («omitió principal.toml por ya existe») vino de mezclar HOME temporal con el `CODEX_HOME` real y no es un fallo del instalador. Tamaños tras el tramo 1: principal 9341, ejecutar-plan 7184 (el recorte viene en los tramos 4 y 5).
- Revisión tramo 2 (principal, 2026-11-09): `probar.mjs` 14/14 y `./verify` VERIFY OK. Con `--sesiones --herramienta pi --desde 2026-11-02` salen 318 sesiones de Pi, sobre todo del 4 al 7 nov (Memory-AI 52, 16 y 23 por día; DonFinancio; andes), y Pi también chocó con «usage limit» el 8 nov: Pi consume la misma cuota de ChatGPT que Codex.


- Tramo 4 cerrado (constructor, 2026-11-09): `agentes/constructor.md` 2616 → 2165 y `skills/ejecutar-plan/SKILL.md` 7184 → 5387; `./verify` VERIFY OK (exit 0). Quedó: duplicados citados en una línea, «Ritmo» plegado en el bucle, `siguiente=`/`no_intentado=` y el ejemplo de COMPLETADO movidos a `constructor.md` en `verify` (8c y 11), sin debilitar pruebas. Sigue: tramo 6 (`AGENTS.md`, `docs/reglas-deny.md` y medición final); el tramo 5 sigue diferido. Pedir a Franco `/compact` o sesión nueva con `Plan: cambios/recortar-contexto-fijo/plan.md`.

- Tramo 6 cerrado (constructor, 2026-11-09): `AGENTS.md` 8519 → 5471 bytes (A3 cumple); «Límites de las reglas deny» movido a `docs/reglas-deny.md` (copia literal, A6); cada recorte con su destino en *Notas* de `tramo-6.md`. `./verify`: VERIFY OK, exit 0. Queda abierto A5 (la limpieza de Docker sale de `agentes/principal.md` en el tramo 5, diferido): `grep -c "docker system prune"` da 1 en el principal y 0 en `preparar-proyecto`. El principal decide si se reabre el tramo 5 o se retira A5. Sin commit ni push.

## Decisiones (añadido)
Resuelto: 2026-11-09 Franco pidió ir solo con los tramos 4 y 6; el tramo 5 queda diferido y su meta de tamaño no aplica. El tramo 6 es el último: corre `./verify` completo.

Resuelto: 2026-11-09 Franco: el principal no sirve en nivel bajo; queda en `medio` con esfuerzo `low` (constructor `bajo`/`medium`). El tramo 3 y A9 se reemplazan por esto; `modelos.json`, `AGENTS.md` y `README.md` ya lo reflejan.
