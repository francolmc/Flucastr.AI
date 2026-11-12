---
estado: listo
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
Puede cambiar: `agentes/principal.md`, `scripts/resolver.mjs` (solo la lista `PREFIJOS_ALLOW_CODEX` y su comentario), `verify` (paso 3f y un bloque nuevo 8l), `README.md` (líneas de reglas de Codex), `pruebas/kit-run/probar.mjs` (solo el caso V3).
Fuera de alcance: `modelos.json`, `instalar.sh`, `agentes/constructor.md`, `skills/`, los proyectos Byteria y DonFinancio, sandbox y red de Codex.

## Decisiones ya tomadas
- Resuelto: 2026-11-11 V3 de `pruebas/kit-run/probar.mjs` (línea ≈324) exigía esfuerzo `low`, pero el principal ya es `medium` (commit b6b8bea). Se corrige la prueba, no `modelos.json`: V3 debe comparar `rev.e` con el esfuerzo de `agentes.principal` leído de `modelos.json`, sin cifra fija.
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
- [x] En `agentes/principal.md`, paso 5, bajo `COMPLETADO`, añade una viñeta: «En Codex, corre la *Verificación* con `exec_command` directo (sin `bash -lc`, sin `> log`) y, cuando devuelva «Script running with cell ID N», haz una sola llamada `wait` con ese `cell_id` y `yield_time_ms: 300000`; repítela solo mientras siga «Script running». Esas esperas no cuentan en el presupuesto de llamadas. No sondees con `tail` ni `write_stdin` vacío. No devuelvas PAUSA por un `verify` aún en curso: PAUSA solo si falla o pasan 30 min en total.» (A1)
  - evidencia: `agentes/principal.md` línea 36 (viñeta nueva); `grep -F 'yield_time_ms: 300000' agentes/principal.md` y `grep -F 'no cuentan'`, exit 0 ambos
- [x] En la misma frase de «Presupuesto desde el retorno hasta el veredicto», añade «(sin contar las esperas de `verify`)» antes del punto final de esa oración. (A1)
  - evidencia: `agentes/principal.md` línea 35, frase «de código, hasta 15 (sin contar las esperas de `verify`).»
- [x] En `scripts/resolver.mjs`, añade a `PREFIJOS_ALLOW_CODEX` estas reglas, una por línea: `["/bin/bash","-lc","./verify"]`, `["/bin/bash","-lc","VERIFY_RAPIDO=1 ./verify"]`, `["docker","compose","build"]`, `["docker","compose","up"]`, `["docker","compose","run"]`, `["docker","compose","ps"]`, `["docker","compose","logs"]`, `["docker","compose","stop"]`, `["docker","compose","down"]`, `["docker","version"]`, `["pnpm","install"]`, `["pnpm","lint"]`, `["pnpm","test"]`, `["pnpm","build"]`, `["pnpm","typecheck"]`. Son 15 nuevas: 25 `allow` y 10 `forbidden`. (A3)
  - evidencia: `scripts/resolver.mjs`, `PREFIJOS_ALLOW_CODEX` con 25 entradas `allow`; `node --check scripts/resolver.mjs`, exit 0
- [x] Actualiza el comentario sobre `PREFIJOS_ALLOW_CODEX` con una línea: Docker queda fuera del sandbox, por eso Compose y las dos formas de `bash -lc` van como `allow`. (A3)
  - evidencia: `scripts/resolver.mjs` línea 674 (comentario de Docker) y líneas 678-692 (reglas nuevas), `node --check`, exit 0
- [x] En `verify`, paso 3f: cambia el conteo de `prefix_rule` de 20 a 35 y el texto «10 forbidden y 10 allow» a «10 forbidden y 25 allow». (A3)
  - evidencia: `verify` línea 842 (`= 35` y «35 prefix_rule»); `ok 3f: execpolicy ...` en la corrida (`/tmp/.../scratchpad/verify-1.log` línea 76)
