# Auditoría interna del kit Flucastr.AI

> Estado: **borrador por revisar**. Fecha: 2026-11-04. Disparó: Franco. Solo lectura; sin búsqueda web. Una pasada del `arquitecto`.
> *Confirmado* = leído en el repo (ruta:línea o cita) o ejecutado en solo lectura. *Inferido* = deducido. Los hechos del caso base (DonFinancio F03 task-10) los dio Franco.
> Solo ejecuté `higiene-contexto.test.mjs` y cuentas con `node` sobre `registro/eventos.jsonl`. No toqué `.env`.

## 1. Resumen

1. Los seis mecanismos del caso base existen como los describió Franco (*confirmado*, §2.2, §2.7). Son huecos de diseño que se combinan.
2. El tope de presupuesto sí frena, pero no distingue progreso de repetición: 9 rondas con `amp_plan=6` son seis respuestas «A» de Franco (*inferido*) a un freno que no dice por qué se repite.
3. No hay dueño ni procedimiento para reparar una tarea dañada, y el validador de fuente da un mensaje equivocado ante un bloque sin cerrar (*confirmado*).
4. La telemetría existe pero está vieja y se deriva de git: el log (464 eventos) no contiene ninguna ejecución de F24–F36 (≥97 líneas `Registro:` sin ingerir) ni eventos `bloqueo`, `cancelacion` ni `escalacion`.
5. Deriva documental confirmada y peor: `higiene-contexto.test.mjs` está **rojo hoy** (WORKFLOW 31 298 de 30 720); `rapida.sh` lo incluye (*inferido*: falla).
6. Funciona bien: puerta previa de tarea, cota de 2 pasadas, contratos por frases y la prueba con modelo de `excedido` (tras F36, 3 de 3).

## 2. Escenarios

### 2.1 Flujo feliz (puertas 1 a 4)

- **Debería:** arquitecto → planificador → constructor → Franco aprueba y commitea; el estado vive en `STATUS.md`.
- **Pasa:** cumple. De 52 ejecuciones registradas, 50 `lista`, 49 con `verificacion=pasa`; 56 puertas 4 y 6 puertas 3 aprobadas (`registro/eventos.jsonl`, cuentas propias, *confirmado*). `STATUS.md` mide 537 de 1536 caracteres.
- **Matiz:** 18 de 52 ejecuciones necesitaron 2 intentos, 1 tres y 1 cinco (F14 task-01); huecos: mediana 1, máximo 7. 49 de 52 corrieron con Haiku 5.5.
- **Veredicto:** bueno.

### 2.2 Tarea mal formada o demasiado grande (caso base, causas 1 a 4)

- **Debería:** la tarea nunca supera 8 KB ni deja una estructura rota; si ocurre, se avisa con la causa real.
- **Pasa:**
  - Tope total 8192 solo en `validarTarea` (`formato-tarea.mjs:119-122`). `--evidencia` (`formato-evidencia.mjs`) no mide tamaño total ni el de *Evidencia*: la regla «hasta 1,5 KB» solo está en prosa (`ejecutar-tarea:25`, `WORKFLOW.md:143`). Tras escribir la evidencia, nada vuelve a medir (*confirmado*). Por eso 9775 caracteres y 2783 de evidencia pasan sin aviso.
  - Un bloque sin cerrar no se detecta. `secciones()` alterna `enCodigo` con cada línea que empiece por «```» (`formato-tarea.mjs:33-48`); un «```sh» pegado al final de un párrafo no abre en ese punto, y el cierre posterior abre uno al revés. Todo lo siguiente, incluido `## Notas`, queda «dentro del código» y el mensaje es «Falta la sección «## Notas»» (`:80-83`) y «Las secciones … deben ser exactamente estas 10…» (`:73-75`). `validarFuente` reutiliza `secciones` (`formato-fuente.mjs:6,12`) y repite el síntoma. No existe regla de fences impares (grep sin resultados, *confirmado*).
  - Instrucción contradictoria: `ejecutar-tarea` (paso 3) manda correr `--evidencia` «antes de `lista para revisión`», con la tarea aún `en curso`, y `validarEvidencia` responde «La tarea no está terminada» (`formato-evidencia.mjs:132-134`). Esa es la salida que pegó el constructor (mecanismo *confirmado*; el acto lo dijo Franco).
