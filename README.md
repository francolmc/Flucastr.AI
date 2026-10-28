# Flucastr.AI

Mi forma de construir productos con agentes de IA, sin enredarme en la herramienta.

> Estado: reinicio (2026-10-28). Este repo nace casi vacío a propósito.

## Para qué existe

Para producir funcionalidad real en mis proyectos (Don Financio, Andes y otros) trabajando con agentes de IA, sin quedar de mensajero entre sesiones y sin que armar la herramienta consuma la jornada.

## Reglas del reinicio

1. **Producto primero.** Lo primero que se construye es algo que me sirva, no una herramienta.
2. **Una tarea, un archivo.** Cada trabajo se describe en un archivo de tarea; yo lo apruebo antes de que se escriba código.
3. **Yo hago el commit.** Los agentes no hacen commit, push, PR, merge ni despliegue.
4. **Los secretos no se tocan.** Nadie lee ni imprime `.env`, llaves ni credenciales.
5. **Nada nuevo sin dolor real.** Una herramienta, regla o automatización se agrega solo cuando su ausencia ya me costó tiempo.
6. **Corte duro.** Si en 2 o 3 días no hay algo funcionando, paro y reviso qué me frena.

## Estructura

```
Flucastr.AI/
├── README.md        # este archivo
├── modelos.json     # niveles y modelos por herramienta; los agentes declaran nivel, no modelo
├── agentes/         # un archivo por agente
│   └── arquitecto.md   # agente principal: razona, define proyecto, estructura y arquitectura
├── skills/          # procedimientos que los agentes cargan solo cuando los necesitan
│   ├── definir-proyecto/
│   ├── revisar-proyecto-existente/
│   ├── disenar-arquitectura/
│   └── generar-clonar/
├── scripts/
│   └── resolver.mjs    # resuelve el modelo de cada agente y genera los archivos por herramienta
├── instalar.sh      # instala agentes y skills en Claude Code y Pi
├── desinstalar.sh   # quita exactamente lo que instaló
└── tareas/          # una tarea por archivo (se crea con la primera)
```

## Instalación

```bash
bash instalar.sh --simular   # muestra qué haría, sin escribir nada
bash instalar.sh             # instala (Claude Code y Pi, los que encuentre)
bash desinstalar.sh          # quita lo instalado

# Dejar al arquitecto como agente predeterminado de un proyecto (cada sesión ahí arranca con él):
bash instalar.sh --proyecto /ruta/al/proyecto

# Quitar solo ese ajuste de un proyecto, sin desinstalar lo demás:
bash desinstalar.sh --proyecto /ruta/al/proyecto
```

- Las skills se **enlazan** desde `skills/`; el agente de Claude Code se **genera** con el `model` tomado de `modelos.json`; para Pi se genera el agente en `~/.pi/agent/agents/` (lo lee el paquete de subagentes) y un lanzador `pi-<agente>` para abrir una sesión completa con él.
- Nunca pisa archivos que ya existan: los omite y lo avisa.
- Si cambias `modelos.json`, vuelve a correr `bash instalar.sh` (el lanzador de Pi lo lee en vivo; el agente de Claude Code no).
- `--proyecto` escribe `{"agent": "arquitecto"}` en `<proyecto>/.claude/settings.local.json` (ajustes personales, normalmente fuera de git). No pisa un agente que el proyecto ya tenga definido, y `desinstalar.sh` lo deshace (todo junto, o solo el de un proyecto con `--proyecto`).
- Uso: `claude --agent arquitecto` o `pi-arquitecto`, desde la carpeta del proyecto.

## Primera tarea

Por definir. Se elige una sola cosa concreta que quede funcionando primero.

## Archivo y rescate

El trabajo anterior (`project-flow`, `project-lite`, kit v1) vive en `claude-skills-personal` y no se toca. Si algo sirve, se rescata aquí cuando haga falta, no antes.

## Bitácora

- 2026-10-28: reinicio del proyecto y nombre `Flucastr.AI`. Se crean `modelos.json`, el primer agente (`arquitecto`), sus cuatro skills y el instalador/desinstalador.
