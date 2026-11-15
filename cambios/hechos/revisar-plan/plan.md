---
estado: listo
rama: feature/revisar-plan
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Revisar planes antes de aprobarlos

## Objetivo
Detectar mecánicamente señales de tramos demasiado amplios o pasos sin comprobación, y hacer que el principal las revise antes de pedir aprobación.

## Supuestos
- El F13 no llegó pegado en el mensaje; se usa el plan local de Don Financio `cambios/F13-diseno-integral/plan.md` como referencia. Si Franco aporta otra versión, comparar y ajustar la prueba.
- Los avisos son heurísticos: un texto ambiguo puede requerir revisión humana. Si Franco quiere análisis semántico exhaustivo, cambia el alcance.

## Alcance
Crear `scripts/revisar-plan.mjs` y pruebas y fixtures bajo `pruebas/revisar-plan/`; integrar esas pruebas en `verify`. Modificar `agentes/principal.md` y `skills/planificar-cambio/SKILL.md`. No modificar Don Financio ni tests de aceptación existentes.

## Decisiones ya tomadas
- Ejecutor: constructor, porque es funcionalidad nueva; el contexto, comprobaciones y errores están definidos y no requiere secretos ni producción.
- El script recibe un archivo Markdown, solo lo lee, no sigue enlaces ni modifica nada. Sin argumentos, con archivo ilegible o error de lectura: mensaje en stderr y exit 2. Sin avisos: stdout vacío y exit 0; con avisos: una línea por aviso en stdout y exit 1. Cada aviso incluye ruta, número de línea y motivo.
- Medir bytes UTF-8 del archivo recibido: avisar en línea 1 si supera 8192 bytes. Un índice y cada `tramo-N.md` se revisan individualmente; el principal corre el script sobre todos los documentos de tramos del plan.
- Analizar `## Pasos`, sus `### Tramo N` y, si no hay tramos, tratar la sección como un tramo. Reconocer pasos con casillas y sus sublíneas de comprobación; no analizar casillas de otras secciones. La declaración `Archivos:` de cada tramo enumera rutas explícitas; documentos y pruebas no cuentan como archivos de producto. Avisar si hay más de tres rutas de producto distintas o una carpeta, como `app/`, en esa declaración; dar la línea correspondiente.
- Cada paso necesita una ruta de archivo explícita en el paso o su sublínea y una comprobación explícita en el paso o sublínea (comando entre acentos graves o texto `Comprobación:`); advertir por separado ambas ausencias en la línea del paso. No interpretar una referencia de aceptación como comprobación.
- Para detectar pantallas o capas, usar nombres explícitos del tramo (cabecera, resultado y pasos): capas `interfaz`/`UI`/`web`, `API` y `datos`/`base de datos`; pantallas identificadas por `pantalla: <nombre>` o `pantallas: <nombre>, <nombre>` y por los nombres de F13 acceso, saldo inicial y resumen. Avisar en la línea del tramo si hay más de una capa o pantalla distinta; evitar contar menciones de exclusión como `API fuera`. Documentar estas convenciones en la ayuda del script; son avisos, no un análisis semántico completo.
- Para ejecutarlo desde un proyecto instalado, el principal obtiene la raíz del kit de `~/.flucastr-ai/raiz` y llama `node "<raíz-del-kit>/scripts/revisar-plan.mjs" <plan>`; si falta el archivo o el script, informa el fallo y no inventa un resultado. Antes de pedir aprobación corrige el plan él mismo, vuelve a revisar y explica en una línea por aviso residual por qué no aplica, sin pedir permiso por cada aviso.
- En la regla 11 reemplazar únicamente la frase inicial del umbral por: «Un tramo es lo que el constructor puede terminar y comprobar sin perder el hilo: una pantalla o una capa, pocos archivos nombrados.» Conservar el resto de la regla y sus textos exigidos por `verify`. En la regla 4 quitar la afirmación obsoleta de que no existe herramienta para medirlo.
- Añadir una sola línea a `agentes/principal.md`: mientras cambien las casillas del plan o `git status`, el constructor avanza; se interrumpe solo al cumplirse el plazo y antes de relanzar se lee el final de su sesión para conocer la causa. Mantener la espera única existente.

## Escenarios
- CUANDO se revisa F13 ENTONCES aparecen avisos con línea para la carpeta y los pasos deficientes y la multiplicidad de pantallas (A1).
- CUANDO se revisan planes bien cortados o entradas erróneas ENTONCES el resultado y el código de salida distinguen ausencia de avisos, avisos y error (A2).
- CUANDO un tramo rebasa cada límite ENTONCES se identifica el motivo y la línea, sin falsos avisos por pruebas, documentos o exclusiones (A3).
- CUANDO el principal prepara un plan ENTONCES ejecuta la revisión, corrige y explica los avisos residuales; las reglas de tamaño e interrupción reflejan el pedido (A4).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | F13 detectado | Ejecutar script sobre el F13 local y sobre un fixture portátil fiel a su tramo 1 | Avisos con líneas de `app/`, pasos sin archivo y sin comprobación, y varias pantallas; exit 1 |
| A2 | Contrato CLI y solo lectura | Tests de proceso para plan correcto, sin argumento y ruta inexistente; comparar contenido antes y después | Plan correcto: stdout vacío y exit 0; errores: stderr y exit 2; archivos intactos |
| A3 | Límites y sensibilidad | Tests independientes: 3/4 archivos, carpeta, comprobación en sublínea, 1/2 pantallas, 1/2 capas, exclusiones, 8192/8193 bytes y planes por tramos y sin tramos; mutar un plan correcto para cada clase | Sin avisos en límites válidos; cada mutación produce aviso de motivo y línea correctos |
| A4 | Flujo del principal y texto | Inspeccionar ambos documentos y ejecutar pruebas integradas en `./verify` | Revisión antes de aprobación, corrección y explicación; frase pedida y criterio de interrupción presentes; textos anteriores requeridos conservados; `VERIFY OK` |

