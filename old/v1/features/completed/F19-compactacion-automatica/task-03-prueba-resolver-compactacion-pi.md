# task-03 — Prueba del resolver: compactación de Pi, con controles negativos
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Fijar con una prueba determinista (sin modelo ni red) lo que hacen `fijar-compactacion pi` y `quitar-compactacion pi`: valores calculados desde `modelos.json`, fusión sin pisar al usuario, bloqueo `settings.json.lock`, escritura atómica y simetría de instalar/quitar. Incluye controles negativos que demuestran que las comprobaciones sí detectan un daño. Queda dentro de `rapida.sh` sin tocarla (toma todos los `pruebas/comprobaciones/*.test.mjs`).

## Contexto
- Orden de `scripts/resolver.mjs` implementada en task-02; sintaxis, líneas de salida (`fijado:`, `omitido-usuario:`, `omitido-ventana:`, `omitido-umbral:`, `:creado`, `quitado`, `archivo-quitado`, `omitido`) y reglas en esa tarea.
- Estilo a imitar: `pruebas/comprobaciones/resolver-agentes.test.mjs` (`node:test`, `spawnSync('node', [RESOLVER, …])`, `mkdtempSync` en `tmpdir()`, limpieza con `after`). El resolver lee `FLUCASTR_MODELOS` si existe: así la prueba usa su propio `modelos.json` temporal.
- `pruebas/rapida.sh` ejecuta `pruebas/comprobaciones/*.test.mjs` en paralelo y tiene tope de 30 s (hoy ~12–14 s con 233 pruebas): esta prueba debe durar menos de ~3 s (la espera del bloqueo es de 200 ms como máximo).
- La prueba no toca `~/.pi`, `~/.claude` ni `~/.flucastr-ai`: todo en carpetas temporales.

## Decisiones ya tomadas
- Archivo nuevo `pruebas/comprobaciones/resolver-compactacion-pi.test.mjs`.
- `modelos.json` temporal: copia del real con `compactar_en` y `ventanas` como en el real para los casos normales; para los casos de omisión se escribe una variante (ventana ausente en un modelo; `compactar_en` = 270000 para forzar `reserve` < 16384).
- Casos (cada uno es un `test`):
  1. Carpeta vacía: salida con tres `fijado:…=172000:creado`; JSON exacto `{ compaction: { modelOverrides: {tres modelos → {reserveTokens:172000}} } }`; el resultado termina en `\n`.
  2. Fusión: archivo con `deviceId`, `packages`, `claveNueva` y `compaction.keepRecentTokens`; tras fijar, todas esas claves siguen iguales (`deepEqual` sobre el objeto menos los overrides añadidos).
  3. Respeto al usuario: (a) override propio para `openai/gpt-6.1-sol` → esa línea es `omitido-usuario:openai/gpt-6.1-sol`, su valor no cambia y los otros dos modelos sí se fijan; (b) `compaction.enabled: false` → una sola línea `omitido-usuario:*` y el archivo queda byte a byte igual; (c) `compaction.reserveTokens: 5000` en el nivel superior → igual que (b); (d) `compaction: "texto"` → igual que (b).
  4. JSON inválido (`{ roto`): exit 1, mensaje con «no es JSON válido» y el archivo sin cambios (bytes).
  5. Omisiones por datos: sin `ventanas` para un modelo → `omitido-ventana:<modelo>`; `compactar_en` 270000 → `omitido-umbral:` para los tres; ninguna línea `fijado` y no se crea el archivo.
  6. `--simular`: misma salida que la real y la carpeta sigue vacía (sin archivo ni `.lock`).
  7. Bloqueo: con `<ruta>.lock` (carpeta) recién creada → exit 1, mensaje «no pude tomar el bloqueo», el archivo sin cambios y la carpeta `.lock` **sigue ahí**; con un `.lock` de hace 60 s (`utimesSync` al pasado) → procede, fija y al terminar no queda `.lock`. En el éxito normal tampoco queda `.lock` ni archivos `.tmp`.
  8. Quitar: tras fijar con `creado`, quitar los tres modelos deja `quitado`, `quitado`, `archivo-quitado` y la carpeta vacía; sobre un archivo previo del usuario, quitar deja exactamente el objeto original (`deepEqual`); si el usuario cambió el valor (171999) → `omitido` y el valor sigue; si el override tiene además `keepRecentTokens` → `omitido`; un `{}` preexistente (sin `creado`) sigue existiendo.
  9. Controles negativos (deben fallar donde se espera): una función `perdidas(antes, despues)` devuelve las claves de `antes` que cambiaron o faltan en `despues`. Se prueba con (a) el resultado real de una fusión → `[]`, y (b) una copia dañada a propósito (se borra `packages`; se cambia `deviceId`) → la función lista exactamente esas dos claves. Otro control: sobre el archivo del caso 7 con bloqueo fresco, `assert.throws`/estado distinto de 0 demuestra que sin la omisión de bloqueo el escritor se niega.
