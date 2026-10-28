# Flucastr.AI — proyecto existente

> Estado: **borrador** (2026-10-28). Pendiente de aprobación de Franco.

## Qué hace

**Hoy** (confirmado, leído en `README.md`, `agentes/`, `skills/`, `scripts/`): es un kit mínimo para trabajar con agentes de IA en proyectos propios (Don Financio, Andes y otros). Contiene:

- Un agente, `arquitecto`, que razona y define proyectos sin escribir código (`agentes/arquitecto.md`).
- Cuatro skills que el agente carga por paso: `definir-proyecto`, `revisar-proyecto-existente`, `disenar-arquitectura`, `generar-clonar`.
- `modelos.json`: fuente única de modelos. Los agentes declaran un **nivel** (alto, medio, bajo) y el perfil de cada herramienta lo traduce a un modelo.
- `scripts/resolver.mjs`: resuelve el modelo y genera los archivos por herramienta.
- `instalar.sh` / `desinstalar.sh`: instalan y quitan exactamente lo instalado, con manifiesto.

**Objetivo declarado por Franco** (confirmado, en esta conversación): construir las herramientas necesarias, en una primera instancia para **Claude Code** y **Pi agent**, que ayuden a desarrollar productos **básicos, medios y robustos**.

Reglas vigentes (`README.md`): producto primero; una tarea, un archivo; Franco hace los commits; los secretos no se tocan; nada nuevo sin dolor real; corte duro de 2–3 días sin algo funcionando.

## Cómo se ejecuta

- Instalar: `bash instalar.sh` (`--simular`, `--solo claude|pi`, `--proyecto <ruta>`). Requiere `node` y `bash` (leído en `instalar.sh`).
- Usar: `claude --agent arquitecto` o `pi-arquitecto`, desde la carpeta del proyecto (`README.md`).
- Si se cambia `modelos.json`, se vuelve a correr `instalar.sh`.
- Herramientas presentes en esta máquina: `node` (fnm), `pi` (`~/.local/bin/pi`), `claude` (`/opt/homebrew/bin/claude`) — de `which`.

## Cómo se prueba

**No hay pruebas** (no hay carpeta de tests ni CI; inventario de archivos). La única verificación disponible es `bash instalar.sh --simular`.

## Cómo se despliega

No se despliega: se instala en local con `instalar.sh`. No hay remoto ni CI (`git remote -v` vacío; sin carpetas de workflows).

## Dependencias externas

- Claude Code (`~/.claude/`) y Pi (`~/.pi/agent/`, variable `PI_CODING_AGENT_DIR`).
- Paquete de subagentes de Pi, que lee `~/.pi/agent/agents/` (según comentario en `instalar.sh`; **no verificado**).
- Proveedores de modelos: Anthropic (`claude-code`) y OpenAI (`pi-openai`) en `modelos.json`.
- Node para `resolver.mjs`.

## Inconsistencias detectadas

1. `agentes/arquitecto.md` dice que usa nivel **alto**; `modelos.json` le asigna **medio**. Franco indicó no cambiar el modelo: queda como observación, sin tocar nada (la frase del agente es solo texto y puede quedar desactualizada).
2. `README.md` menciona una carpeta `tareas/` que aún no existe (el propio README dice que se crea con la primera tarea).
3. `README.md` y `modelos.json` modificados sin commit; el resto del kit sin versionar.

## Respuestas de Franco (confirmado, conversación 2026-10-28)

| Tema | Respuesta |
|---|---|
| Tamaños de producto | **Básico**: un repo, framework fullstack. **Medio**: una API y un front. **Avanzado/robusto**: más componentes. |
| Dolor principal | No lograr **features terminadas**: se itera sin llegar a nada entregado. |
| Herramientas | Deben servir **por igual** para cualquier agente (Claude Code y Pi). |
| Modelos | **No se cambia el modelo del arquitecto**: el usuario maneja los modelos desde `modelos.json`. |
| Remoto | **Sí, se publicará** en remoto. URL aún no definida. |
| Historia | Esto se trata como **nuevo, desde cero**: ya hubo 4 versiones anteriores (`project-flow`, `project-lite`, kit v1, etc.) y **ninguna logró entregar nada**. |
| Primera herramienta | **Enfoque A** elegido, pero **aparcado**: Franco pidió ir por etapas. Ver `diseno-primera-herramienta.md`. |
| Etapa actual | **Cerrar que el agente `arquitecto` funciona bien.** Criterio de aceptación: la especificación original de Franco. Ver `plan-pruebas-arquitecto.md`. |
| Especificación original del arquitecto | «Agente principal que razona (proposal, explorar) y define el proyecto; define estructura (repos o uno solo) y arquitectura (diagrama). Si el proyecto existe: revisa todo, obtiene contexto, lista repos, pregunta si falta información, genera arquitectura (diagrama) y lista de repos, más un script para clonar el proyecto completo.» |

## Preguntas abiertas

1. ¿Cuál de los enfoques para la primera herramienta eliges? (propuesta en la conversación; ver `arquitectura.md`, «Observaciones»).
2. ¿Cuál es la URL del remoto y su visibilidad (público o privado)? Sin ella no se puede generar `clonar.sh`.
3. ¿Qué proyecto real (Don Financio o Andes) se usa como primer caso de prueba?
4. ¿Qué entiende Franco por «feature terminada»? (criterio observable; se propone uno en la conversación).

## Estado

Borrador.
