<p align="center"><img src="assets/logo.svg" alt="Logo de Flucastr.AI" width="64" height="64"></p>

# Flucastr.AI

Mi forma de construir productos con agentes de IA, sin enredarme en la herramienta.

> Estado: en uso (2026-10-30). El kit completo (arquitecto, coordinador, planificador y constructor, con instalador local y remoto) está hecho; el avance real está en `definitions/BACKLOG.md`.

## La idea

Flucastr.AI es un kit personal de agentes, skills e instaladores para trabajar con IA en Claude Code y Pi. Yo abro un solo agente, el `coordinador`, y él reparte el trabajo entre un `arquitecto`, un `planificador` y un `constructor`. Todo pasa por archivos que puedo leer y por cuatro puertas donde yo apruebo antes de seguir. Los agentes no hacen commit, push, PR ni despliegue: eso es mío.

No es un servicio ni una aplicación: es texto (agentes y skills), unos scripts y las pruebas que comprueban que el kit hace lo que dice.

## Para qué existe

Para producir funcionalidad real en mis proyectos (Don Financio, Andes y otros) trabajando con agentes de IA, sin quedar de mensajero entre sesiones y sin que armar la herramienta consuma la jornada.

## Reglas

1. **Producto primero.** Lo primero que se construye es algo que me sirva, no una herramienta.
2. **Una tarea, un archivo.** Cada trabajo se describe en un archivo de tarea; yo lo apruebo antes de que se escriba código.
3. **Yo hago el commit.** Los agentes no hacen commit, push, PR, merge ni despliegue. El `constructor` solo crea la rama de la feature (`git switch -c`) y, con mi confirmación, se cambia a una rama existente (`git switch`); el commit, el PR, el merge y el despliegue son míos. Tampoco en el modo yolo: ahí los cambios quedan sin commit en la rama actual para que yo los revise.
4. **Los secretos no se tocan.** Nadie lee ni imprime `.env`, llaves ni credenciales.
5. **Nada nuevo sin dolor real.** Una herramienta, regla o automatización se agrega solo cuando su ausencia ya me costó tiempo.
6. **Corte duro.** Si en 2 o 3 días no hay algo funcionando, paro y reviso qué me frena.

## Documentación

La definición vigente del proyecto está en [`definitions/`](definitions/):

- [`PROJECT.md`](definitions/PROJECT.md): qué es, cómo se prueba, decisiones, flujo de trabajo y preguntas abiertas.
- [`REPOS.md`](definitions/REPOS.md): repos y conexiones.
- [`ARCHITECTURE.md`](definitions/ARCHITECTURE.md): estructura, diagrama y evolución prevista.

[`AGENTS.md`](AGENTS.md) es la entrada breve para cualquier agente. Todo es borrador hasta que lo apruebo.

## Estructura

```
Flucastr.AI/
├── README.md
├── assets/         # logo del README
├── AGENTS.md        # entrada breve para agentes
├── definitions/     # definición vigente del proyecto
├── features/        # tareas por feature (features/Fxx-nombre/task-NN-nombre.md); las terminadas, archivadas en features/completed/
├── modelos.json     # niveles y modelos por herramienta; los agentes declaran nivel, no modelo
├── agentes/         # un archivo por agente
│   ├── arquitecto.md    # define proyecto, estructura y arquitectura
│   ├── coordinador.md   # el único que abres; delega y se detiene en las cuatro puertas
│   ├── planificador.md  # redacta el backlog y las tareas
│   └── constructor.md   # ejecuta una tarea aprobada y deja la evidencia
├── skills/          # procedimientos que los agentes cargan solo cuando los necesitan
│   ├── definir-proyecto/
│   ├── revisar-proyecto-existente/
│   ├── disenar-arquitectura/
│   ├── generar-clonar/
│   ├── crear-backlog/
│   ├── descomponer-feature/
│   └── ejecutar-tarea/
├── scripts/
│   ├── resolver.mjs    # resuelve el modelo de cada agente y genera los archivos por herramienta
│   ├── archivar.mjs    # chequea el contexto y, con --aplicar Fxx (Fxx explícito; lo corre Franco o el coordinador a su pedido, WORKFLOW.md §3.1), mueve esa feature hecha a features/completed/
│   └── registrar.mjs   # registra los eventos del flujo en registro/eventos.jsonl (lo corre Franco)
├── pruebas/         # comprobaciones del kit y arnés de pruebas del arquitecto (ver pruebas/README.md)
├── instalar.sh      # instala agentes y skills en Claude Code y Pi
├── instalar-remoto.sh   # instala sin clonar el repo: descarga main de GitHub, verifica y actualiza
└── desinstalar.sh   # quita exactamente lo que instaló
```

