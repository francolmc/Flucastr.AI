# task-01 — instalar.sh: flag --skills-proyecto (copia, exclusión y manifiesto)
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Pi no lee `~/.pi/agent/skills/` desde el workspace del cliente. `instalar.sh` debe aceptar `--skills-proyecto` junto con `--proyecto <ruta>` y copiar cada skill del kit a `<proyecto>/.pi/skills/<skill>/` (carpeta real con marca `.flucastr-ai`), excluirlas del git del cliente de forma local y registrarlo todo en el manifiesto. Esta tarea no cubre la reinstalación de proyectos ya registrados (task-03) ni `desinstalar.sh` (task-02).

## Contexto
- A tocar (único archivo): `instalar.sh` (raíz del repo, 331 líneas; **no** está en `scripts/`, así que la puerta 4 no exige `git diff scripts/` por esta tarea).
- Lo que ya existe en `instalar.sh` (leído): el parseo de flags (`while … case`, ~l.23-47) con `--proyecto` que guarda `PROYECTO` absoluto; `copiar_skills <carpeta>` (~l.148), que copia cada `skills/*/` con `SKILL.md`, escribe `.flucastr-ai`, hace `registrar directorio <destino>`, reemplaza copias previas con marca y emite `OMITIDO (…)` si el destino existe sin marca; `registrar tipo ruta [extra]` (escribe `tipo<TAB>ruta<TAB>extra` en `$NUEVO`, nada si `SIMULAR=1`); `fijar_agente_proyecto`.
- Skills a copiar (leído en `skills/`): `crear-backlog`, `definir-proyecto`, `descomponer-feature`, `disenar-arquitectura`, `ejecutar-tarea`, `generar-clonar`, `revisar-proyecto-existente`; cada una es una carpeta autocontenida con `SKILL.md`.
- Git: `git -C <proyecto> rev-parse --path-format=absolute --git-path info/exclude` devuelve la ruta absoluta del archivo de exclusión (probado con git 2.54.0 en un repo temporal). En una carpeta sin git el comando falla.
- Diseño aprobado: `definitions/ARCHITECTURE.md`, sección «Skills dentro del workspace para Pi».
- Pruebas existentes que no deben romperse (se corren con `bash pruebas/rapida.sh`): `pruebas/capa1/instalacion.test.mjs`, `pruebas/capa1/copia.test.mjs`. La prueba nueva del flag es task-04.
- `instalar-remoto.sh` no se toca: invoca `instalar.sh --copiar` y hereda el comportamiento.

## Decisiones ya tomadas
- Flag nuevo `--skills-proyecto` (sin valor). Se valida después del parseo: sin `--proyecto` termina con código 1 y el mensaje exacto `--skills-proyecto necesita --proyecto <ruta>` en stderr; con `--solo claude` termina con 1 y `--skills-proyecto no se combina con --solo claude` en stderr. Con `--solo pi` es válido.
- Las copias se hacen **siempre con `copiar_skills`**, en modo repo y en modo descarga, apuntando a `$PROYECTO/.pi/skills`. Nunca enlaces. Se hacen aunque Pi o Claude Code no estén instalados en la máquina (no dependen de `INSTALAR_PI`).
- La copia va al final, después de los bloques de Claude Code y Pi y antes del texto «Listo». Encabezado de salida: `Skills de Pi en el proyecto ($PROYECTO)`.
- Función nueva `excluir_en_git <skill>`: obtiene el archivo con el comando de arriba; si falla (no es repo git), imprime una sola vez `  AVISO: el proyecto no es un repo git; no hay nada que excluir.` y no hace nada más. Si no, agrega la línea exacta `/.pi/skills/<skill>/` (una por skill copiada, no `/.pi/`) al final del archivo (crea el archivo y su carpeta si faltan) **solo si esa línea no estaba ya** (`grep -qxF`), y entonces `registrar exclusion <archivo> /.pi/skills/<skill>/`. Si ya estaba (la puso el cliente), no se agrega ni se registra, para que `desinstalar.sh` no borre una línea ajena. Desviación del diseño: no se escribe el comentario `# flucastr-ai` en el archivo (git no admite comentarios al final de línea); la propiedad de la línea la da el manifiesto.
- Solo se excluye una skill si su destino quedó con la marca `.flucastr-ai` (si `copiar_skills` la omitió por carpeta ajena, no se excluye).
- Registro de la instalación por proyecto: `registrar skills-proyecto "$PROYECTO"`, una sola vez por proyecto (si `$NUEVO` ya tiene esa línea, no se repite).
- `--simular`: imprime `  copiaría: <destino>` y `  excluiría: /.pi/skills/<skill>/` por skill sin escribir nada (la validación de proyecto existente ya la hace el parseo de `--proyecto`).
- La confianza de proyecto de Pi no se toca: no se escribe `trust.json`.
- Al final de la instalación (con el flag) se imprime: `  Las copias en .pi/skills/ no se editan: se rehacen al reinstalar. Pi pedirá confiar en el proyecto (/trust).`

