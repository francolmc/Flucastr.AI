# Investigación: fiabilidad de planificación y traspaso al constructor

Fecha: 2026-11-07. Estado: diagnóstico para revisión; **no es un plan aprobado ni propone cambios ya aplicados**.

## Conclusión ejecutiva

No hay evidencia suficiente para concluir que «el constructor falla porque el plan tiene poco detalle» o que «hay que subir el modelo». Sí hay evidencia de tres debilidades distintas:

1. **Aceptación insuficientemente definida:** en el help, el plan pedía comprobar opciones, pero no comprobar que el propio verificador pudiera detectar una omisión. Una suite verde podía aceptar una comprobación que no hacía nada.
2. **Contrato de ejecución contradictorio:** hay instrucciones incompatibles sobre cuándo pausar, cuándo verificar y qué herramientas de lectura de Git se permiten.
3. **Evaluación del flujo incompleta:** `verify` comprueba muchas frases de los prompts, pero eso no mide si el constructor termina correctamente tareas reales.

La recomendación es revisar primero el contrato plan → ejecución → aceptación y después medir cambios acotados. No agregar otra lista de prohibiciones ni aumentar indiscriminadamente los planes.

## 1. Qué aporta la investigación externa

### 1.1 Es un problema conocido, incluso con modelos de mayor capacidad

Anthropic describe dos fallos en agentes de programación de larga duración: intentar demasiado de una vez y declarar terminado un trabajo incompleto. Su solución combina avances acotados, estado persistente y pruebas reales antes de declarar una funcionalidad completada [1].

**Aplicación:** «no te detengas» y una lista de casillas no sustituyen una unidad de trabajo verificable. El documento presenta una experiencia de ingeniería, no una garantía para nuestros modelos.

**No adoptar literalmente:** el ejemplo permite commits y reversiones del agente; aquí siguen prohibidos. Podemos conservar evidencia y puntos de recuperación sin otorgar esas facultades.

### 1.2 El traspaso necesita objetivo, límites, resultado y herramientas; no necesariamente más prosa

El equipo de Research de Anthropic recomienda que cada subagente reciba objetivo, formato de salida, herramientas y límites claros. También recomienda evaluar resultados finales y checkpoints, no exigir una trayectoria rígida de llamadas [2].

**Aplicación:** enviar solo la ruta y la rama es válido si el documento contiene el contrato completo y el agente puede acceder al contexto necesario. El mensaje corto de lanzamiento no es, por sí mismo, el fallo.

**Límite:** sus resultados de investigación multiagente no demuestran una mejora cuantitativa en programación ni justifican añadir más agentes a este kit.

### 1.3 Mejor contexto no equivale a más instrucciones

Anthropic aconseja instrucciones claras y directas, con el conjunto mínimo de información suficiente. Advierte contra lógica frágil codificada en prompts y listas exhaustivas de casos; recomienda ejemplos representativos y acceso al contexto cuando se necesita [3].

**Aplicación:** resolver contradicciones y eliminar duplicación tiene más fundamento que añadir más «nunca», más reglas administrativas o límites de palabras más estrictos.

### 1.4 Persistencia útil = implementar, verificar, observar y reparar

La guía de Codex pide autonomía hasta completar implementación y verificación, pero también detectar bucles sin progreso [4]. El experimento de tareas largas describe hitos con aceptación y comandos, reparación al fallar y estado durable [5].

**Aplicación:** verificar al completar una unidad coherente, no solo al final de toda la lista. Distinguir un bloqueo real de una interrupción recuperable.

**Límite:** el experimento de 25 horas es un caso individual con otro modelo y otro harness. No permite prometer fiabilidad equivalente. Tampoco trasladaría literalmente consejos particulares de Codex sobre mensajes de avance a Pi.

### 1.5 Hay que evaluar al verificador y separar lo declarado de lo ocurrido

Anthropic distingue transcript, resultado final y grader; recomienda entornos aislados, múltiples intentos, casos positivos y negativos, revisión de trazas y graders resistentes a bypasses [6].

