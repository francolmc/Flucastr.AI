# Tramo 3: principal a nivel bajo
Resultado: el principal usa el modelo de nivel bajo en las tres herramientas. Toca `modelos.json` (solo `agentes.principal.nivel`), `AGENTS.md` y `README.md` (solo donde dicen «nivel medio»).

## Pasos
- [ ] Anotar los modelos de partida: `node scripts/resolver.mjs modelo principal <herramienta>` para codex, claude-code y pi (A9)
- [ ] Cambiar `agentes.principal.nivel` de `medio` a `bajo` en `modelos.json`; no tocar el esfuerzo ni el constructor (A9)
- [ ] Repetir los tres comandos y comprobar `gpt-6-luna`, `claude-haiku-5-5` y `openai/gpt-6-luna` (A9)
- [ ] Actualizar «nivel medio» → «nivel bajo» del principal en `AGENTS.md` y `README.md` y buscar otras menciones con `grep -rn "nivel medio" AGENTS.md README.md agentes skills` (A9)
- [ ] Agregar a `AGENTS.md` una línea: principal en nivel bajo desde 2026-11-09, «por ahora», revertir con una línea de `modelos.json` (A9)

Verificación del tramo: `./verify` (A9, A4).

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