## Alcance / Fuera de alcance
Alcance: parseo y validación del flag, copia, exclusión local, registro en manifiesto, `--simular`, texto de `-h` (la línea 3 de uso del encabezado incluye `[--skills-proyecto]`).
Fuera de alcance: `desinstalar.sh` (task-02), reinstalar proyectos registrados (task-03), pruebas nuevas (task-04), README (task-05), `instalar-remoto.sh`, `scripts/`, `.gitignore` del cliente, `trust.json`.

## Pasos
1. En `instalar.sh`, agregar `SKILLS_PROYECTO=0` y el caso `--skills-proyecto) SKILLS_PROYECTO=1 ;;`; actualizar la línea 3 de uso. Resultado: `bash instalar.sh -h` muestra el flag.
2. Tras el parseo, agregar las dos validaciones (sin `--proyecto`; con `--solo claude`). Resultado: ambos casos salen con 1 y el mensaje exacto, sin escribir nada.
3. Agregar `excluir_en_git` y la función `instalar_skills_proyecto <ruta>` (copia con `copiar_skills "$1/.pi/skills"`, excluye cada skill con marca, registra `skills-proyecto`, respeta `--simular`). Resultado: funciones definidas.
4. Invocarla al final del flujo cuando `SKILLS_PROYECTO=1`, con el encabezado y el aviso finales. Resultado: salida esperada en la verificación.
5. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. En un proyecto temporal con `git init`, `bash instalar.sh --proyecto <p> --skills-proyecto` deja 7 carpetas reales en `<p>/.pi/skills/` cada una con `.flucastr-ai` y sin enlaces simbólicos; se comprueba con `find <p>/.pi/skills -type l` (sin salida) y `ls -A <p>/.pi/skills/crear-backlog`.
2. `git -C <p> status --porcelain` no muestra `.pi`, y `.git/info/exclude` contiene 7 líneas `/.pi/skills/<skill>/`.
3. El manifiesto contiene una línea `skills-proyecto<TAB><p>`, 7 `directorio` bajo `<p>/.pi/skills/` y 7 `exclusion`.
4. `--simular` no crea `<p>/.pi` ni cambia el manifiesto, y lista lo que copiaría; una carpeta `<p>/.pi/skills/<skill>` ajena (sin marca) queda intacta y se avisa `OMITIDO`.
5. Sin el flag no aparece `.pi/` en el proyecto; el flag sin `--proyecto` sale con 1.

