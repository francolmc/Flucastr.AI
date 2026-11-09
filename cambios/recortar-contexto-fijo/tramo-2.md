# Tramo 2: medidor `--sesiones` en Claude Code y Pi
Resultado: `uso.mjs --sesiones` funciona en las tres herramientas. Toca `scripts/uso.mjs`, `pruebas/uso/`.

## Pasos
- [ ] Claude Code: por sesión (archivo `.jsonl`, sin contar `subagents/` en la misma fila), contexto por llamada = `input_tokens` + `cache_read_input_tokens` + `cache_creation_input_tokens`; esperas = bloques `tool_use` de nombre `TaskOutput`, `Sleep`, `Monitor` o `SendMessage`; compactación = caída del 40 % o más (A8)
- [ ] Pi: por sesión, contexto por llamada = `usage.input` + `usage.cacheRead` de cada mensaje `assistant`; esperas = llamadas de herramienta cuyo nombre contenga `wait`, `sleep` o `send`; compactación = caída del 40 % o más (A8)
- [ ] Fixtures sintéticos mínimos de Claude Code y de Pi con 3 esperas y una caída, y su prueba en `probar.mjs` (A8)
- [ ] Probar sobre los logs reales de este equipo (solo lectura) y anotar en *Notas* cuántas esperas y compactaciones salen por herramienta, para saber si Claude Code o Pi sufren la espera con sondeo (A8)

Verificación del tramo: `node pruebas/uso/probar.mjs && ./verify` (A8, A4).

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
