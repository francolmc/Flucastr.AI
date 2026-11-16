---
estado: aprobado
rama: feature/planes-por-feature
base: main
repos: [.]
ejecutor: constructor
tramo: 4
tipo: codigo
---
# Planes por feature

## Objetivo
Adoptar un proceso conversado de planificación y un traspaso por historias pequeñas, verificables y ordenadas, con una rama por feature.

## Exploración
`scripts/revisar-plan.mjs` solo analiza casillas bajo `## Pasos`, reconoce `### Tramo N` y limita a tres archivos de producto los declarados en `Archivos:`; si falta `## Pasos` no avisa. Su veredicto es heurístico, no demuestra independencia ni conexión al recorrido. El [ejemplo Don Financio](ejemplo-don-financio.md) reconstruye F13; no autoriza intervenir ese proyecto.

Preguntas de comportamiento en exploración, antes de validar y escribir historias. Si una respuesta posterior cambia el resultado, volver a explorar, preguntar y registrar. Se pueden omitir fases para un cambio claro o pequeño, declarando cuál y por qué; nunca omitir decisiones necesarias. No hay preguntas de producto pendientes identificadas. Los bloqueos externos siguen siendo posibles.

## Evaluación
- Poner cada historia completa bajo `## Pasos` y `### Tramo N — Historia`: reúne contexto, aceptación y TODO en el mismo bloque y preserva el reconocimiento actual. Elegida; adaptar el revisor para detectar omisiones sin aceptar silenciosamente planes sin pasos y conservar planes antiguos.
- Crear seis documentos por fases: mayor navegación y contexto para el constructor; descartado. `exploracion.md` solo para investigación grande o desconocida, enlazado desde el plan.

## Supuestos
- A1, A2… son únicos por feature; si Franco prefiere numeración por historia, ajustar revisor y ejemplos.
- Verificar sola significa sobre la base y dependencias explícitas terminadas; si Franco exige independencia absoluta, resegmentar.
- Tope de tres archivos de producto por historia; pruebas y Markdown no cuentan. Si cambia, ajustar detector y ejemplos.

## Alcance
Archivos expresamente declarados en cada tramo; pruebas relacionadas y este plan. Fuera de alcance: cambios en Don Financio, instalación, permisos, modelos y despliegue. Historias ordenadas con comprobación propia.

## Decisiones ya tomadas
- La plantilla nueva ordena: frontmatter, objetivo, exploración y fases omitidas, evaluación, supuestos, decisiones y validación, alcance, verificación final, `## Pasos` con una historia por `### Tramo N`, evidencia y notas. Cada historia reúne usuario, dependencias, alcance, CUANDO/ENTONCES, A#, TODO con archivo y comprobación, verificación y handoff.
- Los bloques por historia reemplazan escenarios y aceptación globales; se conserva `## Pasos`, nombres de tramo, `tramo:` y verificación del tramo para compatibilidad. `exploracion.md` deja de ser obligatorio; los tramos externos siguen disponibles cuando sean necesarios para limitar contexto, enlazados desde el índice, sin umbral fijo.
- Validación registra preguntas, respuestas y aprobación de Franco; sin ella no se ejecuta.
- La historia cubre el recorrido observable completo; si excede el límite, dividir en resultados útiles verificables y declarar dependencias, sin presentar funciones sueltas como recorridos terminados. Consultar excepciones a Franco.
- Mantener la compatibilidad de planes existentes y los contratos de seguridad, aceptación y experiencia. Ajustar las comprobaciones literales de `verify` solo si cambian realmente los contratos, con prueba negativa equivalente; no conservar texto obsoleto solo para satisfacer un grep.
- Ejecutor: constructor, porque los requisitos, contexto y comprobaciones están definidos; no requiere secretos ni producción.

## Validación
Aprobado por Franco. El ejemplo no se ejecuta.

## Verificación
`./verify` — aceptación completa del kit; además el revisor debe aprobar el ejemplo sin avisos y rechazar ejemplos deliberadamente inválidos.

