#!/usr/bin/env bash
set -euo pipefail
ROOT=$(pwd -P)
STAGE=$(mktemp -d)
WORK=$STAGE/work
REFERENCE=$ROOT/cambios/estructura-repo/bloqueo-pi.jsonl
mkdir -p "$WORK/scripts" "$WORK/tools/resolver" "$WORK/tools/model-resolution" "$WORK/adapters/pi" "$WORK/cambios/estructura-repo"
cp scripts/resolver.mjs "$WORK/scripts/resolver.mjs"
cp adapters/pi/file-lock.mjs "$WORK/adapters/pi/file-lock.mjs"
cp adapters/pi/compaction-plan.mjs "$WORK/adapters/pi/compaction-plan.mjs"
cp adapters/pi/compaction.mjs "$WORK/adapters/pi/compaction.mjs"
cp tools/resolver/*.mjs "$WORK/tools/resolver/"
cp tools/model-resolution/models.mjs "$WORK/tools/model-resolution/models.mjs"
cp adapters/pi/agent-tools.mjs "$WORK/adapters/pi/agent-tools.mjs"
cp cambios/estructura-repo/comprobar-bloqueo-pi.mjs "$WORK/cambios/estructura-repo/comprobar-bloqueo-pi.mjs"
NODE_BIN=$(realpath "$(command -v node)")
MOUNTS=(--ro-bind "$NODE_BIN" /runtime/node)
for dir in /bin /lib /lib64; do
  if [ -e "$dir" ]; then MOUNTS+=(--ro-bind "$dir" "$dir"); fi
done
bwrap --unshare-all --die-with-parent --ro-bind /usr /usr \
  --proc /proc --dev /dev --tmpfs /tmp \
  --dir /work --dir /work/scripts --dir /work/tools --dir /work/tools/resolver --dir /work/tools/model-resolution --dir /work/adapters --dir /work/adapters/pi \
  --dir /work/cambios --dir /work/cambios/estructura-repo \
  --dir /runtime --dir /home --dir /home/test \
  "${MOUNTS[@]}" --ro-bind "$WORK/scripts/resolver.mjs" /work/scripts/resolver.mjs \
  --ro-bind "$WORK/tools/resolver" /work/tools/resolver \
  --ro-bind "$WORK/tools/model-resolution" /work/tools/model-resolution \
  --ro-bind "$WORK/adapters/pi" /work/adapters/pi \
  --ro-bind "$WORK/cambios/estructura-repo/comprobar-bloqueo-pi.mjs" /work/cambios/estructura-repo/comprobar-bloqueo-pi.mjs \
  --bind "$WORK" /work --chdir /work --clearenv \
  --setenv HOME /home/test --setenv PATH /runtime:/usr/bin:/bin --setenv LANG C.UTF-8 --setenv TZ UTC \
  /runtime/node /work/cambios/estructura-repo/comprobar-bloqueo-pi.mjs > "$WORK/actual.jsonl"

MUTATION_RESULT=$(
  bwrap --unshare-all --die-with-parent --ro-bind /usr /usr \
    --proc /proc --dev /dev --tmpfs /tmp \
    --dir /work --dir /work/scripts --dir /work/tools --dir /work/tools/resolver --dir /work/tools/model-resolution --dir /work/adapters --dir /work/adapters/pi \
    --dir /work/cambios --dir /work/cambios/estructura-repo --dir /runtime --dir /home --dir /home/test \
    "${MOUNTS[@]}" --ro-bind "$WORK/scripts/resolver.mjs" /work/scripts/resolver.mjs \
    --ro-bind "$WORK/tools/resolver" /work/tools/resolver --ro-bind "$WORK/tools/model-resolution" /work/tools/model-resolution --ro-bind "$WORK/adapters/pi" /work/adapters/pi \
    --ro-bind "$WORK/cambios/estructura-repo/comprobar-bloqueo-pi.mjs" /work/cambios/estructura-repo/comprobar-bloqueo-pi.mjs \
    --bind "$WORK" /work --chdir /work --clearenv \
    --setenv HOME /home/test --setenv PATH /runtime:/usr/bin:/bin --setenv LANG C.UTF-8 --setenv TZ UTC \
    --setenv PI_LOCK_MUTATION 1 /runtime/node /work/cambios/estructura-repo/comprobar-bloqueo-pi.mjs
)
test "$MUTATION_RESULT" = 'Archivo modificado mientras se esperaba el bloqueo Pi: código, salida y campos ajenos conservados.'

test "$(cat "$WORK/lock-exception-result.json")" = '{"caught":"fixture operation failed","lockReleased":true}'
printf '%s\n' 'Bloqueo Pi: la excepción sintética se propaga y el lock se libera.'

if [ "${CAPTURE_REFERENCE:-0}" = 1 ]; then
  if [ -e "$REFERENCE" ]; then
    printf '%s\n' 'La referencia ya existe; no se sobrescribe.' >&2
    exit 2
  fi
  cp "$WORK/actual.jsonl" "$REFERENCE"
  printf 'Referencia sintética capturada: %s registros, SHA-256 %s\n' "$(wc -l < "$REFERENCE")" "$(sha256sum "$REFERENCE" | cut -d ' ' -f 1)"
else
  test -f "$REFERENCE"
  cmp "$REFERENCE" "$WORK/actual.jsonl"
  printf 'Bloqueo Pi: %s registros coinciden con la referencia inmutable, SHA-256 %s\n' "$(wc -l < "$WORK/actual.jsonl")" "$(sha256sum "$WORK/actual.jsonl" | cut -d ' ' -f 1)"
fi
