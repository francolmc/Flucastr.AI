# Corpus candidato (anonimizado)

K = este kit; P1, P2, P3 = proyectos privados. El mapa a carpetas y nombres de cambio no se versiona (el repo es público).

## Calibrados: la verificación falla en la base y pasa con la solución de referencia

Prueba en carpetas temporales, sin `.git`, dentro del sandbox. «Previos» = archivos de tramos anteriores que hay que superponer a la base. «Líneas» = añadidas más borradas.

| ID | Tramo | Base → referencia | Archivos | Líneas | Previos | Preparación |
|---|---|---|---|---|---|---|
| K-01 | 1 | 83700f1ddb → 0f123c4a63 | 3 (1 doc) | 37 (33 de prueba) | 0 | ninguna |
| K-02 | 1 | 015d31413c → 9f1ede7ce4 | 3 | 61 | 0 | ninguna |
| K-03 | 4 | 0693be5364 → da4b52d722 | 3 | 115 | 4 | ninguna |
| K-04 | 2 | 644cf38021 → 2eed88dd0a | 1 | 96 | 1 | ninguna |
| K-05 | 2 | b5676c6f7a → 60c4a75a81 | 2 | 51 | 2 | ninguna |
| P1-01 | 2 | 97cb43dcf5 → 54f074e48a | 3 | 188 | 0 | pnpm |
| P1-02 | 7 | 57474db5c2 → 5b0f3141b9 | 3 | 350 | 5 | pnpm, cliente de BD |
| P2-01 | 1 | 398882ff4e → 51f58a9c69 | 1 | 129 | 0 | ninguna |
| P2-02 | 1 | 5a0e457579 → 3c861c20c3 | 3 | 104 | 0 | ninguna observada |
| P2-03 | 4 | 9f461e6e8a → e999c2e676 | 2 | 354 | 2 | ninguna observada |

En P1 y P2 los hashes son del repo donde está el código del tramo (raíz o hijo).

## Reservas: sin calibrar aquí (Docker no es accesible desde el sandbox)

| ID | Tramo | Base → referencia | Archivos | Líneas | Motivo |
|---|---|---|---|---|---|
| P1-03 | 6 | 23bd2f2341 → 0e432974e7 | 1 | 65 | la prueba pide Docker |
| P1-04 | 6 | 57474db5c2 → 5b0f3141b9 | 2 | 83 | prueba de base de datos (causa por confirmar) |
| P1-05 | 1 | cd59260522 → 7b32e042ba | 3 | 202 (169 de prueba) | verify completo del workspace |
| P3-01 | 1 | e66c5dc921 → 6ab6eebf08 | 2 | 147 (111 de prueba) | verify completo (causa por confirmar) |
| P3-02 | 1 | 7414e0a82a → fcbb4a2a26 | 2 | 92 | verify con contenedores |
| P3-03 | 1 | cfc624cd1e → 47d6d9fa15 | 3 | 29 | verify con contenedores |

P3 no tiene ningún tramo calibrado.

## Descartados

De 151 tramos con commit localizable probé unos 40. Causas vistas al no discriminar: la verificación pasa ya en la base; el commit mezcla tramos y la referencia depende de archivos posteriores; las pruebas no están en `Files:`; dos tramos son el mismo archivo y diff (se deja uno).

## Hallazgos que condicionan el runner

- Un «verify conocido» histórico no basta: hace falta un paso `calibrar` que repita la prueba base/referencia.
- Hay que superponer las pruebas de la referencia (oráculo), y en 5 de 10 calibrados también archivos de tramos previos.
- La carpeta de ejecución cambia: raíz del workspace o repo hijo.
- `kit run` solo mapea Codex (`--tool claude|pi` exige `KIT_RUN_BUILDER` y `KIT_RUN_REVIEWER`).
- `scripts/rates.json` no tiene tarifa de `gpt-6.1-terra` (revisor) ni de modelos Claude: ese costo saldría vacío.
- La señal «Autocompact is thrashing» de `tools/run/clasificar.mjs` es un mensaje de Claude Code; no sé cómo se manifiesta en Codex.
- `git worktree add` escribe en el repo fuente y deja los commits futuros (la solución) al alcance del builder.
- Aquí no se puede correr la línea base: `~/.codex` es de solo lectura y Docker no responde.

2026-11-27: K-03 y K-05 excluidos (D-36).
