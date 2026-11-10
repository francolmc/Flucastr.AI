---
estado: listo
rama: docs/piloto-kit-run
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Piloto de `kit run`: guía breve de uso

Plan de documentos chico, hecho para medir A4 de `cambios/kit-run/plan.md` con `codex exec` real.

## Supuestos
- Rama base `feature/kit-run` (tiene el script sin mergear); si Franco prefiere esperar el merge, `base: main`.
- Solo documenta lo que el script ya hace; no cambia código.

## Alcance
`docs/kit-run.md` (nuevo). Fuera: todo lo demás.

## Pasos
- [x] Crear `docs/kit-run.md` (máx. 40 líneas): para qué sirve, uso (`kit-run <plan> --herramienta codex`), qué hace el ciclo (constructor → verify → ≤2 relanzamientos → revisor de solo lectura), estados finales (`listo`/`parcial`) y los topes de tiempo. Leer `scripts/kit-run.mjs` para no inventar nada.
  - evidencia: longitud y cifras contrastadas con `scripts/kit-run.mjs`; aclarado que las dos oportunidades de relanzamiento se comparten entre verify y revisión.

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| P1 | La guía existe y es breve | `wc -l docs/kit-run.md` | entre 10 y 40 líneas |
| P2 | Cita uso y topes reales | `grep -c "45\|15\|30" docs/kit-run.md` y leer contra `scripts/kit-run.mjs` | cifras coinciden con el script |

## Verificación
`./verify`

## Evidencia

$ wc -l docs/kit-run.md
26 docs/kit-run.md
exit 0

$ grep -c "45\|15\|30" docs/kit-run.md
1
exit 0

$ ./verify
VERIFY OK
exit 0

## Notas
- La revisión detectó que verify y revisión comparten un contador de dos relanzamientos; se aclaró en la guía.
- `./verify` falló una primera vez porque el entorno bloqueó `spawnSync bash` (EPERM); la segunda corrida completa pasó.
- kit run: revisión APROBADO tras 2 corrida(s) del constructor; verify pasó.
