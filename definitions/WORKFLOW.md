# Flujo de trabajo — diseño de `coordinador`, `planificador` y `constructor`

> Estado: **aprobado** (2026-10-29, incluida la sección 9 con las respuestas de Franco a §9.5 y los ajustes de §2 y §3).
> Complementa `PROJECT.md` («Flujo de trabajo»). Este documento define **qué** se construye y las reglas; lo construye una sesión de implementación, no el arquitecto.
> *Confirmado* = dicho por Franco o leído en archivo. *Propuesta* = mía, por aprobar.

## 1. Principios (confirmados por Franco)

1. Franco abre solo el `coordinador`. Los demás roles no se llaman entre sí.
2. Cuatro puertas de aprobación: definición, backlog, cada tarea, revisión y commit.
3. **Las tareas son completas y acotadas a la vez.** Completas: el ejecutor no necesita detenerse a preguntar y termina todo. Acotadas: caben en una sesión.
4. El `planificador` redacta backlog y tareas. Habilitantes primero (andamiaje, despliegue local para e2e…), según el contexto.
5. Aviso a Franco solo por escalación (alcance o algo no previsto); lo demás, en `STATUS.md`.

## 2. Roles

| Rol | Archivo | Escribe | No hace |
|---|---|---|---|
| `coordinador` | `agentes/coordinador.md` | `definitions/STATUS.md`; y el campo `estado` de `BACKLOG.md` y de las tareas, **solo** cuando Franco aprueba de forma explícita en la conversación | Definir, planificar, construir |
| `arquitecto` (listo) | `agentes/arquitecto.md` | `definitions/{PROJECT,REPOS,ARCHITECTURE}.md`, `AGENTS.md`, `initialize.sh` | Planificar, construir |
| `planificador` | `agentes/planificador.md` + skills `crear-backlog`, `descomponer-feature` | `definitions/BACKLOG.md`, `features/**` | Construir, aprobar |
| `constructor` | `agentes/constructor.md` + skill `ejecutar-tarea` | Código del repo de la tarea; solo *Evidencia* y *Notas* de la tarea | Marcar `hecha`, commit, push, PR, merge, despliegue. Git de escritura permitido: crear la rama de la feature (`git switch -c`) y, solo con confirmación expresa de Franco, `git switch <rama>` a una rama existente (§9.1) |

Ramas, refinado y modo yolo: §9. Todos: sin leer `.env`, llaves ni credenciales. Cada rol configura su nivel de modelo en `modelos.json`, a elección de Franco. **Inicialmente `planificador` en medio** (confirmado).

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
- **Bloqueos:** un rol que necesita a otro lo informa en su respuesta final con una primera línea `BLOQUEO: rol=<rol requerido>; motivo=<…>` y se detiene. Solo el `coordinador` escribe en `STATUS.md`, que registra el bloqueo y lo enruta.
- Con Pi, su instrucción debe **autorizar la delegación de forma explícita** (el paquete lo exige: «la complejidad por sí sola no autoriza delegar»).
- Si no puede delegar (herramienta sin subagentes), respaldo: carga el rol como skill en la misma sesión.

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
Estados: `pendiente`, `en curso`, `hecha`. Lista ordenada; la primera pendiente va marcada. Corta y general: nada de detalle de tareas aquí. Antes de ordenar, el `planificador` revisa qué falta para construir y verificar, y lo pone primero como habilitante.

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

Con varios repos, el campo `repo:` de cada tarea indica dónde se ejecuta, y `depende_de:` fija el orden (la API antes que el front). Una feature pasa a `completed/` solo cuando Franco la da por hecha; el estado vive en `BACKLOG.md`.

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

### Qué las hace «acotadas» (propuesta; **cifras a calibrar** con la primera feature real)

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

## 7. Encargo de implementación (para la sesión que construye)

