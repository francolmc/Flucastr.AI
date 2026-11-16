# Secuencia de tramos prevista

Esta es la descomposición de implementación, no autorización de ejecución. Un renglón representa un tramo independiente: no agrupar los movimientos de una fila con los de otra. Los destinos son propuestas sujetas a la matriz de consumidores del tramo 1. Cada documento fija rutas, dependencias y comprobaciones; el estado del plan y las limitaciones están en el índice.

## Protocolo de cada tramo

Cada documento `tramo-N.md` debe incluir: resultado para el usuario; dependencia del tramo anterior y cualquier herramienta externa; contratos y rutas precisas; como máximo tres archivos de producto, incluidos wrappers y destino; criterio CUANDO/ENTONCES y ejemplo; pasos atómicos con comprobación y resultado esperado; y handoff. Documentos y pruebas no cuentan como archivos de producto. Nunca se presupone que una carpeta entera equivale a un archivo. Si mover una unidad excede el límite, crear primero compatibilidad en otros tramos y dividirla archivo por archivo.

Todos los tramos ejecutan `./verify` completo y `bash instalar.sh --simular` en entorno aislado, comparando con la línea base; registrar código, salida, efectos y duración. Mantener pruebas de aceptación y negativas. En caso de diferencias, falla, nuevos consumidores o incompatibilidad de un enlace instalado, no avanzar. La anonimización de nombres en mensajes y archivos generados ya fue autorizada; cualquier otra diferencia observable requiere decisión. No efectuar instalaciones en el HOME real ni leer secretos. El principal revisa cada tramo antes de aprobar el siguiente.

## A. Referencia y compatibilidad

| Tramo | Resultado y alcance previsto | Depende de | Comprobación adicional |
|---|---|---|---|
| 1 | [Línea base](tramo-1.md): medir las dos órdenes sin editar producto. | Herramientas locales disponibles | Comparar dos simulaciones; conservar salidas y códigos sanitizados. |
| 2 | [Inventario de consumidores](tramo-2.md) y contratos de `instalar.sh`, `desinstalar.sh`, `instalar-remoto.sh`, `verify` y `scripts/`; registrar matriz en `cambios/estructura-repo/`. | 1 | Identificar también lanzadores, enlaces, modo copia, rutas y tests negativos. |
| 3 | [Diseñar y documentar compatibilidad](tramo-3.md) para rutas antiguas y futuras, incluyendo enlaces instalados y `cambios/hechos/`; sin cambios de producto. | 2 | Demostrar por inspección cómo accede cada consumidor y localizar las pruebas que cubren cada ruta. |

## B. `verify`: una fase por tramo

Las extracciones mantienen el shell y el orden original. Cada enlace contiene el bloque, destinos, contratos y comprobaciones; el tramo 26 aplica la excepción aprobada del fixture anónimo.

