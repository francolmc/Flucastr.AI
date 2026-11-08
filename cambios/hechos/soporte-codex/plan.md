---
estado: listo
rama: feature/soporte-codex
base: main
repos: [.]
ejecutor: constructor
tramo: 4
---
# Soporte para Codex CLI

## Objetivo
`instalar.sh` configura también Codex CLI: skills, agentes `principal` y `constructor`, lanzador `codex-<agente>` con modelo y esfuerzo de `modelos.json`, y reglas deny en el proyecto. `desinstalar.sh` lo deshace. `./verify` lo comprueba sin llamar a modelos.

## Supuestos
- Codex se detecta si existe `~/.codex` o el comando `codex` (igual que Pi). `--solo` acepta también `codex`. Si Franco quiere otra detección, cambia solo el paso 3.2.
- Los agentes se instalan como TOML en `~/.codex/agents/<nombre>.toml` (documentado). `sandbox_mode` y permisos no se pueden fijar ahí; heredan de la sesión.
- Skills: enlace (modo repo) o copia (modo descarga) en `~/.agents/skills`, ruta documentada de Codex. Si el tramo 1 muestra que otra ruta funciona mejor, se cambia en *Resuelto*.
- El esfuerzo usa `model_reasoning_effort`; `max` no existe en Codex y se traduce a `xhigh`. Si Franco prefiere error en vez de traducir, cambia el paso 2.3.
- El constructor corre en Codex como subagente (`spawn constructor`) o con la ventana propia `codex-constructor`.

## Alcance
Puede cambiar: `modelos.json`, `scripts/resolver.mjs`, `instalar.sh`, `desinstalar.sh`, `verify`, `agentes/*.md` (solo si hace falta texto neutro de herramienta), `README.md`, `AGENTS.md`, `docs/`, `PENDIENTES.md`.
Fuera de alcance: skills (su contenido), `old/`, `pruebas/.temporales/`, `~/.codex/config.toml` y `auth.json` (no se leen ni se editan), reglas globales `~/.codex/rules/`.

## Decisiones ya tomadas
- Lanzador `codex-<agente>` con `-m`, `-c model_reasoning_effort=` y las instrucciones del agente; sin perfil `-p`. Porque la documentación no permite abrir una sesión «como» un agente, y es el mismo patrón que `claude-<agente>`.
- Perfil nuevo `codex-openai` en `modelos.json` con los mismos modelos que `pi-openai`; `perfil_por_defecto.codex`. Porque Franco eligió modelos GPT-6 propios.
- Reglas deny: `prefix_rule(..., decision="forbidden")` en `<proyecto>/.codex/rules/flucastr.rules`, solo con `--proyecto`. Experimentales y solo cargan en proyectos trusted: se dice en la ayuda y en `AGENTS.md`.
- Codex lee `AGENTS.md` de forma nativa: no se genera ningún otro archivo de instrucciones del proyecto.
- Resuelto: 2026-11-08 las reglas de Codex bloquean por prefijo: `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C`, `git -c`, `bash -c`, `sh -c`, `zsh -c` (probado en el tramo 1: un prefijo `git -C` bloquea `git -C . commit`). NO se bloquea `bash -lc`/`sh -lc`: Codex ejecuta sus comandos así y se rompería todo; por la documentación Codex divide esos scripts lineales y evalúa cada comando. Se acepta que `git -C` y `git -c` queden bloqueados aunque no sean commit. Se anota como límite en `AGENTS.md`. Lo de `.env` (leer) no tiene regla en Codex: límite documentado.
- Resuelto: 2026-11-08 el paso 10 de `verify` se salta con aviso si falta `pruebas/comparar-openspec/` (`pruebas/` está en `.gitignore`; sin esto `./verify` falla en cualquier clon). Lo aplicó el principal en el tramo 2.
- Resuelto: 2026-11-08 el perfil `codex-openai` usa nombres sin prefijo (`gpt-6-luna`), como `model` en `~/.codex/config.toml`; el prefijo `openai/` es de Pi y Codex no lo usa. Lo corrigió el principal tras revisar el tramo 2.
- Ejecutor: constructor, porque (1) los requisitos están cubiertos, (2) el contexto es accesible, (3) hay comprobaciones con esperado y errores tratables, (4) no toca credenciales ni producción.