- **Veredicto:** débil. Los validadores existen pero cubren el momento equivocado (el borrador) y no el documento final.

### 2.3 Decisión abierta

- **Debería:** una decisión sin cerrar no llega al constructor; si llega, pregunta con opciones cerradas.
- **Pasa:** regla 10 de `formato-tarea.mjs:124-132` exige «Ninguna» o `Resuelta:`; el constructor emite `DECISION:` con 2-3 opciones y `Recomendada` (`constructor.md:35-38`); el coordinador no reabre al arquitecto (`agentes/coordinador.md`, fila `DECISION:`). El log no registra `DECISION:`; no sé su frecuencia.
- **Veredicto:** bueno en diseño; sin datos de uso.

### 2.4 Reintento sin progreso, presupuesto y escalación

- **Debería:** la tercera vez que falla lo mismo, el sistema se detiene y dice qué se repite.
- **Pasa:**
  - Freno por conteo: `calcularPresupuesto` (`formato-presupuesto.mjs:82-152`): `D ≤ 2T+4+amp`, `arq ≤ 2+amp_arq`, `plan ≤ 3+amp_plan`, `K ≤ 2+amp_k`. Es determinista **pero lo corre y obedece el coordinador por prompt** (`control-consumo`, ítems 3-5); el propio modelo suma las rondas al reescribir `STATUS.md` (ítem 4). Nada impide delegar sin correrlo (*confirmado*).
  - No hay detección de repetición. Grep de «sin progreso», «misma causa», «bucle», «ciclo» en `agentes/`, `skills/`, `WORKFLOW.md`, `CONSUMO.md`: solo aparece «la misma verificación falla dos veces» **dentro de una ejecución** (`ejecutar-tarea:33`, `WORKFLOW.md:152`). La cota de 2 pasadas se reinicia en cada nueva ejecución del constructor (*inferido* por el texto: «corres como máximo 2 pasadas», por ejecución). `K` cuenta tareas cuya última ejecución no fue `lista`, no repeticiones.
  - El camino `BLOQUEO: rol=constructor; motivo=codigo:` siempre produce una tarea de corrección nueva vía planificador y cuenta `plan` (`control-consumo:28`, ítem 9). Si el defecto real es del documento (caso base) y el constructor lo etiqueta `codigo`, cada vuelta crea otra tarea que no repara nada (*inferido*).
  - En el caso base, `amp_plan=6` con tope base 3 es coherente con seis paradas y seis «A» de Franco (*inferido*; ítem 10 de `control-consumo` hace que «A» valga N=1 sin preguntar más, F36). El freno funcionó; lo que falta es que la Escalación (ítems ≤150 caracteres) diga «esta causa se repite por 4.ª vez».
  - **Cuántas veces frenó realmente:** no se puede contar desde `registro/`: el esquema no tiene evento de presupuesto y `escalacion` solo existe si se commiteó `STATUS.md`; el log tiene 0 eventos `escalacion`, 0 `bloqueo`, 0 `cancelacion` (cuentas propias). En `features/completed/` hay mención de `excedido` solo dentro de tareas de F29, F35 y F36 que prueban el mecanismo, no de paradas reales. Las paradas reales conocidas son las que Franco reportó (Memory-AI F05, `BACKLOG.md` F35/F36; DonFinancio F03).
- **Veredicto:** débil. Freno de volumen, no de repetición.

### 2.5 `excedido` y opciones por letra (F35, F36)