| Tramo | Documento ejecutable en borrador | Depende de | Comprobación |
|---|---|---|---|
| 4 | [Ver tramo 4](tramo-4.md) | 3 | `./verify` y simulación aislados. |
| 5 | [Ver tramo 5](tramo-5.md) | 4 | `./verify` y simulación aislados. |
| 6 | [Ver tramo 6](tramo-6.md) | 5 | `./verify` y simulación aislados. |
| 7 | [Ver tramo 7](tramo-7.md) | 6 | `./verify` y simulación aislados. |
| 8 | [Ver tramo 8](tramo-8.md) | 7 | `./verify` y simulación aislados. |
| 9 | [Ver tramo 9](tramo-9.md) | 8 | `./verify` y simulación aislados. |
| 10 | [Ver tramo 10](tramo-10.md) | 9 | `./verify` y simulación aislados. |
| 11 | [Ver tramo 11](tramo-11.md) | 10 | `./verify` y simulación aislados. |
| 12 | [Ver tramo 12](tramo-12.md) | 11 | `./verify` y simulación aislados. |
| 13 | [Ver tramo 13](tramo-13.md) | 12 | `./verify` y simulación aislados. |
| 14 | [Ver tramo 14](tramo-14.md) | 13 | `./verify` y simulación aislados. |
| 15 | [Ver tramo 15](tramo-15.md) | 14 | `./verify` y simulación aislados. |
| 16 | [Ver tramo 16](tramo-16.md) | 15 | `./verify` y simulación aislados. |
| 17 | [Ver tramo 17](tramo-17.md) | 16 | `./verify` y simulación aislados. |
| 18 | [Ver tramo 18](tramo-18.md) | 17 | `./verify` y simulación aislados. |
| 19 | [Ver tramo 19](tramo-19.md) | 18 | `./verify` y simulación aislados. |
| 20 | [Ver tramo 20](tramo-20.md) | 19 | `./verify` y simulación aislados. |
| 21 | [Ver tramo 21](tramo-21.md) | 20 | `./verify` y simulación aislados. |
| 22 | [Ver tramo 22](tramo-22.md) | 21 | `./verify` y simulación aislados. |
| 23 | [Ver tramo 23](tramo-23.md) | 22 | `./verify` y simulación aislados. |
| 24 | [Ver tramo 24](tramo-24.md) | 23 | `./verify` y simulación aislados. |
| 25 | [Ver tramo 25](tramo-25.md) | 24 | `./verify` y simulación aislados. |
| 26 | [Ver tramo 26](tramo-26.md) | 25 | `./verify` y simulación aislados. |

## C. Resolver: preparación y primeras extracciones

| Tramo | Documento | Comprobación adicional |
|---|---|---|
| 27 | [Caracterizar subcomandos](tramo-27.md) | Códigos, salidas y efectos para casos válidos y negativos. |
| 28 | [Preparar copia remota](tramo-28.md) | Paquete remoto offline incluye `tools/` y `adapters/`. |
| 29 | [Extraer errores](tramo-29.md) | Errores y códigos idénticos. |
| 30 | [Extraer predicados](tramo-30.md) | Validaciones idénticas. |
| 31 | [Extraer lectura JSON](tramo-31.md) | Lecturas y errores idénticos. |

| Tramo | Documento | Comprobación adicional |
|---|---|---|
| 32 | [Extraer escritura atómica](tramo-32.md) | Matriz y comprobación específica del documento. |
| 33 | [Extraer bloqueo de Pi](tramo-33.md) | Matriz y comprobación específica del documento. |
| 34 | [Separar resolución de modelos](tramo-34.md) | Matriz y comprobación específica del documento. |
| 35 | [Extraer lectura de cabeceras](tramo-35.md) | Matriz y comprobación específica del documento. |
| 36 | [Extraer transformación de herramientas de Pi](tramo-36.md) | Matriz y comprobación específica del documento. |
| 37 | [Separar cálculo de compactación de Pi](tramo-37.md) | Matriz y comprobación específica del documento. |
| 38 | [Separar aplicación de compactación de Pi](tramo-38.md) | Matriz y comprobación específica del documento. |
| 39 | [Separar compactación de Claude Code](tramo-39.md) | Matriz y comprobación específica del documento. |
| 40 | [Separar hook de Claude Code](tramo-40.md) | Matriz y comprobación específica del documento. |
| 41 | [Separar validación de ruta de ajustes Claude](tramo-41.md) | Matriz y comprobación específica del documento. |
| 42 | [Separar reglas deny de Claude Code](tramo-42.md) | Matriz y comprobación específica del documento. |
| 43 | [Separar sandbox de Claude Code](tramo-43.md) | Matriz y comprobación específica del documento. |
| 44 | [Separar reglas deny de Codex](tramo-44.md) | Matriz y comprobación específica del documento. |
| 45 | [Separar formato de agentes Claude y Pi](tramo-45.md) | Matriz y comprobación específica del documento. |
| 46 | [Separar formato de agentes Codex](tramo-46.md) | Matriz y comprobación específica del documento. |
| 47 | [Separar ajustes del agente y comparación de modelos](tramo-47.md) | Matriz y comprobación específica del documento. |

## D. Ejecución: `kit run`

