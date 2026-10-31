# task-10 — Prueba Capa 1: instalar y desinstalar la compactación, de punta a punta
repo: Flucastr.AI   depende_de: task-09   estado: aprobada

## Descripción
Prueba determinista (sin modelo ni red) de `instalar.sh` y `desinstalar.sh` con la compactación: lo que se escribe en el `settings.json` de Pi y en el `settings.local.json` de un proyecto, el manifiesto, la simetría de instalar/desinstalar, el respeto a lo del usuario, `--simular` y la reinstalación. Todo en un HOME temporal; nunca toca `~/.claude`, `~/.pi` ni `~/.flucastr-ai` reales. Con controles negativos.

## Contexto
- Patrón a copiar (helpers `armarRepo`, `entorno`, `crearProyecto`, `snapshot`, `manifiesto`, `exito`, corrida en `pruebas/.temporales/`): `pruebas/capa1/skills-proyecto.test.mjs` (líneas 1–100). Cada entorno usa `HOME` y `PI_CODING_AGENT_DIR` propios; `armarRepo` copia `instalar.sh`, `desinstalar.sh`, `scripts/`, un agente de prueba, dos skills de prueba y un `modelos.json` con el real y solo el agente `arquitecto` (conserva `compactar_en` y `ventanas`).
- Comportamiento a fijar (tareas 06 a 09): Pi → `$PI/settings.json` con tres overrides `reserveTokens` 172000 y tres líneas `compactacion<TAB>$PI/settings.json<TAB>pi:<modelo>=172000:creado`; Claude Code con `--proyecto` → `autoCompactWindow` 133000 y una línea `…<TAB>claude:133000`; mensajes exactos de las tareas 08 y 09.
- `pruebas/capa1/instalacion.test.mjs` I3/I4 ya fijan que instalar+desinstalar restaura el árbol y que la segunda instalación no cambia nada, para el caso base.
- `rapida.sh` lista los archivos de `pruebas/capa1/` uno por uno; la task-11 añade este. Tiempo de referencia: `skills-proyecto.test.mjs` (8 instalaciones) dura ~4,5 s. Esta prueba debe hacer como máximo 10 llamadas a `instalar.sh`/`desinstalar.sh`.

## Decisiones ya tomadas
- Archivo nuevo `pruebas/capa1/compactacion.test.mjs`. Cinco entornos independientes (`entorno('pi-limpio')`, …) para que los casos no dependan del orden.
- Casos:
  a. **Pi limpio**: instalar; `settings.json` existe con exactamente las tres claves de `compaction.modelOverrides` en 172000; el manifiesto tiene tres líneas `compactacion` con sufijo `:creado`; stdout contiene `compactación fijada:` y `Pi no relee settings.json`; no queda `settings.json.lock` ni `.tmp`. Desinstalar: el HOME (`snapshot`) es idéntico al inicial.
  b. **Pi con archivo del usuario** (`deviceId`, `packages`, `claveNueva`, un override propio de `openai/gpt-6.1-sol` = 100000): instalar conserva todo, stdout contiene `OMITIDO (ya define compaction para openai/gpt-6.1-sol: se respeta)`, los otros dos modelos quedan en 172000 y el manifiesto tiene solo dos líneas, sin `:creado`; desinstalar deja el archivo con `JSON.parse` igual al original (el formato puede cambiar). Reinstalar dos veces seguidas deja el mismo `settings.json` (comparar `JSON.parse`).
  c. **Proyecto**: `crearProyecto('p')`; `instalar --proyecto p` deja `{agent:'arquitecto', autoCompactWindow:133000}` en `p/.claude/settings.local.json` y una línea `claude:133000`; `instalar` sin `--proyecto` conserva la línea y el archivo; `desinstalar --proyecto p` borra el archivo y la carpeta `.claude` y quita la línea (las líneas `pi:` siguen); `desinstalar` completo deja el HOME como al principio.
  d. **Simulación**: `instalar --simular --proyecto p` imprime `(simulación) compactación fijada:` y `(simulación) compactación de Claude Code fijada`, y `snapshot(home)` y `snapshot(p)` no cambian.
  e. **Casos de borde**: (1) `modelos.json` del repo de prueba sin `ventanas` ni `compactar_en` (personal antiguo) → exit 0, stdout contiene `OMITIDO (modelos.json no declara la ventana de`, no existe `settings.json`, hay agentes instalados; (2) `settings.json` con `{ roto` → exit 0, stdout contiene `AVISO: no se tocó`, el archivo queda con los mismos bytes; (3) `settings.local.json` del proyecto con `autoCompactWindow: 150000` → `OMITIDO (el proyecto ya define autoCompactWindow: se respeta)`, valor intacto y ninguna línea `claude:` en el manifiesto.
  f. **Controles negativos**: (1) un ayudante `sinCambios(antes, despues)` aplicado a `snapshot(home)` después de la simulación pasa; aplicado a la instantánea de una instalación real (que sí escribe) debe fallar (`assert.throws`); (2) comprobar el caso (b) contra el ayudante `perdidas` (claves de `antes` que cambiaron o faltan): con el resultado real → `[]`; con una copia dañada (se borra `packages`) → `['packages']`.
- Las llamadas a `instalar.sh` usan `ejecutar` con `timeout: 30000` como en la prueba de referencia; los números se comparan como números.
- Sin dependencias nuevas.

## Alcance / Fuera de alcance
Alcance: el archivo nuevo `pruebas/capa1/compactacion.test.mjs`.
Fuera de alcance: `instalar.sh`, `desinstalar.sh`, `scripts/resolver.mjs` (si la prueba revela un defecto, nota o `BLOQUEO`; no se corrige aquí), `pruebas/rapida.sh` (task-11), pruebas existentes.

## Pasos
1. Leer `skills-proyecto.test.mjs` y ejecutar una instalación de ejemplo en un HOME temporal para ver la salida real. Resultado: mensajes anotados en *Notas*.
2. Crear el archivo con los helpers copiados y adaptados. Resultado: `node --check` sin errores.
3. Escribir los casos a y b. Resultado: aprobados.
4. Escribir los casos c y d. Resultado: aprobados.
5. Escribir los casos e y f. Resultado: aprobados.
6. Medir `time node --test pruebas/capa1/compactacion.test.mjs`. Resultado: anotado en *Evidencia*.

## Criterios de aceptación
1. `node --test pruebas/capa1/compactacion.test.mjs` termina con `fail 0` y al menos 6 pruebas aprobadas.
2. Dura menos de 6 s.
3. Los controles negativos (f) fallan donde deben: `sinCambios` rechaza una instalación real y `perdidas` detecta `packages` borrado.
4. Cada caso comprueba el árbol de HOME con `snapshot`, sin tocar los directorios reales (`git status` y `ls ~/.flucastr-ai` iguales antes y después).
5. `git status --short` muestra como nuevo, de esta tarea, solo ese archivo (y la carpeta `pruebas/.temporales/`, que ya está ignorada o preexistente).

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
A=$(mktemp); ls -A ~/.flucastr-ai > "$A" 2>&1
time node --test pruebas/capa1/compactacion.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ls -A ~/.flucastr-ai 2>&1 | diff - "$A" && echo home-real-intacto
git status --short pruebas/capa1/
```
Esperado: `tests` ≥ 6, `fail 0`, menos de 6 s; `home-real-intacto`; el archivo nuevo como `??`. No ejecutado por el planificador: depende de las tareas 06 a 09.

## Evidencia
(lo llena el constructor)

## Notas
(lo llena el constructor)
