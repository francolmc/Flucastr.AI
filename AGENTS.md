# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code y Pi. Un solo repo (remoto: `francolmc/Flucastr.AI`). **Versión 2 en construcción** (rama `feature/kit-v2`); la versión 1 está en el tag `kit-v1` y en `old/v1/` (movida, no borrada; sus rutas internas son las originales y no se ejecuta).

## Cómo funciona (v2)

- Dos agentes: `principal` (nivel medio: investiga, diagnostica, planifica, verifica) y `constructor` (nivel bajo: aplica el plan). Los niveles se traducen a modelos en `modelos.json`.
- El esfuerzo (qué tanto razona el modelo) se declara por agente en `modelos.json` y se traduce a `effort` (Claude Code) o `thinking` (Pi).
- El único traspaso es `cambios/<nombre>/plan.md`. Franco tiene dos puertas: aprobar el plan y revisar la evidencia.
- Ejecutor: el constructor ejecuta siempre; el principal solo si Franco lo pide expresamente, y esa petición se escribe en el plan.
- Ventana propia: `claude-<agente>` y `pi-<agente>` (los crea `instalar.sh`) abren el agente con el esfuerzo de `modelos.json`. Con `--agent` directo o eligiéndolo dentro de Pi el esfuerzo no se aplica. Reinstalar con `instalar.sh` regenera los agentes y lanzadores.
- «Hecho» significa que el comando `verify` del proyecto pasa desde cero.
- Ceremonia de cierre: tras tu aprobación, el principal archiva el plan en `cambios/hechos/`, te pide el commit y luego abrir el PR; el cambio termina cuando confirmas el PR. Antes de crear una rama nueva exige la rama base limpia y al día; si hay una rama sin mergear, se detiene y pregunta.
- Skills: `planificar-cambio`, `ejecutar-plan`, `preparar-proyecto`, `definir-proyecto` (proyecto nuevo), `migrar-proyecto` (tras `--migrar`).
- Workspaces: un proyecto puede ser una carpeta sin `.git` con varios repos; su raíz es la unidad de trabajo (`AGENTS.md`, `docs/proyecto.md`, `cambios/`, `verify`). Cada plan lleva `repos:` (carpetas que toca; `[.]` si es un repo) y la rama se crea solo en esas. Ver `preparar-proyecto`, sección 4.
- Rama base: `base:` en el plan, declarada en el `AGENTS.md` del proyecto; para este proyecto es `main`. Sin ella, la principal del remoto. Los proyectos que trabajan sobre `develop` la declaran; liberar a `main` lo hace Franco a mano.
- Comando `verify`: `./verify` (modelos.json ↔ agentes, sintaxis de instalar/desinstalar, ayuda completa y alias sin Node/modelos, resolver Claude/Pi, skills, `instalar.sh --simular`, reglas deny del proyecto, migración a v2 en proyectos sintéticos, textos clave de validar-despliegue). Los proyectos tienen además modo remoto: `VERIFY_TARGET=<url> ./verify` corre solo el recorrido contra un despliegue, solo lectura salvo `VERIFY_PERMITIR_ESCRITURA=1` (`preparar-proyecto`, sección 3b).
- Migrar un proyecto de la v1: `bash instalar.sh --migrar <proyecto> [--simular]`. Mueve `definitions/`, `features/` y `registro/` a `<proyecto>/old/v1/` (sin borrar), deja el agente `principal`, quita el hook de v1, pone las 12 reglas deny, agrega `.claude/settings.local.json` a `.gitignore`, lista los repos hijos de un workspace, avisa si `AGENTS.md` sigue siendo de v1 y crea `cambios/`. Solo Claude Code y solo ese proyecto; no se combina con `--proyecto`, `--skills-proyecto`, `--copiar`, `--solo` ni `--agente`. Después, la skill `migrar-proyecto`.

## Reglas

- Los agentes no hacen commit, push, PR, merge ni despliegue: lo hace Franco.
- No se leen `.env`, llaves ni credenciales (`.env.example` sí).
- Git permitido a los agentes: crear la rama del cambio con `git switch -c <prefijo>/<nombre>` (`feature/`, `fix/`, `chore/`, `docs/`).
- En Pi los subagentes no heredan skills: toda skill que use un subagente se declara en su frontmatter (`skills:`), y `inheritProjectContext: true` para el contexto del proyecto.
- En un proyecto instalado con `--proyecto`, Claude Code bloquea con reglas deny `git commit`, `git push`, `git merge`, `gh pr create`, `gh pr merge`, `git -C … commit`, `git -c … commit`, `git … push`, `bash -c`, `sh -c`, `zsh -c` y leer `.env`. Si una de esas acciones se bloquea, es la regla: no la saltes; lo hace Franco. El agente tampoco puede usar `bash -c` (intencional).

## Límites de las reglas deny

Las reglas viven en `<proyecto>/.claude/settings.json` (compartido, va a git). Según los docs oficiales de Claude Code (code.claude.com/docs/en/permissions) son una barrera, no una frontera de seguridad:

- Los comandos compuestos se separan por `&&`, `||`, `;`, `|`, `&` y saltos de línea, y basta que un subcomando coincida: `git add . && git commit` queda bloqueado.
- Cubiertos (probado con Claude Code real, ver `cambios/deny-endurecido/plan.md`): `git -C . commit`, `git -c k=v commit` y `bash -c`/`sh -c`/`zsh -c`; por eso el agente no puede usar `bash -c`, y es intencional.
- No cubren `sudo` ni `env <cmd>` (no probados). `Read(./.env)` cubre la herramienta Read y `cat/head/tail/sed/tee` en Bash, no `grep -r .` ni un script que abre `.env` (Python, Node, etc.); eso pide sandbox, fuera del kit.
- Subagentes: según los docs, los integrados heredan las reglas (lo leí en un resumen, no literal). No se garantiza que un `permissionMode` de subagente no la salte.
- Los arrays `deny` de varios archivos de ajustes se combinan.
- También bloquean los commits que Franco haga con Claude en ese proyecto; es lo esperado.
- Pi no tiene equivalente conocido: en Pi rige solo el prompt del agente.

Lo de la v1 está en `old/v1/` (`legacy/`, `definitions/`, `features/`, `pruebas/`, `registro/`, los scripts de la v1, el README viejo y los reportes sueltos). Borrar `old/` viene después de usar la v2 en 2 o 3 proyectos reales; es decisión de Franco.

`old/v1/registro/` no se lee salvo pedido explícito de Franco. `pruebas/.temporales/` (3,9 GB, ignorado por git) no se borra ni se mueve sin pedido.
