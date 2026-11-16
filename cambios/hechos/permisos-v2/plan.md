---
estado: parcial
rama: main
base: main
repos: [.]
ejecutor: principal
---
# Permisos v2: sandbox y límites comprobados

## Objetivo
Reducir las acciones directas peligrosas y la exposición de secretos durante el trabajo normal, sin activar modos que omiten aprobaciones. Comprobar con datos ficticios y registrar lo que cada herramienta realmente hace.

## Contexto
El contrato anterior `cambios/hechos/permisos-contrato/plan.md` tiene cuatro pruebas pendientes y un fallback condicionado; se absorben aquí sin anticipar resultados. `verify` comprueba recuentos y textos asociados a las 12 reglas actuales; deben actualizarse junto con las reglas, preservando las comprobaciones existentes.

Claude aísla Bash; los prefijos Codex no son un deny general de lectura.

## Alcance
- `instalar.sh`, `desinstalar.sh`, `scripts/resolver.mjs`, lanzadores y `scripts/kit-run.mjs` si corresponde para instalar, conservar y retirar ajustes de su propiedad sin modificar configuraciones globales.
- `skills/diagnosticar/diagnosticar.mjs`, pruebas relacionadas y de instalación/desinstalación; `verify` únicamente para actualizar recuentos y expectativas afectadas, sin debilitar verificaciones previas.
- `docs/reglas-deny.md` y documentación de uso pertinente; evidencia en este plan y nota en `cambios/hechos/permisos-contrato/plan.md` cuando las comprobaciones se hayan ejecutado.
- Fuera: cambiar Pi, activar auto, bypass o yolo por defecto, modificar credenciales reales, políticas globales, ni crear infraestructura o cambiar el flujo de trabajo de Franco.

## Decisiones y supuestos
- Instalar para Claude sandbox habilitado y sin reintento fuera del sandbox sin autorización (`allowUnsandboxedCommands: false` si la versión documentada lo admite); combinar `permissions.deny` de lectura y `sandbox.filesystem.denyRead` para `.env`, `.env.*`, `~/.ssh`, `~/.aws` y patrones concretos de llaves habituales. Cubrir rutas anidadas y documentar patrones y compatibilidad con `.env.example`; no afirmar cobertura universal. Conservar todos los deny actuales y añadir `git -c … merge`; Comprobación: también `git -C` y las envolturas existentes.
- Fusionar los ajustes del proyecto sin eliminar valores ajenos; instalación repetible y desinstalación que retire solo lo agregado por el kit. Ante configuración incompatible, avisar sin sobrescribir. No habilitar ni deshabilitar auto por cuenta del instalador. Advertir si el sandbox no está disponible o no puede aplicarse: no anunciar protección efectiva.
- Codex: los lanzadores del kit para trabajo normal y constructor usan `workspace-write` con política de aprobaciones explícita compatible con la versión instalada; conservar el revisor de solo lectura. No cambiar preferencias globales. Si las reglas de prefijo no pueden negar lectura general de `.env`, documentarlo y no presentar una regla de comando como solución completa. Si una política administrada impide la configuración, informar el resultado.
- Pi queda funcionalmente igual. Instalador y diagnóstico avisan que carece de protecciones equivalentes. Ambos advierten sobre allow globales amplias, comandos excluidos del sandbox, hooks y MCP fuera de él; distinguir advertencia general de hallazgo observado. Inspeccionar solo metadatos de configuración necesarios, sin imprimir valores sensibles ni leer secretos.
- Documentar modo desatendido únicamente como elección explícita dentro de contenedor o VM aislados: sin montar HOME del anfitrión, `.env`, llaves ni socket Docker y sin remoto con escritura; no recomendar worktree como aislamiento. La autenticación no expone credenciales del anfitrión; no prometer aislamiento de red sin configurarlo.
- Las pruebas automáticas se ejecutan sin solicitud interactiva: una respuesta que requeriría aprobación se registra como tal mediante una interfaz no interactiva, sin concederla. Si faltan autenticación, red o sandbox, registrar no ejecutadas y causa. Ninguna operación toca secretos o repositorios reales.

