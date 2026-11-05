# task-03 — Prueba de la regla de Leer en la skill y en el mensaje del validador
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Fija con pruebas deterministas lo que hacen task-01 y task-02: la skill dice que en `Leer` solo van archivos que existen, y el validador, ante un archivo de `Leer` inexistente, sugiere ponerlo en `Tocar`. Incluye un control negativo y cierra la feature con la suite rápida.

## Contexto
- Leer: `pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs@1-20`, `pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs@68-81`
- Tocar: `pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs`
- El archivo ya importa `fs`, `medirTopes` y define `SKILL`, `tareaConContexto(linea)` y `leerOk`. `medirTopes(texto, leer)` devuelve `{ errores, avisos }`; con `leer` que devuelve `null` produce el error «El archivo de Leer no se puede leer: …».
- Las pruebas nuevas se añaden al final del archivo; no se tocan las existentes.
- `bash pruebas/rapida.sh` tardó unos 55 s en el ensayo (tope 90 s).
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Pruebas nuevas, al final del archivo, con estos nombres y comportamiento:
  - `(5) la skill dice que en Leer solo van archivos que existen`: lee `SKILL` y comprueba que contiene «solo archivos que existen» y «va en Tocar».
  - `(5) control negativo: sin esas frases, el texto no las contiene`: quita ambas frases con `replaceAll` y comprueba que ya no están.
  - `(6) un archivo de Leer inexistente se rechaza con la pista de Tocar`: `medirTopes(tareaConContexto('- Leer: `a.js`'), () => null)` y comprueba que algún error incluye «ponlo en Tocar».
  - `(6) un archivo de Leer existente no produce esa pista`: igual con `leerOk` y comprueba que ningún error incluye «ponlo en Tocar».
- No se crean fixtures ni archivos de prueba nuevos.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: cuatro pruebas nuevas en un archivo existente y la corrida de la suite rápida.
Fuera de alcance: cambiar la skill o el validador, la corrida real (task-04), el commit.

## Pasos
1. Corre `git branch --show-current` y confirma la rama de *Verificación*.
2. En `pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs`, añade al final las cuatro pruebas de *Decisiones ya tomadas*.
3. Corre `node --test pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs` y confirma `fail 0`.
4. Corre `bash pruebas/rapida.sh` y confirma salida 0.

## Criterios de aceptación
1. Rama `fix/F45-leer-solo-archivos-existentes` (comando 1).
2. El archivo de prueba pasa con cuatro pruebas más que antes (comando 2: `pass 12`, `fail 0`).
3. `bash pruebas/rapida.sh` termina en 0 (comando 3).
4. Todas las tareas del repo siguen válidas (comando 4).

## Verificación
```
git branch --show-current
node --test pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs 2>&1 | grep -a "pass \|fail "
bash pruebas/rapida.sh > /dev/null 2>&1; echo "salida $?"
node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
```
Esperado: rama `fix/F45-leer-solo-archivos-existentes`; `ℹ pass 12` y `ℹ fail 0`; `salida 0`; `salida 0`.

## Evidencia

```
$ git branch --show-current
fix/F45-leer-solo-archivos-existentes
exit 0

$ node --test pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs 2>&1 | grep -a "pass \|fail "
ℹ pass 12
ℹ fail 0
exit 0

$ bash pruebas/rapida.sh > /dev/null 2>&1; echo "salida $?"
salida 0
exit 0

$ node scripts/validar-tarea.mjs features/F*/task-*.md; echo "salida $?"
OK: 4 tarea(s) válida(s)
salida 0
exit 0
```

## Notas
- Rama: ya era la actual (`fix/F45-leer-solo-archivos-existentes`); no hizo falta `git switch`.
- Entorno: `node ~/.flucastr-ai/entorno.mjs` salió `ok`.
- Las cuatro pruebas nuevas se añadieron al final de `pruebas/comprobaciones/mensajes-formato-didacticos.test.mjs`; las existentes no se tocaron. No hubo huecos.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
