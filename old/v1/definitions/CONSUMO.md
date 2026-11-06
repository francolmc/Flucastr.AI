# Control de consumo del `coordinador` (F29)

Estado: borrador por aprobar (puerta 1). Autor: `arquitecto`, una sola pasada, 2026-11-02.

## 1. Idea y origen de los datos

El `coordinador` fue el 59 % del costo medido (803 turnos, US$9,26; 219 turnos, 27 %, solo reescribiendo `STATUS.md` para 131 delegaciones; 94 % de los turnos con más de 30 k de contexto; una sesión que nunca se cerró). *Confirmado:* `definitions/BACKLOG.md` (F29, mediciones de Cleaner). *Confirmado por lectura:* `scripts/consumo.mjs` ya clasifica el turno `reescribir_status`; `validar-tarea.mjs` es el único lanzador Bash del `coordinador` (`~/.flucastr-ai/validar-tarea.mjs *`, solo lectura); cada ejecución del `constructor` deja una línea `Registro: n=..; intentos=..; verificacion=..; resultado=..; causa=..` en su tarea.

Se atacan las tres fuentes del costo con una regla cada una, sin permisos nuevos: **una escritura por transición**, **un presupuesto que se lee de las líneas `Registro:`** y **una sesión por feature**.

## 2. (a) `STATUS.md` en una sola escritura

**Transición** = cambio de rol, puerta o cambio de estado. Por transición hay **una** llamada `Write` con el archivo completo (hoy son varios `Edit` por sección; el cambio es de método, no de formato). Entre dos transiciones no se toca `STATUS.md`: lo que el rol devuelve se incorpora en la escritura de la transición siguiente. Resultado esperado: ≈ 1 escritura por delegación (más las de puerta).

**Plantilla (todo el archivo, sin historia):**

```
# Estado
Escalación: <ítem o «ninguna»>
Paso actual: <rol> · <Fxx> · <task-NN> · Rama/Modo yolo: <..> · revisa Franco: <ruta o «nada»>
Presupuesto: <Fxx>; rondas arq=<n> plan=<n>; ampliado=<n>
Espera a Franco: <≤3 ítems>
Bloqueos abiertos: <≤3 ítems o «ninguno»>
Retomar: <siguiente paso exacto en una línea>
Actualizado: <AAAA-MM-DD hh:mm>
```

- Cada ítem ≤ 150 caracteres. Tope de archivo: **1536 B** (el aviso actual de 1,5 KB pasa a tope; meta de diseño ≤ 1200 B). Sin tablas ni historia: lo pasado vive en `Registro:` de las tareas y en `REGISTRO.md`.
- *Descartado:* que un script escriba `STATUS.md` (rompe «`validar-tarea.mjs` es solo lectura» y pediría confirmar otro permiso); `Edit` por sección (varias llamadas por transición, es la causa medida).

**Comprobación mecánica:** la opción nueva `--presupuesto` (sección 3) también valida `definitions/STATUS.md`: tamaño ≤ 1536 B, las siete líneas en orden, ítems ≤ 150 caracteres. Incumplir sale con 1 y el `coordinador` reescribe en la transición siguiente. Como corre al inicio de cada transición, la verificación llega con un desfase de una escritura, a costo cero de turnos extra. Medición: `consumo.mjs`, `reescribir_status ÷ delegar`.

## 3. (b) Presupuesto por feature

**Comando** (mismo lanzador, mismo permiso): `node ~/.flucastr-ai/validar-tarea.mjs --presupuesto features/Fxx-nombre`. Solo lee las `task-*.md` de esa carpeta (nunca `completed/` ni `registro/`) y `definitions/STATUS.md`. El `coordinador` lo corre en el mismo turno que sus lecturas, **una vez por transición**.

**Qué cuenta** (sin escrituras extra):

| Magnitud | Fuente |
|---|---|
| `T` tareas | archivos `task-*.md` de la carpeta |
| `E` ejecuciones | líneas `Registro:` (una por ejecución del `constructor`) |
| `I` intentos | suma de `intentos=` |
| `K` no listas | tareas cuya última `Registro:` tiene `resultado` ≠ `lista` |
| `R` rondas | `arq` y `plan` de la línea `Presupuesto:` de `STATUS.md` (las escribe el `coordinador` en la escritura de la transición; no hay otra fuente) |
| `D` delegaciones | `E + arq + plan` |

**Salida (una línea, lo único que el `coordinador` lee):**

`Presupuesto Fxx: D=<n>/<tope>; E=<n>; I=<n>; K=<n>/2; rondas arq=<n>/2 plan=<n>/3; estado=ok|aviso|excedido <causa>`

**Topes** (*supuestos*, a calibrar con la medición de la sección 6): `tope D = 2·T + 4 + ampliado`; `K ≤ 2`; `arq ≤ 2`; `plan ≤ 3` (descomponer + refinar). `aviso` cuando `D ≥ 75 %` del tope o `K = 2`; `excedido` cuando algo supera su tope. Salidas: 0 ok o aviso; 1 excedido o `STATUS.md` inválido; 2 error de uso. Base del `2·T`: la cota de dos pasadas por tarea (F26, *confirmado*).

**Si `excedido`:** el `coordinador` **no delega**. En su única escritura de esa transición pone en *Escalación* la causa y tres opciones cerradas para Franco:

- A) ampliar el tope en N delegaciones (se anota `ampliado=N`);
- B) replantear lo bloqueado (vuelve a `arquitecto` o `planificador`, cuenta como ronda);
- C) cerrar la sesión aquí y revisar a mano.

Sin respuesta de Franco, se detiene. *Descartado:* tope duro sin salida (frena sin que Franco decida); contar tokens (el `coordinador` no los ve; eso lo mide `consumo.mjs` después).

