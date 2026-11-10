---
estado: aprobado
rama: docs/piloto-kit-run
base: feature/kit-run
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
- [ ] Crear `docs/kit-run.md` (máx. 40 líneas): para qué sirve, uso (`kit-run <plan> --herramienta codex`), qué hace el ciclo (constructor → verify → ≤2 relanzamientos → revisor de solo lectura), estados finales (`listo`/`parcial`) y los topes de tiempo. Leer `scripts/kit-run.mjs` para no inventar nada.

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| P1 | La guía existe y es breve | `wc -l docs/kit-run.md` | entre 10 y 40 líneas |
| P2 | Cita uso y topes reales | `grep -c "45\|15\|30" docs/kit-run.md` y leer contra `scripts/kit-run.mjs` | cifras coinciden con el script |

## Verificación
`./verify`
- kit run: PAUSA (acceso): PAUSA: plan=cambios/piloto-kit-run/plan.md; motivo=acceso; hecho=0/1; siguiente=aprobar el plan cambiando `estado: en curso` a `estado: aprobado`; no_intentado=la skill `ejecutar-plan` exige detenerse si el plan no está aprobado.
