# task-01 — `resolver.mjs`: línea de identidad en `agente-claude`, `agente-pi` y `cuerpo`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Para que el agente sepa en qué herramienta corre, con qué modelo y como qué agente, `scripts/resolver.mjs` escribe una línea fija «Herramienta: <Pi|Claude Code> | Modelo: <id> | Agente: <nombre>» como primera línea del cuerpo. Aplica a las tres salidas que producen un prompt: `agente-claude` y `agente-pi` (archivos instalados) y `cuerpo` (el que leen los lanzadores `pi-*`, por ejemplo `pi-coordinador`). Franco aprobó la ampliación a `cuerpo` el 2026-10-31 (opción A del refinado).

## Contexto
- Leído `scripts/resolver.mjs`: `resolverModelo(agente, herramienta)` ya devuelve el modelo (`herramienta`: `claude-code` o `pi`); las órdenes `agente-claude`/`agente-pi` derivan el agente con `basename(archivo, ".md")` y escriben `---\n${cabeceraSalida}\nmodel: ${modelo}\n# flucastr-ai:generado - no editar; se regenera con instalar.sh\n---\n${cuerpo}`; `cuerpo` hace `process.stdout.write(partir(args[0]).cuerpo.replace(/^\s+/, ""))`.
- `partir()` entrega `cuerpo` empezando con un salto de línea (el archivo tiene una línea en blanco tras el segundo `---`), de modo que `línea + "\n" + cuerpo` deja: línea de identidad, línea en blanco, título.
- `instalar.sh` L324 arma el lanzador `pi-<agente>` con `resolver.mjs cuerpo "$RAIZ/agentes/<agente>.md"` (se evalúa en cada lanzamiento, con `FLUCASTR_MODELOS` si el modo es descarga) y L282/L304 generan los archivos con `agente-claude`/`agente-pi`.
- Valores actuales de `modelos.json` (ejecutado): `modelo coordinador pi` → `openai/gpt-6.1-sol`; `modelo coordinador claude-code` → `claude-sonnet-5-5`.
- Los comprobadores `contrato-roles`, `agente-instalado`, `modelos-agentes` y Capa 1 leen `agentes/*.md` fuente o solo el encabezado (`definitions/ARCHITECTURE.md`, «Higiene de contexto», punto 6; probado por el arquitecto en copia aislada); las únicas pruebas afectadas son las de `pruebas/comprobaciones/resolver-agentes.test.mjs`, que ajusta task-02.
- Se ejecuta con `node scripts/resolver.mjs …` (sin efectos sobre archivos).

## Decisiones ya tomadas
- Redacción literal, un solo formato: `Herramienta: Pi | Modelo: <id> | Agente: <nombre>` para Pi y `Herramienta: Claude Code | Modelo: <id> | Agente: <nombre>` para Claude Code. `<id>` es lo que devuelve `resolverModelo` para esa herramienta; `<nombre>` es `basename(archivo, ".md")`.
- Una función `lineaIdentidad(herramienta, agente)` en `resolver.mjs` (herramienta `pi` → «Pi»; `claude-code` → «Claude Code»), usada por las tres órdenes.
- `agente-claude` y `agente-pi`: la línea va justo después del `---` de cierre, antes del `${cuerpo}`: `---\n${linea}\n${cuerpo}`.
- `cuerpo` usa el modelo y la redacción de Pi (`resolver modelo <agente> pi`): `${linea}\n\n` + el cuerpo con `.replace(/^\s+/, "")` como hoy. `cuerpo` no valida `name` ni `model` (como hoy).
- No se cambia nada más: encabezado, `bashPlano`, mensajes de error, otras órdenes.
- Actualizar los comentarios de uso del inicio del archivo para `cuerpo` («… con la línea de identidad de Pi»).

## Alcance / Fuera de alcance
Alcance: `scripts/resolver.mjs`.
Fuera de alcance: `pruebas/` (task-02), `instalar.sh`, `desinstalar.sh`, los lanzadores, `agentes/`, `skills/`, `modelos.json`, README, reinstalar nada en `~/.claude` o `~/.pi`.

