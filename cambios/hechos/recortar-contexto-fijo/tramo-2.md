# Tramo 2: medidor `--sesiones` en Claude Code y Pi
Resultado: `uso.mjs --sesiones` funciona en las tres herramientas. Toca `scripts/uso.mjs`, `pruebas/uso/`.

## Pasos
- [x] Claude Code: por sesión (archivo `.jsonl`, sin contar `subagents/` en la misma fila), contexto por llamada = `input_tokens` + `cache_read_input_tokens` + `cache_creation_input_tokens`; esperas = bloques `tool_use` de nombre `TaskOutput`, `Sleep`, `Monitor` o `SendMessage`; compactación = caída del 40 % o más (A8)
  - evidencia: `scripts/uso.mjs`, función `procesarClaude` (fila por sesión principal, esperas por id de bloque, llamadas por id de mensaje); `node pruebas/uso/probar.mjs`, exit 0 (A8 ok)
- [x] Pi: por sesión, contexto por llamada = `usage.input` + `usage.cacheRead` de cada mensaje `assistant`; esperas = llamadas de herramienta cuyo nombre contenga `wait`, `sleep` o `send`; compactación = caída del 40 % o más (A8)
  - evidencia: `scripts/uso.mjs`, función `procesarPi` (bloques `toolCall`, patrón `PATRON_ESPERA_PI`); `node pruebas/uso/probar.mjs`, exit 0 (A8 ok)
- [x] Fixtures sintéticos mínimos de Claude Code y de Pi con 3 esperas y una caída, y su prueba en `probar.mjs` (A8)
  - evidencia: `pruebas/uso/fixtures/claude-sesiones/-home-test-Codes-proyecto-d/sesion-con-esperas.jsonl`, `.../sesion-con-esperas/subagents/agente-d.jsonl`, `.../sesion-sin-esperas.jsonl`, `pruebas/uso/fixtures/pi-sesiones/--home-test-Codes-proyecto-d--/sesion-pi-con-esperas.jsonl` y `sesion-pi-sin-esperas.jsonl`; prueba A8 en `pruebas/uso/probar.mjs`; `node pruebas/uso/probar.mjs`, exit 0
- [x] Probar sobre los logs reales de este equipo (solo lectura) y anotar en *Notas* cuántas esperas y compactaciones salen por herramienta, para saber si Claude Code o Pi sufren la espera con sondeo (A8)
  - evidencia: `node scripts/uso.mjs --sesiones --json` (solo conteos, sin contenido), exit 0; con `--herramienta claude --desde 2026-09-01` y `--herramienta pi --desde 2026-10-10`, exit 0 (cifras en *Notas*)

Verificación del tramo: `node pruebas/uso/probar.mjs && ./verify` (A8, A4).

## Evidencia
$ node pruebas/uso/probar.mjs
ok A8: Sesiones de Claude Code y de Pi: esperas, contexto mediana y máximo, compactación por caída del 40 %; sin esperas da 0; sin --herramienta salen las tres
ok A7: Cuota de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
ok A2v: Ventana de 5 horas de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
pruebas del medidor: 14 de 14 ok
exit 0

Sensibilidad (la copia de HEAD de `scripts/uso.mjs` debe fallar en lo nuevo; el exit no se capturó, la salida se filtró con grep):
$ node pruebas/uso/probar.mjs --script <copia de `git show HEAD:scripts/uso.mjs`>
FALLO A3s: Sesiones de Codex: esperas, contexto mediana y máximo, compactación por caída del 40 %; sin esperas da 0
FALLO A8: Sesiones de Claude Code y de Pi: esperas, contexto mediana y máximo, compactación por caída del 40 %; sin esperas da 0; sin --herramienta salen las tres
FALLO A2v: Ventana de 5 horas de Codex: aviso con 85 % (umbral 70), sin aviso con 40 %, sin dato no avisa; --umbral lo cambia
FALLO: 3 de 14 pruebas del medidor no pasaron

$ node scripts/uso.mjs --sesiones --json --desde 2026-01-01 --claude-dir pruebas/uso/fixtures/claude-sesiones --pi-dir pruebas/uso/fixtures/pi-sesiones --codex-dir pruebas/uso/fixtures/codex-sesiones
(sesiones: 6 filas, dos por herramienta; `herramienta` en cada una, claude 2026-11-08 proyecto-d, pi 2026-11-08 proyecto-d)
exit 0

$ ./verify
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

## Notas
- Estado de partida (reproducido): `node scripts/uso.mjs --sesiones --herramienta claude` salía con código 2 («solo aplica a Codex»); `probar.mjs` 13 de 13.
- Cambio de comportamiento: `--sesiones` sin `--herramienta` ahora sale con las tres herramientas (antes, Codex por defecto). Lo pide A8 (`--sesiones --json` sin herramienta). La cabecera y la ayuda lo dicen.
- Pruebas tocadas sin debilitarlas: A3s ahora fija `--herramienta codex` y su resultado esperado trae `herramienta: "codex"` (más estricto). Se quitó «`--sesiones --herramienta claude` sale con 2», que ya no aplica, y se cambió por «`--herramienta otra` sale con 2» (A4d ya lo cubría). A8 es nueva.
- Subagentes de Claude Code: no tienen fila propia en `--sesiones` y no suman en la fila de su sesión (lectura de «sin contar subagents/ en la misma fila»). La tabla normal sigue contándolos con rol `sub`. Si Franco quiere filas propias para subagentes, es decisión aparte.
- Repeticiones: Claude Code repite un mensaje en varias líneas (streaming). Llamadas y contexto cuentan una vez por id de mensaje; las esperas, una vez por id de bloque `tool_use`.
- Pi: espera = bloque `toolCall` cuyo nombre contiene wait, sleep o send (formato confirmado en los logs locales; `bg_wait` cuenta).
- Medición real, solo lectura y sin imprimir contenido, con `node scripts/uso.mjs --sesiones --json`:
  - Ventana por defecto (7 días desde 2026-11-02): Claude Code 2 sesiones, 0 con espera, 0 compactaciones. Pi 318 sesiones, 1 con espera (1 espera), 33 compactaciones. Codex (referencia) 26 sesiones, 12 con espera, 491 esperas, 9 compactaciones.
  - Ventanas largas: Claude Code desde 2026-09-01: 69 sesiones, 2 con espera, 3 esperas, 13 compactaciones. Pi desde 2026-10-10: 648 sesiones, 6 con espera, 20 esperas, 85 compactaciones.
  - Lectura para la pregunta del tramo: en Claude Code y en Pi la espera con sondeo casi no aparece (3 y 20 llamadas en todo el periodo, frente a 491 en 7 días de Codex). En estas medidas el sondeo pesa solo en Codex.
  - Advertencia: la compactación es una heurística (caída del 40 % del contexto entre llamadas). En Pi da 85 en 648 sesiones y no está validada contra un evento real de compactación. No se usa para decidir `compactar_en`, que queda fuera del plan.
  - Avisos de la ventana por defecto: 7; los tres primeros son «muestra pequeña» de Codex (2) y «límite de uso» de Pi. No revisé los otros cuatro.
- Ninguna doc dice que `--sesiones` sea solo de Codex (buscado con grep). `plan.md`, línea 17, sí lo dice («hoy solo Codex tiene `--sesiones`»); no lo edité porque no es de este tramo. El principal lo corrige al cerrar.
- A2v falla contra la copia de HEAD porque la alerta de 5 horas es del tramo 1 (sin commit), no de este tramo.
- Pendiente para el tramo 3, heredado del tramo 1: confirmar que `instalar.sh` regenera `principal.toml` en el `~/.codex` real.
