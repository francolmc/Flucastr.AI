# Sondeo: cómo hacer que Pi consuma menos tokens con el flujo del kit

Fecha: 2026-10-31. Borrador. Solo lectura e investigación: no se tocó código, `definitions/` ni `STATUS.md`; no se abrieron `auth.json`, `models-store.json` ni sesiones. Un comando mío que rozaba `~/.pi/agent/models-store.json` fue bloqueado por el sistema y no se ejecutó; la ventana de contexto se leyó del catálogo incluido en el paquete (ver P2).

Rutas abreviadas: `DOCS` = `~/.pi/agent/install/releases/1.4.0/node_modules/@earendil-works/pi-coding-agent/docs`; `DIST` = `.../pi-coding-agent/dist`; `PIAI` = `.../@earendil-works/pi-ai/dist`; `SUB` = `~/.pi/agent/npm/node_modules/pi-subagents`.

Convención: CONFIRMADO = lo leí en un archivo (ruta); INFERIDO = cálculo mío sobre datos de Franco; NO VERIFICADO = sin evidencia local.

## 0. Conclusión corta

1. El costo es contexto reenviado, no el prompt base ni la salida. Con los precios del catálogo (`cacheRead` 0,10 USD/M) y los datos de Franco: 31,2 M × 0,10 = 3,12 USD de los 4,15 USD (≈75 %, INFERIDO). El gasto crece con *turnos × tamaño medio del contexto*, así que la palanca es **mantener corto el contexto**, no ahorrar tokens de prompt.
2. La hipótesis «la caché expira en cada puerta» **no se sostiene con los datos**: en la sesión grande, los tokens que no son caché leída suman ≈0,3 M (31,5 − 31,2), que es justo el crecimiento del contexto (≈0,22 M) más la salida (241 × 270 ≈ 0,065 M). No cabe ninguna relectura completa a 130 k (INFERIDO). Queda sin medir en otras sesiones; se mide con `showCacheMissNotices` (P1).
3. Palancas por impacto estimado: (a) sesión nueva por puerta/tarea, (b) compactación temprana por proyecto (≈100 k en vez de ≈255 k), (c) lecturas acotadas. Los subagentes y las skills no son el problema hoy.

## P1. Caché de prompt

| CONFIRMADO | NO VERIFICADO |
|---|---|
| Retención por defecto `short`; `PI_CACHE_RETENTION=long` la pide larga (`DOCS/environment-variables.md`; `PIAI/api/openai-responses.js` `resolveCacheRetention`). | TTL real de `short` en OpenAI: ni Pi ni el catálogo lo declaran para `gpt-6.1-sol`. Habría que verlo en la documentación del proveedor (no consultada). |
| Para `openai/gpt-6.1-sol` (usa `supportsExplicitPromptCacheMode`): `short` no envía opciones (queda el valor por defecto del proveedor); `long` envía `prompt_cache_options: {ttl: "30m"}` (`PIAI/api/openai-responses.js` `getPromptCacheOptions`). `prompt_cache_key` = id de sesión. | Si `long` cambia el precio de escritura (el catálogo solo trae un `cacheWrite` de 2,5 USD/M). |
| `cacheWarming` (`streaming` por defecto, global): refresca la caché con un reenvío de 1 token **solo si el modelo declara `promptCache` (segundos)** y el ahorro esperado ≥ 0,05 USD; el modo `idle` también cubre pausas entre ejecuciones, con probabilidad de continuación fija de 0,15 y horizonte de 30 min (`DOCS/settings.md`; `DIST/core/cache-warmer.js`). | Si `models-store.json` (no abierto) agrega `promptCache` a este modelo. |
| El catálogo de `gpt-6.1-sol` **no trae `promptCache`** (`PIAI/providers/data/openai.json`): con el catálogo incluido, el calentamiento no es elegible. Se puede declarar en `~/.pi/agent/models.json` con `modelOverrides` (`DOCS/models.md#prompt-cache-lifetimes`). | Beneficio real del calentamiento para este flujo (pausas de minutos): sin medir. |
| Invalida la caché cualquier cambio de prefijo: `/reload` con cambios de AGENTS.md/skills, cambio de definición de herramientas (`SUB/docs/configuration.md` `pinToolDeclarations`: «a changed definition makes the provider read the whole conversation again»). La compactación también cambia el prefijo. | — |
| `showCacheMissNotices` (global, `false` por defecto): avisos de fallos de caché significativos, calentamiento y compactación (`DOCS/settings.md`). `/session` muestra la próxima decisión de calentamiento. | — |
| Cambiar el nivel de razonamiento **no** rompe la caché en este modelo: `supportsMidConvoEffort` está activo (`PIAI/providers/data/openai.json`). | — |