## Verificación
Todo con `HOME` falso y un proyecto temporal; no se usa el HOME real.
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
T=$(mktemp -d); mkdir -p $T/home/.claude $T/p; git -C $T/p init -q
HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi bash instalar.sh --simular --proyecto $T/p --skills-proyecto; ls -A $T/p
HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi bash instalar.sh --proyecto $T/p --skills-proyecto
ls -A $T/p/.pi/skills/crear-backlog; find $T/p/.pi/skills -type l; git -C $T/p status --porcelain; cat $T/p/.git/info/exclude | grep -c '^/.pi/skills/'; cut -f1 $T/home/.flucastr-ai/manifiesto.txt | sort | uniq -c
HOME=$T/home bash instalar.sh --skills-proyecto; echo "exit=$?"
bash pruebas/rapida.sh
```
Esperado: simulación sin `.pi` (`ls -A` solo muestra `.git`); copiado con `.flucastr-ai` y `SKILL.md`; `find` y `git status` sin salida; `7`; el manifiesto con `skills-proyecto 1`, `directorio 7`, `exclusion 7`; `exit=1`; `rapida.sh` termina con `fail 0` y tope respetado.

## Evidencia

Rama: `git switch -c feature/F17-skills-pi-en-workspace` desde `main` (la rama no existía; sin confirmación previa no hizo falta más). `git branch --show-current` → `feature/F17-skills-pi-en-workspace`.

Única modificación de código: `instalar.sh` (`git diff --stat -- instalar.sh`: 74 inserciones, 1 borrado). `bash -n instalar.sh` → sin salida (sintaxis OK).

Entorno: `HOME` falso `$T/home` con `mkdir -p $T/home/.claude`, `PI_CODING_AGENT_DIR=$T/home/pi`, proyecto `$T/p` con `git init`. Ruta temporal: `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.4lJR7IXP8Y`. Las líneas de Claude Code y Pi (enlaces, agentes, lanzadores) se omiten en lo que sigue, marcadas con `[…]`; no cambian respecto del flujo previo.

**Verificación 1: simulación** (`HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi bash instalar.sh --simular --proyecto $T/p --skills-proyecto`), exit 0:
```
[…]
Skills de Pi en el proyecto (/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.4lJR7IXP8Y/p)
  copiaría: …/p/.pi/skills/crear-backlog
  excluiría: /.pi/skills/crear-backlog/
  copiaría: …/p/.pi/skills/definir-proyecto
  excluiría: /.pi/skills/definir-proyecto/
  copiaría: …/p/.pi/skills/descomponer-feature
  excluiría: /.pi/skills/descomponer-feature/
  copiaría: …/p/.pi/skills/disenar-arquitectura
  excluiría: /.pi/skills/disenar-arquitectura/
  copiaría: …/p/.pi/skills/ejecutar-tarea
  excluiría: /.pi/skills/ejecutar-tarea/
  copiaría: …/p/.pi/skills/generar-clonar
  excluiría: /.pi/skills/generar-clonar/
  copiaría: …/p/.pi/skills/revisar-proyecto-existente
  excluiría: /.pi/skills/revisar-proyecto-existente/
  Las copias en .pi/skills/ no se editan: se rehacen al reinstalar. Pi pedirá confiar en el proyecto (/trust).

Listo. Reinicia Claude Code y Pi.
[…]
```
`ls -A $T/p` → `.git` (nada más: la simulación no escribe en el proyecto).

**Verificación 2: instalación real** (`… bash instalar.sh --proyecto $T/p --skills-proyecto`), exit 0. Bloque final:
```
Skills de Pi en el proyecto (…/tmp.4lJR7IXP8Y/p)
  copiado: …/p/.pi/skills/crear-backlog
  copiado: …/p/.pi/skills/definir-proyecto
  copiado: …/p/.pi/skills/descomponer-feature
  copiado: …/p/.pi/skills/disenar-arquitectura
  copiado: …/p/.pi/skills/ejecutar-tarea
  copiado: …/p/.pi/skills/generar-clonar
  copiado: …/p/.pi/skills/revisar-proyecto-existente
  excluido en git: /.pi/skills/crear-backlog/
  excluido en git: /.pi/skills/definir-proyecto/
  excluido en git: /.pi/skills/descomponer-feature/
  excluido en git: /.pi/skills/disenar-arquitectura/
  excluido en git: /.pi/skills/ejecutar-tarea/
  excluido en git: /.pi/skills/generar-clonar/
  excluido en git: /.pi/skills/revisar-proyecto-existente/
  Las copias en .pi/skills/ no se editan: se rehacen al reinstalar. Pi pedirá confiar en el proyecto (/trust).

