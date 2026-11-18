# Tramo 82 — Comprobar copias de compatibilidad (borrador)

## Pasos

### Tramo 82 — Historia: comprobar copias de compatibilidad
Como mantenedor quiero detectar cualquier diferencia entre las fuentes en `core/` y sus rutas anteriores para mantener una única fuente editable.
Dependencias: tramo 81 revisado; módulos de verify de los tramos 4–26. Contratos: comprobación sin escribir archivos ni seguir enlaces simbólicos; no modificar mensajes preexistentes de verify; rutas del inventario relativas al repositorio. Ejemplo: cambiar un byte de una copia en una copia temporal causa fallo de la comprobación.
Alcance: `tools/core-compatibility.json`, `tools/verify/core-compatibility.mjs` y `tools/verify/models.sh`, fase existente de coherencia estructural; pruebas pertinentes.
Archivos: inventario, comprobador y módulo estructural de verify (máximo tres archivos de producto).
CUANDO exista un par en el inventario ENTONCES ambos archivos regulares tienen el mismo contenido y permisos ejecutables (A82).
Aceptación A82: inventario inicialmente vacío válido; cada par se valida por bytes, tipo y bit ejecutable; rutas faltantes, duplicadas, fuera del repo o enlaces fallan; las pruebas comprueban cada caso sin modificar el checkout.
La validación rechaza rutas absolutas, componentes `..` y enlaces simbólicos en cualquier componente, no solo en el archivo final; comprobar también alias y duplicados tras normalizar. No abrir archivos hasta validar su confinamiento.
TODO:
- [x] Crear `tools/core-compatibility.json` vacío y `tools/verify/core-compatibility.mjs` sin dependencias externas; validar pares, duplicados y confinamiento, sin seguir enlaces (A82). Comprobación: pruebas aisladas positivas y negativas pasan.
- [x] Conectar `tools/verify/core-compatibility.mjs` a `tools/verify/models.sh`, sin cambiar el orden ni textos existentes (A82). Comprobación: diff acotado y verify falla en una copia temporal con par distinto.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A82). Comprobación: retornan 0 y coinciden con la referencia salvo excepciones autorizadas.
Verificación del tramo: `./verify` — nivel 3; además pruebas negativas y simulación. Duración: medida en tramo 1.
Handoff: registrar resultados y detenerse para revisión.

## Evidencia
- Pausa previa: módulo de integración no identificado por tramo 3. Resuelta por el principal: usar `tools/verify/models.sh` como fase existente de coherencia estructural; conservar orden y mensajes.
- Paso 1: `$ node --test tools/verify/core-compatibility.test.mjs`: 5 pruebas aprobadas; inventario vacío, par igual, contenido/mode distintos, rutas faltantes/absolutas/parent, duplicados y alias normalizados, symlink en componente intermedio/final; `exit 0`.
- `$ node --check tools/verify/core-compatibility.mjs && node tools/verify/core-compatibility.mjs`: sin salida (sintaxis correcta e inventario vacío válido); `exit 0`.
- Paso 2: `$ node --test tools/verify/core-compatibility.test.mjs && node --check tools/verify/core-compatibility.test.mjs && node --check tools/verify/core-compatibility.mjs && bash -n tools/verify/models.sh && git diff --check -- tools/verify/models.sh tools/verify/core-compatibility.mjs tools/core-compatibility.json cambios/estructura-repo/plan.md cambios/estructura-repo/tramo-82.md`: 6/6 pruebas aprobadas; ambas comprobaciones Node, `bash -n` y `git diff --check` terminaron sin salida, `exit 0`. La prueba de integración copia temporalmente `models.sh` y el comprobador, detecta el par desigual y verifica el fallo sin salida de éxito. Además, una copia temporal del checkout (sin `.git`, áreas excluidas ni secretos) se ejecutó bajo Bubblewrap: `./verify` real reportó `FALLO: compatibilidad core: par 1: contenido distinto (core/source.fixture, core/compat.fixture)` y `FALLO: 1: copias de compatibilidad de core distintas`, `verify_exit=1`; esperado y aserción aprobada. El hook se añadió al final de la fase existente, sin alterar mensajes ni orden previos; en éxito no imprime nada.
- Revisión de ubicación: la prueba está en `tools/verify/core-compatibility.test.mjs`, fuera del patrón `pruebas/*` de `.gitignore`; la importación del módulo y las dos copias usadas por la integración apuntan a archivos dentro de `tools/verify/`. `git check-ignore -v tools/verify/core-compatibility.test.mjs` no la ignora (código 1) y `git status --short --untracked-files=all -- tools/verify/core-compatibility.test.mjs` muestra `?? tools/verify/core-compatibility.test.mjs`; las seis pruebas conservan sus aserciones.
- Paso 3: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `exit 0` en dos ejecuciones (primera: ~40 s; repetición tras devolución: 42.7 s); `./verify` aislado coincide salvo el mensaje exacto autorizado del escenario 9; las dos simulaciones de `instalar.sh --simular` son repetibles y coinciden con la referencia, únicamente con la excepción autorizada del escenario 9.
