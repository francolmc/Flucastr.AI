# Línea base del dolor del builder

Análisis de solo lectura. Fecha: 2026-11-24. Proyectos: Don Financio, Andes, Byteria. Ventana: últimos 60 días (los registros con planes del kit empiezan el 2026-11-18). Fuentes: `changes/**/plan.md` de los tres proyectos y los logs de sesión de Codex y Pi. No se leyó `.env`, llaves ni `old/v1/registro/`. Las citas son cortas y anonimizadas; no se copió contenido de logs.

Convención: **[M]** = medido (cita una línea del plan o un conteo del log). **[O]** = opinión mía, no medida.

## 1. Qué se pudo medir y con qué método

- [M] Se escanearon 620 sesiones (Codex y Pi). 62 mencionan un plan del kit; todas son de Codex y de los tres proyectos (DonFinancio 44, Andes 14, Byteria 4). Ninguna sesión de Pi referencia un plan.
- [M] Ningún proyecto tiene `runs.jsonl` ni `progress.jsonl`, así que duración, relanzamientos y sondeos salen de los logs de sesión y de las notas del plan, no de los registros de `kit run`.
- [M] Método de conteo sobre las 62 sesiones: tiempo activo = suma de intervalos entre eventos menores a 5 min; «verify» = comandos ejecutados que contienen `verify`; «sondeo» = comandos de espera o consulta repetida (`sleep`, `tail`, `wait`, estado) y entradas a procesos en curso (`write_stdin`); «entorno» = salidas con EPERM, ENOSPC, «No space left», «Docker daemon» u «Operation not permitted».
- [M] Totales (62 sesiones): 11 488 comandos, 1 092 con `verify`, 585 sondeos, 4 250 entradas a procesos en curso, 116 salidas con error de entorno.

## 2. Métricas por plan (no por tramo)

La duración y los conteos **no se pueden separar por tramo**: una sesión de Codex recorre varios tramos y los logs no marcan el cambio de tramo. Se reportan por plan. «Retornos» y «Reanudaciones» salen de contar marcadores en `## Notes`.

| Plan | Proyecto | Sesiones | Activo (min) | Cmds con verify | Sondeos | Entrada a procesos | Err. entorno | Retornos | PAUSED | Reanudaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| paridad-visual-operaciones | Andes | 5 | 3 268 | 456 | 318 | 1 972 | 26 | 5 | 7 | 35 |
| migracion-operaciones | Andes | 1 | 783 | 159 | 53 | 613 | 22 | 11 | 6 | 19 |
| obligaciones | DonFinancio | 3 | 987 | 45 | 54 | 385 | 0 | 6 | 3 | 7 |
| onboarding-base | DonFinancio | 2 | 688 | 44 | 20 | 256 | 2 | 4 | 3 | 8 |
| cimientos | DonFinancio | 14 | 523 | 34 | 22 | 108 | 46 | 6 | 0 | 0 |

Notas:
- [M] En todos los logs de Codex el modelo figura como `gpt-6.1-terra` con esfuerzo `medium`. Ese dato es el de la sesión del log y puede ser el del planner; no sirve para atribuir tiempo al builder (ver §6).
- [M] `cimientos` registra devoluciones como «Tramo N devuelto» y no usa los marcadores PAUSED ni «Reanudación»; por eso aparece en 0.

## 3. Segmentos con devolución o PAUSED (12)

Duración, relanzamientos y sondeos por tramo: **no medibles** (ver §2). La columna «Evidencia» cita la línea del `plan.md` correspondiente.

