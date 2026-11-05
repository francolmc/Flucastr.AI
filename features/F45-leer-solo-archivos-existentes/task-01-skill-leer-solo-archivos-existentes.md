# task-01 — La skill pide en Leer solo archivos que existen
repo: Flucastr.AI   depende_de: —   estado: hecha

## Descripción
En la corrida claude-code-6 de F44 el planificador puso `src/cli.js` en `Leer`, pero ese archivo no existía en la carpeta de la prueba (la tarea lo creaba) y el validador rechazó la tarea. Esta tarea añade a la plantilla de `skills/descomponer-feature/SKILL.md` la regla «en Leer solo archivos que existen; lo que la tarea crea va en Tocar». La skill pesa 6372 de 6400 bytes, así que se recortan tres frases equivalentes para que quepa.

## Contexto
- Leer: `skills/descomponer-feature/SKILL.md@18-18`, `skills/descomponer-feature/SKILL.md@31-31`, `skills/descomponer-feature/SKILL.md@66-66`
- Tocar: `skills/descomponer-feature/SKILL.md`
- Medido en ensayo (copia temporal, revertida): con las tres sustituciones de *Pasos* la skill queda en 6378 bytes y `node --test pruebas/comprobaciones/*.test.mjs` termina con `fail 0`. Una sustitución más corta de la línea 46 rompe `contrato-roles.test.mjs`, que exige la frase `cita en *Contexto* las líneas o firmas exactas que el ejecutor necesita` tal cual; no se toca la línea 46.
- `pruebas/comprobaciones/topes-bytes.test.mjs` limita la skill a 6400 bytes.
- Fuente: definitions/WORKFLOW.md «6. La tarea: completa y acotada»
- Requiere: runtime:node@25

## Decisiones ya tomadas
- Sustituciones exactas, en este orden, sobre `skills/descomponer-feature/SKILL.md`:
  1. Línea 18: cambiar «Ejecuta únicamente comandos» por «Ejecuta solo comandos», y «Los que no puedas ejecutar así se marcan «no ejecutado, inferido» en el *Contexto* de la tarea.» por «Los demás se marcan «no ejecutado, inferido» en el *Contexto*.».
  2. Línea 31: cambiar «Una línea `- Leer:` y otra `- Tocar:`, con rutas» por «Una línea `- Leer:` (solo archivos que existen; lo que la tarea crea va en Tocar) y otra `- Tocar:`, con rutas».
  3. Línea 66: cambiar «el repo queda funcionando (nada a medias).» por «el repo queda funcionando.».
- No se cambian topes, roles ni otras frases de la skill.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: tres sustituciones de texto en la skill.
Fuera de alcance: el mensaje del validador (task-02), pruebas nuevas (task-03), la corrida real (task-04), el commit.

## Pasos
1. Corre `git branch --show-current` y confirma la rama de *Verificación*.
2. En `skills/descomponer-feature/SKILL.md`, aplica la sustitución 1 (línea 18).
3. En el mismo archivo, aplica la sustitución 2 (línea 31).
4. En el mismo archivo, aplica la sustitución 3 (línea 66).
5. Corre `wc -c skills/descomponer-feature/SKILL.md` y confirma que no pasa de 6400.

## Criterios de aceptación
1. Rama `fix/F45-leer-solo-archivos-existentes` (comando 1).
2. La skill contiene «solo archivos que existen» y «va en Tocar» (comando 2 imprime `1`: ambas frases están en la misma línea).
3. La skill pesa 6400 bytes o menos (comando 3).
4. Las pruebas de contrato y de topes terminan con `fail 0` (comando 4).

## Verificación
```
git branch --show-current
grep -c "solo archivos que existen\|va en Tocar" skills/descomponer-feature/SKILL.md
wc -c < skills/descomponer-feature/SKILL.md
node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -a "fail "
```
Esperado: rama `fix/F45-leer-solo-archivos-existentes`; el segundo comando imprime `1` (las dos frases están en la misma línea); el tercero, un número menor o igual a 6400 (ensayo: 6378); el cuarto, `ℹ fail 0`.

## Evidencia

```
$ git branch --show-current
fix/F45-leer-solo-archivos-existentes
exit 0

$ grep -c "solo archivos que existen\|va en Tocar" skills/descomponer-feature/SKILL.md
1
exit 0

$ wc -c < skills/descomponer-feature/SKILL.md
6378
exit 0

$ node --test pruebas/comprobaciones/contrato-roles.test.mjs pruebas/comprobaciones/topes-bytes.test.mjs 2>&1 | grep -a "fail "
ℹ fail 0
exit 0
```

## Notas
- Rama creada con `git switch -c` desde `main` (el encargo no traía confirmación de `git switch`; la rama no existía). Sin commit ni push.
- Las tres sustituciones de *Pasos* se aplicaron tal cual estaban en *Decisiones ya tomadas*; ninguna frase ajena tocada.
- Huecos menores: 0.
- La *Verificación* se corrió una pasada completa. El cuarto comando se repitió con la salida a un archivo de scratchpad para capturar el código de salida de `node` (0 en ambos casos).
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