## Pasos
### Tramo 1 — Historia: redactar la plantilla
Como principal quiero historias autocontenidas para entregar al constructor solo el contexto necesario. Dependencias: ninguna.
Archivos: `skills/planificar-cambio/SKILL.md`, `agentes/principal.md`.
CUANDO planifico una feature ENTONCES converso las fases, cierro preguntas en exploración y entrego historias verificables (A1).
Aceptación A1: ambas instrucciones describen la plantilla y el proceso acordados, preservan aprobación, seguridad y verificación, y especifican qué se omite y por qué.
- [x] Actualizar `skills/planificar-cambio/SKILL.md` con plantilla, historias, dependencias y fases (A1). Comprobación: leer la plantilla completa y cotejarla con Decisiones; cubre todos sus campos.
- [x] Ajustar `agentes/principal.md` al flujo y a las preguntas en exploración (A1). Comprobación: leer su secuencia y cotejarla con la plantilla; no quedan instrucciones contradictorias.
Verificación del tramo: `git diff --check` — nivel 1; exit 0 y revisión manual de A1.
Handoff: leer Objetivo, Exploración, Decisiones y este tramo; conservar compatibilidad de planes existentes. Registrar evidencia y dudas sin modificar aceptación.

### Tramo 2 — Historia: revisar planes nuevos y antiguos
Como principal quiero que el revisor detecte historias incompletas y respete planes antiguos para revisar ambos formatos. Dependencias: tramo 1.
Archivos: `scripts/revisar-plan.mjs`, `pruebas/revisar-plan/revisar-plan.test.mjs`.
CUANDO reviso historias ENTONCES detecto campos ausentes, pasos sin comprobación y más de tres archivos de producto (A2).
Aceptación A2: pruebas cubren un plan nuevo válido, ausencia de pasos, campos obligatorios ausentes, cuatro archivos, y un plan antiguo válido; el ejemplo pasa sin avisos. Las comprobaciones semánticas siguen siendo revisión humana.
- [x] Actualizar `scripts/revisar-plan.mjs` para reconocer el formato nuevo y el antiguo, y rechazar omisiones del nuevo (A2). Comprobación: `node --test pruebas/revisar-plan/revisar-plan.test.mjs`; exit 0.
- [x] Ampliar `pruebas/revisar-plan/revisar-plan.test.mjs` con positivos y negativos descritos en A2 (A2). Comprobación: `node --test pruebas/revisar-plan/revisar-plan.test.mjs`; exit 0 y casos negativos detectados.
Verificación del tramo: `node --test pruebas/revisar-plan/revisar-plan.test.mjs` — nivel 1; exit 0; cubre A2.
Handoff: leer la plantilla resultante y este tramo; no aceptar un archivo sin pasos por silencio. No debilitar pruebas existentes.

### Tramo 3 — Historia: mantener el contrato de ejecución
Como constructor quiero recibir una sola historia con sus criterios para verificarla sin depender de historias futuras. Dependencias: tramos 1 y 2.
Archivos: `skills/ejecutar-plan/SKILL.md`, `agentes/constructor.md`.
CUANDO ejecuto una historia aprobada ENTONCES leo su handoff, compruebo sus criterios y entrego evidencia para revisión (A3).
Aceptación A3: instrucciones de ejecución reflejan el formato nuevo y respetan el anterior; conservan estados y protección de aceptación.
- [x] Actualizar `skills/ejecutar-plan/SKILL.md` para leer criterios y handoff del tramo activo (A3). Comprobación: lectura cruzada con plantilla; ejecución antigua y nueva quedan definidas.
- [x] Actualizar `agentes/constructor.md` para el traspaso por historia (A3). Comprobación: lectura cruzada con ejecución; conserva estados y protección de aceptación.
Verificación del tramo: `node pruebas/contrato-constructor.mjs` y `git diff --check` — nivel 1; exit 0 y lectura cruzada de A3.
Handoff: leer este tramo y la plantilla; preservar compatibilidad. Ante un contrato no especificado, registrar la duda para el principal.

