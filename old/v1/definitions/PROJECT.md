# Flucastr.AI — proyecto existente

> Estado: **aprobado** (2026-10-29; incluye los cambios de F05 y F06). Puerta 1 de F08 aprobada el 2026-10-30 (archivo y chequeo de contexto; modelo por agente comprobado, F07). **Aprobado el 2026-10-30:** `WORKFLOW.md` §3.1 y §10.5 (el `coordinador` corre `registrar.mjs` y `archivar.mjs` solo a pedido explícito de Franco; en Claude Code `tools:` limita con patrones y el permiso lo da Franco por aprobación o regla `allow` (ajuste del 2026-10-30), con `bash` completo en Pi por decisión y riesgo aceptado de Franco; implementado en F12, 2026-10-30, probado con modelo 8/8 en Claude Code y 8/8 en Pi). **Pendiente de aprobación:** **F09 (instalación sin clon desde GitHub, repo público; borrador del 2026-10-30, puerta 1; mergeada) y **F10** (registro de eventos del flujo, diseño en [`REGISTRO.md`](REGISTRO.md); borrador del 2026-10-30, puerta 1).
> Documento definitivo: consolida `definicion/{proyecto,mvp,plan-pruebas-arquitecto,diseno-primera-herramienta}.md` y los dos encargos (ver «Documentos reemplazados»).
> Origen de los datos: *confirmado* = leído en archivo o dicho por Franco; *inferido* = deducido; entre paréntesis, la fuente.

## Qué hace

Kit personal para trabajar con agentes de IA en productos propios (Don Financio, Andes y otros), por ahora para **Claude Code** y **Pi** (`README.md`). Contiene:

- Agente `arquitecto` (`agentes/arquitecto.md`): define proyectos sin escribir código de producto.
- Cuatro skills: `definir-proyecto`, `revisar-proyecto-existente`, `disenar-arquitectura`, `generar-clonar`.
- `modelos.json`: los agentes declaran un nivel (alto, medio, bajo); el perfil de cada herramienta lo traduce a un modelo.
- `scripts/resolver.mjs`, `instalar.sh`, `desinstalar.sh`.
- `pruebas/`: arnés que comprueba que el arquitecto cumple su contrato.

**Contrato del arquitecto** (confirmado, `definicion/mvp.md` en el historial de Git; informe `pruebas/resultados/2026-11-02-cambio-contrato-alcance-a.md`): solo define. Entrega `AGENTS.md` e `initialize.sh` en la raíz y `definitions/{PROJECT,REPOS,ARCHITECTURE}.md`. Nombres en inglés, contenido en español, todo borrador hasta que Franco apruebe. Nunca ejecuta `initialize.sh`.

**Reglas vigentes** (confirmado, `README.md`): producto primero; una tarea, un archivo; Franco hace los commits y el PR (también en las ramas por feature de F05); el `constructor` solo crea la rama de la feature (`git switch -c`, sin commit) o, con confirmación de Franco, hace `git switch <rama>` a una existente; el modo «yolo» de F06 omite las puertas 2, 3 y 4 pero no autoriza commits (`WORKFLOW.md` §9); los secretos no se tocan; nada nuevo sin dolor real; corte duro de 2–3 días sin algo funcionando.

**Dolor y objetivo** (confirmado, Franco): cuatro versiones anteriores (`project-flow`, `project-lite`, kit v1…) no entregaron ninguna feature terminada. El **criterio de éxito del MVP es una feature real de Franco, terminada y verificada**; las pruebas sirven para confiar en la herramienta, no son el objetivo. Tamaños de producto: básico = un repo fullstack; medio = API y front; robusto = más componentes.

## Cómo se ejecuta