Un estudio empírico sobre SWE-bench Verified encontró parches aceptados por la validación que fallaban la suite escrita por desarrolladores: 7,8 % en su muestra [7].

**Aplicación:** una salida 0 prueba que se satisfizo ese verificador, no que todos los requisitos estén cubiertos. El dato del estudio no estima nuestra tasa de fallos.

## 2. Cómo trabajamos hoy: del pedido al lanzamiento

Archivos examinados: `agentes/principal.md`, `skills/planificar-cambio/SKILL.md`, `agentes/constructor.md`, `skills/ejecutar-plan/SKILL.md`, `modelos.json`, `verify`, `friccion.md` y planes históricos de `cambios/hechos/` relevantes al contrato, plazos y help.

1. El principal investiga, lee código y obtiene evidencia inicial.
2. Escribe un plan con objetivo, supuestos, alcance, decisiones, escenarios, verificación y pasos.
3. Aplica una «Prueba de ejecutabilidad»: comprobaciones exactas, ausencia de dependencias desconocidas, errores previstos y exclusión de producción/credenciales.
4. Franco aprueba. El principal comprueba rama base, limpieza y actualización remota.
5. Entrega `Plan: <ruta>` y `Rama: <rama>` al constructor, sin duplicar el encargo en el mensaje.
6. El constructor lee el plan, crea la rama, ejecuta pasos y los marca con evidencia. Cuenta pendientes con `grep -c`.
7. Con cero pendientes ejecuta la verificación; puede corregir dentro del alcance. Tiene tope de tres corridas.
8. Declara `COMPLETADO` o `PAUSA`. El principal vuelve a verificar y Franco revisa.

**Lo que conviene conservar:** documento durable como traspaso, límites de alcance, dos puertas humanas, corrección dentro del alcance, evidencia real, rama aislada y verificación del principal.

### Configuración comprobada, sin atribuirle causalidad

`modelos.json` asigna al constructor nivel bajo y esfuerzo high. `node scripts/resolver.mjs modelo-esfuerzo constructor pi` resolvió `openai/gpt-6-luna:high`. El archivo instalado `/Users/franco/.pi/agent/agents/constructor.md` contiene ese modelo, `thinking: high`, la skill y el timeout de una hora.

Esto confirma concordancia entre configuración y agente instalado. No prueba qué modelo atendió cada corrida histórica ni compara capacidades con otro nivel.

## 3. Hallazgos locales

### A. El falso positivo del help también fue un fallo de planificación y supervisión

Evidencia: `cambios/hechos/help-instalador/plan.md`, secciones Pasos y Notas; primera implementación revisada en esta conversación.

- Se pidió verificar presencia de opciones, alias y ausencia de escrituras.
- No se pidió inicialmente una prueba negativa que eliminara una opción ni se exigió que el extractor encontrara elementos.
- El constructor implementó un extractor con escapes incorrectos. Produjo cero opciones y el bucle no comprobó ninguna.
- La suite pasó y el constructor marcó el requisito como completo.
- Yo había declarado el plan ejecutable sin resolver cómo probar la sensibilidad de ese verificador. La revisión del diff, no otra corrida idéntica, detectó el problema.
- Una prueba sin Node/modelos quedó inicialmente manual; el plan no cerraba con suficiente precisión qué debía quedar como regresión automatizada.

**Conclusión:** faltaba un contrato de aceptación del verificador y una revisión requisito → evidencia. La corrección posterior añadió lista no vacía, prueba negativa e aislamiento automatizado. No hay evidencia de engaño deliberado del constructor.

### B. Las comprobaciones exactas se exigen más de lo que se especifican

`skills/planificar-cambio/SKILL.md:79` pregunta si cada paso trae su comprobación exacta. En el help hay pasos como «contrastar cada descripción con el parser y sus consumidores»: razonables como trabajo, pero sin un criterio observable preciso que determine cuándo esa revisión está completa.

**Riesgo:** la Prueba de ejecutabilidad puede convertirse en una declaración del principal, no una prueba. Más palabras no resuelven esto; una tabla requisito → comprobación → resultado esperado sí sería verificable.

