# task-07 — README: árbol de Estructura al día
repo: Flucastr.AI   depende_de: task-06   estado: hecha

## Descripción
El bloque de `## Estructura` omite `LICENSE`, `initialize.sh`, `registro/`, `validar-tarea.mjs`, `entorno.mjs` y los módulos de apoyo de `scripts/`, y describe `pruebas/` de forma vaga. Se actualiza el bloque conservando el encabezado, el bloque de código y la lista de agentes y skills que comprueba la prueba `readme-estructura`.

## Contexto
- Leer: `README.md@66-41`, `pruebas/comprobaciones/readme-estructura.mjs@1-40`
- Tocar: `README.md`
- El rango 66-106 va de `## Estructura` hasta la línea previa a `## Instalación` (la línea 106 es la frase que cita `readme-estructura.mjs`).
- Confirmado por lectura: la prueba exige el encabezado exacto `## Estructura`, el primer bloque de código tras él y que los hijos de `agentes/` y `skills/` (líneas con prefijo «│   » + «├── » o «└── ») coincidan con las carpetas reales; no mide el resto de líneas. Las 12 skills y los 4 agentes actuales ya están en el bloque y no cambian.
- Confirmado por lectura: en `scripts/` hay siete comandos (`resolver`, `archivar`, `consumo`, `informe`, `registrar`, `validar-tarea`, `entorno`), y los módulos `formato-*.mjs`, `firma.mjs`, `pistas.mjs`, `contexto-fuentes.mjs`, `crecimiento-definiciones.mjs`. `registro/eventos.jsonl` está ignorado por git.
- Fuente: ninguna
- Requiere: runtime:node@25.8.1

## Decisiones ya tomadas
- No se tocan las líneas de `agentes/` ni de `skills/` (ni sus comentarios).
- Se agregan al bloque: `LICENSE` (licencia MIT) tras `AGENTS.md`; `initialize.sh` (clona el proyecto completo a partir de `definitions/REPOS.md`) junto a los instaladores; `registro/` (eventos del flujo, ignorados por git; `registrar.mjs` los genera).
- En `scripts/` se agregan `validar-tarea.mjs` (valida el formato de una tarea y su Fuente; también corre como hook en Claude Code) y `entorno.mjs` (comprueba la línea Requiere: de una tarea), y una última línea `formato-*.mjs, firma.mjs, pistas.mjs, contexto-fuentes.mjs, crecimiento-definiciones.mjs` con el comentario «módulos de apoyo de los comandos anteriores».
- `pruebas/` pasa a: «pruebas del kit: rápidas (rapida.sh), comprobaciones, capa1 y arnés de pruebas por rol (ver pruebas/README.md)».
- Los comentarios que dicen «lo corre Franco» pasan a «lo corre quien usa el kit». La frase de la línea 106 no cambia.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: el bloque de código de `## Estructura` y su frase final.
Fuera de alcance: agentes y skills, la prueba `readme-estructura`, otras secciones.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. En el bloque de `## Estructura` de `README.md`, aplica los agregados y cambios de comentario de *Decisiones ya tomadas*.
3. Corre `node --test pruebas/comprobaciones/readme-estructura.test.mjs`.

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. El bloque lista `LICENSE`, `initialize.sh`, `registro/`, `validar-tarea.mjs` y `entorno.mjs` (comando 2).
3. No queda «Franco» en los comentarios del bloque (comando 3).
4. La prueba `readme-estructura` pasa (comando 4).

## Verificación
```
git branch --show-current
awk '/^## Estructura/,/^## Requisitos|^## Instalación/' README.md | grep -c 'LICENSE\|initialize.sh\|registro/\|validar-tarea.mjs\|entorno.mjs'
awk '/^## Estructura/,/^## Requisitos|^## Instalación/' README.md | grep -c 'Franco'
node --test pruebas/comprobaciones/readme-estructura.test.mjs
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; un número mayor o igual que 5; `0`; las pruebas pasan con 0 fallos.

## Evidencia

```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0

$ awk '/^## Estructura/,/^## Requisitos|^## Instalación/' README.md | grep -c 'LICENSE\|initialize.sh\|registro/\|validar-tarea.mjs\|entorno.mjs'
7
exit 0

$ awk '/^## Estructura/,/^## Requisitos|^## Instalación/' README.md | grep -c 'Franco'
0
exit 1

$ node --test pruebas/comprobaciones/readme-estructura.test.mjs
✔ repo real: README, agentes/ y skills/ coinciden (0.333625ms)
ℹ tests 7
ℹ pass 7
ℹ fail 0
ℹ skipped 0
exit 0
```

Nota sobre la evidencia: `grep -c 'Franco'` imprime 0 y sale con 1 porque grep no encontró coincidencias; el criterio espera `0`, que se cumple. La salida de `node --test` se capturó con `tail`, por lo que el código 0 se verificó en una pasada anterior del mismo comando sin pipe.

## Notas
- Desajuste de Leer: la línea decía `README.md@66-41` (rango invertido). Se leyó 66-107 según la propia descripción de la tarea (`## Estructura` hasta la línea 106). El encabezado `## Requisitos` está en la línea 108; no hubo desplazamiento respecto al aviso.
- Hueco menor 1: posición de los agregados no especificada. `LICENSE` tras `AGENTS.md` (según la tarea), `registro/` tras `features/`, `initialize.sh` justo antes de `instalar.sh`.
- Hueco menor 2: en `scripts/`, `archivar.mjs` decía «lo corre Franco o el coordinador»; se cambió a «lo corre quien usa el kit o el coordinador» para cumplir el criterio 3 (no queda «Franco» en el bloque).
- `pruebas/rapida.sh` y `pruebas/capa1/` existen, así que la descripción nueva de `pruebas/` es exacta.
- No se tocaron las líneas de `agentes/` ni de `skills/`, ni la frase de la línea 106.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
