# task-02 — desinstalar.sh: quitar copias y exclusiones de skills en un proyecto
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

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

## Notas
