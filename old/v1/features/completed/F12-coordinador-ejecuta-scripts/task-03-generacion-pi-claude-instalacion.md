# task-03 — Generación del `coordinador` en Pi y Claude Code, e instalación
repo: Flucastr.AI   depende_de: task-02   estado: hecha

## Descripción
Tras task-02 el `tools:` del `coordinador` lleva tres patrones `Bash(...)`. Para Claude Code el agente generado debe conservarlos tal cual. Para Pi, Franco eligió la opción B (§3.1.1): `bash` completo sin restricción técnica; el agente generado para Pi debe declararlo de forma explícita (`Bash` sin patrones) en vez de arrastrar patrones que Pi no puede hacer cumplir y que darían una falsa sensación de contención. La tarea ajusta el generador y deja pruebas sin modelo de que ambas salidas son las esperadas y de que la instalación en entorno aislado las produce.

## Contexto
- Repo: este, único. Node 25, Bash.
- A leer y tocar: `scripts/resolver.mjs` (las órdenes `agente-claude` y `agente-pi` comparten el bloque de las líneas ~98–114: leen `partir(archivo)` y escriben `---\n${cabecera}\nmodel: …`; hoy `agente-pi` no toca `tools:`), `pruebas/comprobaciones/modelos-agentes.test.mjs` (3 pruebas: instalación aislada; patrón útil para la nueva), archivo nuevo `pruebas/comprobaciones/resolver-agentes.test.mjs`.
- A leer sin tocar: `instalar.sh` (el bucle de las líneas ~98–109 valida cada `agentes/*.md` con ambas órdenes; los lanzadores Pi `pi-<agente>` usan solo el cuerpo, con `--append-system-prompt`, así que las herramientas del `coordinador` en Pi son las del propio Pi), `agentes/coordinador.md` (front matter tras task-02).
- Lo que Pi hace con `tools:` del agente generado para el paquete de subagentes: no ejecutado, inferido (los nombres de herramienta del front matter ya son los de Claude Code, p. ej. `Read, Grep`).
- Estado actual: `node --test pruebas/comprobaciones/modelos-agentes.test.mjs` → 3 pruebas, 0 fallos.

## Decisiones ya tomadas
- `agente-pi` reemplaza, dentro de `tools:`, cada entrada `Bash(...)` por una sola entrada `Bash` (sin duplicar si ya hay `Bash`). Solo toca esa línea; el resto del encabezado queda igual.
- `agente-claude` no cambia: conserva los patrones.
- No se modifica `instalar.sh` ni `desinstalar.sh`; si el paso 1 muestra que la instalación aislada ya produce lo esperado, `instalar.sh` queda intacto.
- La contención en Pi sigue siendo solo instruccional (se documenta en task-07), no se añade ningún mecanismo técnico.

## Alcance / Fuera de alcance
Alcance: `scripts/resolver.mjs` (orden `agente-pi`) y pruebas sin modelo.
Fuera de alcance: herramienta propia sin shell para Pi (opción C descartada); `permissions.allow/deny`; cambios en `instalar.sh`; documentación (task-07); pruebas con modelo (task-05, task-06); commit.

## Pasos
1. Ejecutar `node scripts/resolver.mjs agente-pi agentes/coordinador.md | sed -n 1,8p` y `node scripts/resolver.mjs agente-claude agentes/coordinador.md | sed -n 1,8p`; anotar en *Notas* ambas líneas `tools:` (confirma el estado de partida).
2. `scripts/resolver.mjs`: en la rama `agente-pi`, transformar la línea `tools:` de la cabecera según *Decisiones* antes de escribirla.
3. Crear `pruebas/comprobaciones/resolver-agentes.test.mjs` con pruebas sobre un agente temporal (front matter con `name`, `tools: Read, Bash(node a.mjs), Bash(node b.mjs F*), Skill`): `agente-pi` produce `tools: Read, Bash, Skill`; `agente-claude` conserva los dos patrones; un agente sin `Bash` queda idéntico en ambas salidas salvo la línea `model:`; los demás agentes reales (`arquitecto`, `planificador`, `constructor`) dan salida idéntica antes y después en `agente-pi` (comparar contra `agente-claude`, que no cambia).
4. En la misma prueba nueva, instalar de verdad con `bash instalar.sh` en un `HOME` temporal (copiando `instalar.sh`, `desinstalar.sh`, `scripts`, `agentes`, `skills` y `modelos.json`, y creando `HOME/.claude` y `PI_CODING_AGENT_DIR`, como la función `instalacionAislada` de `modelos-agentes.test.mjs`) y comprobar que `HOME/.claude/agents/coordinador.md` conserva los tres `Bash(...)` y `PI_CODING_AGENT_DIR/agents/coordinador.md` tiene `Bash` sin patrones.
5. Correr la verificación y pegar la salida en *Evidencia*.

