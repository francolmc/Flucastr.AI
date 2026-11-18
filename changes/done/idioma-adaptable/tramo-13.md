# Tramo 13 — Documentación y referencias históricas

## Pasos

### Tramo 13 — Historia: documentación reutilizable y anónima

Como persona que reutiliza el kit quiero documentación española, ejemplos anónimos y enlaces funcionales para que el kit sea reutilizable.

Dependencias: Tramos 3 a 12 para documentar interfaces definitivas y reutilizar seudónimos y datos anonimizados.

Contratos a conservar: fechas, métricas y sentido de evidencias, nombres reales de campos y opciones heredadas, atribución de `LICENSE`, URLs funcionales del repositorio y enlaces válidos. Nunca leer credenciales ni archivos temporales; el historial Git queda intacto.

Rutas susceptibles de cambio: rutas identificativas del inventario `exploracion.md`, incluidas investigaciones y archivos históricos; renombrarlas con nombres genéricos y actualizar todos sus enlaces y pruebas. No se renombra código ejecutable en este tramo.

Ejemplo concreto del resultado esperado: la documentación muestra `bash install.sh --dry-run`, menciona el alias anterior, conserva su explicación en español y enlaza una investigación con ruta anonimizada.

Alcance: archivos Markdown y de documentación de `docs/`, `cambios/`, `AGENTS.md, `PENDIENTES.md`, `README.md`, pruebas y fixtures documentales afectados. `old/v1/` queda fuera de A13 por decisión de la persona usuaria (archivo histórico, con su aviso ya añadido; no se edita más ni se exige cero referencias allí). El inventario preliminar define el conjunto inicial, no sustituye una búsqueda final.

Archivos: README.md, AGENTS.md, PENDIENTES.md

CUANDO se consulta la documentación o la historia ENTONCES se usan comandos ingleses documentados, hay alias compatibles y no quedan referencias personales o de proyectos fuera de las excepciones acordadas (A13).

Aceptación:
- A13: revisar las coincidencias del inventario y ejecutar búsqueda final en archivos versionados de texto y rutas fuera de `old/v1/`, excluyendo `LICENSE`, URLs funcionales, credenciales y temporales; justificar falsos positivos y excepciones de contratos ejecutables y citas históricas exactas; comprobar enlaces modificados y `./verify`. Búsqueda: `git ls-files -co --exclude-standard` fuera de `old/v1/` y `LICENSE`, patrones `DASH|Dash|Ezio|Cleaner` y los de proyecto del inventario `exploracion.md`. Esperar cero referencias no exceptuadas y sin enlaces rotos.

TODO:
- [x] Actualizar `README.md`, `AGENTS.md` y `PENDIENTES.md` con comandos y opciones canónicos en inglés y alias españoles (A13). Comprobación: ejecutar ejemplos seguros de ayuda o simulación; esperar mensajes españoles y comandos válidos.
- [x] Anonimizar los documentos de `docs/` y actualizar sus enlaces y rutas identificativas (A13). Comprobación: buscar referencias y comprobar enlaces modificados; esperar cero referencias no exceptuadas y rutas existentes.
- [x] Lote 1: anonimizar en `cambios/hechos/migrar-v1-v2/plan.md`, `cambios/hechos/migrar-workspaces/plan.md`, `cambios/hechos/constructor-contrato/plan.md`, `cambios/hechos/definir-proyecto/plan.md`, `cambios/hechos/migrar-sin-reglas-v1/plan.md`, `cambios/hechos/permisos-compose-opciones/plan.md`, `cambios/hechos/validar-despliegue/plan.md`, `cambios/hechos/estructura-repo/linea-base/verify.txt` y `cambios/verificacion-general/plan.md` las referencias a proyectos externos (A13). Comprobación: repetir la búsqueda de la Aceptación sobre esos archivos y contrastar cifras y fechas con `git diff`; esperar cero coincidencias no listadas en `excepciones.md` y datos conservados.
- [x] Lote 2: revisar contra `git show HEAD:<ruta>` las citas, bloques de código y literales de los archivos tocados en los lotes de este tramo y restaurar los contractuales (A13). Comprobación: comparar las líneas afectadas; esperar valores contractuales y citas fieles.
- [x] Lote 3: ajustar `pruebas/` y fixtures documentales que referencien rutas renombradas, sin tocar `old/v1/` (A13). Comprobación: `node --test pruebas/aceptacion/*.test.mjs`; esperar resultados equivalentes y aserciones sin debilitar.
- [x] Lote 4: anonimizar `cambios/idioma-adaptable/exploracion.md` y `cambios/idioma-adaptable/plan.md` (A13). Comprobación: búsqueda de la Aceptación sobre ambos; esperar cero coincidencias.
- [x] Lote 5: dejar en `cambios/idioma-adaptable/excepciones.md` cada coincidencia restante por ruta y motivo (contrato, cita exacta, URL, falso positivo) y los enlaces comprobados (A13). Comprobación: la búsqueda final fuera de `old/v1/` y `LICENSE` solo devuelve rutas listadas; esperar cero no exceptuadas y sin enlaces rotos en líneas modificadas.

Verificación del tramo: `./verify` — nivel 2 por falta de comprobación rápida declarada; exit 0, cubre A13.

Orden y límites para el constructor: trabajar por lotes (cambios/hechos, pruebas, exploracion.md), marcar cada casilla al comprobarla, usar comprobaciones focalizadas (`git diff --check`, búsqueda, pruebas afectadas) y correr `./verify` una sola vez al final; no repetir lotes ya anonimizados ni reabrir el inventario completo.

Handoff: anotar la metodología de búsqueda, excepciones justificadas y enlaces comprobados sin reproducir datos personales; si un renombre rompe código, documentarlo y detenerse para ajustar alcance.

## Evidencia

- Las tres pruebas de capa 1 modificadas se ejecutaron en una copia aislada de la v1 reconstruida desde el tag, con los archivos de prueba actuales: 17 casos pasaron y uno falló porque `git status` devolvió una lista vacía donde la prueba histórica esperaba `.claude/`. Esta ejecución no demuestra que esas pruebas funcionen en el checkout archivado, que carece de los instaladores de la v1. Las aserciones no se modificaron.
- Se identificó la causa del fallo restante con un repositorio ficticio: la exclusión global de Git ocultaba el archivo que la prueba esperaba ver. Al repetir las tres suites con `core.excludesFile=/dev/null`, los 18 casos pasaron en la copia aislada; no se alteraron las aserciones ni la configuración personal. El checkout archivado sigue sin incluir los instaladores de la v1.

- Paso 2: búsqueda de referencias personales y proyectos en `docs/`: sin coincidencias reales; una coincidencia es parte de una palabra común. Destinos de las rutas renombradas existentes y sin referencias a los nombres anteriores. Los datos JSONL se contrastaron campo por campo y `./verify` terminó con `VERIFY OK`.

- Paso 1: `bash install.sh --help` y `node scripts/usage.mjs --help` finalizaron con exit 0 y ayuda en español; `git diff --check` y `./verify` finalizaron con exit 0 (`VERIFY OK`).

- Lote 2 (citas y literales): las citas históricas y los literales contractuales de los archivos tocados quedan clasificados en `cambios/idioma-adaptable/excepciones.md`, sección «Citas históricas cotejadas» y «Búsqueda final». `git diff --check` sobre los archivos del tramo terminó con exit 0.
- Lote 3 (pruebas y fixtures): `node --test pruebas/aceptacion/*.test.mjs` pasó 3 de 3 suites (contrato-constructor, kit-run y uso), exit 0.
- Lote 4 (exploracion.md y plan.md del tramo): la búsqueda final devuelve en ambos solo coincidencias exceptuadas: `exploracion.md:129` (ruta histórica) y `plan.md:82` (valor `rol=franco` del contrato de eventos).
- Lote 5 (búsqueda final y enlaces): con `git ls-files -co --exclude-standard` fuera de `old/v1/`, `LICENSE`, `pruebas/.temporales/` y binarios, y sin el registro, el patrón devuelve 58 líneas en 36 archivos; todas figuran en `excepciones.md`. Enlaces relativos en líneas añadidas: 8; 7 válidos y 1 roto preexistente en `old/v1/` (`LICENSE`, fuera de A13).
- `./verify` (una sola ejecución, al final): exit 0. Cola de la salida:

```
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
== 8t. small change: definición, riesgo y prácticas por tecnología ==
ok 8t: principal con la definición de small change, high risk y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «small change» falla
VERIFY OK
```

## Notas

- Continuación: se generalizaron referencias narrativas de las instrucciones y permisos de pruebas históricas, una ruta local del informe de compactación y un ejemplo de ruta en una prueba; el informe del observador usa los identificadores anonimizados del fixture y conserva las métricas. La prueba modificada pasó 7/7 fuera del aislamiento (dentro, dos procesos secundarios no produjeron salida); las suites de higiene y formatos pasaron y `git diff --check` terminó en 0. La clasificación integral de coincidencias, enlaces y citas sigue pendiente.

- Se contrastaron contra el manifiesto de frases y el contrato histórico del constructor las excepciones de decisiones, bloqueo, confirmación de rama y yolo; se documentaron también los literales de las definiciones y las referencias funcionales del instalador. `git diff --check` terminó en 0. La clasificación integral y el cotejo con la búsqueda final siguen pendientes.

- Se clasificaron referencias adicionales de cuatro definiciones históricas como literales de protocolo o URL funcionales; el inventario sigue incompleto. `./verify` finalizó con código 0 y `VERIFY OK` después de los últimos cambios de producto; `git diff --check` también terminó con código 0.

- Continuación posterior: se generalizaron fragmentos narrativos en tres skills históricas sin alterar los literales de protocolo; las dos suites históricas y `git diff --check` pasaron. La verificación completa registrada abajo fue anterior a este último lote y debe repetirse al finalizar; el índice de coincidencias es una captura anterior a ese lote.

- Continuación: se generalizaron cinco comentarios narrativos de pruebas históricas; las dos suites históricas y `git diff --check` terminaron con exit 0. `./verify` terminó con exit 0 y `VERIFY OK`. El índice reproducible `coincidencias-pendientes.md` registra 196 archivos y 492 líneas para revisión contextual; no clasifica esas coincidencias ni demuestra el cierre de A13.

- Continuación: se cotejaron y restauraron citas históricas adicionales; el inventario parcial registra 65 archivos con citas verificadas contra la versión anterior. Las dos suites históricas y `git diff --check` pasan tras el último lote. El inventario no clasifica todavía todas las coincidencias ni acredita el cierre del tramo.

- Continuación: se compararon fragmentos entre versiones y se restauraron ejemplos y literales históricos, incluidos el patrón de telemetría, mensajes, comandos y atribución legal. Las suites históricas de higiene y regresión y `git diff --check` pasaron tras el primer lote; queda comprobar el segundo lote, revisar el resto de citas y clasificar todas las coincidencias. La verificación integral se lanzó, pero no se recuperó su resultado: no se declara aprobada.

- Revisión del plan actualizado: el revisor advierte por tamaño acumulado de evidencia y por pasos que abarcan conjuntos de rutas definidos por el inventario; estos avisos no cambian el alcance. El tramo 14 no tuvo avisos.
- Continuación: se anonimizaron 74 documentos de features y 32 documentos archivados adicionales, con aviso histórico y comprobación de cifras. Se restauraron literales de protocolo detectados durante la revisión; hace falta seguir revisando citas y ejemplos para preservar la evidencia. Las pruebas históricas de higiene y regresión pasaron, y `./verify` finalizó con `VERIFY OK` antes de restaurar esos literales; `git diff --check` pasó después.
- PAUSA: la búsqueda encontró referencias personales dentro de literales usados por código y comprobaciones de la v1. Eliminarlas cambia contratos heredados, mientras este tramo exige conservarlos y no renombrar código ejecutable. Quedan pendientes la decisión sobre esos contratos, la revisión de citas y enlaces y la búsqueda final; A13 no está cumplida.

- Paso 2 iniciado: `docs/evaluaciones/costos.md` y `docs/investigaciones/fiabilidad-constructor.md` anonimizados conservando cifras, fechas y significado. Falta revisar el resto de `docs/`, renombrar rutas y comprobar sus enlaces; la casilla permanece pendiente. La búsqueda contextual debe preservar literales que formen parte de contratos ejecutables.
- Avance adicional: se anonimizaron referencias narrativas en tres documentos de OpenSpec y tres de la auditoría de verificación. En su evidencia JSONL se comprobaron 50 registros y que solo cambió el nombre identificativo; fechas, métricas y demás campos permanecen iguales. `git diff --check` y `./verify` terminaron con exit 0. Quedan rutas históricas, literales por revisar y el resto del inventario; no se marca el paso como terminado.
- Se renombraron cinco rutas de investigaciones y dos informes históricos; se actualizaron sus referencias documentales y se comprobó la existencia de los siete destinos. Se anonimizaron otras investigaciones y dos documentos históricos, conservando sus cifras y fechas; los literales de contratos se mantienen para revisión. `./verify` terminó con exit 0 antes de los dos últimos documentos y `git diff --check` pasó después.
- La prueba histórica de higiene buscaba los agentes y skills en sus rutas anteriores al archivo de la v1. Se corrigieron las rutas a `legacy/v1` sin cambiar sus aserciones: sus seis casos pasan. `./verify` terminó con exit 0 tras esa corrección. Después se anonimizaron tres documentos históricos más, conservando cifras y bloques de código. Quedan por revisar las referencias históricas, las excepciones, todos los enlaces modificados y la búsqueda final; ninguna casilla adicional está completa.
- Avance posterior: se anonimizaron referencias narrativas en otros cinco documentos históricos; se compararon las cifras de cada archivo antes y después y se preservaron bloques de código, identificadores y citas de contratos. La prueba de higiene histórica vuelve a pasar (6/6) y `git diff --check` pasa. En `docs/` queda por decidir el literal histórico de autorización de OpenSpec; la coincidencia dentro de «grandes» es un falso positivo. Siguen pendientes las citas y bloques de los históricos, otros documentos, los enlaces y la búsqueda final.
- Avance adicional: se anonimizaron las referencias narrativas del backlog y la auditoría históricos y se agregó el aviso de anonimización en esos archivos y otros cinco ya tratados. Se compararon todas las cifras antes y después; la prueba histórica de higiene pasó (6/6) y `git diff --check` pasó. Quedan literales y rutas por revisar, incluido el ejemplo histórico de planes y sus referencias; no se marca el tramo como completo.

- Avance posterior: se anonimizaron cinco definiciones adicionales, la prosa de 64 documentos archivados y 174 documentos de features y resultados; se conservaron cifras y se añadió un aviso histórico. Se renombraron dos rutas identificativas, con sus enlaces y fixture ajustados. El aviso se reubicó después de los metadatos exigidos por las tareas y se corrigió una referencia a un encabezado anonimizado. Regresión histórica de validadores: 9/9; higiene histórica: sin fallos; `git diff --check`: exit 0. `./verify` terminó con `VERIFY OK` antes de los últimos ajustes de rutas y avisos; queda repetirlo al cerrar. Persisten coincidencias en literales, citas, rutas y otros documentos que requieren clasificación contextual; no se marca ningún paso adicional como completo.

- Continuación: `./verify` terminó con `VERIFY OK` tras los ajustes anteriores. Después se anonimizaron seis planes o notas pendientes, el README histórico y rutas locales en 90 documentos históricos, conservando cifras y URLs funcionales. La regresión histórica de validadores y `git diff --check` pasaron después; `./verify` volvió a finalizar con `VERIFY OK` tras estos cambios. Persisten referencias en instrucciones históricas, citas y literales cuyo carácter contractual requiere revisión; también faltan la auditoría de enlaces y la búsqueda final.

- Continuación: se anonimizaron rutas locales en 24 documentos archivados y seis registros de errores, conservando cifras y el resto de los campos JSON. Se generalizaron un fixture y etiquetas de diagramas históricos; el protocolo de continuidad resuelve la skill desde el directorio personal del usuario. Pasaron las 14 pruebas del revisor de planes, la regresión histórica de validadores, la comprobación sintáctica del protocolo y `git diff --check`. El protocolo real no se ejecutó porque invoca modelos. Permanecen pendientes la clasificación de referencias históricas, la revisión de enlaces y la búsqueda final.
- Verificación posterior al lote: `./verify` finalizó con exit 0 (`VERIFY OK`).

- Continuación: se anonimizaron referencias narrativas en tres definiciones históricas y se corrigió una referencia personal residual. Higiene histórica: 6/6; regresión de validadores: sin fallos; `git diff --check`: exit 0. Una revisión de enlaces locales detectó seis enlaces históricos preexistentes, sin cambios en sus destinos; quedan por clasificar las referencias conservadas y comprobar los enlaces modificados.

- Se anonimizaron tres historias de continuidad y una ruta histórica citada en evidencia. La búsqueda de nombres identificativos en rutas no encontró coincidencias. La comprobación de enlaces locales en líneas añadidas encontró un enlace histórico a `LICENSE` ya presente antes del cambio; los otros siete destinos existen. El examen de referencias de `docs/` no encontró coincidencias de los términos auditados; faltan clasificación integral y búsqueda final.
- Se generalizaron una ruta citada en la salida histórica del revisor y dos referencias narrativas adicionales; `git diff --check` pasa. La búsqueda amplia todavía encuentra 216 archivos históricos con posibles coincidencias: incluye URL permitidas, literales contractuales y referencias narrativas pendientes. No se considera completa la anonimización ni se ha ejecutado aún la auditoría final.
- Se generalizaron referencias narrativas en cuatro skills y dos agentes archivados de la v1, sin alterar sus literales contractuales. Pasaron las suites históricas de higiene y regresión de validadores y `git diff --check`. La clasificación del resto de referencias y la auditoría final siguen pendientes.
- Continuación: se generalizaron referencias narrativas en dos skills y el agente constructor de la v1. Se conservaron las frases literales usadas por el protocolo histórico; las suites históricas de higiene y regresión y `git diff --check` pasaron. Quedan referencias históricas y la auditoría final.

- Continuación: se generalizaron dos referencias narrativas en el backlog, las etiquetas de dos diagramas y un comentario de prueba; se conservaron las frases literales y los identificadores del protocolo. Las pruebas históricas de higiene y regresión terminaron en 0, `./verify` terminó con `VERIFY OK` antes del último cambio (solo comentario), `bash -n` y `git diff --check` terminaron en 0 después. A13 sigue pendiente: faltan la revisión contextual de coincidencias históricas y su clasificación completa, el cotejo de citas y la auditoría final de enlaces.

- Se generalizaron cuatro comentarios en tres pruebas archivadas, sin cambiar sus aserciones; las tres pasan `node --check`. Su ejecución falla en este checkout por la estructura archivada: `skills-proyecto` busca `old/v1/instalar.sh`, que no existe; las otras dos también fallan. No se presenta esa ejecución como aprobada. `git diff --check` pasa.

- Cierre del tramo 13 (lotes 2 a 5 en esta ejecución): la búsqueda final quedó clasificada en `excepciones.md`, sin coincidencias sin exceptuar. `anonimizacion.md:26` se sustituyó por una descripción genérica. `anonimizacion.md:25` se anonimizó después en la revisión del principal (ya no conserva nombres originales). Archivos tocados en esta ejecución: `cambios/idioma-adaptable/excepciones.md`, `cambios/idioma-adaptable/tramo-13.md`, `cambios/hechos/estructura-repo/anonimizacion.md`. Sin commit ni push. `./verify` terminó con exit 0 (`VERIFY OK`).
