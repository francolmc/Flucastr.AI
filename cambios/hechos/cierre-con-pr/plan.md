---
estado: listo
rama: feature/cierre-con-pr
repos: [.]
ejecutor: principal
---
# Ceremonia de cierre con commit y PR, y base limpia para la rama siguiente

## Objetivo
Un cambio no termina con el commit: termina cuando Franco abre el PR. El siguiente cambio no crea su rama sobre una rama sin mergear ni sobre una base sucia o atrasada.

## Supuestos
- «Terminado» = Franco confirma que abrió el PR; no se espera el merge. Si quiere esperar el merge, cambia un texto del paso 6 del principal.
- El archivado (mover a `cambios/hechos/`) ocurre ANTES del commit, para que el commit lleve el movimiento. Si prefiere archivar después, hace falta un segundo commit.
- La rama base se detecta con `git symbolic-ref --short refs/remotes/origin/HEAD`; sin remoto, `main` o `master`.
- «Al día» se comprueba con `git fetch` y `git rev-list --count HEAD..origin/<base>`; sin remoto se omite.
- El principal no cambia de rama (solo tiene permitido `git switch -c`): quien se pasa a la base y hace `pull` es Franco.

## Alcance
`agentes/principal.md`, `agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`, `AGENTS.md`, `verify` (bloque nuevo 8f).
Fuera de alcance: `modelos.json`, instaladores, `old/`, reglas deny, `README.md`.

## Decisiones ya tomadas
- Ejecutor `principal`: son textos de contrato entre agentes y una prueba negativa en `verify`; piden criterio, no solo mecánica.
- Un cambio pendiente (rama sin mergear) detiene al principal y pregunta a Franco; no bloquea ni ramifica solo. Franco lo eligió.
- Base: siempre la rama principal actualizada, árbol limpio. Franco lo eligió.
- El plan vive sin commitear en la base mientras se aprueba; por eso «limpio» ignora `cambios/<nombre>/`.
- La red de seguridad del constructor es solo `PAUSA` (`motivo=acceso`); la pregunta a Franco es del principal.

## Escenarios
- CUANDO termina un cambio y Franco aprueba la evidencia ENTONCES el principal archiva el plan, pide el commit y espera.
- CUANDO Franco confirma el commit ENTONCES el principal le pide abrir el PR y no empieza otro cambio hasta que confirme que lo abrió.
- CUANDO llega un cambio nuevo y el repo está en una rama que no es la base ENTONCES el principal se detiene y pregunta con dos opciones: esperar el PR/merge (recomendada) o que Franco pase a la base él mismo.
- CUANDO la base está atrasada o con cambios fuera de `cambios/<nombre>/` ENTONCES el principal pide a Franco `git switch <base> && git pull` y no crea la rama.
- CUANDO el constructor recibe `Rama:` y el repo no está en la base o está sucio ENTONCES devuelve `PAUSA` con `motivo=acceso`.

## Verificación
`./verify` — debe terminar en `VERIFY OK`, con el bloque 8f nuevo.

## Pasos
- [x] En `agentes/principal.md`, reemplaza el paso 6 por la «ceremonia de cierre»: archivar antes del commit, pedir commit, esperar, pedir abrir el PR, esperar confirmación.
- [x] En ese paso 6 agrega: mientras esperas el commit o el PR, no empieces otro cambio.
- [x] En el paso 4 del principal agrega «Base limpia»: antes de delegar, cada carpeta de `repos:` en la rama base, limpia fuera de `cambios/<nombre>/` y al día.
- [x] En «Base limpia» agrega: si está en otra rama, detente y pregunta cerrado (esperar PR/merge, recomendada; o Franco pasa a la base).
- [x] En «Base limpia» agrega: si la base está atrasada o sucia, pide a Franco `git switch <base> && git pull`; tú no cambias de rama.
- [x] En el paso 2 de `agentes/constructor.md` agrega: si la carpeta no está en la rama base o tiene cambios fuera de `cambios/<nombre>/`, `PAUSA` con `motivo=acceso`.
- [x] En el paso 2 de `skills/ejecutar-plan/SKILL.md` agrega la misma comprobación de rama base antes de `switch -c`.
- [x] En `AGENTS.md`, sección «Cómo funciona», agrega una viñeta con la ceremonia de cierre y la base limpia.
- [x] En `verify`, antes del bloque 9a, agrega 8f: `principal.md` con «ceremonia de cierre» y «abrir el PR»; constructor y ejecutar-plan con «rama base».
- [x] En 8f agrega la prueba negativa: copia de `principal.md` sin «ceremonia de cierre» debe fallar.
- [x] Corre `./verify` (≈ lo que tarde hoy) y pega la salida de 8f en *Evidencia*.

## Evidencia
`./verify` terminó en `VERIFY OK`. Línea nueva: `ok 8f: ceremonia de cierre, abrir el PR y rama base presentes; copia sin «ceremonia de cierre» falla`.
Cambios: AGENTS.md, agentes/principal.md, agentes/constructor.md, skills/ejecutar-plan/SKILL.md, verify (5 archivos, +22 −3).

## Notas
(la escribe quien ejecuta)
