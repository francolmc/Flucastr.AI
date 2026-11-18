> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

# Tramo 135 — Anonimizar documentación de permisos

## Pasos

### Tramo 135 — Historia: Anonimizar documentación de permisos
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 134 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: docs/reglas-deny.md. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: docs/reglas-deny.md.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A135).
Aceptación A135: Comprobar enlaces y comparar el texto semánticamente con el original.
TODO:
- [x] En `docs/reglas-deny.md`, Sustituir el nombre personal por el rol correspondiente sin alterar la descripción de las barreras. (A135). Comprobación: Comprobar enlaces y comparar el texto semánticamente con el original.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A135). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: `python3 -c ...` comparó `docs/reglas-deny.md` con la captura previa `/tmp/tramo-135-reglas-deny-original.md`: el contenido coincide exactamente después de sustituir únicamente `Franco haga con Claude` por `la persona usuaria haga con Claude` y la referencia obsoleta `cambios/deny-endurecido/plan.md` por `cambios/hechos/deny-endurecido/plan.md`. El archivo enlazado existe; se conserva que los commits de la persona usuaria quedan bloqueados. `git diff --check -- docs/reglas-deny.md` pasó (`exit 0`). La referencia oficial Claude Code en `code.claude.com/docs/en/permissions` resolvió a la página de permisos. No cambió la descripción de las barreras.
- Paso 2: `$ timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó con `exit 0`. Salida: `control negativo: modificación adicional en 8i rechazada.`, `verify coincide salvo las sustituciones textuales exactas autorizadas de los escenarios 9 y 8i.` y `Simulaciones repetibles y verify coinciden con linea-base/; aplica solo las excepciones textuales exactas autorizadas de los escenarios 9 y 8i.` La receta comparó `./verify` y dos ejecuciones de `bash ./instalar.sh --simular` bajo aislamiento contra la referencia; sin diferencias adicionales.
