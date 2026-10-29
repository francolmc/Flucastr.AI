# task-03 — Comprobación del contrato de roles (agentes, skills y modelos)
repo: Flucastr.AI   depende_de: task-01, task-02   estado: hecha

## Descripción
Los agentes, las skills y `modelos.json` se referencian entre sí (nombres, herramientas del coordinador, formato de `BLOQUEO:`), pero nada lo comprueba: renombrar un agente o quitar una fila de la tabla del coordinador pasaría sin aviso. Esta tarea añade un validador determinista del contrato de roles y una prueba que lo aplica a los archivos reales, incluidos los cambios de task-01 y task-02. Entra sola en `pruebas/rapida.sh` por su glob.

## Contexto
- Repo: este, único repo. Node 25, ESM, `node:test` y `node:assert/strict`, sin dependencias, como `pruebas/comprobaciones/formato-tarea.mjs` y `formato-flujo.mjs` (validadores que devuelven un arreglo de mensajes en español; vacío = válido). Pruebas con nombres en español; raíz resuelta con `fileURLToPath(new URL('../../', import.meta.url))` (como `formato-flujo.test.mjs`).
- Archivos leídos: `agentes/{arquitecto,constructor,coordinador,planificador}.md` (front matter `---` con `name`, `description` y, solo en el coordinador, `tools: Agent(arquitecto, planificador, constructor), Read, Grep, Glob, Write, Edit, Skill`); `skills/*/SKILL.md` (7, con `name` igual a su carpeta); `modelos.json` (clave `agentes` con una entrada por agente).
- Menciones de skills en agentes (leídas): cada una de las 7 skills aparece entre comillas invertidas en al menos un `agentes/*.md`.
- Línea de bloqueo (leída): `planificador.md` y `skills/ejecutar-tarea/SKILL.md` contienen `BLOQUEO: rol=<rol requerido>; motivo=<motivo>`; `coordinador.md`, `BLOQUEO: rol=<rol>; motivo=<motivo>`.
- Archivos a crear: `pruebas/comprobaciones/contrato-roles.mjs` y `pruebas/comprobaciones/contrato-roles.test.mjs`. No usar el nombre `contrato.test.mjs`, que `rapida.sh` excluye.

## Decisiones ya tomadas
- `contrato-roles.mjs` exporta `validarRoles({ agentes, skills, modelos })` y devuelve un arreglo de errores en español; no lanza. Entradas: `agentes` y `skills` son objetos `{ <nombre-de-archivo-sin-extension>: <texto> }` (para skills, la clave es el nombre de la carpeta); `modelos` es el objeto de `modelos.json` ya parseado.
- Reglas, cada una con mensaje propio:
  1. Cada agente y cada skill tiene front matter con `name` igual a la clave y `description` no vacía.
  2. Las claves de `modelos.agentes` son exactamente los nombres de los agentes.
  3. La línea `tools:` del `coordinador` contiene `Agent(` con exactamente los demás agentes (cualquier orden); ningún otro agente tiene `Agent` en su `tools:`.
  4. Cada skill aparece entre comillas invertidas (`` `nombre` ``) en al menos un agente.
  5. El texto de `planificador` y el de la skill `ejecutar-tarea` cumplen `/BLOQUEO: rol=<[^>]+>; motivo=<[^>]+>/`, y el del `coordinador` también.
  6. `planificador` y `constructor` contienen la frase «escribes en `STATUS.md`» (hoy aparece en «No llamas a otros agentes ni escribes en `STATUS.md`»).
  7. Las líneas de la tabla del `coordinador` (las que empiezan por `|`) mencionan los seis estados de tarea: `borrador`, `aprobada`, `en curso`, `lista para revisión`, `hecha`, `bloqueada` (cubre task-02).
  8. El texto de la skill `descomponer-feature` contiene «solo puedes mover la marca» y no contiene «No cambies `BACKLOG.md`» (cubre task-01).
- La prueba hace tres cosas: (a) una muestra válida mínima en el propio archivo da `[]`; (b) una variante por regla (ocho) con la violación aplicada sobre la muestra, cada una devuelve al menos un error; (c) lee los archivos reales (`agentes/*.md`, `skills/*/SKILL.md`, `modelos.json`) y exige `[]`, y exige que haya al menos 4 agentes y 7 skills.
- Front matter: se extrae con `/^---\n([\s\S]*?)\n---/` y se lee línea a línea `clave: valor` (quitando comillas dobles externas); no se usa librería YAML.

## Alcance / Fuera de alcance
Alcance: los dos archivos nuevos y su ejecución dentro de la verificación rápida.
Fuera de alcance: modificar agentes, skills, `modelos.json`, `rapida.sh`, `instalar.sh` o `contrato.test.mjs`; validar el contenido semántico de las instrucciones; ejecutar modelos; hacer commit.

## Pasos
1. Crear `pruebas/comprobaciones/contrato-roles.mjs` con `validarRoles` y las ocho reglas.
2. Crear `pruebas/comprobaciones/contrato-roles.test.mjs` con la muestra válida y las ocho variantes negativas.
3. En el mismo archivo de prueba, añadir la prueba sobre los archivos reales.
4. Correr solo el archivo nuevo y confirmar que pasa.
5. Correr `bash pruebas/rapida.sh` y confirmar que sigue en 0, bajo 30 s y con un archivo más que antes.

