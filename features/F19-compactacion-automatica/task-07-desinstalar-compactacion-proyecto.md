# task-07 — `desinstalar.sh --proyecto`: quita también la compactación del proyecto
repo: Flucastr.AI   depende_de: task-06   estado: aprobada

## Descripción
Hacer que `bash desinstalar.sh --proyecto <ruta>` quite del `.claude/settings.local.json` de ese proyecto el `autoCompactWindow` que puso el kit, junto con el agente, las copias de skills y las exclusiones que ya quita, y la línea `compactacion` correspondiente del manifiesto. No toca la compactación de Pi (global) ni las líneas de otros proyectos.

## Contexto
- Leído `desinstalar.sh`, rama `--proyecto` (líneas 71–165): `AJUSTES="$PROYECTO/.claude/settings.local.json"`; recorre el manifiesto, copia a `$MANTENER` (`$MANIFIESTO.tmp`) las líneas que no se quitan (`quitar=0`), cuenta `hallados`, y en los casos `ajuste`, `directorio`, `exclusion` y `skills-proyecto` decide con `case "$tipo"`. Con `--simular` solo imprime `decir "SIMULACIÓN: …"` / `quitaría …` y no escribe. Al final `mv "$MANTENER" "$MANIFIESTO"` y, si queda vacío, borra el manifiesto.
- El caso `ajuste` de esa rama (líneas 82–94) es el patrón: coincide por `$ruta = $AJUSTES`, llama al resolver con `< /dev/null` y `|| resultado="error"`, e intenta `rmdir "$PROYECTO/.claude"`.
- Línea del manifiesto: `compactacion<TAB>$PROYECTO/.claude/settings.local.json<TAB>claude:<valor>` (escrita por la task-09). Las líneas `compactacion … pi:…` no coinciden con `$AJUSTES` y se conservan en `$MANTENER`.
- Resolver: `quitar-compactacion claude <ruta> <valor>` (task-04).

## Decisiones ya tomadas
- Caso nuevo `compactacion)` en la rama `--proyecto`, antes de `directorio)` o después de `ajuste)` (cualquiera, sin tocar los demás): si `extra` empieza con `claude:` y `$ruta = $AJUSTES`: `quitar=1`, `hallados=$((hallados + 1))`, `valor="${extra#claude:}"`. Simulación: `decir "SIMULACIÓN: quitaría la compactación de Claude Code de: $AJUSTES"`. Real: `resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion claude "$AJUSTES" "$valor" < /dev/null)" || resultado="error"`, `decir "  compactación de Claude Code ($resultado): $AJUSTES"` y `rmdir "$PROYECTO/.claude" 2>/dev/null || true`.
- Cualquier otra línea `compactacion` (Pi u otro proyecto) no coincide: queda en `$MANTENER`.
- Si el proyecto solo tenía la línea `compactacion` (sin `ajuste`), `hallados` > 0 y no se imprime «Este instalador no instaló nada en …».
- Nada más cambia en la rama.

## Alcance / Fuera de alcance
Alcance: `desinstalar.sh` (caso nuevo en la rama `--proyecto`).
Fuera de alcance: el bucle principal (task-06), `instalar.sh`, `scripts/resolver.mjs`, pruebas nuevas (task-10), `README.md`.

## Pasos
1. Leer la rama `--proyecto` de `desinstalar.sh`. Resultado: punto de inserción anotado en *Notas*.
2. Añadir el caso `compactacion)`. Resultado: `bash -n desinstalar.sh` sin errores.
3. Probar con el manifiesto armado a mano del *Verificación*. Resultado: salidas esperadas.
4. Correr `bash pruebas/rapida.sh`. Resultado: exit 0.
5. Pegar todo en *Evidencia*.

## Criterios de aceptación
1. `desinstalar.sh --proyecto P` imprime `compactación de Claude Code (quitado)` (o `(archivo-quitado)` si el archivo queda vacío), y `autoCompactWindow` ya no está en `P/.claude/settings.local.json`.
2. La línea `compactacion` de ese proyecto desaparece del manifiesto; las líneas `pi:` y las de otro proyecto siguen.
3. `--simular` no cambia el archivo ni el manifiesto e imprime `SIMULACIÓN: quitaría la compactación de Claude Code de:`.
4. Un proyecto sin líneas del kit sigue imprimiendo «Este instalador no instaló nada en …».
5. `bash pruebas/rapida.sh` termina con exit 0.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
bash -n desinstalar.sh
T=$(mktemp -d); H="$T/h"; mkdir -p "$H/.flucastr-ai" "$T/p1/.claude" "$T/p2/.claude" "$T/vacio"
printf '{"agent":"coordinador","autoCompactWindow":133000}\n' > "$T/p1/.claude/settings.local.json"
printf '{"autoCompactWindow":133000}\n' > "$T/p2/.claude/settings.local.json"
printf 'modo\trepo\najuste\t%s\tcoordinador\ncompactacion\t%s\tclaude:133000\ncompactacion\t%s\tclaude:133000\ncompactacion\t%s\tpi:openai/gpt-6-luna=172000\n' "$T/p1/.claude/settings.local.json" "$T/p1/.claude/settings.local.json" "$T/p2/.claude/settings.local.json" "$H/pi-settings.json" > "$H/.flucastr-ai/manifiesto.txt"
cp "$H/.flucastr-ai/manifiesto.txt" "$T/manifiesto.original"
HOME="$H" bash desinstalar.sh --simular --proyecto "$T/p1"; cmp "$H/.flucastr-ai/manifiesto.txt" "$T/manifiesto.original" && echo manifiesto-igual
HOME="$H" bash desinstalar.sh --proyecto "$T/p1"; ls -A "$T/p1"; cat "$H/.flucastr-ai/manifiesto.txt"; cat "$T/p2/.claude/settings.local.json"
HOME="$H" bash desinstalar.sh --proyecto "$T/vacio"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
```
Esperado: la simulación imprime `SIMULACIÓN: quitaría la compactación de Claude Code de: …/p1/…` y `manifiesto-igual`; la real imprime `ajuste de proyecto (quitado)` y `compactación de Claude Code (archivo-quitado)`, `ls -A "$T/p1"` vacío (la carpeta `.claude` ya no está), el manifiesto conserva `modo`, la línea de `p2` y la de `pi:`; `p2` sigue con 133000; el proyecto `vacio` imprime «Este instalador no instaló nada en …»; `rapida` exit 0. No ejecutado por el planificador: `desinstalar.sh` aún no tiene el caso.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
