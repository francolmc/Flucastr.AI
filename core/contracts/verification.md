# Verification Contract

The guarantee covers only permissions installed by the kit; internal effects of declared scripts remain subject to evidence review.

The kit asks for capability-based verification, not tool-based verification. Each project declares one command per capability in the `Commands` section of its `AGENTS.md`. A capability without a line is covered by `./verify`.

## Capabilities

- **Quick** (`Comprobación rápida:`): seconds, on the host, with no services running. Corresponds to Level 1 in `plan-change`.
- **Service** (`Servicio:`): logic against real dependencies (database, queue, email), without a UI. Corresponds to Level 2.
- **Acceptance** (`Acceptance:`): one file per flow, filterable by name. It does not stop at the first failure; it summarizes all failures at the end. Corresponds to Level 3.
- **Evidence** (`Evidencia:`): where the run writes `resultado.json`.

## Fingerprint

For each `repos:` folder: `{ git status --porcelain -- . ':(exclude,top)changes/**'; git diff HEAD -- . ':(exclude,top)changes/**'; } | sha256sum | cut -c1-12`. `changes/` is excluded from the repository root so editing plans does not invalidate the evidence; other changes still affect the fingerprint. If there is no `HEAD`, preserve the existing behavior: the fingerprint uses only `git status`.

## resultado.json

```json
{ "fingerprint": "<12 hex>", "level": "rapida|servicio|aceptacion", "fase": "<stage where it ended>", "ok": true, "fallo": "ninguno" }
```

- `fase` is free-form project text.
- `fallo` is closed: `ninguno`, `entorno`, `dependencia`, `prueba`, or `tiempo`.
- `fingerprint` is the key name. Older files may use `huella`; readers accept it as a legacy key, but the kit does not write it.
- `ok` is `true` only if the complete run passed.
