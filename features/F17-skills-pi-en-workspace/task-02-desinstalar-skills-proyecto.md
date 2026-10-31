# task-02 — desinstalar.sh: quitar copias y exclusiones de skills en un proyecto
repo: Flucastr.AI   depende_de: task-01   estado: lista para revisión

## Descripción
`desinstalar.sh` debe entender el tipo de manifiesto nuevo `exclusion` y, con `--proyecto <ruta>`, quitar además del agente fijado las copias `.pi/skills/` y las líneas de exclusión de ese proyecto. Sin opciones sigue quitando todo lo registrado.

## Contexto
- A tocar (único archivo): `desinstalar.sh` (raíz, 144 líneas; no está en `scripts/`).
- Leído: el bloque `--proyecto` (~l.58-80) hoy solo busca la línea `ajuste` de `$PROYECTO/.claude/settings.local.json`, y si no existe imprime «Este instalador no fijó ningún agente en …» y sale; el bucle general `while IFS=$'\t' read -r tipo ruta extra` con casos `enlace`, `archivo`, `directorio` (ya exige carpeta real, no enlace, con `.flucastr-ai`), `ajuste`; `--conservar-ajustes` (lo usa `instalar.sh` al reinstalar) hace `continue` en `ajuste`.
- Formato del manifiesto (task-01): `skills-proyecto<TAB><proyecto>`; `directorio<TAB><proyecto>/.pi/skills/<skill>`; `exclusion<TAB><archivo exclude absoluto><TAB>/.pi/skills/<skill>/`.
- Archivo de exclusión de un proyecto: `git -C <p> rev-parse --path-format=absolute --git-path info/exclude` (git 2.54.0).
- Pruebas del flujo existente: `bash pruebas/rapida.sh` (incluye `copia.test.mjs` caso f, desinstalar). La prueba nueva es task-04.

## Decisiones ya tomadas
- Caso `exclusion` en el bucle general: si el archivo existe, quita **solo** la línea exacta del tercer campo (`grep -vxF -- "$extra" "$ruta" > tmp && mv`; si el resultado queda igual no se escribe) y dice `  quitada exclusión: <línea> (<archivo>)`; si no existe el archivo o la línea, `  omitido (no está la exclusión): …`. En `--simular` solo informa. Con `--conservar-ajustes` **sí** se quitan (instalar.sh las rehace en la reinstalación).
- Caso `skills-proyecto` en el bucle: sin acción (la línea se va con el manifiesto). Con `--conservar-ajustes` tampoco hay acción aquí (task-03 las arrastra).
- `--proyecto <ruta>`: quita (1) el agente fijado, si hay línea `ajuste` (comportamiento actual), (2) cada `directorio` cuya ruta empiece por `<proyecto>/.pi/skills/` (con la misma regla de marca), (3) cada `exclusion` cuyo archivo coincida con el de `git -C <proyecto> rev-parse --path-format=absolute --git-path info/exclude` (si el proyecto ya no es repo, se omiten con aviso), y (4) la línea `skills-proyecto` de ese proyecto. Después borra del manifiesto exactamente las líneas tratadas (la de `ajuste` ya lo hace; agregar las otras con `grep -vF` por prefijo exacto con tabulador). Si el proyecto no tiene ninguna de las cuatro cosas, imprime `Este instalador no instaló nada en <proyecto>.` y sale con 0.
- Tras quitar las copias, `rmdir` de `<proyecto>/.pi/skills` y de `<proyecto>/.pi` solo si quedaron vacíos (`rmdir … 2>/dev/null || true`).
- Aviso en la salida cuando se quita una copia: `  (las copias no se editan: si cambiaste algo dentro, se pierde)` una sola vez.
- `--simular` con `--proyecto` imprime lo que quitaría y sale sin tocar nada.

## Alcance / Fuera de alcance
Alcance: casos `exclusion` y `skills-proyecto`, ampliación del bloque `--proyecto`, texto de uso (línea 3: «con --proyecto se quita lo instalado en ese proyecto: agente y skills»).
Fuera de alcance: `instalar.sh`, `instalar-remoto.sh`, borrar carpetas sin marca, tocar `.gitignore` del cliente, pruebas nuevas (task-04), README (task-05).

