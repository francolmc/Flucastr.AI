# Pausas y fallas del builder: clasificación

Análisis de solo lectura, 2026-11-26. Cifras: **[M]** conteo reproducible; **[J]** clasificación hecha a juicio del planner sobre la línea citada.

## 1. Fuentes y límites

- [M] `runs.jsonl`: **0 archivos reales** (solo fixtures en `tests/runs-report/`). No hay relanzamientos, tiempos ni motivos registrados por `kit run`.
- [M] `progress.jsonl`: 3 archivos de 1 línea (2 `bloqueo`, 1 `comando_terminado`); uno de los bloqueos ya está en las Notes.
- [M] Notes de planes de Flucastr.AI (AI), Andes (AND), Byteria (BY), DonFinancio (DF) y DonFinancio-rapida (DFR): 223 líneas con marcadores de pausa, devolución o interrupción.
- [J] De esas líneas salen los casos de abajo; se descartan menciones, reanudaciones del mismo corte y pruebas que simulan pausas. Puede haber ±10 % por notas sin formato fijo.
- No se leyeron `.env`, llaves ni `old/v1/registro/`. De los registros de sesión solo salieron conteos.

## 2. Detenciones del builder: 87 casos

| Clase | AI | AND | BY | DF | DFR | Total | % |
|---|---|---|---|---|---|---|---|
| infraestructura | 1 | 0 | 0 | 4 | 4 | 9 | 10 |
| entorno | 1 | 2 | 3 | 4 | 0 | 10 | 11 |
| plan (alcance o estado) | 23 | 3 | 8 | 5 | 1 | 40 | 46 |
| decisión pendiente | 4 | 0 | 2 | 0 | 2 | 8 | 9 |
| tarea | 3 | 6 | 1 | 2 | 4 | 16 | 18 |
| sin causa confirmada | 0 | 0 | 1 | 2 | 1 | 4 | 5 |
| **total** | 32 | 11 | 15 | 17 | 12 | 87 | 100 |

- [J] **67 de 87 (77 %) no son falla de la tarea** (infraestructura, entorno, plan o decisión). Tarea: 16. Sin causa confirmada: 4.
- [J] Devoluciones de revisión (RETURNED), aparte porque son defecto de tarea con diagnóstico: **54** (AI 11, AND 11, BY 4, DF 26, DFR 2).
- [J] Fallas de tarea en total: 16 detenciones + 54 devoluciones = 70.

## 3. Registros de sesión (solo conteos) [M]

| Herramienta | Sesiones revisadas | Señal | Conteo |
|---|---|---|---|
| Claude Code | 301 (229 de subagente) | «Autocompact is thrashing» (tipo `invalid_request`) | 7 eventos en 5 sesiones, **todas del planner**; 0 del builder |
| Codex | 456 (220 mencionan un plan) | `turn_aborted: interrupted` en esas 220 | 141 eventos en 124 sesiones; el registro no distingue corte de la persona, del tope o de la herramienta |
| Pi | 723 (56 mencionan un plan) | `stopReason` error / aborted en esas 56 | 4 / 3 |
| Pi | 723 (todas) | errores por categoría | límite de uso 12, `invalid_request` 4, sobrecarga 2, red 1, sin categoría 51 |

- [M] No hay ningún caso local de un builder muerto por thrashing o `invalid_request`: la clase existe (visto en el planner) pero su frecuencia en el builder no está medida.

## 4. Hallazgos sobre `kit run` y el contexto

- `scripts/kit-run.mjs`: cualquier salida distinta de 0 o corte por tope del builder termina en `PAUSED motivo=access` sin relanzar; thrashing, `invalid_request` y falta de acceso quedan mezclados.
- `kit run` solo lanza Codex; Claude Code y Pi no están mapeados. En el flujo por subagente la clasificación debe poder invocarla el planner.
- Ya existe un override por corrida sin editar `models.json`: la variable `FLUCASTR_MODELOS` (`tools/model-resolution/models.mjs`) apunta a otra copia.
- La cifra **6,6 del piloto A4 no mide el planner ejecutando**: es créditos del **revisor** (2,6292, 2 revisiones, 0 ediciones) sobre el builder (0,3966), en un cambio de documentación (`docs/evaluaciones/costos.md`, «kit run: piloto A4»). El costo del relevo no está medido.
- Defecto menor: si el `PAUSED` del builder no trae `motivo=`, `kit run` usa `alcance`, que no está en la lista de motivos.

## 5. Casos