La exigencia de que ningún paso dependa de un resultado que solo exista al ejecutar también es demasiado absoluta: implementar pruebas nuevas depende necesariamente de artefactos aún inexistentes. Lo importante es fijar cómo evaluarlos y qué hacer con los resultados, no conocerlos anticipadamente.

### C. El contrato contiene tensiones y contradicciones concretas

- **Pausa:** `agentes/constructor.md:29` dice que con pendientes no devuelve ni `COMPLETADO` ni `PAUSA` «por cualquier otra razón»; a continuación permite pausar por ambigüedad, diseño, alcance y acceso. Esos casos normalmente aparecen con pendientes.
- **Verificación:** exige cero pendientes antes de verificar (`agentes/constructor.md:24`), pero los planes incluyen ejecutar `verify` como paso pendiente. La lectura literal genera una dependencia circular; el modelo debe inferir la excepción.
- **Git:** la lista cerrada de comandos permitidos en `agentes/constructor.md:41` no incluye `git status`, `git diff` ni `git symbolic-ref`, aunque evaluar limpieza/base requiere inspección equivalente. No es una prohibición global de todo Git de lectura: es una restricción adicional del constructor.
- **Procedimiento duplicado:** declara `skills: ejecutar-plan`, pero afirma que «no hay otra skill que leer». El agente y la skill repiten el procedimiento, con diferencias sobre base y retorno.
- **Recuperación:** «no releas lo ya leído» impide literalmente reconsultar un contrato después de una edición, una reanudación o pérdida de contexto.
- **Tiempo/contexto:** prohibir que sean motivos de pausa no elimina los límites del proceso. Hace falta distinguir «terminé» de «progreso persistido antes de una interrupción» sin presentar lo segundo como un resultado completo.

**Grado de certeza:** las contradicciones existen en los archivos y en el agente instalado. No he demostrado que causaran cada detención histórica.

### D. El conteo de pendientes no es una prueba externa de cumplimiento

El propio agente marca las casillas y ejecuta el conteo. Eso ayuda a orientarse, pero no verifica que lo marcado funcione.

Además, comprobación reproducida:

```text
$ printf '%s\n' '- [x] Paso completado' | grep -c '^- \[ \]'
0
exit 1
```

`grep -c` devuelve 1 cuando no encuentra coincidencias. En un contexto de shell que trate ese estado como fallo puede inducir un error justo cuando no quedan pendientes. Fuera de ese contexto solo es un estado que debe interpretarse correctamente.

**No afirmo** que provocara los cortes observados: no hay esa evidencia. Sí es una interfaz frágil para una regla central del flujo.

### E. La suite del kit prueba contratos escritos, no fiabilidad de ejecución

Los bloques 8c–8i de `verify` comprueban presencia/ausencia de frases y sus mutaciones. Son útiles para detectar borrados accidentales del contrato.

No prueban que un constructor:

- detecte una comprobación vacía;
- no marque un paso incompleto;
- repare una regresión real;
- retome un estado parcial;
- pause solo cuando corresponde;
- entregue todo en el primer intento.

Una mutación que borra «Prueba de ejecutabilidad» demuestra que se vigila esa frase; no que el principal evalúe bien un plan. **No hay que eliminar estas pruebas, sino reconocer qué miden.**

### F. No todas las detenciones deben atribuirse al modelo

Los planes históricos distinguen incidentes de permisos, fixtures y plazos:

- `cambios/hechos/ejecutor-y-pasos/plan.md`, Notas: ensayos afectados por permisos y un fixture sin `chmod +x`.
- `cambios/hechos/plazos-y-tiempo/plan.md`, Evidencia/Notas: corte real con timeout bajo y finalización con otro plazo; también un ensayo que ejecutó un agente distinto por confianza del proyecto.

Son registros de experimentos, no trazas reanalizadas en esta investigación. Permiten separar categorías, no estimar frecuencias ni explicar todos los casos de otros proyectos.

## 4. Qué revisaría contigo antes de planificar una mejora

