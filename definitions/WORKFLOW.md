# Flujo de trabajo — diseño de `coordinador`, `planificador` y `constructor`

> Estado: **aprobado por Franco (2026-10-30, puerta 1).** El registro de eventos está en [`REGISTRO.md`](REGISTRO.md). *Confirmado* = dicho por Franco o leído en archivo; *propuesta* = por aprobar.

## 1. Principios (confirmados por Franco)

1. Franco abre solo el `coordinador`. Los demás roles no se llaman entre sí.
2. Cuatro puertas de aprobación: definición, backlog, cada tarea, revisión y commit.
3. **Las tareas son completas y acotadas a la vez.** Completas: el ejecutor no necesita detenerse a preguntar y termina todo. Acotadas: caben en una sesión.
4. El `planificador` redacta backlog y tareas. Habilitantes primero (andamiaje, despliegue local para e2e…), según el contexto.
5. Aviso a Franco solo por escalación (alcance o algo no previsto); lo demás, en `STATUS.md`.

## 2. Roles

| Rol | Archivo | Escribe | No hace |
|---|---|---|---|
| `coordinador` | `agentes/coordinador.md` | `definitions/STATUS.md`; y el campo `estado` de `BACKLOG.md` y de las tareas, **solo** cuando Franco aprueba de forma explícita en la conversación. Además corre, solo a pedido explícito de Franco, `scripts/registrar.mjs` y `scripts/archivar.mjs` (§3.1); no escribe otros archivos por su cuenta | Definir, planificar, construir. Ningún otro comando de shell |
| `arquitecto` (listo) | `agentes/arquitecto.md` | `definitions/{PROJECT,REPOS,ARCHITECTURE}.md`, `AGENTS.md`, `initialize.sh` | Planificar, construir |
| `planificador` | `agentes/planificador.md` + skills `crear-backlog`, `descomponer-feature` | `definitions/BACKLOG.md`, `features/**` | Construir, aprobar |
| `constructor` | `agentes/constructor.md` + skill `ejecutar-tarea` | Código del repo de la tarea; solo *Evidencia* y *Notas* de la tarea (en *Notas*, también la línea `Registro:` de `REGISTRO.md`) | Marcar `hecha`, commit, push, PR, merge, despliegue. Git de escritura permitido: crear la rama de la feature (`git switch -c`) y, solo con confirmación expresa de Franco, `git switch <rama>` a una rama existente (§9.1) |

Ramas, refinado y modo yolo: §9. Todos: sin leer `.env`, llaves ni credenciales.
## 3. `coordinador`

Lee `STATUS.md`, `BACKLOG.md` y `features/`, decide el paso siguiente y lo delega como subagente.

| Estado observado | Paso |
|---|---|
| No hay `definitions/` | Delega al `arquitecto`; **puerta 1** |
| Definición aprobada, sin backlog | Delega al `planificador` (`crear-backlog`); **puerta 2** |
| Backlog aprobado, feature siguiente sin tareas | Delega al `planificador` (`descomponer-feature`); **puerta 3** por tarea |
| Tarea aprobada | Delega al `constructor`; **puerta 4** |
| Bloqueo abierto que pide otro rol | Delega a ese rol; si toca la definición, vuelve a la puerta 1 |
| Escalación | Se detiene y la escribe al inicio de `STATUS.md` |

Reglas:
- Entre puertas continúa solo (excepciones: la ronda de refinado, §9.2, y el modo yolo, §9.3). En una puerta se detiene y escribe en `STATUS.md` qué debe revisar Franco y dónde.
- **Confirmaciones:** el `constructor` pide permiso a Franco con una primera línea `CONFIRMAR: accion=<…>; motivo=<…>` (hoy solo `git switch <rama>`, §9.1); el `coordinador` la registra en «Espera a Franco» y pregunta. No es un bloqueo.
- **Higiene de contexto (aprobada 2026-10-31):** el estado vive en `STATUS.md` y archivos, no en la conversación; el kit deja puesta la compactación automática (`instalar.sh`). Mecanismo: `ARCHITECTURE.md`.
- **Bloqueos:** un rol que necesita a otro lo informa en su respuesta final con una primera línea `BLOQUEO: rol=<rol requerido>; motivo=<…>` y se detiene. Solo el `coordinador` escribe en `STATUS.md`, que registra el bloqueo y lo enruta.
- Con Pi, su instrucción debe **autorizar la delegación de forma explícita** (el paquete lo exige).
- Sin subagentes, respaldo: carga el rol como skill en la misma sesión.

