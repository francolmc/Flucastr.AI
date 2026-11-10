# Tramo 2 — `tipo: docs` y verificación liviana

Resultado: un cambio solo de documentos se verifica sin build ni Docker, y el constructor pausa si el diff toca otra cosa.
Archivos: `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `agentes/constructor.md`, `agentes/principal.md` (una frase).

## Pasos
- [x] En la plantilla de `planificar-cambio` agrega al frontmatter la línea `tipo: codigo   # docs si el cambio solo toca documentos (regla 12)`. (A3)
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 27; `rg -n '^tipo:'` da esa línea
- [x] Agrega la regla 12 en `planificar-cambio`: «**Tipo.** `tipo: docs` solo si el cambio toca archivos `*.md` o `docs/`. Su *Verificación* es liviana, sin build ni Docker: `git diff --check` más comprobar que existen las rutas y los comandos que el documento cita (`test -f`, `rg`). Sin `tipo:`, es `codigo`.» (A3)
  - evidencia: `skills/planificar-cambio/SKILL.md`, regla 12 tras la regla 11 (antes de «## Antes de pedir la aprobación»)
- [x] En `ejecutar-plan`, bajo *Antes de empezar*, agrega: «Con `tipo: docs`, al terminar confirma con `git diff --name-only <base>` que solo cambiaron `*.md` o `docs/`; si cambió otra cosa, `PAUSA` con `motivo=alcance`.» (A3)
  - evidencia: `skills/ejecutar-plan/SKILL.md`, párrafo tras «Git, estados y retorno» dentro de *Antes de empezar*
- [x] En `agentes/constructor.md` no agregues texto; solo comprueba que su línea de *Límites* ya remite a `ejecutar-plan` y anótalo en *Notas*. (A3)
  - evidencia: `rg -n 'ejecutar-plan' agentes/constructor.md` da las líneas 4, 11 y 16 (*Límites* remite a `ejecutar-plan`); sin cambios en `agentes/constructor.md`
- [x] Comprueba que `planificar-cambio` sigue ≤ 10500 bytes y `ejecutar-plan` ≤ 6300 (hoy 9945 y 5778). (A3)
  - evidencia: `wc -c skills/planificar-cambio/SKILL.md skills/ejecutar-plan/SKILL.md` = 10279 y 5941
- [x] En `agentes/principal.md`, regla «Puedes leer y correr comandos de lectura…»: cambia «dentro de `cambios/<nombre>/`» por «dentro de `cambios/`» y, tras «`docs/proyecto.md`», agrega «(y el `.gitignore` del workspace)». Así `definir-proyecto` (`cambios/.gitkeep`) y `preparar-proyecto` (`.gitignore`) quedan dentro de la lista. No agregues otra cosa. Comprueba `wc -c agentes/principal.md` ≤ 8000 y que `rg -n 'Solo creas o editas' agentes/principal.md` sigue dando una línea; si pasa de 8000, recorta una redundancia. (A1, A6)
  - evidencia: `agentes/principal.md` línea 15 («Solo creas o editas archivos dentro de `cambios/`, y el `AGENTS.md`, `docs/proyecto.md` (y el `.gitignore` del workspace)…»); `wc -c` = 7980; `rg -c 'Solo creas o editas'` = 1
- [x] `./verify` (A1, A3, A6)
  - evidencia: `./verify`, exit 0 (log en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/130cd7b4-aa17-47e9-9b0f-adb9d37e7121/scratchpad/verify-t2.log`; cola: «pruebas del medidor: 18 de 18 ok», «VERIFY OK»)

Verificación del tramo: `./verify`; cubre A1, A3, A6.
