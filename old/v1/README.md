<p align="center"><img src="assets/logo.svg" alt="Logo de Flucastr.AI" width="64" height="64"></p>

# Flucastr.AI

Un kit de agentes de IA para construir productos con aprobación humana en cada paso, sobre Claude Code y Pi.

> Estado: en uso (2026-11-05). El kit completo (arquitecto, coordinador, planificador y constructor, con instalador local y remoto) está hecho; el avance real está en `definitions/BACKLOG.md`.

## La idea

Flucastr.AI es un kit personal de agentes, skills e instaladores para trabajar con IA en Claude Code y Pi. Quien usa el kit abre un solo agente, el `coordinador`, y él reparte el trabajo entre un `arquitecto`, un `planificador` y un `constructor`. Todo pasa por archivos que se pueden leer y por cuatro puertas donde la persona aprueba antes de seguir. Los agentes no hacen commit, push, PR ni despliegue: eso lo hace quien usa el kit.

No es un servicio ni una aplicación: es texto (agentes y skills), unos scripts y las pruebas que comprueban que el kit hace lo que dice.

## Para qué existe

Producir funcionalidad real en cualquier proyecto trabajando con agentes de IA, sin hacer de mensajero entre sesiones y sin que armar la herramienta consuma la jornada.

## Reglas

1. **Producto primero.** Lo primero que se construye es algo que sirva al producto, no una herramienta.
2. **Una tarea, un archivo.** Cada trabajo se describe en un archivo de tarea; la persona lo aprueba antes de que se escriba código.
3. **El commit es de la persona.** Los agentes no hacen commit, push, PR, merge ni despliegue. El `constructor` solo crea la rama de la feature (`git switch -c`) y, con confirmación de la persona, se cambia a una rama existente (`git switch`); el commit, el PR, el merge y el despliegue son de la persona. Tampoco en el modo yolo: ahí los cambios quedan sin commit en la rama actual para que la persona los revise.
4. **Los secretos no se tocan.** Nadie lee ni imprime `.env`, llaves ni credenciales.
5. **Nada nuevo sin dolor real.** Una herramienta, regla o automatización se agrega solo cuando su ausencia ya costó tiempo.

## Documentación

La definición vigente del proyecto está en [`definitions/`](definitions/):

- [`PROJECT.md`](definitions/PROJECT.md): qué es, cómo se prueba, decisiones, flujo de trabajo y preguntas abiertas.
- [`REPOS.md`](definitions/REPOS.md): repos y conexiones.
- [`ARCHITECTURE.md`](definitions/ARCHITECTURE.md): estructura, diagrama y evolución prevista.

[`AGENTS.md`](AGENTS.md) es la entrada breve para cualquier agente. Todo es borrador hasta que su autor lo aprueba.

## Primeros pasos

