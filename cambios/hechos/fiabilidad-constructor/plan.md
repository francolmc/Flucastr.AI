---
estado: listo
rama: fix/fiabilidad-constructor
base: main
repos: [.]
ejecutor: constructor
---
# Contrato verificable de planificación y ejecución

## Objetivo
Corregir las ambigüedades del camino planificación → traspaso → ejecución → aceptación, y probar los mecanismos deterministas que hoy permiten falsos positivos. Este primer cambio no promete una mejora de fiabilidad del modelo: deja un contrato coherente y una base para medirla posteriormente.

## Supuestos
- Se mantiene el constructor y su modelo/esfuerzo actuales; comparar niveles requerirá otro plan si Franco lo pide.
- No se automatizan llamadas pagadas a modelos en `verify`; si Franco quiere una evaluación empírica en este cambio, cambian alcance y duración.
- La investigación existente forma parte del cambio documental; si Franco prefiere excluirla del commit, se retira del alcance antes de ejecutar.

## Alcance
Modificar `agentes/principal.md`, `agentes/constructor.md`, `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `verify`, `AGENTS.md` y `README.md` (solo explicar contrato y tipos de prueba).
Crear `pruebas/contrato-constructor.mjs` y `docs/evaluaciones/constructor.md`. Conservar `docs/investigaciones/fiabilidad-constructor.md` como antecedente, corrigiendo únicamente enlaces si hiciera falta.
Fuera de alcance: `modelos.json`, resolver, instaladores, reglas deny, estados nuevos, otros repos, `old/`, `pruebas/.temporales/`, instalación global, commits y despliegues. No leer ni editar PENDIENTES.md.

## Decisiones ya tomadas

### Planificación y aceptación
- Añadir `## Aceptación` a la plantilla: tabla `ID | Resultado observable | Comprobación | Resultado esperado`. Cada escenario debe tener cobertura explícita en ella; admitir revisión manual cuando no haya un oráculo automático adecuado, indicando qué mirar.
- En pruebas nuevas, incluir una comprobación de sensibilidad relevante: fixture incorrecto o mutación aislada que falle por el motivo esperado. Exigir entradas/casos descubiertos no vacíos cuando una lista vacía pudiera aceptar todo. No exigir una mutación por cada frase o paso administrativo.
- Reformular la Prueba de ejecutabilidad sin exigir conocer resultados futuros ni prever todos los errores: requisitos cubiertos, contexto/prerrequisitos accesibles, comprobaciones con resultados esperados y errores/bloqueos tratables dentro del alcance. Mantener ejecutor constructor salvo petición expresa.
- Mantener pasos atómicos con orientación de unas 20 palabras, permitiendo comprobación y resultado en una sublínea; no sacrificar claridad por el límite.
- La aprobación valida el contrato, no demuestra que la implementación futura pase las pruebas.

### Procedimiento y traspaso
- `skills/ejecutar-plan/SKILL.md` será la única fuente del procedimiento detallado. `constructor.md` conserva rol, límites, frontmatter y formato de retorno, y ordena leer y seguir la skill declarada. Eliminar la afirmación «no hay otra skill que leer» y la copia del bucle.
- Mantener lanzamiento con solo ruta del plan y Rama. El principal comprueba que el plan contiene contexto, aceptación y prerrequisitos; no confiar en la conversación previa.
- Permitir al constructor Git de lectura necesario: `status`, `diff`, `branch --show-current`, `rev-parse` y `symbolic-ref`, con o sin `-C`. La única escritura sigue siendo crear la rama autorizada.
- Permitir relecturas relevantes tras cambios o recuperación; conservar lectura por tramos y edición focalizada.

### Progreso, validación y pausa
- Verificar cada unidad coherente al terminarla, antes de marcar su paso. El paso de verificación final se ejecuta antes de marcarse: eliminar «cero pendientes antes de verificar».
- Concluir solo con requisitos de Aceptación satisfechos, verificación final verde y cero pasos pendientes. Las casillas son progreso declarado, no evidencia independiente.
- Reemplazar `grep -c` por un bloque shell canónico en la skill, etiquetado `bash pendientes-plan`, usando `awk` y el argumento `$1`: contar únicamente líneas `^- \[ \]`, imprimir 0 sin coincidencias y propagar error si no se puede leer el archivo. No añadir dependencia fuera de awk/bash.
- Con pendientes se continúa salvo bloqueo permitido. Mantener motivos de PAUSA existentes, sin la prohibición absoluta de pausar con pendientes.
- Mantener tres corridas de verificación final y corregir errores dentro del alcance. Los checks locales no consumen esas tres corridas; no relanzar una suite fallida sin cambio o diagnóstico nuevo.
- Si el harness avisa un corte inminente, persistir avance y siguiente acción en Notas; no declarar COMPLETADO. Una interrupción deja `en curso`, no es una PAUSA de producto ni requiere inventar un motivo. El principal reconstruye el estado y vuelve a aprobar antes de reanudar.
- No añadir mecanismos de timeout, checkpoint o reanudación al harness. Conservar el timeout actual y las reglas de recursos Docker.

