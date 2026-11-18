#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT=$(realpath "$(dirname "$0")/../..")
REFERENCE=$REPO_ROOT/cambios/estructura-repo/matriz-resolver.jsonl
TEMP=$(mktemp -d)
trap 'rm -rf "$TEMP"' EXIT
cp "$REFERENCE" "$TEMP/referencia.jsonl"
printf '# diferencia sintetica de prueba\n' > "$TEMP/referencia-distinta.jsonl"
cat "$TEMP/referencia.jsonl" >> "$TEMP/referencia-distinta.jsonl"
mv "$TEMP/referencia-distinta.jsonl" "$TEMP/referencia.jsonl"
before=$(sha256sum "$TEMP/referencia.jsonl" | cut -d ' ' -f 1)
original=$(sha256sum "$REFERENCE" | cut -d ' ' -f 1)
if MATRIX_REFERENCE="$TEMP/referencia.jsonl" bash "$REPO_ROOT/cambios/estructura-repo/ejecutar-matriz-resolver.sh" > "$TEMP/stdout" 2> "$TEMP/stderr"; then
  echo 'ERROR: una referencia distinta fue aceptada' >&2
  exit 1
fi
if ! grep -q 'differ:' "$TEMP/stdout"; then
  cat "$TEMP/stdout" >&2
  cat "$TEMP/stderr" >&2
  echo 'ERROR: el fallo no fue una diferencia de matriz' >&2
  exit 1
fi
after=$(sha256sum "$TEMP/referencia.jsonl" | cut -d ' ' -f 1)
current=$(sha256sum "$REFERENCE" | cut -d ' ' -f 1)
test "$before" = "$after"
test "$original" = "$current"
printf 'Diferencia rechazada; referencia de prueba y referencia persistente intactas (SHA-256 %s).\n' "$original"