- Los números se comparan como números, no como texto.
- Sin dependencias nuevas.

## Alcance / Fuera de alcance
Alcance: el archivo nuevo `pruebas/comprobaciones/resolver-compactacion-pi.test.mjs`.
Fuera de alcance: `scripts/resolver.mjs` (si una prueba revela un defecto, `BLOQUEO` o nota; no se corrige aquí), la variante `claude` (task-05), `instalar.sh`, `desinstalar.sh`, `rapida.sh`.

## Pasos
1. Leer `scripts/resolver.mjs` (órdenes nuevas) y `resolver-agentes.test.mjs`. Resultado: salidas reales de las órdenes anotadas en *Notas*.
2. Crear el archivo con los ayudantes (`resolver`, `carpeta`, `leer`, `perdidas`, `modelosTemporal`). Resultado: `node --check` sin errores.
3. Escribir los casos 1 a 3. Resultado: `node --test` los reporta aprobados.
4. Escribir los casos 4 a 6. Resultado: aprobados.
5. Escribir los casos 7 a 9. Resultado: aprobados.
6. Comprobar el control negativo a mano: romper temporalmente la comprobación (p. ej. no pasar `perdidas`) debe hacer fallar el caso; restaurar. Anotarlo en *Notas*.
7. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/resolver-compactacion-pi.test.mjs` termina con `fail 0` y al menos 9 pruebas aprobadas.
2. La prueba dura menos de 3 s (`time`).
3. Los controles negativos (caso 9) detectan el daño: la copia dañada produce una lista no vacía con `packages` y `deviceId`.
4. `bash pruebas/rapida.sh` termina con exit 0 y el tiempo total sigue bajo 30 s.
5. `git status --short` muestra como nuevo, de esta tarea, solo ese archivo.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
time node --test pruebas/comprobaciones/resolver-compactacion-pi.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -3 "$R"
git status --short pruebas/comprobaciones/
```
Esperado: `tests` ≥ 9, `fail 0`, tiempo < 3 s; `rapida: N archivos en X s (tope 30 s)` con exit 0; el archivo nuevo aparece como `??`. No ejecutado por el planificador: depende de la task-02.

## Evidencia
Modo yolo: sin rama nueva ni `git switch`; trabajo en `feature/F19-compactacion-automatica` (`git branch --show-current` → `feature/F19-compactacion-automatica`). Sin commit, push, PR, merge ni despliegue. Pruebas con `mkdtemp`/`mktemp -d` y `FLUCASTR_MODELOS` apuntando a un `modelos.json` temporal; no se tocó `~/.pi/agent/settings.json`, `~/.claude` ni `auth.json`. `definitions/STATUS.md` no se escribió.

Archivo nuevo: `pruebas/comprobaciones/resolver-compactacion-pi.test.mjs` (20 pruebas: casos 1 a 9, con 3 variantes de 3, 2 de 5, 5 de 8 y 3 controles de 9).

Sintaxis (`node --check`):
```
CHECK_OK
```

