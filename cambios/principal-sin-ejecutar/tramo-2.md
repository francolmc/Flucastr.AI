# Tramo 2 — `tipo: docs` y verificación liviana

Resultado: un cambio solo de documentos se verifica sin build ni Docker, y el constructor pausa si el diff toca otra cosa.
Archivos: `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `agentes/constructor.md`.

## Pasos
- [ ] En la plantilla de `planificar-cambio` agrega al frontmatter la línea `tipo: codigo   # docs si el cambio solo toca documentos (regla 12)`. (A3)
- [ ] Agrega la regla 12 en `planificar-cambio`: «**Tipo.** `tipo: docs` solo si el cambio toca archivos `*.md` o `docs/`. Su *Verificación* es liviana, sin build ni Docker: `git diff --check` más comprobar que existen las rutas y los comandos que el documento cita (`test -f`, `rg`). Sin `tipo:`, es `codigo`.» (A3)
- [ ] En `ejecutar-plan`, bajo *Antes de empezar*, agrega: «Con `tipo: docs`, al terminar confirma con `git diff --name-only <base>` que solo cambiaron `*.md` o `docs/`; si cambió otra cosa, `PAUSA` con `motivo=alcance`.» (A3)
- [ ] En `agentes/constructor.md` no agregues texto; solo comprueba que su línea de *Límites* ya remite a `ejecutar-plan` y anótalo en *Notas*. (A3)
- [ ] Comprueba que `planificar-cambio` sigue ≤ 10500 bytes y `ejecutar-plan` ≤ 6300 (hoy 9945 y 5778). (A3)
- [ ] `./verify` (A3)

Verificación del tramo: `./verify`; cubre A3.
