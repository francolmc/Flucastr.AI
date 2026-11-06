# task-03 — Documentación de mecanismos de caché en Claude Code y Pi
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Para los candidatos de task-02, se documenta qué mecanismo existe en Claude Code y en Pi para no recargar contexto al lanzar un subagente (caché de prompt del proveedor, contexto propio del subagente, memoria o `CLAUDE.md`, sesiones y `subagent-artifacts`). Cada afirmación lleva cita con enlace o ruta y fecha. Lo que no se pueda verificar queda marcado como *supuesto*. No cambia ninguna regla.

## Contexto
- Leer: `features/F43-auditoria-contexto/analisis.md`, `definitions/F43-AUDITORIA.md@25-8`
- Tocar: `features/F43-auditoria-contexto/mecanismos.md`
- Fuentes permitidas: documentación oficial de Anthropic (`https://docs.claude.com/en/docs/claude-code/sub-agents` y `https://docs.claude.com/en/docs/build-with-claude/prompt-caching`), de OpenAI (`https://platform.openai.com/docs/guides/prompt-caching`) y la documentación local de Pi en `/Users/franco/.pi/agent/install/releases/1.4.0/node_modules/@earendil-works/pi-coding-agent/docs` (*confirmado*: la carpeta existe; se consulta con `grep`, no se lee entera).
- Se baja cada página con `curl -sL <url>` a un archivo temporal fuera del repo y se busca con `grep -n`; no se pega la página entera.
- De `depende_de:` leer solo las *Notas* de task-02.
- Fuente: definitions/F43-AUDITORIA.md «3. Verificación de caché o resumen compartido»
- Requiere: red

## Decisiones ya tomadas
- `mecanismos.md` tiene `## Claude Code` y `## Pi`. Cada mecanismo es una viñeta: nombre, qué evita recargar, cita (enlace o ruta y fecha 2026-11-05 de consulta), y la etiqueta *confirmado* (hay cita textual corta) o *supuesto*.
- Responde, para cada herramienta, tres preguntas: ¿hay mecanismo compartido entre subagentes? ¿lo habilita un archivo del repo (`scripts/` o una skill) sin crecer prompts? ¿qué campos de caché trae el log (`input`, `cacheRead`, `cacheWrite`)?
- Cierra con `## Para la prueba`: qué mecanismo probará task-04 en cada herramienta (uno por herramienta) o «ninguno verificable».
- Si una página no se puede bajar, se anota «no consultada» con el motivo y se marca *supuesto*; no se inventa la cita.

## Decisiones abiertas
Ninguna.

## Alcance / Fuera de alcance
Alcance: `mecanismos.md`.
Fuera de alcance: correr Claude Code o Pi con modelo, implementar un caché o resumen, agentes, skills, topes, el commit.

## Pasos
1. Corre `git branch --show-current`.
2. Baja las tres páginas de documentación con `curl -sL` a archivos temporales y busca con `grep -n` los términos `cache`, `subagent`, `context`. Resultado: una lista de hallazgos con línea.
3. Busca los mismos términos en la carpeta local de docs de Pi con `grep -rn`.
4. Escribe `## Claude Code` y `## Pi` con las viñetas citadas.
5. Escribe `## Para la prueba` con un mecanismo por herramienta.
6. Corre la verificación y copia la salida en *Evidencia*.

## Criterios de aceptación
1. Rama `chore/F43-auditoria-contexto` (comando 1).
2. `mecanismos.md` tiene `## Claude Code`, `## Pi` y `## Para la prueba` (comando 2).
3. Toda viñeta de mecanismo lleva la etiqueta *confirmado* o *supuesto* (comando 3).
4. Cada sección cita al menos una fecha 2026-11-05 (comando 4).

## Verificación
```
git branch --show-current
grep -c '^## Claude Code\|^## Pi\|^## Para la prueba' features/F43-auditoria-contexto/mecanismos.md
grep -c '^- .*\(\*confirmado\*\|\*supuesto\*\)' features/F43-auditoria-contexto/mecanismos.md
grep -c '2026-11-05' features/F43-auditoria-contexto/mecanismos.md
```
Esperado: rama `chore/F43-auditoria-contexto`; `3`; un número ≥2; un número ≥2.

## Evidencia

Descargas (`curl -sL`, 2026-11-05, fuera del repo): cc-subagents.html 200 (989742 B); anth-caching.html 200 (3388911 B); oai-caching.html 200 (827347 B). Búsquedas con `grep -n` sobre texto extraído; detalle y citas en `features/F43-auditoria-contexto/mecanismos.md`.

```
$ git branch --show-current
chore/F43-auditoria-contexto
exit 0

$ grep -c '^## Claude Code\|^## Pi\|^## Para la prueba' features/F43-auditoria-contexto/mecanismos.md
3
exit 0

$ grep -c '^- .*\(\*confirmado\*\|\*supuesto\*\)' features/F43-auditoria-contexto/mecanismos.md
14
exit 0

$ grep -c '2026-11-05' features/F43-auditoria-contexto/mecanismos.md
16
exit 0
```

Criterios de aceptación: 1 (rama) cumple, salida `chore/F43-auditoria-contexto`. 2 (tres encabezados) cumple, `3`. 3 (cada viñeta con etiqueta) cumple: 14 líneas que empiezan por `- ` con *confirmado* o *supuesto*. 4 (fecha en cada sección) cumple: `## Claude Code`, `## Pi` y `## Para la prueba` citan 2026-11-05; el conteo total es 16.

## Notas

- Entorno: `node ~/.flucastr-ai/entorno.mjs` salió con `ok`. Rama: el encargo trae `Rama: chore/F43-auditoria-contexto`, existe y es la actual; no se ejecutó ningún `git switch`. Sin commit. Se usó el modo yolo que pidió Franco en el encargo.
- Huecos menores: (a) `subagent-artifacts` no aparece en las fuentes consultadas; queda como *supuesto* en CC y Pi. (b) La documentación local de Pi no describe subagentes; el mecanismo compartido entre subagentes de Pi queda como *supuesto*. (c) Los números de línea de Anthropic y OpenAI corresponden al texto extraído de las páginas, no a la página original; las citas textuales están en `mecanismos.md`. (d) «Para la prueba» no tenía fecha de consulta; añadí una frase de consulta 2026-11-05 para cumplir el criterio 4.
- Verificación: se corrió dos veces completa. La primera pasada dio 15 en el último conteo; tras añadir la fecha de «Para la prueba», la segunda dio 16. `scripts/validar-tarea.mjs` falló una vez por falta de bloque de código en *Evidencia*, que corregí sin cambiar los resultados.
Registro: n=1; herramienta=claude-code; modo=yolo; intentos=2; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
