# task-04 — Script que mide el crecimiento de definitions/ por pasada
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Un tope absoluto sobre `definitions/` fallaría de inmediato (`ARCHITECTURE.md` ~69 KB, `PROJECT.md` ~26 KB). Esta tarea añade un script que mide el CRECIMIENTO de `definitions/*.md` respecto de `HEAD` y falla si supera el tope por pasada de 12288 bytes. No se ejecuta en la prueba rápida contra el repo real: solo con fixtures.

## Contexto
- Tocar: `scripts/crecimiento-definiciones.mjs`, `pruebas/comprobaciones/crecimiento-definiciones.test.mjs`
- Convención de `scripts/`: módulos `.mjs` ESM con comentario de cabecera en español, funciones puras exportadas y CLI al final (modelo: `scripts/formato-tarea.mjs`, `scripts/validar-tarea.mjs`).
- Convención de pruebas: `node:test` + `node:assert/strict`, archivo `*.test.mjs` en `pruebas/comprobaciones/`; `pruebas/rapida.sh` los recoge solos por el patrón `pruebas/comprobaciones/*.test.mjs`.
- No tocar `definitions/` ni `agentes/coordinador.md`.

## Decisiones ya tomadas
- Export `TOPE_PASADA = 12288` y `crecimiento(antes, despues)`: ambos son objetos `{ nombre: bytes }`; devuelve la suma de los aumentos (un archivo nuevo cuenta entero; uno que encoge cuenta 0).
- CLI: `node scripts/crecimiento-definiciones.mjs [--raiz <dir>] [--tope <n>]`. Mide los `definitions/*.md` del disco contra `git show HEAD:definitions/<archivo>` (0 si no existe en `HEAD`). Imprime `Crecimiento: <n> bytes (tope <t>)`; sale 0 si `n <= t`; si no, imprime `FALLA: la pasada creció <n> bytes; el tope es <t>` en stderr y sale 1. Argumento desconocido: `Uso: ...` y sale 2.
- Las pruebas de CLI crean un repo temporal con `fs.mkdtempSync` en `os.tmpdir()`, `git init`, y commit con `git -c user.name=t -c user.email=t@t`; lo borran al final.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: el script y su prueba con control negativo.
Fuera de alcance: invocarlo desde `agentes/` o `rapida.sh`, topes absolutos, tocar `definitions/` y `coordinador.md`.

## Pasos
1. Crea `scripts/crecimiento-definiciones.mjs` con `TOPE_PASADA`, `crecimiento` y la CLI descrita.
2. Crea la prueba con casos puros: archivo nuevo cuenta entero; archivo que encoge cuenta 0; suma de varios; exactamente 12288 pasa.
3. Añade casos de CLI en repo temporal: crecimiento de 100 bytes sale 0 con `Crecimiento: 100 bytes`; control negativo con +12289 bytes sale 1 y stderr contiene `FALLA`; `--tope 10` con +100 bytes sale 1; argumento desconocido sale 2.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/crecimiento-definiciones.test.mjs` deja `ℹ fail 0`.
2. El control negativo (+12289 bytes) sale 1.
3. El script no escribe ningún archivo del repo real ni de `definitions/`.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7` (7 fallos ajenos conocidos); no suma fallos nuevos.

## Verificación
```
node --test pruebas/comprobaciones/crecimiento-definiciones.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
node scripts/crecimiento-definiciones.mjs --bogus; echo "exit $?"
git status --short definitions/; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0`; luego `Uso:` y `exit 2`; el tercer comando no añade líneas a `definitions/` más allá de ` M definitions/STATUS.md` que ya existía; y `ℹ fail 7`.

## Evidencia

```
$ node --test pruebas/comprobaciones/crecimiento-definiciones.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
ℹ pass 9
ℹ fail 0
exit 0
exit 0
```

```
$ node scripts/crecimiento-definiciones.mjs --bogus; echo "exit $?"
Uso: node scripts/crecimiento-definiciones.mjs [--raiz <dir>] [--tope <n>]
exit 2
exit 2
```

```
$ git status --short definitions/; echo "exit $?"
 M definitions/BACKLOG.md
 M definitions/STATUS.md
exit 0
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
exit 0
```

## Notas
- Huecos menores: sin repo git o sin `definitions/` el tamaño de HEAD o del disco cuenta 0; `--raiz`/`--tope` sin valor o `--tope` no entero sale 2 con `Uso:`.
- La salida de `git status --short definitions/` incluye también ` M definitions/BACKLOG.md`, cambio sin commit previo, además de ` M definitions/STATUS.md`; no se editó.
- Autocomprobación `--evidencia`: `OK: 1 tarea(s) con evidencia completa`.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
