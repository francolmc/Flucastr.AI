# task-02 — línea `Registro:` del constructor y evento `ejecucion`
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
El `constructor` agrega a *Notas* una línea `Registro:` por ejecución (intentos, huecos, modo, resultado y causa), que git no conserva de otra forma. Esta tarea fija esa línea en el contrato (`skills/ejecutar-tarea/SKILL.md`), la hace exigible con el validador de contrato y hace que `scripts/registrar.mjs` la lea y emita el evento `ejecucion`, con el modelo configurado. Sin permisos nuevos: *Notas* ya es suyo.

## Contexto
Diseño: `definitions/REGISTRO.md` §1 (fila `ejecucion`), §3 (línea y `modelo`) y §6 caso 2. Leídos en el repo: `skills/ejecutar-tarea/SKILL.md` (secciones `## Ejecución`, `## Cuándo detenerte (solo estos casos)`, `## Al terminar bien`; para `CONFIRMAR:` dice «no tocas código, ni la tarea, ni la rama»); `agentes/constructor.md` (en el archivo de la tarea solo escribe *Evidencia*, *Notas* y `estado`: la línea cabe en *Notas*, este archivo no se toca); `pruebas/comprobaciones/contrato-constructor.mjs` (arreglo `REGLAS` de objetos `{ n, sobre, frases, ... }`, última regla 14) y `contrato-constructor.test.mjs` (arreglo `variantes` de `[nombre, sobre, frases]`); `scripts/resolver.mjs` (`node scripts/resolver.mjs modelo <agente> <herramienta>` imprime el modelo; lee el archivo de `FLUCASTR_MODELOS` si está definida; ejemplo real: `modelo constructor claude-code` imprime `claude-haiku-5-5`); `modelos.json`; y lo que deja task-01 (`ESQUEMA`, `validarEvento`, historial de git por tarea, `registrar()`, la línea de resumen y `pruebas/capa1/registrar.test.mjs`).
A tocar: `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/contrato-constructor.mjs`, `pruebas/comprobaciones/contrato-constructor.test.mjs`, `scripts/registrar.mjs`, `pruebas/capa1/registrar.test.mjs`.

## Decisiones ya tomadas
- Línea exacta (una sola línea, al inicio de línea, dentro de *Notas*, separador `; `, claves en este orden):
  `Registro: n=<n>; herramienta=<herramienta>; modo=<modo>; intentos=<n>; verificacion=<resultado>; huecos=<n>; resultado=<resultado>; causa=<causa>`
  con `n` 1–99; `herramienta` en `claude-code` o `pi`; `modo` en `normal` o `yolo`; `intentos` 0–99; `verificacion` en `pasa`, `falla` o `parcial`; `huecos` 0–99; `resultado` en `lista`, `bloqueada` o `escalada`; `causa` en `credenciales`, `alcance`, `verificacion_x2`, `rama`, `otra` o `ninguna`. Ejemplo: `Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=1; resultado=lista; causa=ninguna`.
