# Registro de eventos del flujo — diseño de F10

> Estado: **borrador, por aprobar en la puerta 1** (2026-10-30). Franco aclaró el cometido de F10: **generar el registro** (los datos del flujo) para saber cómo van los resultados y sacar mejoras y features nuevas. El informe es una etapa posterior y opcional (no es F10).
> Nota (2026-10-30): el permiso del `coordinador` para correr este script quedó **aprobado** (`WORKFLOW.md` §3.1); el resto de F10 sigue como borrador por aprobar.
> *Confirmado* = dicho por Franco o leído/medido en el repo. *Inferido* = deducido. *Propuesta* = mía, por aprobar. No leí `.env` ni credenciales; no ejecuté nada salvo lecturas de `git log`.
> Se lee bajo demanda (arquitecto, planificador al descomponer F10, constructor en sus tareas). **Los agentes del flujo no leen `registro/` en su trabajo normal.**

## 0. Hallazgo que condiciona el diseño (confirmado)

Medí el historial de este repo: de 47 tareas, **23 aparecen en un solo commit** de su archivo (llegan ya en `hecha`), 9 en dos, 12 en tres, 2 en cuatro, 1 en cinco. Franco commitea en la puerta 4, así que `git log` conserva el estado final y pocos estados intermedios (`borrador`, `aprobada`, `lista para revisión`, devuelta). Un registro derivado **solo** de git nace con los tiempos y el retrabajo borrosos. Lo que git no guarda (intentos, bloqueos resueltos antes del commit, huecos menores) solo existe si alguien lo anota en el momento. Por eso la recomendación es mixta (§3).

## 1. Qué se registra

Un evento por línea. Campos comunes: `v` (versión del esquema, `1`), `id` (determinista, §2), `t` (fecha del commit, ISO `AAAA-MM-DDThh:mm:ssZ`), `fuente` (`git` | `notas` | `status`), `evento`, `feature` (`Fxx`), `tarea` (`NN`, si aplica), `sha` (7 hex, si viene de un commit).

| Evento | Campos propios | De dónde sale | Qué responde |
|---|---|---|---|
| `tarea_estado` | `de`, `a` (los estados de `WORKFLOW.md` §6), `por` (`franco` \| `coordinador` \| `constructor` \| `planificador`, *inferido* por las reglas del rol, no medido) | Historial de git del campo `estado` de cada `task-*.md`, también las archivadas | Cuánto tarda cada tarea en avanzar; cuántas se estancan |
| `puerta` | `n` (`3` \| `4`), `resultado` (`aprobada` \| `devuelta`), `por` (`franco` \| `coordinador`) | Derivado de `tarea_estado`: `borrador→aprobada` = puerta 3; `lista para revisión→hecha` = puerta 4 aprobada; `lista para revisión→aprobada\|en curso` = puerta 4 devuelta | Tasa de devolución; calidad de lo que llega a Franco |
| `feature_estado` | `de`, `a` (`pendiente` \| `en curso` \| `hecha`) | Historial de git de la fila de `BACKLOG.md` | Duración de una feature; cuántas por semana |
| `feature_archivada` | — | Renombre `features/Fxx-*` → `features/completed/Fxx-*` en git | Cierre efectivo |
| `ejecucion` | `n` (ejecución 1, 2…), `herramienta` (`claude-code` \| `pi`), `modo` (`normal` \| `yolo`), `intentos` (verificaciones corridas, entero), `verificacion` (`pasa` \| `falla` \| `parcial`), `huecos` (huecos menores anotados, entero), `resultado` (`lista` \| `bloqueada` \| `escalada` \| `confirmar`), `causa` (`credenciales` \| `alcance` \| `verificacion_x2` \| `rama` \| `otra` \| `ninguna`), `modelo` (*configurado*, §3) | Línea `Registro:` que el `constructor` agrega a *Notas* (§3) | Calidad de las tareas (huecos), fiabilidad del constructor (intentos, bloqueos), efecto del modelo, yolo frente a normal |
| `escalacion` | — | Historial de git de `STATUS.md`: la sección «Escalación» pasa de vacía a con texto (solo si se commiteó) | Frecuencia de cambios de alcance |

**No capturado, y se dice:** puerta 1 y puerta 2 (no tienen un estado por tarea; queda para un campo futuro si hace falta); tiempo real de trabajo de un agente (sin reloj: el `coordinador` no tiene Bash y al `constructor` habría que darle `date`, pregunta 3); tokens y costo (las herramientas no lo dan a archivos); `CONFIRMAR:` y `REFINAR:` que Franco contestó en la conversación (entran solo si el `constructor` los anota en `resultado=confirmar`); el motivo por el que Franco devolvió una tarea (texto libre, excluido por privacidad, §5).

## 2. Formato y ubicación (propuesta)