Alcance de escritura: `agentes/`, `skills/`, `modelos.json` y `pruebas/`. Nada más sin aprobación. Sin commit, push, PR, merge ni despliegue. Sin tocar `~/.claude`, `~/.pi` ni `~/.flucastr-ai` en las pruebas (carpetas temporales).

**Orden, con alto para revisión tras cada paso:**

1. **Prueba de subagentes en Pi** (desechable): un agente mínimo que, autorizado, invoque al `arquitecto` por nombre y devuelva su respuesta. Mismo ejercicio en Claude Code. Documentado en `pi-subagents` (leído): herramienta `subagent`, agentes por nombre, delegación solo si el prompt la autoriza; **no ejecutado todavía**. Si falla en Pi, se avisa y se usa el respaldo (skill en la misma sesión).
2. **`planificador`** con sus dos skills y la plantilla de tarea (secciones 4–6).
3. **`coordinador`** (sección 3) y `STATUS.md`.
4. **`constructor`** y `ejecutar-tarea` (sección 6). Va aquí y no más tarde porque sin él no se puede cerrar una feature, que es el criterio de éxito del MVP.
5. **Prueba de punta a punta** con una feature real de un producto de Franco. Es la única prueba grande.

**Resultado del paso 1** (informado por la sesión de implementación, 2026-10-29; no lo reproduje yo):
- Claude Code: OK. Un agente principal con `tools: Agent(arquitecto)` delegó en el arquitecto (1 subagente, 0 fallidos).
- Pi: OK. La herramienta `subagent` delegó en el arquitecto.
- **Consecuencias para el diseño:**
  1. En Claude Code los subagentes no lanzan otros subagentes: el `coordinador` se abre siempre como agente principal (`claude --agent coordinador` / `pi-coordinador`). Coincide con el principio 1. Su lista de herramientas restringe a quién puede delegar: `Agent(arquitecto, planificador, constructor)`.
  2. En Pi, la instrucción del `coordinador` debe autorizar la delegación (ya previsto en §3).
  3. Pi falló con su modelo por defecto (`model_not_found`) y la prueba usó `openai/gpt-6-sol`. **Hipótesis mía, sin verificar:** la prueba copió `agentes/arquitecto.md` (fuente, sin `model`) y no el agente instalado, que sí trae `model` (leído en `~/.pi/agent/agents/arquitecto.md`: `openai/gpt-6.1-sol`). Verificar en el paso 3 que un subagente instalado usa su `model` sin pasarlo a mano.
  4. Una corrida de Pi se colgó sin causa conocida. El lanzador lleva un **tope de tiempo** (*propuesta:* 300 s) para que una corrida colgada no consuma la jornada.
- `pruebas/subagentes/` era desechable: se borra una vez recogido este resultado (decisión de Franco).

**Resultado de los pasos 2 y 3** (informado por la sesión de implementación, 2026-10-29; revisé `agentes/coordinador.md`, `agentes/planificador.md`, las skills y las salidas de la prueba; no ejecuté nada):
- `planificador`, `crear-backlog`, `descomponer-feature` y `coordinador` creados; ambos en nivel medio en `modelos.json`. Capa 1 12/12 y lanzadores 5/5.
- Un subagente instalado de Pi usó el `model` de su archivo generado sin pasarlo a mano (resuelve la hipótesis del paso 1). Tope de 300 s en `pruebas/lanzar-pi.sh`; `pi-coordinador` interactivo no lo tiene.
- Una corrida por herramienta: el `coordinador` delegó en el `planificador`, que creó `BACKLOG.md` en borrador, y se detuvo en la puerta 2 escribiendo `STATUS.md`, sin cambiar estados.
- **No ejercitado:** ruta de `BLOQUEO:`, respaldo sin subagentes, puertas 3 y 4, delegación al `constructor`. Se ejercitan en el paso 5.
- **Observado:** el backlog varía entre corridas (7 features en Claude, 4 en Pi). Es esperable y para eso existe la puerta 2, pero `crear-backlog` no fija un máximo: se añade uno (*propuesta:* hasta 6 features) y se exige que ninguna sea «probar el flujo».
- Los `BACKLOG.md` y `STATUS.md` de esas corridas son de prueba; se borran antes de la corrida real.

