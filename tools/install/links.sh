enlazar() { # origen destino
  local origen="$1" destino="$2" actual
  if [ -L "$destino" ]; then
    actual="$(readlink "$destino")"
    if [ "$actual" = "$origen" ]; then
      echo "  ya enlazado: $destino"
      registrar enlace "$destino"
    else
      echo "  OMITIDO (es un enlace a otro lugar): $destino -> $actual"
    fi
    return
  fi
  if [ -e "$destino" ]; then
    echo "  OMITIDO (ya existe y no es un enlace): $destino"
    return
  fi
  if [ "$SIMULAR" = 0 ]; then
    mkdir -p "$(dirname "$destino")"
    ln -s "$origen" "$destino"
    registrar enlace "$destino"
  fi
  echo "  enlazado: $destino"
}

# Libera el destino para regenerarlo. Devuelve 0 si lo liberó (o lo liberaría, en simulación) y 1 si no es nuestro:
# - un enlace a este repo (instalación manual anterior) se quita;
# - un archivo regular con una línea que empieza por la marca del kit se quita y se regenera (A3).
# Un archivo sin marca o un enlace a otro lugar devuelve 1: nunca se escribe a través de un enlace.
liberar() { # destino
  local destino="$1" primera=""
  if [ -L "$destino" ]; then
    case "$(readlink "$destino")" in
      "$RAIZ"/*)
        echo "  reemplazando enlace anterior: $destino"
        if [ "$SIMULAR" = 0 ]; then rm "$destino"; fi
        return 0
        ;;
    esac
    return 1
  fi
  if [ -f "$destino" ] && ! [ -L "$destino" ] && grep -q "^# flucastr-ai:generado" "$destino"; then
    echo "  reemplazando archivo generado anterior: $destino"
    if [ "$SIMULAR" = 0 ]; then rm "$destino"; fi
    return 0
  fi
  return 1
}