- Instalar: `bash instalar.sh [--simular] [--solo claude|pi] [--proyecto <ruta> [--agente <nombre>]]`. Valida todo antes de tocar nada. Requiere `node` y `bash` (`instalar.sh`).
- Usar: `claude --agent arquitecto` o `pi-arquitecto`, desde la carpeta del proyecto.
- Tras cambiar `modelos.json`, volver a correr `instalar.sh`.
- **Sin clon, PC de trabajo (F09, por aprobar):** `curl -fsSL https://raw.githubusercontent.com/francolmc/Flucastr.AI/main/instalar-remoto.sh | bash` (o, más prudente, bajar el script, leerlo y correrlo). Requiere `bash`, `curl`, `tar` y `node`. Para actualizar: volver a correr el mismo comando, o `bash ~/.flucastr-ai/kit/instalar-remoto.sh --actualizar`; `--estado` compara la versión instalada con la publicada sin descargar. Sin procesos en segundo plano. Un `modelos.json` propio en `~/.flucastr-ai/` nunca se pisa. Mecánica en `ARCHITECTURE.md`, «Instalación sin clon desde GitHub».

## Cómo se prueba

Fuente: `pruebas/README.md` y `pruebas/permisos-ejecucion.md` (leídos; no ejecuté nada).

| Qué | Comando | Estado documentado |
|---|---|---|
| Suite automática | `node --test --test-concurrency=1 pruebas/comprobaciones/*.test.mjs pruebas/*.test.mjs` | 61/61 (informe del 2026-11-02) |
| Capa 1, instalación | `node --test --test-concurrency=1 pruebas/capa1/instalacion.test.mjs` | 6/6 con control negativo (informes del 2026-10-28) |
| Modelo de cada agente y subagente (F07) | `pruebas/lanzar-modelos-claude.sh`, `pruebas/lanzar-modelos-pi.sh` | Comprobado en ambas herramientas (`WORKFLOW.md` §7) |
| Escenarios con modelo B, M, R | `pruebas/ejecutar.sh {B\|M\|R} {claude-code\|pi} [N]` | Ver abajo |

- **Alcance activo: B (básico), M (medio), R (este repo como caso real).** Los escenarios C (complejo) y N (proyecto nuevo) quedaron fuera del MVP; los reemplaza el uso real.
- Los fixtures se generan al ejecutar (`pruebas/fixtures/{basico,medio,real}.sh`); los remotos son repos *bare* locales; sin red.
- Comprobaciones duras de contrato (cinco archivos, borrador, canario ausente, solo cambios permitidos, `initialize.sh` válido y reconstruye los repos, repos y rama correctos, repos en el diagrama), cada una con control negativo.
- Un «aprobado» vale para un modelo y una herramienta concretos; cambiar de modelo obliga a repetir.
- Claude Code corre con permisos por comando, que concede Franco (aprobación o reglas `allow`; F12, 2026-10-30); **Pi solo con detección** (registro e instantánea), sin confinamiento.
- **Corridas con modelo, último informe:** B y R pasan en Pi. B en Claude Code falló porque el agente instalado era el antiguo; R en Claude no se corrió; la configuración aislada no tenía sesión.
- Sin CI.

**Pruebas de F09 (por aprobar):**
- **Sin red, siempre.** Nada de F09 en `pruebas/rapida.sh` ni en la suite toca la red. El instalador remoto lee su «origen» de la variable `FLUCASTR_ORIGEN`: una carpeta local con dos archivos, `sha` y `kit.tar.gz`, que la prueba arma con `tar` a partir de un árbol mínimo de prueba (no del repo real, para que sea estable). Sin la variable usa GitHub. La construcción de las dos URLs reales se prueba como texto (`--mostrar-urls`), sin conectarse.
- **Carpeta HOME temporal** en cada prueba (como la Capa 1): jamás `~/.claude`, `~/.pi` ni `~/.flucastr-ai` reales.
- **Casos con control negativo:** primera instalación (carpetas copiadas con marca, **ningún enlace simbólico**, `version` escrito); segunda corrida con el mismo sha = «al día» y sin cambios; sha nuevo = actualiza y quita una skill que ya no existe; `modelos.json` del usuario editado **idéntico byte a byte** tras actualizar; `modelos.json` del usuario inválido = no se toca nada (instalación previa intacta); tarball con ruta `..`, absoluta o enlace simbólico = rechazado; tarball sin `instalar.sh` o `agentes/` = rechazado; falla a la mitad = vuelve a `kit.anterior` y `version` no cambia; carpeta existente sin marca = `OMITIDO`; instalar en modo descarga sobre una instalación en modo repo = se niega; desinstalar conserva `modelos.json`.
- **Presupuesto:** dentro del tope de `rapida.sh` (30 s); si no cabe, las pruebas de F09 van en un archivo propio, fuera de `rapida.sh`, pero también sin red.
- **Lo que queda para Franco (manual, con red real):** (1) revisar el repo antes de publicarlo (abajo); (2) ya público y con F09 mergeado, correr el comando de una línea en el PC de trabajo y comprobar que `claude --agent arquitecto` y/o `pi-arquitecto` arrancan con el modelo de su `modelos.json`; (3) editar su `modelos.json` local, publicar un cambio mínimo en `main` (por ejemplo una frase en una skill), correr `--estado` (debe decir «hay versión nueva»), luego `--actualizar`, y comprobar que el cambio llegó y su `modelos.json` sigue igual; (4) comprobar que la red de la empresa deja pasar los tres dominios de GitHub; (5) probar `desinstalar.sh` en el PC de trabajo. Los agentes no pueden hacer 2–5: necesitan el repo público y ese equipo.

