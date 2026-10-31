# task-08 — `instalar.sh`: deja puesta la compactación de Pi
repo: Flucastr.AI   depende_de: task-06   estado: aprobada

## Descripción
Hacer que `bash instalar.sh` escriba en `~/.pi/agent/settings.json` (o `$PI_CODING_AGENT_DIR/settings.json`) la compactación automática de los modelos de Pi del kit, llamando a `fijar-compactacion pi` de la task-02 (y apoyándose en que `desinstalar.sh` ya las quita, task-06), y que registre en el manifiesto una línea `compactacion` por modelo para que `desinstalar.sh` (ya preparado en la task-06) quite exactamente eso. `--simular` solo informa. Si el archivo del usuario no se puede tocar, avisa y sigue: la instalación no falla por esto.

## Contexto
- Leído `instalar.sh` (449 líneas): `PI_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}"` (línea 16); `registrar tipo ruta [extra]` añade al manifiesto solo si `SIMULAR=0` (líneas 129–133); funciones por herramienta (`generar_agente_pi` líneas 289–304, `generar_lanzador_pi` 306–330); el bloque de Pi está en las líneas 389–402 (`if [ "$INSTALAR_PI" = 1 ]; then … fi`); `set -euo pipefail` está activo (todo comando que pueda fallar va en `if`/`||`).
- Manifiesto: líneas `tipo<TAB>ruta<TAB>extra`; `desinstalar.sh` (task-06) ya las lee. Formato nuevo, fijado por esta feature: `compactacion<TAB><PI_DIR>/settings.json<TAB>pi:<modelo>=<reserve>` y, si el archivo lo creó el kit, `pi:<modelo>=<reserve>:creado` (idéntico al sufijo que imprime el resolver).
- En cada reinstalación `instalar.sh` ejecuta primero `desinstalar.sh --silencioso --conservar-ajustes` (líneas 364–370), que ya (task-06) quita las líneas `pi:` del manifiesto y lo que escribieron; después esta función las rehace con los valores actuales de `modelos.json`.
- Pruebas que instalan en un HOME temporal con `PI_CODING_AGENT_DIR` propio: `pruebas/capa1/instalacion.test.mjs` (I3 exige que instalar+desinstalar restaure el árbol; I4 que la segunda instalación no cambie nada; I4 también ejecuta `bash -x instalar.sh --simular` y exige la traza `++ mktemp` seguida de `+ NUEVO=`), `copia.test.mjs`, `skills-proyecto.test.mjs`. `pruebas/capa1/remoto.test.mjs` queda fuera de `rapida.sh`.
- Informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`: Pi no relee `settings.json` en caliente; hay que abrir Pi nuevo o `/reload`.

## Decisiones ya tomadas
- Función nueva `instalar_compactacion_pi()` en `instalar.sh`, definida junto a `generar_lanzador_pi` y llamada una sola vez, al final del bloque `if [ "$INSTALAR_PI" = 1 ]` (después de los agentes y lanzadores y antes del aviso de `PATH`).
- Ruta: `ajustes="$PI_DIR/settings.json"`. La orden: `node "$RESOLVER" fijar-compactacion pi "$ajustes"` (con `--simular` añadido cuando `SIMULAR=1`), capturando salida y error juntos: `if ! salida="$(… 2>&1)"; then echo "  AVISO: no se tocó $ajustes ($salida)"; return; fi`.
- Mensajes exactos por línea de salida del resolver (sangría de dos espacios; con `SIMULAR=1` el texto lleva el prefijo `(simulación) ` justo después de la sangría y no se registra nada):
  - `fijado:<modelo>=<reserve>[:creado]` → `  compactación fijada: <modelo> reserveTokens=<reserve> (<ajustes>)`; sin simulación, `registrar compactacion "$ajustes" "pi:<modelo>=<reserve>[:creado]"`.
  - `omitido-usuario:*` → `  OMITIDO (ya define compaction en $ajustes: se respeta)`.
  - `omitido-usuario:<modelo>` → `  OMITIDO (ya define compaction para <modelo>: se respeta)`.
  - `omitido-ventana:<modelo>` → `  OMITIDO (modelos.json no declara la ventana de <modelo>)`.
  - `omitido-umbral:<modelo>` → `  OMITIDO (compactar_en no aplica a <modelo>: ventana − compactar_en < 16384)`.
- Al final de la función, si hubo al menos un `fijado`: `  Pi no relee settings.json en caliente: abre Pi de nuevo o usa /reload. Aplica a esos modelos también fuera del kit; desinstalar.sh lo quita.`
- Con `--solo claude` no se ejecuta (el bloque de Pi no corre). Sin `--copiar` y con `--copiar` se usa el `modelos.json` que ya resuelve `FLUCASTR_MODELOS` (un personal antiguo sin los campos produce solo avisos `omitido-ventana`, sin error).
- No se tocan las funciones existentes ni el orden de los demás bloques.

## Alcance / Fuera de alcance
Alcance: `instalar.sh` (función nueva y su llamada).
Fuera de alcance: la compactación de Claude Code y el cambio al reinstalar con proyectos (task-09), `desinstalar.sh` (task-06 y task-07), `scripts/resolver.mjs`, pruebas nuevas (task-10), `README.md`.

## Pasos
1. Leer `instalar.sh` (funciones y bloque de Pi) y confirmar con `node scripts/resolver.mjs fijar-compactacion pi "$T/s.json" --simular` el formato de salida. Resultado: salida real anotada en *Notas*.
2. Escribir `instalar_compactacion_pi()` con la traducción de líneas de *Decisiones*. Resultado: `bash -n instalar.sh` sin errores.
3. Llamarla al final del bloque de Pi. Resultado: `grep -n "instalar_compactacion_pi" instalar.sh` muestra definición y una llamada.
4. Probar en un HOME temporal: `HOME=$T/h PI_CODING_AGENT_DIR=$T/h/pi bash instalar.sh --simular` y luego real. Resultado: la simulación no crea `settings.json`; la real sí, con tres overrides, y el manifiesto trae tres líneas `compactacion`.
5. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. Instalación real en HOME temporal con `~/.claude` y la carpeta de Pi presentes: `$PI_DIR/settings.json` contiene los tres overrides con `reserveTokens` 172000 y el manifiesto tiene tres líneas `compactacion` con `pi:<modelo>=172000:creado`.
2. `--simular` no crea `settings.json` ni cambia el HOME (instantánea igual antes y después) e imprime líneas `(simulación) compactación fijada:`.
3. Con un `settings.json` previo del usuario con `deviceId`, `packages` y un override propio de `openai/gpt-6.1-sol`, la instalación conserva todo y avisa `OMITIDO (ya define compaction para openai/gpt-6.1-sol: se respeta)`.
4. Con un `settings.json` que no es JSON válido, la instalación termina con exit 0, imprime `AVISO: no se tocó` y deja el archivo igual (bytes).
5. `bash pruebas/rapida.sh` termina con exit 0 (la Capa 1 existente sigue verde; si un caso existente falla *por* el nuevo `settings.json`, no lo edites: `BLOQUEO: rol=arquitecto; motivo=<caso y causa>`).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
bash -n instalar.sh
T=$(mktemp -d); mkdir -p "$T/h/.claude" "$T/h/pi"
export HOME_ORIG="$HOME"
HOME="$T/h" PI_CODING_AGENT_DIR="$T/h/pi" bash instalar.sh --simular | grep -i compactaci; ls -A "$T/h/pi"
HOME="$T/h" PI_CODING_AGENT_DIR="$T/h/pi" bash instalar.sh | grep -i -e compactaci -e "Pi no relee"; cat "$T/h/pi/settings.json"; grep compactacion "$T/h/.flucastr-ai/manifiesto.txt"
printf '{"deviceId":"x","packages":["p"],"compaction":{"modelOverrides":{"openai/gpt-6.1-sol":{"reserveTokens":100000}}}}\n' > "$T/h/pi/settings.json"
HOME="$T/h" PI_CODING_AGENT_DIR="$T/h/pi" bash instalar.sh | grep -i -e OMITIDO -e compactaci
printf '{ roto' > "$T/h/pi/settings.json"; HOME="$T/h" PI_CODING_AGENT_DIR="$T/h/pi" bash instalar.sh | grep AVISO; echo "exit=$?"; cat "$T/h/pi/settings.json"
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
```
Esperado: la simulación imprime tres líneas `(simulación) compactación fijada: …=172000` y `ls -A` sin `settings.json`; la real, tres líneas `compactación fijada` más el aviso de recarga, el JSON con tres overrides y tres líneas `compactacion` del manifiesto; con el archivo del usuario, `OMITIDO … gpt-6.1-sol` y las otras dos fijadas (el JSON conserva `deviceId`, `packages` y el 100000); con `{ roto`, `AVISO: no se tocó` y el archivo igual; `rapida` exit 0. No ejecutado por el planificador: `instalar.sh` aún no tiene la función.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
