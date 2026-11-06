---
estado: listo
rama: feature/kit-v2
---
# reglas-deny-por-proyecto

## Objetivo
`bash instalar.sh --proyecto <ruta>` agrega reglas `permissions.deny` al `.claude/settings.json` del proyecto, para que Claude Code haga cumplir «sin commit/push/merge» y «no leer .env»; `desinstalar.sh` quita solo lo que el kit agregó. Hacer después de `verify-escalon-5` (ambos editan `verify`).

## Alcance
`scripts/resolver.mjs` (comandos nuevos), `instalar.sh`, `desinstalar.sh`, `verify` (escalón 6), `AGENTS.md`, este plan. Fuera: Pi, `legacy/`, otros escalones. Nada se prueba en el home real ni en un proyecto real.

## Decisiones ya tomadas
- Archivo: `<proyecto>/.claude/settings.json` (compartido, va a git; así lo pidió Franco). Es distinto de los ajustes actuales (`settings.local.json`); por eso el resolver lleva comandos nuevos: `fijar-deny claude <json> [--simular]` y `quitar-deny claude <json> <regla>`, calcados de `fijar-hook`/`quitar-hook` (con `ajustesDeObjeto` y `escribirAtomico`; JSON inválido o tipos raros: no tocar).
- Reglas (7): `Read(./.env)`, `Read(./.env.*)`, `Bash(git commit *)`, `Bash(git push *)`, `Bash(git merge *)`, `Bash(gh pr create *)`, `Bash(gh pr merge *)`. El espacio antes de `*` es parte de la regla.
- `fijar-deny` agrega solo las que faltan, conserva todo lo demás del archivo y el orden, e imprime `agregada:<regla>` por cada una (o `ya-estaba` si no agregó ninguna). `quitar-deny` quita esa regla exacta; si `deny`, `permissions` o el archivo quedan vacíos, los borra (como `quitar-hook`).
- Manifiesto: una línea `deny<TAB><ruta settings.json><TAB><regla>` por cada regla **realmente agregada**. Una regla que el usuario ya tenía no se registra y nunca se quita. Reutilizar la mecánica de `hook`/`ajuste`: se registra con `registrar`; al reinstalar, `instalar.sh` copia las líneas `deny` a `$NUEVO` junto a las de `ajuste`/`hook` antes de llamar a `desinstalar.sh --conservar-ajustes`, que las salta; `desinstalar.sh` las trata en las dos rutas donde ya trata `hook` (bloque `--proyecto` y bloque general) y hace `rmdir .claude` solo si quedó vacía.
- Se instala en el bloque `if [ -n "$PROYECTO" ]` de Claude Code, tras `fijar_agente_proyecto`. Con `--simular` imprime `(simulación) agregaría: …` y no escribe.
- Pi: sin equivalente conocido. No se inventa nada; en `AGENTS.md` consta que en Pi rige solo el prompt.

## Límites conocidos (docs oficiales: code.claude.com/docs/en/permissions)
Escribirlos en `AGENTS.md`, sección «Límites de las reglas deny»:
- Compuestos: se separan por `&&`, `||`, `;`, `|`, `&` y saltos de línea y el deny aplica si **cualquier** subcomando coincide: `git add . && git commit` queda bloqueado.
- Brecha: no es una frontera de seguridad. No cubre `bash -c '…'`, `git -C . commit`, `git -c k=v commit`, `sudo` ni `env <cmd>`. `Read(./.env)` cubre Read y `cat/head/tail/sed/tee` en Bash, no `grep -r .` ni un script que abre el archivo (eso pide sandbox, fuera de alcance).
- Subagentes: los integrados heredan las reglas; para un deny de `Bash(git push *)` los docs dicen que aplica también a subagentes (lo leí solo en un resumen, no literal). No dicen si un `permissionMode` de subagente puede saltarse un deny: no garantizado.
- Los arrays de permisos de varios archivos se combinan (merge): explícito para `allow`, inferido para `deny`.
- Estas reglas bloquean también los commits que Franco haga a través de Claude en ese proyecto; está bien.

## Escenarios
- CUANDO el proyecto no tiene `.claude/settings.json` ENTONCES queda con las 7 reglas y el manifiesto tiene 7 líneas `deny`.
- CUANDO ya tiene `allow`, otras claves o `deny` propios (incluida `Bash(git push *)`) ENTONCES se conservan y solo se registran las agregadas.
- CUANDO se instala dos veces ENTONCES el archivo no cambia y el manifiesto conserva las mismas líneas.
- CUANDO se desinstala ENTONCES queda el archivo original del usuario (incluida su `Bash(git push *)`), o no queda archivo si no existía.
- CUANDO el JSON del proyecto es inválido ENTONCES no se toca y se avisa sin abortar la instalación.

