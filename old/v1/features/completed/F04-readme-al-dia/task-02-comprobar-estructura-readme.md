# task-02 — Comprobación de que el árbol del README coincide con agentes/ y skills/
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
El README ya se desfasó una vez: listaba un agente cuando había cuatro. Esta tarea añade un validador determinista que compara el árbol de `## Estructura` del README con los archivos reales de `agentes/` y las carpetas de `skills/`, y una prueba que lo aplica al repo real. Entra sola en `pruebas/rapida.sh` por su glob. Evita que la próxima feature vuelva a dejar el README atrás sin que nadie lo note.

## Contexto
- Repo: este, único repo. Node 25, ESM, `node:test`, sin dependencias; mismo estilo que `pruebas/comprobaciones/coherencia-features.mjs` y su prueba (validador que no lee el disco y devuelve un arreglo de errores en español, vacío = válido; raíz en la prueba con `fileURLToPath(new URL('../../', import.meta.url))`). Ambos archivos fueron leídos.
- Estructura real leída: `agentes/{arquitecto,constructor,coordinador,planificador}.md` y `skills/{crear-backlog,definir-proyecto,descomponer-feature,disenar-arquitectura,ejecutar-tarea,generar-clonar,revisar-proyecto-existente}/`.
- Formato del árbol del README tras task-01: bloque de código bajo `## Estructura`; los hijos de `agentes/` y `skills/` van en líneas `│   ├── nombre` / `│   └── nombre` (con comentario opcional separado por espacios); los de `agentes/` terminan en `.md` y los de `skills/` en `/`. Las líneas de nivel superior empiezan por `├── ` o `└── `.
- Archivos a crear: `pruebas/comprobaciones/readme-estructura.mjs` y `pruebas/comprobaciones/readme-estructura.test.mjs`. No se toca `pruebas/rapida.sh`: su glob `pruebas/comprobaciones/*.test.mjs` ya incluye el archivo nuevo (leído).
- Antes de esta tarea la verificación rápida corre 15 archivos y 108 pruebas, 15 s, código 0 (ejecutado).

## Decisiones ya tomadas
- `readme-estructura.mjs` exporta `validarReadme({ readme, agentes, skills })` y no lanza. `readme` es el texto de `README.md`; `agentes` un arreglo de nombres de archivo (`['arquitecto.md', …]`); `skills` un arreglo de nombres de carpeta (`['crear-backlog', …]`). El módulo no lee el disco; solo la prueba lo hace.
- Cómo localiza el árbol: primer bloque delimitado por tres acentos graves que aparece después de la línea `## Estructura`. Si no hay sección o bloque: error «El README no tiene el bloque de código de «## Estructura».» y no se evalúan las demás reglas.
- Hijos de una carpeta: las líneas consecutivas que siguen a la línea que empieza por `├── agentes/` (o `├── skills/`) y que cumplen `/^│   [├└]── (\S+)/`; el nombre es el primer grupo. Termina en la primera línea que no empieza por `│   `.
- Reglas, cada una con mensaje propio: (1) bloque presente; (2) cada archivo de `agentes` figura como hijo de `agentes/`; (3) cada carpeta de `skills` figura como hijo de `skills/` (con `/` final); (4) ningún hijo del árbol de `agentes/` o `skills/` falta en disco («sobra»). Los mensajes incluyen el nombre afectado.
- La prueba hace tres cosas: (a) muestra válida (README mínimo de dos agentes y dos skills) da `[]`; (b) variantes negativas: agente que falta, skill que falta, agente que sobra, skill que sobra y README sin sección `## Estructura`, cada una con al menos un error que menciona el nombre; (c) lee `README.md`, `agentes/*.md` y `skills/*/` reales y exige `[]` (con al menos 4 agentes y 7 skills).
- Los nombres de la lista `agentes` se toman de `fs.readdirSync('agentes')` filtrando `.md`; los de `skills`, de `fs.readdirSync('skills', { withFileTypes: true })` filtrando directorios.

