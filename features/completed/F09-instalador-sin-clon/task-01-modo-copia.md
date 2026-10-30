# task-01 — modo copia de `instalar.sh`, `FLUCASTR_MODELOS` y `desinstalar.sh`
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Prepara la instalación sin clon sin tocar la red: `instalar.sh --copiar` copia las skills (en vez de enlazarlas), registra el modo en el manifiesto y usa un `modelos.json` personal en `~/.flucastr-ai/`. `scripts/resolver.mjs` acepta la variable `FLUCASTR_MODELOS` y `desinstalar.sh` entiende las carpetas copiadas. El modo con clon (enlaces) queda igual. Es la base de task-02 y task-03.

## Contexto
Leídos en el repo:
- `instalar.sh`: `RAIZ` = carpeta del script; `ESTADO_DIR="$HOME/.flucastr-ai"`; `MANIFIESTO`; bucle de opciones `while [ $# -gt 0 ]`; valida con `node "$RESOLVER" agente-claude|agente-pi` antes de escribir; `registrar tipo ruta extra` escribe en `$NUEVO` (formato `tipo<TAB>ruta<TAB>extra`) y el `trap` lo copia a `$MANIFIESTO`; `enlazar_skills`; `generar_lanzador_pi` (heredoc con `RAIZ="$RAIZ"`); bloque «Quitando la instalación anterior» que llama a `desinstalar.sh --silencioso --conservar-ajustes`.
- `desinstalar.sh`: bucle `case "$tipo"` con `enlace`, `archivo`, `ajuste`; al final borra el manifiesto y hace `rmdir "$ESTADO_DIR"`.
- `scripts/resolver.mjs` línea 25: `JSON.parse(readFileSync(join(raiz, "modelos.json"), "utf8"))` en `leerConfig()`.
- Pruebas: `pruebas/capa1/instalacion.test.mjs` (patrón: HOME temporal en `pruebas/.temporales/`, `PI_CODING_AGENT_DIR` dentro del HOME, `spawnSync`) y `pruebas/rapida.sh` (lista explícita de archivos; hoy ~21 s de un tope de 30 s).
- El shell del equipo es bash 3.2 (macOS): sin arreglos asociativos ni `${var,,}`.
Comandos de esta tarea sobre archivos nuevos (`pruebas/capa1/copia.test.mjs`) no existen aún: «no ejecutado, inferido».
A tocar: `scripts/resolver.mjs`, `instalar.sh`, `desinstalar.sh`, `pruebas/capa1/copia.test.mjs` (nuevo), `pruebas/rapida.sh`.

## Decisiones ya tomadas
- Marca de carpeta copiada: archivo vacío `.flucastr-ai` dentro de la carpeta de la skill. Tipo de manifiesto nuevo: `directorio`.
- Primera línea del manifiesto: `modo<TAB>repo` (modo actual, enlaces) o `modo<TAB>descarga` (con `--copiar`). Un manifiesto sin línea `modo` se trata como `repo`.
- `instalar.sh` se niega a cambiar de modo: si el manifiesto existente tiene otro modo, sale con código 1 y el mensaje `Hay una instalación en modo <modo>; ejecuta desinstalar.sh antes de cambiar de modo.` Se comprueba antes de cualquier escritura, también con `--simular`.
- `MODELOS`: con `--copiar`, `instalar.sh` usa `${FLUCASTR_MODELOS:-$ESTADO_DIR/modelos.json}`; si ese archivo no existe lo crea copiando `$RAIZ/modelos.json`; nunca lo sobrescribe. Exporta `FLUCASTR_MODELOS` antes de validar. Sin `--copiar` no se lee ni se exporta nada nuevo.
- El lanzador de Pi, solo con `--copiar`, lleva una línea `export FLUCASTR_MODELOS="<ruta>"` antes de `exec`.
- `resolver.mjs`: `process.env.FLUCASTR_MODELOS` si existe y no está vacía; si no, `join(raiz, "modelos.json")`. El mensaje de error de lectura no cambia.
- `desinstalar.sh`: tipo `directorio` se borra solo si es carpeta (no enlace) y contiene `.flucastr-ai`; si no, `omitido (no tiene la marca)`. Si el modo es `descarga` y no se pasa `--conservar-ajustes`, borra también `$ESTADO_DIR/version`, `$ESTADO_DIR/kit.anterior` y `$ESTADO_DIR/kit`. **Conserva siempre `modelos.json`**; solo la nueva opción `--todo` lo borra. El borrado de `kit` es lo último y va en un bloque `{ …; exit 0; }` para que bash no lea el script borrado.
- Las pruebas arman la instalación copiando archivos a `$HOME/.flucastr-ai/kit/` de un HOME temporal y ejecutan desde ahí, como hará task-02.

