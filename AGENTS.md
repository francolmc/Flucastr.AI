# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code y Pi. Un solo repo (remoto: `francolmc/Flucastr.AI`). **Versión 2 en construcción** (rama `feature/kit-v2`); la versión 1 está en el tag `kit-v1` y, mientras tanto, en `legacy/v1/`.

## Cómo funciona (v2)

- Dos agentes: `principal` (nivel medio: investiga, diagnostica, planifica, verifica) y `constructor` (nivel bajo: aplica el plan). Los niveles se traducen a modelos en `modelos.json`.
- El único traspaso es `cambios/<nombre>/plan.md`. Franco tiene dos puertas: aprobar el plan y revisar la evidencia.
- «Hecho» significa que el comando `verify` del proyecto pasa desde cero.
- Skills: `planificar-cambio`, `ejecutar-plan`, `preparar-proyecto`.
- Comando `verify`: `./verify` (modelos.json ↔ agentes, sintaxis de instalar/desinstalar, resolver Claude/Pi, skills, `instalar.sh --simular`).

## Reglas

- Los agentes no hacen commit, push, PR, merge ni despliegue: lo hace Franco.
- No se leen `.env`, llaves ni credenciales (`.env.example` sí).
- Git permitido a los agentes: crear la rama del cambio con `git switch -c <prefijo>/<nombre>` (`feature/`, `fix/`, `chore/`, `docs/`).

`definitions/`, `features/`, `scripts/` (salvo `resolver.mjs`) y `pruebas/` son de la versión 1 y se retiran en el paso 3 del rediseño. `registro/` no se lee salvo pedido explícito de Franco.
