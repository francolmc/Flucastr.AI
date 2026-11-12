---
name: planificar-cambio
description: "Escribe el plan de un cambio en `cambios/<nombre>/plan.md`: el único documento que recibe el constructor. Úsala cuando el trabajo tiene varios pasos o cruza capas (web, API, base de datos)."
---

# Planificar un cambio

El plan es el **traspaso** entre tú y el constructor. El constructor es un modelo pequeño que no vio tu conversación: solo sabe lo que está escrito. Escribe el plan para que no tenga que adivinar nada.

## Antes de escribir

- Explora e investiga hasta tener evidencia real: corre el build, lee los archivos, confirma que las rutas existen. Nunca cites en el plan un archivo que no hayas visto.
- Si el cambio cruza capas, **un solo plan** cubre el recorrido completo. No abras un plan por archivo ni por capa.

## Plantilla

Crea `cambios/<nombre>/plan.md` (nombre corto en minúsculas con guiones):

```markdown
---
estado: borrador
rama: feature/<nombre>
base: <rama>   # opcional; sin ella, la principal del remoto
repos: [<carpeta>, ...]
ejecutor: constructor   # principal solo si Franco lo pidió
tramo: 1   # solo en planes por tramos: el tramo que ejecuta el constructor (regla 11)
tipo: codigo   # docs si el cambio solo toca documentos (regla 12)
---
# <Cambio>

## Objetivo
Una o dos frases: qué queda funcionando y para quién.

## Supuestos
Lo que diste por sentado del pedido ambiguo, una línea cada uno. Si no hubo nada que suponer, escribe «Ninguno».

## Alcance
Carpetas y archivos donde el constructor puede cambiar cosas. Incluye todo el camino
que el objetivo cruza (código, manifiestos, lock, Dockerfiles, configuración).
Fuera de alcance: lo que NO se toca.

## Decisiones ya tomadas
Lo que el constructor no debe volver a decidir, cada una con su porqué en una línea. Incluye `Ejecutor: <quién>, porque <respuesta de la prueba de ejecutabilidad>`.

## Escenarios
- CUANDO <situación> ENTONCES <resultado observable> (A1)

Ejemplo: «CUANDO el archivo no existe ENTONCES el comando falla (A1)»; A1 describe «archivo inexistente rechazado», comprueba con una ruta inexistente y espera exit distinto de 0. La prueba negativa es pertinente porque un contador que devuelve cero al fallar aceptaría el caso incorrecto.

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | <resultado> | <comprobación automática o revisión manual; indicar qué mirar> | <resultado esperado> |

Cada escenario debe enlazarse explícitamente con una fila de Aceptación. En pruebas nuevas añade una comprobación de sensibilidad relevante (fixture incorrecto o mutación aislada que falle por el motivo esperado). Si una lista vacía pudiera aceptar todo, exige entradas/casos descubiertos no vacíos. No hace falta una mutación por cada frase ni paso administrativo.

## Verificación
`<comando>` — el que define «hecho». Debe correr desde cero y fallar si algo falla.

## Pasos
- [ ] <paso concreto y comprobable> (A1; los de entorno, «entorno»)

## Evidencia
(la escribe el constructor)

## Notas
(la escribe el constructor)
```

## Estados

El campo `estado:` del plan tiene solo estos valores, con su responsable:

- `borrador`: el principal lo escribe.
- `aprobado`: el principal lo pasa con el «sí» de Franco.
- `en curso`: el constructor, al empezar.
- `listo`: el constructor, si `verify` pasó. En un plan por tramos, `listo` es «tramo terminado con su verificación pasada»; el principal vuelve a `aprobado` con `tramo: N+1` y, tras el último tramo, `verify` completo.
- `parcial`: el constructor, si devolvió `PAUSA`.

Al cerrar, el principal mueve la carpeta a `cambios/hechos/` **sin cambiar `estado`**: la carpeta es la marca. No existe el estado `hecho` ni `cerrado`.

## Reglas del buen plan

