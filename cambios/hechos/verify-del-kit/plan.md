---
estado: hecho
rama: feature/kit-v2
---
# verify del kit

## Objetivo
Un `./verify` en la raíz que prueba, sin Docker y sin escribir fuera del repo, que la v2 del kit (agentes, skills, modelos, instalador, resolver) está coherente. Sirve para Franco y para el constructor como definición de «hecho».

## Alcance
Puede crear/editar: `verify` (nuevo, ejecutable), `AGENTS.md` (solo la línea del comando), este plan (pasos, Evidencia, Notas).
Puede leer: `agentes/`, `skills/`, `modelos.json`, `instalar.sh`, `desinstalar.sh`, `scripts/resolver.mjs`.
Fuera de alcance: `legacy/`, `definitions/`, `features/`, `pruebas/` (incluido `pruebas/rapida.sh`, que es de v1), el resto de `scripts/`. No se commitea, no se crea otra rama. Tras la prueba negativa el árbol debe quedar igual que antes (salvo `verify`, AGENTS.md y el plan).

## Decisiones ya tomadas
- Rama: se queda en `feature/kit-v2`; no crear otra.
- Bash con `set -euo pipefail`; JSON y frontmatter se leen con `node` (ya es requisito del kit por el resolver). Sin `jq`.
- Cada escalón imprime `== N. <título> ==`; el primer fallo imprime `FALLO: <causa>` a stderr y sale con 1 (no sigue). Al final `VERIFY OK`.
- Los agentes esperados son los `agentes/*.md`. Comparar contra las claves de `agentes` en `modelos.json` en ambos sentidos (el resolver NO falla si falta la entrada: cae al nivel por defecto, por eso hay que comprobarlo aparte).
- El escalón 3 usa `node scripts/resolver.mjs agente-claude|agente-pi agentes/<x>.md` y `modelo <x> claude-code|pi`, salida a variable (nunca a disco ni a `~`).
- El escalón 5 corre `bash instalar.sh --simular`; esa opción no escribe nada. Aun así `verify` comprueba que el número de archivos bajo `~/.claude` y `~/.pi` no cambió (si existen), y falla si cambió.
- No se toca `.env` ni credenciales.

## Escenarios
- CUANDO todo está bien ENTONCES `./verify` imprime los 5 encabezados y `VERIFY OK`, código 0.
- CUANDO existe `agentes/x.md` sin entrada en `modelos.json` (o al revés) ENTONCES falla en el escalón 1, código ≠ 0, sin llegar al 2.
- CUANDO `modelos.json` no es JSON válido ENTONCES falla en el escalón 1.
- CUANDO `instalar.sh` o `desinstalar.sh` tiene error de sintaxis ENTONCES falla en el escalón 2.
- CUANDO el archivo generado (Claude o Pi) no trae `model: <modelo esperado>` o la línea `Herramienta: <Claude Code|Pi> | Modelo: <modelo> | Agente: <nombre>` ENTONCES falla en el escalón 3.
- CUANDO a una skill le falta `SKILL.md`, `name` o `description` en el frontmatter (o `name` ≠ nombre de la carpeta) ENTONCES falla en el escalón 4.
- CUANDO `instalar.sh --simular` sale con código ≠ 0 ENTONCES falla en el escalón 5.

## Verificación
`./verify` — debe terminar en `VERIFY OK` con código 0 desde cero, y la prueba negativa (último paso) debe mostrar que falla.

## Pasos
- [x] Crear `verify` (`#!/usr/bin/env bash`, `chmod +x`). Ir a la raíz del repo con `cd "$(dirname "$0")"`. Comprobar que `node` existe.
- [x] Escalón 1: `modelos.json` parsea con node; el conjunto de claves de `agentes` es igual al de nombres `agentes/*.md` (sin `.md`). Reportar cuáles sobran y cuáles faltan.
- [x] Escalón 2: `bash -n instalar.sh` y `bash -n desinstalar.sh`.
- [x] Escalón 3: por cada agente y por cada herramienta (claude-code → `agente-claude`, `Claude Code`; pi → `agente-pi`, `Pi`): el resolver termina bien y la salida contiene la línea `model: <modelo>` y la línea de identidad exacta, con `<modelo>` tomado de `resolver.mjs modelo`.
- [x] Escalón 4: por cada carpeta de `skills/`: existe `SKILL.md`, frontmatter con `name` (igual a la carpeta) y `description` no vacía.
- [x] Escalón 5: `bash instalar.sh --simular >/dev/null` sale 0 y no cambió el conteo de archivos bajo `~/.claude` y `~/.pi`.
- [x] Imprimir `VERIFY OK` al final. Correr `./verify` y pegar la salida en Evidencia.
- [x] Prueba negativa A: `cp agentes/constructor.md agentes/zz-prueba.md`, correr `./verify`, confirmar que falla en el escalón 1 con código ≠ 0, `rm agentes/zz-prueba.md`. Pegar salida y código.
- [x] Prueba negativa B: copiar `skills/ejecutar-plan/SKILL.md` a un respaldo fuera del repo, quitarle la línea `description:`, correr `./verify`, confirmar que falla en el escalón 4 con código ≠ 0, restaurar el archivo desde el respaldo y comprobar que `git status --short` es igual que antes. Pegar salida y código.
- [x] Confirmar que tras las pruebas `git status --short` no muestra nada nuevo (ni `agentes/zz-prueba.md`), volver a correr `./verify` (`VERIFY OK`) y añadir a `AGENTS.md`, bajo «Cómo funciona (v2)», la línea: `- Comando \`verify\`: \`./verify\` (modelos.json ↔ agentes, sintaxis de instalar/desinstalar, resolver Claude/Pi, skills, \`instalar.sh --simular\`).`

