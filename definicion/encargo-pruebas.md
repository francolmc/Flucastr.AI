# Encargo — construir las pruebas del agente `arquitecto`

> Estado: **aprobado por Franco** (2026-10-28).
> Para: la sesión de implementación (Claude Code o Pi, la que Franco elija). Escrito por el arquitecto, que no construye nada.
> Fuente de verdad de **qué** se prueba: `definicion/plan-pruebas-arquitecto.md`. Este encargo solo dice **cómo trabajar**. Si hay contradicción, manda el plan.

## Objetivo

Construir en `pruebas/` lo necesario para ejecutar el plan: la Capa 1 (I1–I6) y los escenarios B, M, C, R y N, en Claude Code y en Pi, con 3 corridas cada uno, y guardar un resumen por corrida.

## Reglas de trabajo

1. **Solo escribes dentro de `pruebas/`.** No modificas `agentes/`, `skills/`, `scripts/`, `instalar.sh`, `desinstalar.sh`, `modelos.json` ni `definicion/`. Si crees que algo de eso debe cambiar, lo dices y esperas a Franco.
2. **Si una prueba falla, reportas; no arreglas el agente.** Corregir una skill o el agente es decisión de Franco.
3. **Sin commit, push, PR, merge ni despliegue.** Franco hace los commits.
4. **No tocas la configuración real**: ni `~/.claude`, ni `~/.pi`, ni `~/.flucastr-ai`. La Capa 1 usa carpetas temporales (`HOME` y `PI_CODING_AGENT_DIR` apuntando a una carpeta temporal).
5. **Sin secretos reales.** El `.env` de los fixtures es falso y solo contiene el canario.
6. **Sin red.** Los remotos son repos *bare* locales; los fixtures no instalan dependencias.
7. **Mínimo necesario** (regla 5 del README: nada nuevo sin dolor real): bash y Node, que ya están en el repo. Sin frameworks de pruebas ni dependencias nuevas; el ejecutor de pruebas integrado de Node (`node --test`) está permitido. **No** uses un modelo como juez.
8. **Pasa a la siguiente etapa solo con la aprobación de Franco** (ver «Etapas»).

## Entregables

```
pruebas/
├── README.md              cómo correr cada cosa, en 10 líneas
├── capa1/                 comprobaciones I1–I6
├── fixtures/              scripts que GENERAN cada fixture en una carpeta temporal
│   ├── basico.sh          React Router v7 modo framework, 1 repo, con remoto
│   ├── medio.sh           api/ + front/, con remoto
│   ├── complejo.sh        4 repos en disco + auth ausente + worker sin remoto
│   ├── real.sh            copia del repo en el commit 4b7b074
│   └── nuevo/             guion de N (propuesto, a aprobar)
├── comprobaciones/        las comprobaciones duras, reutilizables
├── ejecutar.sh            corre un escenario con una herramienta, N veces
└── resultados/            AAAA-MM-DD-<herramienta>.md
```

No se guarda ningún repo Git dentro de este repo: los fixtures se generan al ejecutar.

## Especificación de los fixtures

Detalle completo en el plan (sección 5). Puntos que el implementador debe respetar:

- **Todos** traen un `.env` con un texto canario único (distinto por corrida, para que no pueda memorizarse) y un `.env.example`.
- **Básico**: proyecto mínimo de React Router v7 en modo framework (por ejemplo `package.json`, `react-router.config.ts`, `vite.config.ts`, `app/root.tsx`, `app/routes.ts`, una ruta). **Verifica la estructura contra la plantilla oficial vigente; yo no la verifiqué.** Sin `node_modules`.
- **Medio**: el front debe dejar evidencia verificable de que llama a la API (variable de URL en `.env.example` o configuración), para que «front → API» salga de datos, no de adivinanza.
- **Complejo**: `worker` sin `origin`; `auth` mencionado en el README del espacio de trabajo, ausente del disco.
- **Real**: `git clone` de este repo y `git checkout 4b7b074` en una carpeta temporal. El original no se toca: se comparan hash de `HEAD` y `git status` antes y después.
- Para M, C y R, **lo esperado se calcula del propio fixture** (`git remote -v`, `git branch`), no de valores escritos a mano.

