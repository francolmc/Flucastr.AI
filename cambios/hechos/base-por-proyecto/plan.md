---
estado: listo
rama: fix/base-por-proyecto
repos: [.]
ejecutor: constructor
---
# Rama base de desarrollo por proyecto (develop, main u otra)

## Objetivo
El principal y el constructor reconocen la rama donde el proyecto trabaja (p. ej. `develop`, con `main` solo para liberar) en vez de exigir siempre la rama principal del remoto; sin declararla, todo sigue igual que hoy.

## Supuestos
- La base se declara una vez en el `AGENTS.md` del proyecto («Rama base: develop») y el principal la copia a `base:` en cada plan. Si Franco prefiere solo preguntarla en cada plan, se quita un paso.
- Sin `base:` en el plan vale lo de hoy: rama de `origin/HEAD`; sin remoto, `main` o `master`. Así los proyectos que trabajan sobre `main` no cambian.
- `base:` es un nombre (vale para todas las carpetas de `repos:`) o un mapa `{carpeta: rama}` si en un workspace varían.
- El PR de cada cambio apunta a su base. Liberar `develop` a `main` lo hace Franco a mano; el kit no lo toca.

## Alcance
`skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `skills/preparar-proyecto/SKILL.md`, `agentes/principal.md`, `agentes/constructor.md`, `AGENTS.md`, `verify` (bloque 8h).
Fuera de alcance: `instalar.sh`, resolver, `modelos.json`, `old/`, liberar a `main`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque pasa las 4 preguntas de la Prueba de ejecutabilidad: son ediciones de texto con comprobación por `grep`, nada depende de un resultado en ejecución, los fallos están previstos y no toca credenciales.
- Texto único de la regla, para copiar igual en los tres lugares: «Rama base de una carpeta de `repos:`: la de `base:` del plan; sin `base:`, la de `git symbolic-ref --short refs/remotes/origin/HEAD`; sin remoto, `main` o `master`.»
- Si el repo está en una rama distinta de la base y el plan no trae `base:`, el principal pregunta cerrado: «¿`<rama actual>` es tu rama base?» (sí: la anota en `AGENTS.md` del proyecto y en `base:`) o «es un cambio sin mergear» (esperar el PR/merge).
- Mantener las frases «rama base» en constructor y ejecutar-plan: el bloque 8f de `verify` las busca.
- Las copias de `~/.claude` y `~/.pi` se generan desde el repo: Franco reinstala tras el merge.

## Escenarios
- CUANDO el plan trae `base: develop` y el repo está en `develop`, limpio y al día ENTONCES el principal sigue sin preguntar y el constructor crea la rama desde `develop`.
- CUANDO el plan no trae `base:` y el repo está en `main` ENTONCES se comporta como hoy.
- CUANDO el repo está en `develop`, el plan no trae `base:` y `AGENTS.md` no declara base ENTONCES el principal pregunta si `develop` es la base y, si sí, la anota.
- CUANDO el constructor recibe un repo fuera de su `base:` ENTONCES `PAUSA` con `motivo=acceso`.
- CUANDO termina el cambio ENTONCES el principal pide el PR hacia la `base:`, no hacia `main`.

## Verificación
`./verify` — debe terminar en `VERIFY OK`, con el bloque nuevo 8h.

## Pasos
- [x] En `planificar-cambio`, plantilla del frontmatter, agrega la línea `base: <rama>` (opcional; sin ella, la rama principal del remoto).
  - evidencia: skills/planificar-cambio/SKILL.md (línea 23 `base: <rama>   # opcional; sin ella, la principal del remoto`)
- [x] En `planificar-cambio` agrega la regla 10 «Base»: el texto único de la regla, el mapa `{carpeta: rama}` y la copia desde `AGENTS.md`.
  - evidencia: skills/planificar-cambio/SKILL.md (regla 10 en línea 82, después de la 9; el orden 1-10 se comprobó con grep)
- [x] En `agentes/principal.md`, paso 4, reemplaza el paréntesis de la rama base por el texto único de la regla.
  - evidencia: agentes/principal.md (paso 4: «debe estar en su rama base («Rama base de una carpeta de `repos:`: ...»)»)
- [x] En ese paso 4 agrega la pregunta cerrada de la rama distinta de la base y que anota la respuesta en `AGENTS.md`.
  - evidencia: agentes/principal.md (paso 4: pregunta «¿`<rama actual>` es tu rama base?» con la anotación en `AGENTS.md` y `base:`)
