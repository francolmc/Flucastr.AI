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

- [x] En `scripts/permisos-hook.mjs` implementar la decisión conservadora de Claude y la comprobación contra HEAD descritas; comprobar limpio, modificado, preparado, ausente y protegido mediante `node --test pruebas/permisos-contrato/hook.test.mjs`.
  - evidencia: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs` — exit 0; incluye verificación del hook.
- [x] En `instalar.sh` registrar el hook de Claude sin pisar hooks ajenos y activar la autorización únicamente cuando la protección esté instalada; comprobar reinstalación y decisiones mediante `node --test pruebas/permisos-contrato/hook.test.mjs`.
  - evidencia: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs` — exit 0; verifica preservación de hooks ajenos e idempotencia.
- [x] En `scripts/kit-run.mjs` asegurar que se usa la política efectiva del proyecto sin relajarla; comprobar principal, constructor y ejecución mediante `node --test pruebas/permisos-contrato/hook.test.mjs`.
  - evidencia: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs` — exit 0; verifica bloqueo sin hook y ejecución de constructor/revisor en el mismo proyecto.

Evidencia tramo 2: `$ node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs` — 6 pruebas aprobadas, 0 fallidas; cubre autorización exacta, archivos limpios/modificados/preparados/ausentes, acciones protegidas, hooks ajenos, idempotencia y `kit run`.
exit 0

Integración real de Claude Code: `claude --version` devuelve `2.1.323 (Claude Code)`. No se ejecutó una sesión de agente contra el servicio; la comprobación ejercita el protocolo PreToolUse y la instalación en un proyecto Git temporal, pero no una conversación real con Claude.

Verificación del tramo: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs`.

### Tramo 3: cierre seguro, diagnóstico y verificación final

Archivos: `instalar.sh`, `scripts/permisos-hook.mjs`, `scripts/kit-run.mjs`, `skills/diagnosticar/diagnosticar.mjs`, `nucleo/contrato/verificacion.md`, `friccion.md`, `verify`, `pruebas/permisos-contrato/estructura.test.mjs`, `pruebas/permisos-contrato/hook.test.mjs`.

- [x] En `instalar.sh` y `scripts/permisos-hook.mjs` condicionar toda autorización propia a instalar y verificar el hook; si falla, retirar solo autorizaciones generadas por el kit, preservar reglas ajenas y avisar. Probar fallo, ausencia, reinstalación y configuración previa mediante la suite del tramo.
  - evidencia: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs pruebas/permisos-contrato/estructura.test.mjs` — 9/9, exit 0; cubre hook ausente/instalación, política de `kit run`, recuperación/idempotencia y conservación de reglas/hooks ajenos.
- [x] En `instalar.sh` y `skills/diagnosticar/diagnosticar.mjs` detectar `allow` amplias en ajustes globales y de proyecto, incluyendo `Bash(*)`, `npm *`, `docker *` y `bash -c`, e informar origen y regla exacta sin modificarlas; diagnóstico también avisa si falta hook o hay `allow` sin él. Probar con ajustes temporales y no leer credenciales.
  - evidencia: la misma suite terminó 9/9, exit 0; `hook.test.mjs` configura reglas ficticias globales, de proyecto y proyecto-local y comprueba origen, regla literal y `allow-sin-hook`.
- [ ] En `scripts/kit-run.mjs` y `scripts/permisos-hook.mjs` preparar el retorno a autorización automática solo en `kit run` si Franco informa fallo en b, c o d; probar el retorno y la conservación de ajustes ajenos en proyecto temporal.

- [x] En `nucleo/contrato/verificacion.md` escribir una vez el alcance de la garantía y la revisión de scripts; Comprobación: leer el diff y confirmar que no se promete una protección que la herramienta no ofrece.
  - evidencia: revisión del diff; la única línea permanente restringe la garantía a permisos del kit y somete efectos internos de scripts a revisión de evidencia.
- [x] En `nucleo/contrato/verificacion.md` añadir una línea que limite la garantía a lo instalado por el kit; comprobar que identifica permisos ajenos como excepción.
  - evidencia: esa misma línea dice “solo los permisos instalados por el kit”, diferenciando las autorizaciones ajenas.
- [x] En `friccion.md` registrar con referencia la evidencia de Docker de Don Financio y el estado comprobado o pendiente de loopback; Comprobación: contrastar cada afirmación con `docs/investigaciones/auditoria-codex-permisos-esperas/hallazgo.md`.
  - evidencia: el registro enlaza el hallazgo que acredita 30 escalaciones Docker y deja loopback como pendiente de reproducción.
- [x] En `verify` sustituir las comprobaciones de cantidad y lista fija por estructura y comportamiento sin eliminar las negativas pertinentes; comprobar reglas generadas y regresiones mediante `node --test pruebas/permisos-contrato/estructura.test.mjs` y `./verify`.
  - evidencia: suite del tramo 9/9, exit 0; `./verify` — `VERIFY OK`, exit 0. Se conserva la comprobación negativa de comandos protegidos y se valida estructuralmente que solo `ls` queda como `allow` seguro.
- [ ] Preparar la prueba real descrita en `plan.md` y esperar los resultados de Franco; registrar a/b/c/d en Evidencia. Si b, c o d falla, aplicar y probar el retorno previsto en este mismo tramo; si a falla, corregir sin ampliar la autorización insegura.

Evidencia de preparación manual: los cuatro pasos están especificados en `plan.md`; no se ejecutó la sesión real y no se inventan resultados.

Verificación del tramo: `node --test pruebas/permisos-contrato/generacion.test.mjs pruebas/permisos-contrato/hook.test.mjs pruebas/permisos-contrato/estructura.test.mjs` y `./verify`; además, prueba real de Franco registrada en Evidencia.

