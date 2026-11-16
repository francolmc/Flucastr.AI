---
estado: listo
rama: feature/proceso-liviano
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Proceso liviano: lo pequeño se hace en línea, la revisión sigue al riesgo

## Objetivo
Que un cambio pequeño no pase por plan, constructor ni segunda verificación completa, y que lo grande o riesgoso conserve todas las puertas. Fuente: ODD de gentle-ai ([README](https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/README.md), release v3.0.0) y la observación de Franco del 14-nov (`docs/investigaciones/auditoria-burocracia/observacion.md`).

Además, que cada revisión mire si lo que el cambio tocó está bien hecho para su tecnología (por ejemplo, si usa Docker, que lo use de forma óptima), sin frenar ni ampliar el cambio.

## Supuestos
- Franco aprueba este plan = autorización expresa para `ejecutor: principal` en cambios pequeños (hoy `principal.md` lo exige expreso). Si no quiere esto, se quita el paso 1 y queda solo la revisión por riesgo.
- «Cambio pequeño» tiene seis condiciones cerradas (topes de 2 archivos y 30 líneas, más una lista de áreas excluidas); «riesgo alto» es todo lo que no es pequeño. Franco puede cambiar los topes o la lista.
- Esto es de texto; no hay medición de que ahorre. Se mide después con `node scripts/uso.mjs --sesiones` en los 3 próximos cambios (éxito: un cambio pequeño cuesta 1 ventana y cero lanzamientos de constructor).

## Alcance
Puede crear: `docs/practicas-por-tecnologia.md`. Puede cambiar: `agentes/principal.md`, `skills/planificar-cambio/SKILL.md` (reglas 7 y 13), `skills/ejecutar-plan/SKILL.md` solo si repite la frase de «toda edición va al constructor», `README.md` (una viñeta) y `verify` (bloque 8t, y los bloques existentes que exijan la frase que se reemplaza).
Fuera: proyectos, `instalar.sh`, `scripts/`, `modelos.json`, `agentes/constructor.md`.

## Decisiones ya tomadas
- **Cambio pequeño = cumple las seis condiciones; si falla una o hay duda, NO es pequeño:**
  1. Una sola intención, dicha en una frase.
  2. Un solo repo, como máximo 2 archivos de producto y 30 líneas de diff (tope duro; los documentos y `cambios/` no cuentan).
  3. Es corrección, ajuste de texto, estilo o configuración no sensible. **Funcionalidad o comportamiento nuevo no es pequeño.**
  4. No toca: datos o esquema, migraciones, acceso/identidad/seguridad, dinero o cálculos financieros, contratos de API, rutas o pantallas del recorrido, concurrencia, dependencias o lockfiles, Dockerfile/compose/`verify`, ni despliegue.
  5. Antes de editar hay una comprobación ejecutable con su resultado esperado, escrita en una línea.
  6. Franco no pidió plan ni constructor para ese cambio.