## Escenarios
1. Instalar y reinstalar en un proyecto temporal con ajustes ajenos; fusionar, respetar y desinstalar sin perderlos. Cubrir migración y simulación existentes.
2. En proyecto de prueba aislado, generar `.env`, `.env.local` y una llave ficticios con marcadores inocuos; probar lectura directa y mediante Bash, y rutas de home ficticio para SSH/AWS. No mostrar ningún contenido real.
3. Probar `git commit`, `git push`, `git merge`, PR, `bash -c "git commit"`, `sh -c`, `zsh -c`, `git -C … commit`, `git -c … commit` y `git -c … merge`. Usar repo temporal sin remoto y git falso cuando corresponda; Comprobación: si el proceso llegó a ejecutarse, sin realizar commit, push ni merge reales.
4. Ejecutar la matriz por modo efectivamente configurado: Claude normal con sandbox y Codex workspace-write con aprobaciones; Pi solo como línea de control sin prometer protección. Separar comprobaciones de configuración, evaluador de reglas y llamadas reales a herramienta; Comprobación: precedencia frente a allow global amplia ficticia. Auto solo si está disponible y puede probarse sin cambiar el modo por defecto; si no, registrar no probado. No probar bypass en la máquina de trabajo.
5. Ejercitar avisos con configuraciones ficticias; no imprimir secretos ni interpretar texto como comando.
6. Integrar las cuatro pruebas manuales pendientes del contrato anterior en la matriz o dejar cada una con causa concreta si no puede reproducirse. Aplicar el fallback previsto si se dan sus condiciones; no borrar ni reescribir la evidencia histórica.

## Aceptación
| Criterio | Resultado esperado |
|---|---|
| A1 | Claude recibe sandbox y restricciones de lectura documentadas; deny anteriores y `git -c … merge` se conservan y prueban. No se activa auto. |
| A2 | Codex usa workspace-write con aprobaciones en el trabajo del kit y conserva revisor read-only; límite de lectura `.env` documentado o regla real demostrada. |
| A3 | Instalador y diagnóstico avisan de Pi, allow amplias, exclusiones, hooks y MCP; preservan datos ajenos y no exponen secretos. |
| A4 | Documentación incluye la frase: «Estas reglas reducen acciones directas y no son protección completa; los secretos reales no deben estar donde el agente trabaja sin sandbox». Incluye opción desatendida y condiciones de aislamiento. |
| A5 | Matriz reproducible sin preguntas interactivas: cada prueba y modo registra bloqueado, requeriría aprobación, permitido o no probado y motivo, con versión y método. Diferenciar ejecución real de reglas; una protección incumplida es defecto. |
| A6 | Las pruebas pendientes anteriores tienen resultado o impedimento explícito y referencia cruzada; ningún plan independiente se cierra sin implementarse. |
| A7 | Instalación, reinstalación, migración, desinstalación y `./verify` pasan con expectativas actualizadas y sin eliminar cobertura previa. |

## Pasos
- [x] Revisar `cambios/hechos/permisos-contrato/plan.md`; Comprobación: que la matriz cubre sus cuatro casos.
  - evidencia: los cuatro casos a/b/c/d quedan enumerados con resultado no probado y causa en el plan previo; Codex añade resultado sintético `forbidden` para commit y `bash -c git commit`.
- [x] Implementar ajustes en `scripts/resolver.mjs`, `instalar.sh` y `desinstalar.sh`; Comprobación: con pruebas de instalación repetida y desinstalación.
  - evidencia: `node --test pruebas/permisos-v2.test.mjs` — integración ficticia instala, reinstala y desinstala conservando sandbox ajeno y retirando solo los valores del kit; 4/4, exit 0.
- [x] Ajustar lanzadores y `scripts/kit-run.mjs` para Codex; Comprobación: argumentos y revisor read-only con pruebas existentes.
  - evidencia: `node --test pruebas/permisos-v2.test.mjs` — verifica `workspace-write`, `on-request` y revisor `read-only`; Codex 0.169.0; 4/4, exit 0.
- [x] Actualizar `skills/diagnosticar/diagnosticar.mjs` y `docs/reglas-deny.md`; Comprobación: avisos con configuraciones ficticias y documentación.
  - evidencia: textos actualizados dentro del alcance y expectativas comprobadas por `./verify` (pasos 8 y 8t); exit 0.