## Escenarios
- CUANDO se corre `instalar.sh` con Codex presente ENTONCES quedan skills, `principal.toml`, `constructor.toml` y `codex-principal`/`codex-constructor` (A1)
- CUANDO se reinstala o se corre `--simular` ENTONCES no hay cambios ni duplicados, y `--simular` no escribe (A2)
- CUANDO se corre `desinstalar.sh` ENTONCES se quita lo del kit y se conserva lo del usuario (A3)
- CUANDO se instala con `--proyecto` ENTONCES existen las reglas deny de Codex y bloquean commit, push y merge (A4)
- CUANDO `modelos.json` tiene un esfuerzo inválido o falta el perfil Codex ENTONCES el resolver falla con mensaje claro (A5)
- CUANDO `./verify` corre ENTONCES cubre Codex y sigue pasando para Claude Code y Pi (A6)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | TOML, skills y lanzadores generados | HOME temporal con `.codex`; `bash instalar.sh`; listar archivos | existen `agents/principal.toml`, `agents/constructor.toml`, skills y ambos lanzadores; `model` y `model_reasoning_effort` coinciden con `modelos.json` |
| A2 | Idempotencia y simulación | instalar dos veces y comparar hashes; `--simular` y comparar árbol | sin diferencias; `--simular` no escribe |
| A3 | Desinstalación limpia | colocar un TOML y una regla ajenos; instalar; desinstalar | quedan solo los ajenos |
| A4 | Reglas deny válidas | `codex execpolicy check --rules <proyecto>/.codex/rules/flucastr.rules -- git commit -m x`, y lo mismo con `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C . commit`, `bash -c "git commit"` | cada una sale `forbidden`; `git status` no |
| A5 | Errores claros | `modelos.json` temporal con esfuerzo `ultra`, y otro sin `perfil_por_defecto.codex` | exit distinto de 0 y mensaje que nombra el campo |
| A6 | Verify cubre Codex | `./verify`; quitar a propósito `model_reasoning_effort` del generador | pasa completo; con el fallo, falla en el paso de Codex (sensibilidad) |

## Verificación
`./verify` — define «hecho». Pasos intermedios: `./verify` igualmente (no usa Docker).

## Pasos

### Tramo 1 — Entorno (sin cambiar código)
Resultado: hechos de Codex confirmados y escritos en *Notas*. Toca: nada.
- [x] Confirmar que `codex -c 'developer_instructions="hola"' --help` no falla y anotar si `developer_instructions` es clave válida con `codex --strict-config` (entorno)
  - evidencia: `codex -c 'developer_instructions="hola"' --help`, exit 0; `codex --strict-config -c 'developer_instructions="hola"' doctor --json` → `config.load` = ok; con clave inventada → `config.load` = warning. Ver *Notas*.
- [x] Crear en un HOME temporal `~/.codex/agents/x.toml` mínimo y comprobar con `codex debug` o `codex doctor` que lo reconoce; anotar el comando usado (entorno)
  - evidencia: `CODEX_HOME=$HOME/.cache/flucastr-codex-tramo1/ch1 HOME=$HOME/.cache/flucastr-codex-tramo1/home codex debug prompt-input`, exit 0; el prompt lista «Available roles: x … model `gpt-5.5`, reasoning effort `low`». `doctor` no lista agentes.
- [x] Crear un `.rules` temporal con `forbidden` para `["git","commit"]` y comprobarlo con `codex execpolicy check`; anotar si `git -C . commit` y `bash -c "git commit"` quedan bloqueados (entorno)
  - evidencia: `codex execpolicy check --rules <tmp>/flucastr.rules -- git commit -m x`, exit 0, `decision: forbidden`; `-- git -C . commit -m x` y `-- bash -c "git commit -m x"` → `matchedRules: []` (no bloqueados por prefijo simple).
- [x] Comprobar si Codex ve una skill enlazada en `~/.agents/skills` (`codex doctor` o similar); anotar (entorno)
  - evidencia: skill de prueba enlazada en `<tmp>/home/.agents/skills/`; `codex debug prompt-input` la lista en `skills_instructions`, exit 0.
- [x] Escribir en *Notas* el cuadro resumen y pausar para que el principal ajuste los tramos 2 a 4 (entorno)
  - evidencia: *Notas*, cuadro del tramo 1.
Verificación del tramo: `grep -c "Tramo 1 resultado" cambios/soporte-codex/plan.md` devuelve 1. Cubre: entorno.

