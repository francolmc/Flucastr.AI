# 3f. Codex: TOML de agente y lanzador con modelo y esfuerzo de models.json (max -> xhigh), en el repo y en HOME temporal
paso 3f "Codex: TOML y lanzadores con modelo y esfuerzo; reinstalar refresca; --dry-run no escribe; desinstalar deja lo ajeno; reglas"
# chequear_codex: el TOML trae 'model' y 'model_reasoning_effort' iguales a lo que imprime el resolver; sin esfuerzo, ninguna línea de esfuerzo
chequear_codex() { # $1: nombre del agente; $2: archivo TOML
  local nombre=$1 toml=$2 modelo esfuerzo
  modelo=$(node scripts/resolver.mjs modelo "$nombre" codex) || return 1
  esfuerzo=$(node scripts/resolver.mjs effort "$nombre" codex) || return 1
  grep -qxF "model = \"$modelo\"" "$toml" || { echo "$toml: falta model = \"$modelo\""; return 1; }
  if [ -n "$esfuerzo" ]; then
    grep -qxF "model_reasoning_effort = \"$esfuerzo\"" "$toml" || { echo "$toml: falta model_reasoning_effort = \"$esfuerzo\""; return 1; }
  elif grep -q '^model_reasoning_effort' "$toml"; then
    echo "$toml: sale model_reasoning_effort sin esfuerzo declarado"; return 1
  fi
}
# generación desde el repo: cada agente sale como TOML válido con modelo y esfuerzo de models.json
for ruta in core/agents/*.md; do
  nombre=$(basename "$ruta" .md)
  tf=$(mktemp) || fallo "3f: no pude crear el temporal"
  node scripts/resolver.mjs agente-codex "$ruta" > "$tf" || { rm -f "$tf"; fallo "3f: agente-codex $ruta falló"; }
  chequear_codex "$nombre" "$tf" || { rm -f "$tf"; fallo "3f: el TOML de Codex de $nombre no coincide con models.json"; }
  rm -f "$tf"
  echo "ok $nombre codex TOML (modelo y esfuerzo de models.json)"
done
prueba_codex() (
  tmp=$(mktemp -d) || { echo "FALLO: no pude crear el temporal" >&2; exit 1; }
  trap '[ -n "${tmp:-}" ] && rm -rf "$tmp"' EXIT
  unset CODEX_HOME PI_CODING_AGENT_DIR
  H="$tmp/home"; H2="$tmp/home2"; P="$tmp/proj"; M="$tmp/m.json"; F="$tmp/fake"; R="$P/.codex/rules/flucastr.rules"
  mkdir -p "$H/.codex" "$H2/.codex" "$P/.codex/rules" "$F"
  # codex de prueba: imprime cada argumento en su línea; no llama a ningún modelo
  printf '%s\n' '#!/usr/bin/env bash' 'for a in "$@"; do printf "[%s]\n" "$a"; done' > "$F/codex"
  chmod +x "$F/codex"
  # regla ajena en el proyecto: sin marca del kit, debe sobrevivir a instalar y desinstalar
  printf '%s\n' '# regla ajena' > "$P/.codex/rules/otra.rules"
  poner_esfuerzo() { node -e 'const f=process.argv[1]; const m=require(require("path").resolve(process.argv[2])); m.agents.builder.effort=process.argv[3]; require("fs").writeFileSync(f, JSON.stringify(m))' "$M" models.json "$1"; }
  correr() { # $1: HOME; resto: argumentos de install.sh o uninstall.sh
    local h=$1; shift
    ( unset CODEX_HOME PI_CODING_AGENT_DIR; export HOME="$h" FLUCASTR_MODELOS="$M"; bash "$@" ) >"$tmp/log" 2>&1 || { cat "$tmp/log" >&2; echo "FALLO: $* falló" >&2; exit 1; }
  }
  fingerprint() { { find "$1" -print; find "$1" -type f -exec shasum {} +; } | sort; } # sin seguir enlaces: el HOME tiene un enlace a la raíz del kit

  # (1) instalar con max: TOML y lanzador con xhigh, reglas del proyecto
  poner_esfuerzo max
  correr "$H" install.sh --only codex --copy --project "$P"
  ( export FLUCASTR_MODELOS="$M"; chequear_codex builder "$H/.codex/agents/builder.toml" && chequear_codex planner "$H/.codex/agents/planner.toml" ) \
    || { echo "FALLO: el TOML de Codex instalado no coincide con models.json" >&2; exit 1; }
  esf=$(FLUCASTR_MODELOS="$M" node scripts/resolver.mjs effort builder codex) || exit 1
  [ "$esf" = xhigh ] || { echo "FALLO: max no se tradujo a xhigh para Codex (salió «$esf»)" >&2; exit 1; }
  modelo=$(FLUCASTR_MODELOS="$M" node scripts/resolver.mjs modelo builder codex) || exit 1
  salida=$(PATH="$F:$PATH" HOME="$H" "$H/.local/bin/codex-builder" extra) || { echo "FALLO: codex-builder falló con el codex de prueba" >&2; exit 1; }
  grep -qxF "[$modelo]" <<<"$salida" || { echo "FALLO: codex-builder no pasa -m $modelo" >&2; exit 1; }
  grep -qxF '[model_reasoning_effort="xhigh"]' <<<"$salida" || { echo "FALLO: codex-builder no pasa model_reasoning_effort=xhigh" >&2; exit 1; }
  grep -qxF '[--sandbox]' <<<"$salida" || { echo "FALLO: codex-builder no fija sandbox" >&2; exit 1; }
  grep -qxF '[workspace-write]' <<<"$salida" || { echo "FALLO: codex-builder no usa workspace-write" >&2; exit 1; }
  grep -qxF '[-c]' <<<"$salida" || { echo "FALLO: codex-builder no fija aprobaciones" >&2; exit 1; }
  grep -qxF '[approval_policy="on-request"]' <<<"$salida" || { echo "FALLO: codex-builder no usa aprobaciones on-request" >&2; exit 1; }
  grep -qxF '[extra]' <<<"$salida" || { echo "FALLO: codex-builder no reenvía los argumentos" >&2; exit 1; }
  echo "ok 3f: TOML y lanzador Codex; modelo/esfuerzo, workspace-write, aprobaciones on-request y argumentos"

  # (1b) umbral de compactación: compact_at de models.json va en codex-builder una sola vez; sin compact_at no aparece
  umbral=$(FLUCASTR_MODELOS="$M" node scripts/resolver.mjs compactar-codex builder) || exit 1
  [ -n "$umbral" ] || { echo "FALLO: compactar-codex no sacó el umbral de compact_at" >&2; exit 1; }
  grep -qxF "[model_auto_compact_token_limit=$umbral]" <<<"$salida" || { echo "FALLO: codex-builder no pasa model_auto_compact_token_limit=$umbral" >&2; exit 1; }
  [ "$(grep -c model_auto_compact_token_limit "$H/.local/bin/codex-builder")" = 1 ] || { echo "FALLO: codex-builder no trae exactamente 1 umbral de compactación" >&2; exit 1; }
  M2="$tmp/m-sin-compactar.json"; H3="$tmp/home3"; mkdir -p "$H3/.codex"
  node -e 'const fs=require("fs"); const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); delete m.compact_at; for (const p of Object.values(m.profiles)) delete p.compact_at; fs.writeFileSync(process.argv[2], JSON.stringify(m))' "$M" "$M2" || exit 1
  ( unset CODEX_HOME PI_CODING_AGENT_DIR; export HOME="$H3" FLUCASTR_MODELOS="$M2"; PATH="$F:$PATH" bash install.sh --only codex --copy ) >"$tmp/log3" 2>&1 || { cat "$tmp/log3" >&2; echo "FALLO: instalar con modelos sin compact_at falló" >&2; exit 1; }
  [ -f "$H3/.local/bin/codex-builder" ] || { echo "FALLO: sin compact_at no se generó codex-builder" >&2; exit 1; }
  if grep -q model_auto_compact_token_limit "$H3/.local/bin/codex-builder"; then echo "FALLO: sin compact_at el lanzador trae umbral de compactación" >&2; exit 1; fi
  echo "ok 3f: compact_at de models.json va en codex-builder una sola vez (reinstalar no duplica); sin compact_at no aparece"

  # (1c) por agente: planner compacta con agents.planner.compact_at; builder con el general. Ambos lanzadores traen la espera larga de comandos.
  esp_p=$(node -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(m.agents.planner.compact_at ?? ""))' "$M") || exit 1
  esp_c=$(node -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(m.compact_at ?? ""))' "$M") || exit 1
  umbral_p=$(FLUCASTR_MODELOS="$M" node scripts/resolver.mjs compactar-codex planner) || exit 1
  [ -n "$esp_p" ] && [ "$umbral_p" = "$esp_p" ] || { echo "FALLO: compactar-codex planner salió «$umbral_p», models.json dice «$esp_p»" >&2; exit 1; }
  [ "$umbral" = "$esp_c" ] || { echo "FALLO: compactar-codex builder salió «$umbral», el general de models.json es «$esp_c»" >&2; exit 1; }
  salida_p=$(PATH="$F:$PATH" HOME="$H" "$H/.local/bin/codex-planner" extra) || { echo "FALLO: codex-planner falló con el codex de prueba" >&2; exit 1; }
  grep -qxF "[model_auto_compact_token_limit=$esp_p]" <<<"$salida_p" || { echo "FALLO: codex-planner no pasa model_auto_compact_token_limit=$esp_p" >&2; exit 1; }
  for s in "$salida" "$salida_p"; do
    grep -qxF '[background_terminal_max_timeout=1800000]' <<<"$s" || { echo "FALLO: un lanzador de Codex no pasa background_terminal_max_timeout=1800000" >&2; exit 1; }
  done
  echo "ok 3f: umbral por agente (planner $esp_p, builder $esp_c general) y espera larga de comandos en ambos lanzadores"

  # (2) estructura y comportamiento: las reglas allow se validan contra la lista generada;
  # no se fija una cantidad que cambie con las capacidades seguras disponibles.
  node --test tests/permissions-contract/structure.test.mjs || { echo "FALLO: estructura de reglas Codex" >&2; exit 1; }
  grep -qxF '# regla ajena' "$P/.codex/rules/otra.rules" || { echo "FALLO: la regla ajena cambió tras instalar" >&2; exit 1; }
  if command -v codex >/dev/null 2>&1; then
    politica() { env HOME="$H" CODEX_HOME="$H/.codex" codex execpolicy check --rules "$R" -- "$@" 2>/dev/null || true; }
    for c in "git commit -m x" "git push origin x" "git merge x" "gh pr create" "gh pr merge 1" "git -C . commit -m x" "git -c k=v commit -m x" "bash -c git commit -m x" "sh -c git commit -m x" "zsh -c git commit -m x"; do
      out=$(politica $c)
      grep -qE '"decision": ?"forbidden"' <<<"$out" || { echo "FALLO: execpolicy no bloquea «$c»: $out" >&2; exit 1; }
    done
    for c in "./verify" "VERIFY_RAPIDO=1 ./verify" "npm test" "npm run build" "git fetch" "git status" "git diff" "docker ps" "docker info" "docker compose build" "docker compose up" "docker compose run" "docker compose ps" "docker compose logs" "docker compose stop" "docker compose down" "pnpm install" "pnpm lint" "pnpm test" "pnpm build" "pnpm typecheck"; do
      out=$(politica $c)
      if grep -qE '"decision": ?"allow"' <<<"$out"; then echo "FALLO: execpolicy permite sin allow seguro «$c»: $out" >&2; exit 1; fi
    done
    out=$(politica ls)
    grep -qE '"decision": ?"allow"' <<<"$out" || { echo "FALLO: execpolicy no permite el único allow seguro ls: $out" >&2; exit 1; }
    for c in "docker run x" "docker system prune" "docker volume rm x" "bash -lc git status" "node -e process.exit\(0\)" "python -c pass"; do
      out=$(politica $c)
      if grep -qE 'forbidden|"decision": ?"allow"' <<<"$out"; then echo "FALLO: execpolicy decide algo sobre «$c» sin deberlo: $out" >&2; exit 1; fi
    done
    echo "ok 3f: execpolicy conserva las denegaciones protegidas, solo permite ls, y no autoriza pruebas, Docker ni intérpretes por prefijo"
  else
    echo "AVISO 3f: codex no está en el PATH; las reglas no se comprobaron con execpolicy"
  fi

  # (3) reinstalar con low: el TOML y el lanzador se refrescan
  poner_esfuerzo low
  correr "$H" install.sh --only codex --copy --project "$P"
  ( export FLUCASTR_MODELOS="$M"; chequear_codex builder "$H/.codex/agents/builder.toml" ) \
    || { echo "FALLO: reinstalar no refrescó el TOML del builder a low" >&2; exit 1; }
  grep -qF -- 'model_reasoning_effort="low"' "$H/.local/bin/codex-builder" || { echo "FALLO: reinstalar no refrescó codex-builder a low" >&2; exit 1; }
  [ "$(grep -c model_auto_compact_token_limit "$H/.local/bin/codex-builder")" = 1 ] || { echo "FALLO: reinstalar duplicó el umbral de compactación en codex-builder" >&2; exit 1; }
  echo "ok 3f: reinstalar con low refresca el TOML y codex-builder, sin duplicar el umbral"

  # (4) reinstalar sin cambios no altera el HOME ni el proyecto
  antes=$(fingerprint "$H"); antes_p=$(fingerprint "$P")
  correr "$H" install.sh --only codex --copy --project "$P"
  [ "$antes" = "$(fingerprint "$H")" ] || { diff <(echo "$antes") <(fingerprint "$H") >&2; echo "FALLO: reinstalar sin cambios alteró el HOME" >&2; exit 1; }
  [ "$antes_p" = "$(fingerprint "$P")" ] || { echo "FALLO: reinstalar sin cambios alteró el proyecto" >&2; exit 1; }
  echo "ok 3f: reinstalar sin cambios no altera el HOME ni el proyecto"

  # (5) --dry-run en un HOME limpio: anuncia el TOML y no escribe nada
  antes2=$(fingerprint "$H2"); antes2_p=$(fingerprint "$P")
  correr "$H2" install.sh --only codex --copy --project "$P" --dry-run
  grep -q 'agente generado: .*builder.toml' "$tmp/log" || { echo "FALLO: --dry-run no anunció el TOML del builder" >&2; exit 1; }
  [ "$antes2" = "$(fingerprint "$H2")" ] || { echo "FALLO: --dry-run escribió en el HOME" >&2; exit 1; }
  [ "$antes2_p" = "$(fingerprint "$P")" ] || { echo "FALLO: --dry-run escribió en el proyecto" >&2; exit 1; }
  echo "ok 3f: --dry-run anuncia el TOML y no escribe en el HOME ni en el proyecto"

  # (6) desinstalar: se quita lo del kit y queda lo ajeno (TOML, skill y regla sin marca)
  printf '%s\n' 'ajeno' > "$H/.codex/agents/ajeno.toml"; cp "$H/.codex/agents/ajeno.toml" "$tmp/ajeno.orig"
  mkdir -p "$H/.agents/skills/ajena"; printf '%s\n' 'ajena' > "$H/.agents/skills/ajena/SKILL.md"
  correr "$H" uninstall.sh
  for f in "$H/.codex/agents/builder.toml" "$H/.codex/agents/planner.toml" "$H/.local/bin/codex-builder" "$H/.local/bin/codex-planner" "$H/.agents/skills/execute-plan" "$R"; do
    if [ -e "$f" ] || [ -L "$f" ]; then echo "FALLO: desinstalar dejó $f" >&2; exit 1; fi
  done
  cmp -s "$H/.codex/agents/ajeno.toml" "$tmp/ajeno.orig" || { echo "FALLO: desinstalar tocó ajeno.toml" >&2; exit 1; }
  [ -f "$H/.agents/skills/ajena/SKILL.md" ] || { echo "FALLO: desinstalar quitó la skill ajena" >&2; exit 1; }
  [ -f "$P/.codex/rules/otra.rules" ] || { echo "FALLO: desinstalar quitó otra.rules" >&2; exit 1; }
  echo "ok 3f: desinstalar quita los TOML, lanzadores, skills y reglas del kit; deja ajeno.toml, la skill ajena y otra.rules"
)
prueba_codex || fallo "3f: Codex en HOME temporal"

