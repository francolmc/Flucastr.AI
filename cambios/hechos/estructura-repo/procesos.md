# Procesos propuestos para la estructura del repositorio

Este documento separa los procesos de la iniciativa; no autoriza ejecución. Cada movimiento y cada extracción deberán convertirse en un tramo independiente en el plan, con hasta tres archivos de producto, consumidores concretos, pruebas y resultado esperado. Documentos y pruebas no cuentan en ese límite. Si un cambio necesita más archivos de producto para conservar el recorrido, preparar compatibilidad en tramos anteriores; si no es posible, detenerse y replantearlo. El orden y las rutas de destino son propuestas, no una lista cerrada de módulos.

## Reglas comunes

- Trabajar solo en este repo, sin leer secretos ni modificar proyectos instalados, `pruebas/.temporales/` o contenido del archivo histórico. No usar el HOME real para instalar o desinstalar durante las pruebas.
- Después de cada tramo ejecutar `./verify` completo y comparar `bash instalar.sh --simular` con la referencia, incluidos código, salida y efectos relevantes. Si falla, no avanzar. No sustituirlo por una comprobación parcial.
- Comparar en el mismo entorno aislado, conservando orden y errores; registrar duración, comando, salida sanitizada, código, diferencias y archivos tocados. No normalizar diferencias salvo rutas temporales inevitables previamente identificadas. Registrar las diferencias de nombres ya autorizadas; cualquier otra diferencia o cambio de ruta observable se eleva antes de aceptarla.
- Conservar CLI, opciones, códigos de salida, orden, mensajes, permisos, enlaces generados, rutas públicas y semántica de tests. Adaptar pruebas sensibles a nombres o rutas sin eliminar casos ni debilitar negativos.
- Extraer código por responsabilidad, manteniendo datos, flujo, manejo de errores, estado y efectos. Evitar cambios oportunistas de lógica, dependencias, formato masivo o abstracciones comunes que borren diferencias entre herramientas. El límite orientativo de 300 líneas se aplica al código propio; registrar cada excepción con motivo concreto.
- El constructor solo ejecuta tramos aprobados. Cada tramo deja punto de control y el principal revisa antes de avanzar. Si la verificación falla, falta cobertura o aparece un contrato no inventariado, parar y registrar la causa.

## 1. Línea base y mapa de contratos

**Objetivo:** conocer qué debe permanecer igual antes de cambiar el repo. Referencia inicial: [tramo-1.md](tramo-1.md).

1. Revisar efectos de `instalar.sh`, `desinstalar.sh` y `verify`; definir un HOME y proyectos de prueba temporales, sin acceso a proyectos reales.
2. Medir dos simulaciones originales y `./verify`; registrar duración, entorno, salida y código. Distinguir texto estable de rutas temporales.
3. Inventariar rutas y consumidores desde `instalar.sh`, `instalar-remoto.sh`, `desinstalar.sh`, `verify`, `scripts/`, agentes, skills y pruebas. Incluir rutas embebidas en lanzadores, enlaces simbólicos, copias, CLI, configuración y reinstalación.
4. Capturar, para Claude Code, Codex y Pi, los archivos generados y los resultados de instalación, reinstalación y desinstalación en un entorno aislado. Registrar las diferencias reales entre herramientas.
5. Crear una matriz fuente → destino → consumidores → compatibilidad → comprobación; identificar las cadenas que `verify` exige literalmente y sus pruebas negativas.

**Salida:** evidencia reproducible y matriz suficiente para convertir cada movimiento en tramo. Si la línea base falla, registrar y detenerse; no declarar equivalencia.

## 2. Diseño de compatibilidad y nombres

**Objetivo:** hacer que el árbol inglés pueda convivir con entradas y rutas ya utilizadas.

1. Clasificar cada ruta como punto de entrada público, ruta usada por instalaciones previas, importación interna, documentación o archivo histórico.
2. Definir para cada una fuente de verdad, destino, compatibilidad y prueba. Mantener `instalar.sh` y `verify` operativos; si se propone `install.sh`, comprobar que ambos recorridos sean equivalentes.
3. Comprobar enlaces preexistentes, modo copia, resolución de raíz desde otro directorio y espacios en rutas, según soporte existente. Evitar dos copias editables divergentes.
4. Resolver explícitamente `cambios/hechos/`, que forma parte del cierre vigente, y las rutas históricas. No confundir el `old/v1/` del repositorio con el que `--migrar` crea en proyectos.

**Salida:** matriz revisada, reglas para añadir y conservar compatibilidad, y decisión documentada sobre rutas. No eliminar compatibilidad mientras haya consumidores identificados.

