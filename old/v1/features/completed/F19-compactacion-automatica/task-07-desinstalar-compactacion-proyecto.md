# task-07 — `desinstalar.sh --proyecto`: quita también la compactación del proyecto
repo: Flucastr.AI   depende_de: task-06   estado: hecha

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
Modo yolo: sin rama nueva ni `git switch`; trabajo en `feature/F19-compactacion-automatica` (`git branch --show-current` → `feature/F19-compactacion-automatica`). Sin commit, push, PR, merge ni despliegue. `definitions/STATUS.md` no se tocó. Verificación con `HOME` falso (`$H` dentro de `mktemp -d`); `desinstalar.sh` no se ejecutó contra el HOME real ni se tocaron `~/.pi` ni `~/.claude`.

Caso insertado en la rama `--proyecto` de `desinstalar.sh`, después de `ajuste)` y antes de `directorio)`: bloque `compactacion)` con `case "${extra:-}" in claude:*)`, que solo actúa si `$ruta = $AJUSTES`.

Sintaxis (`bash -n desinstalar.sh`): `SYNTAX_OK`.

Verificación (salida real, `T=/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL`):
```
== (1) simular
SIMULACIÓN: quitaría el agente 'coordinador' de: /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL/p1/.claude/settings.local.json
SIMULACIÓN: quitaría la compactación de Claude Code de: /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL/p1/.claude/settings.local.json
SIMULACIÓN: no se borra nada.
exit=0
manifiesto-igual
== (2) real
  ajuste de proyecto (quitado): /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL/p1/.claude/settings.local.json
  compactación de Claude Code (archivo-quitado): /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL/p1/.claude/settings.local.json
exit=0
-- ls p1:
(vacío)
-- manifiesto:
modo	repo
compactacion	/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL/p2/.claude/settings.local.json	claude:133000
compactacion	/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL/h/pi-settings.json	pi:openai/gpt-6-luna=172000
-- p2:
{"autoCompactWindow":133000}
== (3) proyecto vacio
Este instalador no instaló nada en /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.FbyWgtSiOL/vacio.
exit=0
== rapida (HOME real)
rapida exit=0 segundos=12
ℹ duration_ms 12060.700791
rapida: 25 archivos en 12 s (tope 30 s)
```

Criterios de aceptación:
1. Cumple: imprime `compactación de Claude Code (archivo-quitado)`; el archivo se borró entero al quedar vacío (`ls -A` de `p1` vacío), así que `autoCompactWindow` ya no está.
2. Cumple: el manifiesto conserva `modo`, la línea `pi:` y la de `p2` (`claude:133000`); la de `p1` desapareció.
3. Cumple: `--simular` imprime `SIMULACIÓN: quitaría la compactación de Claude Code de: …/p1/…`; `cmp` confirma manifiesto sin cambios.
4. Cumple: el proyecto `vacio` imprime «Este instalador no instaló nada en …».
5. Cumple: `bash pruebas/rapida.sh` exit 0.

## Notas
- Punto de inserción (paso 1): rama `--proyecto` tras el caso `ajuste)`; `directorio)` no se tocó.
- Huecos menores resueltos: 0.
- `pruebas/rapida.sh` con HOME real: 12 s, dentro del tope de 25 s; no hay exceso que anotar.
- Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