**Resultado del paso 4** (informado por la sesión de implementación, 2026-10-29; revisé `agentes/constructor.md`, `skills/ejecutar-tarea/SKILL.md` y el máximo de 6 features en `crear-backlog`; no ejecuté nada):
- `constructor` y `ejecutar-tarea` creados; nivel medio. Capa 1 y lanzadores 17/17.
- Pi: una tarea mínima completa; evidencia real, estado «lista para revisión», sin «hecha» ni commit.
- Claude Code: **no concluyente** por un error de permisos de la propia prueba (comando Bash compuesto denegado). El agente actuó según la skill (no inventó evidencia, informó `BLOQUEO:`). Se cubre en el paso 5, con permisos normales.
- **No ejercitado:** escalación por alcance, `bloqueada` tras dos fallos, rechazo de una tarea no aprobada, varios huecos menores, `repo:` con varios repos.
- **Pendiente para multi-repo:** el constructor no resuelve de dónde sale la ruta de cada `repo:` (`REPOS.md`). No afecta a este repo; se resuelve antes de la prueba del proyecto de dos repos.

**Pruebas: rápidas y acotadas** (decidido por Franco: hoy se pierde mucho tiempo en pruebas):
- Solo comprobaciones deterministas, **sin modelo y sin red**, que corren en segundos. *Propuesta:* toda la suite nueva en menos de ~30 s.
- Qué se comprueba: `instalar.sh` instala los agentes y skills nuevos (la Capa 1 sigue pasando); formato de `BACKLOG.md`, `STATUS.md` y la plantilla de tarea (campos obligatorios, sin «TBD», límites de tamaño de la tarea).
- **Con modelo, una sola corrida por hito**, nunca 3 × 2 herramientas: la prueba de subagentes (paso 1) y la de punta a punta (paso 5). Un fallo se corrige en el rol o la skill, y se repite solo eso.
- No se agregan escenarios, fixtures ni controles negativos nuevos salvo que un fallo real los justifique (regla 5 del `README.md`).

**Dónde se prueba:** primero **en este mismo repo** (`Flucastr.AI`, que ya tiene `definitions/`, así que el flujo parte en «planificar»). Después, el proyecto nuevo de dos repos; después, uno existente.

**Definición de terminado:** una feature real, de un producto de Franco, llega a `lista para revisión` con evidencia y Franco la cierra, habiéndole hablado solo en las cuatro puertas.

## 8. Decisiones de Franco y preguntas abiertas

**Decididas (2026-10-29):**
- Se aprueba este documento.
- `features/` va a la misma altura que `definitions/`, en el espacio de trabajo.
- Cada rol configura su modelo en `modelos.json`; el `planificador` empieza en medio.
- Las cifras de «acotada» (~8 pasos, ~5 archivos, 5 criterios) se aceptan como punto de partida.
- El `constructor` se construye en este mismo bloque, para probar la cadena completa.
- Orden de pruebas reales: (1) este repo, (2) proyecto **nuevo** con dos repos (lo crea Franco; avisará), (3) proyecto **existente**.
- Pruebas rápidas y acotadas (sección 7).
- **Para las pruebas, el `constructor` va en nivel bajo** en `modelos.json` (el `planificador` y el `coordinador`, en medio). Los resultados del paso 5 valen para esa combinación de modelos; si el constructor falla por falta de capacidad y no por una tarea incompleta, se sube de nivel antes de culpar a la tarea.

**Abiertas:**
1. Nombre del proyecto de dos repos, cuando exista.
2. Ese proyecto es nuevo: ejercitará el modo «nuevo» del arquitecto, cuyo escenario formal se retiró de las pruebas (no hay prueba previa de ese camino). Conviene que Franco observe esa corrida con atención.

