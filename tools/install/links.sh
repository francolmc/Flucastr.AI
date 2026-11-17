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

# Si el destino es un enlace a este repo (instalación manual anterior), lo quita para poder generar el archivo.
# Devuelve 0 si lo liberó (o lo liberaría, en simulación) y 1 si no era un enlace nuestro.
liberar() { # destino
  local destino="$1"
  if [ -L "$destino" ]; then
    case "$(readlink "$destino")" in
      "$RAIZ"/*)
        echo "  reemplazando enlace anterior: $destino"
        if [ "$SIMULAR" = 0 ]; then rm "$destino"; fi
        return 0
        ;;
    esac
  fi
  return 1
}
