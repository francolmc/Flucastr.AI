if [ "$SIMULAR" = 1 ]; then decir "SIMULACIÓN: no se borra nada."; fi

while IFS=$'\t' read -r tipo ruta extra; do
  [ -n "${ruta:-}" ] || continue
  case "$tipo" in
    enlace)
      # solo se borra si sigue siendo un enlace a este repo
      if [ -L "$ruta" ] && case "$(readlink "$ruta")" in "$RAIZ"/*) true ;; *) false ;; esac; then
        if [ "$SIMULAR" = 0 ]; then rm "$ruta"; fi
        decir "  quitado: $ruta"
      else
        decir "  omitido (ya no es un enlace de este repo): $ruta"
      fi
      ;;
    archivo)
      # solo se borra si sigue teniendo la marca de archivo generado
      if [ -f "$ruta" ] && grep -q 'flucastr-ai:generado' "$ruta"; then
        if [ "$SIMULAR" = 0 ]; then rm "$ruta"; fi
        decir "  quitado: $ruta"
      else
        decir "  omitido (no tiene la marca de archivo generado): $ruta"
      fi
      ;;
    directorio)
      # copia de una skill (modo descarga o --project-skills): solo se borra si es carpeta real con la marca, no un enlace
      if [ -d "$ruta" ] && [ ! -L "$ruta" ] && [ -f "$ruta/.flucastr-ai" ]; then
        if [ "$SIMULAR" = 0 ]; then rm -rf "$ruta"; limpiar_pi_vacio "$ruta"; fi
        decir "  quitado: $ruta"
      else
        decir "  omitido (no tiene la marca): $ruta"
      fi
      ;;
    exclusion)
      # línea de .git/info/exclude que añadió --project-skills: se quita solo esa línea exacta
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
      ;;
    deny)
      # regla deny de Claude Code de un proyecto (settings.json), salvo --keep-settings
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      if [ "$SIMULAR" = 1 ]; then
        decir "  quitaría la regla deny '${extra:-}' de: $ruta"
      else
        resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-deny claude "$ruta" "${extra:-}" < /dev/null)" || resultado="error"
        decir "  regla deny ($resultado): ${extra:-} en $ruta"
        rmdir "$(dirname "$ruta")" 2>/dev/null || true # .claude del proyecto, solo si quedó vacía
      fi
      ;;
    sandbox-claude)
      # Retira solo los valores exactos que el kit agregó, salvo durante una reinstalación.
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      clave="${extra%%=*}"
      valor="${extra#*=}"
      if [ "$SIMULAR" = 1 ]; then
        decir "  quitaría ajuste de sandbox $clave de: $ruta"
      else
        resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-sandbox claude "$ruta" "$clave" "$valor" < /dev/null)" || resultado="error"
        decir "  ajuste de sandbox ($resultado): $clave en $ruta"
        rmdir "$(dirname "$ruta")" 2>/dev/null || true
      fi
      ;;
    hook)
      # hook del validador de Claude Code de un proyecto (settings.local.json), salvo --keep-settings
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      if [ "$SIMULAR" = 1 ]; then
        decir "  quitaría el hook de Claude Code de: $ruta"
      else
        resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-hook claude "$ruta" < /dev/null)" || resultado="error"
        decir "  hook de Claude Code ($resultado): $ruta"
        rmdir "$(dirname "$ruta")" 2>/dev/null || true # .claude del proyecto, solo si quedó vacía
      fi
      ;;
    hook-compact)
      # hook de compactación de un proyecto (Claude Code o Codex), salvo --keep-settings (A10)
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      proyecto_hook=""
      case "${extra:-}" in
        claude) proyecto_hook="${ruta%/.claude/settings.local.json}" ;;
        codex) proyecto_hook="${ruta%/.codex/hooks.json}" ;;
      esac
      if [ -z "$proyecto_hook" ] || [ "$proyecto_hook" = "$ruta" ]; then
        decir "  omitido (hook de compactación desconocido): $ruta"
      elif [ "$SIMULAR" = 1 ]; then
        decir "  quitaría el hook de compactación de: $ruta"
      else
        resultado="$(node "$RAIZ/adapters/shared/compact-hook.mjs" quitar "${extra:-}" "$proyecto_hook" < /dev/null)" || resultado="error"
        decir "  hook de compactación ($resultado): $ruta"
        rmdir "$(dirname "$ruta")" 2>/dev/null || true # .claude o .codex del proyecto, solo si quedó vacía
      fi
      ;;
    codex-reglas)
      # reglas deny de Codex de un proyecto (.codex/rules/flucastr.rules), salvo --keep-settings
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      if [ "$SIMULAR" = 1 ]; then
        decir "  quitaría las reglas de Codex: $ruta"
      else
        resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-deny codex "$ruta" < /dev/null)" || resultado="error"
        decir "  reglas de Codex ($resultado): $ruta"
        rmdir "$(dirname "$ruta")" 2>/dev/null || true # .codex/rules, solo si quedó vacía
        rmdir "$(dirname "$(dirname "$ruta")")" 2>/dev/null || true # .codex, solo si quedó vacía
      fi
      ;;
    skills-proyecto)
      # solo registro: la línea se va con el manifiesto (las copias tienen sus propias líneas directorio)
      ;;
    compactacion)
      # compactación automática: Pi (ajuste global, siempre) y Claude Code (ajuste del proyecto, salvo --keep-settings)
      case "${extra:-}" in
        pi:*)
          spec="${extra#pi:}"
          creado=""
          if [ "${spec%:creado}" != "$spec" ]; then creado="creado"; spec="${spec%:creado}"; fi
          modelo="${spec%%=*}"
          reserve="${spec#*=}"
          if [ "$SIMULAR" = 1 ]; then
            decir "  quitaría la compactación de Pi: $modelo ($ruta)"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion pi "$ruta" "$modelo" "$reserve" $creado < /dev/null)" || resultado="error"
            decir "  compactación de Pi ($resultado): $modelo"
          fi
          ;;
        claude:*)
          if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
          valor="${extra#claude:}"
          if [ "$SIMULAR" = 1 ]; then
            decir "  quitaría la compactación de Claude Code de: $ruta"
          else
            resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-compactacion claude "$ruta" "$valor" < /dev/null)" || resultado="error"
            decir "  compactación de Claude Code ($resultado): $ruta"
            rmdir "$(dirname "$ruta")" 2>/dev/null || true # .claude del proyecto, solo si quedó vacía
          fi
          ;;
        *)
          decir "  omitido (línea compactacion desconocida): $ruta"
          ;;
      esac
      ;;
    raiz)
      # raíz del kit y lanzadores fijos: solo se borran los tres archivos de ~/.flucastr-ai, si son archivos regulares
      if { [ "$ruta" = "$ESTADO_DIR/raiz" ] || [ "$ruta" = "$ESTADO_DIR/validar-tarea.mjs" ] || [ "$ruta" = "$ESTADO_DIR/entorno.mjs" ]; } && [ -f "$ruta" ] && [ ! -L "$ruta" ]; then
        if [ "$SIMULAR" = 0 ]; then rm -f "$ruta"; fi
        decir "  quitado: $ruta"
      else
        decir "  omitido (no es un archivo de la instalación): $ruta"
      fi
      ;;
    ajuste)
      # agente predeterminado de un proyecto: solo se quita si sigue siendo el que fijamos
      if [ "$CONSERVAR_AJUSTES" = 1 ]; then continue; fi
      if [ "$SIMULAR" = 1 ]; then
        decir "  quitaría el agente predeterminado de: $ruta"
      else
        resultado="$(node "$RAIZ/scripts/resolver.mjs" quitar-agente "$ruta" "${extra:-}" < /dev/null)" || resultado="error"
        decir "  ajuste de proyecto ($resultado): $ruta"
        rmdir "$(dirname "$ruta")" 2>/dev/null || true # .claude del proyecto, solo si quedó vacía
      fi
      ;;
  esac
done < "$MANIFIESTO"

if [ "$SIMULAR" = 0 ]; then
  rm -f "$MANIFIESTO"
  if [ "$MODO_INSTALADO" = descarga ] && [ "$CONSERVAR_AJUSTES" = 0 ]; then
    rm -f "$ESTADO_DIR/version" "$ESTADO_DIR/kit.anterior"
  fi
  if [ "$TODO" = 1 ]; then rm -f "$ESTADO_DIR/models.json"; fi
  if [ "$MODO_INSTALADO" = descarga ] && [ "$CONSERVAR_AJUSTES" = 0 ]; then
    # kit puede ser la carpeta de este propio script: se borra lo último. El bloque termina en exit,
    # así bash no lee más líneas de un archivo que ya no existe.
    {
      rm -rf "$ESTADO_DIR/kit"
      rmdir "$ESTADO_DIR" 2>/dev/null || true
      decir "Listo. Reinicia Claude Code y Pi."
      exit 0
    }
  fi
  rmdir "$ESTADO_DIR" 2>/dev/null || true
  decir "Listo. Reinicia Claude Code y Pi."
fi