**Pruebas de F10 (por aprobar):** sin modelo y sin red; repo git temporal con fechas fijas y datos canario (autor, título, llave, mensaje de commit) que no deben aparecer en el registro; idempotencia byte a byte; controles negativos. Detalle y casos en [`REGISTRO.md`](REGISTRO.md) §6. Con modelo, solo se observa en la primera tarea real que el `constructor` escriba la línea `Registro:`.

## Cómo se despliega

Hasta F09: no se despliega, se instala en local desde un clon. Remoto en GitHub (`git remote -v`), sin CI.

**Con F09 (por aprobar):** «publicar» es mergear a `main` en un repo **público**; no hay paso extra, release ni CI. El PC de trabajo instala y actualiza **descargando** `main` (sha fijado) por HTTPS, sin clon ni credenciales. Cada PR mergeado llega al PC de trabajo en cuanto Franco corra la actualización: por eso `main` debe quedar siempre instalable (protección de rama y PR obligatorio, de Franco).

## Dependencias externas

- Claude Code (`~/.claude/`) y Pi (`~/.pi/agent/`).
- **F09, por aprobar:** GitHub (`raw.githubusercontent.com`, `api.github.com`, `codeload.github.com`), `curl` y `tar`.
- Paquete de subagentes de Pi (según comentario de `instalar.sh`; no verificado).
- Proveedores de modelos: Anthropic y OpenAI (`modelos.json`).
- Node.

## Decisiones

| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |
|---|---|---|---|
| Un solo repo | Es lo más simple que sirve | Varios: sin razón concreta | Que algo se despliegue o evolucione por separado |
| Agentes con nivel, no modelo | Cambiar de modelo en un solo archivo | Modelo por agente | Que Franco deje de querer manejar los modelos |
| Recortar pruebas formales a B, M, R | El esfuerzo iba al arnés y no al dolor de Franco | Los 5 escenarios × 3 corridas × 2 herramientas (30 corridas) | Un fallo grave del arquitecto en uso real |
| Éxito = una feature terminada | Es el dolor declarado | Medirlo por pruebas pasadas | Que Franco redefina el objetivo |
| `coordinador` delgado con cuatro puertas | Franco no debe esperar en pantalla ni enrutar entre roles | Franco invoca cada rol a mano (no quita el problema); el arquitecto coordina (vuelve a crecer) | Que el traspaso resulte pesado o que Pi no soporte subagentes |
| Rama por feature: la crea el `constructor`, commits y PR de Franco (F05, decidido 2026-10-29) | Quita a Franco un paso manual sin tocar «los agentes no hacen commit»; el PR y el despliegue siguen siendo suyos | Que Franco cree la rama (más fricción); commit local por tarea por el constructor (permiso mayor, no autorizado) | Que Franco autorice commit local a los agentes |
| Modo «yolo» como excepción por conversación (F06) | Franco lo pidió; acotarlo a un pedido explícito, un repo y especificación completa limita el riesgo; trabaja en la rama actual (advierte si es `main`) y puede descomponer sin preguntar | Modo persistente en archivo (un archivo no es Franco); aplicarlo a varios repos (el orden y las ramas cruzadas no están definidos) | Que Franco lo quiera permanente o multi-repo |
| Instalar sin clon descargando de GitHub, repo público (F09, **decidido por Franco 2026-10-30**) | El PC de trabajo no tendrá clon; sin credenciales el comando es una línea | Repo privado con token (guarda una credencial en el PC de trabajo); copiar a mano (no actualiza) | Que no pueda hacerse público (ver «Repo público») o que el PC de trabajo no llegue a GitHub |
| Fuente = `main`, versión = sha del commit, sha fijado antes de descargar (F09, **recomendación mía, por aprobar**) | Sin pasos manuales de Franco; sin archivo de versión que se olvide | Releases/etiquetas (paso manual); `VERSION` a mano | Que `main` reciba trabajo inestable |
| Actualizar a mano: reejecutar el comando o `--actualizar`; sin procesos en segundo plano (F09, **supuesto a confirmar**: recomendación mía que Franco aceptó implícitamente) | Simple, predecible, sin permisos de sistema | Cron/aviso automático (procesos, más superficie) | Que Franco quiera enterarse solo de las versiones nuevas |
| Dos modos de instalación (enlaces con clon; copia sin clon) (F09, por aprobar) | No quita la edición en vivo al desarrollar | Un solo modo copiando (cada cambio exige reinstalar) | Que se deje de desarrollar con clon |
| `modelos.json` del usuario en `~/.flucastr-ai/`, fuera de lo que se reemplaza (F09, por aprobar) | Actualizar nunca pierde su elección de modelos | Fusionar o parchear (decide por él) | Que `modelos.json` deje de ser personal |
| Registro de eventos del flujo (F10, **por aprobar**; Franco aclaró el cometido el 2026-10-30): script que deriva de archivos y git + una línea `Registro:` del `constructor` en *Notas*; `registro/eventos.jsonl` ignorado por git, esquema cerrado sin texto libre; el informe va aparte | Los datos solo se acumulan si el registro existe desde antes; sin permisos nuevos; git por sí solo guarda pocos estados intermedios (23 de 47 tareas en un solo commit, medido) | Que los agentes escriban el log (permisos y contexto); solo script (pierde retrabajo e intentos); versionar el log (duplica y publica); diferir F10 | Que Franco no use los datos; que el `constructor` no anote bien la línea |
| Arquitecto con 5 entregables en inglés | Había acumulado demasiada responsabilidad | Mantener los 4 archivos en español | Que `AGENTS.md` termine duplicando `PROJECT.md` |

## Flujo de trabajo (decidido por Franco en líneas generales; roles por construir)

> Diseño detallado, plantilla de tarea y encargo de implementación: [`WORKFLOW.md`](WORKFLOW.md) (§9: ramas, refinado y yolo, en borrador).

Cuatro roles. Franco abre **siempre el `coordinador`**; los demás roles los invoca este. Cada rol **empieza leyendo archivos, no la conversación** del anterior.

| Etapa | Rol | Entra | Sale |
|---|---|---|---|
| 0. Coordinar | `coordinador` (principal, por crear) | Estado en archivos | Decide el paso siguiente, delega, enruta bloqueos y se detiene en las puertas. No define, planifica ni construye |
| 1. Definir | `arquitecto` (listo) | Proyecto nuevo o existente | `AGENTS.md`, `definitions/{PROJECT,REPOS,ARCHITECTURE}.md`, `initialize.sh` |
| 2. Planificar | `planificador` (por crear) | Lo anterior + conversación con Franco | `definitions/BACKLOG.md`: features generales, ordenadas por valor/esfuerzo, con estado y la siguiente marcada |
| 3. Descomponer | `planificador` | La feature en curso | `features/F01-nombre/task-01-nombre.md`…: descripción, alcance, lista de pasos, criterios de aceptación, verificación, estado y campo `repo:` (con orden de dependencia si hay varios repos) |
| 4. Construir | `constructor` (por crear, después) | Una tarea aprobada | Código en el repo de la tarea, evidencia de la verificación; la deja «lista para revisión» |
| 5. Cerrar | Franco | Tarea revisada | Aprueba, hace el commit; la feature pasa a `features/completed/` solo cuando él la da por hecha y confirma el archivado con `scripts/archivar.mjs --aplicar` (F08; `WORKFLOW.md` §10) |

