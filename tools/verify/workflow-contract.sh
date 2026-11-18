# 8e. plazos: VERIFY_RAPIDO en referencia.md, prohibición de docker system prune en principal.md, timeoutMs en constructor.md; una copia sin VERIFY_RAPIDO debe fallar
textos_plazos() { # $1: raíz del kit
  local r=$1
  grep -qF 'VERIFY_RAPIDO' "$r/skills/preparar-proyecto/referencia.md" || return 1
  grep -qF 'docker system prune' "$r/agentes/principal.md" || return 1
  grep -qF 'timeoutMs' "$r/agentes/constructor.md" || return 1
}
textos_plazos . || fallo "8e: falta algún texto de plazos"
pneg="$T8/pneg"
mkdir -p "$pneg/skills/preparar-proyecto" "$pneg/agentes"
cp agentes/principal.md agentes/constructor.md "$pneg/agentes/"
sed 's/VERIFY_RAPIDO/VERIFY_X/g' skills/preparar-proyecto/referencia.md > "$pneg/skills/preparar-proyecto/referencia.md"
if textos_plazos "$pneg"; then fallo "8e: una copia sin VERIFY_RAPIDO pasó la comprobación"; fi
node scripts/resolver.mjs agente-claude agentes/constructor.md | grep -q '^timeoutMs: ' || fallo "8e: el agente de Claude no resuelve con timeoutMs"
echo "ok 8e: VERIFY_RAPIDO, docker system prune prohibido y timeoutMs presentes; el agente de Claude resuelve; copia sin VERIFY_RAPIDO falla"

# 8f. closure ceremony y base limpia: principal, constructor y ejecutar-plan; una copia de principal sin «closure ceremony» debe fallar
textos_cierre() { # $1: raíz del kit
  local r=$1
  grep -qF 'closure ceremony' "$r/agentes/principal.md" || return 1
  grep -qF 'open a PR' "$r/agentes/principal.md" || return 1
  grep -qF 'git status' "$r/skills/ejecutar-plan/SKILL.md" || return 1
  grep -qF 'base branch' "$r/skills/ejecutar-plan/SKILL.md" || return 1
}
textos_cierre . || fallo "8f: falta algún texto de cierre o base limpia"
cierre_neg="$T8/cierre_neg"
mkdir -p "$cierre_neg/skills/ejecutar-plan" "$cierre_neg/agentes"
cp agentes/constructor.md "$cierre_neg/agentes/"
cp skills/ejecutar-plan/SKILL.md "$cierre_neg/skills/ejecutar-plan/"
sed 's/closure ceremony/cierre/g' agentes/principal.md > "$cierre_neg/agentes/principal.md"
if textos_cierre "$cierre_neg"; then fallo "8f: un principal sin «closure ceremony» pasó la comprobación"; fi
echo "ok 8f: closure ceremony, open a PR y base branch presentes; copia sin «closure ceremony» falla"

# 8g. ejecutor por prueba de ejecutabilidad: planificar-cambio y principal; una copia de planificar-cambio sin «executability test» debe fallar
textos_prueba() { # $1: raíz del kit
  local r=$1
  grep -qF 'executability test' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'Executability Test' "$r/agentes/principal.md" || return 1
  grep -qF 'load `ejecutar-plan`' "$r/agentes/principal.md" || return 1
}
textos_prueba . || fallo "8g: falta algún texto de la prueba de ejecutabilidad"
prueba_neg="$T8/prueba_neg"
mkdir -p "$prueba_neg/skills/planificar-cambio" "$prueba_neg/agentes"
cp agentes/principal.md "$prueba_neg/agentes/"
sed 's/executability test/Prueba/g' skills/planificar-cambio/SKILL.md > "$prueba_neg/skills/planificar-cambio/SKILL.md"
if textos_prueba "$prueba_neg"; then fallo "8g: una copia sin «executability test» pasó la comprobación"; fi
echo "ok 8g: executability test en planificar-cambio y principal, y carga de ejecutar-plan presentes; copia sin la prueba falla"

# 8h. base branch: planificar-cambio, principal y skill de ejecución
textos_base() { # $1: raíz del kit
  local r=$1
  grep -qF 'base:' "$r/skills/planificar-cambio/SKILL.md" || return 1
  grep -qF 'targeting `base:`' "$r/agentes/principal.md" || return 1
  grep -qF 'base:' "$r/skills/ejecutar-plan/SKILL.md" || return 1
}
textos_base . || fallo "8h: falta algún texto de base branch"
base_neg="$T8/base_neg"
mkdir -p "$base_neg/skills/planificar-cambio" "$base_neg/skills/ejecutar-plan" "$base_neg/agentes"
cp skills/planificar-cambio/SKILL.md "$base_neg/skills/planificar-cambio/"
cp agentes/principal.md "$base_neg/agentes/"
sed '/base:/d' skills/ejecutar-plan/SKILL.md > "$base_neg/skills/ejecutar-plan/SKILL.md"
if textos_base "$base_neg"; then fallo "8h: una copia sin base branch pasó la comprobación"; fi
echo "ok 8h: base branch documentada; copia sin base falla"