- **Archivo:** `registro/eventos.jsonl` en la raíz del espacio de trabajo donde corre el flujo (en este repo, la raíz de `Flucastr.AI`). JSON Lines: una línea, un evento, claves en orden fijo, UTF-8.
- **Fuera de lo que se lee por defecto:** no está en `definitions/` ni en `features/`; no es parte de «se lee siempre» (`WORKFLOW.md` §10.4). Se añade a la columna «no se lee salvo pedido explícito». El `coordinador` y el `planificador` ya listan sin entrar en carpetas ajenas a su trabajo. `instalar-remoto.sh` no lo distribuye (su lista permitida no incluye `registro/`).
- **No va en git: se ignora.** El script crea `registro/.gitignore` con `*` (se ignora a sí mismo y al log, sin tocar el `.gitignore` del proyecto). *Por qué:* (1) todo evento sale de archivos que **sí** están en git (estados, *Notas*, `STATUS.md`) más el historial, así que el log es un **índice reproducible**, no una fuente de verdad (coincide con «una fuente de verdad», `PROJECT.md`); (2) en repos públicos nada sale por accidente; (3) los commits de Franco no se ensucian con cada corrida. *Descartado:* versionarlo (duplica lo que git ya guarda, publica datos de trabajo, genera conflictos en PR). *Qué lo cambiaría:* trabajar desde dos PC sin compartir el historial de git; ahí se versionaría o se haría central (pregunta 2).
- **Solo añadir e idempotente:** cada evento lleva `id` = primeros 12 hex del SHA-1 de `fuente|ruta|clave del hecho` (por ejemplo `git|features/F09-…/task-01-…md|<sha del commit>|estado|aprobada>hecha`). Correr el script de nuevo añade solo los `id` que no existan; el resultado es el mismo archivo. `--reconstruir` lo regenera entero, ordenado por `t` e `id`, escribiendo a un temporal y renombrando.
- **Crecimiento:** ~10 eventos por tarea y ~200 bytes por línea = unos 2 KB por tarea; 500 tareas al año son ~1 MB. **Sin rotación en F10** (nada nuevo sin dolor real); el script avisa si pasa de 1 MB. Al ser regenerable, perder el archivo no pierde datos. Si algún día pesa, se parte por año (`eventos-AAAA.jsonl`); decisión para entonces.

## 3. Quién lo escribe: comparación y recomendación

| Opción | Cómo | Qué da | Qué pierde | Costo en permisos |
|---|---|---|---|---|
| (a) Script que deriva | `scripts/registrar.mjs` lee estados, *Notas*, `STATUS.md` y `git log` | Reproducible; **rellena el pasado** (F01–F09 salen hoy); no cambia a nadie | Todo lo que no llegó a un commit: estados intermedios, intentos, bloqueos resueltos, `CONFIRMAR:`; el tiempo es el del commit, no el del trabajo | Ninguno |
| (b) Agentes escriben el log | `coordinador` y `constructor` agregan eventos a `registro/` | Detalle en el momento | Hay que darles escritura nueva; un archivo crece y habría que leerlo para añadir (contexto); se contradice con «el log no se lee» | Mayor (`coordinador` sin Bash solo puede Write/Edit, no añadir sin leer) |
| (c) Mixto mínimo | (a) + el `constructor` agrega una línea a *Notas* por ejecución | Todo lo de (a) más intentos, huecos, bloqueos, modo, herramienta | Sigue sin tiempo de trabajo ni tokens | **Ninguno nuevo**: el `constructor` ya escribe *Notas*; cambia su contrato |

**Recomendación: (c), en ese orden.** Tu inclinación inicial (partir por el script) se mantiene como primer paso y se completa con un solo cambio: la línea de *Notas*. *Por qué no (a) sola:* con 23 de 47 tareas en un solo commit, los datos de retrabajo y de fiabilidad del constructor (los más útiles para mejorar) no existirían, y no se pueden reconstruir después. *Por qué no (b):* añade permisos y lee el log para escribirlo, lo opuesto a F08.

**La línea `Registro:`** (convención como `BLOQUEO:` y `CONFIRMAR:`; el `constructor` la añade al final de *Notas* al terminar **cada ejecución**, incluida una que termine en `bloqueada`, `escalada` o `confirmar`; en yolo también, con `modo=yolo`):

```
Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
```

El script la lee con un patrón estricto (claves y valores de la tabla de §1; lo desconocido se ignora y se cuenta como «líneas no válidas»). Una línea por ejecución: una segunda línea en la misma tarea significa que Franco la devolvió o que se re-delegó, sin escribir nada más. Es solo texto en un archivo que ya existe y que va a git con la tarea.