### Revisión y pruebas
- Tras COMPLETADO, el principal revisa diff y tabla de Aceptación, además de ejecutar verify. Repetir una suite idéntica no demuestra cobertura de requisitos nuevos.
- Reestructurar 8c y ajustar los checks 8d–8i afectados: las pruebas de texto vigilan presencia del contrato, no rendimiento del agente. No conservar contradicciones para satisfacer un grep.
- `pruebas/contrato-constructor.mjs` usa solo Node y procesos shell del sistema, temporales aislados y limpieza garantizada. Se invoca desde `verify`; no llama modelos ni modifica archivos reales.
- Los tests extraen el bloque shell canónico de la skill y lo ejecutan; fallan si falta o hay más de uno. No duplicar el contador en el test.
- Ejecutor: constructor, porque pasos y resultados están definidos, los artefactos futuros tienen checks especificados, los fallos están acotados y no hay producción ni credenciales.

## Escenarios y aceptación de este cambio
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | El contador funciona sin pendientes | Ejecutar bloque canónico sobre fixture con pasos completos, bajo `bash -e` | stdout `0`, exit 0 |
| A2 | El conteo ignora ejemplos y evidencia | Fixture con 2 pendientes raíz, 1 completo y checkbox indentado | stdout `2`, exit 0 |
| A3 | Un plan ilegible no se considera completo | Ejecutar contador con ruta inexistente | exit distinto de 0; no aceptar como cero |
| A4 | El test detecta el defecto anterior | Ejecutar el mismo evaluador con bloque mutado a `grep -c` | rechazar caso A1 por exit 1 |
| A5 | Un evaluador vacío no pasa | Ejecutar evaluador con lista de casos vacía | error explícito, no éxito vacuo |
| A6 | El procedimiento no exige cosas incompatibles | Revisión del diff: pausa con pendientes, verificación antes de marcar y relectura permitidas | Ninguna regla antigua contradictoria sigue activa |
| A7 | Planes futuros tienen aceptación trazable | Revisar plantilla y ejemplo mínimo en skill | Escenario enlazado a resultado/check esperado y prueba negativa pertinente |
| A8 | La instalación sigue generando agentes válidos | `./verify` completo, incluidos resolver y simulación | exit 0 y `VERIFY OK` |
| A9 | No se confunde contrato con rendimiento | Revisar documentación de evaluación | Identifica pruebas deterministas y ensayos reales pendientes; no afirma mejora medida |

A1–A5 se automatizan. A6, A7 y A9 requieren revisión del principal: los checks de texto son regresiones auxiliares, no sustitutos de juicio semántico.

## Verificación
`./verify` — aceptación automática completa, sin red ni invocaciones a modelos. Además, el principal deja evidencia explícita de A6, A7 y A9 al revisar el retorno.

## Pasos
- [x] Añadir Aceptación y ejemplo trazable a planificar-cambio; comprobar columnas, escenario y prueba negativa descritos en A7.
  - evidencia: skills/planificar-cambio/SKILL.md
- [x] Reformular ejecutabilidad y pasos sin exigir resultados futuros; revisar coherencia con decisiones de planificación.
  - evidencia: skills/planificar-cambio/SKILL.md
- [x] Consolidar procedimiento en ejecutar-plan; comprobar que constructor referencia la skill y no duplica el bucle.
  - evidencia: agentes/constructor.md; skills/ejecutar-plan/SKILL.md
- [x] Corregir lectura y permisos Git del constructor; comprobar que ninguna escritura adicional queda autorizada.
  - evidencia: skills/ejecutar-plan/SKILL.md
- [x] Corregir orden de validación, pausas y recuperación en ejecutar-plan; revisar los tres puntos de A6.
  - evidencia: skills/ejecutar-plan/SKILL.md
