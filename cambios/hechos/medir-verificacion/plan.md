---
estado: listo
rama: feature/medir-verificacion
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Observador de Docker: medir la verificación de todos los proyectos sin tocarlos

## Objetivo
Un observador que, mientras corre, registre builds, eventos y memoria de Docker de **cualquier proyecto y stack**, y un informe que muestre dónde se va el tiempo, quién se solapa con quién y qué cayó por memoria. Sin cambiar ningún `verify`. Evidencia previa: `docs/investigaciones/auditoria-verificacion-general/` (hallazgo, propuesta y `builds-2026-11-13.jsonl`).

## Supuestos
- Es solo lectura sobre Docker; no limpia, no frena ni cambia nada. Si Franco quiere además imponer límites, es el paso siguiente.
- Docker no emite eventos de pasos de build; las duraciones de build salen de `docker buildx history`, que conserva pocas corridas (50 en 6 h el 13-nov). Por eso el observador las copia a disco cada pocos minutos.
- El nombre del proyecto sale de la etiqueta `com.docker.compose.project` (p. ej. `f09-<pid>-…`, `byteria-universo-verify-<pid>`, `verify_dash_<pid>`); no distingue la sesión de agente.
- Datos locales en `~/.flucastr-ai/observador/`; nada sale del equipo.

## Alcance
Puede cambiar: `scripts/observar.mjs` (nuevo), `scripts/fixtures-observador/` (muestras y un `docker` falso para pruebas), `README.md` (una viñeta) y `verify` (bloque nuevo 8r).
Fuera: los proyectos, `instalar.sh`, agentes, skills, `modelos.json`.

## Decisiones ya tomadas
- Ejecutor: constructor, porque los cuatro sí de la prueba: formatos y salida definidos, fixtures propios, sin credenciales ni producción.
- Comandos: `node scripts/observar.mjs start | stop | status | informe [--desde <fecha>]`. `start` deja un proceso en segundo plano con archivo de PID y no duplica si ya corre.
- Qué guarda `start` (JSON Lines, una carpeta por día no hace falta; un archivo por tipo):
  - `eventos.jsonl`: `docker events --format '{{json .}}'` con filtro de eventos `oom`, `die`, `health_status`, `create`, `destroy`.
  - `muestras.jsonl`: cada 5 s, `docker stats --no-stream --format '{{json .}}'` y `free -m`.
  - `builds.jsonl`: cada 5 min, `docker buildx history ls --format json`, sin duplicar por `ref`.
  - `diagnosticos/<id>.txt`: al ver `health_status: unhealthy`, `oom` o `die` con código distinto de 0 y 143, el `docker logs --tail 80` y `docker inspect` de ese contenedor.
- Informe: por nombre de build (n, mediana, máximo, % de pasos en caché); por proyecto Compose (inicio, fin, pico de memoria por contenedor); eventos `oom`/`unhealthy`; y los pares de proyectos distintos con actividad solapada, con los minutos de solape.
- Fuente de verdad de los tiempos de build: la del propio Docker; no se parsean logs de agentes.

## Escenarios
- CUANDO se corre `informe` sobre las muestras de `fixtures-observador/` ENTONCES muestra los números esperados (A1).
- CUANDO una muestra trae un `oom` ENTONCES el informe lo lista con su contenedor y proyecto (A2).
- CUANDO dos proyectos tienen ventanas solapadas ENTONCES el informe las reporta con los minutos (A3).
- CUANDO se corre `start` con el `docker` falso ENTONCES crea los archivos y `stop` termina el proceso (A4).
- CUANDO se corre el kit ENTONCES los bloques existentes pasan (A5).

## Aceptación
| ID | Resultado observable | Comprobación | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Estadísticas por build | `node scripts/observar.mjs informe --datos scripts/fixtures-observador/datos` | mediana, máximo y % de caché iguales a los de un cálculo manual documentado en el fixture |
| A2 | Detecta `oom` | mismo informe | línea `OOM` con contenedor y proyecto del fixture |
| A3 | Detecta solapes | mismo informe | un par de proyectos con minutos de solape > 0 |
| A4 | Ciclo de vida | `PATH` con el `docker` falso; `start`, esperar 3 s, `status`, `stop` | archivos creados; tras `stop`, el PID ya no existe |
| A5 | Nada se rompe | `./verify` | exit 0 con `ok 8r` |

## Verificación
`./verify` — offline, sin Docker real; debe terminar en exit 0.

## Pasos
- [x] Crea `scripts/fixtures-observador/datos/` con `eventos.jsonl`, `muestras.jsonl` y `builds.jsonl` mínimos: dos proyectos Compose solapados, un `oom` y 6 builds con duraciones conocidas; documenta en un `LEEME.txt` los resultados que debe dar el informe (A1, A2, A3)
  - evidencia: `scripts/fixtures-observador/datos/eventos.jsonl`, `muestras.jsonl`, `builds.jsonl` (validados línea a línea con JSON.parse, exit 0) y `LEEME.txt` con la salida esperada; A1 a A3 se comprueban en el paso 3
