---
name: planificar-cambio
description: "Escribe el plan de un cambio en `cambios/<nombre>/plan.md`: el único documento que recibe el constructor. Úsala cuando el trabajo tiene varios pasos o cruza capas (web, API, base de datos)."
---

# Planificar un cambio

El plan es el **traspaso** entre tú y el constructor. El constructor es un modelo pequeño que no vio tu conversación: solo sabe lo que está escrito. Escribe el plan para que no tenga que adivinar nada.

## Antes de escribir

- Trabaja como una conversación: explora qué existe y qué falta saber; evalúa opciones y costo; confirma la decisión con la persona usuaria; después escribe historias para construir e iterar con el constructor.
- Todas las preguntas de comportamiento se hacen en Exploración, antes de Validación y de escribir historias. Si después aparece una duda cuya respuesta puede cambiar el resultado, vuelve a Exploración, pregunta y actualiza el plan antes de continuar.
- Puedes saltar una fase si el cambio es pequeño o claro. Declara en una línea cuál fase omites y por qué; no omitas una decisión necesaria.
- Explora e investiga hasta tener evidencia real: lee los archivos y confirma las rutas. Nunca cites en el plan un archivo que no hayas visto. Corre comprobaciones cuando aporten evidencia al cambio.
- Si el cambio cruza capas, **un solo plan** cubre el recorrido completo. No abras un plan por archivo ni por capa.

## Plantilla

Crea `cambios/<nombre>/plan.md` (nombre corto en minúsculas con guiones):

```markdown
---
estado: borrador
rama: feature/<nombre>
base: <rama>   # opcional; sin ella, la principal del remoto
repos: [<carpeta>, ...]
ejecutor: constructor   # principal solo si la persona usuaria lo pidió
tramo: 1   # solo en planes por tramos: el tramo que ejecuta el constructor (regla 11)
continuidad: continua   # opcional: habilita al constructor a avanzar por los tramos aprobados
tipo: codigo   # docs si el cambio solo toca documentos (regla 12)
---
# <Cambio>

## Objetivo
Una o dos frases: qué queda funcionando y para quién.

## Exploración
Qué existe, qué falta saber y evidencia revisada. Registra aquí todas las preguntas de comportamiento y sus respuestas. Si el tema es grande o desconocido, amplía la investigación en `exploracion.md` y enlázalo; en los demás casos, deja el registro en este plan.

## Evaluación
Opciones consideradas, beneficios, costo/riesgo y opción recomendada. Para cambios claros sin alternativas relevantes, dilo en una línea.

## Supuestos
Lo que diste por sentado, una línea cada uno, y qué cambia si la persona usuaria lo corrige. Si no hubo supuestos, escribe «Ninguno».

## Decisiones ya tomadas
Decisiones confirmadas y sus razones, una por línea. Incluye `Ejecutor: <quién>, porque <respuesta de la prueba de ejecutabilidad>`.

## Decisiones
Dudas menores resueltas durante la ejecución, una por línea, con el motivo. Las decisiones de producto o alcance quedan para la persona usuaria.

## Validación
Qué se confirmó con la persona usuaria y cuándo. No abras preguntas nuevas aquí: si falta confirmar una decisión que cambia el resultado, vuelve a Exploración. Sin aprobación explícita, el plan permanece en borrador.

## Alcance
Carpetas y archivos de producto donde el constructor puede cambiar cosas. Una rama para toda la feature. Cada historia declara su alcance y lista como máximo tres archivos de producto; separa más archivos en historias ordenadas. Incluye todo el recorrido que cruza (código, manifiestos, lock, Dockerfiles, configuración). Fuera de alcance: lo que no se toca.

## Verificación
`<comando>` — el que define «hecho». Debe correr desde cero y fallar si algo falla.

## Condiciones de parada
En modo continuo, avanzar si la comprobación pasa, el siguiente paso sigue dentro del Alcance y no requiere una decisión de la persona usuaria. Detenerse con una nota de lo hecho, lo pendiente y el motivo si la misma causa hace fallar dos veces, se requiere salir del Alcance, falta una decisión de la persona usuaria o una comprobación tarda más del doble de su duración medida. Registrar las dudas menores de alcance en `## Decisiones` y continuar.

## Pasos

Cada historia es un `### Tramo N — Historia: <resultado>` y puede construirse y comprobarse sola sobre la base, salvo dependencias declaradas. Ordénalas para que las dependencias queden antes. Cada historia incluye los siguientes campos:

```markdown
### Tramo 1 — Historia: <resultado útil>
Como <usuario> quiero <capacidad> para <valor>.
Dependencias: ninguna («No aplica») | Tramo <N> — <resultado requerido y motivo> | Externa — <sistema, herramienta, requisito o contrato externo necesario y motivo>; identifica las dependencias reales.
Contratos a conservar: <interfaces y comportamientos que deben mantenerse; o «No aplica»>.
Rutas susceptibles de cambio: <rutas concretas que probablemente cambien; si una prueba usa una ruta, indica si puede moverse o archivarse y qué prueba debe actualizarse; o «No aplica»>.
Ejemplo concreto del resultado esperado: <acción o entrada y resultado observable; o «No aplica»>.
Alcance: <hasta tres archivos de producto; identificar cuáles>
Archivos: <rutas de los archivos de producto, separadas por comas>
CUANDO <situación> ENTONCES <resultado observable> (A1)
Aceptación:
- A1: <resultado verificable>; comprobar con <comando o revisión y qué mirar>; esperar <resultado>.
TODO:
- [ ] <acción en archivo/ruta> (A1). Comprobación: `<comando o señal>`; esperar <resultado>.
Verificación del tramo: `<comando>` — nivel <1|2|3>; exit 0; cubre A1.
Handoff: <contexto mínimo, decisiones cerradas, rutas relevantes y cómo retomar la iteración principal-constructor>.
```

Para habilitar continuidad, el frontmatter declara `continuidad: continua`; si se omite, el plan conserva la ejecución de un tramo por vez. En modo continuo, una historia puede reunir varios tramos pequeños y ordenados: cada tramo mantiene alcance, criterios, pasos y verificación propios, y el constructor los ejecuta en secuencia hasta completar la historia o aplicar las condiciones de parada. Agrúpalos bajo el mismo resultado de usuario y no superes tres archivos de producto por tramo. Declara también `Revisión: fin de historia` o `Revisión: por tramo`; esta última es opcional incluso para riesgo alto, pero si se declara bloquea el avance hasta el veredicto. Registra una medición inicial por cada comando de comprobación: comando exacto, duración observada y entorno. Si aún no existe esa medida, el constructor se detiene antes de ejecutar esa comprobación y deja nota para medirla. Cada tramo deja un punto de control con archivos tocados, resumen del diff y comprobación; al cerrar la historia sugiere un único commit de esa historia para la persona usuaria, sin crear commits.

Cada historia tiene sus propios `CUANDO/ENTONCES`, criterios `A1..An` y TODO. Los A# son únicos en todo el plan. Un TODO es una sola acción atómica, nombra el archivo y especifica cómo comprobarla y qué resultado esperar; divide tareas que mezclen archivos o comprobaciones. Pruebas y documentos no cuentan en el límite de tres archivos de producto. La verificación de la historia debe comprobar su resultado observable por el recorrido productivo pertinente; no presentes una función suelta como flujo completo. Si una historia depende de otra, explica qué resultado necesita, por qué y ordénala después. El handoff da al constructor solo el contexto necesario para completar esa historia y devolver evidencia para la revisión del principal.

En pruebas nuevas añade una comprobación de sensibilidad relevante (fixture incorrecto o mutación aislada que falle por el motivo esperado). Si una lista vacía pudiera aceptar todo, exige entradas/casos descubiertos no vacíos. No hace falta una mutación por cada frase ni paso administrativo.

