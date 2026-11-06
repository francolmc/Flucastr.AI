---
estado: aprobado
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
- [ ] Resolver: `fijar-deny` y `quitar-deny` (+ línea de uso y cabecera de comentarios).
- [ ] `instalar.sh`: función `instalar_deny_claude` (modelo: `instalar_hook_claude`), llamada en el bloque de proyecto; copiar líneas `deny` al reinstalar.
- [ ] `desinstalar.sh`: caso `deny` en ambos bloques, saltado con `--conservar-ajustes`.
- [ ] `verify`: escalón 6 con los 5 escenarios; confirmar con `ls -A ~/.flucastr-ai` antes/después que el home real no cambió.
- [ ] Prueba negativa: quitar `Bash(git push *)` de la lista del resolver, correr `./verify`, confirmar que falla en el 6, restaurar.
- [ ] `AGENTS.md`: límites conocidos (arriba), aviso de commits bloqueados, línea «Pi: solo el prompt», y el escalón 6 en la línea de `./verify`.

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
