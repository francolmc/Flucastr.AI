# task-01 — Diagnóstico: por qué en modo normal la rama a veces no se crea al empezar la tarea 1
repo: Flucastr.AI   depende_de: —   estado: borrador

## Descripción
Franco observó que, en el modo normal, la rama de la feature a veces no existe al empezar la tarea 1. La hipótesis de `definitions/F40-RAMAS.md` §D es que `ejecutar-tarea` comprueba el entorno antes de crear la rama y que el paso de rama solo corre si el encargo trae `Rama:`. Esta tarea verifica la hipótesis leyendo los textos y deja un informe corto con lo confirmado, lo inferido y una recomendación sobre el orden rama/entorno. No cambia ninguna regla: la decisión del orden se toma después, con el informe.

## Contexto
- Tocar: `pruebas/resultados/2026-11-04-f40-diagnostico-rama.md`
- El archivo de Tocar es nuevo y es el único que se escribe.
- Leer, por tramos: `skills/ejecutar-tarea/SKILL.md` líneas 10-18 (paso 1 con `**Entorno:**` en la línea 13, paso 2 `**Rama de la feature.**` en la línea 14, paso 3 «Cambia `estado` a `en curso`» en la línea 18); `agentes/constructor.md` sección «Cómo trabajas», punto 1; `agentes/coordinador.md` líneas 59-60 y 68 (de dónde sale `Rama:` en el encargo).
- Dato ya confirmado (Notas de `features/F37-base-verde-verificacion-rapida/task-01-tope-workflow-higiene.md`, no hace falta abrirlas): la ejecución n=1 quedó `bloqueada` con `Bloqueo: tipo=entorno` y sin rama; la ejecución n=2, con el entorno en orden, creó `chore/F37-base-verde-verificacion-rapida` con `git switch -c` desde `main`.
- Las pruebas de contrato (`pruebas/comprobaciones/contrato-constructor.mjs`, reglas 5 y 11) exigen «`git switch -c` antes de `en curso`» pero no ordenan la rama respecto del entorno.
- Fuente: definitions/F40-RAMAS.md «D. Hipótesis: por qué el modo normal a veces no crea la rama en la tarea 1»
- Requiere: ninguno

## Decisiones ya tomadas
- Solo lectura del repo salvo el informe. No se edita ninguna skill, agente, prueba ni definición.
- El informe tiene exactamente tres secciones `## Confirmado`, `## Inferido` y `## Recomendación`, y no supera 4096 bytes.
- Cada afirmación de «Confirmado» cita archivo y línea que se leyó; lo deducido va en «Inferido».
- La recomendación elige entre A) rama antes del entorno, B) mantener el orden, con una frase de motivo. No se aplica.
- Franco puede añadir después sus casos observados; el informe los deja como «Por confirmar con el caso de Franco».

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: verificar el orden entorno/rama, la condición `Rama:` y el origen de `Rama:` en el encargo; escribir el informe.
Fuera de alcance: cambiar `ejecutar-tarea` o cualquier regla, escribir pruebas nuevas, reproducir con un modelo real, tocar `definitions/`.

## Pasos
1. Corre `grep -n 'Entorno:\|Rama de la feature\|Cambia `estado` a `en curso`' skills/ejecutar-tarea/SKILL.md` y anota los números de línea (el orden mostrado es la prueba de que el entorno va antes).
2. Lee `skills/ejecutar-tarea/SKILL.md` líneas 12-18 y anota la condición «Solo si el encargo trae la línea `Rama:`».
3. Lee `agentes/coordinador.md` líneas 59-60 y 68 y anota cuándo el coordinador agrega `Rama:`.
4. Corre `grep -rn 'no creas rama\|salta este paso entero\|ADVERTENCIA: rama' pruebas` y anota qué archivos aparecen.
5. Crea `pruebas/resultados/2026-11-04-f40-diagnostico-rama.md` con las tres secciones, usando el dato de F37 de *Contexto* como evidencia del orden.
6. Corre la *Verificación*.

## Criterios de aceptación
1. La rama de trabajo está activa: `git branch --show-current` imprime `fix/F40-rama-de-trabajo`.
2. El informe existe, tiene las tres secciones y pesa 4096 bytes o menos (comandos 2 y 3).
3. Ningún archivo de agentes, skills, `definitions/WORKFLOW.md` ni `pruebas/comprobaciones` cambió (comando 4: salida vacía).

## Verificación
Comando 1:
```
git branch --show-current
```
Esperado: `fix/F40-rama-de-trabajo`.

Comando 2:
```
grep -c -E '^## (Confirmado|Inferido|Recomendación)$' pruebas/resultados/2026-11-04-f40-diagnostico-rama.md
```
Esperado: `3`.

Comando 3:
```
wc -c pruebas/resultados/2026-11-04-f40-diagnostico-rama.md
```
Esperado: un número menor o igual a 4096.

Comando 4:
```
git diff --stat -- agentes skills definitions/WORKFLOW.md pruebas/comprobaciones
```
Esperado: salida vacía.

## Evidencia
(lo llena el constructor: la cola relevante de cada salida, hasta 1,5 KB)

## Notas
(lo llena el constructor)