## 9. Ramas por feature, refinado y modo «yolo» (borrador, F05 y F06)

> *Confirmado* = dicho por Franco (BACKLOG, 2026-10-29). *Propuesta* = redacción mía, por aprobar. Lo marcado **Decisión de Franco** no se puede inferir.

### 9.1 Ramas por feature (F05)

*Confirmado por Franco:* al empezar una feature se crea una rama desde la rama actual; las tareas son commits dentro de ella; al quedar `hecha` la última tarea se avisa por `STATUS.md` para que él cierre la rama, haga el PR y despliegue; los agentes no hacen el PR ni el despliegue salvo que él cambie esa regla.

*Decisión de Franco (2026-10-29):* el `constructor` crea la rama de la feature; Franco hace los commits y el PR.

| Acción | Quién | Cuándo |
|---|---|---|
| Nombrar la rama: `<prefijo>/Fxx-nombre` (`Fxx-nombre` = carpeta en `features/`; prefijo según tipo, ver abajo) | `coordinador`, la escribe en `STATUS.md` («Paso actual», línea `Rama: …`) | Al pasar la feature a `en curso` (con la aprobación de Franco) |
| Crear la rama desde la rama actual | `constructor` | Al empezar la **primera** tarea de la feature, antes de tocar nada |
| Si ya está en esa rama (`git branch --show-current`), no hace nada | `constructor` | Cada tarea siguiente |
| Un commit por tarea, en la rama | **Franco** | En la puerta 4, al pasar la tarea a `hecha` |
| Cerrar la rama, PR, despliegue | **Franco** | Tras el aviso de última tarea `hecha` |

- **Crear la rama:** el `constructor` ejecuta `git switch -c <rama>` desde la rama actual. Es el **único comando git de escritura** que se le permite; no hace commit, push, merge ni `checkout` a otras ramas. `git switch -c` lleva consigo el árbol de trabajo tal cual, así que no pisa cambios. Si el comando falla, `BLOQUEO:` y se detiene. Si la rama ya existe pero no es la actual, ver «Rama ya existente» abajo (`CONFIRMAR:`, no `BLOQUEO:`).
- **Estado de las tareas:** no cambia. Al terminar, la tarea queda `lista para revisión` (cambios sin commit en la rama de la feature); Franco commitea en la puerta 4 y la pasa a `hecha`. Las tareas siguientes arrancan con el árbol que haya dejado Franco.
- **Permisos (para la sesión de implementación; no están en la definición hoy):** la lista de permitidos del `constructor` debe admitir solo `git switch -c *`, `git switch *` y `git branch --show-current`, y seguir denegando `commit`, `push`, `merge`, `checkout`, `reset` y `rebase`. `git switch <rama>` (sin `-c`) se permite en la lista, pero el rol solo lo usa con la confirmación de Franco descrita abajo; sin ella, `agentes/constructor.md` y `ejecutar-tarea` se lo prohíben. `agentes/constructor.md` y `ejecutar-tarea` deben decir lo mismo.
- **Nombre y prefijo (decisión de Franco: prefijo según el tipo de trabajo).** `feature/` (por defecto: capacidad nueva o cambio de comportamiento), `fix/` (corrige un defecto de algo existente), `chore/` (mantenimiento sin cambio de comportamiento: documentación, dependencias, limpieza, pruebas). Lo decide el `coordinador` leyendo la fila de la feature en `BACKLOG.md` y lo deja en `STATUS.md`; ante duda, `feature/`; Franco lo corrige al aprobar. **Opción mínima:** se infiere del texto de la feature, sin columna nueva, para no tocar el formato del backlog que validan las pruebas (la columna «Tipo» existente significa habilitante/producto y no se reutiliza). Resuelto por Franco (2026-10-29): se infiere, sin columna nueva (§9.5).
- **Rama ya existente (decisión de Franco, 2026-10-29).** Si la rama de la feature ya existe y no es la actual, el `constructor` **no** emite `BLOQUEO:` ni hace nada por su cuenta: pide confirmación a Franco para hacer él el `git switch`. Como un subagente no puede preguntar:
  1. El `constructor` se detiene **sin tocar nada** (ni código, ni la tarea, ni la rama; la tarea sigue `aprobada`) y su respuesta empieza con la línea exacta `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>` (por ejemplo `CONFIRMAR: accion=git switch feature/F05-ramas; motivo=la rama ya existe y la actual es main`).
  2. El `coordinador` registra la línea en «Espera a Franco» de `STATUS.md` y **él** se la pregunta a Franco en la conversación. No es puerta de aprobación ni escalación: es una pausa de pregunta, como el refinado (§9.2).
  3. Si Franco responde que sí de forma explícita, el `coordinador` vuelve a delegar la misma tarea al `constructor` indicando en el encargo «Franco confirmó `git switch <rama>`». Solo entonces el `constructor` ejecuta `git switch <rama>` (sin `-c`; solo esa rama), verifica con `git branch --show-current` y sigue la tarea. Sin esa indicación expresa en el encargo, no lo ejecuta. La confirmación vale para esa rama y esa tarea; no se reutiliza. Si el `switch` falla (p. ej. cambios sin commit que chocan), `BLOQUEO:` normal.
  4. Si Franco dice que no (o no responde), el `coordinador` no hace el switch ni reintenta: deja la línea en «Espera a Franco» con «Franco rechazó» o «sin respuesta» y la tarea sigue `aprobada` hasta que Franco decida (cambiar de rama él, renombrar la rama de la feature o dar otra instrucción).
  5. En yolo no aplica: no hay ramas por feature (§9.3).
