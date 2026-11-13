---
estado: listo
rama: feature/permisos-compose-opciones
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Permisos de Docker Compose con opciones y reglas que se actualizan solas

## Objetivo
Que Codex no pida permiso para `docker compose --project-name … --file … run …` (la forma real que usan Byteria y DonFinancio), y que una instalación normal refresque las reglas de los proyectos ya registrados, sin ir uno por uno.

## Supuestos
- Se permiten como prefijo `--project-name`, `-p`, `--file`, `-f`, `--env-file` y `--profile` tras `docker compose`. Es la misma exposición que ya dan `docker compose run/up/build`: cualquier compose del repo. Si Franco no la quiere, se quitan las opciones `--file` y `-f` y cambia un paso.
- `docker run` suelto sigue sin regla (el verify 3f lo exige). La vía para validar con navegador es un script de comando fijo, no `docker run`.
- Los proyectos se toman del manifiesto del kit (`~/.flucastr-ai/manifiesto.txt`, líneas `codex-reglas`); hoy: DonFinancio, Byteria y DASH.

## Alcance
Puede cambiar: `scripts/resolver.mjs` (lista `PREFIJOS_ALLOW_CODEX`), `instalar.sh` (refresco de reglas registradas), `skills/ejecutar-plan/SKILL.md`, `skills/planificar-cambio/SKILL.md`, `verify` (bloques 3f y 3g), `README.md` (una viñeta).
Fuera: `agentes/*.md`, `modelos.json`, `desinstalar.sh`, los proyectos que usan el kit, reglas `forbidden`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: requisitos y comprobaciones definidos, archivos accesibles, sin credenciales ni producción.
- Evidencia (Byteria, sesión `rollout-2026-11-13T18-59-29`): 7 permisos en 8 min. `codex execpolicy check` con el comando real devuelve `matchedRules: []`; sin las opciones sí coincide con `["docker","compose","run"]`. Una variable de entorno delante (`COMPOSE_PROJECT_NAME=x docker compose run`) tampoco coincide, por eso no sirve como atajo.
- La actualización va en la instalación normal (`bash instalar.sh`), sin bandera nueva: ya regenera agentes y lanzadores de Codex; ahora también recorre las líneas `codex-reglas` del manifiesto y llama a `fijar-deny` en cada una.
- Una carpeta de proyecto que ya no existe, o un archivo de reglas ajeno, solo avisa y sigue; no falla la instalación (igual que `instalar_deny_codex`).
- Convención para los planes: validar con navegador o contenedores mediante un script del repo de comando fijo (`./scripts/<nombre>.sh` o `./verify`) que haga todos los recorridos y capturas en una corrida. No se encadenan `docker run` o `compose run` sueltos.

## Escenarios
- CUANDO el comando es `docker compose --project-name x --profile verify --file f.yml run --rm browser y` ENTONCES `execpolicy` lo permite (A1).
- CUANDO el comando es `docker run --rm img` ENTONCES `execpolicy` no decide nada, como hoy (A2).
- CUANDO se corre `bash instalar.sh` con un proyecto registrado con reglas viejas ENTONCES sus reglas quedan al día (A3).
- CUANDO un proyecto registrado ya no existe ENTONCES la instalación avisa y termina en exit 0 (A4).
- CUANDO se lee `ejecutar-plan` y `planificar-cambio` ENTONCES piden un script de comando fijo para validar con navegador (A5).
- CUANDO se corre todo el kit ENTONCES los bloques existentes siguen pasando (A6).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | La forma real de Byteria se permite | `codex execpolicy check --rules <reglas generadas> -- docker compose --project-name x --profile verify --file f.yml run --rm browser y` | `"decision": "allow"` |
| A2 | No se abre `docker run` | mismo `execpolicy` con `docker run --rm img` | `matchedRules` vacío |
| A3 | Refresco de proyectos registrados | en el bloque 3g (HOME temporal): reglas viejas de un proyecto registrado, correr `instalar.sh`, leer el archivo | contiene `"--project-name"` |
| A4 | Proyecto borrado no rompe | mismo bloque, con la carpeta borrada | exit 0 y línea `AVISO` |
| A5 | Convención escrita | `grep -nF 'comando fijo'` en ambas skills | una coincidencia en cada una |
| A6 | Nada se rompe | `./verify` | exit 0; el conteo del 3f actualizado a 41 reglas (10 forbidden, 31 allow) |

## Verificación
`./verify` — offline, sin Docker del proyecto; debe terminar en exit 0.

## Pasos
- [x] En `scripts/resolver.mjs`, añade a `PREFIJOS_ALLOW_CODEX` los seis prefijos `["docker","compose","<opción>"]` de *Supuestos*, junto a los de compose (A1)
  - evidencia: `scripts/resolver.mjs` (seis `prefix_rule` nuevos, lista `PREFIJOS_ALLOW_CODEX`); `fijar-deny codex` genera 41 `prefix_rule`; `codex execpolicy` con el comando real da `"decision":"allow"` (ver *Evidencia*).