## Pasos
1. Agregar el caso `exclusion` y `skills-proyecto` al bucle general. Resultado: `bash desinstalar.sh` sin opciones quita copias y líneas.
2. Reescribir el bloque `--proyecto` para tratar las cuatro piezas y borrar del manifiesto las líneas tratadas. Resultado: tras `--proyecto`, el manifiesto conserva lo demás (agentes, skills globales, otros proyectos).
3. Ajustar el mensaje de «nada» y el texto de uso. Resultado: `bash desinstalar.sh -h` lo refleja.
4. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. Tras instalar con `--proyecto <p> --skills-proyecto`, `bash desinstalar.sh --proyecto <p>` deja `<p>/.pi` inexistente, `<p>/.git/info/exclude` sin líneas `/.pi/skills/`, y el manifiesto sin líneas de ese proyecto; `~/.claude/skills`, agentes y lanzadores siguen instalados.
2. Una línea previa del cliente en `exclude` (por ejemplo `*.log`) y una skill propia sin marca en `<p>/.pi/skills/propia/` sobreviven.
3. `bash desinstalar.sh` sin opciones quita todo lo registrado, incluidas copias y exclusiones de todos los proyectos.
4. `--simular` no cambia nada (snapshot igual).
5. Un proyecto sin nada registrado imprime `Este instalador no instaló nada en …` y sale con 0.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
T=$(mktemp -d); mkdir -p $T/home/.claude $T/p; git -C $T/p init -q; echo '*.log' >> $T/p/.git/info/exclude
HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi bash instalar.sh --proyecto $T/p --skills-proyecto
HOME=$T/home bash desinstalar.sh --simular --proyecto $T/p; ls $T/p/.pi/skills | wc -l
HOME=$T/home bash desinstalar.sh --proyecto $T/p; ls -A $T/p; cat $T/p/.git/info/exclude | grep -v '^#'; cut -f1 $T/home/.flucastr-ai/manifiesto.txt | sort | uniq -c
HOME=$T/home bash desinstalar.sh --proyecto $T/p
HOME=$T/home bash desinstalar.sh; ls $T/home/.flucastr-ai 2>&1
bash pruebas/rapida.sh
```
Esperado: `7` tras la simulación; después de quitar, `ls -A` solo `.git`, `exclude` con solo `*.log`, el manifiesto sin `skills-proyecto`/`exclusion` y con `modo`/`enlace`; la repetición imprime «no instaló nada»; la desinstalación total deja `.flucastr-ai` inexistente; `rapida.sh` con `fail 0`.

## Evidencia

Verificación de la tarea, ejecutada tal cual con `bash -n desinstalar.sh` (OK) y con el guion `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/verif-t02.sh`. Ese guion usa HOME falso y proyectos temporales dentro del scratchpad; nunca toca `~/.pi` ni `~/.claude` reales. Salida completa, sin recortes (las rutas largas son del scratchpad):

```
T=/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt
$ T=$(mktemp -d ...); mkdir -p $T/home/.claude $T/p; git -C $T/p init -q; echo '*.log' >> $T/p/.git/info/exclude
$ HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi bash instalar.sh --proyecto $T/p --skills-proyecto
exit instalar=0
$ ls $T/p/.pi/skills | wc -l
       7
$ HOME=$T/home bash desinstalar.sh --simular --proyecto $T/p
SIMULACIÓN: quitaría el agente 'arquitecto' de: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.claude/settings.local.json
  quitaría: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/crear-backlog
  quitaría: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/definir-proyecto
  quitaría: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/descomponer-feature
  quitaría: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/disenar-arquitectura
  quitaría: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/ejecutar-tarea
  quitaría: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/generar-clonar
  quitaría: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/revisar-proyecto-existente
  quitaría exclusión: /.pi/skills/crear-backlog/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/definir-proyecto/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/descomponer-feature/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/disenar-arquitectura/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/ejecutar-tarea/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/generar-clonar/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/revisar-proyecto-existente/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  (las copias no se editan: si cambiaste algo dentro, se pierde)
SIMULACIÓN: no se borra nada.
$ ls $T/p/.pi/skills | wc -l
       7
$ HOME=$T/home bash desinstalar.sh --proyecto $T/p; ls -A $T/p; cat $T/p/.git/info/exclude | grep -v '^#'; cut -f1 $T/home/.flucastr-ai/manifiesto.txt | sort | uniq -c
  ajuste de proyecto (archivo-quitado): /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.claude/settings.local.json
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/crear-backlog
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/definir-proyecto
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/descomponer-feature
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/disenar-arquitectura
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/ejecutar-tarea
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/generar-clonar
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.pi/skills/revisar-proyecto-existente
  quitada exclusión: /.pi/skills/crear-backlog/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/definir-proyecto/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/descomponer-feature/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/disenar-arquitectura/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/ejecutar-tarea/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/generar-clonar/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/revisar-proyecto-existente/ (/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p/.git/info/exclude)
  (las copias no se editan: si cambiaste algo dentro, se pierde)