### Tramo 4 — Historia: verificar el contrato de ejecución
Como principal quiero verificar ambos formatos para detectar regresiones en el contrato de ejecución. Dependencias: tramos 1, 2 y 3.
Archivos: `verify`, `pruebas/contrato-constructor.mjs`.
CUANDO verifico el kit ENTONCES compruebo los contratos anterior y nuevo y sus pruebas negativas (A4).
Aceptación A4: pruebas comprueban ambos contratos sin debilitar aceptación; `./verify` pasa y el ejemplo pasa por el revisor.
- [ ] Ajustar `verify` solo donde sus literales contradigan el contrato nuevo, con negativo equivalente (A4). Comprobación: `./verify`; exit 0.
- [ ] Ajustar `pruebas/contrato-constructor.mjs` para comprobar ambos contratos sin debilitar aceptación (A4). Comprobación: `node pruebas/contrato-constructor.mjs`; exit 0.
Verificación del tramo: `./verify` — nivel 3; exit 0; ejecutar también `node scripts/revisar-plan.mjs cambios/planes-por-feature/ejemplo-don-financio.md`, exit 0 sin avisos; cubre A4.
Handoff: leer este tramo y las instrucciones actualizadas; preservar pruebas negativas y compatibilidad. Ante un contrato no especificado, registrar la duda para el principal.

## Evidencia
- Tramo 2, paso 1: `$ node --test pruebas/revisar-plan/revisar-plan.test.mjs` — 10 tests, 10 pass, 0 fail; `exit 0`. El revisor identifica historias con encabezado nuevo, exige sus campos y TODO comprobables, avisa si falta `## Pasos` y conserva el tratamiento previo de tramos antiguos.
- Tramo 2, paso 2: `$ node --test pruebas/revisar-plan/revisar-plan.test.mjs` — 14 tests, 14 pass, 0 fail; incluye formato nuevo válido, pasos ausentes, campos requeridos ausentes, asociación A# incorrecta, cuatro archivos y plan antiguo; `exit 0`.
- Verificación del tramo 2: `$ node --test pruebas/revisar-plan/revisar-plan.test.mjs` — 14 tests, 14 pass, 0 fail; `exit 0`.
- Ejemplo real: `$ node scripts/revisar-plan.mjs cambios/planes-por-feature/ejemplo-don-financio.md` — salida vacía; `exit 0`.
- Devolución corregida: `$ node --test pruebas/revisar-plan/revisar-plan.test.mjs` — 14 tests, 14 pass, 0 fail; `exit 0`. El positivo usa `pruebas/revisar-plan/fixtures/historia-nueva-valida.md`, sin depender del plan que se archivará.
- Comprobación explícita del ejemplo actual tras desacoplar la prueba: `$ node scripts/revisar-plan.mjs cambios/planes-por-feature/ejemplo-don-financio.md` — salida vacía; `exit 0`.
- Dependencia del fixture: `$ rg -n "cambios/planes-por-feature/ejemplo-don-financio\\.md" pruebas/revisar-plan/revisar-plan.test.mjs` — sin coincidencias; `exit 1` (resultado esperado).
- Tramo 3, paso 1: la sección Tramo ahora guía al constructor por historia activa, Handoff, dependencias y criterios A# y limita la ejecución a sus TODO; los planes antiguos conservan sus pasos y aceptación. Lectura cruzada con la plantilla y `$ node pruebas/contrato-constructor.mjs` — ok A1, A2, A3, A5, A4; `exit 0`. `$ git diff --check -- skills/ejecutar-plan/SKILL.md` — salida vacía; `exit 0`.
- Tramo 3, paso 2: el handoff del agente constructor apunta a Handoff, criterios A#, TODO y dependencias de la historia activa, manteniendo ejecución antigua. Lectura cruzada con `ejecutar-plan`; `$ node pruebas/contrato-constructor.mjs` — ok A1, A2, A3, A5, A4; `exit 0`. `$ git diff --check -- agentes/constructor.md` — salida vacía; `exit 0`.
- Verificación del tramo 3: `$ node pruebas/contrato-constructor.mjs` — ok A1, A2, A3, A5, A4; `exit 0`. `$ git diff --check` — salida vacía; `exit 0`. Lectura cruzada confirma instrucciones alineadas, compatibilidad anterior y protección de aceptación conservada.
- Tramo 3 devuelto, corrección: `$ rg -n 'tramo-<n>\.md' skills/ejecutar-plan/SKILL.md` — encuentra el literal de compatibilidad y declara también `tramo-N.md` para el formato nuevo; `exit 0`. `$ node pruebas/contrato-constructor.mjs` — ok A1, A2, A3, A5, A4; `exit 0`. `$ git diff --check` — salida vacía; `exit 0`.
- Tramo 1, paso 1: plantilla leída completa y cotejada con Decisiones; incluye fases, preguntas en Exploración, omisión declarada, historias con dependencias, CUANDO/ENTONCES, A#, TODO atómico, alcance de hasta 3 archivos, verificación y handoff. `git diff --check -- skills/planificar-cambio/SKILL.md`: exit 0.
- Tramo 1, paso 2: secuencia del principal leída y cotejada con la plantilla; concentra preguntas en Exploración, exige validar antes de historias y contempla volver a explorar. Se mantienen aprobación y límites existentes. `git diff --check -- agentes/principal.md`: exit 0.
- Verificación del tramo: `git diff --check`: exit 0. Revisión manual A1: la plantilla y el flujo principal coinciden; se preservan el estado de aprobación, restricciones de seguridad y reglas de verificación.
- Devolución corregida: reglas 4 y 11 permiten externalizar historias si se necesita limitar el contexto; los tamaños y la cantidad de historias quedan como orientación, sin umbral obligatorio. `git diff --check -- skills/planificar-cambio/SKILL.md`: exit 0; revisión manual confirma coherencia con Decisiones y A1.