| Tramo | Documento | Comprobación adicional |
|---|---|---|
| 48 | [Caracterizar kit run](tramo-48.md) | Matriz del tramo 48 y prueba específica. |
| 49 | [Separar lectura y edición del plan](tramo-49.md) | Matriz del tramo 48 y prueba específica. |
| 50 | [Separar ejecución de procesos](tramo-50.md) | Matriz del tramo 48 y prueba específica. |
| 51 | [Separar huella del árbol](tramo-51.md) | Matriz del tramo 48 y prueba específica. |
| 52 | [Separar esquema y validación del veredicto](tramo-52.md) | Matriz del tramo 48 y prueba específica. |
| 53 | [Separar prompts de ejecución y revisión](tramo-53.md) | Matriz del tramo 48 y prueba específica. |
| 54 | [Separar resolución de perfiles y política](tramo-54.md) | Matriz del tramo 48 y prueba específica. |
| 55 | [Separar construcción del comando](tramo-55.md) | Matriz del tramo 48 y prueba específica. |

## Tramos posteriores y compatibilidad

Los instaladores, núcleo y herramientas se detallan en los documentos enlazados más abajo. Las rutas `pruebas/`, `old/` y `cambios/hechos/` se conservan para no romper consumidores ni alterar históricos. `tests/`, `evals/`, `archive/` y `changes/` incorporan las entradas e índices indicados en los tramos 119–143; no se afirma que ya se trasladaron todos sus contenidos.

## Instalador: tramos definidos

Tramo 56: matriz aislada de instalación y migración. Tramos 57–80: extracciones individuales de registro, enlaces, skills, adaptadores y migración; ver cada `tramo-N.md`. Cargar módulos en el mismo proceso y conservar trampas, orden y efectos. El instalador remoto debe seguir arrancando de forma autónoma; no puede depender de módulos aún no descargados.

## F. Compatibilidad de core: tramos definidos

| Tramo | Documento | Unidad |
|---|---|---|
| 81 | [Paquete remoto](tramo-81.md) | Copia de `core/`, sin relajar validación. |
| 82 | [Comprobación de compatibilidad](tramo-82.md) | Inventario y comprobación de copias. |
| 83 | [Ver tramo 83](tramo-83.md) | `agentes/constructor.md` → `core/agents/constructor.md` con copia anterior regular. |
| 84 | [Ver tramo 84](tramo-84.md) | `agentes/principal.md` → `core/agents/principal.md` con copia anterior regular. |
| 85 | [Ver tramo 85](tramo-85.md) | `skills/definir-proyecto/SKILL.md` → `core/skills/define-project/SKILL.md` con copia anterior regular. |
| 86 | [Ver tramo 86](tramo-86.md) | `skills/diagnosticar/SKILL.md` → `core/skills/diagnose/SKILL.md` con copia anterior regular. |
| 87 | [Ver tramo 87](tramo-87.md) | `skills/diagnosticar/diagnosticar.mjs` → `core/skills/diagnose/diagnosticar.mjs` con copia anterior regular. |
| 88 | [Ver tramo 88](tramo-88.md) | `skills/disenar-experiencia/SKILL.md` → `core/skills/design-experience/SKILL.md` con copia anterior regular. |
| 89 | [Ver tramo 89](tramo-89.md) | `skills/ejecutar-plan/SKILL.md` → `core/skills/execute-plan/SKILL.md` con copia anterior regular. |
| 90 | [Ver tramo 90](tramo-90.md) | `skills/migrar-proyecto/SKILL.md` → `core/skills/migrate-project/SKILL.md` con copia anterior regular. |
| 91 | [Ver tramo 91](tramo-91.md) | `skills/planificar-cambio/SKILL.md` → `core/skills/plan-change/SKILL.md` con copia anterior regular. |
| 92 | [Ver tramo 92](tramo-92.md) | `skills/preparar-proyecto/SKILL.md` → `core/skills/prepare-project/SKILL.md` con copia anterior regular. |
| 93 | [Ver tramo 93](tramo-93.md) | `skills/preparar-proyecto/referencia.md` → `core/skills/prepare-project/referencia.md` con copia anterior regular. |
| 94 | [Ver tramo 94](tramo-94.md) | `nucleo/contrato/verificacion.md` → `core/contracts/verificacion.md` con copia anterior regular. |
| 95 | [Ver tramo 95](tramo-95.md) | `nucleo/recetas/node-pnpm.md` → `core/recipes/node-pnpm.md` con copia anterior regular. |

