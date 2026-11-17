# Tramo 60 — Separar skills en proyecto sintético (borrador)

## Pasos

### Tramo 60 — Historia: Separar skills en proyecto sintético
Como mantenedor quiero aislar skills en proyecto sintético para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 59 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/project-skills.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/project-skills.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES skills en proyecto sintético conserva comportamiento y efectos (A60).
Aceptación A60: funciones `exclusion_de_git, excluir_en_git e instalar_skills_proyecto` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `exclusion_de_git, excluir_en_git e instalar_skills_proyecto` a `tools/install/project-skills.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A60). Comprobación: revisar el diff; Mantener SIN_GIT_AVISADO y el orden de sus inicializaciones y efectos.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A60). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/project-skills.sh` (A60). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A60). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A60). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: comparación literal con `/tmp/tramo60-pre-instalar.sh` confirma que los tres cuerpos de función y sus comentarios originales se trasladaron sin cambios a `tools/install/project-skills.sh` (54 líneas de bloque); `SIN_GIT_AVISADO=0` permanece antes del `source`, cargado una vez antes de la primera llamada, y las tres definiciones ya no están en `instalar.sh`. Comprobación estructural: código 0.
- Paso 2: matriz A60 completa de 32 casos: instalador previo a la extracción, actual y repetición actual capturados en la misma raíz sintética y Bubblewrap sin red. `cmp` íntegro confirmó igualdad entre las tres capturas, SHA-256 idéntico `666aa91721db0e416c5714f0df50a81cbdb9a8ae0317ec5d2ab33dd652d27dd7`; incluidos argumentos, códigos, stdout, stderr y árboles con tipo, permisos, enlaces, tamaño y hash, sin exclusiones ni normalizaciones. Código 0. Artefactos: `/tmp/tramo60-matriz-1/work/matrix-{previous,current,repeat}.txt`.
- Paso 3: `$ bash -n instalar.sh && bash -n tools/install/project-skills.sh`; ambos finalizaron sin salida, `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con código 0. `./verify` aislado coincide con la línea base salvo el mensaje exacto autorizado del escenario 9.
- Paso 5: el mismo runner ejecutó dos `bash ./instalar.sh --simular` aislados; las salidas y efectos coinciden entre sí y con la línea base, código 0. Resultado: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.`
