# Tramo 1: menos llamadas y relecturas + alerta de 5 horas
Resultado: principal y constructor agrupan lecturas independientes y leen cada archivo una vez; el medidor avisa de la ventana de 5 horas. Toca `agentes/principal.md`, `skills/ejecutar-plan/SKILL.md`, `scripts/uso.mjs`, `pruebas/uso/`.

## Pasos
- [x] Medir y anotar en *Evidencia* los tamaños de partida de los cinco archivos con `wc -c` (A3)
  - evidencia: `wc -c` de los cinco archivos, exit 0 (cifras en *Evidencia*)
- [x] En `principal.md` agregar la sección «Lectura» de ≤ 5 líneas: lecturas independientes en una sola llamada (varios comandos en un mismo paso, sin nombrar la herramienta); cada archivo y cada skill una vez por sesión; tras compactar no releer lo ya resumido; `rg` y `sed -n` en vez de `cat` de archivos grandes (A1)
  - evidencia: `agentes/principal.md` líneas 20 a 25 (sección `## Lectura`)
- [x] En `ejecutar-plan` agregar al bucle una línea equivalente: agrupar en una sola llamada las lecturas independientes (A1)
  - evidencia: `skills/ejecutar-plan/SKILL.md` línea 32
- [x] Escribir ambas reglas neutras: «en una sola llamada» sin nombrar herramientas, con una frase de cómo hacerlo en cada soporte solo si hace falta (A1, A7)
  - evidencia: `agentes/principal.md` línea 22 y `skills/ejecutar-plan/SKILL.md` línea 32 no nombran herramienta de agente; solo `rg` y `sed -n` en `principal.md` línea 25, como pide el paso. No hizo falta frase por soporte.
- [x] Revisar que el texto de ambos use la frase exacta «una sola llamada» (A1)
  - evidencia: `grep -n "una sola llamada" agentes/principal.md skills/ejecutar-plan/SKILL.md`, exit 0 (líneas 22 y 32); `grep -n "una vez" agentes/principal.md`, exit 0 (líneas 23 y 39)
- [x] En `uso.mjs` leer `rate_limits.primary.used_percent` del último evento y avisar «Ventana de 5 horas de Codex en N %» si es ≥ `--umbral` (A2)
  - evidencia: `scripts/uso.mjs` líneas 285, 304, 329, 349 a 353 (`primariaFinal`, aviso «Ventana de 5 horas de Codex en N %»), y líneas 15 y 41 (ayuda y cabecera)
- [x] Dos fixtures (85 y 40 en `primary`) y su prueba en `probar.mjs`, más el caso sin dato (A2)
  - evidencia: `pruebas/uso/fixtures/codex-ventana-85/sessions/2026/11/08/rollout-2026-11-08T12-00-00-ventana-85.jsonl`, `pruebas/uso/fixtures/codex-ventana-40/sessions/2026/11/08/rollout-2026-11-08T12-00-00-ventana-40.jsonl` y prueba `A2v` en `pruebas/uso/probar.mjs` línea 181; `node pruebas/uso/probar.mjs`, exit 0
- [x] En un HOME temporal, `bash instalar.sh` y `grep -c "una sola llamada"` en el principal generado de Claude Code, Pi y Codex (A7)
  - evidencia: `HOME=<tmp> CODEX_HOME=<tmp>/.codex bash instalar.sh`, exit 0; `grep -c "una sola llamada"` en `.claude/agents/principal.md`: 1; en `.pi/agent/agents/principal.md`: 1; en `.codex/agents/principal.toml`: 1

Verificación del tramo: `node pruebas/uso/probar.mjs && ./verify` (A1, A2, A4, A7).

## Evidencia

Tamaños de partida, antes de tocar nada (`wc -c`): `agentes/principal.md` 8898; `agentes/constructor.md` 2616; `skills/planificar-cambio/SKILL.md` 9945; `skills/ejecutar-plan/SKILL.md` 7090; `AGENTS.md` 8343. Después de este tramo: `agentes/principal.md` 9341 y `skills/ejecutar-plan/SKILL.md` 7184 (suben; el recorte va en los tramos 4 y 5).

Prueba de sensibilidad: el medidor de HEAD (`git show HEAD:scripts/uso.mjs`) contra las pruebas nuevas:

$ node pruebas/uso/probar.mjs --script <copia de uso.mjs de HEAD>
FALLO A2v: Ventana de 5 horas de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
  avisos: ["Pi: límite de uso alcanzado en proyecto-b (2026-11-08T12:03:00.000Z); no suma tokens"]
FALLO: 1 de 13 pruebas del medidor no pasaron
exit 1

Con el cambio:

$ node pruebas/uso/probar.mjs
ok A1 ... ok A7 ... ok A2v: Ventana de 5 horas de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
pruebas del medidor: 13 de 13 ok
exit 0

Aviso de la alerta (A2), `--json`:

$ node scripts/uso.mjs --herramienta codex --json --desde 2026-01-01 --codex-dir pruebas/uso/fixtures/codex-ventana-85
avisos: [ 'Ventana de 5 horas de Codex en 85 %' ]
$ node scripts/uso.mjs --herramienta codex --json --desde 2026-01-01 --codex-dir pruebas/uso/fixtures/codex-ventana-40
avisos: []

Instalación en HOME temporal (A7): `HOME=<tmp> CODEX_HOME=<tmp>/.codex bash instalar.sh`, exit 0 (`<tmp>` está en el scratchpad, carpeta `home-AG9n`). `grep -c "una sola llamada"`: `.claude/agents/principal.md` 1; `.pi/agent/agents/principal.md` 1; `.codex/agents/principal.toml` 1.

Verificación del tramo, `./verify`:

$ node pruebas/uso/probar.mjs && ./verify
... ok 11 negativa ... (todas ok)
pruebas del medidor: 13 de 13 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

## Notas
- `agentes/principal.md`: la sección «Lectura» (4 viñetas) va antes de «Cómo trabajas». Aumenta el tamaño; el recorte de los tramos 4 y 5 debe compensarlo (meta ≤ 7000).
- `skills/ejecutar-plan/SKILL.md`: una línea nueva en el bucle, antes de «Haz el cambio mínimo». Aumenta 94 bytes; el recorte es del tramo 4.
- `rg` y `sed -n` van nombrados porque el paso lo pide. Son comandos de shell que tienen los tres soportes (Claude Code, Pi y Codex). Si la revisión de A7 lo exige, se cambia en el tramo 4 o 5.
- `scripts/uso.mjs`: el aviso de ventana es exactamente «Ventana de 5 horas de Codex en N %», sin el sufijo «llegó al umbral» de la cuota semanal, para que coincida con el plan. Toma la sesión más reciente con `rate_limits.primary`, igual que la cuota semanal.
- Hallazgo para el tramo 3: en el primer `bash instalar.sh` de prueba, `CODEX_HOME` del entorno apuntaba al `~/.codex` real. El instalador omitió `agents/constructor.toml` y `agents/principal.toml` con «OMITIDO (ya existe)» y no escribió esos archivos (según el log). La prueba válida usa `CODEX_HOME` temporal. Antes del tramo 3 hay que confirmar que `instalar.sh` regenera el `principal.toml` real; si no lo hace, el cambio de nivel no llega a Codex hasta regenerarlo.
- Tramo 1 cumplido: pasos A1, A2, A7 y `./verify` pasa.