**`modelo`:** el script lo toma de `modelos.json` (nivel del `constructor` → modelo de la herramienta) **al momento de correrlo**. Es el modelo *configurado*, no el *medido* (F07 comprobó que el agente instalado corre con el configurado, `WORKFLOW.md` §7); si cambias `modelos.json`, corre el script antes. El evento lleva `modelo` solo en `ejecucion`.

**Quién corre el script:** Franco o, a su pedido explícito, el `coordinador` (`WORKFLOW.md` §3.1, aprobado por Franco el 2026-10-30; antes: solo Franco porque el `coordinador` no tenía Bash). Es seguro correrlo cuando quiera y las veces que quiera. Lo recomendable: justo antes de archivar (`archivar.mjs` mueve carpetas; el script sigue los renombres con `git log --follow`, pero conviene el orden). El `coordinador` deja el comando en «Espera a Franco» junto al de archivar (`WORKFLOW.md` §10.5). **No es una puerta ni bloquea nada:** si no se corre, solo se atrasa el log.

**Qué se pierde en esta opción:** lo de la lista «No capturado» (§1) y, en yolo, la secuencia: los agentes no commitean, así que todos los cambios de estado de una corrida yolo llegan a git en el commit de Franco con la misma fecha; el detalle por tarea lo aporta solo la línea `Registro:`.

## 4. Cómo encaja con el flujo

- **No es una puerta ni un rol nuevo.** Nadie espera por él. Sin permisos nuevos: ni el `coordinador`, ni el `planificador`, ni el `constructor` escriben fuera de lo que ya escriben.
- **Modo yolo (§9.3):** no cambia. Los agentes siguen sin commitear; el `constructor` anota `modo=yolo` en `Registro:`; las transiciones de estado en yolo se registran con `por=coordinador` en `puerta`. El script no corre dentro de yolo (lo corre Franco después, junto al archivado, que tampoco se hace en yolo).
- **Con varios repos:** el log es por espacio de trabajo y registra la tarea con su `repo:` solo si el patrón lo admite (campo `repo` = nombre del repo, validado contra `REPOS.md`; *propuesta sin ejercitar*, igual que el resto del multi-repo).
- **F08:** `registro/` queda fuera de lo que los agentes leen; no engorda el contexto.

## 5. Privacidad (el repo es público desde F09)

**Va:** identificadores (`Fxx`, `NN`), estados, enteros (intentos, huecos, `n`), valores de las listas cerradas de §1, fecha y hora del commit, `sha` corto, nombre de herramienta y nombre de modelo (público, de `modelos.json`).

**No va, nunca:** contenido de *Evidencia* o *Notas* (salvo la línea `Registro:` ya validada), de conversaciones, de `STATUS.md` o de mensajes de commit; títulos y descripciones de features y tareas (pueden nombrar productos o clientes); nombre y correo del autor (`%an`, `%ae`) y cualquier dato personal; rutas absolutas (solo relativas al espacio de trabajo); nombres de rama; valores de variables de entorno; cualquier cosa leída de `.env`. El script **no abre** `.env*` ni llaves.

**Cómo se garantiza (por construcción, no por revisión):** el escritor emite solo claves de una lista cerrada y, para cada una, valida el valor contra un patrón o lista (`Fxx` = `^F\d{2}$`, `sha` = `^[0-9a-f]{7}$`, enteros acotados, enums). Un evento que no pasa se descarta y se cuenta. No hay un campo de texto libre en el esquema. Además el archivo está ignorado por git (§2): aun si algo fallara, no llega al remoto público por un `git add`.

## 6. Cómo se prueba (sin modelo ni red)

Un archivo `pruebas/comprobaciones/registro-eventos.test.mjs` (nombre aproximado; `registro.mjs` ya existe para otra cosa) que, en una carpeta temporal, hace `git init`, fija `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE`, y arma commits con tareas que cambian de estado. Segundos, dentro del tope de `rapida.sh`; si no cabe, archivo propio fuera de `rapida.sh` (como `remoto.test.mjs`). Casos, cada uno con control negativo:

1. **Estados → eventos:** una tarea que pasa por `borrador`, `aprobada`, `lista para revisión`, `hecha` en cuatro commits da los `tarea_estado` y `puerta` esperados; una devolución da `puerta` con `resultado=devuelta`. Control negativo: un commit que no toca el campo `estado` no genera evento.
2. **Línea `Registro:`:** dos líneas válidas dan dos `ejecucion` con `n` 1 y 2; una con valor fuera de la lista (`resultado=otro`) se descarta y se cuenta.
3. **Idempotencia:** dos corridas seguidas dan el archivo **idéntico byte a byte**; un commit nuevo añade solo sus eventos; `--reconstruir` reproduce el mismo contenido.
4. **Privacidad:** el repo de prueba lleva un autor con correo y nombre canario, un título de tarea con un nombre de cliente canario, *Evidencia* y *Notas* con una «llave» canario y un mensaje de commit con otro. Ninguno aparece en `eventos.jsonl`. Control negativo: un validador que recibe a mano un evento con un campo `autor` o un `t` con texto lo rechaza.
5. **Aislamiento:** `registro/.gitignore` existe y `git status` no lista `registro/`; el script no lee `.env*` (un `.env` canario en la raíz no se abre; se comprueba que no figura en los accesos) y no escribe fuera de `registro/`.
6. **Renombres:** una tarea movida por `archivar.mjs` conserva su historial en el log (sin duplicar eventos).

