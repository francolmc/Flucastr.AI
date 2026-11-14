# Auditoría general: por qué la verificación es lenta en DonFinancio, Byteria y DASH (2026-11-13)

Base: `verify`, Dockerfiles y `AGENTS.md` de los tres proyectos registrados en el kit (`~/.flucastr-ai/manifiesto.txt`), logs de Codex del 12 y 13-nov, `cambios/auditoria-tests-donfinancio/hallazgo.md` y búsqueda web (pnpm, Depot, Docker, guías de Playwright). Solo lectura; no corrí ningún `verify`.

## Hechos (comprobados)
| | DonFinancio | Byteria | DASH |
| --- | --- | --- | --- |
| Dockerfiles | 3 | 6 | 7 |
| Manifiestos antes de instalar | **No** (`COPY . .` antes de `pnpm install`) | Sí (`npm ci`) | Sí (en API y Backoffice) |
| Caché de paquetes (`--mount=type=cache`) | No | No | No |
| `Comprobación rápida` (Nivel 1) en `AGENTS.md` | No | No | No |
| Aceptación sin caché | `./verify` | `up --build` | `--no-cache` salvo `VERIFY_RAPIDO=1` |
| Tiempos por fase impresos | No | No | No |
| Diagnóstico al fallar, antes de limpiar | No (`down -v`) | No (`down --rmi`) | No (`down -v`) |

1. **El Nivel 1 existe en la regla 13 de `planificar-cambio` desde `niveles-verificacion`, pero ningún proyecto lo adoptó.** Ese plan dejó «declarar la línea» como trabajo aparte por proyecto y nunca se hizo. Todo cambio, por chico que sea, pasa por Docker.
2. **Ningún proyecto cachea los paquetes entre builds.** Con la red a ~21 KiB/s, cada instalación en frío cuesta de 2 a 10 min (medido en DonFinancio: `production-deps` 5 a 10 min, `browser` 1 a 8 min).
3. **Solo DonFinancio tiene el defecto estructural** (copiar todo antes de instalar). Byteria y DASH ya copian los manifiestos primero, así que su caché de capas funciona; les falta la caché de paquetes.
4. **Ningún `verify` guarda evidencia de un fallo.** Todos limpian (`down -v` o `down --rmi`) antes de que alguien pueda mirar. Por eso la causa del `P1017` de DonFinancio y de los `unhealthy` de Byteria quedó indeterminada.
5. **Los agentes iteran con el comando de aceptación.** DonFinancio hizo 6 corridas completas sin caché solo en la sesión de F10, de ~20 min cada una; el Nivel 3 debía correr una vez.
6. **Corridas de Docker de proyectos distintos se intercalan** (17:44–17:56Z y 22:27–23:51Z del 13-nov), y en esas franjas aparecen los cierres de PostgreSQL y los `unhealthy`. Correlación, no causa probada.

## Qué hacen otros (búsqueda web)
- pnpm y Depot: copiar solo el lockfile, `pnpm fetch` y `pnpm install` con `--mount=type=cache`; la capa se rehace solo si cambia el lockfile.
- Guías de Playwright con Docker: mismo compose en local y CI, `docker compose up --no-build`, healthchecks en vez de esperas, imagen de Playwright fijada.
- Compose `watch`: sincroniza código sin reconstruir imágenes en desarrollo.
- Nada que respalde o descarte la hipótesis de memoria; solo consejos genéricos de `.wslconfig`.
- Fuentes: https://pnpm.io/docker, https://depot.dev/docs/container-builds/optimal-dockerfiles/node-pnpm-dockerfile.md, https://oneuptime.com/blog/post/2026-02-08-how-to-use-docker-for-end-to-end-testing-environments/view, https://www.docker.com/blog/docker-compose-experiment-sync-files-and-automatically-rebuild-services-with-watch-mode/

## Causa raíz (inferencia)
El kit fija **niveles** y **reglas**, pero no tiene forma de **comprobar** que un proyecto las cumple. Cada proyecto deriva por su cuenta, y solo se descubre al medir sesiones de 12 horas. Parchear proyecto por proyecto no escala.

## Solución general propuesta
1. **Un auditor de solo lectura** (`scripts/auditar-verificacion.mjs <proyecto>`) que revise, sin Docker, lo que esta tabla revisó a mano: Nivel 1 declarado, orden manifiestos/instalación, caché de paquetes, tiempos por fase, diagnóstico al fallar, comando de iteración. Salida: tabla con ERROR/AVISO por proyecto.
2. **Una convención en `preparar-proyecto`** (el «perfil de verificación rápida»): Nivel 1 obligatorio, patrón de Dockerfile con caché, `verify` que imprime tiempos y guarda diagnóstico al fallar.
3. **Un plan por proyecto, generado desde el informe del auditor**, no escrito a mano. DonFinancio primero (es el único con el defecto estructural).

## Lo que no verifiqué
- Si la caché de paquetes sobrevive a `--no-cache` (el plan de DonFinancio lo mide).
- Si la receta de pnpm aplica a Byteria (npm, WASI) y DASH (pnpm 9, React Native): el auditor lo dirá por proyecto, no lo supongo.
- La causa real de los cierres de PostgreSQL.