Listo. Reinicia Claude Code y Pi.
```

**Criterio 1** (`ls -A $T/p/.pi/skills/crear-backlog`, `find $T/p/.pi/skills -type l`):
```
.flucastr-ai
SKILL.md
(find sin salida: ningún enlace simbólico)
```
`ls -A $T/p/.pi/skills` → `crear-backlog definir-proyecto descomponer-feature disenar-arquitectura ejecutar-tarea generar-clonar revisar-proyecto-existente` (7 carpetas reales).

**Criterio 2** (`git -C $T/p status --porcelain`; `grep -c '^/.pi/skills/' $T/p/.git/info/exclude`):
```
?? .claude/
7
/.pi/skills/crear-backlog/
/.pi/skills/definir-proyecto/
/.pi/skills/descomponer-feature/
/.pi/skills/disenar-arquitectura/
/.pi/skills/ejecutar-tarea/
/.pi/skills/generar-clonar/
/.pi/skills/revisar-proyecto-existente/
```
`.pi` no aparece en `status`. La línea `?? .claude/` la deja el `--proyecto` previo (`settings.local.json` del agente predeterminado), no este cambio.

**Criterio 3** (`cut -f1 …/manifiesto.txt | sort | uniq -c`; líneas `skills-proyecto` y `exclusion`):
```
   1 ajuste
  12 archivo
   7 directorio
  14 enlace
   7 exclusion
   1 modo
   1 skills-proyecto
