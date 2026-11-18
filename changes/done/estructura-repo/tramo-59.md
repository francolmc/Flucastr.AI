# Tramo 59 — Separar instalación de skills (borrador)

## Pasos

### Tramo 59 — Historia: Separar instalación de skills
Como mantenedor quiero aislar instalación de skills para entender su responsabilidad sin cambiar la instalación.
Dependencias: tramo 58 revisado y matriz del tramo 56. Contratos: cargar módulos con `source` en el mismo proceso, preservar opciones de shell, variables globales, llamadas, errores, trampas, rutas públicas y salida; usar exclusivamente fixtures aislados. Ejemplo: instalación seguida de desinstalación produce el mismo manifiesto y árbol que la referencia.
Alcance: `instalar.sh` y `tools/install/skills.sh`; pruebas pertinentes y evidencia.
Archivos: `instalar.sh` y `tools/install/skills.sh`.
CUANDO se ejecuten los escenarios de instalación ENTONCES instalación de skills conserva comportamiento y efectos (A59).
Aceptación A59: funciones `enlazar_skills, instalar_skills y copiar_skills` aisladas, matriz del tramo 56 equivalente, sin debilitar pruebas; módulo de hasta 300 líneas o justificación explícita.
TODO:
- [x] Extraer `enlazar_skills, instalar_skills y copiar_skills` a `tools/install/skills.sh` y cargarlo en `instalar.sh` antes de su primera llamada, conservando el orden de ejecución (A59). Comprobación: revisar el diff; Conservar la copia o enlace según el modo y los nombres existentes.
- [x] En `cambios/estructura-repo/tramo-56.md`, comparar íntegramente la matriz frente a su referencia, incluidos stdout, stderr, códigos, archivos, permisos y enlaces (A59). Comprobación: registrar resultados y diferencias autorizadas.
- [x] Ejecutar `bash -n instalar.sh` y `bash -n tools/install/skills.sh` (A59). Comprobación: ambos retornan 0.
- [x] Ejecutar `./verify` en el aislamiento del tramo 1 (A59). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
- [x] Ejecutar `bash ./instalar.sh --simular` en ese aislamiento (A59). Comprobación: esperar código 0 y coincidencia con línea base salvo excepciones aprobadas.
Verificación del tramo: `./verify` — nivel 3; además matriz y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, resultados y diferencias autorizadas; detenerse para revisión.

## Evidencia
- Paso 1: `python3` comparó el módulo con las funciones originales del instalador previo al tramo 59: igualdad literal, 38 líneas; `source` aparece una vez antes de la primera llamada y las definiciones ya no están en `instalar.sh`. Código 0.
- Paso 2: matriz A59 de 32 escenarios ejecutada con Bubblewrap, en la misma raíz sintética estable y sin red: instalador anterior reconstruido, actual y repetición actual. `cmp` estricto confirmó equivalencia anterior/actual y repetibilidad; SHA-256 íntegro de las tres capturas: `666aa91721db0e416c5714f0df50a81cbdb9a8ae0317ec5d2ab33dd652d27dd7`. No se excluyó ni normalizó ningún campo o efecto. Código 0. Artefactos: `/tmp/tramo59-matriz-2/work/matrix-{previous,current,repeat}.txt`.
- Paso 3: `$ bash -n instalar.sh && bash -n tools/install/skills.sh`; ambos finalizaron sin salida, `exit 0`.
- Paso 4: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh`; la etapa aislada de `./verify` terminó con `verify coincide salvo el mensaje exacto autorizado del escenario 9.` Código total 0 (incluye también las dos simulaciones del paso 5).
- Paso 5: en la misma receta aislada, `bash ./instalar.sh --simular` se ejecutó dos veces; las simulaciones coinciden entre sí y con `linea-base/`, considerando solo la excepción aprobada del escenario 9 en `verify`. Salida final: `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo la excepción exacta del escenario 9.` Código 0.
