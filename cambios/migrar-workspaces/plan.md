---
estado: borrador
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
- [ ] En `migrar()`: detectar hijos con `.git`, imprimir el bloque de workspace y el aviso de raíz sin repo (solo cuando hay hijos).
- [ ] En `migrar()`: función `mig_gitignore` (real y simulación) llamada tras `mig_deny`.
- [ ] En `migrar()`: aviso del AGENTS.md de v1, también en `--simular`.
- [ ] Reescribir `skills/migrar-proyecto/SKILL.md`: sección workspace (pregunta de repo propio según `preparar-proyecto` sección 4, sin `git init` sin respuesta), `docs/proyecto.md` condensado con lista «Descartado», planes con `repos:`, corrección de enlaces de `AGENTS.md`.
- [ ] `verify` escalón 7: crear `crear_ws_v1` (raíz sin `.git`, `api` y `web` con `.git`, `definitions/` con `PROJECT.md` y `REPOS.md` en la raíz y una `definitions/` propia en `api`) y los escenarios de arriba; incluir la copia de Cleaner con `[ -d … ] || echo omitido`.
- [ ] `verify` escalón 8: agregar los textos clave nuevos de la skill al `textos_clave` y comprobar que una copia sin ellos falla.
- [ ] Prueba negativa: quitar a propósito la función `mig_gitignore` en una copia y ver que `./verify` falla; revertir.
- [ ] `AGENTS.md` y `PENDIENTES.md`: una línea cada uno (migración cubre workspaces y `.gitignore`).
- [ ] Correr `./verify` y pegar la cola en *Evidencia*.

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
