# task-12 — El `coordinador` escribe `STATUS.md` antes de delegar
repo: Flucastr.AI   depende_de: task-11   estado: aprobada

## Descripción
Con compactación automática el estado del flujo no puede vivir en la conversación: Pi y Claude Code pueden compactar entre dos turnos de una misma corrida. Añadir a `agentes/coordinador.md` la regla de que, antes de delegar a cualquier rol, el `coordinador` deja el estado en `definitions/STATUS.md` y, tras una compactación o al empezar, retoma releyéndolo. Sin esto, la prueba con modelo de las tareas 15 y 16 no tiene qué comprobar.

## Contexto
- Leído `agentes/coordinador.md`: la sección «Qué lees para decidir» (primer archivo: `definitions/STATUS.md`), «Cómo avanzas» (cuatro pasos numerados; el paso 2 es «Delega. Dile al subagente qué skill usar, qué leer y que no escriba en `STATUS.md`. …»; el paso 4 trata de las puertas) y «Formato de `definitions/STATUS.md`» («Reescribe el archivo completo cada vez; no acumules historia.»).
- Regla ya aprobada en `definitions/WORKFLOW.md` §3 (viñeta «Higiene de contexto»): el estado vive en `STATUS.md` y archivos, no en la conversación; el kit deja puesta la compactación automática. `WORKFLOW.md` mide 30.516 caracteres (tope 30.720): **no se toca** en esta feature.
- Diseño: `definitions/ARCHITECTURE.md`, punto 4 de «Riesgos» (Pi puede compactar entre turnos de una misma corrida, así que el estado se escribe antes de delegar, no al final).
- Comprobadores que leen `agentes/coordinador.md`: `pruebas/comprobaciones/contrato-roles.mjs` y `higiene-contexto.test.mjs`; el cuerpo se instala con `scripts/resolver.mjs` (la línea de identidad va antes, no afecta). Se verifican con `bash pruebas/rapida.sh`.
- Los agentes generados de Claude Code necesitan `bash instalar.sh` para recibir el cambio (Pi lee `agentes/coordinador.md` en vivo por el lanzador `pi-coordinador`); esto lo hace Franco antes de la task-16.

## Decisiones ya tomadas
- Insertar, en «Cómo avanzas», entre el paso 1 y el 2, un paso nuevo y renumerar los siguientes (el actual 2 pasa a 3, etc.). Texto literal del paso nuevo, en una sola línea:

```
2. **Antes de delegar, escribe en `definitions/STATUS.md`** el paso actual (rol, feature, tarea y, si aplica, `Rama:` o `Modo yolo:`) y qué debe revisar Franco. La conversación se puede compactar o cerrar entre un turno y otro: el estado vive en el archivo, no en tu memoria.
```

- Añadir al final del párrafo de «Qué lees para decidir» esta frase literal:

```
Si tu conversación empieza vacía o resumida (sesión nueva o compactación), el estado es lo que dice `definitions/STATUS.md`: léelo primero y continúa desde ahí.
```

- No se menciona ninguna herramienta ni comando de barra (la regla es neutral); no se reintroduce `CONTEXTO:`.
- No se cambia ningún otro texto ni la tabla de decisión.

## Alcance / Fuera de alcance
Alcance: `agentes/coordinador.md` (dos inserciones y la renumeración).
Fuera de alcance: `definitions/WORKFLOW.md` (queda bajo 30.720 caracteres), otros agentes, skills, `instalar.sh`, la prueba de la regla (task-13).

## Pasos
1. Leer «Qué lees para decidir» y «Cómo avanzas» de `agentes/coordinador.md`. Resultado: líneas exactas anotadas en *Notas*.
2. Insertar la frase en «Qué lees para decidir». Resultado: `grep -n "empieza vacía o resumida" agentes/coordinador.md` con una línea.
3. Insertar el paso nuevo y renumerar. Resultado: la lista de «Cómo avanzas» va de 1 a 5 sin saltos.
4. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. El primer `grep -c` de *Verificación* (la frase del paso nuevo) da 1.
2. La lista numerada de «Cómo avanzas» es 1, 2, 3, 4, 5 (comando de *Verificación*).
3. `bash pruebas/rapida.sh` termina con exit 0.
4. `wc -m definitions/WORKFLOW.md` sigue en 30516 (no se tocó) y `git diff --stat agentes/coordinador.md` muestra solo ese archivo de esta tarea.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -c 'Antes de delegar, escribe en `definitions/STATUS.md`' agentes/coordinador.md
awk '/^## Cómo avanzas/{f=1;next} /^## /{f=0} f && /^[0-9]+\. /{print substr($0,1,60)}' agentes/coordinador.md
grep -c "empieza vacía o resumida" agentes/coordinador.md
wc -m definitions/WORKFLOW.md
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
```
Esperado: `1`; cinco líneas numeradas del 1 al 5, con la 2 empezando por `2. **Antes de delegar`; `1`; `30516 definitions/WORKFLOW.md`; `rapida exit=0`. Ejecutado por el planificador (solo lectura): `agentes/coordinador.md` tiene hoy cuatro pasos en «Cómo avanzas».

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
