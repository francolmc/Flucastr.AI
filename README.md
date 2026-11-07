# Flucastr.AI

Kit personal de agentes y skills para trabajar con IA en Claude Code y Pi. Versión 2.

## Qué es

Dos agentes y dos puertas humanas:

- **`principal`** (nivel medio): entiende lo que Franco quiere, investiga, diagnostica, escribe el plan y verifica el resultado.
- **`constructor`** (nivel bajo): aplica el plan aprobado, corre `verify` y deja la evidencia.
- **Puerta 1**: Franco aprueba `cambios/<nombre>/plan.md` antes de construir.
- **Puerta 2**: Franco revisa la evidencia antes de dar algo por hecho.

El único traspaso entre agentes es `cambios/<nombre>/plan.md`. Los niveles se traducen a modelos en `modelos.json`.

«Hecho» significa que `./verify` pasa desde cero.

## Skills

- `planificar-cambio`: escribe el plan de un cambio.
- `ejecutar-plan`: aplica un plan aprobado.
- `preparar-proyecto`: deja un proyecto listo (`AGENTS.md` y `verify`).

## Instalación

```bash
bash instalar.sh              # instala en Claude Code y Pi
bash instalar.sh --simular    # muestra lo que haría, sin escribir nada
bash instalar.sh --proyecto <ruta>   # además fija el agente y las reglas deny en un proyecto
```

Opciones útiles: `--copiar` (copia las skills en vez de enlazarlas), `--solo claude|pi`, `--skills-proyecto`.

Para ver todas las opciones, restricciones y ejemplos: `bash instalar.sh --help`.

Para desinstalar: `bash desinstalar.sh`.

## Verificación

```bash
./verify
```

Comprueba que `modelos.json` coincide con los agentes, que la sintaxis de instalar y desinstalar es válida, que los modelos se resuelven para Claude y Pi, que las skills están completas, que `instalar.sh --simular` no escribe nada y que las reglas deny del proyecto están bien.

## Ejecutar un plan en ventana propia

Un plan pesado (muchos pasos, builds, Compose) puede correrse en una ventana propia del constructor, para ver el avance en vivo:

```bash
claude-constructor   # Claude Code (con el esfuerzo de modelos.json)
pi-constructor       # Pi (con el esfuerzo de modelos.json)
```

Los lanzadores `claude-<agente>` y `pi-<agente>` los crea `instalar.sh`. Abrir el agente a mano (`claude --agent constructor`, `pi --agent constructor` o eligiéndolo dentro de Pi) no aplica el esfuerzo de `modelos.json`: ese valor solo vale cuando el principal lanza al constructor como subagente o cuando usas el lanzador.

Primer mensaje: `Plan: <ruta>` y `Rama: <rama>` (por ejemplo `Plan: cambios/mi-cambio/plan.md`, `Rama: feature/mi-cambio`). Es el mismo plan, el mismo agente y el mismo retorno que al delegar desde el principal; solo cambia que se ve en vivo.

## Plazos en Pi (opcional)

El agente `constructor` declara `timeoutMs: 3600000` (60 min); Pi lo respeta (probado: con 60 s el subagente se corta; con 3 600 000 completa) y Claude Code lo ignora. Sin él, Pi corta a los 30 minutos. Para que Pi avise antes de cortar, `~/.pi/agent/extensions/subagent/config.json` admite `checkpointBeforeDeadlineMs` (solo corridas asíncronas de un agente); el kit no instala ni edita ese archivo. Para iterar rápido, `VERIFY_RAPIDO=1 ./verify` construye con caché; la corrida final va sin la variable.

## Estructura

- `agentes/`: definiciones de `principal` y `constructor`.
- `skills/`: las tres skills.
- `scripts/resolver.mjs`: resuelve modelos y ajustes para las herramientas.
- `cambios/`: un directorio por cambio, con su `plan.md`.
- `modelos.json`: nivel de cada agente y su modelo en Claude y Pi.

## La v1

La versión 1 está en `old/v1/` y también en el tag `kit-v1`. No se ejecuta ni se mantiene. Se borra cuando la v2 se haya usado en 2 o 3 proyectos reales.