Los planes antiguos que usan `## Escenarios` y `## Aceptación` siguen siendo válidos para ejecutar y revisar. En planes nuevos, los criterios viven dentro de cada historia; no dupliques una aceptación global.

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
```

## Estados

El campo `estado:` del plan tiene solo estos valores, con su responsable:

- `borrador`: el principal lo escribe.
- `aprobado`: el principal lo pasa con el «sí» de la persona usuaria.
- `en curso`: el constructor, al empezar.
- `listo`: el constructor, si `verify` pasó. En un plan por tramos, `listo` es «tramo terminado con su verificación pasada»; el principal vuelve a `aprobado` con `tramo: N+1` y, tras el último tramo, `verify` completo.
- `parcial`: el constructor, si devolvió `PAUSA`.

Al cerrar, el principal mueve la carpeta a `cambios/hechos/` **sin cambiar `estado`**: la carpeta es la marca. No existe el estado `hecho` ni `cerrado`.

## Reglas del buen plan

1. **Alcance por camino, no por archivo.** Si el constructor encuentra un fallo relacionado dentro del alcance, lo corrige; no debe tener que parar por eso.
2. **Un comando de verificación** que prueba el resultado final, no cada pieza. Si el proyecto aún no tiene `verify`, el primer plan es crearlo (`preparar-proyecto`).
3. **Paso atómico**: una línea, una acción, una comprobación explícita y su resultado esperado, con orientación de unas 20 palabras. Incluye la comprobación como sublínea cuando no quepa con claridad en el paso. `Verificación del tramo` es adicional y nunca sustituye la comprobación individual. No sacrifiques claridad por el límite. Un paso con más de un requisito se parte. No hay tope de pasos (40 es válido), en orden, cada uno comprobable. Sin código completo salvo firmas o contratos que deban respetarse.
4. **Contexto manejable.** Escribe lo necesario para que el constructor entienda su historia sin cargar contexto irrelevante. Los tamaños de 5 KB para un cambio simple y unos 8 KB para uno que investiga varias piezas son solo referencias. Si el contexto resulta difícil de manejar, puedes poner historias en archivos `tramo-N.md` enlazados desde `plan.md`, cada uno con su verificación; el tamaño por sí solo no obliga a dividir.
5. **Repos en el frontmatter.** `repos:` es obligatorio: la lista de carpetas (relativas a la raíz del proyecto) donde el cambio toca código o recibe la rama. Un proyecto de un repo escribe `repos: [.]`. Un workspace escribe solo las carpetas que el cambio toca (p. ej. `repos: [api]`). Si el cambio toca solo documentos o `verify` de la raíz, `repos: [.]`: la raíz cuenta como un repo más.
6. **Preguntas en exploración.** Todas las preguntas de comportamiento se hacen en `## Exploración`, antes de validar y escribir historias. Si una respuesta posterior puede cambiar el resultado, vuelve a explorar y confirma el cambio con la persona usuaria antes de seguir. No dejes decisiones necesarias abiertas al pedir aprobación.
7. **Quién ejecuta (`ejecutor:`). Prueba de ejecutabilidad.** Se decide con el plan ya escrito, con cuatro preguntas sí/no: (1) ¿están cubiertos los requisitos? (2) ¿el contexto y los prerrequisitos son accesibles? (3) ¿hay comprobaciones con resultados esperados y errores/bloqueos tratables dentro del alcance? (4) ¿no toca credenciales, despliegue ni producción? Reformula pasos para que el constructor no tenga que conocer resultados futuros ni prever todos los errores. El ejecutor es `constructor` salvo que la persona usuaria pida expresamente que ejecutes tú; en ese caso `ejecutor: principal` y la línea de razón cita su petición. En otro caso, `ejecutor: constructor`, también si alguna respuesta es no: mejora el plan cuando sea posible, pero nunca asignes `principal` por ello. Sea cual sea el ejecutor, `## Decisiones ya tomadas` lleva una línea `Ejecutor: <quién>, porque <respuesta de la prueba>`, para que la persona usuaria la discuta en la puerta 1. Sin la línea `ejecutor:`, se trata como `constructor`. Un cambio pequeño (definido en `agentes/principal.md`, Reglas duras) puede llevar `ejecutor: principal`: lo autoriza el «sí» de la persona usuaria a esa definición.
8. **Supuestos explícitos.** Cada supuesto en `## Supuestos` va en una línea y dice qué pasa si la persona usuaria lo corrige (p. ej. «Validar email con regex simple; si la persona usuaria quiere DNS, cambian el alcance y un paso»). Lo que no sea supuesto, sino decisión que cambia el resultado, no va ahí: se pregunta.
9. **Duración en los pasos pesados.** Un paso que lanza un build, una instalación o una suite lleva su duración estimada entre paréntesis, p. ej. «(≈8 min)». Si la suma pasa de unos 20 minutos, parte el plan en tramos, cada uno con su verificación parcial. Los pasos intermedios usan `VERIFY_RAPIDO=1 ./verify` (build con caché); «sin caché» solo en la corrida final de aceptación.
10. **Base (`base:`).** Rama base de una carpeta de `repos:`: la de `base:` del plan; sin `base:`, la de `git symbolic-ref --short refs/remotes/origin/HEAD`; sin remoto, `main` o `master`. `base:` es un nombre (vale para todas las carpetas de `repos:`) o un mapa `{carpeta: rama}` si en un workspace varían. El principal copia `base:` desde la línea «Rama base» del `AGENTS.md` del proyecto, si la hay.
11. **Historias y tramos.** Una feature usa una rama y un solo `plan.md`. Cada historia autocontenida puede ocupar un tramo o agrupar varios tramos pequeños consecutivos bajo el mismo resultado de usuario. Cada tramo tiene alcance de hasta tres archivos de producto, criterios A# propios, TODOs atómicos que nombran archivo y comprobación, verificación y evidencia; la historia incluye usuario/valor, dependencias, CUANDO/ENTONCES y handoff. Cada historia debe poder construirse y comprobarse sola sobre la base; si depende de otra, explica qué resultado requiere y por qué, y ordénala después. Mantén las historias pequeñas, preferentemente acotadas por archivo, sin dividir el recorrido en funciones sueltas que no sean resultados útiles. Si el entorno no está comprobado, el primer tramo es solo entorno (instalar, levantar, reproducir), sin cambiar código. Sin `continuidad: continua`, el principal lanza un tramo por vez; con ella, el constructor sigue los tramos aprobados de la historia en orden, sujeto a `## Condiciones de parada`. Los tramos posteriores se ajustan tras ver el estado real del anterior. Los planes antiguos con pasos/tramos tradicionales siguen siendo ejecutables. Cuando sea necesario limitar el contexto del constructor, algunas historias pueden ir en archivos `tramo-N.md` enlazados desde `plan.md`, cada uno con historia, pasos, `Verificación del tramo:` y evidencia; el índice conserva frontmatter, objetivo, exploración si aplica, supuestos, decisiones, validación, alcance, verificación y la lista ordenada de historias con estado. El tamaño o la cantidad de historias no obligan por sí solos a externalizarlas. El constructor lee `plan.md` y solo el `tramo-<n>.md` activo, no otros documentos de tramo. Al cerrar cada historia, usa `/compact` o una sesión nueva para que el principal revise en contexto nuevo. El plan puede exigir revisión por tramo, también para riesgo alto; si la declara, bloquea el avance hasta el veredicto. Una revisión final conserva continuidad, pero puede detectar defectos acumulados; revisar cada tramo los detecta antes, con más pausas y revisiones. En ambos casos el punto de control por tramo registra archivos, resumen del diff y verificación, y sugiere el commit de la historia para la persona usuaria, sin hacer commits. Una decisión menor resuelta durante el cambio se anota en `## Decisiones` como `Resuelto: <fecha> <decisión>`. Cada `Verificación del tramo:` declara su nivel (regla 13); el Nivel 3 solo va en la corrida final de aceptación, en la última historia.
12. **Tipo.** `tipo: docs` solo si el cambio toca archivos `*.md` o `docs/`. Su *Verificación* es liviana, sin build ni Docker: `git diff --check` más comprobar que existen las rutas y los comandos que el documento cita (`test -f`, `rg`). Sin `tipo:`, es `codigo`.
13. **Niveles de verificación.** Tres niveles: **Nivel 1** `Comprobación rápida` (la línea `Comprobación rápida: <comando>` del `AGENTS.md`: tipos, lint y tests del host; sin Docker; segundos); **Nivel 2** `VERIFY_RAPIDO=1 ./verify` (Docker con caché); **Nivel 3** `./verify` sin caché (aceptación final). Riesgo bajo (cambio pequeño o `tipo: docs`, según `agentes/principal.md`): un solo repo, sin migración, sin cambio de contrato de API ni de ruta o pantalla del recorrido. La clasificación es por riesgo, no por número de archivos; un riesgo no listado es riesgo alto. Su *Verificación* es el Nivel 1 más un test que cubra el cambio. Si el plan valida con navegador o contenedores, su *Verificación* es un script de comando fijo del repo (`./scripts/<nombre>.sh` o `./verify`) que hace todos los recorridos en una corrida, no `docker run` ni `compose run` sueltos. Sin la línea `Comprobación rápida` en `AGENTS.md`, se usa `verify` como hoy.
14. **Experiencia.** Si el plan toca una pantalla, una ruta o un flujo de UI, antes de planificar carga la skill `disenar-experiencia` y deja su boceto aprobado en `cambios/<nombre>/pantallas.md`. El plan enlaza ese `pantallas.md` en *Alcance* y añade a la aceptación de las historias afectadas criterios de experiencia: tarea completable en N pasos, sin términos prohibidos de `docs/experiencia.md`, y captura a 390 px sin desborde horizontal. En la puerta 1 presentas el boceto en tu respuesta, no solo su ruta. Sin pantallas tocadas, esta regla no aplica.

