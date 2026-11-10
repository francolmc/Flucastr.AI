# Tramo 1 — Reescribir `agentes/principal.md`

Resultado: el principal tiene lista de lo permitido, revisión acotada con veredicto y presupuesto, y ≤ 8000 bytes.
Archivos: `agentes/principal.md`.
Antes: lee `agentes/principal.md` entero una vez y `skills/preparar-proyecto/SKILL.md` y `skills/definir-proyecto/SKILL.md` (solo para el paso 6).

## Pasos
- [x] En el frontmatter `description`, cambia «Sin límites de trabajo salvo las reglas duras.» por «Planifica y revisa; todo cambio del repositorio lo ejecuta el constructor.» (A1)
  - evidencia: `agentes/principal.md` línea 3 (frontmatter `description`)
- [x] En el párrafo inicial, cambia «Si el trabajo es pequeño o de diagnóstico, lo haces tú.» por «El diagnóstico lo haces tú y dejas el hallazgo en `cambios/<nombre>/`. Cualquier edición del repositorio, aunque sea de una línea, va por plan y la hace el constructor, que cuesta de 10 a 20 veces menos por token.» (A1)
  - evidencia: `agentes/principal.md` párrafo inicial; la frase cambió a «El diagnóstico es tuyo…» para que «lo haces tú» no aparezca (ver *Notas*)
- [x] En *Reglas duras*, reemplaza la línea «Fuera de eso no tienes límites…» por: «Puedes leer cualquier archivo y correr comandos de solo lectura. Solo creas o editas archivos dentro de `cambios/<nombre>/`, y el `AGENTS.md` y `docs/proyecto.md` del proyecto en el cierre o cuando `definir-proyecto` o `preparar-proyecto` te lo indiquen. Cualquier otra edición la hace el constructor, salvo `ejecutor: principal` pedido expresamente por Franco.» (A1)
  - evidencia: `agentes/principal.md`, regla de *Reglas duras* con «Solo creas o editas» (en la versión final dice «Puedes leer y correr comandos de lectura.» por el recorte de tamaño; ver *Notas*)
- [x] En *Pedido completo*, cambia «Un arreglo así, claro y pequeño, lo haces tú y lo verificas.» por «Un arreglo así va en un plan de un solo tramo.» (A1)
  - evidencia: `agentes/principal.md`, paso 3, «Pedido completo»
- [x] Reemplaza el punto `COMPLETADO` de *Al volver el constructor* por este texto exacto (A2):
  «`COMPLETADO`: revisa el `git diff` de los archivos del *Alcance*, la cola de la *Evidencia* y las *Notas*, y marca cada fila de Aceptación como cumplida o con defecto. Corre la *Verificación* del plan una sola vez, en una sola espera, y lee su cola. No escribas scripts ni levantes servidores o contenedores para revisar. Si falla por el entorno (Docker, red, permisos), haz como máximo un diagnóstico de dos comandos y avisa a Franco. Un defecto, aunque sea de una línea, no lo corriges: anótalo en *Notas* (archivo, línea, criterio que incumple), pon el plan en `estado: aprobado` y relanza al constructor, hasta 2 relanzamientos; después deja el cambio `parcial` y di a Franco el detalle. Si todo se cumple, **puerta 2**: Franco revisa y hace el commit.»
  - evidencia: `agentes/principal.md`, paso 5, viñeta `COMPLETADO` (el texto está con «Un defecto, aunque sea de una línea, se devuelve: no corriges; anótalo…», ver *Notas*)
- [x] Añade tras ese punto este texto exacto (A2):
  «La revisión termina con un veredicto: APROBADO, DEVUELTO o PAUSA. Escríbelo y detente. Presupuesto desde el retorno hasta el veredicto: cambios `tipo: docs`, hasta 6 llamadas; de código, hasta 15. Si llegas sin veredicto, escribe PAUSA con lo que falta.»
  - evidencia: `agentes/principal.md`, paso 5, párrafo del veredicto (rg: APROBADO, DEVUELTO y PAUSA presentes; «6» y «15» en el presupuesto)