[exclusion] [/private/var/folders/…/tmp.4lJR7IXP8Y/p/.git/info/exclude] [/.pi/skills/crear-backlog/]
[exclusion] […] [/.pi/skills/definir-proyecto/]
[exclusion] […] [/.pi/skills/descomponer-feature/]
```
`grep -c "^directorio<TAB>$T/p/.pi/skills/"` → `7`. La línea `skills-proyecto` es `skills-proyecto<TAB>…/p`.

**Criterio 5, flag sin `--proyecto`** (`HOME=$T/home bash instalar.sh --skills-proyecto; echo exit=$?`):
```
--skills-proyecto necesita --proyecto <ruta>
exit=1
```
**Flag con `--solo claude`** (`… --proyecto $T/p --solo claude --skills-proyecto`):
```
--skills-proyecto no se combina con --solo claude
exit=1
```
**Control negativo, sin el flag** (proyecto `$T/n` con `git init`, `HOME` falso distinto): `ls -A $T/n` → `.claude  .git`. No aparece `.pi/`.

**Criterio 4, carpeta ajena** (`$T/q/.pi/skills/crear-backlog/MIO.txt` con `ajeno`, proyecto con `git init`):
- Simulación: `  OMITIDO (ya existe y no es una copia de Flucastr.AI): …/q/.pi/skills/crear-backlog`; las demás `copiaría`/`excluiría`; sin manifiesto (`ls …/.flucastr-ai` → no existe).
- Real: `  OMITIDO (ya existe y no es una copia de Flucastr.AI): …/q/.pi/skills/crear-backlog`; `ls -A …/crear-backlog` → `MIO.txt`; `cat MIO.txt` → `ajeno` (intacta); `.git/info/exclude` tiene 6 líneas `/.pi/skills/…/` (la de crear-backlog no se excluye).

**Caso sin git** (`$T/s`, sin `git init`), simulación y real: `  AVISO: el proyecto no es un repo git; no hay nada que excluir.` aparece una sola vez; las 7 carpetas se copian; exit 0.

**Caso `--solo pi --skills-proyecto`** (`$T/sp` con git): exit 0, 7 carpetas en `.pi/skills/`, 7 líneas en `.git/info/exclude`.

**Caso línea de exclusión ya presente** (el cliente ya tenía `/.pi/skills/ejecutar-tarea/` en `.git/info/exclude`): salida `  ya estaba excluido en git (no se toca): /.pi/skills/ejecutar-tarea/`; la línea sigue una sola vez; `grep 'exclusion.*ejecutar-tarea'` en el manifiesto → `0`.

**Hueco abierto: reinstalar sin el flag tras instalar con él** (`$T/p`, con 7 copias y 7 exclusiones; luego `bash instalar.sh` sin opciones, `HOME` falso):
```
tras instalar:        7 copias; exclude=7
tras reinstalar sin flag: copias=       0 exclude=7
manifiesto skills-proyecto: 0
```
La reinstalación anterior (la de `instalar.sh`, con «Quitando la instalación anterior…») desinstala lo registrado: el `directorio` se borra (las copias de `p`), pero el `exclusion` no lo entiende el `desinstalar.sh` actual y deja las 7 líneas en `.git/info/exclude`; el registro `skills-proyecto` se pierde al rehacer el manifiesto. Esta tarea no lo cubre: es de task-02 (desinstalar) y task-03 (reinstalar proyectos registrados). Ver *Notas*.

**Verificación 3: `--simular` sin escribir** y **`-h`** (`HOME=$T/home bash instalar.sh -h`):
```
# Instala Flucastr.AI en Claude Code y Pi.
# Uso: bash instalar.sh [--simular] [--copiar] [--solo claude|pi] [--proyecto <ruta> [--agente <nombre>]] [--skills-proyecto]
```

**Verificación 4: `bash pruebas/rapida.sh`** con `HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi`:
- Antes del cambio (línea base): `ℹ tests 220`, `ℹ pass 213`, `ℹ fail 7`.
- Después del cambio: `ℹ tests 220`, `ℹ pass 213`, `ℹ fail 7`, exit 1.
- Los 7 fallos son los mismos antes y después (`diff` de nombres: sin diferencias): `ejecutar.sh analiza el registro claude-code antes de comprobar el escenario`, `ejecutar.sh analiza el registro pi …`, `fallo del comando imprime resumen…`, `fallo duro del registro…`, `fallo duro del escenario…`, `cada corrida con modelo exige su propio registro estructurado`, `devuelve código distinto de cero ante fallo del comando y resume el fallo`. Son de `pruebas/ejecutar.sh`, no de `instalar.sh`, y ya fallaban antes del cambio.
- Las pruebas de instalación (`pruebas/capa1/instalacion.test.mjs`, `copia.test.mjs`) pasan.
- El tope `rapida: … s` no se imprime porque `node --test` sale con error antes; la línea de tope no llegó a ejecutarse (igual antes del cambio).

**Estado de los criterios**: 1 cumplido; 2 cumplido; 3 cumplido; 4 cumplido (simulación y real); 5 cumplido. La verificación completa **no** pasa tal cual (`rapida.sh` sale con 1 por los 7 fallos previos en `ejecutar.sh`).

## Notas

- **Huecos menores, decisiones tomadas:**
  1. La simulación (`--simular`) no llama a `copiar_skills` (esa función imprime `copiado:` aunque no escriba). Recorre las skills en `instalar_skills_proyecto` y emite `copiaría:` / `excluiría:` / `OMITIDO`, sin escribir.
  2. El aviso «no es un repo git» se imprime una sola vez por corrida (variable `SIN_GIT_AVISADO`).
  3. Si la línea de exclusión ya existe, no se toca ni se registra, y se avisa con un mensaje propio (`ya estaba excluido en git (no se toca)`), que el diseño no fijaba.
  4. `skills-proyecto` se registra solo si no está ya en `$NUEVO`.
  5. Se consulta `.git/info/exclude` con `git -C <proyecto> rev-parse --path-format=absolute --git-path info/exclude`. Si el proyecto está dentro de otro repo git, se usa el exclude de ese repo. No lo probé; lo anoto como comportamiento de git, no como caso cubierto.
- **Hallazgo, fuera de esta tarea (task-02/task-03):** una reinstalación sin `--skills-proyecto` tras haberlo usado deja el proyecto sin copias (`copias=0`) y con 7 líneas huérfanas en `.git/info/exclude`, sin registro. Hasta que task-02 y task-03 estén hechas, no conviene usar el flag en un proyecto del cliente y después correr `bash instalar.sh` sin opciones, o hay que limpiar a mano esas líneas.
- **Rama:** al terminar, la rama `feature/F17-skills-pi-en-workspace` tiene un commit `1fd4f0a «feat(F17): Implement skills management for Pi in workspace»` (autor `francolmc`, 2026-10-31 00:58:43, posterior a crear la rama) que contiene los cambios sin commit de `definitions/` y `features/F17-skills-pi-en-workspace/` que existían al empezar. No lo hice yo. Este constructor no hizo commit ni push. `instalar.sh` queda sin commit.
- **Verificación con fallos previos:** `rapida.sh` sale con 1 por 7 pruebas de `pruebas/ejecutar.sh` que ya fallaban antes del cambio. Se deja como `verificacion=falla` en el registro porque lo pide la plantilla; no lo traté como efecto de esta tarea ni lo arreglé (no está en *Alcance*).
- Pruebas con `HOME` falso y `mktemp -d` en cada bloque. No se leyó ni se tocó `~/.pi` ni `~/.claude` reales. Los directorios de prueba quedan en `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/` (no en el repo).
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=falla; huecos=3; resultado=lista; causa=ninguna