- [x] Crea `scripts/fixtures-observador/bin/docker`, un script que imite `docker events`, `stats` y `buildx history ls` con salida fija y termina solo (A4)
  - evidencia: `scripts/fixtures-observador/bin/docker` (ejecutable); con ese PATH, `docker events`, `docker stats --no-stream` y `docker buildx history ls --format json` imprimen y terminan con exit 0
- [x] Crea `scripts/observar.mjs` con `informe`, sin dependencias, leyendo los tres archivos y calculando lo de *Decisiones* (A1, A2, A3)
  - evidencia: `scripts/observar.mjs`; `node scripts/observar.mjs informe --datos scripts/fixtures-observador/datos` da exit 0 y su salida coincide línea a línea con la de `LEEME.txt` (diff vacío): medianas 150 s y 50 s, máximos 200 s y 60 s, caché 60% y 75%, OOM de byteria-2-db-1, solape de 5 min
- [x] Añade `start`, `stop` y `status` al mismo script, con PID, muestreo, copia de `buildx history` y captura de diagnósticos (A4)
  - evidencia: `scripts/observar.mjs`; con el docker falso, `start` arranca (pid N), `status` dice «corriendo» tras 3 s, un segundo `start` dice «ya corre», `stop` dice «parado (pid N)» y `kill -0 N` falla; quedan `eventos.jsonl` (7 líneas), `muestras.jsonl` (3), `builds.jsonl` (6) y `diagnosticos/bydb.txt`
- [x] En `verify`, bloque 8r: corre `informe` sobre el fixture y compara con `LEEME.txt`; corre el ciclo `start`/`status`/`stop` con el `docker` falso; una copia del fixture sin el `oom` no debe mostrar la línea `OOM` (A1–A4)
  - evidencia: `verify`, bloque `# 8r.` (antes de `VERIFY OK`); en `./verify` salen las líneas `ok 8r A1-A3`, `ok 8r negativa` y `ok 8r A4`
- [x] En `README.md`, una viñeta: cómo arrancar el observador y leer el informe (A5)
  - evidencia: `README.md`, viñeta «Observador de Docker» dentro de «## Verificación»
- [x] Corre `./verify` y pega la cola en *Evidencia* (A5)
  - evidencia: `./verify` exit 0 con `ok 8r` (cola en *Evidencia*)

## Evidencia
$ ./verify
a revisor que intenta escribir con sandbox read-only: la escritura se rechaza y aprueba
ok A3b revisor que escribe aunque el sandbox sea read-only: el árbol cambió, parcial
ok A3c DEVUELTO una vez: vuelve al constructor con los defectos y aprueba
ok A3d DEVUELTO siempre: cupo de 2 agotado, parcial sin más corridas
ok A5a revisor que devuelve texto no JSON: parcial sin aprobar
ok A5b APROBADO con defectos: viola el esquema, parcial
ok A5c veredicto con clave extra: viola el esquema, parcial
ok C1 mapeo codex: constructor en workspace-write, revisor en read-only con esquema, modelo del agente
ok C2 tope de tiempo: el constructor que no termina se corta, parcial sin relanzar
ok A6 el constructor ve aprobado al arrancar en las 3 corridas
ok uso: plan en curso se rechaza sin cambiarlo
ok V2 revisor con nivel bajo: Luna low; el constructor no cambia
ok V3 sin kit_run el revisor usa el modelo y esfuerzo del principal
ok V4 nivel inválido en kit_run.revisor: exit 2 y plan intacto
ok V5 la nota del plan lleva revisor=<modelo>:<esfuerzo>
kit-run: 17 casos pasaron
ok 13: pruebas de kit run pasaron con los CLIs simulados
== 8r. observador de Docker: informe sobre el fixture, ciclo con docker falso y copia sin oom ==
ok 8r A1-A3: el informe del fixture coincide con LEEME.txt (medianas, máximos, caché, OOM, solape y pico)
ok 8r negativa: la copia sin oom no muestra OOM
ok 8r A4: start, status, segundo start sin duplicar y stop; archivos creados y el PID ya no existe
VERIFY OK
exit 0

## Notas
- El formato de `docker buildx history ls --format json` se tomó del Docker real de esta máquina (`cached_steps`, `completed_at`, `completed_steps`, `created_at`, `name`, `ref`, `status`, `total_steps`); el fixture usa esa misma forma.
- Añadí `FLUCASTR_OBSERVADOR_DIR` para cambiar la carpeta de datos (por defecto `~/.flucastr-ai/observador/`); la usan las pruebas y no está en el plan.
- Builds sin `completed_at` real (`0001-01-01`) o repetidas por `ref` no se registran en `start` ni cuentan en `informe`. Los proyectos se listan y se cruzan en orden de inicio.
- `stop` manda SIGTERM, espera hasta 5 s y luego SIGKILL. Si `docker events` termina, el observador se reconecta a los 30 s. `--correr` es el modo interno que usa `start`.
- Corrección dentro de alcance: el primer informe ordenaba los solapes por nombre y no por inicio; se corrigió antes de la verificación final.
- La prueba A4 usa el `docker` falso; el observador no se probó con cargas reales de Docker, que es el siguiente paso de medición.
