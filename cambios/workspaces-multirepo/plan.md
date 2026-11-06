---
estado: listo
rama: feature/kit-v2
repos: [.]
---
# workspaces-multirepo

## Objetivo
El kit soporta workspaces: una carpeta que no es repo y contiene varios. La raíz del workspace es la unidad de trabajo (AGENTS.md raíz, `docs/proyecto.md`, `cambios/`, `verify`), los planes dicen en qué repos tocan y el principal escribe los documentos iniciales.

## Supuestos
- `repos:` es una lista de carpetas relativas a la raíz; `.` es la raíz. Si Franco prefiere otro nombre o formato, cambian la plantilla y 3 textos.
- Una carpeta de `repos:` sin `.git` (p. ej. raíz que Franco decidió no hacer repo) no recibe rama: el constructor lo anota en *Notas* y sigue.
- El `.gitignore` propuesto para la raíz lista cada carpeta hija con `.git` (una línea `/<carpeta>/`), más `.claude/settings.local.json`.
- `docs/proyecto.md` es una página: qué es, repos y su rol, cómo se conectan, decisiones con su porqué.
- Sin cambios en `instalar.sh`, `desinstalar.sh` ni `scripts/` (las reglas deny ya viven en `<raíz>/.claude/settings.json`; `git -C <hijo> switch -c` no está bloqueado).