### Tramo 2 — Resolver y modelos
Resultado: `resolver.mjs` genera un TOML de agente y la línea modelo:esfuerzo para Codex. Toca: `modelos.json`, `scripts/resolver.mjs`.
- [x] Agregar el perfil `codex-openai` y `perfil_por_defecto.codex` a `modelos.json` y actualizar `_leeme` (A5)
  - evidencia: `modelos.json` (perfil `codex-openai`, `perfil_por_defecto.codex`, `_leeme`); `node -e 'JSON.parse(...)'` → json ok; `node scripts/resolver.mjs modelo constructor codex`, exit 0 → `openai/gpt-6-luna`. Antes: `no hay perfil para la herramienta 'codex'`, exit 1.
- [x] Aceptar `codex` como herramienta en `resolverModelo` y en `lineaIdentidad` (nombre «Codex») (A1)
  - evidencia: `scripts/resolver.mjs`, `lineaIdentidad` (`herramienta === "codex"` → «Codex»); `resolverModelo` ya resuelve por perfil de la herramienta. `node scripts/resolver.mjs agente-codex agentes/constructor.md`, exit 0 → «Herramienta: Codex | Modelo: openai/gpt-6-luna | Agente: constructor».
- [x] Agregar la orden `agente-codex <archivo.md>`: TOML con `name`, `description`, `model`, `model_reasoning_effort` (`max`→`xhigh`) y `developer_instructions` con el cuerpo del agente (A1, A5)
  - evidencia: `node scripts/resolver.mjs agente-codex agentes/constructor.md | python3 -I -c 'tomllib…'`, exit 0 (TOML válido: name, description, model = "openai/gpt-6-luna", model_reasoning_effort = "high", developer_instructions); con `max` temporal → `model_reasoning_effort = "xhigh"`; sin `description` → exit 1 «no tiene 'description'».
- [x] Agregar la orden `modelo-esfuerzo` para codex y el mensaje de error con el nombre del campo (A5)
  - evidencia: con `max` temporal, `node scripts/resolver.mjs modelo-esfuerzo principal codex` → `openai/gpt-6.1-sol:xhigh` (pi sigue `:max`), exit 0; `FLUCASTR_MODELOS=<tmp>/ultra.json … agente-codex` → exit 1 «el esfuerzo 'ultra' del agente 'constructor' no está en 'esfuerzos'»; sin `perfil_por_defecto.codex` → exit 1 «define 'perfil_por_defecto.codex' en modelos.json».
- [x] Agregar `fijar-deny codex <archivo.rules>` y `quitar-deny codex`, con las reglas de *Resuelto* (no `.env`, no `-lc`) en sintaxis `prefix_rule` y `match`/`not_match` (A4)
  - evidencia: `node scripts/resolver.mjs fijar-deny codex <tmp>/flucastr.rules` → `fijado`, segunda vez `ya-estaba`; `codex execpolicy check --rules <tmp>/flucastr.rules -- …` → `forbidden` para `git commit -m x`, `gh pr merge 1`, `git -C . commit -m x`, `git -c k=v commit -m x`, `bash -c git commit`; sin regla para `bash -lc git commit` y `git status`; archivo ajeno: `fijar-deny` exit 1 «existe y no es del kit», `quitar-deny` → `omitido`. Se usó `match` (sin `not_match`), ver *Notas*.
Verificación del tramo: `node scripts/resolver.mjs agente-codex agentes/constructor.md | head -8` muestra `model = "openai/gpt-6-luna"` o el modelo resuelto; y `./verify` pasa. Cubre: A1, A4, A5.

### Tramo 3 — Instalar y desinstalar
Resultado: Codex se instala y se quita igual que Pi. Toca: `instalar.sh`, `desinstalar.sh`.
- [x] Agregar `--solo codex`, la detección (`~/.codex` o `command -v codex`) y `CODEX_DIR` al parser y a la ayuda (A1)
  - evidencia: `instalar.sh` (parser `claude | pi | codex`, `CODEX_DIR="${CODEX_HOME:-$HOME/.codex}"`, `INSTALAR_CODEX`, ayuda); antes `bash instalar.sh --solo codex` → «--solo acepta: claude o pi», exit 1; después, HOME temporal con `env -u CODEX_HOME … bash instalar.sh --solo codex`, exit 0; `-h` y `--help` iguales (paso 2b de `./verify`).