- [x] Añadir bloque canónico `bash pendientes-plan`; comprobar comportamiento mediante A1, A2 y A3.
  - evidencia: node pruebas/contrato-constructor.mjs, exit 0
- [x] Crear evaluador aislado y casos A1–A5 en pruebas/contrato-constructor.mjs; ejecutar `node pruebas/contrato-constructor.mjs`.
  - evidencia: node pruebas/contrato-constructor.mjs, exit 0
- [x] Actualizar principal para revisar aceptación y diff antes de puerta 2; mantener las dos puertas y lanzamiento mínimo.
  - evidencia: agentes/principal.md
- [x] Ajustar 8c–8i e integrar tests nuevos; comprobar que ninguna prueba exige instrucciones retiradas.
  - evidencia: verify; pruebas/contrato-constructor.mjs
- [x] Documentar protocolo empírico en docs/evaluaciones/constructor.md; comprobar que incluye todos los campos del apartado siguiente.
  - evidencia: docs/evaluaciones/constructor.md
- [x] Actualizar README y AGENTS con el contrato; distinguir suite determinista de fiabilidad aún no medida.
  - evidencia: README.md; AGENTS.md
- [x] Ejecutar `./verify` (≈1 min); corregir regresiones dentro del alcance y registrar salidas y resultados por ID.
  - evidencia: ./verify, exit 0

### Contenido cerrado del protocolo empírico (sin ejecutarlo aquí)
Cinco casos: extractor vacío, cambio multiarchivo, reparación de regresión, recuperación parcial y bloqueo de acceso legítimo. Por caso, describir fixture inicial, encargo, resultado esperado y oráculo externo que el trabajador no pueda editar. Comparar primero contrato anterior/nuevo manteniendo modelo y esfuerzo; tres intentos aislados por caso como diagnóstico inicial. Registrar modelo/esfuerzo efectivos, resultado externo, retorno declarado, motivo de terminación, intervención del principal, duración y coste disponible (si no se obtiene, «no medido»). Medir éxito al primer intento, falso COMPLETADO y pausa innecesaria. Explicar que la muestra no establece una tasa robusta. No añadir comandos de lanzamiento específicos de un harness sin validarlos; ejecución y configuración quedan para un plan posterior.

## Evidencia
$ ./verify
ok 8c negativa 1: skill sin contador rechazado
ok 8c negativa 2: whitelist Git obsoleta rechazada
ok 8c negativa 3: prohibición de relectura obsoleta rechazada
ok 8c: contador canónico y negativas aisladas de los límites antiguos
ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla
ok 8e: VERIFY_RAPIDO, docker system prune prohibido y timeoutMs presentes; el agente de Claude resuelve; copia sin VERIFY_RAPIDO falla
ok 8f: ceremonia de cierre, abrir el PR y rama base presentes; copia sin «ceremonia de cierre» falla
ok 8g: Prueba de ejecutabilidad en planificar-cambio y principal, y carga de ejecutar-plan presentes; copia sin la prueba falla
ok 8h: rama base documentada; copia sin base falla
== 3e. claude-<agente> y pi-<agente> con esfuerzo; reinstalar refresca; archivo sin marca se respeta ==
ok 3e: effort y thinking low->max al reinstalar, --effort en claude-constructor, archivo sin marca intacto, desinstalar limpia
ok A1
ok A2
ok A3
ok A5
ok A4
ok 8i: planificar-cambio dice «salvo que Franco» sin «Falla la 2 o la 4»; principal dice «petición expresa»; copia con «Falla la 2 o la 4» falla
== 9a. migrar-proyecto: lista de reglas descartadas y prohibición de copiarlas ==
ok 9a: migrar-proyecto trae «Reglas de v1 que descarté», «no las copies» y Fxx; una copia sin la lista falla
VERIFY OK
exit 0

Revisión manual A6, A7 y A9 anotada en Notas; revisión externa del principal antes de la puerta 2.