| # | Proyecto / plan / tramo | Tipo | Motivo del retorno [M] | Evidencia | Causa | Retraso |
|---|---|---|---|---|---|---|
| 1 | Andes / migracion-operaciones / T9 | RETURNED | `./verify` y `git diff --check` pasaron pero A9 no se cumple: el tablero solo cuenta estados y documentos existentes | plan L127 (reincide en L130) | R2 (también R1) | H2 |
| 2 | Andes / migracion-operaciones / T6 | PAUSED ×2 | Segundo PAUSED por el mismo estado `in progress`, pese a restablecer `approved` antes de relanzar | plan L155 | otra: defecto de proceso (estado del plan) | — |
| 3 | Andes / migracion-operaciones / T8 | PAUSED | A8 exige conservar historial y eliminar documentos; la implementación sobrescribe una fila y el alcance no cubre el cambio | plan L141 | otra: alcance del plan insuficiente para el criterio | — |
| 4 | Andes / paridad-visual / T3 | RETURNED | `verify` quitó de la etapa 4 el recorrido Playwright productivo y movió comprobaciones SQL a `stage >= 5` | plan L247 | R3 | H2 |
| 5 | Andes / paridad-visual / T4 | RETURNED | `verify --stage=8` en exit 0 pero el `DocumentManager` no es el componente original exigido por A4; la comparación no acredita diálogos ni estados | plan L239 (ver L235–236: el constructor agotó intentos antes de repetir `verify`) | R2 (también R5: arnés temporal) | H2 |
| 6 | DonFinancio / obligaciones / revisión final | PAUSED | `./verify` salió 1: Docker no tiene la imagen del servicio de correo; no se descargó por falta de autorización | plan L645 | otra: entorno (no hay rework de código) | H6 |
| 7 | DonFinancio / obligaciones / revisión final | PAUSED | Dos ejecuciones independientes de `./verify` terminaron con código 143; origen de la señal no identificado | plan L647 | otra: entorno (origen desconocido) | H6 |
| 8 | DonFinancio / obligaciones / T9 | RETURNED | `pnpm typecheck` falla (exit 2) y la verificación del tramo pasó 3/3 sin detectarlo | plan L680 | R2 | — |
| 9 | DonFinancio / obligaciones / T10 | RETURNED | Cancelar la confirmación igual encola el cambio y el Toast pierde Deshacer; se exigen pruebas de navegador sobre la ruta de producción | plan L672 | R2 | — |
| 10 | DonFinancio / onboarding-base / T7 | PAUSED | Dos `verify` seguidos fallaron en el recorrido autenticado; la causa real está en un archivo fuera del alcance cerrado del tramo 6 | plan L232, L250 | otra: alcance del plan incompleto | H2 |
| 11 | DonFinancio / cimientos / T6 | devuelto | La prueba reescribe `migration.sql` antes de probarla y puede ocultar su ausencia | plan L178 | R5 | — |
| 12 | DonFinancio / cimientos / T9 | devuelto | La prueba comprueba el componente, no que la hoja de estilos esté enlazada en la raíz | plan L198 | R5 | — |

Retornos citados adicionales que refuerzan el patrón (no entran a la tabla): cimientos T7 (la prueba acepta 3 500 ms frente al límite de 3 s, L182) → R5/R2; paridad-visual T3 (cero fijo en una métrica sin datos, L249) → R1/R2.

## 4. Distribución de causas [M, sobre los 12 segmentos]

