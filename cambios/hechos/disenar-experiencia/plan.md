---
estado: listo
rama: feature/disenar-experiencia
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Skill `disenar-experiencia` y su enlace en el flujo

## Objetivo
El principal diseña la experiencia antes de planificar cualquier cambio que toque pantallas: deja un boceto que Franco ve en la terminal y lo aprueba en la puerta 1. Evidencia del problema: `cambios/auditoria-donfinancio-diseno/hallazgo.md`.

## Supuestos
- Nombre de la skill: `disenar-experiencia`. Si Franco prefiere otro, cambia la carpeta y cada mención.
- El boceto es ASCII simple (`+ - |`), de hasta 40 columnas (móvil primero), y el principal lo pega en su respuesta. Franco trabaja en Orca y solo ve la terminal.
- HTML estático solo si Franco lo pide; no es el camino por defecto.
- Este plan no rediseña DonFinancio: eso es un plan aparte, después de este.

## Alcance
Puede cambiar: `skills/disenar-experiencia/SKILL.md` (nuevo), `skills/planificar-cambio/SKILL.md`, `skills/definir-proyecto/SKILL.md`, `agentes/principal.md`, `AGENTS.md` (la línea de skills), `README.md` (una viñeta) y `verify` (bloque nuevo 8o).
Fuera de alcance: `agentes/constructor.md`, `modelos.json`, `instalar.sh`, `scripts/`, los proyectos que usan el kit.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: requisitos cubiertos, archivos accesibles, comprobaciones con resultado esperado, sin credenciales ni producción.
- Alcance B (decidido por Franco): la skill más su enlace en `planificar-cambio`, `definir-proyecto` y `principal.md`.
- Boceto ASCII por defecto (decidido por Franco): lo único que ve en Orca es la terminal.
- `instalar.sh` y `verify` (paso 4) ya descubren `skills/*/`; no hay que registrar la skill en ningún otro sitio.
- Dos documentos que produce la skill: `docs/experiencia.md` (una vez por proyecto) y `cambios/<nombre>/pantallas.md` (por cambio que toca UI).

## Escenarios
- CUANDO se lee `skills/disenar-experiencia/SKILL.md` ENTONCES trae `docs/experiencia.md`, `pantallas.md`, la regla del boceto ASCII de 40 columnas pegado en la respuesta, los estados (vacío, carga, error, éxito) y la lista de comprobación de usabilidad (A1).
- CUANDO el cambio toca pantallas ENTONCES `planificar-cambio` exige cargar la skill, enlazar `pantallas.md` y añadir filas de experiencia a la Aceptación (A2).
- CUANDO se define un proyecto con interfaz ENTONCES `definir-proyecto` pregunta quién lo usa y cuál es su tarea frecuente, y deja `docs/experiencia.md` como paso siguiente (A3).
- CUANDO el principal recibe un cambio con pantallas ENTONCES `principal.md` lo remite a la skill antes de planificar (A3).
- CUANDO una copia de la skill pierde la regla del boceto ASCII ENTONCES el bloque 8o de `verify` falla (A4).
- CUANDO se corre todo el kit ENTONCES los bloques existentes siguen pasando (A5).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | La skill tiene su contenido mínimo | `grep -cF` de `docs/experiencia.md`, `pantallas.md`, `ASCII`, `40 columnas`, `vacío`, `error` en el `SKILL.md` | cada cadena con 1 o más coincidencias |
| A2 | `planificar-cambio` la exige | `grep -nF 'disenar-experiencia' skills/planificar-cambio/SKILL.md` y `grep -nF 'pantallas.md' …` | ambas con coincidencia, dentro de una regla numerada nueva |
| A3 | Enlaces en `definir-proyecto` y `principal.md` | `grep -cF 'disenar-experiencia'` en ambos | 1 o más en cada archivo |
| A4 | El chequeo es sensible | copia del `SKILL.md` sin la línea con `40 columnas` (`sed`); correr la función del bloque 8o | falla para la copia, pasa para el original |
| A5 | No se rompe lo vecino | `./verify` | exit 0; `ok 4` cubre la skill nueva (`name` = carpeta) y aparece `ok 8o` |

## Verificación
`./verify` — offline, sin Docker del proyecto; debe terminar en exit 0.

## Pasos
- [x] Crea `skills/disenar-experiencia/SKILL.md` con frontmatter `name: disenar-experiencia` y `description` de una frase que diga cuándo cargarla (A1)
  - evidencia: `skills/disenar-experiencia/SKILL.md` (4205 bytes; frontmatter con name y description; `./verify` bloque 4 «ok disenar-experiencia» y 8o)
  - contenido: Cuándo usarla (proyecto nuevo con interfaz; cambio que agrega o reordena pantallas); Antes (máx. 3 preguntas cerradas, solo lo que no esté en el contexto); plantilla de `docs/experiencia.md`; plantilla de `pantallas.md`; Reglas de oficio; Lista de comprobación; Cierre. Unos 6 KB como máximo.