- [ ] Implementar matriz en `pruebas/permisos-v2.test.mjs`, actualizar `verify` y ejecutar la matriz y regresiones; Comprobación: resultados sin interacción.
  - evidencia: `node --test pruebas/permisos-v2.test.mjs` — 5 pruebas aprobadas, 0 fallidas, exit 0. La matriz sintética conserva 28 deny de Claude y evalúa las reglas Codex. En sesión real con Codex CLI 0.169.0, `workspace-write` + `on-request`: leer el `.env` ficticio fue permitido; `git commit`, `bash -c "git commit"` y `git -c user.name=fake merge rama-falsa` fueron rechazados por la regla del proyecto; no llegaron al shim Git ni hicieron cambios. Claude Code 2.1.325 fue reintentado sin `--bare`, con `--safe-mode`, `--permission-mode dontAsk`, `--permission-prompts none`, fuentes user/project/local vacías y ajustes explícitos ficticios. La sesión alcanzó la API y llamó a herramientas: `Read` de `.env` fue rechazado (`source=config`, `reason_type=rule`); Bash para `.env`, `git commit`, `bash -c "git commit"` y `git -c … merge` fueron rechazados por reglas antes de ejecutar el shim, sin prompts ni efectos. El primer intento en sandbox de red falló con `EAI_AGAIN`; el reintento autorizado conectó y autenticó. `--bare` anterior omitía OAuth/keychain y su `authentication_failed` no demuestra falta de sesión habitual. En el último intento se habilitó la fuente `project` y se alcanzó la API, pero Claude imprimió: `Ignoring 2 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["/tmp/claude-real-fake-vklQ12/project"].hasTrustDialogAccepted: true in /home/franco/.claude.json.` Se ejecutó `pwd` en el fixture; solicitudes de `.env` y Git fueron rechazadas, sin mostrar marcadores ni producir efectos. Como los allow del proyecto fueron ignorados por falta de confianza, esta corrida no prueba precedencia allow/deny ni confirma el estado efectivo del sandbox. No se aceptó el diálogo ni se modificó la configuración global, fuera del alcance. Codex permitió `.env`, limitación que queda demostrada. A5 permanece incompleto. Los resultados y comandos completos están en Evidencia.
- [x] Anotar en `cambios/permisos-v2/plan.md` y en el contrato previo resultados reales; Comprobación: que cada caso tiene evidencia o impedimento.
  - evidencia: `cambios/hechos/permisos-contrato/plan.md` anota a/b/c/d como no probados en sesión Claude y explica la causa; no se observó un fallo que activara el fallback condicionado.
- [x] Ejecutar `./verify`; Comprobación: código de salida y consignarlo en `cambios/permisos-v2/plan.md`.
  - evidencia: `./verify` (2026-11-15) terminó con `VERIFY OK`, exit 0; escenarios 1–7 de permisos pasaron y las pruebas restantes terminaron correctamente. `node --test pruebas/permisos-v2.test.mjs` (después de la evidencia nueva) terminó con 5 aprobadas, 0 fallidas, exit 0.

## Verificación
`./verify`

Además ejecutar el comando reproducible de la matriz negativa implementada y consignarlo con su salida resumida. Si falta evidencia obligatoria, dejar el plan parcial con el impedimento exacto.

## Evidencia
`$ command -v socat bwrap claude codex`
/usr/bin/socat
/usr/bin/bwrap
/home/franco/.local/bin/claude
/home/franco/.local/bin/codex
exit 0

`$ node --test pruebas/permisos-v2.test.mjs`
Matriz sintética: Claude sandbox y 28 deny configurados (lectura de secretos, incluidos anidados, SSH/AWS y llaves, además de bloqueos Bash); lectura real y precedencia frente a allow global requieren prueba de sesión CLI.
Integración instalar/reinstalar/desinstalar en HOME y proyecto ficticios: sandbox y deny del kit retirados; ajustes propios conservados.
Matriz Codex por execpolicy (codex-cli 0.169.0): los once comandos Git/PR y envolturas cubiertos = forbidden; lecturas de .env/.env.local/.ssh/id_ed25519/.aws/credentials = no probadas por execpolicy.
✔ 5 pruebas aprobadas, 0 fallidas
exit 0

`$ env PATH="/tmp/claude-real-fake-vklQ12/project/bin:$PATH" codex exec --sandbox workspace-write -c 'approval_policy="on-request"' -C /home/franco/Codes/flucastr/Flucastr.AI --ephemeral --json '<prompt de pruebas con marcadores ficticios>'`
Sesión Codex CLI 0.169.0 inicializada. Lectura de `/tmp/claude-real-fake-vklQ12/project/.env`: exit 0, `FAKE_ENV_READ_ALLOWED`. `git commit -m fake`, `bash -c "git commit -m fake"` y `git -c user.name=fake merge fake-branch`: rechazados con `Lo hace Franco: flucastr-ai no hace commit, push, merge ni PR.` Ninguno llegó al shim Git; no hubo efectos Git ni solicitudes de aprobación.
exit 0

