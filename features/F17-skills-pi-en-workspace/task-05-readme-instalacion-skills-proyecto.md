# task-05 — README: sección Instalación para skills de Pi en el proyecto
repo: Flucastr.AI   depende_de: task-01, task-02, task-03   estado: aprobada

## Descripción
Documentar en la sección «Instalación» del `README.md` el flag `--skills-proyecto`: para qué sirve (Pi que no lee `~/.pi/agent/skills/` desde el workspace), cómo usarlo y deshacerlo, que las copias van fuera de git y se actualizan al reinstalar, y la condición de confianza de proyecto de Pi.

## Contexto
- A tocar (único archivo): `README.md`. La sección `## Instalación` empieza en la l.101; el bloque «Con el repo clonado» (l.~118-135) contiene los comandos de `--proyecto` y `desinstalar.sh --proyecto` y una lista de viñetas; la subsección «Sin clonar el repo (PC de trabajo)» sigue después con `instalar-remoto.sh --actualizar`.
- Comportamiento real a describir: el de task-01/02/03 (leer sus *Evidencia* antes de escribir; si algo difiere del texto de abajo, manda lo observado y se anota en *Notas*).
- Ahí mismo se contrasta el texto con `bash instalar.sh -h` y `bash desinstalar.sh -h`.

## Decisiones ya tomadas
- Se agregan, sin reescribir lo demás: (1) al bloque de comandos de «Con el repo clonado», las líneas `bash instalar.sh --proyecto /ruta/al/proyecto --skills-proyecto   # copia las skills a <proyecto>/.pi/skills/ (para Pi en el workspace)` y la de quitarlas con `bash desinstalar.sh --proyecto /ruta/al/proyecto`; (2) tres viñetas: qué copia y que **nunca** enlaza ni pisa carpetas sin marca; que las copias quedan fuera de git del proyecto (`.git/info/exclude`, no el `.gitignore`) y se rehacen al volver a correr `bash instalar.sh` o `instalar-remoto.sh --actualizar`, y no se editan; que Pi pide confiar en el proyecto (`/trust`) y el instalador no lo toca.
- En «Sin clonar», una sola frase: el flag también funciona ahí (`bash ~/.flucastr-ai/kit/instalar.sh --copiar --proyecto <ruta> --skills-proyecto`) y `--actualizar` rehace esas copias.
- No se modifica el diagrama mermaid ni otras secciones; el tono es el del README (primera persona, español).
- Se menciona que el efecto no está verificado en el PC de trabajo: la frase exacta `Pendiente de comprobar en el PC de trabajo: si Pi lee las skills desde .pi/skills/ ahí.` (supuesto declarado en `ARCHITECTURE.md`, «No verificado (a)»).

## Alcance / Fuera de alcance
Alcance: texto en la sección Instalación.
Fuera de alcance: otras secciones, diagrama, `definitions/`, `pruebas/README.md`, código.

## Pasos
1. Leer las evidencias de task-01 a task-03 y los `-h`. Resultado: comandos confirmados.
2. Editar el bloque de comandos y las viñetas de «Con el repo clonado». Resultado: texto presente.
3. Agregar la frase en «Sin clonar». Resultado: texto presente.
4. Ejecutar los comandos del README sobre un proyecto temporal con `HOME` falso (verificación). Resultado: coinciden con lo escrito.

## Criterios de aceptación
1. `grep -c -- "--skills-proyecto" README.md` ≥ 3 y aparece el comando de desinstalar con `--proyecto`.
2. El README menciona `.pi/skills/`, `.git/info/exclude`, `/trust` y la frase de «Pendiente de comprobar en el PC de trabajo» (`grep`).
3. `git diff --stat README.md` muestra solo inserciones en la sección Instalación (sin líneas borradas fuera de ella).
4. Los dos comandos con `--skills-proyecto` y `desinstalar.sh --proyecto` funcionan tal cual con `HOME` falso.
5. Pasa `bash pruebas/rapida.sh` (el README tiene pruebas de coherencia en `pruebas/comprobaciones/`).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c -- "--skills-proyecto" README.md; grep -n "\.pi/skills\|info/exclude\|/trust\|Pendiente de comprobar" README.md
git diff --stat README.md
T=$(mktemp -d); mkdir -p $T/home/.claude $T/p; git -C $T/p init -q
HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi bash instalar.sh --proyecto $T/p --skills-proyecto | tail -3
HOME=$T/home bash desinstalar.sh --proyecto $T/p; ls -A $T/p
bash pruebas/rapida.sh | tail -1
```
Esperado: conteo ≥ 3 y las cuatro menciones; el diff solo con `+`; la instalación y la desinstalación sin error, `ls -A` solo `.git`; `rapida.sh` con `fail 0`.

## Evidencia

## Notas
