> Los nombres personales y de proyectos de este documento histórico fueron anonimizados.

# Tramo 133 — Anonimizar skill de planificación y contrato de verify

## Pasos

### Tramo 133 — Historia: Anonimizar skill de planificación y contrato de verify
Como mantenedor quiero completar esta unidad para disponer de una estructura comprensible y compatible.
Dependencias: tramo 132 revisado; aislamiento y referencia del tramo 1; contratos generales y excepciones del plan. No tocar proyectos, secretos ni históricos protegidos.
Alcance: skills/planificar-cambio/SKILL.md, core/skills/plan-change/SKILL.md, tools/verify/agent-contracts.sh; y el comparador de evidencia cambios/estructura-repo/reproducir-linea-base.sh. Pruebas y evidencia relacionadas no debilitan pruebas existentes.
Archivos: skills/planificar-cambio/SKILL.md, core/skills/plan-change/SKILL.md, tools/verify/agent-contracts.sh.
CUANDO se complete esta unidad ENTONCES su comportamiento y compatibilidad quedan comprobados (A133).
Aceptación A133: Comprobar igualdad de copias, éxito del caso positivo y fallo de la copia con la frase negativa; registrar la diferencia textual autorizada.
TODO:
- [x] En `skills/planificar-cambio/SKILL.md`, Sustituir el nombre personal en ambas copias; actualizar a la vez el literal positivo congelado y el mensaje de verify, conservando la comprobación negativa Falla la 2 o la 4. (A133). Comprobación: Comprobar igualdad de copias, éxito del caso positivo y fallo de la copia con la frase negativa; registrar la diferencia textual autorizada.
- [x] Ejecutar `./verify` y `bash ./instalar.sh --simular` en el aislamiento del tramo 1 (A133). Comprobación: código, salida y efectos coinciden con la línea base, salvo excepciones autorizadas documentadas.
Verificación del tramo: `./verify` — nivel 3; además la comprobación específica y simulación. Duración: medida en tramo 1.
Handoff: registrar archivos, diff, comandos y resultados; detenerse para revisión.

## Evidencia
- Paso 1: en ambas copias reemplacé todas las menciones personales por «la persona usuaria» y actualicé el literal positivo, comentario y salida de `tools/verify/agent-contracts.sh`; la prueba negativa conserva `Falla la 2 o la 4`. `cmp` confirmó copias idénticas; ausencia de `Persona` en el par; ejecución aislada del bloque `agent-contracts.sh` pasó 8i, 8k y 8l, incluyendo éxito positivo y fallo negativo (`exit 0`). La diferencia de texto es la anonimización autorizada; se conservó el contenido y el contrato.
- Paso 2: el comparador ahora admite solo una aparición de cada línea exacta autorizada de 8i (actual y línea base), además de conservar intacta la excepción exacta del escenario 9; toda otra línea permanece bajo comparación byte a byte. `$ bash -n cambios/estructura-repo/reproducir-linea-base.sh && timeout 95 bash cambios/estructura-repo/reproducir-linea-base.sh` terminó `exit 0` en aproximadamente 43,5 s; las dos simulaciones fueron repetibles, verify pasó y coincidió con la línea base tras retirar únicamente las dos sustituciones exactas. La prueba negativa integrada añadió texto a 8i y confirmó que se rechaza. La línea base no se modificó.

Resolución: el plan ya autoriza anonimizar nombres en mensajes. Ajustar el comparador únicamente para admitir la sustitución exacta documentada en la línea 8i, exigiendo una sola aparición de cada variante y conservando la comparación de todos los demás bytes y la excepción exacta existente del escenario 9. Comprobar que una modificación adicional en 8i se rechaza; repetir el paso 2 sin alterar la línea base.
