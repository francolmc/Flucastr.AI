#!/usr/bin/env bash
# Hook de progreso en Claude Code: entradas en .claude/settings.local.json del proyecto (no se sube a git).
# Uso: install-progress-hook.sh instalar|quitar|comprobar <proyecto>
# Solo toca sus propias entradas (marca progress-hook.mjs). Idempotente. El hook nunca bloquea.
set -euo pipefail

accion="${1:-}"
proyecto="${2:-}"
case "$accion" in
  instalar|quitar|comprobar) ;;
  *) echo "uso: install-progress-hook.sh instalar|quitar|comprobar <proyecto>" >&2; exit 2 ;;
esac
if [ -z "$proyecto" ] || [ ! -d "$proyecto" ]; then
  echo "proyecto no existe: $proyecto" >&2
  exit 2
fi

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
HOOK="$RAIZ/adapters/claude-code/progress-hook.mjs"
PROYECTO="$(cd "$proyecto" && pwd)"
AJUSTES="$PROYECTO/.claude/settings.local.json"

read -r -d '' CODIGO <<'JS' || true
const fs = require("node:fs");
const path = require("node:path");
const [accion, ajustes, hook] = process.argv.slice(1);
const MARCA = "progress-hook.mjs";
const MATCHER = "Edit|Write|MultiEdit|Bash";
const EVENTOS = ["PreToolUse", "PostToolUse"];
const comando = "node '" + hook.replaceAll("'", "'\\''") + "'";

function fallar(msg) {
  process.stderr.write(msg + "\n");
  process.exit(1);
}
function esHook(e) {
  return Array.isArray(e?.hooks) && e.hooks.some((h) => typeof h?.command === "string" && h.command.includes(MARCA));
}
// Quita de una entrada nuestros hooks; si no queda ninguno, la entrada se descarta.
function sinHook(e) {
  if (!esHook(e)) return e;
  const hooks = e.hooks.filter((h) => !(typeof h?.command === "string" && h.command.includes(MARCA)));
  return hooks.length ? { ...e, hooks } : null;
}
function instalado(config) {
  return EVENTOS.every((ev) =>
    Array.isArray(config?.hooks?.[ev]) &&
    config.hooks[ev].some((e) => e?.matcher === MATCHER && Array.isArray(e.hooks) && e.hooks.length === 1 && e.hooks[0].command === comando),
  );
}

let config = {};
if (fs.existsSync(ajustes)) {
  try {
    config = JSON.parse(fs.readFileSync(ajustes, "utf8"));
  } catch (e) {
    fallar(`${ajustes} no es JSON válido: ${e.message}`);
  }
}
if (!config || Array.isArray(config) || typeof config !== "object") fallar(`${ajustes} debe contener un objeto`);
const hooks = config.hooks ?? {};
if (!hooks || Array.isArray(hooks) || typeof hooks !== "object") fallar(`${ajustes}: 'hooks' no es un objeto; no lo toco`);
for (const ev of EVENTOS) {
  if (hooks[ev] !== undefined && !Array.isArray(hooks[ev])) fallar(`${ajustes}: 'hooks.${ev}' no es una lista; no lo toco`);
}

function escribir(nuevo) {
  fs.mkdirSync(path.dirname(ajustes), { recursive: true });
  const tmp = ajustes + ".progreso.tmp";
  fs.writeFileSync(tmp, JSON.stringify(nuevo, null, 2) + "\n");
  fs.renameSync(tmp, ajustes);
}

if (accion === "comprobar") {
  process.stdout.write(instalado(config) ? "instalado\n" : "ausente\n");
} else if (accion === "instalar") {
  if (instalado(config)) {
    process.stdout.write("ya-estaba\n");
  } else {
    const nuevosHooks = { ...hooks };
    for (const ev of EVENTOS) {
      const lista = (hooks[ev] ?? []).map(sinHook).filter(Boolean);
      lista.push({ matcher: MATCHER, hooks: [{ type: "command", command: comando }] });
      nuevosHooks[ev] = lista;
    }
    escribir({ ...config, hooks: nuevosHooks });
    if (!instalado(JSON.parse(fs.readFileSync(ajustes, "utf8")))) fallar(`${ajustes}: la entrada escrita no pasó la comprobación`);
    process.stdout.write("fijado\n");
  }
} else if (accion === "quitar") {
  if (!fs.existsSync(ajustes)) {
    process.stdout.write("omitido\n");
  } else {
    const antes = JSON.stringify(config);
    const nuevosHooks = { ...hooks };
    for (const ev of EVENTOS) {
      if (!Array.isArray(hooks[ev])) continue;
      const lista = hooks[ev].map(sinHook).filter(Boolean);
      if (lista.length) nuevosHooks[ev] = lista;
      else delete nuevosHooks[ev];
    }
    if (!Object.keys(nuevosHooks).length) delete config.hooks;
    else config.hooks = nuevosHooks;
    if (JSON.stringify(config) === antes) {
      process.stdout.write("omitido\n");
    } else {
      escribir(config);
      process.stdout.write("quitado\n");
    }
  }
}
JS

exec node -e "$CODIGO" "$accion" "$AJUSTES" "$HOOK"