- [x] Instalar skills en `~/.agents/skills` con `instalar_skills` y registrarlas en el manifiesto (A1, A2)
  - evidencia: 5 enlaces `enlace` en `<tmp>/home/.agents/skills/` (definir-proyecto, ejecutar-plan, migrar-proyecto, planificar-cambio, preparar-proyecto); con `--copiar`, carpetas reales con marca `.flucastr-ai` y líneas `directorio`; `ejecutar-plan/SKILL.md` alcanzable por el enlace.
- [x] Generar `~/.codex/agents/<nombre>.toml` con `agente-codex`, marca `# flucastr-ai:generado` y registro en el manifiesto (A1, A2)
  - evidencia: `<tmp>/home/.codex/agents/principal.toml` (`gpt-6.1-sol`, `medium`) y `constructor.toml` (`gpt-6-luna`, `high`); `python3 -I tomllib` lee ambos, exit 0; líneas `archivo` en el manifiesto.
- [x] Generar `codex-<agente>` en `~/.local/bin` con modelo, esfuerzo e instrucciones del agente (A1)
  - evidencia: `~/.local/bin/codex-constructor` y `codex-principal` (`bash -n` ok). Con un `codex` de prueba en PATH que imprime sus argumentos: `-m gpt-6-luna -c 'model_reasoning_effort="high"' -c developer_instructions=<JSON de las instrucciones> "$@"`, exit 0. Modelo y esfuerzo coinciden con `modelos.json`. No se llamó a ningún modelo.
- [x] Con `--proyecto`, escribir `.codex/rules/flucastr.rules` con `fijar-deny codex` y registrarlo (A4)
  - evidencia: `bash instalar.sh --solo codex --proyecto <tmp>/proj`, exit 0 → `.codex/rules/flucastr.rules` con 10 `prefix_rule`, línea `codex-reglas` en el manifiesto; `codex execpolicy check --rules … -- <cmd>` → `forbidden` para `git commit -m x`, `git push origin x`, `git merge x`, `gh pr create`, `gh pr merge 1`, `git -C . commit -m x`, `git -c k=v commit -m x`, `bash -c "git commit -m x"`; `git status` sin decisión (no bloqueado). Reinstalar → «ya estaban», una sola línea en el manifiesto. Archivo ajeno sin marca → «AVISO: no se tocó…», exit 0, sin registro.
- [x] Hacer que `desinstalar.sh` quite todo lo registrado y nada más (A3)
  - evidencia: A3 con `~/.codex/agents/ajeno.toml`, `~/.agents/skills/ajena/` y `<proj>/.codex/rules/otra.rules` ajenos: tras `bash instalar.sh --solo codex --proyecto …` y `bash desinstalar.sh`, esos tres quedan intactos (`cmp` igual) y se quita lo del kit (`archivo-quitado`, enlaces, TOML, lanzadores). `desinstalar.sh --proyecto` quita `flucastr.rules` y los `.codex` vacíos, deja `otra.rules`; `--simular` no borra nada.
Verificación del tramo: `bash instalar.sh --simular` no escribe y lista Codex; `./verify` pasa. Cubre: A1 a A4.

### Tramo 4 — Verify y documentación
Resultado: `./verify` cubre Codex; docs al día. Toca: `verify`, `README.md`, `AGENTS.md`, `PENDIENTES.md`.
- [x] Agregar a `verify` el paso de Codex: generación, esfuerzo `max`→`xhigh`, HOME temporal para instalar, reinstalar, `--simular` y desinstalar, y reglas con `codex execpolicy check` solo si `codex` existe (A1 a A6)
  - evidencia: `verify` paso 3f (`prueba_codex`, líneas 3f ok: TOML y lanzador con xhigh, execpolicy 10 reglas, reinstalar low, reinstalar sin cambios, `--simular` sin escritura, desinstalar con ajenos); `./verify`, exit 0; sensibilidad: copia sin `model_reasoning_effort` en el generador → «FALLO: 3f: el TOML de Codex de constructor no coincide con modelos.json», exit 1.
- [x] Agregar prueba negativa: esfuerzo inválido y perfil faltante deben fallar (A5, A6)
  - evidencia: `verify` paso 3g (`prueba_negativa_codex`): sin `model_reasoning_effort`, esfuerzo `max` distinto, `ultra` («no está en 'esfuerzos'») y sin `perfil_por_defecto.codex` («perfil_por_defecto.codex») se rechazan; `./verify`, exit 0.