## Verificación
`./verify` — aceptación completa desde cero; debe pasar e incluir las pruebas del script.

## Pasos
- [x] Crear `scripts/revisar-plan.mjs` con el contrato CLI, análisis y ayuda anteriores; comprobar con `node scripts/revisar-plan.mjs` que sin argumento termina con exit 2 (A1, A2, A3).
  - evidencia: `$ node scripts/revisar-plan.mjs` → `Error: indica exactamente un archivo Markdown.`; exit 2.
- [x] Crear `pruebas/revisar-plan/` con el fixture F13 fiel, un plan correcto y pruebas de proceso para A1–A3, incluidas mutaciones; comprobar con `node --test pruebas/revisar-plan/*.test.mjs` que pasan (A1, A2, A3).
  - evidencia: `node --test --test-reporter=spec pruebas/revisar-plan/revisar-plan.test.mjs`: 10 tests, 10 pass, 0 fail; exit 0. Incluye regresiones para `Archivos:` en línea de `Resultado:`, archivo entre acentos sin comprobación y verificación del tramo fuera del paso. El fixture fiel reporta carpeta, 4 pasos deficientes y varias pantallas.
- [x] Integrar esas pruebas en `verify`; comprobar con `./verify` que se ejecutan y el resultado es `VERIFY OK` (≈10 min) (A4).
  - evidencia: `./verify` ejecutó el paso 10b (10 tests, 10 pass, 0 fail) y terminó `VERIFY OK`; exit 0.
- [x] Ajustar `skills/planificar-cambio/SKILL.md` según las decisiones; comprobar con `rg -n 'Un tramo es lo que|No hay herramienta' skills/planificar-cambio/SKILL.md` que aparece la frase nueva y no la afirmación obsoleta (A4).
  - evidencia: `rg` encontró la frase nueva en línea 94; no queda la afirmación obsoleta.
- [x] Ajustar `agentes/principal.md` con revisión previa e interrupción; comprobar con `rg -n 'revisar-plan|casillas|sesión' agentes/principal.md` que aparecen ambas instrucciones y revisar su ubicación (A4).
  - evidencia: `rg -n 'revisar-plan|casillas|sesión' agentes/principal.md` confirma revisión de `plan.md` y documentos de tramo en línea 48, e interrupción por cambio de casillas o `git status` en línea 53; se conserva la espera única.
- [x] Ejecutar `./verify` y registrar en este plan la salida y código; comprobar que termina con `VERIFY OK` y exit 0 (≈10 min) (A4).
  - evidencia: corrida final de `./verify` terminó con `VERIFY OK`; exit 0.

## Evidencia
- `$ node --test --test-reporter=spec pruebas/revisar-plan/revisar-plan.test.mjs`
  ```text
  ℹ tests 10
  ℹ pass 10
  ℹ fail 0
  exit 0
  ```
- `$ node scripts/revisar-plan.mjs /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md`
  ```text
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:56: Archivos: nombra una carpeta; declara rutas de archivo explícitas
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:55: el tramo cubre varias pantallas: acceso, saldo inicial, resumen
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:55: el tramo cubre varias capas: interfaz, datos
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:57: el paso no indica cómo se comprueba
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:58: el paso no nombra una ruta de archivo
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:58: el paso no indica cómo se comprueba
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:59: el paso no nombra una ruta de archivo
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:59: el paso no indica cómo se comprueba
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:60: el paso no nombra una ruta de archivo
  /home/franco/Codes/flucastr/Flucastr.DonFinancio/cambios/F13-diseno-integral/plan.md:60: el paso no indica cómo se comprueba
  ... 17 avisos adicionales de tramos 2 y 3; exit 1
  ```
- `$ node scripts/revisar-plan.mjs pruebas/revisar-plan/fixtures/plan-correcto.md`
  ```text
  (stdout vacío; exit 0)
  ```
- `$ git status --short --untracked-files=all`
  ```text
  ?? pruebas/revisar-plan/fixtures/f13-tramo1.md
  ?? pruebas/revisar-plan/fixtures/plan-correcto.md
  ?? pruebas/revisar-plan/revisar-plan.test.mjs
  exit 0
  ```
- `$ ./verify`
  ```text
  == 10b. revisor de planes: pruebas de scripts/revisar-plan.mjs ==
  ℹ tests 10; ℹ pass 10; ℹ fail 0
  ok 10b: pruebas del revisor de planes pasaron
  ...
  VERIFY OK
  exit 0
  ```

## Notas
La búsqueda en `verify` y pruebas no encontró exigencia de la frase «≈6 pasos». El paso 11 de `verify` exige otros textos de la regla 11, que se conservan. El F13 real está fuera de este checkout en la ruta absoluta usada en Evidencia; el fixture portátil reproduce su tramo 1.

Revisión DEVUELTO corregida: el parser reconoce `Archivos:` en la misma línea que `Resultado:`; las pruebas distinguen ruta de comprobación y excluyen `Verificación del tramo:` del paso; `.gitignore` permite versionar la suite y sus fixtures; el principal revisa `plan.md` y todos los documentos de tramo. Ejecutado el F13 real: avisos de carpeta, pasos incompletos, varias pantallas y capas. `./verify` pasó con 10 pruebas integradas.