$ ls -A $T/p
.git
$ cat $T/p/.git/info/exclude | grep -v '^#'
*.log
$ git -C $T/p status --porcelain
(sin salida = limpio)
$ cut -f1 $T/home/.flucastr-ai/manifiesto.txt | sort | uniq -c
  12 archivo
  14 enlace
   1 modo
$ HOME=$T/home bash desinstalar.sh --proyecto $T/p   (repetir)
Este instalador no instaló nada en /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/p.
$ HOME=$T/home bash desinstalar.sh; ls $T/home/.flucastr-ai
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/skills/crear-backlog
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/skills/definir-proyecto
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/skills/descomponer-feature
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/skills/disenar-arquitectura
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/skills/ejecutar-tarea
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/skills/generar-clonar
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/skills/revisar-proyecto-existente
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/agents/arquitecto.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/agents/constructor.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/agents/coordinador.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.claude/agents/planificador.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/skills/crear-backlog
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/skills/definir-proyecto
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/skills/descomponer-feature
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/skills/disenar-arquitectura
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/skills/ejecutar-tarea
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/skills/generar-clonar
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/skills/revisar-proyecto-existente
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/agents/arquitecto.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.local/bin/pi-arquitecto
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/agents/constructor.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.local/bin/pi-constructor
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/agents/coordinador.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.local/bin/pi-coordinador
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/pi/agents/planificador.md
  quitado: /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/f17-t02-ZiMt/home/.local/bin/pi-planificador
Listo. Reinicia Claude Code y Pi.
ls: T/home/.flucastr-ai: No such file or directory
$ bash desinstalar.sh -h
# Quita lo que instalar.sh creó (y solo eso), según ~/.flucastr-ai/manifiesto.txt.
# Uso: bash desinstalar.sh [--simular] [--todo] [--proyecto <ruta>]   (con --proyecto se quita lo instalado en ese proyecto: agente y skills)