| # | Clase | Proyecto | Evidencia (plan:línea) | Causa [J] |
|---|---|---|---|---|
| 1 | tarea | AI | probar-revisor-luna:68 | lanzó dos veces la medición y pasó el tope de créditos |
| 2 | tarea | AI | comparar-openspec:162 | PAUSA sin impedimento real (salida esperada) |
| 3 | entorno | AI | comparar-openspec:184 | aislamiento del runner |
| 4 | infraestructura | AI | comparar-openspec:204 | corte por tope de 60 min sin retorno |
| 5 | plan (alcance o estado) | AI | continuidad/tramo-3:97 | verify falla fuera del alcance del tramo |
| 6 | plan (alcance o estado) | AI | aceptacion:143 | comando de comprobación del plan no servía |
| 7 | plan (alcance o estado) | AI | idioma-adaptable/tramo-9:41 | contratos en conflicto en el plan |
| 8 | tarea | AI | idioma-adaptable/tramo-1:65 | tres verify fallidos |
| 9 | decisión pendiente | AI | idioma-adaptable/plan:124 | criterio exige decidir qué referencias se exceptúan |
| 10 | plan (alcance o estado) | AI | estructura-repo:421 | verify falla por ventana de fechas; ampliar alcance |
| 11 | plan (alcance o estado) | AI | estructura-repo:455 | el tramo cita un módulo no identificado |
| 12 | plan (alcance o estado) | AI | estructura-repo:498 | comparación exigida demasiado estricta (hashes) |
| 13 | plan (alcance o estado) | AI | estructura-repo:681 | comparación exigida depende de números de línea |
| 14 | plan (alcance o estado) | AI | estandarizar-ingles:309 | comprobación literal imposible dentro del alcance |
| 15 | plan (alcance o estado) | AI | estandarizar-ingles:352 | criterio literal incompatible con datos excluidos |
| 16 | plan (alcance o estado) | AI | estandarizar-ingles:371 | criterio literal incompatible con nombres reales |
| 17 | plan (alcance o estado) | AI | estandarizar-ingles:400 | criterio literal y compatibilidad de clave |
| 18 | plan (alcance o estado) | AI | kit-scope-close:258 | límite de tamaño del plan |
| 19 | plan (alcance o estado) | AI | kit-scope-close:268 | calibración exige código fuera de alcance |
| 20 | plan (alcance o estado) | AI | kit-scope-close:308 | límite de tamaño del plan |
| 21 | decisión pendiente | AI | medir-cache-revisor:55 | presupuesto excedido 2 % |
| 22 | plan (alcance o estado) | AI | soporte-codex:237 | verify falla fuera de alcance |
| 23 | decisión pendiente | AI | permisos-contrato:97 | falta prueba real de la persona |
| 24 | decisión pendiente | AI | permisos-contrato:98 | falta decidir comportamiento |
| 25 | plan (alcance o estado) | AI | fix-verify-sandbox-eperm:141 | regresión de un tramo anterior, fuera de alcance |
| 26 | plan (alcance o estado) | AI | fix-verify-sandbox-eperm/progress.jsonl | sin duración previa medida |
| 27 | plan (alcance o estado) | AI | progreso-en-vivo:246 | regla de duración del modo continuo |
| 28 | plan (alcance o estado) | AI | kit-run-puerta:247 | verify bloqueado por la puerta de un tramo anterior |
| 29 | plan (alcance o estado) | AI | kit-run-puerta:257 | arreglo fuera de alcance |
| 30 | plan (alcance o estado) | AI | proceso-rapido:178 | prueba fuera de alcance |
| 31 | plan (alcance o estado) | AI | kit-run/plan:145 | estado «en curso» tras kit run |
| 32 | plan (alcance o estado) | AI | kit-run/plan:148 | estado «en curso» tras kit run |
| 33 | tarea | AND | paridad-visual:289 | tres verify en el mismo recorrido |
| 34 | tarea | AND | paridad-visual:295 | tres verify en el mismo recorrido |
| 35 | tarea | AND | paridad-visual:319 | diferencia de coordenadas |
| 36 | tarea | AND | paridad-visual:323 | dimensiones de tabla |
| 37 | plan (alcance o estado) | AND | paridad-visual:329 | estado in progress |
| 38 | entorno | AND | paridad-visual:361 | disco /tmp lleno |
| 39 | tarea | AND | migracion-operaciones:126 | corrección de fixture pendiente de verify |
| 40 | plan (alcance o estado) | AND | migracion-operaciones:141 | alcance insuficiente para el criterio |
| 41 | plan (alcance o estado) | AND | migracion-operaciones:155 | estado in progress |
| 42 | entorno | AND | migracion-operaciones:167 | MySQL no arranca sano |
| 43 | tarea | AND | migracion-operaciones:210 | aserción de codificación; límite de verify |
| 44 | plan (alcance o estado) | BY | ordenes-y-ensayo:118 | línea del plan ambigua |
| 45 | decisión pendiente | BY | supervisor-wasi:96 | límite de memoria incompatible con el runtime |
| 46 | entorno | BY | supervisor-wasi:103 | Chromium agota arranque |
| 47 | entorno | BY | base-byteria:122 | motivo=access |
| 48 | plan (alcance o estado) | BY | base-byteria:167 | verify delegado al planner |
| 49 | entorno | BY | verify-entorno-api:150 | Chromium ausente |
| 50 | decisión pendiente | BY | pampa-pantalla-unica:539 | dos criterios de diseño se contradicen |
| 51 | sin causa confirmada | BY | patrulla-visual:63 | verify del revisor, causa no confirmada |
| 52 | plan (alcance o estado) | BY | manual-y-movil:254 | arreglo fuera de alcance |
| 53 | plan (alcance o estado) | BY | cronica-y-mundo:271 | motivo=scope |
| 54 | plan (alcance o estado) | BY | escena-mundo:472 | umbral exige archivo fuera de alcance |
| 55 | plan (alcance o estado) | BY | atalaya-docente:293 | instrucción contradice regla de historias |
| 56 | plan (alcance o estado) | BY | atalaya-docente:330 | motivo=scope |
| 57 | tarea | BY | ejecucion-segura:187 | primer POST fallaba |
| 58 | plan (alcance o estado) | BY | ejecucion-segura:206 | pausa administrativa por estado del plan |
| 59 | sin causa confirmada | DF | fix-origen-proxy:78 | contenedor sale 1 sin causa |
| 60 | tarea | DF | auth-codigo-correo:109 | carrera en prueba de salud, repetida |
| 61 | sin causa confirmada | DF | fix-ingreso-origen:160 | puerto no abre en plazo, no confirmada |
| 62 | tarea | DF | obligaciones:695 | localizador de la prueba |
| 63 | entorno | DF | obligaciones:697 | imagen sin autorización de descarga |
| 64 | entorno | DF | obligaciones:699 | falta navegador de pruebas |
| 65 | entorno | DF | obligaciones:701 | falta imagen Docker |
| 66 | entorno | DF | obligaciones:703 | señal 143 sin origen |
| 67 | plan (alcance o estado) | DF | panel-recordatorios:669 | regla de duración |
| 68 | plan (alcance o estado) | DF | sistema-diseno-web:174 | configuración fuera de alcance |
| 69 | plan (alcance o estado) | DF | auth-frontend:157 | estado exigido fuera del paso |
| 70 | plan (alcance o estado) | DF | onboarding-base:232 | causa fuera del alcance |
| 71 | plan (alcance o estado) | DF | onboarding-base:250 | causa fuera del alcance |
| 72 | infraestructura | DF | cimientos:155 | corte por plazo sin informe |
| 73 | infraestructura | DF | cimientos:165 | corte por plazo sin informe |
| 74 | infraestructura | DF | cimientos:188 | corte por plazo sin informe |
| 75 | infraestructura | DF | cimientos:190 | corte por plazo sin informe |
| 76 | infraestructura | DFR | f07:190 | corrida superó 30 min |
| 77 | plan (alcance o estado) | DFR | f07:195 | controles de otra función afectados |
| 78 | tarea | DFR | f07:194 | control de regresión sin verificar |
| 79 | tarea | DFR | f06:130 | tercer verify fallido |
| 80 | tarea | DFR | f06:135 | prueba de salud inestable |
| 81 | infraestructura | DFR | F09:176 | interrupción |
| 82 | decisión pendiente | DFR | F08:138 | rama existente requiere confirmación |
| 83 | infraestructura | DFR | F04/historial:170 | sin avance observable |
| 84 | tarea | DFR | F04/historial:206 | tercera corrida sin pasar |
| 85 | sin causa confirmada | DFR | F04:72 | verify 1, causa no determinada |
| 86 | infraestructura | DFR | F04:74 | verificación interrumpida por el principal |
| 87 | decisión pendiente | DFR | F04:91 | la persona detiene la ejecución |

Devoluciones contadas: AI piso-planner:355,468; progreso-en-vivo:199; ventana-por-agente:225,234; continuidad:185; kit-check:226; kit-scope-close:302; planes-por-feature:124; casillas-en-vivo:159; estandarizar-ingles:399. AND paridad-visual:235,239,247,249; migracion-operaciones:127,130,169,180,190,196; actualizar-estructura:232. BY entrenamiento:325; cambio-enfoque-mundo:99; migraciones-en-despliegue:91; ejecucion-segura:186. DF fix-origen-proxy:79; auth-codigo-correo:104,116; preparar-dokploy:93; obligaciones:687,692,705,728,736,742; panel-recordatorios:680,703,738,756-759,770; fix-ingreso-origen:161,167,174; cimientos:141,143,178,182,198,202; onboarding-base:220; estructura-pantallas:119. DFR f07:183; F05:152.