## F. Desinstalación, bootstrap y herramientas (borrador)

- [96: Caracterizar desinstalación](tramo-96.md)
- [97: Separar desinstalación por proyecto](tramo-97.md)
- [98: Separar desinstalación global](tramo-98.md)
- [99: Caracterizar bootstrap remoto](tramo-99.md)
- [100: Documentar excepción de tamaño del bootstrap](tramo-100.md)
- [101: Caracterizar medidor de uso](tramo-101.md)
- [102: Separar lectura de JSONL](tramo-102.md)
- [103: Separar cálculo de tarifas](tramo-103.md)
- [104: Separar procesamiento de Claude](tramo-104.md)
- [105: Separar procesamiento de Pi](tramo-105.md)
- [106: Separar procesamiento de Codex](tramo-106.md)
- [107: Separar formato de informe de uso](tramo-107.md)
- [108: Caracterizar observador](tramo-108.md)
- [109: Separar informe del observador](tramo-109.md)
- [110: Separar ciclo del observador](tramo-110.md)
- [111: Separar diagnóstico del observador](tramo-111.md)
- [112: Caracterizar script de diagnóstico](tramo-112.md)
- [113: Separar huellas del diagnóstico](tramo-113.md)
- [114: Distribuir el módulo de huella](tramo-114.md)
- [115: Conectar la huella de diagnóstico](tramo-115.md)

## G. Diagnóstico, aceptación, anonimización y cierre

- [Tramo 116](tramo-116.md): Separar lectura de resultados del diagnóstico
- [Tramo 117](tramo-117.md): Distribuir el lector de resultados
- [Tramo 118](tramo-118.md): Conectar el lector del diagnóstico
- [Tramo 119](tramo-119.md): Trasladar entrada de aceptación contrato-constructor
- [Tramo 120](tramo-120.md): Trasladar entrada de aceptación kit-run
- [Tramo 121](tramo-121.md): Trasladar entrada de aceptación uso
- [Tramo 122](tramo-122.md): Catalogar pruebas y fixtures
- [Tramo 123](tramo-123.md): Catalogar las evaluaciones existentes
- [Tramo 124](tramo-124.md): Inventariar nombres propios vigentes
- [Tramo 125](tramo-125.md): Anonimizar agentes/constructor.md
- [Tramo 126](tramo-126.md): Anonimizar agentes/principal.md
- [Tramo 127](tramo-127.md): Anonimizar skills/definir-proyecto/SKILL.md
- [Tramo 128](tramo-128.md): Anonimizar skills/diagnosticar/SKILL.md
- [Tramo 129](tramo-129.md): Anonimizar skills/disenar-experiencia/SKILL.md
- [Tramo 130](tramo-130.md): Anonimizar skills/ejecutar-plan/SKILL.md
- [Tramo 131](tramo-131.md): Anonimizar skills/migrar-proyecto/SKILL.md
- [Tramo 132](tramo-132.md): Anonimizar skills/preparar-proyecto/SKILL.md
- [Tramo 133](tramo-133.md): Anonimizar skill de planificación y contrato de verify
- [Tramo 134](tramo-134.md): Anonimizar justificación de Codex
- [Tramo 135](tramo-135.md): Anonimizar documentación de permisos
- [Tramo 136](tramo-136.md): Anonimizar ejemplo del medidor
- [Tramo 137](tramo-137.md): Actualizar contexto vigente del repositorio
- [Tramo 138](tramo-138.md): Documentar decisiones de estructura
- [Tramo 139](tramo-139.md): Indexar historial sin mover archivos protegidos
- [Tramo 140](tramo-140.md): Diseñar evaluación del inglés
- [Tramo 141](tramo-141.md): Acortar README y preservar guía
- [Tramo 142](tramo-142.md): Auditar limpieza y tamaño
- [Tramo 143](tramo-143.md): Revisión integral final
