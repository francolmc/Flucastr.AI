# Tramo 45 — Separar formato de agentes Claude y Pi (borrador)

## Pasos

### Tramo 45 — Historia: Separar formato de agentes Claude y Pi
Como mantenedor quiero separar formato de agentes claude y pi para aislar una responsabilidad sin cambiar las interfaces instaladas.
Dependencias: tramo 44 revisado; Node, entorno aislado y matriz de referencia del tramo 27. Contratos: conservar `scripts/resolver.mjs`, sus subcomandos, valores, efectos, errores y la raíz calculada por el entrypoint; no tocar proyectos reales ni secretos. Ejemplo: `node scripts/resolver.mjs modelo principal codex` produce la salida de la línea base desde cualquier cwd.
Alcance: `scripts/resolver.mjs` y `adapters/shared/markdown-agent.mjs`; pruebas pertinentes y evidencia.
Archivos: `scripts/resolver.mjs`, `adapters/shared/markdown-agent.mjs`.
CUANDO se ejecute la interfaz de resolver ENTONCES separar formato de agentes claude y pi conserva los resultados y efectos originales (A45).
Aceptación A45: el módulo nuevo tiene la responsabilidad indicada, el entrypoint conserva las rutas y el despacho, la matriz de `cambios/estructura-repo/tramo-27.md` coincide y no se debilitan pruebas existentes.
TODO:
- [x] En `scripts/resolver.mjs` y `adapters/shared/markdown-agent.mjs`, Extraer del bloque `agente-claude`/`agente-pi` la generación y validación a una función con dependencias explícitas de cabecera, modelo, esfuerzo, identidad y adaptación Pi; el despachador conserva validación de argumentos y escribe exactamente el texto devuelto. (A45). Comprobación: revisar el diff de ambas rutas y verificar que no hay lógica añadida.
- [x] Ejecutar casos de `cambios/estructura-repo/tramo-27.md`: Comparar agentes reales y sintéticos, errores por name/model/effort/thinking, modelos ausentes y cabeceras Pi con Bash. (A45). Comprobación: registrar resultados y esperar coincidencia de código, stdout, stderr y efectos.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A45). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en el mismo aislamiento (A45). Comprobación: esperar código 0 y coincidencia con la línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3 por petición del usuario; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar diff, resultados y diferencias autorizadas; detenerse para revisión antes del siguiente tramo.

## Evidencia
- Paso 1: `node --check scripts/resolver.mjs`, `node --check adapters/shared/markdown-agent.mjs`, `bash -n cambios/estructura-repo/ejecutar-matriz-resolver.sh`, `git diff --check` sobre las tres rutas y aserciones estructurales: paso; el entrypoint delega, las dependencias quedan explícitas y la lógica de validar/renderizar vive en el módulo compartido (`exit 0`). La preservación de la traza de errores se comprobó en la matriz del paso siguiente.
- Paso 2: `$ bash cambios/estructura-repo/ejecutar-matriz-resolver.sh`: agentes Claude y Pi, casos sintéticos y existentes, errores de cabecera, modelos ausentes, efectos y trazas coinciden byte a byte con la referencia en dos ejecuciones; 101 casos, SHA-256 `1d734c71e7a8335298d83d2a39a79b6d63c74c3864153c7a876f657b339cb37a`; sin temporales residuales; `exit 0`. El primer cotejo detectó trazas desplazadas; se ajustó el espaciado vacío para preservar las líneas de entrada/parser sin cambiar lógica y se repitió la matriz hasta pasar.
- Paso 3: `$ bash cambios/estructura-repo/reproducir-linea-base.sh`: `./verify` aislado terminó con código 0 y coincidió con la referencia salvo el mensaje textual exacto autorizado del escenario 9.
- Paso 4: la misma receta ejecutó dos simulaciones aisladas de `bash ./instalar.sh --simular`; ambas coinciden entre sí y con la línea base; código 0. Salida final: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
