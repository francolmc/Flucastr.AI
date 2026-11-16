## Pasos

### Tramo 3 — Historia: comprobar continuidad y parada
Como Franco quiero evidencia de dos tramos y de una falla provocada para confiar en el flujo sin intervención.
Dependencias: Tramo 2 — procedimiento continuo operativo; Externa — lanzador local `codex-constructor` disponible y autorizado para dos sesiones reales independientes.
Contratos a conservar: `kit run` antiguo y sus pruebas; ninguna prueba simulada sustituye ejecución real.
Rutas susceptibles de cambio: `scripts/kit-run.mjs`, `pruebas/kit-run/probar.mjs`, `pruebas/continuidad/`; no mover ni archivar; actualizar las expectativas de `kit run` solo cuando corresponda al modo continuo.
Ejemplo concreto del resultado esperado: plan temporal de dos tramos termina con ambos marcados sin intervención; otro provoca dos fallos de causa idéntica y queda parcial con nota y segundo tramo sin ejecutar.
Alcance: integración de `kit run`, pruebas offline y protocolo de observación real aislado.
Archivos: `scripts/kit-run.mjs`.
CUANDO se ejecuta un plan continuo ENTONCES `kit run` respeta sus límites y el recorrido real demuestra avance y pausa (A3).
Aceptación:
- A3: pruebas offline cubren éxito, pausa, reintentos, compatibilidad y mutación sensible; dos sesiones reales independientes registran los resultados y salidas; comprobar con `node pruebas/kit-run/probar.mjs`, el protocolo de `pruebas/continuidad/` y `./verify`; esperar exit 0 y evidencia real.
TODO:
- [x] Adaptar `scripts/kit-run.mjs` al modo continuo y mantener el modo antiguo (A3). Comprobación: `node pruebas/kit-run/probar.mjs`; esperar exit 0.
- [x] Ampliar `pruebas/kit-run/probar.mjs` con dos tramos, parada por segunda falla, ausencia de revisión prematura y compatibilidad antigua (A3). Comprobación: `node pruebas/kit-run/probar.mjs`; esperar exit 0 y mutación de sensibilidad rechazada.
- [x] Crear `pruebas/continuidad/protocolo.mjs` como protocolo reproducible en repos temporales para dos sesiones reales independientes y comprobar sus registros (A3). Comprobación: ejecutar el protocolo con `codex-constructor`; esperar ambos resultados descritos en A3 sin intervención y sin acceso a secretos.
- [x] Ejecutar `./verify` completo (A3). Comprobación: `./verify`; esperar exit 0.
Verificación del tramo: `./verify` — nivel 3; exit 0; cubre las pruebas offline de A3; la observación real se verifica además con el protocolo declarado.
Handoff: conservar salidas reales, duración medida, estado del plan, señales del segundo tramo y nota de pausa; si el lanzador o acceso faltan, PAUSA sin afirmar que se observó al constructor.

## Evidencia

$ node pruebas/kit-run/probar.mjs
ok A1 ciclo completo: listo, constructor una vez, revisor en solo lectura
ok A2 verify que siempre falla: 3 corridas del constructor y parcial
ok A7 continuidad completa: dos tramos antes de una verificación y revisión final
ok A8 continuidad: segunda falla idéntica detiene relanzamientos y deja nota
ok A3a revisor que intenta escribir con sandbox read-only: la escritura se rechaza y aprueba
ok A3b revisor que escribe aunque el sandbox sea read-only: el árbol cambió, parcial
ok A3c DEVUELTO una vez: vuelve al constructor con los defectos y aprueba
ok A3d DEVUELTO siempre: cupo de 2 agotado, parcial sin más corridas
ok A5a revisor que devuelve texto no JSON: parcial sin aprobar
ok A5b APROBADO con defectos: viola el esquema, parcial
ok A5c veredicto con clave extra: viola el esquema, parcial
ok C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente
ok C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
ok uso: plan en curso se rechaza sin cambiarlo
ok V2 revisor con nivel bajo: Luna low; el constructor no cambia
ok V3 sin kit_run el revisor usa el modelo y esfuerzo del principal
ok V4 nivel inválido en kit_run.revisor: exit 2 y plan intacto
ok V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>
kit-run: 19 casos pasaron
exit 0

$ node pruebas/kit-run/probar.mjs
ok A1 ciclo completo: listo, constructor una vez, revisor en solo lectura
ok A2 verify que siempre falla: 3 corridas del constructor y parcial
ok A7 continuidad completa: dos tramos antes de una verificación y revisión final
ok A8 continuidad: segunda falla idéntica detiene relanzamientos y deja nota
ok M1 mutación sensible: quitar la parada por causa repetida es rechazado
ok A3a revisor que intenta escribir con sandbox read-only: la escritura se rechaza y aprueba
ok A3b revisor que escribe aunque el sandbox sea read-only: el árbol cambió, parcial
ok A3c DEVUELTO una vez: vuelve al constructor con los defectos y aprueba
ok A3d DEVUELTO siempre: cupo de 2 agotado, parcial sin más corridas
ok A5a revisor que devuelve texto no JSON: parcial sin aprobar
ok A5b APROBADO con defectos: viola el esquema, parcial
ok A5c veredicto con clave extra: viola el esquema, parcial
ok C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente
ok C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
ok uso: plan en curso se rechaza sin cambiarlo
ok V2 revisor con nivel bajo: Luna low; el constructor no cambia
ok V3 sin kit_run el revisor usa el modelo y esfuerzo del principal
ok V4 nivel inválido en kit_run.revisor: exit 2 y plan intacto
ok V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>
kit-run: 20 casos pasaron
exit 0

$ node pruebas/continuidad/protocolo.mjs codex-constructor
ok sesión real: continuidad completó dos tramos en una invocación independiente
ok sesión real: fallo provocado dejó plan parcial, nota y tramo 2 intacto
evidencia: pruebas/continuidad/evidencia-real.md
exit 0

Evidencia de las dos invocaciones reales, con duración medida, retornos, stdout y estado/casillas de ambos planes: `pruebas/continuidad/evidencia-real.md`. Éxito: 124.36 s, COMPLETADO, estado listo, dos casillas [x]. Fallo provocado: 74.49 s, PAUSA motivo=verify tras dos salidas idénticas, estado parcial, dos casillas pendientes; Tramo 2 no iniciado.

$ ./verify
== 11. ejecución por tramos: textos nuevos y copias sin cada uno ==
falta «/compact» en skills/planificar-cambio/SKILL.md
falta «/compact» en skills/ejecutar-plan/SKILL.md
FALLO: 11: falta algún texto nuevo de la ejecución por tramos
exit 1

Reanudación resuelta: se restauró `/compact` o sesión nueva al cerrar historia en ambas skills; los planes sin continuidad conservan la pausa entre invocaciones y la continuidad no pausa entre tramos aprobados. `.gitignore` incluye el protocolo. El contrato de `verify` y las pruebas de aceptación no se modificaron.

$ ./verify
ok A4: contrato nuevo y compatibilidad con el contrato anterior
ok A2: 17 condiciones del modo continuo y compatibilidad verificadas
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

## Notas

PAUSA: `./verify` completo falla en el paso 11 porque no encuentra `/compact` en `skills/planificar-cambio/SKILL.md` ni `skills/ejecutar-plan/SKILL.md`. Esos archivos y el contrato del paso 11 quedan fuera del alcance del Tramo 3; el TODO de `./verify` permanece pendiente. Retomar con decisión del principal sobre actualizar la expectativa o restaurar el requisito. Evidencia real del protocolo en `pruebas/continuidad/evidencia-real.md`.
