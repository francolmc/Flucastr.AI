# Tramo 6: AGENTS.md, reglas deny aparte y medición final
Resultado: `AGENTS.md` corto y detalle deny en `docs/`. Toca `AGENTS.md` y `docs/reglas-deny.md`.

## Pasos
- [x] Mover la sección «Límites de las reglas deny» a `docs/reglas-deny.md` tal cual; dejar en `AGENTS.md` un resumen de ≤ 6 líneas con el enlace (A6)
  - evidencia: `docs/reglas-deny.md` creado; `diff` de `AGENTS.md` líneas 33-42 contra `docs/reglas-deny.md` líneas 3-12: IDENTICAL; `grep -c "bash -c"` → `docs/reglas-deny.md:2`, `AGENTS.md:2`; resumen de 3 líneas con enlace en `AGENTS.md` línea 31-32
- [x] Recortar de `AGENTS.md` lo que repite `README.md`, los agentes o las skills; no quitar reglas ni comandos (A3, A6)
  - evidencia: `AGENTS.md` `wc -c` 8519 → 5471 (tras mover la sección quedó en 7058; luego los recortes de *Notas*, y restauré dos avisos que no estaban en otro archivo)
- [x] Correr el `grep` de la regla de oro antes de borrar y anotar cada recorte (A4)
  - evidencia: `grep -rlF` de cada frase quitada en `verify pruebas scripts agentes skills README.md AGENTS.md docs`: ninguna exigida por una prueba; las frases que siguen en otro archivo (README, `planificar-cambio`, `principal.md`, `preparar-proyecto`) están en *Notas*
- [x] Escribir en *Evidencia* la tabla antes/después de los cinco archivos (A3)
  - evidencia: tabla de *Evidencia* de este archivo (`wc -c`, 2026-11-09)
- [x] Correr `./verify` completo (≈ varios min) y anotarlo (A4)
  - evidencia: `./verify`, exit 0; salida completa en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/verify.log`

Verificación del tramo: `./verify` (A3, A4, A6).

## Evidencia

Tabla antes/después (`wc -c`; «antes» son las cifras de A3 en `plan.md`):

| Archivo | Antes | Después | Meta (A3) |
| --- | --- | --- | --- |
| `agentes/principal.md` | 9341 | 9341 | sin recorte (tramo 5 diferido) |
| `agentes/constructor.md` | 2616 | 2165 | ≤ 2200, cumple |
| `skills/planificar-cambio/SKILL.md` | 9945 | 9945 | sin recorte (tramo 5 diferido) |
| `skills/ejecutar-plan/SKILL.md` | 7184 | 5387 | ≤ 5800, cumple |
| `AGENTS.md` | 8519 | 5471 | ≤ 5500, cumple |
| `docs/reglas-deny.md` | (no existía) | 1870 | nuevo |

$ ./verify
...
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

$ node pruebas/uso/probar.mjs
pruebas del medidor: 14 de 14 ok
exit 0

Otros checks de Aceptación, en este tramo o ya comprobados:
- A6: `test -f docs/reglas-deny.md` ok; `grep -c "bash -c"`: `docs/reglas-deny.md:2`, `AGENTS.md:2`; el resumen de `AGENTS.md` ocupa 3 líneas y enlaza el doc.
- A1: `grep -n "una sola llamada"` encuentra la regla en `agentes/principal.md` (línea 22) y en `skills/ejecutar-plan/SKILL.md` (línea 32); `grep -c "una vez" agentes/principal.md` = 2.
- A9: `node scripts/resolver.mjs modelo principal codex|claude-code|pi` → `gpt-6-luna`, `claude-haiku-5-5`, `openai/gpt-6-luna`; constructor igual.
- **A5 no se cumple en este plan**: `grep -c "docker system prune"` da 1 en `agentes/principal.md` y 0 en `skills/preparar-proyecto/SKILL.md`. La limpieza de Docker sale de `principal.md` en el tramo 5, que Franco dejó diferido. Lo deja para el principal.

## Notas

Recortes de `AGENTS.md` (antes de cada uno, `grep -rlF` del texto en `verify pruebas scripts agentes skills README.md AGENTS.md docs`: ninguna prueba lo exige). Formato: texto → dónde sigue.

1. Sección «Límites de las reglas deny» (10 líneas de detalle) → `docs/reglas-deny.md`, copia literal (`diff` IDENTICAL). En `AGENTS.md` queda un resumen de 3 líneas con el enlace.
2. Intro: «(movida, no borrada; sus rutas internas son las originales y no se ejecuta)» → «(movida, no borrada)» y «no se ejecuta» → README, «La v1». Se pierde el aviso de que las rutas internas de la v1 son las originales: es un dato menor, no está en otro archivo.
3. «Traspaso» (Aceptación y las dos puertas) → README, «Qué es» (puertas 1 y 2 y `## Aceptación`).
4. «Ejecutor» → `skills/planificar-cambio/SKILL.md`, regla 7 (`ejecutor:`) y `agentes/principal.md` (el principal ejecuta solo si Franco lo pide).
5. «Tramos» (revisión por tramo y usos reales) → `planificar-cambio`, regla 11; README, «Qué es». Se conservan `tramo-N.md`, `/compact`, `compactar_en` y `docs/evaluaciones/tramos.md`.
6. «Ventana propia» → README, «Ejecutar un plan en ventana propia» (esfuerzo no aplicado con `--agent` directo; Codex sin probar a mano). Se conserva que `instalar.sh` los crea y los regenera.
7. «Hecho» (la definición) → README, «Verificación» (y línea 19 de `README.md`).
8. «Ceremonia de cierre» → `agentes/principal.md`, paso 6 (archivar, commit, PR). Se conserva la regla de rama base limpia y la de rama sin mergear.
9. Skills: se quitan «(proyecto nuevo)» y «(tras `--migrar`)» → descripción de cada skill en su frontmatter.
10. «Workspaces» (raíz y archivos) → `skills/preparar-proyecto/SKILL.md`, sección 4. Se conserva la regla de `repos:`.
11. «Rama base» → `planificar-cambio`, regla 10. Se conservan «develop» y «liberar a main lo hace Franco a mano».
12. «Comando verify» (lista de comprobaciones y la advertencia de fiabilidad) → README, «Verificación» (y `docs/evaluaciones/constructor.md`). Se conserva el modo remoto (`VERIFY_TARGET`, `VERIFY_PERMITIR_ESCRITURA`) con su enlace a `preparar-proyecto` 3b.
13. «Migrar» → se quita «Después, la skill `migrar-proyecto`» (ya está en *Skills*); «agrega ... a .gitignore» pasa a «ignora ...». El comando y la lista de banderas incompatibles se conservan.
14. «Medidor de costos» → se quita «por modelo» de la cuota semanal de Codex (el detalle está en `docs/evaluaciones/costos.md`). Es una pérdida menor de descripción; se anota por si Franco la quiere de vuelta.
15. Resumen de deny: se quitan «separan comandos compuestos» y la nota sobre Codex experimental; el detalle queda en `docs/reglas-deny.md`. Se conservan «Codex no bloquea `.env`» y «Pi no tiene equivalente».

Intactos: *Reglas* de `AGENTS.md`, «Arnés de comparación con OpenSpec», «esfuerzo», la lista de skills, «Medidor» (nombre y ruta), `verify` y `pruebas/` (este tramo no los toca).

Pendiente para el principal: A5 (Docker) depende del tramo 5, diferido. Si Franco quiere cerrar A5, hay que reabrir el tramo 5 o retirar A5 del plan.