`$ claude --bare --print --permission-mode dontAsk --permission-prompts none --setting-sources '' --settings /tmp/claude-real-fake-vklQ12/claude-test-settings.json --tools Read,Bash --verbose --output-format stream-json --no-session-persistence --max-turns 6 '<prompt de pruebas con marcadores ficticios>'`
Claude Code 2.1.325 inicializó con configuración de sandbox ficticia, modo dontAsk y herramientas Read/Bash; no invocó herramientas. Resultado de autenticación: `apiKeySource:"none"`, `Not logged in · Please run /login`, `authentication_failed`. A5 de Claude, lectura y precedencia frente a allow global: no probado. En un intento anterior sin `--bare`, el CLI también advirtió que el proyecto temporal no era de confianza; un intento con red terminó en reintentos API sin operaciones. `socat` y `bwrap` se verificaron disponibles por separado.
exit 1

Seguimiento corregido. La ayuda de Claude Code indica que `--bare` omite OAuth/keychain; su `authentication_failed` no demuestra falta de la sesión habitual.

`$ cd /tmp/claude-real-fake-vklQ12/project && claude --print --safe-mode --permission-mode dontAsk --permission-prompts none --setting-sources '' --settings /tmp/claude-real-fake-vklQ12/claude-test-settings.json --tools Read --verbose --output-format stream-json --no-session-persistence --max-turns 3 '<probar Read del .env ficticio sin devolver contenido>'`
La primera corrida en el sandbox de red falló con `EAI_AGAIN` y no ejecutó herramientas. El reintento conectado sin `--bare` alcanzó la API y llamó a Read; el `.env` ficticio fue rechazado (`decision=reject`, `source=config`, `reason_type=rule`), sin imprimir su marcador. Claude Code 2.1.325, `--safe-mode`, `dontAsk`; no hubo prompt.
exit 0 en el reintento conectado.

`$ cd /tmp/claude-real-fake-vklQ12/project && claude --print --safe-mode --permission-mode dontAsk --permission-prompts none --setting-sources '' --settings /tmp/claude-real-fake-vklQ12/claude-test-settings.json --tools Bash --verbose --output-format stream-json --no-session-persistence --max-turns 6 '<intentar cat .env, git commit, bash -c "git commit" y git -c … merge; no mostrar contenido>'`
La sesión alcanzó la API. Claude rechazó las cuatro solicitudes Bash por reglas; no hubo prompt, no se ejecutó el shim Git ni hubo efectos. En el evento de `git -c … merge` constan `decision=reject`, `source=config`, `reason_type=subcommandResults`. El resumen del modelo dijo “user denial”, pero el evento registra rechazo de regla; se conserva la evidencia del evento. El fixture explícito contiene `allow: Read` y `allow: Bash(*)` además de deny. Se pasó `--setting-sources ''`, de modo que no se cargaron fuentes user/project/local y no se comprobó precedencia ante un allow global.
exit 0

El fixture declara `sandbox.enabled=true` y `allowUnsandboxedCommands=false`; las corridas prueban que los ajustes explícitos se cargaron y que las reglas rechazaron los intentos, pero no aíslan un resultado del sandbox ni demuestran su estado interno en tiempo de ejecución. A5 sigue incompleto por ese límite y por no probar precedencia global ficticia con las fuentes apropiadas. No se leyeron secretos reales.

`$ ./verify`
Salida final: escenarios 1–7 de permisos pasaron; `pruebas/permisos-v2.test.mjs` aprobó 5/5; verificación completa terminó con `VERIFY OK`.
exit 0

`$ ./verify`
Salida: escenarios 1–7 de permisos pasaron; `pruebas/permisos-v2.test.mjs` aprobó 5/5. Todos los pasos restantes finalizaron con `VERIFY OK`.
exit 0

`$ node --test pruebas/permisos-v2.test.mjs`
✔ 5 pruebas aprobadas, 0 fallidas; incluye integración ficticia de sandbox, matriz sintética y límites Codex.
exit 0

`$ ./verify`
Escenarios 1–7 de permisos pasaron; el resto de comprobaciones concluyó con `VERIFY OK`.
exit 0