Ejecución completa previa (salida real, `node --test`):
```
✔ 1. carpeta vacía: fija los tres modelos con 172000 y crea el archivo
✔ 2. fusión: conserva deviceId, packages, claveNueva y compaction.keepRecentTokens
✔ 3a. override propio de un modelo: se omite ese y los otros dos se fijan
✔ 3b. compaction.enabled en el nivel superior: una sola línea y el archivo igual
✔ 3c. compaction.reserveTokens en el nivel superior: igual que 3b
✔ 3d. compaction como texto: igual que 3b
✔ 4. JSON inválido: exit 1, mensaje «no es JSON válido» y el archivo sin cambios
✔ 5a. sin ventana para un modelo: omitido-ventana y los otros dos se fijan
✔ 5b. compactar_en 270000: omitido-umbral para los tres, sin fijar y sin crear el archivo
✔ 6. --simular: misma salida que la real y la carpeta sigue vacía
✔ 7a. bloqueo fresco: exit 1, mensaje de bloqueo, archivo sin cambios y .lock intacto
✔ 7b. bloqueo de hace 60 s: procede, fija, no deja .lock ni .tmp
✔ 8a. tras fijar con creado: quitado, quitado, archivo-quitado y carpeta vacía
✔ 8b. sobre archivo previo del usuario: quitar deja exactamente el objeto original
✔ 8c. si el usuario cambió el valor (171999): omitido y el valor sigue
✔ 8d. si el override tiene además keepRecentTokens: omitido y el valor sigue
✔ 8e. un {} preexistente sigue existiendo tras fijar y quitar sin creado
✔ 9a. control negativo: una fusión real no pierde ninguna clave
✔ 9b. control negativo: una copia dañada lista exactamente packages y deviceId
✔ 9c. control negativo: con bloqueo fresco el escritor se niega (status distinto de 0)
ℹ tests 20
ℹ suites 0
ℹ pass 20
ℹ fail 0
ℹ duration_ms 1533.716458
```

Verificación (salida real, primera pasada completa, HOME=/Users/franco):
```
$ time node --test pruebas/comprobaciones/resolver-compactacion-pi.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 20
ℹ pass 20
ℹ fail 0
node --test ... 0.88s user 0.22s system 69% cpu 1.581 total

$ R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -3 "$R"
rapida exit=0
ℹ todo 0
ℹ duration_ms 11826.630875
rapida: 24 archivos en 12 s (tope 30 s)

$ git status --short pruebas/comprobaciones/
?? pruebas/comprobaciones/resolver-compactacion-pi.test.mjs
```

Control negativo a mano (paso 6): en una copia temporal `pruebas/comprobaciones/tmp-control-negativo.test.mjs` se sustituyó `perdidas(antes, dañado)` por una lista fija, y el caso falla:
```
✖ 9b. control negativo: una copia dañada lista exactamente packages y deviceId (31.326708ms)
ℹ pass 19
ℹ fail 1
```
La copia se borró después (`ls pruebas/comprobaciones/ | grep -c tmp-control` → 0). El archivo real no se modificó.

Criterios de aceptación:
1. Cumple: `tests 20` (≥ 9), `fail 0`.
2. Cumple: 1,58 s en total (< 3 s).
3. Cumple: la copia dañada da `['deviceId', 'packages']` (caso 9b); la fusión real da `[]` (caso 9a).
4. Cumple: `rapida exit=0`, 12 s (< 30 s).
5. Cumple: `git status --short` muestra solo `?? pruebas/comprobaciones/resolver-compactacion-pi.test.mjs` de esta tarea (los `M` de `definitions/STATUS.md` y de task-02 venían ya de antes y no se tocaron).

## Notas
- Pasos 1 a 5 seguidos tal cual. Salidas reales de `fijar-compactacion`/`quitar-compactacion` leídas de `scripts/resolver.mjs` (sin modificarlo): las líneas coinciden con las de la task-02 (`fijado:…`, `omitido-usuario:…`, `omitido-ventana:…`, `omitido-umbral:…`, `:creado`, `quitado`, `archivo-quitado`, `omitido`, `omitido-usuario:*`).
- Huecos menores resueltos (3):
  1. La definición de `perdidas(antes, despues)` («claves de antes que cambiaron o faltan») no dice cómo comparar `compaction`, que la fusión sí cambia (añade `modelOverrides`). Con comparación de igualdad superficial, el control 9a daría `['compaction']` y no `[]`. Decisión: contención profunda (cada clave de `antes` sigue en `despues` con su valor; en objetos pueden aparecer claves nuevas). Sigue detectando lo pedido: 9b lista exactamente `packages` y `deviceId`.
  2. Caso 5a: la «ventana ausente en un modelo» se hizo con `openai/gpt-6-luna` (último de la lista). Los otros dos se fijan como pide la tarea.
  3. Caso 8e: el `{}` preexistente se prueba con fijar y luego quitar tres veces sin `creado` (el archivo queda `{}` y existe). Así cubre también la poda de `compaction` vacía.
- Caso 9c se prueba sobre el mismo bloqueo fresco que 7a (control negativo: sin la comprobación de bloqueo el escritor no se niega).
- No se corrigió `scripts/resolver.mjs`; no hubo defecto que reportar.
- Sin señal de tarea incompleta más allá del hueco 1.

Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
