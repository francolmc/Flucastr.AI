# task-06 — `desinstalar.sh`: quita solo la compactación que puso el kit
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Enseñar a `desinstalar.sh` a leer las líneas `compactacion` del manifiesto y deshacerlas con `quitar-compactacion` (task-02 y task-04): las de Pi se quitan siempre (se rehacen al reinstalar) y las de Claude Code, que viven en proyectos, se conservan cuando `instalar.sh` reinstala con `--conservar-ajustes`. Va antes que `instalar.sh` para que la reinstalación nunca deje restos. Solo se quita lo que sigue valiendo lo que escribió el kit.

## Contexto
- Leído `desinstalar.sh` (250 líneas): el bucle principal `while IFS=$'\t' read -r tipo ruta extra … done < "$MANIFIESTO"` (líneas 169–230) trae los casos `enlace`, `archivo`, `directorio`, `exclusion`, `skills-proyecto` y `ajuste`; `ajuste` usa `if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi`, llama `node "$RAIZ/scripts/resolver.mjs" quitar-agente … < /dev/null` con `|| resultado="error"` y hace `rmdir "$(dirname "$ruta")" 2>/dev/null || true`. `decir` imprime salvo con `--silencioso`. La rama de `--proyecto` (líneas 71–165) es la task-07.
- Formato de las líneas (lo escribe `instalar.sh`, tareas 08 y 09): `compactacion<TAB><ruta del settings><TAB>pi:<modelo>=<reserve>[:creado]` y `compactacion<TAB><settings.local.json del proyecto><TAB>claude:<valor>`.
- Resolver (tareas 02 y 04): `quitar-compactacion pi <ruta> <modelo> <reserve> [creado]` imprime `quitado`, `archivo-quitado` u `omitido`; `quitar-compactacion claude <ruta> <valor>` igual.
- Pruebas que ejercitan la desinstalación: `pruebas/capa1/instalacion.test.mjs`, `copia.test.mjs`, `skills-proyecto.test.mjs` (todas en `rapida.sh`).

## Decisiones ya tomadas
- Un caso nuevo `compactacion)` en el bucle principal, sin cambiar los demás.
- Parseo de `extra` en bash puro:
  - Pi: `case "${extra:-}" in pi:*)`: `spec="${extra#pi:}"`; `creado=""`; si `spec` termina en `:creado`, `creado="creado"` y se recorta; `modelo="${spec%%=*}"`; `reserve="${spec#*=}"`. Real: `resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion pi "$ruta" "$modelo" "$reserve" $creado < /dev/null)" || resultado="error"` y `decir "  compactación de Pi ($resultado): $modelo"`. Simulación: `decir "  quitaría la compactación de Pi: $modelo ($ruta)"`. Se ejecuta aunque `CONSERVAR_AJUSTES=1`.
  - Claude Code: `claude:*)`: `valor="${extra#claude:}"`. Con `CONSERVAR_AJUSTES=1` → `continue` (no se toca y la línea la conserva `instalar.sh`, task-09). Real: `quitar-compactacion claude "$ruta" "$valor"` con el mismo patrón de error; `decir "  compactación de Claude Code ($resultado): $ruta"`; luego `rmdir "$(dirname "$ruta")" 2>/dev/null || true`. Simulación: `decir "  quitaría la compactación de Claude Code de: $ruta"`.
  - Cualquier otro `extra`: `decir "  omitido (línea compactacion desconocida): $ruta"`.
- No se toca el bucle de `--proyecto`, ni el cálculo de `MODO_INSTALADO`, ni el borrado final del manifiesto.
- El comentario de uso (líneas 2–4) no cambia.

## Alcance / Fuera de alcance
Alcance: `desinstalar.sh` (caso `compactacion)` del bucle principal).
Fuera de alcance: la rama `--proyecto` (task-07), `instalar.sh`, `scripts/resolver.mjs`, pruebas nuevas (task-10).