- Se **quita `confirmar`** del enum de `resultado` del diseño (`REGISTRO.md` §1): con `CONFIRMAR:` el constructor no toca la tarea (regla vigente de `ejecutar-tarea`), así que en ese caso **no escribe la línea**. El planificador lo informa al coordinador para que el arquitecto actualice `REGISTRO.md`; esta tarea no edita `definitions/`.
- Significados que fija la skill: `n` = líneas `Registro:` que ya hay en *Notas* + 1; `herramienta` = la herramienta en la que corre; `modo` = `yolo` solo si el encargo trae `Modo yolo: activo`; `intentos` = veces que corrió la *Verificación* completa (cada pasada completa suma 1); `verificacion` = `pasa` (todos los comandos pasaron en la última pasada), `parcial` (algunos pasaron y otros no se pudieron correr) o `falla` (falló, o no se corrió ninguno, con `intentos=0`); `huecos` = huecos menores anotados en *Notas* en esta ejecución; `resultado` = `lista` si deja `lista para revisión`, `bloqueada` si deja `estado: bloqueada`, `escalada` si termina con `BLOQUEO:` por cambio de alcance; `causa` = `ninguna` con `lista`, `alcance` con `escalada`, y con `bloqueada` la que corresponda (`credenciales`, `verificacion_x2`, `rama` si falló un `git switch`, `otra`).
- La skill pide la línea en toda ejecución que termine tocando la tarea (éxito, `bloqueada` o `escalada`), como **última línea de *Notas***. No la pide al rechazar una tarea que no está `aprobada` ni con `CONFIRMAR:` (la tarea no se toca). Texto nuevo de la skill: una subsección `## Línea de registro` después de `## Al terminar bien`, con la frase literal «una línea por ejecución», la plantilla y estos significados.
- Regla 15 del validador de contrato, sobre la skill: frases `Registro: n=<n>; herramienta=<herramienta>; modo=<modo>; intentos=<n>; verificacion=<resultado>; huecos=<n>; resultado=<resultado>; causa=<causa>` y `una línea por ejecución`, más `regex` `/Registro: n=<n>; herramienta=/` con `mensajeRegex` en español como las reglas 8 y 12. Variante de prueba que borra esas frases y exige al menos un error.
- Script: en `scripts/registrar.mjs` se agrega a `ESQUEMA` el evento `ejecucion` (`fuente: notas`, requiere `feature`, `tarea`, `sha`; campos `n`, `herramienta`, `modo`, `intentos`, `verificacion`, `huecos`, `resultado`, `causa` con los valores de arriba, y `modelo` con patrón `^[A-Za-z0-9._/:-]{1,80}$`). Lectura: solo líneas que empiecen por `Registro:` **dentro de la sección `## Notas`** (hasta el siguiente `## ` o el fin) en cada versión de la tarea, con patrón estricto de valores cerrados. El evento sale en el primer commit donde aparece una línea válida con ese `n`; un `n` repetido, una clave desconocida, claves fuera de orden o un valor fuera de lista no generan evento. Las líneas `Registro:` inválidas se cuentan **solo en la última versión de la tarea** y se informan en el resumen: `registrar: <n> eventos nuevos; <m> en total; <d> descartados; <l> líneas Registro: no válidas`.
- `id` de `ejecucion` = SHA-1 (12 hex) de `notas|feature|tarea|sha|ejecucion|n`.
- `modelo`: función `modeloConfigurado(raiz, herramienta)` que elige el primer `modelos.json` existente entre `FLUCASTR_MODELOS` (si no está vacía), `<raiz>/modelos.json` y `<os.homedir()>/.flucastr-ai/modelos.json`; corre `process.execPath` sobre el `resolver.mjs` que está junto a `registrar.mjs` con `modelo constructor <herramienta>` y `FLUCASTR_MODELOS=<ese archivo>`; si no hay archivo, el comando falla o la salida no calza con el patrón, usa `sin-configurar`. Se calcula una vez por herramienta y por corrida. Es el modelo **configurado** al correr el script, no el medido (`REGISTRO.md` §3).
- Pruebas: se agregan **como máximo 3** a `pruebas/capa1/registrar.test.mjs` (total 9), con `FLUCASTR_MODELOS` apuntando a un `modelos.json` temporal mínimo: (7) dos líneas válidas dan dos `ejecucion` con `n` 1 y 2 y el `modelo` esperado, una con `resultado=otro` se descarta y se cuenta en `líneas Registro: no válidas` (stdout), y una línea válida escrita en *Evidencia* no genera evento; (8) una segunda corrida no duplica y `--reconstruir` reproduce el mismo contenido; (9) canarios en el resto de *Notas* y una línea con clave extra (`titulo=...`) no aparecen en `eventos.jsonl`. `rapida.sh` no se toca.

