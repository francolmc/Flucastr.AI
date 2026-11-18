---
status: draft
branch: feature/cola-docker
base: main
repos: [.]
executor: builder
type: code
---
# Convención: un solo `verify` con Docker a la vez (cola con candado)

> Referencias personales y de proyectos anonimizadas; se conservan las cifras y fechas.

## Goal
Que `preparar-proyecto` pida a todo `verify` que use Docker tomar un candado compartido antes de construir, para que dos proyectos (o dos sesiones) no compitan por memoria y CPU. Evidencia: `docs/investigaciones/auditoria-tests-finanzas/hallazgo.md` (PostgreSQL `unhealthy`, `P1017`, API `unhealthy` en Proyecto.Finanzas y Proyecto.Plataforma, con corridas de Docker intercaladas el 13-nov).

## Assumptions
- El candado es `/tmp/flucastr-docker.lock` con `flock` (util-linux, presente en este equipo). Si otro equipo no lo tiene, el `verify` avisa y sigue sin cola; no falla.
- La causa (memoria y CPU compartidas) es una hipótesis con correlación, no probada. Si tras la cola siguen los cierres de PostgreSQL, se investiga el entorno aparte.
- Cada proyecto aplica la convención en su propio plan (`cola-docker` en Proyecto.Plataforma y en Proyecto.Finanzas); este plan solo cambia el kit.

## Scope
Puede cambiar: `skills/preparar-proyecto/SKILL.md` (sección 2) y `verify` (bloque nuevo 8q).
Fuera: los proyectos, `install.sh`, `scripts/`, agentes, otras skills.

## Decisions already taken
- Ejecutor: constructor, porque los cuatro sí de la prueba: texto y comprobaciones definidos, archivos accesibles, sin credenciales ni producción.
- Fragmento canónico que la skill muestra, para copiar tal cual:
  `exec 9>/tmp/flucastr-docker.lock`
  `flock -n 9 || { echo "Otro verify usa Docker; esperando…"; flock 9; }`
- Va después de cualquier modo sin Docker (p. ej. `VERIFY_TARGET`) y antes del primer comando de `docker`.
- El candado se libera solo al terminar el proceso (descriptor 9 cerrado), también si se mata el `verify`.

## Escenarios
- CUANDO se lee `preparar-proyecto` ENTONCES la sección 2 trae el fragmento con `flucastr-docker.lock` y `flock` y dice que va antes del primer `docker` (A1).
- CUANDO una copia pierde `flucastr-docker.lock` ENTONCES el bloque 8q falla (A2).
- CUANDO se corre el kit ENTONCES los bloques existentes siguen pasando (A3).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- |
| A1 | Convención escrita | `grep -nF 'flucastr-docker.lock' skills/preparar-proyecto/SKILL.md` y `grep -nF 'flock' …` | ambas con coincidencia dentro de la sección 2 |
| A2 | El chequeo es sensible | copia con `sed` que cambia `flucastr-docker.lock`; correr la función del bloque 8q | falla para la copia, pasa para el original |
| A3 | No se rompe lo vecino | `./verify` | exit 0 con `ok 8q` |

## Verification
`./verify` — offline; debe terminar en exit 0.

## Steps
- [ ] En `skills/preparar-proyecto/SKILL.md`, sección 2 (`verify`), añade un punto con el fragmento canónico de *Decisiones* y las dos reglas: antes del primer `docker`, y después de los modos sin Docker (A1)
- [ ] En `verify`, bloque 8q copiando el patrón del 8l: exige `flucastr-docker.lock` y `flock` en la skill; copia negativa con `sed` (A2)
- [ ] Corre `./verify` y pega la cola en *Evidencia* (A3)

## Evidence
(la escribe el constructor)

## Notes
(la escribe el constructor)
