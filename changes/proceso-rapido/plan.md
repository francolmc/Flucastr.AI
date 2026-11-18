---
status: draft
branch: feature/medir-verificacion
base: main
repos: [.]
executor: builder
type: code
---
# Proceso rápido por defecto: lo caro corre una vez, y nadie repite lo ya verificado

> Referencias personales y de proyectos anonimizadas; se conservan las cifras y fechas.

## Goal
Que en cualquier proyecto el agente itere con verificación rápida por defecto, y que la corrida completa sin caché ocurra una sola vez por plan, sin repetirse si nada cambió. Evidencia: `docs/investigaciones/auditoria-verificacion-general/` (6 corridas sin caché de ~20 min en una sesión de F10; el principal repite la corrida completa que el constructor ya pasó).

## Assumptions
- Se invierte la convención: `./verify` pasa a ser **rápido** (con caché) y la aceptación sin caché se pide explícito (`./verify --aceptacion`). `VERIFY_RAPIDO=1` se sigue aceptando por compatibilidad. Si la persona usuaria prefiere dejar `./verify` como está, cambian dos pasos.
- Este plan solo cambia el kit (textos y su chequeo). Aplicar la inversión en el `verify` de cada proyecto es un plan corto por proyecto, derivado de este.
- Va sobre la rama `feature/medir-verificacion` (aún sin mergear) para no esperar el merge; entra en el mismo PR. Si la persona usuaria prefiere una rama aparte, se cambia `rama:` y se espera ese merge.

## Scope
Puede cambiar: `skills/preparar-proyecto/SKILL.md` (sección 2), `skills/planificar-cambio/SKILL.md` (regla 13), `skills/ejecutar-plan/SKILL.md`, `agentes/principal.md` (paso 5), `README.md` (una viñeta) y `verify` (bloque 8s).
Fuera: los proyectos, `install.sh`, `scripts/`, `modelos.json`, `agentes/constructor.md` (se mantiene idéntico a `ejecutar-plan` solo en lo que ya duplica; no se toca aquí).

## Decisions already taken
- Ejecutor: constructor, porque los cuatro sí de la prueba: textos y comprobaciones definidos, archivos accesibles, sin credenciales ni producción.
- Nombres: Nivel 2 = `./verify` (rápido, con caché); Nivel 3 = `./verify --aceptacion` (sin caché). Nivel 3 solo en la corrida final del último tramo; ningún tramo intermedio lo declara.
- Huella del árbol, para no repetir: el constructor anota en *Evidencia*, junto a cada corrida, `Árbol: <12 hex>` por carpeta de `repos:`, calculada con `{ git status --porcelain; git diff HEAD; } | sha256sum | cut -c1-12`.
- Regla del principal (paso 5): si la *Evidencia* trae la *Verificación* del plan con exit 0 y la fingerprint de hoy coincide con la anotada, **no repite** la corrida; revisa el diff y marca la fila. Si no hay evidencia, falla o la fingerprint cambió, repite una vez.
- Regla del constructor: no relanzar una verificación si la fingerprint no cambió desde la última corrida fallida; en ese caso corrige primero o devuelve `PAUSA`.
- Se conservan «una sola espera», `yield_time_ms: 300000` y el resto de frases que exigen los bloques 8k y 8l.

## Escenarios
- CUANDO se lee `preparar-proyecto` ENTONCES pide `./verify` rápido por defecto y `./verify --aceptacion` explícito (A1).
- CUANDO se lee `planificar-cambio` ENTONCES la regla 13 reserva `--aceptacion` al último tramo (A2).
- CUANDO se lee `ejecutar-plan` ENTONCES pide la fingerprint `Árbol:` en la evidencia y prohíbe relanzar sin cambios (A3).
- CUANDO se lee `principal.md` ENTONCES no repite una corrida cuya fingerprint coincide (A4).
- CUANDO una copia pierde `--aceptacion` ENTONCES el bloque 8s falla (A5).
- CUANDO se corre el kit ENTONCES los bloques existentes pasan (A6).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- |
| A1 | Convención en la skill | `grep -cF '--aceptacion' skills/preparar-proyecto/SKILL.md` | 1 o más |
| A2 | Regla 13 actualizada | `grep -nF -- '--aceptacion' skills/planificar-cambio/SKILL.md` | coincidencia dentro de la regla 13 |
| A3 | Huella en ejecutar-plan | `grep -cF 'Árbol:' skills/ejecutar-plan/SKILL.md` | 1 o más |
| A4 | Principal no repite | `grep -cF 'no repite' agentes/principal.md` y `grep -cF 'Árbol' agentes/principal.md` | 1 o más cada una |
| A5 | El chequeo es sensible | copia de `preparar-proyecto` con `sed` que cambia `--aceptacion`; correr la función del bloque 8s | falla para la copia, pasa para el original |
| A6 | Nada se rompe | `./verify` | exit 0 con `ok 8k`, `ok 8l` y `ok 8s` |

## Verification
`./verify` — offline; debe terminar en exit 0.

## Steps
- [ ] En `skills/preparar-proyecto/SKILL.md`, sección 2: define `./verify` rápido por defecto y `./verify --aceptacion` sin caché; `VERIFY_RAPIDO=1` sigue aceptado (A1)
- [ ] En `skills/planificar-cambio/SKILL.md`, regla 13: Nivel 2 = `./verify`, Nivel 3 = `./verify --aceptacion` solo en el último tramo (A2)
- [ ] En `skills/ejecutar-plan/SKILL.md`: anotar `Árbol: <12 hex>` con el comando de *Decisiones* junto a cada corrida, y no relanzar sin cambio de fingerprint (A3)
- [ ] En `agentes/principal.md`, paso 5: añadir la regla de no repetir una corrida con fingerprint coincidente, sin quitar «una sola espera» ni `yield_time_ms: 300000` (A4)
- [ ] En `verify`, bloque 8s copiando el patrón del 8l: exige `--aceptacion` en `preparar-proyecto` y `planificar-cambio`, `Árbol:` en `ejecutar-plan` y `no repite` en `principal.md`; copia negativa con `sed` (A5)
- [ ] En `README.md`, una viñeta con la convención nueva (A1)
- [ ] Corre `./verify` y pega la cola en *Evidencia* (A6)

## Evidence
(la escribe el constructor)

## Notes
(la escribe el constructor)
