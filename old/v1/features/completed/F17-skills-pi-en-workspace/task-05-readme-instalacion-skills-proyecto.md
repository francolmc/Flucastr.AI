# task-05 — README: sección Instalación para skills de Pi en el proyecto
repo: Flucastr.AI   depende_de: task-01, task-02, task-03   estado: hecha

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

Rama: `git branch --show-current` → `feature/F17-skills-pi-en-workspace` (ya estaba; no hubo switch). Único archivo editado: `README.md`. Sin commit ni push.

Comandos `-h` (ayuda real, contrastada con el texto):
```
$ bash instalar.sh -h
# Uso: bash instalar.sh [--simular] [--copiar] [--solo claude|pi] [--proyecto <ruta> [--agente <nombre>]] [--skills-proyecto]
$ bash desinstalar.sh -h
# Uso: bash desinstalar.sh [--simular] [--todo] [--proyecto <ruta>]   (con --proyecto se quita lo instalado en ese proyecto: agente y skills)
```

Texto añadido a «Instalación» (`git diff --stat README.md`: `README.md | 9 +++++++++`, 9 inserciones, 0 borrados):
- bloque «Con el repo clonado»: línea `bash instalar.sh --proyecto /ruta/al/proyecto --skills-proyecto   # copia las skills a <proyecto>/.pi/skills/ (para Pi en el workspace)`; la de quitar sigue siendo `bash desinstalar.sh --proyecto /ruta/al/proyecto`.
- cuatro viñetas nuevas (`--skills-proyecto`; exclusiones en `.git/info/exclude`, rehacer y `--solo claude`; `/trust`; `.claude/settings.local.json` sin ignorar).
- en «Sin clonar»: párrafo con `bash ~/.flucastr-ai/kit/instalar.sh --copiar --proyecto <ruta> --skills-proyecto`, `--actualizar` y la frase «Pendiente de comprobar en el PC de trabajo: si Pi lee las skills desde .pi/skills/ ahí.».

Criterio 1 y 2 (`grep`):
```
$ grep -c -- "--skills-proyecto" README.md
4
$ grep -n "\.pi/skills\|info/exclude\|/trust\|Pendiente de comprobar" README.md
128:bash instalar.sh --proyecto /ruta/al/proyecto --skills-proyecto   # copia las skills a <proyecto>/.pi/skills/ (para Pi en el workspace)
140:- `--skills-proyecto` (con `--proyecto`) copia las skills a `<proyecto>/.pi/skills/` como carpetas reales, sin enlaces, ...
141:- Las copias quedan fuera de git del proyecto: cada una se añade a `.git/info/exclude` (no al `.gitignore`). ...
142:- Pi pide confiar en el proyecto (`/trust`) la primera vez que lo abre. El instalador no cambia esa confianza.
143:- `--proyecto` deja `.claude/settings.local.json` sin ignorar en git: ...
178:Si Pi está en el workspace de ese PC, ... Pendiente de comprobar en el PC de trabajo: si Pi lee las skills desde .pi/skills/ ahí.
```

Criterio 3 (`git diff --stat` y líneas `-`): `README.md | 9 +++++++++`, 9 inserciones, 0 borrados (`git diff README.md | grep -c '^-[^-]'` → `0`).

