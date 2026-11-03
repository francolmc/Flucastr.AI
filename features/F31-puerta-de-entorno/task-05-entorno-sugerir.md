# task-05 — `entorno.mjs --sugerir`: proponer la línea `Requiere:`
repo: Flucastr.AI   depende_de: task-04   estado: hecha

## Descripción
Para tareas viejas o de otros proyectos sin `Requiere:`, `--sugerir` lee la *Verificación* y propone la línea. Nunca bloquea ni escribe la tarea: solo imprime la sugerencia.

## Contexto
- Tocar: `scripts/entorno.mjs`, `pruebas/comprobaciones/entorno.test.mjs`
- Requiere: ninguno
- De task-04 lee solo las *Notas*: `scripts/entorno.mjs` ya tiene la CLI con salidas 0, 1 y 2; `comprobarEntorno` y `SONDAS` no cambian aquí.
- `scripts/formato-tarea.mjs` exporta `secciones(lineas)` (línea 26) para extraer el cuerpo de `## Verificación`.
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «4. Pieza 1 — Puerta de entorno»

## Decisiones ya tomadas
- Uso: `node scripts/entorno.mjs --sugerir <ruta-tarea>` (la opción es el primer argumento). Imprime `sugerido: Requiere: <lista>` o `sugerido: Requiere: ninguno` y sale 0; ruta ilegible o sin argumento sale 2.
- Exporta `sugerirRequiere(texto)` → arreglo de items. Solo mira el cuerpo de `## Verificación`: `docker` (palabra completa, sin distinguir mayúsculas) → `docker`; `playwright`, `chromium` o `puppeteer` → `navegador`; `localhost:NNNN` o `127.0.0.1:NNNN` → `puerto:NNNN` (sin repetir, orden de aparición). Orden final: `docker`, `navegador`, `puerto:…`.
- Con `--sugerir` no se corre ninguna sonda.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: `sugerirRequiere`, la opción y sus pruebas.
Fuera de alcance: sugerir `red`, `runtime` o `largo`, escribir en la tarea, cambiar el modo normal de `entorno.mjs`.

## Pasos
1. En `scripts/entorno.mjs` agrega `sugerirRequiere` y la rama `--sugerir` de la CLI.
2. En `entorno.test.mjs` agrega pruebas de `sugerirRequiere` con texto de tarea: Docker + `localhost:55432` → `docker`, `puerto:55432`; `playwright test` → `navegador`; verificación sin nada → arreglo vacío; menciones fuera de *Verificación* no cuentan.
3. Agrega una prueba de CLI: salida exacta `sugerido: Requiere: docker, puerto:55432` y código 0.

## Criterios de aceptación
1. La sugerencia respeta el orden y la ausencia de repetidos; se comprueba en `entorno.test.mjs`.
2. `--sugerir` no corre sondas ni escribe archivos; se comprueba con una prueba que lo ejecuta sin Docker disponible y compara el directorio antes y después.
3. El modo normal sigue igual; se comprueba con las pruebas de task-04 en el mismo archivo (`ℹ fail 0`).

## Verificación
```
node --test pruebas/comprobaciones/entorno.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```
Esperado: `ℹ fail 0` y `ℹ pass` igual a `ℹ tests` (menos de 20 s).

## Evidencia
```
$ node --test pruebas/comprobaciones/entorno.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 21
ℹ pass 21
ℹ fail 0
exit 0
```

Duración medida fuera de la Verificación (`time` de la misma suite, sin filtro): 1 s, rc=0. Criterios: 1) orden, ausencia de repetidos y menciones fuera de Verificación probados en `sugerirRequiere`; 2) prueba «sin Docker disponible» con `PATH=/nonexistent`: sale 0, imprime `sugerido: Requiere: docker, navegador, puerto:55432` y el directorio no cambia; 3) las 14 pruebas de task-04 pasan (`ℹ fail 0`).

## Notas
- Hueco menor: el cuerpo de *Verificación* se toma con `secciones()` de `scripts/formato-tarea.mjs`; una tarea sin esa sección sugiere `[]` (la CLI sale 0 con `sugerido: Requiere: ninguno`).
- Hueco menor: la coincidencia de `docker`, `playwright|chromium|puppeteer` y `localhost|127.0.0.1:NNNN` es por palabra y sin distinguir mayúsculas dentro del cuerpo; no se afina contra comentarios de la verificación (sugerencia conservadora; el coordinador revisa la línea).
- Intentos: 2 pasadas de la *Verificación*. La primera confirmó `ℹ fail 0`; la segunda produjo la salida de *Evidencia* con `exit 0`. No se contó ninguna otra.
- Rápida (`bash pruebas/rapida.sh`, sale 1 como se esperaba): `ℹ tests 578`, `ℹ pass 571`, `ℹ fail 7`. Respecto de la base 571/564/7, son 7 pruebas nuevas, todas pasan. Los 7 fallos por nombre (`✖`) son: «definitions/BACKLOG.md real cumple el formato» (fila F26); «los archivos reales cumplen la regla»; «falla si falta la lectura acotada en constructor»; «falla si falta la lectura acotada en ejecutar-tarea» (2 de lectura acotada); «falla si un agente conserva la línea de modelos.json» (1 de agente); «falla si WORKFLOW.md pasa de 30720 caracteres» y «falla si WORKFLOW.md conserva la frase sobre modelos.json» (2 de WORKFLOW.md). Coinciden con la base. Salida completa de 737 líneas, no copiada aquí.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