## Pasos
1. Agregar `lineaIdentidad(herramienta, agente)` en `scripts/resolver.mjs`. Resultado: función definida sin errores de sintaxis (`node --check`).
2. En la rama `agente-claude`/`agente-pi`, escribir la línea tras el `---` de cierre. Resultado: `node scripts/resolver.mjs agente-claude agentes/coordinador.md` muestra la línea Claude Code en la línea 8.
3. En la rama `cuerpo`, anteponer la línea de Pi con el modelo de `resolverModelo(agente, "pi")`. Resultado: `node scripts/resolver.mjs cuerpo agentes/coordinador.md | head -3` muestra la línea, una línea en blanco y `# Coordinador`.
4. Actualizar el comentario de uso de `cuerpo`. Resultado: `grep -n "cuerpo" scripts/resolver.mjs` muestra el texto nuevo.
5. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `agente-claude` de `coordinador` contiene `Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador` inmediatamente después del segundo `---` (se comprueba con `sed -n 7,8p`).
2. `agente-pi` de `constructor` contiene `Herramienta: Pi | Modelo: openai/gpt-6-luna | Agente: constructor` en esa misma posición.
3. `cuerpo` de `coordinador` empieza con `Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador`, seguida de una línea en blanco.
4. `git diff --stat` de esta tarea muestra solo `scripts/resolver.mjs`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --check scripts/resolver.mjs
node scripts/resolver.mjs agente-claude agentes/coordinador.md | sed -n 7,9p
node scripts/resolver.mjs agente-pi agentes/constructor.md | grep -n "^Herramienta:"
node scripts/resolver.mjs cuerpo agentes/coordinador.md | head -3
git diff --stat scripts/resolver.mjs
```
Esperado: sin error de sintaxis; la primera salida muestra `---`, la línea `Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador` y una línea en blanco (posiciones verificadas con el encabezado actual de `coordinador`, que ocupa 7 líneas: `---`, `name`, `description`, `tools`, `model`, comentario, `---`; no ejecutado tras el cambio); `grep` con una sola coincidencia de Pi/`gpt-6-luna`; las tres primeras líneas de `cuerpo` son la línea de Pi, una en blanco y `# Coordinador`; `diff --stat` con un solo archivo.

## Evidencia

Rama: `git branch --show-current` → `feature/F18-identidad-y-prompts-livianos` (creada con `git switch -c` desde `main`, sin `-c` previo porque no existía).

Cambios hechos en `scripts/resolver.mjs`: función `lineaIdentidad(herramienta, agente)`; línea de identidad en `agente-claude`/`agente-pi` tras el `---` de cierre; `cuerpo` antepone la línea de Pi y una línea en blanco; comentario de uso de `cuerpo` actualizado.

Comando: `node --check scripts/resolver.mjs && echo SYNTAX_OK`
```
SYNTAX_OK
```

Comando: `node scripts/resolver.mjs agente-claude agentes/coordinador.md | sed -n 7,9p`
```
---
Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador

```

Comando: `node scripts/resolver.mjs agente-pi agentes/constructor.md | grep -n "^Herramienta:"`
```
7:Herramienta: Pi | Modelo: openai/gpt-6-luna | Agente: constructor
```

Comando: `node scripts/resolver.mjs cuerpo agentes/coordinador.md | head -3`
```
Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador

# Coordinador
```