**Cuatro puertas de aprobación** (decidido por Franco): el `coordinador` solo se detiene para (1) aprobar la definición, (2) aprobar el backlog y su prioridad, (3) aprobar cada tarea antes de construir, (4) revisar el resultado y hacer el commit. Entre puertas el trabajo avanza solo.

**Ramas, refinado y yolo (borrador, F05 y F06; detalle en `WORKFLOW.md` §9):**
- **Rama por feature:** cada feature se trabaja en su propia rama, `feature/`, `fix/` o `chore/` + `Fxx-nombre` según el tipo de trabajo. La crea el `constructor` desde la rama actual al empezar la primera tarea (git de escritura permitido: `git switch -c`; si la rama ya existe, el `constructor` pide confirmación a Franco con `CONFIRMAR:` y solo entonces hace `git switch <rama>`); cada tarea cerrada es un commit de Franco en ella (puerta 4). Al quedar `hecha` la última tarea, `STATUS.md` avisa a Franco, que cierra la rama, hace el PR y despliega. Los agentes no hacen commit, PR ni despliegue.
- **Refinado:** solo si la feature lo requiere (el `planificador` puede formular una pregunta de alcance con respuestas que cambiarían las tareas), antes de descomponerla (puerta 3) pide a Franco hasta 5 preguntas con recomendación (`features/Fxx/refinado.md`); si no, se omite. No es una puerta nueva.
- **Modo «yolo»:** excepción explícita, a pedido de Franco en la conversación, con especificación completa y un solo repo: se omiten las puertas 2, 3 y 4 para descomponer e implementar una o todas las features, sin preguntar, directo en la rama actual, sin rama por feature y sin commits (advierte si es `main`; el `constructor` no crea rama). Una feature ambigua escala por falta de especificación. Siguen vigentes credenciales, push/PR/despliegue, la escalación por cambio de alcance, `bloqueada` tras dos fallos y no tocar `definitions/`.

**Bloqueos entre roles:** un rol nunca llama a otro. Si necesita algo de otro (por ejemplo el `planificador` necesita una decisión del `arquitecto`), lo informa en su respuesta final (`BLOQUEO: rol=…; motivo=…`) y se detiene; el `coordinador` lo registra en `definitions/STATUS.md` y lo enruta. Si el cambio toca la definición, vuelve a pasar por la puerta 1.

**Archivo de estado (propuesta):** `definitions/STATUS.md`, que el `coordinador` mantiene: paso actual, qué espera de Franco, bloqueos abiertos. Franco lo mira cuando quiere; **no hay aviso** salvo una **escalación**: algo que requiere revisión de alcance o que no estaba previsto en lo definido. En ese caso el `coordinador` se detiene y lo dice de forma explícita al inicio del archivo.

