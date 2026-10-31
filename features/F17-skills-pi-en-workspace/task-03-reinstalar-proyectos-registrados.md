# task-03 — instalar.sh: rehacer las skills de los proyectos registrados al reinstalar
repo: Flucastr.AI   depende_de: task-01, task-02   estado: hecha

## Descripción
Para que las skills del cliente no queden viejas respecto del kit, cada corrida de `instalar.sh` (y por tanto `instalar-remoto.sh --actualizar`, que la invoca con `--copiar`) debe volver a copiar las skills en los proyectos ya registrados con `skills-proyecto`, aunque no se pase `--proyecto`. Si la carpeta del proyecto ya no existe, se omite con aviso y se conserva el registro.

## Contexto
- A tocar (único archivo): `instalar.sh` (raíz).
- Leído: la reinstalación quita lo anterior con `bash "$RAIZ/desinstalar.sh" --silencioso --conservar-ajustes` (~l.241) tras copiar al `$NUEVO` las líneas `ajuste` con `grep -E "^ajuste$(printf '\t')" "$MANIFIESTO" >> "$NUEVO"`. Con task-02, ese desinstalar quita copias y exclusiones de proyectos pero no las líneas `skills-proyecto` (solo se van con el manifiesto), por lo que hay que arrastrarlas aquí.
- `instalar-remoto.sh` (leído, ~l.223, 280, 312) llama `instalar.sh --copiar` y `--copiar --simular` sin `--proyecto`; no requiere cambios.
- Función `instalar_skills_proyecto` y formato de manifiesto: task-01.

## Decisiones ya tomadas
- Junto a la línea que arrastra `ajuste`, arrastrar también `skills-proyecto` leyéndola del manifiesto antiguo a una variable (lista de rutas) antes de llamar a `desinstalar.sh`; no escribirlas en `$NUEVO` directamente (las escribe `instalar_skills_proyecto`, que no repite líneas).
- Tras los bloques de Claude Code y Pi y después de procesar `--skills-proyecto` del argumento, recorrer la lista: omitir la que sea igual a `$PROYECTO` con el flag (ya procesada); si la carpeta existe, `echo "Skills de Pi en el proyecto registrado (<ruta>)"` y `instalar_skills_proyecto`; si no existe, `  AVISO: el proyecto registrado ya no existe, se omite (registro conservado): <ruta>` y `registrar skills-proyecto <ruta>`.
- Con `--simular` la lista se lee igual del manifiesto existente y se informa lo que copiaría; no se escribe nada.
- Un proyecto registrado no se reinstala si `--solo claude` (mismo criterio que task-01: no se combinan). Con `--solo claude` se arrastra el registro sin tocar el proyecto y se avisa `  (proyectos con skills registradas no se actualizan con --solo claude)`.
- No cambia el comportamiento de `instalar.sh` sin proyectos registrados (los textos y el orden quedan igual).

## Alcance / Fuera de alcance
Alcance: lectura de `skills-proyecto` del manifiesto previo, recorrido y reinstalación, avisos.
Fuera de alcance: `instalar-remoto.sh`, `desinstalar.sh`, pruebas (task-04), README (task-05), actualización automática o en segundo plano.

