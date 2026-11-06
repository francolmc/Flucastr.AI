# task-02 — Topes de bytes por archivo de agente y módulo
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
Los prompts crecen sin que nada lo frene: solo el `coordinador` tiene un tope (17 920 B, dentro de `coordinador-turnos.test.mjs`). Esta tarea crea una prueba con un tope por archivo, igual al tamaño de hoy, para que las tareas siguientes solo puedan acortar y para que los módulos nuevos nazan acotados a 5 KB. No cambia comportamiento.

## Contexto
- Tocar: `pruebas/comprobaciones/topes-bytes.test.mjs`
- Fuente: definitions/CONTRATOS.md «4. Prompts: núcleo corto + módulos bajo demanda»
- Tamaños medidos con `wc -c`: `agentes/coordinador.md` 17897, `planificador.md` 4235, `constructor.md` 3377, `arquitecto.md` 4195.
- Modelo de estilo: `pruebas/comprobaciones/coordinador-turnos.test.mjs` (líneas 9-12 y 37-40: `RAIZ`, `statSync`, `assert.ok(tamano <= TOPE)`).
- `bash pruebas/rapida.sh` ejecuta todo `pruebas/comprobaciones/*.test.mjs`, así que el archivo nuevo entra solo.

## Decisiones ya tomadas
- Una tabla `TOPES` de objetos `{ ruta, tope, opcional }`: `agentes/coordinador.md` 17920, `agentes/planificador.md` 4400, `agentes/constructor.md` 3500, `agentes/arquitecto.md` 4300, y `skills/modo-yolo/SKILL.md`, `skills/ramas-feature/SKILL.md`, `skills/comandos-coordinador/SKILL.md` con 5120 y `opcional: true` (si el archivo no existe, se omite; las tareas siguientes lo crean).
- Función pura exportada `excede(bytes, tope)` y función `medir(ruta)` que devuelve el tamaño en bytes (`statSync(...).size`).
- Un test por entrada: el archivo (si existe) no supera su tope; el mensaje de error nombra la ruta, el tamaño y el tope.
- Control negativo sintético, sin leer el archivo real: para cada entrada de `TOPES`, `excede(tope + 1, tope)` es `true` y `excede(tope, tope)` es `false`; el valor deriva solo del tope, no del tamaño del archivo (que bajará con cada recorte). Se conserva además el control del límite exacto con 5121 y 5120.
- No se toca `coordinador-turnos.test.mjs`: su tope de 17920 convive con este hasta task-09.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un archivo de prueba nuevo.
Fuera de alcance: bajar topes (task-09, 12, 13 y 14), crear módulos y cualquier cambio en `agentes/`, `skills/` o `definitions/`.

## Pasos
1. Crea `topes-bytes.test.mjs` con `TOPES`, `excede` y `medir`.
2. Añade un test por entrada de `TOPES` y los controles negativos sintéticos descritos (uno por entrada, más el del límite exacto).
3. Corre el archivo y luego la prueba rápida.

## Criterios de aceptación
1. `node --test pruebas/comprobaciones/topes-bytes.test.mjs` da `ℹ fail 0` hoy.
2. Los cuatro agentes están en la tabla con los topes de «Decisiones ya tomadas».
3. Por cada entrada de `TOPES` hay un control negativo que usa solo `tope + 1` y `tope`, sin `medir`, y sigue en verde aunque el archivo real baje de tamaño.
4. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7`; sin fallos nuevos.

## Verificación
```
node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
grep -c "agentes/" pruebas/comprobaciones/topes-bytes.test.mjs; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `ℹ fail 0` en el primer comando y `ℹ fail 7` en el tercero; el segundo cuenta las menciones de agentes y termina en `exit 0`.

## Evidencia

```
$ node --test pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 0
exit 0
```

```
$ grep -c "agentes/" pruebas/comprobaciones/topes-bytes.test.mjs; echo "exit $?"
4
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
Corrección: control negativo sintético (no depende del tamaño real del archivo)
Cambio: el control «fallaría si creciera 1 KB» se reemplaza por `excede(tope + 1, tope)` true y `excede(tope, tope)` false por cada entrada de `TOPES`, sin `medir`. Positiva y control del límite exacto sin cambios; topes sin tocar.
Verificación ejecutada desde la raíz del repo (cwd), comandos idénticos a los de *Verificación*.
Autocomprobación `--evidencia`: `OK: 1 tarea(s) con evidencia completa` (exit 0).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
