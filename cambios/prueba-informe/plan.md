---
estado: listo
rama: feature/informe-avance
base: main
repos: [.]
ejecutor: constructor
tramo: 2
tipo: docs
---
# Comprobar el informe de avance

## Objetivo
Comprobar las instrucciones del informe durante una ejecución real con dos tramos y conservar la evidencia para `cambios/informe-avance/plan.md`.

## Supuestos
- La rama actual contiene el cambio que se comprueba; si cambia, se revisa la evidencia.

## Alcance
Solo lectura de `agentes/principal.md` y registro de resultados en este plan. No cambiar producto, otros planes ni generar capturas.

## Decisiones ya tomadas
- Ejecutor: constructor, porque las comprobaciones son explícitas, accesibles y no requieren credenciales ni producción.
- El principal observa las casillas y `git status` mientras este plan está en curso; no se espera al observador ni se fabrican señales.

## Escenarios
- CUANDO se revisan las instrucciones de informe ENTONCES se registran sus campos y condiciones (A1).
- CUANDO se revisa el comportamiento de espera y errores ENTONCES se registran sus restricciones (A2).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Campos y capturas revisados | Leer `agentes/principal.md`, sección Informe del constructor | Evidencia menciona campos, límite y rutas de capturas existentes |
| A2 | Espera y errores revisados | Leer la misma sección y el paso 4 | Evidencia menciona condiciones de coincidencia, lecturas fallidas y ausencia de sondeos |

## Verificación
`git diff --check` — código 0 y salida vacía.

## Pasos
### Tramo 1 — Campos del informe
Resultado: campos del informe y capturas revisados. Archivos: `agentes/principal.md`, `cambios/prueba-informe/plan.md`.
- [x] Revisar campos y límite del informe en `agentes/principal.md` (A1).
  - Comprobación: `rg -n 'máximo de cuatro líneas|último paso completado' agentes/principal.md`; resultado esperado: una coincidencia que contiene ambos campos.
- [x] Revisar capturas en `agentes/principal.md` (A1).
  - Comprobación: `rg -n 'verificacion/artifacts/' agentes/principal.md`; resultado esperado: instrucción de rutas existentes sin generación.
Verificación del tramo: `git diff --check` (A1), nivel docs.

### Tramo 2 — Condiciones de seguimiento
Resultado: condiciones de seguimiento y errores revisadas. Archivos: `agentes/principal.md`, `cambios/prueba-informe/plan.md`.
- [x] Revisar coincidencia y errores en `agentes/principal.md` (A2).
  - Comprobación: `rg -n 'consultas consecutivas|lectura falla' agentes/principal.md`; resultado esperado: condiciones de coincidencia y tratamiento de errores.
- [x] Revisar espera en `agentes/principal.md` (A2).
  - Comprobación: `rg -n 'No sondees automáticamente' agentes/principal.md`; resultado esperado: prohibición de sondeos automáticos.
Verificación del tramo: `git diff --check` (A2), nivel docs.

## Evidencia
- A2, coincidencia y errores — `$ rg -n 'consultas consecutivas|lectura falla' agentes/principal.md`; salida: línea 69 declara lecturas fallidas como desconocidas; línea 73 limita la coincidencia a dos consultas posteriores al plazo con casillas y git idénticos; `exit 0`.
- A2, espera — `$ rg -n 'No sondees automáticamente' agentes/principal.md`; salida: línea 75 permite responder a una consulta durante la espera y prohíbe sondeos automáticos o mensajes al constructor para fabricar el informe; `exit 0`.
- Verificación tramo 2 — `$ git diff --check`; salida vacía; `exit 0`.
- Alcance docs — `$ git diff --name-only main`; salida: `agentes/principal.md`; `exit 0`. Pendientes del plan: `0`; `git status --short`: ` M agentes/principal.md`, `?? cambios/informe-avance/`, `?? cambios/prueba-informe/`.
- A1, campos: `rg -n 'máximo de cuatro líneas|último paso completado' agentes/principal.md` devolvió código 0 y una coincidencia en la línea 69: límite de cuatro líneas y campo «último paso completado».
- A1, capturas: `rg -n 'verificacion/artifacts/' agentes/principal.md` devolvió código 0 y una coincidencia en la línea 71: agregar las rutas ya existentes, sin generar capturas ni pedirlas al constructor.
- Verificación del tramo: `git diff --check` código 0, salida vacía. `git diff --name-only main` informó `agentes/principal.md`; `git status --short` además muestra `cambios/informe-avance/` y `cambios/prueba-informe/` sin seguimiento, todos archivos del cambio de documentación.

## Notas
- Tramo 1 completo (2/2); no se inició el tramo 2.
- Revisión del principal: existen las instrucciones de campos y capturas en `agentes/principal.md`.
- Están conectadas al procedimiento real del principal; se revisó el archivo de producto.
- Se comprobó con el plan real y el estado git observado al retorno, sin fixture.
- `git diff --check` pasó; no se detectaron cambios fuera del alcance documental.
- Mejora: observar una consulta mientras el constructor trabaja; este ensayo solo observó el retorno.
- Tramo 2 completo (2/2): se revisaron coincidencias tras el plazo, fallos de lectura y espera sin sondeos automáticos.
- La verificación del tramo pasó: `git diff --check`, código 0.
- El diff de producto contiene solo `agentes/principal.md`, un archivo Markdown dentro del alcance.
- El plan de prueba quedó con 0 casillas pendientes.
- El ensayo de consulta en vivo sigue pendiente; solo se observó el retorno del primer tramo.

- Revisión del principal: instrucciones presentes y conectadas al procedimiento real; informe observado con plan real, 0/2 durante ejecución y 2/2 al retorno; git status coincide; git diff --check pasó. No hubo consulta espontánea del usuario en curso.
