# Pasos del plan permisos-contrato

## Pasos

### Tramo 1: contrato y generación conservadora

Archivos: `scripts/resolver.mjs`, `instalar.sh`, `.gitignore`, `pruebas/permisos-contrato/generacion.test.mjs`.

- [x] En `scripts/resolver.mjs` generar la política desde capacidades explícitas y retirar los permisos amplios, aplicando las restricciones y el cierre ante duda; comprobar casos ausentes, comandos exactos, metacaracteres y reglas Codex con `node --test pruebas/permisos-contrato/generacion.test.mjs`.
- [x] En `instalar.sh` integrar la generación preservando reglas ajenas e idempotencia; comprobar instalaciones repetidas y que no se active un permiso de script sin protección mediante `node --test pruebas/permisos-contrato/generacion.test.mjs`.
- [x] En `.gitignore` permitir que se versionen las pruebas de permisos; comprobar con `git check-ignore pruebas/permisos-contrato/generacion.test.mjs` que deja de estar ignorada.

Evidencia tramo 1: `node --test pruebas/permisos-contrato/generacion.test.mjs` — pasa (2/2). Comprueba el filtrado de capacidades, exclusión de comandos de script y metacaracteres, ausencia de permiso para `git status`, deny conservados, transmisión de `AGENTS.md` e idempotencia al reinstalar. `git check-ignore -v pruebas/permisos-contrato/generacion.test.mjs` no la marca como ignorada (exit 1, sin salida). La corrida dentro del sandbox devolvió `EPERM` al crear procesos hijos; la repetición fuera del sandbox pasó.

Verificación del tramo: `node --test pruebas/permisos-contrato/generacion.test.mjs`.

### Tramo 2: protección y uso efectivo

Archivos: `scripts/permisos-hook.mjs`, `instalar.sh`, `scripts/kit-run.mjs`, `pruebas/permisos-contrato/hook.test.mjs`.

- [ ] En `scripts/permisos-hook.mjs` implementar la decisión conservadora de Claude y la comprobación contra HEAD descritas; comprobar limpio, modificado, preparado, ausente y protegido mediante `node --test pruebas/permisos-contrato/hook.test.mjs`.
- [ ] En `instalar.sh` registrar el hook de Claude sin pisar hooks ajenos y activar la autorización únicamente cuando la protección esté instalada; comprobar reinstalación y decisiones mediante `node --test pruebas/permisos-contrato/hook.test.mjs`.
- [ ] En `scripts/kit-run.mjs` asegurar que se usa la política efectiva del proyecto sin relajarla; comprobar principal, constructor y ejecución mediante `node --test pruebas/permisos-contrato/hook.test.mjs`.

Verificación del tramo: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs`.

### Tramo 3: contrato y verificación final

Archivos: `nucleo/contrato/verificacion.md`, `friccion.md`, `verify`, `pruebas/permisos-contrato/estructura.test.mjs`.

- [ ] En `nucleo/contrato/verificacion.md` escribir una vez el alcance de la garantía y la revisión de scripts; Comprobación: leer el diff y confirmar que no se promete una protección que la herramienta no ofrece.
- [ ] En `friccion.md` registrar con referencia la evidencia de Docker de Don Financio y el estado comprobado o pendiente de loopback; Comprobación: contrastar cada afirmación con `cambios/auditoria-codex-permisos-esperas/hallazgo.md`.
- [ ] En `verify` sustituir las comprobaciones de cantidad y lista fija por estructura y comportamiento sin eliminar las negativas pertinentes; comprobar reglas generadas y regresiones mediante `node --test pruebas/permisos-contrato/estructura.test.mjs` y `./verify`.

Verificación del tramo: `./verify`.