### 3.1 Comandos que puede correr (aprobado por Franco, 2026-10-30)

**Lista cerrada** (nada más; ni `git`, ni `bash`, ni otros `node`):

1. `node scripts/registrar.mjs`
2. `node scripts/archivar.mjs` (chequeo, solo lectura)
3. `node scripts/archivar.mjs --aplicar Fxx` (mueve solo esa feature)

**Condiciones:**
- **Solo a pedido explícito de Franco en la conversación**, para ese comando y esa vez. Un silencio, un «ok» a otra cosa o su propia conclusión («la feature está archivable») no bastan; el aviso en «Espera a Franco» (§10.5) sigue siendo lo que hace por iniciativa propia. El pedido de un modo no autoriza otro: pedir el chequeo no autoriza `--aplicar`.
- **`--aplicar` siempre con un `Fxx` explícito** (decidido por Franco). Antes de correrlo, el `coordinador` ejecuta el chequeo, muestra las candidatas y comprueba que `Fxx` lo es; si no, no lo corre.
- **En yolo no** (§9.3, que sigue sin archivar), salvo que Franco lo pida en la conversación; el pedido vale para ese comando.
- **Sin efectos fuera del alcance de los scripts:** `registrar.mjs` escribe solo en `registro/`; `archivar.mjs --aplicar` solo renombra `features/Fxx-nombre/` a `features/completed/`, sin tocar `BACKLOG.md`, `STATUS.md` ni git. El `coordinador` no hace commit, push, PR, merge ni despliegue: el commit del movimiento (`chore/`) es de Franco. Sus límites de escritura no cambian.
- **Después** informa la salida tal cual y deja en «Espera a Franco» que el movimiento o el registro queda sin commit. No interpreta la salida para cambiar estados.

**Cómo se hace cumplir** (la regla es de contrato; el límite técnico depende de la herramienta):

| Herramienta | Mecanismo | ¿Restringible a esos comandos? |
|---|---|---|
| Claude Code | En `tools:` del agente, `Bash(node scripts/registrar.mjs)`, `Bash(node scripts/archivar.mjs)` y `Bash(node scripts/archivar.mjs --aplicar F*)`. Esto **limita, no concede**. | **Sí en alcance; el permiso lo da Franco** (`pruebas/resultados/2026-10-30-coordinador-claude.md`): en modo no interactivo (`dontAsk`) se deniega; en interactivo pide aprobación cada vez, salvo reglas `permissions.allow` (abajo). `F*` deja pasar un argumento extra tras `Fxx`; lo acota el script. |
| Pi | El agente generado declara las herramientas del paquete de subagentes. | **No** (`pruebas/permisos-ejecucion.md`: en Pi no hay confinamiento). Con `bash` tiene shell completo (`git commit`/`push`, `rm`, lectura de `.env`); solo lo frena la instrucción. |

**Permiso en Claude Code (opcional, decisión de Franco; no se instala).** Sin hacer nada, Claude Code pregunta en cada ejecución. Para no aprobar cada vez, Franco puede añadir en `permissions.allow` exactamente: `Bash(node scripts/registrar.mjs)`, `Bash(node scripts/archivar.mjs)` y `Bash(node scripts/archivar.mjs --aplicar F*)`. La condición de «solo a pedido explícito» sigue siendo de contrato, no de la regla `allow`.

**Pi: opción B elegida por Franco** (descartadas: A, sin `bash` en Pi; C, herramienta propia).

**Riesgo aceptado por Franco (opción B).** En Pi el `coordinador` tiene **shell completo**: técnicamente podría correr `git commit`/`push`, `rm`, leer `.env` o cualquier `node`; esas reglas de `AGENTS.md` **no las impide la herramienta**. La contención es solo: (1) la instrucción del agente (lista cerrada, solo a pedido explícito); (2) la puerta 4 revisa todo cambio en `scripts/`; (3) `archivar.mjs` y `registrar.mjs` rechazan argumentos desconocidos. Una violación se vería después (registro, `git status`), no se impediría. En Claude Code el riesgo no existe en esa magnitud.

