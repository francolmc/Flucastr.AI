# task-08 — README: portada, reglas y primeros pasos para cualquiera
repo: Flucastr.AI   depende_de: task-07   estado: hecha

## Descripción
La portada del README (título, estado, «La idea», «Para qué existe», «Reglas», «Documentación», «Cómo se usa») está escrita en primera persona para Franco y con estado de 2026-10-30. Se reescribe para quien llega al repo sin contexto: qué es, para quién, reglas del kit y primeros pasos hasta abrir el `coordinador`. Es la última tarea: cierra con una lectura completa y la verificación rápida del repo.

## Contexto
- Leer: `README.md@1-65`
- Tocar: `README.md`
- El rango 1-65 va del logo hasta la línea previa a `## Estructura` (la tabla de roles termina en la línea 62 y la frase «Detalle del flujo…» es la 64).
- Confirmado por lectura: la línea 64 enlaza `[Flujo](#flujo)`, cuyo encabezado pasó a `## Flujo y modo yolo` en task-04; el enlace correcto es `#flujo-y-modo-yolo`.
- Nombres de proyectos personales de Franco en el texto actual: Don Financio y Andes.
- Fuente: ninguna
- Requiere: runtime:node@25.8.1

## Decisiones ya tomadas
- Mismo estilo que task-02 (tuteo en instrucciones / tercera persona en descripciones; sin «mi», «mis», «yo», «tengo»).
- Subtítulo: «Un kit de agentes de IA para construir productos con aprobación humana en cada paso, sobre Claude Code y Pi.» Estado: «en uso (2026-11-05). El kit completo (arquitecto, coordinador, planificador y constructor, con instalador local y remoto) está hecho; el avance real está en `definitions/BACKLOG.md`.»
- `## La idea`: conserva el contenido en tercera persona («quien usa el kit abre un solo agente, el `coordinador`…», «cuatro puertas donde la persona aprueba», «los agentes no hacen commit, push, PR ni despliegue: eso lo hace quien usa el kit»).
- `## Para qué existe`: «Producir funcionalidad real en cualquier proyecto trabajando con agentes de IA, sin hacer de mensajero entre sesiones y sin que armar la herramienta consuma la jornada.» (sin nombres de proyectos).
- `## Reglas` queda en cinco reglas impersonales: Producto primero, Una tarea un archivo, El commit es de la persona, Los secretos no se tocan, Nada nuevo sin dolor real; se elimina «Corte duro». La regla del commit conserva el detalle de `git switch -c` / `git switch` y el modo yolo.
- `## Documentación`: las mismas tres rutas de `definitions/` más `AGENTS.md`; se cambia «Todo es borrador hasta que lo apruebo» por «Todo es borrador hasta que su autor lo aprueba».
- `## Cómo se usa` pasa a `## Primeros pasos`: (1) cumple los requisitos y [instala](#instalación); (2) abre el `coordinador` desde la carpeta de tu proyecto: `claude --agent coordinador` o `pi-coordinador`; (3) el `coordinador` revisa qué falta y delega; te detiene en cuatro puertas donde apruebas; (4) lo que decides queda en `definitions/STATUS.md`; (5) los commits, el PR y el despliegue los haces tú. Se conservan el diagrama mermaid y la tabla de roles; el enlace final apunta a `#flujo-y-modo-yolo`.
- Al final de la tarea se lee el README entero una vez para verificar que no queda primera persona ni enlaces rotos.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: de la primera línea hasta antes de `## Estructura`, y la lectura final del README entero (solo para verificar).
Fuera de alcance: `## Estructura` y posteriores (ya hechas en tareas previas), `definitions/`, `AGENTS.md`, agentes, skills, scripts y pruebas.

## Pasos
1. Corre `git branch --show-current` y comprueba la rama.
2. Reescribe el rango según *Decisiones ya tomadas* (título, estado, secciones, enlace).
3. Corre los comandos 2 a 5 de *Verificación* y corrige cualquier primera persona o ancla rota que aparezca en cualquier sección del README.
4. Corre `bash pruebas/rapida.sh`.

## Criterios de aceptación
1. Rama `chore/F47-readme-para-cualquier-usuario` (comando 1).
2. Todo el README sin primera persona (comando 2).
3. Los enlaces internos `(#...)` apuntan a encabezados que existen (comando 3).
4. Ninguna mención de Don Financio, Andes ni «Corte duro» (comando 4).
5. `bash pruebas/rapida.sh` termina en 0 (comando 5).

## Verificación
```
git branch --show-current
grep -nEiw 'mi|mis|yo|tengo|mío|mía|apruebo|PC de trabajo' README.md; echo "grep:$?"
grep -o '](#[^)]*)' README.md | sort -u
grep -c 'Don Financio\|Andes\|Corte duro' README.md
bash pruebas/rapida.sh | tail -3
```
Esperado: la rama `chore/F47-readme-para-cualquier-usuario`; solo `grep:1`; la lista de anclas, cada una con su encabezado en `README.md` (en minúsculas, espacios como guiones); `0`; la última línea empieza por `rapida:` y no hay línea `FALLA`.

## Evidencia

Segunda pasada completa de *Verificación* (la primera se hizo antes de corregir dos líneas fuera de Contexto, ver Notas).

```
$ git branch --show-current
chore/F47-readme-para-cualquier-usuario
exit 0
```

```
$ grep -nEiw 'mi|mis|yo|tengo|mío|mía|apruebo|PC de trabajo' README.md; echo "grep:$?"
grep:1
exit 0
```

```
$ grep -o '](#[^)]*)' README.md | sort -u
](#flujo-y-modo-yolo)
](#higiene-de-contexto-y-compactación)
](#instalación)
exit 0
```

Encabezados que existen para esas anclas (`grep -nE '^#{1,6} (Flujo y modo yolo|Higiene de contexto y compactación|Instalación)' README.md`): `123:## Instalación`, `222:## Flujo y modo yolo`, `228:## Higiene de contexto y compactación`.

```
$ grep -c 'Don Financio\|Andes\|Corte duro' README.md
0
exit 1
```

(`grep -c` sale 1 cuando no hay coincidencias; el conteo es 0, como se esperaba.)

```
$ bash pruebas/rapida.sh | tail -3
ℹ todo 0
ℹ duration_ms 50681.247458
rapida: 64 archivos en 51 s (tope 90 s)
exit 0
```

(Salida de `rapida.sh` completa en la misma pasada: sin líneas que empiecen por `FALLA` ni `✖`; 0 coincidencias de `^(FALLA|✖)`. Las líneas `✔ ... FALLA ...` de la suite son nombres de pruebas de control negativo que pasan.)

## Notas
- Aviso de desajuste: el rango `README.md@1-65` de *Contexto* coincidió con el contenido (la línea 64 es «Detalle del flujo…»); no hubo desplazamiento.
- Hueco menor 1: las líneas 176 («lo leo antes de correrlo») y 196 («no la edito») están fuera de la portada, pero tenían primera persona. Según el paso 3, se corrigieron a «léelo antes de correrlo» y «no se edita».
- Hueco menor 2: la primera pasada de *Verificación* pasó antes de esas dos correcciones; se repitió la pasada completa tras corregirlas (intentos=2). Ambas líneas siguen fuera del rango de la portada, así que se revisó el README entero como pide la tarea.
- Coincidencia de la tarea: `## Flujo` del README ahora apunta a `#flujo-y-modo-yolo`, y la frase «Corte duro» y los nombres de proyectos se eliminaron.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=2; resultado=lista; causa=ninguna
