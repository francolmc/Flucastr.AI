# Builder termination contract

The first output line is the builder return. Preserve paths and step text; omit `segment` when absent.

- `DONE: plan=<path>; [segment=<n>; ]verify=pasa` means success.
- `PAUSED: plan=<path>; [segment=<n>; ]motivo=<ambiguous|design|scope|access|verify>; hecho=<n>/<total>; siguiente=<step>; no_intentado=<reason>` requests a pause.
- `INVALIDO` means the return does not satisfy this contract.
- `INTERRUMPIDO` means the launcher observed the process interruption; never infer it from missing progress or timeout.

Each `runs.jsonl` attempt remains one JSON object with its historical top-level fields. On completion, add `terminacion` to the final attempt only: `{ "fecha": "<ISO-8601 UTC write time>", "resultado": "DONE|PAUSED|INVALIDO|INTERRUMPIDO" }`. `terminacion.fecha` is the terminal write time; top-level `fecha` keeps its historical attempt-start meaning. Optional `motivo`, `hecho`, `siguiente`, and `no_intentado` copy PAUSED details. `INVALIDO` and `INTERRUMPIDO` may include a bounded `retorno` or `detalle`. Never mark intermediate/relaunched attempts as terminal. Readers may ignore `terminacion` and continue reading the attempt fields.
