---
estado: listo
rama: feature/kit-v2
---
# principal-ambiguo

## Objetivo
Ante un pedido ambiguo, el `principal` no implementa: entrega un plan con sección «Supuestos» (que Franco aprueba o corrige) o hace como máximo 3 preguntas cerradas.

## Alcance
Solo `agentes/principal.md` y `skills/planificar-cambio/SKILL.md`. Fuera de alcance: `constructor.md`, `ejecutar-plan`, `verify`, `instalar.sh`, y el home real (no reinstalar; lo hace Franco).

## Decisiones ya tomadas
- Caso que motivó el cambio: «El registro debería validar el email». El principal implementó solo, agregó normalización de mayúsculas y manejo de JSON no pedidos, y no hizo plan.
- Arreglo directo solo si el pedido define por completo el resultado (qué entra, qué sale, qué pasa en el error). Si hay que decidir algo de comportamiento, es ambiguo.
- No se agrega comportamiento que Franco no pidió. Lo que se te ocurra va a *Notas* o a una pregunta, no al código.
- Preguntar solo si la respuesta cambia el resultado; máximo 3 preguntas, cerradas (opciones, con una recomendada). Lo demás se decide y se anota como supuesto.
- La plantilla del plan gana una sección `## Supuestos` entre *Objetivo* y *Alcance*; vacía solo si no hubo nada que suponer, y entonces se escribe «Ninguno».
- Cambios mínimos en el texto: no reescribir el resto de ambos archivos.

## Escenarios
- CUANDO el pedido es «El registro debería validar el email» ENTONCES el principal no edita código: entrega un plan con *Supuestos* o hasta 3 preguntas cerradas.
- CUANDO el pedido define todo («en `registro.ts` línea 40 cambia el regex por X») ENTONCES lo hace directo.

## Verificación
1. `./verify` termina en `VERIFY OK`.
2. Prueba real (la corre el principal al volver el constructor, no el constructor), fuera del repo, con el prompt nuevo (el agente instalado es una copia vieja, por eso se pasa el cuerpo desde el repo; las skills se leen por enlace y ya son las nuevas):
   `d=$(mktemp -d) && cd "$d" && mkdir -p src && printf 'export function registrar(u){ return {...u, id: 1}; }\n' > src/registro.js && git init -q && claude -p --append-system-prompt "$(node /Users/franco/Codes/flucastr/Flucastr.AI/scripts/resolver.mjs cuerpo /Users/franco/Codes/flucastr/Flucastr.AI/agentes/principal.md)" "El registro debería validar el email"`
   Resultado esperado: `src/registro.js` sin cambios (`cat` y `git status`), y existe `cambios/*/plan.md` con `## Supuestos`, o la salida son ≤3 preguntas. Si implementó, es fallo: el principal ajusta el texto y repite.

## Pasos
- [x] En `agentes/principal.md`, en «Decide el tamaño» (paso 3): separar «pedido completo» de «pedido ambiguo» según las decisiones de arriba.
- [x] En `agentes/principal.md`, reemplazar «Cuándo preguntar a Franco» sumando el criterio de las 3 preguntas cerradas; agregar la regla «no agregues comportamiento no pedido».
- [x] En `skills/planificar-cambio/SKILL.md`: añadir `## Supuestos` a la plantilla y una regla del buen plan que diga cómo escribirlos (cada uno una línea, con lo que pasa si Franco lo corrige).
- [x] Correr `./verify`.
- [x] En *Notas*, dejar escrito: «Franco: reinstala (`bash instalar.sh`) para que `~/.claude/agents/principal.md` tome el cambio».

## Evidencia
$ ./verify
...
== 6. reglas deny del proyecto (instalar, reinstalar, desinstalar, JSON roto) ==
ok escenario 1: sin archivo -> 12 reglas y 12 líneas deny
ok escenario 2: se conservan allow, otra clave y deny propios; solo se registran las agregadas
ok escenario 3: reinstalar deja el archivo y las líneas deny iguales
ok escenario 4: desinstalar devuelve el archivo original (con su Bash(git push *)) o no deja archivo
ok escenario 5: JSON inválido -> no se toca, se avisa, no aborta
ok escenario 6: actualización de 7 a 12 reglas; se agregan y registran solo las 5 nuevas
ok escenario 7: las 7 del usuario sin manifiesto -> se agregan 5; desinstalar deja las 7
VERIFY OK
exit 0

## Notas
- Decisión menor: en `agentes/principal.md` las reglas de pedido ambiguo quedaron bajo «Cuándo preguntar a Franco» (con el subtítulo «Ante un pedido ambiguo»); el paso 3 de «Decide el tamaño» distingue «pedido completo» de «pedido ambiguo».
- Decisión menor: la regla 6 de «Reglas del buen plan» en `skills/planificar-cambio/SKILL.md` cubre cómo escribir los supuestos (una línea, con qué pasa si Franco lo corrige).
- Fallo corregido: un primer Edit de la plantilla en `skills/planificar-cambio/SKILL.md` no coincidió por una línea en blanco; se reintentó con el texto exacto.
- Pendiente de Franco: reinstala (`bash instalar.sh`) para que `~/.claude/agents/principal.md` tome el cambio.
- La prueba real de Verificación (paso 2, `claude -p` sobre un repo temporal) no la corrió el constructor; la corre el principal al volver.

## Evidencia del principal
Prueba real (`claude -p` con el cuerpo de `agentes/principal.md` del repo, carpeta temporal fuera del repo, pedido «El registro debería validar el email»): `src/registro.js` sin cambios (`git status` vacío). Respondió «El pedido es ambiguo, así que no implementé nada», con supuestos (obligatorio, regex simple, `Error('Email inválido')`, sin normalizar) y 2 preguntas cerradas con opción recomendada. No guardó el plan porque `-p` no tenía permiso de escritura; el comportamiento pedido (no implementar, supuestos o preguntas) se cumple. `./verify` → VERIFY OK.