Una comprobación (`pruebas/comprobaciones/readme-estructura.mjs`) falla si el árbol de agentes y skills de este bloque no coincide con `agentes/` y `skills/`.

## Instalación

```bash
bash instalar.sh --simular   # valida y muestra qué haría, sin escribir nada
bash instalar.sh             # instala (Claude Code y Pi, los que encuentre)
bash desinstalar.sh          # quita lo instalado

# Dejar al arquitecto como agente predeterminado de un proyecto (cada sesión ahí arranca con él):
bash instalar.sh --proyecto /ruta/al/proyecto

# Quitar solo ese ajuste de un proyecto, sin desinstalar lo demás:
bash desinstalar.sh --proyecto /ruta/al/proyecto
```

- Las skills se **enlazan** desde `skills/`; el agente de Claude Code se **genera** con el `model` tomado de `modelos.json`; para Pi se genera el agente en `~/.pi/agent/agents/` (lo lee el paquete de subagentes) y un lanzador `pi-<agente>`.
- Valida todo antes de tocar nada y nunca pisa archivos que ya existan: los omite y lo avisa.
- Si cambias `modelos.json`, vuelve a correr `bash instalar.sh` (el lanzador de Pi lo lee en vivo; el agente de Claude Code no). El nivel de cada agente lo eliges tú en ese archivo.
- `--proyecto` escribe `{"agent": "arquitecto"}` en `<proyecto>/.claude/settings.local.json`. No pisa un agente que el proyecto ya tenga definido, y `desinstalar.sh` lo deshace.
- `--agente <nombre>` elige el agente predeterminado del proyecto (por defecto `arquitecto`).
- Uso: `claude --agent coordinador` o `pi-coordinador`, desde la carpeta del proyecto (también `arquitecto`, `planificador` y `constructor` por separado).

### Sin clonar el repo (PC de trabajo)

En el PC de trabajo no tengo clon. Ahí uso `instalar-remoto.sh`, que baja la versión publicada de `main` (o la de `--ref`), la verifica y corre `instalar.sh --copiar` sobre una copia en `~/.flucastr-ai/kit/`. Lo que recomiendo es bajarlo, leerlo y correrlo en dos pasos:

```bash
curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh -o instalar-remoto.sh
cat instalar-remoto.sh     # lo leo antes de correrlo
bash instalar-remoto.sh
```

La forma de una línea, si ya lo leí y confío en el repo:

```bash
curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh | bash
```

Después de la primera instalación, lo manejo desde la copia que quedó en el kit:

```bash
bash ~/.flucastr-ai/kit/instalar-remoto.sh --estado                # compara la instalada con la publicada; no descarga
bash ~/.flucastr-ai/kit/instalar-remoto.sh --actualizar            # trae la versión publicada si cambió
bash ~/.flucastr-ai/kit/instalar-remoto.sh --ref <rama|tag|sha>    # fija otra versión; también sirve para volver atrás
```

- Volver a correr el comando sin opciones hace lo mismo que `--actualizar`: si ya está al día, lo dice y no toca nada.
- La actualización es atómica: si algo falla a mitad, vuelve la versión anterior y `version` no cambia. No hay procesos en segundo plano ni avisos automáticos; lo corro yo cuando quiero.
- Dónde vive todo: `~/.flucastr-ai/kit/` es la copia de la versión instalada (se reemplaza al actualizar; no la edito); `~/.flucastr-ai/version` guarda el sha, la fecha y la rama o tag consultados.
- `~/.flucastr-ai/modelos.json` es mi `modelos.json` personal. Se crea la primera vez y **nunca se pisa**: al actualizar queda byte a byte igual.
- Si la versión publicada trae novedades en `modelos.json` (versión mayor, agente o perfil nuevo), el instalador lo avisa y no lo mezcla con el mío. Para compararlos: `diff ~/.flucastr-ai/modelos.json ~/.flucastr-ai/kit/modelos.json`.
- Para quitar todo: `bash ~/.flucastr-ai/kit/desinstalar.sh`. Conserva mi `modelos.json`; con `--todo` también lo borra.
- Requisitos: `bash`, `curl`, `tar` y `node`.
- Riesgo asumido de `curl | bash`: quien controle la cuenta de GitHub controla lo que se ejecuta en este PC. Mitigación prevista: 2FA en la cuenta y `main` con PR obligatorio; por eso la forma de dos pasos va primero.

