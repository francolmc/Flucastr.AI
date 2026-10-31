# Verificación de la compactación automática (Pi 1.4.0 y Claude Code 2.1.308)

Fecha: 2026-10-31. Pedido de Franco: dejar COMPROBADO que ambas herramientas aceptan y aplican el ajuste que instalaría el kit (borrador «Cambio de diseño» de `definitions/ARCHITECTURE.md`). Todo se probó en directorios temporales fuera del repo (`/tmp/verif-*`, ya borrados); no se tocó `~/.pi/agent/settings.json` ni ningún `settings*.json` real de `~/.claude`; no se abrió `auth.json`, `models-store.json` ni contenido de sesiones.

## Veredicto por herramienta

| Herramienta | Acepta | Aplica |
|---|---|---|
| Pi 1.4.0 (`compaction.modelOverrides`) | sí | sí (compactación real observada) |
| Claude Code 2.1.308 (`autoCompactWindow`) | sí | sí (compactación real observada), con la salvedad del colchón de 33 k (punto 6) |

## Tabla por punto

| # | Punto | Veredicto | Evidencia |
|---|---|---|---|
| 1 | Esquema Pi | CONFIRMADO | `dist/core/settings-schema.js` líneas 10-21 y `dist/core/settings-manager.js` 641-672; `docs/settings.md` 69-82; `docs/compaction.md` 439-460. Forma: `{"compaction":{"enabled":bool,"reserveTokens":n,"keepRecentTokens":n,"modelOverrides":{"openai/gpt-6.1-sol":{"reserveTokens":172000,"keepRecentTokens":20000}}}}`; clave `provider/modelId` exacta y sensible a mayúsculas; números enteros seguros no negativos. Validación probada: `reserveTokens:"abc"` en el override del modelo activo da `Invalid compaction.modelOverrides["openai/gpt-6-luna"].reserveTokens setting: abc. Expected a non-negative safe integer.` (la corrida no avanza); JSON roto da `Warning: Invalid settings file …` y se ignora el archivo (Pi responde igual); claves desconocidas se toleran y se conservan (`additionalProperties`; prueba con `zzz`, `foo`, `claveNueva`). Un override válido de otro modelo no afecta (`gpt-6.1-sol` mantuvo 16384 cuando solo `gpt-6-luna` estaba definido). |
| 2 | Pi aplica el ajuste | CONFIRMADO | Proyecto temporal con `.pi/settings.json` = `{"compaction":{"modelOverrides":{"openai/gpt-6-luna":{"reserveTokens":270500,"keepRecentTokens":100}}}}` (umbral = 272000 − 270500 = 1500) y `pi -p -a …`. Con contexto ≈3,5 k en `--mode json` salieron `compaction_start reason=threshold` y `compaction_end` (aborted=false), y el archivo de sesión terminó con una entrada `compaction` (`tokensBefore` 3565, resumen de 553 caracteres, `firstKeptEntryId`). El umbral por defecto (≈255 k) jamás habría disparado a 3,5 k. Confianza en modo no interactivo: el ajuste de proyecto exige confianza y existe la forma documentada **`-a`/`--approve`** («Trust project-local files for this run», `docs/cli.md` 238, 290; `defaultProjectTrust` solo vale en el directorio de agente y no se tocó). Notas: (a) las primeras corridas **no** compactaron: con mensajes diminutos `prepareCompaction` no halla qué resumir (el mensaje de sistema ocupa casi todo el contexto); en uso real hay historial, así que no es un problema; (b) `pi -p` sin `</dev/null` se queda esperando stdin: en pruebas de scripts redirigir la entrada. |
| 3 | Fusión segura en Pi | CONFIRMADO (con un matiz) | `settings-manager.js` 100-170 y 430-470: bloqueo `proper-lockfile` v4.1.2 (`mkdir <settings.json>.lock`; 10 reintentos de 20 ms; el bloqueo caduca por antigüedad), **relee el archivo bajo el bloqueo** y escribe solo los campos que Pi modificó (a nivel `compaction` solo las subclaves tocadas) con `writeFileSync` (no atómico, reformatea a 2 espacios). Prueba aislada (`SettingsManager` con `agentDir` temporal): `deviceId`, `packages`, `claveNueva` y `compaction.modelOverrides` sobrevivieron a `setCompactionEnabled(false)`; una clave que **otro proceso añadió después de que Pi cargó** (`gpt-6-luna`) también sobrevivió. Sin bloqueo residual. **No relee en caliente**: lee al arrancar y con `/reload` (`docs/configuration.md` línea 5); un Pi abierto aplica el cambio al reiniciar. Consecuencia para el kit: escribir con temporal + renombrar **y** tomar el mismo bloqueo (`mkdir <settings.json>.lock`, `rmdir` al final) para no cruzarse con una escritura de Pi. |
| 4 | Ventanas | CONFIRMADO | `pi-ai/dist/providers/data/openai.json` (entradas `chat:`, proveedor `openai`): `gpt-6-astra` 272000, `gpt-6.1-sol` 272000, `gpt-6-luna` 272000 (`maxTokens` 128000). `pi --list-models gpt-6` (catálogo en ejecución) muestra `openai gpt-6-astra/gpt-6-luna/gpt-6.1-sol 272K`. Trampas descartadas: `classifier:gpt-6-luna` = 922000 (API `openai-decisions`, no es chat) y `openai-codex/gpt-6.1-sol` = 500000 (otro proveedor; el perfil usa `openai`). |
| 5 | Claude Code: clave, archivos, precedencia, rango | CONFIRMADO | Clave global `autoCompactWindow` y por modelo `modelSettings.<canónico>.autoCompactWindow` (número o `"auto"`) en el esquema del binario; variable `CLAUDE_CODE_AUTO_COMPACT_WINDOW`. Pruebas con `claude -p "/context"` (sin costo de modelo; muestra `Tokens: X / <ventana>`): proyecto local 123456 → `123.5k`; sin ajuste → `1m`. Precedencia (usuario con `CLAUDE_CONFIG_DIR` temporal): usuario 210k < `.claude/settings.json` 220k < `.claude/settings.local.json` 230k < `--settings` 240k < variable 250k (cada nivel ganó al anterior). Por modelo: `{"autoCompactWindow":200000,"modelSettings":{"claude-haiku-5-5":{"autoCompactWindow":150000}}}` → 150k en haiku; clave de otro modelo (sonnet) → haiku queda en 1m. Entre archivos: usuario por-modelo 150k + local global 230k → 230k (el global de mayor precedencia descarta los por-modelo de menor); usuario global 210k + local por-modelo 140k → 140k en haiku y 210k en sonnet. Rango 100000-1000000: en ajustes, 50000, 2000000 y `"abc"` se **ignoran en silencio** (ventana 1m); 100000 vale. En la variable: 50000 → se **sube a 100000**; `abc` → se ignora (queda el ajuste). JSON roto → `Invalid or malformed JSON` y se ignora el archivo. Clave desconocida junto a una válida: se tolera. |
| 6 | Claude Code aplica el ajuste | CONFIRMADO, con matiz | Proyecto temporal con `{"autoCompactWindow":100000}`; turno 1 (`--model haiku`): contexto ≈54,8 k, sin compactar; turno 2 (+≈19,6 k tokens): ≈74 k; turno 3 (`-c`): evento `system/compact_boundary` con `trigger: "auto"`, `pre_tokens: 74082`, `post_tokens: 790` (salida `--output-format stream-json --verbose`; también `status: compacting`). Se compactó **antes** de los 100 k de la ventana. `/context` explica por qué: `Autocompact buffer 33k` (idéntico en haiku, sonnet y opus) y el código del binario resta `min(salida máx., 20 k) + 13 k`. **Umbral real = ventana − 33 000.** Para compactar a `compactar_en` hay que escribir `compactar_en + 33000` (100000 → 133000); con 100000 se compacta a ≈67 k. |
| 7 | La sesión principal de un agente | CONFIRMADO | `claude -p "/context" --agent probador` con el agente (`.claude/agents/probador.md`) declarando `autoCompactWindow: 111000` y `settings.local.json` en 230000 → `230k`; con el agente en 300000 → `230k`; sin ajuste de proyecto y agente en 111000 → `1m`. La sesión principal ignora el campo del frontmatter y usa settings/variable. Que el campo sí afecte a subagentes es lectura del código (`Rje` y `mb`: «Overrides the window it would inherit», actúa como tope), **no probado con subagente** (no hace falta para el diseño). |
| 8a | Claude Code: ¿hook, SDK o comando dispara compactación? | REFUTADO para hooks y para el modelo; CONFIRMADO para un proceso externo | Binario: `PreCompact` = «Exit code 0 – stdout appended as custom compact instructions; Exit code 2 – block compaction»: reacciona, no inicia. `/compact` es un comando `local` con `supportsNonInteractive: true`; **prueba**: `claude -p -c "/compact"` en la sesión temporal produjo `compact_boundary` con `trigger: "manual"` (costo ≈$0,02). No hay herramienta del modelo que lo ejecute (los comandos `local` no se invocan desde el modelo; no hay otra evidencia). Conclusión: un agente o hook no puede; Franco o un script sí. |
| 8b | Pi: ¿`pi-subagents` aporta una herramienta de compactar? | REFUTADO | `~/.pi/agent/npm/node_modules/pi-subagents` 0.84.0: herramientas registradas `subagent`, `contact_supervisor`, `structured_output`, `bg_wait`, `watchdog_ask/warn/permission_decision` (más adaptadores de terminal); comandos `/subagents…`, `/run`, etc.; ninguna llamada a `.compact(` ni `newSession(` en `bundle/`. `pi-agent-mode` 1.3.0 y `pi-notify` 1.4.0: sin coincidencias. (En Pi solo una extensión puede compactar con `ctx.compact()`; ya consignado.) |
| 9 | Línea de identidad | CONFIRMADO (viable) | `scripts/resolver.mjs` línea 148 compone `---\n<cabecera>\nmodel: <modelo>\n# flucastr-ai:generado…\n---\n<cuerpo>` y ya conoce `orden` (herramienta), `modelo` y `agente`. Prototipo en **copia aislada** (repo sin tocar): `Herramienta: Pi \| Modelo: openai/gpt-6.1-sol \| Agente: coordinador` y `Herramienta: Claude Code \| Modelo: claude-haiku-5-5 \| Agente: constructor`, como primera línea del cuerpo. Efecto en `bash pruebas/rapida.sh` (copia): fallan 2 pruebas nuevas, `resolver-agentes.test.mjs` (3) y (6), que comparan Pi y Claude Code «salvo `model:`»; con `sinLineaModelo` ampliado a `!l.startsWith('Herramienta:')` vuelven a pasar y el resultado iguala al del control (el único fallo restante, `R: ejecutar.sh genera fixture…`, ocurre también en la copia sin parche: efecto de la copia, ver «rapida real» abajo). Los comprobadores de contrato (`contrato-roles`, `agente-instalado`, `modelos-agentes`, Capa 1) no se rompen. Redacción exacta y lugar: ver abajo. |
| 10 | Preguntas abiertas | ver sección final | |

