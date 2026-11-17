# 5. instalar.sh --simular no escribe lo que instala
paso 5 "instalar.sh --simular no escribe lo que instala"
autoprueba_5a || exit 1
echo "-- 5b. instalar.sh --simular sobre el home real"
antes=$(instantanea) || fallo "no pude tomar la instantánea previa"
bash instalar.sh --simular >/dev/null || fallo "instalar.sh --simular salió con error"
despues=$(instantanea) || fallo "no pude tomar la instantánea posterior"
if [ "$antes" != "$despues" ]; then
  diff <(printf '%s\n' "$antes") <(printf '%s\n' "$despues") >&2 || true
  fallo "instalar.sh --simular cambió lo que instala (ver diff arriba)"
fi
echo "ok instantánea sin cambios ($(printf '%s\n' "$despues" | grep -c .) líneas)"