## Alcance / Fuera de alcance
Alcance: lo descrito en Descripción y Decisiones.
Fuera de alcance: descargar nada, `instalar-remoto.sh`, el archivo `version`, `--actualizar`, `README.md`, cambiar el modo con clon, crear atajos en `~/.local/bin` aparte del lanzador existente.

## Pasos
1. `scripts/resolver.mjs`: leer `FLUCASTR_MODELOS` en `leerConfig()`; documentarlo en la cabecera. Resultado: `FLUCASTR_MODELOS=/ruta/a.json node scripts/resolver.mjs modelo arquitecto claude-code` usa ese archivo.
2. `instalar.sh`: opción `--copiar`, variable `MODO`, comprobación de modo contra el manifiesto, `MODELOS` (creación si falta) y `export`. Resultado: con instalación `repo` previa, `--copiar` sale con 1 y el mensaje.
3. `instalar.sh`: `registrar modo <modo>` al inicio del manifiesto; función `copiar_skills` (`cp -R` + marca + `registrar directorio`) usada en lugar de `enlazar_skills` cuando `MODO=descarga`; destino existente sin marca = `OMITIDO (ya existe y no es una copia de Flucastr.AI)`. Resultado: `~/.claude/skills/<n>/` es carpeta real con `.flucastr-ai`.
4. `instalar.sh`: línea `export FLUCASTR_MODELOS` en el lanzador de Pi solo con `--copiar`. Resultado: `grep FLUCASTR_MODELOS ~/.local/bin/pi-arquitecto` la muestra.
5. `desinstalar.sh`: tipo `directorio`, opción `--todo`, borrado de `version`, `kit.anterior` y `kit` en modo `descarga`. Resultado: tras desinstalar queda solo `~/.flucastr-ai/modelos.json`.
6. Crear `pruebas/capa1/copia.test.mjs` (`node:test`, HOME temporal, árbol mínimo derivado del real: `instalar.sh`, `desinstalar.sh`, `scripts/resolver.mjs`, `agentes/arquitecto.md` y una skill `skills/prueba/SKILL.md` creadas por la prueba, y un `modelos.json` reducido a partir del real dejando solo el agente `arquitecto`). Casos, cada uno con su control negativo: (a) `--copiar` deja carpetas reales con marca, sin enlaces simbólicos, y `modo<TAB>descarga`; sin `--copiar` hay enlace y `modo<TAB>repo`; (b) un `modelos.json` personal cambiado a otro nivel determina el modelo del agente generado y queda byte a byte igual tras reinstalar; (c) `modelos.json` personal roto con una instalación previa: sale distinto de 0 y el árbol del HOME no cambia; (d) carpeta existente sin marca = `OMITIDO` y `desinstalar.sh` no la borra; (e) mezclar modos se rechaza en ambos sentidos; (f) `desinstalar.sh` quita copias, agente y `kit/`, conserva `modelos.json`, y con `--todo` lo borra. Máximo 6 pruebas, ≤ 12 ejecuciones de `instalar.sh` en total.
7. `pruebas/rapida.sh`: añadir `pruebas/capa1/copia.test.mjs` a la lista del `for`. Resultado: `rapida.sh` la ejecuta.
8. Correr la *Verificación* y pegar la salida en *Evidencia*, incluida la duración de `rapida.sh`.