## Alcance
Cambiar: `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `skills/preparar-proyecto/SKILL.md`, `agentes/principal.md`, `agentes/constructor.md`, `verify` (un escalón nuevo), `AGENTS.md` (breve). Fuera de alcance: instalador, resolver, `modelos.json`, `old/`, `PENDIENTES.md`, `skills/migrar-proyecto` (lo amplía el Pedido 4b).

## Decisiones ya tomadas
- Plantilla del plan: frontmatter con `rama:` y `repos:`. Obligatorio; un proyecto de un repo escribe `repos: [.]`.
- La rama se crea solo en los repos listados, con `git -C <carpeta> switch -c <rama>` (o `git switch -c` si es `.`). Si ya existe, `PAUSA acceso`, como hoy. El constructor lee `repos:` del plan; el encargo sigue siendo solo ruta y `Rama:`.
- Si el cambio toca solo la raíz (documentos, verify), `repos: [.]`: la raíz cuenta como un repo más.
- `preparar-proyecto` detecta repos con `find . -maxdepth 2 -name .git -not -path './.git'`. Si hay hijos y la raíz no tiene `.git`, PREGUNTA a Franco (cerrada, recomendada «sí») si hace la raíz repo propio: `git init` + `.gitignore`. Nunca lo hace sin respuesta ni hace commit.
- El principal nunca decide solo «repo único o varios»: lo pregunta (opciones cerradas). La detección de hijos existentes es un hecho, no una decisión.
- En un proyecto existente el principal escribe `AGENTS.md` raíz y `docs/proyecto.md`; enlaza los `AGENTS.md` de los hijos (y `specs/`) sin reescribirlos ni moverlos. El constructor solo construye: `verify`, `/health`, `.env.example`.
- `verify` vive en la raíz del workspace y llama a cada repo por su ruta.
- El verify del kit no llama a un modelo (no determinista). Comprueba textos y la detección; la prueba con `claude -p` la corre el principal (ver Verificación).

## Escenarios
- CUANDO el workspace tiene dos hijos con `.git` y la raíz no ENTONCES el principal propone hacer la raíz repo y espera la respuesta; no ejecuta `git init`.
- CUANDO el cambio toca solo `api/` ENTONCES `repos: [api]` y solo esa carpeta recibe la rama.
- CUANDO el cambio toca solo documentos o `verify` ENTONCES `repos: [.]`.
- CUANDO un proyecto es un solo repo ENTONCES nada cambia salvo escribir `repos: [.]`.

## Verificación
1. `./verify` termina en `VERIFY OK`.
2. Prueba real (la corre el principal al volver el constructor), fuera del repo y con el prompt del repo:
   `d=$(mktemp -d) && cd "$d" && for r in api web; do mkdir $r && git -C $r init -q && printf '# %s\n' $r > $r/AGENTS.md; done && claude -p --append-system-prompt "$(node /Users/franco/Codes/flucastr/Flucastr.AI/scripts/resolver.mjs cuerpo /Users/franco/Codes/flucastr/Flucastr.AI/agentes/principal.md)" "Prepara este proyecto para trabajar con el kit"`
   Esperado: existen `AGENTS.md` y `docs/proyecto.md` en la raíz escritos por el principal, `api/AGENTS.md` y `web/AGENTS.md` sin cambios, no existe `.git` en la raíz y la salida propone hacerla repo y espera respuesta. Si el primer plan se escribe, trae `repos:`.

## Pasos
- [x] `planificar-cambio`: agregar `repos:` a la plantilla y una regla del buen plan (cuáles repos y por qué `.` cuenta como repo).
- [x] `ejecutar-plan`: crear la rama solo en cada carpeta de `repos:` (sin `.git` → anotar y seguir); ajustar el texto de «Antes de empezar».
- [x] `constructor.md`: git permitido incluye `git -C <carpeta de repos:> branch --show-current` y `git -C <carpeta> switch -c <rama>`; sin cambios en el resto.
- [x] `preparar-proyecto`: sección «Workspaces» con la detección, la pregunta de repo en la raíz, el `.gitignore` y el flujo (d): el principal escribe `AGENTS.md` raíz y `docs/proyecto.md`, enlaza los existentes; el constructor solo construye. `verify`, `cambios/` y documentos van en la raíz.
- [x] `principal.md`: regla «nunca decides repo único o varios: preguntas», y que en proyectos existentes escribes tú los documentos iniciales.
- [x] `verify`: escalón nuevo que (i) crea en un temporal un workspace con dos hijos con `.git` y raíz sin `.git` y comprueba que el `find` de arriba devuelve exactamente 2; (ii) comprueba que los 5 archivos de Alcance contienen sus textos clave (`repos:`, `-maxdepth 2`, `git -C`), con prueba negativa sobre una copia sin `repos:` que debe fallar.
- [x] `AGENTS.md` del kit: 2-3 líneas sobre workspaces y `repos:`.
- [x] Correr `./verify`.
- [x] En *Notas*: «Franco: reinstala (`bash instalar.sh`) para que los agentes tomen el cambio».

## Evidencia
$ ./verify
```
== 6. reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto) ==
ok escenario 1: sin archivo -> 12 reglas y 12 líneas deny
ok escenario 2: se conservan allow, otra clave y deny propios; solo se registran las agregadas
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
== 8. workspaces (detección con find, textos clave de los archivos del cambio) ==
ok 8a: workspace con dos hijos con .git -> find devuelve 2
ok 8b: textos clave presentes; una copia sin repos: falla la comprobación
VERIFY OK
exit 0
```

## Notas
- Corrida de `verify` previa a la final: pasó sin cambios (baseline antes de editar).
- `ejecutar-plan` (paso 2): si el plan no trae `repos:`, `PAUSA` con `motivo=ambiguo`. Decisión menor para que el constructor no adivine.
- `constructor.md`: además de `branch --show-current` y `switch -c`, permite `git -C <carpeta> rev-parse --verify --quiet refs/heads/<rama>` (solo lectura). Hace falta para detectar si la rama ya existe antes de crearla.
- `preparar-proyecto`, sección 4: la detección se escribió como «raíz sin `.git` y hay hijos con `.git`» (un hijo basta para preguntar; la pregunta la hace el principal). El caso de un solo hijo queda cubierto por la pregunta, no por una regla aparte.
- `verify` paso 8: 8a corre `git init` solo en un temporal que se borra al salir.
- Franco: reinstala (`bash instalar.sh`) para que los agentes tomen el cambio.

## Evidencia del principal (prueba real, 2026-11-06, corrida por la sesión de coordinación)
Workspace temporal fuera del repo: `api/` y `web/` con su `.git` y un `AGENTS.md` de una línea cada uno, raíz sin `.git`. Agentes y skills tomados del repo (no de `~/.claude`). `claude -p --agent principal`, con permiso para `git init` a propósito.
- Turno 1 («Prepara este proyecto para trabajar con el kit»): cargó `preparar-proyecto`, detectó 2 hijos con `.git` y raíz sin `.git`, preguntó con opciones cerradas «¿Hacemos la raíz repo propio?» (recomendada: sí) y **no** ejecutó `git init` ni creó archivos. Los `AGENTS.md` de los hijos: md5 igual.
- Turno 2 («Sí, … app de gastos del hogar…»): `git init` en la raíz, `.gitignore` con `/api/`, `/web/` y `.claude/settings.local.json`, `AGENTS.md` raíz (21 líneas, enlaza los de los hijos), `docs/proyecto.md` (18 líneas) y `cambios/preparar-verify/plan.md` en `borrador` con `repos: [., api, web]`. Hijos intactos (md5 igual). Raíz sin commits.
- Nota: el plan esperaba los documentos ya en el turno 1; el comportamiento real (preguntar primero, escribir después de la respuesta) es el correcto según `preparar-proyecto`.
