# 3g. pruebas negativas de Codex: sin esfuerzo, esfuerzo distinto, esfuerzo fuera de 'esfuerzos' y perfil faltante deben fallar
echo "-- 3g. pruebas negativas de Codex"
prueba_negativa_codex() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  node scripts/resolver.mjs agente-codex agentes/constructor.md > "$tmp/c.toml" || { echo "FALLO: agente-codex sobre constructor falló" >&2; exit 1; }
  # (i) sin model_reasoning_effort: el chequeo debe rechazarlo (constructor tiene esfuerzo declarado)
  grep -v '^model_reasoning_effort' "$tmp/c.toml" > "$tmp/sin-esfuerzo.toml"
  if chequear_codex constructor "$tmp/sin-esfuerzo.toml" >/dev/null 2>&1; then echo "FALLO: prueba negativa: el chequeo aceptó un TOML sin model_reasoning_effort" >&2; exit 1; fi
  # (ii) con otro esfuerzo: el chequeo debe rechazarlo
  sed 's/^model_reasoning_effort = .*/model_reasoning_effort = "max"/' "$tmp/c.toml" > "$tmp/otro-esfuerzo.toml"
  if chequear_codex constructor "$tmp/otro-esfuerzo.toml" >/dev/null 2>&1; then echo "FALLO: prueba negativa: el chequeo aceptó un esfuerzo distinto de modelos.json" >&2; exit 1; fi
  # (iii) esfuerzo 'ultra' fuera de 'esfuerzos': agente-codex falla y nombra el esfuerzo
  node -e 'const f=process.argv[1]; const m=JSON.parse(require("fs").readFileSync(require("path").resolve(process.argv[2]),"utf8")); m.agentes.constructor.esfuerzo="ultra"; require("fs").writeFileSync(f, JSON.stringify(m))' "$tmp/ultra.json" modelos.json
  if FLUCASTR_MODELOS="$tmp/ultra.json" node scripts/resolver.mjs agente-codex agentes/constructor.md >/dev/null 2>"$tmp/err1"; then echo "FALLO: prueba negativa: agente-codex aceptó el esfuerzo 'ultra'" >&2; exit 1; fi
  grep -q "no está en 'esfuerzos'" "$tmp/err1" || { echo "FALLO: prueba negativa: el rechazo de 'ultra' no nombra el campo" >&2; exit 1; }
  # (iv) sin perfil_por_defecto.codex: agente-codex falla y nombra el campo
  node -e 'const f=process.argv[1]; const m=JSON.parse(require("fs").readFileSync(require("path").resolve(process.argv[2]),"utf8")); delete m.perfil_por_defecto.codex; require("fs").writeFileSync(f, JSON.stringify(m))' "$tmp/sinperfil.json" modelos.json
  if FLUCASTR_MODELOS="$tmp/sinperfil.json" node scripts/resolver.mjs agente-codex agentes/constructor.md >/dev/null 2>"$tmp/err2"; then echo "FALLO: prueba negativa: agente-codex aceptó un modelos.json sin perfil_por_defecto.codex" >&2; exit 1; fi
  grep -q "perfil_por_defecto.codex" "$tmp/err2" || { echo "FALLO: prueba negativa: el rechazo del perfil faltante no nombra el campo" >&2; exit 1; }
  echo "ok 3g: sin esfuerzo, esfuerzo distinto, 'ultra' y perfil faltante de Codex se rechazan con su mensaje"
)
prueba_negativa_codex || fallo "3g: pruebas negativas de Codex"

# 3h. reglas de Codex de proyectos registrados: una instalación normal (sin --proyecto) las refresca; un proyecto borrado solo avisa (HOME temporal)
paso 3h "reglas de Codex de proyectos registrados: instalar las refresca; un proyecto borrado solo avisa"
prueba_refresco_codex() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  unset CODEX_HOME PI_CODING_AGENT_DIR
  H="$tmp/home"; P="$tmp/proj"; R="$P/.codex/rules/flucastr.rules"; M="$tmp/m.json"; MAN="$H/.flucastr-ai/manifiesto.txt"
  mkdir -p "$H/.codex" "$P" || exit 1
  cp modelos.json "$M" || exit 1
  correr() { # resto: argumentos de instalar.sh
    ( unset CODEX_HOME PI_CODING_AGENT_DIR; export HOME="$H" FLUCASTR_MODELOS="$M"; bash "$@" ) >"$tmp/log" 2>&1 || { cat "$tmp/log" >&2; echo "FALLO: $* falló" >&2; exit 1; }
  }
  # registro: instalar con --proyecto deja la línea codex-reglas en el manifiesto
  correr instalar.sh --solo codex --copiar --proyecto "$P"
  grep -qF "$(printf 'codex-reglas\t%s' "$R")" "$MAN" || { echo "FALLO: el manifiesto no registra las reglas de $R" >&2; exit 1; }
  # (A3) reglas viejas del kit (con marca) en el proyecto registrado; una instalación normal las refresca
  printf '%s\n' '# flucastr-ai:generado - no editar; se regenera con instalar.sh' 'prefix_rule(pattern = ["viejo"], decision = "allow")' > "$R"
  correr instalar.sh --solo codex --copiar
  grep -qF -- 'pattern = ["ls"]' "$R" || { echo "FALLO: instalar no refrescó la lista segura de reglas del proyecto registrado" >&2; exit 1; }
  ! grep -qF -- 'pattern = ["viejo"]' "$R" || { echo "FALLO: instalar conservó la allow obsoleta del proyecto registrado" >&2; exit 1; }
  grep -q 'reglas de Codex actualizadas' "$tmp/log" || { echo "FALLO: instalar no anunció el refresco de las reglas" >&2; exit 1; }
  grep -qF "$(printf 'codex-reglas\t%s' "$R")" "$MAN" || { echo "FALLO: el refresco perdió la línea del registro" >&2; exit 1; }
  echo "ok 3h: instalar sin --proyecto refresca las reglas del proyecto registrado y elimina la allow obsoleta"
  # (A4) proyecto borrado: la instalación avisa, termina bien y conserva el registro
  rm -rf "$P"
  correr instalar.sh --solo codex --copiar
  grep -q 'AVISO: el proyecto registrado ya no existe' "$tmp/log" || { echo "FALLO: no avisó del proyecto borrado" >&2; exit 1; }
  grep -qF "$(printf 'codex-reglas\t%s' "$R")" "$MAN" || { echo "FALLO: el proyecto borrado quitó la línea del registro" >&2; exit 1; }
  echo "ok 3h: proyecto registrado borrado: AVISO y exit 0; el registro se conserva"
)
prueba_refresco_codex || fallo "3h: refresco de reglas de Codex en proyectos registrados"

node pruebas/contrato-constructor.mjs || fallo "8j: suite determinista del contrato del constructor"