- [x] Documentar en `README.md` y `AGENTS.md`: lanzador, rutas, límites de las reglas (experimentales, trusted) y que el esfuerzo de `--agent` directo no aplica (A6)
  - evidencia: `README.md` secciones «Codex (experimental)» (líneas 63-72) y lanzador `codex-<agente>` (línea 59); `AGENTS.md` líneas 6, 12, 28 y «Límites de las reglas deny» (bullet de Codex); `grep -n "codex-<agente>\|Codex (experimental)\|prefix_rule" README.md AGENTS.md`, exit 0.
- [x] Anotar en `PENDIENTES.md` lo sin probar: una sesión real de Codex con un plan y el constructor como subagente (A6)
  - evidencia: `PENDIENTES.md` bullet «Codex (soporte experimental)» en «Detalles menores» (línea 40) y «Soporte de Codex» en «Ideas» (línea 61); `grep -n "Codex" PENDIENTES.md`, exit 0.
Verificación del tramo: `./verify`. Cubre: A1 a A6.

## Evidencia
$ codex --version
codex-cli 0.166.0
exit 0

$ codex -c 'developer_instructions="hola"' --help   (salida descartada)
exit 0

$ codex --strict-config -c 'developer_instructions="hola"' doctor --json   (solo config.load)
"config.load": { "status": "ok", "summary": "config loaded" }
exit 1 (el fallo es «auth», sin credenciales en el HOME temporal; no es de config)

$ codex --strict-config -c 'clave_inventada_xyz=1' doctor --json   (solo config.load)
"config.load": { "status": "warning", "summary": "config loaded" }
exit 1 (idem, auth)

$ codex --strict-config -c 'developer_instructions="hola"' debug prompt-input
Error: `--strict-config` is not supported for `codex debug`
exit 1

$ CODEX_HOME=<tmp>/ch1 codex debug prompt-input   (con agents/x.toml)
... Available roles: x: { agente de prueba del tramo 1 - model `gpt-5.5`, reasoning effort `low` ...
exit 0

$ codex execpolicy check --rules <tmp>/reglas/flucastr.rules -- git commit -m x
{"matchedRules":[{"prefixRuleMatch":{"matchedPrefix":["git","commit"],"decision":"forbidden",...}}],"decision":"forbidden"}
exit 0

$ codex execpolicy check --rules <tmp>/reglas/flucastr.rules -- git -C . commit -m x
{"matchedRules":[]}
exit 0

$ codex execpolicy check --rules <tmp>/reglas/flucastr.rules -- bash -c "git commit -m x"
{"matchedRules":[]}
exit 0

$ CODEX_HOME=<tmp>/ch1 HOME=<tmp>/home codex debug prompt-input   (skill enlazada)
... <skills_instructions> ... - skill-prueba-x: skill de prueba del tramo 1 (file: r0/skill-prueba-x/SKILL.md)
exit 0

$ ./verify   (tramo 2; salida completa en $HOME/.cache/flucastr-verify-tramo2.log; antes del paso 10 todas las comprobaciones dan «ok», incluidas A1 a A5, 3e, 8i y 9a)
== 10. autopruebas offline del runner OpenSpec, sin inferencia ==
node:internal/modules/cjs/loader:1568
  throw err;
  ^

Error: Cannot find module '/home/franco/Codes/flucastr/Flucastr.AI/pruebas/comparar-openspec/runner/cli.mjs'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1564:15)
  code: 'MODULE_NOT_FOUND',

Node.js v24.22.1
FALLO: 10: autopruebas offline del runner OpenSpec
exit 1

$ bash instalar.sh --simular   (tramo 3, home real; solo las líneas de Codex)
Codex (/home/franco/.codex)
  agente generado: /home/franco/.codex/agents/constructor.toml (modelo: gpt-6-luna)
  lanzador generado: /home/franco/.local/bin/codex-constructor (modelo: gpt-6-luna, esfuerzo: high)
  agente generado: /home/franco/.codex/agents/principal.toml (modelo: gpt-6.1-sol)
  lanzador generado: /home/franco/.local/bin/codex-principal (modelo: gpt-6.1-sol, esfuerzo: medium)
  Codex:       codex-principal (o el agente como rol: ~/.codex/agents)
exit 0 (archivos modificados en ~/.flucastr-ai, ~/.codex/agents, ~/.agents/skills y ~/.local/bin tras el simulacro: 0)

$ ./verify   (tramo 3; log completo en /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/5fd0b40e-631d-4ade-88e8-a3a01983f433/scratchpad/verify-t3-1.log)
ok 11 negativa: copia sin «Revisión por tramo» en agentes/principal.md rechazada con su mensaje
ok 11 negativa: copia sin «tramo: <n>» en agentes/principal.md rechazada con su mensaje
ok 11 negativa: copia sin «tramo: <n>» en agentes/constructor.md rechazada con su mensaje
ok 11 negativa: copia sin «tramo=<n>» en agentes/constructor.md rechazada con su mensaje
VERIFY OK
exit 0

$ ./verify   (tramo 4, corrida final 1 de 3; log completo en /tmp/claude-1000/-home-franco-Codes-flucastr-Flucastr-AI/5fd0b40e-631d-4ade-88e8-a3a01983f433/scratchpad/verify-t4-final1.log)
== 3f. Codex: TOML y lanzadores con modelo y esfuerzo; reinstalar refresca; --simular no escribe; desinstalar deja lo ajeno; reglas ==
ok constructor codex TOML (modelo y esfuerzo de modelos.json)
ok principal codex TOML (modelo y esfuerzo de modelos.json)
ok 3f: TOML de constructor y principal con modelo y esfuerzo (max -> xhigh); codex-constructor pasa -m y el esfuerzo
ok 3f: execpolicy bloquea git commit/push/merge, gh pr create/merge, git -C, git -c, bash/sh/zsh -c; deja pasar git status y bash -lc
ok 3f: reinstalar con low refresca el TOML y codex-constructor
ok 3f: reinstalar sin cambios no altera el HOME ni el proyecto
ok 3f: --simular anuncia el TOML y no escribe en el HOME ni en el proyecto
ok 3f: desinstalar quita los TOML, lanzadores, skills y reglas del kit; deja ajeno.toml, la skill ajena y otra.rules
-- 3g. pruebas negativas de Codex
ok 3g: sin esfuerzo, esfuerzo distinto, 'ultra' y perfil faltante de Codex se rechazan con su mensaje
...
AVISO 10: falta pruebas/comparar-openspec/ (pruebas/ está en .gitignore); paso omitido
...
ok 11 negativa: copia sin «tramo=<n>» en agentes/constructor.md rechazada con su mensaje
VERIFY OK
exit 0

$ ./verify   (sensibilidad, en una copia del kit sin tocar el repo: el generador de Codex no emite model_reasoning_effort)
FALLO: 3f: el TOML de Codex de constructor no coincide con modelos.json
exit 1

## Notas
**Resultado del tramo 1** (cuadro resumen para el principal, tramos 2 a 4):

| Tema | Hecho confirmado | Consecuencia para el plan |
| --- | --- | --- |
| `developer_instructions` | Clave válida: `config.load` ok con `--strict-config` en `doctor`. | Tramo 2 puede usarla sin cambios. |
| `--strict-config` en `debug` | No se admite (`not supported for codex debug`). | Usar `doctor --json` para validar config; `debug prompt-input` solo sin `--strict-config`. |
| Agentes `~/.codex/agents/<n>.toml` | Se reconocen: aparecen en «Available roles» con `model` y `model_reasoning_effort`. Ruta bajo `CODEX_HOME/agents`. | Tramo 3 escribe ahí; `CODEX_HOME` define la ruta. `sandbox_mode` no se fija (confirmado en Supuestos). |
| Reglas `prefix_rule(..., decision="forbidden")` | `["git","commit"]` queda `forbidden`. `git -C . commit` y `bash -c "git commit ..."` **no** quedan bloqueados por prefijo simple. | En tramo 2 las reglas de `git -C`/`-c` no se resuelven con un prefijo. Es una decisión pendiente para el principal (ver al final de estas notas). |
| Skills en `~/.agents/skills` | Codex las lista en `skills_instructions` al enlazar una carpeta con `SKILL.md`. | Modo repo (enlace) confirmado. Copia (modo descarga) no se probó aquí. |
| `CODEX_HOME` temporal | Codex avisa que no crea alias de PATH bajo `/tmp`. Se usó `~/.cache/flucastr-codex-tramo1` (fuera del repo). | Las pruebas de `verify` deben usar un directorio fuera de `/tmp` si quieren el aviso limpio (no bloquea). |