## Pasos
1. Leer del manifiesto previo (si existe) las líneas `skills-proyecto` a una lista antes de la desinstalación previa. Resultado: lista disponible tras `desinstalar.sh`.
2. Agregar el recorrido final con las tres ramas (reinstala, omite duplicado, proyecto inexistente). Resultado: salida de la verificación.
3. Ajustar `--simular` y `--solo claude` según las decisiones. Resultado: sin escrituras en simulación.
4. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. Tras una instalación con el flag, editar `skills/crear-backlog/SKILL.md` de una copia del kit (o añadir un archivo a una skill del kit de prueba) y correr `bash instalar.sh` sin `--proyecto` actualiza `<p>/.pi/skills/…` con el cambio; se comprueba con `diff -r`.
2. Tras esa reinstalación, `git -C <p> status --porcelain` sigue sin salida, `exclude` no tiene líneas duplicadas (`sort | uniq -d` sin salida) y el manifiesto sigue con `skills-proyecto` 1, `directorio` 7 y `exclusion` 7 para ese proyecto.
3. Si se borra la carpeta del proyecto y se reinstala, sale con 0, imprime el AVISO y el manifiesto conserva la línea `skills-proyecto`.
4. `bash instalar.sh --simular` con proyectos registrados no cambia el HOME ni el proyecto.
5. `bash pruebas/rapida.sh` pasa sin cambios en las pruebas existentes.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
T=$(mktemp -d); mkdir -p $T/home/.claude $T/p; git -C $T/p init -q
export HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi
bash instalar.sh --proyecto $T/p --skills-proyecto
bash instalar.sh --simular
bash instalar.sh
git -C $T/p status --porcelain; sort $T/p/.git/info/exclude | uniq -d; cut -f1 $HOME/.flucastr-ai/manifiesto.txt | sort | uniq -c
rm -rf $T/p; bash instalar.sh; echo "exit=$?"; grep -c '^skills-proyecto' $HOME/.flucastr-ai/manifiesto.txt
bash desinstalar.sh
```
Esperado: `git status` y `uniq -d` sin salida; conteos `skills-proyecto 1`, `directorio 7`, `exclusion 7`; tras `rm -rf` el AVISO, `exit=0` y `1`. (El `export` aplica solo a esa sesión de shell; usar un shell nuevo después.) Luego `bash pruebas/rapida.sh` con `fail 0`.

## Evidencia

Rama: sin cambio. `git branch --show-current` → `feature/F17-skills-pi-en-workspace` (ya estaba en esa rama; no hubo `git switch`).

Código tocado: solo `instalar.sh` (`git diff --stat -- instalar.sh` → `instalar.sh | 45 +++++++++++++++++++++++++++++++++++++++++++++`, 45 inserciones, 0 borrados). `bash -n instalar.sh` → `bash -n OK`.

Entorno de las verificaciones: HOME falso `$T/home` con `mkdir -p $T/home/.claude`, `PI_CODING_AGENT_DIR=$T/home/pi`, proyectos temporales `$T/p`, `$T/p1`, `$T/p2` con `git init`. Las rutas temporales de la salida se muestran como `T/...` (sustitución mía para legibilidad). Nunca se tocó `~/.pi` ni `~/.claude` reales: `find ~/.flucastr-ai ~/.claude/agents -newer <marca>` no devolvió nada tras las corridas.

**Línea base (antes del cambio y después, sin proyectos registrados).** Misma secuencia de dos `bash instalar.sh` seguidos con HOME falso: la salida de la segunda corrida y el manifiesto (tipo, ruta) son idénticos antes y después del cambio (`SALIDA_IDENTICA`, `MANIFIESTO_IGUAL`).

**Verificación de la tarea (pasada completa, HOME falso):**

Paso 1, `bash instalar.sh --proyecto $T/p --skills-proyecto`: exit 0. Conteo del manifiesto tras esa instalación:
```
   1 ajuste
  12 archivo
   7 directorio
  14 enlace
   7 exclusion
   1 modo
   1 skills-proyecto
```

Paso 2, `bash instalar.sh --simular`: exit 0, con «copiaría» por skill y «ya estaba excluido en git (no se toca)». Listado de rutas de `$H` y `$T/p` antes y después: sin diferencias (`simular: HOME y proyecto sin cambios (listado)`). Líneas de `copiaría`: 7.

Paso 3, `bash instalar.sh` (sin `--proyecto`): exit 0. Salida de la rama del proyecto registrado:
```
Skills de Pi en el proyecto registrado (T/p)
  copiado: T/p/.pi/skills/crear-backlog
  ... (7 líneas «copiado»)
  excluido en git: /.pi/skills/crear-backlog/
  ... (7 líneas «excluido en git»)
```

Verificación posterior:
```
$ git -C $T/p status --porcelain -- .pi        → (sin salida)
$ sort $T/p/.git/info/exclude | uniq -d        → (sin salida)
$ cut -f1 manifiesto | sort | uniq -c           → 1 ajuste, 12 archivo, 7 directorio, 14 enlace, 7 exclusion, 1 modo, 1 skills-proyecto
```
Salida literal de `git -C $T/p status --porcelain` (sin `-- .pi`): `?? .claude/settings.local.json`. Viene de `--proyecto` (el agente fijado, comportamiento de task-01), no de esta reinstalación: también aparece con `instalar.sh --proyecto $T/p` sin `--skills-proyecto`. Ver *Notas*.

Paso 4, `rm -rf $T/p; bash instalar.sh; echo "exit=$?"`:
```
  AVISO: el proyecto registrado ya no existe, se omite (registro conservado): T/p
