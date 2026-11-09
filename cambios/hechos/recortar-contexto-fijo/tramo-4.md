# Tramo 4: recortes del constructor y ejecutar-plan
Resultado: `constructor.md` y `ejecutar-plan` sin repeticiones. Toca esos dos archivos y, si hace falta, `verify`.

## Pasos
- [x] Por cada duplicado entre `constructor.md` y `ejecutar-plan` (git permitido, lectura por tramos, salidas largas, estados, formato de retorno, ejemplos): dejarlo en un solo archivo y citarlo en una línea en el otro; anotar cada recorte (A4)
  - evidencia: `agentes/constructor.md` y `skills/ejecutar-plan/SKILL.md` (git y estados en `constructor.md`, citados desde `ejecutar-plan`; procedimiento de tramos y salidas largas en `ejecutar-plan`, citados desde `constructor.md`; retorno en `constructor.md`, citado desde `ejecutar-plan`); recortes anotados en *Notas*
- [x] En `ejecutar-plan`: quitar los ejemplos de evidencia y de `COMPLETADO`/`PAUSA` (el formato queda) y plegar «Ritmo de cada paso» en el bucle sin perder «reproduce, cambia lo mínimo, repite el mismo comando» (A4)
  - evidencia: `grep -c "Ejemplo de" skills/ejecutar-plan/SKILL.md` → 0; `grep -c "Ritmo de cada paso" skills/ejecutar-plan/SKILL.md` → 0; `grep -c "vuelve a correr el mismo comando" skills/ejecutar-plan/SKILL.md` → 1
- [x] Antes de cada borrado correr el `grep` de la regla de oro; si una prueba exige el texto, mover la exigencia (A4)
  - evidencia: `grep -rnF` de cada texto retirado sobre `verify pruebas scripts agentes skills AGENTS.md` (salida en *Notas*); exigencias movidas en `verify`: 8c `siguiente=` y `no_intentado=` → `agentes/constructor.md`; 11 `Ejemplo de \`COMPLETADO\`` → `COMPLETADO: plan=<ruta>; tramo=<n>; verify=pasa` en `agentes/constructor.md`
- [x] Comprobar metas: `constructor.md` ≤ 2200 y `ejecutar-plan` ≤ 5800 sin quitar la línea «una sola llamada» (A1, A3)
  - evidencia: `wc -c agentes/constructor.md` → 2165 (≤ 2200); `wc -c skills/ejecutar-plan/SKILL.md` → 5387 (≤ 5800); `grep -c "una sola llamada" skills/ejecutar-plan/SKILL.md` → 1

Verificación del tramo: `./verify` (A1, A3, A4).

## Evidencia

Tamaños (bytes, `wc -c`), antes del tramo → después:

| Archivo | Antes | Después | Meta |
| --- | --- | --- | --- |
| `agentes/constructor.md` | 2616 | 2165 | ≤ 2200 |
| `skills/ejecutar-plan/SKILL.md` | 7184 | 5387 | ≤ 5800 |

$ ./verify
...
ok 12: pruebas del medidor pasaron sobre los fixtures
VERIFY OK
exit 0

(salida completa: 107 líneas `ok`; el `AVISO 10` por falta de `pruebas/comparar-openspec/` ya existía antes de este tramo y no es un fallo.)

## Notas
- Recortes (archivo: qué se quitó → dónde sigue / por qué sobra):
  - `agentes/constructor.md`: «Solo trabajas con un plan en `estado: aprobado`…» → una línea; la regla de estado la repite `ejecutar-plan`, paso 1.
  - `agentes/constructor.md`: bloque de tramos → una línea que cita *Tramo* de `ejecutar-plan`, donde vive el procedimiento.
  - `agentes/constructor.md`: git → se quita «si el encargo trae `Rama:` y no existe» (la creación de la rama es el paso 2 de `ejecutar-plan`); la lista de comandos de lectura se conserva porque 8c la exige.
  - `agentes/constructor.md`: «Salidas largas» completo → cita a *Bucle de ejecución* de `ejecutar-plan`.
  - `agentes/constructor.md`: «En el plan escribes…» y «Lee por tramos…» → condensados sin cambiar la regla.
  - `skills/ejecutar-plan/SKILL.md`: párrafo «Git de lectura permitido…» → cita a *Límites* del constructor, donde vive la regla.
  - `skills/ejecutar-plan/SKILL.md`: *Tramo* → condensado; se conservan «Si el plan trae `tramo: <n>` en el frontmatter», `tramo-<n>.md`, `/compact` y el resumen de 5 líneas.
  - `skills/ejecutar-plan/SKILL.md`: «Ritmo de cada paso» (encabezado y lista numerada) → viñeta «Ritmo:» en el bucle; conserva «vuelve a correr el mismo comando».
  - `skills/ejecutar-plan/SKILL.md`: «Con pendientes continúas…» → quitado; la viñeta del bucle dice lo mismo.
  - `skills/ejecutar-plan/SKILL.md`: primera línea de `PAUSA` → cita a *Retorno* del constructor (`siguiente=` y `no_intentado=` quedan allí).
  - `skills/ejecutar-plan/SKILL.md`: ejemplo de línea de evidencia, ejemplos de `COMPLETADO`/`PAUSA`, «Retorno de tramo» y «Estados que usas» → quitados; quedan en *Límites* y *Retorno* del constructor.
- Pruebas (`verify`, sin debilitar ninguna): 8c `siguiente=` y `no_intentado=` pasan de `ejecutar-plan` a `agentes/constructor.md`; 11 `Ejemplo de \`COMPLETADO\`` pasa a `COMPLETADO: plan=<ruta>; tramo=<n>; verify=pasa` en `agentes/constructor.md`. Siguen exigidos en `ejecutar-plan`: «Resuelto:», «Salidas largas», «/compact», «tramo-<n>.md», «vuelve a correr el mismo comando», «Si el plan trae `tramo: <n>` en el frontmatter», «git status», «rama base», `base:`, `repos:`, `git -C <carpeta>`, `bash pendientes-plan`, `awk`, «3 corridas».
- Regla de oro: antes de cada borrado, `grep -rnF` de cada texto retirado sobre `verify pruebas scripts agentes skills AGENTS.md`. Los textos retirados solo aparecían en `skills/ejecutar-plan/SKILL.md` (y, en `verify`, las dos exigencias movidas). `principal.md` y `planificar-cambio` no se tocan en este tramo.
- Sin contradicciones: `constructor.md` y `ejecutar-plan` no se contradicen en estados, git ni retorno; el constructor manda sobre git, estados y formato, y la skill manda sobre el procedimiento.
- Pendientes tras cerrar: 0 (contador `bash pendientes-plan` sobre `tramo-4.md`, exit 0).
- Sigue: tramo 6 (`AGENTS.md`, `docs/reglas-deny.md` y medición final). El tramo 5 está diferido por Franco.
