---
estado: listo
rama: feature/niveles-verificacion
base: main
repos: [.]
ejecutor: constructor
---
# Niveles de verificación: comprobación rápida y E2E solo al cerrar el flujo

## Objetivo
Un cambio chico se verifica con una comprobación rápida del host (tipos, lint, tests), sin Docker. El `verify` con E2E corre solo al completar el flujo (tramo final) o cuando el plan lo declara. Evidencia: `cambios/auditoria-codex-permisos-esperas/hallazgo.md` (verify de DonFinancio: ≈20 min por corrida, 43 corridas en una sesión).

## Supuestos
- «Cambio chico»: un solo repo, hasta ≈3 archivos, sin migración, sin cambio de contrato de API ni de ruta o pantalla del recorrido. Si Franco quiere otro umbral, cambia una cifra en un paso.
- La comprobación rápida la declara cada proyecto en su `AGENTS.md` con una línea `Comprobación rápida: <comando>`. Sin esa línea, todo funciona como hoy (la verificación sigue siendo `verify`).
- Declarar la línea en Byteria y DonFinancio queda fuera de este plan: son dos planes aparte, uno por proyecto.

## Alcance
Puede cambiar: `skills/planificar-cambio/SKILL.md`, `skills/preparar-proyecto/SKILL.md`, `skills/ejecutar-plan/SKILL.md`, `agentes/principal.md`, `README.md` (una viñeta) y `verify` (bloque nuevo 8m).
Fuera de alcance: `agentes/constructor.md`, `modelos.json`, `scripts/`, los proyectos Byteria y DonFinancio.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: requisitos cubiertos, archivos accesibles, comprobaciones con resultado esperado, sin credenciales ni producción.
- Tres niveles, con estos nombres: **Nivel 1** `Comprobación rápida` (host, sin Docker, segundos); **Nivel 2** `VERIFY_RAPIDO=1 ./verify` (Docker con caché); **Nivel 3** `./verify` sin caché (aceptación final).
- Cambio chico: la *Verificación* del plan es solo el Nivel 1, más un test que cubra el cambio.
- Plan por tramos: `Verificación del tramo:` es Nivel 1 en los tramos que no completan el flujo; Nivel 2 en el tramo que deja el flujo conectado de punta a punta; Nivel 3 solo en la corrida final de aceptación (último tramo).
- El principal corre al revisar lo mismo que el plan declara; no sube de nivel por su cuenta.
- Se conserva «una sola espera» en `principal.md` y no se toca el tope de 3 corridas finales de `ejecutar-plan`.

## Escenarios
- CUANDO el cambio es chico ENTONCES `planificar-cambio` manda poner solo el Nivel 1 como *Verificación* (A1)
- CUANDO el plan tiene tramos ENTONCES cada `Verificación del tramo:` dice su nivel y el E2E solo está en el que completa el flujo (A2)
- CUANDO el proyecto no declara `Comprobación rápida` ENTONCES se usa `verify` como hoy (A3)
- CUANDO el constructor termina una unidad coherente ENTONCES corre la `Comprobación rápida`, no el `verify` con Docker (A4)
- CUANDO se quita la regla de niveles de `planificar-cambio` ENTONCES `./verify` falla (A5)

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Regla 12 «Niveles de verificación» en `planificar-cambio` con las tres definiciones y el umbral de cambio chico | `grep -F 'Niveles de verificación' skills/planificar-cambio/SKILL.md` y `grep -F 'Comprobación rápida' skills/planificar-cambio/SKILL.md` | ambos encuentran línea |
| A2 | Regla 11 pide el nivel en cada `Verificación del tramo:` | `grep -F 'Nivel 2' skills/planificar-cambio/SKILL.md` | encuentra la frase del tramo que completa el flujo |
| A3 | `preparar-proyecto` y `planificar-cambio` dicen que sin la línea se usa `verify` | `grep -F 'Sin esa línea' skills/preparar-proyecto/SKILL.md` | encuentra línea |
| A4 | `ejecutar-plan` manda correr la `Comprobación rápida` por unidad | `grep -F 'Comprobación rápida' skills/ejecutar-plan/SKILL.md` | encuentra línea |
| A5 | Sensibilidad: una copia sin la regla falla | bloque 8m de `verify` | la copia de `planificar-cambio` sin «Niveles de verificación» hace fallar la comprobación |
| A6 | Todo el kit coherente | `./verify` | exit 0 |

