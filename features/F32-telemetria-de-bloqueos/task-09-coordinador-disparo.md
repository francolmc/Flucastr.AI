# task-09 — `coordinador`: línea `Disparó:` en la plantilla de encargo
repo: Flucastr.AI   depende_de: task-05, task-08   estado: hecha

## Descripción
Cada delegación debe decir qué la originó (una puerta, el bloqueo de una tarea, Franco o un reintento) para que `consumo.mjs` pueda medir las vueltas por bloqueo. Esta tarea agrega la línea `Disparó:` a la plantilla de encargo del núcleo del `coordinador` (decisión D4=A de Franco) sin subir el tope de 7168 bytes.

## Contexto
- Tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/frases-por-archivo.mjs`
- Requiere: ninguno
- `agentes/coordinador.md` (confirmado): el paso 3 de «Cómo avanzas» dice «Con la **Plantilla de encargo** (incompleta, obliga a reintentar): skill; `Lee:` rutas exactas (y la sección citada); …». Hoy mide 7105 bytes y el tope es 7168 (`topes-bytes.test.mjs`).
- La inserción de 63 bytes (medida con `node`) deja el archivo en 7168 bytes: no queda margen y ninguna otra frase del núcleo puede crecer.
- `pruebas/comprobaciones/frases-por-archivo.mjs`: `FRASES_TELEMETRIA` (task-04 y task-05) y la entrada `'agentes/coordinador'`. De task-05 lee solo las *Notas*.
- Medido en una copia: con la inserción, `contrato-roles`, `topes-bytes` y `agente-instalado` dan `ℹ fail 0`.
- Formato de `Disparó:` (leído por `scripts/formato-encargo.mjs`, task-08): `puerta N` (N de 1 a 4), `BLOQUEO task-NN`, `franco` o `reintento`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «5. Pieza 3 — Telemetría que da pistas»

## Decisiones ya tomadas
- En el paso 3 de «Cómo avanzas», antes de «`Lee:` rutas exactas (y la sección citada); » inserta exactamente «`Disparó:` `puerta N`|`BLOQUEO task-NN`|`franco`|`reintento`; ».
- En `frases-por-archivo.mjs` agrega `coordinador: ['`Disparó:` `puerta N`|`BLOQUEO task-NN`|`franco`|`reintento`']` a `FRASES_TELEMETRIA` y esparcirlo en la entrada `'agentes/coordinador'`.
- Si al medir el archivo supera 7168 bytes (por una diferencia de codificación), recorta redacción repetida fuera del manifiesto; no borres ninguna frase de `FRASES_POR_ARCHIVO['agentes/coordinador']`.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la inserción y la frase del manifiesto.
Fuera de alcance: cualquier otro texto del `coordinador`, `skills/control-consumo`, `skills/comandos-coordinador`, subir el tope, `definitions/WORKFLOW.md`.

## Pasos
1. Mide `wc -c agentes/coordinador.md` antes de editar.
2. Aplica la inserción exacta en `agentes/coordinador.md`.
3. Agrega la clave a `FRASES_TELEMETRIA` y a la entrada del `coordinador`.
4. Mide de nuevo y corre la verificación.

## Criterios de aceptación
1. El núcleo contiene la línea `Disparó:` con las cuatro formas; se comprueba con `contrato-roles.test.mjs`.
2. El archivo mide 7168 bytes o menos; se comprueba con el segundo comando.
3. Los demás contratos y topes no cambian; se comprueba con `topes-bytes.test.mjs` y `agente-instalado.test.mjs`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/agente-instalado.test.mjs 2>&1 | grep -E "^ℹ fail"
node --test pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/coordinador-ejecucion.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E "^ℹ fail"
test $(wc -c < agentes/coordinador.md) -le 7168 && echo "coordinador dentro del tope"
```
Esperado: `ℹ fail 0` (dos veces; medido en una copia con la inserción) y `coordinador dentro del tope`. Las pruebas `lectura-extra`, `higiene-contexto` y `resolver-agentes` tienen 6 fallos previos ajenos; con la inserción no suman ninguno.

## Evidencia

Antes de editar (medición):

```
$ wc -c /Users/franco/Codes/flucastr/Flucastr.AI/agentes/coordinador.md
    7105 /Users/franco/Codes/flucastr/Flucastr.AI/agentes/coordinador.md
exit 0
```

Después de la inserción (Tamaño 7168 / tope 7168):

```
$ wc -c agentes/coordinador.md
    7168 agentes/coordinador.md
exit 0
```

Verificación, comando 1:

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs pruebas/comprobaciones/agente-instalado.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
```

Verificación, comando 2:

```
$ node --test pruebas/comprobaciones/coordinador-status.test.mjs pruebas/comprobaciones/coordinador-ejecucion.test.mjs pruebas/comprobaciones/coordinador-turnos.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 0
exit 0
```

Verificación, comando 3:

```
$ test $(wc -c < agentes/coordinador.md) -le 7168 && echo "coordinador dentro del tope"
coordinador dentro del tope
exit 0
```

Pruebas previas con fallos ajenos (`lectura-extra`, `higiene-contexto`, `resolver-agentes`; 6 fallos, sin suma nueva):

```
$ node --test pruebas/comprobaciones/lectura-extra.test.mjs pruebas/comprobaciones/higiene-contexto.test.mjs pruebas/comprobaciones/resolver-agentes.test.mjs 2>&1 | grep -E "^ℹ fail"
ℹ fail 6
exit 1
```

## Notas
- Pasada única (intentos=1). Tamaño 7168 / tope 7168: exacto al tope, sin margen, como prevé la tarea; no se subió ningún tope.
- Inserción aplicada en el paso 3 de «Cómo avanzas» de `agentes/coordinador.md`: «`Disparó:` `puerta N`|`BLOQUEO task-NN`|`franco`|`reintento`; » antes de «`Lee:` rutas exactas». Ninguna otra frase del núcleo cambió.
- `pruebas/comprobaciones/frases-por-archivo.mjs`: clave `coordinador` agregada a `FRASES_TELEMETRIA` y esparcida con `...FRASES_TELEMETRIA.coordinador` en la entrada `'agentes/coordinador'`.
- Comprobación adicional fuera de *Verificación* (suite rápida, `sh pruebas/rapida.sh`): `ℹ tests 632`, `ℹ pass 624`, `ℹ fail 8`. Los 7 conocidos más uno nuevo por nombre exacto: `definitions/STATUS.md real cumple el formato` (fila «F26» con 11 celdas y un ítem de «Retomar» de 166 caracteres). Ese archivo no lo toca esta tarea; no se corrigió. La base de `tests` era 631 y aquí aparece 632 por una prueba ajena.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