== Criterio 2: skill propia sin marca y exclusión propia (*.log) sobreviven ==
$ HOME=$C/home bash desinstalar.sh --proyecto $C/p
  ajuste de proyecto (archivo-quitado): C/p/.claude/settings.local.json
  quitado: C/p/.pi/skills/crear-backlog
  quitado: C/p/.pi/skills/definir-proyecto
  quitado: C/p/.pi/skills/descomponer-feature
  quitado: C/p/.pi/skills/disenar-arquitectura
  quitado: C/p/.pi/skills/ejecutar-tarea
  quitado: C/p/.pi/skills/generar-clonar
  quitado: C/p/.pi/skills/revisar-proyecto-existente
  quitada exclusión: /.pi/skills/crear-backlog/ (C/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/definir-proyecto/ (C/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/descomponer-feature/ (C/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/disenar-arquitectura/ (C/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/ejecutar-tarea/ (C/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/generar-clonar/ (C/p/.git/info/exclude)
  quitada exclusión: /.pi/skills/revisar-proyecto-existente/ (C/p/.git/info/exclude)
  (las copias no se editan: si cambiaste algo dentro, se pierde)
$ ls $C/p/.pi/skills; cat $C/p/.pi/skills/propia/SKILL.md; grep -v '^#' $C/p/.git/info/exclude
propia
mia
*.log

== Criterio 4: --simular no cambia nada (hash de cada archivo, antes y despues) ==
$ diff antes despues  (sin salida = igual; antes/despues excluyen snap/ y los .out)
(sin diferencias: 46 archivos)
$ HOME=$Q/home bash desinstalar.sh --simular --proyecto $Q/p
SIMULACIÓN: quitaría el agente 'arquitecto' de: Q/p/.claude/settings.local.json
  quitaría: Q/p/.pi/skills/crear-backlog
  quitaría: Q/p/.pi/skills/definir-proyecto
  quitaría: Q/p/.pi/skills/descomponer-feature
  quitaría: Q/p/.pi/skills/disenar-arquitectura
  quitaría: Q/p/.pi/skills/ejecutar-tarea
  quitaría: Q/p/.pi/skills/generar-clonar
  quitaría: Q/p/.pi/skills/revisar-proyecto-existente
  quitaría exclusión: /.pi/skills/crear-backlog/ (Q/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/definir-proyecto/ (Q/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/descomponer-feature/ (Q/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/disenar-arquitectura/ (Q/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/ejecutar-tarea/ (Q/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/generar-clonar/ (Q/p/.git/info/exclude)
  quitaría exclusión: /.pi/skills/revisar-proyecto-existente/ (Q/p/.git/info/exclude)
  (las copias no se editan: si cambiaste algo dentro, se pierde)
SIMULACIÓN: no se borra nada.

== Criterio 1 extra: agentes, skills globales y lanzadores siguen tras --proyecto ==
$ ls $Q/home/.claude/skills | wc -l; ls $Q/home/.claude/agents | wc -l; ls $Q/home/.local/bin | wc -l
       7
       4
       4

== Suite rápida ==
$ bash pruebas/rapida.sh   (salida completa en /private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/rapida-despues.txt)
ℹ tests 220
ℹ pass 220
ℹ fail 0
rapida: 21 archivos en 12 s (tope 30 s)
exit=0
```

Criterios de aceptación contra la evidencia:
1. Tras `--proyecto` no quedan `.pi/`, ni líneas `/.pi/skills/` en `exclude`, ni líneas del proyecto en el manifiesto; `~/.claude/skills` (7), agentes (4) y lanzadores (4) siguen. Cumplido.
2. `*.log` en `exclude` y la skill propia `propia/SKILL.md` sobreviven. Cumplido.
3. Desinstalación total sin opciones: quita copias y exclusiones de todos los proyectos y borra `~/.flucastr-ai`. Cumplido (escenario de la verificación, con el proyecto registrado).
4. `--simular` no cambia nada: 46 archivos con hash igual antes y después. Cumplido.
5. Proyecto sin nada registrado: `Este instalador no instaló nada en …` y salida 0. Cumplido.

Suite rápida antes del cambio, en esta misma máquina (`bash pruebas/rapida.sh`, salida en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/rapida-antes.txt`):
```
ℹ tests 220
ℹ pass 220
ℹ fail 0
rapida: 21 archivos en 12 s (tope 30 s)
exit=0
```

## Notas
- Huecos menores (la tarea no los cubría; decisión conservadora, anotada):
  1. `rmdir` de `<proyecto>/.claude` cuando queda vacío tras quitar el agente fijado (en `--proyecto` y en la desinstalación total). Sin esto, `ls -A` del proyecto mostraba `.claude` y el criterio 1 pide solo `.git`. Solo borra si está vacía.
  2. `rmdir` de `<proyecto>/.pi/skills` y `<proyecto>/.pi` si quedaron vacíos, también en la desinstalación total (función `limpiar_pi_vacio`), no solo en `--proyecto`. Solo rutas bajo `*/.pi/skills/*`.
  3. Línea `directorio` registrada cuya copia ya no tiene la marca: se omite con mensaje y la línea se quita del manifiesto en `--proyecto` (no puede volver a ser nuestra). En la total, como hoy.
  4. Proyecto que ya no es repo git: las líneas `exclusion` de ese proyecto no se pueden comparar con `.git/info/exclude`; se avisa y la línea queda registrada.
  5. En `--simular` con `--proyecto` los mensajes dicen «quitaría»/«quitaría exclusión». El bucle general sigue diciendo «quitado» en simulación, como antes (fuera de alcance, no se tocó).
  6. `exclusion_de_git` está copiada de `instalar.sh` (el desinstalador no carga ese archivo).
  7. `--proyecto` con `skills-proyecto` ya no exige la línea `ajuste`: el aviso «no fijó ningún agente» se sustituye por «no instaló nada en …» (criterio 5).
- Pruebas: `bash pruebas/rapida.sh` pasa 220/220 antes y después del cambio, en esta máquina. No hubo fallos que anotar. Los 7 fallos de la tarea anterior no se reprodujeron aquí.
- Las ejecuciones de desarrollo previas a la verificación final (escenarios A, B, C, D y la comprobación literal) no cuentan en `intentos`; la final, con su salida completa, es la de *Evidencia*.
- Revisión sugerida para Franco: *Evidencia* (salida completa y criterios) y el diff de `desinstalar.sh` (`git diff -- desinstalar.sh`). Sin commit, sin push.

Señal: la tarea estaba incompleta. Faltaban reglas de limpieza de carpetas vacías (`.claude`, `.pi/skills`, `.pi`), el tratamiento de una copia sin marca registrada y el de un proyecto que dejó de ser repo git (huecos 1 a 4).

Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=7; resultado=lista; causa=ninguna
