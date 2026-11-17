# Compactación automática de los modelos de Pi del kit, en el settings.json global de Pi. Si el archivo del
# usuario no se puede tocar, avisa y sigue: no falla la instalación.
instalar_compactacion_pi() {
  local ajustes="$PI_DIR/settings.json" salida linea valor modelo resto reserve sufijo fijados=0
  local extra=()
  if [ "$SIMULAR" = 1 ]; then extra=(--simular); fi
  if ! salida="$(node "$RESOLVER" fijar-compactacion pi "$ajustes" ${extra[@]+"${extra[@]}"} 2>&1)"; then
    echo "  AVISO: no se tocó $ajustes ($salida)"
    return 0
  fi
  while IFS= read -r linea; do
    [ -n "$linea" ] || continue
    case "$linea" in
      fijado:*)
        valor="${linea#fijado:}"
        modelo="${valor%%=*}"
        resto="${valor#*=}"
        reserve="${resto%%:*}"
        sufijo=""
        case "$resto" in *:creado) sufijo=":creado" ;; esac
        fijados=$((fijados + 1))
        if [ "$SIMULAR" = 1 ]; then
          echo "  (simulación) compactación fijada: $modelo reserveTokens=$reserve ($ajustes)"
        else
          echo "  compactación fijada: $modelo reserveTokens=$reserve ($ajustes)"
          registrar compactacion "$ajustes" "pi:$modelo=$reserve$sufijo"
        fi
        ;;
      "omitido-usuario:*") echo "  OMITIDO (ya define compaction en $ajustes: se respeta)" ;;
      omitido-usuario:*) echo "  OMITIDO (ya define compaction para ${linea#omitido-usuario:}: se respeta)" ;;
      omitido-ventana:*) echo "  OMITIDO (modelos.json no declara la ventana de ${linea#omitido-ventana:})" ;;
      omitido-umbral:*) echo "  OMITIDO (compactar_en no aplica a ${linea#omitido-umbral:}: ventana − compactar_en < 16384)" ;;
      *) echo "  $linea" ;;
    esac
  done <<< "$salida"
  if [ "$fijados" -gt 0 ]; then
    echo "  Pi no relee settings.json en caliente: abre Pi de nuevo o usa /reload. Aplica a esos modelos también fuera del kit; desinstalar.sh lo quita."
  fi
  return 0
}