- El aviso es una línea en «Espera a Franco» de `STATUS.md` («Feature Fxx completa en `feature/Fxx-nombre`: cierra la rama, haz el PR y despliega»). No es escalación.
- Ningún agente hace `commit`, `push`, PR, merge ni despliegue; la regla «sin commit por agentes» se mantiene y solo se añaden las excepciones de crear la rama y, con confirmación de Franco, cambiarse a una rama existente.
- En un proyecto de varios repos, el `constructor` crea la rama con el mismo nombre en el repo de cada tarea, al empezar la primera tarea que lo toque (*propuesta*, sin ejercitar).

### 9.2 Refinado previo (F05)

*Confirmado por Franco:* antes de descomponer una feature ambigua, el `planificador` abre una ventana de refinado con Franco; es un paso previo a la puerta 3 e independiente de las ramas.

*Decisión de Franco (2026-10-29):* aceptado (máximo 5 preguntas con recomendación, `features/Fxx/refinado.md`), pero **solo cuando se requiera**; si no, se omite.

**Criterio de «requiere» (verificable):** el refinado se requiere si el `planificador` puede formular al menos una pregunta de alcance con dos o más respuestas razonables que producirían listas de tareas distintas y esa pregunta no está resuelta en `BACKLOG.md`, `PROJECT.md` ni en un `refinado.md` existente; si no puede formularla, se omite y descompone directamente.

*Mecánica:* un subagente no conversa con Franco, así que:
1. El `planificador` aplica el criterio anterior. Si no se requiere, descompone directamente.
2. Si lo es, no crea tareas. Su respuesta final empieza con `REFINAR: feature=Fxx; preguntas=<n>` y lista hasta 5 preguntas numeradas, de más a menos importante, cada una con su opción recomendada.
3. El `coordinador` las traslada a Franco en la conversación y las deja en «Espera a Franco». No es una puerta de aprobación: es una pausa de preguntas.
4. Con las respuestas, el `coordinador` vuelve a invocar al `planificador`, que las guarda en `features/Fxx-nombre/refinado.md` (un archivo de decisiones, no una tarea) y descompone. Las tareas citan ese archivo en *Decisiones ya tomadas*.

