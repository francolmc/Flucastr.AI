---
estado: listo
rama: feature/ejecucion-por-tramos
base: main
repos: [.]
ejecutor: constructor
---
# Ejecución por tramos: un encargo estrecho por vez

## Objetivo
Que el principal planifique en tramos pequeños y el constructor reciba uno por vez, con un ritmo fijo (reproducir, cambiar, volver a correr), de modo que un fallo cueste un tramo y no todo el cambio. Sale de la auditoría de Andes (`docs/investigaciones/auditoria-andes-constructor.md`) y de `cierre-fiable-agentes-ejecutores.md`, sección 4.

## Supuestos
- Un solo plan aprobado contiene los tramos; Franco aprueba una vez (puerta 1) y revisa al final (puerta 2). Si prefiere aprobar cada tramo, cambian el principal (paso 6) y la regla 11.
- El constructor sigue creando la rama (`switch -c`) como hoy; no se toca su lista de Git. Si falla por permisos, el principal crea la rama antes de lanzar.
- La efectividad no se mide aquí. El primer uso real (Don Financio) se registra en `docs/evaluaciones/tramos.md`.

## Alcance
Puede cambiar: `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `agentes/principal.md`, `agentes/constructor.md`, `verify`, `AGENTS.md`, `README.md` (una línea) y crear `docs/evaluaciones/tramos.md`.
Fuera: `modelos.json`, `instalar.sh`, `scripts/`, `old/`, `cambios/hechos/`, `pruebas/`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los requisitos están cubiertos, el contexto es accesible, hay comprobaciones con resultado esperado y no toca credenciales ni producción.
- Se conservan los textos que `verify` ya exige (contador `pendientes-plan`, `awk`, `siguiente=`, `no_intentado=`, `3 corridas`, lista de Git del constructor, `Prueba de ejecutabilidad`, `ejecutor:`, `20 palabras`, `base:`, `rama base`, `git status`). No borrarlos.
- Estado `listo` significa «tramo terminado y su verificación pasó». El principal vuelve a `aprobado` con `tramo: N+1`.
- Retorno nuevo: `COMPLETADO: plan=<ruta>; tramo=<n>; verify=pasa`. La `PAUSA` conserva su formato y añade `tramo=<n>`.
- La toma del tramo por el principal sigue siendo solo con petición expresa de Franco (regla vigente tras dos `PAUSA` iguales).

## Escenarios
- CUANDO el principal planifica un cambio largo ENTONCES lo escribe en `### Tramo N`, con entorno primero, aceptación sobre el recorrido real y evidencia al final (A1).
- CUANDO lanza al constructor ENTONCES el plan trae `tramo: N` y el constructor ejecuta solo ese tramo (A2).
- CUANDO el constructor repara un defecto ENTONCES reproduce, cambia y vuelve a correr el mismo comando (A3).
- CUANDO una decisión figura como `Resuelto:` ENTONCES el constructor no la vuelve a pedir en una `PAUSA` (A4).
- CUANDO vuelve un tramo ENTONCES el principal revisa su diff, corre la verificación del tramo y avanza `tramo:` (A5).
- CUANDO el principal revisa un tramo ENTONCES responde cuatro preguntas (¿existe?, ¿está conectado al recorrido real?, ¿con datos reales?, ¿sigue andando lo vecino?) y corre una comprobación propia que el plan no dictó (A6).
- CUANDO el principal termina de escribir un plan ENTONCES cruza escenarios, A#, pasos y tramos antes de pedir la aprobación, y cada paso cita su A# (A7).
- CUANDO se quita un texto nuevo de cualquiera de los cuatro archivos ENTONCES `verify` falla (A8).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Regla de tramos en la skill de planificación | `grep -c "### Tramo" skills/planificar-cambio/SKILL.md`; `grep -c "recorrido real" skills/planificar-cambio/SKILL.md` | Ambos ≥ 1; la regla 11 nombra entorno primero y evidencia al final |
| A2 | `tramo:` en plantilla y constructor | `grep -n "tramo:" skills/planificar-cambio/SKILL.md skills/ejecutar-plan/SKILL.md agentes/constructor.md` | Coincidencia en los tres |
| A3 | Ritmo reproducir-cambiar-repetir | `grep -n "vuelve a correr" skills/ejecutar-plan/SKILL.md` | Presente en un bloque «Ritmo de cada paso» |
| A4 | `Resuelto:` respetado | `grep -n "Resuelto:" skills/planificar-cambio/SKILL.md skills/ejecutar-plan/SKILL.md` | Presente en ambas; el constructor debe buscarlo antes de una `PAUSA` por `ambiguo` |
| A5 | Principal por tramos | `grep -n "tramo" agentes/principal.md` | Describe lanzar por tramo, revisar diff, correr la verificación del tramo y avanzar `tramo:` |
| A6 | Revisión por tramo del principal | `grep -n "Revisión por tramo" agentes/principal.md` | Lista las cuatro preguntas y la comprobación propia no dictada por el plan |
| A7 | Cruce previo y trazabilidad | `grep -n "cruce" skills/planificar-cambio/SKILL.md` | La skill exige cruzar escenarios↔A#↔pasos↔tramos antes de aprobar y que cada paso cite su A# (los de entorno citan «entorno») |
| A8 | `verify` sensible | `./verify`; paso 11 con copia que omite cada texto nuevo | Baseline pasa; cada copia sin su texto falla con su mensaje |