## Pasos
1. Leer `desinstalar.sh` y confirmar los patrones de `ajuste`. Resultado: líneas de inserción anotadas en *Notas*.
2. Añadir el caso `compactacion)` con las ramas `pi:*`, `claude:*` y el resto. Resultado: `bash -n desinstalar.sh` sin errores.
3. Probar con un manifiesto escrito a mano en un HOME temporal (ver *Verificación*). Resultado: las salidas de abajo.
4. Correr `bash pruebas/rapida.sh`. Resultado: exit 0.
5. Pegar todo en *Evidencia*.

## Criterios de aceptación
1. Con un `settings.json` de Pi creado por `fijar-compactacion pi` y su manifiesto, `bash desinstalar.sh` imprime `compactación de Pi (quitado)` dos veces y `compactación de Pi (archivo-quitado)` una, y el archivo ya no existe.
2. Si el usuario cambió un valor (171999), esa línea imprime `compactación de Pi (omitido)` y el valor del usuario sigue en el archivo.
3. Un `settings.local.json` de proyecto con `autoCompactWindow` 133000 y otras claves queda sin esa clave tras `desinstalar.sh`, y `desinstalar.sh --conservar-ajustes` no lo toca.
4. `--simular` imprime `quitaría la compactación…` y no cambia ningún archivo.
5. `bash pruebas/rapida.sh` termina con exit 0.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
bash -n desinstalar.sh
T=$(mktemp -d); H="$T/h"
preparar() {
  rm -rf "$T/h" "$T/proy"; mkdir -p "$H/.flucastr-ai" "$H/pi" "$T/proy/.claude"
  node scripts/resolver.mjs fijar-compactacion pi "$H/pi/settings.json" >/dev/null
  printf '{"agent":"coordinador","autoCompactWindow":133000}\n' > "$T/proy/.claude/settings.local.json"
  printf 'modo\trepo\ncompactacion\t%s\tpi:openai/gpt-6-astra=172000:creado\ncompactacion\t%s\tpi:openai/gpt-6.1-sol=172000:creado\ncompactacion\t%s\tpi:openai/gpt-6-luna=172000:creado\ncompactacion\t%s\tclaude:133000\n' "$H/pi/settings.json" "$H/pi/settings.json" "$H/pi/settings.json" "$T/proy/.claude/settings.local.json" > "$H/.flucastr-ai/manifiesto.txt"
}
preparar; HOME="$H" bash desinstalar.sh --simular | grep -i compactaci; ls -A "$H/pi"
preparar; HOME="$H" bash desinstalar.sh --conservar-ajustes | grep -i compactaci; cat "$T/proy/.claude/settings.local.json"; ls -A "$H/pi"
preparar; HOME="$H" bash desinstalar.sh | grep -i compactaci; cat "$T/proy/.claude/settings.local.json"; ls -A "$H/pi"
preparar; node -e "const f=process.argv[1],o=JSON.parse(require('fs').readFileSync(f));o.compaction.modelOverrides['openai/gpt-6-luna'].reserveTokens=171999;require('fs').writeFileSync(f,JSON.stringify(o))" "$H/pi/settings.json"
HOME="$H" bash desinstalar.sh | grep -i "compactación de Pi"; cat "$H/pi/settings.json"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
```
Esperado: (1) la simulación imprime cuatro líneas `quitaría la compactación…` y `settings.json` sigue en `$H/pi`; (2) con `--conservar-ajustes` imprime tres líneas `compactación de Pi (…)` (`quitado`, `quitado`, `archivo-quitado`), el `settings.local.json` conserva `autoCompactWindow: 133000` y `ls -A "$H/pi"` queda vacío; (3) la desinstalación completa suma `compactación de Claude Code (quitado)` y el proyecto queda con `{"agent":"coordinador"}` (la clave `agent` la gestiona el caso `ajuste`, que aquí no hay línea para ella); (4) con el valor de `gpt-6-luna` cambiado a 171999 esa línea imprime `compactación de Pi (omitido)` y el archivo conserva ese override con 171999 y ya sin los otros dos; `rapida` con exit 0. No ejecutado por el planificador: `desinstalar.sh` aún no tiene el caso.

## Evidencia
Modo yolo: sin rama nueva ni `git switch`; trabajo en `feature/F19-compactacion-automatica` (`git branch --show-current` → `feature/F19-compactacion-automatica`). Sin commit, push, PR, merge ni despliegue. `definitions/STATUS.md` no se escribió (ya venía modificado en el estado inicial; no se tocó). Verificación con `HOME` falso (`$H` dentro de `mktemp -d`); no se ejecutó `desinstalar.sh` contra el HOME real ni se tocó `~/.pi` ni `~/.claude`.

Sintaxis (`bash -n desinstalar.sh`): `SYNTAX_OK`.

Verificación (salida real, `T=/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.aUciSqA2WC`):
```
== (1) simular
  quitaría la compactación de Pi: openai/gpt-6-astra (/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.aUciSqA2WC/h/pi/settings.json)
  quitaría la compactación de Pi: openai/gpt-6.1-sol (/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.aUciSqA2WC/h/pi/settings.json)
  quitaría la compactación de Pi: openai/gpt-6-luna (/var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.aUciSqA2WC/h/pi/settings.json)
  quitaría la compactación de Claude Code de: /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.aUciSqA2WC/proy/.claude/settings.local.json