## Alcance / Fuera de alcance
Alcance: los dos archivos nuevos y su ejecución dentro de la verificación rápida.
Fuera de alcance: modificar `README.md` (lo hace task-01), `pruebas/rapida.sh`, `pruebas/README.md`, otros validadores, `instalar.sh`, `definitions/`; comprobar el resto del README (reglas, comandos, bitácora); hacer commit.

## Pasos
1. Crear `pruebas/comprobaciones/readme-estructura.mjs` con `validarReadme` y las cuatro reglas.
2. Crear `pruebas/comprobaciones/readme-estructura.test.mjs` con la muestra válida y las cinco variantes negativas.
3. En el mismo archivo de prueba, añadir la prueba sobre el repo real (README, `agentes/`, `skills/`).
4. Correr solo el archivo de prueba nuevo y confirmar que pasa.
5. Comprobar que el control negativo funciona sobre el README real (segunda orden de *Verificación*).
6. Correr `bash pruebas/rapida.sh` y confirmar código 0, tope de tiempo y un archivo más que antes.

## Criterios de aceptación
1. `validarReadme` acepta la muestra y rechaza las cinco variantes. Se comprueba con la primera orden de *Verificación*.
2. El README real pasa la validación (4 agentes, 7 skills). Se comprueba con la primera orden.
3. Quitar `coordinador.md` del texto del README real en memoria se rechaza. Se comprueba con la segunda orden (`RECHAZADO`).
4. `bash pruebas/rapida.sh` sale con 0, en 30 s o menos, con 16 archivos. Se comprueba con la tercera orden.
5. Solo se crearon los dos archivos nuevos: sin otros cambios versionados nuevos. Se comprueba con la cuarta orden.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node --input-type=module -e 'import fs from "node:fs"; import {validarReadme} from "./pruebas/comprobaciones/readme-estructura.mjs"; const r=fs.readFileSync("README.md","utf8").replace("coordinador.md","x"); const a=fs.readdirSync("agentes").filter(n=>n.endsWith(".md")); const s=fs.readdirSync("skills",{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name); console.log(validarReadme({readme:r,agentes:a,skills:s}).length>0?"RECHAZADO":"ACEPTADO")'
bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"
git status --short pruebas
```
Salida esperada: primera, `ℹ tests 7`, `ℹ pass 7`, `ℹ fail 0` (muestra válida + 5 negativas + repo real); segunda, `RECHAZADO`; tercera, `ℹ fail 0` y `rapida: 16 archivos en S s (tope 30 s)` con S ≤ 30; cuarta, entre las líneas `??` ya existentes de tareas anteriores, las dos nuevas `?? pruebas/comprobaciones/readme-estructura.mjs` y `?? pruebas/comprobaciones/readme-estructura.test.mjs`.

## Evidencia

Paso 4 (`node --test pruebas/comprobaciones/readme-estructura.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"`), salida real:

```
✔ muestra válida: no hay errores (0.882209ms)
✔ variante: falta un agente en el README (0.087208ms)
✔ variante: falta una skill en el README (0.292291ms)
✔ variante: sobra un agente en el README (0.060958ms)
✔ variante: sobra una skill en el README (0.055333ms)
✔ variante: README sin sección «## Estructura» (0.045292ms)
✔ repo real: README, agentes/ y skills/ coinciden (0.19525ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Orden 1 de *Verificación* (salida real, la misma prueba):

```
ℹ tests 7
ℹ pass 7
ℹ fail 0
```

Orden 2 de *Verificación* (control negativo: `coordinador.md` reemplazado por `x` en el README real, en memoria):

```
RECHAZADO
```

Errores que produce ese control (salida real con la misma comprobación que muestra los mensajes):

```
El agente «coordinador.md» existe en agentes/ pero no figura en el árbol de «## Estructura» del README.
El README lista el agente «x» en el árbol de agentes/, pero no existe en agentes/.
```

Orden 3 de *Verificación* (`bash pruebas/rapida.sh 2>&1 | grep -E "^(ℹ fail|rapida:)"`, salida real; código de salida del script: 0):

```
ℹ fail 0
rapida: 16 archivos en 18 s (tope 30 s)
```

Total de la verificación rápida tras el cambio (líneas `ℹ tests|pass|fail` de la misma corrida): `ℹ tests 115`, `ℹ pass 115`, `ℹ fail 0`. Antes eran 108 pruebas; las 7 nuevas son las de este archivo.

Orden 4 de *Verificación* (`git status --short pruebas`, salida real):

```
?? pruebas/comprobaciones/readme-estructura.mjs
?? pruebas/comprobaciones/readme-estructura.test.mjs
```

Criterios de aceptación:
1. `validarReadme` acepta la muestra y rechaza las cinco variantes: cumplido (7 pruebas pasan, incluida la muestra y las cinco variantes).
2. El README real pasa la validación (4 agentes, 7 skills): cumplido (prueba «repo real»).
3. Quitar `coordinador.md` en memoria se rechaza: cumplido (`RECHAZADO`).
4. `bash pruebas/rapida.sh` sale con 0, en 30 s o menos, con 16 archivos: cumplido (exit 0, 18 s, 16 archivos).
5. Solo se crearon los dos archivos nuevos: cumplido (`git status --short pruebas` solo muestra esos dos; los demás cambios del repo son previos a esta tarea y no los toqué).

## Notas

### Notas del constructor
- Hueco menor: la tarea nombra solo `├── agentes/` como línea madre del árbol. Acepto también `└── agentes/` (y lo mismo para `skills/`), la opción más conservadora para no rechazar un README con otra rama del árbol.
- Hueco menor: una línea que empieza por `│   ` pero no encaja con `[├└]── nombre` (por ejemplo, un comentario anidado) se ignora y no termina el bloque de hijos. La tarea solo decía que el bloque termina en la primera línea que no empieza por `│   `.
- Hueco menor: la búsqueda del bloque toma el primer bloque de código tras la línea exacta `## Estructura` (se compara sin espacios finales), y ese bloque termina en el siguiente delimitador de tres acentos graves.
- Hueco menor: en `skills/` el README lleva `/` final; el validador quita esa barra antes de comparar con el nombre de la carpeta y la exige en el mensaje de la regla 3, tal como pide la tarea.
- Nota: cuatro huecos menores, ninguno cambia el alcance. No se modificó `README.md`, `pruebas/rapida.sh`, `pruebas/README.md` ni `definitions/`. No hay commit, push, PR ni merge.

### Notas del planificador (por qué esta feature y qué se descartó)
- **Elegida: README al día + comprobación de su estructura.** Cumple lo pedido: un solo repo, 2 tareas pequeñas, útil (corrige la inconsistencia 2 de `PROJECT.md`, dolor ya documentado), no contradice la definición aprobada (no toca `definitions/` ni reglas) y ejercita las puertas de verdad: una tarea de texto revisable por Franco, una de código con `depende_de`, verificación y control negativo. Es el caso «real» más pequeño que prueba la cadena completa sin que un fallo del constructor se confunda con uno de la feature (F03 ya aisló al constructor).
- **Descartada 1: cerrar las decisiones abiertas de F03** (estado de la tarea ante una escalación, cobertura de comandos compuestos en la allowlist, rol del bloqueo en el evaluador). Es útil, pero requiere decisiones de Franco aún no tomadas, toca `skills/ejecutar-tarea` y `agentes/constructor.md` (comportamiento del constructor) y se verifica con corridas con modelo caras; si falla, no se sabría si es la feature o el constructor, justo lo que F03/F04 separan. Candidata para una feature posterior.
- **Descartada 2: corregir el mensaje final de `instalar.sh`** (solo menciona `arquitecto`). Demasiado pequeña (una línea) para ejercitar descomposición, dependencias y verificación; queda anotada como seguimiento y fuera de alcance de task-01.
- Qué observar en F04 (cifras de «acotada» a calibrar): si el constructor en nivel bajo completa task-02 sin huecos mayores, cuántos huecos menores anota y si la verificación textual de task-01 le basta.