## Redacción propuesta (punto 9)

Lugar: primera línea del **cuerpo** del archivo generado (tras el `---` de cierre; el cuerpo es lo que el modelo lee, el encabezado no), seguida de una línea en blanco. Texto, generado por `resolver.mjs`:

- Pi: `Herramienta: Pi | Modelo: <proveedor/modelo> | Agente: <nombre>`
- Claude Code: `Herramienta: Claude Code | Modelo: <modelo> | Agente: <nombre>`

Cambio mínimo en `resolver.mjs`: `... ---\n` + `` `Herramienta: ${orden === "agente-pi" ? "Pi" : "Claude Code"} | Modelo: ${modelo} | Agente: ${agente}\n\n${cuerpo.replace(/^\s+/, "")}` ``. Más el ajuste de `sinLineaModelo` en `pruebas/comprobaciones/resolver-agentes.test.mjs` y una aserción nueva (la línea existe y difiere por herramienta). Límite: el modelo queda fijado al instalar; en Pi el agente puede confirmar el real con `echo "$PI_PROVIDER/$PI_MODEL"` (documentado en `docs/environment-variables.md`).

## Punto 10: las 6 preguntas abiertas del borrador

| Pregunta | Estado tras la verificación |
|---|---|
| 1. ¿Global de Pi en vez de por proyecto? | Sigue siendo decisión de Franco. Hecho comprobado: el global **se aplica** y no exige confianza; el de proyecto sí (`-a` o `/trust`). Recomendación sin cambio: global. |
| 2. ¿`compactar_en` = 100000? | Decisión de Franco. **Cambia la recomendación para Claude Code**: el valor escrito es `compactar_en + 33000`. En Pi sin cambio (`ventana − compactar_en`). |
| 3. ¿Eliminar `CONTEXTO:`? | Decisión de Franco. Las dos herramientas aplican el umbral, así que A (eliminar) sigue siendo viable. |
| 4. Claude Code: ¿esperar la verificación? | **RESUELTA**: verificada. Ya no se espera; se instala en `<proyecto>/.claude/settings.local.json`. |
| 5. ¿Descartar la extensión de Pi con `ctx.compact()`? | Decisión de Franco; hecho nuevo: `pi-subagents` no aporta nada y en Claude Code ningún hook/modelo puede. Recomendación sin cambio: descartar por ahora. |
| 6. ¿Declarar solo `gpt-6.1-sol`? | **RESUELTA**: las tres ventanas están confirmadas (272000); se declaran las tres. |

