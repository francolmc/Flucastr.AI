# Solo un proyecto: quita lo que este instalador puso ahí (agente fijado, copias de skills, líneas de
# exclusión de git y la línea skills-proyecto) y deja el resto del manifiesto tal cual.
if [ -n "$PROYECTO" ]; then
  AJUSTES="$PROYECTO/.claude/settings.local.json"
  SETTINGS="$PROYECTO/.claude/settings.json"
  EXCL_GIT="$(exclusion_de_git "$PROYECTO")"
  MANTENER="$MANIFIESTO.tmp"
  hallados=0
  copias=0
  : > "$MANTENER"
  while IFS= read -r linea || [ -n "$linea" ]; do
    IFS=$'\t' read -r tipo ruta extra <<< "$linea"
    quitar=0
    case "$tipo" in
      ajuste)
        if [ "$ruta" = "$AJUSTES" ]; then
          quitar=1
          hallados=$((hallados + 1))
          if [ "$SIMULAR" = 1 ]; then
            decir "SIMULACIÓN: quitaría el agente '${extra:-}' de: $AJUSTES"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-agente "$AJUSTES" "${extra:-}" < /dev/null)" || resultado="error"
            decir "  ajuste de proyecto ($resultado): $AJUSTES"
            rmdir "$PROYECTO/.claude" 2>/dev/null || true # solo si quedó vacía
          fi
        fi
        ;;
      compactacion)
        # compactación de Claude Code de este proyecto: solo la línea claude: de su settings.local.json
        case "${extra:-}" in
          claude:*)
            if [ "$ruta" = "$AJUSTES" ]; then
              quitar=1
              hallados=$((hallados + 1))
              valor="${extra#claude:}"
              if [ "$SIMULAR" = 1 ]; then
                decir "SIMULACIÓN: quitaría la compactación de Claude Code de: $AJUSTES"
              else
                resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion claude "$AJUSTES" "$valor" < /dev/null)" || resultado="error"
                decir "  compactación de Claude Code ($resultado): $AJUSTES"
                rmdir "$PROYECTO/.claude" 2>/dev/null || true # solo si quedó vacía
              fi
            fi
            ;;
        esac
        ;;
      directorio)
        case "$ruta" in
          "$PROYECTO"/.pi/skills/*)
            quitar=1
            hallados=$((hallados + 1))
            copias=1
            if [ -d "$ruta" ] && [ ! -L "$ruta" ] && [ -f "$ruta/.flucastr-ai" ]; then
              if [ "$SIMULAR" = 1 ]; then
                decir "  quitaría: $ruta"
              else
                rm -rf "$ruta"
                limpiar_pi_vacio "$ruta"
                decir "  quitado: $ruta"
              fi
            else
              decir "  omitido (no tiene la marca): $ruta"
            fi
            ;;
        esac
        ;;
      exclusion)
        if [ -n "$EXCL_GIT" ] && [ "$ruta" = "$EXCL_GIT" ]; then
          quitar=1
          hallados=$((hallados + 1))
          if [ -n "${extra:-}" ] && [ -f "$ruta" ] && grep -qxF -- "$extra" "$ruta"; then
            if [ "$SIMULAR" = 0 ]; then
              grep -vxF -- "$extra" "$ruta" > "$ruta.tmp" || true
              if cmp -s "$ruta" "$ruta.tmp"; then rm -f "$ruta.tmp"; else mv "$ruta.tmp" "$ruta"; fi
            fi
            if [ "$SIMULAR" = 1 ]; then
              decir "  quitaría exclusión: $extra ($ruta)"
            else
              decir "  quitada exclusión: $extra ($ruta)"
            fi
          else
            decir "  omitido (no está la exclusión): $ruta"
          fi
        elif [ -z "$EXCL_GIT" ] && case "$ruta" in "$PROYECTO"/*) true ;; *) false ;; esac; then
          decir "  AVISO: el proyecto ya no es un repo git; no se quita la exclusión (sigue registrada): $extra"
        fi
        ;;
      deny)
        # regla deny de Claude Code de este proyecto (settings.json): solo la regla exacta que el kit agregó
        if [ "$ruta" = "$SETTINGS" ]; then
          quitar=1
          hallados=$((hallados + 1))
          if [ "$SIMULAR" = 1 ]; then
            decir "SIMULACIÓN: quitaría la regla deny '${extra:-}' de: $SETTINGS"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-deny claude "$SETTINGS" "${extra:-}" < /dev/null)" || resultado="error"
            decir "  regla deny ($resultado): ${extra:-} en $SETTINGS"
            rmdir "$PROYECTO/.claude" 2>/dev/null || true # solo si quedó vacía
          fi
        fi
        ;;
      sandbox-claude)
        if [ "$ruta" = "$SETTINGS" ]; then
          quitar=1
          hallados=$((hallados + 1))
          clave="${extra%%=*}"
          valor="${extra#*=}"
          if [ "$SIMULAR" = 1 ]; then
            decir "SIMULACIÓN: quitaría ajuste de sandbox $clave en: $SETTINGS"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-sandbox claude "$SETTINGS" "$clave" "$valor" < /dev/null)" || resultado="error"
            decir "  ajuste de sandbox ($resultado): $clave en $SETTINGS"
            rmdir "$PROYECTO/.claude" 2>/dev/null || true
          fi
        fi
        ;;
      hook)
        # hook del validador de Claude Code de este proyecto: solo su línea settings.local.json
        if [ "$ruta" = "$AJUSTES" ] && [ "${extra:-}" = claude ]; then
          quitar=1
          hallados=$((hallados + 1))
          if [ "$SIMULAR" = 1 ]; then
            decir "SIMULACIÓN: quitaría el hook de Claude Code de: $AJUSTES"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-hook claude "$AJUSTES" < /dev/null)" || resultado="error"
            decir "  hook de Claude Code ($resultado): $AJUSTES"
            rmdir "$PROYECTO/.claude" 2>/dev/null || true # solo si quedó vacía
          fi
        fi
        ;;
      codex-reglas)
        # reglas deny de Codex de este proyecto: solo ese archivo, y solo si lleva la marca del kit
        if [ "$ruta" = "$PROYECTO/.codex/rules/flucastr.rules" ]; then
          quitar=1
          hallados=$((hallados + 1))
          if [ "$SIMULAR" = 1 ]; then
            decir "SIMULACIÓN: quitaría las reglas de Codex de: $ruta"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-deny codex "$ruta" < /dev/null)" || resultado="error"
            decir "  reglas de Codex ($resultado): $ruta"
            rmdir "$PROYECTO/.codex/rules" 2>/dev/null || true # solo si quedaron vacías
            rmdir "$PROYECTO/.codex" 2>/dev/null || true
          fi
        fi
        ;;
      skills-proyecto)
        if [ "$ruta" = "$PROYECTO" ]; then
          quitar=1
          hallados=$((hallados + 1))
        fi
        ;;
    esac
    if [ "$quitar" = 0 ]; then printf '%s\n' "$linea" >> "$MANTENER"; fi
  done < "$MANIFIESTO"

  if [ "$copias" = 1 ]; then
    decir "  (las copias no se editan: si cambiaste algo dentro, se pierde)"
  fi
  if [ "$hallados" = 0 ]; then
    rm -f "$MANTENER"
    decir "Este instalador no instaló nada en $PROYECTO."
    exit 0
  fi
  if [ "$SIMULAR" = 1 ]; then
    rm -f "$MANTENER"
    decir "SIMULACIÓN: no se borra nada."
    exit 0
  fi
  mv "$MANTENER" "$MANIFIESTO"
  if [ ! -s "$MANIFIESTO" ]; then
    rm -f "$MANIFIESTO"
    rmdir "$ESTADO_DIR" 2>/dev/null || true
  fi
  exit 0
fi