## Verificación
`./verify` — nuevo escalón 6: crea `T=$(mktemp -d)`, usa `HOME=$T`, `PI_CODING_AGENT_DIR` sin definir, `mkdir $T/.claude $T/proj`, y corre el `instalar.sh --solo claude --proyecto $T/proj` y `desinstalar.sh --proyecto $T/proj` reales; comprueba los 5 escenarios (con `node` para leer el JSON); borra `$T` con `trap`. Prueba negativa dentro del escalón: con `modelos.json` intacto, un `settings.json` previo con `deny` propio que coincide con una regla del kit debe sobrevivir a la desinstalación. `VERIFY OK`, código 0.

## Pasos
- [x] Resolver: `fijar-deny` y `quitar-deny` (+ línea de uso y cabecera de comentarios).
- [x] `instalar.sh`: función `instalar_deny_claude` (modelo: `instalar_hook_claude`), llamada en el bloque de proyecto; copiar líneas `deny` al reinstalar.
- [x] `desinstalar.sh`: caso `deny` en ambos bloques, saltado con `--conservar-ajustes`.
- [x] `verify`: escalón 6 con los 5 escenarios; confirmar con `ls -A ~/.flucastr-ai` antes/después que el home real no cambió.
- [x] Prueba negativa: quitar `Bash(git push *)` de la lista del resolver, correr `./verify`, confirmar que falla en el 6, restaurar.
- [x] `AGENTS.md`: límites conocidos (arriba), aviso de commits bloqueados, línea «Pi: solo el prompt», y el escalón 6 en la línea de `./verify`.

## Evidencia
$ ./verify
== 1. modelos.json parsea y agentes coinciden ==
agentes: constructor, principal
== 2. sintaxis de instalar.sh y desinstalar.sh ==
ok instalar.sh
ok desinstalar.sh
== 3. resolver Claude Code y Pi por agente ==
ok constructor Claude Code claude-haiku-5-5
ok constructor Pi openai/gpt-6-luna
ok principal Claude Code claude-sonnet-5-5
ok principal Pi openai/gpt-6.1-sol
== 4. skills con SKILL.md, name y description ==
ok ejecutar-plan
ok planificar-cambio
ok preparar-proyecto
== 5. instalar.sh --simular no escribe lo que instala ==
ok autoprueba: reacciona a añadir y cambiar; ignora transcripts e history
-- 5b. instalar.sh --simular sobre el home real
ok instantánea sin cambios (585 líneas)
== 6. reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto) ==
ok escenario 1: sin archivo -> 7 reglas y 7 líneas deny
ok escenario 2: se conservan allow, otra clave y deny propios; solo se registran las agregadas
ok escenario 3: reinstalar deja el archivo y las líneas deny iguales
ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo
ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta
VERIFY OK
exit 0

Prueba negativa (regla `Bash(git push *)` quitada del resolver): `./verify` salió con 1 y falló en el escalón 6 con `FALLO: escenario 1: las reglas deny no son exactamente las 7 del kit`. Resolver restaurado desde copia y comparado con `cmp`.

Home real: `ls -A ~/.flucastr-ai` y el sha256 de `manifiesto.txt` iguales antes y después (instantánea en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/a7c6526a-2b3d-4428-8015-d97d2f480078/scratchpad/home-antes.txt`).

## Notas
- Verify, escalón 6: cada escenario usa su propio HOME temporal (`$T6/<escenario>/home`, con `.claude`) y su proyecto (`$T6/<escenario>/proj`), en vez de un único `$T` compartido. Así la reinstalación y la desinstalación de cada caso no se mezclan. Se borra todo con `trap`.
- «Con modelos.json intacto» lo interpreté así: el HOME temporal no tiene `modelos.json` personal (modo repo) y el del repo no se toca; la prueba negativa de deny propio que sobrevive a desinstalar es el escenario 4.
- Decisión menor: `fijar-deny` rechaza el `~/.claude/settings.json` (además de exigir el nombre `settings.json`), calcado de la protección de `fijar-hook`. Sin esa comprobación, un `--proyecto ~` escribiría en el ajuste global.
- `quitar-deny` quita una sola ocurrencia de la regla.
- Al escribir, `settings.json` se reserializa con 2 espacios (formato de `escribirAtomico`, igual que en `fijar-hook`); el contenido queda igual, el formato puede cambiar.
- `grep -P` no es portable en macOS: usé `grep "^deny"$'\t'`.
- Fuera de alcance, sin tocar: `legacy/`, Pi, `cambios/verify-escalon-5/` (ya estaba borrado en el árbol al empezar y su carpeta está en `cambios/hechos/`).
- Sin commit, push ni PR: lo hace Franco.
