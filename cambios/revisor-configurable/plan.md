---
estado: borrador
rama: feature/revisor-configurable
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Revisor de `kit run` configurable en `modelos.json` (sin agente nuevo)

## Objetivo
Que el modelo y el esfuerzo del revisor de `kit run` se cambien con una línea de `modelos.json`, para probar Luna `low` en cambios reales (ver `docs/investigaciones/revisor-luna.md`: Luna `low` detectó 5/6 sembrados a ≈9 % del costo de Sol `low`). **No se crea ningún agente**: no hay archivo en `agentes/`, ni lanzador, ni cambios en `instalar.sh`.

## Supuestos
- Hoy el revisor es el agente `principal` (`comando()` en `scripts/kit-run.mjs`: `agente = constructor ? "constructor" : "principal"`). Ese comportamiento es el **valor por defecto** y no cambia.
- Clave nueva, a nivel raíz de `modelos.json`: `"kit_run": { "revisor": { "nivel": "medio", "esfuerzo": "low" } }`. `nivel` y `esfuerzo` se validan contra `niveles` y `esfuerzos`, y se traducen con el mismo mecanismo que los agentes (perfil por herramienta, respaldo, `max` → `xhigh` en Codex). Valor del repo: `medio`/`low` (= Sol hoy). Para la prueba, Franco cambia `nivel` a `bajo` (Luna `low`); no es el valor por defecto del repo.
- Si la clave falta (p. ej. un `modelos.json` personal copiado con `instalar.sh --copiar`), el revisor sigue siendo `principal`, como hoy.
- Para comparar con la revisión de Franco en los próximos `kit run`, la nota que `kit run` deja en *Notas* del plan debe incluir el modelo y el esfuerzo del revisor.
- Solo herramienta `codex` (el tramo 3 de `cambios/kit-run/plan.md` sigue en espera); para Claude/Pi la clave se acepta pero no se usa.

## Alcance
`modelos.json` (clave `kit_run` + una línea en `_leeme`), `scripts/resolver.mjs` (subcomando para resolver modelo y esfuerzo de `kit_run.revisor`), `scripts/kit-run.mjs` (usar ese subcomando para el revisor y anotar `revisor=<modelo>:<esfuerzo>`), `pruebas/kit-run/probar.mjs`, `README.md` (≤ 6 líneas), `AGENTS.md` (1 línea). Fuera: `agentes/`, `instalar.sh`, `scripts/uso.mjs`, el constructor.

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| V1 | Sin cambios de comportamiento por defecto | `node pruebas/kit-run/probar.mjs` | los casos actuales (A1–A6, C1, C2) siguen pasando; el revisor falso recibe el modelo del `principal` |
| V2 | Luna `low` configurable | caso nuevo del arnés con `FLUCASTR_MODELOS` apuntando a un `modelos.json` de prueba con `nivel: bajo` | el `codex` falso recibe `-m gpt-6-luna` y `model_reasoning_effort="low"` para el revisor, y el constructor no cambia |
| V3 | Clave ausente = comportamiento actual | caso nuevo con un `modelos.json` sin `kit_run` | el revisor usa el modelo del `principal` |
| V4 | Valor inválido falla antes de tocar nada | caso nuevo con `nivel: "inexistente"` | exit 2 con mensaje claro, plan intacto |
| V5 | Queda rastro del revisor | caso nuevo | la nota en *Notas* del plan contiene `revisor=<modelo>:<esfuerzo>` |
| V6 | `./verify` pasa | `./verify` | VERIFY OK |

## Verificación
`node pruebas/kit-run/probar.mjs && ./verify`

## Pasos
- [ ] `scripts/resolver.mjs`: subcomando `modelo-kit-run revisor <herramienta>` y `esfuerzo-kit-run revisor <herramienta>` (o uno solo que imprima `modelo:esfuerzo`), con validación y respaldo; si falta la clave, resolver como el agente `principal` (V1, V3, V4).
- [ ] `modelos.json`: añadir `kit_run.revisor` con `medio`/`low` y documentarlo en `_leeme` (V1).
- [ ] `scripts/kit-run.mjs`: el revisor usa el subcomando nuevo (el constructor sigue con `constructor`); el preflight valida antes de tocar el plan; la nota final incluye `revisor=<modelo>:<esfuerzo>` (V2, V4, V5).
- [ ] `pruebas/kit-run/probar.mjs`: casos V2 a V5 con `codex` falso y `modelos.json` temporales (V2–V5).
- [ ] `README.md` y `AGENTS.md`: cómo cambiar el revisor a Luna (una línea de `modelos.json`) y que no hay agente nuevo (V6).
- [ ] `./verify` (V1–V6).
