# task-06 — `instalar.sh` deja el lanzador `~/.flucastr-ai/entorno.mjs` y la puerta previa sigue funcionando
repo: Flucastr.AI   depende_de: task-03, task-04   estado: hecha

## Descripción
Los proyectos instalados no tienen `scripts/`: llegan al kit por `~/.flucastr-ai`. El instalador debe escribir un segundo lanzador para `entorno.mjs`, registrarlo en el manifiesto y `desinstalar.sh` debe quitarlo. El riesgo del diseño es que un módulo nuevo (`formato-requiere.mjs`) no sea alcanzable y caiga la puerta 3 de todos los proyectos: una prueba lo verifica.

## Contexto
- Tocar: `instalar.sh`, `desinstalar.sh`, `pruebas/comprobaciones/raiz-kit.test.mjs`
- Requiere: ninguno
- `instalar.sh` (confirmado): líneas 442–473 escriben `~/.flucastr-ai/raiz` y el lanzador `validar-tarea.mjs` con `cat > … <<'EOF'`, hacen `chmod +x` y `registrar raiz <ruta>` (líneas 470–471); el mensaje de simulación está en la línea 445. El lanzador importa `<raiz>/scripts/validar-tarea.mjs` y sale 2 si no lee `raiz`.
- `desinstalar.sh` (confirmado): caso `raiz)` en las líneas 269–277 solo borra `$ESTADO_DIR/raiz` y `$ESTADO_DIR/validar-tarea.mjs`; cualquier otra ruta queda «omitido».
- `raiz-kit.test.mjs` (confirmado): `entorno()` copia `instalar.sh`, `desinstalar.sh`, `scripts`, `agentes`, `skills`, `modelos.json` a un repo temporal con `HOME` temporal; tiene `lanzador(...)` que corre `validar-tarea.mjs` desde un directorio sin `scripts/` (`sinScripts`) y un caso por modo (`[]` y `['--copiar']`).
- Fuente: definitions/DIAGNOSTICO-BLOQUEOS.md «7. Riesgos»

## Decisiones ya tomadas
- El lanzador `entorno.mjs` tiene el mismo molde que el de `validar-tarea.mjs`, pero envuelve el `import` en `try/catch`: si el módulo no carga, escribe el motivo en stderr y fija `process.exitCode = 2` (así «falta de módulo» nunca se confunde con el 1 de «falta entorno»).
- Se registra con `registrar raiz "$ESTADO_DIR/entorno.mjs"` y la línea de simulación nombra los tres archivos.
- En `desinstalar.sh` la condición del caso `raiz)` suma `$ESTADO_DIR/entorno.mjs`.
- Pruebas nuevas en `raiz-kit.test.mjs`, para ambos modos: (a) el lanzador existe y está en el manifiesto; (b) corrido desde `sinScripts`, con una tarea `Requiere: ninguno`, sale 0; con `runtime:node@999` sale 1 y `falta=runtime:node@999`; (c) el lanzador de `validar-tarea` valida desde `sinScripts` una tarea con `- Requiere: docker` sin error de importación; (d) tras `desinstalar`, el archivo no existe.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: los tres archivos nombrados.
Fuera de alcance: cambiar el lanzador de `validar-tarea`, `scripts/entorno.mjs`, la raíz (`raiz`), pruebas de `pruebas/capa1/`, el README (lo actualiza Franco al cerrar).

## Pasos
1. En `instalar.sh`, después del bloque del lanzador de `validar-tarea` (antes del `fi` de la línea 473), escribe el lanzador de `entorno.mjs`, `chmod +x`, `registrar raiz` y un `echo`; actualiza el mensaje de simulación.
2. En `desinstalar.sh`, agrega la ruta al caso `raiz)`.
3. En `raiz-kit.test.mjs`, agrega a `entorno()` un helper `lanzadorEntorno(...)` y las pruebas (a)–(d) para los dos modos.
4. Corre la prueba.

## Criterios de aceptación
1. En ambos modos, `~/.flucastr-ai/entorno.mjs` existe y está en el manifiesto tras `instalar.sh`; se comprueba en `raiz-kit.test.mjs`.
2. Desde un directorio sin `scripts/`, el lanzador de `entorno` da 0 con `ninguno` y 1 con `falta=` cuando falta; se comprueba en la misma prueba.
3. La puerta previa instalada sigue validando tareas con `Requiere:`; se comprueba en la prueba (c).
4. `desinstalar.sh` lo quita; se comprueba en la prueba (d).

## Verificación
```
node --test pruebas/comprobaciones/raiz-kit.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
bash -n instalar.sh && bash -n desinstalar.sh && echo sintaxis-ok
```
Esperado: `ℹ fail 0` y `ℹ pass` igual a `ℹ tests` (menos de 120 s); `sintaxis-ok`.

## Evidencia

```
$ node --test pruebas/comprobaciones/raiz-kit.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 15
ℹ pass 15
ℹ fail 0
exit 0

$ bash -n instalar.sh && bash -n desinstalar.sh && echo sintaxis-ok
sintaxis-ok
exit 0
```

## Notas
- Hueco menor: `scripts/entorno.mjs` corre su CLI solo como punto de entrada y exporta `ejecutarCli` (nota de task-04). El lanzador `entorno.mjs` importa el módulo y llama `modulo.ejecutarCli(process.argv.slice(2))`, poniendo el código devuelto en `process.exitCode`. Opción conservadora; `scripts/entorno.mjs` no se toca.
- Hueco menor: la regex de la prueba (e) de `raiz-kit.test.mjs` esperaba el mensaje de simulación anterior. La ajusté al nuevo (raiz, validar-tarea.mjs y entorno.mjs) y añadí que `entorno.mjs` no se crea en simulación.
- Hueco menor: la prueba (c) comprueba que el lanzador de validar-tarea instalado carga con `- Requiere: docker` (sin error de importación y sin salida 2), no un veredicto concreto; la tarea de prueba es mínima.
- Pruebas nuevas: 8 (a, b, c y d en los modos repo y descarga). Se agregan al archivo, que pasa a 15 pruebas.
- Rápida (`bash pruebas/rapida.sh`, sale 1 como se esperaba): `ℹ tests 586`, `ℹ pass 579`, `ℹ fail 7`. Respecto de la base 578/571/7 son +8 pruebas nuevas, todas pasan. Los 7 fallos por nombre: «definitions/BACKLOG.md real cumple el formato» y «los archivos reales cumplen la regla» (fila F26 y regla de archivos reales); «falla si un agente conserva la línea de modelos.json» (1 de agente); «falla si falta la lectura acotada en constructor» y «... en ejecutar-tarea» (2 de lectura acotada); «falla si WORKFLOW.md pasa de 30720 caracteres» y «falla si WORKFLOW.md conserva la frase sobre modelos.json» (2 de WORKFLOW.md). Coinciden con la base.
- Intentos: 2 pasadas completas de la Verificación. La primera confirmó que pasa sin captura de código de salida; la segunda es la de *Evidencia*.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
