# Contratos de entrega y prompts cortos (F28)

> Estado: borrador por aprobar (puerta 1). Fecha: 2026-11-02. Una sola pasada del `arquitecto`; sin código.
> Origen: fila F28 de `BACKLOG.md` (*confirmado*), mediciones de Cleaner dadas por Franco (*confirmado*), lectura de `agentes/*.md`, `skills/ejecutar-tarea`, `skills/descomponer-feature`, `contrato-roles.mjs`, `formato-tarea.mjs` (*confirmado*). Lo marcado *inferido* o *supuesto* no se leyó.

## 1. Idea

Cada traspaso se comprueba con algo que ya existe o que un script puede comprobar; el `coordinador` solo reacciona a la primera línea de la respuesta. Los prompts se acortan moviendo lo que se usa pocas veces a módulos que se leen al activarse. No se añade rol, formato de feature ni archivo de estado nuevo (*descartado por Franco*: `FEATURE.md`).

## 2. Contrato por traspaso

| Traspaso | El emisor DEBE entregar | El receptor puede asumir | Comprobación (existe = E; nueva = N) |
|---|---|---|---|
| `arquitecto` → Franco → `planificador` | Documentos en `borrador` con «Decisiones para Franco» (A/B/C + recomendada); «Tamaño de la pasada» ≤ 12288 | Tras la puerta 1, toda decisión de diseño que el planificador cite está cerrada y fechada | E: `crecimiento-definiciones.mjs`; E: frases de `FRASES_UNA_PASADA` |
| `planificador` → Franco → `constructor` | Tareas `borrador` con las diez secciones, `- Tocar:` ≤3 rutas, «Decisiones abiertas» (`Ninguna` o con `Resuelta:`), ≤8 KB; en N: línea `- Fuente:` con la sección de `definitions/` de donde sale cada decisión | El constructor no decide nada de diseño; si algo falta, es `DECISION:` o `BLOQUEO:` | E: `validar-tarea.mjs` (exit 0); N: `Fuente:` apunta a un encabezado que existe (`grep`) |
| `constructor` → `coordinador` | Una de cuatro primeras líneas: `DECISION:`, `PARCIAL:`, `BLOQUEO:` o tarea `lista para revisión` con `Registro:` | La evidencia ya pasó el script; no se relee la tarea para creerle | E: `validar-tarea.mjs --evidencia`; E: cota de 2 pasadas (`verificacion_x2`) |
| `coordinador` → cualquier rol | Encargo con skill, `Lee:`, `No leas:`, `Devuelve:`, `Rama:`/`Modo yolo:` | El rol no pregunta: responde con la primera línea de bloqueo | E: frase «Plantilla de encargo»; N (opcional): ver decisión 3 |

Regla común: lo que el emisor no pueda comprobar con esa columna, lo escribe como pregunta cerrada, nunca como supuesto dentro de una tarea.

## 3. Qué hace el `coordinador` ante cada respuesta

| Primera línea / resultado | Acción (sin leer más que lo indicado) |
|---|---|
| Documentos del `arquitecto` | Puerta 1: ruta en `STATUS.md`, se detiene |
| `REFINAR:` | Pregunta a Franco, vuelve con respuestas al `planificador` |
| Tareas `borrador` | `validar-tarea.mjs`: exit 0 → puerta 3; exit 1 → devuelve las líneas al `planificador`; exit 2 → escalación |
| `DECISION:` / `PARCIAL:` | Pregunta a Franco con las opciones; con la respuesta, `aprobada` + `Decisión de Franco:`; no reabre al `arquitecto` |
| `CONFIRMAR:` | Pregunta a Franco; con «sí» explícito, reencarga |
| `BLOQUEO:` | Lo anota y lo enruta al rol; si toca `definitions/`, puerta 1 |
| `lista para revisión` | Puerta 4 (en yolo: `--evidencia`, exit 0 → `hecha`) |
| Nada de lo anterior | Escalación. No interpreta ni «arregla» |

## 4. Prompts: núcleo corto + módulos bajo demanda