Reglas:
- **El `planificador` redacta todo:** el backlog, las features y cada tarea (decidido por Franco). Franco aprueba en las puertas.
- **Prioridad por valor/esfuerzo, con habilitantes primero:** antes de ordenar por aporte, el `planificador` revisa qué falta para poder construir y *verificar*. Si falta, eso va primero como feature «habilitante», según el contexto: en un proyecto nuevo, el andamiaje; en uno existente sin despliegue local para pruebas e2e, ese despliegue. Sin habilitantes no hay criterio de «hecha» comprobable. Cada feature del backlog lleva su tipo (habilitante o de producto) y la razón de su posición.
- **Tareas completas y acotadas** (Franco): suficientemente detalladas para que el ejecutor termine sin detenerse, y lo bastante pequeñas para caber en una sesión. Reglas en `WORKFLOW.md`, §6.
- **Planificar justo a tiempo:** solo la feature en curso se descompone en tareas.
- **Una fuente de verdad del estado de las features:** `BACKLOG.md`; `completed/` es solo archivo y no se lee salvo pedido. Un script mueve las features `hecha` solo con confirmación de Franco y nunca decide estados (F08, `WORKFLOW.md` §10). Las filas `hecha` siguen en el backlog, cortas, y no cuentan para el tope de 6. `STATUS.md` es del flujo, no de las features.
- **Estructura igual para uno o varios repos:** el campo `repo:` reemplaza subcarpetas por repo.
- **Nombres en inglés, contenido en español** (`features/`, `task-NN-…`, `completed/`).
- El `constructor` nunca marca `hecha`; si la misma verificación falla dos veces por la misma causa, queda `bloqueada`. Una tarea cabe en una sesión; si no, se parte.
- Todo es Markdown; `instalar.sh` ya recorre `agentes/*.md` y `skills/*/`.

**Cómo invoca el `coordinador` a los roles:** como subagentes. En Claude Code funciona (confirmado, herramienta de agentes). En Pi está instalado `npm:pi-subagents` (confirmado, `~/.pi/agent/settings.json`) y el instalador ya deja `arquitecto.md` en `~/.pi/agent/agents/`; **no verificado** que un agente principal de Pi invoque a otro por nombre. Esa prueba va primero. Si falla, respaldo: roles como skills cargadas en la misma sesión.

Orden de construcción: cerrar la limpieza de tests → verificar subagentes en Pi → diseñar `coordinador`, `planificador` y la plantilla de tarea en una página → probarlos con una feature real → recién entonces el `constructor`.

## Inconsistencias detectadas

1. `agentes/arquitecto.md` dice nivel **alto**; `modelos.json` fija **medio**. **Decidido por Franco:** el nivel lo define el usuario en `modelos.json` (hoy medio, por costo; podría ser alto). Falta quitar la frase «nivel alto» del agente para que no contradiga (cambio de Franco).
2. `README.md` quedó en el reinicio: no menciona `pruebas/` ni `definitions/`, y cita `tareas/`, que no existe.
3. Informe con fecha `2026-11-02`, posterior a hoy (2026-10-29).
4. Los mensajes de commit recientes son casi todos «intrusión».
5. 27 archivos modificados sin commit (`git status`).

## Preguntas abiertas

Resueltas (Franco, 2026-10-29): los tests se recortan por exceso para el alcance real; el nivel del arquitecto lo elige el usuario en `modelos.json`; el `planificador` redacta backlog y tareas; el remoto de este repo ya está publicado (`https://github.com/francolmc/Flucastr.AI.git`).

1. ¿En qué producto real se prueba primero el flujo (Don Financio, Andes u otro)? La primera feature saldrá del backlog que arme el `planificador`, no se fija de antemano.
2. ¿Qué cierra la etapa actual de tests? (¿re-correr B y R en Claude Code con el agente regenerado?)
3. ~~¿El remoto es público o privado?~~ **Decidido: público** (Franco, 2026-10-30; lo publica él tras revisar, abajo). Pendiente solo la ejecución.
4. ¿Qué significa «intrusión» en los commits? (con repo público importa: su historial será visible).

**Abiertas por F09 (a Franco):**
5. ¿Qué sistema operativo tiene el PC de trabajo (macOS, Linux o Windows) y tiene `node`, `curl`, `tar` y `bash`? Con Windows (sin WSL/Git Bash) el diseño no sirve tal cual.
6. ¿La red del PC de trabajo deja llegar a `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`? ¿Hay proxy o política de la empresa sobre instalar scripts o agentes de IA?
7. Confirmar que `main` es la fuente (y no etiquetas) y que actualizar a mano basta (supuestos de arriba).
8. ¿Aceptas el modo dual (el PC con clon sigue con enlaces; el de trabajo copia)?
9. ¿Quieres un comando corto de atajo (por ejemplo `flucastr-ai actualizar` en `~/.local/bin`) o basta con el comando largo? Recomiendo el largo primero (menos piezas).

