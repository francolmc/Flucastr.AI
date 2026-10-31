# task-01 — instalar.sh: flag --skills-proyecto (copia, exclusión y manifiesto)
repo: Flucastr.AI   depende_de: —   estado: aprobada

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

## Notas