- **Debería:** al excederse, escribir las letras en esa transición y, con «A», seguir sin condiciones.
- **Pasa:** antes de F36, Claude Code 0 de 3 (no escaló; «el sistema me negó Bash»; ítem de 183 caracteres rechazado por el validador) y Pi 3 de 3 (`features/completed/F36-…/task-06*.md:5`). Tras el refuerzo, corridas 4-6 de Claude Code: 3 de 3 `OK` (`pruebas/resultados/2026-11-03-excedido-claude-code-4..6.md`). Matices *confirmados*:
  - n=3 y un solo modelo (Sonnet 5.5), distinto del de producción (Haiku 5.5 en 49 de 52 ejecuciones).
  - Las corridas 4 y 6 son `OK` aunque `--presupuesto` rechazó un ítem de *Escalación* de 201 caracteres; `OK` mide «ofreció letras y amplió», no «STATUS.md válido».
  - Tras «A» la corrida 6 volvió a `excedido` (arq 4/3) porque el arquitecto devolvió `BLOQUEO` sin motivo en *Notas*: «A» destraba, no resuelve (*confirmado* en el informe).
- **Veredicto:** bueno para destrabar; débil para evitar volver a entrar.

### 2.6 Bloqueo de código vs de definición

- **Debería:** código → constructor/planificador; definición → arquitecto; entorno → Franco.
- **Pasa:** F31 (`entorno.mjs`) y F35 (ítem 9) separan entorno y código; `ejecutar-tarea` fija los tipos `Bloqueo: tipo=entorno|alcance|especificacion|decision_diseno|verificacion_x2|credenciales|otra` (`ejecutar-tarea:37`). No existe tipo «documento_dañado» ni «estructura». El constructor lo clasificaría `otra` o `codigo` (*inferido*). El log no tiene ningún evento `bloqueo`, pese a que F32 lo incorporó, así que ese tipado no se ha medido.
- **Veredicto:** débil en el borde «el defecto está en el propio documento de la tarea».

### 2.7 Documento de tarea dañado: quién repara

- **Debería:** un rol con permiso y procedimiento repara la estructura y el caso queda anotado.
- **Pasa (*confirmado*):**
  - `constructor`: «En la tarea escribes solo *Evidencia*, *Notas* y `estado`» (`constructor.md:14`). Puede arreglar su propio bloque, pero no tiene regla que lo mande a revisar la estructura.
  - `coordinador`: «Escribes **solo** `STATUS.md` y el `estado`…» (`coordinador.md:17`); lee solo 3 líneas de cada tarea, así que no ve la estructura. Su fila `bloqueada` solo registra y enruta (`:48`).
  - `planificador`: escribe `features/**` (`planificador.md:20`), pero su skill `descomponer-feature` solo trata crear tareas; grep de «corrig», «reescrib», «dañ» sin resultados. Corregir una tarea ajena existente no es su procedimiento, y el coordinador tampoco lo dispara (la fila `--fuente` con salida 1 aplica solo a tareas `borrador`, `coordinador.md:45`).
  - Quien detecta el defecto no puede actuar y quien podría no es llamado: esa laguna es el giro de las 9 rondas (*inferido*).
- **Veredicto:** débil (hallazgo de mayor impacto).

### 2.8 Consumo y contexto (metas F21–F29)

- **Debería:** F21: `STATUS` 52→~15 turnos, `subagents_enable` 18→1 (`CONTEXTO.md:71`); F29: `reescribir_status` ≤1,2 por delegación (`BACKLOG.md`).
- **Pasa (*confirmado* en `reporte_mai.txt`, Pi, Memory-AI; *inferido* que F29 estaba instalada, que se archivó el 2026-11-02 11:44):**

| Sesión | Turnos | Delegaciones | `reescribir_status` | Por delegación | Turnos >60 k |
|---|---|---|---|---|---|
| 2026-11-01 17:12 (antes de F29) | 309 | 53 | 95 | 1,79 | 100 (32 %) |
| 2026-11-02 14:54 (después) | 191 | 35 | 63 | 1,80 | 75 (39 %) |

  - `subagents_enable` bajó a 1 por sesión (de 18): meta F21 cumplida.
  - La meta de F29(a) (≤1,2) no se cumple en Pi con esta muestra; la proporción de contexto largo empeoró. No hay medición posterior en Claude Code.
  - `STATUS.md` cumple su tope por script. `agentes/coordinador.md` está en 7168 de 7168 bytes: sin margen (`wc -c`).
- **Veredicto:** mixto. Costo de lectura mejoró; costo de escritura de estado no llegó a la meta.

### 2.9 Telemetría y diagnóstico entre PCs

- **Debería:** cada PC deja datos comparables para diagnosticar sin acceso.
- **Pasa:**
  - `registrar.mjs` solo corre a pedido de Franco (`comandos-coordinador/SKILL.md`, reglas) y deriva eventos del historial de git de las tareas, `BACKLOG.md` y `STATUS.md` (`registrar.mjs:386-542`). Lo que no se commitea no existe: `REGISTRO.md` §0 ya midió que 23 de 47 tareas aparecen en un solo commit; las 9 rondas del caso base, si no se commitearon, no dejan rastro (*inferido*).
  - Log: 464 eventos hasta 2026-11-03T14:36; `ejecucion` solo de F10–F26 (52); hay 149 líneas `Registro:` en `features/completed/`, 97 de ellas (F24, F25, F27–F36) sin evento. F24 y F25 no figuran y no sé por qué (§5).
  - El log no guarda rondas, presupuesto, letras ni turnos; eso vive en `consumo.mjs` sobre logs de sesión fuera del repo (`reporte*.txt`, no versionados). Sin `registro/`, `registrar.mjs` reconstruye desde git si hubo commits (*inferido*, `--reconstruir`, `:609-619`).
- **Veredicto:** débil: hay instrumentos, pero la evidencia llega a mano y tarde.

### 2.10 Deriva documental

Confirmo todas tus hipótesis y sumo una:

- `BACKLOG.md`: «Siguiente (`→`): F33, `pendiente`, con 6 tareas en `borrador`» (línea 57) y «hoy 6: F24–F29» (58); hoy las 36 features están `hecha`, 0 `pendiente`, y la marca `→` está en F36 `hecha`. 12 de 36 filas `hecha` pasan de 300 caracteres (F35 y F36 ~1 000); `WORKFLOW.md` §10.3 dice ~300. El archivo mide 16 725 caracteres; el umbral de aviso es 8 KB (`WORKFLOW.md:281`).
- `ARCHITECTURE.md`: 68 464 caracteres (cota de definición 20 KB, `CONTEXTO.md:52`; el aviso real está en 30 720, `archivar.mjs:25`). Dice «F10, por aprobar» (línea 67), «F09, por aprobar» (78-79), «propuesta, F09/F10» (132, 219).
- `WORKFLOW.md`: **31 298** caracteres (`wc -m`), no 30 674; el tope de la prueba es 30 720 (`higiene-contexto.test.mjs:18`). Ejecuté la prueba: los 6 casos fallan, el primero con «WORKFLOW.md pasa de 30720 caracteres (tiene 31298)». `rapida.sh` incluye esa prueba (`pruebas/comprobaciones/*.test.mjs`), así que la verificación rápida del kit está roja en HEAD. `CONTRATOS.md:90` ya lo registra como decisión 4 sin cerrar.
- `PROJECT.md` 25 895 caracteres, también sobre 20 KB. `README.md` no menciona F20–F36 (grep sin resultados).
- **Causa (*inferido*):** los topes son informativos salvo `WORKFLOW.md`; nada obliga a compactar al cerrar una feature.
- **Veredicto:** débil.

### 2.11 Modo yolo

- **Debería:** omite puertas 2-4 pero conserva los controles deterministas.
- **Pasa:** sustituye la puerta 3 por `--fuente` y la 4 por `--evidencia` (`modo-yolo/SKILL.md`, reglas 2 y 6 de «Mientras está activo»). Sin revisión humana, los defectos de §2.2 pasan: `--evidencia` no mide tamaño ni fences y el coordinador escribe `hecha`. 9 de 52 ejecuciones registradas fueron yolo (F19, F26), todas `lista`; exige un solo repo (regla 2 de entrada).
- **Veredicto:** bueno en seguridad; frágil ante documentos dañados.

