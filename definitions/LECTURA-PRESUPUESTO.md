# Pieza D: límite de contexto y permiso de lectura

> Estado: borrador por aprobar
> Fecha: 2026-11-02. Una sola pasada del `arquitecto`; sin código.
> Origen: relato de Franco (*confirmado* como dicho, no verificado en logs); lectura de `CONTEXTO.md`, `CONTRATOS.md`, `DIAGNOSTICO-BLOQUEOS.md`, `agentes/*.md`, `frases-por-archivo.mjs`; tamaños medidos con `wc -c` y `topes-bytes.test.mjs` (*confirmado*). 

## 1. Diagnóstico

- **El bloqueo nace en el agente, no solo en el encargo (*confirmado*).** `arquitecto.md` dice «No lees `features/` ni tareas» y la frase está protegida por el manifiesto; cambiar solo `No leas:` del encargo no lo arregla. Igual en `planificador.md` («No lees tareas de otras features ni tareas `hecha`»).
- **Una sola lista mezcla dos cosas:** el *límite de contexto* (qué se carga por defecto, para gastar poco) y el *permiso* (qué está prohibido de verdad). «No leas» las trata igual; el rol obedece lo más estricto y se detiene.
- **Costo del desvío (*inferido*):** una llamada nueva del `planificador` (≈3k tokens de arranque más el archivo) y otra al `arquitecto`, frente a una lectura de ≤15 KB en un contexto ya abierto.
- **El `coordinador` queda fuera:** su contexto se relee en cada turno (50–100k, `CONTEXTO.md` §1); en un subagente de vida corta una lectura cuesta mucho menos.

## 2. Evaluación del diseño del `coordinador`

| Punto | Veredicto | Razón |
|---|---|---|
| `No leas:` → `Evita leer:` | Aceptado, con cambio | Solo cambia la palabra si hay tope y declaración; sin ellos «evita» degrada a «lee todo». Lo duro sale de la plantilla y vive en los agentes |
| Tope por lectura ≤15 KB con `offset`/`limit` | Aceptado | Tareas ≤8 KB y definiciones ≤20 KB (`CONTEXTO.md` §2.3): 15 KB cubre una tarea entera o una sección |
| Añadido: máximo 3 lecturas extra y 30 KB por llamada | Nuevo | Sin tope por llamada, 15 KB × N reintroduce los 419 KB del `constructor` (*medido*) |
| Duros: `.env`, llaves, `registro/`, `features/completed/` | Confirmado | `CONTEXTO.md` §2.1, `AGENTS.md`, `planificador.md`; tareas `hecha` ajenas quedan blandas |
| `coordinador` no hace de mensajero | Aceptado, y se amplía | No lee para pasar contenido; pasa la **ruta** en `Lee:` |
| `Lectura extra:` como telemetría | Aceptado, sin evento nuevo | Ver §5 |

## 3. Modelo: dos líneas, dos dueños

| Concepto | Dónde se dice | Quién lo cambia |
|---|---|---|
| **Límite** (lectura por defecto) | `Lee:` y `Evita leer:` del encargo; listas de «Qué lees» de cada agente | El `coordinador` por encargo; Franco, vía promoción (§5) |
| **Permiso duro** | Texto fijo en cada agente: `.env`, llaves, credenciales, `registro/`, `features/completed/` | Solo Franco, con pedido explícito |
| **Excepción blanda** | Skill `lectura-extra` | Franco |

Reglas de la skill `lectura-extra` (≈1,2 KB, aplica a `arquitecto`, `planificador`, `constructor`; **no** al `coordinador`):
1. Un archivo de `Evita leer:` (o de «No lees…» del agente) se lee solo si la tarea no se puede cerrar sin él; antes, `grep -n '^## '` y la sección.
2. Hasta 15 KB por lectura (`offset`/`limit` si pasa), 3 lecturas y 30 KB por llamada.
3. Cada una se declara en el retorno, tras la primera línea de estado: `Lectura extra: <ruta>; motivo=<qué te falta>`.
4. Si hace falta más, o el archivo es duro: `BLOQUEO: rol=franco; motivo=lectura: <ruta>` (no se enruta a otro rol; mismo criterio que `rol=franco` de `DIAGNOSTICO-BLOQUEOS.md` §4).