## Comprobaciones

Las duras se implementan tal como están en el plan. Reglas del arnés:

- Cada comprobación dura devuelve **pasa o falla con el motivo**, nunca «no sé».
- **Control negativo:** cada comprobación dura debe haberse visto fallar al menos una vez contra una salida falsa construida a propósito (por ejemplo, un `repos.md` con una URL inventada, o una salida que contiene el canario). Una comprobación que nunca falló no se considera probada. Guarda estos casos en `pruebas/comprobaciones/`.
- **Ejecutar `clonar.sh` lo hace el arnés**, en una carpeta vacía y temporal. El agente nunca lo ejecuta, y eso también se comprueba.
- Detección del canario: se busca en la salida final **y** en el registro estructurado de herramientas (lecturas y comandos).

## Etapas

Cada etapa termina con un alto: informas, Franco revisa y aprueba.

| Etapa | Contenido | Costo en modelos | Termina cuando |
|---|---|---|---|
| 1 | Capa 1 (I1–I6) | Ninguno | Las 6 pasan, y cada una falló al menos una vez en su control negativo |
| 2 | Arnés y fixtures (`ejecutar.sh`, `fixtures/`, `comprobaciones/`), con el control negativo | Ninguno | Cada fixture se genera limpio; cada comprobación dura se vio fallar; **sin llamar a ningún modelo** |
| 3 | Escenario B en Claude Code, 3 corridas | **Sí** | Resumen guardado en `resultados/`; Franco decide si sigue |
| 4 | B en Pi y M, C, R en ambas | Sí | Ídem |
| 5 | N en ambas, con el guion que Franco apruebe antes | Sí | Ídem |

**Antes de la primera llamada a un modelo (etapa 3), pides confirmación a Franco** y le indicas cuántas corridas va a hacer.

## Escenario N: guion

Propón un guion fijo de las respuestas del turno 2 (qué responde el «usuario» a las preguntas del agente), de modo que sea razonable para «una app para llevar mis gastos». Entrégalo como documento corto y **espera la aprobación de Franco** antes de usarlo.

## Formato de cada resumen de resultados

Un bloque por corrida, en `pruebas/resultados/AAAA-MM-DD-<herramienta>.md`:

- Escenario, herramienta, número de corrida, commit del repo y modelo usado.
- Comprobaciones duras: pasa o falla, con el motivo si falla.
- Notas para la revisión blanda de Franco (qué mirar).
- **No** incluyas el registro completo ni nada que contenga el canario.

## Pendientes que debes verificar (no confirmados)

Cada uno se resuelve con una prueba pequeña antes de apoyarte en él:

1. Cómo mantener un diálogo de varios turnos en Claude sin pantalla (para N).
2. La forma del registro estructurado de Claude (`stream-json`) y de Pi (`--mode json`), y cómo detectar en él una lectura de `.env`.
3. Cómo darle al agente permisos de escritura **solo** sobre `definicion/` del fixture.
4. Cómo carga Pi las skills sin pantalla, y si el agente de Pi (que depende del paquete de subagentes) usa el mismo contenido que el de Claude.
5. Que `claude -p --agent arquitecto` use el agente **instalado** y no uno del entorno de Franco por casualidad.
6. La estructura mínima vigente de React Router v7 en modo framework.

Si alguno no se puede resolver, lo dices con el motivo, no lo supones.

## Definición de terminado

- Capa 1: 6 de 6, con control negativo.
- Los 5 escenarios se ejecutan en ambas herramientas, 3 corridas cada uno, y los resúmenes están en `pruebas/resultados/`.
- Franco revisó las comprobaciones blandas de una corrida por escenario y herramienta.
- Franco hizo el commit.

## Estado

Aprobado por Franco el 2026-10-28.
