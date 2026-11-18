---
estado: borrador
rama: feature/F13-diseno-integral
base: main
repos: [., Proyecto.FinanzasV5.WebApp]
ejecutor: constructor
tramo: 1
tipo: codigo
---
# Ejemplo retrospectivo: F13 estructura privada

> Los nombres personales y de proyectos se anonimizaron; se conservan fechas y cifras.

Ejemplo didáctico basado en el plan real F13 y su tramo 1, ya realizado parcialmente. No es un encargo ejecutable ni una aprobación; antes de cualquier trabajo real hay que explorar el árbol vigente y acordar rama y base. Las respuestas de validación siguientes ilustran decisiones del F13 documentado; no implican aprobación de esta nueva división.

## Objetivo
Como persona usuaria, llegar a las secciones privadas existentes desde una navegación adaptable y poder utilizarla con teclado.

## Exploración y evaluación
El plan real F13 conserva las operaciones financieras existentes y su tramo 1 describe cinco destinos y el recorrido sintético. Se elige dividir estructura y accesibilidad en dos resultados verificables; la segunda historia depende de la primera. No se omite ninguna fase. El diseño se encuentra en `cambios/F13-diseno-integral/pantallas.md`.

## Supuestos
- Se usa la evidencia y el entorno sintético descritos por F13; si cambió el árbol, revisar rutas y criterios antes de construir.

## Decisiones y validación
El F13 documenta el diseño y los destinos aprobados; esta división es una propuesta retrospectiva pendiente de aprobación. Mantener operaciones y aserciones existentes; resolver preguntas de comportamiento en exploración antes de ejecutar. Ejecutor: constructor, porque el tramo se entrega con contexto y comprobaciones, sin secretos ni producción.

## Alcance
Solo los archivos declarados por historia; sin cambios de reglas financieras ni de esquema. Prerrequisitos: entorno sintético y dependencias descritas en `AGENTS.md`; base y permisos de rama confirmados por la persona usuaria.

## Verificación
`./verify` desde la raíz de Proyecto.Finanzas, nivel 3; espera `VERIFY OK` y exit 0.

## Pasos
### Tramo 1 — Historia: llegar a las secciones
Como usuaria quiero navegar a las cinco secciones privadas para encontrar las acciones existentes. Dependencias: ninguna.
Archivos: `Proyecto.FinanzasV5.WebApp/app/components/PrivateShell.tsx`, `Proyecto.FinanzasV5.WebApp/app/routes/app.tsx`, `verificacion/recorrido.mjs`.
CUANDO entro al espacio privado ENTONCES los cinco enlaces llegan a sus secciones existentes (A1).
Aceptación A1: en navegador sintético Inicio, Actividad, Pagos, Guardado y Más llevan a su destino único; las acciones anteriores siguen disponibles.
- [ ] Ajustar `Proyecto.FinanzasV5.WebApp/app/routes/app.tsx` para envolver las secciones existentes (A1). Comprobación: comparar formularios y acciones con la base acordada; se conservan.
- [ ] Ajustar `Proyecto.FinanzasV5.WebApp/app/components/PrivateShell.tsx` con los cinco destinos documentados (A1). Comprobación: comparar sus anclas con el tramo F13 original; coinciden.
- [ ] Extender `verificacion/recorrido.mjs` con los cinco enlaces y sus destinos únicos (A1). Comprobación: `VERIFY_RAPIDO=1 ./verify`; exit 0 y enlaces alcanzables.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0 y A1 cubierto.
Handoff: leer el diseño y el tramo F13 original; mantener todas las aserciones y operaciones previas; usar solo datos sintéticos.

### Tramo 2 — Historia: navegar con teclado
Como usuaria de teclado quiero recorrer la navegación y ver el foco para alcanzar cada sección. Dependencias: tramo 1 aceptado.
Archivos: `Proyecto.FinanzasV5.WebApp/app/components/PrivateShell.tsx`, `verificacion/recorrido.mjs`.
CUANDO recorro los enlaces con Tab y Shift+Tab ENTONCES el foco es visible y puedo alcanzar cada destino (A2).
Aceptación A2: el recorrido sintético comprueba teclado y foco a 320, 390 y 1440 px; los cinco enlaces conservan destinos y no hay desborde horizontal.
- [ ] Ajustar `Proyecto.FinanzasV5.WebApp/app/components/PrivateShell.tsx` para foco visible y navegación por teclado (A2). Comprobación: recorrer los cinco enlaces con Tab y Shift+Tab; foco visible y destino correcto.
- [ ] Ampliar `verificacion/recorrido.mjs` con teclado, foco y dimensiones (A2). Comprobación: `VERIFY_RAPIDO=1 ./verify`; exit 0 en los tres tamaños.
Verificación del tramo: `VERIFY_RAPIDO=1 ./verify` — nivel 2; exit 0 y A2 cubierto.
Handoff: partir del tramo 1 aceptado; conservar su cobertura y las comprobaciones previas; registrar evidencia sintética.

## Evidencia
Ejemplo sin ejecutar; la evidencia histórica está en `cambios/F13-diseno-integral/tramo-1.md` de Proyecto.Finanzas.

## Notas
La segmentación y sus comandos son propuesta, no resultados de ejecución ni prueba de que el estado actual esté listo para construir.
