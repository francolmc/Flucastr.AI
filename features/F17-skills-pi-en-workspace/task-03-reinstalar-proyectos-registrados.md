# task-03 — instalar.sh: rehacer las skills de los proyectos registrados al reinstalar
repo: Flucastr.AI   depende_de: task-01, task-02   estado: aprobada

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

## Notas