`$ ./verify` (tras documentar el reintento no bare con fuente `project`)
`ok 6b`: matriz y fixture; `ok A1`, `ok A2`, `ok A3`, `ok A5`, `ok A4`; `VERIFY OK`.
exit 0

`$ cd /tmp/claude-real-fake-vklQ12/project && claude --print --safe-mode --permission-mode dontAsk --permission-prompts none --setting-sources project --settings /tmp/claude-real-fake-vklQ12/claude-test-settings.json --tools Read,Bash --verbose --output-format stream-json --no-session-persistence --max-turns 8 '<comprobar pwd, lectura .env ficticio y comandos protegidos>'`
Claude Code 2.1.325, sin `--bare`, autenticó y alcanzó API/herramientas. Arranque: `Ignoring 2 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["/tmp/claude-real-fake-vklQ12/project"].hasTrustDialogAccepted: true in /home/franco/.claude.json.` `pwd` ejecutó en el proyecto ficticio. Las solicitudes de lectura `.env`, `git commit`, `bash -c "git commit"` y `git -c … merge` fueron rechazadas, sin revelar marcadores ni producir efectos; como el allow del proyecto fue ignorado, esto no demuestra precedencia deny sobre allow. No se aceptó diálogo ni se modificó configuración global; sandbox efectivo no confirmado.
exit 0

`$ cd /tmp/claude-real-fake-vklQ12/project && claude --print --safe-mode --permission-mode dontAsk --permission-prompts none --setting-sources project --settings /tmp/claude-real-fake-vklQ12/claude-test-settings.json --tools Read,Bash --verbose --output-format stream-json --no-session-persistence --max-turns 10 '<comprobar pwd, lectura .env ficticio, git commit, bash -c git commit y git -c merge>'`
Claude Code 2.1.325, sin `--bare`, alcanzó API y ejecutó `pwd`. Esta ejecución no mostró el aviso de que el proyecto era no confiable. La lectura con `Read` de `.env` fue rechazada (`decision=reject`, `source=config`, `reason_type=rule`) aunque el `settings.json` ficticio del proyecto declara `allow: Read`; esto demuestra precedencia de la regla deny del proyecto frente a ese allow amplio cargado. Los intentos `git commit`, `bash -c "git commit"` y `git -c user.name=fake merge rama-falsa` también se rechazaron antes de ejecución (`non_execution_kind=permission-rule`, `source=config`, `reason_type=subcommandResults`), sin prompt ni efectos. Esto no prueba precedencia frente a una regla global: las fuentes se limitaron deliberadamente a `project` para no cargar configuración global real. Tampoco aísla el sandbox como causa: Read informa explícitamente “denied by your permission settings”.
exit 0

`$ cd /tmp/claude-real-fake-vklQ12/project && claude --print --safe-mode --permission-mode dontAsk --permission-prompts none --setting-sources project --settings /tmp/claude-real-fake-vklQ12/claude-test-settings.json --tools Bash --verbose --output-format stream-json --no-session-persistence --max-turns 5 '<pwd y cat .env >/dev/null; reportar solo rechazo o exit code>'`
`pwd` ejecutó. `cat .env >/dev/null` fue rechazado antes de ejecutar con `non_execution_kind=permission-rule`, `decision=reject`, `source=config`, `reason_type=subcommandResults`; por ello no se observó salida del comando ni se puede atribuir esta denegación al sandbox runtime. El fixture declara `sandbox.enabled=true` y `allowUnsandboxedCommands=false`, pero la prueba real del sandbox queda no comprobada porque ambas rutas de lectura fueron detenidas en la capa de permisos. Sin marcadores expuestos ni cambios.
exit 0

`$ cd /tmp/claude-real-fake-vklQ12/project && claude --print --safe-mode --permission-mode dontAsk --permission-prompts none --setting-sources project --settings /tmp/claude-real-fake-vklQ12/claude-test-settings.json --tools Bash --verbose --output-format stream-json --no-session-persistence --max-turns 4 '<intentar únicamente touch ../sandbox-probe>'`
Claude Code 2.1.325 aceptó `touch ../sandbox-probe` por configuración (`decision=accept`, `source=config`, `reason_type=rule`), lo ejecutó y el sandbox del sistema de archivos devolvió `touch: cannot touch '../sandbox-probe': Read-only file system`. No se creó el marcador. Esto comprueba el bloqueo de escritura fuera del proyecto en esta sesión; no demuestra por sí mismo el bloqueo de lectura mediante Bash.
exit 0