## Criterios de aceptación
1. Con `--copiar`, las skills de cada herramienta son carpetas reales con `.flucastr-ai` y no hay enlaces simbólicos. Se comprueba con `node --test pruebas/capa1/copia.test.mjs`.
2. El `modelos.json` personal manda y nunca se sobrescribe ni se borra salvo `--todo`. Misma prueba.
3. Mezclar modos y `modelos.json` roto fallan sin cambiar nada. Misma prueba.
4. Las pruebas de enlaces existentes siguen pasando: `node --test pruebas/capa1/instalacion.test.mjs` con `fail 0`.
5. `bash pruebas/rapida.sh` pasa dentro de 30 s.

## Verificación
```
node --test pruebas/capa1/copia.test.mjs
node --test pruebas/capa1/instalacion.test.mjs
bash -n instalar.sh && bash -n desinstalar.sh && echo sintaxis-ok
bash pruebas/rapida.sh
```
Esperado: `fail 0` en las dos primeras; `sintaxis-ok`; la última termina con `rapida: N archivos en S s (tope 30 s)` y código 0.

## Evidencia

Rama (paso 2 de «Antes de empezar»; la rama actual al empezar era `main`, la F09 no existía):
```
$ git switch -c feature/F09-instalador-sin-clon
Switched to a new branch 'feature/F09-instalador-sin-clon'
$ git branch --show-current
feature/F09-instalador-sin-clon
```

Verificación 1, `node --test pruebas/capa1/copia.test.mjs` (salida completa):
```
Entorno conservado: /Users/franco/Codes/flucastr/Flucastr.AI/pruebas/.temporales/copia-KUQywP
✔ a: --copiar deja copias reales con marca; sin --copiar hay enlaces; mezclar modos se rechaza sin cambiar nada (561.342875ms)
✔ b: el modelos.json personal determina el modelo y no cambia al reinstalar (613.856042ms)
✔ c: modelos.json personal roto con instalación previa falla sin cambiar el HOME (300.019375ms)
✔ d: carpeta de skill sin marca se omite y desinstalar.sh no la borra (284.535459ms)
✔ f: desinstalar quita copias, agente y kit/ y conserva modelos.json; con --todo lo borra (572.935667ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2392.842417
```

Verificación 2, `node --test pruebas/capa1/instalacion.test.mjs` (últimas líneas de la salida):
```
✔ I4: control negativo rechaza salida falsa (0.31575ms)
✔ I5: control negativo rechaza salida falsa (0.191458ms)
✔ I6: control negativo rechaza salida falsa (0.149291ms)
✔ I7: control negativo rechaza salida falsa (0.187959ms)
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 8355.046375
```

Verificación 3, `bash -n instalar.sh && bash -n desinstalar.sh && echo sintaxis-ok`:
```
sintaxis-ok
```

Verificación 4, `bash pruebas/rapida.sh` (código de salida 0; últimas 25 líneas de la salida real, completa en `pruebas/.temporales/rapida-salida.txt`):
```
✔ B: ejecutar.sh genera fixture e instantánea y resume correctamente (344.209625ms)
✔ M: ejecutar.sh genera fixture e instantánea y resume correctamente (633.991209ms)
✔ R: ejecutar.sh genera fixture e instantánea y resume correctamente (467.469833ms)
✔ devuelve código distinto de cero ante fallo del comando y resume el fallo (334.862292ms)
✔ lanzar-claude.sh: sintaxis Bash válida (3.195833ms)
✔ lanzar-claude.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (1540.551458ms)
✔ lanzar-pi.sh: sintaxis Bash válida (6.256417ms)
✔ lanzar-pi.sh: modelo simulado recibe argumentos y registro va a FLUCASTR_RECORD_FILE (45.373042ms)
✔ Claude Code y Pi reciben exactamente la misma definición compartida del prompt (0.2395ms)
✔ lanzar-constructor-claude.sh: sintaxis Bash válida (3.498125ms)
✔ lanzar-constructor-claude.sh: sin argumento sale con código 2 y mensaje de uso (2.719ms)
✔ lanzar-constructor-claude.sh: el modelo simulado recibe argumentos y el prompt como línea única (177.114709ms)
✔ lanzar-constructor-claude.sh: ningún permiso concede Git mutante ni Bash genérico (13.614ms)
✔ lanzar-constructor-claude.sh: .env sigue denegado y no hay Bash genérico ni Git mutante (9.411584ms)
✔ lanzar-constructor-claude.sh: permite solo los tres comandos git de rama y deniega los mutantes (9.799041ms)
✔ lanzar-constructor-claude.sh: el control negativo rechaza una lista autorizada con git commit (9.315208ms)
ℹ tests 186
ℹ suites 0
ℹ pass 186
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 25275.71
rapida: 19 archivos en 25 s (tope 30 s)
```

