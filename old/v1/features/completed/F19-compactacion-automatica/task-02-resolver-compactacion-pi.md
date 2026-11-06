# task-02 — `resolver.mjs`: `fijar-compactacion pi` y `quitar-compactacion pi`
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Añadir a `scripts/resolver.mjs` las órdenes que escriben y quitan, en el `settings.json` global de Pi, `compaction.modelOverrides["<provider>/<modelo>"].reserveTokens = ventana − compactar_en`. Fusionan sin pisar nada del usuario, toman el bloqueo `<settings.json>.lock` como Pi y escriben de forma atómica. `instalar.sh` y `desinstalar.sh` (tareas 06 y 08) solo llaman a estas órdenes. La puerta 4 de esta tarea exige revisar `git diff scripts/`.

## Contexto
- Leído `scripts/resolver.mjs` (206 líneas): `fallar()` imprime `error: …` y sale con 1; `leerConfig()` lee `modelos.json` (o `$FLUCASTR_MODELOS`); `leerAjustes(ruta)` devuelve `{}` si no existe y falla si el JSON es inválido; el despacho final es una cadena `if/else if` sobre `orden` y `args.length`; `fijar-agente` / `quitar-agente` (líneas 160–186) son el modelo del estilo (salida de una palabra).
- Esquema de Pi (informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, puntos 1 y 3): `{"compaction":{"enabled":bool,"reserveTokens":n,"keepRecentTokens":n,"modelOverrides":{"openai/gpt-6.1-sol":{"reserveTokens":172000}}}}`; números enteros no negativos; claves desconocidas se conservan; Pi toma el bloqueo con `mkdir <settings.json>.lock` (10 reintentos de 20 ms), relee bajo el bloqueo y escribe el archivo con 2 espacios de sangría. Un valor inválido en el override del modelo activo hace fallar a Pi: nunca se escribe algo que no sea entero.
- Defecto de Pi: `reserveTokens` 16384; un umbral que dé menos de eso es peor que el defecto (`ARCHITECTURE.md`, «Modelo sin ventana, o umbral inaplicable»).
- Pruebas existentes del resolver: `pruebas/comprobaciones/resolver-agentes.test.mjs` (usa `FLUCASTR_MODELOS` y `spawnSync('node', [RESOLVER, …])`). Se verifica con `node --test pruebas/comprobaciones/resolver-agentes.test.mjs` y `bash pruebas/rapida.sh`. Las pruebas nuevas de estas órdenes son la task-03.
- Esta tarea no puede correr las órdenes nuevas contra el `settings.json` real de Franco: usar siempre una carpeta temporal.

## Decisiones ya tomadas
- Sintaxis: `node scripts/resolver.mjs fijar-compactacion pi <settings.json> [--simular]` y `node scripts/resolver.mjs quitar-compactacion pi <settings.json> <modelo> <reserve> [creado]`.
- Modelos candidatos: todos los valores de `modelos` de cada perfil de `perfiles` con `herramienta: "pi"`, sin repetidos, en el orden del archivo. Por cada uno: `ventana = perfil.ventanas?.[modelo]`; `compactar = perfil.compactar_en ?? config.compactar_en`; `reserve = ventana − compactar`.
- Salida de `fijar-compactacion pi`: una línea por modelo, con exactamente una de estas formas (la leen `instalar.sh` y las pruebas):
  - `fijado:<modelo>=<reserve>` (con sufijo `:creado` si el archivo no existía y se creó);
  - `omitido-usuario:<modelo>` (ese modelo ya tiene `modelOverrides` en el archivo) o `omitido-usuario:*` (una sola línea: `compaction` no es un objeto, o define `enabled` o `reserveTokens` en su nivel superior; no se escribe nada);
  - `omitido-ventana:<modelo>` (falta `ventanas[modelo]` o no es entero positivo);
  - `omitido-umbral:<modelo>` (`compactar_en` falta o no es entero positivo, o `reserve` < 16384).
  Con `--simular` imprime las mismas líneas (con el mismo sufijo `:creado` si se crearía) y no escribe nada, ni crea carpetas ni bloqueo.