## Notas
### Aceptación independiente final del principal
- `./verify` ejecutado nuevamente tras la última entrega: exit 0, `VERIFY OK`; salida con A1, A2, A3, A5 y A4 correctos y tres negativas 8c separadas. A1–A5 y A8 aceptados. `git diff --check` sin errores.
- A6 PASA: inspección del agente y skill confirma Git de lectura y relecturas permitidos, pausa con pendientes solo ante bloqueos, verificación antes de marcar su paso. 8c restaura sus tres archivos y comprueba baseline positivo antes de cada mutación; no queda contaminación del fixture.
- A7 PASA: plantilla enlaza escenario A1 a aceptación, resultado observable, comando/check y resultado esperado; exige sensibilidad relevante y no vacuidad, admite revisión manual explícita.
- A9 PASA: documentación distingue comprobaciones deterministas de fiabilidad no medida; protocolo incluye modelo/esfuerzo, aislamiento, oráculo externo y fixture no vacío que representa el falso positivo original. No se ejecutaron ensayos con modelos ni se cambió su configuración.
- Todos los archivos previstos existen, sin cambios fuera del alcance. Puerta 2 pendiente de Franco; no archivar ni hacer commit antes de su aprobación de esta evidencia.

### Segunda revisión del principal: aislar las nuevas negativas de 8c
- Estado reconstruido: rama fix/fiabilidad-constructor; siete archivos rastreados modificados; documentos y prueba previstos presentes, sin archivos fuera del alcance. `./verify` independiente exit 0 y A1–A5 pasan. Las correcciones del agente y del evaluador están presentes.
- Hallazgo corregido en verify/8c: el fixture temporal vuelve a copiar constructor, principal y skill antes de cada negativa; cada mutación tiene un baseline positivo comprobado y se reporta por separado. La corrida de `./verify` mostró «ok 8c negativa 1», «ok 8c negativa 2» y «ok 8c negativa 3», y terminó en `VERIFY OK`.

### Revisión del principal: correcciones antes de puerta 2
- Revisión anterior detectó brechas A6 y A5 y un fixture empírico confuso; se corrigieron en esta reanudación.
- A6: `agentes/constructor.md` ahora permite lecturas Git `status`, `diff`, `branch --show-current`, `rev-parse` y `symbolic-ref`, y relecturas relevantes tras cambios/recuperación. Los tests negativos 8c inyectan la whitelist Git y la prohibición de relectura obsoletas, y verifican que se rechazan.
- A5: `evaluateCases` rechaza explícitamente `[]`; el caso vacío se ejecuta como prueba negativa. El mismo evaluador ejecuta A1–A3 y rechaza el mutante A4 por exit inesperado de A1. Se verifican errores de spawn, señales y status nulo como fallos de infraestructura, no como éxito de A3.
- Protocolo: el caso del extractor ahora usa fixture conocido no vacío con opciones; el extractor defectuoso devuelve cero elementos y el oráculo externo comprueba opciones esperadas y omisión deliberada, evitando confundirlo con entrada legítimamente vacía.
- A7: tabla de Aceptación, trazabilidad y ejemplo con prueba negativa revisados. A9: el protocolo distingue tests deterministas de ensayos de modelo futuros y no afirma mejoras medidas.

- Investigación: `docs/investigaciones/fiabilidad-constructor.md`, con fuentes primarias y separación de hechos/hipótesis.
- Verificación inicial durante planificación: `./verify`, exit 0, `VERIFY OK`.
- Aprobado por Franco. Base comprobada: main, `git fetch origin` correcto, `HEAD..origin/main` = 0; rama fix/fiabilidad-constructor aún inexistente. Sin cambios fuera de esta carpeta.
- Informe guardado temporalmente en `cambios/fiabilidad-constructor/investigacion.md` para cumplir la base limpia. Al empezar, restaurarlo mediante movimiento a `docs/investigaciones/fiabilidad-constructor.md` (crear directorios si faltan); no dejar copia temporal. Este movimiento forma parte del alcance documental aprobado.
- Errores previsibles: si una prueba textual falla por una regla retirada, actualizar ese check con su negativa correspondiente, no restaurar la contradicción. Si falla la suite en otro subsistema, diagnosticar; corregir solo si relacionado y dentro del alcance, en otro caso PAUSA con evidencia.
- La verificación inicial detectó checks 8c y 8f desactualizados; se ajustaron al contrato consolidado. En esta reanudación, se cerraron los hallazgos A6, A5 y el fixture empírico; `node pruebas/contrato-constructor.mjs` y la corrida final de `./verify` pasaron. A3 falla con status no-cero por ruta inexistente; los errores de spawn/señales se rechazan aparte.
- Si el evaluador nuevo pasa con cero casos o acepta la mutación grep, no marcar su paso: corregir el oráculo. No considerar probado el comportamiento del modelo por pasar tests deterministas.
