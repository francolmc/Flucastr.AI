# Diseño — primera herramienta: tarea con «hecho» verificable

> Estado: **borrador APARCADO** (2026-10-28). No está en el alcance actual: primero se cierra el agente `arquitecto` (ver `plan-pruebas-arquitecto.md`). Este documento no estaba entre las salidas definidas del arquitecto y se escribió sin pedir permiso; se conserva solo como referencia para la etapa siguiente.
> Origen: elección del enfoque A por Franco (conversación). Los puntos marcados *propuesta* aún no están confirmados.

## Problema

Cuatro versiones anteriores del kit no entregaron nada: se itera y nunca se termina una feature (confirmado, Franco). El riesgo mayor es repetirlo: construir herramienta en vez de producto.

## Qué significa «funcionando» (para esta herramienta)

Una sola prueba, observable: **una feature real de Don Financio o Andes llega a «hecha» usando esta herramienta, en 2–3 días** (corte duro del `README.md`). Si no ocurre, se para y se revisa qué frena; no se agrega nada.

## Alcance

**Dentro**
- Una plantilla de tarea.
- Un agente `constructor` que ejecuta *una* tarea aprobada.
- Una skill `ejecutar-tarea` con el procedimiento.

**Fuera** (decidido, no se hace ahora)
- Flujos distintos por tamaño (básico, medio, robusto).
- Más agentes (revisor, probador, etc.).
- Orquestación entre agentes, automatización o cambios a `instalar.sh`.
- Estados controlados por código; los estados son texto en el archivo.

## Piezas

Todo en Markdown, sin rasgos propios de una herramienta: sirve igual en Claude Code y Pi.

| Pieza | Ubicación | Qué es |
|---|---|---|
| Plantilla de tarea | `tareas/_plantilla.md` | Formato único de tarea |
| Agente `constructor` | `agentes/constructor.md` | Construye una tarea aprobada, nada más |
| Skill `ejecutar-tarea` | `skills/ejecutar-tarea/SKILL.md` | Pasos y reglas de ejecución |

El instalador actual ya recorre `agentes/*.md` y `skills/*/` (leído en `instalar.sh`), así que **no requiere cambios**. El `constructor` toma el nivel `medio` por defecto (`nivel_por_defecto` de `modelos.json`); el usuario lo cambia ahí si quiere.

### Forma de la tarea (propuesta)

Un archivo por tarea, `tareas/NNN-nombre.md`:

- **Objetivo**: una frase.
- **Criterios de aceptación**: máximo 5, cada uno observable y con «cómo se comprueba».
- **Fuera de alcance**: obligatorio, no puede quedar vacío.
- **Verificación**: comandos exactos que se ejecutan al final.
- **Estado**: `borrador` → `aprobada` → `en curso` → `lista para revisión` → `hecha` | `bloqueada`.
- **Evidencia**: salida real de la verificación, la llena el constructor.
- **Notas de bloqueo**: si se detuvo, por qué.

Una tarea debe caber en una sesión. Si no cabe, se parte en dos.

### Reglas del `constructor` (propuesta)

1. Solo trabaja sobre una tarea en estado `aprobada`. Sin eso, se detiene y lo dice.
2. Construye solo lo que piden los criterios. Nada de «ya que estoy».
3. **Nunca marca `hecha`.** Al terminar, ejecuta la verificación, pega la salida en *Evidencia* y deja `lista para revisión`. `hecha` la pone Franco después de revisar y hacer el commit.
4. **Corte contra la iteración infinita:** si la misma verificación falla dos veces por la misma causa, se detiene, deja `bloqueada`, explica qué intentó y espera a Franco.
5. Mantiene los límites de siempre: sin commit, push, PR, merge ni despliegue; sin leer `.env`, llaves ni credenciales.

## Cómo se ve «hecha» (propuesta, por confirmar)

Una feature está **hecha** solo si:
1. Sus criterios se cumplen y se ven funcionando.
2. La verificación se ejecutó y su salida está en *Evidencia*.
3. Franco la aprobó y él hizo el commit.

## Decisiones

| Decisión | Por qué | Descartado y por qué | Qué la cambiaría |
|---|---|---|---|
| Empezar por tarea verificable (A) | Ataca directo el dolor: una tarea termina o no, sin zona gris | B (flujo completo por tamaño): se diseña sin haber terminado una feature; C (solo probar): repite lo ya vivido | Que A no logre una feature hecha en 2–3 días |
| El constructor no puede marcar `hecha` | Quien construye no debe aprobarse a sí mismo | Que el agente cierre la tarea: justo el origen de «casi terminado» | — |
| Corte tras 2 fallos iguales | Frena el ciclo de iterar sin llegar | Reintentos sin límite | Evidencia de que 2 es muy poco |
| Solo Markdown, sin cambiar el instalador | Neutral entre agentes y mínimo | Scripts o estado en código: complejidad sin dolor probado | Una necesidad real de automatizar |
| Un agente y una skill | Lo más simple que sirve | Varios agentes: sin razón concreta todavía | Que el constructor haga demasiado para una sola sesión |

## Preguntas abiertas

1. ¿Dónde viven las tareas? **Recomiendo** `tareas/` dentro del repo del producto (donde trabaja el constructor), no en este repo. Hoy el arquitecto solo escribe en `definicion/`, así que redactarlas ahí necesita tu permiso explícito, o las escribes tú a partir de la plantilla.
2. ¿Aceptas el criterio de «hecha» de arriba?
3. ¿Don Financio o Andes como proyecto de prueba, y cuál es la primera feature?
4. ¿URL y visibilidad del remoto?

## Orden de trabajo (cuando apruebes)

1. Haces el primer commit del kit actual (hoy casi sin versionar).
2. Se escriben las tres piezas, con una sesión normal de Claude Code o Pi (el `constructor` aún no existe). Franco revisa y hace el commit.
3. Se instala con `bash instalar.sh`.
4. Se escribe **una tarea real** del proyecto de prueba y se ejecuta con el `constructor`.
5. Se mide contra el corte duro. Recién entonces se decide qué sigue (tamaños, más agentes).

## Estado

Borrador.