- Escritura (solo si hay al menos un `fijado`): crear la carpeta del archivo si falta (`mkdirSync` recursivo); tomar el bloqueo con `mkdirSync("<ruta>.lock")`, hasta 10 intentos con espera de 20 ms (`Atomics.wait`); si el bloqueo existe con más de 10 s de antigüedad (mtime), se considera huérfano (inferido: el caducado por antigüedad de `proper-lockfile`, 10 s por defecto) y se borra una vez antes de reintentar; si no se logra, `fallar("no pude tomar el bloqueo <ruta>.lock; no toco el archivo")` (exit 1). **Bajo el bloqueo** se relee el archivo, se recalculan las reglas de «omitido-usuario» sobre el contenido fresco, se fusiona y se escribe a `<ruta>.flucastr-<pid>.tmp` en la misma carpeta y se `renameSync` sobre `<ruta>`. El bloqueo se libera siempre (`finally` con `rmdirSync`).
- Formato escrito: `JSON.stringify(objeto, null, 2) + "\n"` (como Pi). Solo se añade `compaction.modelOverrides[modelo] = { reserveTokens: <reserve> }`; ninguna otra clave se toca, se reordena ni se elimina. JSON inválido o raíz que no sea objeto: `fallar` con «no es JSON válido; no lo toco» (reutiliza `leerAjustes`), sin escribir.
- `quitar-compactacion pi`: si el archivo no existe, imprime `omitido`. Si `compaction.modelOverrides[modelo]` es exactamente `{ reserveTokens: <reserve> }` (misma cifra, ninguna otra clave) lo borra; si no, `omitido` (el usuario lo cambió: se respeta). Tras borrar, poda `modelOverrides` y `compaction` solo si quedaron vacíos. Si el objeto resultante es `{}` **y** se pasó `creado`, borra el archivo (`rmSync`) e imprime `archivo-quitado`; en otro caso reescribe (misma técnica atómica y bloqueo) e imprime `quitado`. Un archivo `{}` que ya existía antes nunca se borra (no llega `creado`).
- La función auxiliar de bloqueo y escritura atómica es una sola (`conBloqueo(ruta, fn)`), usada por las dos órdenes.
- Se actualiza el comentario de uso de la cabecera y el mensaje final de `fallar("uso: …")` con las dos órdenes nuevas.
- No se modifica `resolverModelo`, `leerAjustes` ni las órdenes existentes.

## Alcance / Fuera de alcance
Alcance: `scripts/resolver.mjs` (órdenes `fijar-compactacion pi` y `quitar-compactacion pi`, helper de bloqueo, cabecera de uso).
Fuera de alcance: la variante `claude` y `comparar-modelos` (task-04), `instalar.sh`, `desinstalar.sh`, `modelos.json`, cualquier prueba nueva (task-03), el `settings.json` real de Pi.

