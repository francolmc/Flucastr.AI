# task-02 — `validarEvidencia` valida `Bloqueo:` y acepta `cancelada`
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
`validarEvidencia` hoy ignora cualquier línea de *Notas* que no sea `Registro:` y rechaza el estado `cancelada`. Esta tarea hace que valide el formato de las líneas `Bloqueo:` (que van antes de `Registro:`) y que trate `cancelada` como estado final sin evidencia de verificación, pero con su `Cancelada: motivo=`.

## Contexto
- Tocar: `scripts/formato-evidencia.mjs`, `pruebas/comprobaciones/formato-evidencia.test.mjs`
- Requiere: ninguno
- `scripts/formato-evidencia.mjs` (confirmado): `RE_ESTADO` en la línea 9; `validarEvidencia(texto)` calcula `estado` (línea ≈ 128), devuelve antes si el estado es de `ESTADOS_NO_TERMINADOS`, y al final valida la última línea no vacía de *Notas* (`ultima`, `total`, `campos = RE_REGISTRO.exec(ultima)`).
- `scripts/formato-bloqueo.mjs` (de task-01): `parsearBloqueo`, `parsearCancelada`, `coherenciaBloqueo`, `lineasDeNotas`. De task-01 lee solo las *Notas*.
- `pruebas/comprobaciones/regresion-validadores.test.mjs` borde (c) (confirmado): `Bloqueo: tipo=entorno; falta=docker` antes de un `Registro:` con `causa=otra` no produce motivos de Registro; debe seguir así.
- Base medida: `node --test pruebas/comprobaciones/formato-evidencia.test.mjs` y la regresión dan `ℹ fail 0`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- `RE_ESTADO` agrega `cancelada`. Con `estado === 'cancelada'`, `validarEvidencia` devuelve solo los motivos de `Cancelada:`: debe haber exactamente una línea `Cancelada:` en *Notas*; si falta, el motivo es «Una tarea «cancelada» exige una línea «Cancelada: motivo=…» en «Notas».»; si es inválida, el `error` de `parsearCancelada`. No pide `Registro:` ni evidencia de verificación.
- Para los demás estados terminados (`bloqueada`, `lista para revisión`, `hecha`): cada línea `Bloqueo:` de *Notas* debe pasar `parsearBloqueo` (si no, el `error` como motivo); ninguna `Bloqueo:` puede aparecer después de la última `Registro:` (motivo «La línea «Bloqueo:» debe ir antes de «Registro:».»); cada `Bloqueo:` se cruza con la causa de la primera línea `Registro:` que la sigue usando `coherenciaBloqueo`.
- `Bloqueo:` es opcional: su ausencia no produce motivos. La regla de la última línea (`Registro:`) y el regex de 8 claves no cambian.
- Los motivos se agregan con `errores.push(...)` sin duplicados.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `validarEvidencia` y sus pruebas.
Fuera de alcance: `formato-tarea.mjs` (task-03), `registrar.mjs`, exigir `Bloqueo:` en tareas `bloqueada`, `definitions/`.

## Pasos
1. En `scripts/formato-evidencia.mjs` importa de `./formato-bloqueo.mjs` y agrega `cancelada` a `RE_ESTADO`.
2. Antes de la sección de comandos de *Verificación*, si `estado === 'cancelada'`, devuelve los motivos de `Cancelada:`.
3. Antes del bloque de la línea de registro, agrega la validación de las líneas `Bloqueo:` (formato, posición y coherencia con la causa).
4. En `formato-evidencia.test.mjs` agrega casos: `cancelada` válida (sin evidencia), `cancelada` sin línea, con motivo fuera de la lista y con dos líneas; `Bloqueo:` válida antes de `Registro:` (sin motivos); `Bloqueo:` mal formada; `Bloqueo:` después de `Registro:`; `tipo=entorno` con `causa=ninguna`.
5. Corre la verificación.

## Criterios de aceptación
1. Una tarea `cancelada` con `Cancelada: motivo=obsoleta` da `[]`; sin la línea da un motivo; se comprueba con la prueba.
2. Las líneas `Bloqueo:` inválidas, tardías o incoherentes producen motivos; se comprueba con la prueba.
3. La regresión sobre las 49 tareas no cambia; se comprueba con `regresion-validadores.test.mjs`.

## Verificación
```
node --test pruebas/comprobaciones/formato-evidencia.test.mjs 2>&1 | grep -E "^ℹ fail"
node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ fail"
```
Esperado: `ℹ fail 0` en ambos comandos.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-evidencia.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0

$ node --test pruebas/comprobaciones/formato-evidencia.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 34
ℹ pass 34
ℹ fail 0
exit 0

$ sh pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 617
ℹ pass 610
ℹ fail 7
exit 0

$ sh pruebas/rapida.sh >/dev/null 2>&1
exit 1
```

Anotación: la rápida mide `ℹ tests 617`, `ℹ pass 610`, `ℹ fail 7` frente a la base `609/602/7`: delta +8 tests, todos los de `formato-evidencia.test.mjs` (26 → 34). Los 7 fallos por nombre son los de la base: «definitions/BACKLOG.md real cumple el formato» (F26), «falla si falta la lectura acotada en constructor», «falla si falta la lectura acotada en ejecutar-tarea», «falla si un agente conserva la línea de modelos.json», «falla si WORKFLOW.md pasa de 30720 caracteres», «falla si WORKFLOW.md conserva la frase sobre modelos.json», «los archivos reales cumplen la regla». `rapida.sh` sale 1 por esos 7, como en la base.

Anotación: criterio 1 cubierto por «cancelada válida con Cancelada: motivo=obsoleta…» (da `[]`) y «cancelada sin línea Cancelada: …» (da el motivo exacto); criterio 2 por las cuatro pruebas de `Bloqueo:` (mal formada, después de `Registro:`, `tipo=entorno` con `causa=ninguna`, y la válida con `causa=otra` que da `[]`); criterio 3 por `regresion-validadores.test.mjs`, `ℹ fail 0`, borde (c) incluido.

## Notas
- Huecos menores resueltos: (1) las posiciones de `Bloqueo:` y `Registro:` se calculan con `lineasDeNotas(todo, '')`, que da las líneas de *Notas* fuera de código, en orden, para comparar índices. (2) El mensaje de dos líneas `Cancelada:` («hay 2») no estaba en la tarea: se añadió y se prueba. `validarEvidencia` devuelve los motivos sin duplicados con `new Set`.
- Pasadas de *Verificación*: 1 (los comandos de la rápida se repitieron para copiar la salida real y el `exit`; ninguna pasada falló).
- Decisión abierta: ninguna. Sin commit ni rama nueva (modo yolo).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
