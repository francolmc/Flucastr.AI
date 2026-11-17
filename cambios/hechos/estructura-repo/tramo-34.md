# Tramo 34 — Separar resolución de modelos (borrador)

## Pasos

### Tramo 34 — Historia: Separar resolución de modelos
Como mantenedor quiero separar resolución de modelos para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 33 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `tools/model-resolution/models.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `tools/model-resolution/models.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar resolución de modelos conserva los resultados y efectos originales (A34).
Aceptación A34: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `tools/model-resolution/models.mjs`, Mover `rutaModelos`, `leerConfig`, `modeloDe`, `resolverModelo`, `esfuerzoEn`, `resolverEsfuerzo`, `resolverRevisor`, `compactarCodex`, `esfuerzoDe` y su constante a un módulo con factoría que recibe la `raiz` calculada por `scripts/resolver.mjs`; exportar las funciones necesarias también a otros módulos posteriores. Mantener lectura de `FLUCASTR_MODELOS` en cada llamada, respaldo y mensajes. (A34). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar modelo, esfuerzo, revisor y compactación con configuración del repo y configuración temporal; probar perfil ausente, errores y el fallback a principal. Repetir desde un cwd distinto y desde kit remoto. (A34). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A34). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A34). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- `$ python3 -B -c 'from pathlib import Path; p=Path("tools/model-resolution/models.mjs"); s=p.read_text(); names=("rutaModelos", "leerConfig", "modeloDe", "resolverModelo", "esfuerzoEn", "resolverEsfuerzo", "resolverRevisor", "compactarCodex", "esfuerzoDe"); assert all(name in s for name in names); assert len(s.splitlines()) <= 300; r=Path("scripts/resolver.mjs").read_text(); assert "crearResolucionModelos(raiz)" in r and all(f"function {name}" not in r for name in names); print(f"{len(s.splitlines())} líneas; nueve funciones extraídas; factoría recibe raíz; sin definiciones duplicadas")'`: `117 líneas; nueve funciones extraídas; factoría recibe raíz; sin definiciones duplicadas`; `exit 0`.
- `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh`: 101 casos; dos capturas desde directorios independientes contra la referencia inmutable; incluye configuración del repo/temporal, ausencias, errores y operaciones con efectos; SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; referencia intacta; `exit 0`.
- Devolución A34 resuelta: `$ python3 -B cambios/estructura-repo/comprobar-a3.py` pasó con el fixture incluyendo `tools/` y `adapters/` reales, verificando sus hashes en la copia instalada, las exclusiones intactas y `instalar.sh --copiar --simular`. Desde un cwd externo con configuración sintética conflictiva, el resolver del kit instalado devolvió modelo y esfuerzo; pasó el resto de comprobaciones remotas sintéticas sin red ni acceso a rutas protegidas.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `./verify` en Bubblewrap terminó con código 0 y coincide con la referencia salvo el mensaje exacto autorizado del escenario 9; `exit 0`.
- `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: ejecutó dos simulaciones aisladas; ambas coinciden entre sí y con la línea base; salida final `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`, `exit 0`.