## Pasos
1. Leer `scripts/resolver.mjs` y `modelos.json` (con `ventanas` de la task-01). Resultado: lista de modelos candidatos anotada en *Notas*.
2. Escribir `conBloqueo(ruta, fn)` y `escribirAtomico(ruta, objeto)`. Resultado: `node --check scripts/resolver.mjs` sin errores.
3. Escribir `fijar-compactacion pi` con las reglas de salida de *Decisiones*. Resultado: contra una carpeta temporal vacía imprime tres líneas `fijado:…:creado` con `172000`.
4. Escribir `--simular`. Resultado: la misma salida y la carpeta temporal queda vacía.
5. Escribir `quitar-compactacion pi`. Resultado: deshace lo del paso 3 y deja la carpeta sin `settings.json`.
6. Actualizar cabecera y mensaje de uso. Resultado: `node scripts/resolver.mjs` sin argumentos imprime el uso con las dos órdenes.
7. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. En una carpeta temporal vacía, `fijar-compactacion pi` imprime `fijado:openai/gpt-6-astra=172000:creado`, `fijado:openai/gpt-6.1-sol=172000:creado` y `fijado:openai/gpt-6-luna=172000:creado` y el archivo queda con exactamente esas tres claves bajo `compaction.modelOverrides`.
2. Sobre un `settings.json` con `deviceId`, `packages` y una clave ajena, las conserva y solo añade `compaction`.
3. Con `compaction.modelOverrides["openai/gpt-6.1-sol"]` ya definido imprime `omitido-usuario:openai/gpt-6.1-sol` y no cambia ese valor.
4. `quitar-compactacion pi` deshace lo escrito y, con `creado`, borra el archivo; con otro valor distinto del puesto imprime `omitido`.
5. `node --test pruebas/comprobaciones/resolver-agentes.test.mjs` y `bash pruebas/rapida.sh` terminan sin fallas.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
T=$(mktemp -d)
node scripts/resolver.mjs fijar-compactacion pi "$T/settings.json" --simular; ls -A "$T"
node scripts/resolver.mjs fijar-compactacion pi "$T/settings.json"; cat "$T/settings.json"; ls -A "$T"
node scripts/resolver.mjs fijar-compactacion pi "$T/settings.json"
printf '{"deviceId":"x","packages":["a"],"zzz":1}\n' > "$T/otro.json"
node scripts/resolver.mjs fijar-compactacion pi "$T/otro.json"; cat "$T/otro.json"
node scripts/resolver.mjs quitar-compactacion pi "$T/otro.json" openai/gpt-6.1-sol 172000; node scripts/resolver.mjs quitar-compactacion pi "$T/otro.json" openai/gpt-6.1-sol 1
node scripts/resolver.mjs quitar-compactacion pi "$T/settings.json" openai/gpt-6-astra 172000 creado
node --test pruebas/comprobaciones/resolver-agentes.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
git diff scripts/
```
Esperado: la simulación imprime tres `fijado:…:creado` y `ls -A` vacío; la escritura real imprime las tres líneas, muestra el JSON de tres overrides y lista solo `settings.json`; la repetición imprime tres `omitido-usuario:…`; `otro.json` conserva `deviceId`, `packages`, `zzz` y suma `compaction`; el primer `quitar` imprime `quitado`, el segundo `omitido`; el último imprime `quitado` (aún quedan dos modelos); `pass` > 0 y `fail 0`; `rapida` con exit 0; `git diff scripts/` muestra solo cambios en `scripts/resolver.mjs`. No ejecutado por el planificador: las órdenes nuevas aún no existen.

## Evidencia
Rama: `git branch --show-current` → `feature/F19-compactacion-automatica` (ya era la actual; sin `git switch`). Sin commit, push, PR, merge ni despliegue. Todas las pruebas con `mktemp -d`; no se tocó `~/.pi/agent/settings.json` ni `~/.claude`.

Sintaxis: `node --check scripts/resolver.mjs` → `CHECK_OK`. Uso sin argumentos:
```
$ node scripts/resolver.mjs
error: uso: resolver.mjs modelo <agente> <herramienta> | … | fijar-compactacion pi <settings.json> [--simular] | quitar-compactacion pi <settings.json> <modelo> <reserve> [creado]
exit=1
```

Verificación (salida real, primera pasada completa, `T=/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.iNhJkQ762p`):
```
== 1 simular (vacía)
fijado:openai/gpt-6-astra=172000:creado
fijado:openai/gpt-6.1-sol=172000:creado
fijado:openai/gpt-6-luna=172000:creado
exit=0
ls:            (vacío)

== 2 escritura real
fijado:openai/gpt-6-astra=172000:creado
fijado:openai/gpt-6.1-sol=172000:creado
fijado:openai/gpt-6-luna=172000:creado
exit=0
-- cat:
{
  "compaction": {
    "modelOverrides": {
      "openai/gpt-6-astra": {
        "reserveTokens": 172000
      },
      "openai/gpt-6.1-sol": {
        "reserveTokens": 172000
      },
      "openai/gpt-6-luna": {
        "reserveTokens": 172000
      }
    }
  }
}
-- ls: settings.json

== 3 repetición
omitido-usuario:openai/gpt-6-astra
omitido-usuario:openai/gpt-6.1-sol
omitido-usuario:openai/gpt-6-luna
exit=0

== 4 otro.json con claves ajenas (deviceId, packages, zzz)
fijado:openai/gpt-6-astra=172000
fijado:openai/gpt-6.1-sol=172000
fijado:openai/gpt-6-luna=172000
exit=0
-- cat:
{
  "deviceId": "x",
  "packages": [
    "a"
  ],
  "zzz": 1,
  "compaction": {
    "modelOverrides": {
      "openai/gpt-6-astra": {
        "reserveTokens": 172000
      },
      "openai/gpt-6.1-sol": {
        "reserveTokens": 172000
      },
      "openai/gpt-6-luna": {
        "reserveTokens": 172000
      }
    }
  }
}

== 5 quitar otro (valor 172000)
quitado
exit=0
== 6 quitar otro (valor 1, distinto)
omitido
exit=0
== 7 quitar settings creado (quedan dos modelos)
quitado
exit=0
== 8 estado tras quitar
ls: otro.json  settings.json
-- otro.json (cat, real):
{
  "deviceId": "x",
  "packages": [
    "a"
  ],
  "zzz": 1,
  "compaction": {
    "modelOverrides": {
      "openai/gpt-6-astra": {
        "reserveTokens": 172000
      },
      "openai/gpt-6-luna": {
        "reserveTokens": 172000
      }
    }
  }
}
lock residual: 0

