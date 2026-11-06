# task-01 — Núcleo que comprueba la evidencia de una tarea
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Hoy el `coordinador` decide a ojo si la *Evidencia* de una tarea trae la salida real de cada comando de *Verificación*; por eso (síntoma S5) devuelve tareas «listas» hasta 5 veces. Esta tarea crea el núcleo `validarEvidencia(texto)`, una función pura que devuelve los motivos de rechazo. El CLI y las reglas vienen en task-02 y task-03.

## Contexto
- Tocar: `scripts/formato-evidencia.mjs`, `scripts/formato-tarea.mjs`, `pruebas/comprobaciones/formato-evidencia.test.mjs`
- Leer `scripts/formato-tarea.mjs`: la función `secciones(lineas)` (hoy sin `export`) divide en secciones `## ` ignorando bloques de código; devuelve `{titulo, lineas}`. Estado: la segunda línea, `estado: <valor>` (regex `RE_SEGUNDA` del mismo archivo).
- Formato de la línea `Registro:` en `skills/ejecutar-tarea/SKILL.md` §«Línea de registro»: `Registro: n=<n>; herramienta=<h>; modo=<m>; intentos=<n>; verificacion=<r>; huecos=<n>; resultado=<r>; causa=<c>`.
- Estilo de pruebas: `pruebas/comprobaciones/validar-tarea.test.mjs` (`node:test`, `node:assert/strict`). Se ejecuta con `node --test <archivo>`.

## Decisiones ya tomadas
- Archivo nuevo `scripts/formato-evidencia.mjs` exporta `validarEvidencia(texto)` (arreglo de mensajes en español; vacío = válida). Importa `secciones` de `./formato-tarea.mjs`, al que solo se le agrega `export` a esa función.
- Comandos de *Verificación*: cada línea no vacía, que no empiece por `#`, dentro de un bloque de código de esa sección; una línea = un comando.
- Formato de *Evidencia*: dentro de bloques de código, cada comando como línea `$ <comando>` idéntica al de *Verificación*; su salida son las líneas siguientes hasta el próximo `$ ` o el fin del bloque. «Salida no vacía» = al menos una línea no vacía. El código de salida se escribe como línea `exit N` (N entero) en la salida; es obligatoria en cada comando.
- Esperado: en *Verificación*, las líneas fuera de bloques de código que contienen «esperad» (sin distinguir mayúsculas); cada fragmento entre comillas invertidas debe aparecer literal en el texto de *Evidencia*. No se juzga el valor del código de salida (un comando puede salir distinto de 0 legítimamente): solo se exige la línea `exit N`; la corrección de la salida la cubren estos fragmentos.
- Pendientes: se rechaza si *Evidencia* contiene, como palabra completa, `TBD`, `TODO` o `PENDIENTE` (solo en mayúsculas, sensible a mayúsculas: `node:test` siempre imprime `ℹ todo 0` y «todo» es palabra común), o `a definir`, `según corresponda` o `no ejecutado` (estas tres sin distinguir mayúsculas). El motivo cita el marcador.
- Registro: en *Notas*, la última línea no vacía debe ser `Registro: …` con los 8 campos en ese orden; `n` debe igualar la cantidad de líneas `Registro:`. Coherencia por estado: `lista para revisión` y `hecha` exigen `resultado=lista`, `causa=ninguna`, `verificacion=pasa` e `intentos` ≥ 1; `bloqueada` exige `resultado` `bloqueada` o `escalada`; `borrador`, `aprobada` y `en curso` se rechazan («la tarea no está terminada»).
- Un motivo por problema, con el comando o fragmento citado.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: la función y sus pruebas, incluido el control negativo.
Fuera de alcance: el CLI (task-02), reglas de agentes o skills (task-03), `instalar.sh`, y validar el resto de la tarea (eso lo hace `validarTarea`).

## Pasos
1. En `scripts/formato-tarea.mjs`, anteponer `export` a `function secciones`. Resultado: `formato-tarea.test.mjs` sigue en verde.
2. Crear `scripts/formato-evidencia.mjs` con `validarEvidencia` según las decisiones.
3. Crear `pruebas/comprobaciones/formato-evidencia.test.mjs` con una tarea base completa armada en el test y casos: completa (sin motivos); falta un comando; comando con salida vacía; fragmento esperado ausente (la salida trae `ℹ fail 2` y se esperaba `ℹ fail 0`, se rechaza); comando sin línea `exit N` (se rechaza citando el comando); comando con `exit 1` cuya línea «Esperado» dice «sale 1» (no se rechaza); comando con `exit 1` cuya «Esperado» no nombra código y trae `ℹ fail 0` presente (no se rechaza); marcador `no ejecutado`; sin línea `Registro:`; `Registro:` incoherente (`verificacion=falla` con estado `lista para revisión`); estado `aprobada`; *Evidencia* con el bloque real de `node --test` (líneas `ℹ tests`, `ℹ suites`, `ℹ pass`, `ℹ fail`, `ℹ cancelled`, `ℹ skipped`, `ℹ todo 0`) y una frase con «todo» y otra con «Todo» (no se rechaza por pendientes); *Evidencia* con `TODO` en mayúsculas (se rechaza y el motivo cita `TODO`).
4. Control negativo: un caso con dos comandos en *Verificación* y solo uno en *Evidencia* debe devolver exactamente un motivo que cita el comando faltante.

## Criterios de aceptación
1. La tarea base completa devuelve `[]`. Se comprueba en la prueba.
2. Cada uno de los casos negativos del paso 3 (incluidos comando sin `exit N` y fragmento `ℹ fail 0` ausente) devuelve al menos un motivo que lo nombra; los dos casos con `exit 1` y fragmentos presentes devuelven `[]`.
3. `formato-tarea.test.mjs` sigue pasando.
4. Una *Evidencia* con el bloque real de `node --test` (con `ℹ todo 0`) y frases con «todo»/«Todo» no devuelve motivo de pendientes; con `TODO` en mayúsculas sí, citándolo. Se comprueba en la prueba.
5. `scripts/formato-evidencia.mjs` no escribe archivos ni usa red ni git.

## Verificación
```
node --test pruebas/comprobaciones/formato-evidencia.test.mjs
node --test pruebas/comprobaciones/formato-tarea.test.mjs
```
Esperado: en ambos `ℹ fail 0`.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-evidencia.test.mjs
ℹ tests 14
ℹ suites 0
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 82.111334
exit 0
```

```
$ node --test pruebas/comprobaciones/formato-tarea.test.mjs
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 65.898417
exit 0
```

## Notas
- Corrección: marcadores en mayúsculas (node:test imprime «ℹ todo 0»). `TBD`, `TODO` y `PENDIENTE` solo en mayúsculas y como palabra completa; `a definir`, `según corresponda` y `no ejecutado` sin distinguir mayúsculas. Dos pruebas nuevas: bloque real de `node --test` con «todo»/«Todo» no se rechaza; `TODO` en mayúsculas sí.
- Corrección: no se juzga el valor del código de salida (lo cubren los fragmentos Esperado).
- Hecho: se quitó la comparación de `exit`; se exige la línea `exit N` (caso nuevo). Pruebas: `exit 1` con «sale 1» y sin código, `exit N` ausente, fragmento `ℹ fail 2`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
