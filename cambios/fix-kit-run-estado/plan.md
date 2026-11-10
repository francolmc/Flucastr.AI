---
estado: listo
rama: fix/kit-run-estado
base: feature/kit-run
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Corregir el estado que `kit run` deja antes de lanzar al constructor

Aprobado por Franco el 2026-11-10.

## Supuestos
- `ejecutar-plan` (paso 1) se detiene si `estado` ≠ `aprobado`; es quien pone `en curso` (paso 3). `kit run` no debe adelantarse.
- Hallazgo completo: `cambios/kit-run/plan.md`, Notas, «Hallazgo del piloto A4».

## Alcance
`scripts/kit-run.mjs`, `pruebas/kit-run/probar.mjs`. Fuera: todo lo demás (no tocar los planes en `cambios/`).

## Pasos
- [x] En `scripts/kit-run.mjs` quitar `fijarEstado(planPath, "en curso")` (≈línea 254) antes de lanzar al constructor; antes de cada corrida (incluidos los relanzamientos) dejar `estado: aprobado` en el plan. Los estados finales `listo`/`parcial` no cambian.
  - evidencia: `scripts/kit-run.mjs` — quitada la llamada previa al constructor; `fijarEstado(planPath, "aprobado")` al inicio de cada corrida del constructor; `grep -n '"en curso"' scripts/kit-run.mjs` sin coincidencias, exit 1.
- [x] En `pruebas/kit-run/probar.mjs` hacer que el constructor falso aborte con PAUSA si el `estado` del plan no es `aprobado` al arrancar, y que los casos A1, A2, A3, A5 sigan pasando (nuevo caso A6: el constructor falso ve `aprobado` en las 3 corridas).
  - evidencia: `pruebas/kit-run/probar.mjs` — constructor falso con chequeo de estado (PAUSA motivo=ambiguo si no es aprobado; pasa a en curso); caso A6 añadido. `node pruebas/kit-run/probar.mjs`, exit 0 (13 casos pasaron).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| F1 | El constructor ve `aprobado` al arrancar | `node pruebas/kit-run/probar.mjs` | todos los casos pasan, incluido A6 |
| F2 | Sin la corrección el arnés falla | `grep -n '"en curso"' scripts/kit-run.mjs` | ninguna llamada previa al constructor |

## Verificación
`node pruebas/kit-run/probar.mjs && ./verify`

## Evidencia
$ node pruebas/kit-run/probar.mjs && ./verify
...
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
ok uso: plan en curso se rechaza sin cambiarlo
kit-run: 13 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

## Notas
- kit run: el constructor falso quedó con estado propio (aprobado → en curso) para reproducir el de ejecutar-plan; el arnés sigue sin tocar planes reales.
- Sin mapeo claude/pi en este cambio (fuera de alcance).
- Commit, push y PR: no hechos por el constructor; los hace Franco.