== 9 pruebas resolver
ℹ pass 10
ℹ fail 0
== 10 rapida (HOME real, sin HOME falso)
rapida exit=0
ℹ duration_ms 12208.446375
rapida: 23 archivos en 13 s (tope 30 s)
== 11 git diff scripts/ --stat
 scripts/resolver.mjs | 232 ++++++++++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 230 insertions(+), 2 deletions(-)
```

Ramas no cubiertas por la *Verificación* (comprobación extra, carpetas temporales):
```
== A archivo-quitado (creado, único override restante)
quitado
quitado
archivo-quitado          → el archivo se borró; ls sin a.json
== B settings con compaction.enabled en la raíz
omitido-usuario:*        → el archivo no cambia: {"compaction":{"enabled":true}}; sin lock residual
== C JSON inválido
error: …/c.json no es JSON válido (…); no lo toco
exit=1                   → el archivo queda {roto
== D modelos falsos (FLUCASTR_MODELOS): reserve 12000, 100000-260000<0, ventana 0, y --simular
omitido-umbral:openai/x-a
omitido-umbral:openai/x-b
omitido-ventana:openai/x-c
omitido-umbral:openai/x-d
exit=0                   → d.json no se creó
== E bloqueo huérfano (mtime de 2020) 
fijado ×3, exit=0; el .lock se borró y no queda residuo
== F bloqueo vivo reciente
error: no pude tomar el bloqueo …/f.json.lock; no toco el archivo
exit=1 (≈0,3 s); f.json queda {}
```

Criterios de aceptación:
1. Cumple: `fijado:…=172000:creado` ×3 en carpeta vacía; el archivo tiene exactamente las tres claves bajo `compaction.modelOverrides` (verificación paso 2).
2. Cumple: `deviceId`, `packages` y `zzz` se conservan; solo se añade `compaction` (verificación paso 4).
3. Cumple: con los overrides ya definidos, `omitido-usuario:<modelo>` ×3 y ninguna escritura (verificación paso 3). El valor no cambia porque no hubo escritura.
4. Cumple: `quitado` con el valor puesto; `omitido` con otro valor (`1`); con `creado` y archivo que queda vacío, `archivo-quitado` (caso A).
5. Cumple: `node --test …resolver-agentes.test.mjs` → pass 10, fail 0; `rapida.sh` exit 0 (con HOME real).

Notas sobre la verificación de `git diff scripts/`: solo `scripts/resolver.mjs` (232 líneas tocadas). La revisión del diff queda para la puerta 4 (Franco).

## Notas
- Candidatos (paso 1): `openai/gpt-6-astra`, `openai/gpt-6.1-sol`, `openai/gpt-6-luna` (único perfil `pi`, `pi-openai`, en el orden de `modelos`). Ventanas 272000, `compactar_en` 100000 → 172000 cada uno.
- Huecos menores resueltos (4):
  1. Error de `mkdir` del bloqueo distinto de `EEXIST` (p. ej. carpeta inexistente o permisos): falla de inmediato con `no pude tomar el bloqueo …; no toco el archivo`, sin esperar los 10 intentos. Decisión: no tiene sentido reintentar.
  2. `compaction.modelOverrides` presente pero no objeto: se trata como «define algo en el nivel superior» y se imprime `omitido-usuario:*`, sin escribir. La tarea no lo cubría; es la opción más conservadora.
  3. `--simular` también falla si el archivo es JSON inválido o su raíz no es objeto (mismo mensaje que la escritura), en vez de simular sobre un archivo que no se puede escribir.
  4. Bajo el bloqueo se relee el archivo y las líneas de salida salen de esa lectura (no de la previa), para que reflejen lo que realmente se escribió. El control previo sin bloqueo solo decide si hace falta tomarlo.
- Un JSON inválido releído bajo el bloqueo no hace `process.exit` dentro del bloqueo (se marca y se falla después de soltarlo), para no dejar el `.lock` residual.
- El tmp `<ruta>.flucastr-<pid>.tmp` no se borra si `writeFileSync`/`renameSync` fallan (caso raro de disco); se deja anotado como limitación.
- `definitions/STATUS.md` no se tocó. El resto del árbol (`definitions/STATUS.md`, `modelos.json`, task-01) ya venía sin commit y no se modificó.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