## Antes de pedir la aprobación

Aplica la Prueba de ejecutabilidad (regla 7) y anota el ejecutor. Relee el plan como si fueras el constructor sin contexto: ¿qué tendrías que adivinar? Corrige eso. Comprueba el cruce de cada historia: CUANDO/ENTONCES, A#, TODO, archivo y comprobación; cada criterio debe quedar cubierto por un paso y verificación, y las dependencias deben estar ordenadas. Para cada historia, comprueba que documenta sus dependencias reales, incluidas dependencias externas a los tramos y su motivo, los contratos a conservar, las rutas susceptibles de cambio y un ejemplo concreto del resultado esperado; si una prueba usa una ruta, comprueba que indique si puede moverse o archivarse y qué prueba debe actualizarse. En cualquiera de esos campos puede indicar «No aplica». Confirma que cada historia declara hasta tres archivos de producto y que no hay A# huérfanas ni contradicciones. Luego detente y di a la persona usuaria la ruta del plan. Con su «sí», cambia `estado: aprobado`.

Si el constructor devuelve `parcial`, corriges el plan y lo vuelves a `estado: aprobado` antes de relanzar: el constructor solo arranca con `aprobado`. Al relanzar tras una `PAUSA` no agregues texto sobre condiciones de detención («límite real», «checkpoint»): solo cuál es el siguiente paso.
