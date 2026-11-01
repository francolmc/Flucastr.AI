# task-02 — `coordinador`: `STATUS.md` solo en puertas y cambios de rol, con `Edit` por sección
repo: Flucastr.AI   depende_de: task-01   estado: lista para revisión

## Descripción
Reescribir `STATUS.md` completo fue el 28 % del costo del `coordinador` (52 turnos de 216, `definitions/CONTEXTO.md` §1). Esta tarea cambia las reglas de `agentes/coordinador.md` para que `STATUS.md` se escriba solo en puertas y cambios de rol, con `Edit` por sección, con ítems cortos, y para que las llamadas independientes se agrupen en un turno.

## Contexto
- Leer `agentes/coordinador.md`: «Cómo avanzas» (paso 2, líneas 47-53), «Formato de `definitions/STATUS.md`» (líneas 120-131, incluye «Reescribe el archivo completo cada vez») y «Antes de entregar».
- Diseño aprobado: `definitions/CONTEXTO.md` §2.4 y §8 punto 5 (`definitions/PENDIENTES.md` existe y ningún agente lo lee sin pedido de Franco).
- `pruebas/comprobaciones/coordinador-status.test.mjs` exige, dentro de «Cómo avanzas», un paso que contenga «Antes de delegar, escribe en `definitions/STATUS.md`» ANTES del paso que contiene «Delega.»; y prohíbe la cadena «CONTEXTO:».
- Supuesto de §2.4 (Pi ejecuta en orden varias llamadas de un turno): lo verifica task-05; aquí solo se redacta la regla.
- Tocar: `agentes/coordinador.md`.

## Decisiones ya tomadas
- Se edita con `Edit` por tramos; el paso 2 de «Cómo avanzas» conserva «Antes de delegar, escribe en `definitions/STATUS.md`» (es la única escritura por delegación) y se le añade que es un `Edit` de la sección «Paso actual».
- Frases literales (las comprobará task-04): `Reescribes \`STATUS.md\` solo en puertas y en cambios de rol`; `con \`Edit\` por sección, no con \`Write\` completo`; `cada ítem ≤150 caracteres`; `Agrupa en un mismo turno las llamadas independientes`.
- Contenido permitido en `STATUS.md`: escalación, paso actual (una línea por tarea en curso), qué revisa Franco con ruta, bloqueos abiertos. Sin historia ni recordatorios de largo plazo (esos van a `definitions/PENDIENTES.md`, que no lees).
- El ejemplo de agrupación: el `Edit` de `STATUS.md` y el `Edit` del `estado` de la tarea, y varias lecturas de cabecera, en un mismo turno.
- Se elimina la frase «Reescribe el archivo completo cada vez; no acumules historia» (la reemplazan las frases nuevas). La plantilla de secciones de `STATUS.md` queda igual.
- Presupuesto: no más de ~500 bytes netos; `coordinador.md` ≤ 17 300 bytes al terminar.

## Alcance / Fuera de alcance
Alcance: `agentes/coordinador.md`, secciones «Cómo avanzas», «Formato de `definitions/STATUS.md`» y, si hace falta, «Antes de entregar».
Fuera de alcance: reglas de lectura (task-01); `subagents_enable`, plantilla de encargo, `contact_supervisor` (task-03); pruebas (task-04); el umbral de `STATUS.md` en `scripts/archivar.mjs` (F23); la tabla de decisión; `definitions/STATUS.md` y `PENDIENTES.md`.

## Pasos
1. «Cómo avanzas», paso 2: añadir `Edit` de «Paso actual» sin mover el orden de los pasos.
2. «Formato de `definitions/STATUS.md`»: reemplazar la línea «Reescribe el archivo completo…» por las tres reglas (cuándo, cómo, tope por ítem y contenido permitido). La línea «Si falta `definitions/`, no lo crees tú: delega al `arquitecto`» se conserva.
3. «Cómo avanzas» (nuevo paso o frase del paso 4): la regla de agrupar llamadas independientes, con el ejemplo de Decisiones.
4. Correr las verificaciones.

## Criterios de aceptación
1. Las cuatro frases literales existen y «Reescribe el archivo completo cada vez» ya no (comandos 1 y 2).
2. `coordinador-status.test.mjs` y `contrato-roles.test.mjs` pasan.
3. `wc -c agentes/coordinador.md` ≤ 17300.
4. `git diff --stat` muestra solo `agentes/coordinador.md`.

## Verificación
- `grep -cF -e 'Reescribes `STATUS.md` solo en puertas y en cambios de rol' -e 'con `Edit` por sección, no con `Write` completo' -e 'cada ítem ≤150 caracteres' -e 'Agrupa en un mismo turno las llamadas independientes' agentes/coordinador.md` → `4` o más.
- `grep -c 'Reescribe el archivo completo cada vez' agentes/coordinador.md` → `0`.
- `node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs` → `fail 0`.
- `wc -c agentes/coordinador.md` → ≤ 17300.

## Evidencia
```
$ grep -cF -e 'Reescribes `STATUS.md` solo en puertas y en cambios de rol' -e 'con `Edit` por sección, no con `Write` completo' -e 'cada ítem ≤150 caracteres' -e 'Agrupa en un mismo turno las llamadas independientes' agentes/coordinador.md
4
$ grep -c 'Reescribe el archivo completo cada vez' agentes/coordinador.md
0
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/coordinador-status.test.mjs
ℹ tests 34
ℹ pass 34
ℹ fail 0
$ wc -c agentes/coordinador.md
17152 agentes/coordinador.md
$ git diff --stat -- agentes/coordinador.md
 agentes/coordinador.md | 11 +++++++++--
 1 file changed, 9 insertions(+), 2 deletions(-)
```
Criterio 4: el diff de `agentes/coordinador.md` es el único de código de esta tarea. Además aparecen `definitions/STATUS.md` y task-01 (cambios previos sin commitear, no tocados) y esta tarea (solo `estado` y esta sección).

## Notas
- Hueco menor: la regla de agrupar llamadas se añadió como párrafo después del paso 5 de «Cómo avanzas», no como paso numerado nuevo (para no renumerar). Decisión: conservadora.
- Hueco menor: las tres reglas de `STATUS.md` van en una lista, una frase por línea, porque `grep -c` cuenta líneas; con las cuatro frases en una sola línea daba 2, no 4.
- Presupuesto: +550 bytes netos (16 602 → 17 152), un poco por encima de «~500»; sigue bajo el tope de 17 300.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=3; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
