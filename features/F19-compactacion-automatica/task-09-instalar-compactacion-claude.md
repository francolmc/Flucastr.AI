# task-09 — `instalar.sh --proyecto`: deja puesta la compactación de Claude Code
repo: Flucastr.AI   depende_de: task-07, task-08   estado: aprobada

## Descripción
Con `--proyecto <ruta>`, además de fijar el agente predeterminado, `instalar.sh` escribe `autoCompactWindow = compactar_en + 33000` en `<proyecto>/.claude/settings.local.json` llamando a `fijar-compactacion claude` (task-04), registra la línea `compactacion … claude:<valor>` y la conserva al reinstalar sin `--proyecto`, igual que ya conserva las líneas `ajuste`. Sin `--proyecto` no se escribe nada en proyectos.

## Contexto
- Leído `instalar.sh`: `fijar_agente_proyecto()` (líneas 333–348) es el patrón: usa `$PROYECTO`, `$AGENTE`, `SIMULAR`, llama al resolver y traduce la salida a mensajes; se invoca dentro de `if [ "$INSTALAR_CLAUDE" = 1 ]` → `if [ -n "$PROYECTO" ]` (líneas 380–383).
- Conservación al reinstalar (líneas 364–370): `grep -E "^ajuste$(printf '\t')" "$MANIFIESTO" >> "$NUEVO" || true` copia las líneas `ajuste` al manifiesto nuevo antes de llamar a `desinstalar.sh --silencioso --conservar-ajustes`, que no las toca (`desinstalar.sh`, task-06, también salta las `claude:` con esa opción).
- Formato de la línea: `compactacion<TAB>$PROYECTO/.claude/settings.local.json<TAB>claude:<valor>`.
- Resolver: `fijar-compactacion claude <ajustes.json> [--simular]` imprime una línea: `fijado:<valor>`, `ya-estaba`, `omitido-usuario`, `omitido-umbral` u `omitido-rango:<valor>`.
- Informe `pruebas/resultados/2026-10-31-verificacion-compactacion.md`, punto 5: `settings.local.json` del proyecto gana a los demás archivos de ajustes; Claude Code ignora en silencio valores fuera de 100000–1000000.
- `--proyecto` solo se procesa si Claude Code se instala (`INSTALAR_CLAUDE=1`); `--solo pi` la omite, como al agente.

## Decisiones ya tomadas
- Función nueva `instalar_compactacion_claude()` junto a `fijar_agente_proyecto`, llamada justo después de `fijar_agente_proyecto` dentro del mismo `if [ -n "$PROYECTO" ]`.
- Ruta: `ajustes="$PROYECTO/.claude/settings.local.json"`. La orden se ejecuta con `--simular` cuando `SIMULAR=1`; salida y error capturados juntos: `if ! salida="$(… 2>&1)"; then echo "  AVISO: no se tocó $ajustes ($salida)"; return; fi`.
- Mensajes (sangría de dos espacios; con `SIMULAR=1` llevan el prefijo `(simulación) ` tras la sangría y no se registra nada):
  - `fijado:<v>` → `  compactación de Claude Code fijada: autoCompactWindow=<v> ($ajustes)`; sin simulación, `registrar compactacion "$ajustes" "claude:<v>"`.
  - `ya-estaba` → `  compactación de Claude Code ya estaba fijada: $ajustes` (no se registra: la línea del manifiesto se conservó).
  - `omitido-usuario` → `  OMITIDO (el proyecto ya define autoCompactWindow: se respeta): $ajustes`.
  - `omitido-umbral` → `  OMITIDO (modelos.json no tiene un compactar_en válido para Claude Code)`.
  - `omitido-rango:<v>` → `  OMITIDO (autoCompactWindow=<v> queda fuera de 100000-1000000, el rango de Claude Code)`.
