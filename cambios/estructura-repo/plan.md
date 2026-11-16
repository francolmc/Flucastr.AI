---
estado: aprobado
rama: feature/estructura-repo
base: main
repos: [ . ]
ejecutor: constructor
---
# Estructura del repositorio

## Objetivo
Hacer legible y mantenible el kit mediante movimientos y separación de responsabilidades, preservando las interfaces, la lógica y el resultado observable de `instalar.sh --simular` y `./verify`. No modificar proyectos instalados.

## Exploración
Diagnóstico, inventario, rutas sensibles y fuentes en [exploracion.md](exploracion.md); consumidores pendientes en [inventario-pendiente.md](inventario-pendiente.md) y restricciones de nombres en [anonimizacion.md](anonimizacion.md). El usuario eligió conservar el histórico, anonimizar el contenido vigente y evaluar el inglés antes de decidir una traducción. El 2026-11-16 el usuario aceptó reemplazar el escenario 9 que consulta un proyecto real por un fixture anónimo y cambiar su mensaje; esa excepción al escenario es adicional a la anonimización de nombres personales y de proyectos autorizada posteriormente. No se ejecutó `verify` ni la instalación durante el diagnóstico.

## Evaluación
Mover todo a la vez simplifica el árbol pero rompe múltiples contratos simultáneamente. Se recomienda compatibilidad temporal y movimientos pequeños con rutas y pruebas adaptadas en el mismo tramo. La anonimización de instrucciones y el inglés tienen riesgo semántico y deben compararse, no presentarse como refactor mecánico. La estructura destino es una guía; la ubicación de pruebas debe preservar el recorrido productivo y las rutas externas de instalación.

## Estructura destino propuesta
Ver [estructura-destino.md](estructura-destino.md): `core/`, `adapters/`, `tools/`, `tests/`, `evals/`, `docs/decisions/`, `changes/` y `archive/`, con compatibilidad para las rutas públicas actuales.

## Supuestos
- Salida «lo mismo» incluye códigos, orden, mensajes, efectos y enlaces generados, normalizando únicamente rutas temporales inevitables y las excepciones aprobadas para el escenario 9 y los nombres propios en mensajes y archivos generados; toda otra diferencia requiere decisión.
- La evaluación de inglés usa casos reproducibles y gastos aprobados antes de cualquier ejecución con modelos; si no hay acceso o presupuesto, se documenta sin afirmar resultados.

## Decisiones ya tomadas
- Un repo, base `main`; sin tocar otros proyectos.
- Proponer estructura y nombres en inglés, incluido `core/` explícito; conservar compatibilidad de entradas y rutas consumidas.
- Ejecuta el constructor por el tamaño, múltiples tramos y riesgo; el orden y los contratos de comprobación se detallan por tramo.
- Sin borrados del archivo histórico; no se traduce sin evaluación y decisión posterior.
- El usuario autorizó sustituir nombres personales y de proyectos por términos genéricos también en mensajes de `verify` y archivos generados; se conserva el significado y se documenta cada diferencia textual.

## Validación
El usuario aprobó la ejecución completa el 2026-11-16. La línea base y el aislamiento completo se comprueban al comenzar, antes de modificar producto.

## Alcance
Solo este repositorio: puntos de entrada, scripts y sus pruebas, agentes, skills, documentación vigente y ubicación de archivo histórico. Fuera: proyectos instalados, cambios de lógica, traducción sin decisión posterior, edición de contenidos históricos, secretos y `pruebas/.temporales/`. No debilitar ni eliminar pruebas de aceptación; actualizar rutas y literales con cobertura equivalente y pruebas negativas.

## Pasos
La lista ordenada de los 143 documentos está en [tramos previstos](tramos-previstos.md): 1–3 línea base; 4–26 verify; 27–47 resolver; 48–55 kit run; 56–80 instalación; 81–95 core; 96–118 herramientas; 119–123 pruebas y evaluación; 124–137 anonimización; 138–143 decisiones, limpieza y cierre.

Cada tramo se revisa antes del siguiente; el principal avanza y delega el siguiente automáticamente sin solicitar una nueva aprobación por cada tramo, mientras no aparezca una condición de parada. Ver [secuencia](tramos-previstos.md) y [matrices de caracterización](matrices.md).
## Procesos y orden de trabajo
Ver [procesos.md](procesos.md): línea base, compatibilidad, verify, resolver y adaptadores, kit-run, instaladores, núcleo, herramientas y pruebas, limpieza, histórico, evaluación del idioma y cierre. Cada proceso se divide en movimientos y extracciones independientes. Cada documento de tramo fija su unidad y verificaciones; el primer tramo debe validar el aislamiento antes de modificar producto.

## Verificación
`./verify` y comparación reproducible de `bash instalar.sh --simular` frente a la línea base aislada en cada tramo, con pruebas de instalación/reinstalación/desinstalación relevantes y sin modificar proyectos reales. Preservar cobertura y pruebas negativas. Medir duración antes de estimar plazos.

## Decisiones
El escenario 9 de `verify` consulta una ruta absoluta de un proyecto personal, puede copiarlo y menciona su nombre incluso cuando lo omite. El usuario aprobó sustituir ese escenario por un fixture anónimo y cambiar ese mensaje; hasta entonces la línea base debe impedir el acceso a esa ruta mediante aislamiento real. La sustitución de nombres personales y de proyectos en mensajes y archivos generados también está autorizada; registrar cada cambio textual y conservar el significado. Cualquier diferencia adicional requiere decisión. La instalación remota rechaza enlaces simbólicos en el tar y existen rutas instaladas persistentes; la estrategia de copias regulares verificadas figura en [compatibilidad-pendiente.md](compatibilidad-pendiente.md). El arnés OpenSpec está ausente en este checkout y verify lo omite. La ceremonia vigente referencia `cambios/hechos/`: trasladarlo también requiere conservar o migrar ese contrato, no solo mover carpetas. El `old/v1/` creado por `--migrar` pertenece al contrato de los proyectos y no debe confundirse con el archivo histórico de este repo.
Las rutas históricas permanecen en su ubicación y se indexan; la compatibilidad de copias y lanzadores se valida antes de cada extracción.

## Evidencia
Pendiente.

## Notas
Diagnóstico sin `verify`, como exige `diagnosticar`. [Aislamiento](aislamiento.md): montajes básicos y Node comprobados; falta validar la receta completa, el fixture `auth.json`, herramientas opcionales y la cobertura. Los tramos 2 y 3 completan y verifican la matriz de consumidores antes de cualquier movimiento. No se afirma que verify esté en verde sin ejecutarlo.
