# Auditoría: DonFinancio se construyó sin diseño de experiencia previo (2026-11-13)

Base: `Flucastr.DonFinancio` (88 commits, rama `feature/F06-disponible-liquidez`), `AGENTS.md`, `docs/proyecto.md`, `old/DISENO.md`, `old/v1/definitions/PROJECT.md`, planes F04–F07 en `cambios/hechos/`, `Flucastr.DonFinancioV5.WebApp/app/`, la captura `Screenshot 2026-10-24…png` y las skills del kit.

## Hechos (comprobados)
1. **El modelo mental del dueño existe y está en la raíz del repo, sin usar.** `ControlGastos.xlsx` y su captura muestran una matriz mes × concepto: ingresos arriba, egresos abajo (luz, agua, hipotecario, suscripciones, con fecha de pago resaltada), «Haber» y «Acumulado» por mes, y un bloque «Cuadratura: Tengo / Diferencia». Es lo que la persona ya sabe leer. `old/v1/definitions/PROJECT.md` dice «PDF/XLSX no abiertos; método privado no validado». Yo vi la captura; no abrí el xlsx.
2. **No hay ningún documento de diseño de la interfaz.** El único es `old/DISENO.md` (3,5 KB, de las historias de acceso y saldo inicial): describe una pantalla `/app` de «resumen simple» y admite que sale de «lectura del código, no de una inspección visual». `cambios/hechos/F05-compromisos-ingresos/diseno-borrador.md` es diseño *funcional* (reglas de dinero), no de pantallas. Ningún plan F04–F07 trae boceto, mapa de pantallas ni estados.
3. **La interfaz es una sola pantalla que fue creciendo.** `style.css` tiene 13 líneas, heredadas del login (panel centrado de 28 rem). Toda la app es la ruta `/app` (`app/routes/app.tsx`, 318 líneas con JSX en líneas de varios cientos de caracteres) y apila: saldo inicial, Observaciones, Aclaraciones, revisión de cierre mensual, Previsiones/movimientos/reservas (tres formularios a la vez), Visión anual, «Tu dinero y lo que viene», Pagos, Movimientos y Reservas. La tabla anual va en un contenedor `table-scroll` que `style.css` no define.
4. **El lenguaje cotidiano llegó tarde.** F07 lo exige («evitar conciliación, previsión, liberación»), pero el código ya usa «Observaciones», «Aclaraciones», «Previsiones, movimientos y reservas», «Revisión de cierre mensual», creados en F04 y F05.
5. **El orden de las features lo dictó el cálculo, no la persona.** `PROJECT.md` es una «redefinición» centrada en límites financieros, aceptación y trazabilidad (F04 observar, F05 compromisos, F07 pagos, F06 disponible). No hay personas, tareas frecuentes, frecuencia de uso ni pantallas. Los commits de octubre mencionan «potente en información, fácil en el uso diario» y «Ritual diario»; solo vi los títulos, y ese principio no aparece en el `docs/proyecto.md` actual.
6. **El kit no pide diseño en ningún punto.** `grep` de «diseño, wireframe, usabilidad, UX, pantalla» en las skills y en `principal.md` solo encuentra «reglas de diseño» de `verify` y `motivo=diseño` del constructor. `definir-proyecto` hace hasta 5 preguntas y escribe `AGENTS.md` y `proyecto.md`; `planificar-cambio` no tiene sección de pantallas ni estados; la *Aceptación* mide resultados observables, no usabilidad.

## Causa raíz (inferencia, no probada)
El kit optimiza que el constructor no adivine contratos, cálculos y errores, y lo verifica por recorrido API/E2E. Eso produjo cálculo correcto y aislamiento sólido, pero la capa de experiencia quedó como «texto de pantalla» dentro de cada plan. Sin un diseño aprobado antes, cada feature agregó su bloque a la misma página y nadie decidió la estructura.

## Lo que no verifiqué
- No abrí la app corriendo ni comprobé en pantalla cómo se ve en móvil.
- No abrí `ControlGastos.xlsx`; solo la captura.
- No sé qué hace hoy la persona con la app a diario: eso solo lo sabe Franco.

## Propuesta: skill `disenar-experiencia` para el principal
**Cuándo:** (a) en un proyecto nuevo con interfaz, después de `definir-proyecto`; (b) en cualquier cambio que agregue o reordene pantallas, antes de `planificar-cambio`.

**Qué produce:**
- `docs/experiencia.md` (una vez por proyecto): quién usa, las 3–5 tareas frecuentes, su modelo mental actual (aquí, la planilla), vocabulario permitido y prohibido, mapa de pantallas, principios.
- `cambios/<nombre>/pantallas.md` (por feature): por cada pantalla, objetivo, boceto (ASCII o HTML estático que Franco pueda ver), estados vacío/carga/error/éxito, textos exactos, móvil primero (390 px).

**Reglas de oficio que impone:** una tarea principal por pantalla; lo frecuente a un toque, lo raro escondido; no mostrar al mismo tiempo más de un formulario; lenguaje de la persona, no del sistema; heurísticas de usabilidad y WCAG como lista de comprobación.

**Conexión con el flujo:** `planificar-cambio` exige un enlace a `pantallas.md` si el cambio toca UI; la puerta 1 incluye que Franco vea el boceto; la *Aceptación* suma filas de experiencia (tarea completable en N pasos, sin términos prohibidos, captura a 390 px sin desborde).

## Para DonFinancio (plan aparte, después de la skill)
Un cambio de «experiencia» que parta de la planilla: vista por mes con ingresos/egresos/haber/acumulado y un solo flujo para registrar, en lugar de apilar secciones. No toca el cálculo de la API.
