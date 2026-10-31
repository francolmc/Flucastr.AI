# task-07 — Guía de higiene de contexto en el README
repo: Flucastr.AI   depende_de: task-01   estado: borrador

## Descripción
Añadir a `README.md` una sección de guía «Higiene de contexto»: sesión corta (una sesión por puerta o tarea), cuándo `CONTEXTO: sesion-nueva` o `compactar`, compactación por proyecto con la fórmula `reserveTokens = ventana − umbral` (con `172000` para `openai/gpt-6.1-sol` y ventana de 272 k), lo verificado de Claude Code (task-01) y la tabla de mecanismos de `ARCHITECTURE.md`. Es una guía: **no** se instala nada desde `instalar.sh`.

## Contexto
- Leído: `README.md` (secciones: La idea, Para qué existe, Reglas, Documentación, Cómo se usa, Estructura, Instalación, Pruebas, Flujo, Registro de eventos, Archivo y rescate, Bitácora). La sección nueva va entre `## Flujo` y `## Registro de eventos`.
- Fuente de la regla: `definitions/ARCHITECTURE.md`, «Higiene de contexto» (regla, tabla por herramienta, ajuste ilustrativo de Pi) y `definitions/WORKFLOW.md` §3.
- Fuente de las cifras: `pruebas/resultados/2026-10-31-sondeo-consumo-pi.md` (P2): ventana de `gpt-6.1-sol` 272.000 con proveedor `openai` (→ `172000`) y 500.000 con `openai-codex` (→ `400000`); `modelOverrides` por `provider/modelId` exacto; archivo por proyecto `<proyecto>/.pi/settings.json` (exige `/trust`). El proveedor real sigue pendiente de que Franco lo confirme en el pie de Pi: la guía debe decirlo.
- Lo verificado de Claude Code sale de la *Evidencia* de `task-01-verificar-claude-code.md`. Si una fila quedó NO VERIFICADO, la guía lo dice así y no propone fragmento para esa parte.
- Comprobadores que miran el README: `pruebas/comprobaciones/readme-estructura.mjs` (solo el árbol de «## Estructura»). No se toca ese bloque.
- Se prueba con `node --test pruebas/comprobaciones/readme-estructura.test.mjs`.

## Decisiones ya tomadas
- Sección `## Higiene de contexto` con cuatro partes: (1) por qué (≈2,4 veces más costo por turno a 130 k que a 25 k de contexto; sesión por puerta ≈ −55 %, ambas *inferidas*, del sondeo Pi); (2) regla: al ver `CONTEXTO: sesion-nueva` abrir sesión nueva y retomar con `pi-coordinador` o `claude --agent coordinador`; con `CONTEXTO: compactar` (yolo) compactar; solo Franco lo hace; (3) compactación por proyecto: fórmula `reserveTokens = ventana − umbral`, fragmento de Pi tal cual: `{ "compaction": { "modelOverrides": { "openai/gpt-6.1-sol": { "reserveTokens": 172000 } } } }`, nota de `/trust`, y para Claude Code solo lo CONFIRMADO en task-01 (valor directo en tokens, 100000 a 1000000); (4) tabla de mecanismos Pi / Claude Code (Codex «pendiente») copiada de `ARCHITECTURE.md`, con CONFIRMADO / NO VERIFICADO como allí, actualizada con task-01.
- Declarar de forma explícita: «Es una guía; `instalar.sh` no escribe estos ajustes».
- Sin comandos de barra dentro de la frase `CONTEXTO:` (esa frase es neutral); los comandos solo en esta guía.

## Alcance / Fuera de alcance
Alcance: la sección nueva en `README.md` y una entrada en la lista de `## Documentación` solo si la sección ya la lista por tema (si no, no).
Fuera de alcance: `instalar.sh`, `desinstalar.sh`, `.pi/settings.json` o `.claude/settings.json` reales, `definitions/`, `pruebas/README.md`, el bloque «## Estructura».

## Pasos
1. Leer la *Evidencia* de task-01 y fijar qué es CONFIRMADO para Claude Code. Resultado: lista de filas copiada en *Notas*.
2. Escribir la sección en `README.md`. Resultado: `grep -n "^## Higiene de contexto" README.md` con una línea.
3. Comprobar que `reserveTokens = ventana − umbral` y `172000` aparecen y que no se afirma como verificado nada que task-01 marcó NO VERIFICADO.
4. Correr la verificación y pegarla en *Evidencia*.

## Criterios de aceptación
1. `grep -n "reserveTokens = ventana − umbral\|172000\|CONTEXTO: sesion-nueva\|CONTEXTO: compactar" README.md` muestra las cuatro.
2. La sección dice que es una guía y que `instalar.sh` no la instala (`grep -n "instalar.sh no escribe" README.md`).
3. `node --test pruebas/comprobaciones/readme-estructura.test.mjs` termina con `fail 0`.
4. `git diff --stat` de esta tarea muestra solo `README.md`.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
grep -n "^## Higiene de contexto\|reserveTokens = ventana − umbral\|172000\|instalar.sh no escribe" README.md
node --test pruebas/comprobaciones/readme-estructura.test.mjs
git diff --stat README.md
```
Esperado: las líneas pedidas; `fail 0`; solo `README.md` (no ejecutado tras el cambio).

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