### 2.12 Multi-PC y celular

- **Debería:** mismo estado en cada PC; poder dirigir el flujo desde el celular.
- **Pasa:** el estado en archivos es portable por git. Hay `instalar-remoto.sh --estado/--actualizar` (cabecera, líneas 2-9) y `pruebas/comprobaciones/modelos-agentes.mjs` para detectar un agente instalado viejo. Pero nada exige comparar la versión del kit entre PCs antes de empezar una feature, y el informe del 2026-11-02 ya detectó un agente de Claude Code antiguo (`ARCHITECTURE.md:548`). Celular: grep de «celular|móvil|ssh» en `README.md`, `WORKFLOW.md` y `PROJECT.md` sin resultados; el flujo asume terminal y `/new`, `/clear` (*confirmado*; no hay requisito escrito).
- **Veredicto:** multi-PC: parcial; celular: sin cubrir.

## 3. Lo que funciona (con evidencia)

1. **Plantilla de tarea y puerta previa.** 13 reglas deterministas con pruebas negativas (`formato-tarea.mjs:50-182`); detectan tamaño, pasos, criterios, rutas y marcadores pendientes. En el log, 56 puertas 4 contra 6 puertas 3 devueltas o aprobadas.
2. **Cota del constructor y retorno de cuatro estados** (F26): 2 pasadas, primera línea fija (`constructor.md:35-38`).
3. **Coherencia de `Registro:`** (F30): `coherenciaRegistro` valida estado, resultado y causa (`formato-evidencia.mjs:19-60`); la mayoría de ejecuciones pasa con `causa=ninguna`.
4. **Presupuesto como script puro** con pruebas (`formato-presupuesto.mjs`) y `STATUS.md` compacto validado (1536 B).
5. **Lectura acotada** (F22, F33, F34): `subagents_enable` de 18 a 1, medido con `consumo.mjs`.
6. **Prueba con modelo de `excedido`** (F36): `correr-excedido.sh` con diagnóstico automático de causa probable; es el único caso donde el kit prueba su propio prompt con modelo real.
7. **Seguridad**: ningún rol hace commit, push ni merge; `.env` excluido; yolo con entrada estricta (`modo-yolo` reglas 1-5).

## 4. Debilidades, por impacto