Comando: `grep -n "cuerpo" scripts/resolver.mjs`
```
8://   node scripts/resolver.mjs cuerpo <archivo.md>             imprime el agente sin encabezado, con la línea de identidad de Pi (para Pi)
74:  return { cabecera: m[1], cuerpo: m[2] };
141:  const { cabecera, cuerpo } = partir(archivo);
155:    `---\n${cabeceraSalida}\nmodel: ${modelo}\n# flucastr-ai:generado - no editar; se regenera con instalar.sh\n---\n${lineaIdentidad(herramienta, agente)}\n${cuerpo}`
157:} else if (orden === "cuerpo" && args.length === 1) {
159:  process.stdout.write(`${lineaIdentidad("pi", agente)}\n\n` + partir(args[0]).cuerpo.replace(/^\s+/, ""));
205:  fallar("uso: resolver.mjs modelo <agente> <herramienta> | agente-claude <archivo> | agente-pi <archivo> | cuerpo <archivo> | fijar-agente <json> <agente> | quitar-agente <json> <agente> | comparar-modelos <personal> <publicado>");
```

Comando: `git diff --stat scripts/resolver.mjs`
```
 scripts/resolver.mjs | 16 ++++++++++++----
 1 file changed, 12 insertions(+), 4 deletions(-)
```

Criterios de aceptación:
1. `agente-claude` de `coordinador`: línea 8 = `Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: coordinador`, tras el `---` de la línea 7. Cumple.
2. `agente-pi` de `constructor`: línea 7 = `Herramienta: Pi | Modelo: openai/gpt-6-luna | Agente: constructor`, justo después del `---` de cierre (línea 6). Cumple. Su posición es la 7 y no la 8 porque el encabezado de `constructor` no tiene línea `tools:` (ver Notas).
3. `cuerpo` de `coordinador`: empieza con `Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: coordinador`, seguida de línea en blanco. Cumple.
4. `git diff --stat` de la tarea: solo `scripts/resolver.mjs`. Cumple (el resto del árbol con cambios previos de otras tareas no se tocó).

Verificación completa de `pruebas/rapida.sh` con el HOME real (`HOME=/Users/franco`), salida guardada y resumen:
```
ℹ tests 224
ℹ pass 222
ℹ fail 2
✖ (3) agente sin Bash queda idéntico en ambas salidas salvo model: (98.02675ms)
✖ (6) arquitecto, planificador y constructor no cambian en agente-pi (comparado con agente-claude sin model:) (104.2115ms)
EXIT=1
```
Diferencia real de la prueba (6), la única línea que cambia: `+ Herramienta: Pi | Modelo: openai/gpt-6.1-sol | Agente: arquitecto` frente a `- Herramienta: Claude Code | Modelo: claude-sonnet-5-5 | Agente: arquitecto`. La prueba (3) falla por la misma causa (la línea de identidad difiere por herramienta). Son las dos pruebas que task-02 ajusta, como estaba previsto. El resto de la suite pasa.

## Notas
- Pruebas que fallan por la nueva línea, esperado y para task-02: `resolver-agentes.test.mjs` → «(3) agente sin Bash queda idéntico en ambas salidas salvo model:» y «(6) arquitecto, planificador y constructor no cambian en agente-pi (comparado con agente-claude sin model:)». No se tocó `pruebas/`.
- Nota sobre la posición en la verificación: la línea de identidad va siempre justo después del `---` de cierre. En `coordinador` ese cierre es la línea 7 (el encabezado tiene `tools:`), y en `constructor` es la línea 6 (sin `tools:`), por eso la de Pi sale en la 7 y la de Claude Code en la 8. Comprobado con `head -9` de ambas salidas. Sin fallo; anotado para que Franco lo vea.
- Hueco menor 1: el encargo no decía qué nombre usar en `cuerpo`; se usa `basename(archivo, ".md")`, como en las otras órdenes. Decisión conservadora, coherente con la tarea.
- Riesgo a vigilar (no es hueco resuelto): `cuerpo` ahora llama a `resolverModelo`, así que depende de `modelos.json` (perfil/nivel por defecto). Antes solo leía el archivo de agente. Si `modelos.json` no tiene defaults, `cuerpo` fallará; la verificación actual con el `modelos.json` del repo pasa.
- Fijado al instalar: el modelo de la línea es el de `modelos.json` en el momento de generar `cuerpo`/`agente-*`; el `--model` manual no se refleja (límite ya descrito en ARCHITECTURE.md, punto 6).
- No se hizo commit, push ni se reinstaló nada en `~/.claude` ni `~/.pi`. No se escribió en `STATUS.md`. `estado` cambiado a `lista para revisión`; `hecha` lo decide Franco.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