Costo de un fallo, INFERIDO con precios del catálogo: reprocesar 130 k a 2,5 USD/M ≈ 0,33 USD frente a 0,013 USD leyendo caché (≈25 veces). Un fallo por puerta importa, pero los datos de la sesión grande no muestran ninguno (conclusión 2).

## P2. Compactación

| CONFIRMADO | NO VERIFICADO |
|---|---|
| Dispara con `contextTokens > contextWindow - reserveTokens`; `reserveTokens` 16384, `keepRecentTokens` 20000 por defecto (`DOCS/compaction.md`, `DOCS/settings.md`). | Si `models-store.json` o `~/.pi/agent/models.json` cambian la ventana de este modelo. |
| Ventana de `gpt-6.1-sol` en el catálogo: **272.000** con proveedor `openai`; **500.000** con `openai-codex` (`PIAI/providers/data/openai.json` y `openai-codex.json`). El id `openai/gpt-6.1-sol` del kit (`modelos.json`) apunta al proveedor `openai`, es decir 272 k. Con el contexto final de 220 k de Franco, la compactación dispararía a 255.616 (272.000 − 16.384): por eso «nunca compactó». | Que Franco use realmente el proveedor `openai` y no `openai-codex`. Se comprueba con el porcentaje del pie de Pi o con `/session`. |
| El catálogo trae **tramo de precio** sobre 272.000 tokens: entrada 4, caché leída 0,20 (el doble) (`openai.json`). Con 272 k de ventana no se llega a ese tramo. | — |
| Fórmula: `reserveTokens = ventana − umbral_deseado`. Para compactar a ≈100 k con ventana 272 k: **172000**. Con ventana 500 k: 400000. | — |
| `compaction.modelOverrides` por `provider/modelId` exacto, distingue mayúsculas; cada valor cae por separado a la configuración ordinaria y luego al valor por defecto (`DOCS/compaction.md` «Per-model overrides»). Sirve para no afectar a otros modelos. | — |
| **Por proyecto sí se puede:** `<proyecto>/.pi/settings.json` (`DOCS/compaction.md` «When It Triggers»; `DOCS/configuration.md`). Los objetos de usuario y proyecto se funden recursivamente antes de buscar el modelo. Requiere confianza de proyecto (`DOCS/security.md`: `.pi/settings.json` está protegido); `~/.pi/agent/trust.json` ya lista proyectos de Franco. | — |
| La compactación resume una vez, deja `resumen + keepRecentTokens` y las peticiones de resumen no escriben caché (`DOCS/compaction.md`). El siguiente turno paga una escritura de caché del contexto nuevo (~30–40 k, ≈0,09 USD, INFERIDO). | Calidad del resumen para este flujo. El estado vive en archivos (`STATUS.md`, tareas), lo que reduce el riesgo; sin medir. |

Configuración sugerida (proyecto o global; los valores son punto de partida, ESTIMACIÓN):

```json
{ "compaction": { "modelOverrides": { "openai/gpt-6.1-sol": { "reserveTokens": 172000 } } } }
```

Efecto estimado en la sesión grande (INFERIDO, modelo simple: +0,9 k tokens por turno, contexto tras compactar ≈35 k, umbral 100 k): contexto medio ≈67 k en vez de 130 k; caché leída 3,12 → ≈1,6 USD, menos ≈0,3 USD de compactaciones: **ahorro ≈1,2 USD (≈30 %)**.

## P3. Subagentes (`pi-subagents` 0.84.0)

