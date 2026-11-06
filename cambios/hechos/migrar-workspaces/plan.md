---
estado: listo
rama: feature/migrar-workspaces
repos: [.]
---
# migrar-workspaces

## Objetivo
`bash instalar.sh --migrar` y la skill `migrar-proyecto` sirven también para workspaces multi-repo, no mezclan `settings.local.json` con git, avisan del `AGENTS.md` viejo y la skill condensa `docs/proyecto.md` desde la v1 sin escribirlo de cero.

## Supuestos
- Si `.gitignore` no existe se crea con solo `.claude/settings.local.json`. Si Franco no quiere crearlo, se quita ese caso y un paso.
- El aviso del AGENTS.md de v1 sale solo si `AGENTS.md` existe en la raíz y menciona `definitions/`, `features/` o `registro/`. Si Franco quiere aviso siempre que exista, se simplifica la condición.
- La línea de `.gitignore` no se registra en el manifiesto de instalación (`desinstalar.sh` no la quita). Si Franco quiere que se quite al desinstalar, cambia el alcance (`desinstalar.sh`).
- La prueba con Cleaner en `./verify` usa una copia de `/Users/franco/Codes/flucastr/Flucastr.Cleaner` solo si esa carpeta existe; si no, imprime «omitido» (el kit se verifica también en otros equipos).
- Cada repo hijo conserva su `definitions/`, `features/`, `registro/`: el script solo mueve los de la raíz indicada.

## Alcance
Editar: `instalar.sh` (función `migrar`), `skills/migrar-proyecto/SKILL.md`, `verify` (escalón 7 y textos clave del 8), `AGENTS.md` (una línea), `PENDIENTES.md` (una línea).
Fuera de alcance: `desinstalar.sh`, `scripts/resolver.mjs`, `agentes/`, `old/v1/`, y el original de Cleaner (solo se copia; jamás se escribe ahí). El script nunca ejecuta `git init`.

## Decisiones ya tomadas
- (a) El script ya mueve `definitions/`, `features/`, `registro/` de la raíz que recibe; no hay lógica nueva de movimiento. Se agrega detección con `find "$PROYECTO" -maxdepth 2 -name .git -not -path "$PROYECTO/.git"` y se imprime: «Workspace: repos hijos: <carpetas>». Si la raíz no tiene `.git`, imprime «La raíz no es repo: la skill migrar-proyecto te preguntará si la hacemos repo propio (este script no la crea)». Es un hecho, no una decisión.
- Sin hijos con `.git`, no se imprime nada de workspace (un repo se comporta como hoy). En raíz sin `.git` el movimiento usa `mv` (ya lo hace).
- (b) La skill nunca escribe `docs/proyecto.md` desde cero: lo condensa (una página) de `old/v1/definitions/PROJECT.md`, `REPOS.md` y `ARCHITECTURE.md` (los que existan) y al final muestra una lista «Descartado» con lo que dejó fuera y su porqué. Si falta alguno, sigue sin él.
- (c) Los planes que la skill convierte desde el trabajo abierto llevan `repos:` (carpetas de la columna `repo:` de la tarea v1 si existe; `[.]` en un solo repo; `[.]` también si solo toca la raíz).
- (d) `--migrar` agrega `.claude/settings.local.json` a `<proyecto>/.gitignore` sin duplicar (compara línea exacta), agregando salto de línea final previo si falta. `.claude/settings.json` NO se ignora. En `--simular` solo imprime «(simulación) …». Se hace aunque `settings.local.json` aún no exista (lo crea `fijar-agente`).
- (e) Si el `AGENTS.md` de la raíz cumple el supuesto, el script imprime exactamente: «AVISO: AGENTS.md sigue siendo de v1 y apunta a rutas movidas: ejecuta la skill migrar-proyecto». La skill, además de proponer el AGENTS.md corto, ofrece (pregunta cerrada, recomendada: AGENTS.md corto nuevo) o corregir los enlaces `definitions/`, `features/`, `registro/` → `old/v1/…` en el viejo. No lo reemplaza sin respuesta.
- Idempotencia: la segunda corrida cae en «old/v1 ya existe» antes de tocar nada, también el `.gitignore`.

## Escenarios
- CUANDO la raíz no es repo, tiene dos hijos con `.git` y `definitions/` propia en la raíz Y en un hijo ENTONCES `old/v1/definitions` es la de la raíz, la del hijo sigue en su sitio, la raíz sigue sin `.git`, el log lista los dos hijos y dice que la raíz no es repo.
- CUANDO se corre `--migrar` ENTONCES `.gitignore` contiene `.claude/settings.local.json` una sola vez y no contiene `.claude/settings.json`; si ya tenía esa línea y otras, no se duplica y las otras se conservan.
- CUANDO `AGENTS.md` menciona `definitions/` ENTONCES aparece el aviso; si no hay `AGENTS.md`, no aparece.
- CUANDO `--simular` ENTONCES el árbol queda idéntico (incluido `.gitignore`).
- CUANDO se migra una copia de Cleaner (un repo con `.git`, `AGENTS.md`) ENTONCES no sale texto de workspace, sí el aviso de AGENTS.md, `git mv` mueve `definitions/` y `features/`, y `git status` muestra `.gitignore` nuevo.