## Evidencia
$ ./verify
```
== 1. modelos.json parsea y agentes coinciden ==
agentes: constructor, principal
== 2. sintaxis de instalar.sh y desinstalar.sh ==
ok instalar.sh
ok desinstalar.sh
== 3. resolver Claude Code y Pi por agente ==
ok constructor Claude Code claude-haiku-5-5
ok constructor Pi openai/gpt-6-luna
ok principal Claude Code claude-sonnet-5-5
ok principal Pi openai/gpt-6.1-sol
== 4. skills con SKILL.md, name y description ==
ok ejecutar-plan
ok planificar-cambio
ok preparar-proyecto
== 5. instalar.sh --simular sale 0 y no escribe ==
ok archivos bajo ~/.claude y ~/.pi: 46126
VERIFY OK
exit 0
```

$ cp agentes/constructor.md agentes/zz-prueba.md && ./verify   (prueba negativa A)
```
== 1. modelos.json parsea y agentes coinciden ==
FALLO: agentes sin correspondencia. En modelos.json sin archivo: -; archivo sin entrada en modelos.json: zz-prueba
exit 1
```
(después: `rm agentes/zz-prueba.md`)

$ quitar `description:` de skills/ejecutar-plan/SKILL.md (copia en respaldo fuera del repo), ./verify   (prueba negativa B)
```
== 1. modelos.json parsea y agentes coinciden ==
agentes: constructor, principal
== 2. sintaxis de instalar.sh y desinstalar.sh ==
ok instalar.sh
ok desinstalar.sh
== 3. resolver Claude Code y Pi por agente ==
ok constructor Claude Code claude-haiku-5-5
ok constructor Pi openai/gpt-6-luna
ok principal Claude Code claude-sonnet-5-5
ok principal Pi openai/gpt-6.1-sol
== 4. skills con SKILL.md, name y description ==
FALLO: skills/ejecutar-plan/SKILL.md: falta description o está vacía
exit 1
```
(restaurado desde el respaldo; `cmp` idéntico; `git status --short` igual que antes de la prueba)

$ git status --short   (tras las pruebas)
```
 M AGENTS.md
 M instalar.sh
R  agentes/arquitecto.md -> legacy/v1/agentes/arquitecto.md
R  agentes/constructor.md -> legacy/v1/agentes/constructor.md
R  agentes/coordinador.md -> legacy/v1/agentes/coordinador.md
R  agentes/planificador.md -> legacy/v1/agentes/planificador.md
R  skills/comandos-coordinador/SKILL.md -> legacy/v1/skills/comandos-coordinador/SKILL.md
R  skills/control-consumo/SKILL.md -> legacy/v1/skills/control-consumo/SKILL.md
R  skills/crear-backlog/SKILL.md -> legacy/v1/skills/crear-backlog/SKILL.md
R  skills/definir-proyecto/SKILL.md -> legacy/v1/skills/definir-proyecto/SKILL.md
R  skills/descomponer-feature/SKILL.md -> legacy/v1/skills/descomponer-feature/SKILL.md
R  skills/disenar-arquitectura/SKILL.md -> legacy/v1/skills/disenar-arquitectura/SKILL.md
R  skills/ejecutar-tarea/SKILL.md -> legacy/v1/skills/ejecutar-tarea/SKILL.md
R  skills/generar-clonar/SKILL.md -> legacy/v1/skills/generar-clonar/SKILL.md
R  skills/lectura-extra/SKILL.md -> legacy/v1/skills/lectura-extra/SKILL.md
R  skills/modo-yolo/SKILL.md -> legacy/v1/skills/modo-yolo/SKILL.md
R  skills/ramas-feature/SKILL.md -> legacy/v1/skills/ramas-feature/SKILL.md
R  skills/revisar-proyecto-existente/SKILL.md -> legacy/v1/skills/revisar-proyecto-existente/SKILL.md
 M modelos.json
?? agentes/
?? cambios/
?? skills/
?? verify
```

## Notas
- `verify` se creó con `chmod +x`, `set -euo pipefail` y `cd "$(dirname "$0")"`. Cada escalón imprime `== N. <título> ==`; el primer fallo imprime `FALLO: ...` a stderr y sale con 1.
- Escalón 3: se compara `model: <modelo>` y la línea `Herramienta: <Claude Code|Pi> | Modelo: <modelo> | Agente: <nombre>` con `<modelo>` de `resolver.mjs modelo`.
- Escalón 5: el conteo de archivos bajo `~/.claude` y `~/.pi` (los que existan) es el de la especificación; no detecta reescrituras que no cambien el número de archivos. Se dejó así porque el plan lo pedía.
- `AGENTS.md`: solo se añadió la línea del comando, bajo «Cómo funciona (v2)».
- No se hizo commit ni se creó rama; sigue en `feature/kit-v2`.

Contexto verificado por el principal (2026-11-05): `node scripts/resolver.mjs agente-claude|agente-pi agentes/constructor.md` ya imprime `model:` y `Herramienta: Claude Code | Modelo: claude-haiku-5-5 | Agente: constructor` (Pi: `Herramienta: Pi | Modelo: openai/gpt-6-luna | ...`); `bash instalar.sh --simular` sale 0 y no cambia archivos; `bash -n` de ambos scripts pasa; node v25.