Encargo del `coordinador`, dos cambios en `Plantilla de encargo`: «`Evita leer:` lo que el rol no necesita (`definitions/` salvo lo citado, tareas `hecha`)» y «No lees un archivo para pasar su contenido a otro rol: pasa la ruta en `Lee:`». Ante `BLOQUEO: motivo=lectura:`, el `coordinador` no delega la lectura a otro rol: pregunta a Franco.

## 4. Dónde vive el texto (con tamaños)

| Archivo | Tope / hoy (*medido*) | Cambio | Tamaño estimado (*inferido*) |
|---|---|---|---|
| `agentes/coordinador.md` | 7168 / 6977 (libres 191) | `No leas:` (121 B) → `Evita leer:` (88 B), −33; regla de mensajero +78; `Disparó:` ≈ +40 | neto ≈ +85; quedan ≈ 105 |
| `agentes/arquitecto.md` | 3584 / 3581 | «No lees `features/` ni tareas salvo `lectura-extra`» (+≈20) | exige recortar ≈ 20 B en otra línea |
| `agentes/planificador.md` | 3584 / 3581 | Ídem en «No lees tareas de otras features ni tareas `hecha`» | ídem |
| `agentes/constructor.md` | 3072 / 2945 | Una línea de puntero (+≈45) | cabe |
| `skills/lectura-extra/SKILL.md` | ≤5 KB (CONTRATOS §4) | Nueva, §3 | ≈1,2 KB |

**Por qué skill y no texto en cada agente:** dos agentes están a 3 B del tope y la regla completa mide ≈250 B (*medido*); repetida en tres roles costaría ≈750 B y obligaría a subir topes. El puntero es corto y la skill se carga solo cuando el rol llega al bloqueo, que es cuando sirve. Riesgo: que el rol no cargue la skill; el puntero nombra la skill en la misma frase que la prohibición para evitarlo.

## 5. Telemetría sin duplicar

- **Fuente primaria: lo que se leyó de verdad.** `consumo.mjs` ya calcula KB leídos por archivo y rol (*confirmado*: `CONTEXTO.md` §5 y `consumo.test.mjs`). Una lectura es «extra» si su ruta coincide con la `Evita leer:` del encargo. Es la misma extracción de líneas de cabecera del encargo que `DIAGNOSTICO-BLOQUEOS.md` pieza 3 (C3) plantea para `Disparó:`: **un solo parser** de líneas `Clave:` del encargo (`Disparó:` y `Evita leer:`), sin segundo mecanismo.
- **`Lectura extra:` aporta el motivo y el cumplimiento**, no el conteo. Cumplimiento = lecturas extra con declaración / lecturas extra totales (meta ≥ 90 %). No se escribe en `registro/` ni se añade evento a `registrar.mjs`: `Bloqueo:` y `Disparó:` cubren otro eje (por qué se paró y quién disparó); esto es qué se leyó de más. Si una lectura bloquea, `Bloqueo: tipo=otra` ya basta.
- **Promoción:** un archivo con lectura extra en ≥3 corridas del mismo rol y ≥2 features pasa a `Lee:` del rol (o a su lista de «Qué lees»). La pista la saca `informe.mjs --pistas` (pieza 3, C5) como una fila más; decide Franco. Umbrales *supuestos*, a calibrar.
- **Anti-degradación:** alerta si las lecturas extra por llamada promedian >1 o los KB por corrida superan la base +25 %. Si ocurre dos veces, ese rol vuelve a «No leas» duro.

## 6. Cambios en pruebas y documentos

