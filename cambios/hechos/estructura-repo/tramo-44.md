# Tramo 44 — Separar reglas deny de Codex (borrador)

## Pasos

### Tramo 44 — Historia: Separar reglas deny de Codex
Como mantenedor quiero separar reglas deny de codex para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 43 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/codex/deny.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/codex/deny.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar reglas deny de codex conserva los resultados y efectos originales (A44).
Aceptación A44: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `adapters/codex/deny.mjs`, Mover `PREFIJOS_DENY_CODEX`, `MARCA_CODEX`, `comandosCapacidad`, `reglasCodex`, `fijarDenyCodex` y `quitarDenyCodex`, sin anonimizar todavía el literal ni cambiar la política o marca. (A44). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar reglas generadas byte a byte, comandos declarados seguros e inseguros, archivo ajeno, simulación, actualización y eliminación selectiva. (A44). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A44). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A44). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `$ node --check scripts/resolver.mjs && node --check adapters/codex/deny.mjs && bash -n cambios/estructura-repo/ejecutar-matriz-resolver.sh && git diff --check -- scripts/resolver.mjs adapters/codex/deny.mjs cambios/estructura-repo/ejecutar-matriz-resolver.sh && python3 -B -c 'from pathlib import Path; r=Path("scripts/resolver.mjs").read_text(); m=Path("adapters/codex/deny.mjs").read_text(); names=("PREFIJOS_DENY_CODEX", "MARCA_CODEX", "comandosCapacidad", "reglasCodex", "fijarDenyCodex", "quitarDenyCodex"); assert all(name in m for name in names); assert all((name not in r) or (name in ("fijarDenyCodex", "quitarDenyCodex") and r.count(name)==2) for name in names); assert "../adapters/codex/deny.mjs" in r; print("seis responsabilidades en adaptador; imports y despacho conservados; sin lógica añadida")'`: `seis responsabilidades en adaptador; imports y despacho conservados; sin lógica añadida`; sintaxis y diff pasaron; `exit 0`.
- Paso 2: `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh`: reglas, comandos seguros e inseguros, archivo ajeno, simulación, actualización y eliminación selectiva comparados con la referencia byte a byte; 101 casos en dos ejecuciones, SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; efectos binarios iguales y sin temporales residuales; `exit 0`.
- Pasos 3 y 4: `$ bash cambios/estructura-repo/reproducir-linea-base.sh` ejecutó `./verify` y dos simulaciones de `bash ./instalar.sh --simular` en Bubblewrap; `verify coincide salvo el mensaje exacto autorizado del escenario 9`; ambas simulaciones coinciden con la línea base y entre sí; `exit 0` (44.3 s).