## 4. (c) Una sesión por feature

El estado vive en `STATUS.md`, por eso cambiar de sesión no pierde nada. El `coordinador` dice a Franco «abre sesión nueva» en tres casos, siempre tras dejar `Retomar:` escrito en la misma escritura:

1. Franco confirma una feature `hecha` (cierre; ya es una transición).
2. `estado=excedido` y Franco elige C.
3. `estado=aviso` por `D ≥ 75 %` (corte preventivo, ver decisión 3).

`Retomar:` lleva: feature, siguiente paso exacto, rama, qué espera de Franco. La sesión nueva lee `STATUS.md` primero (ya en el núcleo). *Descartado:* resumen largo en la respuesta (se pierde y cuesta turnos).

## 5. (d) Dónde vive el texto

- **Módulo-skill nuevo `control-consumo`** (≤ 4 KB): plantilla de `STATUS.md`, regla de transición, lectura de `--presupuesto`, qué hacer en `excedido` y `Retomar:`. Descripción ≤ 160 caracteres.
- **Núcleo** (`agentes/coordinador.md`, hoy 7132 B, tope 7168): una frase de activación, p. ej. «Al delegar, carga `control-consumo`.» (35 B; el bloque «Formato de STATUS.md» del núcleo se reduce a ella). Para no pasar el tope se recortan, como mínimo: `(`Edit` de «Paso actual»)` del paso 2, y las dos viñetas «Reescribes…/Se actualiza con `Edit`…» y «Escribe cada ítem ≤150…», cuyo contenido pasa al módulo (≈ 200 B netos libres; *inferido*, a confirmar con `topes-bytes.test.mjs`).
- **Frase perdida en F28:** la línea «Carga `comandos-coordinador` antes de delegar…» pasa a «Carga `comandos-coordinador` al pedirte Franco un comando, antes de `descomponer-feature`, al cerrar una feature o sin subagentes.», para que en Pi (con `bash` completo) su lista cerrada de comandos rija. Cabe con el recorte anterior.
- `comandos-coordinador`, comando 4: pasa a `[--evidencia|--fuente|--presupuesto]`. Excepción de iniciativa propia: `--presupuesto`, una vez por transición, como la puerta previa (hoy solo el cuarto como puerta previa está exento de «a pedido de Franco»).
- Las frases protegidas nuevas entran en `FRASES_POR_ARCHIVO` (`skills/control-consumo`).

## 6. (e) Tareas y metas

Cada tarea ≤ 5 KB, reversible con `git revert`; las crea el `planificador`. Orden:

1. **`--presupuesto` en `validar-tarea.mjs`** (módulo puro `formato-presupuesto.mjs`; el instalador debe copiar el módulo, *a verificar*). Comprobación: pruebas con fixtures `ok`/`aviso`/`excedido`, `STATUS.md` de 1537 B o con línea faltante (exit 1) y ruta ilegible (exit 2).
2. **Skill `control-consumo`**. Comprobación: tope de bytes de la skill, frases en el manifiesto, pruebas de estructura del kit.
3. **Núcleo y `comandos-coordinador`**: activación, recortes, frase «al pedirte Franco un comando», comando 4. Depende de 2 (se revierte antes). Comprobación: `coordinador.md` ≤ 7168 B y contrato de roles verde.
4. **Medición** en una feature de Cleaner con `consumo.mjs` y las líneas `Registro:`; informe pegado por Franco.

**Metas** (*supuestas*, línea base de Cleaner entre paréntesis):

| Medida | Fuente | Meta |
|---|---|---|
| `reescribir_status ÷ delegar` | `consumo.mjs` | ≤ 1,2 (1,67) |
| turnos del `coordinador` ÷ delegación | `consumo.mjs` | ≤ 4 (6,1) |
| turnos por sesión del `coordinador` | `consumo.mjs` | ≤ 200 (803) |
| turnos con > 60 k de contexto | `consumo.mjs` | ≤ 30 % (58 %) |
| `E ÷ T` | `Registro:` | ≤ 1,3 |
| `K ÷ T` | `Registro:` | ≤ 10 % |
| `STATUS.md` | `--presupuesto` | siempre ≤ 1536 B |

## 7. Riesgos

- El `coordinador` puede omitir correr `--presupuesto`: se detecta en `consumo.mjs` (turnos `otro` con Bash por transición) y en la medición; no hay hook que lo obligue.
- `rondas` dependen de que el `coordinador` las incremente: es el único dato sin fuente mecánica (decisión 2).
- Los topes son supuestos; la tarea 4 los calibra.

## 8. Decisiones para Franco

1. **Topes del presupuesto.** A) `2·T + 4` delegaciones, `K ≤ 2`, `arq ≤ 2`, `plan ≤ 3` (**recomendada**). B) más estricto: `1,5·T + 3`. C) solo aviso, sin frenar.
2. **Rondas del `arquitecto`/`planificador`.** A) contador en la línea `Presupuesto:` del `STATUS.md` (**recomendada**). B) no contarlas y fijar solo `D` y `K`, que salen de `Registro:`.
3. **Corte preventivo de sesión.** A) solo al cerrar feature o al exceder. B) además aviso a `D ≥ 75 %` (**recomendada**).
4. **Documentación.** A) no tocar `WORKFLOW.md` ni `CONTRATOS.md`; añadir una línea a `AGENTS.md` enlazando este archivo (**recomendada**). B) además una fila en `WORKFLOW.md` (exige recortar otro tanto, está sobre su tope). C) fusionar con `CONTRATOS.md`.

Tamaño de la pasada: 9399 bytes
