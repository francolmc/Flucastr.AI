# task-04 — Pruebas de contrato de la lectura acotada (regla 17)
repo: Flucastr.AI   depende_de: task-01, task-02, task-03   estado: lista para revisión

## Descripción
Para que las reglas de lectura de F22 no se pierdan en ediciones futuras, `pruebas/comprobaciones/contrato-roles.mjs` pasa a exigir las frases clave en `planificador`, `constructor`, `arquitecto` y las skills `descomponer-feature`, `ejecutar-tarea` y `disenar-arquitectura`, igual que la regla 16 lo hace con el `coordinador` (F21). Cada frase tiene un control negativo en el test.

## Contexto
- Patrón a copiar en `pruebas/comprobaciones/contrato-roles.mjs`: `export const FRASES_COORDINADOR_F21 = [...]` (líneas 10–22) y la «Regla 16» al final de `validarRoles` (líneas 242–247, justo antes de `return errores;`).
- `pruebas/comprobaciones/contrato-roles.test.mjs`: importa `FRASES_COORDINADOR_F21` en la línea 6; la función `muestra()` arma agentes y skills de ejemplo (el coordinador usa `FRASES_COORDINADOR_F21.join('\n')` en la línea 66; los skills están a continuación, claves `ejecutar-tarea`, `descomponer-feature`, `crear-backlog`); el bloque de controles negativos de la regla 16 está en las líneas 277–285, antes de `test('los archivos reales…`.
- `muestra()` hoy no define agentes `arquitecto`, `planificador` ni `constructor` con estas frases: hay que agregarlas a cada texto de ejemplo; el nombre exacto de cada clave se lee en `muestra()` antes de editar.
- Las frases son exactamente las de las *Decisiones* de task-01, task-02 y task-03; esta tarea no las redefine. Leer solo las *Notas* de esas tareas.
- Tocar: `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`.

## Decisiones ya tomadas
- Se exporta `FRASES_LECTURA_F22 = { planificador: [...], constructor: [...], arquitecto: [...], 'descomponer-feature': [...], 'ejecutar-tarea': [...], 'disenar-arquitectura': [...] }` (objeto clave → lista). Las claves `planificador`, `constructor`, `arquitecto` se buscan en `agentes`; las demás en `skills`.
- Frases por clave (subcadenas literales):
  - `planificador`: ``Solo lees de `definitions/` la sección que toca la feature``; ``No lees tareas de otras features ni tareas `hecha` ``.
  - `descomponer-feature`: ``cita en *Contexto* las líneas o firmas exactas que el ejecutor necesita``; ``con su ruta y título``; ``~3 archivos tocados``.
  - `constructor`: ``De `depende_de:` lees solo las *Notas* de esa tarea``; ``No lees tareas `hecha` ajenas a `depende_de:` ``.
  - `ejecutar-tarea`: ``de `depende_de:` lee solo las *Notas* de esa tarea``; ``hasta 1,5 KB``.
  - `arquitecto`: ``una vez por sesión``; ``No lees `features/` ni tareas``.
  - `disenar-arquitectura`: ``Lee cada entrada una vez``.
  (Quitar el espacio final de las frases terminadas en `` ` `` al copiarlas: son las subcadenas hasta el acento grave.)
- Mensaje de error de la regla 17: ``El agente «<clave>» debe contener la frase «<frase>».`` para agentes y ``La skill «<clave>» debe contener la frase «<frase>».`` para skills.
- Controles negativos: uno por frase, como en la regla 16 (reemplaza la frase por `frase omitida` en `muestra()` y comprueba que algún error la menciona).

## Alcance / Fuera de alcance
Alcance: los dos archivos de *Contexto*.
Fuera de alcance: editar agentes o skills (task-01 a 03); otras reglas de `validarRoles`; `higiene-contexto.test.mjs`; `scripts/`; `definitions/`.

## Pasos
1. `contrato-roles.mjs`: agregar `export const FRASES_LECTURA_F22` tras `FRASES_COORDINADOR_F21`.
2. `contrato-roles.mjs`: agregar la «Regla 17» antes de `return errores;`.
3. `contrato-roles.test.mjs`: importar `FRASES_LECTURA_F22`; en `muestra()` agregar a cada agente/skill de ejemplo sus frases (agregar las claves que falten con front matter válido mediante el helper `FM` ya usado).
4. `contrato-roles.test.mjs`: agregar el bloque de controles negativos de la regla 17 antes de `test('los archivos reales…`.
5. Correr la *Verificación* y pegar la cola en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` termina en `fail 0`, con 12 pruebas nuevas (una por frase: 2+3+2+2+2+1) respecto del conteo previo a la tarea.
2. El test «los archivos reales…» pasa: los archivos reales ya contienen las frases (task-01 a 03 terminadas).
3. Los controles negativos comprueban que quitar cualquiera de las 12 frases produce un error que la nombra (lo cubren las 12 pruebas nuevas; no se edita ningún archivo real).
4. `bash pruebas/rapida.sh` termina con código 0 y S ≤ 30.
5. Esta tarea solo modifica los dos archivos de *Contexto* (`git diff --stat -- pruebas/` lista únicamente esos dos).

## Verificación
- `cd /Users/franco/Codes/flucastr/Flucastr.AI && node --test pruebas/comprobaciones/contrato-roles.test.mjs` → `fail 0`. Correr el mismo comando antes del paso 1 y anotar en *Notas* el número de pruebas (`# tests`); después debe ser ese número + 12.
- `grep -c 'Regla 17' pruebas/comprobaciones/contrato-roles.mjs` → `1`.
- `bash pruebas/rapida.sh` → código 0 y `rapida: … (tope 30 s)` con S ≤ 30.

## Evidencia
Antes de los cambios: `node --test pruebas/comprobaciones/contrato-roles.test.mjs` → `ℹ tests 40`, `ℹ pass 40`, `ℹ fail 0`.

Después de los cambios: `node --test pruebas/comprobaciones/contrato-roles.test.mjs`
```
ℹ tests 52
ℹ pass 52
ℹ fail 0
```
(52 = 40 + 12; la prueba «los archivos reales…» pasa.)

`node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'regla 17'` → `12`.
`grep -c 'Regla 17' pruebas/comprobaciones/contrato-roles.mjs` → `1`.

`bash pruebas/rapida.sh; echo EXIT=$?` → última línea `rapida: 29 archivos en 19 s (tope 30 s)`, `EXIT=0`.

`git diff --stat -- pruebas/`
```
 pruebas/comprobaciones/contrato-roles.mjs      | 42 ++++++++++++++++++++++++++
 pruebas/comprobaciones/contrato-roles.test.mjs | 40 ++++++++++++++++++++----
 2 files changed, 76 insertions(+), 6 deletions(-)
```

## Notas
- Las frases de *Decisiones ya tomadas* se copiaron literales, sin el espacio final de las que terminan en `` ` `` (p. ej. «No lees tareas de otras features ni tareas `hecha`»).
- En `muestra()` las frases se escribieron como literales dentro de cada texto de ejemplo (no con `join`), y `arquitecto` cita `disenar-arquitectura` para que la regla 4 la encuentre; la skill `disenar-arquitectura` se agregó a la muestra.
- No se leyeron las tareas task-01 a task-03: las frases vienen de *Decisiones ya tomadas* de esta tarea, y la verificación con «los archivos reales…» confirmó que los agentes y skills reales las contienen.
Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
