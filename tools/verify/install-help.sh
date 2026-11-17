# 2. sintaxis de los instaladores
paso 2 "sintaxis de instalar.sh y desinstalar.sh"
for f in instalar.sh desinstalar.sh; do
  bash -n "$f" || fallo "error de sintaxis en $f"
  echo "ok $f"
done

# 2b. ayuda completa: alias iguales, salida 0 y todas las opciones del parser
paso 2b "ayuda de instalar.sh completa e idéntica para ambos alias"
TH=$(mktemp -d) || fallo "2b: no pude crear el temporal"
trap '[ -n "${TH:-}" ] && rm -rf "$TH"' EXIT
mkdir -p "$TH/home"
printf 'contenido original\n' > "$TH/home/sentinel"
home_ayuda_snapshot() { { find "$TH/home" -print; find "$TH/home" -type f -exec shasum {} +; } | sort; }
antes_home=$(home_ayuda_snapshot) || fallo "2b: no pude tomar la instantánea previa del HOME"
HOME="$TH/home" bash instalar.sh -h > "$TH/corta" || fallo "2b: -h salió con error"
despues_h=$(home_ayuda_snapshot) || fallo "2b: no pude tomar la instantánea tras -h"
[ "$antes_home" = "$despues_h" ] || fallo "2b: -h modificó el HOME temporal"
HOME="$TH/home" bash instalar.sh --help > "$TH/larga" || fallo "2b: --help salió con error"
despues_help=$(home_ayuda_snapshot) || fallo "2b: no pude tomar la instantánea tras --help"
[ "$despues_h" = "$despues_help" ] || fallo "2b: --help modificó el HOME temporal"
cmp -s "$TH/corta" "$TH/larga" || fallo "2b: -h y --help no producen la misma salida"
opciones_parser=$(sed -n '/^  case "\$1" in$/,/^  esac$/p' instalar.sh | grep -oE -- '--[a-z-]+' | sort -u) || fallo "2b: no pude extraer opciones del parser"
[ -n "$opciones_parser" ] || fallo "2b: la extracción no encontró opciones del parser"
help_documenta_opciones() {
  local ayuda=$1 opcion
  while IFS= read -r opcion; do
    [ -n "$opcion" ] || continue
    grep -qF -- "$opcion" "$ayuda" || return 1
  done <<< "$opciones_parser"
  grep -qF -- '-h, --help' "$ayuda"
}
help_documenta_opciones "$TH/larga" || fallo "2b: la ayuda no documenta todas las opciones del parser"
sed '/--simular/d' "$TH/larga" > "$TH/incompleta"
if help_documenta_opciones "$TH/incompleta"; then fallo "2b: una ayuda sin --simular pasó la prueba negativa"; fi

# Verifica independencia de Node/modelos en una copia aislada y con PATH mínimo.
mkdir -p "$TH/aislado/bin" "$TH/aislado/home"
cp instalar.sh "$TH/aislado/instalar.sh"
bash_bin=$(command -v bash) || fallo "2b: no encontré bash"
dirname_bin=$(command -v dirname) || fallo "2b: no encontré dirname"
cat_bin=$(command -v cat) || fallo "2b: no encontré cat"
ln -s "$bash_bin" "$TH/aislado/bin/bash"
ln -s "$dirname_bin" "$TH/aislado/bin/dirname"
ln -s "$cat_bin" "$TH/aislado/bin/cat"
PATH="$TH/aislado/bin" HOME="$TH/aislado/home" "$bash_bin" "$TH/aislado/instalar.sh" -h > "$TH/aislado/corta" \
  || fallo "2b: ayuda aislada -h falló sin Node/modelos"
PATH="$TH/aislado/bin" HOME="$TH/aislado/home" "$bash_bin" "$TH/aislado/instalar.sh" --help > "$TH/aislado/larga" \
  || fallo "2b: ayuda aislada --help falló sin Node/modelos"
cmp -s "$TH/aislado/corta" "$TH/aislado/larga" || fallo "2b: alias aislados no son iguales"
echo "ok 2b: alias iguales, opciones dinámicas documentadas, prueba negativa y ayuda aislada sin Node/modelos"