- **Cómo se usa:** antes de la primera edición el principal escribe una línea `Clasificación: pequeño (cumple 1–6)` con la comprobación. Si durante el trabajo se pasa de un tope o aparece un riesgo de la condición 4, se detiene, lo dice y lo convierte en plan para el constructor. No se encadenan cambios pequeños para partir uno grande. Franco puede vetar con «por plan».
- **Pequeño:** el principal edita y comprueba en línea, sin `plan.md` ni constructor; deja una línea en la respuesta con qué cambió y cómo lo comprobó. La puerta 2 sigue: el commit es de Franco. Las reglas duras (sin commit/push/.env) no cambian.
- **Constructor solo con razón nombrada:** cambio no pequeño; varios tramos; verificación larga (más de ≈10 min) que conviene aislar; o Franco lo pide. **Ante la duda, constructor** (al revés que gentle-ai: aquí el límite de lo que hace el principal es estricto).
- **Revisión por riesgo:** pequeño o `tipo: docs` → diff más la comprobación declarada, sin repetir `verify`. Riesgo alto → diff y `Verificación` del plan una vez (como hoy). Un riesgo no listado se trata como alto.
- **Mejoras en cada revisión (no bloquean):** al revisar, el principal mira la tecnología que el cambio tocó con `docs/practicas-por-tecnologia.md` y anota en *Notas* o en su respuesta, como «Mejora sugerida», lo que encuentre. No lo corrige dentro de ese cambio ni lo devuelve por eso; Franco decide si se convierte en un cambio aparte. Máximo 3 sugerencias por revisión.
- **La lista crece solo con evidencia:** cada práctica lleva su fuente y su nivel (medido por nosotros, documentación oficial, blog, inferencia). Inicial: Docker (dependencias antes del código, caché de paquetes, sin `COPY . .` antes de instalar, límites y `tmpfs` de la base, limpieza de caché), Compose/PostgreSQL (`service_healthy`, logs antes de limpiar), Playwright (esperas registradas antes de la acción, aserciones con reintento, mostrar lo recibido al fallar), Comprobación rápida declarada. Otra tecnología se agrega al usarla en un proyecto.
- Se conservan: puertas 1 y 2 para lo no pequeño, tramos, «una sola espera», `yield_time_ms: 300000` y las frases que exigen los bloques 8k y 8l.
- Ejecutor: constructor, porque los cuatro sí de la prueba: textos y comprobaciones definidos, archivos accesibles, sin credenciales ni producción.

## Escenarios
- CUANDO se lee `principal.md` ENTONCES define «cambio pequeño», permite editarlo en línea y lo limita por riesgo (A1).
- CUANDO se lee `principal.md` paso 5 ENTONCES la revisión de bajo riesgo no repite `verify` y la de alto sí (A2).
- CUANDO se lee `planificar-cambio` ENTONCES la regla 13 clasifica por riesgo y no por número de archivos (A3).
- CUANDO se revisa un cambio que toca Docker, Compose o Playwright ENTONCES el principal consulta `docs/practicas-por-tecnologia.md` y anota hasta 3 mejoras sugeridas sin devolver el cambio por ellas (A6).
- CUANDO una copia pierde la definición ENTONCES el bloque 8t falla (A4).
- CUANDO se corre el kit ENTONCES los bloques existentes pasan (A5).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Definición cerrada y permiso | `grep -cF 'cambio pequeño' agentes/principal.md`; `grep -cF 'sin plan' agentes/principal.md`; `grep -cF '30 líneas' agentes/principal.md`; `grep -cF 'Clasificación:' agentes/principal.md`; `grep -cF 'Ante la duda, constructor' agentes/principal.md` | 1 o más cada una |
| A2 | Revisión por riesgo | `grep -cF 'riesgo alto' agentes/principal.md` | 1 o más |
| A3 | Regla 13 sin conteo de archivos | `grep -c '≈3 archivos' skills/planificar-cambio/SKILL.md` y `grep -cF 'riesgo' skills/planificar-cambio/SKILL.md` | 0 y 1 o más |
| A4 | El chequeo es sensible | copia de `principal.md` con `sed` que cambia `cambio pequeño`; correr la función del bloque 8t | falla para la copia, pasa para el original |
| A6 | Mejoras con fuente | `test -f docs/practicas-por-tecnologia.md`; `grep -cF 'Mejora sugerida' agentes/principal.md`; `grep -c 'Nivel:' docs/practicas-por-tecnologia.md` | existe; 1 o más; una por práctica (≥8) |
| A5 | Nada se rompe | `./verify` | exit 0 con `ok 8k`, `ok 8l` y `ok 8t` |

## Verificación
`./verify` — offline; debe terminar en exit 0.

