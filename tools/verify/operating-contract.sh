# 8c. contrato operativo: skill única, contador canónico y recuperación; revisión de texto es regresión auxiliar
textos_contrato() { # $1: raíz del kit
  local r=$1 f
  grep -qF 'bash pendientes-plan' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -qF 'awk' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -qF 'siguiente=' "$r/agentes/constructor.md" || return 1
  grep -qF 'no_intentado=' "$r/agentes/constructor.md" || return 1
  grep -qF '3 corridas' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -qF 'git diff' "$r/agentes/principal.md" || return 1
  grep -qF 'Lee y sigue la skill `ejecutar-plan`' "$r/agentes/constructor.md" || return 1
  grep -qF 'status`, `diff`, `branch --show-current`, `rev-parse --verify --quiet` y `symbolic-ref' "$r/agentes/constructor.md" || return 1
  grep -qF 'relecturas relevantes tras cambios o recuperación' "$r/agentes/constructor.md" || return 1
  if grep -qF "grep -c '^- \[ \]'" "$r/agentes/constructor.md"; then return 1; fi
  if grep -qF 'no releas lo ya leído' "$r/agentes/constructor.md" || grep -qF 'Git permitido, solo en las carpetas de `repos:`' "$r/agentes/constructor.md"; then return 1; fi
}
textos_contrato . || fallo "8c: falta algún texto del contrato del constructor"
cneg="$T8/cneg"
mkdir -p "$cneg/agentes" "$cneg/skills/ejecutar-plan"
restaurar_cneg() {
  cp agentes/constructor.md agentes/principal.md "$cneg/agentes/"
  cp skills/ejecutar-plan/SKILL.md "$cneg/skills/ejecutar-plan/"
}
restaurar_cneg
textos_contrato "$cneg" || fallo "8c: baseline positivo del fixture temporal falló"
sed '/bash pendientes-plan/d' skills/ejecutar-plan/SKILL.md > "$cneg/skills/ejecutar-plan/SKILL.md"
if textos_contrato "$cneg"; then fallo "8c: skill sin contador canónico pasó la comprobación"; fi
echo "ok 8c negativa 1: skill sin contador rechazado"
restaurar_cneg
textos_contrato "$cneg" || fallo "8c: baseline positivo antes de whitelist Git falló"
printf '\n- Git permitido, solo en las carpetas de `repos:`: branch --show-current y rev-parse.\n' >> "$cneg/agentes/constructor.md"
if textos_contrato "$cneg"; then fallo "8c: whitelist Git obsoleta pasó la comprobación"; fi
echo "ok 8c negativa 2: whitelist Git obsoleta rechazada"
restaurar_cneg
textos_contrato "$cneg" || fallo "8c: baseline positivo antes de prohibición de relectura falló"
printf '\n- no releas lo ya leído.\n' >> "$cneg/agentes/constructor.md"
if textos_contrato "$cneg"; then fallo "8c: prohibición de relectura obsoleta pasó la comprobación"; fi
echo "ok 8c negativa 3: prohibición de relectura obsoleta rechazada"
echo "ok 8c: contador canónico y negativas aisladas de los límites antiguos"

# 8d. ejecutor y pasos atómicos: planificar-cambio, principal y README; una copia de planificar-cambio sin ejecutor: debe fallar
textos_ejecutor() { # $1: raíz del kit
  local r=$1
  grep -qF 'ejecutor:' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF '20 palabras' "$r/skills/planificar-cambio/SKILL.md" || return 1
  if grep -qF '60 palabras' "$r/skills/planificar-cambio/SKILL.md"; then return 1; fi
  grep -qF 'ejecutor: principal' "$r/agentes/principal.md" || return 1
  grep -qF 'claude-constructor' "$r/agentes/principal.md" || return 1
  grep -qF 'pi-constructor' "$r/README.md" || return 1
}
textos_ejecutor . || fallo "8d: falta algún texto de ejecutor o de pasos atómicos"
eneg="$T8/eneg"
mkdir -p "$eneg/skills/planificar-cambio" "$eneg/agentes"
cp agentes/principal.md "$eneg/agentes/"
cp README.md "$eneg/"
sed 's/ejecutor:/ejecutor/g' skills/planificar-cambio/SKILL.md > "$eneg/skills/planificar-cambio/SKILL.md"
if textos_ejecutor "$eneg"; then fallo "8d: una copia de planificar-cambio sin ejecutor: pasó la comprobación"; fi
echo "ok 8d: ejecutor:, 20 palabras (sin 60 palabras), ventana propia y pi-constructor presentes; copia sin ejecutor: falla"

