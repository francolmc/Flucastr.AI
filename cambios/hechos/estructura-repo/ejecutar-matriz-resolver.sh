#!/usr/bin/env bash
set -euo pipefail
STAGE=$(mktemp -d)
WORK=$STAGE/work
REFERENCE=${MATRIX_REFERENCE:-cambios/estructura-repo/matriz-resolver.jsonl}
REFERENCE=$(realpath "$REFERENCE")
BASELINE=$STAGE/matriz-referencia.jsonl
mkdir -p "$WORK/scripts" "$WORK/tools/resolver" "$WORK/tools/model-resolution" "$WORK/adapters/shared" "$WORK/adapters/pi" "$WORK/adapters/claude-code" "$WORK/adapters/codex"
cp "$REFERENCE" "$BASELINE"
cp scripts/resolver.mjs "$WORK/scripts/resolver.mjs"
cp adapters/pi/file-lock.mjs "$WORK/adapters/pi/file-lock.mjs"
cp adapters/pi/agent-tools.mjs "$WORK/adapters/pi/agent-tools.mjs"
cp adapters/pi/compaction-plan.mjs "$WORK/adapters/pi/compaction-plan.mjs"
cp adapters/pi/compaction.mjs "$WORK/adapters/pi/compaction.mjs"
cp adapters/claude-code/compaction.mjs "$WORK/adapters/claude-code/compaction.mjs"
cp adapters/claude-code/hook.mjs "$WORK/adapters/claude-code/hook.mjs"
cp adapters/claude-code/settings-path.mjs "$WORK/adapters/claude-code/settings-path.mjs"
cp adapters/claude-code/deny.mjs "$WORK/adapters/claude-code/deny.mjs"
cp adapters/claude-code/sandbox.mjs "$WORK/adapters/claude-code/sandbox.mjs"
cp adapters/codex/deny.mjs "$WORK/adapters/codex/deny.mjs"
cp adapters/codex/agent.mjs "$WORK/adapters/codex/agent.mjs"
cp adapters/shared/markdown-agent.mjs "$WORK/adapters/shared/markdown-agent.mjs"
cp tools/resolver/errors.mjs "$WORK/tools/resolver/errors.mjs"
cp tools/resolver/object.mjs "$WORK/tools/resolver/object.mjs"
cp tools/resolver/json-settings.mjs "$WORK/tools/resolver/json-settings.mjs"
cp tools/resolver/atomic-write.mjs "$WORK/tools/resolver/atomic-write.mjs"
cp tools/resolver/agent-header.mjs "$WORK/tools/resolver/agent-header.mjs"
cp tools/resolver/config-commands.mjs "$WORK/tools/resolver/config-commands.mjs"
cp tools/model-resolution/models.mjs "$WORK/tools/model-resolution/models.mjs"
cp modelos.json "$WORK/modelos.json"
cp cambios/estructura-repo/capturar-matriz-resolver.mjs "$WORK/capturar-matriz-resolver.mjs"
NODE_BIN=$(realpath "$(command -v node)")
MOUNTS=()
for dir in /bin /lib /lib64; do
  if [ -e "$dir" ]; then MOUNTS+=(--ro-bind "$dir" "$dir"); fi
done
MOUNTS+=(--ro-bind "$NODE_BIN" /runtime/node)
run_isolated() {
  printf 'set -euo pipefail\n%s\n' "$1" | bwrap --unshare-all --die-with-parent --ro-bind /usr /usr \
    --proc /proc --dev /dev --tmpfs /tmp \
    --dir /home --dir /home/test --dir /runtime --dir /reference \
    "${MOUNTS[@]}" \
    --ro-bind "$BASELINE" /reference/matriz-resolver.jsonl \
    --bind "$WORK" /work --chdir /work --clearenv \
    --setenv HOME /home/test --setenv PATH /runtime:/usr/bin:/bin --setenv LANG C.UTF-8 --setenv TZ UTC \
    /usr/bin/bash
}
run_isolated 'node /work/capturar-matriz-resolver.mjs > /work/matriz-1.jsonl; node /work/capturar-matriz-resolver.mjs > /work/matriz-2.jsonl; cmp /reference/matriz-resolver.jsonl /work/matriz-1.jsonl; cmp /work/matriz-1.jsonl /work/matriz-2.jsonl'
node --input-type=module - "$WORK/matriz-1.jsonl" <<'NODE'
import { readFileSync } from "node:fs";
const records = readFileSync(process.argv[2], "utf8").trim().split("\n").map((line) => JSON.parse(line));
const required = [
  "compactacion-pi-simular-repetir-quitar",
  "compactacion-claude-simular-repetir-quitar",
  "fijar-hook-claude-ausente-simular-repetir-quitar",
  "fijar-deny-claude-ausente-simular-repetir-quitar",
];
for (const id of required) {
  const record = records.find((entry) => entry.id === id);
  if (!record || record.results.length < 3 || record.results.some((result) => result.code !== 0)) {
    throw new Error(`${id}: faltan operaciones exitosas de fijar/quitar`);
  }
  for (const result of record.results) {
    if (result.tree.some((entry) => entry.path.includes(".flucastr-") && entry.path.endsWith(".tmp"))) {
      throw new Error(`${id}: quedó un temporal tras una operación exitosa`);
    }
  }
}
console.log("Casos de fijar/quitar: hashes binarios comparados con referencia; sin temporales tras éxito.");
NODE
printf 'Matriz del resolver coincide con la referencia en dos ejecuciones: %s casos; SHA-256 %s; referencia sin modificar\n' "$(wc -l < "$WORK/matriz-1.jsonl")" "$(sha256sum "$WORK/matriz-1.jsonl" | cut -d ' ' -f 1)"
