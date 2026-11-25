# Verification Contract

The guarantee covers only permissions installed by the kit; internal effects of declared scripts remain subject to evidence review.

The kit asks for capability-based verification, not tool-based verification. Each project declares one command per capability in the `Commands` section of its `AGENTS.md`. A capability without a line is covered by `./verify`.

## Capabilities

- **Quick** (`Comprobación rápida:`): seconds, on the host, with no services running. Corresponds to Level 1 in `plan-change`.
- **Service** (`Servicio:`): logic against real dependencies (database, queue, email), without a UI. Corresponds to Level 2.
- **Acceptance** (`Acceptance:`): one file per flow, filterable by name. It does not stop at the first failure; it summarizes all failures at the end. Corresponds to Level 3.
- **Evidence** (`Evidencia:`): where the run writes `resultado.json`.

## Fingerprint

For each `repos:` folder, sha256 truncated to 12 hex over, in this order: `git status --porcelain -uall -- . ':(exclude,top)changes/**'`; `git diff HEAD -- . ':(exclude,top)changes/**'` (only if `HEAD` exists); and, for each untracked file not ignored by git (`git ls-files --others --exclude-standard -- . ':(exclude,top)changes/**'`, sorted by path), its path, its type and the sha256 of its content. Symbolic links hash their target (`readlink`) and are not followed. Files that are not regular files or links (devices, sockets, FIFOs) are skipped for content. A regular file that cannot be read makes the fingerprint `null`. `changes/` is excluded from the repository root so editing plans does not invalidate the evidence; other changes, including new untracked files, still affect the fingerprint. The builder never commits, so its new files are always untracked and must count. Reference implementation: `core/skills/diagnose/fingerprint.mjs`; independent check: `tests/diagnosis-suggests/fingerprint-reference.mjs`.

## Verificación ya hecha

`./verify` (full run, without `VERIFY_TARGET`) runs `node scripts/kit-verificado.mjs iniciar` at the start, which removes `pruebas/.temporales/resultado.json`, and at exit writes the result with `cerrar` only if the fingerprint at exit equals the one at start. `estado --nivel <rapida|servicio|aceptacion>` exits 0 (`ya verificado`) only if the file is valid, `ok` is `true`, `fallo` is `ninguno`, the level is at least the requested one and the fingerprint equals the current one. Exit 3 means the same tree already failed: do not relaunch it, fix it first. Exit 1 means verify again (with `motivo=`). Exit 2 is a usage error. A failure is never recorded as success.

## resultado.json

```json
{ "fingerprint": "<12 hex>", "level": "rapida|servicio|aceptacion", "fase": "<stage where it ended>", "ok": true, "fallo": "ninguno" }
```

- `fase` is free-form project text.
- `fallo` is closed: `ninguno`, `entorno`, `dependencia`, `prueba`, or `tiempo`.
- `fingerprint` is the key name. Older files may use `huella`; readers accept it as a legacy key, but the kit does not write it.
- `ok` is `true` only if the complete run passed.
