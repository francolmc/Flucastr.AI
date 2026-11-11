---
estado: aprobado
rama: fix/codex-esperas-permisos
base: main
repos: [.]
ejecutor: constructor
---
# Codex: el principal espera al verify y menos permisos

## Objetivo
En Codex, el principal espera hasta el final un `verify` largo en vez de devolver PAUSA, y las reglas `allow` del kit cubren Docker Compose, pnpm y las dos formas reales de lanzar `verify`. Evidencia: `cambios/auditoria-codex-permisos-esperas/hallazgo.md`.

## Supuestos
- Tope de espera del principal: 30 min en total, el mismo `background_terminal_max_timeout` de los lanzadores. Si Franco quiere otro, cambia una cifra en un paso.
- Las reglas `allow` de `docker compose` son por subcomando (`build`, `up`, `run`, `ps`, `logs`, `stop`, `down`), no `docker compose` a secas. Si Franco prefiere abierto, se reduce a una regla.
- `docker run`, `docker rm`, `docker volume` y `docker system prune` quedan sin regla: siguen pidiendo permiso.

## Alcance
Puede cambiar: `agentes/principal.md`, `scripts/resolver.mjs` (solo la lista `PREFIJOS_ALLOW_CODEX` y su comentario), `verify` (paso 3f y un bloque nuevo 8l), `README.md` (líneas de reglas de Codex).
Fuera de alcance: `modelos.json`, `instalar.sh`, `agentes/constructor.md`, `skills/`, los proyectos Byteria y DonFinancio, sandbox y red de Codex.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: requisitos cubiertos, archivos accesibles, comprobaciones con resultado esperado, sin credenciales ni producción.
- Se mantiene la frase «una sola espera» en `principal.md`: `verify` 8k la exige.
- Codex trata `VERIFY_RAPIDO=1 ./verify` como una sola cadena de `bash -lc` (así quedó en `~/.codex/rules/default.rules`), por eso se añaden las dos reglas literales de `/bin/bash -lc`. La regla `["VERIFY_RAPIDO=1","./verify"]` actual se conserva.
- Las reglas solo rigen en un proyecto con `.codex/rules/flucastr.rules`; Byteria y DonFinancio no lo tienen. Reinstalar (`bash instalar.sh --proyecto <ruta>`) lo hace Franco después del merge: no está en este plan.

## Escenarios
- CUANDO el principal revisa un tramo en Codex y `verify` tarda más que una llamada ENTONCES `principal.md` le ordena una sola `wait` con `cell_id` y `yield_time_ms: 300000`, repetida mientras siga «Script running», y esas esperas no cuentan en el presupuesto (A1)
- CUANDO se quita ese texto de `principal.md` ENTONCES `./verify` falla (A2)
- CUANDO Codex evalúa `docker compose up`, `pnpm install` o `/bin/bash -lc "VERIFY_RAPIDO=1 ./verify"` ENTONCES la decisión es `allow` (A3)
- CUANDO evalúa `docker run x`, `docker system prune` o `git commit` ENTONCES no hay `allow` para los dos primeros y `git commit` sigue `forbidden` (A4)
- CUANDO se lee el README ENTONCES lista los comandos nuevos (A5)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | `agentes/principal.md` trae la receta de espera de Codex | `grep -F 'yield_time_ms: 300000' agentes/principal.md` y `grep -F 'no cuentan' agentes/principal.md` | ambos encuentran una línea |
| A2 | Sensibilidad: una copia sin la receta falla | bloque 8l de `verify` | la copia sin `yield_time_ms: 300000` hace fallar la comprobación |
| A3 | Los comandos nuevos son `allow` | paso 3f de `verify` con `codex execpolicy check` | `allow` en `docker compose build/up/run/ps/logs/stop/down`, `pnpm install/lint/test/build/typecheck`, `docker version` y las dos formas `/bin/bash -lc` |
| A4 | Lo no cubierto sigue sin regla | paso 3f de `verify` | sin `allow` ni `forbidden` para `docker run x`, `docker system prune`, `docker volume rm x`; `git commit -m x` sigue `forbidden` |
| A5 | README al día | `grep -F 'docker compose' README.md` | aparece en la línea de permitidos |
| A6 | Todo el kit coherente | `./verify` | termina con exit 0 |

## Verificación
`./verify` (unos minutos, sin Docker) — debe terminar con exit 0.

## Pasos
- [ ] En `agentes/principal.md`, paso 5, bajo `COMPLETADO`, añade una viñeta: «En Codex, corre la *Verificación* con `exec_command` directo (sin `bash -lc`, sin `> log`) y, cuando devuelva «Script running with cell ID N», haz una sola llamada `wait` con ese `cell_id` y `yield_time_ms: 300000`; repítela solo mientras siga «Script running». Esas esperas no cuentan en el presupuesto de llamadas. No sondees con `tail` ni `write_stdin` vacío. No devuelvas PAUSA por un `verify` aún en curso: PAUSA solo si falla o pasan 30 min en total.» (A1)
- [ ] En la misma frase de «Presupuesto desde el retorno hasta el veredicto», añade «(sin contar las esperas de `verify`)» antes del punto final de esa oración. (A1)
- [ ] En `scripts/resolver.mjs`, añade a `PREFIJOS_ALLOW_CODEX` estas reglas, una por línea: `["/bin/bash","-lc","./verify"]`, `["/bin/bash","-lc","VERIFY_RAPIDO=1 ./verify"]`, `["docker","compose","build"]`, `["docker","compose","up"]`, `["docker","compose","run"]`, `["docker","compose","ps"]`, `["docker","compose","logs"]`, `["docker","compose","stop"]`, `["docker","compose","down"]`, `["docker","version"]`, `["pnpm","install"]`, `["pnpm","lint"]`, `["pnpm","test"]`, `["pnpm","build"]`, `["pnpm","typecheck"]`. Son 15 nuevas: 25 `allow` y 10 `forbidden`. (A3)
- [ ] Actualiza el comentario sobre `PREFIJOS_ALLOW_CODEX` con una línea: Docker queda fuera del sandbox, por eso Compose y las dos formas de `bash -lc` van como `allow`. (A3)
- [ ] En `verify`, paso 3f: cambia el conteo de `prefix_rule` de 20 a 35 y el texto «10 forbidden y 10 allow» a «10 forbidden y 25 allow». (A3)
- [ ] En `verify`, paso 3f: añade a la lista de comandos que deben dar `allow` los 15 comandos nuevos (para las dos formas de bash usa el argumento `/bin/bash -lc "VERIFY_RAPIDO=1 ./verify"` como argv, no troceado), y añade `docker system prune` y `docker volume rm x` a los que no deben decidir nada. Actualiza el `echo "ok 3f: ..."` final. (A3, A4)
- [ ] En `verify`, añade tras 8k un bloque 8l con el patrón de 8k: comprueba que `agentes/principal.md` contiene `yield_time_ms: 300000` y `no cuentan`, y que una copia sin la primera cadena falla. (A2)
- [ ] En `README.md`, en la línea de comandos permitidos de Codex (línea 72), añade `docker compose` (build, up, run, ps, logs, stop, down), `docker version` y `pnpm` (install, lint, test, build, typecheck), y menciona la forma `bash -lc`. (A5)
- [ ] Corre `./verify` y copia su cola en *Evidencia*. (A6)

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
