# Tramo 143 — Revisión integral final

## Pasos

### Tramo 143 — Historia: Revisión integral final
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 142 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: ninguno. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: ninguno.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A143).
Aceptación A143: Registrar salidas, códigos, cobertura, duración y cada excepción aprobada; cualquier diferencia no autorizada detiene el cierre.
TODO:
- [x] En `cambios/estructura-repo/tramo-143.md`, Ejecutar la matriz de instalación, reinstalación y desinstalación en aislamiento, pruebas de aceptación y negativas, comparación de línea base y auditoría de rutas y anonimización. (A143). Comprobación: Registrar salidas, códigos, cobertura, duración y cada excepción aprobada; cualquier diferencia no autorizada detiene el cierre.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A143). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- 2026-11-17. `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`: código 0, duración 51 s; ejecutó `./verify` en aislamiento Bubblewrap, dos `bash ./instalar.sh --simular`, comparación de códigos/salidas/efectos con `linea-base/` y prueba negativa. Resultado: coincide aplicando únicamente las sustituciones textuales exactas previamente aprobadas para los escenarios 9 y 8i; la mutación adicional de 8i fue rechazada. Versiones observadas: Node v24.22.1, Codex CLI 0.169.0, GNU Awk 5.3.2.
- Matriz aislada `$ bwrap ... bash cambios/estructura-repo/capturar-instalador.sh <salida-temporal>`: 32 casos de instalar, simular, copiar, herramientas individuales, herramienta ausente, argumentos rechazados, instalación/reinstalación/desinstalación de skills de proyecto, migración sintética y archivo remoto inválido; 18 códigos 0, 12 códigos 1 y 2 códigos 127 esperados por comandos ausentes. El montaje del repo fue de solo lectura y `/tmp` temporal. `$ bash cambios/estructura-repo/capturar-desinstalacion.sh <salida-temporal>` repetido dos veces: 18 casos por ejecución; capturas idénticas, SHA-256 `33e1f6aef56ca47b5491ed5a78ae259b945a8a94f48b2e5193253a67d0be8476`, 25 s.
- Aceptación `$ node --test pruebas/aceptacion/*.test.mjs`: 3/3 aprobadas, código 0, 8 s. Negativa sintética `$ node --test --test-name-pattern='instalar, reinstalar y desinstalar' pruebas/permisos-v2.test.mjs`: 1/1 aprobada, código 0, 4 s.
- Auditoría `$ python3 -B cambios/estructura-repo/comprobar-rutas-documentales.py`: código 1 por ocho referencias del kit ausentes ya heredadas; comparación de fuentes y hashes con inventario previo: `CURRENT=8 PREVIOUS=9 NEW=0`, una referencia previa quedó resuelta y no apareció ninguna nueva. Revisó 11 documentos y omitió rutas protegidas. Detalle anonimizado en `rutas-documentales.txt`; no se inspeccionaron destinos excluidos.
- No se cambió producto en este tramo. `git diff --check` pasó (código 0). Se completaron 2/2 pasos; detenerse para revisión final.

## Notas
- Pausa de arranque: el constructor encontró `estado: en curso` y no ejecutó pasos. `git status --short` conserva las modificaciones acumuladas de los tramos anteriores y nuevas carpetas de estructura; `git diff --stat` informa 175 archivos rastreados, 3134 inserciones y 5055 eliminaciones. Se restablece `aprobado` para ejecutar este tramo ya autorizado.