settings.json
== (2) conservar-ajustes
  compactación de Pi (quitado): openai/gpt-6-astra
  compactación de Pi (quitado): openai/gpt-6.1-sol
  compactación de Pi (archivo-quitado): openai/gpt-6-luna
{"agent":"coordinador","autoCompactWindow":133000}
== (3) completa
  compactación de Pi (quitado): openai/gpt-6-astra
  compactación de Pi (quitado): openai/gpt-6.1-sol
  compactación de Pi (archivo-quitado): openai/gpt-6-luna
  compactación de Claude Code (quitado): /var/folders/dm/9_88kbsd41150_nxzrxl4yw00000gn/T/tmp.aUciSqA2WC/proy/.claude/settings.local.json
{
  "agent": "coordinador"
}
== (4) valor de usuario
  compactación de Pi (quitado): openai/gpt-6-astra
  compactación de Pi (quitado): openai/gpt-6.1-sol
  compactación de Pi (omitido): openai/gpt-6-luna
{
  "compaction": {
    "modelOverrides": {
      "openai/gpt-6-luna": {
        "reserveTokens": 171999
      }
    }
  }
}
```

Ls de `$H/pi` tras (2): vacío (sin salida). Tras (3): vacío. Tras (1): solo `settings.json` (intacto).

rapida (HOME real, primera pasada):
```
rapida exit=0 segundos=12
ℹ duration_ms 12270.440916
rapida: 25 archivos en 12 s (tope 30 s)
```
Pruebas con fallas (`grep -c "not ok\|✖"`): 0.

Criterios de aceptación:
1. Cumple: (3) imprime `compactación de Pi (quitado)` dos veces y `(archivo-quitado)` una; el `settings.json` ya no existe (`ls` vacío).
2. Cumple: (4) imprime `compactación de Pi (omitido)` para `gpt-6-luna` y el valor 171999 sigue en el archivo.
3. Cumple: (3) quita `autoCompactWindow` del `settings.local.json` y deja `{"agent":"coordinador"}`; (2) con `--conservar-ajustes` no lo toca (`{"agent":"coordinador","autoCompactWindow":133000}`).
4. Cumple: (1) imprime cuatro líneas `quitaría la compactación…` y `settings.json` sigue en `$H/pi`.
5. Cumple: `rapida` exit 0.

## Notas
- Inserción (paso 1): caso `compactacion)` en el bucle principal, antes de `ajuste)`. Único sitio con el comentario de `ajuste`; la rama `--proyecto` no se tocó.
- Huecos menores resueltos: 0. El caso `*)` (línea desconocida), la simulación de Claude sin `rmdir` y el `rmdir` solo en la escritura real estaban especificados en la tarea.
- Pi no hace `rmdir` de `~/.pi/agent` (la tarea no lo pide y el HOME falso queda con la carpeta).
- `rapida.sh`: 12 s con HOME real, dentro del tope de 25 s; no hay exceso que anotar.
- Incidente menor: al encadenar comandos, lancé `rapida.sh` una segunda vez sin registrar su salida ni su exit. No cambia el resultado registrado (es la primera pasada). No afectó al repo.
- Sin señal de tarea incompleta.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