Criterios de aceptación:
1. Copias reales con marca, sin enlaces: prueba `a` (`enlaces(copia.home)` vacío; carpetas con `.flucastr-ai`). Control: sin `--copiar` la skill es enlace. Pasa.
2. `modelos.json` personal manda y no se sobrescribe ni se borra salvo `--todo`: pruebas `b` (modelo `claude-opus-5-5` del personal, bytes iguales tras reinstalar) y `f` (tras desinstalar queda solo `modelos.json`, byte a byte; con `--todo` desaparece). Pasa.
3. Mezclar modos y `modelos.json` roto fallan sin cambiar nada: pruebas `a` (ambos sentidos, con y sin `--simular`, `snapshot` igual) y `c` (roto, HOME igual). Pasa.
4. `instalacion.test.mjs` con `fail 0`: 14 pass, 0 fail. Pasa.
5. `rapida.sh` dentro de 30 s: 25 s, código 0. Pasa.

Ejecuciones de `instalar.sh` en la prueba nueva: 12 en total (a=5, b=2, c=2, d=1, f=2), dentro del máximo de 12. Todo con HOME temporal bajo `pruebas/.temporales/`; no se ejecutó el instalador contra el HOME real.

## Notas

Rama: se creó `feature/F09-instalador-sin-clon` desde `main`, que era la rama actual. No era `feature/F08-limpieza-y-archivo`.

El árbol traía al empezar cambios sin commit en `definitions/` (ARCHITECTURE, BACKLOG, PROJECT, REPOS, STATUS) y la carpeta `features/F09-instalador-sin-clon/` sin rastrear. Esos cambios viajaron a la nueva rama; no los escribí yo. No se tocó `definitions/STATUS.md`.

Huecos menores y decisión tomada:
1. Sin `--copiar`, `instalar.sh` hace `unset FLUCASTR_MODELOS`. La tarea solo decía «no se lee ni se exporta nada nuevo»; el `unset` evita que una variable del shell cambie el modelo en modo repo.
2. `desinstalar.sh --todo` sin manifiesto: el script sale antes con «Nada que desinstalar». Con `--todo` ahora borra `modelos.json` y la carpeta si queda vacía. Así `--todo` siempre hace lo que dice. Sin `--todo` no toca nada.
3. `instalar.sh --copiar --simular` sin `modelos.json` personal: no crea el archivo; valida contra el del repo.
4. `copiar_skills`: un destino con marca `.flucastr-ai` se reemplaza; sin marca se omite con `OMITIDO (ya existe y no es una copia de Flucastr.AI)`.
5. Un manifiesto antiguo, sin línea `modo`, se trata como `repo`, así que las instalaciones previas siguen funcionando.
6. La tarea no cubría el borrado de `version` y `kit.anterior`: lo implementé como pide *Decisiones*, pero ningún paso de esta tarea crea esos archivos, así que no hay prueba que lo cubra.
7. Los casos `a` y `e` del plan se juntaron en un solo `test` (`a`), con sus controles. Son 5 `test()` con 12 ejecuciones de `instalar.sh`.

Archivos tocados: `scripts/resolver.mjs`, `instalar.sh`, `desinstalar.sh`, `pruebas/capa1/copia.test.mjs` (nuevo), `pruebas/rapida.sh`. Esta tarea no hace commit, push, PR, merge ni despliegue.