## Criterios de aceptación
1. La salida de `agente-pi` para `coordinador` tiene `Bash` sin patrones y conserva `Agent(...)`, `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Skill`. Se comprueba con la prueba y el comando de *Verificación*.
2. La salida de `agente-claude` conserva los tres patrones. Se comprueba con la prueba.
3. Los otros tres agentes no cambian en ninguna salida. Se comprueba con la prueba.
4. La instalación aislada deja el agente de Claude Code con patrones y el de Pi con `Bash` completo. Se comprueba con la prueba del paso 4.

## Verificación
```
cd /Users/franco/Codes/flucastr/Flucastr.AI
node --test pruebas/comprobaciones/resolver-agentes.test.mjs pruebas/comprobaciones/modelos-agentes.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
node scripts/resolver.mjs agente-pi agentes/coordinador.md | grep "^tools:"
node scripts/resolver.mjs agente-claude agentes/coordinador.md | grep "^tools:"
git status --short scripts pruebas instalar.sh
```
Salida esperada: `fail 0` y `tests` ≥ 7; la línea de Pi contiene `Bash,` o `Bash` y ningún `Bash(`; la de Claude contiene los tres `Bash(node scripts/…)`; ` M scripts/resolver.mjs` y `?? pruebas/comprobaciones/resolver-agentes.test.mjs` (más lo ya modificado por tareas anteriores); `instalar.sh` sin cambios.

## Evidencia

Paso 1 (estado de partida, antes del cambio):
```
$ node scripts/resolver.mjs agente-pi agentes/coordinador.md | sed -n 1,8p
---
name: coordinador
...
tools: Agent(arquitecto, planificador, constructor), Read, Grep, Glob, Write, Edit, Skill, Bash(node scripts/registrar.mjs), Bash(node scripts/archivar.mjs), Bash(node scripts/archivar.mjs --aplicar F*)
model: openai/gpt-6.1-sol
...
$ node scripts/resolver.mjs agente-claude agentes/coordinador.md | sed -n 1,8p
...
tools: Agent(arquitecto, planificador, constructor), Read, Grep, Glob, Write, Edit, Skill, Bash(node scripts/registrar.mjs), Bash(node scripts/archivar.mjs), Bash(node scripts/archivar.mjs --aplicar F*)
model: claude-sonnet-5-5
...
```

Verificación (salida real, tras el cambio):
```
$ cd /Users/franco/Codes/flucastr/Flucastr.AI
$ node --test pruebas/comprobaciones/resolver-agentes.test.mjs pruebas/comprobaciones/modelos-agentes.test.mjs 2>&1 | grep -E "^ℹ (tests|pass|fail)"
ℹ tests 10
ℹ pass 10
ℹ fail 0
$ node scripts/resolver.mjs agente-pi agentes/coordinador.md | grep "^tools:"
tools: Agent(arquitecto, planificador, constructor), Read, Grep, Glob, Write, Edit, Skill, Bash
$ node scripts/resolver.mjs agente-claude agentes/coordinador.md | grep "^tools:"
tools: Agent(arquitecto, planificador, constructor), Read, Grep, Glob, Write, Edit, Skill, Bash(node scripts/registrar.mjs), Bash(node scripts/archivar.mjs), Bash(node scripts/archivar.mjs --aplicar F*)
$ git status --short scripts pruebas instalar.sh
 M scripts/resolver.mjs
?? pruebas/comprobaciones/resolver-agentes.test.mjs
```

Criterios:
1. Pi para `coordinador`: `Bash` sin patrones y conserva `Agent(...)`, `Read`, `Grep`, `Glob`, `Write`, `Edit`, `Skill`. Cumple (prueba 4 y salida de Pi arriba).
2. Claude Code conserva los tres patrones. Cumple (prueba 5 y salida de Claude arriba).
3. `arquitecto`, `planificador`, `constructor` sin cambio en ninguna salida. Cumple (prueba 6; el `model:` se excluye de la comparación porque difiere por herramienta).
4. Instalación aislada: Claude con patrones, Pi con `Bash` completo. Cumple (prueba 7). `instalar.sh` sin cambios (no aparece en `git status`).

Pruebas: `resolver-agentes.test.mjs` tiene 7 pruebas (1 a 7); `modelos-agentes.test.mjs` tiene 3 previas; total 10, 0 fallos.

## Notas
Antes del cambio, el `tools:` de Pi ya era igual al de Claude (paso 1), como se esperaba.

Huecos menores y decisión:
- Criterio 3 pide comparar con `agente-claude`, pero el `model:` difiere por herramienta. Decisión: la prueba compara ambas salidas quitando la línea `model:`.
- La prueba 3 (agente sin Bash) también excluye `model:` por el mismo motivo.
- `bashPlano` colapsa solo las entradas `Bash`/`Bash(...)`: si hay más de una, deja la primera. Otras entradas se mantienen tal cual.
- La función `instalacionAislada` se repite en `resolver-agentes.test.mjs` porque `modelos-agentes.test.mjs` no la exporta. No se tocó ese archivo.

Registro: n=1; herramienta=claude-code; modo=normal; intentos=2; verificacion=pasa; huecos=4; resultado=lista; causa=ninguna