exit=0
1      ← grep -c '^skills-proyecto' del manifiesto
```

Paso 5, `bash desinstalar.sh`: exit 0. Quedaron en el HOME falso `.claude`, `.local` y `pi` (carpetas que creó la prueba o el propio kit con `mkdir -p`; no las quita `desinstalar.sh`, igual que antes del cambio).

**Criterio 1 (kit copia con cambio):** con un kit copiado a `$T/kit`, dos proyectos registrados (`p1`, `p2`), se añadió la línea `CAMBIO-PRUEBA-F17` a `$T/kit/skills/crear-backlog/SKILL.md` y se corrió `bash $T/kit/instalar.sh` sin `--proyecto`. Resultado: `diff -r "$KIT/skills/crear-backlog" "$T/p1/.pi/skills/crear-backlog" -x .flucastr-ai` sin diferencias (`p1 OK: diff -r sin diferencias`) y `p2 OK`. Lo mismo con `--copiar` para `ejecutar-tarea` (`p1 OK descarga`).

**Criterio 2 (tras reinstalar):** `git status --porcelain -- .pi` sin salida en p1 y p2; `uniq -d` sin salida; conteos con dos proyectos: `2 skills-proyecto`, `14 directorio`, `14 exclusion`, `2 ajuste`. Con un solo proyecto: `1 skills-proyecto`, `7 directorio`, `7 exclusion`. Para el `git status` completo, ver el punto de *Evidencia* del paso 3: `?? .claude/settings.local.json` (no lo causa la reinstalación).

**Criterio 3 (proyecto borrado):** `exit=0`, se imprime `AVISO: el proyecto registrado ya no existe, se omite (registro conservado): T/p2` (en la prueba de dos proyectos), y el manifiesto conserva `skills-proyecto` (`grep -c` = 1 para ese proyecto; la línea del proyecto que sí existe se reinstala: `Skills de Pi en el proyecto registrado (T/p1)`, `copiado` x7).

**Criterio 4 (`--simular` con registrados):** listado de rutas de `$H` y del proyecto idéntico antes y después (ver paso 2). Con p2 borrado: `AVISO: el proyecto registrado ya no existe ... T/p2` y exit 0.

**Casos adicionales:**
- `instalar.sh --proyecto T/p1 --skills-proyecto` con p1 ya registrado: aparece una sola vez (`Skills de Pi en el proyecto (T/p1)`); el recorrido final no la repite; manifiesto con una sola línea `skills-proyecto` para p1; `copiado` x7.
- `instalar.sh --proyecto T/p1` (sin flag) con p1 registrado: reinstala p1 (`Skills de Pi en el proyecto registrado (T/p1)`, `copiado` x7).
- `instalar.sh --solo pi` con p1 registrado: reinstala p1 (`Skills de Pi en el proyecto registrado (T/p1)`).
- `instalar.sh --solo claude` con p1 registrado: `  (proyectos con skills registradas no se actualizan con --solo claude)`; la línea `skills-proyecto` de p1 y p2 se conserva en el manifiesto. Las copias de p1 **se borran** en la limpieza previa y no se rehacen (`ls: .../p1/.pi/skills: No such file or directory`). Ver *Notas*.
- Modo descarga: `instalar.sh --copiar --proyecto T/p1 --skills-proyecto` y luego `instalar.sh --copiar` → `Skills de Pi en el proyecto registrado (T/p1)`, 7 copias, sin exclusiones duplicadas, `git status -- .pi` sin salida. `instalar.sh --copiar --simular` → 7 `copiaría`.
- Un `instalar.sh --copiar` sobre una instalación en modo repo sale con `Hay una instalación en modo repo; ejecuta desinstalar.sh antes de cambiar de modo.` y exit 1: es la regla de modo previa, no cambió.

**Verificación rápida (`bash pruebas/rapida.sh`):**

Corrida con HOME falso **vacío** (solo `$FH/home/.claude`, sin instalar el kit):
```
ℹ tests 220
ℹ pass 213
ℹ fail 7
```
Los fallos están en `pruebas/comprobaciones/registro.e2e.test.mjs` y `pruebas/ejecutar.test.mjs`; el mensaje es `FALLA: precondición de agente instalado`, porque `pruebas/comprobaciones/agente-instalado.mjs` exige el agente instalado en el HOME (`$HOME/.claude/agents/arquitecto.md`). **Mismo fallo en HEAD** sin mi cambio (exportado con `git archive HEAD`, misma corrida: `ℹ pass 212`, `ℹ fail 8`, con el mismo conjunto más una prueba `R: ejecutar.sh genera fixture e instantánea` que falló por una vez).

Corrida con HOME falso **con el kit instalado dentro** (`bash instalar.sh` con ese HOME) y `FLUCASTR_PI_BIN=$FH/home/.local/bin/pi-arquitecto`:
```
ℹ tests 220
ℹ pass 220
ℹ fail 0
rapida: 21 archivos en 11 s (tope 30 s)
exit=0
```
Esta es la corrida final que cumple el criterio 5. Su salida completa está en `$S/rapida-final.txt` (scratchpad).

**Criterios de aceptación:**
1. Cumple (diff -r sin diferencias, con kit copiado).
2. Cumple en `.pi/`, exclusión y manifiesto (1 / 7 / 7). **No cumple literal** `git status --porcelain` sin salida: `?? .claude/settings.local.json` aparece por `--proyecto` (task-01), no por esta tarea.
3. Cumple (AVISO, exit 0, línea conservada).
4. Cumple (sin cambios en HOME ni en el proyecto).
5. Cumple con el kit instalado en el HOME falso (220/220). Con HOME falso vacío, 7 fallos que también existen en HEAD.

## Notas

- **Huecos menores, decisiones tomadas:**
  1. Los registros `skills-proyecto` se leen del manifiesto antes de la limpieza, en una variable con saltos de línea (no un array: en bash 3.2 de macOS `"${arr[@]}"` vacío falla con `set -u`). No se escriben en `$NUEVO`.
  2. Para un proyecto registrado sin carpeta, la línea se vuelve a registrar solo si no está ya en `$NUEVO` (evita duplicados).
  3. Antes de reinstalar cada proyecto registrado se imprime una línea en blanco y el encabezado `Skills de Pi en el proyecto registrado (<ruta>)`, igual que el bloque de `--skills-proyecto`.
  4. `PROYECTO` se cambia dentro del bucle y se restaura al salir; `ANTERIOR_PROYECTO` guarda el valor original.
  5. Sin proyectos registrados, el bloque no imprime nada: la salida y el manifiesto son idénticos a la línea base (comprobado).
- **Decisión pendiente de Franco (no cambié el comportamiento):** con `--solo claude`, la limpieza previa de `desinstalar.sh` borra las copias de Pi de los proyectos registrados, y como la tarea dice no reinstalarlos con `--solo claude`, quedan sin copias y con el registro conservado. Es el mismo comportamiento que hoy tienen las skills globales de Pi con `--solo claude` (la limpieza no distingue `--solo`). Si Franco quiere que el proyecto quede intacto, hace falta cambiar `desinstalar.sh` o la lectura previa, y eso sale del alcance de esta tarea.
- **Criterio 2 literal:** `git status --porcelain` muestra `?? .claude/settings.local.json` porque `--proyecto` fija el agente en un archivo sin ignorar; eso ya pasaba con task-01. Si se quiere `git status` limpio, falta decidir si ese archivo se excluye en git (fuera de esta tarea).
- **Criterio 5:** `pruebas/rapida.sh` con HOME falso vacío falla 7 pruebas que exigen el agente instalado en el HOME; HEAD falla las mismas. Pasa 220/220 con el kit instalado en ese HOME falso.
- Error mío durante la verificación: la shell es zsh y `env $VAR` sin comillas no divide palabras, así que la primera pasada usó un HOME mal formado. Se descartó, se revisó que no se tocó nada real (`find ... -newer`) y se repitió la pasada completa con `env HOME="$H" ...`. Las salidas de *Evidencia* son de la pasada buena. En *Registro* cuenta como 2 intentos.
- Revisión sugerida para Franco: *Evidencia* (criterios 2 y 5), el diff de `instalar.sh` (`git diff -- instalar.sh`, 45 líneas) y la decisión sobre `--solo claude`. Sin commit, sin push.

Señal: la tarea estaba incompleta. No decía qué pasa con las copias de proyectos registrados bajo `--solo claude` (la limpieza previa las borra), y el criterio 2 no contaba con que `--proyecto` deja `.claude/settings.local.json` sin ignorar.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=falla; huecos=5; resultado=lista; causa=ninguna