**Dónde viven los módulos: skills.** `instalar.sh` ya enlaza (modo repo) o copia (modo descarga) cada `skills/*/` a `~/.claude/skills` y `~/.pi/agent/skills`, y `--skills-proyecto` las copia a `.pi/skills/` (*confirmado*, `ARCHITECTURE.md`). Un módulo es una skill de una sola carpeta (`SKILL.md`), y el agente la carga **por nombre**, sin rutas: funciona en repo y descarga, Claude Code y Pi, y no depende de `scripts/` ni `pruebas/`. *Descartado:* archivos sueltos en `agentes/` (el agente de Pi se genera y el de descarga no garantiza la ruta) y rutas `~/.flucastr-ai/kit/...` (distintas por modo; el `coordinador` solo tiene `Read` acotado). *Cuesta:* una descripción de ≤160 caracteres por módulo en la lista de skills de cada turno (~600 B en total); el ahorro neto sigue siendo ≈ 8 KB por turno (*inferido*).

| Agente | Núcleo (siempre) | Módulos (skill, se cargan al activarse) | Meta núcleo (hoy) |
|---|---|---|---|
| `coordinador` | Límites, qué lee, tabla de decisión, §3 de este documento, cómo avanza y plantilla de encargo, formato de `STATUS.md`, bloqueos y escalación | `modo-yolo` (reglas de entrada y las nueve; ≈4,5 KB), `ramas-feature` (≈1,5 KB), `comandos-coordinador` (comandos, archivo/contexto, cierre de feature, respaldo; ≈3 KB) | ≤ 7168 B (17 897) |
| `planificador` | Principios, límites, bloqueos, refinado, skills | Ninguno: ya delega en dos skills | ≤ 3584 B (4235) |
| `constructor` | Límites, qué lee, retorno de cuatro estados en una línea cada uno | Ninguno: el detalle ya está en `ejecutar-tarea` (quitar lo duplicado de «Retorno») | ≤ 3072 B (3377) |
| `arquitecto` | Principios, límites, una sola pasada, lectura acotada | Ninguno: ya delega en cuatro skills | ≤ 3584 B (4195) |

Cada módulo ≤ 5 KB. La activación es explícita en el núcleo: «Si Franco pide yolo, carga `modo-yolo`», una línea por módulo. El módulo no se carga en sesiones normales (la mayoría).

**Cómo se protegen las frases.** Hoy `contrato-roles.mjs` busca frases dentro del texto del agente; si se mueven, la prueba fallaría o, peor, se «arreglaría» borrándolas. Se propone un manifiesto único `FRASES_POR_ARCHIVO` ({frase: dónde debe estar: `agentes/coordinador` o `skills/modo-yolo`…}) que reemplaza las listas sueltas; la prueba comprueba que cada frase está en su archivo asignado y **solo ahí o en el núcleo si se declara**. Además: (a) cada módulo debe aparecer entre comillas invertidas en el núcleo (la regla 4 ya lo exige); (b) topes de bytes por archivo en una prueba (núcleo y módulos) que baja el actual 17 920 a 7168; (c) mover una frase exige tocar el manifiesto, así que se ve en la revisión del diff. Las frases de `Modo yolo:` en `planificador` y `descomponer-feature` no cambian.

## 5. Orden de implementación (cada tarea ≤5 KB, con su comprobación; reversible = se revierte con un `git revert` sin dejar roturas)

1. **Manifiesto de frases** (sin mover texto): `contrato-roles.mjs` pasa a `FRASES_POR_ARCHIVO` con las ubicaciones actuales. Comprobación: `contrato-roles.test.mjs` pasa igual; casos negativos de frase borrada fallan.
2. **Topes de bytes por archivo**: prueba con los tamaños de hoy como tope (17 920, 4 400, 3 500, 4 300, módulos aún no). Comprobación: pasa hoy; falla al añadir 1 KB.
3. **Módulo `modo-yolo`**: nueva skill con las reglas; el núcleo deja una línea de activación; frases migran en el manifiesto. Comprobación: pruebas de contrato y de instalación verdes; `coordinador.md` ≈ 13 KB.
4. **Módulos `ramas-feature` y `comandos-coordinador`**: igual. Comprobación: ídem; `coordinador.md` ≈ 8 KB; `readme-estructura.mjs`/`raiz-kit.test.mjs` aceptan las skills nuevas (*inferido*: listan skills, a verificar al descomponer).
5. **Cierre del núcleo del `coordinador`**: tabla de §3, quitar duplicados, tope 7168. Comprobación: tope en la prueba; escenarios de `pruebas/` siguen pasando.
6. **`Fuente:` en tareas** (si se aprueba la decisión 2): `formato-tarea.mjs` + plantilla en `descomponer-feature`. Comprobación: tarea sin `Fuente:` o con encabezado inexistente da exit 1.
7. **Recorte de `planificador`, `constructor`, `arquitecto`** a sus metas, sin mover frases exigidas. Comprobación: topes y contrato.
8. **Medición** en una feature de Cleaner con las reglas nuevas (ver §6). Comprobación: informe de `consumo.mjs` pegado por Franco.