**Controles compensatorios (F12; `pruebas/resultados/2026-10-30-coordinador-*.md`):** pruebas con modelo en ambas herramientas de que sin pedido explícito no ejecuta nada, no hace commit/push ni lee `.env`, y no corre `--aplicar` sin `Fxx` o con una no candidata; pruebas sin modelo de rechazo de argumentos; `pruebas/permisos-ejecucion.md` documenta que en Pi la contención es solo instruccional.

*Riesgo común:* el `constructor` puede modificar `scripts/*.mjs`, que el `coordinador` ejecuta; la puerta 4 mira todo cambio ahí (`git diff scripts/`, regla 15 de `contrato-roles`).

#### 3.1.1 Decisiones de Franco (2026-10-30, cerradas)
Aprobada la lista cerrada y sus condiciones; `--aplicar` siempre con `Fxx` explícito; Pi: opción B con riesgo aceptado; en Claude Code `tools:` limita y el permiso es aparte.

### `STATUS.md` (propuesta)

```
# Estado del flujo
## Escalación            (vacío si no hay; si hay, es lo primero que se lee)
## Paso actual           (rol, feature, tarea)
## Espera a Franco       (puerta, qué revisar, ruta del archivo)
## Bloqueos abiertos     (quién bloquea, rol requerido, motivo)
## Última actualización  (fecha)
```

## 4. `BACKLOG.md` (propuesta)

Tabla: `ID | Feature | Tipo (habilitante / producto) | Valor | Esfuerzo | Por qué en esta posición | Estado | Siguiente`.
Estados: `pendiente`, `en curso`, `hecha`. Lista ordenada; la primera pendiente va marcada. Corta y general: nada de detalle de tareas aquí. **El tope de 6 features cuenta solo las pendientes** (estado distinto de `hecha`); las filas `hecha` no cuentan, pero se mantienen cortas (§10.3). Antes de ordenar, el `planificador` pone primero como habilitante lo que falte para construir y verificar.

## 5. Estructura de `features/` (decidido: junto a `definitions/`)

```
<espacio de trabajo>/
├── definitions/
└── features/                 # a la misma altura que definitions/
    ├── F01-nombre/
    │   ├── task-01-nombre.md
    │   └── task-02-nombre.md
    └── completed/
        └── F00-nombre/…
```

Con varios repos, el campo `repo:` de cada tarea indica dónde se ejecuta, y `depende_de:` fija el orden (la API antes que el front). Una feature pasa a `completed/` solo cuando Franco la dio por hecha (la fila de `BACKLOG.md` en `hecha`) **y** confirma el archivado: lo hace `scripts/archivar.mjs --aplicar` (§10), nunca un agente por su cuenta. `completed/` es solo archivo: el estado sigue viviendo en `BACKLOG.md`, única fuente de verdad del estado (el script lo lee, nunca lo escribe).

## 6. La tarea: completa y acotada

### Plantilla

```
# task-NN — título
repo: …   depende_de: …   estado: borrador | aprobada | en curso | lista para revisión | hecha | bloqueada

## Descripción      Qué y por qué, 3–5 líneas.
## Contexto         Rutas exactas a leer y a tocar; convenciones del repo; cómo se ejecuta y se prueba.
## Decisiones ya tomadas   Lo que el ejecutor NO debe volver a decidir (librería, nombres, formato…).
## Alcance / Fuera de alcance   Fuera de alcance no puede quedar vacío.
## Pasos            Numerados. Cada uno: archivo, qué cambia, resultado observable.
## Criterios de aceptación   Máximo 5, observables, cada uno con cómo se comprueba.
## Verificación     Comandos exactos y salida esperada.
## Evidencia        Lo llena el constructor: salida real.
## Notas            Lo llena el constructor: decisiones menores tomadas, bloqueos.
```

### Qué las hace «completas» (lista que el `planificador` cumple **antes** de la puerta 3)

- Las rutas y comandos del contexto existen y funcionan: el planificador los leyó en el repo, no los supuso. Puede ejecutar solo comandos **sin efectos sobre archivos versionados** (pruebas, lint, `--help`); los demás se marcan «no ejecutado, inferido» en el *Contexto*.
- No quedan «TBD», «a definir» ni «según corresponda».
- Todo lo que el ejecutor tendría que elegir ya está en *Decisiones ya tomadas*.
- Cada paso termina en algo que se puede ver o ejecutar.
- La verificación se puede correr tal cual está escrita.

