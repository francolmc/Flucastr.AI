# Exploración: estado de la v2 en TODO.md y AGENTS.md

Fecha: 2026-11-23. Solo lectura; nada editado. Fuente de lo «dicho por Franco»: su pedido de hoy.

## Dicho por Franco (único hecho nuevo que se registra)
- La v2 está en uso real en Don Financio, Byteria, Andes, entre otros.
- Dolor actual: (1) el builder (subagente pequeño) se pega y tarda; (2) sus entregas vuelven con defectos u omisiones y el planner debe iterar.

## Afirmaciones que ya no son ciertas (se corrigen)
- `TODO.md:4` y `AGENTS.md:3`: «versión candidata» y «falta probarla en un proyecto/proyectos reales». Contradice lo dicho por Franco.
- `TODO.md:4`: fecha 2026-11-05. Hoy es 2026-11-23.
- `TODO.md:3`: `old/v1/definitions/TODO.md` no existe; el archivo existe como `old/v1/definitions/PENDIENTES.md` (renombrado en `changes/done/estandarizar-ingles`). Se corrige solo la ruta.

## Referencias rotas comprobadas (existen los destinos)
| Línea TODO.md | Actual | Destino real (existe) |
|---|---|---|
| 8 | `cambios/hechos/` | `changes/done/` |
| 19 | `cambios/hechos/migrar-v1-v2/plan.md` | `changes/done/migrar-v1-v2/plan.md` |
| 19 | `cambios/hechos/migrar-workspaces/plan.md` | `changes/done/migrar-workspaces/plan.md` |
| 35 | `cambios/hechos/deny-endurecido/plan.md` | `changes/done/deny-endurecido/plan.md` |
| 36 | `cambios/hechos/deny-endurecido/` (segunda ruta) | `changes/done/deny-endurecido/` |
| 55 | `modelos.json` | `models.json` |
| 3 | `old/v1/definitions/TODO.md` | `old/v1/definitions/PENDIENTES.md` |

No se corrige: la primera ruta de la línea 36 (`cambios/deny-endurecido/plan.md`) describe a qué apuntaba AGENTS.md antes; no existe y es cita histórica.

## Por confirmar con Franco (no se deciden ni se editan)
1. Punto 1 («proyecto real con web, API y BD»): ¿Don Financio cumple «verify verde con solo las dos puertas, sin ampliaciones administrativas ni plan por archivo»? ¿Se resolvió la hipótesis de `express` (`src/access-http.ts`)?
2. Punto 1: ¿se migró un proyecto real con `install.sh --migrate`, con y sin `--dry-run`? ¿Y se usó la skill `migrate-project`?
3. Punto 2 (Pi): plan de varios archivos, caso `PARCIAL`, sin reglas deny, y si `inheritProjectContext` hace algo.
4. Punto 3: instalación remota con `install-remote.sh` desde `main`.
5. Punto 4: «usarla en 2 o 3 proyectos reales»: ¿se da por cumplido? Y, por tanto, ¿se habilita borrar `old/` y `pruebas/.temporales` (decisión suya)? `AGENTS.md:43` se deja intacto.
6. Detalles menores: modo remoto de `verify` contra un despliegue real; «prepárame el despliegue» en un proyecto real; Codex real (sesión con builder como subagente, `codex-builder` con `gpt-6-luna`, permisos tras reinstalar); `define-project` en un proyecto nuevo real.
7. `TODO.md:8`: «completó cuatro veces»; hoy hay 68 carpetas en `changes/done/`. ¿Se actualiza la cifra?
8. `TODO.md:9` y `:55`: «constructor corre en Haiku»; `models.json` mapea el nivel bajo a `claude-haiku-5-5`, pero ¿sigue siendo el modelo real del builder en sus proyectos?
9. `TODO.md:36`: dice que `AGENTS.md` apunta a `cambios/deny-endurecido/plan.md`; hoy `AGENTS.md` cita `changes/done/permisos-v2/plan.md`. ¿Se elimina el ítem por obsoleto?
10. Nombres antiguos en TODO.md (`principal`, `constructor`, `preparar-proyecto`, `migrar-proyecto`, `definir-proyecto`, `ejecutar-plan`, `cambios/` suelto en línea 42): ¿se actualizan? Este plan solo repara rutas, como pidió.
11. Fuera del alcance pedido: `docs/implementacion.md` líneas 9 y 286 también dicen «candidata» y listan los mismos pendientes. ¿Se incluye en este cambio o en otro?

## Comprobaciones hechas
- `git status` limpio en `main`. `git fetch` bloqueado por el sandbox (red); `git rev-list --count HEAD..origin/main` = 0 contra la referencia local: base no confirmada contra el remoto.
- Destinos de la tabla comprobados con `test -e`: todos existen.
- `README.md` tiene «La v1», «Verificación», «Ejecutar un plan en ventana propia», «Revisor de kit run»: las referencias de `AGENTS.md` al README son válidas.