1. **Alcance por camino, no por archivo.** Si el constructor encuentra un fallo relacionado dentro del alcance, lo corrige; no debe tener que parar por eso.
2. **Un comando de verificación** que prueba el resultado final, no cada pieza. Si el proyecto aún no tiene `verify`, el primer plan es crearlo (`preparar-proyecto`).
3. **Paso atómico**: una línea, una acción, una comprobación, con orientación de unas 20 palabras. Se permite una sublínea para comprobación y resultado esperado; no sacrifiques claridad por el límite. Un paso con más de un requisito se parte. No hay tope de pasos (40 es válido), en orden, cada uno comprobable. Sin código completo salvo firmas o contratos que deban respetarse.
4. **Corto.** Que un modelo pequeño lo lea entero sin esfuerzo. Orientación de tamaño, no límite duro: un cambio simple cabe en unos 5 KB; uno que investiga y toca varias piezas puede llegar a unos 8 KB. Si pasa de eso, se parte en tramos, cada uno con su verificación (o son dos cambios). No hay herramienta que lo mida.
5. **Repos en el frontmatter.** `repos:` es obligatorio: la lista de carpetas (relativas a la raíz del proyecto) donde el cambio toca código o recibe la rama. Un proyecto de un repo escribe `repos: [.]`. Un workspace escribe solo las carpetas que el cambio toca (p. ej. `repos: [api]`). Si el cambio toca solo documentos o `verify` de la raíz, `repos: [.]`: la raíz cuenta como un repo más.
6. **Decisiones cerradas.** Si falta una decisión de producto, pregúntala a Franco antes de pedir la aprobación; no la dejes abierta en el plan.
7. **Quién ejecuta (`ejecutor:`). Prueba de ejecutabilidad.** Se decide con el plan ya escrito, con cuatro preguntas sí/no: (1) ¿están cubiertos los requisitos? (2) ¿el contexto y los prerrequisitos son accesibles? (3) ¿hay comprobaciones con resultados esperados y errores/bloqueos tratables dentro del alcance? (4) ¿no toca credenciales, despliegue ni producción? Reformula pasos para que el constructor no tenga que conocer resultados futuros ni prever todos los errores. El ejecutor es `constructor` salvo que Franco pida expresamente que ejecutes tú; en ese caso `ejecutor: principal` y la línea de razón cita su petición. En otro caso, `ejecutor: constructor`, también si alguna respuesta es no: mejora el plan cuando sea posible, pero nunca asignes `principal` por ello. Sea cual sea el ejecutor, `## Decisiones ya tomadas` lleva una línea `Ejecutor: <quién>, porque <respuesta de la prueba>`, para que Franco la discuta en la puerta 1. Sin la línea `ejecutor:`, se trata como `constructor`.
8. **Supuestos explícitos.** Cada supuesto en `## Supuestos` va en una línea y dice qué pasa si Franco lo corrige (p. ej. «Validar email con regex simple; si Franco quiere DNS, cambian el alcance y un paso»). Lo que no sea supuesto, sino decisión que cambia el resultado, no va ahí: se pregunta.
9. **Duración en los pasos pesados.** Un paso que lanza un build, una instalación o una suite lleva su duración estimada entre paréntesis, p. ej. «(≈8 min)». Si la suma pasa de unos 20 minutos, parte el plan en tramos, cada uno con su verificación parcial. Los pasos intermedios usan `VERIFY_RAPIDO=1 ./verify` (build con caché); «sin caché» solo en la corrida final de aceptación.
10. **Base (`base:`).** Rama base de una carpeta de `repos:`: la de `base:` del plan; sin `base:`, la de `git symbolic-ref --short refs/remotes/origin/HEAD`; sin remoto, `main` o `master`. `base:` es un nombre (vale para todas las carpetas de `repos:`) o un mapa `{carpeta: rama}` si en un workspace varían. El principal copia `base:` desde la línea «Rama base» del `AGENTS.md` del proyecto, si la hay.
11. **Tramos.** Si el cambio pasa de ≈6 pasos o ≈20 min estimados, se escribe en tramos. Cada tramo es un `### Tramo N` dentro de `## Pasos`, con: el resultado observable al terminarlo; los archivos que toca; sus pasos, cada uno con su A# entre paréntesis; una línea `Verificación del tramo:` con un comando que corre desde cero; y las A# que cubre. Si el entorno no está comprobado, el primer tramo es solo entorno (instalar, levantar, reproducir), sin cambiar código. La evidencia y las capturas van en el último tramo. El plan lleva `tramo: 1`; el principal sube `tramo:` al lanzar cada siguiente tramo. Cada A# se comprueba por el recorrido real (el entrypoint productivo, no una función suelta): un arnés propio solo vale si monta la misma composición que producción. Los tramos posteriores se ajustan tras ver el estado real del anterior. Si el plan pasa de 3 tramos o de ≈8 KB, cada tramo va en su propio archivo `tramo-N.md` en la misma carpeta (con sus pasos, su `Verificación del tramo:` y su evidencia), y `plan.md` queda como índice corto: frontmatter, Objetivo, Alcance, Decisiones, Aceptación, Verificación, y una lista de tramos con su estado (pendiente, en curso, listo). El constructor lee `plan.md` y solo `tramo-<n>.md`, no los demás tramos. Al cerrar cada tramo, el principal deja en *Notas* del `plan.md` un resumen de 5 líneas (qué quedó, qué sigue) y pide a Franco compactar (`/compact`) o abrir sesión nueva con `Plan: <ruta>`, para no arrastrar el contexto del tramo anterior. Una decisión que se resuelve durante el cambio se escribe en *Decisiones ya tomadas* como `Resuelto: <fecha> <decisión>`, para que el constructor no la vuelva a pedir. Cada `Verificación del tramo:` declara su nivel (regla 13): el Nivel 2 va solo en el tramo que deja el flujo conectado de punta a punta, y el Nivel 3 solo en la corrida final de aceptación, en el último tramo.
12. **Tipo.** `tipo: docs` solo si el cambio toca archivos `*.md` o `docs/`. Su *Verificación* es liviana, sin build ni Docker: `git diff --check` más comprobar que existen las rutas y los comandos que el documento cita (`test -f`, `rg`). Sin `tipo:`, es `codigo`.
13. **Niveles de verificación.** Tres niveles: **Nivel 1** `Comprobación rápida` (la línea `Comprobación rápida: <comando>` del `AGENTS.md`: tipos, lint y tests del host; sin Docker; segundos); **Nivel 2** `VERIFY_RAPIDO=1 ./verify` (Docker con caché); **Nivel 3** `./verify` sin caché (aceptación final). Cambio chico: un solo repo, hasta ≈3 archivos, sin migración, sin cambio de contrato de API ni de ruta o pantalla del recorrido. Su *Verificación* es el Nivel 1 más un test que cubra el cambio. Sin la línea `Comprobación rápida` en `AGENTS.md`, se usa `verify` como hoy.

## Antes de pedir la aprobación

Aplica la Prueba de ejecutabilidad (regla 7) y anota el ejecutor. Relee el plan como si fueras el constructor sin contexto: ¿qué tendrías que adivinar? Corrige eso. Haz además un cruce: escenarios, A#, pasos y tramos. Cada escenario tiene su A#; cada A# la cubre algún paso o tramo; cada paso cita su A# (los de entorno, «entorno»); y los tramos no se contradicen. Sin A# huérfana ni contradicciones. Luego detente y di a Franco la ruta del plan. Con su «sí», cambia `estado: aprobado`.

Si el constructor devuelve `parcial`, corriges el plan y lo vuelves a `estado: aprobado` antes de relanzar: el constructor solo arranca con `aprobado`. Al relanzar tras una `PAUSA` no agregues texto sobre condiciones de detención («límite real», «checkpoint»): solo cuál es el siguiente paso.