- [x] En `verify`, paso 3f: añade a la lista de comandos que deben dar `allow` los 15 comandos nuevos (para las dos formas de bash usa el argumento `/bin/bash -lc "VERIFY_RAPIDO=1 ./verify"` como argv, no troceado), y añade `docker system prune` y `docker volume rm x` a los que no deben decidir nada. Actualiza el `echo "ok 3f: ..."` final. (A3, A4)
  - evidencia: `verify` paso 3f: lista `allow` con 15 comandos nuevos y `docker system prune`/`docker volume rm x` sin decisión; `ok 3f: execpolicy ...` en el log (línea 76), sin FALLO de 3f
- [x] En `verify`, añade tras 8k un bloque 8l con el patrón de 8k: comprueba que `agentes/principal.md` contiene `yield_time_ms: 300000` y `no cuentan`, y que una copia sin la primera cadena falla. (A2)
  - evidencia: `verify` bloque 8l; `ok 8l: principal con «yield_time_ms: 300000» y «no cuentan»; copia sin la receta falla` (log línea 90)
- [x] En `README.md`, en la línea de comandos permitidos de Codex (línea 72), añade `docker compose` (build, up, run, ps, logs, stop, down), `docker version` y `pnpm` (install, lint, test, build, typecheck), y menciona la forma `bash -lc`. (A5)
  - evidencia: `README.md` línea 72; `$ grep -F 'docker compose' README.md` → 1 línea (72), exit 0
  - evidencia: `pruebas/kit-run/probar.mjs` líneas 331-333 (`rev.m` igual a `revBase.m`; `rev.e` igual a `MODELOS_BASE.agentes.principal.esfuerzo`); `$ node pruebas/kit-run/probar.mjs` → `ok V3 ...` y `kit-run: 17 casos pasaron`, exit 0
- [x] En `pruebas/kit-run/probar.mjs`, caso V3: reemplaza `assert.equal(rev.e, "low")` por una comparación con el esfuerzo de `agentes.principal` leído del `modelos.json` del repo. Comprueba que V3 pasa y que `rev.e` sigue siendo el del principal. (A6)
  - evidencia: `$ ./verify` → `VERIFY OK`, exit 0 (cola en *Evidencia*)
- [x] Corre `./verify` y copia su cola en *Evidencia*. (A6)

## Evidencia
$ ./verify
(cola de la corrida final; log completo en `/tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/e30a8052-f02f-4d43-b832-d773b4462714/scratchpad/verify-2.log`)
...
pruebas del medidor: 19 de 19 ok
ok 12: pruebas del medidor pasaron sobre los fixtures
== 13. kit run: arnés con constructor, verify y revisor simulados ==
ok A1 ciclo completo: listo, constructor una vez, revisor en solo lectura
ok A2 verify que siempre falla: 3 corridas del constructor y parcial
ok C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente
ok C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
ok V2 revisor con nivel bajo: Luna low; el constructor no cambia
ok V3 sin kit_run el revisor usa el modelo y esfuerzo del principal
ok V4 nivel inválido en kit_run.revisor: exit 2 y plan intacto
ok V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

## Notas
- Ramas y pasos 1 a 8: `fix/codex-esperas-permisos` ya era la rama actual y el árbol estaba limpio; no se creó nada.
- Paso 3f: el bloque `/bin/bash -lc` se comprueba en un bucle aparte con `"$c"` como un solo argumento, porque el bucle general separa por espacios.
- Paso 3f: se añadió `docker system prune` y `docker volume rm x` a la lista que no debe decidir nada (A4), además de `docker run x` y `bash -lc git status`.
- Paso V3 (nuevo, tras la PAUSA): el test comparaba el revisor sin `kit_run` con el de `kit_run` (`low`) y exigía `low`. Ahora compara el modelo con el de `kit_run` (igual, `gpt-6.1-terra`) y el esfuerzo con `MODELOS_BASE.agentes.principal.esfuerzo` (`medium`). Hubo que quitar el `deepEqual` completo, porque el esfuerzo ya no coincide con el de `kit_run`.
- Corrida 1 de `./verify`: exit 1 solo por V3. Corrida 2: exit 0, `VERIFY OK`. Tope de 3 corridas no alcanzado.
