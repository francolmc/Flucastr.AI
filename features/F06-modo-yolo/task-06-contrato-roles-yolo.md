# task-06 — Contrato de roles: frases de yolo en coordinador, planificador y descomponer-feature, con control negativo
repo: Flucastr.AI   depende_de: task-02, task-03, task-04   estado: hecha

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

Comprobación previa de frases reales (`grep -nF` sobre `agentes/coordinador.md`, `agentes/planificador.md`, `skills/descomponer-feature/SKILL.md`): las cuatro frases del coordinador, `Modo yolo: activo` en el planificador y en `descomponer-feature` están presentes. No hubo BLOQUEO.

Comando 1: `node --test pruebas/comprobaciones/contrato-roles.test.mjs` (salida recortada al resumen; las 20 pruebas listadas pasan)
```
ℹ tests 20
ℹ suites 0
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
Pruebas nuevas con su resultado: `✔ rechaza regla 12: el coordinador pierde la línea de registro del modo yolo`, `✔ rechaza regla 12: el coordinador pierde la advertencia de rama main`, `✔ rechaza regla 12: el coordinador pierde el estado detenido`, `✔ rechaza regla 12: el coordinador pierde el estado terminado`, `✔ rechaza regla 12: el planificador pierde la frase del modo yolo`, `✔ rechaza regla 12: descomponer-feature pierde la frase del modo yolo`, y `✔ los archivos reales de agentes, skills y modelos.json cumplen el contrato`. Las reglas 1–11 siguen pasando.

Comprobación del validador con los archivos reales (antes de escribir las pruebas): `validarRoles` devuelve `[]`.

Comando 2: `bash pruebas/rapida.sh` (salida recortada: la última línea y el código)
```
rapida: 16 archivos en 21 s (tope 30 s)
EXIT_RAPIDA=0  TIEMPO_WALL=21s
```
Tiempo: 21 s en esta corrida, bajo el tope de 30 s. Franco mencionó 27 s en una corrida anterior; esta no lo reproduce.

Comando 3: `git status --short pruebas/comprobaciones`
```
 M pruebas/comprobaciones/contrato-roles.mjs
 M pruebas/comprobaciones/contrato-roles.test.mjs
```

Criterios: 1 cumplido (`cumplen el contrato` pasa con `fail 0`); 2 cumplido (las seis variantes nombran su frase); 3 cumplido (`fail 0` en el archivo de pruebas); 4 cumplido (`rapida` código 0 en 21 s).

## Notas

- Hueco menor: la tarea dice «numerada a continuación de la última (hoy 12)», pero `contrato-roles.mjs` termina en la regla 11. La regla nueva es la 12, con el comentario `// Regla 12: …`. No hay regla 12 previa que renumerar.
- Ampliación de `muestra()`: el coordinador recibió las cuatro frases de yolo en líneas propias antes de la tabla de estados, el planificador recibió `Modo yolo: activo` y `descomponer-feature` recibió `Modo yolo: activo`. Así `muestra()` sigue sin errores.
- Las seis variantes de `variantesF06` usan el mismo bucle que `variantesF05`: cada una exige que el error mencione la frase quitada.
- Sin cambios en `agentes/`, `skills/`, `contrato-constructor.mjs`, `formato-flujo.mjs` ni `coherencia-features.mjs`. Sin commit, push ni merge. No se tocó `definitions/STATUS.md`.
- Rama: ya estaba en `feature/F06-modo-yolo` (la del encargo), así que no hubo `git switch` ni `CONFIRMAR:`. El encargo no traía línea `Modo yolo: activo`, por lo que el paso de rama siguió el flujo normal.
