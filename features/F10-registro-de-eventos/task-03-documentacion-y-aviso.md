# task-03 — aviso del coordinador, regla de no lectura y documentación del registro
repo: Flucastr.AI   depende_de: task-02   estado: aprobada

## Descripción
Deja el registro utilizable por Franco: el `coordinador` anota en «Espera a Franco» el comando `node scripts/registrar.mjs` junto al de archivar y no entra en `registro/`; el validador de roles lo exige; y `README.md` y `pruebas/README.md` explican qué es el registro, cómo correrlo y cómo probarlo. Sin esto el registro existe pero nadie sabe cuándo correrlo.

## Contexto
Diseño: `definitions/REGISTRO.md` §3 («Quién corre el script»), §4 y §2 («Fuera de lo que se lee por defecto»). Leídos en el repo: `agentes/coordinador.md` (fila de la tabla «Todas las tareas de la feature `hecha`» con el aviso «Feature Fxx archivable: `node scripts/archivar.mjs --aplicar Fxx` …»; `## Qué lees para decidir`, que ya excluye `features/completed/`; `## Archivo y contexto`); `pruebas/comprobaciones/contrato-roles.mjs` (última regla 13, frases `node scripts/archivar.mjs --aplicar Fxx` y `features/completed/`, errores en español) y `contrato-roles.test.mjs` (arreglo `variantesF07` con `[nombre, frase, alterar(m, f)]`, que reemplaza la frase en `m.agentes.<rol>` y exige error); `README.md` (árbol de `## Estructura` con `scripts/` terminando en `└── archivar.mjs`; secciones `## Pruebas`, `## Flujo`, `## Archivo y rescate`, redactadas en primera persona); `pruebas/README.md` (viñetas con comandos de prueba, p. ej. «Capa 1: `node --test …`»); `pruebas/comprobaciones/readme-estructura.mjs` (solo compara los hijos de `agentes/` y `skills/`; `scripts/` no se compara). Dejados por task-01 y task-02: `scripts/registrar.mjs`, `pruebas/capa1/registrar.test.mjs` (9 pruebas, fuera de `rapida.sh`).
A tocar: `agentes/coordinador.md`, `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`, `README.md`, `pruebas/README.md`.

## Decisiones ya tomadas
- `agentes/coordinador.md`: en la fila «Todas las tareas de la feature `hecha`», antes del aviso «Feature Fxx archivable…», el coordinador escribe en «Espera a Franco» la línea «Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco, antes de archivar; no bloquea).» y la frase final de la fila pasa a «Nunca ejecutas `--aplicar` ni `registrar.mjs`; en yolo no escribes ninguno de los dos avisos.». En `## Qué lees para decidir` se agrega: «Tampoco entres en `registro/`: no se lee salvo pedido explícito de Franco.»
- Regla 14 en `contrato-roles.mjs`: el `coordinador` contiene `node scripts/registrar.mjs` y `registro/`; mensaje de error en español como las reglas 9 a 13. Variantes de prueba (dos, en un arreglo nuevo `variantesF10`): el coordinador pierde `node scripts/registrar.mjs`; el coordinador pierde `registro/`.
- `README.md`: (a) en el árbol, `archivar.mjs` pasa de `└──` a `├──` y se agrega debajo `└── registrar.mjs   # registra los eventos del flujo en registro/eventos.jsonl (lo corre Franco)`; (b) sección nueva `## Registro de eventos` entre `## Flujo` y `## Archivo y rescate`, en primera persona, de 6 a 10 líneas, que diga: para qué sirve (juntar datos para detectar errores y mejorar el flujo; el informe es una feature aparte, F11, tras unas 10 tareas con datos); cómo se corre (`node scripts/registrar.mjs` desde la raíz del proyecto, las veces que quiera y antes de archivar; `--reconstruir` regenera todo; `--raiz <dir>`); qué produce (`registro/eventos.jsonl`, ignorado por git, regenerable, sin datos personales ni texto libre); la línea `Registro:` que el `constructor` agrega a *Notas*; que corre sobre commits (lo que no está commiteado no aparece); y que el modelo registrado es el configurado en `modelos.json` al correr el script (conviene correrlo antes de cambiar de modelo).
- `pruebas/README.md`: una viñeta nueva con `node --test pruebas/capa1/registrar.test.mjs` (9 pruebas, sin modelo ni red, fuera de `rapida.sh` para no acercarla a su tope de 30 s) y una frase que diga que la línea `Registro:` escrita por un modelo se ve en la primera tarea real y no se prueba aquí.
- No se edita `definitions/**`, `AGENTS.md`, `agentes/planificador.md` ni `agentes/constructor.md`.

## Alcance / Fuera de alcance
Alcance: las cinco ediciones listadas en *Contexto*.
Fuera de alcance: `scripts/**`, `skills/**`, `instalar*.sh`, `rapida.sh`, `definitions/**` (incluidos `WORKFLOW.md` §10.4 y `REGISTRO.md`, que son del arquitecto), el informe (F11) y cualquier cambio en el modo yolo.

## Pasos
1. `agentes/coordinador.md`: agregar la línea de «Espera a Franco», la frase final de la fila y la oración de `## Qué lees para decidir`. Resultado: `grep -c "node scripts/registrar.mjs" agentes/coordinador.md` imprime `1` o más.
2. `pruebas/comprobaciones/contrato-roles.mjs`: añadir la regla 14. Resultado: `node --test pruebas/comprobaciones/contrato-roles.test.mjs` pasa con los textos reales.
3. `pruebas/comprobaciones/contrato-roles.test.mjs`: añadir `variantesF10` con sus dos pruebas, con el mismo estilo que `variantesF07`. Resultado: las dos pruebas nuevas pasan.
4. `README.md`: ajustar el árbol y añadir `## Registro de eventos`. Resultado: `grep -n "registrar.mjs" README.md` muestra al menos 2 líneas.
5. `pruebas/README.md`: añadir la viñeta. Resultado: `grep -n "registrar.test.mjs" pruebas/README.md` muestra 1 línea.
6. Correr la *Verificación* y pegar la salida real en *Evidencia*.

## Criterios de aceptación
1. El coordinador deja el comando de `registrar.mjs` junto al de archivar, sin ejecutarlo, y no entra en `registro/`; el validador falla si se quita cualquiera de las dos frases. `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.
2. El árbol del README incluye `registrar.mjs` y la sección `## Registro de eventos` cubre uso, producto, privacidad y límites. `grep -n "^## Registro de eventos" README.md` y `node --test pruebas/comprobaciones/readme-estructura.test.mjs`.
3. `pruebas/README.md` documenta cómo correr las pruebas del registro. `grep -n "registrar.test.mjs" pruebas/README.md`.
4. Nada rompe la verificación rápida. `bash pruebas/rapida.sh`.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/readme-estructura.test.mjs
```
Esperado: `fail 0`, incluidas las dos pruebas nuevas de la regla 14.
```
grep -n "registrar.mjs" README.md agentes/coordinador.md; grep -n "registrar.test.mjs" pruebas/README.md
```
Esperado: al menos 2 líneas en `README.md`, 1 o más en `agentes/coordinador.md` y 1 en `pruebas/README.md`.
```
bash pruebas/rapida.sh
```
Esperado: termina con `rapida: ... (tope 30 s)` y código 0.

## Evidencia

## Notas