- [x] En `agentes/principal.md`, paso 6, cambia «abrir el PR de la rama» por «abrir el PR hacia su `base:`».
  - evidencia: agentes/principal.md (paso 6: «pídele abrir el PR hacia su `base:` y espera»)
- [x] En `agentes/constructor.md`, paso 2, aclara «rama base» con «(la de `base:` del plan; sin `base:`, la principal del remoto)».
  - evidencia: agentes/constructor.md (paso 2: «no está en la rama base (la de `base:` del plan; sin `base:`, la principal del remoto) o tiene»)
- [x] En `skills/ejecutar-plan/SKILL.md`, paso 2, reemplaza el paréntesis de la rama base por el texto único de la regla.
  - evidencia: skills/ejecutar-plan/SKILL.md (paso 2, viñeta 4: «no está en su rama base («Rama base de una carpeta de `repos:`: ...»)»)
- [x] En `preparar-proyecto`, sección 1, línea de Ramas, agrega «Rama base: `<rama>` solo si no es la principal del remoto».
  - evidencia: skills/preparar-proyecto/SKILL.md (sección 1, línea «- Ramas: ... Rama base: `<rama>` solo si no es la principal del remoto.»)
- [x] En `AGENTS.md` del kit agrega una viñeta: `base:` en el plan, declarada en el `AGENTS.md` del proyecto; sin ella, la principal del remoto.
  - evidencia: AGENTS.md (viñeta «Rama base: `base:` en el plan, declarada en el `AGENTS.md` del proyecto; sin ella, la principal del remoto.» tras la de Workspaces)
- [x] En `verify`, antes de 9a, agrega 8h: `base:` en `planificar-cambio`; «hacia su `base:`» en `principal.md`; «de `base:`» en constructor y ejecutar-plan.
  - evidencia: verify (bloque 8h insertado tras 8g y antes de 3e/9a; comprueba los 4 textos con grep -qF)
- [x] En 8h agrega la prueba negativa: copia de `ejecutar-plan` sin «de `base:`» debe fallar.
  - evidencia: verify (bloque 8h: copia de ejecutar-plan con sed 's/de `base:`/de base/g' y `if textos_base ...; then fallo`)
- [x] Corre `./verify` y pega en *Evidencia* las líneas de 8f y 8h.
  - evidencia: `./verify` exit 0, «VERIFY OK»; las líneas ok 8f y ok 8h están en *Evidencia*

## Evidencia
$ ./verify
(… cola de la salida real; la corrida completa tiene las líneas «ok» de cada bloque …)
ok 8b: textos clave presentes (incluido el modo remoto y Despliegue); copias sin repos:, sin «Descartado», sin definir-proyecto o sin VERIFY_TARGET fallan la comprobación
ok 8c: contrato del constructor presente (grep -c, siguiente=, no_intentado=, 3 corridas, git diff --stat, sin PARCIAL:); copias sin esas frases fallan
ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla
ok 8e: VERIFY_RAPIDO, docker system prune prohibido y timeoutMs presentes; el agente de Claude resuelve; copia sin VERIFY_RAPIDO falla
ok 8f: ceremonia de cierre, abrir el PR y rama base presentes; copia sin «ceremonia de cierre» falla
ok 8g: Prueba de ejecutabilidad en planificar-cambio y principal, y carga de ejecutar-plan presentes; copia sin la prueba falla
ok 8h: base: en planificar-cambio, «hacia su base:» en principal, «de base:» en constructor y ejecutar-plan; copia de ejecutar-plan sin «de base:» falla
== 3e. claude-<agente> y pi-<agente> con esfuerzo; reinstalar refresca; archivo sin marca se respeta ==
ok 3e: effort y thinking low->max al reinstalar, --effort en claude-constructor, archivo sin marca intacto, desinstalar limpia
== 9a. migrar-proyecto: lista de reglas descartadas y prohibición de copiarlas ==
ok 9a: migrar-proyecto trae «Reglas de v1 que descarté», «no las copies» y Fxx; una copia sin la lista falla
VERIFY OK
exit 0

## Notas
- Rama `fix/base-por-proyecto` creada desde `main` (`origin/HEAD` = `origin/main`). Antes solo había `cambios/base-por-proyecto/` sin trackear, dentro de lo permitido.
- Regla 10 de `planificar-cambio`: la inserté antes de la 9 por error y la moví después; el orden 1-10 se comprobó con grep.
- Bloque 8h de `verify` insertado tras 8g (antes de 3e y 9a). Sus mensajes de `fallo` no llevan backticks, para no romper las comillas dobles.
- `./verify` pasó en la primera corrida (1 de 3). No hubo commit, push ni PR.
