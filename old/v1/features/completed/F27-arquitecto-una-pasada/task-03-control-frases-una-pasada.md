# task-03 — Control de las frases de una sola pasada (regla 19)
repo: Flucastr.AI   depende_de: task-01, task-02   estado: hecha

## Descripción
Añade a `validarRoles` una regla que exige en `arquitecto` y en sus tres skills las frases y el tope de una sola pasada, con el mismo patrón de la regla 17 (`FRASES_LECTURA_F22`) y con control negativo por cada frase. Así un recorte futuro de esos textos rompe la prueba rápida.

## Contexto
- Tocar: `pruebas/comprobaciones/contrato-roles.mjs`, `pruebas/comprobaciones/contrato-roles.test.mjs`
- `contrato-roles.mjs`: `FRASES_LECTURA_F22` es un objeto exportado (línea ~25); la regla 17 (líneas ~282-294) recorre ese objeto y distingue agentes de skills con `CLAVES_AGENTES_F22`; la regla 18 (PARCIAL) es la última antes de `return errores;`.
- `contrato-roles.test.mjs`: `muestra()` devuelve la muestra válida (agentes y skills); el bloque «Controles negativos de la regla 17» (líneas ~316-330) es el modelo. La prueba `los archivos reales ... cumplen el contrato` ya lee los archivos reales.
- Las skills `definir-proyecto` y `revisar-proyecto-existente` NO están hoy en `muestra()`: hay que añadirlas con el helper `FM(nombre, descripcion)`.
- Las frases de task-01 y task-02 ya están en los archivos reales.

## Decisiones ya tomadas
- Nuevo export `FRASES_UNA_PASADA` con las claves `arquitecto` (agente, 7 frases de task-01), `definir-proyecto`, `disenar-arquitectura` y `revisar-proyecto-existente` (skills, 3 frases cada una: `devuelves el documento y nada más`, `Decisiones para Franco`, `Tope de tamaño: 12288 bytes`).
- Es la regla 19, con el mismo texto de error que la regla 17: `El agente «X» debe contener la frase «F».` / `La skill «X» debe contener la frase «F».`
- No se exige el tope sobre `definitions/` real (ARCHITECTURE.md mide ~69 KB): solo las frases en los textos.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: la regla, el export, la muestra actualizada y los controles negativos.
Fuera de alcance: cambiar los textos de agentes y skills, el script de tamaño (task-04), `coordinador.md` y `definitions/`.

## Pasos
1. En `contrato-roles.mjs`, exporta `FRASES_UNA_PASADA` justo después de `FRASES_LECTURA_F22`.
2. Antes de `return errores;`, añade la regla 19 que recorre `FRASES_UNA_PASADA` (agente si la clave es `arquitecto`, skill en los demás casos) y empuja el error por cada frase ausente.
3. En `contrato-roles.test.mjs`, importa `FRASES_UNA_PASADA`; en `muestra()` añade al texto de `arquitecto` las 7 frases y a `disenar-arquitectura` sus 3, y crea las skills `definir-proyecto` y `revisar-proyecto-existente` con sus 3 frases.
4. Añade el bucle de controles negativos de la regla 19 (una prueba por frase: quitarla de la muestra debe producir un error que la mencione), igual que el de la regla 17.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/contrato-roles.test.mjs` deja `ℹ fail 0`, incluida la prueba de archivos reales.
2. Hay 16 controles negativos nuevos (7 + 3 + 3 + 3), uno por frase.
3. La muestra válida sigue sin errores.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7` (7 fallos ajenos conocidos); no suma fallos nuevos.

## Verificación
```
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza regla 19'; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0`; luego `16` y `exit 0`; y `ℹ fail 7`.

## Evidencia

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E '^ℹ (pass|fail)'; echo "exit $?"
ℹ pass 73
ℹ fail 0
exit 0
```

```
$ node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -c 'rechaza regla 19'; echo "exit $?"
16
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Hueco menor: la tarea no lista las 7 frases de `arquitecto`. Se tomaron de `agentes/arquitecto.md` (líneas 49 a 51, texto real): «Una sola pasada por puerta», «devuelves el documento y nada más», «no reabres preguntas ni propones otra ronda», «Otra ronda solo si Franco la pide», «Decisiones para Franco», «Tope de tamaño: 12288 bytes» y «Tamaño de la pasada: <n> bytes».
- Muestra válida: se añadió la skill `revisar-proyecto-existente` a `arquitecto` para cumplir la regla 4.
Autocomprobación `--evidencia`: OK, 1 tarea con evidencia completa (exit 0).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna
