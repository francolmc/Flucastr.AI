# task-04 — Raíz del kit y lanzador fijo en la instalación
repo: Flucastr.AI   depende_de: task-03   estado: aprobada

## Descripción
Los proyectos instalados (como Flucastr.Cleaner) no tienen `scripts/`, así que el `coordinador` no puede llegar a `scripts/validar-tarea.mjs`. Decisión de Franco (2026-11-01): `instalar.sh` escribe, en modo repo y en modo descarga, `~/.flucastr-ai/raiz` (ruta de la raíz del kit) y un lanzador fijo `~/.flucastr-ai/validar-tarea.mjs`; `desinstalar.sh` los quita solo si el manifiesto los registra. El lanzador permite un permiso de `Bash` literal, sin `$(…)` (task-05). Esta tarea implementa eso y su prueba aislada.

## Contexto
- Leer: `definitions/ARCHITECTURE.md`, subsección «Raíz del kit y puerta previa de tarea (F24…)», viñetas `~/.flucastr-ai/raiz`, «Lanzador fijo» e «Invocación». De task-03 (`depende_de`), solo sus *Notas*.
- Tocar: `instalar.sh`, `desinstalar.sh`, `pruebas/comprobaciones/raiz-kit.test.mjs`
- `instalar.sh`: `RAIZ` es la carpeta del script (línea 14); `ESTADO_DIR=$HOME/.flucastr-ai`; `registrar tipo ruta [extra]` añade `tipo<TAB>ruta<TAB>extra` al manifiesto nuevo; `registrar modo "$MODO"` (línea 418) debe seguir siendo la primera línea; el bloque «Quitando la instalación anterior...» (línea 434) llama a `desinstalar.sh`; la línea 440 imprime «SIMULACIÓN: no se escribe nada.».
- `desinstalar.sh`: el bucle `while IFS=$'\t' read -r tipo ruta extra` (hasta la línea 281) tiene un `case "$tipo"` con ramas `enlace`, `archivo`, `directorio`, `exclusion`, `skills-proyecto`, `compactacion`, `ajuste`; el modo `--proyecto` (líneas 66-170) conserva las líneas de tipo desconocido.
- `instalar-remoto.sh` (`copiar_permitidas`, líneas 174-183) ya copia `scripts/` entera al kit y corre `instalar.sh --copiar`: no se toca.
- Pruebas existentes que deben seguir en verde: `pruebas/capa1/copia.test.mjs` (línea 177 espera que, tras `desinstalar.sh`, `~/.flucastr-ai` solo contenga `modelos.json`), `instalacion.test.mjs`, `skills-proyecto.test.mjs`, `compactacion.test.mjs`. Entorno aislado como en `instalacion.test.mjs` líneas 9-37 (copia de `instalar.sh`, `desinstalar.sh`, `scripts`, `agentes`, `skills`, `modelos.json` a una carpeta temporal con `HOME` propio; la copia de `scripts` incluye `validar-tarea.mjs` de task-03).

## Decisiones ya tomadas
- `~/.flucastr-ai/raiz`: una línea con el valor de `RAIZ` (modo repo: el clon; modo descarga: `~/.flucastr-ai/kit`).
- `~/.flucastr-ai/validar-tarea.mjs`: lo escribe `instalar.sh` con un `cat > … <<'EOF'` (módulo ES, sin lógica propia): lee `join(homedir(), '.flucastr-ai', 'raiz')` (recortado), y hace `await import(pathToFileURL(join(raiz, 'scripts', 'validar-tarea.mjs')).href)`. No toca `process.argv` ni `process.exitCode`: el script real se ejecuta al importarse (task-03) y su salida y código son los del lanzador. Si `raiz` no se puede leer, escribe «No se puede leer ~/.flucastr-ai/raiz; reinstala el kit.» a stderr y sale con 2.
- Manifiesto: dos líneas `raiz<TAB>$ESTADO_DIR/raiz` y `raiz<TAB>$ESTADO_DIR/validar-tarea.mjs` (ruta del archivo), tras la línea `modo`. Se escriben tras el bloque «Quitando la instalación anterior».
- `desinstalar.sh`: rama `raiz)` en la desinstalación completa; borra la ruta de la línea solo si es `$ESTADO_DIR/raiz` o `$ESTADO_DIR/validar-tarea.mjs` y es un archivo regular. Con `--simular` solo lo dice. El modo `--proyecto` no lo toca.
- `--simular` en `instalar.sh` no escribe: dice «SIMULACIÓN: se escribirá $ESTADO_DIR/raiz y $ESTADO_DIR/validar-tarea.mjs».
- No se copia `scripts/` a ningún proyecto (descartado por Franco).

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: los dos archivos, sus líneas de manifiesto, su borrado y la prueba nueva en `pruebas/comprobaciones/` (`pruebas/rapida.sh` la recoge por `*.test.mjs`).
Fuera de alcance: permisos del `coordinador`, reglas de los agentes, `instalar-remoto.sh`, el script `validar-tarea.mjs`, cambios de modo repo/descarga.

## Pasos
1. En `instalar.sh`, tras «Quitando la instalación anterior...», escribir `raiz` (`mkdir -p`, `printf '%s\n' "$RAIZ"`) y el lanzador, y registrar las dos líneas `raiz`; con `SIMULAR=1`, solo el mensaje.
2. En `desinstalar.sh`, añadir la rama `raiz)`.
3. Crear `raiz-kit.test.mjs` con entorno aislado y estos casos: (a) modo repo (`bash instalar.sh --solo claude`): existen `raiz` (con la ruta de la copia) y `validar-tarea.mjs`, y el manifiesto tiene las dos líneas después de `modo`; (b) igual con `--copiar --solo claude`; (c) lanzador instalado: `node $HOME/.flucastr-ai/validar-tarea.mjs <archivo vacío>` sale 1 y nombra la ruta, y con una ruta inexistente sale 2 con «No se puede leer», ambos con cwd sin `scripts/`; (d) `desinstalar.sh` borra ambos; (e) `--simular` no crea nada.
4. Controles negativos: (i) con ambos archivos creados a mano y sin líneas en el manifiesto, `desinstalar.sh` no los borra; (ii) con `raiz` borrada, el lanzador sale 2 con «reinstala el kit».
5. Ejecutar la verificación.

## Criterios de aceptación
1. En ambos modos existen `raiz` y el lanzador, y el lanzador llega al script real: casos (a), (b), (c).
2. `desinstalar.sh` los borra solo si el manifiesto los registra: caso (d) y control (i).
3. `--simular` no escribe: caso (e).
4. Las pruebas de instalación existentes siguen en verde: segundo comando de *Verificación*.

## Verificación
```
node --test pruebas/comprobaciones/raiz-kit.test.mjs
node --test pruebas/capa1/copia.test.mjs pruebas/capa1/instalacion.test.mjs pruebas/capa1/skills-proyecto.test.mjs pruebas/capa1/compactacion.test.mjs
```
Esperado: ambos terminan con `ℹ fail 0`.

## Evidencia

## Notas
Corrección 2026-11-01: se añade el lanzador fijo `~/.flucastr-ai/validar-tarea.mjs` (sin `$(…)` en el permiso) y se cierra que el script real se ejecuta al importarse. El manifiesto registra rutas de archivo, no el valor de `RAIZ`.
