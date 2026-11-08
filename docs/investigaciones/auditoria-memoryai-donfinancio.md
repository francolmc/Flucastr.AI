# Auditoría: «el constructor es lento y se traba» (Memory-AI y DonFinancio)

Fecha: 2026-11-08. Solo lectura. Fuentes: sesiones de Codex de hoy (`~/.codex/sessions/2026/11/08/`, 10 sesiones de esos dos proyectos), `meta.json` de 184 ejecuciones del constructor en Pi (`~/.pi/agent/sessions/--…Memory-AI--/subagent-artifacts/`, 40 desde el 5-nov) y los planes en `cambios/` de ambos proyectos. No se leyeron las trazas completas ni se compararon modelos.

## Conclusión

El tiempo perdido de hoy **no es lentitud del modelo: son esperas de aprobación de permisos**. En Codex, el constructor corre como subagente; cuando pide salir del sandbox, la solicitud queda esperando y el principal solo muestra «waiting for agents». Es una hipótesis firme sobre hoy; para Pi hay un patrón distinto (ver abajo).

## Evidencia: Codex, hoy

- Sandbox `workspace-write`, aprobación `on-request`. 67 comandos pidieron `sandbox_permissions: require_escalated`.
- Espera medida entre pedir el permiso y recibir salida: **182 min en total**. Una sola sesión (`16-11-08`) acumula 95 min; sus pausas más largas son 23, 36 y 31 min, todas sobre `./verify` pedido con «¿Permites…?».
- Comandos que más escalaron: `VERIFY_RAPIDO=1 ./verify` (13), `npm test` (9), `git fetch` (7), `./verify` (7), `npm run …` (5), `docker ps` (5), `git switch` (4), `docker run` (3), `git status` (3), `docker info` (3).
- Los permisos son del recorrido normal de un plan (verify, tests, Docker, git de lectura), no excepciones.

## Evidencia: Pi, 5 al 7 de noviembre

- F09 (DonFinancio): PAUSA 1/7 tras 15,6 min; PAUSA 1/7; PAUSA 2/8; luego **timeout de 30 min** (43 turnos, 0,267 USD). Terminó ejecutándolo el principal.
- `verify` (Memory-AI): dos PAUSA por «acceso» con 0/12 (base limpia y Docker) y después una corrida de 30 min con 83 turnos que sí completó. Es el patrón de Andes: permisos del constructor incompatibles con lo que el plan le exige comprobar.
- Entre las 40 ejecuciones desde el 5-nov (casi todas de la v1, por tarea), 11 terminan en BLOQUEO o CONFIRMAR; varias por entorno (Node ausente, rama inexistente, `express` sin resolver) y no por código. No las revisé una a una.

## Qué no se pudo concluir

- Cuánto de los 182 min fue Franco ausente y cuánto una solicitud que no vio (el rollout no distingue).
- Si el modelo (`gpt-6-luna`) rinde menos: no hay comparación controlada. En Pi, 30 min de timeout con 43 turnos sugiere trabajo lento, pero también espera de Docker.

## Opciones (decide Franco)

1. **Reglas `allow` de Codex en el proyecto** para lo recurrente y de bajo riesgo: `./verify`, `npm test`, `npm run`, `git fetch`, `git status`, `git diff`, `docker ps`, `docker info`. Las instala `instalar.sh --proyecto` junto a las `forbidden` (igual que se hizo con `git switch -c`). Docker `run` queda fuera por riesgo.
2. **Ventana propia para el constructor** (`codex-constructor`): las solicitudes se ven y se contestan en vivo. Sin cambios de código.
3. **Aprobación `never` con sandbox más ancho** solo en esa ventana: menos esperas, pero quita la barrera; no se recomienda.
