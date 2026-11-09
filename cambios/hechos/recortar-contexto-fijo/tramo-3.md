# Tramo 3: principal a nivel bajo
Resultado: el principal usa el modelo de nivel bajo en las tres herramientas. Toca `modelos.json` (solo `agentes.principal.nivel`), `AGENTS.md` y `README.md` (solo donde dicen «nivel medio»).

## Pasos
- [x] Anotar los modelos de partida: `node scripts/resolver.mjs modelo principal <herramienta>` para codex, claude-code y pi (A9)
  - evidencia: partida: principal codex `gpt-6.1-sol`, claude-code `claude-sonnet-5-5`, pi `openai/gpt-6.1-sol`; constructor codex `gpt-6-luna`, claude-code `claude-haiku-5-5`, pi `openai/gpt-6-luna` (`node scripts/resolver.mjs modelo principal <herramienta>`, exit 0)
- [x] Cambiar `agentes.principal.nivel` de `medio` a `bajo` en `modelos.json`; no tocar el esfuerzo ni el constructor (A9)
  - evidencia: `modelos.json` línea 58: `"principal": { "nivel": "bajo", "esfuerzo": "medium" }` (esfuerzo y constructor sin cambios)
- [x] Repetir los tres comandos y comprobar `gpt-6-luna`, `claude-haiku-5-5` y `openai/gpt-6-luna` (A9)
  - evidencia: `node scripts/resolver.mjs modelo principal codex` → `gpt-6-luna`; `... claude-code` → `claude-haiku-5-5`; `... pi` → `openai/gpt-6-luna`; todos exit 0; constructor igual (`gpt-6-luna`, `claude-haiku-5-5`, `openai/gpt-6-luna`)
- [x] Actualizar «nivel medio» → «nivel bajo» del principal en `AGENTS.md` y `README.md` y buscar otras menciones con `grep -rn "nivel medio" AGENTS.md README.md agentes skills` (A9)
  - evidencia: `AGENTS.md` línea 7 y `README.md` línea 9 dicen «nivel bajo» para el principal; `grep -rn "nivel medio" AGENTS.md README.md agentes skills`, exit 1 (sin coincidencias)
- [x] Agregar a `AGENTS.md` una línea: principal en nivel bajo desde 2026-11-09, «por ahora», revertir con una línea de `modelos.json` (A9)
  - evidencia: `AGENTS.md` línea 7 (misma línea del bullet «Dos agentes») añade: «El principal está en nivel bajo desde 2026-11-09, «por ahora» (pedido de Franco): se mide y se revierte poniendo `"nivel": "medio"` en `agentes.principal` de `modelos.json`.»

Verificación del tramo: `./verify` (A9, A4).

## Evidencia
Modelos del principal (A9), tras el cambio, con `node scripts/resolver.mjs modelo principal <herramienta>`:

| Herramienta | Antes | Después |
| --- | --- | --- |
| codex | `gpt-6.1-sol` | `gpt-6-luna` |
| claude-code | `claude-sonnet-5-5` | `claude-haiku-5-5` |
| pi | `openai/gpt-6.1-sol` | `openai/gpt-6-luna` |

Constructor sin cambios: `gpt-6-luna`, `claude-haiku-5-5`, `openai/gpt-6-luna`.

$ ./verify
(cola)
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

Sin fallos en la salida (0 líneas con FALLA o fail).

## Notas
- `modelos.json`: solo cambió `agentes.principal.nivel` (medio → bajo); el esfuerzo `medium` y el constructor quedan igual.
- `AGENTS.md` línea 7 y `README.md` línea 9: «nivel medio» → «nivel bajo» del principal. La línea nueva de «por ahora» y la vía de reversión están en `AGENTS.md` línea 7 (la línea que describe los agentes); no se agregó bullet aparte.
- Tamaños tras este tramo: `AGENTS.md` pasa de 8343 a 8519 bytes (+176 por la línea de «por ahora»). Está fuera de la meta de A3 (≤ 5500) hasta el tramo 6; no es un fallo de este tramo.
- Sin otras menciones de «nivel medio» en `AGENTS.md`, `README.md`, `agentes` ni `skills`.
- Limpieza: el log de `./verify` se escribió en la raíz y se borró; no quedó ningún archivo temporal del tramo.