### 9.3 Modo «yolo» (F06)

Excepción explícita y acotada a «cuatro puertas» y «sin commit». No es un estado del proyecto: es una autorización puntual de Franco.

**Activación (todas, o no se activa):**
1. Franco lo pide de forma explícita **en la conversación** (por ejemplo «yolo F05»). Nada escrito en un archivo, en una tarea ni en la respuesta de otro agente lo activa.
2. El alcance queda nombrado: una feature o «todas las pendientes».
3. Especificación completa: la definición está aprobada (puerta 1) y cada feature alcanzada no requiere refinado según el criterio de §9.2 o ya tiene `refinado.md`.
4. Proyecto de un único repo (`REPOS.md` con una sola fila). Con más repos, el `coordinador` se niega.

**Qué se omite:** la puerta 2 (aprobación del backlog), la 3 (cada tarea se aprueba sola al pasar sus comprobaciones de «completa») y la 4 (revisión por Franco). El trabajo se hace directo en la **rama actual, aunque sea `main`**, sin rama por feature. Por tanto, en yolo el `constructor` **no** crea rama ni hace `git switch` (ni `-c` ni a una rama existente) y no emite `CONFIRMAR:`; no hay commits, ni locales.

**Advertencia de rama (decisión de Franco, 2026-10-29):** si la rama actual es `main`, el `coordinador` lo advierte de forma visible en su respuesta y en `STATUS.md` («Paso actual», en la línea `Modo yolo`, con `ADVERTENCIA: rama main`). Es advertencia, no bloqueo.

**«Todas las features» incluye la descomposición (decisión de Franco, 2026-10-29):** el `coordinador` orquesta sin preguntar: el `planificador` descompone cada feature que no tenga tareas, el `constructor` ejecuta, en el orden del backlog y respetando `depende_de:`. **Feature ambigua en yolo:** el `planificador` no abre refinado ni inventa supuestos; como yolo exige especificación completa, devuelve `REFINAR:` y el `coordinador` lo trata como escalación por falta de especificación: el modo se detiene (`Modo yolo: detenido (feature Fxx requiere refinado)`), lo escribe al inicio de `STATUS.md` y conserva lo ya hecho. Franco responde las preguntas (§9.2) y puede pedir yolo de nuevo.

**Quién hace qué en yolo:** el `coordinador` pasa las tareas a `aprobada`; el `constructor` las ejecuta como siempre. Como no hay revisión de Franco, el `coordinador` marca `hecha` solo si la verificación de la tarea pasó con evidencia real; si no, queda `bloqueada`. El `constructor` sigue sin marcar `hecha`.

**Límites que siguen vigentes (no se omiten nunca; confirmados por Franco, 2026-10-29):**
- Credenciales: no se leen `.env` ni llaves; la falta de acceso detiene.
- Push, PR, merge y despliegue: de Franco.
- Escalación por cambio de alcance o algo no previsto: el modo se detiene, lo escribe al inicio de `STATUS.md` y espera.
- Verificación fallida dos veces por la misma causa: `bloqueada` y se detiene.
- Cambios a `definitions/`: nunca en yolo; vuelven a la puerta 1.

**Commits en yolo (decisión de Franco, 2026-10-29: «Franco hace el commit»):** los agentes **no** hacen commit tampoco en yolo; los cambios quedan en el árbol de trabajo de la rama actual para que Franco los revise y commitee. Ni commit local por tarea (resuelto por Franco, 2026-10-29; §9.5).

