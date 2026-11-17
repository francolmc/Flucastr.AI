# Tramo 142 — Auditar limpieza y tamaño

## Pasos

### Tramo 142 — Historia: Auditar limpieza y tamaño
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 141 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: docs/decisions/cleanup.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: docs/decisions/cleanup.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A142).
Aceptación A142: Registrar líneas, motivos y comandos de búsqueda; comprobar que copias de compatibilidad se verifican y que no se ha tocado pruebas/.temporales/.
TODO:
- [x] En `docs/decisions/cleanup.md`, Inventariar duplicados remanentes, archivos mayores de 300 líneas y excepciones por contrato, clasificando archivos con consumidores e históricos. Eliminar ninguno sin demostrar ausencia de consumidores y conservar historial. (A142). Comprobación: Registrar líneas, motivos y comandos de búsqueda; comprobar que copias de compatibilidad se verifican y que no se ha tocado pruebas/.temporales/.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A142). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- `$ rg -n 'core-compatibility|core/|nucleo/|agentes/|skills/' tools/verify verify tools/core-compatibility.json docs/decisions/structure.md`: confirmó el manifiesto de 15 pares y referencias consumidoras en los scripts de verificación y la decisión estructural; `exit 0`.
- `$ find . -path './.git' -prune -o -path './old/v1/registro' -prune -o -path './pruebas/.temporales' -prune -o -type f -print | awk 'BEGIN{FS="/"} $NF !~ /^\.env/ && $NF !~ /(secret|credential|key)/ {print}' | while IFS= read -r f; do n=$(wc -l < "$f" 2>/dev/null) || continue; if [ "$n" -gt 300 ]; then printf '%6s %s\n' "$n" "$f"; fi; done | sort -nr | head -100`: el inventario reproducido coincide con las rutas y conteos documentados; `pruebas/.temporales/` y `old/v1/registro/` fueron excluidos antes de descender; `exit 0`.
- `$ node tools/verify/core-compatibility.mjs`: salida vacía, verificados sin diferencias los 15 pares del manifiesto; `exit 0`. No se leyó, recorrió ni modificó `pruebas/.temporales/`; no se borró ni modificó contenido histórico.
- `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: `control negativo: modificación adicional en 8i rechazada.`; `verify coincide salvo las sustituciones textuales exactas autorizadas de los escenarios 9 y 8i.`; `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo las excepciones textuales exactas autorizadas de los escenarios 9 y 8i.`; `exit 0` (42,8 s).
- `$ git diff --check`: sin salida; `exit 0`.
- `$ git status --short -- docs/decisions/cleanup.md cambios/estructura-repo/plan.md cambios/estructura-repo/tramo-142.md`: solo el documento del alcance, el índice y la evidencia del tramo; `exit 0`.
- `$ awk '/^- \\[ \\]/{n++} END{print n+0}' cambios/estructura-repo/tramo-142.md`: `0` pasos pendientes; `exit 0`.