- [x] En `verify`, bloque 3f: actualiza el conteo (35→41; 25→31 allow) y añade la comprobación `execpolicy` de A1; deja intacta la de `docker run` (A1, A2)
  - comprobación: el bloque imprime `ok 3f` con la lista ampliada.
  - evidencia: `./verify` exit 0; línea `ok 3f: execpolicy bloquea ... y con --project-name/-p/--file/-f/--env-file/--profile ...`.
- [x] En `instalar.sh`, tras instalar Codex y solo cuando no hay `--proyecto`, recorre las líneas `codex-reglas` del manifiesto y refresca cada archivo con `fijar-deny codex` (A3, A4)
  - respeta `--simular`; una ruta inexistente o un archivo ajeno solo imprime `AVISO`.
  - evidencia: `instalar.sh` (función `refrescar_reglas_codex_registradas`, lectura de `codex-reglas` antes de la desinstalación, llamada en la rama de Codex sin `--proyecto`); `bash -n instalar.sh` exit 0; prueba 3h de `./verify`.
- [x] En `verify`, bloque nuevo 3g: HOME temporal con un proyecto registrado y reglas viejas; corre `instalar.sh` y comprueba A3; borra la carpeta y comprueba A4 (A3, A4)
  - evidencia: `verify` bloque 3h (el 3g ya existía con pruebas negativas de Codex; ver *Notas*); líneas `ok 3h: instalar sin --proyecto refresca ...` y `ok 3h: proyecto registrado borrado: AVISO y exit 0 ...`.
- [x] En `skills/ejecutar-plan/SKILL.md`, una regla breve: validar con navegador o contenedores con un script de comando fijo que haga todo en una corrida; sin `docker run` ni `compose run` sueltos (A5)
  - evidencia: `skills/ejecutar-plan/SKILL.md:41` (`grep -nF 'comando fijo'`: 1 coincidencia).
- [x] En `skills/planificar-cambio/SKILL.md`, en la regla 13 (niveles), una frase: si el plan valida con navegador, su *Verificación* es ese script de comando fijo (A5)
  - evidencia: `skills/planificar-cambio/SKILL.md:96` (`grep -nF 'comando fijo'`: 1 coincidencia).
- [x] En `README.md`, una viñeta: «`bash instalar.sh` también actualiza las reglas de Codex de los proyectos registrados» (A3)
  - evidencia: `README.md:74` (viñeta nueva bajo «Reglas deny» de Codex).
- [x] Corre `./verify` y pega la cola en *Evidencia* (A6)
  - evidencia: `./verify` exit 0 («VERIFY OK»); cola en *Evidencia*.

## Evidencia

Comprobaciones de A1 y A2 con las reglas generadas (`node scripts/resolver.mjs fijar-deny codex <tmp>/flucastr.rules`, 41 `prefix_rule`):

$ codex execpolicy check --rules <reglas generadas> -- docker compose --project-name x --profile verify --file f.yml run --rm browser y
{"matchedRules":[{"prefixRuleMatch":{"matchedPrefix":["docker","compose","--project-name"],"decision":"allow","justification":"Comando habitual del plan: sin esta regla el sandbox de Codex pide permiso y el subagente espera."}}],"decision":"allow"}
exit 0

$ codex execpolicy check --rules <reglas generadas> -- docker run --rm img
{"matchedRules":[]}
exit 0

Cola de `./verify` (A6):

$ ./verify
ok A5c veredicto con clave extra: viola el esquema, parcial
ok C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente
ok C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
ok uso: plan en curso se rechaza sin cambiarlo
ok V2 revisor con nivel bajo: Luna low; el constructor no cambia
ok V3 sin kit_run el revisor usa el modelo y esfuerzo del principal
ok V4 nivel inválido en kit_run.revisor: exit 2 y plan intacto
ok V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

Líneas de 3f y 3h de la misma corrida (`grep`):
ok 3f: execpolicy bloquea git commit/push/merge, ... y con --project-name/-p/--file/-f/--env-file/--profile, ...
ok 3h: instalar sin --proyecto refresca las reglas viejas del proyecto registrado (contiene --project-name)
ok 3h: proyecto registrado borrado: AVISO y exit 0; el registro se conserva
AVISO 10: falta pruebas/comparar-openspec/ (pruebas/ está en .gitignore); paso omitido (ya existía; no afecta)

## Notas
- Decisión menor: el bloque nuevo de instalación con HOME temporal se llama `3h`, porque `3g` ya existía (pruebas negativas de Codex); no se renumeró ni se tocó el 3g.
- El refresco lee las líneas `codex-reglas` del manifiesto antes de la desinstalación (como ya hace con los proyectos de skills), porque `desinstalar.sh` borra el manifiesto. Las reglas se refrescan solo si Codex está instalado; con `--solo claude|pi` no se tocan.
- Un proyecto registrado cuya carpeta no existe se omite con `AVISO` y su línea del registro se conserva (no se crea la carpeta con `mkdir -p`).
- La comprobación `AVISO 10` (falta `pruebas/comparar-openspec/`) ya existía antes del cambio y no afecta al resultado.
- `modelos.json` tiene el cambio ajeno sin commit de antes; no se tocó.
- Sin commit, push ni PR: lo hace Franco.