### Qué las hace «acotadas» (cifras a calibrar; aceptadas como punto de partida)

- Un solo repo y un solo objetivo verificable.
- Hasta ~8 pasos y ~5 archivos tocados, hasta 5 criterios.
- Al terminar, el repo queda funcionando (nada a medias).
- Si no cabe, el planificador la parte en dos tareas con `depende_de:`; no la entrega grande.

### Reglas del `constructor` para terminar sin detenerse

1. Solo trabaja sobre una tarea `aprobada`.
2. **Ante un hueco menor** (no cubierto por la tarea): elige la opción más conservadora y coherente con la tarea, la anota en *Notas* y **sigue**. No pregunta.
3. **Se detiene solo por:** falta de credenciales o acceso, una decisión que cambia el alcance, o la misma verificación fallando dos veces por la misma causa (queda `bloqueada`). Un cambio de alcance es **escalación**.
4. Ejecuta toda la lista de pasos y la verificación, pega la salida en *Evidencia* y deja `lista para revisión`. Nunca `hecha`.
5. Si hay muchos huecos menores en una tarea, es señal de que el planificador la redactó incompleta: se anota para mejorar la plantilla.

## 7. Encargo de implementación y pruebas

Escritura de la sesión que construye: `agentes/`, `skills/`, `modelos.json` y `pruebas/`; nada más sin aprobación. Las pruebas no tocan `~/.claude`, `~/.pi` ni `~/.flucastr-ai` (carpetas temporales).

**Orden seguido (hecho):** subagentes en ambas herramientas, `planificador`, `coordinador`, `constructor` y prueba de punta a punta; corridas en `pruebas/resultados/`.

**Consecuencias de diseño vigentes:**
- En Claude Code los subagentes no lanzan otros subagentes: el `coordinador` se abre siempre como agente principal (`claude --agent coordinador` / `pi-coordinador`); su `tools:` restringe a quién delega: `Agent(arquitecto, planificador, constructor)`. En Pi, su instrucción debe autorizar la delegación (§3); los lanzadores de Pi llevan tope de 300 s.
- **Modelo por agente (F07):** comprobado en ambas herramientas: un agente instalado corre con el modelo de `modelos.json` sin pasarlo a mano (`pruebas/lanzar-modelos-claude.sh` lee las transcripciones de `~/.claude/projects/`, por eso no usa `--no-session-persistence`; `pruebas/lanzar-modelos-pi.sh` lee `result.details.results[].model`). Vale para los modelos de ese momento; si cambian, se repite (`PROJECT.md`, «Cómo se prueba»).
- `crear-backlog` fija hasta 6 features pendientes (§4) y exige que ninguna sea «probar el flujo».
- **Pruebas rápidas y acotadas** (decidido por Franco): solo comprobaciones deterministas, **sin modelo y sin red**, en segundos (toda la suite nueva en menos de ~30 s): `instalar.sh` instala agentes y skills, y los formatos de `BACKLOG.md`, `STATUS.md` y la plantilla de tarea. **Con modelo, una sola corrida por hito**, nunca 3 × 2 herramientas; un fallo se corrige en el rol o la skill y se repite solo eso. No se agregan escenarios, fixtures ni controles negativos salvo que un fallo real los justifique (regla 5 de `pruebas/README.md`).

**Dónde se prueba:** primero en este repo; después, el proyecto nuevo de dos repos; después, uno existente.

**Definición de terminado:** una feature real, de un producto de Franco, llega a `lista para revisión` con evidencia y Franco la cierra, habiéndole hablado solo en las cuatro puertas.

## 8. Decisiones de Franco y preguntas abiertas

**Decididas (2026-10-29):** se aprueba este documento; `features/` va junto a `definitions/`; cada rol configura su modelo (el `planificador` empieza en medio); las cifras de «acotada» son punto de partida; el `constructor` se construye en el mismo bloque; orden de pruebas reales: este repo, proyecto **nuevo** de dos repos (lo crea Franco; avisará), proyecto **existente**; pruebas rápidas y acotadas (§7). **Para las pruebas el `constructor` va en nivel bajo** (`planificador` y `coordinador`, en medio): los resultados valen para esa combinación; si falla por falta de capacidad y no por una tarea incompleta, se sube de nivel antes de culpar a la tarea.