## 3. Verificación modular

**Objetivo:** separar `verify` por fases manteniendo un único recorrido y el mismo resultado.

1. Identificar los límites reales de fases, variables compartidas, directorios temporales, `trap`, códigos y orden de salida en `verify`.
2. Diseñar un entrypoint y módulos bajo `tools/verify/` que compartan estado sin lanzar procesos adicionales cuando eso cambie su semántica.
3. Extraer una fase por tramo; por ejemplo, comprobaciones de modelos o de instalación, solo después de fijar sus límites exactos. Conservar el texto de salida y el orden.
4. Mantener comprobaciones de contratos y sus negativos; al mover rutas, actualizar en el mismo tramo sus consumidores y fixtures pertinentes.
5. Por tramo, comparar la salida, el código y los escenarios negativos con la línea base. Fallos y limpieza de temporales deben seguir igual.

**Salida:** `verify` legible y fases enfocadas; ninguna fase omitida y excepciones al límite de líneas justificadas. La división concreta se decide tras mapear estado compartido.

## 4. Resolver y adaptadores

**Objetivo:** separar `scripts/resolver.mjs` sin alterar su CLI ni formatos generados.

1. Inventariar subcomandos, exports, lectura de `modelos.json`, errores, rutas, escritura y uso desde instalación y pruebas.
2. Extraer, por unidades independientes y en tramos sucesivos, lectura de configuración/modelos y operaciones comunes que realmente compartan contrato.
3. Aislar generación y ajustes específicos de Claude Code, Codex y Pi bajo `adapters/`, conservando formato, esfuerzo, permisos y particularidades de cada herramienta.
4. Mantener un entrypoint compatible en `scripts/resolver.mjs` mientras se prueban los consumidores; comparar salida y errores por subcomando.

**Salida:** resolución común y adaptadores legibles con sus pruebas positivas y negativas, sin cambiar modelos ni políticas.

## 5. Ejecución de planes

**Objetivo:** reducir responsabilidades de `scripts/kit-run.mjs` conservando el recorrido real.

1. Documentar opciones CLI, lectura y estados del plan, invocación de procesos, huella, límites, veredicto y códigos.
2. Separar, una responsabilidad por tramo, lectura/estado, ejecución de procesos y cálculo de huella/veredicto, según los límites reales del código.
3. Mantener la ruta de entrada anterior y comprobar las suites existentes de `pruebas/kit-run/` y aceptación, incluyendo fallos y salidas.

**Salida:** entrada compatible y unidades enfocadas; no alterar estados de planes ni reglas de aprobación.

## 6. Instalación y desinstalación

**Objetivo:** organizar `instalar.sh`, `desinstalar.sh` e `instalar-remoto.sh` preservando todas sus modalidades.

1. Delimitar funciones compartidas, selección de herramientas, enlace/copia, lanzadores, instalación remota, migración y desinstalación; identificar funciones que dependen de variables o traps globales.
2. Extraer una unidad de Shell por tramo a `tools/install/` o al adaptador correspondiente, conservando entorno y ejecución. Mantener wrappers compatibles y resolución de raíz.
3. Para cada unidad relevante, probar simulación, instalación, segunda instalación y desinstalación aisladas; comparar archivos generados y preservar archivos ajenos.
4. Probar escenarios de migración solo con fixtures temporales, manteniendo sus rutas y mensajes existentes; no invocar migración sobre proyectos del usuario.

**Salida:** instaladores más cortos, mismos modos y efectos observables; ninguna modificación de instalaciones reales.

## 7. Núcleo: agentes, skills, contratos y plantillas

**Objetivo:** reunir la fuente común en `core/` sin perder carga real de instrucciones.

1. Inventariar `agentes/`, `skills/`, `nucleo/contrato/`, `nucleo/recetas/` y las plantillas efectivamente existentes; registrar sus referencias y los formatos usados por herramienta.
2. Mover una unidad autocontenida por tramo a `core/agents/`, `core/skills/`, `core/contracts/`, `core/recipes/` o `core/templates/`; preparar antes la compatibilidad según la matriz.
3. Comprobar instalación real aislada y resolución de cada skill en Claude Code, Codex y Pi, incluyendo referencias relativas y recursos auxiliares.
4. Identificar instrucciones repetidas entre agentes y skills; centralizar solo si las tres herramientas reciben efectivamente el contrato completo. Si no está demostrado, conservar la repetición y documentar el motivo.

**Salida:** núcleo con una sola fuente de verdad y carga de contexto equivalente; no traducir instrucciones en este proceso.

## 8. Herramientas restantes, tests y evaluaciones