## Pasos
- [x] En `principal.md` reglas duras (línea 8 y la de editar archivos), reemplaza «toda edición, aunque sea de una línea, va por plan» por la definición de cambio pequeño con sus seis condiciones, la línea `Clasificación:` y «Ante la duda, constructor», copiadas de *Decisiones* (A1)
  - evidencia: `agentes/principal.md` (líneas 8, 15 y reglas duras); `grep -cF` de A1: «cambio pequeño» 4, «sin plan» 1, «30 líneas» 1, «Clasificación:» 1, «Ante la duda, constructor» 1
- [x] En `principal.md` paso 3, añade la clasificación por riesgo y los casos en que va el constructor; paso 4 sin cambios salvo «solo si hay razón nombrada» (A1)
  - evidencia: `agentes/principal.md` paso 3 («Clasifica primero», «Riesgo», «Constructor solo con razón nombrada») y paso 4 («Lanzas el constructor solo si hay razón nombrada»); A1 cubierta por la fila anterior
- [x] En `principal.md` paso 5, separa revisión de bajo riesgo (diff y comprobación) y de riesgo alto (además `Verificación` una vez); conserva «una sola espera» y `yield_time_ms: 300000` (A2)
  - evidencia: `agentes/principal.md` paso 5 («**Riesgo alto:** … una sola espera», «**Riesgo bajo** (cambio pequeño o `tipo: docs`): no repites `verify`»); `grep -cF 'riesgo alto'` = 1; 8k y 8l de `verify` pasan (ver Evidencia)
- [x] En `planificar-cambio` regla 13, cambia «hasta ≈3 archivos…» por la definición por riesgo; regla 7, `ejecutor: principal` también para cambios pequeños (A3)
  - evidencia: `grep -c '≈3 archivos' skills/planificar-cambio/SKILL.md` = 0; `grep -cF 'riesgo' skills/planificar-cambio/SKILL.md` = 1; regla 7 conserva «salvo que Franco» (8i pasa)
- [x] Crea `docs/practicas-por-tecnologia.md`: por tecnología, la práctica en una línea, su `Fuente:` (enlace o «medido en DonFinancio, 2026-11-14») y su `Nivel:` (medido, oficial, blog, inferencia). Parte de la lista de *Decisiones*; no agregues nada sin fuente (A6)
  - evidencia: `docs/practicas-por-tecnologia.md` creado con 11 prácticas (Docker ×5, Compose/PostgreSQL ×2, Playwright ×3, Comprobación rápida ×1), cada una con fuente y una línea `- Nivel:`; `test -f` = existe; `grep -c 'Nivel:'` = 11
- [x] En `principal.md` paso 5, añade: consulta ese documento según la tecnología tocada y anota hasta 3 «Mejora sugerida» sin devolver el cambio por ellas (A6)
  - evidencia: `agentes/principal.md` («**Mejora sugerida (no bloquea):** … consulta `docs/practicas-por-tecnologia.md` … hasta 3»); `grep -cF 'Mejora sugerida'` = 1
- [x] En `ejecutar-plan`, busca la frase equivalente y alinéala; si no existe, no lo toques (A1)
  - evidencia: búsqueda `rg -n "toda edición|aunque sea de una línea|edita|editar" skills/ejecutar-plan/SKILL.md` sin coincidencias; no existe frase equivalente, así que `skills/ejecutar-plan/SKILL.md` no se toca
- [x] En `verify`, busca con `rg` los bloques que exijan «aunque sea de una línea» o «toda edición» y ajústalos a la nueva frase sin debilitarlos (A5)
  - evidencia: `rg -n "aunque sea de una línea|toda edición|una línea" verify` sin coincidencias de esas frases (solo «una línea de esfuerzo», en 158 y 763, que no son la regla); no hay bloque que ajustar, y no se debilitó ninguno
- [x] En `verify`, bloque 8t copiando el patrón del 8l: exige `cambio pequeño`, `sin plan` y `riesgo alto` en `principal.md` y `riesgo` en `planificar-cambio`, y `Mejora sugerida` en `principal.md` con el documento de prácticas existente; copia negativa con `sed` (A4)
  - evidencia: `verify` bloque «8t» (después del 8r); la copia con `sed 's/cambio pequeño/cambio chico/g'` falla y el original pasa: «ok 8t: principal con la definición de cambio pequeño, riesgo alto y Mejora sugerida; … copia sin «cambio pequeño» falla»