**Abiertas:** 1. Nombre del proyecto de dos repos, cuando exista. 2. Ese proyecto ejercitará el modo «nuevo» del arquitecto, sin prueba previa; conviene observarla. 3. Multi-repo: el constructor no resuelve de dónde sale la ruta de cada `repo:` (`REPOS.md`).

## 9. Ramas por feature, refinado y modo «yolo»

> *Confirmado* = dicho por Franco (2026-10-29). Lo marcado **Decisión de Franco** no se puede inferir.

### 9.1 Ramas por feature (F05)

*Confirmado:* al empezar una feature se crea una rama desde la rama actual; las tareas son commits dentro de ella; al quedar `hecha` la última tarea se avisa por `STATUS.md` para que Franco cierre la rama, haga el PR y despliegue; los agentes no hacen el PR ni el despliegue. *Decisión de Franco:* el `constructor` crea la rama; Franco hace los commits y el PR.

**Quién y cuándo:** el `coordinador` nombra la rama `<prefijo>/Fxx-nombre` (`Fxx-nombre` = carpeta en `features/`) en `STATUS.md` («Paso actual», línea `Rama: …`) al pasar la feature a `en curso`; el `constructor` la crea al empezar la **primera** tarea, antes de tocar nada, y en las siguientes no hace nada si `git branch --show-current` ya la muestra; **Franco** hace un commit por tarea en la puerta 4 y cierra la rama, el PR y el despliegue tras el aviso de última tarea `hecha`.

- **Crear la rama:** `git switch -c <rama>` desde la rama actual. Es el **único comando git de escritura** del `constructor` (más `git switch <rama>` con confirmación, abajo); no hace commit, push, merge ni `checkout`. `git switch -c` lleva consigo el árbol tal cual, así que no pisa cambios. Si falla, `BLOQUEO:` y se detiene.
- **Estado de las tareas:** no cambia. Al terminar, la tarea queda `lista para revisión` (cambios sin commit en la rama); Franco commitea en la puerta 4 y la pasa a `hecha`.
- **Permisos:** la lista de permitidos del `constructor` admite solo `git switch -c *`, `git switch *` y `git branch --show-current`, y deniega `commit`, `push`, `merge`, `checkout`, `reset` y `rebase`; `git switch <rama>` solo se usa con la confirmación de Franco (`agentes/constructor.md` y `ejecutar-tarea` lo dicen igual).
- **Nombre y prefijo (decisión de Franco: según el tipo de trabajo).** `feature/` (por defecto: capacidad nueva o cambio de comportamiento), `fix/` (corrige un defecto), `chore/` (mantenimiento sin cambio de comportamiento: documentación, dependencias, limpieza, pruebas). Lo infiere el `coordinador` del texto de la fila en `BACKLOG.md`, sin columna nueva (la columna «Tipo» significa habilitante/producto y no se reutiliza); lo deja en `STATUS.md`; ante duda, `feature/`; Franco lo corrige al aprobar.
- **Rama ya existente (decisión de Franco).** Si la rama de la feature ya existe y no es la actual, el `constructor` **no** emite `BLOQUEO:`: pide confirmación a Franco. Como un subagente no puede preguntar:
  1. Se detiene **sin tocar nada** (ni código, ni la tarea, ni la rama; la tarea sigue `aprobada`) y su respuesta empieza con `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`.
  2. El `coordinador` registra la línea en «Espera a Franco» y **él** se la pregunta a Franco. No es puerta ni escalación: es una pausa de pregunta.
  3. Si Franco responde que sí de forma explícita, el `coordinador` re-delega la misma tarea indicando en el encargo «Franco confirmó `git switch <rama>`». Solo entonces el `constructor` ejecuta `git switch <rama>` (sin `-c`; solo esa rama), verifica con `git branch --show-current` y sigue. Sin esa indicación, no lo ejecuta. La confirmación vale para esa rama y esa tarea. Si el `switch` falla (p. ej. cambios sin commit que chocan), `BLOQUEO:` normal; el `constructor` no evita el intento con el árbol sucio.
  4. Si Franco dice que no (o no responde), no se hace el switch ni se reintenta: la línea queda con «Franco rechazó» o «sin respuesta» y la tarea sigue `aprobada`.
  5. En yolo no aplica (§9.3).