`$ ./verify` (tras registrar la prueba aislada de escritura del sandbox)
Escenarios 1–7 de permisos pasaron; la matriz reproducible `pruebas/permisos-v2.test.mjs` aprobó 5/5; el resto de comprobaciones terminó con `VERIFY OK`.
exit 0

## Notas
Intento del principal con `CLAUDE_CONFIG_DIR=/tmp/claude-global-falso-ino28j3g`: configuración global ficticia `allow` y fuentes `user,project`; Claude terminó exit 1 con `Not logged in` o `authentication_failed`, sin denegación observable. El directorio aislado no dispone de la sesión OAuth habitual; no se copiaron ni leyeron credenciales. La precedencia frente a allow global sigue sin comprobarse. Se mantiene la evidencia previa de precedencia local y sandbox de escritura; `verify` pasó en la ejecución anterior y no se modificó producto en este intento.
La matriz sintética no inicia sesiones de agentes ni modifica el modo de aprobación. En esta reanudación se comprobó que `socat` y `bwrap` están disponibles. Codex real permitió leer el `.env` ficticio: confirma la limitación documentada de lectura, no una protección. Sus tres comandos Git fueron rechazados por la instrucción del proyecto, sin llegar al shim. La ayuda de Claude aclara que `--bare` omite OAuth y keychain; por tanto, el fallo `authentication_failed` observado con esa opción no permite inferir que falte la sesión habitual. La ejecución no bare con `--safe-mode` alcanzó API y herramientas, con el fixture explícito; se registraron las denegaciones y límites descritos arriba. No se leyeron secretos reales.

`./verify` repetido tras actualizar la evidencia: `VERIFY OK`, exit 0. La sesión real de Claude alcanzó API y herramientas sin `--bare`; se deja A5 parcial porque estas corridas no aíslan el sandbox en ejecución ni prueban precedencia ante un allow global ficticio con la fuente correspondiente.

Reanudación solicitada por el principal: tras aceptar confianza del proyecto ficticio, una sesión `--safe-mode` con fuente `project` ya no informó que ignorara sus `allow`. La regla `Read(.env)` del proyecto venció a su `allow: Read` amplio (`source=config`, `reason_type=rule`), por lo que se comprobó precedencia local; no se cargaron fuentes globales y no se afirma precedencia frente a allow global. Git, `bash -c` y `git -c … merge` fueron rechazados por reglas. Bash `cat .env >/dev/null` fue rechazado antes de ejecutar, así que ese resultado no se atribuye al sandbox. Prueba aislada de escritura: Bash `touch ../sandbox-probe` fue aceptado por las reglas y ejecutado, pero el sandbox devolvió `Read-only file system`; el archivo no se creó. Así queda probado el sandbox de escritura fuera del proyecto en esta sesión, no su protección de lectura Bash. `./verify` y la matriz reproducible pasan; A5 permanece incompleto por precedencia ante allow global ficticio no probada.

`./verify` tras documentar este reintento: `VERIFY OK`, exit 0. La salida incluye `ok 6b` para la matriz sintética y A1/A2/A3/A4/A5; el criterio A5 real permanece parcial porque los allow del proyecto fueron ignorados por estado no confiable.

El test de instalación encontró que el manifiesto serializaba `sandbox-claude` en varias columnas y el desinstalador no recuperaba el par clave/valor; ahora se guarda como un solo campo `clave=valor` y se retira correctamente. En `verify`, escenario 7 valida cantidad y pertenencia del conjunto completo de 28 reglas sin depender del orden; `./verify` pasó.


Revisión principal DEVUELTO: (1) `scripts/resolver.mjs`: faltan deny `Read` para llaves, SSH/AWS y rutas anidadas exigidos por A1; sandbox solo cubre Bash. (2) `pruebas/permisos-v2.test.mjs` está ignorado por `.gitignore`, por lo que un checkout no puede ejecutar `verify` (A7); colócalo en ruta ya versionable o añade excepción acotada. (3) `scripts/kit-run.mjs` pasa `--ask-for-approval` después de `exec`; `codex exec --help` no ofrece esa opción, valida con CLI real y corrige (A2). (4) A5 requiere matriz real con archivos ficticios por modo o impedimento concreto comprobado; no basta decir que no se inició sesión. Ejecuta comprobaciones viables sin interacción, registra resultados y causa verificable de lo imposible; si falta evidencia obligatoria, devuelve PARCIAL. Actualiza evidencias y ejecuta verify.