- `frases-por-archivo.mjs`: nuevo `FRASES_LECTURA_EXTRA` con `lectura-extra` en `arquitecto`, `planificador`, `constructor` (puntero); en `agentes/coordinador`: `Evita leer:` y `pasar su contenido a otro rol`; en `skills/lectura-extra`: `15 KB`, `Lectura extra: <ruta>; motivo=`, `rol=franco`. Las frases `No lees \`features/\` ni tareas` y `No lees tareas de otras features ni tareas \`hecha\`` **se conservan como subcadena**, así el manifiesto actual sigue pasando.
- `topes-bytes.test.mjs`: entrada para `skills/lectura-extra` (≤5120); sin subir topes de agentes (hay que recortar).
- `contrato-roles`: ausencia de `No leas:` en el `coordinador` (si el comprobador no admite ausencias, un caso negativo propio). Antes, `grep` de `No leas` en `skills/revisar-proyecto-existente` y `CONTRATOS.md` (*confirmado* que existe; no se leyó si es regla o ejemplo).
- `CONTEXTO.md` (propuesta, no se edita aquí): §2.2 encabezado «No lee» → «Evita (excepción: `lectura-extra`)», con el `coordinador` sin excepción; §2.1 fila «Historia» sin cambios; §5 añade la métrica «lecturas extra por llamada y cumplimiento».

## 7. Tareas candidatas (el planificador numera; ≤3 rutas)

1. Skill `lectura-extra` + entrada en `topes-bytes` + frases del manifiesto.
2. `arquitecto.md` (puntero y recorte) + manifiesto.
3. `planificador.md` (ídem) + manifiesto.
4. `constructor.md` (puntero) + manifiesto.
5. `coordinador.md`: `Evita leer:`, regla de mensajero; medir el neto junto con `Disparó:` (pieza 3, C3); manifiesto; ausencia de `No leas:`.
6. `consumo.mjs`: parser de líneas del encargo (compartido con C3), lectura extra y cumplimiento, con prueba. Depende de C3.
7. `informe.mjs --pistas`: filas de promoción y alerta. Depende de C5.
8. Redacción de `CONTEXTO.md` (§6), tras aprobación.
9. Medición real de Franco en 2 features (comparar con la base de §5 de `CONTEXTO.md`).

Orden: 1 → 2–4 → 5 (después de C3) → 8; 6–7 cuando existan C3 y C5; 9 al final.

## 8. Riesgos

| Riesgo | Cómo se mide / mitiga |
|---|---|
| Los roles leen de más y sube el costo | Tope de 15 KB/30 KB por llamada; alerta de §5; comparar KB por corrida y costo por tarea con `consumo.mjs` antes/después; revertir por rol |
| El rol no carga `lectura-extra` y se detiene igual | Puntero en la misma frase de la prohibición; medir llamadas con `BLOQUEO: motivo=lectura` |
| Pi no recoge el prompt del subagente en el log (*supuesto*, el mismo de `Disparó:`) | Verificar en la tarea 6; si no, la medición cae a solo `Lectura extra:` declarada |
| Superar topes de bytes (dos agentes a 3 B) | Recorte en las tareas 2–3, verificado por `topes-bytes` |

**Fuera de esta pieza:** «agentes que duermen sin cerrarse». En Claude Code un subagente no se continúa (cada `Agent` parte de cero); queda como investigación pendiente solo para Pi.

## 9. Decisiones para Franco

1. **Dónde vive la regla.**
   - A) Skill `lectura-extra` + puntero en tres agentes. **Recomendada**: cabe en los topes y se carga al hacer falta.
   - B) Frase completa en cada agente (≈250 B ×3) subiendo topes de bytes.
   - C) Solo en el encargo del `coordinador` (no sirve: el bloqueo está en el agente).
2. **Alcance de la excepción.**
   - A) Solo subagentes; `coordinador` sin cambio. **Recomendada** (§1).
   - B) También el `coordinador`.
   - C) Ninguno todavía; solo medir.
3. **Tope.**
   - A) 15 KB por lectura, 3 y 30 KB por llamada. **Recomendada**.
   - B) 15 KB por lectura, sin tope por llamada.
   - C) 8 KB por lectura (una tarea), 2 por llamada.
4. **Telemetría.**
   - A) Conteo desde el log + `Lectura extra:` para el motivo; sin evento nuevo. **Recomendada**.
   - B) Evento `lectura_extra` en `registrar.mjs`.
   - C) Solo la línea declarada.

Tamaño de la pasada: 10160 bytes
