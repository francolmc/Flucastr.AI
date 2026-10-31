# task-04 — `resolver.mjs`: compactación de Claude Code y aviso en `comparar-modelos`
repo: Flucastr.AI   depende_de: task-02   estado: aprobada

## Descripción
Completar `scripts/resolver.mjs` con la variante de Claude Code: `fijar-compactacion claude` escribe `autoCompactWindow = compactar_en + 33000` en el `settings.local.json` de un proyecto (sin pisar nada) y `quitar-compactacion claude` lo deshace. Además `comparar-modelos` avisa cuando el `modelos.json` personal no trae los campos nuevos (`compactar_en`, `ventanas`). La puerta 4 de esta tarea exige revisar `git diff scripts/`.

## Contexto
- Leído `scripts/resolver.mjs` con las órdenes de la task-02. `fijar-agente`/`quitar-agente` (líneas ~160–186) escriben en el mismo `.claude/settings.local.json`: `fijar-agente` conserva las demás claves; `quitar-agente` borra el archivo si queda vacío. La nueva orden debe convivir con ellas sin interferir.
- Informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, puntos 5 y 6: clave `autoCompactWindow` (global) aceptada entre 100000 y 1000000 (fuera de rango se ignora **en silencio**); el umbral real es `ventana − 33000` (colchón de Claude Code); por eso se escribe `compactar_en + 33000`. El archivo `settings.local.json` del proyecto gana a `settings.json` del proyecto y al de usuario; el campo en el frontmatter del agente no afecta a la sesión principal.
- `comparar-modelos` (líneas ~187–203): hoy avisa `version: …`, `agente nuevo: …` y `perfil nuevo: …`; la usa `instalar-remoto.sh` (línea ~241) y la prueba `pruebas/capa1/remoto.test.mjs` (fuera de `rapida.sh`).
- Perfil de Claude Code: `perfiles[perfil_por_defecto["claude-code"]]` (hoy `claude-code`).

## Decisiones ya tomadas
- Sintaxis: `node scripts/resolver.mjs fijar-compactacion claude <ajustes.json> [--simular]` y `node scripts/resolver.mjs quitar-compactacion claude <ajustes.json> <valor>`.
- Constante `COLCHON_CLAUDE_CODE = 33000` con el comentario «Claude Code compacta a ventana − 33000 (informe 2026-10-31 de verificación de compactación); para compactar a compactar_en se escribe compactar_en + 33000».
- Valor: `(perfil.compactar_en ?? config.compactar_en) + COLCHON_CLAUDE_CODE`, con el perfil por defecto de Claude Code. Si `compactar_en` falta o no es entero positivo: `omitido-umbral`. Si el valor no está entre 100000 y 1000000 (ambos incluidos): `omitido-rango:<valor>`.
- Salida de una línea: `fijado:<valor>`, `ya-estaba` (el archivo ya tiene `autoCompactWindow` con ese valor exacto, lo haya puesto quien lo haya puesto), `omitido-usuario` (tiene otro `autoCompactWindow`), `omitido-umbral` u `omitido-rango:<valor>`. Con `--simular` imprime lo mismo y no escribe nada ni crea carpetas.
- Escritura: `mkdirSync(dirname, { recursive: true })` y `writeFileSync(ruta, JSON.stringify({ ...ajustes, autoCompactWindow: valor }, null, 2) + "\n")`, igual que `fijar-agente`; sin bloqueo (Claude Code no reescribe ese archivo). JSON inválido: `leerAjustes` ya falla con exit 1 sin tocarlo. No se escribe `modelSettings`.
- `quitar-compactacion claude`: si el archivo no existe o `autoCompactWindow` no es exactamente `Number(valor)`, imprime `omitido`; si coincide, lo borra; si el objeto queda vacío, `rmSync` e imprime `archivo-quitado`, si no reescribe e imprime `quitado`.
- `comparar-modelos` añade, después de las líneas actuales: `campo nuevo: compactar_en` si el publicado tiene `compactar_en` y el personal no; y, por cada perfil del publicado con `ventanas` que existe en el personal sin `ventanas`: `campo nuevo: ventanas (perfil <id>)`. Sin diferencias no imprime nada, como hasta ahora.
- Se actualizan cabecera de uso y mensaje final de `fallar("uso: …")`.

## Alcance / Fuera de alcance
Alcance: `scripts/resolver.mjs` (variante `claude` de las dos órdenes, constante, `comparar-modelos`, uso).
Fuera de alcance: la variante `pi` (ya hecha en task-02), `modelos.json`, `instalar.sh`, `desinstalar.sh`, pruebas nuevas (task-05), `~/.claude/settings.json`.

## Pasos
1. Leer `scripts/resolver.mjs` tras la task-02. Resultado: punto de inserción anotado en *Notas*.
2. Añadir la constante y la rama `claude` de `fijar-compactacion` (con `--simular`). Resultado: contra una carpeta temporal imprime `fijado:133000` y crea el archivo.
3. Añadir la rama `claude` de `quitar-compactacion`. Resultado: la ejecución inversa imprime `archivo-quitado`.
4. Extender `comparar-modelos`. Resultado: con un personal sin los campos imprime las dos líneas `campo nuevo:`.
5. Actualizar uso. Resultado: `node scripts/resolver.mjs` imprime el uso completo.
6. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. En carpeta temporal, `fijar-compactacion claude` imprime `fijado:133000` y el archivo es `{ "autoCompactWindow": 133000 }`; repetido imprime `ya-estaba`.
2. Sobre un archivo con `{"agent":"coordinador","otra":1}` conserva ambas claves y suma `autoCompactWindow`; con `{"autoCompactWindow":150000}` imprime `omitido-usuario` y no lo cambia.
3. `quitar-compactacion claude … 133000` deja el archivo como estaba antes (o lo borra si quedó vacío); con otro valor imprime `omitido`.
4. `comparar-modelos` imprime `campo nuevo: compactar_en` y `campo nuevo: ventanas (perfil pi-openai)` cuando el personal no los tiene, y nada cuando son iguales.
5. `bash pruebas/rapida.sh` termina con exit 0 (el archivo `pruebas/capa1/remoto.test.mjs` queda fuera de la rápida; se corre aparte: `node --test pruebas/capa1/remoto.test.mjs`, que no debe tener fallas nuevas).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
T=$(mktemp -d)
node scripts/resolver.mjs fijar-compactacion claude "$T/a/settings.local.json" --simular; ls -A "$T"
node scripts/resolver.mjs fijar-compactacion claude "$T/a/settings.local.json"; cat "$T/a/settings.local.json"
node scripts/resolver.mjs fijar-compactacion claude "$T/a/settings.local.json"
printf '{"agent":"coordinador","otra":1}\n' > "$T/b.json"; node scripts/resolver.mjs fijar-compactacion claude "$T/b.json"; cat "$T/b.json"
printf '{"autoCompactWindow":150000}\n' > "$T/c.json"; node scripts/resolver.mjs fijar-compactacion claude "$T/c.json"; cat "$T/c.json"
node scripts/resolver.mjs quitar-compactacion claude "$T/b.json" 133000; cat "$T/b.json"
node scripts/resolver.mjs quitar-compactacion claude "$T/a/settings.local.json" 1
node scripts/resolver.mjs quitar-compactacion claude "$T/a/settings.local.json" 133000; ls -A "$T/a"
node -e "const c=require('./modelos.json');delete c.compactar_en;delete c.perfiles['pi-openai'].ventanas;require('fs').writeFileSync(process.argv[1],JSON.stringify(c))" "$T/personal.json"
node scripts/resolver.mjs comparar-modelos "$T/personal.json" modelos.json
node scripts/resolver.mjs comparar-modelos modelos.json modelos.json; echo "exit=$?"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
node --test pruebas/capa1/remoto.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"
git diff scripts/
```
Esperado: simulación imprime `fijado:133000` y `ls -A` vacío; luego `fijado:133000`, el JSON, `ya-estaba`; `b.json` con `agent`, `otra` y `autoCompactWindow: 133000`; `c.json` con `omitido-usuario` y 150000; `quitar` en `b.json` imprime `quitado` y vuelve a `agent`+`otra`; con `1` imprime `omitido`; con `133000` imprime `archivo-quitado` y `a` queda vacío; `comparar-modelos` imprime las dos líneas `campo nuevo:` y, entre iguales, nada con `exit=0`; `rapida` exit 0; `remoto.test.mjs` con `fail 0` (sin red; tarda más de 30 s por eso queda fuera de la rápida: anotar la duración); `git diff scripts/` muestra solo `scripts/resolver.mjs`. No ejecutado por el planificador: las órdenes aún no existen.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
