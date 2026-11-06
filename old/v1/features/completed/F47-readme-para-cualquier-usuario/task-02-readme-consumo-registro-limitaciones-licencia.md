# task-02 — README: consumo, registro, limitaciones y licencia
repo: Flucastr.AI   depende_de: task-01   estado: hecha

## Descripción
Las secciones finales del README (`## Medición de consumo`, `## Registro de eventos`, `## Archivo y rescate`, `## Bitácora`) están en primera persona y cuentan historia de Franco. Se reescriben para cualquier lector, se eliminan «Archivo y rescate» y «Bitácora» y se agregan `## Limitaciones` y `## Contribuir y licencia` (enlaza `LICENSE`). Las tareas del README van de abajo hacia arriba para que los rangos de `Leer` no se desplacen.

## Contexto
- Leer: `README.md@261-28`
- Tocar: `README.md`
- Hoy el rango 261-288 va de `## Medición de consumo` hasta el final de `## Bitácora`.
- Los scripts `consumo.mjs`, `informe.mjs` y `registrar.mjs` existen en `scripts/`; sus comandos ya están escritos en esas secciones y no se cambian, solo el sujeto («Lo corro yo» pasa a «Se corre desde la raíz del proyecto»).
- Supuesto (Franco lo revisa): la política de contribución es mínima; ver Decisiones ya tomadas.
- Fuente: ninguna
- Requiere: runtime:node@25.8.1

## Decisiones ya tomadas
- Estilo de todo el README: instrucciones en segunda persona (tuteo: «corre», «abre»), descripciones en tercera persona; sin «mi», «mis», «yo», «tengo». A Franco se lo nombra como autor solo en «Contribuir y licencia».
- Se eliminan `## Archivo y rescate` y `## Bitácora` (la historia vive en git y `definitions/BACKLOG.md`).
- `## Limitaciones` (después de `## Registro de eventos`) lista exactamente: (1) solo Claude Code y Pi; Codex sin compactación verificada; (2) probado en macOS con Node v25.8.1, sin versión mínima declarada ni prueba en Windows; (3) las corridas con modelo real gastan créditos y no forman parte de `pruebas/rapida.sh`; (4) los agentes no hacen commit, push, PR, merge ni despliegue; (5) si Pi lee las skills de `.pi/skills/` desde un workspace remoto está pendiente de comprobar.
- `## Contribuir y licencia` (última sección) dice: proyecto personal de Franco Morales (`francolmc`); las propuestas van como issue en `https://github.com/francolmc/Flucastr.AI/issues`; antes de proponer un cambio corre `bash pruebas/rapida.sh`; licencia MIT, enlace `[LICENSE](LICENSE)`.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: las secciones desde `## Medición de consumo` hasta el final de `README.md`.
Fuera de alcance: cualquier sección anterior a `## Medición de consumo`, scripts, pruebas, `definitions/`, `LICENSE`.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. En `README.md`, reescribe `## Medición de consumo` y `## Registro de eventos` sin primera persona, sin cambiar comandos ni opciones.
3. Borra `## Archivo y rescate` y `## Bitácora`.
4. Agrega `## Limitaciones` y `## Contribuir y licencia` con el contenido de *Decisiones ya tomadas*; el archivo termina en `## Contribuir y licencia`.

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. Las secciones desde `## Medición de consumo` no contienen primera persona (comando 2).
3. `README.md` ya no tiene `## Bitácora` ni `## Archivo y rescate`, y sí `## Limitaciones` y `## Contribuir y licencia` (comando 3).
4. La prueba del árbol de `## Estructura` sigue pasando (comando 4).

## Verificación
```
git branch --show-current
awk '/^## Medición de consumo/,0' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía'; echo "grep:$?"
grep -c '^## Bitácora\|^## Archivo y rescate' README.md; grep -c '^## Limitaciones\|^## Contribuir y licencia' README.md
node --test pruebas/comprobaciones/readme-estructura.test.mjs
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; solo `grep:1`; `0` y luego `2`; las pruebas pasan con 0 fallos.

## Evidencia

```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0
```

```
$ awk '/^## Medición de consumo/,0' README.md | grep -nEiw 'mi|mis|yo|tengo|mío|mía'; echo "grep:$?"
grep:1
exit 0
```

```
$ grep -c '^## Bitácora\|^## Archivo y rescate' README.md; grep -c '^## Limitaciones\|^## Contribuir y licencia' README.md
0
2
exit 0
```

```
$ node --test pruebas/comprobaciones/readme-estructura.test.mjs
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
exit 0
```

## Notas

- Huecos menores resueltos: (1) el enlace a issues se escribió como URL entre `<>` para que se vea completo; (2) la frase de licencia quedó «Licencia MIT. El texto completo está en [LICENSE](LICENSE).», con el enlace que pide la tarea.
- La *Verificación* se corrió dos veces completas (la segunda para registrar la salida con su código de salida); ambas pasan.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
