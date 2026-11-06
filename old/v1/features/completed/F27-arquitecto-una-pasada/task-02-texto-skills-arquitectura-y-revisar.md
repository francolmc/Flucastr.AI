# task-02 — Una sola pasada en disenar-arquitectura y revisar-proyecto-existente
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Completa el texto de una sola pasada en las otras dos skills del `arquitecto`, con las mismas frases que task-01, para que ninguna puerta (definición, revisión, arquitectura) admita rondas sucesivas. task-03 comprobará estas frases.

## Contexto
- Tocar: `skills/disenar-arquitectura/SKILL.md`, `skills/revisar-proyecto-existente/SKILL.md`
- `skills/disenar-arquitectura/SKILL.md` (2294 bytes) termina con `## Verificación`; el párrafo nuevo va justo antes de esa sección.
- `skills/revisar-proyecto-existente/SKILL.md` (2697 bytes) tiene `### 5. Escribir la salida` y justo después `## Formato de \`REPOS.md\``; el párrafo nuevo va entre ambos, tras el título del paso 5.
- La frase del paso 4 «Si una respuesta puede cambiar la arquitectura, **espera** antes de seguir.» se conserva: es la única pausa y no cuenta como ronda nueva.
- No tocar `agentes/coordinador.md` ni `definitions/`.

## Decisiones ya tomadas
- Mismo tope que task-01: 12288 bytes por pasada.
- Frases exactas en cada una de las dos skills: `devuelves el documento y nada más`, `Decisiones para Franco`, `Tope de tamaño: 12288 bytes`.
- El párrafo se llama `**Una sola pasada:**` y es idéntico en las dos skills.

## Decisiones abiertas
Ninguna

## Alcance / Fuera de alcance
Alcance: un párrafo en cada una de las dos skills.
Fuera de alcance: `arquitecto.md` y `definir-proyecto` (task-01), el control en pruebas (task-03), el script de tamaño (task-04) y `definitions/`.

## Pasos
1. En `skills/disenar-arquitectura/SKILL.md`, antes de `## Verificación`, añade: `**Una sola pasada:** devuelves el documento y nada más; no reabres preguntas. Tope de tamaño: 12288 bytes por pasada en definitions/. Lo que quede abierto va en una sección «Decisiones para Franco» con 2 o 3 opciones cerradas y una recomendada.`
2. En `skills/revisar-proyecto-existente/SKILL.md`, bajo `### 5. Escribir la salida`, añade el mismo párrafo, letra por letra.
3. Comprueba que los títulos `##` y `###` previos de ambos archivos siguen en su sitio (no se movió ninguna sección).

## Criterios de aceptación
1. Cada una de las dos skills contiene las 3 frases exactas; se comprueba con `grep -c`.
2. `skills/disenar-arquitectura/SKILL.md` conserva `Lee cada entrada una vez`.
3. `bash pruebas/rapida.sh` deja exactamente `ℹ fail 7` (7 fallos ajenos conocidos); no suma fallos nuevos.

## Verificación
```
grep -c -e 'devuelves el documento y nada más' -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' skills/disenar-arquitectura/SKILL.md; echo "exit $?"
grep -c -e 'devuelves el documento y nada más' -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' skills/revisar-proyecto-existente/SKILL.md; echo "exit $?"
grep -c 'Lee cada entrada una vez' skills/disenar-arquitectura/SKILL.md; echo "exit $?"
bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
```
Esperado: `exit 0` en los cuatro comandos y `ℹ fail 7`.

## Evidencia

```
$ grep -c -e 'devuelves el documento y nada más' -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' skills/disenar-arquitectura/SKILL.md; echo "exit $?"
1
exit 0
```

```
$ grep -c -e 'devuelves el documento y nada más' -e 'Decisiones para Franco' -e 'Tope de tamaño: 12288 bytes' skills/revisar-proyecto-existente/SKILL.md; echo "exit $?"
1
exit 0
```

```
$ grep -c 'Lee cada entrada una vez' skills/disenar-arquitectura/SKILL.md; echo "exit $?"
1
exit 0
```

```
$ bash pruebas/rapida.sh 2>&1 | grep -E '^ℹ fail'; echo "exit $?"
ℹ fail 7
exit 0
```

## Notas
- Huecos: 0. Los cuatro comandos se corrieron con `cd /Users/franco/Codes/flucastr/Flucastr.AI && ` delante, porque el cwd no persiste entre llamadas; el texto del comando es el de *Verificación*.
- Títulos `##` y `###` previos de ambos archivos comprobados con `grep -n`: todos presentes, ninguna sección movida.
- Modo yolo: no se creó ni cambió de rama; sin commit, push ni merge.
- Autocomprobación `node scripts/validar-tarea.mjs --evidencia` (antes de la línea `Registro`): exit 1, rechazó «La última línea no vacía de Notas debe ser Registro».
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=1; verificacion=pasa; huecos=0; resultado=lista; causa=ninguna