| Causa | Segmentos | Ejemplo |
|---|---|---|
| R2 aceptación no ejecutada por una herramienta | 4 (#1, #5, #8, #9) | verify en verde, criterio incumplido |
| R5 prueba sobre un montaje sintético | 2 (#11, #12); #5 en parte | prueba que no ejerce el producto |
| R3 alcance sin guarda mecánica | 1 (#4) | `verify` editado, cobertura retirada |
| otra: alcance del plan insuficiente | 2 (#3, #10) | el criterio exige tocar lo no autorizado |
| otra: entorno (Docker, señal 143) | 2 (#6, #7) | sin defecto de código |
| otra: defecto de proceso (estado `in progress`) | 1 (#2) | PAUSED repetido por el mismo estado |
| R1 «hecho» decidido por el modelo | 0 como causa primaria; secundaria en #1 | |
| R4 tramos que mezclan unidades | 0 con evidencia suficiente | |
| R6 decisión «Resuelto» que se repite | 0 con evidencia suficiente | |

Muestra de 12 elegida por mí entre planes con más devoluciones; no es aleatoria. Las proporciones indican patrón, no tasa.

## 5. Las 3 causas de mayor impacto

1. **El «hecho» no lo decide una herramienta que pruebe el criterio (R2, con R5 como variante).** [M] 6 de 12 segmentos (#1, #5, #8, #9, #11, #12), repartidos en los tres proyectos y en cuatro planes. En #1 y #5 el `verify` terminó en 0 y el criterio no se cumplía; en #8 la verificación del tramo pasó y `typecheck` fallaba. En Andes, el plan `migracion-operaciones` acumula 11 retornos y `paridad-visual` 5 con 7 PAUSED. [O] Cada retorno cuesta al menos un relanzamiento más una revisión; es la causa más repetida, pero no puedo asignarle minutos por tramo.
2. **Costo de repetir `verify` completo en planes largos (H2).** [M] En Andes `paridad-visual-operaciones`: 456 comandos con `verify` en 5 sesiones y 3 268 min activos; en `migracion-operaciones`: 159 en una sesión de 783 min. [M] En #5 el constructor «agotó los intentos antes de repetir `./verify --stage=8`» (plan L236) y #10 termina con dos `verify` fallidos seguidos. [O] Parte de esos conteos son iteraciones legítimas del desarrollo y no puedo separarlas de las repeticiones evitables con los datos que tengo.
3. **Detenciones que no son defecto de código: alcance del plan, entorno y estado del plan.** [M] 5 de 12 segmentos (#2, #3, #6, #7, #10). Dos son entorno (imagen Docker ausente; salida 143 sin origen), dos son alcance insuficiente respecto de lo que exige el criterio, y uno es un PAUSED repetido por el estado `in progress` aun después de restablecer `approved` (plan L155). [M] Andes registra 22 y 26 salidas de entorno en sus dos planes grandes frente a 0 en `obligaciones`.

## 6. Qué NO se pudo medir y por qué

- **Duración por tramo y relanzamientos por tramo:** no hay `runs.jsonl`; los logs de Codex no marcan límites de tramo. Solo existen agregados por plan y conteos de «Reanudación» en notas.
- **Atribución builder vs planner:** el log de Codex trae un único modelo/esfuerzo por sesión y no distingue quién ejecutaba; no se puede asignar tiempo ni sondeos al builder en exclusiva.
- **H1 (esperas y sondeos):** existen conteos (585 sondeos, 4 250 entradas a procesos en curso) pero sin tiempo ocioso asignable a cada espera ni línea base de comparación; no hay evidencia suficiente para decir cuánto pesa.
- **H3 (contrato largo) y H4 (esfuerzo alto):** los logs no traen tokens de entrada por turno utilizables; sin evidencia.
- **H5 (tramos largos y tope de 1 h):** no se encontró en los logs ni en las notas una detención atribuida al tope de 1 h; sin evidencia (no es lo mismo que descartado).
- **R4 y R6:** no hay un caso con evidencia suficiente en la muestra.
- **Conteo de `verify`:** es por comando que contiene la palabra; puede incluir lecturas del archivo `verify` y no solo ejecuciones.
- **Sesiones de Byteria:** solo 4 con planes y de poca duración; sin devoluciones en la muestra. Claude Code: las sesiones encontradas son del planner; no hay logs de builder allí.
- **Sesgo de selección:** los 12 segmentos salen de los planes con más notas de devolución y de PAUSED.

## 7. Recomendación de orden [O]

No tengo en este análisis la definición de los bloques B, C y D, así que ordeno por causa y tú las mapeas:

1. **Primero lo que ataca R2/R5:** que el criterio de aceptación lo ejecute una herramienta contra el producto real. Es la causa más frecuente y repite en los tres proyectos.
2. **Segundo, la guarda mecánica del alcance y de `verify` (R3) junto con el estado del plan (`in progress`):** son defectos pequeños y baratos de cerrar, y cada uno produjo un retorno o un PAUSED repetido.
3. **Tercero, el costo de `verify` repetido (H2):** el volumen es el más grande, pero hace falta primero la medición por tramo (`runs.jsonl`) para saber qué parte es evitable.
4. **Entorno (H6) al final:** son 2 de 12 y no son defecto del builder; Docker y la señal 143 pueden resolverse aparte.

Antes de decidir sobre H1, H3, H4 y H5 conviene correr un par de planes con `kit run` para tener `runs.jsonl`; con los logs actuales no hay base.