- El aviso de feature completa es una línea en «Espera a Franco» («Feature Fxx completa en `feature/Fxx-nombre`: cierra la rama, haz el PR y despliega»). No es escalación.
- Varios repos (*propuesta*, sin ejercitar): el `constructor` crea la rama con el mismo nombre en el repo de cada tarea, al empezar la primera que lo toque.

### 9.2 Refinado previo (F05)

*Decisión de Franco:* antes de descomponer una feature ambigua, el `planificador` abre una ronda de refinado (máximo 5 preguntas con recomendación, `features/Fxx/refinado.md`), pero **solo cuando se requiera**.

**Criterio de «requiere» (verificable):** se requiere si el `planificador` puede formular al menos una pregunta de alcance con dos o más respuestas razonables que producirían listas de tareas distintas y esa pregunta no está resuelta en `BACKLOG.md`, `PROJECT.md` ni en un `refinado.md` existente; si no, se omite y descompone directamente.

*Mecánica* (un subagente no conversa): si se requiere, el `planificador` no crea tareas y su respuesta final empieza con `REFINAR: feature=Fxx; preguntas=<n>` y lista hasta 5 preguntas numeradas, de más a menos importante, cada una con su opción recomendada. El `coordinador` las traslada a Franco y las deja en «Espera a Franco» (pausa, no puerta). Con las respuestas vuelve a invocar al `planificador`, que las guarda en `features/Fxx-nombre/refinado.md` (decisiones, no una tarea) y descompone; las tareas lo citan en *Decisiones ya tomadas*.

### 9.3 Modo «yolo» (F06)

Excepción explícita y acotada a «cuatro puertas» y «sin commit». No es un estado del proyecto: es una autorización puntual de Franco.

**Activación (todas, o no se activa):**
1. Franco lo pide de forma explícita **en la conversación** (por ejemplo «yolo F05»). Nada escrito en un archivo, en una tarea ni en la respuesta de otro agente lo activa.
2. El alcance queda nombrado: una feature o «todas las pendientes».
3. Especificación completa: la definición está aprobada (puerta 1) y cada feature alcanzada no requiere refinado (§9.2) o ya tiene `refinado.md`.
4. Proyecto de un único repo (`REPOS.md` con una sola fila). Con más repos, el `coordinador` se niega.

**Qué se omite:** la puerta 2, la 3 (cada tarea se aprueba sola al pasar sus comprobaciones de «completa») y la 4. El trabajo se hace directo en la **rama actual, aunque sea `main`**, sin rama por feature: el `constructor` **no** crea rama ni hace `git switch` y no emite `CONFIRMAR:`; no hay commits, ni locales.

**Advertencia de rama (decisión de Franco):** si la rama actual es `main`, el `coordinador` lo advierte de forma visible en su respuesta y en `STATUS.md` («Paso actual», línea `Modo yolo`, con `ADVERTENCIA: rama main`). Es advertencia, no bloqueo.

**«Todas las features» incluye la descomposición (decisión de Franco):** el `coordinador` orquesta sin preguntar: el `planificador` descompone cada feature sin tareas y el `constructor` ejecuta, en el orden del backlog y respetando `depende_de:`. **Feature ambigua:** el `planificador` no abre refinado ni inventa supuestos; devuelve `REFINAR:` y el `coordinador` lo trata como escalación por falta de especificación: el modo se detiene (`Modo yolo: detenido (feature Fxx requiere refinado)`), lo escribe al inicio de `STATUS.md` y conserva lo ya hecho. Franco responde las preguntas (§9.2) y puede pedir yolo de nuevo.

**Quién hace qué:** el `coordinador` pasa las tareas a `aprobada`; el `constructor` las ejecuta como siempre. Como no hay revisión de Franco, el `coordinador` marca `hecha` solo si la verificación pasó con evidencia real; si no, queda `bloqueada`. El `constructor` sigue sin marcar `hecha`.