Recomendaciones que cambian: (a) Claude Code ya no es «condicionado»: se instala; (b) su valor lleva el colchón de 33 k; (c) `ventanas` lleva las tres; (d) tarea nueva por el requisito de identidad (resolver + dos pruebas); (e) `fijar-compactacion` de Pi debe tomar el bloqueo `settings.json.lock`.

## NO COMPROBABLE-AQUÍ

- Pi: que un Pi **ya abierto** no aplique el cambio hasta `/reload` o reinicio (por el código, no se midió con una sesión viva). Franco: tras instalar, abrir Pi nuevo y comprobar con el pie del TUI que compacta al pasar de ≈100 k (o `showCacheMissNotices: true`, que muestra avisos de compactación).
- Claude Code: el efecto del campo del frontmatter sobre un **subagente** (solo lectura del código). Comprobación opcional: un agente con `autoCompactWindow: 100000` lanzado desde `coordinador`, mirando `/context` del subagente (no hay forma no interactiva simple).
- Instalación real: que `~/.claude/settings.json` y `~/.pi/agent/settings.json` reales se fusionen bien con el escritor del kit (cuando exista). Franco: tras F18, `bash instalar.sh --simular` y luego instalar; comprobar con `git diff`/`diff` que solo se añadió `compaction.modelOverrides` y que `packages`, `deviceId` siguen.