**Abiertas por F10 (a Franco):** qué preguntas quiere responder con los datos; registro por proyecto o central; permiso de `date` para el `constructor`; aceptar la línea `Registro:`; informe como feature aparte. Lista completa en [`REGISTRO.md`](REGISTRO.md) §9.

## Repo público: qué debe revisar Franco antes de publicar

Lo hace **Franco**, antes de cambiar la visibilidad; no lo leí ni lo ejecuté, y los agentes no leen `.env` ni credenciales. Hacer público un repo expone **todo el historial**, no solo el último estado: borrar un secreto en un commit nuevo no lo quita.
1. Buscar secretos en todo el historial y todas las ramas con una herramienta de detección (por ejemplo `gitleaks detect` o `trufflehog git file://.`) y a ojo: llaves de API, tokens, `.env`, cadenas de conexión, rutas con nombre de usuario o de la empresa.
2. Revisar `pruebas/resultados/`, los registros e instantáneas de corridas con modelo y los fixtures: pueden traer salidas de herramientas, rutas locales o texto de sesiones reales.
3. Revisar datos personales o de terceros: correos de autor en los commits (`git log --format='%ae' | sort -u`), nombres de productos o clientes (Don Financio, Andes) y datos de terceros en documentos o pruebas. Decidir si es aceptable que sean públicos.
4. Confirmar que `.gitignore` cubre `.env*`, `settings.local.json` y carpetas de sesiones.
5. Si aparece algo: **rotar la credencial primero**; después decidir entre reescribir la historia o crear un repo nuevo sin historial. Reescribir historia y `push --force` son de Franco, no de los agentes.
6. Publicar y activar: 2FA en la cuenta, protección de `main` (PR obligatorio) y, si quiere, avisos de escaneo de secretos de GitHub. Con repo público, el PC de trabajo ejecuta lo que haya en `main`.
7. Con repo público cualquiera ve los prompts de los agentes y las skills: confirmar que no hay nada que no quiera mostrar.

## Cómo se parte F09 (recomendación)

Conviene **tres tareas** (cada una cabe en una sesión; la feature completa no):
1. **Modo copia y `modelos.json` local:** `FLUCASTR_MODELOS` en `scripts/resolver.mjs`; `instalar.sh --copiar` (copia de skills con marca, `modo` y tipo `directorio` en el manifiesto, negativa a mezclar modos); `desinstalar.sh` conoce `directorio` y conserva `modelos.json`. Sin red; extiende la Capa 1.
2. **Descarga, verificación e instalación inicial:** `instalar-remoto.sh` con `FLUCASTR_ORIGEN`, sha, lista de rutas permitidas, rechazo de tar peligroso, `version`, `--estado`, `--mostrar-urls`. Depende de 1.
3. **Actualizar (atómico, con vuelta atrás) y documentación:** `--actualizar`/`--ref`, `kit.anterior`, aviso de `modelos.json` nuevo, `README.md` con el comando y la guía de comprobación manual. Depende de 2.
La revisión del repo público y la publicación **no son tareas de agentes**: son de Franco y van antes de su comprobación manual.

## Documentos reemplazados

`definicion/` completa queda obsoleta: sus decisiones vigentes están arriba y en `ARCHITECTURE.md`; los dos encargos (`encargo-pruebas`, `encargo-correccion-instalador`) ya se ejecutaron y el plan de pruebas describe un alcance (C y N) que se retiró. Todo sigue en el historial de Git.

## Estado

Aprobado por Franco el 2026-10-29, incluidos los cambios de F05 y F06 y sus respuestas a `WORKFLOW.md` §9.5. Puerta 1 de F08 aprobada el 2026-10-30. **Cambios de F09 (2026-10-30): borrador, por aprobar en la puerta 1** (secciones marcadas «F09»). Lo decidido por Franco: descarga desde GitHub, repo público, actualizar reejecutando el comando. Lo recomendado por mí y por confirmar: `main` + sha, actualización manual, modo dual, tres tareas. **F10 (2026-10-30): borrador, por aprobar en la puerta 1** (`REGISTRO.md`); Franco aclaró que F10 es generar el registro, no el informe.