- [x] En `README.md`, una viñeta con la regla (A1)
  - evidencia: `README.md`, sección «Qué es», viñeta «**Cambio pequeño** (`agentes/principal.md`, seis condiciones …)»; `grep -cF 'cambio pequeño' agentes/principal.md` = 4 ya cubre la regla en el principal
- [x] Corre `./verify` y pega la cola en *Evidencia* (A5)
  - evidencia: `./verify` → exit 0; líneas `ok 8k`, `ok 8l`, `ok 8t` y `VERIFY OK` (salida completa en la *Evidencia*)

## Prerrequisitos
`feature/medir-verificacion` mergeada (comparte `README.md` y `verify`). Base limpia y al día.

## Evidencia
Comprobaciones de Aceptación (salida real):

$ grep -cF 'cambio pequeño' agentes/principal.md; grep -cF 'sin plan' agentes/principal.md; grep -cF '30 líneas' agentes/principal.md; grep -cF 'Clasificación:' agentes/principal.md; grep -cF 'Ante la duda, constructor' agentes/principal.md
4
1
1
1
1
exit 0

$ grep -cF 'riesgo alto' agentes/principal.md
1
exit 0

$ grep -c '≈3 archivos' skills/planificar-cambio/SKILL.md; grep -cF 'riesgo' skills/planificar-cambio/SKILL.md
0
1
exit 0

$ sed 's/cambio pequeño/cambio chico/g' agentes/principal.md | grep -cF 'cambio pequeño'
0
exit 0

$ test -f docs/practicas-por-tecnologia.md && grep -c 'Nivel:' docs/practicas-por-tecnologia.md; grep -cF 'Mejora sugerida' agentes/principal.md
11
1
exit 0

$ ./verify
[...]
ok 8r A1-A3: el informe del fixture coincide con LEEME.txt (medianas, máximos, caché, OOM, solape y pico)
ok 8r negativa: la copia sin oom no muestra OOM
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
== 8t. cambio pequeño: definición, riesgo y prácticas por tecnología ==
ok 8t: principal con la definición de cambio pequeño, riesgo alto y Mejora sugerida; el documento de prácticas tiene ≥8 niveles; copia sin «cambio pequeño» falla
VERIFY OK
exit 0

Las líneas `ok 8k` y `ok 8l` (salida completa en el log) también pasan: «Solo creas o editas», «APROBADO», «no corriges», «una sola espera», «yield_time_ms: 300000» y «no cuentan» siguen en `principal.md`.

## Notas
- `ejecutar-plan/SKILL.md` no se tocó: no tiene frase equivalente a «toda edición».
- `verify`: ningún bloque existente exigía «aunque sea de una línea» ni «toda edición»; ninguno se debilitó. El bloque 8t copia el patrón del 8l y su copia negativa usa `/g` para quitar todas las apariciones.
- `principal.md`: la línea «Solo creas o editas…» se conserva (8k); la excepción de cambio pequeño va en la frase siguiente.
- `docs/practicas-por-tecnologia.md`: 11 prácticas, cada una con fuente del repo o enlace, y grado de evidencia. Se usó la propuesta ya existente (`docs/investigaciones/auditoria-verificacion-general/propuesta-final.md`); no se agregó nada sin fuente.
- Fuera de Alcance, para Franco: `AGENTS.md` (raíz, línea 7) dice que el constructor «ejecuta toda edición del plan». Sigue siendo cierto para planes; no se tocó, pero conviene alinearlo en un cambio aparte.
- Pendiente de medición (no es un paso): `node scripts/uso.mjs --sesiones` en los 3 próximos cambios, según *Supuestos*.
