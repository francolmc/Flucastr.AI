#!/usr/bin/env bash
set -eu

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo_root"

node evals/arquitectura-cambios/autoprueba.mjs
./verify