Criterio 4, con `HOME` falso (`T=$(mktemp -d)` → `/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.2xqHWQZvSz`, luego `tmp.aYCnY2dUot` y `tmp.83cbcEFOm3` para las pruebas extra; ninguna en `~/.pi` ni `~/.claude` reales):
```
$ HOME=$T/home PI_CODING_AGENT_DIR=$T/home/pi bash instalar.sh --proyecto $T/p --skills-proyecto | tail -3
  Claude Code: claude --agent arquitecto   (o fijarlo en un proyecto: bash instalar.sh --proyecto <ruta>)
  Pi:          pi-arquitecto
Si cambias modelos.json, vuelve a correr: bash instalar.sh
exit=0
$ ls -A $T/p     (tras instalar)     → .claude  .git  .pi
$ ls -A $T/p/.pi/skills             → crear-backlog definir-proyecto descomponer-feature disenar-arquitectura ejecutar-tarea generar-clonar revisar-proyecto-existente
$ tail -10 $T/p/.git/info/exclude   → /.pi/skills/<las 7 skills>/ (tras las 7 líneas del archivo original)
$ HOME=$T/home bash desinstalar.sh --proyecto $T/p; echo "exit=$?"   → exit=0 (quita settings.local.json, 7 copias y 7 exclusiones)
$ ls -A $T/p                        → .git
$ HOME=... bash instalar.sh --proyecto $T/p (de nuevo); git -C $T/p status --porcelain → ?? .claude/
```
Comandos extra del README, también con HOME falso (kit simulado copiando el repo a `$T/home/.flucastr-ai/kit`, porque la instalación en modo repo no admite `--copiar` sobre el mismo HOME):
```
$ HOME=$H PI_CODING_AGENT_DIR=$H/pi bash $H/.flucastr-ai/kit/instalar.sh --copiar --proyecto $T/p2 --skills-proyecto → exit=0; 7 copias en $T/p2/.pi/skills
$ (borrar una copia) HOME=$H ... instalar.sh --copiar   (sin --proyecto) → exit=0; las 7 copias vuelven (lo que hace --actualizar)
$ HOME=$H bash $H/.flucastr-ai/kit/desinstalar.sh --proyecto $T/p2 → exit=0; ls -A $T/p2 → .git
```
Afirmaciones de Notas comprobadas en esas pruebas: `--solo claude` (sobre un proyecto registrado) → `ls: .../p/.pi: No such file or directory`, el registro `skills-proyecto` sigue en el manifiesto (`grep -c` → 1), y `instalar.sh --proyecto <ruta> --skills-proyecto` vuelve a crear las 7 copias (`ls | wc -l` → 7). `--solo claude --proyecto ... --skills-proyecto` → `--skills-proyecto no se combina con --solo claude`, exit=1.

Criterio 5, con el HOME real del usuario:
```
$ bash pruebas/rapida.sh 2>&1 | tail -4
ℹ tests 224
ℹ pass 224
ℹ fail 0
rapida: 22 archivos en 20 s (tope 30 s)
exit=0
```
(Segunda corrida tras el último cambio de texto: `ℹ tests 224`, `ℹ pass 224`, `ℹ fail 0`, `rapida: 22 archivos en 20 s`.)

Criterios de aceptación: 1 cumplido (4 con `--skills-proyecto`, comando de desinstalar presente); 2 cumplido (las cuatro menciones); 3 cumplido (solo `+`); 4 cumplido (instalar, desinstalar y el comando de kit funcionan con HOME falso); 5 cumplido (224/224, fail 0). `--actualizar` real no se corrió: necesita red a GitHub; se verificó su efecto equivalente con `instalar.sh --copiar`.

## Notas

- **Huecos menores, decisiones tomadas:**
  1. La línea original `# Quitar solo ese ajuste de un proyecto, sin desinstalar lo demás:` no se tocó (criterio 3: solo inserciones). Lo que ahora quita `desinstalar.sh --proyecto` (copias de skills y exclusiones) se explica en una viñeta nueva.
  2. Lo de `.claude/settings.local.json` sin ignorar va en una viñeta nueva, no en la existente de `--proyecto`, por el mismo criterio.
  3. El párrafo del PC de trabajo es un párrafo aparte al final de la subsección (no una sola frase dentro de la lista de `--actualizar`) para no meterlo entre viñetas; tiene dos frases: la del flag y la frase exacta fijada.
  4. Se añadió que `--skills-proyecto` no se combina con `--solo claude` y que volver a correr `instalar.sh --proyecto <ruta> --skills-proyecto` rehace las copias; ambas cosas están comprobadas arriba.
- Decisión de Franco aplicada: con `--solo claude` las copias de Pi de los proyectos registrados se borran y no se rehacen, con el registro conservado (documentado en la viñeta de «rehacen»).
- Pendiente para Franco: el comportamiento en el PC de trabajo sigue sin verificar (frase fijada). `--actualizar` real no se corrió en esta máquina (red).
- Revisión sugerida para Franco: *Evidencia* y `git diff README.md` (9 líneas nuevas en «Instalación»). Sin commit, sin push.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