| # | Debilidad | Causa raíz | Tipo | ¿Feature? |
|---|---|---|---|---|
| 1 | Nadie repara una tarea dañada; el coordinador no ve la estructura y el planificador solo crea | Roles definidos por tipo de escritura, no por artefacto; sin procedimiento de reparación (§2.7) | Diseño | No |
| 2 | El freno cuenta rondas, no repetición; «A» vale N=1 sin dato de por qué | Presupuesto por volumen (F29/F35) y respuesta «A» sin condiciones (F36) | Diseño | No (F35/F36 lo facilitaron) |
| 3 | Validadores miden el momento equivocado: tamaño solo en borrador; evidencia sin tope; fences impares sin regla; `--evidencia` rechaza `en curso`, que es cuando se ordena correrlo | Reglas dispersas entre `formato-tarea.mjs` y `formato-evidencia.mjs`; instrucción contradictoria en la skill | Implementación + prompt | Parcial (F25 y F24 cubren otros casos) |
| 4 | Mensaje engañoso («falta ## Notas») ante un bloque sin cerrar | `secciones()` no comprueba paridad de fences | Implementación | No |
| 5 | El etiquetado `BLOQUEO … codigo` desvía a corrección de código lo que es un defecto del documento | Taxonomía sin tipo «documento» (`ejecutar-tarea:37`) | Diseño | F31/F32 cubren entorno, no esto |
| 6 | Mucho del comportamiento depende de que un modelo obedezca prompt (correr `--presupuesto`, sumar `plan`, escribir una vez) | Reglas por prompt con scripts que no se invocan por sí solos | Diseño | F29 lo cubre solo en parte |
| 7 | Telemetría vieja y derivada de git: sin ejecuciones de F24–F36, sin eventos de bloqueo, escalación ni presupuesto | `registrar.mjs` manual (`comandos-coordinador`) y fuente = commits | Diseño + proceso | F32/F34 la cubrieron en código; falta que corra |
| 8 | Meta de F29(a) no cumplida en Pi (1,80 vs ≤1,2 `reescribir_status` por delegación) | Prompt del coordinador al límite (7168/7168), reglas por prompt | Prompt | F28/F29 (no logradas) |
| 9 | Deriva: `rapida.sh` rojo por `WORKFLOW.md`; `BACKLOG.md`/`ARCHITECTURE.md` desactualizados | Topes informativos; nada obliga a compactar al cerrar | Proceso | No |
| 10 | Pruebas con modelo: n=3, Sonnet 5.5 (producción: Haiku); `OK` no exige `STATUS.md` válido | Costo | Implementación | F36 (parcial) |
| 11 | Sin cobertura de celular ni de comparación de versión entre PCs | Fuera de alcance hasta hoy | Diseño | No |

## 5. Cosas que no pude verificar

- Todo el caso base: tareas, `STATUS.md` y conversación de DonFinancio. Que Franco respondió «A» seis veces y que el constructor etiquetó el bloqueo como `codigo` son *inferencias* mías.
- Si F29 estaba realmente instalada en el PC de las sesiones de `reporte_mai.txt`.
- Por qué el log no tiene `ejecucion` de F24 y F25 aunque sus tareas tienen `Registro:` válido, ni si `registrar.mjs` se corrió tras F26.
- Cuántas veces el tope paró en proyectos fuera de este repo; no hay registro de presupuesto en ningún sitio.
- Si `rapida.sh` completa pasa o falla además de `higiene-contexto` (no la corrí: crea carpetas temporales).
- Conducta de los otros modelos (Pi/OpenAI, Haiku) ante `excedido`; solo hay informes de Claude Code con Sonnet 5.5.
- `pruebas/resultados/` anteriores a F36, `PENDIENTES.md` y `README.md`: solo cabeceras y búsquedas.

## 6. Preguntas para la investigación externa (máximo 8)

1. ¿Cómo detectan y cortan otros sistemas de agentes multi-rol los ciclos de reintento sin progreso (misma causa, mismo artefacto)? ¿Usan firma del error, límite de repeticiones consecutivas o comparación de estado, y quién decide escalar?
2. ¿Qué patrones usan para asignar un «dueño» a la reparación de artefactos compartidos (planes, especificaciones) cuando el que los consume los encuentra dañados? ¿Un rol de mantenimiento, autocorrección con límite, o devolución al emisor?
3. ¿Cómo validan el documento *final* y no solo el borrador: invariantes comprobadas en cada escritura (hooks de pre/post escritura, esquemas, linters de Markdown con paridad de fences)?
4. ¿Cómo hacen otros sistemas que los mensajes de error de un validador sean causales (apunta a la raíz) y no sintomáticos? ¿Hay prácticas de «diagnóstico de primer fallo» en parsers tolerantes?
5. ¿Cómo imponen presupuestos y límites de forma determinista (hooks, wrappers de herramientas, contadores fuera del modelo) en lugar de pedirle al modelo que los obedezca por prompt?
6. ¿Qué telemetría mínima registran los orquestadores de agentes para diagnosticar bloqueos entre máquinas (trazas, eventos de reintento, causa estructurada) sin depender de commits ni de que alguien la corra?
7. ¿Cómo evalúan con modelos reales los prompts de coordinación: tamaños de muestra, repeticiones, modelo de evaluación distinto del de producción, y criterios que midan el estado resultante y no solo la respuesta?
8. ¿Cómo mantienen acotada y al día la documentación que leen y escriben los propios agentes (resúmenes vigentes, poda, tamaño como puerta)? ¿Y cómo operan agentes de código desde móvil o remoto?

Tamaño de la pasada: ≤20 480 bytes (verificado con `wc -c`).