| CONFIRMADO | NO VERIFICADO |
|---|---|
| Al principal vuelve **solo la salida final del subagente**, inline, **sin tope por defecto** (`SUB/docs/tool-reference.md`, `options.maxOutput`). El contexto interno del hijo no entra al del principal. | Tamaño real de lo que devuelven los subagentes del kit (los datos no los muestran entre los saltos > 8 k, lo que sugiere que son cortos). |
| Parámetros que acotan lo devuelto: `options.maxOutput {bytes, lines}`; `output` + `outputMode: "file-only"` (vuelve solo «Output saved to: ruta (tamaño)»); `options.includeProgress` (falso). | Si el modelo del coordinador pasa esos parámetros solo (hoy ningún prompt del kit se los pide). |
| `options.context`: `fresh` (por defecto) o `fork`. **`fork` copia la conversación del padre** y hereda su prompt base y skills (`tool-reference.md` «Fork context details»); es más caro, no más barato. Solo `oracle` y `advisor` van en `fork` por defecto. | — |
| Hijos «estrechos» por defecto: sin prompt base de Pi, sin archivos de contexto del proyecto, sin catálogo de skills salvo `inheritProjectContext`, `inheritSkills`, `inheritGlobalContext` (`SUB/docs/agents.md` ~L378–392). Los agentes generados por el kit (`~/.pi/agent/agents/*.md`) no declaran esos campos. | Qué incluye exactamente su prompt (`systemPromptMode: replace` por defecto). |
| Peso en el prompt del principal: la descripción de la herramienta `subagent` es corta por defecto (`toolDescriptionMode`, `SUB/docs/configuration.md`); `subagents_enable` activa la herramienta completa bajo demanda; el catálogo de agentes anunciados solo existe con `advertise: true`, tope 16 agentes y 12.288 bytes (`agents.md` ~L368). Los agentes del kit no declaran `advertise`. | Tokens exactos que suman `subagent`, `bg_wait`, `subagents_enable` y los dos skills del paquete (`council-mode`, `pi-subagents`). Se mide con A/B (ver §4). |

Lectura (INFERIDO): con la base de 9,1 k ya medida, el paquete no es la causa. En la sesión grande el principal hizo 62 `read`, 63 `write`, 44 `edit` y solo 35 llamadas a `subagent`: el contexto se llena por trabajo hecho en el principal.

## P4. Skills

| CONFIRMADO | NO VERIFICADO |
|---|---|
| Pi pone en el prompt **solo nombre, descripción y ruta**; el cuerpo se lee bajo demanda (`DOCS/skills.md` «Understand how skills load»). | — |
| Duplicados globales y de proyecto: ante colisión de nombre «keep the first discovered skill and produce a warning» (`DOCS/skills.md`). No se listan dos veces. | Cuál de las dos copias gana. Es irrelevante para tokens; sí para qué texto de skill se usa. |
| Costo de las 7 skills del kit en el prompt: 1.574 caracteres de descripción (`skills/*/SKILL.md`), ≈400–600 tokens con nombres y rutas (ESTIMACIÓN, caracteres/4). `backlog-lite` y las skills de `pi-subagents` suman 3 descripciones más. | — |

Impacto: despreciable (≈0,5 k tokens por turno × 0,10 USD/M ≈ 0,01 USD en 241 turnos). No se justifica cambiar nada.

## P5. Herramientas de lectura

| CONFIRMADO | NO VERIFICADO |
|---|---|
| `read`: tope 2000 líneas o 50 KB (lo primero que ocurra), con `offset` y `limit` (`DIST/core/tools/read.js`, `truncate.js`). 50 KB ≈ 12 k tokens por lectura (ESTIMACIÓN): explica saltos > 8 k. | Cómo reparte el modelo las lecturas en la sesión de Franco (no se abrió). |
| `grep`: 100 coincidencias o 50 KB, líneas a 500 caracteres, parámetro `limit` (`DIST/core/tools/grep.js`). `bash`: últimas 2000 líneas o 50 KB, salida completa a archivo temporal. | — |
| **Esos topes no son configurables:** `settings.md` y `settings-schema.js` no tienen claves de tamaño de lectura (búsqueda de `maxBytes`/`maxLines`/`toolOutput` sin resultados). Solo `images.*` limita imágenes. | — |
| `codemode` (desactivado por defecto) deja al modelo filtrar resultados con un script y solo ve la salida (`max_output_tokens` 10000); `defaultTools: ["+codemode"]` lo activa (`DOCS/codemode.md`, `DOCS/settings.md`). | Si el modelo lo usa bien con este flujo; cambia el comportamiento de todos los agentes, riesgo alto. |
| `write` y `edit` ponen **el contenido de la llamada** en el contexto (argumentos de herramienta), no solo el resultado. | Tamaño del efecto en la sesión (63 `write` completos). INFERIDO: reescribir archivos enteros engorda más que `edit`. |

## P6. Extensiones y prompt base (solo nombres y tamaños)

| Elemento | Tamaño | Origen |
|---|---|---|
| `~/.pi/agent/AGENTS.md` | 802 B | CONFIRMADO |
| `~/.pi/agent/APPEND_SYSTEM.md` | 389 B | CONFIRMADO |
| `AGENTS.md` del proyecto (este repo) | 1.210 B | CONFIRMADO |
| Cuerpo de `agentes/coordinador.md` (se pasa con `--append-system-prompt` en `pi-coordinador`, `instalar.sh` L306–325) | 15.768 B ≈ 3,9 k tokens (ESTIMACIÓN) | CONFIRMADO (tamaño) |
| Otros agentes del kit | arquitecto 3,6 KB, planificador 3,9 KB, constructor 2,1 KB | CONFIRMADO |
| Extensiones (paquetes en `~/.pi/agent/settings.json`) | `pi-subagents`, `pi-agent-mode` (index.ts 28 KB, antepone el cuerpo del agente activo al prompt en `before_agent_start`), `pi-notify` (3 KB). `~/.pi/agent/extensions/` vacío. | CONFIRMADO |
| Prompts de usuario: `estado.md`, `revisar.md`, `siguiente.md` (212–368 B); skills extra: `backlog-lite` | — | CONFIRMADO |

Suma estimada de la base: 9,1 k medidos; el cuerpo del coordinador es ≈40 % de eso. Costo de toda la base: 9,1 k × 241 turnos × 0,10 USD/M ≈ **0,22 USD de 4,15 (≈5 %)**, INFERIDO. Recortar el coordinador ahorraría centavos y arriesga los comprobadores de contrato. No es una palanca.

NO VERIFICADO: si `pi-agent-mode`, al devolver `systemPrompt` propio en `before_agent_start`, hace que las secciones de `pi-subagents` se «plieguen» al prompt de sistema (`SUB/docs/agents.md` L374) y así cambien la caché en medio de la sesión.

## 4. Palancas ordenadas por impacto estimado

Base: costo ∝ turnos × contexto medio. Datos de Franco: sesión de 29 turnos a 0,21 USD = 0,0072 USD/turno (contexto ≈25 k); sesión de 241 turnos a 4,15 USD = 0,0172 USD/turno (≈130 k): **2,4 veces más por turno**.

| # | Palanca | Impacto (ESTIMACIÓN) | Quién | Esfuerzo | Riesgo |
|---|---|---|---|---|---|
| 1 | **Sesión nueva en cada puerta/tarea** (`/new`; el estado ya está en archivos). Partir 241 turnos en sesiones de ≈29 da ≈8 × 0,21 = 1,75 USD vs 4,15: **−55 %** | alto | Kit (README + coordinador sugiere) y Franco (hace `/new`) | bajo | bajo. Conflicto: en yolo la vigencia no sobrevive a una sesión nueva (`agentes/coordinador.md`, «Vigencia»; `WORKFLOW.md` §9.3): ahí se sugiere `/compact`, no `/new` |
| 2 | **Compactar temprano** (`reserveTokens` 172000 con `modelOverrides` → dispara a ≈100 k): **−30 %** en sesiones largas | alto | Franco (global o `.pi/settings.json`); kit (documentar; instalar opcional) | bajo si es documentación; medio si `instalar.sh` escribe JSON (hay que fundir con el existente) | medio: pérdida de detalle en el resumen; depende de la ventana real (P2) |
| 3 | **Lecturas acotadas en los prompts**: `read` con `offset/limit`, `grep` con patrón estrecho y `limit`, `edit` en vez de `write` de archivos enteros, no releer lo ya leído. Reduce los saltos de 8–12 k | medio–bajo | Kit (`agentes/constructor.md`, skill `ejecutar-tarea`) | bajo | bajo–medio: puede perder contexto; verificar con los comprobadores de contrato |
| 4 | Medir antes de decidir: `showCacheMissNotices: true` unos días y mirar fallos tras las puertas; `/session` | informa | Franco | muy bajo | ninguno |
| 5 | `PI_CACHE_RETENTION=long` (TTL 30 min) y/o `promptCache` en `models.json` para activar calentamiento | bajo hoy: no hay fallos medidos (conclusión 2) | Franco | bajo | bajo; efecto en precio NO VERIFICADO |
| 6 | Reportes breves y `outputMode: file-only` de subagentes | bajo hoy: los subagentes no aparecen en los saltos grandes | Kit | medio | medio (choca con contratos `BLOQUEO:`, `REFINAR:`, `CONFIRMAR:`, `Registro:`) |
| 7 | `codemode` | incierto | Franco | bajo | alto (cambia el comportamiento de todos los agentes) |
| 8 | Recortar coordinador / skills / base | ≈1–2 % | Kit | medio | medio |