## Comandos exactos usados

Pi (todos con `cd <tmp>/p`, `--session-dir <tmp>/s`, `</dev/null`):

```
pi -p -a --model openai/gpt-6-luna "Responde solo con la palabra OK."                       # corrida 1 (sin </dev/null se quedó esperando stdin)
pi -p -a --no-extensions -nbt -c --model openai/gpt-6-luna "Responde solo con la palabra DOS."
pi -p -a --no-extensions -nbt -c --mode json --model openai/gpt-6-luna "Responde solo con la palabra TRES."
pi -p -a --no-extensions -nbt -c --mode json --model openai/gpt-6-luna "<texto de relleno>… Ahora responde solo con la palabra CUATRO."   # aquí apareció la compactación
pi -p -a --no-extensions -nbt --no-session --model openai/gpt-6-luna "di OK"                # con reserveTokens:"abc" (error) y con JSON roto (aviso)
pi --list-models gpt-6
node chk.mjs / wr.mjs   # SettingsManager con agentDir temporal: resolución y escritura con otra clave añadida en medio
```

Claude Code (`cd <tmp>` con `.claude/settings.local.json` variable):

```
claude -p "/context" --model haiku --output-format text        # y con --model sonnet / opus, --agent probador, --settings '{…}'
CLAUDE_CONFIG_DIR=<tmp>/cfg claude -p "/context" --model haiku  # ajustes de usuario aislados
CLAUDE_CODE_AUTO_COMPACT_WINDOW=50000 claude -p "/context" …
claude -p "<relleno 12 000 palabras> Al final responde solo OK." --model haiku --strict-mcp-config --disable-slash-commands --tools "" --max-budget-usd 0.20 --output-format json
claude -p -c "<relleno 4 500 palabras>…" … --output-format stream-json --verbose
claude -p -c "Responde solo OK." … --output-format stream-json --verbose                      # compact_boundary trigger=auto
claude -p -c "/compact" --model haiku --max-budget-usd 0.20 --output-format stream-json --verbose   # trigger=manual
```

## Costos aproximados

- Pi (`openai/gpt-6-luna`): 5 invocaciones con modelo (corridas 1-4 y la de JSON roto; la de `reserveTokens:"abc"` falló antes de llamar), contexto ≤ 3,6 k tokens: < $0,01 en total (registro de uso: ≈$0,0003 por turno).
- Claude Code (`haiku`): 4 invocaciones con modelo: $0,011 + $0,015 + $0,019 + $0,020 ≈ **$0,065**; decenas de `/context` sin costo.
- Tope respetado: ≤ 8 por herramienta; `--max-budget-usd 0.20` en cada llamada.

## `rapida.sh` real

`bash pruebas/rapida.sh` con el HOME real, al terminar: 224 pruebas, 224 aprobadas, 0 fallas, 22 archivos en 13 s (tope 30 s). Los únicos cambios de esta verificación son este informe y `definitions/ARCHITECTURE.md`; el fallo de `R: ejecutar.sh…` visto en las copias aisladas no ocurre en el repo real. Directorios temporales (`/tmp/verif-*`) borrados.