- [x] En esa skill, `docs/experiencia.md` lleva: Quién usa, Tareas frecuentes (3–5, con frecuencia), Modelo mental actual (qué herramienta usa hoy), Vocabulario permitido y prohibido, Mapa de pantallas, Principios (A1)
  - evidencia: `skills/disenar-experiencia/SKILL.md`, plantilla «docs/experiencia.md» (escrito en el mismo archivo que el paso anterior)
- [x] En esa skill, `pantallas.md` lleva por pantalla: objetivo, boceto ASCII de hasta 40 columnas, estados vacío/carga/error/éxito, textos exactos, acción principal y secundarias (A1)
  - el boceto se pega también en la respuesta al pedir la puerta 1; no basta con el archivo.
  - evidencia: `skills/disenar-experiencia/SKILL.md`, plantilla «pantallas.md» y párrafo de cierre que pide pegar el boceto
- [x] En esa skill, reglas de oficio y lista de comprobación: una tarea principal por pantalla; lo frecuente a un toque; nunca dos formularios a la vez; lenguaje de la persona; objetivos táctiles de 44 px; errores que digan cómo seguir; contraste y foco visibles; móvil a 390 px primero (A1)
  - evidencia: `skills/disenar-experiencia/SKILL.md`, secciones «Reglas de oficio» y «Lista de comprobación»
- [x] En `planificar-cambio`, añade la regla 14 «Experiencia»: si el plan toca pantalla, ruta o flujo de UI, carga `disenar-experiencia`, enlaza `pantallas.md` en *Alcance*, añade filas de experiencia a *Aceptación* (tarea completable en N pasos, sin términos prohibidos, captura a 390 px sin desborde) y presenta el boceto en la puerta 1 (A2)
  - evidencia: `skills/planificar-cambio/SKILL.md`, regla 14 «Experiencia» tras la regla 13; `./verify` bloque 8o
- [x] En `definir-proyecto`, en el primer tiempo añade a las preguntas posibles «quién lo usa y cuál es su tarea frecuente» si el proyecto tiene interfaz; en el Cierre, como siguiente paso, `disenar-experiencia` antes del esqueleto de UI (A3)
  - evidencia: `skills/definir-proyecto/SKILL.md`, pregunta 4 del primer tiempo y punto 3 del Cierre; `./verify` bloque 8o
- [x] En `agentes/principal.md`, paso 1 («Entiende»), añade una línea: si el cambio toca pantallas, carga `disenar-experiencia` antes de planificar (A3)
  - evidencia: `agentes/principal.md`, paso 1 «Entiende»; `./verify` bloque 8o
- [x] En `verify`, copia el patrón del bloque 8l como bloque 8o: función que exige en el `SKILL.md` las cadenas de A1 y en `planificar-cambio` y `definir-proyecto` la mención de la skill; copia negativa con `sed` que quita `40 columnas` (A4)
  - evidencia: `verify`, bloque 8o (tras 8n); la copia sin «40 columnas» falla y el original pasa (`ok 8o`)
- [x] En `AGENTS.md` añade la skill a la línea de skills; en `README.md`, una viñeta junto a la de niveles de verificación (A5)
  - evidencia: `AGENTS.md` línea «Skills» con `disenar-experiencia`; `README.md` viñeta «Experiencia antes del plan» después de la de niveles de verificación
- [x] Corre `./verify` y pega la cola en *Evidencia* (≈ unos minutos; el verify del kit es offline) (A5)
  - evidencia: `./verify` exit 0; ver *Evidencia*

## Evidencia
$ ./verify
...
ok disenar-experiencia
...
ok 8o: disenar-experiencia con sus cadenas, enlazada en planificar-cambio, definir-proyecto y principal; copia sin «40 columnas» falla
...
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
VERIFY OK
exit 0

## Notas
- Decisión menor: la viñeta de README se puso en la sección «Verificación», junto a la de niveles, como dice el paso; la descripción del README se redactó como viñeta de «Experiencia antes del plan».
- Los pasos 2 y 3 se escribieron en el mismo `SKILL.md` que el paso 1; el contenido de cada uno está en las secciones indicadas.
- A4 se comprobó con el bloque 8o del `verify` (copia temporal sin «40 columnas» falla); no se corrió a mano aparte.
- Sin fallos relacionados que corregir. Sin tramos: el plan es de un solo tramo.
- Pendiente de Franco: revisar la skill en la puerta 2; no se hizo commit.