Lo que **no** se prueba y queda para uso real: que el `constructor` escriba bien la línea `Registro:` con un modelo (se ve en la primera tarea de verdad; si no la escribe o la escribe mal, se corrige la skill `ejecutar-tarea`, una corrida).

## 7. Partición recomendada de F10 (dos o tres tareas; el informe, aparte)

1. **task-01, extracción derivada:** `scripts/registrar.mjs` (modos por defecto y `--reconstruir`, `--raiz`), esquema y validador de §1 y §5, `registro/.gitignore`, pruebas 1, 3, 4, 5 y 6. Sin cambios en agentes. Sale con F01–F09 ya rellenos (relleno retroactivo de lo que git guarde).
2. **task-02, línea `Registro:`:** contrato del `constructor` (`agentes/constructor.md`, `skills/ejecutar-tarea/SKILL.md`), validadores/comprobadores de contrato y de formato (control negativo), lectura en el script (prueba 2). Depende de 1.
3. **task-03, uso y documentación:** `README.md` y `pruebas/README.md`, el comando en la lista de «Espera a Franco» del `coordinador` (junto a `archivar.mjs`) y la regla «`registro/` no se lee» en `AGENTS.md`/contratos. Puede fusionarse con la 2 si cabe; el `planificador` decide al descomponer según los límites de «acotada».

El **informe** (cuáles preguntas se responden, con qué cortes) **no entra en F10**: se decide como feature aparte cuando haya datos de al menos ~10 tareas con `Registro:` (cifra a calibrar). Así se diseña con los datos reales y no con las preguntas imaginadas. Mientras tanto basta con `jq`/`node` sobre `eventos.jsonl`.

## 8. Decisiones

| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |
|---|---|---|---|
| Registrar ahora y por separado del informe | Los datos solo se acumulan si el registro existe desde antes (Franco) | Diferir F10 (se pierde lo que git no guarda); registro + informe juntos (más grande, diseñado sin datos) | Que Franco no vaya a usar los datos |
| Script que deriva + una línea en *Notas* (mixto) | Sin permisos nuevos; rellena el pasado; captura lo que git no guarda | Solo script (pierde retrabajo e intentos); agentes escriben el log (permisos, lectura, contexto) | Que el `constructor` no escriba bien la línea; que Franco prefiera medir tiempo (daría `date`) |
| `registro/eventos.jsonl` ignorado por git | Es un índice reproducible; repo público; commits limpios | Versionarlo (duplica, publica, conflictos) | Trabajo desde dos PC sin historial compartido |
| Esquema cerrado, sin texto libre | La privacidad queda garantizada por construcción | Filtrar texto libre (frágil) | Necesidad real de motivos de devolución |
| Sin rotación | ~1 MB/año, regenerable | Rotar por año desde el inicio (complejidad sin dolor) | Pasar de 1 MB |

## 9. Preguntas abiertas para Franco

1. **¿Qué preguntas quieres poder responder con estos datos?** (la más importante; el esquema se ajusta a ellas). Candidatas que el diseño ya soporta: ¿qué porcentaje de tareas pasan la puerta 4 sin devolución?; ¿cuántos huecos menores trae cada tarea (calidad del `planificador`)?; ¿cuántas veces se bloquea el `constructor` y por qué causa?; ¿cuánto pasa entre `aprobada` y `hecha`?; ¿rinde distinto el `constructor` con otro modelo?; ¿yolo frente a normal? Que no soporta hoy: tiempo real de trabajo, tokens y costo.
2. **¿Un registro por proyecto (propuesta) o uno central** en `~/.flucastr-ai/registro/` para comparar proyectos? Central serviría para mejorar el kit con varios productos, pero mezcla datos de proyectos y no sale del PC.
3. **¿Das al `constructor` permiso para `date`** (hora de inicio y fin en `Registro:`)? Sin él, los tiempos son los de los commits. Se suma a la discusión pendiente de comandos compuestos en la allowlist.
4. **¿Aceptas el cambio de contrato del `constructor`** (la línea `Registro:` por ejecución)? Si no, F10 queda solo en el script y pierde intentos, huecos y bloqueos.
5. **¿Aceptas que el informe sea una feature aparte** decidida tras ~10 tareas con datos?
