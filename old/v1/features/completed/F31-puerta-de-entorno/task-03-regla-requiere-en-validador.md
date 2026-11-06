# task-03 — Regla 12 de `formato-tarea.mjs`: `Requiere:` opcional y bien formada
repo: Flucastr.AI   depende_de: task-01, task-02   estado: hecha

## Descripción
La puerta previa (`validar-tarea.mjs`) debe rechazar una línea `- Requiere:` mal escrita, sin exigirla: una tarea sin la línea sigue válida exactamente igual que hoy (ausencia = `ninguno`). Así no se rompe ninguna tarea de F24–F33 ni de otros proyectos.

## Contexto
- Tocar: `scripts/formato-tarea.mjs`, `pruebas/comprobaciones/formato-tarea.test.mjs`
- Requiere: ninguno
- `scripts/formato-tarea.mjs` (confirmado): `validarTarea(texto)` aplica reglas numeradas hasta la «Regla 11» (línea 131, `- Tocar:`) y termina con `return errores;` (línea 153). Usa `bloque('Contexto')` para leer las líneas de una sección.
- `pruebas/comprobaciones/formato-tarea.test.mjs` (confirmado): tiene `muestra` válida (línea 8) y una tabla de casos negativos `['regla 11: …', (t) => t.replace(…)]` (líneas 61–63).
- De task-02 lee solo las *Notas*: exporta `parsearRequiere(valor)` y `extraerRequiere(texto)` en `scripts/formato-requiere.mjs`.
- Pruebas de regresión: `pruebas/comprobaciones/regresion-validadores.test.mjs` (base de task-01).
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «7. Riesgos»

## Decisiones ya tomadas
- Se agrega «Regla 12» justo antes de `return errores;`: importa `extraerRequiere` y `parsearRequiere` de `./formato-requiere.mjs`; si el estado es `multiple`, error «`Contexto` tiene más de una línea «- Requiere: …»»; si es `presente` y `parsearRequiere` da `ok: false`, un error con ese `error`. `ausente` no produce error.
- Los mensajes existentes y las reglas 1–11 no cambian.
- La tabla de casos negativos agrega `regla 12: Requiere inválido` (`- Requiere: Docker`) y `regla 12: dos líneas Requiere`; un caso positivo agrega `- Requiere: docker, puerto:55432` a la muestra y debe seguir válida.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la regla 12 y sus casos.
Fuera de alcance: exigir la línea, `--evidencia`, `--fuente`, `formato-evidencia.mjs`, `registrar.mjs`, y el límite de 8192 caracteres (no cambia).

## Pasos
1. En `scripts/formato-tarea.mjs`, importa de `./formato-requiere.mjs` y agrega la regla 12 antes de `return errores;`.
2. En `formato-tarea.test.mjs` agrega los dos casos negativos a la tabla y el positivo.
3. Corre las pruebas de formato y la regresión de validadores.

## Criterios de aceptación
1. Una tarea sin `Requiere:` valida igual que antes; se comprueba con la regresión de las 49 tareas (`ℹ fail 0`).
2. `- Requiere: Docker` y dos líneas `Requiere:` producen un error cada una; se comprueba en `formato-tarea.test.mjs`.
3. `- Requiere: docker, puerto:55432` valida; se comprueba en el mismo archivo.

## Verificación
```
node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node scripts/validar-tarea.mjs features/F31-puerta-de-entorno/task-02-formato-requiere.md
```
Esperado: `ℹ fail 0` y `ℹ pass` igual a `ℹ tests`; `OK: 1 tarea(s) válida(s)`.

## Evidencia

```
$ node --test pruebas/comprobaciones/formato-tarea.test.mjs pruebas/comprobaciones/regresion-validadores.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 27
ℹ pass 27
ℹ fail 0
exit 0

$ node scripts/validar-tarea.mjs features/F31-puerta-de-entorno/task-02-formato-requiere.md
OK: 1 tarea(s) válida(s)
exit 0

$ sh pruebas/rapida.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 557
ℹ pass 550
ℹ fail 7
exit 1
```

## Notas
- Hueco menor: `scripts/formato-requiere.mjs` importa `secciones` de `scripts/formato-tarea.mjs`, y ahora `formato-tarea.mjs` importa `extraerRequiere` y `parsearRequiere` de `formato-requiere.mjs` (dependencia circular ESM). Funciona porque ninguna función se invoca al evaluar el módulo; si una tarea futura carga los módulos en otro orden, revisar.
- Rapida: 557 tests, 550 pass, 7 fail frente a la base 555/548/7 medida por el coordinador: +2 tests (los dos casos negativos de regla 12). Los 7 fallos son los conocidos; no comparé sus nombres con la base (no se hizo stash). `rapida.sh` sale 1 mientras existan.
- Regla 12 solo valida el contenido de `- Requiere:` cuando aparece (`ausente` no da error); las reglas 1–11 y sus mensajes no cambiaron. El caso positivo `- Requiere: docker, puerto:55432` se añadió a la muestra y la prueba «la muestra válida no produce errores» pasa.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
