# Flujo de trabajo — diseño de `coordinador`, `planificador` y `constructor`

> Estado: **aprobado por Franco** (2026-10-29), con las decisiones de la sección 8.
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
| `constructor` | `agentes/constructor.md` + skill `ejecutar-tarea` | Código del repo de la tarea; solo *Evidencia* y *Notas* de la tarea | Marcar `hecha`, commit, push, PR, merge, despliegue |

Todos: sin leer `.env`, llaves ni credenciales. Cada rol configura su nivel de modelo en `modelos.json`, a elección de Franco. **Inicialmente `planificador` en medio** (confirmado).

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
- Entre puertas continúa solo. En una puerta se detiene y escribe en `STATUS.md` qué debe revisar Franco y dónde.
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

## Estado

Aprobado por Franco el 2026-10-29.