## Verificación
`./verify` — con escenarios nuevos en el escalón 7 (workspace sintético, `.gitignore` sin duplicar, aviso, copia de Cleaner o «omitido») y los textos clave de la skill en el escalón 8 (`REPOS.md`, `Descartado`, `repos:`).

## Pasos
- [x] En `migrar()`: detectar hijos con `.git`, imprimir el bloque de workspace y el aviso de raíz sin repo (solo cuando hay hijos).
- [x] En `migrar()`: función `mig_gitignore` (real y simulación) llamada tras `mig_deny`.
- [x] En `migrar()`: aviso del AGENTS.md de v1, también en `--simular`.
- [x] Reescribir `skills/migrar-proyecto/SKILL.md`: sección workspace (pregunta de repo propio según `preparar-proyecto` sección 4, sin `git init` sin respuesta), `docs/proyecto.md` condensado con lista «Descartado», planes con `repos:`, corrección de enlaces de `AGENTS.md`.
- [x] `verify` escalón 7: crear `crear_ws_v1` (raíz sin `.git`, `api` y `web` con `.git`, `definitions/` con `PROJECT.md` y `REPOS.md` en la raíz y una `definitions/` propia en `api`) y los escenarios de arriba; incluir la copia de Cleaner con `[ -d … ] || echo omitido`.
- [x] `verify` escalón 8: agregar los textos clave nuevos de la skill al `textos_clave` y comprobar que una copia sin ellos falla.
- [x] Prueba negativa: quitar a propósito la función `mig_gitignore` en una copia y ver que `./verify` falla; revertir.
- [x] `AGENTS.md` y `PENDIENTES.md`: una línea cada uno (migración cubre workspaces y `.gitignore`).
- [x] Correr `./verify` y pegar la cola en *Evidencia*.

## Evidencia
$ ./verify
(cola de la salida real; la corrida completa se guardó en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/bc8c1bd8-6f3c-4990-8764-edc2a9748cad/scratchpad/verify-final.txt`)
```
ok escenario 3: reinstalar deja el archivo y las líneas deny iguales
ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo
ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta
ok escenario 6: actualización de 7 a 12 reglas; se agregan y registran solo las 5 nuevas
ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 5; desinstalar deja las 7
== 7. migración a v2 (--migrar, --simular, repetición, sin v1) ==
ok escenario 1: old/v1 con las tres carpetas, agente principal, sin hook, 12 deny, cambios/, lista de trabajo a medias
ok escenario 2: repetir dice «old/v1 ya existe» y no cambia el árbol
ok escenario 3: solo definitions/ -> se mueve y no hay error
ok escenario 4: sin v1 -> «nada que migrar», sin cambios
ok escenario 5: --simular imprime el plan y no cambia el árbol
ok escenario 6: --migrar con --proyecto da error y no cambia nada
ok escenario 7: workspace -> old/v1 de la raíz, hijos intactos, log con hijos y raíz sin repo
ok escenario 7b: --simular en workspace no cambia el árbol y sale el aviso de AGENTS.md
ok escenario 8: .gitignore con línea repetida no duplica y conserva las demás
ok escenario 8b y 8c: .gitignore sin salto final y sin .gitignore quedan con la línea una vez; sin AGENTS.md no hay aviso
ok escenario 9: copia de Cleaner -> sin texto de workspace, aviso, git mv de definitions/ y features/, .gitignore en git status
== 8. workspaces (detección con find, textos clave de los archivos del cambio) ==
ok 8a: workspace con dos hijos con .git -> find devuelve 2
ok 8b: textos clave presentes; copias sin repos: o sin «Descartado» fallan la comprobación
VERIFY OK
exit 0
```

Prueba negativa (en una copia del kit, fuera del repo): sin la llamada `mig_gitignore` en `instalar.sh`, `./verify` sale con `exit 1` en el escenario 7b («--simular no imprimió la línea de .gitignore»).

## Notas
- Rama `feature/migrar-workspaces` creada desde `feature/kit-v2` (el plan ya venía modificado sin commit y se llevó a la rama). Ningún commit.
- Raíz «es repo» se comprueba con `-e .git` (no con `rev-parse`), para que un proyecto dentro de otro repo no se tome por repo propio.
- El script imprime la línea «.gitignore:» antes del bloque de `.gitignore`; no se registra en el manifiesto (según *Supuestos*).
- Corregido de paso un fallo propio antes de verificar: el prefijo «(simulación)» de `mig_gitignore` usaba `${SIMULAR:+…}`, que sale aunque `SIMULAR=0`; ahora compara con `= 1`.
- `migrar-proyecto/SKILL.md` reescrita por secciones: nueva 2 (workspace, pregunta de repo propio sin `git init` sin respuesta), 3 (AGENTS.md con pregunta cerrada si menciona rutas de v1), 4 (`docs/proyecto.md` condensado con «Descartado»), 6 (planes con `repos:`).
- El escenario 9 de `verify` copia Cleaner (3,1 MB) a un temporal; el original no cambia (comprobado con `git status --porcelain`). Como existe en este equipo, no salió «omitido».
- Pendiente de Franco (no hecho por el agente): commit y push de la rama.