### Prioridad 1: cerrar qué significa aceptar el trabajo

Discutir una especificación de aceptación por requisito: resultado observable, prueba positiva, fallo que debe detectar y evidencia esperada. En pruebas nuevas, incluir sensibilidad del verificador: no aceptar listas vacías, pruebas no descubiertas o fallos ocultos.

No hace falta prescribir el código exacto ni una prueba negativa para cada frase del help. Sí cubrir el mecanismo que podría dejar toda una familia de requisitos sin comprobar.

### Prioridad 2: simplificar el contrato de ejecución

Elegir una fuente de procedimiento y quitar contradicciones sobre pausa, lectura, Git y verificación. Diferenciar avance, bloqueo, interrupción y entrega completa. Mantener las restricciones de seguridad actuales.

Preferir hitos pequeños con validación inmediata sobre contar operaciones de edición. Un solo comando final `./verify` es compatible con comprobaciones intermedias.

### Prioridad 3: demostrar qué mejora, antes de atribuirlo al nivel del modelo

Propuesta de evaluación, todavía sin ejecutar:

- Casos iniciales: help con extractor vacío, corrección multiarchivo, regresión que exige reparar, recuperación parcial y bloqueo de acceso legítimo.
- Aceptación controlada por el evaluador, fuera de los archivos que el constructor puede modificar; además de las pruebas que él añada.
- Mismo estado inicial aislado, plan y permisos al comparar variantes. Registrar modelo/esfuerzo efectivos y motivo de terminación.
- Repetir cada caso, por ejemplo tres veces como diagnóstico inicial; no confundir una muestra pequeña con una estimación estadística sólida.
- Medir éxito al primer intento, falso `COMPLETADO`, paradas innecesarias, correcciones del principal, duración y coste total.
- Cambiar una dimensión cada vez: contrato, plan o modelo. No cambiar las tres y atribuir el resultado a una.

Un modelo más capaz podría ayudar y servir como referencia, pero no arregla por sí solo un grader vacío ni demuestra que un prompt sea bueno. El coste relevante incluye las reanudaciones y la revisión del principal, no solo la primera llamada.

## 5. Siguiente revisión propuesta

Revisar juntos en este orden:

1. **Planificación:** sustituir la autoafirmación de ejecutabilidad por criterios observables; usar el help como ejemplo.
2. **Contrato del constructor:** decidir cómo se resuelven las contradicciones anteriores, sin ampliar facultades.
3. **Traspaso:** conservar ruta + rama si el contrato está completo; verificar identidad/configuración y contexto efectivos.
4. **Evaluación:** acordar casos y métricas antes de redactar el plan de implementación.

No se han editado agentes, skills, modelos, instalador ni `verify`. Solo se escribió este diagnóstico. No se han lanzado nuevos experimentos con modelos ni subagentes.

## Fuentes consultadas

[1] Anthropic, **Effective harnesses for long-running agents**. Secciones The long-running agent problem, Incremental progress y Testing.
https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

[2] Anthropic, **How we built our multi-agent research system**. Teach the orchestrator how to delegate, Effective evaluation of agents y Appendix.
https://www.anthropic.com/engineering/multi-agent-research-system

[3] Anthropic, **Effective context engineering for AI agents**. The anatomy of effective context y Context retrieval and agentic search.
https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

[4] OpenAI, **Codex Prompting Guide**. Recommended Starter Prompt, Autonomy and Persistence.
https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide

[5] OpenAI, **Run long horizon tasks with Codex**. Durable project memory, milestones y Verification at every milestone.
https://developers.openai.com/blog/run-long-horizon-tasks-with-codex

[6] Anthropic, **Demystifying evals for AI agents**. Definiciones, Design graders thoughtfully y Check the transcripts.
https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents

[7] **Are “Solved Issues” in SWE-bench Really Solved Correctly? An Empirical Study**, arXiv:2503.15223v2, septiembre de 2025. Abstract; resultados circunscritos a su muestra.
https://arxiv.org/abs/2503.15223
