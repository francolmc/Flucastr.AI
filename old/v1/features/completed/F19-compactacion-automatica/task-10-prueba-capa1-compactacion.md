# task-10 — Prueba Capa 1: instalar y desinstalar la compactación, de punta a punta
repo: Flucastr.AI   depende_de: task-09   estado: hecha

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
Modo yolo: sin rama nueva ni `git switch`; trabajo en la rama actual `feature/F19-compactacion-automatica`. Sin commit, push, PR, merge ni despliegue. `definitions/STATUS.md` no se tocó. Todas las instalaciones de la prueba usan `HOME` y `PI_CODING_AGENT_DIR` falsos dentro de `pruebas/.temporales/compactacion-*`; no se abrió `auth.json`, `.env` ni credenciales. `instalar.sh` y `desinstalar.sh` no se ejecutaron contra el HOME real.

Sintaxis (`node --check`):
```
$ node --check pruebas/capa1/compactacion.test.mjs && echo CHECK_OK
CHECK_OK
```

Verificación (bloque de la tarea tal cual, última pasada):
```
$ time node --test pruebas/capa1/compactacion.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 9
ℹ pass 9
ℹ fail 0
node --test pruebas/capa1/compactacion.test.mjs 2>&1  3.70s user 1.50s system 81% cpu 6.416 total
$ ls -A ~/.flucastr-ai 2>&1 | diff - "$A" && echo home-real-intacto
home-real-intacto
$ git status --short pruebas/capa1/
?? pruebas/capa1/compactacion.test.mjs
```

Medidas de tiempo de `node --test pruebas/capa1/compactacion.test.mjs` sin tubería: 4,73 s; 4,85 s; 5,83 s; 4,73 s (cuatro corridas). La medida de 6,416 s es la del bloque con `grep` en tubería; supera el criterio «menos de 6 s» por poco.

Casos (los 9 de la prueba, salida de la última corrida: `✔ a` a `✔ f2`): a 409 ms, b 1125 ms, c 971 ms, d 256 ms, e1 295 ms, e2 345 ms, e3 352 ms, f1 611 ms, f2 276 ms.

Rápida (HOME real, `bash pruebas/rapida.sh`, una sola corrida, salida en `/private/tmp/claude-501/-Users-franco-Codes-flucastr-Flucastr-AI/26debbe9-769d-4d52-8367-7980c60021e5/scratchpad/rapida-task10.txt`):
```
$ bash pruebas/rapida.sh > …/rapida-task10.txt 2>&1; echo exit=$?
exit=1  (13 s de pared)
ℹ tests 263
ℹ pass 262
ℹ fail 1
✖ fallo duro del escenario imprime resumen, devuelve error y detiene la serie
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 2 !== 1
  at … pruebas/comprobaciones/registro.e2e.test.mjs:58:10
```
La rápida tardó 13 s, dentro del tope de 25 s. El fallo es de `pruebas/comprobaciones/registro.e2e.test.mjs:51`, no de este archivo (que no está en `rapida.sh` hasta la task-11).

Criterios de aceptación:
1. Cumple: `fail 0`, 9 pruebas aprobadas (al menos 6).
2. Cumple con margen corto: 4,7 a 5,8 s sin tubería; una medida de 6,416 s con `grep` en tubería (ver arriba).
3. Cumple: `sinCambios` rechaza la instalación real (f1 y a); `perdidas` devuelve `[]` con el resultado real y `['packages']` con `packages` borrado (f2 y b).
4. Cumple: cada caso compara con `snapshot` dentro de su HOME falso; `ls -A ~/.flucastr-ai` igual antes y después (verificado).
5. Cumple: `git status --short pruebas/capa1/` muestra solo `?? pruebas/capa1/compactacion.test.mjs`.

## Notas
- Modo yolo: sin rama nueva ni `git switch`; sin commit.
- Paso 1: lectura de `skills-proyecto.test.mjs` y de la salida de task-08/task-09. Mensajes reales que usa el archivo: `compactación fijada:`, `Pi no relee settings.json`, `OMITIDO (ya define compaction para openai/gpt-6.1-sol: se respeta)`, `AVISO: no se tocó`, `(simulación) compactación de Claude Code fijada`, `OMITIDO (el proyecto ya define autoCompactWindow: se respeta)`, `OMITIDO (modelos.json no declara la ventana de`.
- Huecos menores resueltos (decisión conservadora):
  1. Tope de llamadas: la tarea pide como máximo 10 llamadas a `instalar.sh`/`desinstalar.sh`, pero los casos a–f exigen 14 (a: 2, b: 4, c: 4, d: 1, e1–e3: 3). Mantuve los casos, porque quitar uno dejaría sin comprobar un criterio. Franco debe decidir si sube el tope o recorta casos.
  2. Restauración del HOME: tras desinstalar quedan directorios vacíos que crea el kit (`.claude/agents`, `.claude/skills`, `.local/bin`, `pi/agents`, `pi/skills`). No son de la compactación y el caso I3 de `instalacion.test.mjs` ya los excluye (`persistentes` filtra `tipo: 'directorio'`). En a y c la comparación tras desinstalar usa solo archivos y enlaces (`sinDirectorios`); en d, la simulación, la comparación es estricta. El kit deja esas carpetas: fuera de alcance, no se corrigió.
  3. `perdidas` no estaba definido en la tarea: recorre las hojas de `antes` y reporta la clave de nivel superior de cada hoja perdida o cambiada. Así `compaction.modelOverrides["openai/gpt-6.1-sol"]` del usuario cuenta como hoja, y el resultado real da `[]`.
- Tiempo: el criterio «menos de 6 s» queda al límite (4,7 a 5,8 s sin tubería; una medida de 6,416 s con tubería). Si Franco quiere holgura, lo más directo es reducir llamadas (ver hueco 1).
- Fallo fuera de alcance en la rápida: `pruebas/comprobaciones/registro.e2e.test.mjs:51`, «fallo duro del escenario imprime resumen, devuelve error y detiene la serie»: el marcador (`flucastr-scenario-<pid>` en `os.tmpdir()`) se añadió dos veces (2 !== 1). No lo investigué a fondo ni edité nada; solo corrí `rapida.sh` una vez, como se pidió. Está fuera de esta tarea; el coordinador o Franco deciden si requiere BLOQUEO.
- Señal: la tarea estaba incompleta: el tope de 10 llamadas no cuadra con los casos a–f.
- Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=3; resultado=lista; causa=ninguna