1. Cumple los requisitos y [instala](#instalación) el kit.
2. Abre el `coordinador` desde la carpeta de tu proyecto: `claude --agent coordinador` o `pi-coordinador`.
3. El `coordinador` revisa qué falta y delega: sin definición llama al `arquitecto`; con definición aprobada y sin backlog, al `planificador`; con tareas aprobadas, al `constructor`. Te detiene en cuatro puertas donde apruebas.
4. Lo que decides queda escrito en `definitions/STATUS.md`.
5. Los commits, el PR y el despliegue los haces tú.

```mermaid
flowchart LR
    D["Definir el proyecto<br/>(arquitecto)"] --> P1{"Puerta 1<br/>definición"}
    P1 --> B["Armar el backlog<br/>(planificador)"]
    B --> P2{"Puerta 2<br/>backlog"}
    P2 --> T["Escribir las tareas<br/>(planificador)"]
    T --> P3{"Puerta 3<br/>cada tarea"}
    P3 --> C["Construir y verificar<br/>(constructor)"]
    C --> P4{"Puerta 4<br/>revisión"}
    P4 --> F["Commit y PR<br/>(Franco)"]
```

| Rol | Qué hace | Qué no hace |
|---|---|---|
| `coordinador` | Es el único que se abre; decide el paso siguiente, delega y se detiene en las puertas. | Construir. |
| `arquitecto` | Define el proyecto, sus repos y su arquitectura. | Planificar o construir. |
| `planificador` | Escribe el backlog y descompone cada feature en tareas completas y acotadas. | Construir o aprobar. |
| `constructor` | Ejecuta una tarea aprobada, la verifica y deja la evidencia. | Marcar `hecha`, hacer commit, push, PR, merge o despliegue. |

Detalle del flujo, de la rama por feature, del refinado y del modo yolo en [`definitions/WORKFLOW.md`](definitions/WORKFLOW.md) y en la sección [Flujo](#flujo-y-modo-yolo).

## Estructura

```
Flucastr.AI/
├── README.md
├── assets/         # logo del README
├── AGENTS.md        # entrada breve para agentes
├── LICENSE          # licencia MIT
├── definitions/     # definición vigente del proyecto
├── features/        # tareas por feature (features/Fxx-nombre/task-NN-nombre.md); las terminadas, archivadas en features/completed/
├── registro/        # eventos del flujo (registro/eventos.jsonl), ignorados por git; registrar.mjs los genera
├── modelos.json     # niveles y modelos por herramienta, ventanas y compactar_en; los agentes declaran nivel, no modelo
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
│   ├── modo-yolo/
│   ├── ramas-feature/
│   ├── comandos-coordinador/
│   ├── control-consumo/
│   ├── lectura-extra/
│   └── ejecutar-tarea/
├── scripts/
│   ├── resolver.mjs    # resuelve el modelo de cada agente, genera los archivos por herramienta y la compactación
│   ├── archivar.mjs    # chequea el contexto y, con --aplicar Fxx (Fxx explícito; lo corre quien usa el kit o el coordinador a su pedido, WORKFLOW.md §3.1), mueve esa feature hecha a features/completed/
│   ├── consumo.mjs     # mide consumo de tokens, turnos y KB leídos por rol desde los logs de Pi y Claude Code (solo lectura; lo corre quien usa el kit)
│   ├── informe.mjs    # informe de resultados del flujo desde registro/eventos.jsonl; con --consumo añade el bloque de consumo (lo corre quien usa el kit)
│   ├── registrar.mjs   # registra los eventos del flujo en registro/eventos.jsonl (lo corre quien usa el kit)
│   ├── validar-tarea.mjs   # valida el formato de una tarea y su Fuente; también corre como hook en Claude Code
│   ├── entorno.mjs     # comprueba la línea Requiere: de una tarea
│   └── formato-*.mjs, firma.mjs, pistas.mjs, contexto-fuentes.mjs, crecimiento-definiciones.mjs   # módulos de apoyo de los comandos anteriores
├── pruebas/         # pruebas del kit: rápidas (rapida.sh), comprobaciones, capa1 y arnés de pruebas por rol (ver pruebas/README.md)
├── initialize.sh    # clona el proyecto completo a partir de definitions/REPOS.md
├── instalar.sh      # instala agentes y skills en Claude Code y Pi
├── instalar-remoto.sh   # instala sin clonar el repo: descarga main de GitHub, verifica y actualiza
└── desinstalar.sh   # quita exactamente lo que instaló
```

Una comprobación (`pruebas/comprobaciones/readme-estructura.mjs`) falla si el árbol de agentes y skills de este bloque no coincide con `agentes/` y `skills/`.

## Requisitos

- `bash`.
- `node` (probado con v25.8.1; el kit no declara una versión mínima).
- Al menos una herramienta de agentes: Claude Code (`claude`, verificado con 2.1.308) o Pi (`pi`, verificado con 1.4.0).
- `git` para el flujo de ramas por feature.
- `curl` y `tar` solo si instalas sin clonar el repo.
- Un sistema tipo Unix (macOS; Windows no probado).

## Instalación

Hay dos caminos: con el repo clonado y sin clonar. Los dos terminan igual: agentes y skills instalados para Claude Code y Pi.

```mermaid
flowchart TD
    Q{"¿Hay repo<br/>clonado?"}
    Q -->|Sí| L["bash instalar.sh"]
    Q -->|No| R["bash instalar-remoto.sh"]
    R --> K["Copia en ~/.flucastr-ai/kit/"]
    K --> L2["instalar.sh --copiar"]
    L --> OK["Agentes y skills en<br/>Claude Code y Pi"]
    L2 --> OK
    OK --> U["claude --agent coordinador<br/>o pi-coordinador"]
```

### Con el repo clonado

Primero valida con `bash instalar.sh --simular`.

```bash
bash instalar.sh --simular   # valida y muestra qué haría, sin escribir nada
bash instalar.sh             # instala (Claude Code y Pi, los que encuentre)
bash desinstalar.sh          # quita lo instalado

# Dejar al arquitecto como agente predeterminado de un proyecto (cada sesión ahí arranca con él):
bash instalar.sh --proyecto /ruta/al/proyecto

# Copiar las skills de Pi dentro del proyecto (para Pi cuando se abre desde el workspace):
bash instalar.sh --proyecto /ruta/al/proyecto --skills-proyecto   # copia las skills a <proyecto>/.pi/skills/ (para Pi en el workspace)

# Quitar solo ese ajuste de un proyecto, sin desinstalar lo demás:
bash desinstalar.sh --proyecto /ruta/al/proyecto
```

- Las skills se **enlazan** desde `skills/`; el agente de Claude Code se **genera** con el `model` tomado de `modelos.json`; para Pi se genera el agente en `~/.pi/agent/agents/` (lo lee el paquete de subagentes) y un lanzador `pi-<agente>`.
- Valida todo antes de tocar nada y nunca pisa archivos que ya existan: los omite y lo avisa.
- Si cambias `modelos.json`, vuelve a correr `bash instalar.sh` (el lanzador de Pi lo lee en vivo; el agente de Claude Code no). El nivel de cada agente lo eliges tú en ese archivo.
- `--proyecto` escribe `{"agent": "arquitecto"}` en `<proyecto>/.claude/settings.local.json`. No pisa un agente que el proyecto ya tenga definido, y `desinstalar.sh` lo deshace.
- `--agente <nombre>` elige el agente predeterminado del proyecto (por defecto `arquitecto`).
- Deja puesta la compactación automática en Pi y, con `--proyecto`, en Claude Code; ver [Higiene de contexto y compactación](#higiene-de-contexto-y-compactación).
- Uso: `claude --agent coordinador` o `pi-coordinador`, desde la carpeta del proyecto (también `arquitecto`, `planificador` y `constructor` por separado).
- `--skills-proyecto` (con `--proyecto`) copia las skills a `<proyecto>/.pi/skills/` como carpetas reales, sin enlaces, para que Pi las lea desde el workspace. Nunca enlaza ni pisa una carpeta que no sea de Flucastr.AI: la omite y lo avisa. No se combina con `--solo claude`.
- Las copias quedan fuera de git del proyecto: cada una se añade a `.git/info/exclude` (no al `.gitignore`). No se editan: se rehacen al volver a correr `bash instalar.sh` o `instalar-remoto.sh --actualizar`. Con `--solo claude` las copias de los proyectos registrados se borran y no se rehacen; el registro se conserva, y `bash instalar.sh --proyecto <ruta> --skills-proyecto` las vuelve a crear.
- Pi pide confiar en el proyecto (`/trust`) la primera vez que lo abre. El instalador no cambia esa confianza.
- `--proyecto` deja `.claude/settings.local.json` sin ignorar en git: el proyecto lo muestra como no versionado (`?? .claude/`). `desinstalar.sh --proyecto <ruta>` quita ese ajuste, las copias de skills y sus líneas en `.git/info/exclude`.

### Sin clonar el repo

En un equipo donde no quieres o no puedes clonar el repo, usa `instalar-remoto.sh`, que baja la versión publicada de `main` (o la de `--ref`), la verifica y corre `instalar.sh --copiar` sobre una copia en `~/.flucastr-ai/kit/`. Lo recomendable es bajarlo, leerlo y correrlo en dos pasos:

```bash
curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh -o instalar-remoto.sh
cat instalar-remoto.sh     # léelo antes de correrlo
bash instalar-remoto.sh
```

La forma de una línea, si ya lo leíste y confías en el repo:

```bash
curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh | bash
```

Después de la primera instalación, lo gestionas desde la copia que quedó en el kit:

```bash
bash ~/.flucastr-ai/kit/instalar-remoto.sh --estado                # compara la instalada con la publicada; no descarga
bash ~/.flucastr-ai/kit/instalar-remoto.sh --actualizar            # trae la versión publicada si cambió
bash ~/.flucastr-ai/kit/instalar-remoto.sh --ref <rama|tag|sha>    # fija otra versión; también sirve para volver atrás
```

- Volver a correr el comando sin opciones hace lo mismo que `--actualizar`: si ya está al día, lo dice y no toca nada.
- La actualización es atómica: si algo falla a mitad, vuelve la versión anterior y `version` no cambia. No hay procesos en segundo plano ni avisos automáticos; lo ejecutas cuando quieras.
- Dónde vive todo: `~/.flucastr-ai/kit/` es la copia de la versión instalada (se reemplaza al actualizar; no se edita); `~/.flucastr-ai/version` guarda el sha, la fecha y la rama o tag consultados.
- `~/.flucastr-ai/modelos.json` es el `modelos.json` personal de quien instala. Se crea la primera vez y **nunca se pisa**: al actualizar queda byte a byte igual.
- Si la versión publicada trae novedades en `modelos.json` (versión mayor, agente o perfil nuevo), el instalador lo avisa y no lo mezcla con el personal. Para compararlos: `diff ~/.flucastr-ai/modelos.json ~/.flucastr-ai/kit/modelos.json`.
- Para quitar todo: `bash ~/.flucastr-ai/kit/desinstalar.sh`. Conserva el `modelos.json` personal; con `--todo` también lo borra.
- Requisitos de este camino: `bash`, `curl`, `tar` y `node`.
- Riesgo de `curl | bash`: quien controle la cuenta de GitHub del repo controla lo que se ejecuta en ese equipo. Mitigación prevista: 2FA en la cuenta y `main` con PR obligatorio; por eso la forma de dos pasos va primero.

El flag de skills de proyecto también funciona: `bash ~/.flucastr-ai/kit/instalar.sh --copiar --proyecto <ruta> --skills-proyecto`, y `--actualizar` rehace esas copias.

## Cómo se prueba

Para comprobar el kit en un solo paso, sin modelo ni red:

```bash
bash pruebas/rapida.sh
```

La suite completa se ejecuta con estos dos comandos:

```bash
node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs
node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs
```

Las corridas con modelo real están fuera de la prueba rápida y gastan créditos. Detalle de escenarios y permisos en [`pruebas/README.md`](pruebas/README.md). Para validar una tarea antes de aprobarla, ejecuta `node scripts/validar-tarea.mjs <ruta-tarea>`.

## Flujo y modo yolo

El `coordinador` (el único agente que se abre directamente) invoca al `arquitecto`, al `planificador` y al `constructor`, y se detiene en cuatro puertas de aprobación: definición, backlog, cada tarea y revisión del resultado. Detalle en [`definitions/WORKFLOW.md`](definitions/WORKFLOW.md). Cada feature trabaja en una rama `feature/`, `fix/` o `chore/` + `Fxx-nombre`; al quedar `hecha` su última tarea, el aviso llega por `STATUS.md` para que el dueño del repo cierre la rama. Antes de descomponer una feature ambigua puede haber un refinado previo (hasta 5 preguntas con recomendación en `features/Fxx/refinado.md`), solo cuando se requiere.

El modo yolo es una advertencia: solo se activa si la conversación lo pide de forma explícita (por ejemplo «yolo F05»), con el alcance nombrado, la definición aprobada y un único repo. En yolo el `coordinador` omite las puertas 2, 3 y 4, trabaja directo en la rama actual (con una advertencia si es `main`) y se detiene ante cualquier escalación o si una feature necesita refinado; los cambios quedan sin commit para revisión. Detalle en `definitions/WORKFLOW.md` §9.3.

## Higiene de contexto y compactación

### Por qué

El estado del flujo vive en `definitions/STATUS.md` y en los archivos de cada feature, no en la conversación. Así una sesión que se corta no pierde el hilo. Pero un contexto largo cuesta más en cada turno, porque la herramienta reenvía todo lo acumulado, y con más contexto el modelo tiende a derivar. Medido en Pi (*inferido*): unas 2,4 veces más costo por turno con 130 k de contexto que con 25 k. Por eso el kit deja puesta la compactación automática: cuando el contexto llega al umbral, la herramienta lo resume sola. No hace falta teclear nada.

### Qué deja puesto el kit

- **Pi**: en `~/.pi/agent/settings.json` (o `$PI_CODING_AGENT_DIR/settings.json`), un ajuste global `compaction.modelOverrides["<proveedor>/<modelo>"].reserveTokens` con el valor `ventana − compactar_en`. Con ventana 272000 y `compactar_en` 100000, queda `172000` para `openai/gpt-6-astra`, `openai/gpt-6.1-sol` y `openai/gpt-6-luna`. Es global: también aplica a esos modelos fuera del kit.
- **Claude Code**: solo con `--proyecto`, en `<proyecto>/.claude/settings.local.json`, con `autoCompactWindow = compactar_en + 33000` (`133000`). Claude Code guarda 33.000 tokens de colchón antes de su límite de compactación, así que ese valor hace que compacte cerca de `compactar_en`. Sin `--proyecto` el kit no toca Claude Code.

### Mecanismos por herramienta

Versiones verificadas: Pi 1.4.0 y Claude Code 2.1.308. Codex: pendiente, todavía no tiene compactación verificada en el kit.

| | Pi 1.4.0 | Claude Code 2.1.308 |
|---|---|---|
| Compactación automática | Sí, al superar `ventana − reserveTokens` | Sí, según `autoCompactWindow` |
| Dónde se configura | `compaction.modelOverrides` en `~/.pi/agent/settings.json`, lo pone `instalar.sh` | `autoCompactWindow` en `<proyecto>/.claude/settings.local.json`, solo con `--proyecto` |
| Fórmula | `reserveTokens = ventana − compactar_en` (172000) | `autoCompactWindow = compactar_en + 33000` (133000) |
| Rango y validación | Enteros no negativos. Un valor inválido en el modelo activo detiene Pi | Entre 100000 y 1000000. Fuera de rango se ignora en silencio |
| Cuándo se aplica | Al abrir Pi de nuevo o con `/reload` (no relee en caliente) | Al abrir una sesión nueva |
| Sesión nueva a mano | `/new` | `/clear` |
| Compactar a mano | `/compact` | `/compact` |
| Medir | Pie del TUI y `/session`; `showCacheMissNotices: true` | `/context`, donde aparece `Autocompact buffer 33k` |

### Cambiar el umbral

Edita `compactar_en` en `modelos.json` (y `ventanas` si cambias de modelo) y corre `bash instalar.sh`. Pi se rehace solo con los valores nuevos.

En Claude Code, un proyecto ya instalado conserva el valor que tiene. Para cambiarlo, quita primero el ajuste con `bash desinstalar.sh --proyecto <ruta>` y vuelve a instalar con `bash instalar.sh --proyecto <ruta>`.

### Qué respeta

El kit nunca sobrescribe lo que ya esté definido. En Pi respeta `compaction.enabled`, `compaction.reserveTokens` y cualquier `modelOverrides` del mismo modelo; en Claude Code respeta un `autoCompactWindow` que ya tenga el proyecto. Si encuentra uno, lo omite y lo avisa con `OMITIDO`.

Escribe con un bloqueo `settings.json.lock` y con escritura atómica. `bash instalar.sh --simular` muestra qué haría sin escribir nada. `bash desinstalar.sh` quita solo lo suyo: borra una clave únicamente si su valor sigue siendo el que puso el kit.

### Después de instalar, comprobar

1. Abre Pi de nuevo o ejecuta `/reload`. Pi no relee `settings.json` en caliente.
2. Compara `~/.pi/agent/settings.json` con la copia que tenías antes (`diff`). Solo debe aparecer `compaction.modelOverrides` para los modelos del kit; el resto del archivo debe quedar igual.

### Limitaciones

- En Pi el ajuste es global: compacta también cuando esos modelos se usan fuera del kit, a unos 100 k.
- Compactar pierde el razonamiento intermedio y las salidas de subagentes que no quedaron anotadas. Por eso el `coordinador` escribe `STATUS.md` antes de delegar: el estado del flujo sobrevive a la compactación.
- Un `modelos.json` personal antiguo, sin `compactar_en` ni `ventanas`, no instala nada. Al actualizar, el comparador de `modelos.json` avisa «campo nuevo».
- Un modelo sin ventana declarada, o con `ventana − compactar_en` menor que 16384, se omite con aviso; Pi usa entonces su valor por defecto.

## Medición de consumo

Mide cuánto consume cada rol (tokens, turnos y KB leídos) a partir de los logs que dejan Pi y Claude Code. Se corre desde la raíz del proyecto:

`node scripts/consumo.mjs --raiz <carpeta de logs> [--hasta <ISO>] [--tareas <n>] [--json]`

Los logs de Pi están en `~/.pi/agent/sessions/--<proyecto>--/` y los de Claude Code en `~/.claude/projects/<proyecto>/`. Mide el costo, los turnos por tipo y por tramo de contexto, las llamadas a subagentes (`subagents_enable`) y los KB leídos por rol. En Claude Code el costo sale `n/d`. Solo cuenta lecturas hechas con la herramienta `read`; lo que se leyó con `bash` no se mide. No imprime el texto de los mensajes y no escribe ni modifica archivos. `--hasta` no se aplica a los subagentes de Claude Code.

## Registro de eventos

Junta datos de cada ejecución del flujo para detectar errores y mejorar cómo se trabaja con los agentes. El informe que lo resume existe: `node scripts/informe.mjs [--consumo <carpeta de logs>] [--minimo <n>] [--json]`. Se corre tras `registrar.mjs`; escribe `registro/informe.md` (ignorado por git) y lo imprime. Bajo 10 tareas con datos (o bajo `--minimo`) solo da conteos, sin porcentajes ni medianas. Con `--consumo <carpeta>` añade el bloque «Consumo (aproximado)», con costo y turnos totales y por rol, leídos con `consumo.mjs`; sin esa bandera el informe no cambia. `--json` agrega la clave `consumo` con los mismos números.

Se corre desde la raíz del proyecto, con `node scripts/registrar.mjs`: las veces que haga falta y antes de archivar. `--reconstruir` regenera todo el archivo desde cero y `--raiz <dir>` lo apunta a otra raíz.

Produce `registro/eventos.jsonl`. Esa carpeta tiene su propio `.gitignore`, se puede regenerar y no guarda datos personales ni texto libre. Lee solo lo que está en commits, así que lo que no está commiteado no aparece: el historial de las tareas, de `BACKLOG.md` y de `STATUS.md`, y las líneas `Registro:` que el `constructor` agrega a *Notas*.

El modelo que queda registrado es el que indica `modelos.json` al correr el script; conviene correrlo antes de cambiar de modelo.

## Limitaciones

- Solo funciona con Claude Code y Pi. Codex no tiene compactación verificada.
- Está probado en macOS con Node v25.8.1. No declara una versión mínima de Node y no se ha probado en Windows.
- Las corridas con modelo real gastan créditos y no forman parte de `pruebas/rapida.sh`.
- Los agentes no hacen commit, push, PR, merge ni despliegue.
- Si Pi lee las skills de `.pi/skills/` desde un workspace remoto está pendiente de comprobar.

## Contribuir y licencia

Proyecto personal de Franco Morales (`francolmc`). Las propuestas se envían como issue en <https://github.com/francolmc/Flucastr.AI/issues>. Antes de proponer un cambio, corre `bash pruebas/rapida.sh`.

Licencia MIT. El texto completo está en [LICENSE](LICENSE).