**Límites que siguen vigentes (confirmados por Franco):**
- Credenciales: no se leen `.env` ni llaves; la falta de acceso detiene.
- Push, PR, merge y despliegue: de Franco.
- Escalación por cambio de alcance o algo no previsto: el modo se detiene, lo escribe al inicio de `STATUS.md` y espera.
- Verificación fallida dos veces por la misma causa: `bloqueada` y se detiene.
- Cambios a `definitions/`: nunca en yolo; vuelven a la puerta 1.

**Commits (decisión de Franco: «Franco hace el commit»):** los agentes no commitean tampoco en yolo; los cambios quedan en el árbol de la rama actual para que Franco los revise y commitee.

**Registro en `STATUS.md`** (sin secciones nuevas: el validador exige las cinco): en «Paso actual», primera línea `Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>`, y una línea por tarea cerrada (`task-NN: hecha | bloqueada`, con la ruta). Al terminar o detenerse pasa a `Modo yolo: terminado` o `Modo yolo: detenido (motivo)`, y «Espera a Franco» lista qué revisar y commitear. El modo no sobrevive a la conversación: en una sesión nueva, una línea `activo` sin pedido de Franco se trata como terminada.

### 9.4 Contradicciones resueltas

Se mantienen «sin commit, push, PR, merge ni despliegue por agentes» y las cuatro puertas; solo hay las excepciones de §9.1 (crear la rama; con confirmación, `git switch`), §9.2 (pausa de refinado, no puerta) y §9.3 (yolo). El aviso de feature completa va en «Espera a Franco», no es escalación.

### 9.5 Decisiones de Franco y preguntas abiertas

**Resueltas (Franco, 2026-10-29):** todas las decisiones de §9.1 a §9.3 (commits y ramas, prefijo `feature/`/`fix/`/`chore/` inferido del texto, yolo en la rama actual sin commits y con advertencia en `main`, «todas las features» con descomposición, refinado solo cuando se requiera, rama existente con `CONFIRMAR:`) y: la línea `CONFIRMAR:` entra en el contrato del `constructor` y en los comprobadores de contrato y de resultado, con un control negativo; si `git switch <rama>` falla, basta `BLOQUEO:` y lo corrige Franco.

**Preguntas abiertas:** ninguna.

## 10. Limpieza, chequeo de contexto y archivo de lo terminado

> Aprobado en la puerta 1 (2026-10-30), incluido §10.5. Cifras: **a calibrar** con la primera corrida real.

### 10.1 Qué choca y cómo se resuelve

Se mantienen: `completed/` solo con Franco que da la feature por hecha (§5; ahora el medio es el script); `BACKLOG.md` única fuente de verdad (el script lee estados, nunca los escribe); tope de 6 pendientes (implementado en `formato-flujo.mjs` y `crear-backlog`); ningún agente mueve carpetas por su cuenta (§2).

### 10.2 Archivar: `scripts/archivar.mjs`

Un solo script de Node, sin dependencias ni red, con dos modos:

- **Chequeo** (por defecto, solo lectura): imprime el informe de §10.4 y la lista de candidatas. Siempre termina con código 0; es un aviso, no una puerta.
- **`--aplicar`**: mueve las candidatas; con `--aplicar Fxx`, solo esa. Lo corre **Franco** o, a su pedido explícito, el `coordinador` con las condiciones de §3.1 (en Pi, con el riesgo aceptado allí); el commit sigue siendo de Franco.

**Candidata** (todas, o no se mueve): (1) la fila de la feature en `BACKLOG.md` está `hecha`; (2) todas las `task-*.md` de su carpeta están `hecha`; (3) existe `features/Fxx-nombre/` y el nombre coincide con el ID; (4) no existe ya `features/completed/Fxx-nombre/`. Si algo no coincide (fila `hecha` con una tarea que no lo está, carpeta sin fila, destino ocupado), no mueve nada de esa feature y lo informa; **no corrige estados**.

**Qué hace al mover:** `features/Fxx-nombre/` completa (tareas, `refinado.md` y lo demás) pasa a `features/completed/Fxx-nombre/`: solo renombra, sin sobrescribir ni borrar. Lista lo movido. No toca `BACKLOG.md`, `STATUS.md`, ramas ni git: los cambios quedan sin commit para que Franco los commitee (un `chore/`).