**Objetivo:** nombrar y ubicar utilidades y pruebas según su responsabilidad.

1. Inventariar `scripts/uso.mjs`, `scripts/observar.mjs`, `scripts/revisar-plan.mjs`, `scripts/permisos-hook.mjs`, datos y fixtures; registrar comandos públicos y consumidores.
2. Para cada archivo grande, identificar responsabilidades y extraerlas en tramos separados solo cuando el límite tenga sentido. Mantener comportamiento de CLI y errores; justificar excepciones de tamaño.
3. Mover suites funcionales a `tests/` y arneses de evaluación a `evals/` por unidad, actualizando descubrimiento y rutas en el mismo tramo. Mantener distinción entre autopruebas offline y ejecuciones con modelos o gasto.
4. Comprobar que la lista de pruebas descubiertas no quede vacía y que un caso negativo siga fallando por la razón esperada.

**Salida:** herramientas y suites localizables, sin perder pruebas ni lanzar evaluaciones pagadas por accidente.

## 9. Limpieza y anonimización

**Objetivo:** retirar redundancia demostrada y referencias personales vigentes, conservando casos útiles.

1. Inventariar nombres personales y nombres de proyectos en código, pruebas, agentes, skills y documentos vigentes; excluir el archivo histórico de la edición y no leer `old/v1/registro/`.
2. Sustituir cada ejemplo por nombres genéricos conservando estructura, intención y casos límite. Actualizar en el mismo tramo los contratos literales y negativos afectados.
3. Catalogar duplicados, archivos sin consumidores y wrappers. Clasificar como fuente, compatibilidad, fixture, histórico o candidato a eliminar; no borrar por apariencia de desuso.
4. Eliminar solo elementos cuya falta de uso se demuestre mediante inventario y pruebas, y que no pertenezcan al archivo histórico ni sean parte de una interfaz soportada. Registrar motivo y recuperación en el diff.
5. Detectar refactorizaciones adicionales y proponerlas por separado si cambian lógica o requieren nuevas decisiones; no aprovechar la limpieza para modificar comportamiento.

**Salida:** contenido vigente genérico y limpieza trazable; registrar cada cambio visible de nombres autorizado y comprobar que conserva su significado.

## 10. Archivo histórico y documentación

**Objetivo:** tener planes activos identificables y conservar el historial consultable.

1. Clasificar los planes fuera de `cambios/hechos/` por evidencia; no tratar `listo` como cerrado ni archivar activos por inferencia.
2. Inventariar enlaces al histórico, el tag existente y la ceremonia de cierre. Diseñar ubicación y compatibilidad antes de mover; conservar intacto el contenido de `old/` y planes terminados.
3. Trasladar unidades históricas reversiblemente por tramo solo cuando sus consumidores y enlaces queden resueltos; generar `changes/HISTORY.md` como índice trazable, sin reescribir documentos históricos.
4. Escribir un README raíz breve con mapa, entradas y enlaces a documentación detallada; registrar decisiones en `docs/decisions/`.

**Salida:** archivo navegable, planes activos visibles y README corto. No borrar `old/` ni mover `pruebas/.temporales/`.

## 11. Evaluación del idioma de prompts

**Objetivo:** decidir con evidencia si conviene traducir instrucciones, separadamente de renombrar archivos.

1. Definir casos de evaluación representativos, criterios de calidad y herramientas/modelos; preservar versión española de referencia.
2. Preparar variantes en inglés equivalentes sin modificar las instrucciones productivas. Medir tokens con el tokenizador pertinente y comparar calidad, coste y variación entre herramientas.
3. Si la comparación requiere gasto o acceso no autorizado, dejarla propuesta y registrar que no hay medición. No asegurar mejoras o ahorro sin resultados.
4. Presentar resultados y recomendar mantener español, traducir o adoptar una combinación. La traducción productiva requiere decisión y plan propios porque podría cambiar el comportamiento.

**Salida:** decisión informada y reproducible; ningún cambio productivo de idioma por defecto.

## 12. Cierre de la iniciativa

1. Repetir comparación integral de instalación simulada y `./verify`; comprobar instalación, reinstalación y desinstalación aisladas para las tres herramientas.
2. Revisar matriz de rutas, enlaces de compatibilidad, pruebas negativas, nombres vigentes, excepciones de tamaño y README.
3. Documentar diferencias aprobadas, limitaciones y resultados reales. Si hay diferencias no aprobadas o falla una comprobación, dejar el plan parcial.
4. El usuario revisa evidencia y decide el cierre y el commit; el agente no hace commit, push ni despliegue.
