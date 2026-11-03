# task-05 — `coordinador`: `Evita leer:`, regla de mensajero y ausencia de `No leas:`
repo: Flucastr.AI   depende_de: task-04   estado: borrador

## Descripción
En la plantilla de encargo, `No leas:` pasa a `Evita leer:` (límite de contexto, no permiso duro). El `coordinador` no lee un archivo para pasar su contenido: pasa la ruta en `Lee:`. Ante `BLOQUEO:` con `motivo=lectura:` no delega la lectura: pregunta a Franco. Una prueba nueva exige que `No leas:` no vuelva al `coordinador`. El neto sobre el núcleo (6977 B, tope 7168) debe quedar por debajo de 7120 B, para dejar margen a `Disparó:` de F32.

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`, `pruebas/comprobaciones/lectura-extra.test.mjs`
- Texto actual (confirmado), `agentes/coordinador.md` línea 60, paso 3 «Delega»: «…`Lee:` rutas exactas (y la sección citada); `No leas:` lo que el rol no necesita (`definitions/` salvo lo citado, tareas `hecha`, `features/completed/`, `registro/`); `Devuelve:` …responde `BLOQUEO:` o `REFINAR:`.» La línea termina en «ante falta de información responde `BLOQUEO:` o `REFINAR:`.»
- Línea 74, «## Bloqueos» (confirmado): «Ante `BLOQUEO: rol=<rol>; motivo=<motivo>` de un subagente: regístralo en *Bloqueos abiertos* de `STATUS.md`, enrútalo (si toca `definitions/`, puerta 1 y avisa a Franco) y quítalo al resolverse.»
- `features/completed/` y `registro/` siguen dichas en la línea 30 («No entres en `features/completed/` ni en `registro/`…»), y ambas están en el manifiesto del `coordinador`: quitarlas de la plantilla no pierde la regla.
- Medido (confirmado): la cláusula vieja pesa 123 B y la nueva 90 B (−33); la regla de mensajero 79 B; la de bloqueo 65 B; 6977 − 33 + 79 + 65 = 7088 B (tope 7168 en `topes-bytes.test.mjs`).
- Pruebas: `contrato-roles.test.mjs` recorre `FRASES_POR_ARCHIVO`. No hay comprobación de ausencias, por eso la prueba nueva es propia. Estilo de pruebas: `node:test`, `node:assert/strict`, raíz con `fileURLToPath(new URL('../../', import.meta.url))` (ver `topes-bytes.test.mjs`, líneas 1–7).
- `skills/revisar-proyecto-existente/SKILL.md` línea 13: «- No leas `.env`, llaves ni credenciales; `.env.example` sí.» (confirmado: única coincidencia de «No leas» en `skills/` y `agentes/` fuera del `coordinador`; es permiso duro y no cambia).
- Fuente: definitions/LECTURA-PRESUPUESTO.md «Modelo: dos líneas, dos dueños»

## Decisiones ya tomadas
- Cláusula nueva, literal, en lugar de la vieja: «`Evita leer:` lo que el rol no necesita (`definitions/` salvo lo citado, tareas `hecha`)».
- Al final de la línea 60 se agrega, literal: « No lees un archivo para pasar su contenido a otro rol: pasa la ruta en `Lee:`.»
- Al final de la línea 74 se agrega, literal: « Con `motivo=lectura:` no delegues la lectura: pregunta a Franco.»
- Manifiesto: `FRASES_LECTURA_EXTRA.coordinador = ['Evita leer:', 'pasar su contenido a otro rol', 'motivo=lectura:']`, propagado en `'agentes/coordinador'`.
- Prueba nueva `lectura-extra.test.mjs` con cuatro casos: (a) el `coordinador` real no contiene `No leas:`; (b) control negativo: una función local `contieneNoLeas(texto)` devuelve `true` para un texto con `No leas:` y `false` para uno con `Evita leer:`; (c) `skills/revisar-proyecto-existente/SKILL.md` conserva «No leas \`.env\`»; (d) `skills/lectura-extra/SKILL.md` contiene «no aplica al \`coordinador\`».
- No se agrega `Disparó:` ni nada de F32.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: tres ediciones de texto en `coordinador.md`, una frase en el manifiesto y la prueba de ausencias.
Fuera de alcance: `definitions/CONTRATOS.md` línea 17 (`No leas:` → `Evita leer:`) y `definitions/CONTEXTO.md` §2.2 y §5 (pendientes de puerta 1: los cambios en `definitions/` los decide Franco); `skills/revisar-proyecto-existente`; `Disparó:`; otros agentes; cualquier tope.

## Pasos
1. En `agentes/coordinador.md` reemplaza la cláusula `No leas:` de la línea 60 por la nueva.
2. Agrega la regla de mensajero al final de la línea 60 y la regla de bloqueo al final de la línea 74.
3. En `frases-por-archivo.mjs` agrega la clave `coordinador` a `FRASES_LECTURA_EXTRA` y la propagación en `'agentes/coordinador'`.
4. Crea `pruebas/comprobaciones/lectura-extra.test.mjs` con los cuatro casos.
5. Mide con `wc -c` y corre las pruebas.

## Criterios de aceptación
1. `agentes/coordinador.md` mide como máximo 7120 B; se comprueba con `wc -c` (esperado 7088).
2. `No leas:` ya no está en `coordinador.md`; se comprueba con `grep -c`.
3. Las tres frases nuevas están literales; se comprueba con `grep -c`.
4. `lectura-extra.test.mjs` pasa con sus cuatro casos; se comprueba con `node --test`.
5. `topes-bytes` y `contrato-roles` pasan sin cambiar topes.

## Verificación
```
wc -c < agentes/coordinador.md
grep -c "No leas:" agentes/coordinador.md
grep -c "Evita leer:" agentes/coordinador.md
node --test pruebas/comprobaciones/lectura-extra.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/contrato-roles.test.mjs
```
Esperado: un número ≤ 7120; `0`; `1`; `ℹ fail 0`.

## Evidencia

## Notas
