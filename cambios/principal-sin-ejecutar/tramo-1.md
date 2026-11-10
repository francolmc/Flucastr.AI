# Tramo 1 — Reescribir `agentes/principal.md`

Resultado: el principal tiene lista de lo permitido, revisión acotada con veredicto y presupuesto, y ≤ 8000 bytes.
Archivos: `agentes/principal.md`.
Antes: lee `agentes/principal.md` entero una vez y `skills/preparar-proyecto/SKILL.md` y `skills/definir-proyecto/SKILL.md` (solo para el paso 6).

## Pasos
- [ ] En el frontmatter `description`, cambia «Sin límites de trabajo salvo las reglas duras.» por «Planifica y revisa; todo cambio del repositorio lo ejecuta el constructor.» (A1)
- [ ] En el párrafo inicial, cambia «Si el trabajo es pequeño o de diagnóstico, lo haces tú.» por «El diagnóstico lo haces tú y dejas el hallazgo en `cambios/<nombre>/`. Cualquier edición del repositorio, aunque sea de una línea, va por plan y la hace el constructor, que cuesta de 10 a 20 veces menos por token.» (A1)
- [ ] En *Reglas duras*, reemplaza la línea «Fuera de eso no tienes límites…» por: «Puedes leer cualquier archivo y correr comandos de solo lectura. Solo creas o editas archivos dentro de `cambios/<nombre>/`, y el `AGENTS.md` y `docs/proyecto.md` del proyecto en el cierre o cuando `definir-proyecto` o `preparar-proyecto` te lo indiquen. Cualquier otra edición la hace el constructor, salvo `ejecutor: principal` pedido expresamente por Franco.» (A1)
- [ ] En *Pedido completo*, cambia «Un arreglo así, claro y pequeño, lo haces tú y lo verificas.» por «Un arreglo así va en un plan de un solo tramo.» (A1)
- [ ] Reemplaza el punto `COMPLETADO` de *Al volver el constructor* por este texto exacto (A2):
  «`COMPLETADO`: revisa el `git diff` de los archivos del *Alcance*, la cola de la *Evidencia* y las *Notas*, y marca cada fila de Aceptación como cumplida o con defecto. Corre la *Verificación* del plan una sola vez, en una sola espera, y lee su cola. No escribas scripts ni levantes servidores o contenedores para revisar. Si falla por el entorno (Docker, red, permisos), haz como máximo un diagnóstico de dos comandos y avisa a Franco. Un defecto, aunque sea de una línea, no lo corriges: anótalo en *Notas* (archivo, línea, criterio que incumple), pon el plan en `estado: aprobado` y relanza al constructor, hasta 2 relanzamientos; después deja el cambio `parcial` y di a Franco el detalle. Si todo se cumple, **puerta 2**: Franco revisa y hace el commit.»
- [ ] Añade tras ese punto este texto exacto (A2):
  «La revisión termina con un veredicto: APROBADO, DEVUELTO o PAUSA. Escríbelo y detente. Presupuesto desde el retorno hasta el veredicto: cambios `tipo: docs`, hasta 6 llamadas; de código, hasta 15. Si llegas sin veredicto, escribe PAUSA con lo que falta.»
- [ ] En *Revisión por tramo*, borra el párrafo «Además, corre una comprobación propia…» y pon: «Si una pregunta no se puede responder con el diff y la evidencia, es un defecto del plan: anótalo en *Notas* como mejora para el próximo plan.» (A1, A2)
- [ ] En el punto de plan por tramos, deja «corre su `Verificación del tramo:`» pero cambia «Haz la «Revisión por tramo» antes de avanzar.» por «Responde la «Revisión por tramo» antes de avanzar.» (A2)
- [ ] Recorta lo que repita otra skill o este mismo texto hasta ≤ 8000 bytes sin perder las cadenas de `verify` (lista en `plan.md`, Decisiones). Comprueba cada una con `grep -F` (A6)
- [ ] Anota en *Notas* si `preparar-proyecto` o `definir-proyecto` mandan al principal escribir archivos fuera de la lista del paso 3; no cambies esas skills (A1)
- [ ] `./verify` (A1, A2, A6)

Verificación del tramo: `./verify`; cubre A1, A2, A6.