Los pasos 1 y 2 no cambian comportamiento; 3 a 5 son los que bajan costo; 6 es el que mejora la entrega.

## 6. Medición de éxito

Comparar dos features de tamaño parecido, una antes y otra después de la tarea 5 (*supuesto*: hay muestra suficiente; con una sola feature la cifra es indicio, no prueba). Cifras de `scripts/consumo.mjs` (`--raiz`):

| Cifra | Hoy (dado por Franco) | Meta |
|---|---|---|
| Tamaño de `coordinador.md` | 17 897 B | ≤ 7168 B |
| Turnos del `coordinador` por llamada a subagente (`turnosPorLlamada`) | ≈ 6 (803 / 131) | ≤ 4 |
| Turnos del `coordinador` en el tramo `mas60k` | 94 % con >30 k de contexto (tramos `de30a60k` + `mas60k`) | `menos30k` ≥ 40 % |
| Costo del `coordinador` por feature | US$9,26 en una sesión | -35 % frente a la comparable |
| KB leídos por corrida del `planificador` | 72 | ≤ 40 |
| Corridas del `arquitecto` por puerta | 38 en total | 1 por puerta (+1 solo si Franco la pide) |

De las líneas `Registro:` (por `registrar.mjs`): `resultado=lista` 78 % → ≥ 90 %; `intentos` máximo 5 → 2; `causa=alcance` y `DECISION:` que llegan a construcción: 0 sobre decisiones que el `arquitecto` pudo cerrar; `huecos` medios por tarea ≤ 1; tareas aprobadas > 8 KB: 0 y mediana ≤ 6 KB. `reescribir_status` queda para F29.

Si el costo por turno no baja pero el tamaño sí, el ahorro no existía (el caché ya absorbía el prompt): se revierte la tarea 5 y se conserva lo demás. *Supuesto sin medir*: que el prompt, y no el historial acumulado, domine el contexto del `coordinador`; la tarea 8 lo confirma o lo desmiente.

## 7. Riesgos

- Un modelo débil puede no cargar el módulo al activarse yolo. Mitigación: la línea de activación está en el núcleo y la tabla lo repite; sin el módulo, no actúa en yolo (falla segura, *inferido*).
- Más archivos que sincronizar. Mitigación: el manifiesto y los topes fallan en la prueba.
- Pi: que cargue skills a pedido del agente no está verificado para `coordinador` en modo sin pantalla (*supuesto*; probar en la tarea 3).

## 8. Decisiones para Franco

1. **Dónde viven los módulos.** A) skills, una por módulo (recomendada: ya se instalan en los dos modos y herramientas, sin cambiar `instalar.sh`). B) una skill única con subcarpeta de módulos (exige rutas relativas que cambian por herramienta). C) dejar todo en el agente y solo recortar texto (ahorro ≈ 3 KB).
2. **`Fuente:` en las tareas.** A) no añadirla. B) sí, con comprobación por script (recomendada: cierra el hueco «decisión sin cerrar llega a construcción» sin `FEATURE.md`). C) solo exigirla en yolo.
3. **Cómo se protegen las frases.** A) manifiesto `FRASES_POR_ARCHIVO` más topes (recomendada). B) concatenar agente y módulos y dejar la prueba como está (más simple, pero una frase puede migrar sin que se note).
4. **`WORKFLOW.md` (31 298 de 30 720 caracteres).** A) tras la tarea 3, reducir §9.3 a puntero al módulo `modo-yolo` y conservar solo las reglas de producto (recomendada; propuesta, no se hace aquí). B) no tocarlo y subir su tope. C) archivar §10 en otro documento.

Tamaño de la pasada: 10897 bytes
