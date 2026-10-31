# task-02 — `resolver.mjs`: `fijar-compactacion pi` y `quitar-compactacion pi`
repo: Flucastr.AI   depende_de: task-01   estado: aprobada

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
(lo llena el constructor)

## Notas
(lo llena el constructor)