**Tareas `hecha` de una feature que aún no está `hecha`:** se quedan en su carpeta (moverlas rompería `depende_de:` y el contexto de `planificador` y `constructor`).

### 10.3 Filas `hecha` del backlog

- **Se quedan en `BACKLOG.md`** aun archivada la feature: es la fuente de verdad del estado y de las dependencias de orden. Descartado un segundo archivo de estado.
- **Se mantienen cortas.** Una fila `hecha` conserva ID, feature, tipo, estado y una línea de «Por qué» (hasta ~300 caracteres) más la ruta `features/completed/Fxx-nombre` cuando está archivada. Compactarlas es del `planificador` (único que escribe `BACKLOG.md`), a pedido de Franco o sugerido por el chequeo, y pasa por la puerta 2. Igual para las viñetas de «Base de la prioridad» que solo expliquen features `hecha`.
- **Tope:** las `hecha` no cuentan para el máximo de 6; sí cuentan en el informe de tamaño.

### 10.4 Chequeo de contexto: qué leen los agentes y cómo se mantiene liviano

Qué entra al contexto, por rol (*confirmado* por los contratos de §2 y §3):

| Se lee siempre | Se lee bajo demanda | No se lee salvo pedido explícito |
|---|---|---|
| `AGENTS.md`, `definitions/STATUS.md`, `definitions/BACKLOG.md` | `definitions/{PROJECT,WORKFLOW,ARCHITECTURE,REPOS}.md` (por rol y paso), las tareas y `refinado.md` de la feature en curso | `features/completed/**` y `registro/` |

El `coordinador` y el `planificador` listan `features/` sin entrar en `completed/`. El chequeo imprime, sin juzgar el contenido:

1. Tamaño (caracteres y líneas) de los archivos de «se lee siempre» y de `definitions/*.md`, con aviso si superan un umbral: `STATUS.md` > 3 KB, `BACKLOG.md` > 8 KB, `AGENTS.md` > 2 KB; los de definición > 30 KB (informativo).
2. Filas `hecha` del backlog con su largo, marcando las de más de ~300 caracteres.
3. Features candidatas a archivar (§10.2) y las inconsistentes.
4. Carpetas de `features/` con todas sus tareas `hecha` pero fila no `hecha` (solo informa; el estado lo decide Franco).

**El script** mide, lista y mueve las candidatas bajo confirmación; no decide estados ni edita, borra, resume o recorta contenido. Acortar un documento de definición (p. ej. `WORKFLOW.md`) es del `arquitecto` por la puerta 1; acortar el backlog, del `planificador` por la puerta 2.

### 10.5 Cuándo ocurre

1. Al quedar `hecha` la última tarea de una feature y Franco darla por hecha (aviso de §9.1), el `coordinador` añade a «Espera a Franco» el comando `node scripts/archivar.mjs` (chequeo) o `node scripts/archivar.mjs --aplicar Fxx` (archivar), y `node scripts/registrar.mjs` antes. **No los corre por iniciativa propia:** si Franco se lo pide en la conversación, los corre según §3.1; si no, Franco los corre cuando quiera y commitea el movimiento.
2. Antes de la puerta 3 (descomponer una feature nueva), el `coordinador` deja en «Espera a Franco» el comando del chequeo; no bloquea y no lo corre sin pedido de Franco.
3. Franco puede correrlo, o pedírselo al `coordinador`, cuando quiera.
4. En yolo no se archiva; queda para después, salvo pedido explícito de Franco (§3.1).

### 10.6 Decisiones de Franco y preguntas abiertas

**Aprobadas en la puerta 1 (2026-10-30):** (1) `--aplicar` lo corre Franco o, a su pedido, el `coordinador` (§3.1, §10.5); (2) las tareas viajan con su feature, no sueltas; (3) las filas `hecha` se quedan y las compacta el `planificador`; (4) umbrales de §10.4 a calibrar.

**Abiertas:** ¿archivar antes o después del PR? (recomendado: después, en su propio commit `chore/`); ¿se aceptan los umbrales de §10.4 como punto de partida?

## Estado

Aprobado por Franco el 2026-10-29 (base, §2, §3, §9) y el 2026-10-30 (§3.1, §4, §5, §7, §10). Mantenimiento sin cambio de reglas: **aprobado por Franco el 2026-10-30.**