## Alcance / Fuera de alcance
Alcance: la subsección de la skill, la regla 15 y su variante de prueba, el evento `ejecucion`, `modeloConfigurado` y 3 pruebas.
Fuera de alcance: `agentes/constructor.md`, `agentes/coordinador.md`, `README.md`, `pruebas/README.md`, `definitions/**`; permiso de `date` o cualquier tiempo real (decidido por Franco: no); medir el modelo realmente usado; comprobar que un modelo escriba bien la línea (se ve en la primera tarea real); el informe (F11).

## Pasos
1. `skills/ejecutar-tarea/SKILL.md`: añadir `## Línea de registro` tras `## Al terminar bien`, con la plantilla, los significados, cuándo se escribe y cuándo no. Resultado: `grep -c "una línea por ejecución" skills/ejecutar-tarea/SKILL.md` imprime `1`.
2. `pruebas/comprobaciones/contrato-constructor.mjs`: añadir la regla 15 en `REGLAS`. Resultado: `node --test pruebas/comprobaciones/contrato-constructor.test.mjs` pasa con los textos reales.
3. `pruebas/comprobaciones/contrato-constructor.test.mjs`: añadir la variante de la regla 15 en `variantes`. Resultado: la prueba nueva «rechaza regla 15…» pasa.
4. `scripts/registrar.mjs`: `ejecucion` en `ESQUEMA`, `modeloConfigurado`, lectura de las líneas de *Notas* e integración con el historial de task-01. Resultado: sobre un repo de prueba con una línea válida sale un evento `ejecucion`.
5. `scripts/registrar.mjs`: contador de líneas inválidas (solo última versión) y nueva línea de resumen. Resultado: la salida termina con `; <l> líneas Registro: no válidas`.
6. `pruebas/capa1/registrar.test.mjs`: añadir las pruebas 7, 8 y 9. Resultado: `pass 9`.
7. Correr la *Verificación* y pegar la salida real en *Evidencia*.

## Criterios de aceptación
1. La skill contiene la plantilla de la línea, `una línea por ejecución` y los significados, y el validador falla si se borran. `node --test pruebas/comprobaciones/contrato-constructor.test.mjs`.
2. Dos líneas válidas dan dos eventos `ejecucion` con el modelo del `modelos.json` indicado; una con valor fuera de lista se descarta y se cuenta. `node --test pruebas/capa1/registrar.test.mjs`.
3. Una línea `Registro:` fuera de *Notas* no genera evento; repetir la corrida no duplica; `--reconstruir` reproduce el mismo contenido. Misma prueba.
4. Ningún texto de *Notas* fuera de la línea validada ni clave extra llega a `eventos.jsonl`. Misma prueba.
5. `bash pruebas/rapida.sh` sigue pasando dentro del tope. Comando en *Verificación*.

## Verificación
```
node --test pruebas/comprobaciones/contrato-constructor.test.mjs
```
Esperado: `fail 0`, incluida «rechaza regla 15…».
```
node --test pruebas/capa1/registrar.test.mjs
```
Esperado: `pass 9`, `fail 0`.
```
bash pruebas/rapida.sh
```
Esperado: termina con `rapida: ... (tope 30 s)` y código 0.

## Evidencia

Salida real de la *Verificación* (repo `Flucastr.AI`, rama `feature/F10-registro-de-eventos`):

```
$ node --test pruebas/comprobaciones/contrato-constructor.test.mjs
ℹ tests 18
ℹ pass 18
ℹ fail 0
```
Incluye «✔ rechaza regla 15: falta la plantilla «Registro: n=<n>; herramienta=…» o «una línea por ejecución» en la skill».

```
$ node --test pruebas/capa1/registrar.test.mjs
ℹ tests 9
ℹ pass 9
ℹ fail 0
```

```
$ bash pruebas/rapida.sh   (últimas líneas; código de salida 0)
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 23855.526333
rapida: 19 archivos en 23 s (tope 30 s)
```

Conteo de la línea de la skill (criterio 1, paso 1):