## Criterios de aceptación
1. `validarRoles` acepta la muestra y rechaza cada una de las ocho variantes. Se comprueba con la primera orden de *Verificación*.
2. Los archivos reales cumplen las ocho reglas. Se comprueba con la primera orden.
3. Una alteración en memoria del `coordinador` real (quitar la fila de `bloqueada`) se rechaza. Se comprueba con la segunda orden.
4. `bash pruebas/rapida.sh` sale con 0, bajo 30 s, e incluye el archivo nuevo. Se comprueba con la tercera orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --input-type=module -e 'import fs from "node:fs"; import {validarRoles} from "./pruebas/comprobaciones/contrato-roles.mjs"; const L=d=>Object.fromEntries(fs.readdirSync(d).filter(f=>f.endsWith(".md")).map(f=>[f.slice(0,-3),fs.readFileSync(d+"/"+f,"utf8")])); const S=Object.fromEntries(fs.readdirSync("skills").map(n=>[n,fs.readFileSync("skills/"+n+"/SKILL.md","utf8")])); const A=L("agentes"); A.coordinador=A.coordinador.split("\n").filter(l=>!(l.startsWith("|")&&l.includes("bloqueada"))).join("\n"); console.log(validarRoles({agentes:A,skills:S,modelos:JSON.parse(fs.readFileSync("modelos.json","utf8"))}).length>0?"RECHAZADO":"ACEPTADO")'
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
```
Salida esperada: `ℹ fail 0` con `ℹ pass` igual a `ℹ tests` (al menos 10); `RECHAZADO`; y `ℹ fail 0` seguido de `rapida: K archivos en N s (tope 30 s)` con N ≤ 30, donde K es una unidad mayor que el valor previo a la tarea (hoy son 9 archivos).

## Evidencia

Línea base antes de crear archivos (`bash pruebas/rapida.sh`):
```
ℹ tests 71
ℹ pass 71
ℹ fail 0
rapida: 10 archivos en 14 s (tope 30 s)
```

Orden 1 de *Verificación* (`node --test pruebas/comprobaciones/contrato-roles.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"`):
```
ℹ tests 10
ℹ pass 10
ℹ fail 0
```
Las diez pruebas (`node --test` sin filtrar) pasan: `muestra válida mínima no tiene errores`, `rechaza regla 1` a `rechaza regla 8` (ocho variantes), y `los archivos reales de agentes, skills y modelos.json cumplen el contrato`.

Validador sobre los archivos reales (`validarRoles` con `agentes/*.md`, `skills/*/SKILL.md` y `modelos.json`): `[]`.

Orden 2 de *Verificación* (coordinador real con la fila `bloqueada` quitada en memoria):
```
RECHAZADO
```
Detalle devuelto por `validarRoles`: `La tabla del coordinador no menciona el estado de tarea «bloqueada».`

Orden 3 de *Verificación* (`bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"`):
```
ℹ fail 0
rapida: 11 archivos en 14 s (tope 30 s)
```
Código de salida de `bash pruebas/rapida.sh`: `0`. Pasó de 10 a 11 archivos (incluye `contrato-roles.test.mjs`).

Criterios de aceptación:
1. Muestra aceptada y ocho variantes rechazadas: cumplido (primera orden, `ℹ pass 10` de `ℹ tests 10`).
2. Archivos reales cumplen las ocho reglas: cumplido (`[]`).
3. Coordinador real sin la fila `bloqueada` se rechaza: cumplido (`RECHAZADO`).
4. Verificación rápida sale con 0, en 14 s (bajo 30 s), con el archivo nuevo: cumplido (`rapida: 11 archivos`).

Archivos tocados: `pruebas/comprobaciones/contrato-roles.mjs` (nuevo), `pruebas/comprobaciones/contrato-roles.test.mjs` (nuevo), y esta tarea (*Evidencia*, *Notas*, `estado`). No se tocaron agentes, skills, `modelos.json`, `rapida.sh`, `instalar.sh`, `contrato.test.mjs`, `definitions/STATUS.md` ni ningún commit.

## Notas

Huecos menores y decisión tomada:
- La tarea dice «hoy son 9 archivos» en la verificación rápida, pero la línea base real fue **10** archivos (sin contar `contrato.test.mjs`, que `rapida.sh` excluye). Tras añadir el archivo nuevo son **11**, que es una unidad mayor que la base, como pide el criterio. Se usó el conteo real.
- Regla 7: se exige el estado entre comillas invertidas (`` `bloqueada` ``), porque así aparece en la tabla real y evita coincidencias accidentales en el texto de la fila. Mismo criterio para las demás menciones de estado.
- Regla 4: la mención de skill también exige comillas invertidas, igual que en los archivos reales.
- Front matter: se lee línea a línea `clave: valor`, quitando comillas dobles externas solo si están en ambos extremos. Sin librería YAML, como indica la tarea.
- Regla 5: la línea de bloqueo se busca en el texto completo del archivo (planificador, coordinador) y de la skill `ejecutar-tarea`.
- La muestra válida mínima tiene 4 agentes y 3 skills (las que sus reglas exigen). La cobertura de «al menos 7 skills» se comprueba solo sobre los archivos reales, como pide la tarea.

No hubo bloqueos ni escalaciones. No se usó `contrato.test.mjs` como nombre de archivo.
