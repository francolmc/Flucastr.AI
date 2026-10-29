# task-06 — Contrato de roles: frases de yolo en coordinador, planificador y descomponer-feature, con control negativo
repo: Flucastr.AI   depende_de: task-02, task-03, task-04   estado: aprobada

## Descripción
`pruebas/comprobaciones/contrato-roles.mjs` valida el contrato de agentes y skills. Tras task-02, task-03 y task-04, el coordinador, el planificador y `descomponer-feature` hablan del modo yolo. Esta tarea añade una regla que exige esas frases y las variantes negativas que prueban que, si alguien las borra, la verificación rápida falla.

## Contexto
- Repo: este, único repo. Node, ESM, `node:test`, sin dependencias. Leídos: `pruebas/comprobaciones/contrato-roles.mjs` (función `validarRoles({ agentes, skills, modelos })`; reglas numeradas con comentario `// Regla N: …`; las reglas 9–11 usan listas de frases y mensajes «El agente «x» debe contener la frase «…»») y `pruebas/comprobaciones/contrato-roles.test.mjs` (función `muestra()` con textos sintéticos mínimos que deben cumplir todas las reglas; arreglo `variantes`; arreglo `variantesF05` con `[nombre, frase, alterar(m, f)]` que exige un error que mencione la frase; y la prueba que valida los archivos reales).
- Las frases las fijaron task-02 y task-03 (coordinador), task-04 (planificador y skill). Esta tarea no puede correrse antes de que esas tres estén `hecha`.
- Archivos a tocar: `pruebas/comprobaciones/contrato-roles.mjs` y `pruebas/comprobaciones/contrato-roles.test.mjs`. Comando: `node --test pruebas/comprobaciones/contrato-roles.test.mjs`.

## Decisiones ya tomadas
- Una regla nueva al final de `validarRoles`, numerada a continuación de la última (hoy 12), con comentario `// Regla N: el modo yolo está descrito en coordinador, planificador y descomponer-feature.`:
  - El agente `coordinador` debe contener cada una de estas frases: `Modo yolo: activo — alcance <…>; pedido por Franco el <fecha>; rama <…>`, `ADVERTENCIA: rama main`, `Modo yolo: detenido (feature Fxx requiere refinado)`, `Modo yolo: terminado`.
  - El agente `planificador` y la skill `descomponer-feature` deben contener `Modo yolo: activo`.
  - Mensajes con el mismo formato que las reglas 9–11: ``El agente «coordinador» debe contener la frase «…».`` y ``La skill «descomponer-feature» debe contener la frase «…».`` (para el planificador: ``El agente «planificador» debe contener la frase «…».``).
- `muestra()` del test se amplía con esas frases en los textos sintéticos del coordinador, del planificador y de `descomponer-feature`, para que `muestra()` siga sin errores.
- Variantes negativas en un arreglo nuevo `variantesF06` (mismo formato y mismo bucle que `variantesF05`, con un error que mencione la frase quitada): una por cada frase del coordinador (4), una para el planificador y una para `descomponer-feature`; seis en total. Cada una reemplaza la frase por un texto neutro.
- No se fija cuántas reglas hay ni cuántos archivos hay en `agentes/` o `skills/`.
- No se modifican `agentes/` ni `skills/`; si falta una frase porque task-02, task-03 o task-04 no la escribió, es un fallo de esa tarea: `BLOQUEO: rol=planificador; motivo=…`.

## Alcance / Fuera de alcance
Alcance: la regla nueva, la ampliación de `muestra()` y las seis variantes.
Fuera de alcance: reglas 1–12, `contrato-constructor.mjs` (task-05), `formato-flujo.mjs`, `coherencia-features.mjs`, el contenido de agentes y skills.

## Pasos
1. Añadir la regla nueva a `contrato-roles.mjs`. Resultado: `validarRoles` con los archivos reales devuelve `[]`.
2. Ampliar `muestra()` en `contrato-roles.test.mjs`. Resultado: la prueba «muestra válida mínima no tiene errores» sigue pasando.
3. Añadir `variantesF06` y su bucle de pruebas. Resultado: seis pruebas nuevas «rechaza …».
4. Correr la *Verificación*.

## Criterios de aceptación
1. Los archivos reales cumplen la regla nueva. Se comprueba con la prueba «los archivos reales … cumplen el contrato» (`fail 0`).
2. Quitar cualquiera de las seis frases produce un error que la nombra. Se comprueba con las seis variantes nuevas.
3. Las reglas 1–11 y sus pruebas no cambian de resultado. Se comprueba con `fail 0` de todo el archivo de pruebas.
4. La verificación rápida pasa. Se comprueba con la segunda orden de *Verificación*.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs
bash pruebas/rapida.sh
git status --short pruebas/comprobaciones
```
Esperado: la primera con `fail 0`; la segunda termina con `rapida: N archivos en S s (tope 30 s)` y código 0; la tercera muestra `contrato-roles.mjs` y `contrato-roles.test.mjs` entre los cambios.

## Evidencia

## Notas
