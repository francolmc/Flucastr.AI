---
estado: listo
rama: docs/piloto-kit-run
base: main
repos: [.]
ejecutor: constructor
tipo: docs
---
# Anotar A4 de `kit run` como no cumplido

Aprobado por Franco el 2026-11-10. Va en la misma rama del piloto (`docs/piloto-kit-run`), que ya tiene `docs/kit-run.md` sin commit: no tocar esos archivos ni `cambios/`.

## Supuestos
- Datos del piloto (`node scripts/uso.mjs --sesiones`, 2026-11-10, Codex, plan `cambios/piloto-kit-run/plan.md`): principal `gpt-6.1-sol` 1,3784 + 1,2508 = 2,6292 créditos (2 revisiones); constructor `gpt-6-luna` 0,2264 + 0,1702 = 0,3966 créditos (2 corridas). Razón ≈ 6,6; el criterio era < 3. Ediciones y sondeos del principal: 0.
- Lectura: el costo fijo de cada revisión de `sol` (≈1,3) pesa más que el del constructor en un cambio de docs chico. No se sabe si baja con un cambio de código mayor; no afirmarlo.
- Hallazgos del piloto: dos PAUSA iniciales por `kit run` dejando `en curso` (corregido en #67); una PAUSA de alcance por base atrasada; `./verify` dentro del sandbox del constructor falla con `spawnSync bash EPERM` (no corregido).

## Alcance
`docs/evaluaciones/costos.md` (nueva sección `## kit run: piloto A4`, ≤ 25 líneas). Fuera: todo lo demás.

## Pasos
- [x] Añadir al final de `docs/evaluaciones/costos.md` la sección con: resultado «A4 no cumplido», tabla breve (rol, modelo, corridas, créditos), la razón 6,6 contra el umbral 3, la lectura de los Supuestos y los hallazgos listados, y como siguiente paso «medir un cambio de código mayor antes del tramo 3 de `cambios/kit-run/plan.md`». Mismo estilo y cifras que el resto del archivo.
  - evidencia: `docs/evaluaciones/costos.md` líneas 94–115 (sección `## kit run: piloto A4`), `grep -n "A4"` con línea 94 y «A4 no cumplido» en la 96

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| N1 | La sección existe y dice «no cumplido» | `grep -n "A4" docs/evaluaciones/costos.md` | línea con «no cumplido» |
| N2 | Cifras correctas | leer la sección contra los Supuestos | 2,6292; 0,3966; ≈6,6 |
| N3 | Nada más cambió | `git status --short` | solo `docs/evaluaciones/costos.md` nuevo cambio; el resto ya estaba |

## Verificación
`./verify`

## Evidencia
$ ./verify
(cola relevante)
kit-run: 13 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

Comprobación de Aceptación:
- N1: `grep -n "A4" docs/evaluaciones/costos.md` → línea 94 «## kit run: piloto A4» y línea 96 «A4 no cumplido».
- N2: 1,3784 + 1,2508 = 2,6292; 0,2264 + 0,1702 = 0,3966; 2,6292 ÷ 0,3966 ≈ 6,6. Coinciden con Supuestos.
- N3: `git status --short` → `M docs/evaluaciones/costos.md` nuevo; el resto (`cambios/kit-run`, `cambios/piloto-kit-run`, `cambios/anotar-a4/`, `docs/kit-run.md`) ya estaba antes.

## Notas
- Ninguna decisión tomada fuera del plan. `./verify` pasó sin cambios en el producto.
- El aviso «falta pruebas/comparar-openspec/» de la sección 10 es el estado normal del repo (`pruebas/` está en .gitignore); no es fallo de este cambio.
