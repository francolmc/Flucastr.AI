# Tramo 4

## Pasos

### Tramo 4 — Historia: sin alias en español
Como persona usuaria quiero comandos y documentos con nombres en inglés y sin alias para tener un kit sin alias ni nombres duplicados.
Dependencias: Tramo 3.
Contratos a conservar: Los comandos en inglés (`install.sh`, `uninstall.sh`, `install-remote.sh`, `scripts/usage.mjs`, `scripts/observe.mjs`) siguen funcionando igual; las opciones en inglés no cambian.
Rutas susceptibles de cambio: `install.sh`, `uninstall.sh`, `install-remote.sh`, `tools/install/*`, `tools/verify/*`, `scripts/*`, `README.md`, `AGENTS.md`, `docs/*`.
Ejemplo concreto del resultado esperado: `git ls-files | grep -E 'instalar|desinstalar|observar|uso\.mjs|friccion|PENDIENTES'` vacío y `./verify` pasa.
Alcance: renombre mecánico; supera tres archivos de producto (ver Decisiones del plan).
Archivos: instalar.sh, desinstalar.sh, instalar-remoto.sh, scripts/observar.mjs, scripts/uso.mjs, friccion.md, PENDIENTES.md
CUANDO se retiran los alias ENTONCES no existen los alias en español ni las opciones en español, `friccion.md` pasa a `friction.md` y `PENDIENTES.md` a `TODO.md` (A1).
Aceptación:
- A1: no existen los alias en español ni las opciones en español, `friccion.md` pasa a `friction.md` y `PENDIENTES.md` a `TODO.md`; comprobar con `git ls-files | grep -E 'instalar|desinstalar|observar|uso\.mjs|friccion|PENDIENTES'`; esperar sin salida
TODO:
- [x] Quitar los scripts y alias en español y las opciones en español (`--proyecto`, `--simular`, `--migrar`, `--solo`, `--agente`, `--copiar`, `--skills-proyecto`, `--tool`/`--raiz` cuando exista la inglesa) de `install.sh`, `kit run` y ayudas (A1). Comprobación: `git grep -nE -- '--(proyecto|simular|migrar|copiar|solo|agente|skills-proyecto)' -- . ':!old' ':!changes/done'`; sin resultados.
- [x] En `friccion.md` y `PENDIENTES.md`, `git mv friccion.md friction.md` y `git mv PENDIENTES.md TODO.md` y actualizar enlaces (A1). Comprobación: el `git ls-files | grep` de la aceptación.
- [x] Con `verify` ya actualizado, correr `./verify` (A1). Comprobación: exit 0 y VERIFY OK.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre A1.
Handoff: las pruebas de ayuda (`tools/verify/install-help.sh`) y de lanzadores deben actualizarse a las opciones en inglés, no debilitarse; el texto de la documentación no se reescribe, solo los nombres que cita.
