---
estado: listo
rama: feature/kit-v2
---
# deny-endurecido

## Objetivo
El kit instala 12 reglas `permissions.deny` (las 7 actuales + 5 nuevas) para cerrar `git -C . commit` y `bash -c '…'`, que con las 7 dejaban pasar. Probado por Franco con Claude Code real: las 5 cierran ambos huecos sin bloquear `git status` ni `git log`.

## Alcance
`scripts/resolver.mjs` (solo la lista `REGLAS_DENY_CLAUDE`), `verify` (escalón 6), `AGENTS.md`, este plan. Fuera: `instalar.sh` y `desinstalar.sh` (ya agregan solo lo que falta y quitan solo lo registrado; no deberían cambiar), Pi, `legacy/`. Nada se prueba en el home real.

## Decisiones ya tomadas
- Las 5 reglas nuevas, añadidas **al final** de la lista (orden: las 7 de hoy, luego estas): `Bash(git * commit *)`, `Bash(git * push *)`, `Bash(bash -c *)`, `Bash(sh -c *)`, `Bash(zsh -c *)`.
- Un proyecto con las 7 recibe solo las 5 que faltan; el manifiesto registra solo las agregadas; desinstalar quita exactamente las registradas (hasta 12).
- Que el agente ya no pueda usar `bash -c` es intencional.
- Pi no cambia.

## Escenarios
- CUANDO el proyecto no tiene `settings.json` ENTONCES queda con las 12 en ese orden y el manifiesto tiene 12 líneas `deny`.
- CUANDO el proyecto tiene `allow`, otra clave y deny propios (incluida `Bash(git push *)`) ENTONCES se conservan y se registran las 11 agregadas.
- CUANDO el proyecto fue instalado con las 7 del kit (7 líneas `deny` en el manifiesto) y se reinstala ENTONCES se agregan y registran solo las 5 nuevas; hay 12 en el archivo y 12 líneas en el manifiesto; desinstalar deja el archivo original o ninguno.
- CUANDO las 7 eran del usuario (sin manifiesto) y se instala ENTONCES se agregan y registran solo 5; desinstalar quita esas 5 y deja las 7.

## Verificación
`./verify` — `VERIFY OK`. Actualizar el escalón 6: `REGLAS_DENY` con las 12, conteos 7→12 y 6→11, y dos escenarios nuevos: (6) actualización: instalar, luego simular el estado viejo (quitar del `settings.json` las 5 nuevas y sus 5 líneas del manifiesto), reinstalar y comprobar el resultado; (7) las 7 del usuario sin manifiesto. Cada escenario con su `HOME` temporal, como hoy.

## Pasos
- [x] Añadir las 5 reglas a `REGLAS_DENY_CLAUDE` en el resolver.
- [x] Actualizar los escenarios 1–2 de `verify` y agregar los escenarios 6 y 7 descritos arriba.
- [x] Prueba negativa: quitar `Bash(bash -c *)` de la lista del resolver, correr `./verify`, confirmar `FALLO` en el escalón 6 (código ≠ 0), restaurar con `cmp`.
- [x] `AGENTS.md`, «Límites de las reglas deny»: `git -C`, `git -c` y `bash -c`/`sh -c`/`zsh -c` quedan cubiertos; el agente ya no puede usar `bash -c` (intencional); sigue sin cubrirse un script que abre `.env` (Python, Node…): pide sandbox. Quitar esos comandos de la lista de «no cubren» (quedan `sudo` y `env <cmd>`, que no se probaron). En «Reglas», añadir `bash -c`/`sh -c`/`zsh -c` a lo que bloquea Claude Code.
- [x] Confirmar con `grep` que ningún otro archivo fuera de `legacy/` y `cambios/hechos/` dice «7 reglas».

## Evidencia manual (la corre el principal, no el constructor)
Tras el `COMPLETADO`, en una carpeta temporal con `git init`, un commit inicial hecho por mí, un archivo en el índice y `.claude/settings.json` generado con `node scripts/resolver.mjs fijar-deny claude …`: `claude -p --model claude-haiku-5-5 --allowedTools "Bash" < /dev/null` pidiendo `git commit`, `git -C . commit`, `git -c user.name=x commit`, `bash -c 'git commit …'` y `git status`. Cuenta de commits con `git log` antes y después (debe seguir igual) y control sin reglas (los commits sí ocurren). Se pega aquí.

## Evidencia
$ ./verify
== 6. reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto) ==
ok escenario 1: sin archivo -> 12 reglas y 12 líneas deny
ok escenario 2: se conservan allow, otra clave y deny propios; solo se registran las agregadas
ok escenario 3: reinstalar deja el archivo y las líneas deny iguales
ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo
ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta
ok escenario 6: actualización de 7 a 12 reglas; se agregan y registran solo las 5 nuevas
ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 5; desinstalar deja las 7
VERIFY OK
exit 0

Prueba negativa (quitar `Bash(bash -c *)` del resolver; `resolver.mjs` restaurado y comprobado con `cmp`):
$ ./verify
== 6. reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto) ==
FALLO: escenario 1: las reglas deny no son exactamente las 12 del kit
exit 1

## Notas
- Las 5 reglas nuevas quedaron al final de `REGLAS_DENY_CLAUDE`, en el orden del plan.
- `verify` tiene ahora `REGLAS_DENY_NUEVAS` (las 5 nuevas) para los escenarios 6 y 7.
- Escenario 6 simula el estado viejo reescribiendo el `settings.json` con `node` (quitando las 5) y quitando sus líneas `deny` del manifiesto con `grep -vF`; no usa el resolver para preparar el estado.
- `AGENTS.md`: además de lo del plan, la lista de reglas que bloquean en «Reglas» incluye `git … push` y `git -C … commit`, `git -c … commit`.
- Revisión del `grep` de «7 reglas»: sin coincidencias obsoletas fuera de `legacy/` y `cambios/hechos/` (solo descripciones históricas en `plan.md` y en el comentario de `verify`).
- La evidencia manual (Claude Code real) es del principal, no se ejecutó aquí.