Lo que no se tocó: `~/.codex/config.toml` y `auth.json` (no leídos). Del `~/.codex` real solo se listaron nombres de carpetas. No hay cambios de código ni commits.

Sobre el cierre: el paso 5 de este tramo pide pausar para que el principal ajuste los tramos 2 a 4. Este tramo termina con `COMPLETADO` y `tramo=1`, que devuelve el control.

Defecto del plan en la verificación del tramo: el `grep -c` de la línea de Verificación cuenta también su propia línea, así que con el marker en *Notas* daba 3 y sin él da 1. Para cumplir el «devuelve 1» se redactó el encabezado de *Notas* como «Resultado del tramo 1». La comprobación real es leer *Notas*: el cuadro está ahí. Conviene que el principal cambie la verificación del tramo (por ejemplo, `grep -c "^\*\*Resultado del tramo 1\*\*" …` con esperado 1, que no cuenta su propia línea).

Decisión que falta (para el principal antes de tramo 2): ¿las reglas deny para `git -C … commit`, `git -c … commit` y `bash -c …` se resuelven con reglas adicionales por subcomando (si Codex lo soporta) o se documentan como límite, como ya pasa con `.env` en Claude Code?

**Tramo 2 (constructor)**

- Decisión pendiente de arriba: ya está resuelta en *Decisiones ya tomadas* (`Resuelto:`, 2026-11-08). Se aplicó tal cual: prefijos `git -C`, `git -c`, `bash -c`, `sh -c`, `zsh -c` bloqueados; `bash -lc` y `sh -lc` sin regla; `.env` sin regla en Codex. Verificado: `git -C . commit -m x` → `forbidden` con la regla de prefijo `["git","-C"]`. Eso confirma lo que el *Resuelto* dice y corrige la lectura de la tabla del tramo 1: con solo la regla de `git commit`, `git -C . commit` no queda bloqueado.
- Decisión menor: `fijar-deny codex` escribe el archivo entero y lleva la marca `# flucastr-ai:generado`; no fusiona reglas como hace Claude. Si el archivo existe sin la marca, no lo toca (exit 1). `quitar-deny codex <archivo>` lo borra solo si lleva la marca.
- Decisión menor: cada `prefix_rule` lleva `match` (un ejemplo del propio prefijo) y no `not_match`. Codex valida `match` al cargar el archivo; el plan nombraba ambos, y `not_match` no aporta una comprobación distinta.
- Decisión menor: `agente-codex` exige `description` (Codex la pide) y no copia `skills`, `tools`, `timeoutMs` ni `inheritProjectContext`, que son de Claude Code y Pi.
- Cambio de texto: «no hay perfil para la herramienta» ahora nombra `perfil_por_defecto.<herramienta>` (A5 pide nombrar el campo). Mismo exit 1.
- Fallo fuera de alcance en `./verify`, paso 10: `pruebas/comparar-openspec/runner/cli.mjs` no existe en el disco ni en el historial de git (`git log --all -- pruebas/comparar-openspec` vacío). El commit `1b75609` («archivar arnés comparar-openspec») añadió ese paso a `verify` y el `.gitignore` ignora `pruebas/`. `verify` no tiene cambios respecto a `HEAD`, y el fallo no depende de este tramo. No lo he saltado ni quitado: hacerlo cambia una comprobación que `AGENTS.md` documenta. Ver PAUSA.
- Estado: pasos 1 a 5 del tramo 2 comprobados; `Verificación del tramo` (`./verify`) no pasa; `estado: parcial`. Tramos 3 y 4 sin tocar.

**Tramo 3 (constructor)**