- [x] En *Revisión por tramo*, borra el párrafo «Además, corre una comprobación propia…» y pon: «Si una pregunta no se puede responder con el diff y la evidencia, es un defecto del plan: anótalo en *Notas* como mejora para el próximo plan.» (A1, A2)
  - evidencia: `agentes/principal.md`, sección «Revisión por tramo»; `rg -c 'comprobación propia'` sin coincidencias (la versión final reescribe las cuatro preguntas en un párrafo; la frase del plan está en ese párrafo)
- [x] En el punto de plan por tramos, deja «corre su `Verificación del tramo:`» pero cambia «Haz la «Revisión por tramo» antes de avanzar.» por «Responde la «Revisión por tramo» antes de avanzar.» (A2)
  - evidencia: `agentes/principal.md`, paso 5, viñeta de plan por tramos
- [x] Recorta lo que repita otra skill o este mismo texto hasta ≤ 8000 bytes sin perder las cadenas de `verify` (lista en `plan.md`, Decisiones). Comprueba cada una con `grep -F` (A6)
  - evidencia: `wc -c agentes/principal.md` = 7998; `grep -cF` con «Nunca decides tú», «definir-proyecto», «prepárame el despliegue», «git diff», «ejecutor: principal», «claude-constructor», «docker system prune», «ceremonia de cierre», «abrir el PR», «Prueba de ejecutabilidad», «carga la skill `ejecutar-plan`», «hacia su `base:`», «petición expresa», «Revisión por tramo», «tramo: <n>», «una sola espera», «send_message»: todas ≥ 1
- [x] Anota en *Notas* si `preparar-proyecto` o `definir-proyecto` mandan al principal escribir archivos fuera de la lista del paso 3; no cambies esas skills (A1)
  - evidencia: `plan.md`, *Notas* (`skills/preparar-proyecto/SKILL.md` línea 90 y `skills/definir-proyecto/SKILL.md` línea 26); skills sin cambios
- [x] `./verify` (A1, A2, A6)
  - evidencia: `./verify`, exit 0 (salida en `plan.md`, *Evidencia*)

### Correcciones de la revisión (relanzamiento 1)
- [x] Separa en dos viñetas «Nunca decides tú…» y «Ante «prepárame el despliegue»…», y restituye «La detección de hijos con `.git` es un hecho; la decisión es suya.» (A1)
  - evidencia: `agentes/principal.md`, *Reglas duras*: líneas 16 y 17 separadas; `grep -cF 'La detección de hijos con `.git` es un hecho'` = 1
- [x] En el paso 4 de *Cómo trabajas*, restituye la exigencia de base al día: «y al día (`git fetch` y `git rev-list --count HEAD..origin/<base>` en 0; sin remoto se omite)». (A2)
  - evidencia: `agentes/principal.md`, paso 4; `grep -cF 'git rev-list --count HEAD..origin/<base>'` = 1
- [x] En *Revisión por tramo*, cambia «se corrige o se pausa» por «se devuelve al constructor o se pausa». (A2)
  - evidencia: `agentes/principal.md`, *Revisión por tramo*; `grep -c 'se corrige'` = 0
- [x] Mantén ≤ 8000 bytes recortando redundancias (p. ej. de *Cuándo preguntar* o *Al terminar*), sin perder ninguna de las 12 cadenas de `verify`. (A6)
  - evidencia: `wc -c agentes/principal.md` = 7956; las cadenas de `verify` (`grep -cF`) siguen ≥ 1. Recortes: el porqué de costo en el párrafo inicial, la frase del traspaso en el paso 4, el detalle de comandos Docker en el paso 5 y «Workspaces» en *Reglas duras* (no se tocó *Cuándo preguntar* ni *Al terminar*)
- [x] `./verify` (A1, A2, A6)
  - evidencia: `./verify`, exit 0 (salida en `plan.md`, *Evidencia*, corrida de relanzamiento 1)

Verificación del tramo: `./verify`; cubre A1, A2, A6.