## Verificación
`./verify` — debe pasar completo e incluir el paso 11.

## Pasos
### Tramo 1: reglas de planificación y plantilla
- [x] En `skills/planificar-cambio/SKILL.md`, añadir `tramo: 1` al frontmatter de la plantilla, con un comentario de una línea.
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 26: `tramo: 1   # solo en planes por tramos: el tramo que ejecuta el constructor (regla 11)`
- [x] Añadir la regla 11 «Tramos»: más de ≈6 pasos o ≈20 min → `### Tramo N`; cada uno con resultado observable, archivos, pasos, `Verificación del tramo:` y las A# que cubre.
  - Incluir: entorno primero y solo, si no está comprobado; evidencia y capturas en el último tramo.
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 93: regla 11 «Tramos» con `### Tramo N`, `Verificación del tramo:`, entorno primero y evidencia en el último tramo
- [x] En esa regla, exigir que cada A# se compruebe por el recorrido real (entrypoint productivo); un arnés propio solo vale si monta la misma composición.
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 93 (regla 11): «Cada A# se comprueba por el recorrido real (el entrypoint productivo…)»; `grep -c "recorrido real"` = 1
- [x] Añadir: los tramos posteriores se ajustan tras ver el estado real del anterior; una decisión resuelta se escribe en *Decisiones ya tomadas* como `Resuelto: <fecha> <decisión>`.
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 93 (regla 11): «Los tramos posteriores se ajustan tras ver el estado real del anterior» y «`Resuelto: <fecha> <decisión>`»
- [x] Actualizar la lista de Estados: `listo` es «tramo terminado con su verificación pasada».
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 76: «En un plan por tramos, `listo` es «tramo terminado con su verificación pasada»»
- [x] En esa skill, exigir que cada paso termine con su A# entre paréntesis (los de entorno, «entorno»), y añadir a «Antes de pedir la aprobación» un cruce: escenarios, A#, pasos y tramos, sin A# huérfana ni contradicciones.
  - evidencia: `skills/planificar-cambio/SKILL.md` líneas 59 (plantilla del paso con «(A1; los de entorno, «entorno»)») y 97 («Haz además un cruce: escenarios, A#, pasos y tramos…»)
### Tramo 2: ejecución y principal
- [x] En `skills/ejecutar-plan/SKILL.md`, añadir «Tramo»: leer `tramo:` y ejecutar solo los pasos de `### Tramo <n>`; al terminar su verificación devolver el retorno nuevo.
  - evidencia: `skills/ejecutar-plan/SKILL.md` línea 26 (sección «## Tramo») y línea 88 (retorno `COMPLETADO: plan=<ruta>; tramo=<n>; verify=pasa`)
- [x] Añadir «Ritmo de cada paso»: leer el archivo, reproducir el defecto con un comando y anotar su salida, cambiar, volver a correr el mismo comando, marcar.
  - evidencia: `skills/ejecutar-plan/SKILL.md` línea 46 (sección «### Ritmo de cada paso», paso 4 «vuelve a correr el mismo comando»)
- [x] Añadir: antes de una `PAUSA` con `motivo=ambiguo` o `acceso`, buscar `Resuelto:` en el plan; lo resuelto no se vuelve a pedir. Añadir un ejemplo literal de línea de evidencia, de `COMPLETADO` y de `PAUSA`.
  - evidencia: `skills/ejecutar-plan/SKILL.md` línea 81 (regla «busca `Resuelto:`»), y ejemplos literales en las secciones «## Evidencia» y «## Al terminar» (`grep -c "Ejemplo de"` = 3)
- [x] En `agentes/constructor.md`, indicar que solo trabaja el tramo de `tramo:` y actualizar el formato de retorno (conservar los textos de las decisiones).
  - evidencia: `agentes/constructor.md` línea 16 (solo el tramo de `tramo: <n>`) y líneas 28-30 (retorno `COMPLETADO: plan=<ruta>; tramo=<n>; verify=pasa`, `PAUSA` con `tramo=<n>`)
- [x] En `agentes/principal.md`, puntos 4 y 5: lanzar por tramo con `tramo:` y `estado: aprobado`; al volver, revisar `git diff` del tramo, correr su verificación, avanzar `tramo:`; la puerta 2 llega tras el último tramo y con `verify` completo.
  - evidencia: `agentes/principal.md` línea 28 (punto 4: «lanzarlo de a un tramo: pon `tramo: <n>` y `estado: aprobado`») y línea 31 (punto 5: revisar `git diff` del tramo, `Verificación del tramo:`, avanzar `tramo:`, puerta 2 tras el último tramo con `verify` completo)
- [x] En `agentes/principal.md`, añadir «Revisión por tramo»: ¿existe lo pedido?, ¿está conectado al recorrido real?, ¿con datos reales?, ¿sigue andando lo vecino?; más una comprobación propia sobre el recorrido real que el plan no dictó.
  - evidencia: `agentes/principal.md` línea 37 («## Revisión por tramo») con las cuatro preguntas y la comprobación propia
### Tramo 3: verify, documentación y registro
- [x] Añadir a `verify` el paso 11: textos nuevos en los cuatro archivos (incluidos «Revisión por tramo» y «cruce») y copias que omiten cada uno, que deben fallar. Seguir el estilo del paso 8c.
  - evidencia: `verify` bloque «# 11.» (líneas ~797-840); bloque aislado ejecutado con `bash` sobre el repo: baseline ok y 12 copias negativas rechazadas con su mensaje, exit 0 (salida en *Evidencia* no; la corrida completa de `./verify` va al final)
- [x] Crear `docs/evaluaciones/tramos.md` con una tabla vacía: fecha, proyecto, tramo, resultado, reintentos, rehecho por el principal (sí/no, qué) y duración.
  - evidencia: `docs/evaluaciones/tramos.md` creado; tabla con las siete columnas pedidas y cero filas
- [x] Añadir una línea a `AGENTS.md` y otra a `README.md` sobre la ejecución por tramos.
  - evidencia: `AGENTS.md` línea 11 («Ejecución por tramos: …») y `README.md` línea 17 («Un cambio largo se parte en tramos (`### Tramo N`)…»)
- [x] Correr `./verify` tal cual y pegar la salida real en *Evidencia*.
  - evidencia: `./verify`, exit 0 (salida completa en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/9660ec8c-29aa-4a44-a687-b28aa33bc5a6/scratchpad/verify-1.log`; cola en *Evidencia*)

## Evidencia

$ ./verify
[… salida anterior omitida; la completa está en el log de la nota …]
ok 10: self-test del runner pasó; no se lanzó --run ni inferencia
== 11. ejecución por tramos: textos nuevos y copias sin cada uno ==
ok 11 baseline: los cuatro archivos traen sus textos nuevos
ok 11 negativa: copia sin «### Tramo N» en skills/planificar-cambio/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «tramo: 1» en skills/planificar-cambio/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «cruce» en skills/planificar-cambio/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «Resuelto:» en skills/planificar-cambio/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «Si el plan trae `tramo: <n>` en el frontmatter» en skills/ejecutar-plan/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «vuelve a correr el mismo comando» en skills/ejecutar-plan/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «Resuelto:» en skills/ejecutar-plan/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «Ejemplo de `COMPLETADO`» en skills/ejecutar-plan/SKILL.md rechazada con su mensaje
ok 11 negativa: copia sin «Revisión por tramo» en agentes/principal.md rechazada con su mensaje
ok 11 negativa: copia sin «tramo: <n>» en agentes/principal.md rechazada con su mensaje
ok 11 negativa: copia sin «tramo: <n>» en agentes/constructor.md rechazada con su mensaje
ok 11 negativa: copia sin «tramo=<n>» en agentes/constructor.md rechazada con su mensaje
VERIFY OK
exit 0

Aceptación (greps del plan, corridos sobre los archivos ya editados):
- A1: `grep -c "### Tramo"` = 1; `grep -c "recorrido real"` = 1; la regla 11 nombra entorno primero y evidencia al final.
- A2: `tramo:` aparece en `skills/planificar-cambio/SKILL.md`, `skills/ejecutar-plan/SKILL.md` y `agentes/constructor.md`.
- A3: «vuelve a correr el mismo comando» en el bloque «### Ritmo de cada paso» de `skills/ejecutar-plan/SKILL.md`.
- A4: `Resuelto:` en ambas skills; la de ejecución lo busca antes de una `PAUSA` por `ambiguo` o `acceso`.
- A5: `agentes/principal.md` describe lanzar por tramo, revisar `git diff`, correr la verificación del tramo y avanzar `tramo:`.
- A6: «## Revisión por tramo» con las cuatro preguntas y la comprobación propia.
- A7: la skill de planificación exige el cruce y cita A# en cada paso (entorno: «entorno»).
- A8: la baseline del paso 11 pasa y cada copia sin su texto falla con su mensaje (12 de 12).

## Notas
- Este plan no trae `tramo:` en su frontmatter y se ejecutó entero, como un solo plan de tramos. Sus `### Tramo N` no tienen línea `Verificación del tramo:`, así que la única verificación es la final.
- Decisión menor: en un plan sin `tramo:` el retorno omite `tramo=<n>` (en `ejecutar-plan` y en `constructor.md`); el plan no lo fijaba.
- Decisión menor: `tramo=<n>` va después de `plan=` en `COMPLETADO` y en `PAUSA`, y el mismo orden en `PAUSA` de `ejecutar-plan`.
- Corrección en el paso 11 de `verify`: la primera corrida aislada falló con `unbound variable` porque bash leía `$t»` como nombre de variable; se cambió a `${t}`.
- Corrección en el paso 11: `textos_tramos` nombra todos los textos que faltan, no solo el primero. Una línea con dos textos (la regla 11 lleva «### Tramo N» y «tramo: 1») hacía fallar la copia con el mensaje de otro texto.
- Log completo de la corrida final: `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/9660ec8c-29aa-4a44-a687-b28aa33bc5a6/scratchpad/verify-1.log` (7,7 KB).