- Decisión menor: `CODEX_DIR` respeta `CODEX_HOME`, igual que `PI_CODING_AGENT_DIR` en Pi; sin él usa `~/.codex`. Las skills van siempre a `~/.agents/skills`. En esta sesión `CODEX_HOME` está definida como `/home/franco/.codex`.
- Cambio en `verify` fuera de la lista del tramo (dentro de *Alcance*): `unset CODEX_HOME` al inicio. Sin él, los pasos que instalan en HOME temporal (paso 8, `--copiar` sin `--solo`) habrían escrito en el `~/.codex` real. El tramo 4 agrega los pasos de Codex; este `unset` debe quedarse.
- Decisión menor: `--solo codex` también deja sin tocar los proyectos Pi con skills registradas (igual que `--solo claude`), y `--skills-proyecto` se rechaza con `--solo codex`.
- Decisión menor: `codex-reglas` es un tipo de línea nuevo del manifiesto, una por archivo. Con `--conservar-ajustes` se conserva como `deny`.
- Decisión menor: el lanzador fija el esfuerzo al instalar (como `claude-<agente>`) y resuelve modelo e instrucciones al lanzar (como `pi-<agente>`). Para las instrucciones se agregó la orden `instrucciones-codex` del resolver, y `esfuerzo <agente> codex` traduce `max` a `xhigh`.
- Límite de la prueba: el lanzador se probó con un `codex` de prueba que imprime sus argumentos. No se llamó a ningún modelo, así que no se sabe si `gpt-6-luna` responde en la cuenta de Franco.
- Corrección de evidencia del tramo 2: `modelo-esfuerzo principal codex` hoy da `gpt-6.1-sol:medium`. La línea de evidencia del tramo 2 citaba `openai/gpt-6.1-sol:xhigh`, de antes de quitar el prefijo del perfil.
- Observación fuera de alcance, sin cambiar: según el código de `instalar.sh`, reinstalar con `--solo` desinstala primero todo el manifiesto, también lo de las otras herramientas, y después instala solo la pedida. Lo mismo pasa hoy con `--solo pi` y `--solo claude`. No se probó con Claude; queda para decidir.
- Observación: tras desinstalar quedan las carpetas vacías que crea el kit (`~/.local/bin`, `~/.agents/skills`, `~/.codex/agents`). Igual que con Claude y Pi; no se tocó.
- Verificación del tramo: `bash instalar.sh --simular` lista Codex y no escribe; `./verify` pasa (ver *Evidencia*). Quedan 4 pasos pendientes, todos del tramo 4.

**Tramo 4 (constructor)**

- Decisión menor: `instantanea()` de `verify` vigila ahora `CODEX_HOME/agents` (o `~/.codex/agents`), `~/.agents/skills` y `~/.local/bin/codex-*`. La autoprueba 5a también los cubre. Así `bash instalar.sh --simular` sobre el home real comprueba Codex.
- Decisión menor: el paso 3f compara el HOME temporal con una huella hecha con `find` y `shasum`, sin `find -L`. El HOME tiene un enlace a la raíz del kit (`.flucastr-ai/raiz`), y `find -L` habría recorrido `pruebas/.temporales` (3,9 GB).
- Hallazgo, sin cambiar: `instalar.sh --simular` sin `--copiar` sobre una instalación en modo descarga sale con «Hay una instalación en modo descarga; ejecuta desinstalar.sh antes de cambiar de modo» (exit 1). Por eso el paso 3f usa `--copiar` en todas sus llamadas.
- Decisión menor: el paso 3f instala y lanza con un `codex` de prueba que imprime sus argumentos; no llama a ningún modelo. `codex execpolicy check` corre solo si `codex` está en el PATH, con HOME y `CODEX_HOME` temporales. Si no está, `verify` avisa con «AVISO 3f».
- Decisión menor: el paso 3g prueba la negativa de Codex con esfuerzo ausente, distinto, `ultra` y sin `perfil_por_defecto.codex`; cada caso se rechaza con su mensaje.
- Sensibilidad (A6): en una copia del kit, quitar `model_reasoning_effort` del generador hace fallar `verify` en el paso 3f (*Evidencia*). El repo no se tocó.
- Docs: `README.md` tiene la sección «Codex (experimental)», el lanzador `codex-<agente>` y el texto de `--solo codex`. `AGENTS.md` tiene el esfuerzo de Codex, la ventana propia, el alcance de `verify` y los límites de las reglas de Codex. `PENDIENTES.md` tiene lo sin probar y el punto «Soporte de Codex» de «Ideas».
- Verificación: `./verify` pasa en la corrida final 1 de 3 (82 líneas `ok`, paso 10 con AVISO). Pendientes: 0. Pasos del tramo 4 marcados: 4 de 4.

**Ajuste posterior (principal, 2026-11-08):** Franco probó Codex y no podía crear ramas. Causa: el sandbox deja `.git` en solo lectura (`codex sandbox git switch -c x` → `HEAD.lock: Read-only file system`), no las reglas deny. Se agregó una regla `allow` para `git switch -c` (`resolver.mjs`), `verify` la comprueba con `execpolicy` (ahora 11 `prefix_rule`) y el README lo explica. Sin probar en sesión real de Codex.