**Registro en `STATUS.md`** (sin secciones nuevas: el validador exige las cinco existentes): en «Paso actual», primera línea `Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>`, y una línea por tarea cerrada (`task-NN: hecha | bloqueada`, con la ruta). Al terminar o detenerse, la línea pasa a `Modo yolo: terminado` o `Modo yolo: detenido (motivo)`, y «Espera a Franco» lista qué revisar y commitear. El modo no sobrevive a la conversación: en una sesión nueva, una línea `activo` sin pedido de Franco se trata como terminada.

### 9.4 Contradicciones resueltas

| Regla vigente | F05 | F06 |
|---|---|---|
| Los agentes no hacen commit, push, PR, merge ni despliegue | Se mantiene; excepciones: el `constructor` crea la rama (`git switch -c`) y, con confirmación de Franco, hace `git switch <rama>`; los commits son de Franco | Se mantiene; sin commit en yolo (ni locales), y el `constructor` no crea rama ni hace switch |
| Cuatro puertas | Se mantienen; el refinado es una pausa solo si se requiere, no una puerta | Se omiten 2, 3 y 4 solo bajo §9.3 (incluye descomponer sin puerta 3) |
| Aviso solo por escalación | El aviso de feature completa va en «Espera a Franco», no es escalación | Escalación (incluida feature ambigua) sigue deteniendo el modo |
| Franco hace el commit en la puerta 4 | Un commit por tarea, en la rama | Sin puerta 4; sin commits de agentes, Franco commitea al final |

### 9.5 Decisiones de Franco y preguntas abiertas

**Resueltas (Franco, 2026-10-29):**
1. **Commits y ramas.** El `constructor` crea la rama de la feature (al empezar la primera tarea, `git switch -c`; ver también el punto 8 para la rama existente); Franco hace los commits y el PR. Las tareas siguen en «lista para revisión» y Franco commitea en la puerta 4. Detalle en §9.1.
2. **Nombre de rama.** `<prefijo>/Fxx-nombre`, con prefijo `feature/`, `fix/` o `chore/` según el tipo de trabajo (§9.1).
3. **Rama en yolo.** Rama actual, aunque sea `main`, con advertencia visible (no bloqueo) (§9.3).
4. **«Todas las features» en yolo.** Incluye pedir la descomposición; el `coordinador` orquesta todo sin preguntar, con los límites vigentes (§9.3).
5. **Refinado.** Aceptado, solo cuando se requiera según el criterio de §9.2.

6. **Tipo de rama (pregunta 1 anterior).** El `coordinador` infiere `feature/`, `fix/` o `chore/` del texto de la feature; sin columna nueva en `BACKLOG.md` y sin cambios en sus validadores (§9.1).
7. **Yolo sin commits (pregunta 2 anterior).** En yolo todo se trabaja directo en la rama actual, sin rama por feature y sin commits, ni locales; el `constructor` no crea rama (§9.3).
8. **Rama ya existente (pregunta 3 anterior, con cambio).** Sin `BLOQUEO:`: el `constructor` responde `CONFIRMAR: accion=git switch <rama>; motivo=<motivo>`, el `coordinador` la escribe en «Espera a Franco» y se la pregunta a Franco; con su sí explícito se re-delega y el `constructor` hace `git switch <rama>`; con su no, no se hace nada. `git switch *` entra en los permisos solo con esa confirmación (§9.1).

9. **`CONFIRMAR:` en contrato y comprobadores (resuelta, Franco, 2026-10-29).** Sí: la línea `CONFIRMAR:` entra en el contrato del `constructor` y en los comprobadores de contrato y de resultado al implementar, con un control negativo.
10. **Cambios sin commit al cambiar de rama (resuelta, Franco, 2026-10-29).** Si `git switch <rama>` falla (p. ej. cambios sin commit que chocan), basta con `BLOQUEO:` y lo corrige Franco; el `constructor` no evita el intento con el árbol sucio.

**Preguntas abiertas:** ninguna.

## Estado

Aprobado por Franco el 2026-10-29, incluidos §2, §3 y la nueva §9 (F05 y F06, con sus respuestas a §9.5).
