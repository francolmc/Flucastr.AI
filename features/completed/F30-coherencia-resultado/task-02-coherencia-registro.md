# task-02 — Función única `coherenciaRegistro` en formato-evidencia.mjs
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Las reglas de coherencia de la línea `Registro:` viven hoy dentro de `validarEvidencia`. Se extraen a una función pura exportada `coherenciaRegistro` para que validador y telemetría usen la misma fuente. La regla «`lista` solo con `verificacion=pasa`» ya existe, pero solo se aplica con estado terminado; ahora la función también la aplica sin estado, y los mensajes dicen el valor correcto.

## Contexto
- Tocar: `scripts/formato-evidencia.mjs`, `pruebas/comprobaciones/formato-evidencia.test.mjs`
- Código a extraer (confirmado): `scripts/formato-evidencia.mjs` líneas 145–171, el bloque tras `const [, n, , , intentos, verif, , resultado, causa] = campos;` con `exigidos`, `intentos≥1`, `bloqueada/escalada`, `verificacion_x2` y `parcial`. Ojo: la desestructuración de la línea 145 usa el orden de los grupos de `RE_REGISTRO` (n, herramienta, modo, intentos, verificacion, huecos, resultado, causa).
- Pruebas de Registro existentes (`pruebas/comprobaciones/formato-evidencia.test.mjs`, líneas 167–200) buscan subcadenas: `verificacion=pasa`, `intentos=2`, `causa=parcial`. Los mensajes actuales se conservan y solo se les puede agregar texto.
- No se toca `RE_REGISTRO` (8 claves, mismo orden).
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «Pieza 2 — Coherencia de `resultado`»

## Decisiones ya tomadas
- Firma: `export function coherenciaRegistro({ estado, verificacion, resultado, causa, intentos })` devuelve un arreglo de motivos en español; vacío = coherente. Cada regla se omite si sus claves vienen `undefined` (así `registrar.mjs` puede llamarla sin `estado` ni `intentos`).
- Reglas, en este orden: (1) con `estado` terminado (`lista para revisión`, `hecha`) se exigen `resultado=lista`, `causa=ninguna`, `verificacion=pasa` e `intentos≥1` (igual que hoy); (2) con `estado=bloqueada`, `resultado` es `bloqueada` o `escalada`; (3) `causa=verificacion_x2` exige `resultado=bloqueada` e `intentos=2`; (4) `causa=parcial` exige `resultado=bloqueada`; (5) nueva y sin `estado`: `resultado=lista` exige `verificacion=pasa` y `causa=ninguna`.
- Mensaje añadido: si `verificacion=parcial` y el resultado no es `bloqueada`, se agrega «con verificacion=parcial usa resultado=bloqueada; causa=parcial». Si `verificacion=falla` y el resultado es `lista`, «con verificacion=falla usa resultado=bloqueada». No se repite un motivo ya emitido por la regla 1.
- `validarEvidencia` llama a la función con el `estado` y los valores del `Registro:` y empuja sus motivos; el resto (n, última línea, 8 campos) queda igual.
- La regla 3 no se aplica a `verificacion=parcial` con `intentos=1`: no se cambia lo que hoy valida.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: extraer la función, añadir la regla 5 y los mensajes, y probarla.
Fuera de alcance: `registrar.mjs`, `skills/ejecutar-tarea`, `RE_REGISTRO`, otros validadores, `WORKFLOW.md`.

## Pasos
1. En `scripts/formato-evidencia.mjs` añade y exporta `coherenciaRegistro` con las reglas y mensajes de *Decisiones ya tomadas*.
2. Sustituye el bloque de las líneas 145–171 por una llamada a ella; deja intactos los controles de `n` y de formato de línea.
3. En `pruebas/comprobaciones/formato-evidencia.test.mjs` importa la función y agrega pruebas directas: coherente (`pasa`+`lista`+`ninguna`); `parcial`+`lista` con y sin `estado` cita `resultado=bloqueada; causa=parcial`; `falla`+`lista` sin `estado` da motivo; `parcial`+`bloqueada`+`parcial` sin motivos; claves `undefined` omiten reglas; `x2` con `intentos=1` cita `intentos=2`.
4. Agrega una prueba de `validarEvidencia` con estado `lista para revisión` y `Registro` `verificacion=parcial; resultado=lista; causa=ninguna`: el motivo cita `resultado=bloqueada; causa=parcial`.
5. Corre las pruebas de formato y la de regresión.

## Criterios de aceptación
1. `coherenciaRegistro` está exportada y no importa `fs`; se comprueba con `grep`.
2. Las 18 pruebas previas de `formato-evidencia.test.mjs` siguen pasando sin cambios.
3. `parcial` con `lista` da un motivo que contiene «resultado=bloqueada; causa=parcial» en las dos vías, con y sin `estado`.
4. La regresión de task-01 pasa sin tocar su JSON.

## Verificación
```
node --test pruebas/comprobaciones/formato-evidencia.test.mjs
node --test pruebas/comprobaciones/regresion-validadores.test.mjs
grep -c "export function coherenciaRegistro" scripts/formato-evidencia.mjs
```
Esperado: `ℹ fail 0` en las dos primeras; la tercera imprime `1`.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-evidencia.test.mjs
ℹ tests 26
ℹ suites 0
ℹ pass 26
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 82.826333
exit 0
$ node --test pruebas/comprobaciones/regresion-validadores.test.mjs
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 103.41175
exit 0
$ grep -c "export function coherenciaRegistro" scripts/formato-evidencia.mjs
1
exit 0
```

Las 18 pruebas previas siguen pasando sin cambios; se agregaron 8 pruebas de `coherenciaRegistro` y 1 de `validarEvidencia`. La regresión de task-01 pasa sin tocar su JSON.

## Notas
- Huecos menores resueltos: (1) los mensajes de la regla 3 muestran «(sin dato)» cuando una clave llega como undefined (solo en llamadas directas; `validarEvidencia` siempre pasa las claves); (2) los motivos se deduplican con un Set, así que un mismo texto no aparece dos veces.
- Decisión: la regla 5 se aplica solo sin `estado`, como pide la tarea; con un estado terminado la regla 1 ya cubre `verificacion`, `causa` y `resultado`, y así no se duplican motivos.
- Verificación: la primera pasada dio `ℹ fail 0` en ambas suites; la segunda se corrió con `set -o pipefail` para registrar códigos reales (`PIPESTATUS` no existe en zsh).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna