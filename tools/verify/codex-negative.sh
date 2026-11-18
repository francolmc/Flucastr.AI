# 3g. pruebas negativas de Codex: sin esfuerzo, esfuerzo distinto, esfuerzo fuera de 'efforts' y perfil faltante deben fallar
echo "-- 3g. pruebas negativas de Codex"
prueba_negativa_codex() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  node scripts/resolver.mjs agente-codex core/agents/builder.md > "$tmp/c.toml" || { echo "FALLO: agente-codex sobre builder falló" >&2; exit 1; }
  # (i) sin model_reasoning_effort: el chequeo debe rechazarlo (builder tiene esfuerzo declarado)
  grep -v '^model_reasoning_effort' "$tmp/c.toml" > "$tmp/sin-esfuerzo.toml"
  if chequear_codex builder "$tmp/sin-esfuerzo.toml" >/dev/null 2>&1; then echo "FALLO: prueba negativa: el chequeo aceptó un TOML sin model_reasoning_effort" >&2; exit 1; fi
  # (ii) con otro effort: el chequeo debe rechazarlo
  sed 's/^model_reasoning_effort = .*/model_reasoning_effort = "max"/' "$tmp/c.toml" > "$tmp/otro-esfuerzo.toml"
  if chequear_codex builder "$tmp/otro-esfuerzo.toml" >/dev/null 2>&1; then echo "FALLO: prueba negativa: el chequeo aceptó un esfuerzo distinto de models.json" >&2; exit 1; fi
  # (iii) esfuerzo 'ultra' fuera de 'efforts': agente-codex falla y nombra el esfuerzo
  node -e 'const f=process.argv[1]; const m=JSON.parse(require("fs").readFileSync(require("path").resolve(process.argv[2]),"utf8")); m.agents.builder.effort="ultra"; require("fs").writeFileSync(f, JSON.stringify(m))' "$tmp/ultra.json" models.json
  if FLUCASTR_MODELOS="$tmp/ultra.json" node scripts/resolver.mjs agente-codex core/agents/builder.md >/dev/null 2>"$tmp/err1"; then echo "FALLO: prueba negativa: agente-codex aceptó el esfuerzo 'ultra'" >&2; exit 1; fi
  grep -q "no está en 'efforts'" "$tmp/err1" || { echo "FALLO: prueba negativa: el rechazo de 'ultra' no nombra el campo" >&2; exit 1; }
  # (iv) sin default_profile.codex: agente-codex falla y nombra el campo
  node -e 'const f=process.argv[1]; const m=JSON.parse(require("fs").readFileSync(require("path").resolve(process.argv[2]),"utf8")); delete m.default_profile.codex; require("fs").writeFileSync(f, JSON.stringify(m))' "$tmp/sinperfil.json" models.json
  if FLUCASTR_MODELOS="$tmp/sinperfil.json" node scripts/resolver.mjs agente-codex core/agents/builder.md >/dev/null 2>"$tmp/err2"; then echo "FALLO: prueba negativa: agente-codex aceptó un models.json sin default_profile.codex" >&2; exit 1; fi
  grep -q "default_profile.codex" "$tmp/err2" || { echo "FALLO: prueba negativa: el rechazo del perfil faltante no nombra el campo" >&2; exit 1; }
  echo "ok 3g: sin esfuerzo, esfuerzo distinto, 'ultra' y perfil faltante de Codex se rechazan con su mensaje"
)
prueba_negativa_codex || fallo "3g: pruebas negativas de Codex"

# 3h. reglas de Codex de proyectos registrados: una instalación normal (sin --project) las refresca; un proyecto borrado solo avisa (HOME temporal)
paso 3h "reglas de Codex de proyectos registrados: instalar las refresca; un proyecto borrado solo avisa"
prueba_refresco_codex() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  unset CODEX_HOME PI_CODING_AGENT_DIR
  H="$tmp/home"; P="$tmp/proj"; R="$P/.codex/rules/flucastr.rules"; M="$tmp/m.json"; MAN="$H/.flucastr-ai/manifiesto.txt"
  mkdir -p "$H/.codex" "$P" || exit 1
  cp models.json "$M" || exit 1
  correr() { # resto: argumentos de install.sh
    ( unset CODEX_HOME PI_CODING_AGENT_DIR; export HOME="$H" FLUCASTR_MODELOS="$M"; bash "$@" ) >"$tmp/log" 2>&1 || { cat "$tmp/log" >&2; echo "FALLO: $* falló" >&2; exit 1; }
  }
  # registro: instalar con --project deja la línea codex-reglas en el manifiesto
  correr install.sh --only codex --copy --project "$P"
  grep -qF "$(printf 'codex-reglas\t%s' "$R")" "$MAN" || { echo "FALLO: el manifiesto no registra las reglas de $R" >&2; exit 1; }
  # (A3) reglas viejas del kit (con marca) en el proyecto registrado; una instalación normal las refresca
  printf '%s\n' '# flucastr-ai:generado - no editar; se regenera con install.sh' 'prefix_rule(pattern = ["viejo"], decision = "allow")' > "$R"
  correr install.sh --only codex --copy
  grep -qF -- 'pattern = ["ls"]' "$R" || { echo "FALLO: instalar no refrescó la lista segura de reglas del proyecto registrado" >&2; exit 1; }
  ! grep -qF -- 'pattern = ["viejo"]' "$R" || { echo "FALLO: instalar conservó la allow obsoleta del proyecto registrado" >&2; exit 1; }
  grep -q 'reglas de Codex actualizadas' "$tmp/log" || { echo "FALLO: instalar no anunció el refresco de las reglas" >&2; exit 1; }
  grep -qF "$(printf 'codex-reglas\t%s' "$R")" "$MAN" || { echo "FALLO: el refresco perdió la línea del registro" >&2; exit 1; }
  echo "ok 3h: instalar sin --project refresca las reglas del proyecto registrado y elimina la allow obsoleta"
  # (A4) proyecto borrado: la instalación avisa, termina bien y conserva el registro
  rm -rf "$P"
  correr install.sh --only codex --copy
  grep -q 'AVISO: el proyecto registrado ya no existe' "$tmp/log" || { echo "FALLO: no avisó del proyecto borrado" >&2; exit 1; }
  grep -qF "$(printf 'codex-reglas\t%s' "$R")" "$MAN" || { echo "FALLO: el proyecto borrado quitó la línea del registro" >&2; exit 1; }
  echo "ok 3h: proyecto registrado borrado: AVISO y exit 0; el registro se conserva"
)
prueba_refresco_codex || fallo "3h: refresco de reglas de Codex en proyectos registrados"

node tests/builder-contract.mjs || fallo "8j: suite determinista del contrato del builder"