## Notas
Tramo 3 APROBADO: A3 cumplido; instrucciones de historia activa y compatibilidad anterior presentes.
El agente y la skill son las instrucciones reales utilizadas por el constructor.
La lectura cruzada confirma criterios y dependencias; el contrato existente pasó con datos reales del repositorio.
Las pruebas vecinas del contrato y `git diff --check` pasaron; verify completo queda para tramo 4.
Siguiente: tramo 4 tras compactar o abrir sesión nueva.
Tramo 3 DEVUELTO: `skills/ejecutar-plan/SKILL.md`, sección Tramo, eliminó el literal `tramo-<n>.md` exigido por `verify` (contrato anterior de A3); restituirlo y repetir la verificación del tramo.
Tramo 2 APROBADO: el revisor y las pruebas cumplen A2.
La entrada real del revisor aplica las comprobaciones a historias y planes antiguos.
El ejemplo real pasó sin avisos y el fixture estable evita depender de la ruta archivada.
Las 14 pruebas pasaron, incluidas las pruebas anteriores de comportamiento vecino.
Siguiente: tramo 3 tras compactar o abrir sesión nueva.
Tramo 2 listo: el positivo de historia nueva usa un fixture versionado dentro de `pruebas/revisar-plan/fixtures/`.
La suite no depende de `cambios/planes-por-feature/ejemplo-don-financio.md`, por lo que sobrevive al archivo del cambio.
La comprobación explícita de ese ejemplo permanece en Evidencia y pasó sin avisos en esta revisión.
La suite pasó con casos sensibles para pasos ausentes, campos obligatorios, referencias A# y el máximo de archivos.
Siguiente: tramo 3, ajustar el contrato de ejecución y correr su verificación completa.
Tramo 1 APROBADO: plantilla y flujo del principal existen y coinciden con A1.
Las instrucciones están conectadas al flujo real del kit; se revisaron los archivos productivos.
La revisión manual y `git diff --check` pasaron; la compatibilidad ejecutable se comprueba en tramos 2 y 3.
Mejora para próximo plan: declarar una comprobación de regresión de instrucciones vecinas en este tramo.
Siguiente: tramo 2, revisor y pruebas; continuar tras compactar o abrir sesión nueva.
Tramo 3 listo: el constructor recibe instrucciones centradas en la historia activa.
La skill cubre Handoff, dependencias, criterios A# y TODO de la historia.
El agente constructor conserva compatibilidad con planes antiguos y sus pasos.
La lectura cruzada, el contrato de constructor y `git diff --check` pasaron.
Siguiente: tramo 4, revisar contrato de ejecución y su verificación integral.
Cuenta canónica del plan: 2 casillas pendientes, ambas del tramo 4; `awk '/^- \[ \]/{n++} END{print n+0}' cambios/planes-por-feature/plan.md` devolvió 2; `git diff --check` pasó; `exit 0`.
Devolución tramo 3 corregida: se conserva `tramo-<n>.md` exigido por `verify` y se documenta además el nombre nuevo `tramo-N.md`.