No ayuda, según los datos: bajar el razonamiento (la salida no cambió: 200 a 270 tokens por turno; la salida vale ≈0,65 USD de 4,15, INFERIDO).

Medición recomendada de la base: arrancar `pi` con y sin `--no-extensions` / `--no-skills` y comparar los tokens del turno 1 en `/session`. Así se sabe cuánto suma `pi-subagents` sin suponerlo.

## 5. Qué solo puede hacer Franco

- Escribir `compaction` en `~/.pi/agent/settings.json` (global) o confiar (`/trust`) en un proyecto con `.pi/settings.json`.
- `showCacheMissNotices`, `cacheWarming`, `PI_CACHE_RETENTION`, `promptCache` en `models.json`.
- Teclear `/new` o `/compact`: un agente no puede ejecutar comandos de barra.
- Confirmar el proveedor real (`openai` o `openai-codex`) y la ventana mostrada en el pie.

## 6. Recomendación para F18

Entra:

1. **Guía de sesión corta en `README.md`** (ya prevista), con los números de arriba (2,4 veces por turno; una sesión por tarea o por puerta) y cuándo usar `/new` frente a `/compact`.
2. **El coordinador sugiere en cada puerta** (en «Espera a Franco» y en su respuesta, sin bloquear): `/new` y «retoma con `pi-coordinador`» fuera de yolo; `/compact` en yolo (la vigencia de yolo no cruza sesiones). Debe respetar los contratos existentes.
3. **Quitar la línea de `modelos.json`** de `agentes/*.md` (higiene; ahorro de tokens despreciable).
4. **Guía de compactación en el README**, con el fragmento JSON de P2 y la fórmula `ventana − umbral`, **sin instalarla automáticamente**: la ventana depende del proveedor y fundir JSON ajeno tiene riesgo. Marcarlo como candidato a feature posterior tras medir.
5. **Línea de lectura acotada** en `agentes/constructor.md` / `ejecutar-tarea` (palanca 3), solo si los comprobadores de contrato la admiten sin tocar `BLOQUEO:`/`CONFIRMAR:`.

Queda fuera hasta medir: reportes breves de subagentes, instalación de `.pi/settings.json`, `PI_CACHE_RETENTION`, `codemode`, recorte del coordinador.

Criterio de éxito sugerido: repetir una sesión comparable y comparar USD por turno y contexto medio con el script de resumen de Franco (línea base: 0,0172 USD/turno a ≈130 k; 0,0072 USD/turno a ≈25 k).

## 7. Preguntas abiertas para Franco

1. ¿El proveedor de `openai/gpt-6.1-sol` es `openai` (272 k) y no `openai-codex` (500 k)? Se ve en el pie de Pi.
2. ¿Quieres probar `showCacheMissNotices: true` una semana antes de decidir sobre caché larga?
3. ¿Aceptas que en yolo se sugiera `/compact` y fuera de yolo `/new`?
4. ¿La compactación por proyecto entra como guía (propuesto) o como parte de `instalar.sh`?