- Conservación: justo debajo de la línea del `grep` de `ajuste` se añade `grep -E "^compactacion$(printf '\t')[^$(printf '\t')]*$(printf '\t')claude:" "$MANIFIESTO" >> "$NUEVO" || true`. No se copian las líneas `pi:`.
- Limitación asumida y documentada (README, task-14): si Franco cambia `compactar_en` y reinstala con `--proyecto`, el valor ya instalado en ese proyecto se trata como del usuario (`omitido-usuario`); para cambiarlo hay que correr antes `bash desinstalar.sh --proyecto <ruta>`.
- Nada cambia para quien no pasa `--proyecto`.

## Alcance / Fuera de alcance
Alcance: `instalar.sh` (función nueva, su llamada y la línea de conservación).
Fuera de alcance: la compactación de Pi (task-08), `desinstalar.sh`, `scripts/resolver.mjs`, pruebas nuevas (task-10), `README.md`.

## Pasos
1. Leer `fijar_agente_proyecto` y las líneas 364–383 de `instalar.sh`. Resultado: puntos de inserción anotados en *Notas*.
2. Escribir `instalar_compactacion_claude()`. Resultado: `bash -n instalar.sh` sin errores.
3. Llamarla tras `fijar_agente_proyecto` y añadir la línea de conservación. Resultado: `grep -n "instalar_compactacion_claude\|compactacion" instalar.sh` las muestra.
4. Probar en HOME temporal con un proyecto (ver *Verificación*). Resultado: salidas esperadas.
5. Correr `bash pruebas/rapida.sh` y pegar todo en *Evidencia*.

## Criterios de aceptación
1. `bash instalar.sh --proyecto P` deja en `P/.claude/settings.local.json` `{ "agent": "arquitecto", "autoCompactWindow": 133000 }` y una línea `compactacion … claude:133000` en el manifiesto.
2. `bash instalar.sh` posterior (sin `--proyecto`) conserva esa línea y el archivo no cambia.
3. `--simular` no crea `P/.claude` y muestra `(simulación) compactación de Claude Code fijada`.
4. Un `settings.local.json` previo con `autoCompactWindow: 150000` se respeta (`OMITIDO …`) y no se registra línea.
5. `bash pruebas/rapida.sh` termina con exit 0.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
bash -n instalar.sh
T=$(mktemp -d); H="$T/h"; mkdir -p "$H/.claude" "$H/pi" "$T/p"
export PI_CODING_AGENT_DIR="$H/pi"
HOME="$H" bash instalar.sh --simular --proyecto "$T/p" | grep -i -e compactaci; ls -A "$T/p"
HOME="$H" bash instalar.sh --proyecto "$T/p" | grep -i -e "compactación de Claude"; cat "$T/p/.claude/settings.local.json"; grep "claude:" "$H/.flucastr-ai/manifiesto.txt"
HOME="$H" bash instalar.sh >/dev/null; grep "claude:" "$H/.flucastr-ai/manifiesto.txt"; cat "$T/p/.claude/settings.local.json"
HOME="$H" bash desinstalar.sh --proyecto "$T/p" >/dev/null; ls -A "$T/p"
mkdir -p "$T/q/.claude"; printf '{"autoCompactWindow":150000}\n' > "$T/q/.claude/settings.local.json"
HOME="$H" bash instalar.sh --proyecto "$T/q" | grep OMITIDO; grep -c "claude:" "$H/.flucastr-ai/manifiesto.txt"
unset PI_CODING_AGENT_DIR
R=$(mktemp); bash pruebas/rapida.sh > "$R" 2>&1; echo "rapida exit=$?"; tail -2 "$R"
```
Esperado: la simulación imprime `(simulación) compactación de Claude Code fijada: autoCompactWindow=133000` y `ls -A "$T/p"` vacío; la real imprime la línea de fijado, el JSON con `agent` y `autoCompactWindow: 133000` y una línea `claude:133000`; la reinstalación sin `--proyecto` conserva esa línea y el JSON igual; `desinstalar.sh --proyecto` deja `p` vacío; para `q` imprime `OMITIDO (el proyecto ya define autoCompactWindow: se respeta)` y el recuento de líneas `claude:` en el manifiesto es 0 (el proyecto `p` ya se quitó); `rapida` exit 0. No ejecutado por el planificador: depende de las tareas 07 y 08.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