#### Comprobación manual en el PC de trabajo

Esto no lo pueden hacer los agentes ni las pruebas: necesita la red real y ese equipo. Lo hago yo, en este orden:

1. Comprobar que la red llega a `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`.
2. Correr el comando de una línea y arrancar `claude --agent arquitecto` o `pi-arquitecto`, con el modelo que indica mi `modelos.json`.
3. Editar mi `modelos.json`, publicar un cambio mínimo en `main` (una frase en una skill), correr `--estado` (debe decir «hay versión nueva»), luego `--actualizar`, y comprobar que el cambio llegó y que mi `modelos.json` sigue igual.
4. Ver si la política de la empresa permite instalar agentes de IA de este tipo.
5. Probar `desinstalar.sh` en el PC de trabajo.

## Pruebas

```bash
node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs
node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs
```

Detalle de escenarios y permisos en [`pruebas/README.md`](pruebas/README.md).

## Flujo

El `coordinador` (el único agente que abro) invoca al `arquitecto`, al `planificador` y al `constructor`, y se detiene en cuatro puertas de aprobación: definición, backlog, cada tarea y revisión del resultado. Detalle en [`definitions/WORKFLOW.md`](definitions/WORKFLOW.md). F04 dejó este README al día y una comprobación que falla si el árbol de `## Estructura` no coincide con `agentes/` y `skills/` (`pruebas/comprobaciones/readme-estructura.mjs`); su cierre en `definitions/BACKLOG.md` lo hago yo. Cada feature trabaja en una rama `feature/`, `fix/` o `chore/` + `Fxx-nombre`; al quedar `hecha` su última tarea, el aviso llega por `STATUS.md` para que yo cierre la rama. Antes de descomponer una feature ambigua puede haber un refinado previo (hasta 5 preguntas con recomendación en `features/Fxx/refinado.md`), solo cuando se requiere. Solo si lo pido de forma explícita en la conversación (por ejemplo «yolo F05»), con el alcance nombrado, la definición aprobada y un único repo, existe el modo yolo: el `coordinador` omite las puertas 2, 3 y 4, trabaja directo en la rama actual (con una advertencia si es `main`) y se detiene ante cualquier escalación o si una feature necesita refinado. Detalle en `definitions/WORKFLOW.md` §9.3.

## Registro de eventos

Junto datos de cada ejecución del flujo para detectar errores y mejorar cómo trabajo con los agentes. El informe que lo resuma es una feature aparte (F11), que quiero tener cuando haya unas 10 tareas con datos.

Lo corro yo, desde la raíz del proyecto, con `node scripts/registrar.mjs`: las veces que quiera y antes de archivar. `--reconstruir` regenera todo el archivo desde cero y `--raiz <dir>` lo apunta a otra raíz.

Produce `registro/eventos.jsonl`. Esa carpeta tiene su propio `.gitignore`, se puede regenerar y no guarda datos personales ni texto libre. Lee solo lo que está en commits, así que lo que no está commiteado no aparece: el historial de las tareas, de `BACKLOG.md` y de `STATUS.md`, y las líneas `Registro:` que el `constructor` agrega a *Notas*.

El modelo que queda registrado es el que indica `modelos.json` al correr el script; conviene correrlo antes de cambiar de modelo.

## Archivo y rescate

El trabajo anterior (`project-flow`, `project-lite`, kit v1) vive en `claude-skills-personal` y no se toca. Si algo sirve, se rescata aquí cuando haga falta, no antes.

## Bitácora

- 2026-10-28: reinicio del proyecto y nombre `Flucastr.AI`. Se crean `modelos.json`, el arquitecto, sus cuatro skills y el instalador/desinstalador.
- 2026-10-29: la definición pasa a `definitions/`; se acota el alcance de las pruebas; se define el flujo con coordinador, planificador y constructor.
- 2026-10-29: existen coordinador, planificador y constructor; el README se actualiza a ese estado.
- 2026-10-29: F04 (README al día): el README refleja el kit real y `pruebas/comprobaciones/readme-estructura.mjs` comprueba su árbol de `## Estructura` contra `agentes/` y `skills/`.