```
$ grep -c "una línea por ejecución" skills/ejecutar-tarea/SKILL.md
1
```

Chequeo adicional, fuera de la *Verificación* y sin tocar el repo real (dos repos git temporales en el directorio temporal del sistema):

```
ultima versión, v1 con línea inválida (solo v1): invalidas = 1 (esperado 1)
v1 mala, v2 buena: invalidas = 0 (esperado 0); ejecuciones = [ 1 ]
sin FLUCASTR_MODELOS ni modelos.json en la raíz ni en el home: sin-configurar
```

Criterios de aceptación:
1. La skill tiene la plantilla, «una línea por ejecución» y los significados; la regla 15 y su variante pasan (18/18).
2. Dos líneas válidas dan dos `ejecucion` con `modelo=modelo-prueba-bajo` del `modelos.json` temporal; `resultado=otro` se descarta y se cuenta (prueba 7).
3. Una línea fuera de *Notas* no genera evento; repetir no duplica; `--reconstruir` reproduce el mismo contenido (pruebas 7 y 8).
4. Canarios de *Notas* y la clave `titulo=` no aparecen en `eventos.jsonl` (prueba 9).
5. `bash pruebas/rapida.sh` termina con código 0 en 23 s (tope 30 s).

Archivos tocados (los cinco de *A tocar*): `skills/ejecutar-tarea/SKILL.md`, `pruebas/comprobaciones/contrato-constructor.mjs`, `pruebas/comprobaciones/contrato-constructor.test.mjs`, `scripts/registrar.mjs`, `pruebas/capa1/registrar.test.mjs`. No se escribió `definitions/STATUS.md` (ya venía modificado antes de empezar) ni hubo commit, push, merge ni escritura sobre `registro/` del repo real.

## Notas

- Huecos menores resueltos:
  - `modelo`: la búsqueda de `modelos.json` sigue el orden de `REGISTRO.md` §3 (FLUCASTR_MODELOS, raíz, `~/.flucastr-ai/`). El home solo se comprobó por existencia en el chequeo; no se leyó.
  - Valores de la línea: el patrón de `Registro:` usa las listas cerradas (sin `confirmar`), y `validarEvento` valida también rangos (`n` 1–99; `intentos`/`huecos` 0–99) y el patrón de `modelo`. Un valor fuera de lista no pasa el patrón y cuenta como línea no válida.
  - `ejecucion` se deduplica por `n` dentro de cada tarea: gana el primer commit donde aparece una línea válida con ese `n`. El `id` es el de `REGISTRO.md` (con el `sha` de ese commit).
  - `tarea_estado` y `ejecucion` comparten el commit inicial; por eso la prueba 7 cuenta 3 eventos (1 `tarea_estado` y 2 `ejecucion`).
  - El orden de `eventos.jsonl` sale de `t` e `id` (hash), así que la prueba 7 ordena por `n` antes de comparar.
- Cambio en pruebas existentes: la prueba 2 espera ahora el sufijo `; 0 líneas Registro: no válidas` en el resumen, por el formato nuevo de la línea de resumen.
- Decisión sobre la prueba 4 (aislamiento, sin cambiar su criterio): la prueba busca el literal `.env` en el código fuente del script. Por eso `scripts/registrar.mjs` no contiene `process.env` ni `...env` (usa `const { env } = process` y `Object.assign`). El comentario de la función también evita la cadena.
- Variante de la regla 7: la variante borra solo la primera aparición de una frase. Al escribir la subsección nueva repetí «`estado: bloqueada`» y la regla 7 quedó sin error; reformulé el significado de `resultado=bloqueada` para no repetirla. Conviene no repetir frases de regla en el texto nuevo.
- Decisión de Franco respetada: `resultado=confirmar` no existe en el enum; no se agregó permiso de `date` ni cambió ninguna lista de permisos.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=1; verificacion=pasa; huecos=5; resultado=lista; causa=ninguna