## Verificación
`./verify` (unos minutos, sin Docker) — debe terminar con exit 0.

## Pasos
- [x] En `skills/planificar-cambio/SKILL.md`, añade la regla 12 «Niveles de verificación» con las definiciones de Nivel 1, 2 y 3, el umbral de cambio chico del *Supuesto* y la fila de «sin la línea, se usa `verify`». Máximo 8 líneas. (A1, A3)
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 96 (regla 13 «Niveles de verificación»; ver *Notas* sobre el número)
- [x] En la regla 11 (Tramos) de esa skill, añade que cada `Verificación del tramo:` declara su nivel y que el Nivel 2 va solo en el tramo que completa el flujo. (A2)
  - evidencia: `skills/planificar-cambio/SKILL.md` línea 94 (final de la regla 11)
- [x] En `skills/preparar-proyecto/SKILL.md`, bajo `## Comandos` de la plantilla de `AGENTS.md`, añade la línea `- Comprobación rápida: \`...\`` (tipos + lint + tests unitarios del host, sin Docker). Añade una frase: «Sin esa línea el plan usa `verify`.». (A3)
  - evidencia: `skills/preparar-proyecto/SKILL.md` línea 26
- [x] En `skills/ejecutar-plan/SKILL.md`, en *Bucle de ejecución*, sustituye «Verifica cada unidad coherente al terminarla» por la misma idea con la `Comprobación rápida` del `AGENTS.md` (si existe) y deja el `verify` con Docker para *Verificación final* y para `Verificación del tramo:`. (A4)
  - evidencia: `skills/ejecutar-plan/SKILL.md` línea 36
- [x] En `agentes/principal.md`, paso 5 de tramos: añade «corre el nivel que ese tramo declara; no subas de nivel por tu cuenta». Conserva «una sola espera». (A2)
  - evidencia: `agentes/principal.md` línea 37 (paso 5, «Plan por tramos»); «una sola espera» sigue en el paso 4
- [x] En `README.md`, añade una viñeta en «Verificación» con los tres niveles. (A1)
  - evidencia: `README.md` sección «Verificación», viñeta tras el párrafo (línea 49)
- [x] En `verify`, añade tras 8l un bloque 8m con el patrón de 8k: comprueba las cuatro frases de A1 a A4 en sus archivos y que una copia de `planificar-cambio` sin «Niveles de verificación» falla. (A5)
  - evidencia: `verify` bloque «8m», entre 8l y 9a; salida `ok 8m: niveles de verificación ...`
- [x] Corre `./verify` (unos minutos) y copia su cola en *Evidencia*. (A6)
  - evidencia: `./verify`, exit 0 (ver *Evidencia*)

## Evidencia
$ ./verify
ok 8l: principal con «yield_time_ms: 300000» y «no cuentan»; copia sin la receta falla
ok 8m: niveles de verificación en planificar-cambio, «Sin esa línea» en preparar-proyecto y Comprobación rápida en ejecutar-plan; copia sin «Niveles de verificación» falla
...
== 13. kit run: arnés con constructor, verify y revisor simulados ==
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
...
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

## Notas
- Numeración: la regla nueva es la 13 y no la 12 del plan, porque la 12 ya es «Tipo» y la plantilla de `planificar-cambio` la cita. No se renumeró. A1 se comprueba con `grep`, que no mira el número.
- Bloque 8m: además de las cuatro comprobaciones, la copia temporal positiva se valida antes de quitar la regla, para que la prueba negativa falle por el motivo esperado.
- `ejecutar-plan`, línea 36: la cláusula «con el nivel que declara» en *Verificación final* y `Verificación del tramo:` sigue la regla 13; no cambia el tope de 3 corridas finales.
